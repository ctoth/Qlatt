//! Klatt (1980), COEWAV.FOR lines 116-122 (aspiration modulation);
//! Gobl (1988), voice source dynamics; Fant (1997), Table 1 (OQi).
//! The smooth sinusoidal open-phase envelope is Qlatt's engineering estimate,
//! replacing Klatt's square-wave modulation. OQ is supplied by the host.

pub struct GlottalMod {
    rate: f64,
    phase: f64,
}
impl GlottalMod {
    fn new(rate: f64, _seed: u32) -> Self {
        Self { rate, phase: 0.0 }
    }
    fn sample(&mut self, _input: f64, f0: f64, oq: f64, _c: f64) -> f64 {
        if f0.is_nan() || f0 <= 0.0 {
            return 0.5;
        }
        let period = self.rate / f0;
        if period <= 1.0 {
            return 1.0;
        }
        if self.phase >= period {
            self.phase %= period;
        }
        let open = oq.clamp(0.1, 1.0) * period;
        let output = if self.phase < open {
            0.5 + 0.5 * (core::f64::consts::PI * self.phase / open).sin()
        } else {
            0.5
        };
        self.phase += 1.0;
        output
    }
}
klatt_wasm_common::export_sample_processor!(
    GlottalMod,
    glottal_mod_new,
    glottal_mod_sample,
    glottal_mod_free
);
