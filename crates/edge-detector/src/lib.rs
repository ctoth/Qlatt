//! Edge detector for Klatt 80 PLSTEP burst mechanism.
//!
//! From Klatt 1980 "Software for a Cascade/Parallel Formant Synthesizer":
//! > "A step function, PLSTEP, is included in order to simulate plosive bursts...
//! > The generator is triggered on by a sudden increase in AF or AH of 49 dB or more."
//!
//! From PARCOE.FOR in the appendix:
//! ```fortran
//! C ADD A STEP TO WAVEFORM AT A PLOSIVE RELEASE
//! PLSTEP=0.
//! IF (NNAF-NAFLAS.LT.49) GO TO 151
//! PLSTEP=GETAMP(NNGO+NDBSCA(11)+44)
//! 151 NAFLAS=NNAF
//! ```
//!
//! This module detects when a parameter (typically AF or AH) increases by
//! a threshold amount (default 49 dB), outputting a single-sample trigger pulse.

#[repr(C)]
pub struct EdgeDetector {
    /// Previous input value for comparison
    prev_value: f32,
    /// Delta threshold to trigger (default: 49.0 for Klatt 80)
    threshold: f32,
}

impl EdgeDetector {
    fn new() -> Self {
        Self {
            prev_value: 0.0,
            threshold: 49.0,
        }
    }

    fn set_threshold(&mut self, threshold: f32) {
        if threshold.is_finite() && threshold > 0.0 {
            self.threshold = threshold;
        }
    }

    /// Process a single input value, returning 1.0 if threshold crossed, 0.0 otherwise.
    /// Updates prev_value for next comparison.
    #[inline]
    fn process_sample(&mut self, input: f32, threshold: f32) -> f32 {
        let delta = input - self.prev_value;
        let triggered = if delta >= threshold { 1.0 } else { 0.0 };
        self.prev_value = input;
        triggered
    }

    /// Process a block of samples.
    /// For each sample, compares current input to previous input.
    /// Outputs 1.0 for one sample when threshold is crossed, 0.0 otherwise.
    fn process(&mut self, input: &[f32], output: &mut [f32], threshold: f32) {
        let thresh = if threshold.is_finite() && threshold > 0.0 {
            threshold
        } else {
            self.threshold
        };

        for (i, &x) in input.iter().enumerate() {
            output[i] = self.process_sample(x, thresh);
        }
    }

    /// Reset state (useful for re-initialization)
    fn reset(&mut self) {
        self.prev_value = 0.0;
    }
}

// =============================================================================
// FFI exports
// =============================================================================

#[no_mangle]
pub extern "C" fn edge_detector_new() -> *mut EdgeDetector {
    Box::into_raw(Box::new(EdgeDetector::new()))
}

#[no_mangle]
pub extern "C" fn edge_detector_free(ptr: *mut EdgeDetector) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn edge_detector_set_threshold(ptr: *mut EdgeDetector, threshold: f32) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_threshold(threshold);
    }
}

#[no_mangle]
pub extern "C" fn edge_detector_reset(ptr: *mut EdgeDetector) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).reset();
    }
}

#[no_mangle]
pub extern "C" fn edge_detector_process(
    ptr: *mut EdgeDetector,
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
    threshold: f32,
) {
    if ptr.is_null() || input_ptr.is_null() || output_ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let ed = &mut *ptr;
        let thresh = if threshold.is_finite() && threshold > 0.0 {
            threshold
        } else {
            ed.threshold
        };

        for i in 0..len {
            let x = *input_ptr.add(i);
            let delta = x - ed.prev_value;
            let triggered = if delta >= thresh { 1.0 } else { 0.0 };
            ed.prev_value = x;
            *output_ptr.add(i) = triggered;
        }
    }
}

// =============================================================================
// Memory allocation helpers (same pattern as other crates)
// =============================================================================

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
