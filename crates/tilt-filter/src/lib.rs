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
