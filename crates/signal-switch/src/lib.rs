//! Signal Switch - N-to-1 signal selector for Klatt 80 SW parameter
//!
//! From Klatt 1980: "The switch SW controls whether the cascade or parallel
//! branch is excited... SW = 0 selects the cascade branch, SW = 1 selects
//! the parallel branch."
//!
//! This primitive implements instantaneous (no crossfade) switching because:
//! 1. SW changes happen at phoneme boundaries
//! 2. One branch should be silent (amplitude = 0) when switching
//! 3. Crossfading would introduce artifacts

/// Signal switch state (stateless - purely combinatorial)
#[repr(C)]
pub struct SignalSwitch;

impl SignalSwitch {
    fn new() -> Self {
        Self
    }

    /// Select between two inputs based on selector value
    /// - selector < 0.5: returns input0 (cascade branch, SW=0)
    /// - selector >= 0.5: returns input1 (parallel branch, SW=1)
    #[inline]
    fn select(&self, input0: f32, input1: f32, selector: f32) -> f32 {
        if selector < 0.5 {
            input0
        } else {
            input1
        }
    }
}

#[no_mangle]
pub extern "C" fn signal_switch_new() -> *mut SignalSwitch {
    Box::into_raw(Box::new(SignalSwitch::new()))
}

#[no_mangle]
pub extern "C" fn signal_switch_free(ptr: *mut SignalSwitch) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

/// Process a block of samples, selecting between input0 and input1 based on selector
///
/// # Safety
/// - All pointers must be valid and point to arrays of at least `len` elements
/// - ptr must be a valid SignalSwitch pointer from signal_switch_new()
#[no_mangle]
pub extern "C" fn signal_switch_process(
    ptr: *mut SignalSwitch,
    input0_ptr: *const f32,
    input1_ptr: *const f32,
    selector_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null()
        || input0_ptr.is_null()
        || input1_ptr.is_null()
        || selector_ptr.is_null()
        || output_ptr.is_null()
        || len == 0
    {
        return;
    }

    unsafe {
        let sw = &*ptr;
        for i in 0..len {
            let in0 = *input0_ptr.add(i);
            let in1 = *input1_ptr.add(i);
            let sel = *selector_ptr.add(i);
            *output_ptr.add(i) = sw.select(in0, in1, sel);
        }
    }
}

/// Process with k-rate selector (single selector value for entire block)
///
/// # Safety
/// - All pointers must be valid and point to arrays of at least `len` elements
/// - ptr must be a valid SignalSwitch pointer from signal_switch_new()
#[no_mangle]
pub extern "C" fn signal_switch_process_krate(
    ptr: *mut SignalSwitch,
    input0_ptr: *const f32,
    input1_ptr: *const f32,
    selector: f32,
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null()
        || input0_ptr.is_null()
        || input1_ptr.is_null()
        || output_ptr.is_null()
        || len == 0
    {
        return;
    }

    unsafe {
        let _sw = &*ptr;
        // For k-rate, selector doesn't change within block
        if selector < 0.5 {
            // Copy input0 to output
            for i in 0..len {
                *output_ptr.add(i) = *input0_ptr.add(i);
            }
        } else {
            // Copy input1 to output
            for i in 0..len {
                *output_ptr.add(i) = *input1_ptr.add(i);
            }
        }
    }
}

// Re-export WASM memory allocation functions
klatt_wasm_common::export_alloc_fns!();
