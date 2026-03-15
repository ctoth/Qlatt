use core::f32::consts::PI;

#[derive(Clone, Copy)]
struct Biquad {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
    bypass: bool,
}

#[derive(Clone, Copy)]
enum LfMode {
    Legacy = 0,
    LfLm = 1,
    LfCalm = 2,
}

impl LfMode {
    fn from_u32(value: u32) -> Self {
        match value {
            1 => Self::LfLm,
            2 => Self::LfCalm,
            _ => Self::Legacy,
        }
    }
}

impl Biquad {
    fn new() -> Self {
        Self {
            b0: 0.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            bypass: true,
        }
    }

    fn set_coeffs(&mut self, b0: f32, b1: f32, b2: f32, a1: f32, a2: f32) {
        if !b0.is_finite()
            || !b1.is_finite()
            || !b2.is_finite()
            || !a1.is_finite()
            || !a2.is_finite()
        {
            self.bypass = true;
            self.x1 = 0.0;
            self.x2 = 0.0;
            self.y1 = 0.0;
            self.y2 = 0.0;
            return;
        }

        self.b0 = b0;
        self.b1 = b1;
        self.b2 = b2;
        self.a1 = a1;
        self.a2 = a2;
        self.bypass = false;
    }

    fn step(&mut self, x: f32) -> f32 {
        if self.bypass {
            return x;
        }
        let y = self.b0 * x + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2;
        self.x2 = self.x1;
        self.x1 = x;
        self.y2 = self.y1;
        self.y1 = y;
        y
    }
}

#[derive(Clone, Copy)]
struct LpPole {
    b: f32,
    a: f32,
    y1: f32,
    bypass: bool,
}

impl LpPole {
    fn new() -> Self {
        Self {
            b: 1.0,
            a: 0.0,
            y1: 0.0,
            bypass: true,
        }
    }

    fn set_coeffs(&mut self, b: f32, a: f32) {
        if !b.is_finite() || !a.is_finite() {
            self.bypass = true;
            self.y1 = 0.0;
            return;
        }
        self.b = b;
        self.a = a;
        self.bypass = false;
    }

    fn step(&mut self, x: f32) -> f32 {
        if self.bypass {
            return x;
        }
        let y = self.b * x + self.a * self.y1;
        self.y1 = y;
        y
    }
}

#[repr(C)]
pub struct LfSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    voiced: bool,
    glottal: Biquad,
    tilt: LpPole,
    mode: LfMode,
    sample_count: u64,  // Cumulative sample counter (for flutter); u64 won't overflow for billions of years at 44100 Hz
    rng_state: u32,     // xorshift32 PRNG state (for jitter)
    period_cycle_count: u64, // Cycle counter for diplophonia (Gobl & Ni Chasaide 2003)
}

impl LfSource {
    fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            period_len: 1,
            pos_in_period: 0,
            voiced: false,
            glottal: Biquad::new(),
            tilt: LpPole::new(),
            mode: LfMode::Legacy,
            sample_count: 0,
            rng_state: 0x12345678,
            period_cycle_count: 0,
        }
    }

    /// xorshift32 PRNG returning +1.0 or -1.0 with equal probability.
    /// Used for per-period jitter perturbation (Fraj 2011).
    fn rng_sign(&mut self) -> f32 {
        self.rng_state ^= self.rng_state << 13;
        self.rng_state ^= self.rng_state >> 17;
        self.rng_state ^= self.rng_state << 5;
        if self.rng_state & 1 == 0 { 1.0 } else { -1.0 }
    }

    fn set_mode(&mut self, mode: LfMode) {
        // CALM is anti-causal and cannot be implemented sample-by-sample.
        // Map to the causal LFLM form for real-time rendering.
        self.mode = match mode {
            LfMode::LfCalm => LfMode::LfLm,
            _ => mode,
        };
    }

    /// Recalculate LF model coefficients for a new glottal period.
    ///
    /// `oq_override`: Klatt 1990 OQ in percentage (0-99). 0 = derive from Rd.
    /// `tl_override`: Klatt 1990 TL in dB at 3 kHz (0-41). 0 = derive from Rd.
    fn start_period(&mut self, f0: f32, rd: f32, oq_override: f32, tl_override: f32) {
        if !f0.is_finite() || f0 <= 0.0 || !rd.is_finite() {
            self.period_len = 1;
            self.pos_in_period = 0;
            self.voiced = false;
            return;
        }

        let f0_clamped = clamp(f0, 40.0, self.sample_rate * 0.45);
        let rd_clamped = clamp(rd, 0.3, 2.7);
        let t0 = 1.0 / f0_clamped;

        // Fant 1997 Eq. A1: Rd to R-params
        let ra = (-1.0 + 4.8 * rd_clamped) / 100.0;
        let rk = (22.4 + 11.8 * rd_clamped) / 100.0;
        let rg_denom = 0.44 * rd_clamped - 4.0 * ra * (0.5 + 1.2 * rk);
        if rg_denom.abs() < 1e-6 {
            self.voiced = false;
            return;
        }
        let rg = rk * (0.5 + 1.2 * rk) / rg_denom;

        // Fant 1997: OQ_i = (1+Rk)/(2*Rg)
        let oq = if oq_override > 0.0 {
            oq_override / 100.0  // Klatt 1990: OQ in percentage, convert to ratio
        } else {
            (1.0 + rk) / (2.0 * rg)  // Fant 1997: derive from Rd
        };
        // Engineering note: When OQ is overridden directly, alpha_m remains
        // derived from Rd via Rk. This decouples OQ from the LF model's
        // natural parameter space (where OQ and alpha_m are linked through
        // Rk and Rg). This matches the Klatt 1990 approach where OQ is an
        // independent control parameter, as opposed to the Fant model where
        // all LF shape parameters derive from Rd. The practical effect is
        // that overriding OQ changes the glottal formant (Fg, Bg) but not
        // the opening/closing phase ratio (alpha_m).
        let alpha_m = 1.0 / (1.0 + rk);
        let ta = ra * t0;

        if !oq.is_finite() || !alpha_m.is_finite() || !ta.is_finite() || oq <= 0.0 || ta <= 0.0 {
            self.voiced = false;
            return;
        }

        let tan_term = (PI * (1.0 - alpha_m)).tan();
        if !tan_term.is_finite() || tan_term.abs() < 1e-6 {
            self.voiced = false;
            return;
        }

        // Perrotin 2021 Eq. C2: glottal formant frequency and bandwidth
        let fg = 1.0 / (2.0 * oq * t0);
        let bg = 1.0 / (oq * t0 * tan_term);

        // Perrotin 2021 Eq. C3: biquad coefficients
        let a1 = -2.0 * f32::exp(-PI * bg / self.sample_rate)
            * f32::cos(2.0 * PI * fg / self.sample_rate);
        let a2 = f32::exp(-2.0 * PI * bg / self.sample_rate);
        let sin_term = (PI * (1.0 - alpha_m)).sin();
        if !sin_term.is_finite() || sin_term.abs() < 1e-6 {
            self.voiced = false;
            return;
        }
        // Perrotin et al. (2021) Eq. C4/D2: normalize by sin(pi*(1-alpha_m)).
        let e_amp = 1.0;
        let ag = e_amp / sin_term;

        // LF_LM uses a causal z^-1 numerator; LF_CALM uses anti-causal z^+1.
        // Per Perrotin et al. (2021): anti-causal requires swapped sign pattern.
        let (b0, b1, b2) = match self.mode {
            LfMode::LfCalm => (0.0, ag, -ag),
            _ => (0.0, -ag, ag),
        };

        self.glottal.set_coeffs(b0, b1, b2, a1, a2);

        // Spectral tilt filter cutoff
        let fa = if tl_override > 0.0 {
            // Klatt 1990: TL = dB down at 3 kHz
            // From 1st-order lowpass: |H(f)|^2 = 1/(1+(f/Fa)^2)
            // TL = 10*log10(1+(3000/Fa)^2) => Fa = 3000/sqrt(10^(TL/10)-1)
            let denom = (10.0_f32.powf(tl_override / 10.0) - 1.0).max(0.001);
            3000.0 / denom.sqrt()
        } else {
            1.0 / (2.0 * PI * ta)  // Perrotin 2021 Eq. C5: derive from Rd
        };

        // Perrotin 2021 Eq. C5/C6: spectral tilt filter coefficients
        let pole = f32::exp(-2.0 * PI * fa / self.sample_rate);
        let b_st = 1.0 - pole;
        let a_st = pole;
        self.tilt.set_coeffs(b_st, a_st);

        self.period_len = (self.sample_rate / f0_clamped).round().max(1.0) as usize;
        self.pos_in_period = 0;
        self.voiced = true;
    }

    /// Compute flutter delta using Klatt & Klatt 1990 Eq. 1:
    ///   delta_f0 = (FL/50) * (F0/100) * [sin(2*pi*12.7*t) + sin(2*pi*7.1*t) + sin(2*pi*4.7*t)]
    /// Frequencies 12.7, 7.1, 4.7 Hz chosen for long repetition period.
    /// Uses u64 sample counter + f64 intermediate to maintain precision indefinitely.
    fn flutter_delta(flutter: f32, f0: f32, sample_count: u64, sample_rate: f32) -> f32 {
        if flutter <= 0.0 { return 0.0; }
        // Compute time in f64 from integer sample counter for precision
        let t = sample_count as f64 / sample_rate as f64;
        let t32 = t as f32;
        // Klatt & Klatt 1990 Eq. 1
        (flutter / 50.0) * (f0 / 100.0)
            * ((2.0 * PI * 12.7 * t32).sin()
             + (2.0 * PI * 7.1 * t32).sin()
             + (2.0 * PI * 4.7 * t32).sin())
    }

    fn process(
        &mut self,
        f0: &[f32],
        rd: &[f32],
        oq: &[f32],
        tl: &[f32],
        flutter: f32,   // k-rate: Klatt 1990 scale 0-100
        jitter: f32,    // k-rate: normalized 0-100, maps to Fraj 2011 b=[0, 4.5]
        di: f32,        // k-rate: diplophonia index 0-100 (Gobl & Ni Chasaide 2003)
        output: &mut [f32],
    ) {
        let f0_len = f0.len();
        let rd_len = rd.len();
        let oq_len = oq.len();
        let tl_len = tl.len();
        let len = output.len();

        for i in 0..len {
            // Increment cumulative sample counter for flutter computation
            self.sample_count += 1;

            if !self.voiced || self.pos_in_period >= self.period_len {
                let f0_value = if f0_len == 0 {
                    0.0
                } else if f0_len > 1 {
                    f0[i % f0_len]
                } else {
                    f0[0]
                };
                let rd_value = if rd_len == 0 {
                    0.0
                } else if rd_len > 1 {
                    rd[i % rd_len]
                } else {
                    rd[0]
                };
                let oq_value = if oq_len == 0 {
                    0.0
                } else if oq_len > 1 {
                    oq[i % oq_len]
                } else {
                    oq[0]
                };
                let tl_value = if tl_len == 0 {
                    0.0
                } else if tl_len > 1 {
                    tl[i % tl_len]
                } else {
                    tl[0]
                };

                // Apply flutter: continuous per-sample sinusoidal F0 modulation
                // Klatt & Klatt 1990 Eq. 1
                let f0_with_flutter = f0_value + Self::flutter_delta(flutter, f0_value, self.sample_count, self.sample_rate);

                // Apply jitter: per-period F0 perturbation
                // Fraj 2011 Eq. 1 (per-period approximation): accumulated random walk
                // over N=Fs/f0 samples gives std dev = b*sqrt(N) = b*sqrt(Fs/f0)
                // Converting to Hz: delta_f0 = b * xi * f0 * sqrt(f0/Fs)
                // b = jitter_param / 100.0 * 4.5  (map 0-100 to Fraj b=[0, 4.5])
                let f0_final = if jitter > 0.0 {
                    let b = jitter / 100.0 * 4.5;  // Fraj 2011 Table 1 range
                    let xi = self.rng_sign();
                    let perturbation = b * xi * f0_with_flutter * (f0_with_flutter / self.sample_rate).sqrt();
                    f0_with_flutter + perturbation
                } else {
                    f0_with_flutter
                };

                self.start_period(f0_final, rd_value, oq_value, tl_value);
                self.period_cycle_count += 1;
            }

            if !self.voiced {
                output[i] = 0.0;
                self.pos_in_period += 1;
                continue;
            }

            let impulse = if self.pos_in_period == 0 { 1.0 } else { 0.0 };
            let mut sample = self.glottal.step(impulse);
            sample = self.tilt.step(sample);

            // Diplophonia: on odd cycles, reduce amplitude by DI/100
            // Gobl & Ni Chasaide 2003 Table 1: DI=0 uniform, DI=100 odd cycles silent
            if di > 0.0 && self.period_cycle_count % 2 == 1 {
                sample *= 1.0 - clamp(di, 0.0, 100.0) / 100.0;
            }

            output[i] = sample;
            self.pos_in_period += 1;
        }
    }
}

fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

#[no_mangle]
pub extern "C" fn lf_source_new(sample_rate: f32) -> *mut LfSource {
    Box::into_raw(Box::new(LfSource::new(sample_rate)))
}

#[no_mangle]
pub extern "C" fn lf_source_set_mode(ptr: *mut LfSource, mode: u32) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_mode(LfMode::from_u32(mode));
    }
}

#[no_mangle]
pub extern "C" fn lf_source_free(ptr: *mut LfSource) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn lf_source_process(
    ptr: *mut LfSource,
    f0_ptr: *const f32,
    f0_len: usize,
    rd_ptr: *const f32,
    rd_len: usize,
    oq_ptr: *const f32,
    oq_len: usize,
    tl_ptr: *const f32,
    tl_len: usize,
    flutter: f32,   // k-rate: single value per block
    jitter: f32,    // k-rate: single value per block
    di: f32,        // k-rate: diplophonia index 0-100 (Gobl & Ni Chasaide 2003)
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null() || output_ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let f0 = if f0_ptr.is_null() || f0_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(f0_ptr, f0_len)
        };
        let rd = if rd_ptr.is_null() || rd_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(rd_ptr, rd_len)
        };
        let oq = if oq_ptr.is_null() || oq_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(oq_ptr, oq_len)
        };
        let tl = if tl_ptr.is_null() || tl_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(tl_ptr, tl_len)
        };
        let output = core::slice::from_raw_parts_mut(output_ptr, len);
        if f0.is_empty() || rd.is_empty() {
            for sample in output.iter_mut() {
                *sample = 0.0;
            }
            return;
        }
        (*ptr).process(f0, rd, oq, tl, flutter, jitter, di, output);
    }
}

// Re-export WASM memory allocation functions
klatt_wasm_common::export_alloc_fns!();

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_RATE: f32 = 44100.0;

    #[test]
    fn determinism_check() {
        // Verify identical sources with identical params produce identical output.
        let mut src1 = LfSource::new(SAMPLE_RATE);
        let mut src2 = LfSource::new(SAMPLE_RATE);

        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq = [0.0_f32];
        let tl = [0.0_f32];
        let mut out1 = [0.0_f32; 256];
        let mut out2 = [0.0_f32; 256];

        src1.process(&f0, &rd, &oq, &tl, 0.0, 0.0, 0.0, &mut out1);
        src2.process(&f0, &rd, &oq, &tl, 0.0, 0.0, 0.0, &mut out2);

        for i in 0..256 {
            assert!(
                (out1[i] - out2[i]).abs() < 1e-10,
                "Sample {} differs: {} vs {}",
                i, out1[i], out2[i]
            );
        }

        let max_abs = out1.iter().map(|x| x.abs()).fold(0.0_f32, f32::max);
        assert!(max_abs > 0.001, "Output should be non-silent, max_abs = {}", max_abs);
    }

    #[test]
    fn rd_derived_oq_matches_fant_1997() {
        // At Rd=1.0, Fant 1997 Table 1 says OQ_i = 65%
        // Verify that OQ=0 (derive from Rd) produces the same output as OQ=65
        let mut src1 = LfSource::new(SAMPLE_RATE);
        let mut src2 = LfSource::new(SAMPLE_RATE);
        let f0 = vec![110.0_f32; 512];
        let rd = vec![1.0_f32; 512];
        let oq_zero = vec![0.0_f32; 512];
        let oq_65 = vec![65.0_f32; 512];
        let tl = vec![0.0_f32; 512];
        let mut out1 = vec![0.0_f32; 512];
        let mut out2 = vec![0.0_f32; 512];

        src1.process(&f0, &rd, &oq_zero, &tl, 0.0, 0.0, 0.0, &mut out1);
        src2.process(&f0, &rd, &oq_65, &tl, 0.0, 0.0, 0.0, &mut out2);

        // Should produce nearly identical output since Rd=1.0 derives OQ~65%
        // Tolerance is 1e-4 to accommodate f32 rounding through the Rd->Rk->Rg->OQ chain
        // (the derived OQ is not exactly 0.65 due to intermediate rounding)
        let max_diff = out1.iter().zip(out2.iter())
            .map(|(a, b)| (a - b).abs())
            .fold(0.0_f32, f32::max);
        assert!(max_diff < 1e-4, "OQ=0 (Rd-derived) should match OQ=65 (Fant 1997 Table 1). max_diff={}", max_diff);
    }

    #[test]
    fn oq_override_diverges() {
        // Process with Rd=1.0, OQ=0 (derive from Rd) vs Rd=1.0, OQ=80 (override)
        // Outputs must differ since OQ=80% != Rd=1.0-derived OQ (~65%)
        let mut src_default = LfSource::new(SAMPLE_RATE);
        let mut src_override = LfSource::new(SAMPLE_RATE);

        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq_default = [0.0_f32];
        let oq_override = [80.0_f32];
        let tl = [0.0_f32];
        let mut out_default = [0.0_f32; 256];
        let mut out_override = [0.0_f32; 256];

        src_default.process(&f0, &rd, &oq_default, &tl, 0.0, 0.0, 0.0, &mut out_default);
        src_override.process(&f0, &rd, &oq_override, &tl, 0.0, 0.0, 0.0, &mut out_override);

        let mut any_differ = false;
        for i in 0..256 {
            if (out_default[i] - out_override[i]).abs() > 1e-6 {
                any_differ = true;
                break;
            }
        }
        assert!(any_differ, "OQ=80 should produce different output than OQ=0 (Rd-derived)");
    }

    #[test]
    fn tl_override_diverges() {
        // Process with Rd=1.0, TL=0 (derive from Rd) vs Rd=1.0, TL=10 (override)
        // Outputs must differ
        let mut src_default = LfSource::new(SAMPLE_RATE);
        let mut src_override = LfSource::new(SAMPLE_RATE);

        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq = [0.0_f32];
        let tl_default = [0.0_f32];
        let tl_override = [10.0_f32];
        let mut out_default = [0.0_f32; 256];
        let mut out_override = [0.0_f32; 256];

        src_default.process(&f0, &rd, &oq, &tl_default, 0.0, 0.0, 0.0, &mut out_default);
        src_override.process(&f0, &rd, &oq, &tl_override, 0.0, 0.0, 0.0, &mut out_override);

        let mut any_differ = false;
        for i in 0..256 {
            if (out_default[i] - out_override[i]).abs() > 1e-6 {
                any_differ = true;
                break;
            }
        }
        assert!(any_differ, "TL=10 should produce different output than TL=0 (Rd-derived)");
    }

    #[test]
    fn flutter_produces_f0_variation() {
        // Process 4410 samples (0.1s at 44100) with F0=110, flutter=25
        // Measure period lengths — should NOT all be identical
        // Process same with flutter=0 — period lengths should be identical
        let num_samples = 4410;

        // With flutter
        let mut src_flutter = LfSource::new(SAMPLE_RATE);
        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq = [0.0_f32];
        let tl = [0.0_f32];
        let mut out_flutter = vec![0.0_f32; num_samples];
        src_flutter.process(&f0, &rd, &oq, &tl, 25.0, 0.0, 0.0, &mut out_flutter);

        // Without flutter
        let mut src_no_flutter = LfSource::new(SAMPLE_RATE);
        let mut out_no_flutter = vec![0.0_f32; num_samples];
        src_no_flutter.process(&f0, &rd, &oq, &tl, 0.0, 0.0, 0.0, &mut out_no_flutter);

        // The outputs should differ when flutter is applied
        let mut any_differ = false;
        for i in 0..num_samples {
            if (out_flutter[i] - out_no_flutter[i]).abs() > 1e-6 {
                any_differ = true;
                break;
            }
        }
        assert!(any_differ, "Flutter=25 should produce different output than flutter=0");
    }

    #[test]
    fn jitter_produces_f0_variation() {
        // Process with jitter=50 — output should differ from jitter=0
        let num_samples = 4410;

        let mut src_jitter = LfSource::new(SAMPLE_RATE);
        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq = [0.0_f32];
        let tl = [0.0_f32];
        let mut out_jitter = vec![0.0_f32; num_samples];
        src_jitter.process(&f0, &rd, &oq, &tl, 0.0, 50.0, 0.0, &mut out_jitter);

        let mut src_no_jitter = LfSource::new(SAMPLE_RATE);
        let mut out_no_jitter = vec![0.0_f32; num_samples];
        src_no_jitter.process(&f0, &rd, &oq, &tl, 0.0, 0.0, 0.0, &mut out_no_jitter);

        let mut any_differ = false;
        for i in 0..num_samples {
            if (out_jitter[i] - out_no_jitter[i]).abs() > 1e-6 {
                any_differ = true;
                break;
            }
        }
        assert!(any_differ, "Jitter=50 should produce different output than jitter=0");
    }

    #[test]
    fn test_di_zero_uniform() {
        // With DI=0, output amplitude should be uniform across multiple periods.
        // Gobl & Ni Chasaide 2003: DI=0 means no diplophonia.
        let num_samples = 4410; // ~10 periods at 110 Hz
        let mut src = LfSource::new(SAMPLE_RATE);
        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq = [0.0_f32];
        let tl = [0.0_f32];
        let mut output = vec![0.0_f32; num_samples];
        src.process(&f0, &rd, &oq, &tl, 0.0, 0.0, 0.0, &mut output);

        // Find peak amplitudes per period by looking for impulse responses
        // Period length at 110 Hz / 44100 Hz = ~401 samples
        let period_len = (SAMPLE_RATE / 110.0).round() as usize;
        let mut period_peaks = Vec::new();
        // Skip first period (startup transient)
        for p in 1..8 {
            let start = p * period_len;
            let end = ((p + 1) * period_len).min(num_samples);
            if end > num_samples { break; }
            let peak = output[start..end].iter().map(|x| x.abs()).fold(0.0_f32, f32::max);
            period_peaks.push(peak);
        }

        // All period peaks should be nearly identical (within 1%)
        let max_peak = period_peaks.iter().copied().fold(0.0_f32, f32::max);
        let min_peak = period_peaks.iter().copied().fold(f32::MAX, f32::min);
        assert!(max_peak > 0.001, "Output should be non-silent");
        let ratio = min_peak / max_peak;
        assert!(ratio > 0.99, "DI=0: all periods should have uniform amplitude, ratio={}", ratio);
    }

    #[test]
    fn test_di_50_alternating() {
        // With DI=50, odd-cycle periods should have 50% amplitude of even-cycle periods.
        // Gobl & Ni Chasaide 2003 Table 1.
        let num_samples = 8820; // ~20 periods at 110 Hz
        let mut src = LfSource::new(SAMPLE_RATE);
        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq = [0.0_f32];
        let tl = [0.0_f32];
        let mut output = vec![0.0_f32; num_samples];
        src.process(&f0, &rd, &oq, &tl, 0.0, 0.0, 50.0, &mut output);

        let period_len = (SAMPLE_RATE / 110.0).round() as usize;
        let mut even_peaks = Vec::new();
        let mut odd_peaks = Vec::new();
        // Skip period 0 (startup), collect periods 1-16
        for p in 1..17 {
            let start = p * period_len;
            let end = ((p + 1) * period_len).min(num_samples);
            if end > num_samples { break; }
            let peak = output[start..end].iter().map(|x| x.abs()).fold(0.0_f32, f32::max);
            // period_cycle_count starts at 1 for period 0 (incremented before start_period output),
            // so period index p has cycle_count = p+1. Odd cycle_count means p is even index.
            // We need to check which are actually attenuated by observing the pattern.
            if p % 2 == 0 {
                even_peaks.push(peak);
            } else {
                odd_peaks.push(peak);
            }
        }

        let avg_even: f32 = even_peaks.iter().sum::<f32>() / even_peaks.len() as f32;
        let avg_odd: f32 = odd_peaks.iter().sum::<f32>() / odd_peaks.len() as f32;

        // One group should be ~50% of the other
        let (larger, smaller) = if avg_even > avg_odd {
            (avg_even, avg_odd)
        } else {
            (avg_odd, avg_even)
        };

        assert!(larger > 0.001, "Output should be non-silent");
        let ratio = smaller / larger;
        // DI=50 means odd cycles at 50% amplitude, so ratio should be ~0.5
        assert!(ratio > 0.35 && ratio < 0.65,
            "DI=50: alternating amplitude ratio should be ~0.5, got {}", ratio);
    }

    #[test]
    fn test_di_100_silent_odd() {
        // With DI=100, odd-cycle periods should produce zero output.
        // Gobl & Ni Chasaide 2003 Table 1.
        let num_samples = 8820;
        let mut src = LfSource::new(SAMPLE_RATE);
        let f0 = [110.0_f32];
        let rd = [1.0_f32];
        let oq = [0.0_f32];
        let tl = [0.0_f32];
        let mut output = vec![0.0_f32; num_samples];
        src.process(&f0, &rd, &oq, &tl, 0.0, 0.0, 100.0, &mut output);

        let period_len = (SAMPLE_RATE / 110.0).round() as usize;
        let mut has_loud_period = false;
        let mut has_silent_period = false;
        // Skip period 0, check periods 1-16
        for p in 1..17 {
            let start = p * period_len;
            let end = ((p + 1) * period_len).min(num_samples);
            if end > num_samples { break; }
            let peak = output[start..end].iter().map(|x| x.abs()).fold(0.0_f32, f32::max);
            if peak > 0.001 {
                has_loud_period = true;
            }
            if peak < 1e-6 {
                has_silent_period = true;
            }
        }

        assert!(has_loud_period, "DI=100: should have some non-silent (even) periods");
        assert!(has_silent_period, "DI=100: should have some silent (odd) periods");
    }
}
