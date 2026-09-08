use super::*;

#[test]
fn shape_changes_wait_for_the_next_period() {
    let mut source = LfSource::new(48000.0);
    source.set_mode(LfMode::from_u32(3));
    let mut prefix = [0.0; 120];
    source.process(&[100.0], &[1.0], &[0.0], &[0.0], 0.0, 0.0, 0.0, &mut prefix);
    let expected = source.pulse;
    source.set_mode(LfMode::from_u32(4));
    let mut remainder = [0.0; 360];
    source.process(
        &[100.0],
        &[1.0],
        &[0.0],
        &[0.0],
        0.0,
        0.0,
        0.0,
        &mut remainder,
    );
    for (i, actual) in remainder.iter().enumerate() {
        assert_eq!(*actual, expected.rpp_sample((120 + i) as f64 / 480.0));
    }
    let mut next = [0.0; 480];
    source.process(&[100.0], &[1.0], &[0.0], &[0.0], 0.0, 0.0, 0.0, &mut next);
    for (i, actual) in next.iter().enumerate() {
        assert_eq!(
            *actual,
            shapes::Pulse::rosenberg(0.56_f32 as f64).rosenberg_sample(i as f64 / 480.0)
        );
    }
}

#[test]
fn alternative_modes_are_distinct_periodic_and_block_invariant() {
    let render = |mode, block| {
        let mut source = LfSource::new(48000.0);
        source.set_mode(LfMode::from_u32(mode));
        let mut output = vec![0.0; 1920];
        for chunk in output.chunks_mut(block) {
            source.process(&[100.0], &[1.0], &[56.0], &[0.0], 0.0, 0.0, 0.0, chunk);
        }
        output
    };
    for mode in [3, 4] {
        let output = render(mode, 128);
        assert_eq!(output, render(mode, 1));
        assert!(output.iter().all(|v| v.is_finite()));
        assert!(
            output != render(0, 128),
            "mode {mode} must not alias Legacy"
        );
        assert_eq!(&output[..480], &output[480..960]);
    }
    assert_ne!(render(3, 128), render(4, 128));
}

#[test]
fn rosenberg_c_matches_derivative_of_published_flow() {
    let pulse = shapes::Pulse::rosenberg(0.56);
    let flow = |t: f64| {
        // Rosenberg 1971 Fig. 3C, amplitude scaled so closure derivative is -1.
        let amplitude = 2.0 * 0.16 / std::f64::consts::PI;
        if t < 0.40 {
            amplitude * 0.5 * (1.0 - (std::f64::consts::PI * t / 0.40).cos())
        } else if t < 0.56 {
            amplitude * (std::f64::consts::PI * (t - 0.40) / 0.32).cos()
        } else {
            0.0
        }
    };
    for i in 1..1000 {
        let t = i as f64 / 1000.0;
        if (t - 0.56).abs() < 1e-6 {
            continue;
        }
        let derivative = (flow(t + 1e-6) - flow(t - 1e-6)) / 2e-6;
        assert!((pulse.rosenberg_sample(t) as f64 - derivative).abs() < 1e-5);
    }
}

#[test]
fn rpp_agrees_with_analytic_lf_in_veldhuis_low_rk_region() {
    // Veldhuis 1998 Eqs. 2, 4-7: independent analytic LF oracle.
    // The paper states close agreement for Rk < 0.5, not a numeric bound.
    // 0.08 RMS/E is an engineering regression tolerance, not a paper claim.
    for rk in [0.3, 0.4, 0.49] {
        let te = 0.6;
        let tp = te / (1.0 + rk);
        let ta = 0.04;
        let (pulse, projected) = shapes::Pulse::rpp(te, tp, ta);
        assert!(!projected);
        let w = std::f64::consts::PI / tp;
        let s = (w * te).sin();
        let area = ta - (1.0 - te) / ((1.0 - te) / ta).exp_m1();
        let integral =
            |a: f64| -(a * s - w * (w * te).cos() + w * (-a * te).exp()) / ((a * a + w * w) * s);
        let (mut lo, mut hi) = (-100.0, 100.0);
        for _ in 0..100 {
            let mid = (lo + hi) / 2.0;
            if integral(mid) > area {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        let a = (lo + hi) / 2.0;
        assert!((integral(a) - area).abs() < 1e-12);
        let mut error = 0.0;
        let mut sum = 0.0;
        for i in 0..10000 {
            let t = (i as f64 + 0.5) / 10000.0;
            let lf = if t < te {
                -(a * (t - te)).exp() * (w * t).sin() / s
            } else {
                let end = (-(1.0 - te) / ta).exp();
                -((-(t - te) / ta).exp() - end) / (1.0 - end)
            };
            let actual = pulse.rpp_sample(t) as f64;
            error += (actual - lf).powi(2);
            sum += actual;
        }
        let rms = (error / 10000.0).sqrt();
        assert!(rms < 0.08, "Rk={rk}: RMS/E={rms}");
        assert!((sum / 10000.0).abs() < 1e-6, "flow must return to zero");
        assert!((pulse.rpp_sample(te) + 1.0).abs() < 1e-6);
        assert_eq!(pulse.rpp_sample(1.0), 0.0);
    }
}

#[test]
fn rpp_degenerate_limit_and_domain_projection_remain_finite() {
    let te = 0.6;
    let ta = 0.04;
    let area = ta - (1.0 - te) / f64::exp_m1((1.0 - te) / ta);
    // Veldhuis Eq. 11: denominator of tx vanishes, leaving R+ (Eq. 12).
    let tp = (2.0 * te * te + 6.0 * area * te) / (3.0 * te + 6.0 * area);
    let (pulse, projected) = shapes::Pulse::rpp(te, tp, ta);
    assert!(!projected);
    for i in 0..600 {
        let t = i as f64 / 1000.0;
        let expected = -t * (tp - t) / (te * (tp - te));
        assert!((pulse.rpp_sample(t) as f64 - expected).abs() < 1e-6);
    }
    for rd in [0.3, 1.0, 2.7] {
        for oq in [0.0, 1.0, 50.0, 99.0] {
            for tl in [0.0, 41.0] {
                let mut source = LfSource::new(48000.0);
                source.set_mode(LfMode::from_u32(3));
                let mut out = [0.0; 2400];
                source.process(&[100.0], &[rd], &[oq], &[tl], 0.0, 0.0, 0.0, &mut out);
                assert!(out.iter().all(|x| x.is_finite()));
                assert!(out.iter().any(|x| x.abs() > 0.1));
            }
        }
    }
}
