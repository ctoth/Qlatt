//! Fixed output reconstruction low-pass filter for the synthesizer output.
//!
//! Klatt (1980) specifies an external analog low-pass after the D/A converter:
//! Fig. 1 routes playback through an "analog low-pass filter", and Appendix A
//! is titled "EXTERNAL 5000 Hz LOW-PASS FILTER". This crate models the
//! Appendix A ladder network directly in the time domain using trapezoidal
//! companion models for the capacitors and inductors.
//!
//! Fig. A1 values transcribed from the paper image:
//! - Source resistor: 5000 ohms
//! - Series parallel-resonant branches:
//!   - L1 = 135 mH, Cp1 = 0.0031 uF
//!   - L2 = 52 mH,  Cp2 = 0.0192 uF
//!   - L3 = 72 mH,  Cp3 = 0.0119 uF
//! - Shunt capacitors to ground:
//!   - C1 = 0.0131 uF
//!   - C2 = 0.0117 uF
//!   - C3 = 0.00852 uF
//!   - C4 = 0.00887 uF
//! - Load resistor: 5000 ohms
//!
//! Reference: Klatt (1980), JASA 67(3), Fig. 1 and Appendix A.

const R_SOURCE: f64 = 5_000.0;
const R_LOAD: f64 = 5_000.0;
const U_F: f64 = 1e-6;
const M_H: f64 = 1e-3;
const PREWARP_FREQ_HZ: f64 = 5_000.0;
const OUTPUT_GAIN_COMP: f32 = 2.0;

#[derive(Clone, Copy)]
enum BranchKind {
    Capacitor,
    Inductor,
}

#[derive(Clone, Copy)]
struct DynamicBranch {
    kind: BranchKind,
    node_a: usize,
    node_b: Option<usize>,
    conductance: f64,
    v_prev: f64,
    i_prev: f64,
}

impl DynamicBranch {
    fn shunt_cap(node: usize, capacitance_farads: f64, trap_k: f64) -> Self {
        Self {
            kind: BranchKind::Capacitor,
            node_a: node,
            node_b: None,
            conductance: capacitance_farads * trap_k,
            v_prev: 0.0,
            i_prev: 0.0,
        }
    }

    fn series_cap(node_a: usize, node_b: usize, capacitance_farads: f64, trap_k: f64) -> Self {
        Self {
            kind: BranchKind::Capacitor,
            node_a,
            node_b: Some(node_b),
            conductance: capacitance_farads * trap_k,
            v_prev: 0.0,
            i_prev: 0.0,
        }
    }

    fn series_ind(node_a: usize, node_b: usize, inductance_henries: f64, trap_k: f64) -> Self {
        Self {
            kind: BranchKind::Inductor,
            node_a,
            node_b: Some(node_b),
            conductance: 1.0 / (inductance_henries * trap_k),
            v_prev: 0.0,
            i_prev: 0.0,
        }
    }

    fn history_current(&self) -> f64 {
        match self.kind {
            BranchKind::Capacitor => -(self.conductance * self.v_prev) - self.i_prev,
            BranchKind::Inductor => self.i_prev + (self.conductance * self.v_prev),
        }
    }

    fn stamp_matrix(&self, a: &mut [[f64; 4]; 4]) {
        let g = self.conductance;

        a[self.node_a][self.node_a] += g;

        if let Some(node_b) = self.node_b {
            a[node_b][node_b] += g;
            a[self.node_a][node_b] -= g;
            a[node_b][self.node_a] -= g;
        }
    }

    fn stamp_rhs(&self, b: &mut [f64; 4]) {
        let ieq = self.history_current();
        b[self.node_a] -= ieq;
        if let Some(node_b) = self.node_b {
            b[node_b] += ieq;
        }
    }

    fn update(&mut self, node_voltages: &[f64; 4]) {
        let va = node_voltages[self.node_a];
        let vb = self.node_b.map(|idx| node_voltages[idx]).unwrap_or(0.0);
        let v_now = va - vb;
        let i_now = self.conductance * v_now + self.history_current();
        self.v_prev = v_now;
        self.i_prev = i_now;
    }

    fn reset(&mut self) {
        self.v_prev = 0.0;
        self.i_prev = 0.0;
    }
}

#[derive(Clone, Copy)]
struct SolveStep {
    pivot: usize,
    pivot_row: usize,
    pivot_value: f64,
    factors: [f64; 4],
    active_rows: [bool; 4],
}

#[derive(Clone, Copy)]
struct SolvePlan {
    steps: [SolveStep; 4],
}

impl SolvePlan {
    /// Precompute Gaussian-elimination decisions for the constant ladder matrix.
    /// Applying the plan to each changing RHS retains the original operation
    /// order, including every division and subtraction, so output bits remain
    /// identical while matrix stamping and elimination leave the audio loop.
    #[allow(clippy::needless_range_loop)] // exact legacy elimination order is the bit-level contract
    fn new(mut a: [[f64; 4]; 4]) -> Self {
        let empty = SolveStep {
            pivot: 0,
            pivot_row: 0,
            pivot_value: 1.0,
            factors: [0.0; 4],
            active_rows: [false; 4],
        };
        let mut steps = [empty; 4];

        for pivot in 0..4 {
            let mut pivot_row = pivot;
            let mut pivot_mag = a[pivot][pivot].abs();
            for row in (pivot + 1)..4 {
                let mag = a[row][pivot].abs();
                if mag > pivot_mag {
                    pivot_mag = mag;
                    pivot_row = row;
                }
            }

            assert!(pivot_mag > 1e-18, "singular reconstruction-filter matrix");

            if pivot_row != pivot {
                a.swap(pivot, pivot_row);
            }

            let pivot_value = a[pivot][pivot];
            for col in pivot..4 {
                a[pivot][col] /= pivot_value;
            }

            let mut factors = [0.0; 4];
            let mut active_rows = [false; 4];
            for row in 0..4 {
                if row == pivot {
                    continue;
                }
                let factor = a[row][pivot];
                if factor.abs() < 1e-18 {
                    continue;
                }
                factors[row] = factor;
                active_rows[row] = true;
                for col in pivot..4 {
                    a[row][col] -= factor * a[pivot][col];
                }
            }
            steps[pivot] = SolveStep {
                pivot,
                pivot_row,
                pivot_value,
                factors,
                active_rows,
            };
        }

        Self { steps }
    }

    fn solve(&self, mut b: [f64; 4]) -> [f64; 4] {
        for step in self.steps {
            if step.pivot_row != step.pivot {
                b.swap(step.pivot, step.pivot_row);
            }
            b[step.pivot] /= step.pivot_value;
            for row in 0..4 {
                if step.active_rows[row] {
                    b[row] -= step.factors[row] * b[step.pivot];
                }
            }
        }
        b
    }
}

#[repr(C)]
pub struct ReconstructionFilter {
    source_conductance: f64,
    branches: [DynamicBranch; 10],
    solve_plan: SolvePlan,
}

impl ReconstructionFilter {
    fn new(sample_rate: f32) -> Self {
        let sr = if sample_rate.is_finite() && sample_rate > 1_000.0 {
            sample_rate as f64
        } else {
            48_000.0
        };
        let omega_warp = 2.0 * core::f64::consts::PI * PREWARP_FREQ_HZ;
        let trap_k = omega_warp / (omega_warp / (2.0 * sr)).tan();

        let source_conductance = 1.0 / R_SOURCE;
        let load_conductance = 1.0 / R_LOAD;
        let branches = [
            DynamicBranch::shunt_cap(0, 0.0131 * U_F, trap_k),
            DynamicBranch::series_ind(0, 1, 135.0 * M_H, trap_k),
            DynamicBranch::series_cap(0, 1, 0.0031 * U_F, trap_k),
            DynamicBranch::shunt_cap(1, 0.0117 * U_F, trap_k),
            DynamicBranch::series_ind(1, 2, 52.0 * M_H, trap_k),
            DynamicBranch::series_cap(1, 2, 0.0192 * U_F, trap_k),
            DynamicBranch::shunt_cap(2, 0.00852 * U_F, trap_k),
            DynamicBranch::series_ind(2, 3, 72.0 * M_H, trap_k),
            DynamicBranch::series_cap(2, 3, 0.0119 * U_F, trap_k),
            DynamicBranch::shunt_cap(3, 0.00887 * U_F, trap_k),
        ];

        let mut matrix = [[0.0_f64; 4]; 4];
        matrix[0][0] += source_conductance;
        matrix[3][3] += load_conductance;
        for branch in &branches {
            branch.stamp_matrix(&mut matrix);
        }

        Self {
            source_conductance,
            branches,
            solve_plan: SolvePlan::new(matrix),
        }
    }

    fn reset(&mut self) {
        for branch in &mut self.branches {
            branch.reset();
        }
    }

    fn process_sample(&mut self, input: f32) -> f32 {
        let mut b = [0.0_f64; 4];

        b[0] += self.source_conductance * input as f64;

        for branch in &self.branches {
            branch.stamp_rhs(&mut b);
        }

        let node_voltages = self.solve_plan.solve(b);

        for branch in &mut self.branches {
            branch.update(&node_voltages);
        }

        (node_voltages[3] as f32) * OUTPUT_GAIN_COMP
    }

    fn process(&mut self, input: &[f32], output: &mut [f32]) {
        for (out, sample) in output.iter_mut().zip(input) {
            *out = self.process_sample(*sample);
        }
    }
}

#[no_mangle]
pub extern "C" fn reconstruction_filter_new(sample_rate: f32) -> *mut ReconstructionFilter {
    Box::into_raw(Box::new(ReconstructionFilter::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn reconstruction_filter_free(ptr: *mut ReconstructionFilter) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn reconstruction_filter_reset(ptr: *mut ReconstructionFilter) {
    if let Some(filter) = ptr.as_mut() {
        filter.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn reconstruction_filter_process(
    ptr: *mut ReconstructionFilter,
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null() || input_ptr.is_null() || output_ptr.is_null() || len == 0 {
        return;
    }

    let filter = &mut *ptr;
    let input = core::slice::from_raw_parts(input_ptr, len);
    let output = core::slice::from_raw_parts_mut(output_ptr, len);
    filter.process(input, output);
}

klatt_wasm_common::export_alloc_fns!();

#[cfg(test)]
mod tests {
    use super::*;

    #[allow(clippy::needless_range_loop)] // intentionally mirrors the legacy indexed solver
    fn solve_4x4_reference(mut a: [[f64; 4]; 4], mut b: [f64; 4]) -> [f64; 4] {
        for pivot in 0..4 {
            let mut pivot_row = pivot;
            let mut pivot_mag = a[pivot][pivot].abs();
            for row in (pivot + 1)..4 {
                let mag = a[row][pivot].abs();
                if mag > pivot_mag {
                    pivot_mag = mag;
                    pivot_row = row;
                }
            }
            assert!(pivot_mag > 1e-18);
            if pivot_row != pivot {
                a.swap(pivot, pivot_row);
                b.swap(pivot, pivot_row);
            }
            let pivot_value = a[pivot][pivot];
            for col in pivot..4 {
                a[pivot][col] /= pivot_value;
            }
            b[pivot] /= pivot_value;
            for row in 0..4 {
                if row == pivot {
                    continue;
                }
                let factor = a[row][pivot];
                if factor.abs() < 1e-18 {
                    continue;
                }
                for col in pivot..4 {
                    a[row][col] -= factor * a[pivot][col];
                }
                b[row] -= factor * b[pivot];
            }
        }
        b
    }

    #[test]
    fn cached_solve_plan_is_bit_identical_to_per_sample_elimination() {
        let filter = ReconstructionFilter::new(48_000.0);
        let mut matrix = [[0.0_f64; 4]; 4];
        matrix[0][0] += filter.source_conductance;
        matrix[3][3] += 1.0 / R_LOAD;
        for branch in &filter.branches {
            branch.stamp_matrix(&mut matrix);
        }

        for rhs in [
            [0.0, 0.0, 0.0, 0.0],
            [1.0, -2.0, 3.0, -4.0],
            [f64::MIN_POSITIVE, 1e-12, -1e12, f64::EPSILON],
        ] {
            let expected = solve_4x4_reference(matrix, rhs);
            let actual = filter.solve_plan.solve(rhs);
            assert_eq!(actual.map(f64::to_bits), expected.map(f64::to_bits));
        }
    }

    fn rms(signal: &[f32]) -> f32 {
        (signal.iter().map(|x| x * x).sum::<f32>() / signal.len() as f32).sqrt()
    }

    fn steady_state_gain_db(freq_hz: f32) -> f32 {
        let sr = 48_000.0_f32;
        let len = 65_536usize;
        let mut filter = ReconstructionFilter::new(sr);
        let input: Vec<f32> = (0..len)
            .map(|i| (2.0 * core::f32::consts::PI * freq_hz * i as f32 / sr).sin())
            .collect();
        let mut output = vec![0.0_f32; len];
        filter.process(&input, &mut output);

        let tail_in = &input[len - 16_384..];
        let tail_out = &output[len - 16_384..];
        let in_rms = rms(tail_in);
        let out_rms = rms(tail_out);
        20.0 * (out_rms / in_rms).log10()
    }

    #[test]
    fn preserves_dc_level() {
        let mut filter = ReconstructionFilter::new(48_000.0);
        let input = [1.0_f32; 8192];
        let mut output = [0.0_f32; 8192];
        filter.process(&input, &mut output);

        let tail = &output[6144..];
        let avg = tail.iter().sum::<f32>() / tail.len() as f32;
        assert!((avg - 1.0).abs() < 0.02, "dc gain should be near 1.0, got {}", avg);
    }

    #[test]
    fn matches_paper_passband_and_stopband_shape() {
        let passband = steady_state_gain_db(4_780.0);
        let stopband = steady_state_gain_db(6_000.0);

        assert!(passband >= -0.6, "4780 Hz should be within 0.6 dB, got {}", passband);
        assert!(stopband <= -40.0, "6000 Hz should be at least 40 dB down, got {}", stopband);
    }

    #[test]
    fn attenuates_high_frequency_more_than_low_frequency() {
        let low_gain = steady_state_gain_db(1_000.0);
        let high_gain = steady_state_gain_db(8_000.0);
        assert!(
            low_gain > high_gain + 20.0,
            "expected strong HF attenuation, low_gain={} high_gain={}",
            low_gain,
            high_gain
        );
    }
}
