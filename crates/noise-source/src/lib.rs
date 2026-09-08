//! Klatt (1980), COEWAV.FOR: filtered aspiration/frication noise.
//! Preserve Qlatt's uniform LCG and one-pole low-pass, rather than claiming
//! equivalence to COEWAV's sum-of-uniforms Gaussian source. LCG constants and
//! the cutoff ceiling at 0.45 times the sample rate are existing Qlatt engineering estimates.

pub struct NoiseSource {
    rate: f64,
    seed: u32,
    previous: f64,
    cutoff: f64,
    alpha: f64,
}
impl NoiseSource {
    fn new(rate: f64, seed: u32) -> Self {
        Self {
            rate,
            seed: if seed == 0 { 1 } else { seed },
            previous: 0.0,
            cutoff: -1.0,
            alpha: 0.0,
        }
    }
    fn sample(&mut self, modulation: f64, gain: f64, cutoff: f64, _c: f64) -> f64 {
        if cutoff != self.cutoff {
            self.cutoff = cutoff.min(self.rate * 0.45).max(1.0);
            self.alpha = (-2.0 * core::f64::consts::PI * self.cutoff / self.rate).exp();
        }
        self.seed = self.seed.wrapping_mul(1664525).wrapping_add(1013904223);
        let white = (self.seed as f64 / 4294967296.0) * 2.0 - 1.0;
        let output = (1.0 - self.alpha) * white + self.alpha * self.previous;
        self.previous = output;
        output * gain * modulation
    }
}
klatt_wasm_common::export_sample_processor!(
    NoiseSource,
    noise_source_new,
    noise_source_sample,
    noise_source_free
);
