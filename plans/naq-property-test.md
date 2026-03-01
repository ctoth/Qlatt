# Plan: NAQ Property Test for LF Source

**Status:** Proposed
**Priority:** Low
**Source:** Drugman et al. (2020) "Comparative Study of Glottal Source Estimation"

## Goal

Add a property-based test (proptest) that verifies the LF source produces waveforms with expected NAQ (Normalized Amplitude Quotient) values based on the Rd parameter.

## Background

NAQ is defined as:
```
NAQ = (f_ac * T0) / d_peak
```
Where:
- f_ac = peak amplitude of glottal flow
- d_peak = magnitude of negative peak of flow derivative
- T0 = fundamental period

For the LF model, there's an approximate analytical relationship:
```
NAQ ≈ Oq / (2 * αm)
```

The LF source already converts Rd → Oq, αm (lib.rs:170-180):
```rust
let ra = (-1.0 + 4.8 * rd_clamped) / 100.0;
let rk = (22.4 + 11.8 * rd_clamped) / 100.0;
// ...
let oq = (1.0 + rk) / (2.0 * rg);
let alpha_m = 1.0 / (1.0 + rk);
```

## The Property

```
∀ (f0 ∈ [80, 300], rd ∈ [0.3, 2.7]):
  let expected_naq = oq / (2 * alpha_m)  // from rd
  let measured_naq = measure_naq(generate_waveform(f0, rd))
  |measured_naq - expected_naq| < tolerance
```

With tolerance ~10-15% (the relationship is approximate).

## Implementation Steps

### 1. Add proptest dependency
```toml
[dev-dependencies]
proptest = "1.0"
```

### 2. Create NAQ measurement function
```rust
fn measure_naq(waveform: &[f32], sample_rate: f32, f0: f32) -> f32 {
    let t0 = sample_rate / f0;

    // Find peak of flow (integrate derivative, or use waveform directly)
    let f_ac = waveform.iter().cloned().fold(f32::MIN, f32::max);

    // Find negative peak of derivative
    let derivative: Vec<f32> = waveform.windows(2)
        .map(|w| w[1] - w[0])
        .collect();
    let d_peak = derivative.iter().cloned().fold(f32::MAX, f32::min).abs();

    (f_ac * t0) / d_peak
}
```

### 3. Create expected NAQ function
```rust
fn expected_naq_from_rd(rd: f32) -> f32 {
    let rd = rd.clamp(0.3, 2.7);
    let ra = (-1.0 + 4.8 * rd) / 100.0;
    let rk = (22.4 + 11.8 * rd) / 100.0;
    let rg = /* same formula as lib.rs */;
    let oq = (1.0 + rk) / (2.0 * rg);
    let alpha_m = 1.0 / (1.0 + rk);
    oq / (2.0 * alpha_m)
}
```

### 4. Write property test
```rust
proptest! {
    #[test]
    fn naq_matches_rd_parameter(
        f0 in 80.0f32..300.0,
        rd in 0.3f32..2.7,
    ) {
        let sample_rate = 16000.0;
        let mut source = LfSource::new(sample_rate);

        // Generate several periods
        let num_samples = (sample_rate / f0 * 5.0) as usize;
        let mut output = vec![0.0; num_samples];
        source.process(&[f0], &[rd], &mut output);

        // Skip first period (transient), measure middle periods
        let period_samples = (sample_rate / f0) as usize;
        let stable_output = &output[period_samples..period_samples*4];

        let measured = measure_naq(stable_output, sample_rate, f0);
        let expected = expected_naq_from_rd(rd);

        let relative_error = (measured - expected).abs() / expected;
        prop_assert!(relative_error < 0.15,
            "NAQ mismatch: measured={}, expected={}, rd={}",
            measured, expected, rd);
    }
}
```

### 5. Add ordering invariant test
```rust
proptest! {
    #[test]
    fn naq_ordering_breathy_gt_modal_gt_pressed(f0 in 80.0f32..300.0) {
        let sample_rate = 16000.0;

        let naq_pressed = generate_and_measure(f0, 0.5, sample_rate);  // low Rd
        let naq_modal = generate_and_measure(f0, 1.0, sample_rate);    // mid Rd
        let naq_breathy = generate_and_measure(f0, 2.0, sample_rate);  // high Rd

        prop_assert!(naq_breathy > naq_modal, "breathy should have higher NAQ than modal");
        prop_assert!(naq_modal > naq_pressed, "modal should have higher NAQ than pressed");
    }
}
```

## Caveats

1. The LF source outputs flow *derivative*, not flow - may need to integrate first
2. Filter transients affect first period - skip it
3. The NAQ ≈ Oq/(2αm) relationship is approximate; tolerance needs tuning
4. Need to handle edge cases where waveform is zero/invalid

## Alternative: Simpler H1-H2 Test

If NAQ measurement is too finicky, H1-H2 (spectral tilt) is easier:
- Compute FFT of one period
- Measure amplitude at f0 and 2*f0
- H1-H2 = 20*log10(|H1|/|H2|)
- Higher Rd → higher H1-H2

This might be more robust since it's frequency-domain.

## References

- Alku et al. (2002) - NAQ definition
- Drugman et al. (2020) - NAQ as voice quality discriminator
- Fant (1995) - Rd parameter and LF model relationships
- papers/Drugman_2020_GlottalSourceEstimation/notes.md
