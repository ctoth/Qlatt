//! Klatt (1980), COEWAV.FOR: first-difference radiation characteristic.
//! Preserve Qlatt's sample-rate scaling against Klatt's 10 kHz reference.

pub struct Differentiator {
    previous: f64,
    scale: f64,
}
impl Differentiator {
    fn new(rate: f64, _seed: u32) -> Self {
        Self {
            previous: 0.0,
            scale: rate / 10000.0,
        }
    }
    fn sample(&mut self, input: f64, _a: f64, _b: f64, _c: f64) -> f64 {
        let output = (input - self.previous) * self.scale;
        self.previous = input;
        output
    }
}
klatt_wasm_common::export_sample_processor!(
    Differentiator,
    differentiator_new,
    differentiator_sample,
    differentiator_free
);
