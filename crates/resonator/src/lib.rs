use core::f32::consts::PI;

#[repr(C)]
pub struct Resonator {
    y1: f32,
    y2: f32,
    a1: f32,
    a2: f32,
    b0: f32,
    gain: f32,
    bypass: bool,
}

impl Resonator {
    fn new() -> Self {
        Self {
            y1: 0.0,
            y2: 0.0,
            a1: 0.0,
            a2: 0.0,
            b0: 0.0,
            gain: 1.0,
            bypass: true,
        }
    }

    fn set_params(&mut self, freq: f32, bw: f32, sample_rate: f32) {
        if !freq.is_finite()
            || !bw.is_finite()
            || !sample_rate.is_finite()
            || sample_rate <= 0.0
            || bw <= 0.0
            || freq < 0.0
            || freq >= sample_rate * 0.5
        {
            self.bypass = true;
            self.y1 = 0.0;
            self.y2 = 0.0;
            return;
        }

        let c = -f32::exp(-2.0 * PI * bw / sample_rate);
        let b = 2.0 * f32::exp(-PI * bw / sample_rate) * f32::cos(2.0 * PI * freq / sample_rate);
        let a = 1.0 - b - c;

        self.b0 = a;
        self.a1 = b;
        self.a2 = c;
        self.bypass = false;
    }

    fn set_gain(&mut self, gain: f32) {
        if gain.is_finite() {
            self.gain = gain;
        }
    }

    fn process(&mut self, input: &[f32], output: &mut [f32]) {
        if self.bypass {
            for (i, x) in input.iter().enumerate() {
                output[i] = x * self.gain;
            }
            return;
        }

        for (i, x) in input.iter().enumerate() {
            let y = self.b0 * x + self.a1 * self.y1 + self.a2 * self.y2;
            self.y2 = self.y1;
            self.y1 = y;
            output[i] = y * self.gain;
        }
    }
}

#[no_mangle]
pub extern "C" fn resonator_new() -> *mut Resonator {
    Box::into_raw(Box::new(Resonator::new()))
}

#[no_mangle]
pub extern "C" fn resonator_free(ptr: *mut Resonator) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn resonator_set_params(ptr: *mut Resonator, freq: f32, bw: f32, sample_rate: f32) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_params(freq, bw, sample_rate);
    }
}

#[no_mangle]
pub extern "C" fn resonator_set_gain(ptr: *mut Resonator, gain: f32) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_gain(gain);
    }
}

#[no_mangle]
pub extern "C" fn resonator_process(
    ptr: *mut Resonator,
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null() || input_ptr.is_null() || output_ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let input = core::slice::from_raw_parts(input_ptr, len);
        let output = core::slice::from_raw_parts_mut(output_ptr, len);
        (*ptr).process(input, output);
    }
}

// Re-export WASM memory allocation functions
klatt_wasm_common::export_alloc_fns!();
