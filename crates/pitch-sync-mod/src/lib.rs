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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn applies_fujisaki_compensation_on_downward_shift() {
        let mut r = PitchSyncResonator::new(11025.0);
        let _ = r.process(1.0, 100.0, 50.0, 500.0, 80.0, 0.0, 0.0, 0.0, 2.0);
        let y1_before = r.y1;
        let _ = r.process(1.0, 100.0, 50.0, 300.0, 80.0, 0.0, 0.0, 0.0, 2.0);
        assert!(r.y1.abs() <= y1_before.abs() + 1e-6);
    }
}
