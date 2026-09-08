//! Steinecke & Herzel (1995), JASA 97, 1874-1884, Eqs. 1-10, 38.

klatt_wasm_common::export_alloc_fns!();

// Standard table, p.1876. Units: cm, g, ms. The omitted length is
// inherited from Ishizaka & Flanagan (1972), p.1250: l=1.4 cm.
const LENGTH: f64 = 1.4;
const REST_AREA: f64 = 0.05;
const RHO: f64 = 0.00113;
const MASS: [f64; 2] = [0.125, 0.025];
const SPRING: [f64; 2] = [0.08, 0.008];
const DAMPING: f64 = 0.02;
const COUPLING: f64 = 0.025;
const LOWER_DEPTH: f64 = 0.25;

pub struct TwoMassSource {
    // [lower x,v, upper x,v] for left then right fold.
    state: [f64; 8],
    was_unpressurized: bool,
}

// Eq.9, with x0=a0; Eq.10 makes the minimum-area gate implicit.
fn theta(area: f64) -> f64 {
    if area > 0.0 {
        (50.0 * area / REST_AREA).tanh()
    } else {
        0.0
    }
}

fn areas(y: &[f64; 8]) -> (f64, f64, f64) {
    let a1l = REST_AREA / 2.0 + LENGTH * y[0];
    let a2l = REST_AREA / 2.0 + LENGTH * y[2];
    let a1r = REST_AREA / 2.0 + LENGTH * y[4];
    let a2r = REST_AREA / 2.0 + LENGTH * y[6];
    (a1l + a1r, a2l + a2r, (a1l.min(a2l) + a1r.min(a2r)).max(0.0))
}

fn derivative(y: &[f64; 8], pressure: f64, q: f64) -> [f64; 8] {
    let (a1, a2, minimum) = areas(y);
    // Eq.6: squared area ratio; Eq.10 clamps the minimum, not a1.
    let p1 = if a1 > 0.0 {
        pressure * (1.0 - (minimum / a1).powi(2)) * theta(a1)
    } else {
        0.0
    };
    let mut dy = [0.0; 8];
    for (side, tension) in [(0, 1.0), (4, q)] {
        for (i, area) in [a1, a2].into_iter().enumerate() {
            let j = side + 2 * i;
            let other = side + 2 * (1 - i);
            let stiffness = SPRING[i] * tension;
            // Eq.1 collision extension is ai/(2*l), not ai/2.
            let collision = theta(-area) * 3.0 * stiffness * area / (2.0 * LENGTH);
            let force = if i == 0 {
                LENGTH * LOWER_DEPTH * p1
            } else {
                0.0
            };
            dy[j] = y[j + 1];
            dy[j + 1] = (force
                - DAMPING * y[j + 1]
                - stiffness * y[j]
                - collision
                - COUPLING * tension * (y[j] - y[other]))
                / (MASS[i] / tension);
        }
    }
    dy
}

fn shifted(y: &[f64; 8], d: &[f64; 8], dt: f64) -> [f64; 8] {
    std::array::from_fn(|i| y[i] + dt * d[i])
}

impl TwoMassSource {
    pub fn new() -> Self {
        // Fig.7 simulation initial conditions, p.1880.
        Self {
            state: [0.1, 0.1, 0.0, 0.0, 0.1, 0.1, 0.0, 0.0],
            was_unpressurized: true,
        }
    }

    /// Pressure in g/(cm ms²), right/left tension Q, time step in ms.
    /// Returns volume flow in cm³/ms (Eq.8). No prescribed F0 or pulse train.
    pub fn step(&mut self, pressure: f64, q: f64, dt_ms: f64) -> f64 {
        // Engineering operating bounds: match the worklet's 0..30 cm H2O
        // pressure range, Q domain studied on p.1880, and >=8 kHz audio.
        if !pressure.is_finite()
            || !(0.0..=0.03).contains(&pressure)
            || !q.is_finite()
            || !(0.4..=1.0).contains(&q)
            || !dt_ms.is_finite()
            || !(0.0..=0.125).contains(&dt_ms)
            || dt_ms == 0.0
        {
            *self = Self::new();
            return 0.0;
        }
        if pressure > 0.0 && self.was_unpressurized {
            // Engineering startup: reapply the paper's initial perturbation
            // after zero pressure, avoiding a floating-point equilibrium trap.
            self.state = Self::new().state;
        }
        self.was_unpressurized = pressure == 0.0;
        // Engineering integration choice: RK4 with <= .025 ms steps.
        let steps = (dt_ms / 0.025).ceil().max(1.0) as usize;
        let dt = dt_ms / steps as f64;
        for _ in 0..steps {
            let y = &self.state;
            let a = derivative(y, pressure, q);
            let b = derivative(&shifted(y, &a, dt / 2.0), pressure, q);
            let c = derivative(&shifted(y, &b, dt / 2.0), pressure, q);
            let d = derivative(&shifted(y, &c, dt), pressure, q);
            self.state =
                std::array::from_fn(|i| y[i] + dt / 6.0 * (a[i] + 2.0 * b[i] + 2.0 * c[i] + d[i]));
        }
        (2.0 * pressure / RHO).sqrt() * areas(&self.state).2
    }
}

impl Default for TwoMassSource {
    fn default() -> Self {
        Self::new()
    }
}

#[no_mangle]
pub extern "C" fn two_mass_source_new() -> *mut TwoMassSource {
    Box::into_raw(Box::new(TwoMassSource::new()))
}

/// # Safety
/// `state` must be null or a live allocation returned by `two_mass_source_new`.
#[no_mangle]
pub unsafe extern "C" fn two_mass_source_free(state: *mut TwoMassSource) {
    if !state.is_null() {
        drop(Box::from_raw(state));
    }
}

/// Pressure input in cm H2O; flow output in cm³/ms. Returns 1 if invalid
/// controls were silenced, so the host can emit a diagnostic.
/// # Safety
/// State must be live; input/output must hold `len` disjoint f32 samples.
#[no_mangle]
pub unsafe extern "C" fn two_mass_source_process(
    state: *mut TwoMassSource,
    pressure: *const f32,
    output: *mut f32,
    len: usize,
    q: f32,
    rate: f32,
    enable: f32,
) -> u32 {
    if state.is_null() || pressure.is_null() || output.is_null() {
        return 1;
    }
    let source = &mut *state;
    let input = std::slice::from_raw_parts(pressure, len);
    let output = std::slice::from_raw_parts_mut(output, len);
    let valid = q.is_finite()
        && (0.4..=1.0).contains(&q)
        && rate.is_finite()
        && rate >= 8000.0
        && enable.is_finite();
    if !valid || enable <= 0.0 {
        output.fill(0.0);
        *source = TwoMassSource::new();
        return u32::from(!valid);
    }
    let mut invalid = 0;
    for (&pressure, sample) in input.iter().zip(output.iter_mut()) {
        if !pressure.is_finite() || !(0.0..=30.0).contains(&pressure) {
            invalid = 1;
            *source = TwoMassSource::new();
            *sample = 0.0;
        } else {
            // 1 cm H2O = 980.665 dyn/cm² = .000980665 g/(cm ms²).
            *sample = source.step(
                f64::from(pressure) * 0.000980665,
                f64::from(q),
                1000.0 / f64::from(rate),
            ) as f32;
        }
    }
    invalid
}

#[cfg(test)]
mod tests {
    use super::*;

    fn peaks(pressure: f64, q: f64, rate: usize, fold_index: usize) -> Vec<f64> {
        let mut source = TwoMassSource::new();
        let mut previous = [0.0; 2];
        let mut peaks = Vec::new();
        for i in 0..rate * 2 {
            let flow = source.step(pressure, q, 1000.0 / rate as f64);
            assert!(flow.is_finite() && flow >= 0.0);
            let flow = source.state[fold_index];
            if i > rate && previous[1] > previous[0] && previous[1] > flow {
                peaks.push(previous[1]);
            }
            previous = [previous[1], flow];
        }
        peaks
    }

    #[test]
    fn onset_brackets_figure_5_standard_damping() {
        // Fig. 5 (p.1878), k1=.08, r1=r2=.02: onset around .0024.
        let amplitude = |pressure| {
            let mut source = TwoMassSource::new();
            let mut minimum = f64::INFINITY;
            let mut maximum = f64::NEG_INFINITY;
            for i in 0..96000 {
                let flow = source.step(pressure, 1.0, 1000.0 / 48000.0);
                if i > 72000 {
                    minimum = minimum.min(flow);
                    maximum = maximum.max(flow);
                }
            }
            maximum - minimum
        };
        // Rest glottis has DC flow even below onset; compare pulsation
        // separately from the existence of nonzero airflow.
        assert!(amplitude(0.002) < 1e-4);
        assert!(amplitude(0.003) > 0.1);
    }

    #[test]
    fn pressure_removal_silences_flow_and_reapplication_restarts() {
        let mut source = TwoMassSource::new();
        for _ in 0..48000 {
            source.step(0.008, 1.0, 1000.0 / 48000.0);
        }
        for _ in 0..48000 {
            assert_eq!(source.step(0.0, 1.0, 1000.0 / 48000.0), 0.0);
        }
        let resumed: f64 = (0..48000)
            .map(|_| source.step(0.008, 1.0, 1000.0 / 48000.0))
            .sum();
        assert!(resumed > 1000.0);
    }

    #[test]
    fn supported_extremes_remain_finite_and_invalid_input_recovers() {
        for q in [0.4, 1.0] {
            let mut source = TwoMassSource::new();
            for _ in 0..16000 {
                let flow = source.step(0.03, q, 0.125);
                assert!(flow.is_finite() && flow >= 0.0);
                assert!(source.state.iter().all(|x| x.is_finite()));
            }
            assert_eq!(source.step(f64::NAN, q, 0.125), 0.0);
            assert!(source.step(0.008, q, 0.125).is_finite());
        }
    }

    #[test]
    fn figures_8_and_9_reproduce_period_doubling() {
        for rate in [44100, 96000] {
            for fold_index in [0, 4] {
                // p.1880: Ps=.0145; Fig.8 Q=.6 (1:1), Fig.9 Q=.57 (2:2).
                for (q, doubled) in [(0.6, false), (0.57, true)] {
                    let p = peaks(0.0145, q, rate, fold_index);
                    assert!(p.len() > 40, "no sustained phonation at Q={q}");
                    let p = &p[p.len() - 40..];
                    let adjacent = p.windows(2).map(|w| (w[1] - w[0]).abs()).sum::<f64>() / 39.0;
                    let alternate = p.windows(3).map(|w| (w[2] - w[0]).abs()).sum::<f64>() / 38.0;
                    assert!(alternate < 0.005, "Q={q}, alternate={alternate}");
                    if doubled {
                        assert!(adjacent > 0.01, "Q={q}, adjacent={adjacent}");
                    } else {
                        assert!(adjacent < 0.005, "Q={q}, adjacent={adjacent}");
                    }
                }
            }
        }
    }
}
