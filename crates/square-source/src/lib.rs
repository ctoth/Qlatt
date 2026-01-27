use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

#[repr(C)]
pub struct SquareSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    open_len: usize,
}

impl SquareSource {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            period_len: (sample_rate / 100.0) as usize,
            pos_in_period: 0,
            open_len: 0,
        }
    }

    pub fn reset(&mut self) {
        self.pos_in_period = 0;
    }

    pub fn process(&mut self, f0: f32, open_quotient: f32) -> f32 {
        // At period boundary, recalculate
        if self.pos_in_period == 0 {
            self.period_len = ((self.sample_rate / f0.max(20.0)) as usize).max(1);
            self.open_len = (((self.period_len as f32) * open_quotient.clamp(0.01, 0.99)) as usize).max(1);
        }

        let output = if self.pos_in_period < self.open_len {
            1.0
        } else {
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
