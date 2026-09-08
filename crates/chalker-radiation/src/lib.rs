//! Chalker & Mackerras (1985), "Models for Representing the Acoustic
//! Radiation Impedance of the Mouth", Eqs. (3)-(4); Klatt (1980), 10 kHz rate.
//! This ports Qlatt's existing two-difference approximation, not the paper's
//! aperture-dependent impedance. The 1/24 series ratio and rate-squared
//! mapping are an engineering estimate; the paper's impedance error bounds
//! do not apply to this discrete filter.

pub struct ChalkerRadiation {
    previous: f64,
    previous2: f64,
    c1: f64,
    c2: f64,
}
impl ChalkerRadiation {
    fn new(rate: f64, _seed: u32) -> Self {
        let ratio = rate / 10000.0;
        Self {
            previous: 0.0,
            previous2: 0.0,
            c1: ratio,
            c2: -(1.0 / 24.0) * ratio * ratio,
        }
    }
    fn sample(&mut self, input: f64, _a: f64, _b: f64, _c: f64) -> f64 {
        let output = self.c1 * (input - self.previous)
            + self.c2 * (input - 2.0 * self.previous + self.previous2);
        self.previous2 = self.previous;
        self.previous = input;
        output
    }
}
klatt_wasm_common::export_sample_processor!(
    ChalkerRadiation,
    chalker_radiation_new,
    chalker_radiation_sample,
    chalker_radiation_free
);
