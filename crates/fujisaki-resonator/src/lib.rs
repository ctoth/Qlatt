//! Resonator with Fujisaki-style history compensation when formant frequency drops.
//!
//! Reference: klsyn88 parwv.c setabc + F2/F3 compensation blocks.

#![allow(clippy::missing_safety_doc)]

use core::f32::consts::PI;

#[repr(C)]
pub struct FujisakiResonator {
    y1: f32,
    y2: f32,
    a: f32,
    b: f32,
    c: f32,
    prev_freq: i32,
    anorm: f32,
}

impl FujisakiResonator {
    fn new() -> Self {
        Self {
            y1: 0.0,
            y2: 0.0,
            a: 1.0,
            b: 0.0,
            c: 0.0,
            prev_freq: 0,
            anorm: 0.0,
        }
    }

    fn set_params(&mut self, freq: f32, bw: f32, sample_rate: f32) {
        if !freq.is_finite() || !bw.is_finite() || !sample_rate.is_finite() || sample_rate <= 0.0 {
            self.a = 1.0;
            self.b = 0.0;
            self.c = 0.0;
            self.y1 = 0.0;
            self.y2 = 0.0;
            self.prev_freq = 0;
            self.anorm = 0.0;
            return;
        }

        let freq_i = freq.round() as i32;
        let bw_i = bw.round() as i32;
        let f = (freq_i as f32).max(0.0);
        let b = (bw_i as f32).max(0.0);

        let r = (-PI * b / sample_rate).exp();
        self.c = -(r * r);
        self.b = 2.0 * r * (2.0 * PI * f / sample_rate).cos();
        self.a = 1.0 - self.b - self.c;

        if self.prev_freq != 0 && freq_i < self.prev_freq {
            self.anorm = (freq_i as f32) / self.anorm;
            self.y1 *= self.anorm;
            self.y2 *= self.anorm;
        }
        self.prev_freq = freq_i;
        self.anorm = freq_i as f32;
    }

    fn process(&mut self, input: &[f32], output: &mut [f32]) {
        for (i, x) in input.iter().enumerate() {
            let y = self.a * x + self.b * self.y1 + self.c * self.y2;
            self.y2 = self.y1;
            self.y1 = y;
            output[i] = y;
        }
    }
}

#[no_mangle]
pub extern "C" fn fujisaki_resonator_new() -> *mut FujisakiResonator {
    Box::into_raw(Box::new(FujisakiResonator::new()))
}

#[no_mangle]
pub extern "C" fn fujisaki_resonator_free(ptr: *mut FujisakiResonator) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn fujisaki_resonator_set_params(
    ptr: *mut FujisakiResonator,
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
pub extern "C" fn fujisaki_resonator_process(
    ptr: *mut FujisakiResonator,
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
