//! Biquad notch (band-reject) filter for nasal antiformants.
//!
//! Uses the Audio EQ Cookbook (Robert Bristow-Johnson) biquad notch design,
//! which is numerically stable at any sample rate.  The Klatt (1980) FIR
//! antiresonator computes coefficients via 1/a where a → 0 at high sample
//! rates, producing gains of 900x+ at 48 kHz.  This biquad notch creates
//! the same spectral zero with all coefficients near unity.
//!
//! Reference: Bristow-Johnson, "Audio EQ Cookbook" (2005)

use core::f32::consts::PI;

#[repr(C)]
pub struct BiquadNotch {
    // Feedforward coefficients (numerator)
    b0: f32,
    b1: f32,
    b2: f32,
    // Feedback coefficients (denominator, negated for difference equation)
    a1: f32,
    a2: f32,
    // State
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
    gain: f32,
    bypass: bool,
}

impl BiquadNotch {
    fn new() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            gain: 1.0,
            bypass: true,
        }
    }

    /// Compute biquad notch coefficients from the Audio EQ Cookbook.
    ///
    /// freq: center frequency of the notch (Hz)
    /// bw:   3 dB bandwidth (Hz)
    /// sample_rate: audio sample rate (Hz)
    fn set_params(&mut self, freq: f32, bw: f32, sample_rate: f32) {
        if !freq.is_finite()
            || !bw.is_finite()
            || !sample_rate.is_finite()
            || sample_rate <= 0.0
            || bw <= 0.0
            || freq <= 0.0
            || freq >= sample_rate * 0.5
        {
            self.bypass = true;
            self.x1 = 0.0;
            self.x2 = 0.0;
            self.y1 = 0.0;
            self.y2 = 0.0;
            return;
        }

        let w0 = 2.0 * PI * freq / sample_rate;
        let sin_w0 = f32::sin(w0);
        let cos_w0 = f32::cos(w0);

        // Q = freq / bw gives constant-bandwidth behaviour matching Klatt's BW parameter.
        let q = freq / bw;
        // alpha controls the notch width
        let alpha = sin_w0 / (2.0 * q);

        // Notch filter coefficients (Bristow-Johnson Audio EQ Cookbook):
        //   b0 =  1
        //   b1 = -2*cos(w0)
        //   b2 =  1
        //   a0 =  1 + alpha
        //   a1 = -2*cos(w0)
        //   a2 =  1 - alpha
        let a0_inv = 1.0 / (1.0 + alpha);

        self.b0 = a0_inv;               // 1 / a0
        self.b1 = -2.0 * cos_w0 * a0_inv; // b1 / a0
        self.b2 = a0_inv;               // 1 / a0
        self.a1 = -2.0 * cos_w0 * a0_inv; // a1 / a0 (same as b1 for notch)
        self.a2 = (1.0 - alpha) * a0_inv;  // a2 / a0
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

        let mut x1 = self.x1;
        let mut x2 = self.x2;
        let mut y1 = self.y1;
        let mut y2 = self.y2;
        for (out, x) in output.iter_mut().zip(input) {
            // Direct Form I biquad:
            // y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
            let y = self.b0 * x + self.b1 * x1 + self.b2 * x2 - self.a1 * y1 - self.a2 * y2;
            x2 = x1;
            x1 = *x;
            y2 = y1;
            y1 = y;
            *out = y * self.gain;
        }
        self.x1 = x1;
        self.x2 = x2;
        self.y1 = y1;
        self.y2 = y2;
    }
}

// --- FFI ---

#[no_mangle]
pub extern "C" fn biquad_notch_new() -> *mut BiquadNotch {
    Box::into_raw(Box::new(BiquadNotch::new()))
}

#[no_mangle]
pub extern "C" fn biquad_notch_free(ptr: *mut BiquadNotch) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn biquad_notch_set_params(
    ptr: *mut BiquadNotch,
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
pub extern "C" fn biquad_notch_set_gain(ptr: *mut BiquadNotch, gain: f32) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_gain(gain);
    }
}

#[no_mangle]
pub extern "C" fn biquad_notch_process(
    ptr: *mut BiquadNotch,
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

klatt_wasm_common::export_alloc_fns!();

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bypasses_at_freq_zero() {
        let mut f = BiquadNotch::new();
        f.set_params(0.0, 100.0, 48000.0);
        assert!(f.bypass, "freq=0 should trigger bypass");
    }

    #[test]
    fn coefficients_near_unity() {
        // The whole point: coefficients should be well-behaved at 48 kHz
        let mut f = BiquadNotch::new();
        f.set_params(480.0, 100.0, 48000.0);
        assert!(!f.bypass);
        // All coefficients should be in [-2, 2] range
        assert!(f.b0.abs() < 2.0, "b0={} too large", f.b0);
        assert!(f.b1.abs() < 2.0, "b1={} too large", f.b1);
        assert!(f.b2.abs() < 2.0, "b2={} too large", f.b2);
        assert!(f.a1.abs() < 2.0, "a1={} too large", f.a1);
        assert!(f.a2.abs() < 2.0, "a2={} too large", f.a2);
    }

    #[test]
    fn unity_gain_at_dc() {
        // Notch filter should pass DC unchanged
        let mut f = BiquadNotch::new();
        f.set_params(480.0, 100.0, 48000.0);
        // Feed DC signal (all 1.0) and check steady-state output ≈ 1.0
        let input = [1.0f32; 256];
        let mut output = [0.0f32; 256];
        f.process(&input, &mut output);
        // Last sample should be close to 1.0 (steady state)
        let last = output[255];
        assert!(
            (last - 1.0).abs() < 0.02,
            "DC gain should be ~1.0, got {}",
            last
        );
    }

    #[test]
    fn notch_at_center_frequency() {
        // Feed a sine at the notch frequency; output should be attenuated
        let mut f = BiquadNotch::new();
        let sr = 48000.0;
        let freq = 480.0;
        f.set_params(freq, 100.0, sr);

        let n = 4096;
        let input: Vec<f32> = (0..n)
            .map(|i| f32::sin(2.0 * PI * freq * i as f32 / sr))
            .collect();
        let mut output = vec![0.0f32; n];
        f.process(&input, &mut output);

        // Measure RMS of last 1024 samples (steady state)
        let tail = &output[n - 1024..];
        let rms: f32 = (tail.iter().map(|x| x * x).sum::<f32>() / 1024.0).sqrt();
        // Notch should attenuate significantly (< 0.1 of input RMS ≈ 0.707)
        assert!(rms < 0.1, "Notch RMS at center freq should be < 0.1, got {}", rms);
    }

    #[test]
    fn no_explosion_at_48khz() {
        // The critical test: processing speech-like signal should not explode
        let mut f = BiquadNotch::new();
        f.set_params(250.0, 100.0, 48000.0);

        // Input: unit amplitude signal
        let input = [1.0f32; 128];
        let mut output = [0.0f32; 128];
        f.process(&input, &mut output);

        // No sample should exceed 2.0 (the old antiresonator hit 900+)
        let max = output.iter().map(|x| x.abs()).fold(0.0f32, f32::max);
        assert!(max < 2.0, "Max output should be < 2.0, got {}", max);
    }
}
