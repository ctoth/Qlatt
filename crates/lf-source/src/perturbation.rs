//! Schoentgen (2001), Model II / Eq. 16: white-noise-driven AR(2) microtremor.
//! Defaults: 5 Hz microtremor, 4 Hz bandwidth, b0 = 0.23 (Table I).
//! Titze (1991), Eq. 10 defines the exposed magnitude as percent CV, not Hz
//! or mean absolute adjacent-cycle difference (JIT, Eq. 9).
//!
//! Engineering realization: a 100 Hz control clock (10 ms, the reference
//! cycle duration) independent of F0, with complex poles exp(-pi W/fs).
//! Yule-Walker stationary variance normalizes the filtered noise to unit SD.
//! The amplitude channel uses an independent copy: this shimmer analogy is
//! an engineering extension, not a shimmer model measured by these papers.

use core::f64::consts::PI;

const CONTROL_RATE: f64 = 100.0;

pub(super) struct Microtremor {
    rng: u32,
    a1: f64,
    a2: f64,
    scale: f64,
    y1: f64,
    y2: f64,
    clock: f64,
    step: f64,
}

impl Microtremor {
    pub fn new(sample_rate: f32, seed: u32) -> Self {
        let radius = (-PI * 4.0 / CONTROL_RATE).exp();
        let a1 = 2.0 * radius * (2.0 * PI * 5.0 / CONTROL_RATE).cos();
        let a2 = -radius * radius;
        // Uniform [-1,1] innovation has variance 1/3. Yule-Walker:
        // rho1=a1/(1-a2), var=b0^2/3 / (1-a2^2-a1^2*(1+a2)/(1-a2)).
        let variance =
            (0.23_f64.powi(2) / 3.0) / (1.0 - a2 * a2 - a1 * a1 * (1.0 + a2) / (1.0 - a2));
        let mut result = Self {
            rng: seed,
            a1,
            a2,
            scale: 1.0 / variance.sqrt(),
            y1: 0.0,
            y2: 0.0,
            clock: 0.0,
            step: CONTROL_RATE / sample_rate as f64,
        };
        // Engineering warmup: 2 seconds exceeds the filter's settling time.
        for _ in 0..200 {
            result.advance();
        }
        result
    }

    fn advance(&mut self) {
        // Marsaglia (2003), xorshift32; distinct nonzero seeds for each channel.
        self.rng ^= self.rng << 13;
        self.rng ^= self.rng >> 17;
        self.rng ^= self.rng << 5;
        let white = 2.0 * self.rng as f64 / u32::MAX as f64 - 1.0;
        let next = self.a1 * self.y1 + self.a2 * self.y2 + 0.23 * white;
        self.y2 = self.y1;
        self.y1 = next;
    }

    pub fn tick(&mut self) {
        self.clock += self.step;
        while self.clock >= 1.0 {
            self.clock -= 1.0;
            self.advance();
        }
    }

    pub fn factor(&self, percent: f32) -> f32 {
        (1.0 + percent as f64 * 0.01 * self.y1 * self.scale) as f32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn target_cv_and_independent_amplitude_channel() {
        let mut pitch = Microtremor::new(100.0, 0x12345678);
        let mut amplitude = Microtremor::new(100.0, 0x87654321);
        let mut sum = [0.0; 2];
        let mut squares = [0.0; 2];
        let mut cross = 0.0;
        for _ in 0..100000 {
            pitch.tick();
            amplitude.tick();
            let values = [pitch.factor(0.3) as f64, amplitude.factor(1.0) as f64];
            for i in 0..2 {
                sum[i] += values[i];
                squares[i] += values[i] * values[i];
            }
            cross += (values[0] - 1.0) * (values[1] - 1.0);
            assert_eq!(pitch.factor(0.0), 1.0);
            assert!(pitch.factor(10.0) > 0.0 && amplitude.factor(10.0) > 0.0);
        }
        for (i, target) in [0.3, 1.0].iter().enumerate() {
            let mean = sum[i] / 100000.0;
            let cv = 100.0 * (squares[i] / 100000.0 - mean * mean).sqrt() / mean;
            assert!(
                (cv - target).abs() < target * 0.03,
                "CV={cv}, target={target}"
            );
        }
        assert!((cross / 100000.0 / (0.003 * 0.01)).abs() < 0.03);
    }
}
