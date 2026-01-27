use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

#[repr(C)]
pub struct TriangularSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    open_len: usize,
    first_half: usize,  // samples in rising phase
    second_half: usize, // samples in falling phase
    rise_slope: f32,
    fall_slope: f32,
    current_value: f32,
    peak_value: f32,
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
            rise_slope: 0.0,
            fall_slope: 0.0,
            current_value: 0.0,
            peak_value: 1.0,
        }
    }

    pub fn reset(&mut self) {
        self.pos_in_period = 0;
        self.current_value = 0.0;
    }

    pub fn process(&mut self, f0: f32, open_quotient: f32, asymmetry: f32) -> f32 {
        // At period boundary, recalculate
        if self.pos_in_period == 0 {
            self.period_len = ((self.sample_rate / f0.max(20.0)) as usize).max(1);
            self.open_len = (((self.period_len as f32) * open_quotient.clamp(0.01, 0.99)) as usize).max(1);

            // Asymmetry: 0=short rise/long fall, 0.5=symmetric, 1=long rise/short fall
            // (asymmetry is the fraction of open phase spent rising)
            let asym = asymmetry.clamp(0.01, 0.99);
            self.first_half = ((self.open_len as f32) * asym) as usize;
            self.second_half = self.open_len - self.first_half;

            // Calculate slopes
            if self.first_half > 0 {
                self.rise_slope = self.peak_value / (self.first_half as f32);
            }
            if self.second_half > 0 {
                self.fall_slope = self.peak_value / (self.second_half as f32);
            }

            self.current_value = 0.0;
        }

        let output = if self.pos_in_period < self.first_half {
            // Rising phase
            self.current_value += self.rise_slope;
            self.current_value.min(self.peak_value)
        } else if self.pos_in_period < self.open_len {
            // Falling phase
            self.current_value -= self.fall_slope;
            self.current_value.max(0.0)
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
