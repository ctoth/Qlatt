//! Klatt (1980), COEWAV.FOR: impulse excitation and glottal resonator.
//! Preserve Qlatt/KlattSyn's bipolar pulse and unit impulse gain. Rounded
//! period/open-phase lengths and bandwidth SR/open-length match the existing
//! Qlatt adapter; this is not the separate KLGLOTT88 impulsive-source model.

pub struct ImpulseTrain {
    rate: f64,
    period: f64,
    open: f64,
    position: f64,
    b: f64,
    c: f64,
    y1: f64,
    y2: f64,
}
impl ImpulseTrain {
    fn new(rate: f64, _seed: u32) -> Self {
        Self {
            rate,
            period: 0.0,
            open: 0.0,
            position: 0.0,
            b: 0.0,
            c: 0.0,
            y1: 0.0,
            y2: 0.0,
        }
    }
    fn sample(&mut self, _input: f64, f0: f64, gain: f64, open_ratio: f64) -> f64 {
        if !f0.is_finite() || f0 <= 0.0 {
            return 0.0;
        }
        let period = (self.rate / f0).round().max(1.0);
        if period != self.period {
            self.period = period;
            self.open = (period * open_ratio.clamp(0.0, 1.0)).round().max(0.0);
            self.position = 0.0;
            let bw = if self.open > 0.0 {
                self.rate / self.open
            } else {
                0.0
            };
            let r = (-core::f64::consts::PI * bw / self.rate).exp();
            self.b = 2.0 * r;
            self.c = -(r * r);
            self.y1 = 0.0;
            self.y2 = 0.0;
        }
        // Preserve the existing period-triggered OQ update and unvoiced pause.
        if self.open <= 0.0 {
            return 0.0;
        }
        let pulse = if self.position == 1.0 {
            1.0
        } else if self.position == 2.0 {
            -1.0
        } else {
            0.0
        };
        self.position += 1.0;
        if self.position >= self.period {
            self.position = 0.0;
        }
        let output = pulse + self.b * self.y1 + self.c * self.y2;
        self.y2 = self.y1;
        self.y1 = output;
        output * gain
    }
}
klatt_wasm_common::export_sample_processor!(
    ImpulseTrain,
    impulse_train_new,
    impulse_train_sample,
    impulse_train_free
);
