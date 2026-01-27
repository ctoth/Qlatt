use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

#[repr(C)]
pub struct SquareSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    open_len: usize,
    open_amp: f32,
    closed_amp: f32,
}

impl SquareSource {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            period_len: (sample_rate / 100.0) as usize,
            pos_in_period: 0,
            open_len: 0,
            // klsyn88 uses fixed bipolar values (-1750 during open, +1750 during closed).
            // We keep the bipolar behavior but normalize amplitudes to +/-1.
            open_amp: -1.0,
            closed_amp: 1.0,
        }
    }

    pub fn reset(&mut self) {
        self.pos_in_period = 0;
    }

    pub fn process(&mut self, f0: f32, open_quotient: f32) -> f32 {
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
        }

        let output = if self.pos_in_period < self.open_len {
            self.open_amp
        } else {
            self.closed_amp
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
pub extern "C" fn square_source_new(sample_rate: f32) -> *mut SquareSource {
    Box::into_raw(Box::new(SquareSource::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn square_source_free(ptr: *mut SquareSource) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn square_source_reset(ptr: *mut SquareSource) {
    if let Some(src) = ptr.as_mut() {
        src.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn square_source_process(
    ptr: *mut SquareSource,
    f0: f32,
    open_quotient: f32,
) -> f32 {
    if let Some(src) = ptr.as_mut() {
        src.process(f0, open_quotient)
    } else {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Reference: klsyn88 square_source in C:\Users\Q\src\klsyn\c\parwv.c
    #[test]
    fn is_bipolar_and_respects_min_open_phase() {
        let sr = 48_000.0;
        let mut src = SquareSource::new(sr);

        let first = src.process(100.0, 0.001);
        let min_open = (sr * 0.001) as usize;
        assert!(src.open_len >= min_open);
        assert!(src.open_len < src.period_len);

        // During open phase we output the open amplitude (negative).
        assert!(first < 0.0);

        // Advance beyond open phase and confirm closed amplitude (positive).
        for _ in 0..src.open_len {
            let _ = src.process(100.0, 0.001);
        }
        let closed = src.process(100.0, 0.001);
        assert!(closed > 0.0);
    }
}
