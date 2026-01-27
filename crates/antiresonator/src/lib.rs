use core::f32::consts::PI;

#[repr(C)]
pub struct AntiResonator {
    x1: f32,
    x2: f32,
    a0: f32,
    b1: f32,
    b2: f32,
    gain: f32,
    bypass: bool,
}

impl AntiResonator {
    fn new() -> Self {
        Self {
            x1: 0.0,
            x2: 0.0,
            a0: 1.0,
            b1: 0.0,
            b2: 0.0,
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
            self.x1 = 0.0;
            self.x2 = 0.0;
            self.a0 = 1.0;
            return;
        }

        let c = -f32::exp(-2.0 * PI * bw / sample_rate);
        let b = 2.0 * f32::exp(-PI * bw / sample_rate) * f32::cos(2.0 * PI * freq / sample_rate);
        let a = 1.0 - b - c;
        if a.abs() < 1e-6 {
            self.bypass = true;
            self.x1 = 0.0;
            self.x2 = 0.0;
            self.a0 = 1.0;
            return;
        }
        let a0 = 1.0 / a;

        self.a0 = a0;
        self.b1 = -a0 * b;
        self.b2 = -a0 * c;
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
            let y = self.a0 * x + self.b1 * self.x1 + self.b2 * self.x2;
            self.x2 = self.x1;
            self.x1 = *x;
            output[i] = y * self.gain;
        }
    }
}

#[no_mangle]
pub extern "C" fn antiresonator_new() -> *mut AntiResonator {
    Box::into_raw(Box::new(AntiResonator::new()))
}

#[no_mangle]
pub extern "C" fn antiresonator_free(ptr: *mut AntiResonator) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn antiresonator_set_params(
    ptr: *mut AntiResonator,
    freq: f32,
    bw: f32,
    sample_rate: f32,
) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_params(freq, bw, sample_rate);
    }
}

#[no_mangle]
pub extern "C" fn antiresonator_set_gain(ptr: *mut AntiResonator, gain: f32) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_gain(gain);
    }
}

#[no_mangle]
pub extern "C" fn antiresonator_process(
    ptr: *mut AntiResonator,
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
