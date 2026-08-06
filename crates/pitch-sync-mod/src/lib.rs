//! Pitch-synchronous F1/B1 resonator for cascade vocal tract.
//!
//! Implements the klsyn88 pitch-synchronous F1/B1 changes during glottal open/close
//! and the Fujisaki-style history compensation when F1 drops.
//!
//! Reference: klsyn88 parwv.c (pitch_synch_par_reset, setR1, parwav glottal loop).

#![allow(clippy::too_many_arguments)]
#![allow(clippy::missing_safety_doc)]

use klatt_wasm_common::export_alloc_fns;
use std::f32::consts::PI;

export_alloc_fns!();

#[repr(C)]
pub struct PitchSyncResonator {
    sample_rate: f32,

    // Period tracking in 4x sample units
    t0: i32,
    nper: i32,
    nopen: i32,
    skew: i32,
    source: i32,

    // Base parameters
    base_freq: i32,
    base_bw: i32,

    // Delta parameters (open-phase increments)
    d_f1: i32,
    d_b1: i32,

    // Open-phase modulation state (non-impulsive sources)
    f1hzmod: i32,
    b1hzmod: i32,

    // Fujisaki compensation tracking
    f1_last: i32,
    anorm1: f32,

    // Resonator state
    y1: f32,
    y2: f32,

    // Resonator coefficients
    a: f32,
    b: f32,
    c: f32,
}

impl PitchSyncResonator {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            t0: 0,
            nper: 0,
            nopen: 0,
            skew: 0,
            source: 2,
            base_freq: 500,
            base_bw: 80,
            d_f1: 0,
            d_b1: 0,
            f1hzmod: 0,
            b1hzmod: 0,
            f1_last: 0,
            anorm1: 0.0,
            y1: 0.0,
            y2: 0.0,
            a: 1.0,
            b: 0.0,
            c: 0.0,
        }
    }

    pub fn reset(&mut self) {
        self.t0 = 0;
        self.nper = 0;
        self.nopen = 0;
        self.skew = 0;
        self.f1hzmod = 0;
        self.b1hzmod = 0;
        self.y1 = 0.0;
        self.y2 = 0.0;
        self.f1_last = 0;
        self.anorm1 = 0.0;
    }

    fn setabc(&mut self, freq: i32, bw: i32) {
        let f = (freq as f32).max(0.0);
        let b = (bw as f32).max(0.0);
        let r = (-PI * b / self.sample_rate).exp();
        self.c = -(r * r);
        self.b = 2.0 * r * (2.0 * PI * f / self.sample_rate).cos();
        self.a = 1.0 - self.b - self.c;
    }

    fn set_r1(&mut self, freq: i32, bw: i32) {
        // Reference: klsyn88 parwv.c setR1
        self.setabc(freq, bw);
        if self.f1_last != 0 && freq < self.f1_last {
            self.anorm1 = (freq as f32) / self.anorm1;
            self.y1 *= self.anorm1;
            self.y2 *= self.anorm1;
        }
        self.f1_last = freq;
        self.anorm1 = freq as f32;
    }

    fn pitch_sync_reset(&mut self, f0_hz: f32, open_quotient: f32, skew_param: f32, source: i32) {
        self.source = source;
        if f0_hz.is_finite() && f0_hz > 0.0 {
            // Reference: klsyn88 parwv.c pitch_synch_par_reset
            let mut t0 = (4.0 * self.sample_rate / f0_hz).floor() as i32;
            if t0 <= 0 {
                t0 = 4;
            }
            self.t0 = t0;

            let mut nopen = (self.t0 as f32 * (open_quotient / 100.0)).floor() as i32;
            if (self.source == 1 || self.source == 2) && nopen > 263 {
                nopen = 263;
            }
            if nopen >= (self.t0 - 1) {
                nopen = self.t0 - 2;
            }
            if nopen < 40 {
                nopen = 40;
            }
            self.nopen = nopen;

            let mut kskew = skew_param.round() as i32;
            let temp = self.t0 - self.nopen;
            if kskew > temp {
                kskew = temp;
            }
            if self.skew >= 0 {
                self.skew = kskew;
            } else {
                self.skew = -kskew;
            }
            self.t0 += self.skew;
            self.skew = -self.skew;
        } else {
            self.t0 = 4;
        }
    }

    fn apply_pitch_sync_modulation(&mut self) {
        if self.source == 1 {
            if self.nper == (self.t0 - self.nopen) {
                self.set_r1(self.base_freq + self.d_f1, self.base_bw + self.d_b1);
            }
            if self.nper == self.t0 {
                self.set_r1(self.base_freq, self.base_bw);
            }
        } else {
            if self.nper == self.nopen {
                if (self.f1hzmod + self.b1hzmod) > 0 {
                    self.set_r1(self.base_freq, self.base_bw);
                }
                self.f1hzmod = 0;
                self.b1hzmod = 0;
            }
            if self.nper == self.t0 {
                self.f1hzmod = self.d_f1;
                self.b1hzmod = self.d_b1;
                if (self.f1hzmod + self.b1hzmod) > 0 {
                    self.set_r1(
                        self.base_freq + self.f1hzmod,
                        self.base_bw + self.b1hzmod,
                    );
                }
            }
        }
    }

    pub fn process(
        &mut self,
        input: f32,
        f0: f32,
        open_quotient: f32,
        frequency: f32,
        bandwidth: f32,
        delta_freq: f32,
        delta_bw: f32,
        skew_param: f32,
        source: f32,
    ) -> f32 {
        if self.t0 <= 0 {
            self.pitch_sync_reset(f0, open_quotient, skew_param, source.round() as i32);
        }

        let base_freq = frequency.round() as i32;
        let base_bw = bandwidth.round() as i32;
        self.d_f1 = delta_freq.round() as i32;
        self.d_b1 = delta_bw.round() as i32;
        self.source = source.round() as i32;

        if base_freq != self.base_freq || base_bw != self.base_bw {
            self.base_freq = base_freq;
            self.base_bw = base_bw;
            if self.source == 1 {
                self.set_r1(self.base_freq, self.base_bw);
            } else {
                self.set_r1(self.base_freq + self.f1hzmod, self.base_bw + self.b1hzmod);
            }
        }

        // Advance the 4x oversampled period counter and update coefficients.
        for _ in 0..4 {
            self.apply_pitch_sync_modulation();
            if self.nper >= self.t0 {
                self.nper = 0;
                self.pitch_sync_reset(f0, open_quotient, skew_param, self.source);
            }
            self.nper += 1;
        }

        let output = self.a * input + self.b * self.y1 + self.c * self.y2;
        self.y2 = self.y1;
        self.y1 = output;
        output
    }

    #[allow(clippy::too_many_arguments)]
    pub fn process_block(
        &mut self,
        input: &[f32],
        output: &mut [f32],
        f0: &[f32],
        open_quotient: f32,
        frequency: &[f32],
        bandwidth: &[f32],
        delta_freq: &[f32],
        delta_bw: &[f32],
        skew_param: f32,
        source: f32,
    ) {
        for (index, (out, sample)) in output.iter_mut().zip(input).enumerate() {
            let value_at = |values: &[f32]| values[if values.len() == 1 { 0 } else { index }];
            *out = self.process(
                klatt_wasm_common::normalize_worklet_sample(*sample),
                value_at(f0),
                open_quotient,
                value_at(frequency),
                value_at(bandwidth),
                value_at(delta_freq),
                value_at(delta_bw),
                skew_param,
                source,
            );
        }
    }
}

// FFI exports
#[no_mangle]
pub extern "C" fn pitch_sync_resonator_new(sample_rate: f32) -> *mut PitchSyncResonator {
    Box::into_raw(Box::new(PitchSyncResonator::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn pitch_sync_resonator_free(ptr: *mut PitchSyncResonator) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn pitch_sync_resonator_reset(ptr: *mut PitchSyncResonator) {
    if let Some(res) = ptr.as_mut() {
        res.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn pitch_sync_resonator_process(
    ptr: *mut PitchSyncResonator,
    input: f32,
    f0: f32,
    open_quotient: f32,
    frequency: f32,
    bandwidth: f32,
    delta_freq: f32,
    delta_bw: f32,
    skew_param: f32,
    source: f32,
) -> f32 {
    if let Some(res) = ptr.as_mut() {
        res.process(
            input,
            f0,
            open_quotient,
            frequency,
            bandwidth,
            delta_freq,
            delta_bw,
            skew_param,
            source,
        )
    } else {
        0.0
    }
}

#[no_mangle]
#[allow(clippy::too_many_arguments)]
pub unsafe extern "C" fn pitch_sync_resonator_process_block(
    ptr: *mut PitchSyncResonator,
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
    f0_ptr: *const f32,
    f0_len: usize,
    open_quotient: f32,
    frequency_ptr: *const f32,
    frequency_len: usize,
    bandwidth_ptr: *const f32,
    bandwidth_len: usize,
    delta_freq_ptr: *const f32,
    delta_freq_len: usize,
    delta_bw_ptr: *const f32,
    delta_bw_len: usize,
    skew_param: f32,
    source: f32,
) {
    let valid_rate = |rate_len: usize| rate_len == 1 || rate_len >= len;
    if ptr.is_null()
        || input_ptr.is_null()
        || output_ptr.is_null()
        || f0_ptr.is_null()
        || frequency_ptr.is_null()
        || bandwidth_ptr.is_null()
        || delta_freq_ptr.is_null()
        || delta_bw_ptr.is_null()
        || len == 0
        || !valid_rate(f0_len)
        || !valid_rate(frequency_len)
        || !valid_rate(bandwidth_len)
        || !valid_rate(delta_freq_len)
        || !valid_rate(delta_bw_len)
    {
        return;
    }

    let input = core::slice::from_raw_parts(input_ptr, len);
    let output = core::slice::from_raw_parts_mut(output_ptr, len);
    let f0 = core::slice::from_raw_parts(f0_ptr, f0_len);
    let frequency = core::slice::from_raw_parts(frequency_ptr, frequency_len);
    let bandwidth = core::slice::from_raw_parts(bandwidth_ptr, bandwidth_len);
    let delta_freq = core::slice::from_raw_parts(delta_freq_ptr, delta_freq_len);
    let delta_bw = core::slice::from_raw_parts(delta_bw_ptr, delta_bw_len);
    (*ptr).process_block(
        input,
        output,
        f0,
        open_quotient,
        frequency,
        bandwidth,
        delta_freq,
        delta_bw,
        skew_param,
        source,
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_block_matches_scalar(automated: bool) {
        let mut scalar = PitchSyncResonator::new(48_000.0);
        let mut block = PitchSyncResonator::new(48_000.0);
        let mut input: Vec<f32> = (0..64)
            .map(|index| (index as f32 * 0.37).sin() * 0.75)
            .collect();
        input[0] = -0.0;
        input[1] = f32::NAN;
        let parameter_len = if automated { input.len() } else { 1 };
        let parameter = |base: f32, scale: f32| -> Vec<f32> {
            (0..parameter_len)
                .map(|index| base + (index as f32 % 11.0) * scale)
                .collect()
        };
        let f0 = parameter(110.0, 0.25);
        let f1 = parameter(500.0, 1.0);
        let b1 = parameter(80.0, 0.5);
        let d_f1 = parameter(90.0, 1.0);
        let d_b1 = parameter(40.0, 0.5);
        let mut expected = vec![0.0_f32; input.len()];
        for (index, sample) in input.iter().enumerate() {
            let parameter_index = if automated { index } else { 0 };
            expected[index] = scalar.process(
                klatt_wasm_common::normalize_worklet_sample(*sample),
                f0[parameter_index],
                50.0,
                f1[parameter_index],
                b1[parameter_index],
                d_f1[parameter_index],
                d_b1[parameter_index],
                0.0,
                2.0,
            );
        }

        let mut actual = vec![0.0_f32; input.len()];
        block.process_block(
            &input,
            &mut actual,
            &f0,
            50.0,
            &f1,
            &b1,
            &d_f1,
            &d_b1,
            0.0,
            2.0,
        );

        assert_eq!(
            actual.iter().copied().map(f32::to_bits).collect::<Vec<_>>(),
            expected
                .iter()
                .copied()
                .map(f32::to_bits)
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn applies_fujisaki_compensation_on_downward_shift() {
        let mut r = PitchSyncResonator::new(11025.0);
        let _ = r.process(1.0, 100.0, 50.0, 500.0, 80.0, 0.0, 0.0, 0.0, 2.0);
        let y1_before = r.y1;
        let _ = r.process(1.0, 100.0, 50.0, 300.0, 80.0, 0.0, 0.0, 0.0, 2.0);
        assert!(r.y1.abs() <= y1_before.abs() + 1e-6);
    }

    #[test]
    fn block_api_matches_scalar_for_k_rate_parameters() {
        assert_block_matches_scalar(false);
    }

    #[test]
    fn block_api_matches_scalar_for_a_rate_parameters() {
        assert_block_matches_scalar(true);
    }
}
