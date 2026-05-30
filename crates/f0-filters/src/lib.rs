//! F0 control-rate DSP kernel for the layered-additive F0 renderer.
//!
//! This crate extracts the per-frame DSP loop of `renderLayeredF0`
//! (`src/track-assembler.ts`) into Rust→WASM. It is a BYTE-EXACT port: every
//! arithmetic operation mirrors the TypeScript reference, using `f64`
//! throughout (the TS code uses JS doubles / `Float64Array`, and the output is
//! golden-sensitive control-rate F0, so `f32` would drift).
//!
//! Config resolution (filter type, speaker scaling, clamps, speaker-param path
//! walks against loosely-typed YAML) stays in TypeScript and is marshalled into
//! this kernel as flat numeric inputs + typed arrays.
//!
//! Citations (carried from the TS reference):
//!   Fujisaki, H. "Information, Prosody, and Modeling" — command-response additive F0
//!   Klatt, D. (1982) "KLATTalk" — hat-pattern F0, 2-pole low-pass filter
//!   Rabiner, L. (1968) "Speech Synthesis by Rule" — three-component F0
//!   DECtalk 4.63 Ph_drwt02.c — speaker-dependent F0 scaling & impulse decay

use core::f64::consts::PI;

// Layer type tags (must match the TS marshalling).
const LAYER_PROFILE: i32 = 0;
const LAYER_PERSISTENT: i32 = 1;
const LAYER_IMPULSE: i32 = 2;
// A glide is a *ramped persistent*: on each command it ramps linearly from the
// current accumulated value toward (current + value) over `duration_frames`
// frames, then HOLDS the accumulated total (it does not decay). This mirrors
// DECtalk's GLIDE command (Ph_drwt02.c:1891-1892, :2161-2184): glide_inc =
// f0command/length accumulated per frame until the target is reached, after
// which glide_tot persists summed into f0in. Generic: the magnitude (value) and
// span (duration_frames) come from the declarative command data, no gesture
// constants here.
const LAYER_GLIDE: i32 = 3;

// Decay mode tags for impulse layers.
const DECAY_HALVING: i32 = 0;
const DECAY_LINEAR: i32 = 1;
const DECAY_EXPONENTIAL: i32 = 2;

/// 2-pole Butterworth coefficients via bilinear transform.
/// Mirrors `computeButterworth2Coefficients` in track-assembler.ts.
/// Returns (b0, b1, b2, a1, a2).
pub fn compute_butterworth2_coefficients(cutoff_hz: f64, sample_rate: f64) -> (f64, f64, f64, f64, f64) {
    let wc = ((PI * cutoff_hz) / sample_rate).tan();
    let wc2 = wc * wc;
    let sqrt2 = core::f64::consts::SQRT_2;
    let k = 1.0 / (1.0 + sqrt2 * wc + wc2);
    let b0 = wc2 * k;
    let b1 = 2.0 * wc2 * k;
    let b2 = wc2 * k;
    let a1 = 2.0 * (wc2 - 1.0) * k;
    let a2 = (1.0 - sqrt2 * wc + wc2) * k;
    (b0, b1, b2, a1, a2)
}

#[derive(Clone, Copy)]
struct IIRFilterCoefficients {
    b0: f64,
    b1: f64,
    b2: f64,
    a1: f64,
    a2: f64,
}

#[derive(Clone, Copy, Default)]
struct IIRFilterState {
    x1: f64,
    x2: f64,
    y1: f64,
    y2: f64,
}

/// One sample through the 2-pole IIR filter; mutates state in place.
/// Mirrors `iirFilter2Pole`.
fn iir_filter_2pole(input: f64, state: &mut IIRFilterState, coeffs: &IIRFilterCoefficients) -> f64 {
    let output = coeffs.b0 * input + coeffs.b1 * state.x1 + coeffs.b2 * state.x2
        - coeffs.a1 * state.y1
        - coeffs.a2 * state.y2;
    state.x2 = state.x1;
    state.x1 = input;
    state.y2 = state.y1;
    state.y1 = output;
    output
}

/// One sample through a 1-pole low-pass filter; mutates state in place.
/// Mirrors `onePoleLowpass` (alpha clamped to [0,1]).
fn one_pole_lowpass(input: f64, y: &mut f64, alpha: f64) -> f64 {
    let clamped_alpha = alpha.max(0.0).min(1.0);
    *y += clamped_alpha * (input - *y);
    *y
}

/// Piecewise-linear interpolation over equidistant control points in [0,1].
/// Mirrors `interpolateProfile`.
pub fn interpolate_profile(points: &[f64], normalized_position: f64) -> f64 {
    if points.is_empty() {
        return 0.0;
    }
    if points.len() == 1 {
        return points[0];
    }
    let t = normalized_position.max(0.0).min(1.0);
    let max_idx = points.len() - 1;
    let float_idx = t * (max_idx as f64);
    let low_idx = float_idx.floor() as usize;
    let high_idx = (low_idx + 1).min(max_idx);
    if low_idx == high_idx {
        return points[low_idx];
    }
    let frac = float_idx - (low_idx as f64);
    points[low_idx] + frac * (points[high_idx] - points[low_idx])
}

/// A single active impulse (mirrors the TS `ActiveImpulse` object).
struct ActiveImpulse {
    value: f64,
    decay: f64,
    remaining_frames: f64,
}

/// A single in-progress glide ramp (mirrors the TS `ActiveGlide` object).
/// Each frame while `remaining_frames > 0`, `inc` is added to the layer's held
/// `glide_tot`; once the ramp completes the accumulated total persists (no
/// decay). Mirrors DECtalk Ph_drwt02.c GLIDE (glide_inc = f0command/length,
/// glide_tot += glide_inc per frame until target, then held).
struct ActiveGlide {
    inc: f64,
    remaining_frames: f64,
}

/// Per-layer descriptor (decoded from the flat marshalled arrays).
struct LayerDesc {
    layer_type: i32,
    decay_mode: i32,
    initial_decay_divisor: f64,
    termination_threshold: f64,
    exponential_factor: f64,
    cmd_start: usize,
    cmd_count: usize,
}

/// Per-command record (decoded from the flat marshalled arrays).
struct CmdDesc {
    time: f64,
    value: f64,
    duration_frames: f64,
    profile_start: usize,
    profile_count: usize,
}

#[allow(clippy::too_many_arguments)]
struct RenderInputs<'a> {
    frame_period: f64,
    total_duration: f64,
    num_frames: usize,
    uses_one_pole: bool,
    one_pole_alpha: f64,
    coeffs: IIRFilterCoefficients,
    has_scale: bool,
    f0_minimum: f64,
    f0_scale_factor: f64,
    f0_reference: f64,
    scale_divisor: f64,
    scale_output: f64,
    base_f0_bias_hz: f64,
    min_hz: f64,
    max_hz: f64,
    init_total: f64,
    layers: &'a [LayerDesc],
    cmds: &'a [CmdDesc],
    profile_points: &'a [f64],
}

/// The core per-frame F0 render loop. Writes `num_frames` f64 values into `out`.
/// Mirrors lines 818–935 of track-assembler.ts exactly.
fn render(inp: &RenderInputs, out: &mut [f64]) {
    let mut filter_state = IIRFilterState::default();
    let mut one_pole_y = 0.0f64;

    // Pre-fill filter state to avoid startup transient (init_total computed in TS
    // — it is exact: persistent cmd.value sums + profile point[0]).
    if inp.init_total != 0.0 {
        if inp.uses_one_pole {
            one_pole_y = inp.init_total;
        } else {
            filter_state.y1 = inp.init_total;
            filter_state.y2 = inp.init_total;
            filter_state.x1 = inp.init_total;
            filter_state.x2 = inp.init_total;
        }
    }

    // Per-layer mutable state.
    let n_layers = inp.layers.len();
    let mut persistent_levels = vec![0.0f64; n_layers];
    let mut active_impulses: Vec<Vec<ActiveImpulse>> = (0..n_layers).map(|_| Vec::new()).collect();
    // Glide layers: a held accumulated total per layer, plus the set of ramps
    // still in progress. The held total is what the layer contributes each frame
    // (a ramped persistent that holds after the ramp completes).
    let mut glide_totals = vec![0.0f64; n_layers];
    let mut active_glides: Vec<Vec<ActiveGlide>> = (0..n_layers).map(|_| Vec::new()).collect();
    // profile_data: index into profile_points + count for the currently active profile.
    let mut profile_active: Vec<Option<(usize, usize)>> = vec![None; n_layers];
    let mut command_cursors = vec![0usize; n_layers];

    let frame_period = inp.frame_period;

    for frame in 0..inp.num_frames {
        let time = (frame as f64) * frame_period;

        // Process pending commands for each layer up to current time.
        for li in 0..n_layers {
            let layer = &inp.layers[li];
            let mut cursor = command_cursors[li];
            while cursor < layer.cmd_count {
                let cmd = &inp.cmds[layer.cmd_start + cursor];
                if cmd.time <= time + frame_period * 0.5 {
                    match layer.layer_type {
                        LAYER_PERSISTENT => {
                            persistent_levels[li] += cmd.value;
                        }
                        LAYER_IMPULSE => {
                            active_impulses[li].push(ActiveImpulse {
                                value: cmd.value,
                                decay: cmd.value / layer.initial_decay_divisor,
                                remaining_frames: cmd.duration_frames,
                            });
                        }
                        LAYER_PROFILE => {
                            if cmd.profile_count > 0 {
                                profile_active[li] = Some((cmd.profile_start, cmd.profile_count));
                            }
                        }
                        LAYER_GLIDE => {
                            // Linear ramp of `value` over `duration_frames`. A
                            // non-positive span is a degenerate (instantaneous)
                            // ramp: apply the whole delta to the held total now
                            // (behaves like a persistent STEP), no in-progress
                            // ramp added.
                            if cmd.duration_frames > 0.0 {
                                active_glides[li].push(ActiveGlide {
                                    inc: cmd.value / cmd.duration_frames,
                                    remaining_frames: cmd.duration_frames,
                                });
                            } else {
                                glide_totals[li] += cmd.value;
                            }
                        }
                        _ => {}
                    }
                    cursor += 1;
                } else {
                    break;
                }
            }
            command_cursors[li] = cursor;
        }

        // Sum all layers (layer order preserved from TS Object.keys order).
        let mut total = 0.0f64;
        for li in 0..n_layers {
            let layer = &inp.layers[li];
            match layer.layer_type {
                LAYER_PROFILE => {
                    if let Some((start, count)) = profile_active[li] {
                        if count > 0 {
                            let normalized_pos = if inp.total_duration > 0.0 {
                                time / inp.total_duration
                            } else {
                                0.0
                            };
                            let pts = &inp.profile_points[start..start + count];
                            total += interpolate_profile(pts, normalized_pos);
                        }
                    }
                }
                LAYER_PERSISTENT => {
                    total += persistent_levels[li];
                }
                LAYER_IMPULSE => {
                    for imp in &active_impulses[li] {
                        total += imp.value;
                    }
                }
                LAYER_GLIDE => {
                    total += glide_totals[li];
                }
                _ => {}
            }
        }

        // Apply IIR low-pass filter.
        let filtered = if inp.uses_one_pole {
            one_pole_lowpass(total, &mut one_pole_y, inp.one_pole_alpha)
        } else {
            iir_filter_2pole(total, &mut filter_state, &inp.coeffs)
        };

        // Speaker scaling (DECtalk Ph_drwt02.c) or pass-through.
        let mut f0_hz = if inp.has_scale {
            let v = (inp.f0_minimum
                + (filtered - inp.f0_reference) * inp.f0_scale_factor / inp.scale_divisor)
                * inp.scale_output;
            v + inp.base_f0_bias_hz
        } else {
            filtered
        };
        f0_hz = inp.min_hz.max(inp.max_hz.min(f0_hz));
        out[frame] = f0_hz;

        // Advance impulse decay for all impulse layers.
        for li in 0..n_layers {
            let layer = &inp.layers[li];
            if layer.layer_type != LAYER_IMPULSE {
                continue;
            }
            let termination_threshold = layer.termination_threshold;
            let exponential_factor = layer.exponential_factor;
            let impulses = &mut active_impulses[li];
            // Iterate from end to front, removing terminated impulses (mirrors
            // the TS `for i = len-1; i>=0; i--` + splice loop).
            let mut i = impulses.len();
            while i > 0 {
                i -= 1;
                impulses[i].remaining_frames -= 1.0;
                if impulses[i].remaining_frames <= 0.0
                    || impulses[i].value.abs() < termination_threshold
                {
                    impulses.remove(i);
                    continue;
                }
                match layer.decay_mode {
                    DECAY_HALVING => {
                        impulses[i].value -= impulses[i].decay;
                        impulses[i].decay /= 2.0;
                    }
                    DECAY_LINEAR => {
                        impulses[i].value -= impulses[i].decay;
                    }
                    DECAY_EXPONENTIAL => {
                        impulses[i].value *= exponential_factor;
                    }
                    _ => {}
                }
            }
        }

        // Advance glide ramps for all glide layers. Each in-progress ramp adds
        // `inc` to the layer's held total for `remaining_frames` frames, then is
        // removed (the accumulated total persists). Advancing AFTER the frame is
        // emitted means a glide command activated at frame F contributes 0 on
        // frame F and reaches its full delta after `duration_frames` frames —
        // a smooth linear movement, not an instantaneous jump.
        for li in 0..n_layers {
            if inp.layers[li].layer_type != LAYER_GLIDE {
                continue;
            }
            let glides = &mut active_glides[li];
            let mut i = glides.len();
            while i > 0 {
                i -= 1;
                glide_totals[li] += glides[i].inc;
                glides[i].remaining_frames -= 1.0;
                if glides[i].remaining_frames <= 0.0 {
                    glides.remove(i);
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// FFI surface
// ---------------------------------------------------------------------------
//
// The TS side marshals everything into flat f64 buffers (allocated via
// alloc_f64 / freed via dealloc_f64) and one i32 buffer for the integer layer
// descriptors. To keep a single typed buffer, we encode layer descriptors as
// f64 too (all values are small exact integers or already-f64).
//
// Layout (all f64 buffers; pointers are byte addresses into wasm memory):
//
//   scalars[0..]: a fixed-length header of scalar inputs (see indices below).
//   layers[]:     n_layers * LAYER_STRIDE f64 entries.
//   cmds[]:       n_cmds * CMD_STRIDE f64 entries.
//   profiles[]:   pooled profile point values.
//   out[]:        num_frames f64 outputs (caller-allocated, read back).

const LAYER_STRIDE: usize = 7;
// [layer_type, decay_mode, initial_decay_divisor, termination_threshold,
//  exponential_factor, cmd_start, cmd_count]

const CMD_STRIDE: usize = 5;
// [time, value, duration_frames, profile_start, profile_count]

// render_f0 status codes (returned to the TS caller).
/// Rendering completed successfully.
pub const RENDER_OK: i32 = 0;
/// scalars pointer null or header too short.
pub const RENDER_ERR_SCALARS: i32 = -1;
/// out pointer null.
pub const RENDER_ERR_OUT: i32 = -2;
/// A nonzero count had a null pointer, or a stride multiplication overflowed.
pub const RENDER_ERR_BUFFER: i32 = -3;
/// A layer's cmd_start/cmd_count range falls outside the commands buffer.
pub const RENDER_ERR_CMD_RANGE: i32 = -4;
/// A command's profile_start/profile_count range falls outside the pool.
pub const RENDER_ERR_PROFILE_RANGE: i32 = -5;

/// Render the layered F0 contour.
///
/// Returns a status code (`RENDER_OK` on success, a negative `RENDER_ERR_*`
/// code on malformed input). On any error code the output buffer is left
/// untouched and no slicing/indexing of the descriptor buffers is performed,
/// so malformed descriptors can never panic (and thus never trap in wasm).
///
/// # Safety
/// All pointers must reference valid f64 buffers of the indicated lengths,
/// allocated in this module's linear memory.
#[no_mangle]
#[allow(clippy::missing_safety_doc)]
pub unsafe extern "C" fn render_f0(
    scalars_ptr: *const f64,
    scalars_len: usize,
    layers_ptr: *const f64,
    n_layers: usize,
    cmds_ptr: *const f64,
    n_cmds: usize,
    profiles_ptr: *const f64,
    n_profiles: usize,
    out_ptr: *mut f64,
    num_frames: usize,
) -> i32 {
    if scalars_ptr.is_null() || scalars_len < 18 {
        return RENDER_ERR_SCALARS;
    }
    if out_ptr.is_null() {
        return RENDER_ERR_OUT;
    }
    // Validate buffer shapes BEFORE constructing any slice: every nonzero count
    // must have a non-null pointer, and count*stride must not overflow usize.
    if n_layers > 0 && (layers_ptr.is_null() || n_layers.checked_mul(LAYER_STRIDE).is_none()) {
        return RENDER_ERR_BUFFER;
    }
    if n_cmds > 0 && (cmds_ptr.is_null() || n_cmds.checked_mul(CMD_STRIDE).is_none()) {
        return RENDER_ERR_BUFFER;
    }
    if n_profiles > 0 && profiles_ptr.is_null() {
        return RENDER_ERR_BUFFER;
    }
    let s = core::slice::from_raw_parts(scalars_ptr, scalars_len);

    let frame_period = s[0];
    let total_duration = s[1];
    let uses_one_pole = s[2] != 0.0;
    let one_pole_alpha = s[3];
    let coeffs = IIRFilterCoefficients {
        b0: s[4],
        b1: s[5],
        b2: s[6],
        a1: s[7],
        a2: s[8],
    };
    let has_scale = s[9] != 0.0;
    let f0_minimum = s[10];
    let f0_scale_factor = s[11];
    let f0_reference = s[12];
    let scale_divisor = s[13];
    let scale_output = s[14];
    let base_f0_bias_hz = s[15];
    let min_hz = s[16];
    let max_hz = s[17];
    let init_total = if scalars_len > 18 { s[18] } else { 0.0 };

    let layers_raw = if n_layers > 0 && !layers_ptr.is_null() {
        core::slice::from_raw_parts(layers_ptr, n_layers * LAYER_STRIDE)
    } else {
        &[]
    };
    let cmds_raw = if n_cmds > 0 && !cmds_ptr.is_null() {
        core::slice::from_raw_parts(cmds_ptr, n_cmds * CMD_STRIDE)
    } else {
        &[]
    };
    let profile_points = if n_profiles > 0 && !profiles_ptr.is_null() {
        core::slice::from_raw_parts(profiles_ptr, n_profiles)
    } else {
        &[]
    };

    let mut layers = Vec::with_capacity(n_layers);
    for i in 0..n_layers {
        let base = i * LAYER_STRIDE;
        let cmd_start = layers_raw[base + 5] as usize;
        let cmd_count = layers_raw[base + 6] as usize;
        // Validate the command sub-range lies within the commands buffer so the
        // frame loop's `inp.cmds[cmd_start + cursor]` can never index OOB.
        // (cmd_start + cmd_count must not overflow and must be <= n_cmds.)
        match cmd_start.checked_add(cmd_count) {
            Some(end) if end <= n_cmds => {}
            _ => return RENDER_ERR_CMD_RANGE,
        }
        layers.push(LayerDesc {
            layer_type: layers_raw[base] as i32,
            decay_mode: layers_raw[base + 1] as i32,
            initial_decay_divisor: layers_raw[base + 2],
            termination_threshold: layers_raw[base + 3],
            exponential_factor: layers_raw[base + 4],
            cmd_start,
            cmd_count,
        });
    }

    let mut cmds = Vec::with_capacity(n_cmds);
    for i in 0..n_cmds {
        let base = i * CMD_STRIDE;
        let profile_start = cmds_raw[base + 3] as usize;
        let profile_count = cmds_raw[base + 4] as usize;
        // Validate the profile sub-range lies within the pooled profile buffer
        // so the frame loop's `profile_points[start..start + count]` can never
        // slice OOB.
        match profile_start.checked_add(profile_count) {
            Some(end) if end <= n_profiles => {}
            _ => return RENDER_ERR_PROFILE_RANGE,
        }
        cmds.push(CmdDesc {
            time: cmds_raw[base],
            value: cmds_raw[base + 1],
            duration_frames: cmds_raw[base + 2],
            profile_start,
            profile_count,
        });
    }

    let out = core::slice::from_raw_parts_mut(out_ptr, num_frames);

    let inputs = RenderInputs {
        frame_period,
        total_duration,
        num_frames,
        uses_one_pole,
        one_pole_alpha,
        coeffs,
        has_scale,
        f0_minimum,
        f0_scale_factor,
        f0_reference,
        scale_divisor,
        scale_output,
        base_f0_bias_hz,
        min_hz,
        max_hz,
        init_total,
        layers: &layers,
        cmds: &cmds,
        profile_points,
    };
    render(&inputs, out);
    RENDER_OK
}

/// Allocate a zeroed f64 buffer in WASM linear memory.
///
/// # Safety
/// The returned pointer must be passed to `dealloc_f64` with the same `len`.
#[no_mangle]
pub extern "C" fn alloc_f64(len: usize) -> *mut f64 {
    if len == 0 {
        return core::ptr::null_mut();
    }
    let mut buf = vec![0.0f64; len];
    let ptr = buf.as_mut_ptr();
    core::mem::forget(buf);
    ptr
}

/// Deallocate an f64 buffer previously allocated with `alloc_f64`.
///
/// # Safety
/// `ptr`/`len` must match a prior `alloc_f64` and not be freed twice.
#[no_mangle]
pub unsafe extern "C" fn dealloc_f64(ptr: *mut f64, len: usize) {
    if ptr.is_null() {
        return;
    }
    let _ = Vec::from_raw_parts(ptr, 0, len);
}

// Also export the f32 alloc helpers + memory for consistency with the worklet
// pattern (harmless; the F0 kernel uses f64 buffers).
klatt_wasm_common::export_alloc_fns!();

#[cfg(test)]
mod tests {
    use super::*;

    // ---- Butterworth coefficients vs hand-computed values --------------------

    #[test]
    fn butterworth_matches_hand_computed() {
        // cutoff = 30 Hz, sample_rate = 200 Hz (frame_period = 5ms)
        let (b0, b1, b2, a1, a2) = compute_butterworth2_coefficients(30.0, 200.0);
        // Recompute the reference formula independently.
        let wc = (PI * 30.0 / 200.0).tan();
        let wc2 = wc * wc;
        let sqrt2 = core::f64::consts::SQRT_2;
        let k = 1.0 / (1.0 + sqrt2 * wc + wc2);
        assert_eq!(b0, wc2 * k);
        assert_eq!(b1, 2.0 * wc2 * k);
        assert_eq!(b2, wc2 * k);
        assert_eq!(a1, 2.0 * (wc2 - 1.0) * k);
        assert_eq!(a2, (1.0 - sqrt2 * wc + wc2) * k);
        // b0 == b2 (symmetric numerator) and b1 == 2*b0.
        assert_eq!(b0, b2);
        assert!((b1 - 2.0 * b0).abs() < 1e-15);
    }

    #[test]
    fn butterworth_dc_gain_is_unity() {
        // A low-pass filter must have unity gain at DC: sum(b)/(1+a1+a2) == 1.
        for &(cut, sr) in &[(30.0, 200.0), (50.0, 156.25), (10.0, 200.0), (90.0, 200.0)] {
            let (b0, b1, b2, a1, a2) = compute_butterworth2_coefficients(cut, sr);
            let dc = (b0 + b1 + b2) / (1.0 + a1 + a2);
            assert!((dc - 1.0).abs() < 1e-9, "dc gain {dc} for cut={cut} sr={sr}");
        }
    }

    // ---- Filter stability ----------------------------------------------------

    #[test]
    fn iir_2pole_is_stable_and_converges() {
        // Property: a stable low-pass filter driven by a constant step converges
        // to that constant and never diverges.
        let (b0, b1, b2, a1, a2) = compute_butterworth2_coefficients(30.0, 200.0);
        let coeffs = IIRFilterCoefficients { b0, b1, b2, a1, a2 };
        let mut state = IIRFilterState::default();
        let mut last = 0.0;
        for _ in 0..10_000 {
            last = iir_filter_2pole(100.0, &mut state, &coeffs);
            assert!(last.is_finite());
            assert!(last.abs() < 1e6, "diverged: {last}");
        }
        assert!((last - 100.0).abs() < 1e-3, "did not converge to step: {last}");
    }

    #[test]
    fn one_pole_clamps_alpha_and_converges() {
        // alpha clamped to [0,1]; with alpha>1 supplied it behaves as alpha=1.
        let mut y = 0.0;
        let out = one_pole_lowpass(50.0, &mut y, 5.0);
        assert_eq!(out, 50.0); // clamped to 1.0 -> jumps straight to input
        // alpha=0 -> never moves.
        let mut y2 = 7.0;
        let out2 = one_pole_lowpass(50.0, &mut y2, -3.0);
        assert_eq!(out2, 7.0);
        // 0<alpha<1 converges monotonically toward the input.
        let mut y3 = 0.0;
        let mut prev = -1.0;
        for _ in 0..1000 {
            let v = one_pole_lowpass(100.0, &mut y3, 0.1);
            assert!(v >= prev, "not monotonic: {v} < {prev}");
            assert!(v <= 100.0 + 1e-9);
            prev = v;
        }
        assert!((prev - 100.0).abs() < 1e-3);
    }

    // ---- Interpolation: monotonic between points -----------------------------

    #[test]
    fn interpolate_endpoints_and_midpoints() {
        let pts = [0.0, 10.0, 20.0];
        assert_eq!(interpolate_profile(&pts, 0.0), 0.0);
        assert_eq!(interpolate_profile(&pts, 1.0), 20.0);
        assert_eq!(interpolate_profile(&pts, 0.5), 10.0);
        assert_eq!(interpolate_profile(&pts, 0.25), 5.0);
        // Clamps out-of-range.
        assert_eq!(interpolate_profile(&pts, -1.0), 0.0);
        assert_eq!(interpolate_profile(&pts, 2.0), 20.0);
        // Degenerate cases.
        assert_eq!(interpolate_profile(&[], 0.5), 0.0);
        assert_eq!(interpolate_profile(&[42.0], 0.5), 42.0);
    }

    #[test]
    fn interpolate_monotonic_between_points() {
        // Property: between two adjacent equal-or-increasing points the result
        // is monotonic non-decreasing in position.
        let pts = [1.0, 3.0, 3.0, 9.0];
        let mut prev = f64::NEG_INFINITY;
        let mut t = 0.0;
        while t <= 1.0 {
            let v = interpolate_profile(&pts, t);
            assert!(v >= prev - 1e-12, "not monotonic at t={t}: {v} < {prev}");
            assert!(v >= 1.0 - 1e-12 && v <= 9.0 + 1e-12, "out of bounds: {v}");
            prev = v;
            t += 0.001;
        }
    }

    // ---- Impulse decay termination -------------------------------------------

    #[test]
    fn impulse_decay_terminates_halving() {
        // Build a single impulse layer; render and confirm impulses do not
        // persist forever (the active list must empty out).
        let layers = vec![LayerDesc {
            layer_type: LAYER_IMPULSE,
            decay_mode: DECAY_HALVING,
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: 10.0,
            duration_frames: 1000.0,
            profile_start: 0,
            profile_count: 0,
        }];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 5.0,
            num_frames: 1001,
            uses_one_pole: true,
            one_pole_alpha: 1.0, // pass-through filter to observe raw decay
            coeffs: IIRFilterCoefficients { b0: 0.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            f0_reference: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            base_f0_bias_hz: 0.0,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; 1001];
        render(&inp, &mut out);
        // The halving impulse decays geometrically; by the end the contribution
        // must have collapsed to ~0 (below termination threshold).
        assert!(out[1000].abs() < 0.01, "impulse did not terminate: {}", out[1000]);
        // Frame 0 carries the initial impulse value (alpha=1 pass-through).
        assert!((out[0] - 10.0).abs() < 1e-12);
    }

    #[test]
    fn impulse_decay_terminates_exponential() {
        let layers = vec![LayerDesc {
            layer_type: LAYER_IMPULSE,
            decay_mode: DECAY_EXPONENTIAL,
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: 5.0,
            duration_frames: 100000.0,
            profile_start: 0,
            profile_count: 0,
        }];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 5.0,
            num_frames: 1001,
            uses_one_pole: true,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients { b0: 0.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            f0_reference: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            base_f0_bias_hz: 0.0,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; 1001];
        render(&inp, &mut out);
        assert!(out[1000].abs() < 0.01, "exp impulse did not terminate: {}", out[1000]);
    }

    #[test]
    fn persistent_layer_accumulates_and_clamps() {
        // Two persistent commands accumulate; output clamps to max_hz.
        let layers = vec![LayerDesc {
            layer_type: LAYER_PERSISTENT,
            decay_mode: 0,
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 2,
        }];
        let cmds = vec![
            CmdDesc { time: 0.0, value: 100.0, duration_frames: 0.0, profile_start: 0, profile_count: 0 },
            CmdDesc { time: 0.0, value: 50.0, duration_frames: 0.0, profile_start: 0, profile_count: 0 },
        ];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.05,
            num_frames: 11,
            uses_one_pole: true,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients { b0: 0.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            f0_reference: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            base_f0_bias_hz: 0.0,
            min_hz: 50.0,
            max_hz: 120.0,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; 11];
        render(&inp, &mut out);
        // 100+50 = 150, clamped to max_hz 120.
        assert_eq!(out[10], 120.0);
    }

    // ---- Unknown decay mode is a no-op (master parity) -----------------------

    #[test]
    fn unknown_decay_mode_is_noop() {
        // An unrecognized decay tag (e.g. -1, the TS DECAY_MODE_UNKNOWN sentinel)
        // must leave the impulse value unchanged until it is removed by
        // remaining_frames running out — exactly master's no-matching-branch
        // behavior. With duration 3 frames and a pass-through filter, the
        // impulse holds its full value for those frames.
        let layers = vec![LayerDesc {
            layer_type: LAYER_IMPULSE,
            decay_mode: -1, // unknown
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: 7.0,
            duration_frames: 3.0,
            profile_start: 0,
            profile_count: 0,
        }];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.05,
            num_frames: 6,
            uses_one_pole: true,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients { b0: 0.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            f0_reference: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            base_f0_bias_hz: 0.0,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; 6];
        render(&inp, &mut out);
        // Frames 0,1,2: impulse alive, value never decays → 7.0 each.
        assert_eq!(out[0], 7.0);
        assert_eq!(out[1], 7.0);
        assert_eq!(out[2], 7.0);
        // Frame 3: remaining_frames hit 0 during the decay step of frame 2's
        // tail → impulse removed; contribution gone.
        assert_eq!(out[3], 0.0);
    }

    // ---- Glide layer: linear ramp to target, then hold -----------------------

    #[test]
    fn glide_ramps_linearly_then_holds() {
        // A single glide command of delta 100 over 10 frames. With a pass-through
        // filter the output should ramp linearly 0 -> 100 over frames 1..=10 and
        // then HOLD at 100 (no decay), unlike an impulse.
        let span = 10.0f64;
        let delta = 100.0f64;
        let layers = vec![LayerDesc {
            layer_type: LAYER_GLIDE,
            decay_mode: 0,
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: delta,
            duration_frames: span,
            profile_start: 0,
            profile_count: 0,
        }];
        let num_frames = 30usize;
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.005 * num_frames as f64,
            num_frames,
            uses_one_pole: true,
            one_pole_alpha: 1.0, // pass-through to observe the raw ramp
            coeffs: IIRFilterCoefficients { b0: 0.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            f0_reference: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            base_f0_bias_hz: 0.0,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; num_frames];
        render(&inp, &mut out);

        // Frame 0: ramp not yet advanced -> 0.
        assert_eq!(out[0], 0.0);
        // Monotonic non-decreasing across the whole contour.
        for w in out.windows(2) {
            assert!(w[1] >= w[0] - 1e-12, "not monotonic: {} -> {}", w[0], w[1]);
        }
        // Linear during the ramp: frame f (1..=span) == delta * f / span.
        for f in 1..=(span as usize) {
            let expected = delta * (f as f64) / span;
            assert!((out[f] - expected).abs() < 1e-9, "frame {f}: {} != {expected}", out[f]);
        }
        // Reaches the target exactly at the end of the span and HOLDS after.
        assert!((out[span as usize] - delta).abs() < 1e-9);
        for f in (span as usize)..num_frames {
            assert!((out[f] - delta).abs() < 1e-9, "glide did not hold at frame {f}: {}", out[f]);
        }
    }

    #[test]
    fn glide_zero_span_is_instant_step() {
        // A degenerate glide (duration_frames <= 0) applies the whole delta at
        // once and holds it (behaves like a persistent STEP).
        let layers = vec![LayerDesc {
            layer_type: LAYER_GLIDE,
            decay_mode: 0,
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: 42.0,
            duration_frames: 0.0,
            profile_start: 0,
            profile_count: 0,
        }];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.05,
            num_frames: 5,
            uses_one_pole: true,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients { b0: 0.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            f0_reference: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            base_f0_bias_hz: 0.0,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; 5];
        render(&inp, &mut out);
        for (f, &v) in out.iter().enumerate() {
            assert!((v - 42.0).abs() < 1e-12, "frame {f}: {v} != 42.0");
        }
    }

    #[test]
    fn glide_negative_delta_ramps_down_monotonically() {
        // Property: a negative-delta glide ramps DOWN monotonically and reaches
        // the (negative) target, then holds — mirrors a hat-fall glide.
        let span = 8.0f64;
        let delta = -160.0f64;
        let layers = vec![LayerDesc {
            layer_type: LAYER_GLIDE,
            decay_mode: 0,
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: delta,
            duration_frames: span,
            profile_start: 0,
            profile_count: 0,
        }];
        let num_frames = 20usize;
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.005 * num_frames as f64,
            num_frames,
            uses_one_pole: true,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients { b0: 0.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            f0_reference: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            base_f0_bias_hz: 0.0,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; num_frames];
        render(&inp, &mut out);
        for w in out.windows(2) {
            assert!(w[1] <= w[0] + 1e-12, "not monotonically decreasing: {} -> {}", w[0], w[1]);
        }
        assert!((out[span as usize] - delta).abs() < 1e-9);
        assert!((out[num_frames - 1] - delta).abs() < 1e-9, "did not hold the floor");
    }

    // ---- render_f0 FFI shape validation status codes -------------------------

    /// Call render_f0 with native-allocated buffers and return (status, out).
    fn call_render_f0(
        scalars: &[f64],
        layers: &[f64],
        n_layers: usize,
        cmds: &[f64],
        n_cmds: usize,
        profiles: &[f64],
        n_profiles: usize,
        num_frames: usize,
    ) -> (i32, Vec<f64>) {
        let mut out = vec![0.0f64; num_frames.max(1)];
        let status = unsafe {
            render_f0(
                scalars.as_ptr(),
                scalars.len(),
                if layers.is_empty() { core::ptr::null() } else { layers.as_ptr() },
                n_layers,
                if cmds.is_empty() { core::ptr::null() } else { cmds.as_ptr() },
                n_cmds,
                if profiles.is_empty() { core::ptr::null() } else { profiles.as_ptr() },
                n_profiles,
                out.as_mut_ptr(),
                num_frames,
            )
        };
        (status, out)
    }

    fn valid_scalars() -> [f64; 19] {
        // one-pole pass-through, no scale, wide clamp, frame_period 0.005.
        [
            0.005, 0.05, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 4096.0, 0.1, 0.0,
            -1e9, 1e9, 0.0,
        ]
    }

    #[test]
    fn render_f0_ok_on_valid_minimal_input() {
        let scalars = valid_scalars();
        // One persistent layer, one command, no profiles.
        let layers = [1.0, 0.0, 4.0, 0.01, 0.9, 0.0, 1.0]; // persistent, cmd_start 0, cmd_count 1
        let cmds = [0.0, 100.0, 0.0, 0.0, 0.0];
        let (status, out) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 11);
        assert_eq!(status, RENDER_OK);
        assert_eq!(out[10], 100.0);
    }

    #[test]
    fn render_f0_err_scalars_when_header_too_short() {
        let scalars = [0.005, 0.05]; // < 18
        let (status, _) = call_render_f0(&scalars, &[], 0, &[], 0, &[], 0, 4);
        assert_eq!(status, RENDER_ERR_SCALARS);
    }

    #[test]
    fn render_f0_err_out_when_out_null() {
        let scalars = valid_scalars();
        let status = unsafe {
            render_f0(
                scalars.as_ptr(),
                scalars.len(),
                core::ptr::null(),
                0,
                core::ptr::null(),
                0,
                core::ptr::null(),
                0,
                core::ptr::null_mut(), // null out
                4,
            )
        };
        assert_eq!(status, RENDER_ERR_OUT);
    }

    #[test]
    fn render_f0_err_buffer_when_nonzero_count_null_ptr() {
        let scalars = valid_scalars();
        // n_layers = 1 but layers pointer is null.
        let mut out = vec![0.0f64; 4];
        let status = unsafe {
            render_f0(
                scalars.as_ptr(),
                scalars.len(),
                core::ptr::null(), // null with n_layers=1
                1,
                core::ptr::null(),
                0,
                core::ptr::null(),
                0,
                out.as_mut_ptr(),
                4,
            )
        };
        assert_eq!(status, RENDER_ERR_BUFFER);
    }

    #[test]
    fn render_f0_err_cmd_range_when_layer_overruns_cmds() {
        let scalars = valid_scalars();
        // Layer claims cmd_start 0, cmd_count 5 but only 1 command exists.
        let layers = [1.0, 0.0, 4.0, 0.01, 0.9, 0.0, 5.0];
        let cmds = [0.0, 100.0, 0.0, 0.0, 0.0];
        let (status, _) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 4);
        assert_eq!(status, RENDER_ERR_CMD_RANGE);
    }

    #[test]
    fn render_f0_err_profile_range_when_cmd_overruns_profiles() {
        let scalars = valid_scalars();
        // Profile layer; command claims profile_start 0, profile_count 4 but the
        // pool holds only 2 points.
        let layers = [0.0, 0.0, 4.0, 0.01, 0.9, 0.0, 1.0]; // profile layer
        let cmds = [0.0, 0.0, 0.0, 0.0, 4.0]; // profile_start 0, profile_count 4
        let profiles = [10.0, 20.0]; // only 2
        let (status, _) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &profiles, 2, 4);
        assert_eq!(status, RENDER_ERR_PROFILE_RANGE);
    }

    #[test]
    fn render_f0_does_not_touch_out_on_error() {
        let scalars = valid_scalars();
        let layers = [1.0, 0.0, 4.0, 0.01, 0.9, 0.0, 5.0]; // bad cmd range
        let cmds = [0.0, 100.0, 0.0, 0.0, 0.0];
        // Pre-fill out with a sentinel; an error must leave it untouched.
        let mut out = vec![-12345.0f64; 4];
        let status = unsafe {
            render_f0(
                scalars.as_ptr(),
                scalars.len(),
                layers.as_ptr(),
                1,
                cmds.as_ptr(),
                1,
                core::ptr::null(),
                0,
                out.as_mut_ptr(),
                4,
            )
        };
        assert_eq!(status, RENDER_ERR_CMD_RANGE);
        assert!(out.iter().all(|&v| v == -12345.0), "out was modified on error");
    }
}
