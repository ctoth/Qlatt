#![allow(clippy::too_many_arguments)]
#![allow(clippy::missing_safety_doc)]

use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

// ============================================================================
// Physical constants
//
// Citations:
// - Stevens & Bickley (1991) "Constraints among parameters simplify control
//   of Klatt formant synthesizer" JASA 88(3), 1208-1218
// - Stevens (1998) "Acoustic Phonetics" MIT Press
// ============================================================================

/// Subglottal pressure (cm H2O) — Stevens (1998) Ch. 2, typical for normal speech
const PS_DEFAULT: f32 = 8.0;

/// Air density (g/cm3) — Stevens (1998) Ch. 2
const RHO: f32 = 0.00114;

/// 1 cm H2O = 980.665 dyn/cm2 — unit conversion factor
const CM_H2O_TO_DYN: f32 = 980.665;

/// Baseline B1: radiation + walls + viscous + heat losses (Hz)
/// Stevens (1998) Ch. 3, Eq. 3.58
const B1_BASE: f32 = 70.0;

/// B1 glottal contribution coefficient (Hz/cm2)
/// Derived: /h/ at Ag=0.15 gives B1=280 Hz, so (280-70)/0.15 = 1400
/// NOTE: Calibrated from 2 data points (closed=70 Hz, /h/=280 Hz).
/// Linear model is our best approximation for v1.
/// Stevens (1998) Ch. 3, Ch. 8
const B1_GLOTTAL_COEFF: f32 = 1400.0;

/// Minimum transglottal pressure for voicing (cm H2O)
/// Stevens (1998) Ch. 7
const VOICING_THRESHOLD: f32 = 2.0;

/// Transglottal pressure range for voicing scaling (cm H2O)
/// Stevens (1998) Ch. 7
const VOICING_RANGE: f32 = 6.0;

/// Guard against division by zero
const EPSILON: f32 = 1e-6;

// ============================================================================
// Aerodynamic model struct
// ============================================================================

/// Aerodynamic model for vocal tract simulation.
///
/// Citations:
/// - Stevens & Bickley (1991) "Constraints among parameters simplify control
///   of Klatt formant synthesizer" JASA 88(3), 1208-1218
/// - Stevens (1998) "Acoustic Phonetics" MIT Press -- Ch. 2, 3, 7, 8
#[repr(C)]
pub struct AerodynamicModel {
    sample_rate: f32,

    /// Intraoral pressure state (cm H2O). Builds during stop closure,
    /// releases on constriction opening.
    /// Stevens (1998) Eq. 2.17: Pm = Ps / (1 + (Ac/Ag)^2)
    pm: f32,

    /// Pressure buildup time constant (seconds).
    /// Stevens (1998) Ch. 7: ~10-20 ms for stop closure.
    tau_buildup: f32,

    /// Pressure release time constant (seconds).
    /// Stevens (1998) Ch. 7: ~5 ms for stop release.
    tau_release: f32,
}

impl AerodynamicModel {
    pub fn new(sample_rate: f32) -> Self {
        let sr = if sample_rate > 0.0 { sample_rate } else { 44_100.0 };
        Self {
            sample_rate: sr,
            pm: 0.0,
            // Stevens (1998) Ch. 7: ~10-20 ms buildup, ~5 ms release
            tau_buildup: 0.015,
            tau_release: 0.005,
        }
    }

    fn reset(&mut self) {
        self.pm = 0.0;
    }

    /// Process a block of samples.
    ///
    /// Inputs (AudioParam slices, may be length 1 for k-rate or N for a-rate):
    /// - `ag`: Glottal area (cm2), typical modal ~0.05, breathy ~0.15
    /// - `ac`: Constriction area (cm2), open vocal tract ~3.0, closed ~0.0
    /// - `ps`: Subglottal pressure (cm H2O), typical ~8.0
    ///
    /// Outputs (filled for each sample):
    /// - `voicing_out`: Voicing amplitude (0.0-1.0 linear)
    /// - `aspiration_out`: Aspiration noise amplitude (0.0-1.0 linear)
    /// - `b1_out`: First formant bandwidth (Hz)
    pub fn process(
        &mut self,
        ag: &[f32],
        ac: &[f32],
        ps: &[f32],
        voicing_out: &mut [f32],
        aspiration_out: &mut [f32],
        b1_out: &mut [f32],
    ) {
        let len = voicing_out.len();
        let ag_len = ag.len();
        let ac_len = ac.len();
        let ps_len = ps.len();

        for i in 0..len {
            // Read AudioParam values (k-rate or a-rate pattern)
            // Clamp inputs to non-negative: FFI callers may pass negative values
            // which would cause voicing > 1.0 and negative B1.
            let ag_val = if ag_len == 0 { 0.05 } else if ag_len > 1 { ag[i % ag_len] } else { ag[0] };
            let ag_val = ag_val.max(0.0);
            let ac_val = if ac_len == 0 { 0.0 } else if ac_len > 1 { ac[i % ac_len] } else { ac[0] };
            let ac_val = ac_val.max(0.0);
            let ps_val = if ps_len == 0 { PS_DEFAULT } else if ps_len > 1 { ps[i % ps_len] } else { ps[0] };
            let ps_val = ps_val.max(0.0);

            // 1. Intraoral pressure target — Stevens (1998) Eq. 2.17
            //    Pm = Ps / (1 + (Ac/Ag)^2)
            let pm_target = if ac_val < EPSILON {
                // Sealed constriction: Pm -> Ps (no airflow escape)
                ps_val
            } else {
                let ratio = ac_val / ag_val.max(EPSILON);
                ps_val / (1.0 + ratio * ratio)
            };

            // 2. Pressure dynamics — exponential approach with time constant
            //    Stevens (1998) Ch. 7: ~15 ms buildup, ~5 ms release
            let tau = if pm_target > self.pm { self.tau_buildup } else { self.tau_release };
            let dt = 1.0 / self.sample_rate;
            let alpha = 1.0 - (-dt / tau).exp();
            self.pm += (pm_target - self.pm) * alpha;

            // 3. Transglottal pressure — Stevens (1998) Ch. 2
            let delta_pg = (ps_val - self.pm).max(0.0);

            // 4. Glottal flow — Stevens (1998) Ch. 2, Bernoulli equation
            //    Ug = Ag * sqrt(2 * delta_Pg_dyn / rho)
            //    where delta_Pg_dyn = delta_Pg * CM_H2O_TO_DYN
            let ug = ag_val.max(0.0) * (2.0 * delta_pg * CM_H2O_TO_DYN / RHO).sqrt();

            // 5. Voicing amplitude — Stevens (1998) Ch. 7, with Ag-dependent efficiency
            //    Base voicing from transglottal pressure
            let av_pressure = ((delta_pg - VOICING_THRESHOLD) / VOICING_RANGE).clamp(0.0, 1.0);
            //    Voicing efficiency decreases with glottal area (wide glottis -> breathy)
            //    Modal Ag ~ 0.05, fully open Ag ~ 0.3
            let voicing_efficiency = (1.0 - (ag_val / 0.3).clamp(0.0, 1.0)).max(0.0);
            let av_linear = av_pressure * (0.3 + 0.7 * voicing_efficiency);
            //    Ensures: modal (ag=0.05) -> ~0.88 efficiency, breathy (ag=0.15) -> ~0.65

            // 6. Aspiration noise — Stevens (1998) Eq. 2.21, Ch. 8
            //    Turbulence noise: ps_noise proportional to Ug^3 * Ag^-2.5
            //    Physically: noise ∝ U^3 * A^-2.5, but perceptual aspiration also depends on
            //    reduced voicing and spectral tilt (Stevens 1998 Ch. 8)
            //    Simplified: scale aspiration with glottal area relative to modal
            let ah_linear = if ag_val < EPSILON || ug < EPSILON {
                0.0
            } else {
                let ag_ratio = (ag_val / 0.05 - 1.0).max(0.0); // 0 at modal, 2 at breathy
                let flow_factor = (ug / 200.0).clamp(0.0, 1.0); // Normalized flow
                (ag_ratio * flow_factor * 0.25).clamp(0.0, 1.0)
            };

            // 7. B1 bandwidth — Stevens (1998) Ch. 3 Eq. 3.58, Ch. 8
            //    B1 = B1_base + B1_glottal_coeff * Ag (when voicing is active)
            //    When voicing ceases (delta_Pg < threshold), glottal coupling loss = 0
            let voicing_factor = (delta_pg / VOICING_THRESHOLD).clamp(0.0, 1.0);
            let b1 = B1_BASE + B1_GLOTTAL_COEFF * ag_val * voicing_factor;

            // Defensive output clamping: ensure outputs stay in valid ranges
            // even if upstream arithmetic drifts due to unusual input combinations.
            voicing_out[i] = av_linear.clamp(0.0, 1.0);
            aspiration_out[i] = ah_linear.clamp(0.0, 1.0);
            b1_out[i] = b1.max(0.0);
        }
    }
}

// ============================================================================
// FFI exports
// ============================================================================

#[no_mangle]
pub extern "C" fn aerodynamic_model_new(sample_rate: f32) -> *mut AerodynamicModel {
    Box::into_raw(Box::new(AerodynamicModel::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn aerodynamic_model_free(ptr: *mut AerodynamicModel) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn aerodynamic_model_reset(ptr: *mut AerodynamicModel) {
    if let Some(model) = ptr.as_mut() {
        model.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn aerodynamic_model_process(
    ptr: *mut AerodynamicModel,
    ag_ptr: *const f32,
    ag_len: usize,
    ac_ptr: *const f32,
    ac_len: usize,
    ps_ptr: *const f32,
    ps_len: usize,
    voicing_ptr: *mut f32,
    aspiration_ptr: *mut f32,
    b1_ptr: *mut f32,
    output_len: usize,
) {
    if ptr.is_null() || voicing_ptr.is_null() || aspiration_ptr.is_null() || b1_ptr.is_null() || output_len == 0 {
        return;
    }

    let ag = if ag_ptr.is_null() || ag_len == 0 { &[][..] } else { core::slice::from_raw_parts(ag_ptr, ag_len) };
    let ac = if ac_ptr.is_null() || ac_len == 0 { &[][..] } else { core::slice::from_raw_parts(ac_ptr, ac_len) };
    let ps = if ps_ptr.is_null() || ps_len == 0 { &[][..] } else { core::slice::from_raw_parts(ps_ptr, ps_len) };

    let voicing_out = core::slice::from_raw_parts_mut(voicing_ptr, output_len);
    let aspiration_out = core::slice::from_raw_parts_mut(aspiration_ptr, output_len);
    let b1_out = core::slice::from_raw_parts_mut(b1_ptr, output_len);

    if let Some(model) = ptr.as_mut() {
        model.process(ag, ac, ps, voicing_out, aspiration_out, b1_out);
    }
}

// ============================================================================
// Tests — Calibration vectors from Stevens (1998)
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    /// Test 1: Modal vowel (ag=0.05, ac=3.0)
    /// Stevens (1998) Ch. 2: modal peak flow ~200 cm3/s
    #[test]
    fn test_modal_vowel() {
        let ag = 0.05_f32;
        let ac = 3.0_f32;
        let ps = PS_DEFAULT;

        // Pm = Ps / (1 + (Ac/Ag)^2) — Stevens (1998) Eq. 2.17
        let ratio = ac / ag; // 60
        let pm = ps / (1.0 + ratio * ratio); // ~ 0.002
        assert!(pm < 0.01, "Pm should be near 0 for open vowel, got {pm}");

        // delta_Pg = Ps - Pm
        let delta_pg = ps - pm;
        assert!((delta_pg - 8.0).abs() < 0.1, "delta_Pg should be ~8.0, got {delta_pg}");

        // Ug = Ag * sqrt(2 * delta_Pg_dyn / rho) where delta_Pg_dyn = delta_Pg * CM_H2O_TO_DYN
        let ug = ag * (2.0 * delta_pg * CM_H2O_TO_DYN / RHO).sqrt();
        assert!((ug - 186.0).abs() < 20.0, "Ug should be ~186 cm3/s, got {ug}");

        // Voicing: strong (delta_Pg well above threshold)
        let av = ((delta_pg - VOICING_THRESHOLD) / VOICING_RANGE).clamp(0.0, 1.0);
        assert!(av > 0.8, "av_linear should be > 0.8 for modal voicing, got {av}");

        // B1 = B1_base + B1_glottal_coeff * Ag
        let b1 = B1_BASE + B1_GLOTTAL_COEFF * ag;
        assert!((b1 - 140.0).abs() < 10.0, "B1 should be ~140 Hz, got {b1}");
    }

    /// Test 2: Breathy /h/ (ag=0.15, ac=3.0)
    /// Stevens (1998) Ch. 8: /h/ B1 ~ 280 Hz
    #[test]
    fn test_breathy_h() {
        let ag = 0.15_f32;
        let ac = 3.0_f32;
        let ps = PS_DEFAULT;

        let ratio = ac / ag; // 20
        let pm = ps / (1.0 + ratio * ratio);
        assert!(pm < 0.1, "Pm should be near 0 for /h/, got {pm}");

        let delta_pg = ps - pm;
        let ug = ag * (2.0 * delta_pg * CM_H2O_TO_DYN / RHO).sqrt();
        assert!((ug - 557.0).abs() < 60.0, "Ug should be ~557 cm3/s, got {ug}");

        // B1 ~ 280 Hz for /h/
        let b1 = B1_BASE + B1_GLOTTAL_COEFF * ag;
        assert!((b1 - 280.0).abs() < 10.0, "B1 should be ~280 Hz for /h/, got {b1}");
    }

    /// Test 3: Stop closure (ag=0.05, ac=0.0) -- steady state
    /// Stevens (1998) Ch. 7: Pm -> Ps during closure
    #[test]
    fn test_stop_closure_steady_state() {
        let ag = 0.05_f32;
        let ac = 0.0_f32;
        let ps = PS_DEFAULT;

        // With ac=0, ratio -> infinity, Pm -> Ps
        // Guard: when ac < EPSILON, Pm = Ps
        let pm = if ac < EPSILON { ps } else { ps / (1.0 + (ac / ag).powi(2)) };
        assert!((pm - ps).abs() < 0.01, "Pm should equal Ps during closure, got {pm}");

        let delta_pg = ps - pm;
        assert!(delta_pg.abs() < 0.01, "delta_Pg should be ~0 during closure, got {delta_pg}");

        // Voicing ceases when delta_Pg < threshold
        let av = ((delta_pg - VOICING_THRESHOLD) / VOICING_RANGE).clamp(0.0, 1.0);
        assert!(av < 0.01, "av should be ~0 during stop closure, got {av}");
    }

    /// Test 4: Stop release (ag=0.05, ac transitions 0->3) -- time-domain with internal state
    /// Stevens (1998) Ch. 7: pressure release ~5 ms time constant
    #[test]
    fn test_stop_release_pressure_dynamics() {
        let sample_rate = 44100.0_f32;
        let mut model = AerodynamicModel::new(sample_rate);

        let block_size = 128;
        let mut voicing = vec![0.0_f32; block_size];
        let mut aspiration = vec![0.0_f32; block_size];
        let mut b1 = vec![0.0_f32; block_size];

        // Run 50 ms of closure (enough for Pm to reach Ps)
        let closure_blocks = ((0.050 * sample_rate) as usize) / block_size + 1;
        for _ in 0..closure_blocks {
            model.process(
                &[0.05], &[0.0], &[PS_DEFAULT],
                &mut voicing, &mut aspiration, &mut b1,
            );
        }
        // After 50 ms closure, Pm should be near Ps, voicing near 0
        assert!(voicing[block_size - 1] < 0.1, "Voicing should be near 0 after 50ms closure");

        // Now release: set ac=3.0
        // Run 30 ms of release
        let release_blocks = ((0.030 * sample_rate) as usize) / block_size + 1;
        for _ in 0..release_blocks {
            model.process(
                &[0.05], &[3.0], &[PS_DEFAULT],
                &mut voicing, &mut aspiration, &mut b1,
            );
        }
        // After 30 ms release, Pm should have dropped, voicing should recover
        assert!(voicing[block_size - 1] > 0.5, "Voicing should recover after 30ms release");
    }

    /// Test 5: Voicing threshold (ac sweeps from 3.0 -> 0.0)
    /// Stevens (1998) Ch. 2: voicing ceases when delta_Pg < ~2-3 cm H2O
    #[test]
    fn test_voicing_cessation_threshold() {
        let ag = 0.05_f32;
        let ps = PS_DEFAULT;

        // Find ac where Pm rises enough that delta_Pg < VOICING_THRESHOLD
        // Pm = Ps / (1 + (ac/ag)^2)
        // delta_Pg = Ps - Pm = Ps * (ac/ag)^2 / (1 + (ac/ag)^2)
        // delta_Pg < threshold when (ac/ag)^2 < threshold / (Ps - threshold)
        // ac < ag * sqrt(threshold / (Ps - threshold))
        // ac < 0.05 * sqrt(2/6) ~ 0.05 * 0.577 ~ 0.029

        let critical_ac = ag * (VOICING_THRESHOLD / (ps - VOICING_THRESHOLD)).sqrt();
        assert!((critical_ac - 0.029).abs() < 0.005, "Critical ac should be ~0.029, got {critical_ac}");

        // Above critical: voicing present
        let ac_above = critical_ac + 0.01;
        let pm_above = ps / (1.0 + (ac_above / ag).powi(2));
        let dpg_above = ps - pm_above;
        assert!(dpg_above > VOICING_THRESHOLD, "Should have voicing above critical ac");

        // Below critical: voicing absent
        let ac_below = critical_ac - 0.01;
        let ac_clamped = ac_below.max(EPSILON);
        let pm_below = ps / (1.0 + (ac_clamped / ag).powi(2));
        let dpg_below = ps - pm_below;
        assert!(dpg_below < VOICING_THRESHOLD, "Should lose voicing below critical ac");
    }
}
