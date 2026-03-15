# Verdict: Glottal Source Models

## Papers Considered

47 papers assigned; 44 with notes.md read in full, 1 (Fant 1995) PDF-only (no notes), 2 additional (Rothenberg 1981, Hanson 2002) read in cross-references. Papers span 1958-2021.

**Papers read:**
Fant 1985, Fant 1986, Fant 1988, Fant 1997, Doval 2003, Doval 2006, Gobl 2021, Perrotin 2021, Flanagan 1958, Rosenberg 1971, Rothenberg 1975, Holmes 1973, Klatt 1990, Hanson 1995, Hanson 1997, Hanson 1999, Hanson 2001, Hanson 2002, Holmberg 1988, Holmberg 1995, Henrich 2001, Henrich 2003, Henrich 2005, Kreiman 2007, Kreiman 2012, Iseli 2007, Gauffin 1989, Sundberg 2005, Feugere 2017, Plumpe 1999, Muthukumar 2013, Drugman 2020, Lu & Smith, Moore 2004, vanDinther 2001, vanDinther 2004, Alku 1997, Alku 1999, Bjorklund 2016, Herbst 2015, Isshiki 1964, Sun 2006, Titze 2015, Koenig, Anumanchipalli, Rothenberg 1981.

**Not read (no notes.md):** Fant 1995 (PDF only, content covered by Fant 1997 which subsumes it).

## Historical Timeline

| Year | Event | Significance |
|------|-------|-------------|
| 1958 | Flanagan: glottal source properties | Established -12 dB/oct spectral decay, high-impedance source model, duty cycle controls spectral richness |
| 1971 | Rosenberg: pulse shape experiments | Showed single slope discontinuity at closure + 12 dB/oct decay essential; at^2-bt^3 pulse |
| 1973 | Holmes: glottal waveform in parallel synthesizer | Inverse-filtered pulses nearly indistinguishable from natural; phase irrelevant for loudspeaker |
| 1975 | Rothenberg: three-parameter source (F/L/T) | Physiologically-motivated behavioral model; precursor to LF parameterization |
| 1980 | Klatt: cascade/parallel formant synthesizer | Original Klatt synthesizer with impulse source |
| 1985 | Fant, Liljencrants & Lin: LF model | Four-parameter continuous glottal flow derivative model (tp, te, ta, Ee) |
| 1986 | Fant: source-filter interaction | Documented F1 interaction effects on glottal flow |
| 1988 | Fant & Lin: frequency-domain LF | Normalized R-parameters (Rg, Rk, Ra); Fa = 1/(2*pi*Ta) as voice quality control; male/female typical values |
| 1988 | Holmberg et al.: normative airflow data | 45 speakers, 3 loudness levels — OQ, MFDR, ac/dc norms |
| 1990 | Klatt & Klatt: KLGLOTT88 + KLSYN88 | at^2-bt^3 source with OQ, TL, AH, FL, DI; aspiration noise most important breathiness cue |
| 1995 | Hanson: female glottal characteristics | H1*-A3* best breathiness predictor; TL > OQ for perceptual importance; two female speaker groups |
| 1997 | Fant: Rd unified parameter | Single voice quality parameter predicting Ra, Rk, Rg defaults; Ee-to-1/Rd covariation (2:1 dB); phrase contour rules |
| 1997 | Hanson: corrected spectral measures | H1*-H2*, H1*-A1, H1*-A3* with formant corrections |
| 2001 | Henrich et al.: H1*-H2* ambiguity | H1*-H2* depends on BOTH Oq AND alpha_m; not reliable OQ estimator alone |
| 2003 | Doval et al.: CALM model | Causal/anticausal filter decomposition; glottal formant = 2nd-order bandpass controlled by Oq |
| 2006 | Doval et al.: unified GFM spectra | 5 generic parameters for all GFMs; analytical spectral formulas; KLGLOTT88 cannot vary alpha_m |
| 2007 | Kreiman et al.: PCA of source measures | 78 measures reduce to 4 factors; H1-H2 most robust; mid-frequency slope poorly captured |
| 2021 | Gobl: alias-free LF in frequency domain | Closed-form spectral equations eliminating aliasing |
| 2021 | Perrotin et al.: LF linear-filter equivalence | LFLM/LFCALM perceptually equivalent to LF; 10-100x faster; digital filter coefficients |

## Findings by Category

### Wrong

**1. "H1-H2 (uncorrected) reliably indicates open quotient."**
- Source: Widespread assumption in pre-1995 voice analysis literature
- Evidence against: Henrich 2001 proved analytically that H1*-H2* depends on BOTH Oq and asymmetry coefficient (alpha_m) for 5-parameter models (LF, R++). Only the 4-parameter KLGLOTT88 gives a unique Oq-to-H1*-H2* mapping — but only because it cannot vary alpha_m, which is a limitation, not a feature. Doval 2006 confirmed: for H1-H2 = 3.4 dB, possible (Oq, alpha_m) pairs include (0.66, 2/3), (0.80, 0.77), (1.0, 0.81). Hanson 1997 found H1*-H2* correlation with other glottal measures r < 0.59. Kreiman 2007 found H1-H2 loads on a factor separate from overall spectral slope.
- Verdict: **WRONG.** H1-H2 cannot be used alone to estimate OQ. Use H1*-A3* (corrected) as the primary spectral tilt measure, or fit Rd directly.

**2. "Phase structure of glottal pulses is perceptually important."**
- Source: Implicit assumption in high-fidelity source modeling
- Evidence against: Holmes 1973 demonstrated definitively that for loudspeaker-reproduced speech, phase structure is irrelevant — room reverberation randomizes harmonic phases. Only under earphone listening conditions do phase differences matter.
- Verdict: **WRONG for loudspeaker synthesis.** Phase-correct implementations (Gobl 2021, Perrotin 2021) are academically important but provide no perceptual benefit for Qlatt's normal use case.

### Superseded

**3. Flanagan 1958 triangular wave model superseded by Rosenberg 1971, then by LF 1985.**
- Flanagan's triangular glottal model: spectral envelope = sinc^2 with zeros. Too simple, spectral zeros unrealistic.
- Rosenberg's at^2-bt^3 (type B): single slope discontinuity at closure, 12 dB/oct decay. Accepted as perceptually adequate.
- Fant 1985 LF model: continuous 4-parameter formulation covering modal to breathy. Subsumes Rosenberg with independent control of return phase (ta) for spectral tilt.
- Verdict: **SUPERSEDED.** Flanagan and Rosenberg are of historical interest only. The LF model (or its LFLM equivalent) is the correct modern implementation.

**4. Klatt 1980 impulse source superseded by KLGLOTT88 (1990), then by LF/LFLM.**
- Klatt 1980 impulse source: no pulse shape modeling.
- KLGLOTT88 (Klatt 1990): at^2-bt^3 with OQ, TL. Fixed asymmetry (alpha_m = 2/3). Cannot independently control glottal formant bandwidth.
- LF model via Rd: full 5-parameter control. Doval 2006 proved KLGLOTT88 is a 4-parameter subset that cannot vary alpha_m.
- Verdict: **SUPERSEDED.** Qlatt correctly uses LF model (mode 1 = LFLM). The impulse source (mode 0) should be retained only for backward compatibility, not as default.

**5. Fant 1985/1988 original LF parameterization superseded by Fant 1997 Rd.**
- Original LF: requires specifying tp, te, ta independently. Nomograms for parameter relationships.
- Fant 1997 Rd: single parameter predicts default Ra, Rk, Rg. Range 0.3-2.7 covers pressed to breathy. Covariation rule (1 dB change in 1/Rd = 2 dB change in Ee) links voice quality to excitation strength.
- Perrotin 2021 validated: Rd dominates perceptual quality (chi^2 = 3620, p < 0.001).
- Verdict: **SUPERSEDED.** Use Rd as the primary voice quality control. Qlatt already does this correctly (semantics.yaml: Rd default 0.7, range 0.3-2.7).

**6. Separate OQ and TL parameters superseded by unified Rd control.**
- Klatt 1990 used OQ and TL as independent parameters.
- Fant 1997 showed they covary through Rd. Hanson 1995 showed TL is far more perceptually important than OQ.
- Verdict: **SUPERSEDED for default use.** OQ and TL overrides should remain available (as Qlatt provides) but should not be the primary voice quality interface. Rd should drive both by default.

### Limited

**7. KLGLOTT88 alpha_m limitation.**
- KLGLOTT88 fixes alpha_m = 2/3 (speed quotient = 2). Cannot vary glottal formant bandwidth independently of Oq.
- Doval 2006: the glottal formant bandwidth is controlled ONLY by alpha_m. KLGLOTT88 cannot produce tense voice (higher alpha_m > 0.7) or relaxed voice (lower alpha_m).
- Holmberg 1988: speed quotient ranges 1.46-2.05 across loudness/sex, corresponding to alpha_m from 0.59 to 0.67. The fixed value 2/3 is only correct for normal male modal voice.
- Verdict: **LIMITED.** Not wrong for modal male synthesis, but unable to model the full voice quality space. Qlatt's LFLM implementation derives alpha_m from Rd via Rk, which provides the needed variation.

**8. Source-filter independence assumption.**
- Fant 1986 documented F1-dependent pulse skewing, double peaks in flow derivative, amplitude perturbations.
- Rothenberg 1981 provided detailed interaction model.
- However, Perrotin 2021 showed that after vocal tract filtering, model differences (which include different interaction assumptions) are perceptually masked.
- Verdict: **LIMITED.** Interaction effects are real but second-order for synthesis. Qlatt's linear source-filter model is adequate for most purposes. First-order correction: Fant 1997 bandwidth increase formula (already implemented in semantics.yaml B1/B2 rules).

**9. Holmberg 1988 normative data limited to /pae/ syllables.**
- Data from repeated syllables, not connected speech.
- Fant 1997 addresses this gap with connected-speech rules.
- Verdict: **LIMITED.** Holmberg's absolute values are valid baselines but should not be applied directly to connected speech without Fant 1997's dynamic modification rules.

**10. Hanson's spectral measures limited to female speakers (1995/1997).**
- Extended to males in Hanson 1999, combined in Hanson 2001.
- Male H1*-A3* is ~9.6 dB lower than female.
- Verdict: **LIMITED.** The measures are valid but the thresholds (23 dB group boundary) are female-specific. Male equivalents exist in Hanson 1999.

### Incomparable

**11. CALM (Doval 2003) vs LF time-domain: different paradigms.**
- CALM decomposes the source as causal (spectral tilt) + anticausal (glottal formant) linear filter.
- LF is a time-domain waveform model with implicit spectral structure.
- Perrotin 2021 proved they are perceptually equivalent when parameterized by the same Rd.
- Verdict: **INCOMPARABLE but equivalent.** Both produce the same perceptual result. The choice is computational: CALM/LFLM is 10-100x faster than solving LF implicit equations. Qlatt correctly chose LFLM (Perrotin 2021 Eq. C2-C6).

**12. Gobl 2021 frequency-domain alias-free vs Perrotin 2021 time-domain LFLM.**
- Gobl: compute alias-free spectrum via IDFT. No aliasing ever.
- Perrotin: time-domain biquad filter. Some aliasing at low sample rates / high F0.
- Verdict: **INCOMPARABLE.** Different trade-offs. For Qlatt at 48 kHz sample rate, aliasing from LFLM is negligible. Gobl's approach would matter at 10 kHz or for very high F0 (> 400 Hz).

## What Subsumes What

```
Flanagan 1958 (triangular)
  └─ superseded by Rosenberg 1971 (at²-bt³)
       └─ superseded by Klatt 1990 KLGLOTT88 (at²-bt³ + OQ + TL)
            └─ superseded by Fant 1985 LF (4-param continuous)
                 └─ simplified by Fant 1997 Rd (1-param default predictor)
                      └─ efficiently implemented by Perrotin 2021 LFLM (causal biquad)

Doval 2003 CALM ≡ Fant 1985 LF  (perceptually equivalent, proven Perrotin 2021)
Gobl 2021 alias-free ⊃ all time-domain implementations (eliminates aliasing)
```

## Genuinely Uncertain

**1. Optimal Rd default for male connected speech.**
Fant 1997 suggests Rd = 0.7 for male modal voice. Qlatt uses this. But Fant 1997 admits the statistical basis is limited and calls his rules an "outline." No large-scale replication exists. The value is plausible but not validated on modern corpora.

**2. Ee-to-1/Rd covariation ratio.**
Fant 1997 claims 1 dB change in 1/Rd = 2 dB change in Ee. This is implemented in Qlatt's `eeCovaryDb` rule. However, Fant acknowledges this ratio was measured on a small number of speakers and may vary with speaking style. No independent replication found in any of the 47 papers.

**3. Phrase-level Ee contour shape.**
Fant 1997 describes 50 ms onset rise, 2 dB/s declination, 6 dB/s final fall. Qlatt implements `EePhraseDb` for this. But the exact contour parameters are based on Fant's own limited observations, not validated against modern prosody corpora.

**4. Female Rd range.**
Fant 1997 gives female Rd = 0.8-2.5, male = 0.5-1.5. The female range is derived indirectly. Hanson's work validates that females have greater spectral tilt and higher OQ, but the precise Rd mapping is uncertain because Hanson used Klatt parameters (OQ, TL), not Rd directly.

**5. Perceptual relevance of alpha_m variation.**
Henrich 2003 measured JNDs for Oq and alpha_m but with stationary signals. Van Dinther 2004 found that perceptual differences in R-parameters other than Ra are small. Whether alpha_m variation matters in running speech is unresolved.

## Best Current Understanding

The LF model, parameterized by Rd (Fant 1997), implemented as LFLM (Perrotin 2021), is the consensus best practice for glottal source modeling in formant synthesis. The evidence hierarchy:

1. **Rd is the primary voice quality control.** Range 0.3 (pressed) to 2.7 (breathy). Predicts Ra, Rk, Rg defaults. Perrotin 2021 chi^2 = 3620 confirms Rd dominates perception.

2. **Spectral tilt (via Fa = 1/(2*pi*Ta)) is the most perceptually important spectral feature.** Fant 1988 established this; Hanson 1995/1997 confirmed TL is more important than OQ; Kreiman 2007 found spectral slope is a separate independent factor from H1-H2.

3. **Aspiration noise is the most important single cue for breathiness.** Klatt 1990 perceptual experiments: AH=60 dB rated 2.88/5 breathiness vs TL=25 dB rated 1.36/5 alone. All cues combined: 3.76/5. Noise matters more than any harmonic cue.

4. **Bandwidth increase from glottal leakage follows Fant 1997.** DeltaB1 = 250 * (F1/500)^2 * Ra/12. This is the primary coupling between source and tract.

5. **Male vs female differences are quantitative, not qualitative.** Male: Rd 0.5-1.5, OQ ~0.55-0.65, MFDR ~240-480 l/s^2. Female: Rd 0.8-2.5, OQ ~0.60-0.76, MFDR ~117-249 l/s^2. Female B1 default should be ~165 Hz (Hanson 1997), not 50 Hz.

6. **Connected speech requires dynamic source variation.** Fant 1997 six-stage production model: speaker-specific base Rd, segment-specific modulation, coarticulation interpolation, F0-dependent Ee, stress/intensity effects, phrase contour.

## Synthesizer Audit

### What Qlatt Gets Right

**1. LFLM implementation (Perrotin 2021 Eq. C2-C6).**
File: `crates/lf-source/src/lib.rs` lines 225-266.
Glottal formant: Fg = 1/(2*Oq*T0), Bg = 1/(Oq*T0*tan(pi*(1-alpha_m))). Biquad coefficients: a1, a2 from Bg/Fs, b1 from Ag/sin(pi*(1-alpha_m)). Spectral tilt: 1st-order LP at Fa = 1/(2*pi*Ta). All correct per Perrotin 2021.

**2. Rd as primary parameter.** Default 0.7 (Fant 1997 male modal). Range 0.3-2.7. Rd-to-R-param conversion via Fant 1997 Eq. A1. Correct.

**3. Rd-to-R-parameter conversion (Fant 1997).**
`lib.rs` lines 188-195: Ra = (-1 + 4.8*Rd)/100, Rk = (22.4 + 11.8*Rd)/100, Rg from Rd/Ra/Rk. Matches Fant 1997 Table 1.

**4. OQ and TL overrides.** When OQ > 0 or TL > 0, they override Rd-derived values. Engineering note in code correctly documents the decoupling.

**5. Fant 1997 bandwidth covariation.** `semantics.yaml` B1 rule includes `250.0 * pow(F1/500.0, 2.0) * (Ra - RaRef) / 12.0`. Correct implementation of Fant 1997 Eq. 6.

**6. Ee-1/Rd covariation.** `semantics.yaml` eeCovaryDb: `40.0 * log(max(RdRef, 0.3) / effectiveRd) / log(10.0)`. This implements the 2:1 dB ratio (Fant 1997). Correct.

**7. Flutter (Klatt 1990 Eq. 1).** `lib.rs` lines 277-287: three sinusoids at 12.7, 7.1, 4.7 Hz. Matches Klatt & Klatt 1990 exactly.

**8. Jitter (Fraj 2011).** Per-period random perturbation scaled by F0 and sample rate. Reasonable implementation.

**9. CALM mode mapping.** `lib.rs` line 165: LfCalm mapped to LfLm because anti-causal filtering cannot be done sample-by-sample. Correct engineering decision, documented.

### Audit Items (Issues Found)

**A1. Missing aspiration noise coupling to Rd.**
- Current state: AH (aspiration) is set independently in rules.
- Literature says: Klatt 1990 found AH is the single most important breathiness cue (rated 2.88/5 alone vs TL 1.36/5 alone). Fant 1997 links Ra (from Rd) to aspiration via abduction factor ka. Hanson 1995 Table 5.2 shows AH covaries with OQ, TL, B1 across voice quality continuum.
- Fix: When Rd increases above RdRef, aspiration should increase. Suggested rule:
  ```yaml
  aspGainRdDelta:
    expr: "max(0, effectiveRd - RdRef) * 6.0"  # ~6 dB per Rd unit above reference
    deps: [effectiveRd, RdRef]
    description: "Aspiration noise increases with breathiness (Klatt 1990 perceptual data; Hanson 1995 Table 5.2)"
  ```
  Then add aspGainRdDelta to the aspGain computation. The 6 dB/unit slope comes from Hanson 1995 Table 5.2: going from G1 (Rd~0.7) to G6 (Rd~2.0) increases AH by ~13 dB over ~1.3 Rd units = ~10 dB/unit. A conservative 6 dB/unit is a starting point.

**A2. No B2 glottal leakage correction.**
- Current state: `semantics.yaml` has B2 correction using Fant 1997 formula: `250.0 * pow(F1/500.0, 2.0) * (Ra - RaRef) / 12.0 * F1 / (2.0 * F2)`.
- Observation: This IS implemented. No action needed. (Initial audit concern resolved on re-reading.)

**A3. Female voice quality defaults missing.**
- Current state: inventory.yaml has Rd=0.7, which is the male modal default.
- Literature says: Female Rd should be 0.8-2.5 (Fant 1997). Female B1 should default to ~165 Hz (Hanson 1997), not derived from the same Rd baseline as males. Female H1*-A3* averages 22.8 dB (Hanson 1997) vs male ~13 dB.
- Fix: Add female speaker profile with:
  ```yaml
  Rd: 1.2        # Fant 1997 female mid-range
  RdRef: 1.2     # Reference for bandwidth covariation
  flutter: 15    # Female voices show less flutter than male
  ```
  B1 increase is automatically handled by the Rd-driven Ra difference.

**A4. No tracheal pole-zero pair.**
- Current state: No tracheal resonance in the audio graph.
- Literature says: Klatt 1990 Table VII provides tracheal pole-zero frequencies for male and female speakers. Tracheal coupling produces spectral dip near 550 Hz (female) or 750 Hz (male) in breathy voice that contributes to breathiness percept. Hanson 1995 identifies this as a secondary cue.
- Impact: Low priority. The breathiness percept is primarily driven by TL and AH (Klatt 1990 perceptual data). Tracheal coupling is a refinement, not a fundamental gap.
- Fix if desired: Add a resonator-antiresonator pair (FTP/FTZ/BTP/BTZ) in the cascade branch between the nasal pole-zero and F1. Male defaults: FTP=1550, FTZ=1800, BTP=180, BTZ=180. Female: FTP=1650, FTZ=1800. Only active when Rd > 1.0.

**A5. Pitch-synchronous B1 variation not implemented.**
- Current state: B1 is constant within a frame (5 ms update rate).
- Literature says: Klatt 1990 documents that B1 increases substantially during the open glottal phase (DF1, DB1 parameters). This is a pitch-synchronous effect that the 5 ms update rate cannot capture.
- Impact: Moderate. The effect is most audible at low F0 and low F1 (male /a/). An equivalent constant B1 (Klatt 1990: B1=50 closed + DB1=400 open → equivalent ~90 Hz) partially compensates, and the Fant 1997 bandwidth formula already provides a static correction.
- Fix: Would require modifying the LF source or adding a pitch-synchronous modulator. Not actionable at current architecture level. Document as future work.

**A6. Rd default of 0.7 is plausible but weakly validated.**
- Current state: Rd=0.7 in inventory.yaml (citing Fant 1997).
- Literature says: Fant 1997 Table 1 gives Rd=0.7 with Ra=2.36%, Fa=674 Hz, OQ=55.5%. This aligns with Holmberg 1988 male normal OQ=0.609 (Fant Table 1 gives 55.5% at Rd=0.7, close). Gauffin 1989 confirms moderate modal voice corresponds to mid-range Rd.
- Verdict: The value is reasonable. No change needed, but acknowledge the uncertainty.

**A7. Missing diplophonia (DI) parameter in LF source.**
- Current state: The LF WASM crate has no diplophonia implementation. Klatt 1990 defines DI as alternate-pulse delay + attenuation.
- Literature says: Klatt 1990 notes many utterances end in "breathy-laryngealized" mode where DI contributes to naturalness. Hanson 2001 identifies DI activation at small glottal area near voicing offset.
- Impact: Low-medium. DI primarily matters for phrase-final and creaky voice regions.
- Fix: Add DI parameter to lf-source. Implementation per Klatt 1990: every other pulse delayed by DI% of closed phase, attenuated by DI% linearly.

## Open Questions

1. **What is the correct Rd contour during consonant-vowel transitions?** Fant 1997 provides segment-level rules but the interpolation dynamics are underspecified.

2. **Should alpha_m be independently controllable?** Currently it derives from Rd via Rk. Doval 2006 shows it controls glottal formant bandwidth independently. Van Dinther 2004 suggests perceptual sensitivity to alpha_m is low in isolation, but Henrich 2003 JND data uses stationary signals only.

3. **How should Ee contour be shaped at phrase boundaries?** Fant 1997 describes 50 ms onset rise and accelerating final fall, but the exact shape parameters are from limited data.

4. **Is the 2:1 Ee-to-1/Rd dB covariation ratio correct across languages and speaking styles?** Only validated on Swedish by Fant.

5. **What Rd values should be used for non-modal phonation types (creaky, falsetto, whisper)?** The Rd range 0.3-2.7 covers pressed-to-breathy but the endpoints are not well-characterized for extreme phonation types.

6. **Should Qlatt implement the Gobl 2021 alias-free approach for high-F0 voices?** At 48 kHz sample rate, aliasing from LFLM is small, but for female/child voices at F0 > 300 Hz, it could become audible.
