use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

#[repr(C)]
pub struct TriangularSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    open_len: usize,
    first_half: usize,  // samples in first (opening) segment
    second_half: usize, // samples in second (closing) segment
    slope1: f32,
    slope2: f32,
    current_value: f32,
    max1: f32,
    max2: f32,
    afinal: f32,
}

impl TriangularSource {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            period_len: (sample_rate / 100.0) as usize,
            pos_in_period: 0,
            open_len: 0,
            first_half: 0,
            second_half: 0,
            slope1: 0.0,
            slope2: 0.0,
            current_value: 0.0,
            max1: 0.0,
            max2: 0.0,
            // klsyn88 uses Afinal = -7000 (fixed-point scale).
            // We preserve the sign/shape but normalize magnitude.
            afinal: -1.0,
        }
    }

    pub fn reset(&mut self) {
        self.pos_in_period = 0;
        self.current_value = 0.0;
    }

    pub fn process(&mut self, f0: f32, open_quotient: f32, asymmetry: f32) -> f32 {
        // At period boundary, recalculate
        if self.pos_in_period == 0 {
            let f0_hz = f0.max(20.0);
            self.period_len = ((self.sample_rate / f0_hz) as usize).max(1);

            // Mirror klsyn88's minimum open-phase constraint (~1 ms).
            let min_open = (self.sample_rate * 0.001) as usize;
            let mut open_len =
                ((self.period_len as f32) * open_quotient.clamp(0.01, 0.99)) as usize;
            open_len = open_len.max(1).max(min_open);
            if open_len >= self.period_len {
                open_len = self.period_len.saturating_sub(1).max(1);
            }
            self.open_len = open_len;

            // klsyn88 asymmetry is specified as a percent (0..100) with 50 symmetric:
            //   assym = (nopen * (as - 50)) / 100
            //   nfirsthalf = (nopen>>1) + assym
            let asym_percent = asymmetry.clamp(0.0, 100.0);
            let assym = ((self.open_len as f32) * (asym_percent - 50.0) / 100.0) as isize;
            let mut first_half = (self.open_len / 2) as isize + assym;
            if first_half >= self.open_len as isize {
                first_half = self.open_len as isize - 1;
            }
            if first_half <= 0 {
                first_half = 1;
            }
            self.first_half = first_half as usize;
            self.second_half = self.open_len - self.first_half;

            // klsyn88 pitch-synchronous reset:
            //   Afinal = -7000
            //   maxt2 = Afinal * 0.25
            //   slopet2 = Afinal / nsecondhalf
            //   vwave = -(Afinal * nsecondhalf) / nfirsthalf
            //   maxt1 = vwave * 0.25
            //   slopet1 = -vwave / nfirsthalf
            self.max2 = self.afinal * 0.25;
            self.slope2 = if self.second_half > 0 {
                self.afinal / (self.second_half as f32)
            } else {
                0.0
            };

            let initial_vwave =
                -(self.afinal * (self.second_half as f32)) / (self.first_half as f32);
            self.max1 = initial_vwave * 0.25;
            self.slope1 = -initial_vwave / (self.first_half as f32);

            self.current_value = initial_vwave;
        }

        let output = if self.pos_in_period < self.first_half {
            // First segment
            self.current_value += self.slope1;
            self.current_value.min(self.max1)
        } else if self.pos_in_period < self.open_len {
            // Second segment
            self.current_value += self.slope2;
            self.current_value.max(self.max2)
        } else {
            // Closed phase
            0.0
        };

        self.pos_in_period += 1;
        if self.pos_in_period >= self.period_len {
            self.pos_in_period = 0;
        }

        output
    }
}

// FFI exports
#[no_mangle]
pub extern "C" fn triangular_source_new(sample_rate: f32) -> *mut TriangularSource {
    Box::into_raw(Box::new(TriangularSource::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn triangular_source_free(ptr: *mut TriangularSource) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn triangular_source_reset(ptr: *mut TriangularSource) {
    if let Some(src) = ptr.as_mut() {
        src.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn triangular_source_process(
    ptr: *mut TriangularSource,
    f0: f32,
    open_quotient: f32,
    asymmetry: f32,
) -> f32 {
    if let Some(src) = ptr.as_mut() {
        src.process(f0, open_quotient, asymmetry)
    } else {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Reference: klsyn88 triangular_source reset in C:\Users\Q\src\klsyn\c\parwv.c
    #[test]
    fn asymmetry_is_percent_with_50_symmetric() {
        let sr = 48_000.0;
        let mut src = TriangularSource::new(sr);

        let _ = src.process(120.0, 0.5, 50.0);
        let half = src.open_len / 2;
        let delta = src.first_half.abs_diff(half);
        assert!(delta <= 1);
        assert!(src.second_half > 0);
    }

    #[test]
    fn waveform_crosses_toward_negative_by_end_of_open_phase() {
        let sr = 48_000.0;
        let mut src = TriangularSource::new(sr);

        let mut min_val = f32::INFINITY;
        let _ = src.process(100.0, 0.6, 50.0);
        for _ in 1..src.open_len {
            let y = src.process(100.0, 0.6, 50.0);
            min_val = min_val.min(y);
        }

        // With negative afinal and klsyn88-style reset, we should trend negative.
        assert!(min_val < 0.0);
    }
}
