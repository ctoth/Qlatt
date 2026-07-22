//! Dynamics Compressor - feedforward dynamic range compressor for the output stage
//!
//! Design follows Giannoulis, Massberg & Reiss (2012), "Digital Dynamic Range
//! Compressor Design — A Tutorial and Analysis", JAES 60(6):
//!   - log-domain gain computer with quadratic soft knee (their Eq. 4)
//!   - branching smooth peak detector on the gain-reduction signal (their Eq. 16),
//!     attack/release one-pole coefficients alpha = exp(-1 / (tau * fs))
//!
//! Role in the graph: output-stage peak taming. Klatt 1980 COEWAV.FOR line 251
//! scales by 170x then hard-truncates to [-32767, 32767]; in float audio a
//! ratio-12 compressor serves the same role — taming loud cascade F1 peaks while
//! preserving quieter parallel-branch fricatives (plain gain reduction would make
//! fricatives inaudible).
//!
//! Replaces the WebAudio DynamicsCompressorNode binding. Two deliberate
//! differences from that node:
//!   - no lookahead: DynamicsCompressorNode imposes a fixed ~6 ms pre-delay on
//!     the whole signal path; unacceptable latency for a screen-reader synth
//!   - no automatic makeup gain: DynamicsCompressorNode applies an
//!     implementation-defined makeup stage; here makeup is an explicit
//!     `makeup_db` parameter declared by the graph (0 dB by default)

/// -120 dB floor for the log-domain level detector; below this the gain
/// computer sees silence and applies no reduction.
const LOG_EPSILON: f32 = 1e-6;

#[repr(C)]
pub struct DynamicsCompressor {
    sample_rate: f32,
    /// Threshold in dB (level above which compression begins)
    threshold_db: f32,
    /// Soft knee width in dB
    knee_db: f32,
    /// Compression ratio (input dB : output dB above threshold)
    ratio: f32,
    /// Attack one-pole coefficient, exp(-1/(attack_s * fs))
    alpha_attack: f32,
    /// Release one-pole coefficient, exp(-1/(release_s * fs))
    alpha_release: f32,
    /// Explicit makeup gain as a linear factor (from makeup_db). Unlike the
    /// WebAudio DynamicsCompressorNode's automatic makeup stage, this is a
    /// declared graph parameter — 0 dB unless the graph says otherwise.
    makeup_linear: f32,
    /// Smoothed gain reduction in dB (>= 0)
    gain_reduction_db: f32,
}

fn one_pole_alpha(tau_seconds: f32, sample_rate: f32) -> f32 {
    if tau_seconds <= 0.0 || !tau_seconds.is_finite() {
        return 0.0; // instantaneous
    }
    (-1.0 / (tau_seconds * sample_rate)).exp()
}

impl DynamicsCompressor {
    pub fn new(sample_rate: f32) -> Self {
        let sr = if sample_rate > 0.0 && sample_rate.is_finite() {
            sample_rate
        } else {
            22050.0
        };
        let mut c = Self {
            sample_rate: sr,
            threshold_db: -24.0,
            knee_db: 12.0,
            ratio: 12.0,
            alpha_attack: 0.0,
            alpha_release: 0.0,
            makeup_linear: 1.0,
            gain_reduction_db: 0.0,
        };
        c.set_params(-24.0, 12.0, 12.0, 0.003, 0.1, 0.0);
        c
    }

    pub fn reset(&mut self) {
        self.gain_reduction_db = 0.0;
    }

    pub fn set_params(
        &mut self,
        threshold_db: f32,
        knee_db: f32,
        ratio: f32,
        attack_s: f32,
        release_s: f32,
        makeup_db: f32,
    ) {
        self.threshold_db = threshold_db;
        self.knee_db = knee_db.max(0.0);
        self.ratio = ratio.max(1.0);
        self.alpha_attack = one_pole_alpha(attack_s, self.sample_rate);
        self.alpha_release = one_pole_alpha(release_s, self.sample_rate);
        self.makeup_linear = 10.0_f32.powf(makeup_db / 20.0);
    }

    /// Static gain computer: input level in dB -> desired gain reduction in dB (>= 0).
    /// Giannoulis et al. 2012 Eq. 4 (soft knee), rearranged as reduction.
    #[inline]
    fn computed_reduction_db(&self, level_db: f32) -> f32 {
        let over = level_db - self.threshold_db;
        let half_knee = self.knee_db * 0.5;
        if 2.0 * over < -self.knee_db {
            0.0
        } else if self.knee_db > 0.0 && 2.0 * over.abs() <= self.knee_db {
            (1.0 / self.ratio - 1.0) * (over + half_knee) * (over + half_knee)
                / (2.0 * self.knee_db)
                * -1.0
        } else {
            (1.0 - 1.0 / self.ratio) * over
        }
    }

    #[inline]
    fn process_sample(&mut self, x: f32) -> f32 {
        let level_db = 20.0 * x.abs().max(LOG_EPSILON).log10();
        let target = self.computed_reduction_db(level_db);
        // Branching smoother (Giannoulis et al. 2012 Eq. 16): attack when
        // reduction is increasing, release when decreasing.
        let alpha = if target > self.gain_reduction_db {
            self.alpha_attack
        } else {
            self.alpha_release
        };
        self.gain_reduction_db = alpha * self.gain_reduction_db + (1.0 - alpha) * target;
        let gain = 10.0_f32.powf(-self.gain_reduction_db / 20.0);
        x * gain * self.makeup_linear
    }

    pub fn process(&mut self, input: &[f32], output: &mut [f32]) {
        let len = output.len();
        for i in 0..len {
            let x = if input.is_empty() {
                0.0
            } else if input.len() > 1 {
                input[i % input.len()]
            } else {
                input[0]
            };
            output[i] = self.process_sample(x);
        }
    }
}

// ============================================================================
// FFI exports for WASM
// ============================================================================

#[no_mangle]
pub extern "C" fn dynamics_compressor_new(sample_rate: f32) -> *mut DynamicsCompressor {
    Box::into_raw(Box::new(DynamicsCompressor::new(sample_rate)))
}

#[no_mangle]
pub extern "C" fn dynamics_compressor_free(ptr: *mut DynamicsCompressor) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn dynamics_compressor_reset(ptr: *mut DynamicsCompressor) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).reset();
    }
}

#[no_mangle]
pub extern "C" fn dynamics_compressor_set_params(
    ptr: *mut DynamicsCompressor,
    threshold_db: f32,
    knee_db: f32,
    ratio: f32,
    attack_s: f32,
    release_s: f32,
    makeup_db: f32,
) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_params(threshold_db, knee_db, ratio, attack_s, release_s, makeup_db);
    }
}

#[no_mangle]
pub extern "C" fn dynamics_compressor_process(
    ptr: *mut DynamicsCompressor,
    input_ptr: *const f32,
    input_len: usize,
    output_ptr: *mut f32,
    output_len: usize,
) {
    if ptr.is_null() || output_ptr.is_null() || output_len == 0 {
        return;
    }
    unsafe {
        let input = if input_ptr.is_null() || input_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(input_ptr, input_len)
        };
        let output = core::slice::from_raw_parts_mut(output_ptr, output_len);
        (*ptr).process(input, output);
    }
}

/// Current smoothed gain reduction in dB (for debugging/monitoring)
#[no_mangle]
pub extern "C" fn dynamics_compressor_get_reduction_db(ptr: *const DynamicsCompressor) -> f32 {
    if ptr.is_null() {
        return 0.0;
    }
    unsafe { (*ptr).gain_reduction_db }
}

// Re-export WASM memory allocation functions
klatt_wasm_common::export_alloc_fns!();

// ============================================================================
// Tests (run natively: cargo test -p dynamics-compressor)
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    /// Steady-state gain for a constant-level input must match the static
    /// gain computer: above knee, out_dB = T + (in_dB - T)/R.
    #[test]
    fn steady_state_matches_static_curve_above_knee() {
        let mut c = DynamicsCompressor::new(22050.0);
        c.set_params(-24.0, 12.0, 12.0, 0.003, 0.1, 0.0);
        // 0 dBFS input: over = 24 dB, well above knee/2 = 6 dB
        let x = 1.0_f32;
        let mut y = 0.0;
        for _ in 0..44100 {
            y = c.process_sample(x);
        }
        let expected_db = -24.0 + (0.0 - -24.0) / 12.0; // -22 dB
        let expected = 10.0_f32.powf(expected_db / 20.0);
        assert!(
            (y - expected).abs() < 1e-3,
            "steady-state {y} vs expected {expected}"
        );
    }

    #[test]
    fn below_threshold_is_unity() {
        let mut c = DynamicsCompressor::new(22050.0);
        c.set_params(-24.0, 12.0, 12.0, 0.003, 0.1, 0.0);
        // -40 dBFS input: over = -16, 2*over < -knee -> no reduction
        let x = 0.01_f32;
        let mut y = 0.0;
        for _ in 0..44100 {
            y = c.process_sample(x);
        }
        assert!((y - x).abs() < 1e-6, "unity expected, got {y} for input {x}");
    }

    #[test]
    fn knee_region_is_continuous() {
        let c = {
            let mut c = DynamicsCompressor::new(22050.0);
            c.set_params(-24.0, 12.0, 12.0, 0.003, 0.1, 0.0);
            c
        };
        // Reduction at knee edges must meet the outer segments continuously.
        let lower = c.computed_reduction_db(-30.0); // knee lower edge
        let upper = c.computed_reduction_db(-18.0); // knee upper edge
        let above = (1.0 - 1.0 / 12.0) * (-18.0 - -24.0);
        assert!(lower.abs() < 1e-4, "lower knee edge should be ~0, got {lower}");
        assert!(
            (upper - above).abs() < 1e-3,
            "upper knee edge {upper} vs line {above}"
        );
    }

    #[test]
    fn makeup_scales_output_linearly() {
        let mut base = DynamicsCompressor::new(22050.0);
        base.set_params(-24.0, 12.0, 12.0, 0.003, 0.1, 0.0);
        let mut boosted = DynamicsCompressor::new(22050.0);
        boosted.set_params(-24.0, 12.0, 12.0, 0.003, 0.1, 9.0);
        let x = 0.5_f32;
        let mut y0 = 0.0;
        let mut y9 = 0.0;
        for _ in 0..44100 {
            y0 = base.process_sample(x);
            y9 = boosted.process_sample(x);
        }
        let expected = y0 * 10.0_f32.powf(9.0 / 20.0);
        assert!(
            (y9 - expected).abs() < 1e-4,
            "makeup +9 dB: got {y9}, expected {expected}"
        );
    }

    #[test]
    fn hard_knee_zero_width_does_not_divide_by_zero() {
        let mut c = DynamicsCompressor::new(22050.0);
        c.set_params(-24.0, 0.0, 12.0, 0.0, 0.0, 0.0);
        let y = c.process_sample(1.0);
        assert!(y.is_finite());
    }
}
