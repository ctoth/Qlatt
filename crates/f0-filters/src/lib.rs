//! F0 control-rate DSP kernel for the layered-additive F0 renderer.
//!
//! This crate owns the per-frame DSP loop of `renderLayeredF0` in Rust→WASM.
//! Generic layered commands retain double-precision behavior, while the active
//! DECtalk coefficient renderer follows Ph_drwt02.c's signed integer control
//! recurrences and output-cell ordering.
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
// DECtalk's segmental term bypasses the main command filter. It has a separate
// fixed-point two-pole state, with a one-pole injection for voiceless
// allophones, and is added immediately before speaker scaling.
// Source: DECtalk 4.63 Ph_drwt02.c pht0draw()/filter_seg_commands().
const LAYER_DECTALK_SEGMENTAL: i32 = 4;
// A command on this layer adds its value to the speaker's F0 range for the
// rest of the render. DECtalk's female routine scales an exclamation by
// `f0scalefac + 500` (Ph_drwt02.c:3805-3808); the 500 is the command's value.
const LAYER_RANGE: i32 = 5;
// A command on this layer replaces the speaker's F0 floor (the minimum the
// scaled range is added to) for the rest of the render. DECtalk 4.63's text
// stage overwrites f0minimum around a clause break it inserts
// (LTS/ls_util.c:829-837); the value written is the command's.
const LAYER_FLOOR: i32 = 6;
const FILTER_ONE_POLE: i32 = 1;
const FILTER_COEFFICIENT_2POLE: i32 = 2;

/// Numbers of the DECtalk coefficient renderer that a caller may set. All 0:
/// the filter runs at full scale and no glottal-stop gesture is drawn.
#[derive(Clone, Copy, Default)]
struct DectalkOptions {
    /// Bits the command filter's state and input are shifted down, and its
    /// output up. The female copy of pht0draw() has 1: the state starts at
    /// (f0basestart << 3) >> 1 (Ph_drwt02.c:3182-3183), the input is
    /// f0in >> 1 (3702) and the output f0 << 1 (3710). The shift drops bits,
    /// so it is not the same filter as shift 0.
    filter_scale_shift: u32,
    /// The glottal-stop gesture's dip in F0, `distance * slope - depth` for
    /// frames within `reach` of the gesture (Ph_drwt02.c:2266-2275:
    /// dtglst * 70 - 550 while dtglst <= 7).
    dip_depth: i32,
    dip_slope: i32,
    dip_reach: i32,
    /// The frame of an allophone at which the gesture waiting at its end
    /// becomes the current one (set_tglst, 4124: nframg == 8).
    gesture_latch_frame: i32,
}

// DECtalk 4.63 ph_romi.c getcosine table used by Ph_drwt02.c's deterministic
// 3 Hz / 5 Hz control-frame pseudojitter.
const DECTALK_COSINE: [i32; 64] = [
    164, 163, 161, 158, 154, 148, 141, 132, 123, 112, 100, 86, 72, 56, 38, 20,
    0, -20, -38, -56, -72, -86, -100, -112, -123, -132, -141, -148, -154, -158,
    -161, -163, -164, -163, -161, -158, -154, -148, -141, -132, -123, -112, -100,
    -86, -72, -56, -38, -20, 0, 20, 38, 56, 72, 86, 100, 112, 123, 132, 141, 148,
    154, 158, 161, 163,
];

// `#define TWOPI 4096` (Ph_drwt02.c:235).
const DECTALK_TWOPI: i32 = 4096;
// What each pseudojitter phase gains in a frame (Ph_drwt02.c:2279, 2281).
const DECTALK_TIMECOS5_STEP: i32 = 131;
const DECTALK_TIMECOS3_STEP: i32 = 79;

/// One frame's advance of a pseudojitter phase: `phase += step; if (phase >
/// TWOPI) phase -= TWOPI;` (Ph_drwt02.c:2279-2282). The test is `>`, so a
/// phase can be TWOPI itself.
fn advance_dectalk_phase(phase: i32, step: i32) -> i32 {
    let next = phase + step;
    if next > DECTALK_TWOPI {
        next - DECTALK_TWOPI
    } else {
        next
    }
}

/// `getcosine[timecos5 >> 6] - getcosine[timecos3 >> 6]` (Ph_drwt02.c:2283).
///
/// A phase of TWOPI gives index 64, one past the table's 64 entries, and
/// DECtalk reads past its array there. The phases are never reset, so this
/// comes at frame 4096 of a text (26.2 s) and every 4096 frames after: both
/// steps are odd, so `step * frames` is a multiple of 4096 only when `frames`
/// is, and both phases are TWOPI in the same frame. Both then read the same
/// cell and the difference is 0 whatever that cell holds; that is the value
/// here. `None` is one phase past the table without the other, which the
/// two steps cannot produce.
fn dectalk_pseudojitter(timecos5: i32, timecos3: i32) -> Option<i32> {
    let index5 = usize::try_from(timecos5 >> 6).ok()?;
    let index3 = usize::try_from(timecos3 >> 6).ok()?;
    match (DECTALK_COSINE.get(index5), DECTALK_COSINE.get(index3)) {
        (Some(cosine5), Some(cosine3)) => Some(cosine5 - cosine3),
        (None, None) if index5 == index3 => Some(0),
        _ => None,
    }
}

/// Whether every frame of a stretch has a pseudojitter: `elapsed_frames`
/// frames ran before it and it runs `frames` more.
fn dectalk_pseudojitter_in_range(elapsed_frames: usize, frames: usize) -> bool {
    let mut timecos5 = 0i32;
    let mut timecos3 = 0i32;
    for frame in 0..elapsed_frames + frames {
        timecos5 = advance_dectalk_phase(timecos5, DECTALK_TIMECOS5_STEP);
        timecos3 = advance_dectalk_phase(timecos3, DECTALK_TIMECOS3_STEP);
        if frame >= elapsed_frames && dectalk_pseudojitter(timecos5, timecos3).is_none() {
            return false;
        }
    }
    true
}

// Decay mode tags for impulse layers.
const DECAY_HALVING: i32 = 0;
const DECAY_STEP_PLUS_RAMP: i32 = 1;
const DECAY_EXPONENTIAL: i32 = 2;
// The female copy of pht0draw(): the impulse is set as in the male copy
// (tarimp = 2 * f0command, delimp = f0command >> 2, Ph_drwt02.c:3466-3483)
// and `tarimp += delimp; delimp >>= 1` still runs after each sampled frame
// (3685-3691), but the male copy's `tarimp -= delimp` before the sample
// (2070-2073) is absent (3563-3568). So the step rises instead of ramping.
const DECAY_STEP_PLUS_RISE: i32 = 3;

fn is_step_decay(decay_mode: i32) -> bool {
    decay_mode == DECAY_STEP_PLUS_RAMP || decay_mode == DECAY_STEP_PLUS_RISE
}

/// 2-pole Butterworth coefficients via bilinear transform.
/// Mirrors `computeButterworth2Coefficients` in track-assembler.ts.
/// Returns (b0, b1, b2, a1, a2).
pub fn compute_butterworth2_coefficients(
    cutoff_hz: f64,
    sample_rate: f64,
) -> (f64, f64, f64, f64, f64) {
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

/// DECtalk 4.63 Ph_drwt02.c filter_commands() signed-Q14 recurrence.
fn coefficient_2pole_lowpass(input: f64, y1: &mut i32, y2: &mut i32, alpha: f64) -> f64 {
    let coefficient = (alpha * 16384.0).round() as i32;
    let complement = 16384 - coefficient;
    let first = q14_multiply(coefficient << 3, input as i32) + q14_multiply(complement, *y1);
    *y1 = first;
    let second = q14_multiply(coefficient, first) + q14_multiply(complement, *y2);
    *y2 = second;
    (second >> 3) as f64
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

#[derive(Default)]
struct DectalkSegmentalState {
    command_index: Option<usize>,
    nframs: i32,
    segment_duration: i32,
    extra_duration: i32,
    slow_target: i32,
    fast_target: i32,
    first_pole_state: i32,
    second_pole_state: i32,
}

fn q14_multiply(left: i32, right: i32) -> i32 {
    ((left as i64 * right as i64) >> 14) as i32
}

impl DectalkSegmentalState {
    fn command_flag(command: &CmdDesc, profile_points: &[f64], offset: usize) -> bool {
        command.profile_count > offset
            && profile_points
                .get(command.profile_start + offset)
                .is_some_and(|value| *value != 0.0)
    }

    fn render_frame(&mut self, commands: &[CmdDesc], profile_points: &[f64]) -> f64 {
        let can_advance = self.command_index.map_or(!commands.is_empty(), |index| {
            index + 1 < commands.len() && self.nframs >= self.segment_duration + self.extra_duration
        });
        if can_advance {
            let next_index = self.command_index.map_or(0, |index| index + 1);
            if self.command_index.is_some() {
                self.nframs -= self.segment_duration;
            }
            self.command_index = Some(next_index);
            let command = &commands[next_index];
            self.segment_duration = command.duration_frames as i32;

            // Source delay compensation when initialized SI advances to the
            // first spoken allophone.
            if next_index == 1 {
                self.nframs = -3;
            }

            let next_is_voiceless = commands
                .get(next_index + 1)
                .is_some_and(|next| Self::command_flag(next, profile_points, 0));
            self.extra_duration = if next_is_voiceless { 0 } else { -3 };

            let target = command.value as i32;
            if Self::command_flag(command, profile_points, 0) {
                self.slow_target = 0;
                self.fast_target = target;
                self.extra_duration = 1;
                if Self::command_flag(command, profile_points, 1) {
                    self.extra_duration = if Self::command_flag(command, profile_points, 2) {
                        5
                    } else {
                        3
                    };
                }
            } else {
                self.slow_target = target;
                self.fast_target = 0;
            }
        }

        self.slow_target = q14_multiply(self.slow_target, 16064);
        let first = q14_multiply(3000 << 3, self.slow_target)
            + q14_multiply(16384 - 3000, self.first_pole_state);
        self.first_pole_state = first;
        let second = q14_multiply(3000, first + (self.fast_target << 3))
            + q14_multiply(16384 - 3000, self.second_pole_state);
        self.second_pole_state = second;
        self.nframs += 1;
        (second >> 3) as f64
    }
}

/// DECtalk's glottal-stop gesture on F0: set_tglst() (Ph_drwt02.c:4040-4128)
/// and the dip pht0draw() adds around its time (2266-2275; 3753-3762 in the
/// female copy). It steps through the same allophones as the segmental path
/// on a clock of its own (npg, nframg, segdrg). Whether an allophone has a
/// gesture at its end is the fourth flag of its command; the conditions
/// (4057-4119) are the frontend's rule.
struct DectalkGlottalState {
    /// npg: -1 before the first allophone (Ph_drwt02.c:1758).
    index: i32,
    nframg: i32,
    segdrg: i32,
    /// Frame of the current gesture within the allophone; -200 is none.
    tglstp: i32,
    /// The gesture waiting to become current.
    tglstn: i32,
}

impl DectalkGlottalState {
    fn new() -> Self {
        Self {
            index: -1,
            nframg: 0,
            segdrg: 0,
            tglstp: -200,
            tglstn: -200,
        }
    }

    /// One frame: what the gesture adds to the unscaled F0.
    fn render_frame(
        &mut self,
        commands: &[CmdDesc],
        profile_points: &[f64],
        options: &DectalkOptions,
    ) -> f64 {
        let next_index = (self.index + 1) as usize;
        // Past the last allophone DECtalk would read durations it never
        // wrote; the clause has no frames left by then, so stay put.
        if self.nframg >= self.segdrg && next_index < commands.len() {
            self.nframg -= self.segdrg;
            self.index += 1;
            let command = &commands[next_index];
            self.segdrg = command.duration_frames as i32;
            // A gesture that began at the last allophone's onset is over.
            if self.tglstp == 0 {
                self.tglstp = -200;
            }
            // The second half of a gesture placed at the last allophone's end.
            if self.tglstp > 0 {
                self.tglstp = 0;
            }
            self.tglstn = if DectalkSegmentalState::command_flag(command, profile_points, 3) {
                self.segdrg
            } else {
                -200
            };
        } else if self.nframg == options.gesture_latch_frame || self.nframg == self.segdrg - 1 {
            self.tglstp = self.tglstn;
        }
        // "F0 dip by 60 Hz linear ramp in 8 frames each direction".
        let distance = (self.nframg - self.tglstp).abs();
        let dip = if distance <= options.dip_reach {
            distance * options.dip_slope - options.dip_depth
        } else {
            0
        };
        self.nframg += 1;
        dip as f64
    }
}

#[allow(clippy::too_many_arguments)]
struct RenderInputs<'a> {
    frame_period: f64,
    total_duration: f64,
    num_frames: usize,
    filter_mode: i32,
    one_pole_alpha: f64,
    coeffs: IIRFilterCoefficients,
    has_scale: bool,
    f0_minimum: f64,
    f0_scale_factor: f64,
    scale_pivot: f64,
    scale_divisor: f64,
    scale_output: f64,
    min_hz: f64,
    max_hz: f64,
    init_total: f64,
    layers: &'a [LayerDesc],
    cmds: &'a [CmdDesc],
    profile_points: &'a [f64],
}

/// The core per-frame F0 render loop. Writes `num_frames` f64 values into `out`.
/// Generic layer behavior follows the former TypeScript renderer; DECtalk's
/// coefficient path follows the cited native integer recurrences.
#[cfg(test)]
fn render(inp: &RenderInputs, out: &mut [f64]) {
    // ph_draw.c writes each -lt cell after the active Ph_drwt02.c path has
    // completed the following F0 control update. Run and discard that first
    // internal cell for the complete DECtalk coefficient+speaker renderer.
    render_with_lead(inp, out, default_output_phase_lead(inp), 0);
}

fn default_output_phase_lead(inp: &RenderInputs) -> usize {
    usize::from(inp.filter_mode == FILTER_COEFFICIENT_2POLE && inp.has_scale)
}

/// `render` for a stretch of one continuous output. `output_phase_lead` is
/// the number of leading internal frames to run and discard: a stretch after
/// the first (a later clause) passes 0, because the frame the default
/// discards is, there, the one that follows the previous stretch.
/// `elapsed_frames` is how many frames the earlier stretches ran: the
/// pseudojitter phases are never reset between clauses (Ph_drwt02.c:2278-2289
/// advances them every frame; the clause initialisation at 1652-1810 leaves
/// them alone), so they start that far along.
#[cfg(test)]
fn render_with_lead(
    inp: &RenderInputs,
    out: &mut [f64],
    output_phase_lead: usize,
    elapsed_frames: usize,
) {
    render_with_options(inp, out, output_phase_lead, elapsed_frames, &DectalkOptions::default());
}

/// `render_with_lead` with the DECtalk renderer's settable numbers.
fn render_with_options(
    inp: &RenderInputs,
    out: &mut [f64],
    output_phase_lead: usize,
    elapsed_frames: usize,
    options: &DectalkOptions,
) {
    let mut filter_state = IIRFilterState::default();
    let mut one_pole_y = 0.0f64;
    let mut coefficient_2pole_y1 = 0i32;
    let mut coefficient_2pole_y2 = 0i32;
    let mut dectalk_timecos3 = 0i32;
    let mut dectalk_timecos5 = 0i32;
    for _ in 0..elapsed_frames {
        dectalk_timecos5 = advance_dectalk_phase(dectalk_timecos5, DECTALK_TIMECOS5_STEP);
        dectalk_timecos3 = advance_dectalk_phase(dectalk_timecos3, DECTALK_TIMECOS3_STEP);
    }

    // Pre-fill filter state to avoid startup transient (init_total computed in TS
    // — it is exact: persistent cmd.value sums + profile point[0]).
    if inp.init_total != 0.0 {
        if inp.filter_mode == FILTER_ONE_POLE {
            one_pole_y = inp.init_total;
        } else if inp.filter_mode == FILTER_COEFFICIENT_2POLE {
            coefficient_2pole_y1 = ((inp.init_total as i32) << 3) >> options.filter_scale_shift;
            coefficient_2pole_y2 = ((inp.init_total as i32) << 3) >> options.filter_scale_shift;
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
    // Added to the speaker's range by LAYER_RANGE commands.
    let mut range_added = 0.0f64;
    // The speaker's F0 floor, until a LAYER_FLOOR command replaces it.
    let mut floor = inp.f0_minimum;
    let mut glide_totals = vec![0.0f64; n_layers];
    let mut active_glides: Vec<Vec<ActiveGlide>> = (0..n_layers).map(|_| Vec::new()).collect();
    let mut segmental_states: Vec<DectalkSegmentalState> = (0..n_layers)
        .map(|_| DectalkSegmentalState::default())
        .collect();
    let mut glottal_states: Vec<DectalkGlottalState> =
        (0..n_layers).map(|_| DectalkGlottalState::new()).collect();
    // profile_data: index into profile_points + count for the currently active profile.
    let mut profile_active: Vec<Option<(usize, usize)>> = vec![None; n_layers];
    let mut profile_last_base = vec![0i32; n_layers];
    let mut profile_base_time = vec![0i32; n_layers];
    let mut profile_base_counter = vec![0usize; n_layers];
    let mut profile_base_step = vec![0i32; n_layers];
    let mut profile_elapsed_frames = vec![0i32; n_layers];
    let mut command_cursors = vec![0usize; n_layers];

    let frame_period = inp.frame_period;
    let profile_duration_frames = (inp.total_duration / frame_period).round().max(1.0) as i32;
    for frame in 0..inp.num_frames + output_phase_lead {
        let time = (frame as f64) * frame_period;

        // Process pending commands for each layer up to current time.
        for li in 0..n_layers {
            let layer = &inp.layers[li];
            if layer.layer_type == LAYER_DECTALK_SEGMENTAL {
                continue;
            }
            let mut cursor = command_cursors[li];
            while cursor < layer.cmd_count {
                let cmd = &inp.cmds[layer.cmd_start + cursor];
                if cmd.time <= time {
                    match layer.layer_type {
                        LAYER_PERSISTENT => {
                            persistent_levels[li] += cmd.value;
                        }
                        LAYER_RANGE => {
                            range_added += cmd.value;
                        }
                        LAYER_FLOOR => {
                            floor = cmd.value;
                        }
                        LAYER_IMPULSE => {
                            let step_plus_ramp = is_step_decay(layer.decay_mode);
                            if step_plus_ramp {
                                // Ph_drwt02.c:1908-1957 keeps one impulse: an
                                // IMPULSE command overwrites tarimp, delimp and
                                // nimp, ending whatever impulse was running.
                                active_impulses[li].clear();
                            }
                            active_impulses[li].push(ActiveImpulse {
                                value: if step_plus_ramp {
                                    cmd.value * 2.0
                                } else {
                                    cmd.value
                                },
                                decay: if step_plus_ramp {
                                    (cmd.value / 4.0).floor()
                                } else {
                                    cmd.value / layer.initial_decay_divisor
                                },
                                remaining_frames: cmd.duration_frames,
                            });
                        }
                        LAYER_PROFILE => {
                            if cmd.profile_count > 0 {
                                profile_active[li] = Some((cmd.profile_start, cmd.profile_count));
                                profile_last_base[li] =
                                    (inp.profile_points[cmd.profile_start] as i32) << 2;
                                profile_base_time[li] = 0;
                                profile_base_counter[li] = 0;
                                profile_base_step[li] = 0;
                                profile_elapsed_frames[li] = 0;
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

        // Ph_drwt02.c decrements the active stress ramp before sampling it,
        // then restores delimp and halves delimp after the sampled frame.
        for li in 0..n_layers {
            let layer = &inp.layers[li];
            if layer.layer_type != LAYER_IMPULSE || !is_step_decay(layer.decay_mode) {
                continue;
            }
            let impulses = &mut active_impulses[li];
            let mut i = impulses.len();
            while i > 0 {
                i -= 1;
                if impulses[i].remaining_frames <= 0.0 {
                    impulses.remove(i);
                    continue;
                }
                if layer.decay_mode == DECAY_STEP_PLUS_RAMP {
                    impulses[i].value -= impulses[i].decay;
                }
                impulses[i].remaining_frames -= 1.0;
            }
        }

        // Sum all layers (layer order preserved from TS Object.keys order).
        let mut total = 0.0f64;
        for li in 0..n_layers {
            let layer = &inp.layers[li];
            match layer.layer_type {
                LAYER_PROFILE => {
                    if let Some((start, count)) = profile_active[li] {
                        if count > 0 {
                            // DECtalk Ph_drwt02.c advances the 17-point baseline
                            // through integer lastbase/basetime state over tcumdur.
                            // basestep, basetime, lastbase and f0delta are C
                            // shorts (ph_data.h:592-593, 626, 648): each
                            // assignment keeps 16 bits. In a clause of a few
                            // frames f0delta = basestep << 6 overflows, and
                            // DECtalk's baseline goes where the wrapped value
                            // sends it (Ph_drwt02.c:1996, 2010, 2024-2026).
                            let elapsed = profile_elapsed_frames[li];
                            if (elapsed << 4) >= profile_base_time[li] {
                                let next = (profile_base_counter[li] + 1).min(count - 1);
                                profile_base_step[li] = ((profile_last_base[li] >> 2)
                                    - inp.profile_points[start + next] as i32)
                                    as i16 as i32;
                                profile_base_time[li] =
                                    (profile_base_time[li] + profile_duration_frames) as i16 as i32;
                                if profile_base_counter[li] + 2 < count {
                                    profile_base_counter[li] += 1;
                                }
                            }
                            let f0delta = (profile_base_step[li] << 6) as i16 as i32;
                            profile_last_base[li] = (profile_last_base[li]
                                - f0delta / profile_duration_frames)
                                as i16 as i32;
                            total += (profile_last_base[li] >> 2) as f64;
                            profile_elapsed_frames[li] += 1;
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
                LAYER_DECTALK_SEGMENTAL => {}
                _ => {}
            }
        }

        // Apply IIR low-pass filter.
        let filtered = if inp.filter_mode == FILTER_ONE_POLE {
            one_pole_lowpass(total, &mut one_pole_y, inp.one_pole_alpha)
        } else if inp.filter_mode == FILTER_COEFFICIENT_2POLE && options.filter_scale_shift == 0 {
            coefficient_2pole_lowpass(
                total,
                &mut coefficient_2pole_y1,
                &mut coefficient_2pole_y2,
                inp.one_pole_alpha,
            )
        } else if inp.filter_mode == FILTER_COEFFICIENT_2POLE {
            let scaled_down = ((total as i32) >> options.filter_scale_shift) as f64;
            let filtered = coefficient_2pole_lowpass(
                scaled_down,
                &mut coefficient_2pole_y1,
                &mut coefficient_2pole_y2,
                inp.one_pole_alpha,
            );
            ((filtered as i32) << options.filter_scale_shift) as f64
        } else {
            iir_filter_2pole(total, &mut filter_state, &inp.coeffs)
        };

        // DECtalk adds the independently filtered segmental term after the
        // main command filter and immediately before speaker scaling.
        let mut segmental = 0.0f64;
        for li in 0..n_layers {
            let layer = &inp.layers[li];
            if layer.layer_type != LAYER_DECTALK_SEGMENTAL {
                continue;
            }
            let commands = &inp.cmds[layer.cmd_start..layer.cmd_start + layer.cmd_count];
            segmental += segmental_states[li].render_frame(commands, inp.profile_points);
            segmental += glottal_states[li].render_frame(commands, inp.profile_points, options);
        }
        let mut unscaled_f0 = filtered + segmental;

        // The active non-singing DECtalk renderer advances both zero-initialized
        // cosine phases on every output frame, then adds signed-Q14 pseudojitter
        // after the main and segmental filters and before speaker scaling.
        if inp.filter_mode == FILTER_COEFFICIENT_2POLE && inp.has_scale {
            dectalk_timecos5 = advance_dectalk_phase(dectalk_timecos5, DECTALK_TIMECOS5_STEP);
            dectalk_timecos3 = advance_dectalk_phase(dectalk_timecos3, DECTALK_TIMECOS3_STEP);
            // render_f0 refuses a stretch with a frame that has none
            // (RENDER_ERR_PHASE_RANGE) before anything is rendered.
            let pseudojitter =
                dectalk_pseudojitter(dectalk_timecos5, dectalk_timecos3).unwrap_or(0);
            unscaled_f0 += q14_multiply(pseudojitter, 700) as f64;
        }

        // Speaker scaling (DECtalk Ph_drwt02.c) or pass-through.
        let mut f0_hz = if inp.has_scale {
            if inp.filter_mode == FILTER_COEFFICIENT_2POLE && inp.scale_divisor == 4096.0 {
                let scaled_internal = floor as i32
                    + (((unscaled_f0 as i32 - inp.scale_pivot as i32)
                        * (inp.f0_scale_factor + range_added) as i32)
                        >> 12);
                scaled_internal as f64 * inp.scale_output
            } else {
                (floor
                    + (unscaled_f0 - inp.scale_pivot) * (inp.f0_scale_factor + range_added)
                        / inp.scale_divisor)
                    * inp.scale_output
            }
        } else {
            unscaled_f0
        };
        f0_hz = inp.min_hz.max(inp.max_hz.min(f0_hz));
        if frame >= output_phase_lead {
            out[frame - output_phase_lead] = f0_hz;
        }

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
                if is_step_decay(layer.decay_mode) {
                    if impulses[i].value != 0.0 {
                        impulses[i].value += impulses[i].decay;
                    }
                    impulses[i].decay = (impulses[i].decay / 2.0).floor();
                    continue;
                }
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
/// A frame's pseudojitter phases fall outside DECtalk's cosine table in a way
/// DECtalk's own code gives no value for (see `dectalk_pseudojitter`).
pub const RENDER_ERR_PHASE_RANGE: i32 = -6;

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
    if scalars_ptr.is_null() || scalars_len < 16 {
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
    let filter_mode = s[2] as i32;
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
    let scale_divisor = s[12];
    let scale_output = s[13];
    let min_hz = s[14];
    let max_hz = s[15];
    let init_total = if scalars_len > 16 { s[16] } else { 0.0 };
    let scale_pivot = if scalars_len > 17 { s[17] } else { f0_minimum };

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
        filter_mode,
        one_pole_alpha,
        coeffs,
        has_scale,
        f0_minimum,
        f0_scale_factor,
        scale_pivot,
        scale_divisor,
        scale_output,
        min_hz,
        max_hz,
        init_total,
        layers: &layers,
        cmds: &cmds,
        profile_points,
    };
    // scalars[18], when present, is the number of leading internal frames to
    // run and discard, and scalars[19] the frames earlier stretches ran;
    // absent, the renderer's own defaults apply.
    // scalars[20..25], when present, are the DECtalk renderer's numbers
    // (DectalkOptions, in its field order); absent, all are 0.
    let lead = if scalars_len > 18 && s[18] >= 0.0 {
        s[18] as usize
    } else {
        default_output_phase_lead(&inputs)
    };
    let elapsed = if scalars_len > 19 && s[19] > 0.0 { s[19] as usize } else { 0 };
    let options = if scalars_len > 24 {
        DectalkOptions {
            filter_scale_shift: s[20].max(0.0) as u32,
            dip_depth: s[21] as i32,
            dip_slope: s[22] as i32,
            dip_reach: s[23] as i32,
            gesture_latch_frame: s[24] as i32,
        }
    } else {
        DectalkOptions::default()
    };
    if inputs.filter_mode == FILTER_COEFFICIENT_2POLE
        && inputs.has_scale
        && !dectalk_pseudojitter_in_range(elapsed, lead.saturating_add(out.len()))
    {
        return RENDER_ERR_PHASE_RANGE;
    }
    render_with_options(&inputs, out, lead, elapsed, &options);
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
            assert!(
                (dc - 1.0).abs() < 1e-9,
                "dc gain {dc} for cut={cut} sr={sr}"
            );
        }
    }

    #[test]
    fn dectalk_speaker_scaling_uses_declared_fixed_pivot() {
        let layers = vec![LayerDesc {
            layer_type: LAYER_PERSISTENT,
            decay_mode: DECAY_HALVING,
            initial_decay_divisor: 4.0,
            termination_threshold: 0.01,
            exponential_factor: 0.9,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: 1160.0,
            duration_frames: 0.0,
            profile_start: 0,
            profile_count: 0,
        }];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.0,
            num_frames: 1,
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: true,
            f0_minimum: 1100.0,
            f0_scale_factor: 4100.0,
            scale_pivot: 1300.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            min_hz: 40.0,
            max_hz: 500.0,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = [0.0];

        render(&inp, &mut out);

        let expected = (1100.0 + (1160.0 - 1300.0) * 4100.0 / 4096.0) * 0.1;
        assert!(
            (out[0] - expected).abs() < 1e-12,
            "{} != {expected}",
            out[0]
        );
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
        assert!(
            (last - 100.0).abs() < 1e-3,
            "did not converge to step: {last}"
        );
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

    #[test]
    fn coefficient_2pole_matches_dectalk_q14_recurrence() {
        // DECtalk Ph_drwt02.c filter_commands() with Paul's 2100/16384
        // coefficient and a 1000-unit step. The active male path filters the
        // full input, keeps both pole states in Q3-scaled integers, and shifts
        // the second pole back down for output.
        let mut y1 = 0;
        let mut y2 = 0;
        let alpha = 2100.0 / 16384.0;
        let values = [
            coefficient_2pole_lowpass(1000.0, &mut y1, &mut y2, alpha),
            coefficient_2pole_lowpass(1000.0, &mut y1, &mut y2, alpha),
            coefficient_2pole_lowpass(1000.0, &mut y1, &mut y2, alpha),
        ];
        assert_eq!(values, [16.0, 44.0, 82.0]);
    }

    #[test]
    fn dectalk_profile_matches_short_declarative_baseline_clock() {
        let profile = [
            1160.0, 1150.0, 1140.0, 1152.0, 1132.0, 1140.0, 1130.0, 1124.0, 1110.0,
            1100.0, 1080.0, 1060.0, 1040.0, 1020.0, 980.0, 960.0, 950.0,
        ];
        let expected = [
            1158.0, 1156.0, 1154.0, 1152.0, 1150.0, 1148.0, 1146.0, 1144.0, 1142.0,
            1140.0, 1142.0, 1144.0, 1146.0, 1149.0, 1151.0, 1147.0, 1143.0, 1140.0,
            1136.0, 1132.0, 1134.0, 1135.0, 1137.0, 1138.0, 1140.0, 1138.0, 1136.0,
            1134.0, 1132.0, 1130.0, 1129.0, 1128.0, 1127.0, 1126.0, 1125.0, 1122.0,
            1119.0, 1116.0, 1113.0, 1110.0, 1108.0, 1105.0, 1103.0, 1100.0, 1096.0,
            1092.0, 1088.0, 1084.0, 1080.0, 1076.0, 1072.0, 1068.0, 1064.0, 1060.0,
            1056.0, 1052.0, 1048.0,
        ];
        let layers = [LayerDesc {
            layer_type: LAYER_PROFILE,
            decay_mode: 0,
            initial_decay_divisor: 0.0,
            termination_threshold: 0.0,
            exponential_factor: 0.0,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let commands = [CmdDesc {
            time: 0.0,
            value: 0.0,
            duration_frames: 0.0,
            profile_start: 0,
            profile_count: profile.len(),
        }];
        let inputs = RenderInputs {
            frame_period: 0.0064,
            total_duration: 78.0 * 0.0064,
            num_frames: expected.len(),
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 1160.0,
            layers: &layers,
            cmds: &commands,
            profile_points: &profile,
        };
        let mut output = [0.0; 57];

        render(&inputs, &mut output);

        assert_eq!(output, expected);
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
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0, // pass-through filter to observe raw decay
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
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
        assert!(
            out[1000].abs() < 0.01,
            "impulse did not terminate: {}",
            out[1000]
        );
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
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; 1001];
        render(&inp, &mut out);
        assert!(
            out[1000].abs() < 0.01,
            "exp impulse did not terminate: {}",
            out[1000]
        );
    }

    #[test]
    fn dectalk_nonreading_male_impulse_matches_step_plus_ramp() {
        let layers = vec![LayerDesc {
            layer_type: LAYER_IMPULSE,
            decay_mode: DECAY_STEP_PLUS_RAMP,
            initial_decay_divisor: 8.0,
            termination_threshold: 0.01,
            exponential_factor: 0.0,
            cmd_start: 0,
            cmd_count: 1,
        }];
        let cmds = vec![CmdDesc {
            time: 0.0,
            value: 191.0,
            duration_frames: 20.0,
            profile_start: 0,
            profile_count: 0,
        }];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.1,
            num_frames: 21,
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &[],
        };
        let mut out = vec![0.0; 21];

        render(&inp, &mut out);

        assert_eq!(
            out,
            vec![
                335.0, 359.0, 371.0, 377.0, 380.0, 381.0, 382.0, 382.0, 382.0, 382.0, 382.0, 382.0,
                382.0, 382.0, 382.0, 382.0, 382.0, 382.0, 382.0, 382.0, 0.0,
            ],
        );
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
            CmdDesc {
                time: 0.0,
                value: 100.0,
                duration_frames: 0.0,
                profile_start: 0,
                profile_count: 0,
            },
            CmdDesc {
                time: 0.0,
                value: 50.0,
                duration_frames: 0.0,
                profile_start: 0,
                profile_count: 0,
            },
        ];
        let inp = RenderInputs {
            frame_period: 0.005,
            total_duration: 0.05,
            num_frames: 11,
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
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
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
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
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0, // pass-through to observe the raw ramp
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
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
            assert!(
                (out[f] - expected).abs() < 1e-9,
                "frame {f}: {} != {expected}",
                out[f]
            );
        }
        // Reaches the target exactly at the end of the span and HOLDS after.
        assert!((out[span as usize] - delta).abs() < 1e-9);
        for f in (span as usize)..num_frames {
            assert!(
                (out[f] - delta).abs() < 1e-9,
                "glide did not hold at frame {f}: {}",
                out[f]
            );
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
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
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
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 1.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
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
            assert!(
                w[1] <= w[0] + 1e-12,
                "not monotonically decreasing: {} -> {}",
                w[0],
                w[1]
            );
        }
        assert!((out[span as usize] - delta).abs() < 1e-9);
        assert!(
            (out[num_frames - 1] - delta).abs() < 1e-9,
            "did not hold the floor"
        );
    }

    #[test]
    fn dectalk_segmental_layer_matches_cake_q14_recurrence() {
        // Active US male allophones for `cake.`: SI(4), K(17), EY(37),
        // K(14), IX(6). profile_points stores source flags
        // [voiceless, plosive, stressed] for each controller allophone.
        //
        // DECtalk 4.63 Ph_drwt02.c us_f0msegtars, pht0draw(), and
        // filter_seg_commands(); ph_defs.h mlsh1 Q14 arithmetic.
        let layers = vec![LayerDesc {
            layer_type: LAYER_DECTALK_SEGMENTAL,
            decay_mode: 0,
            initial_decay_divisor: 0.0,
            termination_threshold: 0.0,
            exponential_factor: 0.0,
            cmd_start: 0,
            cmd_count: 5,
        }];
        let metadata = vec![
            1.0, 0.0, 0.0, // SI
            1.0, 1.0, 1.0, // initial K in the stressed syllable
            0.0, 0.0, 1.0, // EY
            1.0, 1.0, 0.0, // K
            0.0, 0.0, 0.0, // IX
        ];
        let cmds = vec![
            CmdDesc {
                time: 0.0,
                value: 50.0,
                duration_frames: 4.0,
                profile_start: 0,
                profile_count: 3,
            },
            CmdDesc {
                time: 0.0,
                value: 0.0,
                duration_frames: 17.0,
                profile_start: 3,
                profile_count: 3,
            },
            CmdDesc {
                time: 0.0,
                value: 50.0,
                duration_frames: 37.0,
                profile_start: 6,
                profile_count: 3,
            },
            CmdDesc {
                time: 0.0,
                value: 0.0,
                duration_frames: 14.0,
                profile_start: 9,
                profile_count: 3,
            },
            CmdDesc {
                time: 0.0,
                value: 70.0,
                duration_frames: 6.0,
                profile_start: 12,
                profile_count: 3,
            },
        ];
        let inp = RenderInputs {
            frame_period: 0.0064,
            total_duration: 0.0064 * 82.0,
            num_frames: 82,
            filter_mode: FILTER_ONE_POLE,
            one_pole_alpha: 1.0,
            coeffs: IIRFilterCoefficients {
                b0: 0.0,
                b1: 0.0,
                b2: 0.0,
                a1: 0.0,
                a2: 0.0,
            },
            has_scale: false,
            f0_minimum: 0.0,
            f0_scale_factor: 4100.0,
            scale_pivot: 0.0,
            scale_divisor: 4096.0,
            scale_output: 0.1,
            min_hz: -1e9,
            max_hz: 1e9,
            init_total: 0.0,
            layers: &layers,
            cmds: &cmds,
            profile_points: &metadata,
        };
        let mut out = vec![0.0; 82];
        render(&inp, &mut out);

        assert_eq!(
            out,
            vec![
                9.0, 16.0, 22.0, 27.0, 31.0, 25.0, 20.0, 17.0, 13.0, 11.0, 9.0, 7.0,
                6.0, 4.0, 3.0, 3.0, 2.0, 2.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 4.0, 7.0, 10.0, 13.0, 16.0, 19.0,
                22.0, 24.0, 26.0, 28.0, 30.0, 31.0, 32.0, 32.0, 33.0, 33.0, 33.0,
                33.0, 33.0, 32.0, 32.0, 31.0, 31.0, 30.0, 30.0, 29.0, 28.0, 27.0,
                26.0, 26.0, 25.0, 23.0, 21.0, 19.0, 17.0, 15.0, 13.0, 12.0, 10.0,
                8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 3.0, 2.0, 2.0, 3.0, 7.0, 11.0,
            ],
        );
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
                if layers.is_empty() {
                    core::ptr::null()
                } else {
                    layers.as_ptr()
                },
                n_layers,
                if cmds.is_empty() {
                    core::ptr::null()
                } else {
                    cmds.as_ptr()
                },
                n_cmds,
                if profiles.is_empty() {
                    core::ptr::null()
                } else {
                    profiles.as_ptr()
                },
                n_profiles,
                out.as_mut_ptr(),
                num_frames,
            )
        };
        (status, out)
    }

    fn valid_scalars() -> [f64; 17] {
        // one-pole pass-through, no scale, wide clamp, frame_period 0.005.
        [
            0.005, 0.05, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 4096.0, 0.1, -1e9, 1e9,
            0.0,
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
    fn renderer_does_not_fire_a_command_before_its_timestamp() {
        // The DECtalk control loop consumes a command on the first frame whose
        // clock has reached its timestamp. A command just after frame 1 must
        // therefore wait for frame 2; nearest-frame rounding fires it early.
        let scalars = [
            0.0064, 0.0192, FILTER_ONE_POLE as f64, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 4096.0, 1.0, -1e9, 1e9, 0.0,
        ];
        let layers = [1.0, 0.0, 4.0, 0.01, 0.9, 0.0, 1.0];
        let cmds = [0.0065, 100.0, 0.0, 0.0, 0.0];

        let (status, out) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 3);

        assert_eq!(status, RENDER_OK);
        assert_eq!(out, [0.0, 0.0, 100.0]);
    }

    #[test]
    fn coefficient_2pole_uses_active_male_path_initial_state_scaling() {
        // Active DECtalk 4.63 Ph_drwt02.c initializes both memories to
        // f0basestart << F0SHFT, filters the full input, and returns
        // f0out2 >> F0SHFT. Integer truncation makes this first cell 1159.
        let scalars = [
            0.0064,
            0.0,
            FILTER_COEFFICIENT_2POLE as f64,
            2100.0 / 16384.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            4096.0,
            0.1,
            -1e9,
            1e9,
            1160.0,
        ];
        let layers = [1.0, 0.0, 4.0, 0.01, 0.9, 0.0, 1.0];
        let cmds = [0.0, 1160.0, 0.0, 0.0, 0.0];

        let (status, out) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 1);

        assert_eq!(status, RENDER_OK);
        assert_eq!(out, [1159.0]);
    }

    #[test]
    fn coefficient_2pole_matches_dectalk_output_phase_jitter_and_integer_scale() {
        // DECtalk 4.63 Ph_drwt02.c starts timecos5/timecos3 at zero, advances
        // them by 131/79, and adds mlsh1(cos[2] - cos[1], 700) = -1 to
        // the filtered internal F0. Its following frac4mul is an arithmetic
        // right shift, so 1100 + ((1298 - 1300) * 4100 >> 12) = 1097.
        // The -lt output cell reflects the following completed F0 control update;
        // after one discarded warm-up cell, the first four emitted jitter terms
        // are -1, -1, -2, -2 internal units.
        let scalars = [
            0.0064,
            0.0064,
            FILTER_COEFFICIENT_2POLE as f64,
            2100.0 / 16384.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            1100.0,
            4100.0,
            4096.0,
            0.1,
            -1e9,
            1e9,
            1300.0,
            1300.0,
        ];
        let layers = [1.0, 0.0, 4.0, 0.01, 0.9, 0.0, 1.0];
        let cmds = [0.0, 1300.0, 0.0, 0.0, 0.0];

        let (status, out) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 4);

        assert_eq!(status, RENDER_OK);
        assert_eq!(out, [1097.0 * 0.1, 1097.0 * 0.1, 1096.0 * 0.1, 1096.0 * 0.1]);
    }

    #[test]
    fn pseudojitter_phases_reach_twopi_together_every_4096_frames() {
        // Ph_drwt02.c:2279-2282: `>` TWOPI, so a phase can be 4096 itself.
        assert_eq!(advance_dectalk_phase(3965, DECTALK_TIMECOS5_STEP), 4096);
        assert_eq!(advance_dectalk_phase(4096, DECTALK_TIMECOS5_STEP), 131);
        let mut timecos5 = 0;
        let mut timecos3 = 0;
        let mut frames_at_twopi = Vec::new();
        for frame in 1..=12288 {
            timecos5 = advance_dectalk_phase(timecos5, DECTALK_TIMECOS5_STEP);
            timecos3 = advance_dectalk_phase(timecos3, DECTALK_TIMECOS3_STEP);
            assert_eq!(timecos5 == DECTALK_TWOPI, timecos3 == DECTALK_TWOPI, "frame {frame}");
            if timecos5 == DECTALK_TWOPI {
                frames_at_twopi.push(frame);
            }
        }
        assert_eq!(frames_at_twopi, [4096, 8192, 12288]);
    }

    #[test]
    fn pseudojitter_past_the_cosine_table_is_zero_only_when_both_phases_are() {
        // getcosine[64] - getcosine[64]: the same cell, whatever it holds.
        assert_eq!(dectalk_pseudojitter(DECTALK_TWOPI, DECTALK_TWOPI), Some(0));
        // Inside the table: cos[2] - cos[1] for the first frame's 131 and 79.
        assert_eq!(dectalk_pseudojitter(131, 79), Some(161 - 163));
        assert_eq!(dectalk_pseudojitter(4095, 4095), Some(0));
        // One phase past the table without the other has no value in DECtalk.
        assert_eq!(dectalk_pseudojitter(DECTALK_TWOPI, 79), None);
        assert_eq!(dectalk_pseudojitter(131, DECTALK_TWOPI), None);
        assert_eq!(dectalk_pseudojitter(-64, 79), None);
        // The two steps never produce that, from any number of earlier frames.
        assert!(dectalk_pseudojitter_in_range(0, 20000));
        assert!(dectalk_pseudojitter_in_range(4090, 12));
    }

    #[test]
    fn renders_frame_4096_of_a_text_and_the_frames_around_it() {
        // The setup of the jitter test above, 4090 frames into a text: with
        // the one discarded cell, the eight outputs are frames 4092 to 4099.
        // The held level is 1299 internal units after the filter; the output
        // is 1100 + ((1299 + jitter - 1300) * 4100 >> 12). This panicked at
        // frame 4096 (index 64 of a 64-entry table).
        let mut scalars = vec![
            0.0064,
            0.0064,
            FILTER_COEFFICIENT_2POLE as f64,
            2100.0 / 16384.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            1100.0,
            4100.0,
            4096.0,
            0.1,
            -1e9,
            1e9,
            1300.0,
            1300.0,
        ];
        scalars.push(-1.0); // the default lead
        scalars.push(4090.0); // frames already run
        let layers = [1.0, 0.0, 4.0, 0.01, 0.9, 0.0, 1.0];
        let cmds = [0.0, 1300.0, 0.0, 0.0, 0.0];

        let (status, out) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 8);

        assert_eq!(status, RENDER_OK);
        let expected: Vec<f64> = (4092..=4099)
            .map(|frame: i32| {
                let jitter = if frame == 4096 {
                    0
                } else {
                    let phase = |step: i32| {
                        let phase = (step * frame) % DECTALK_TWOPI;
                        (phase >> 6) as usize
                    };
                    DECTALK_COSINE[phase(DECTALK_TIMECOS5_STEP)]
                        - DECTALK_COSINE[phase(DECTALK_TIMECOS3_STEP)]
                };
                let internal = 1299 + q14_multiply(jitter, 700);
                (1100 + (((internal - 1300) * 4100) >> 12)) as f64 * 0.1
            })
            .collect();
        assert_eq!(out, expected);
        // Frame 4096 has no jitter; its neighbours do.
        assert_eq!(out[4], 1098.0 * 0.1);
        assert_ne!(out[3], out[4]);
    }

    #[test]
    fn half_scale_coefficient_filter_drops_the_bit_the_female_routine_drops() {
        // Ph_drwt02.c:3182-3183, 3702, 3710. A held level of 1001 with
        // coefficient 8192: the state starts at (1001 << 3) >> 1 = 4004 and
        // the input is 1001 >> 1 = 500, so
        //   first  = mlsh1(8192 << 3, 500) + mlsh1(8192, 4004) = 2000 + 2002
        //   second = mlsh1(8192, 4002) + mlsh1(8192, 4004)     = 2001 + 2002
        //   f0     = (4003 >> 3) << 1                          = 1000
        // The full-scale filter holds 1001.
        let render = |filter_scale_shift: f64| {
            let scalars = [
                0.0064,
                0.0064,
                FILTER_COEFFICIENT_2POLE as f64,
                0.5,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                1.0,
                1.0,
                1.0,
                -1e9,
                1e9,
                1001.0,
                0.0,
                // Default lead, no earlier frames, then DectalkOptions.
                -1.0,
                0.0,
                filter_scale_shift,
                0.0,
                0.0,
                0.0,
                0.0,
            ];
            let layers = [LAYER_PERSISTENT as f64, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0];
            let cmds = [0.0, 1001.0, 0.0, 0.0, 0.0];
            call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 1)
        };

        assert_eq!(render(1.0), (RENDER_OK, vec![1000.0]));
        assert_eq!(render(0.0), (RENDER_OK, vec![1001.0]));
    }

    #[test]
    fn step_plus_rise_impulse_is_the_ramp_without_its_subtraction() {
        // A command of 40 for 3 frames: tarimp = 80, delimp = 10. The male
        // routine samples tarimp - delimp and then restores and halves delimp
        // (Ph_drwt02.c:2070-2073, 2194-2200): 70, 75, 78. The female routine
        // has no subtraction (3563-3568) but still adds delimp after each
        // frame (3685-3691): 80, 90, 95. Both end when the count runs out.
        let render = |decay_mode: i32| {
            let scalars = [
                0.0064,
                0.0064,
                FILTER_ONE_POLE as f64,
                1.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                1.0,
                1.0,
                1.0,
                -1e9,
                1e9,
            ];
            let layers = [LAYER_IMPULSE as f64, decay_mode as f64, 0.0, 0.0, 0.0, 0.0, 1.0];
            let cmds = [0.0, 40.0, 3.0, 0.0, 0.0];
            call_render_f0(&scalars, &layers, 1, &cmds, 1, &[], 0, 4)
        };

        assert_eq!(render(DECAY_STEP_PLUS_RAMP), (RENDER_OK, vec![70.0, 75.0, 78.0, 0.0]));
        assert_eq!(render(DECAY_STEP_PLUS_RISE), (RENDER_OK, vec![80.0, 90.0, 95.0, 0.0]));
    }

    #[test]
    fn glottal_gesture_dips_f0_around_the_end_of_a_flagged_allophone() {
        // set_tglst() and the dip (Ph_drwt02.c:4040-4128, 2266-2275) for two
        // allophones with targets of 0: 3 frames with a gesture at its end,
        // then 12 frames.
        //   frame 0  first allophone: segdrg = 3, tglstn = 3
        //   frame 2  nframg == segdrg - 1: tglstp = 3, one frame away: 70 - 550
        //   frame 3  second allophone: tglstp = 0, nframg = 0: -550
        //   frames 4-10  nframg 1-7: nframg * 70 - 550
        //   frame 11 nframg == 8: tglstp = tglstn = -200, no dip
        let scalars = [
            0.0064,
            0.0064,
            FILTER_ONE_POLE as f64,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            1.0,
            1.0,
            -1e9,
            1e9,
            0.0,
            0.0,
            // Default lead, no earlier frames, then DectalkOptions: no filter
            // shift; depth 550, slope 70, reach 7 frames, latch at frame 8.
            -1.0,
            0.0,
            0.0,
            550.0,
            70.0,
            7.0,
            8.0,
        ];
        let layers = [LAYER_DECTALK_SEGMENTAL as f64, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0];
        let cmds = [0.0, 0.0, 3.0, 0.0, 4.0, 0.0, 0.0, 12.0, 4.0, 4.0];
        let flags = [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0];

        let (status, out) = call_render_f0(&scalars, &layers, 1, &cmds, 2, &flags, 8, 12);

        assert_eq!(status, RENDER_OK);
        assert_eq!(
            out,
            [0.0, 0.0, -480.0, -550.0, -480.0, -410.0, -340.0, -270.0, -200.0, -130.0, -60.0, 0.0]
        );

        // Without the flag nothing is added.
        let no_flags = [0.0; 8];
        let (_, flat) = call_render_f0(&scalars, &layers, 1, &cmds, 2, &no_flags, 8, 12);
        assert_eq!(flat, [0.0; 12]);

        // Nor when the caller gives the gesture no numbers.
        let (_, unset) = call_render_f0(&scalars[..16], &layers, 1, &cmds, 2, &flags, 8, 12);
        assert_eq!(unset, [0.0; 12]);
    }

    #[test]
    fn profile_state_wraps_at_sixteen_bits_as_dectalks_shorts_do() {
        // A profile from 1000 to 100 over a clause of one frame. lastbase
        // starts at 1000 << 2 = 4000.
        //   frame 0: basestep = 1000 - 100 = 900; f0delta = 900 << 6 = 57600,
        //            as a short -7936; lastbase = 4000 + 7936 = 11936 -> 2984
        //   frame 1: basestep = 2884; 184576 as a short is -12032;
        //            lastbase = 23968 -> 5992
        //   frame 2: basestep = 5892; 377088 as a short is -16128;
        //            lastbase = 40096, as a short -25440 -> -6360
        // Without the wrap frame 0 alone would give (4000 - 57600) >> 2.
        let scalars = [
            0.0064,
            0.0064,
            FILTER_ONE_POLE as f64,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            1.0,
            1.0,
            -1e9,
            1e9,
        ];
        let layers = [LAYER_PROFILE as f64, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0];
        let cmds = [0.0, 0.0, 0.0, 0.0, 2.0];
        let points = [1000.0, 100.0];

        let (status, out) = call_render_f0(&scalars, &layers, 1, &cmds, 1, &points, 2, 3);

        assert_eq!(status, RENDER_OK);
        assert_eq!(out, [2984.0, 5992.0, -6360.0]);
    }

    #[test]
    fn range_layer_command_adds_to_the_speaker_range() {
        // minimum 100, range 2, pivot 10, divisor 4: a level of 30 scales to
        // 100 + (30 - 10) * 2 / 4 = 110. A range command of 2 makes the range
        // 4: 100 + (30 - 10) * 4 / 4 = 120.
        let scalars = [
            0.0064,
            0.0064,
            FILTER_ONE_POLE as f64,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            100.0,
            2.0,
            4.0,
            1.0,
            -1e9,
            1e9,
            0.0,
            10.0,
        ];
        let level = [0.0, 30.0, 0.0, 0.0, 0.0];
        let one_layer = [LAYER_PERSISTENT as f64, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0];
        assert_eq!(
            call_render_f0(&scalars, &one_layer, 1, &level, 1, &[], 0, 1),
            (RENDER_OK, vec![110.0])
        );

        let two_layers = [
            LAYER_PERSISTENT as f64,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            LAYER_RANGE as f64,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            1.0,
        ];
        let cmds = [0.0, 30.0, 0.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0];
        assert_eq!(
            call_render_f0(&scalars, &two_layers, 2, &cmds, 2, &[], 0, 1),
            (RENDER_OK, vec![120.0])
        );

        // A floor command of -12 in place of the range command: the floor of
        // 100 is replaced, -12 + (30 - 10) * 2 / 4 = -2.
        let mut floor_layers = two_layers;
        floor_layers[7] = LAYER_FLOOR as f64;
        let floor_cmds = [0.0, 30.0, 0.0, 0.0, 0.0, 0.0, -12.0, 0.0, 0.0, 0.0];
        assert_eq!(
            call_render_f0(&scalars, &floor_layers, 2, &floor_cmds, 2, &[], 0, 1),
            (RENDER_OK, vec![-2.0])
        );
    }

    #[test]
    fn render_f0_err_scalars_when_header_too_short() {
        let scalars = [0.005, 0.05]; // < 16
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
        assert!(
            out.iter().all(|&v| v == -12345.0),
            "out was modified on error"
        );
    }
}
