# Gesture-Space Voice Quality Formalism: Investigation

## 1. Executive Summary

**Does the formalism work?** Partially. A linear projection from gesture space to acoustic parameters is a valid first-order approximation for conversational speech (the pressed-to-modal range covering ~80% of natural speech). It breaks down at extremes (whisper, shout, singing), where nonlinear threshold effects and register transitions require piecewise or mode-switching models. About 60% of gesture-to-acoustic mappings are linear (Feugere 2017); the remaining 40% require piecewise-linear or exponential functions, concentrated in the tension-to-OQ and effort-to-amplitude mappings.

**How many gesture dimensions are supported by evidence?** Three primary voice quality dimensions (effort, adduction, aperiodicity), plus two supplementary controls (aspiration override, pitch). The perceptual evidence (vanDinther 2001/2004, Laukka et al. 2011 PCA) converges on 2 source dimensions for harmonic source shape and 1 for perturbation, totaling 3 independent voice quality axes. Vocal tract shape and pitch are additional dimensions but orthogonal to voice quality proper.

**What is the biggest gap?** No study directly measures Rd as a continuous function of vocal effort in speech. The effort-to-Rd coefficient (-0.05 Rd/dB) is inferred from combining Lienard's (1999) spectral tilt data with Fant's (1997) Rd-to-tilt mapping. Additionally, the Fant 1995 PDF ("The LF-model revisited") is corrupt, preventing verification of the original Rd derivation methodology and error bounds.

**Bottom line recommendation:** Implement the existing five-factor additive Rd model (0-Introduction.md) as the primary system. Add a thin gesture-space layer on top that maps 3 continuous gesture dimensions (effort, adduction, aperiodicity) to the existing Rd/AH/DI parameters using the coefficients documented below. The linear projection is sufficient for conversational speech; extreme voice qualities should use the existing emotion preset mechanism, which already provides explicit parameter overrides. Do not attempt a full matrix formulation -- the nonlinearities in OQ and amplitude thresholds make a hybrid (linear projection + nonlinear functions) the only honest approach.

---

## 2. Gesture Dimensions

### 2.1 Respiratory Effort

- **Definition**: Subglottal pressure and respiratory drive, corresponding to the acoustic dimension of overall vocal intensity (SPL). Controls how "loud" or "soft" the voice is, independent of articulation.
- **Physiological basis**: Expiratory muscle force increases subglottal pressure (Ps). Higher Ps increases both SPL and vocal fold collision force.
- **Evidence for independence**: Lienard & Di Benedetto (1999) isolated effort using a 3-distance paradigm (0.4/1.5/6m) where speakers naturally adjusted effort while maintaining vowel identity. F2 and F3 were unaffected (high confidence null result), confirming effort modulates source properties without changing articulatory configuration. Vogel (2010) showed fatigue changes spectral tilt WITHOUT changing loudness (Leq stable at ~58 dB), proving source quality can change independently of effort. Laukka (2008) showed anxiety changes HF energy without intensity change.
- **Parameterization**: dB of vocal effort relative to a conversational baseline (AX in Lienard's notation). The project uses effort in dB, range [-6, +6] for conversational speech (1-Design-Decisions.md section 1.4 step 6).
- **Range**: [-6, +6] dB for conversational synthesis. Linear model validated over [-4.5, +4.5] dB (Lienard's 9 dB conversational range). Feugere (2017) covers the full [-20, +20] dB range but with nonlinear threshold effects below -16 dB (phonation threshold at Ep = 0.2).
- **Key citations**:
  - Lienard & Di Benedetto (1999) JASA 106(1):411-422 -- F0, F1, A1-A3 coefficients
  - Feugere et al. (2017) EURASIP -- full effort-to-tilt mapping (Eqs. 18-19), effort-to-F1 (Eq. 25)
  - Vogel et al. (2010) JASA 128(6):3747-3756 -- fatigue as non-effort spectral change

### 2.2 Laryngeal Adduction

- **Definition**: Degree of vocal fold medial compression and closure pattern, corresponding to the tense-lax voice quality continuum. Controlled by the single parameter Rd (Fant 1995, 1997), which bundles open quotient, closure abruptness, and return phase into a coherent covariation.
- **Physiological basis**: Lateral cricoarytenoid and interarytenoid muscles control medial compression. Higher adduction = tighter closure = lower Rd = "pressed" voice. Lower adduction = incomplete closure = higher Rd = "breathy" voice.
- **Evidence for independence**: vanDinther (2001, 2004) eigenvalue analysis shows Ra (the return phase, directly mapped from Rd) accounts for 96-98% of perceptual variance at modal/tense operating points (eigenvector: [0.98, -0.18, 0.03]). Childers & Lee (1991) identified 4 vocal quality factors (OQ, SQ, ta, NHRh), of which OQ, SQ, and ta covary along the Rd curve. Fant (1997) provides default Ra/Rk/Rg curves from Rd showing high covariation. Doval (2006) shows alpha_m is a theoretically independent second dimension, but KLGLOTT88 achieves acceptable synthesis with alpha_m fixed at 2/3 (vanDinther: perceptually marginal).
- **Parameterization**: Rd units (dimensionless). Maps to Ra, Rk, Rg, OQ, spectral tilt (Fa), and B1 via well-validated formulas.
- **Range**: [0.3, 2.7]. Male baseline: 0.7 (modal). Female baseline: 1.4 (slightly breathier). Pressed: 0.3-0.5. Breathy: 1.5-2.7. Mapped from the five-factor additive model: Rd_final = Rd_base + sum(deltas), clamped.
- **Key citations**:
  - Fant (1995) "The LF-model revisited" -- Rd derivation (PDF corrupt; equations verified via Fant 1997 and Qlatt implementation)
  - Fant (1997) "The Voice Source in Connected Speech" -- Ra, Rk, Rg from Rd; AV covariation; phrase contour
  - vanDinther (2001, 2004) -- perceptual dimensionality; 4.3 dB EPD = 1 JND
  - Doval (2006) -- CALM model spectral analysis; alpha_m independence

### 2.3 Aperiodicity

- **Definition**: Degree of cycle-to-cycle perturbation in vocal fold vibration, corresponding to the "rough" or "creaky" quality dimension. Encompasses diplophonia (DI), jitter, and shimmer (shimmer is derived from jitter via vocal tract filtering per Fraj 2011).
- **Physiological basis**: Asymmetric vocal fold vibration from thyroarytenoid tension imbalance, arytenoid positioning asymmetry, or reduced neuromuscular control precision. Physiologically independent of both effort (subglottal pressure) and adduction (medial compression).
- **Evidence for independence**: Gobl (2003) demonstrates that harsh = tense + DI and creaky = modal + DI -- aperiodicity adds orthogonally to the effort-adduction plane. Fraj (2011) Table 1 shows a 7x3 grid of jitter x noise levels, confirming independent variation. Laukka et al. (2011) PCA: perturbation (jitter, shimmer, HNR) loads on a distinct factor (PC2) from tension (PC1), with the two factors explaining 83.5% of variance together. Kreiman & Gerratt (2010): listeners are "quite insensitive" to jitter/shimmer in sustained vowels, making this dimension marginal for normal speech but essential for creaky, harsh, and pathological voice qualities.
- **Parameterization**: Scalar 0-1, where 0 = perfectly periodic and 1 = maximum perturbation. Maps to DI (diplophonia percent) and FL (flutter/jitter). DI and FL can be collapsed into a single aperiodicity gesture with two sub-modes (period-doubling vs. stochastic).
- **Range**: [0, 1]. Modal speech: 0. Creaky: 0.3-0.8. Harsh: 0.3-0.7 (combined with high effort/adduction). The perceptual threshold is high -- listeners are relatively insensitive -- so fine gradations are unnecessary.
- **Key citations**:
  - Gobl & Ni Chasaide (2003) Speech Communication 40:189-212 -- 7 voice quality profiles
  - Fraj, Grenez & Schoentgen (2011) MAVEBA -- jitter synthesis, phase perturbation equation
  - Laukka et al. (2011) -- PCA yielding Tension, Perturbation, F0 components
  - Burkhardt (2009) Interspeech -- creaky/harsh voice as DI addition

### 2.4 Killed Candidates

**Fatigue** -- Killed. Vogel (2010) shows fatigue is NOT simply reduced effort: loudness (Leq) stays constant while spectral tilt changes and F0 variance INCREASES (opposite of reduced effort). Fatigue appears to reduce control precision while maintaining effort level. However, it does not warrant a gesture dimension because: (a) its temporal dynamics are circadian, not phoneme-level; (b) it could be modeled as a combination of reduced effort baseline + increased aperiodicity floor + independent tilt shift, using the existing three dimensions over a longer time window.

**Anxiety** -- Killed as independent gesture. Laukka (2008) shows anxiety increases HF energy (HF500) and pause proportion without significant intensity change. The acoustic effects map to: slightly increased adduction (+0.3) + slightly increased aperiodicity (+0.3) + temporal restructuring (pauses). The pause effect is a cognitive/temporal phenomenon, not a voice quality gesture. The spectral effects decompose into the existing dimensions.

**Alpha_m (glottal formant bandwidth)** -- Killed. Doval (2006) shows alpha_m independently controls glottal formant bandwidth, which Oq does not. However, vanDinther (2001, 2004) shows Rk (which maps to alpha_m) has ~10x higher JND than Ra, and KLGLOTT88 achieves acceptable synthesis with alpha_m fixed at 2/3. The perceptual gain from an alpha_m dimension is below the 4.3 dB EPD threshold for most voice qualities. Fant's Rd curve constrains alpha_m through Rk anyway.

**Vocal tract shape / pitch** -- Not killed, but reclassified. These are legitimate gesture dimensions (Feugere uses 5: vowel height, backness, tract size, pitch, pitch offset) but they are NOT voice quality dimensions. They control *what* is said (phoneme identity) and *how high* the voice is (pitch), not *how* the voice sounds (quality). They operate through separate processing chains (articulation, prosody) and are already handled by the existing TTS frontend. The gesture-space formalism here concerns only source-quality dimensions.

---

## 3. Projection Matrix

```yaml
gesture_dimensions:
  respiratory_effort:
    description: "Subglottal pressure / vocal intensity relative to conversational baseline"
    unit: "dB"
    range: [-6, +6]
    projections:
      F0:
        coefficient: +5.1
        unit: "Hz/dB"
        source: "Lienard & Di Benedetto 1999, Fig. 4, r^2=0.75"
        confidence: high
      F1:
        coefficient: +3.5
        unit: "Hz/dB"
        source: "Lienard & Di Benedetto 1999, Fig. 4, rho=0.41; cross-validated Feugere 2017 Eq.25"
        confidence: medium
      F2:
        coefficient: 0
        unit: "Hz/dB"
        source: "Lienard & Di Benedetto 1999, null result"
        confidence: high (null)
      F3:
        coefficient: 0
        unit: "Hz/dB"
        source: "Lienard & Di Benedetto 1999, null result"
        confidence: high (null)
      A1_slope:
        coefficient: 1.10
        unit: "dB/dB (excess over parity)"
        source: "Lienard & Di Benedetto 1999, Fig. 3"
        confidence: high
      A2_slope:
        coefficient: 1.24
        unit: "dB/dB (excess over parity)"
        source: "Lienard & Di Benedetto 1999, Fig. 3"
        confidence: high
      A3_slope:
        coefficient: 1.30
        unit: "dB/dB (excess over parity)"
        source: "Lienard & Di Benedetto 1999, Fig. 3"
        confidence: high
      Rd:
        coefficient: -0.05
        unit: "Rd_units/dB"
        source: "Inferred from Lienard 1999 tilt data + Fant 1997 Rd-to-tilt mapping"
        confidence: low
      spectral_tilt_Tl1:
        coefficient: -21
        unit: "dB over full Ep 0-1 range (chest voice)"
        source: "Feugere 2017 Eq.18"
        confidence: medium
        note: "Feugere range (0-1 Ep) maps to ~40 dB effort range, much wider than conversational"
      B1:
        value: "no data found"
        note: "Lienard 1999 did not measure bandwidths. Feugere 2017 does not parameterize bandwidths by effort."
        confidence: gap
      AH:
        value: "no data found"
        note: "Neither Lienard nor Feugere provide a clean coefficient for aspiration noise vs effort. Feugere models aspiration as separate 'breathiness' parameter B, independent of effort E."
        confidence: gap

  laryngeal_adduction:
    description: "Vocal fold medial compression and closure pattern -- the tense-lax continuum"
    unit: "Rd"
    range: [0.3, 2.7]
    note: "Projections are formulas, not single coefficients, because the Rd-to-acoustic mapping is inherently nonlinear"
    projections:
      Ra:
        formula: "(-1 + 4.8 * Rd) / 100"
        unit: "dimensionless ratio"
        source: "Fant 1997, eq. for Rap; implemented in Qlatt crates/lf-source/src/lib.rs"
        confidence: high
      Rk:
        formula: "(22.4 + 11.8 * Rd) / 100"
        unit: "dimensionless ratio"
        source: "Fant 1997, eq. for Rkp"
        confidence: high
      Rg:
        formula: "Rk * (0.5 + 1.2*Rk) / (0.44*Rd - 4*Ra*(0.5 + 1.2*Rk))"
        unit: "dimensionless ratio"
        source: "Fant 1997, rearranged; Qlatt impl per Perrotin 2021"
        confidence: high
      OQ:
        formula: "(1 + Rk) / (2 * Rg)"
        unit: "fraction"
        source: "Fant 1997"
        confidence: high
      spectral_tilt:
        formula: "-10 * log10(1 + (f/Fa)^2) where Fa = F0/(2*pi*Ra)"
        unit: "dB at frequency f"
        source: "Fant 1985 eq. for spectral tilt; Fant 1988 eq. 16"
        confidence: high
        note: "~23 dB span at 3 kHz from Rd=0.3 to Rd=2.7 at F0=100 Hz"
      AV_correction:
        formula: "40 * log10(Rd_base / Rd)"
        unit: "dB"
        source: "Fant 1997 covariation rule"
        confidence: high
      B1:
        formula: "250 * (F1/500)^2 * (Ra/12)"
        unit: "Hz additive increase"
        source: "Fant 1997"
        confidence: medium-high
        note: "At Rd=2.7 (Ra=12%), Delta_B1 = 25 Hz for F1=500 Hz"
      B2:
        formula: "Delta_B1 * F1 / (2 * F2)"
        unit: "Hz additive increase"
        source: "Fant 1997"
        confidence: medium-high
      H1_minus_H2:
        formula: "-7.6 + 11.1 * Rd"
        unit: "dB (linear approximation)"
        source: "Fant 1997"
        confidence: medium
        note: "Overestimates at high Rd. Exponential form: -6 + 0.27*exp(5.5*OQi) is more precise"
      AH:
        value: "no direct formula from Rd"
        note: "Aspiration is partially independent. Default coupling proposed: AH_auto = max(0, (Rd - 1.5) * 10) dB"
        source: "Inferred from Klatt 1990 perceptual experiment + project design"
        confidence: low
      F0:
        value: "no direct coupling"
        note: "Rd does not directly affect F0. Covariation via subglottal pressure handled through effort dimension."
        source: "Fant 1997"
        confidence: high (null)

  aperiodicity:
    description: "Cycle-to-cycle perturbation in vocal fold vibration"
    unit: "scalar 0-1"
    range: [0, 1]
    projections:
      DI:
        coefficient: 25
        unit: "% diplophonia per unit aperiodicity"
        source: "Gobl 2003, Fig. 1: DI ranges 0-25%"
        confidence: medium
      FL:
        coefficient: 30
        unit: "flutter units per unit aperiodicity"
        source: "Burkhardt 2009 rate-based creaky: FL = rate"
        confidence: medium
      jitter_b:
        coefficient: 4.5
        unit: "Fraj phase perturbation parameter per unit aperiodicity"
        source: "Fraj 2011: b ranges 0 to 4.5"
        confidence: medium
      shimmer:
        value: "derived from jitter via vocal tract filtering"
        note: "Not an independent parameter. Fraj 2011 shows shimmer emerges naturally from frequency jitter."
        source: "Fraj 2011"
        confidence: medium
      AV:
        value: "no data found for direct aperiodicity-to-AV coupling"
        note: "Creaky voice shows AV reduction but this may be mediated by the specific laryngeal mechanism"
        confidence: gap
      f0_offset:
        coefficient: -30
        unit: "Hz per unit aperiodicity (at full creaky)"
        source: "Gobl 2003: creaky involves -30 Hz f0 drop"
        confidence: low
        note: "This is better modeled as a prosodic consequence than a direct projection"
```

**Empty cells and null results**: F2, F3 are confirmed zero-effect for effort (Lienard 1999). There is no measured effort-to-bandwidth coefficient. There is no direct Rd-to-AH formula. Aperiodicity-to-AV coupling is unmeasured.

**"Measured as zero" vs "not measured"**: F2/F3 effort coefficients are *measured as zero* (statistically insignificant). Bandwidth-effort and AH-effort relationships are *not measured* -- the gap is unknown, not known-zero.

---

## 4. Linearity Analysis

### Where the linear approximation holds

**Effort dimension**: Linear over the [-4.5, +4.5] dB conversational range tested by Lienard (1999). The F0 coefficient (5.1 Hz/dB, r^2=0.75) and A1/A2/A3 slopes (1.10-1.30 dB/dB) are well-fit by linear regression. Cross-validated by Feugere (2017) Eq. 25 for F1 (~3.5 Hz/dB). The spectral tilt relationship (Eqs. 18-19) is explicitly linear in effort: Tl1 = 27 - 21*Ep (chest voice).

**Adduction dimension (Rd -> Ra, Rk)**: Ra = (-1 + 4.8*Rd)/100 and Rk = (22.4 + 11.8*Rd)/100 are linear functions of Rd. These are the Fant (1997) default covariation equations. The linearity holds across the entire [0.3, 2.7] Rd range.

**Aperiodicity dimension**: Burkhardt (2009) explicitly demonstrates linear projection: params_new = params_default + rate * direction_vector. Each phonation type defines a direction vector in Klatt parameter space, with rate selecting a point along that vector. Perceptually validated in emotion recognition experiments.

### Where it breaks down

**Rd -> spectral tilt (via Fa)**: The tilt formula tilt(f) = -10*log10(1 + (f/Fa)^2) is nonlinear in Fa, which itself depends on Ra, which is linear in Rd. The overall Rd-to-tilt-at-frequency-f mapping is therefore nonlinear. At 3 kHz: Rd=0.3 gives -4.4 dB, Rd=1.0 gives -17.1 dB, Rd=2.7 gives -27.1 dB. This is a concave function, not linear.

**Tension -> OQ (Feugere 2017)**: Strongly nonlinear. Eq. 16 uses piecewise exponential functions: Oq = 10^(-2*(1-Oq0)*T) for T <= 0.5. This is the most significant nonlinearity in the gesture-to-acoustic mapping.

**Effort -> voicing amplitude (Feugere 2017)**: Nonlinear due to phonation threshold (Ep = 0.2, Eq. 20) and division by Oq. Below the threshold, voicing amplitude is zero (whisper).

**Low effort extreme**: Below ~45 dB SPL, phonation becomes intermittent. Lienard's F0 coefficient becomes undefined. Feugere (2017) models an explicit threshold at Ep = 0.2.

**High effort extreme**: Above ~75 dB SPL, nonlinear vocal fold dynamics engage: register shifts, subharmonics, period doubling. F0 may jump discontinuously.

**Singing formant regime (Sundberg 1972)**: At very high effort in trained singers, a lowered larynx creates an additional resonance (~2.8 kHz) with ~20 dB spectral gain. This is a qualitative mode change, not a linear extrapolation. Requires pharynx cross-section >= 6x larynx tube opening area.

### Perceptual relevance of breakdowns

The EPD JND threshold is 4.3 dB (vanDinther 2004 grand mean, naive subjects). Trained subjects: ~2.4 dB.

**Effort tilt breakdown**: Over the [-6, +6] dB effort range, cumulative spectral tilt change is ~2.4 dB (A3 excess - A1 excess = 2.0 dB per 10 dB range). This is below the 4.3 dB threshold as an isolated cue. The linear approximation error is imperceptible in the conversational range.

**Rd-to-tilt nonlinearity**: The tilt span is 23 dB from Rd=0.3 to Rd=2.7 at 3 kHz. The linear approximation error is largest in the breathy region (Rd > 1.7) where the function curves most. At Rd=2.0, the linear interpolation between Rd=1.0 and Rd=2.7 overestimates tilt by ~3 dB. This approaches the 4.3 dB perceptual threshold. For the pressed-to-modal range (Rd 0.3-1.4), the nonlinearity is well within perceptual tolerance.

**OQ nonlinearity**: Feugere's exponential Oq mapping cannot be replaced by a linear approximation without exceeding the perceptual threshold. This is the one mapping where linearity genuinely fails.

### Recommendation

**Use linear projection for conversational synthesis** within [-6, +6] dB effort and Rd [0.5, 1.5]. The perceptual errors are below JND.

**Use piecewise-linear for extended ranges**: Two regimes: pressed (Rd < 1.0) and breathy (Rd > 1.0), each with locally linear coefficients. The eigenvalue analysis supports this: the pressed/modal region is effectively 1-dimensional (Ra only), while the breathy region expands to 2-3 perceptual dimensions.

**Use explicit nonlinear functions for OQ**: Do not linearize the tension-to-OQ mapping. Retain Feugere's exponential or an equivalent.

---

## 5. Cross-Terms and Coupling

### Effort -> Rd (physiological coupling)

**Evidence FOR coupling**:
- Feugere (2017) Eq. 16: Oq_0 = 0.903 - 0.426*Ep for chest voice. A 47% reduction in open quotient from minimum to maximum effort. This is a designed coupling reflecting physiology.
- Lienard (1999) differential amplitude slopes (A1: 1.10, A2: 1.24, A3: 1.30 dB/dB) are consistent with a source spectral tilt change, which maps to Rd change.
- Physiology: increased subglottal pressure increases transglottal pressure, increasing vocal fold collision force, decreasing open quotient (= lowering Rd).

**Evidence AGAINST pure coupling**:
- Vogel (2010): fatigue changes spectral tilt (alpha ratio increases) WITHOUT changing loudness. Source characteristics change independently of respiratory effort.
- Laukka (2008): anxiety changes HF500 without significant intensity change.
- Trained speakers (singers, actors) demonstrably control adduction and effort independently.

**Conclusion**: Effort and adduction are PHYSIOLOGICALLY coupled in untrained conversational speech. The coupling is real, not an artifact. The default behavior should be: Rd_effort = effort * (-0.05 Rd/dB). But independent Rd control must remain available for emotion presets, clinical states, and trained voice styles. **This is already the design in the five-factor model** (1-Design-Decisions.md): effort modulates Rd via `rdPerDb: -0.05`, while emotion presets override with explicit `rdDelta` values.

**Is this a cross-term or a conflict?** It is a cross-term. Effort has its own acoustic projections (F0, F1, A1-A3 slopes) AND it has a default coupling into Rd. The coupling means the effort row in the projection matrix also generates changes in all Rd-derived parameters (spectral tilt, B1, AV correction, H1-H2) as a secondary effect.

### Rd -> F0 (indirect coupling)

**Evidence**: Fant (1997) documents that Ee (excitation amplitude) covaries with F0 via Ee ~ F0^1.35 * Ps^1.1. Higher subglottal pressure raises both F0 and Ee, which typically lowers Rd. But this is mediated through effort, not a direct Rd->F0 link.

**Conclusion**: Rd does NOT directly affect F0. The correlation is mediated entirely through subglottal pressure (effort). In the Qlatt architecture, F0 and Rd are independent track parameters. No cross-term needed.

### Source-tract independence (Sun 2006)

**Evidence**: Sun et al. (2006) found high correlation (r = 0.7985) between vocal tract shape (LSF parameters) and glottal waveform within phonetic classes (9 optimal clusters). This means ~64% of glottal waveform variance is predictable from vocal tract configuration.

**Is this a real coupling?** The correlation is BETWEEN phoneme identity and glottal shape (e.g., /i/ has different glottal behavior than /a/), NOT between voice quality gestures and filter configuration. Changing breathiness does not require changing vowel identity.

**Exceptions**:
- F1-f0 proximity effects (Klatt 1990): When F1 is near an f0 harmonic, glottal source strength may increase. Real but intermittent.
- B1 increases during glottal open phase: modeled as DF1=0, DB1=0-400 Hz (Klatt 1990). The equivalent constant B1 is ~90 Hz vs ~50 Hz closed-phase. This makes B1 effectively part of the source gesture, already captured by the Rd -> B1 projection.
- Tracheal coupling: provides pole-zero pairs in 550-2200 Hz (females). Source-related but filter-implemented.

**Conclusion**: Source-tract independence is a valid first-order approximation for gesture-space formalism. B1 should covary with Rd (already in the projection matrix). Tracheal coupling can be handled as a fixed correction, not a gesture dimension.

### Which cross-terms matter for synthesis?

| Cross-term | Mechanism | Strength | Recommendation |
|---|---|---|---|
| Effort -> Rd | Subglottal pressure affects fold closure | Strong, -0.05 Rd/dB | Model as default coupling; allow override |
| Effort -> Aperiodicity | Extreme effort can induce involuntary roughness | Weak, floor only | Ignore for conversational range; set aperiodicity floor at extreme effort |
| Rd -> B1 | Glottal leakage widens F1 bandwidth | Moderate, up to +25 Hz | Already in projection matrix via Fant 1997 formula |
| Source -> Tract | Phoneme-specific glottal shapes | Strong within-class | Not a gesture cross-term; handled by phoneme Rd deltas |

---

## 6. Emotion Decomposition

### Gobl's 7 voice qualities as gesture vectors

| Quality | Effort | Adduction | Aperiodicity | Residual |
|---|---|---|---|---|
| Modal | 0.0 | 0.0 | 0.0 | Baseline |
| Tense | +0.7 | +0.7 | 0.0 | AV drops 7-10 dB despite high effort (glottal resistance) |
| Breathy | -0.8 | -0.9 | 0.0 | AH (35-50 dB aspiration noise) -- consequence of open glottis |
| Whispery | -0.6 | -0.5 | +0.1 | AH (45-55 dB) + slight DI; AV drops more than breathy |
| Creaky | 0.0 | 0.0 | +0.8 | f0 drops 30 Hz -- prosodic, not quality gesture |
| Harsh | +0.7 | +0.7 | +0.5 | = Tense + aperiodicity |
| Lax-creaky | -0.6 | 0.0 | +0.7 | Hardest to decompose: breathy effort + modal adduction + high aperiodicity |

**Key observations**: Tense and breathy decompose cleanly into opposing effort-adduction positions. Harsh is precisely tense + aperiodicity (Gobl explicitly states this). Creaky is modal + aperiodicity. Lax-creaky genuinely requires all three dimensions.

**AV behaves non-monotonically**: Tense voice has LOWER AV than modal despite higher effort, because tighter closure increases resistance, reducing flow amplitude. AV is a derived quantity from the effort-adduction interaction, not an independent dimension.

**AH is a derived consequence**: It appears when OQ is high enough that the glottis never fully closes. AH magnitude correlates with adduction level (breathy > whispery > lax-creaky > others at 0). Predictable from adduction, not independent.

### Banse's 14 emotions as gesture vectors

| Emotion | Effort | Adduction | Aperiodicity | Notes |
|---|---|---|---|---|
| Hot anger | +1.0 | +0.8 | +0.3 | Highest arousal, tense/harsh quality |
| Panic fear | +0.8 | +0.5 | +0.2 | High arousal, slightly less tense |
| Elation | +0.5 | -0.3 | 0.0 | High arousal but breathy brightness |
| Disgust | +0.3 | +0.3 | +0.4 | Moderate energy, possibly harsh |
| Cold anger | +0.4 | +0.6 | +0.2 | Controlled tension |
| Interest | +0.2 | 0.0 | 0.0 | Near-modal, slight effort |
| Happiness | +0.2 | -0.2 | 0.0 | Mild effort, slight breathiness |
| Anxiety | +0.3 | +0.3 | +0.3 | Tense with some irregularity |
| Pride | +0.1 | +0.3 | 0.0 | Slight tenseness (dominance) |
| Despair | +0.4 | -0.3 | +0.3 | High energy but lax -- "cry voice" |
| Contempt | -0.3 | +0.2 | +0.2 | Low effort but slightly tense |
| Boredom | -0.2 | -0.5 | +0.2 | Low energy, lax-creaky quality |
| Sadness | -0.6 | -0.4 | +0.2 | Low everything, breathy/lax |
| Shame | -0.5 | -0.3 | 0.0 | Similar to sadness, less aperiodicity |

**Confidence note**: These coordinates are ESTIMATED from Banse & Scherer (1996) Table 6 acoustic residuals, NOT directly measured gesture-to-acoustic projections. The mapping from z-transformed acoustic features (MElog, HammI, v1.6-5K, PE1000) to gesture coordinates involves interpretation. Confidence: low to medium.

### Parameters that resist decomposition

**DI (diplophonia)**: Confirmed independent. Gobl: harsh = tense + DI, creaky = modal + DI. These are pure vector additions along the aperiodicity axis.

**Jitter/FL**: Closely related to DI but continuous rather than binary. Fraj (2011) parameterizes it as a single `b` parameter in the phase perturbation equation. Can be collapsed with DI into the aperiodicity dimension.

**AH (aspiration)**: Partially derived from adduction (low adduction = high OQ = turbulent airflow = aspiration). However, whispery voice has HIGHER AH than breathy despite LOWER OQ, suggesting whispery is a qualitatively different laryngeal mode (abducted but not freely vibrating). Recommendation: model as derived output with optional override for whisper mode.

**f0 offset**: Creaky and lax-creaky involve -30 Hz f0; tense involves +5 Hz. These are gesture-correlated but better modeled as prosodic effects in the F0 contour, not as part of the voice quality gesture space.

### Is roughness/aperiodicity a needed third dimension?

**Yes.** Without it:
- Creaky and modal are indistinguishable
- Harsh and tense are indistinguishable
- Lax-creaky, boredom, and sadness cannot be separated
- Depression and fatigue acoustic profiles (increased jitter/shimmer) cannot be modeled

The PCA evidence (Laukka 2011) is definitive: perturbation loads on a statistically independent factor from tension.

---

## 7. Integration with Existing Design

### Does gesture-space resolve the Section 3.2 stress conflict?

**Partially.** The conflict is between Fujisaki F0 accent commands, vocal effort F0/F1/tilt shifts, and Fant 1997 Rd decrease -- three systems modifying stressed syllables.

The gesture formalism clarifies the mechanism: stress increases the effort gesture, which projects simultaneously onto F0 (+5.1 Hz/dB), F1 (+3.5 Hz/dB), spectral tilt (A1/A2/A3 differential slopes), and Rd (-0.05/dB). The Fujisaki F0 accent is a SEPARATE prosodic mechanism (phrase structure) that adds to the effort-derived F0 shift. The stress Rd delta (-0.15) is the effort-derived Rd shift at effort = +3.0 dB: -0.05 * 3.0 = -0.15. This means the "stress Rd delta" and "effort Rd shift" are NOT independent factors -- they are the SAME physical mechanism parameterized two ways.

**Resolution**: The gesture formalism suggests merging stress Rd delta into the effort pathway. Stress = effort = +3.0 dB, which automatically yields the -0.15 Rd shift, +15.3 Hz F0 shift, +10.5 Hz F1 shift, and spectral tilt flattening. The Fujisaki accent peak is additive and independent. This simplifies the five-factor model by eliminating one factor (stress Rd) and deriving it from effort instead.

**What it does NOT resolve**: Whether the Fujisaki accent command magnitude should also scale with effort (it currently does not).

### Does gesture-space resolve the Section 3.3 F0 generation order issue?

**Yes.** The gesture formalism makes the ordering natural:
1. Prosodic layer generates F0 contour (Fujisaki phrase + accent commands)
2. Effort gesture projects onto F0 as an additive shift: F0_final = F0_prosodic + effort * 5.1

This matches the current resolution (Fujisaki first, effort after) but provides a principled justification: the prosodic contour is a separate dimension from effort. They compose additively because they are physiologically independent (laryngeal tension vs. subglottal pressure).

### Does gesture-space resolve the Section 3.4 F1 processing chain issue?

**Partially.** The processing chain (base F1 -> effort shift -> SPG smoothing -> Holmes phase correction) is sequential and non-conflicting. The gesture formalism adds nothing new here -- effort projects linearly onto F1, and the downstream processing stages are signal processing, not gesture-to-acoustic mappings.

However, the gesture formalism does clarify that the F1 effort shift and the Rd-derived B1 increase are BOTH consequences of increased effort. Currently they are computed in different pipeline stages (F1 shift in step 6 of 1-Design-Decisions.md, B1 from Rd in step 7). The gesture model suggests they should be co-computed from the same effort input, which is already effectively happening.

### Conflicts it does NOT resolve

1. **Emotion preset vs. gesture projection**: The existing emotion presets (0-Introduction.md table: sad, happy, angry) specify explicit F1/F2/B1/Rd deltas. The gesture model would REPLACE these with gesture coordinates (effort=-0.6, adduction=-0.4, aperiodicity=+0.2 for sadness) that PROJECT onto the same parameters. These two approaches will give DIFFERENT numerical values unless the emotion presets are recalibrated to match the projection matrix output. This is a migration task, not a conflict resolution.

2. **Clinical presets and sex inversion**: Kaczmarek-Majer (2024) shows that manic acoustic patterns INVERT between sexes. A gesture model with sex-independent projection slopes cannot capture this. The clinical presets MUST remain as explicit parameter overrides, sex-differentiated, outside the gesture framework.

3. **Phoneme Rd deltas**: The phoneme-specific Rd values (Fant 1997 table in 2-Parameter-Specifications.md) are NOT gesture-derived. They reflect articulatory differences between phoneme classes, not voice quality gestures. They must remain as a separate additive factor, not projected from gesture space.

### How gesture dimensions would map to the DSL

The declarative frontend spec (spec.md) provides the `ScalarState` interface (Part 1.6) with `base`, `floor`, `effects[]`, and `resolved` fields, plus the effect operations `set`, `mul`, `add`. Gesture projections would map naturally to `add` effects:

```yaml
rules:
  effort_f0_projection:
    citation: "Lienard & Di Benedetto 1999, Fig. 4"
    select:
      stream: phone
      where: "current.f.manner = 'vowel'"
    apply:
      - field: F0
        op: add
        value: "params.effort * 5.1"
        tag: effort_projection

  effort_rd_projection:
    citation: "Inferred from Lienard 1999 + Fant 1997"
    select:
      stream: phone
      where: "current.f.manner = 'vowel'"
    apply:
      - field: Rd
        op: add
        value: "params.effort * -0.05"
        tag: effort_projection
```

The scalar resolution algorithm (Part 5.7 `resolve_standard`) processes effects in deterministic order, which means gesture projections can compose with phoneme defaults, stress effects, and emotion overlays through the existing effect stacking mechanism. No DSL changes needed.

---

## 8. Sex and Speaker Differences

### Which coefficients differ by sex?

| Parameter | Male Value | Female Value | Source |
|---|---|---|---|
| Baseline Rd | 0.7 | 1.4 | Fant 1997 |
| Baseline H1-H2 | 6.2 dB | 11.9 dB | Klatt 1990 |
| Baseline B1 | ~60 Hz | ~165 Hz | Hanson 1995 |
| Baseline noise level | 1.7 (1-4 scale) | 2.7 (1-4 scale) | Klatt 1990 |
| Baseline OQ | ~50% | ~55-60% | Klatt 1990 |
| Baseline f0 | 80-160 Hz | 178-262 Hz | Hanson 1995 |
| Tracheal pole offset | reference | +50 Hz | Klatt 1990 |
| /h/ fully voiced | 87% | 35% | Koenig 2000 |
| VOTh range | 32.9 ms | 52.9 ms | Koenig 2000 |

### Baselines vs. projection slopes

**The evidence supports different baselines with the same projection slopes**, for most parameters. The gesture dimensions (effort, adduction, aperiodicity) describe the same physiological mechanisms in both sexes. The differences are:

1. **Baseline offset**: Females start from a breathier baseline (higher Rd, higher H1-H2, higher B1, more aspiration noise). This is structurally attributable to posterior glottal gap (Hanson 1995: 80% of females have visible posterior aperture vs 20% of males).

2. **Fa-F0 interaction**: The spectral tilt cutoff Fa = F0/(2*pi*Ra) scales with F0. At female F0 (200+ Hz), the same Rd produces LESS spectral tilt than at male F0 (100 Hz). This is why female baseline Rd is higher (1.4 vs 0.7) -- it compensates for the F0-dependent tilt reduction. This is NOT a different slope; it is a baseline adjustment for a known interaction.

3. **F1-f0 proximity effects**: More problematic for females due to higher f0 (Klatt 1990). This is an interaction between pitch and filter, not a gesture slope difference.

**Unknown**: Whether the effort -> F0 coefficient (5.1 Hz/dB from Lienard 1999, averaged across 5M/5F) differs between sexes. Lienard reports averages; individual scatter is significant but sex-specific slopes are not broken out.

**Unknown**: Whether the effort -> Rd coefficient (-0.05 Rd/dB) differs between sexes. This coefficient is already inferred (low confidence), and there is no sex-specific data.

### Recommendation for implementation

**Shared projection matrix with different baselines.** This is the simplest model supported by current evidence:

```yaml
speaker_profile:
  male:
    baseline_Rd: 0.7
    baseline_f0: 120      # Hz
    baseline_B1_extra: 0   # Hz
    formant_scale: 1.0
  female:
    baseline_Rd: 1.4
    baseline_f0: 200
    baseline_B1_extra: 100  # Hz, from Hanson 1995
    formant_scale: 1.17    # Kent & Vorperian 2018

# Projection coefficients: same for both sexes
effort_projections:
  f0: +5.1  # Hz/dB
  f1: +3.5  # Hz/dB
  rd: -0.05 # Rd/dB
  # ... etc
```

If future data shows sex-specific slopes (e.g., the 5.1 Hz/dB is significantly different for males vs females), the architecture supports separate projection matrices without structural changes. But do not split prematurely without data.

**Exception: Clinical presets MUST use separate matrices.** Kaczmarek-Majer (2024) demonstrates that manic patterns invert between sexes. This cannot be handled by baseline adjustment alone. Clinical presets remain outside the gesture framework.

---

## 9. Unresolved Questions

### Questions requiring experimental data

1. **Rd as a continuous function of effort**: No study directly measures Rd (or Oq, or Ra) as a continuous function of vocal effort in speech. The -0.05 Rd/dB coefficient is inferred. A controlled experiment recording glottal parameters at multiple effort levels would validate or correct this coefficient.

2. **Sex-specific effort coefficients**: Lienard (1999) reports averages across 10 speakers (5M/5F) but does not break out sex-specific F0-effort or F1-effort slopes. These may differ.

3. **English vowels under effort variation**: Lienard's data is French isolated vowels. The F0 coefficient likely transfers (physiological mechanism), but the F1 coefficient (already weak at r^2=0.18) may differ for English.

4. **Bandwidth-effort coupling**: No study measures formant bandwidths as a function of effort. Bandwidths likely decrease with effort (more adducted source = narrower peaks), but the rate is unmeasured.

5. **Perceptual weighting of effort cues**: Which effort-acoustic mappings matter most to listeners? F0 shift? Spectral tilt? F1? vanDinther (2004) provides JND for source parameters but not for the composite "effort percept."

6. **Aperiodicity JND for connected speech**: Kreiman & Gerratt (2010) report listeners are "quite insensitive" to jitter/shimmer in sustained vowels. But connected speech may be different -- the temporal modulation of aperiodicity (e.g., sentence-final creak) might be more salient than steady-state levels.

### Papers we should find but did not have

- **Fant (1995) "The LF-model revisited"**: PDF is corrupt (567 bytes). Contains the original Rd derivation methodology, error bounds on Ra/Rk/Rg linear approximations, and the full Rg formula. Currently verified only through Fant (1997) secondary citations and the Qlatt codebase implementation.

- **Henrich et al. (2003)**: JNDs for Oq and asymmetry coefficient. Referenced by vanDinther (2004) as finding Oq JNDs of 0.034-0.106. Would strengthen the adduction dimension perceptual floor estimates.

- **Laukka et al. (2011)**: PCA of sustained vowel emotion expressions. Referenced in the project's vq-research-vocal-emotion-dimensions.md. The PC1 (Tension) / PC2 (Perturbation) / PC3 (F0) decomposition is crucial evidence for 3-dimensional gesture space but was accessed only through secondary summary.

### Contradictions in the literature

1. **Depression formant frequencies**: France (2000) found ELEVATED F1/F2/F3 in depressed speech, which contradicts a simple "low effort" model (effort raises F1 but reduces SPL, and depressed speakers have reduced SPL). The elevation may reflect psychomotor rigidity (increased baseline muscle tension) rather than effort. This suggests depression involves a dissociation: low communicative effort + high physical tension, which the 3-dimension gesture model does not capture without a fourth "supralaryngeal tension" dimension.

2. **Whispery vs breathy OQ**: Gobl (2003) shows whispery voice has LOWER OQ (70-80%) than breathy (85-95%) but HIGHER AH (45-55 vs 35-50 dB). If aspiration were purely derived from OQ, whispery should have less noise, not more. This suggests whispery voice is a qualitatively different laryngeal mode (abducted but constrained vibration) rather than an extreme on the adduction continuum.

3. **Feugere coefficients -- sex applicability**: Feugere (2017) uses mechanism (M=1 chest, M=2 falsetto) to distinguish phonation register but does not state whether the effort-to-tilt coefficients (Eqs. 18-19: Tl1 = 27-21*Ep for chest) are derived from male or female data. The reference voice is "tenor," suggesting male data. Applicability to female voices is assumed but unverified.

### What would need to be measured to fill the gaps

| Gap | Measurement Protocol | Expected Outcome |
|---|---|---|
| Rd-effort coefficient | EGG recording at 5+ effort levels, male and female, multiple vowels | Direct slope value, confidence interval, sex differences |
| Bandwidth-effort coupling | Formant tracking with bandwidth estimation (inverse filtering) at varied effort | Coefficient or null result |
| Aperiodicity connected-speech JND | ABX listening test with varied jitter levels in sentences, not sustained vowels | JND likely lower (more sensitive) than sustained vowel data |
| Whispery voice mechanism | Laryngoscopic imaging during whispery vs breathy phonation | May show distinct laryngeal configuration, validating separate mode |
| Sex-specific effort slopes | Re-analysis of Lienard (1999) data by sex, or new English-language replication | Confirm shared slopes or quantify differences |

---

## 10. Full Citation List

### Voice quality source modeling

- **Fant (1985)** "The LF model" - LF model definition; spectral tilt formula: tilt(f) = -10*log10(1+(f/Fa)^2)
- **Fant (1988)** "LF frequency domain interpretation" - Eq. 16 for spectral tilt; perceptual ranking: Ta/Fa >> Ee >> Uo >> Rg/Rk
- **Fant (1995)** "The LF-model revisited" - Original Rd derivation; Ra/Rk/Rg as functions of Rd. PDF corrupt; verified through secondary citations.
- **Fant (1997)** "The Voice Source in Connected Speech" - Rd-to-R-parameter table; AV covariation rule (40*log10(Rd_base/Rd)); B1 formula; phrase Rd contour; phoneme-specific Rd values
- **Doval, d'Alessandro, Henrich (2003)** "The voice source as a causal/anticausal linear filter" VOQUAL'03 - CALM model; structural independence of causal (tilt) and anticausal (glottal formant) components
- **Doval, d'Alessandro, Henrich (2006)** "The spectrum of glottal flow models" Acta Acustica - H1-H2 depends on BOTH Oq AND alpha_m; KLGLOTT88 cannot independently vary alpha_m
- **Perrotin, McLoughlin (2021)** "LF model linear filter equivalence" Interspeech - Confirmed Rd dominates perception

### Perceptual dimensionality

- **vanDinther, Veldhuis, Kohlrausch (2001)** "The perceptual relevance of glottal-pulse parameter variations" Eurospeech - Eigenvalue decomposition of perceptual Hessian; Ra dominates
- **vanDinther, Kohlrausch, Veldhuis (2004)** "A method for analysing the perceptual relevance of glottal-pulse parameter variations" Speech Communication 42:175-189 - 4.3 dB EPD = 1 JND; 1-2 effective source dimensions; operating-point-dependent eigenvalues
- **Kreiman, Gerratt (2010)** "Perceptual assessment of voice quality" - Noise-harmonic masking interaction; listeners "quite insensitive" to jitter/shimmer in sustained vowels

### Effort dimension

- **Lienard, Di Benedetto (1999)** "Effect of vocal effort on spectral properties of vowels" JASA 106(1):411-422 - F0: +5.1 Hz/dB (r^2=0.75); F1: +3.5 Hz/dB (rho=0.41); F2/F3: no effect; A1/A2/A3 differential slopes: 1.10/1.24/1.30 dB/dB
- **Feugere, d'Alessandro, Doval, Perrotin (2017)** "Cantor Digitalis: Chironomic parametric synthesis of singing" EURASIP - 8 gesture dimensions; Effort->Tl linear (Eqs. 18-19); Tension->Oq exponential (Eq. 16); ~60% of mappings linear
- **Vogel et al. (2010)** JASA 128(6):3747-3756 - Fatigue changes spectral tilt without changing loudness; fatigue is NOT simply reduced effort
- **Laukka et al. (2008)** J Nonverbal Behavior 32:195-214 - Anxiety increases HF500 and pause proportion; no intensity change

### Voice quality factors

- **Childers, Lee (1991)** "Vocal quality factors: Analysis, synthesis, and perception" JASA 90(5) - 4 factors: OQ, SQ, ta, NHRh; OQ/SQ/ta covary across voice types; NHRh largely independent
- **Klatt, Klatt (1990)** "Analysis, synthesis, and perception of voice quality variations" JASA 87(2) - Male vs female comparison; AH perceptual importance (2.88/5 breathiness); H1-H2 sex difference (+5.7 dB female); source-tract interactions
- **Hanson (1995)** "Glottal characteristics of female speakers" PhD thesis, Harvard - Quantitative female parameters; H1*-H2*: 3.1 dB; B1: 165 Hz; two speaker groups (modal vs breathy)
- **Koenig (2000)** "Laryngeal factors in voiceless consonant production" JSLHR 43 - Sex and age differences in /h/ voicing and VOT; speaker AF6 breathy without airflow increase

### Emotion and voice quality

- **Gobl, Ni Chasaide (2003)** "The role of voice quality in communicating emotion, mood and attitude" Speech Communication 40:189-212 - 7 voice quality profiles (modal/tense/breathy/whispery/creaky/harsh/lax-creaky) with KLSYN88 parameters
- **Banse, Scherer (1996)** "Acoustic profiles in vocal emotion expression" JPSP 70(3):614-636 - 14 emotions with z-transformed acoustic features; confusion matrix supporting gesture clustering
- **Scherer, Banse, Wallbott (2001)** "Emotion inferences from vocal expression" JCCP 32(1):76-92 - Cross-cultural recognition: anger 76%, sadness 71%, joy 42%; confusion patterns correlated r=0.85 across cultures
- **Cummings, Clements (1995)** "Analysis of the glottal excitation of emotionally styled and stressed speech" JASA 98(1) - Closing slope ratios: 2.07 (angry), 0.55 (soft); mapped to Rd deltas
- **Burkhardt (2009)** "Rule-based voice quality variation with formant synthesis" Interspeech - 1D rate-based linear projection for 5 phonation types; perceptually validated
- **Fraj, Grenez, Schoentgen (2011)** "Synthesis of breathy and rough voices" MAVEBA - Jitter parameter b (0-4.5); noise parameter n1 (0.15-0.55); shimmer derived from jitter; 7x3 independence grid

### Clinical and affect states

- **France et al. (2000)** "Acoustical properties of speech as indicators of depression and suicidal risk" IEEE Trans. Biomed. Eng. 47(7) - F0 ineffective as emotion discriminator; formant modulation more diagnostic; elevated F1/F2/F3 in depression contradicts simple low-effort model
- **Kaczmarek-Majer et al. (2024)** "Acoustic markers of bipolar disorder" - Male and female manic patterns INVERT; sex-specific clinical presets mandatory

### Source-tract interaction

- **Sun, Dai, Zhang, Xie (2006)** "Modeling glottal source for high quality voice conversion" WCICA - 9-cluster codebook; r=0.7985 tract-source correlation within phonetic classes; statistical tendency, not coupling constraint

### Perceptual evidence

- **Laukka et al. (2011)** "Mapping emotions into acoustic space" (accessed via project summary) - PCA: PC1 Tension, PC2 Perturbation, PC3 F0; 83.5% variance explained; perturbation statistically independent of tension

### Additional references (from project context)

- **Sundberg (1972)** - Singing formant: additional resonance at ~2.8 kHz at high effort in trained singers
- **Barreda (2015)** - Validates uniform formant scaling for vocal tract length simulation
- **Kent, Vorperian (2018)** - Vowel formant bandwidths; formant scale values by age/sex
- **Peterson, Barney (1952)** - Canonical vowel formants
- **Schotz (2006)** - Duration scaling by age
