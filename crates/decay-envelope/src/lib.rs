//! Decay Envelope - Triggered exponential decay for Klatt 80 PLSTEP burst mechanism
//!
//! From Klatt 1980 "Software for a cascade/parallel formant synthesizer":
//!   "The value of the step function decays toward zero... STEP = 0.995 * STEP"
//!
//! At 10kHz sample rate, 0.995 per sample gives approximately 92ms decay time constant.
//! The decay coefficient should be adjusted for different sample rates:
//!   decay_at_sr = 0.995^(10000/sr)
//!
//! For example:
//!   - 10kHz: decay = 0.995
//!   - 44.1kHz: decay = 0.995^(10000/44100) = 0.99887
//!   - 48kHz: decay = 0.995^(10000/48000) = 0.99896

/// Triggered exponential decay envelope generator
#[repr(C)]
pub struct DecayEnvelope {
    /// Current envelope value (decays toward zero)
    value: f32,
    /// Previous trigger value for edge detection
    prev_trigger: f32,
}

impl DecayEnvelope {
    fn new() -> Self {
        Self {
            value: 0.0,
            prev_trigger: 0.0,
        }
    }

    /// Process a single sample
    ///
    /// # Arguments
    /// * `trigger` - Trigger signal (rising edge above 0.5 fires)
    /// * `amplitude` - Initial amplitude when triggered (set negative for rarefaction)
    /// * `decay` - Decay coefficient per sample (0.995 for Klatt 80 at 10kHz)
    ///
    /// # Returns
    /// Current envelope value
    #[inline]
    fn process_sample(&mut self, trigger: f32, amplitude: f32, decay: f32) -> f32 {
        // Edge detection: trigger on rising edge crossing 0.5
        if trigger > 0.5 && self.prev_trigger <= 0.5 {
            // Set to negative amplitude for rarefaction burst (Klatt 80 convention)
            self.value = -amplitude;
        }
        self.prev_trigger = trigger;

        // Apply decay: STEP = decay * STEP
        self.value *= decay;

        self.value
    }

    fn process(
        &mut self,
        trigger: &[f32],
        amplitude: &[f32],
        decay: &[f32],
        output: &mut [f32],
    ) {
        let len = output.len();
        let trigger_len = trigger.len();
        let amplitude_len = amplitude.len();
        let decay_len = decay.len();

        for i in 0..len {
            let t = if trigger_len == 0 {
                0.0
            } else if trigger_len > 1 {
                trigger[i % trigger_len]
            } else {
                trigger[0]
            };

            let a = if amplitude_len == 0 {
                0.0
            } else if amplitude_len > 1 {
                amplitude[i % amplitude_len]
            } else {
                amplitude[0]
            };

            let d = if decay_len == 0 {
                0.995 // Default Klatt 80 decay at 10kHz
            } else if decay_len > 1 {
                decay[i % decay_len]
            } else {
                decay[0]
            };

            output[i] = self.process_sample(t, a, d);
        }
    }
}

// ============================================================================
// FFI exports for WASM
// ============================================================================

#[no_mangle]
pub extern "C" fn decay_envelope_new() -> *mut DecayEnvelope {
    Box::into_raw(Box::new(DecayEnvelope::new()))
}

#[no_mangle]
pub extern "C" fn decay_envelope_free(ptr: *mut DecayEnvelope) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn decay_envelope_reset(ptr: *mut DecayEnvelope) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).value = 0.0;
        (*ptr).prev_trigger = 0.0;
    }
}

#[no_mangle]
pub extern "C" fn decay_envelope_process(
    ptr: *mut DecayEnvelope,
    trigger_ptr: *const f32,
    trigger_len: usize,
    amplitude_ptr: *const f32,
    amplitude_len: usize,
    decay_ptr: *const f32,
    decay_len: usize,
    output_ptr: *mut f32,
    output_len: usize,
) {
    if ptr.is_null() || output_ptr.is_null() || output_len == 0 {
        return;
    }

    unsafe {
        let trigger = if trigger_ptr.is_null() || trigger_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(trigger_ptr, trigger_len)
        };

        let amplitude = if amplitude_ptr.is_null() || amplitude_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(amplitude_ptr, amplitude_len)
        };

        let decay = if decay_ptr.is_null() || decay_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(decay_ptr, decay_len)
        };

        let output = core::slice::from_raw_parts_mut(output_ptr, output_len);
        (*ptr).process(trigger, amplitude, decay, output);
    }
}

/// Get current envelope value (for debugging/monitoring)
#[no_mangle]
pub extern "C" fn decay_envelope_get_value(ptr: *const DecayEnvelope) -> f32 {
    if ptr.is_null() {
        return 0.0;
    }
    unsafe { (*ptr).value }
}

// ============================================================================
// Memory allocation helpers (required for WASM AudioWorklet pattern)
// ============================================================================

#[no_mangle]
pub extern "C" fn alloc_f32(len: usize) -> *mut f32 {
    let mut buf = vec![0.0f32; len];
    let ptr = buf.as_mut_ptr();
    core::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc_f32(ptr: *mut f32, len: usize) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, len);
    }
}

// ============================================================================
// Helper function for sample rate adaptation
// ============================================================================

/// Calculate decay coefficient for a given sample rate
///
/// Klatt 80 uses 0.995 at 10kHz. This function adapts it to other sample rates
/// to maintain the same time constant (~92ms).
///
/// Formula: decay_sr = 0.995^(10000/sr)
#[no_mangle]
pub extern "C" fn decay_coefficient_for_sample_rate(sample_rate: f32) -> f32 {
    if sample_rate <= 0.0 || !sample_rate.is_finite() {
        return 0.995; // Return Klatt 80 default
    }
    // decay = 0.995^(10000/sr)
    let exponent = 10000.0 / sample_rate;
    0.995_f32.powf(exponent)
}
