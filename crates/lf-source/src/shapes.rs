//! Analytic flow derivatives: Veldhuis (1998), Eqs. 2, 5, 9-13;
//! Rosenberg (1971), Fig. 3C, normalized to excitation E=1 as in Doval (2006).
use core::f64::consts::PI;

#[derive(Clone, Copy, Default)]
pub(super) struct Pulse {
    pub te: f64,
    pub tp: f64,
    ta: f64,
    end: f64,
    c: f64,
    d: f64,
    scale: f64,
}

impl Pulse {
    // All times are fractions of T0. Return whether Eq. 13 projected Tp.
    pub fn rpp(te: f64, tp: f64, ta: f64) -> (Self, bool) {
        let x = (1.0 - te) / ta;
        let end = (-x).exp();
        // Eq. 5, using expm1 to retain precision for long return constants.
        let area = ta * (1.0 - x / x.exp_m1());
        let upper = 0.75 * te * (te + 4.0 * area) / (te + 3.0 * area);
        let bounded_tp = tp.min(upper);
        // Eq. 10 without dividing by its denominator: c-d*t = d*(tx-t).
        // This also evaluates the R+ limit (Eq. 12) when d=0.
        let d = 2.0 * te * te - 3.0 * te * bounded_tp + 6.0 * area * (te - bounded_tp);
        let n = 0.5 * te * te - te * bounded_tp;
        let c = te * (d - n);
        let scale = -1.0 / (te * (bounded_tp - te) * (-te * n));
        (
            Self {
                te,
                tp: bounded_tp,
                ta,
                end,
                c,
                d,
                scale,
            },
            bounded_tp != tp,
        )
    }

    pub fn rosenberg(te: f64) -> Self {
        // Rosenberg 1971 experiment I: Tp/T=0.40, Tn/T=0.16.
        Self {
            te,
            tp: te * (0.40 / 0.56),
            ..Self::default()
        }
    }

    pub fn rpp_sample(&self, t: f64) -> f32 {
        if t < self.te {
            (self.scale * t * (self.tp - t) * (self.c - self.d * t)) as f32
        } else {
            (-((-(t - self.te) / self.ta).exp() - self.end) / (1.0 - self.end)) as f32
        }
    }

    pub fn rosenberg_sample(&self, t: f64) -> f32 {
        if t < self.tp {
            ((self.te - self.tp) / self.tp * (PI * t / self.tp).sin()) as f32
        } else if t < self.te {
            (-(PI * (t - self.tp) / (2.0 * (self.te - self.tp))).sin()) as f32
        } else {
            0.0
        }
    }
}
