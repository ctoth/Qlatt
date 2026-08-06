use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

/// Linearized tilt table from klsyn88 (c/parwv.c lines 706-711)
/// Maps TLTdb (0-34) to decay coefficient for one-pole lowpass
/// "E.g. if you request 3 dB of tilt at 2500 Hz, decay = .233"
static TILT_TABLE: [f32; 35] = [
    0.000, 0.100, 0.167, 0.233, 0.300, 0.367, 0.433, 0.467, 0.500, 0.533, // 0-9
    0.567, 0.600, 0.633, 0.667, 0.700, 0.730, 0.750, 0.770, 0.790, 0.810, // 10-19
    0.825, 0.840, 0.855, 0.870, 0.885, 0.900, 0.915, 0.925, 0.935, 0.945, // 20-29
    0.955, 0.965, 0.975, 0.985, 0.995, // 30-34
];

#[repr(C)]
pub struct TiltFilter {
    y1: f32,           // Filter state
    decay: f32,        // Decay coefficient from table
    one_minus_decay: f32, // 1 - decay for efficiency
}

impl TiltFilter {
    pub fn new() -> Self {
        Self {
            y1: 0.0,
            decay: 0.0,
            one_minus_decay: 1.0,
        }
    }

    pub fn reset(&mut self) {
        self.y1 = 0.0;
    }

    pub fn set_tilt(&mut self, tilt_db: i32) {
        let idx = tilt_db.clamp(0, 34) as usize;
        self.decay = TILT_TABLE[idx];
        self.one_minus_decay = 1.0 - self.decay;
    }

    pub fn process(&mut self, input: f32) -> f32 {
        // One-pole lowpass: y[n] = (1-decay) * x[n] + decay * y[n-1]
        let output = self.one_minus_decay * input + self.decay * self.y1;
        self.y1 = output;
        output
    }

    pub fn process_block(&mut self, input: &[f32], output: &mut [f32]) {
        for (out, sample) in output.iter_mut().zip(input) {
            *out = self.process(klatt_wasm_common::normalize_worklet_sample(*sample));
        }
    }
}

// FFI exports
#[no_mangle]
pub extern "C" fn tilt_filter_new() -> *mut TiltFilter {
    Box::into_raw(Box::new(TiltFilter::new()))
}

#[no_mangle]
pub unsafe extern "C" fn tilt_filter_free(ptr: *mut TiltFilter) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn tilt_filter_reset(ptr: *mut TiltFilter) {
    if let Some(filter) = ptr.as_mut() {
        filter.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn tilt_filter_set_tilt(ptr: *mut TiltFilter, tilt_db: i32) {
    if let Some(filter) = ptr.as_mut() {
        filter.set_tilt(tilt_db);
    }
}

#[no_mangle]
pub unsafe extern "C" fn tilt_filter_process(ptr: *mut TiltFilter, input: f32) -> f32 {
    if let Some(filter) = ptr.as_mut() {
        filter.process(input)
    } else {
        0.0
    }
}

#[no_mangle]
pub unsafe extern "C" fn tilt_filter_process_block(
    ptr: *mut TiltFilter,
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null() || input_ptr.is_null() || output_ptr.is_null() || len == 0 {
        return;
    }
    let input = core::slice::from_raw_parts(input_ptr, len);
    let output = core::slice::from_raw_parts_mut(output_ptr, len);
    (*ptr).process_block(input, output);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn block_api_is_bit_identical_to_scalar_worklet_calls() {
        let input = [1.0_f32, -0.0, f32::NAN, -0.25, 0.5, f32::from_bits(1)];
        let mut scalar = TiltFilter::new();
        let mut block = TiltFilter::new();
        scalar.set_tilt(17);
        block.set_tilt(17);

        let expected: Vec<f32> = input
            .iter()
            .map(|sample| scalar.process(klatt_wasm_common::normalize_worklet_sample(*sample)))
            .collect();
        let mut actual = [0.0_f32; 6];
        block.process_block(&input, &mut actual);

        assert_eq!(
            actual.map(f32::to_bits).as_slice(),
            expected
                .iter()
                .copied()
                .map(f32::to_bits)
                .collect::<Vec<_>>()
        );
    }
}
