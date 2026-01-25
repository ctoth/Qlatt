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
        if a == 0.0 {
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
        let ar = &mut *ptr;
        if ar.bypass {
            for i in 0..len {
                let x = *input_ptr.add(i);
                *output_ptr.add(i) = x * ar.gain;
            }
            return;
        }

        for i in 0..len {
            let x = *input_ptr.add(i);
            let y = ar.a0 * x + ar.b1 * ar.x1 + ar.b2 * ar.x2;
            ar.x2 = ar.x1;
            ar.x1 = x;
            *output_ptr.add(i) = y * ar.gain;
        }
    }
}

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
