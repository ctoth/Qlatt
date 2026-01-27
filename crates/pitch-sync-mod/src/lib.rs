//! Pitch-synchronous F1/B1 resonator for cascade vocal tract.
//!
//! Implements Klatt 88 pitch-sync modulation: F1 and B1 are increased
//! during the open phase of each glottal cycle to simulate acoustic
//! coupling between glottis and vocal tract.
//!
//! Reference: klsyn88 parwv.c lines 103-145

#![allow(clippy::too_many_arguments)]
#![allow(clippy::missing_safety_doc)]

use klatt_wasm_common::export_alloc_fns;
use std::f32::consts::PI;

export_alloc_fns!();

#[repr(C)]
pub struct PitchSyncResonator {
    sample_rate: f32,

    // Period tracking
    period_len: usize,
    pos_in_period: usize,
    open_len: usize,

    // Base parameters
    base_freq: f32,
    base_bw: f32,

    // Delta parameters (added during open phase)
    delta_freq: f32,
    delta_bw: f32,

    // Current active parameters
    active_freq: f32,
    active_bw: f32,

    // Resonator state
    y1: f32,
    y2: f32,

    // Resonator coefficients (matching resonator crate naming convention)
    a: f32,  // input coefficient
    b: f32,  // y1 coefficient
    c: f32,  // y2 coefficient
}

impl PitchSyncResonator {
    pub fn new(sample_rate: f32) -> Self {
        let mut res = Self {
            sample_rate,
            period_len: (sample_rate / 100.0) as usize,
            pos_in_period: 0,
            open_len: 0,
            base_freq: 500.0,
            base_bw: 80.0,
            delta_freq: 0.0,
            delta_bw: 0.0,
            active_freq: 500.0,
            active_bw: 80.0,
            y1: 0.0,
            y2: 0.0,
            a: 1.0,
            b: 0.0,
            c: 0.0,
        };
        res.compute_coefficients();
        res
    }

    pub fn reset(&mut self) {
        self.pos_in_period = 0;
        self.y1 = 0.0;
        self.y2 = 0.0;
    }

    fn compute_coefficients(&mut self) {
        // Basic validation - clamp to reasonable values.
        let freq = self.active_freq.clamp(20.0, self.sample_rate * 0.49);
        let bw = self.active_bw.clamp(10.0, 4000.0);

        // Match existing resonator crate formula exactly
        // Reference: crates/resonator/src/lib.rs lines 42-44
        self.c = -f32::exp(-2.0 * PI * bw / self.sample_rate);
        self.b = 2.0 * f32::exp(-PI * bw / self.sample_rate)
                     * f32::cos(2.0 * PI * freq / self.sample_rate);
        self.a = 1.0 - self.b - self.c;
    }

    pub fn process(
        &mut self,
        input: f32,
        f0: f32,
        open_quotient: f32,
        frequency: f32,
        bandwidth: f32,
        delta_freq: f32,
        delta_bw: f32,
    ) -> f32 {
        // Update base parameters
        self.base_freq = frequency;
        self.base_bw = bandwidth;
        self.delta_freq = delta_freq;
        self.delta_bw = delta_bw;

        // At period boundary, recalculate timing
        if self.pos_in_period == 0 {
            // klsyn88 enforces a minimum open phase of ~1 ms (at 4x oversampling).
            // We approximate that at the base sample rate.
            let f0_hz = if f0.is_finite() { f0.max(20.0) } else { 20.0 };
            self.period_len = ((self.sample_rate / f0_hz) as usize).max(1);

            let min_open = (self.sample_rate * 0.001) as usize;
            let mut open_len =
                ((self.period_len as f32) * open_quotient.clamp(0.01, 0.99)) as usize;
            open_len = open_len.max(1).max(min_open);
            if open_len >= self.period_len {
                open_len = self.period_len.saturating_sub(1).max(1);
            }
            self.open_len = open_len;

            // At glottis open: apply delta
            self.active_freq = self.base_freq + self.delta_freq;
            self.active_bw = self.base_bw + self.delta_bw;
            self.compute_coefficients();
        }

        // At glottis close: restore base values
        if self.pos_in_period == self.open_len {
            self.active_freq = self.base_freq;
            self.active_bw = self.base_bw;
            self.compute_coefficients();
        }

        // Two-pole resonator filter (matching resonator crate equation)
        // Reference: crates/resonator/src/lib.rs line 67
        let output = self.a * input + self.b * self.y1 + self.c * self.y2;
        self.y2 = self.y1;
        self.y1 = output;

        // Advance period counter
        self.pos_in_period += 1;
        if self.pos_in_period >= self.period_len {
            self.pos_in_period = 0;
        }

        output
    }
}

// FFI exports
#[no_mangle]
pub extern "C" fn pitch_sync_resonator_new(sample_rate: f32) -> *mut PitchSyncResonator {
    Box::into_raw(Box::new(PitchSyncResonator::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn pitch_sync_resonator_free(ptr: *mut PitchSyncResonator) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn pitch_sync_resonator_reset(ptr: *mut PitchSyncResonator) {
    if let Some(res) = ptr.as_mut() {
        res.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn pitch_sync_resonator_process(
    ptr: *mut PitchSyncResonator,
    input: f32,
    f0: f32,
    open_quotient: f32,
    frequency: f32,
    bandwidth: f32,
    delta_freq: f32,
    delta_bw: f32,
) -> f32 {
    if let Some(res) = ptr.as_mut() {
        res.process(input, f0, open_quotient, frequency, bandwidth, delta_freq, delta_bw)
    } else {
        0.0
    }
}
