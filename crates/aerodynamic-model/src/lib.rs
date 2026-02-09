#![allow(clippy::too_many_arguments)]
#![allow(clippy::missing_safety_doc)]

use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

// ============================================================================
// Physical constants
//
// Citations:
// - Stevens & Bickley (1991) "Constraints among parameters simplify control
//   of Klatt formant synthesizer" Journal of Phonetics 19, 161-174
// - Stevens (1998) "Acoustic Phonetics" MIT Press
// ============================================================================

/// Default subglottal pressure (cm H2O)
const PS_DEFAULT: f32 = 8.0;

/// Air density (g/cm3)
const RHO: f32 = 0.00114;

/// 1 cm H2O = 980.665 dyn/cm2
const CM_H2O_TO_DYN: f32 = 980.665;

/// Baseline first-formant bandwidth (Hz)
const B1_BASE: f32 = 60.0;

/// Approximate B1 contribution from glottal opening (Hz/cm2)
const B1_GLOTTAL_COEFF: f32 = 1400.0;

/// Approximate voicing threshold (cm H2O)
const VOICING_THRESHOLD: f32 = 2.0;

/// Pressure range used to scale voicing strength (cm H2O)
const VOICING_RANGE: f32 = 6.0;

/// Numerical guard
const EPSILON: f32 = 1e-6;

// ============================================================================
// Aerodynamic model struct
// ============================================================================

/// Aerodynamic HL -> KL approximation model.
///
/// The paper's mapping is partly qualitative; this implementation uses explicit,
/// documented approximations while preserving the HL control surface:
/// `ag ac an st pm` (+ contextual `ps`).
#[repr(C)]
pub struct AerodynamicModel {
    sample_rate: f32,

    /// Intraoral pressure state (cm H2O)
    pm: f32,

    /// Pressure buildup and release time constants.
    tau_buildup: f32,
    tau_release: f32,
}

impl AerodynamicModel {
    pub fn new(sample_rate: f32) -> Self {
        let sr = if sample_rate > 0.0 { sample_rate } else { 44_100.0 };
        Self {
            sample_rate: sr,
            pm: 0.0,
            // Stevens (1991/1998) stop timing guidance: slower buildup, faster release
            tau_buildup: 0.015,
            tau_release: 0.005,
        }
    }

    fn reset(&mut self) {
        self.pm = 0.0;
    }

    #[inline]
    fn read_param(values: &[f32], i: usize, default: f32) -> f32 {
        match values.len() {
            0 => default,
            1 => values[0],
            len => values[i % len],
        }
    }

    /// Process a block of samples.
    ///
    /// Inputs (AudioParam slices):
    /// - `enable`: model enable flag (0..1); 0 hard-disables all outputs
    /// - `ag`: glottal area (cm2)
    /// - `ac`: oral constriction area (cm2)
    /// - `an`: velopharyngeal area (cm2)
    /// - `st`: stridency correction (dB, 0..-10)
    /// - `pm`: pressure manipulation (fraction of Ps)
    /// - `ps`: subglottal pressure (cm H2O)
    ///
    /// Outputs:
    /// - `voicing_out`: AV linear (0..1)
    /// - `aspiration_out`: AH linear (0..1)
    /// - `frication_out`: AF linear (0..1)
    /// - `b1_out`: B1 bandwidth (Hz)
    /// - `fnp_out`: nasal pole frequency (Hz)
    /// - `fnz_out`: nasal zero frequency (Hz)
    /// - `oq_out`: open quotient ratio (0..1)
    /// - `tl_out`: spectral tilt proxy (dB/oct)
    pub fn process(
        &mut self,
        enable: &[f32],
        ag: &[f32],
        ac: &[f32],
        an: &[f32],
        st: &[f32],
        pm: &[f32],
        ps: &[f32],
        voicing_out: &mut [f32],
        aspiration_out: &mut [f32],
        frication_out: &mut [f32],
        b1_out: &mut [f32],
        fnp_out: &mut [f32],
        fnz_out: &mut [f32],
        oq_out: &mut [f32],
        tl_out: &mut [f32],
    ) {
        let len = voicing_out.len();

        for i in 0..len {
            let enable_val = Self::read_param(enable, i, 0.0).clamp(0.0, 1.0);
            let ag_val = Self::read_param(ag, i, 0.05).clamp(0.0, 0.4);
            let ac_val = Self::read_param(ac, i, 0.4).clamp(0.0, 0.4);
            let an_val = Self::read_param(an, i, 0.0).clamp(0.0, 1.0);
            let st_val = Self::read_param(st, i, 0.0).clamp(-10.0, 0.0);
            let pm_val = Self::read_param(pm, i, 0.0).clamp(-0.5, 0.2);
            let ps_val = Self::read_param(ps, i, PS_DEFAULT).max(0.0);

            // Passive pressure target from constriction/glottis ratio.
            let pm_passive_target = if ac_val < EPSILON {
                ps_val
            } else {
                let ratio = ac_val / ag_val.max(EPSILON);
                ps_val / (1.0 + ratio * ratio)
            };

            // pm is the active manipulation term as a fraction of Ps.
            let pm_target = (pm_passive_target + pm_val * ps_val).clamp(0.0, ps_val);

            // State dynamics for intraoral pressure.
            let tau = if pm_target > self.pm {
                self.tau_buildup
            } else {
                self.tau_release
            };
            let dt = 1.0 / self.sample_rate;
            let alpha = 1.0 - (-dt / tau).exp();
            self.pm += (pm_target - self.pm) * alpha;

            // Transglottal pressure and flows.
            let delta_pg = (ps_val - self.pm).max(0.0);
            let ug = ag_val * (2.0 * delta_pg * CM_H2O_TO_DYN / RHO).sqrt();
            let uc = if ac_val < EPSILON {
                0.0
            } else {
                ac_val * (2.0 * self.pm.max(0.0) * CM_H2O_TO_DYN / RHO).sqrt()
            };

            // AV approximation from transglottal pressure and glottal opening.
            let av_pressure = ((delta_pg - VOICING_THRESHOLD) / VOICING_RANGE).clamp(0.0, 1.0);
            let voicing_efficiency = (1.0 - (ag_val / 0.3).clamp(0.0, 1.0)).max(0.0);
            let av_linear = av_pressure * (0.25 + 0.75 * voicing_efficiency);

            // AH approximation from turbulence law + abduction emphasis.
            let ah_linear = if ug < EPSILON || ag_val < EPSILON {
                0.0
            } else {
                let flow_term = (ug / 300.0).powf(3.0);
                let area_term = (0.05 / ag_val.max(0.01)).powf(2.5);
                let abduction = ((ag_val - 0.05) / 0.25).clamp(0.0, 1.0);
                (flow_term * area_term * abduction * 0.08).clamp(0.0, 1.0)
            };

            // AF approximation from constriction flow + stridency correction.
            let af_linear = if uc < EPSILON || ac_val < EPSILON {
                0.0
            } else {
                let flow_term = (uc / 300.0).powf(3.0);
                let area_term = (0.1 / ac_val.max(0.01)).powf(2.5);
                let stridency = 10.0_f32.powf(st_val / 20.0);
                (flow_term * area_term * stridency * 0.03).clamp(0.0, 1.0)
            };

            // B1 approximation: glottal losses dominate; nasal coupling adds a smaller term.
            let b1 = (B1_BASE + B1_GLOTTAL_COEFF * ag_val * av_pressure + 120.0 * an_val).clamp(40.0, 1000.0);

            // Nasal pole/zero approximation from an:
            // near-cancellation at low an, wider split at larger an.
            let sep = if an_val <= 0.15 {
                (an_val / 0.15) * 20.0
            } else {
                20.0 + ((an_val - 0.15) / 0.85).clamp(0.0, 1.0) * 280.0
            };
            let fnp = (500.0 - 0.5 * sep).clamp(200.0, 800.0);
            let fnz = (500.0 + 0.5 * sep).clamp(200.0, 1200.0);

            // OQ/TL proxies.
            let oq_ratio = (0.45 + 0.35 * (ag_val / 0.3).clamp(0.0, 1.0) + 0.2 * (1.0 - av_pressure)).clamp(0.35, 0.9);
            let tl_db = ((oq_ratio - 0.45) * 70.0).clamp(0.0, 30.0);

            voicing_out[i] = av_linear.clamp(0.0, 1.0) * enable_val;
            aspiration_out[i] = ah_linear.clamp(0.0, 1.0) * enable_val;
            frication_out[i] = af_linear.clamp(0.0, 1.0) * enable_val;
            b1_out[i] = b1 * enable_val;
            fnp_out[i] = fnp * enable_val;
            fnz_out[i] = fnz * enable_val;
            oq_out[i] = oq_ratio * enable_val;
            tl_out[i] = tl_db * enable_val;
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
    enable_ptr: *const f32,
    enable_len: usize,
    ag_ptr: *const f32,
    ag_len: usize,
    ac_ptr: *const f32,
    ac_len: usize,
    an_ptr: *const f32,
    an_len: usize,
    st_ptr: *const f32,
    st_len: usize,
    pm_ptr: *const f32,
    pm_len: usize,
    ps_ptr: *const f32,
    ps_len: usize,
    voicing_ptr: *mut f32,
    aspiration_ptr: *mut f32,
    frication_ptr: *mut f32,
    b1_ptr: *mut f32,
    fnp_ptr: *mut f32,
    fnz_ptr: *mut f32,
    oq_ptr: *mut f32,
    tl_ptr: *mut f32,
    output_len: usize,
) {
    if ptr.is_null()
        || voicing_ptr.is_null()
        || aspiration_ptr.is_null()
        || frication_ptr.is_null()
        || b1_ptr.is_null()
        || fnp_ptr.is_null()
        || fnz_ptr.is_null()
        || oq_ptr.is_null()
        || tl_ptr.is_null()
        || output_len == 0
    {
        return;
    }

    let enable = if enable_ptr.is_null() || enable_len == 0 {
        &[][..]
    } else {
        core::slice::from_raw_parts(enable_ptr, enable_len)
    };
    let ag = if ag_ptr.is_null() || ag_len == 0 { &[][..] } else { core::slice::from_raw_parts(ag_ptr, ag_len) };
    let ac = if ac_ptr.is_null() || ac_len == 0 { &[][..] } else { core::slice::from_raw_parts(ac_ptr, ac_len) };
    let an = if an_ptr.is_null() || an_len == 0 { &[][..] } else { core::slice::from_raw_parts(an_ptr, an_len) };
    let st = if st_ptr.is_null() || st_len == 0 { &[][..] } else { core::slice::from_raw_parts(st_ptr, st_len) };
    let pm = if pm_ptr.is_null() || pm_len == 0 { &[][..] } else { core::slice::from_raw_parts(pm_ptr, pm_len) };
    let ps = if ps_ptr.is_null() || ps_len == 0 { &[][..] } else { core::slice::from_raw_parts(ps_ptr, ps_len) };

    let voicing_out = core::slice::from_raw_parts_mut(voicing_ptr, output_len);
    let aspiration_out = core::slice::from_raw_parts_mut(aspiration_ptr, output_len);
    let frication_out = core::slice::from_raw_parts_mut(frication_ptr, output_len);
    let b1_out = core::slice::from_raw_parts_mut(b1_ptr, output_len);
    let fnp_out = core::slice::from_raw_parts_mut(fnp_ptr, output_len);
    let fnz_out = core::slice::from_raw_parts_mut(fnz_ptr, output_len);
    let oq_out = core::slice::from_raw_parts_mut(oq_ptr, output_len);
    let tl_out = core::slice::from_raw_parts_mut(tl_ptr, output_len);

    if let Some(model) = ptr.as_mut() {
        model.process(
            enable,
            ag,
            ac,
            an,
            st,
            pm,
            ps,
            voicing_out,
            aspiration_out,
            frication_out,
            b1_out,
            fnp_out,
            fnz_out,
            oq_out,
            tl_out,
        );
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn modal_profile_stays_mostly_voiced() {
        let mut model = AerodynamicModel::new(44_100.0);
        let n = 256;
        let mut av = vec![0.0; n];
        let mut ah = vec![0.0; n];
        let mut af = vec![0.0; n];
        let mut b1 = vec![0.0; n];
        let mut fnp = vec![0.0; n];
        let mut fnz = vec![0.0; n];
        let mut oq = vec![0.0; n];
        let mut tl = vec![0.0; n];

        model.process(
            &[1.0],
            &[0.05],
            &[0.4],
            &[0.0],
            &[0.0],
            &[0.0],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );

        assert!(av[n - 1] > 0.6, "expected strong modal voicing, got {}", av[n - 1]);
        assert!(ah[n - 1] < 0.2, "modal aspiration should stay low, got {}", ah[n - 1]);
        assert!(b1[n - 1] >= 60.0 && b1[n - 1] <= 220.0, "modal B1 out of range: {}", b1[n - 1]);
        assert!(oq[n - 1] >= 0.35 && oq[n - 1] <= 0.9, "OQ out of range: {}", oq[n - 1]);
        assert!(tl[n - 1] >= 0.0 && tl[n - 1] <= 30.0, "TL out of range: {}", tl[n - 1]);
    }

    #[test]
    fn stop_closure_reduces_voicing_and_frication() {
        let mut model = AerodynamicModel::new(44_100.0);
        let n = 128;
        let mut av = vec![0.0; n];
        let mut ah = vec![0.0; n];
        let mut af = vec![0.0; n];
        let mut b1 = vec![0.0; n];
        let mut fnp = vec![0.0; n];
        let mut fnz = vec![0.0; n];
        let mut oq = vec![0.0; n];
        let mut tl = vec![0.0; n];

        for _ in 0..20 {
            model.process(
                &[1.0],
                &[0.05],
                &[0.0],
                &[0.0],
                &[0.0],
                &[0.0],
                &[PS_DEFAULT],
                &mut av,
                &mut ah,
                &mut af,
                &mut b1,
                &mut fnp,
                &mut fnz,
                &mut oq,
                &mut tl,
            );
        }

        assert!(av[n - 1] < 0.2, "voicing should decay during closure, got {}", av[n - 1]);
        assert!(af[n - 1] < 0.01, "frication should be near zero at ac=0, got {}", af[n - 1]);
    }

    #[test]
    fn nasal_opening_separates_pole_zero() {
        let mut model = AerodynamicModel::new(44_100.0);
        let n = 64;
        let mut av = vec![0.0; n];
        let mut ah = vec![0.0; n];
        let mut af = vec![0.0; n];
        let mut b1 = vec![0.0; n];
        let mut fnp = vec![0.0; n];
        let mut fnz = vec![0.0; n];
        let mut oq = vec![0.0; n];
        let mut tl = vec![0.0; n];

        model.process(
            &[1.0],
            &[0.05],
            &[0.0],
            &[0.0],
            &[0.0],
            &[0.0],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );
        let sep_closed = fnz[n - 1] - fnp[n - 1];

        model.process(
            &[1.0],
            &[0.05],
            &[0.0],
            &[0.8],
            &[0.0],
            &[0.0],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );
        let sep_open = fnz[n - 1] - fnp[n - 1];

        assert!(sep_open > sep_closed + 100.0, "expected wider FNP/FNZ split with nasal opening");
    }

    #[test]
    fn stridency_reduces_frication_when_more_negative() {
        let mut model = AerodynamicModel::new(44_100.0);
        let n = 64;
        let mut av = vec![0.0; n];
        let mut ah = vec![0.0; n];
        let mut af = vec![0.0; n];
        let mut b1 = vec![0.0; n];
        let mut fnp = vec![0.0; n];
        let mut fnz = vec![0.0; n];
        let mut oq = vec![0.0; n];
        let mut tl = vec![0.0; n];

        model.process(
            &[1.0],
            &[0.1],
            &[0.05],
            &[0.0],
            &[0.0],
            &[0.0],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );
        let af_full = af[n - 1];

        model.process(
            &[1.0],
            &[0.1],
            &[0.05],
            &[0.0],
            &[-10.0],
            &[0.0],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );
        let af_reduced = af[n - 1];

        assert!(af_reduced < af_full, "negative st should reduce frication: {af_reduced} !< {af_full}");
    }

    #[test]
    fn positive_pm_reduces_voicing() {
        let mut model = AerodynamicModel::new(44_100.0);
        let n = 64;
        let mut av = vec![0.0; n];
        let mut ah = vec![0.0; n];
        let mut af = vec![0.0; n];
        let mut b1 = vec![0.0; n];
        let mut fnp = vec![0.0; n];
        let mut fnz = vec![0.0; n];
        let mut oq = vec![0.0; n];
        let mut tl = vec![0.0; n];

        model.process(
            &[1.0],
            &[0.05],
            &[0.1],
            &[0.0],
            &[0.0],
            &[0.0],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );
        let av_passive = av[n - 1];

        model.process(
            &[1.0],
            &[0.05],
            &[0.1],
            &[0.0],
            &[0.0],
            &[0.2],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );
        let av_active = av[n - 1];

        assert!(av_active < av_passive, "positive pm should lower transglottal pressure and AV");
    }

    #[test]
    fn disabled_model_outputs_are_zero() {
        let mut model = AerodynamicModel::new(44_100.0);
        let n = 32;
        let mut av = vec![0.0; n];
        let mut ah = vec![0.0; n];
        let mut af = vec![0.0; n];
        let mut b1 = vec![0.0; n];
        let mut fnp = vec![0.0; n];
        let mut fnz = vec![0.0; n];
        let mut oq = vec![0.0; n];
        let mut tl = vec![0.0; n];

        model.process(
            &[0.0],
            &[0.05],
            &[0.2],
            &[0.5],
            &[0.0],
            &[0.1],
            &[PS_DEFAULT],
            &mut av,
            &mut ah,
            &mut af,
            &mut b1,
            &mut fnp,
            &mut fnz,
            &mut oq,
            &mut tl,
        );

        assert_eq!(av[n - 1], 0.0);
        assert_eq!(ah[n - 1], 0.0);
        assert_eq!(af[n - 1], 0.0);
        assert_eq!(b1[n - 1], 0.0);
        assert_eq!(fnp[n - 1], 0.0);
        assert_eq!(fnz[n - 1], 0.0);
        assert_eq!(oq[n - 1], 0.0);
        assert_eq!(tl[n - 1], 0.0);
    }
}
