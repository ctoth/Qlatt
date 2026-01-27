use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

#[repr(C)]
pub struct ImpulsiveSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    // Simple one-pole LP filter state
    lp_y1: f32,
    lp_coeff: f32,
}

impl ImpulsiveSource {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            period_len: (sample_rate / 100.0) as usize,
            pos_in_period: 0,
            lp_y1: 0.0,
            lp_coeff: 0.0,
        }
    }

    pub fn reset(&mut self) {
        self.pos_in_period = 0;
        self.lp_y1 = 0.0;
    }

    pub fn process(&mut self, f0: f32, open_quotient: f32) -> f32 {
        // At period boundary, recalculate
        if self.pos_in_period == 0 {
            self.period_len = ((self.sample_rate / f0.max(20.0)) as usize).max(1);

            // LP filter coefficient based on open phase
            let open_len = ((self.period_len as f32) * open_quotient.clamp(0.01, 0.99)) as usize;
            let cutoff = self.sample_rate / (open_len.max(1) as f32);
            // Simple one-pole: coeff = exp(-2*pi*fc/fs)
            self.lp_coeff = (-2.0 * std::f32::consts::PI * cutoff / self.sample_rate).exp();
        }

        // Generate doublet at samples 0, 1, 2
        let impulse = match self.pos_in_period {
            0 => 1.0,
            1 => 0.0,
            2 => -1.0,
            _ => 0.0,
        };

        // Apply LP filter
        // Note: lp_y1 intentionally NOT reset at period boundary
        // to maintain smooth filter response across glottal pulses
        let output = impulse * (1.0 - self.lp_coeff) + self.lp_y1 * self.lp_coeff;
        self.lp_y1 = output;

        self.pos_in_period += 1;
        if self.pos_in_period >= self.period_len {
            self.pos_in_period = 0;
        }

        output
    }
}

// FFI exports
#[no_mangle]
pub extern "C" fn impulsive_source_new(sample_rate: f32) -> *mut ImpulsiveSource {
    Box::into_raw(Box::new(ImpulsiveSource::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn impulsive_source_free(ptr: *mut ImpulsiveSource) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn impulsive_source_reset(ptr: *mut ImpulsiveSource) {
    if let Some(src) = ptr.as_mut() {
        src.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn impulsive_source_process(
    ptr: *mut ImpulsiveSource,
    f0: f32,
    open_quotient: f32,
) -> f32 {
    if let Some(src) = ptr.as_mut() {
        src.process(f0, open_quotient)
    } else {
        0.0
    }
}
