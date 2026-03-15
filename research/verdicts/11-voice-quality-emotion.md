# Verdict: Voice Quality & Emotion

## Papers Considered

47 papers assigned; 38 with notes.md read in full. Papers span 1963-2024 across voice quality parameterization, emotional speech synthesis, perceptual assessment, and nonlinear vocal dynamics.

**Papers read (notes.md):**
Gobl 2003, Burkhardt 2009, Burkhardt 2005, Childers & Lee 1991, Klatt 1990, Kreiman & Gerratt 2010, Kreiman 2021, Gerratt 2001, Hammarberg 1980, Wendahl 1963, Hillenbrand 1994, Hollien 1968, Keating 2015, Fraj 2011, Cummings 1995, Rutledge 1995, Murray 1993, Banse 1996, Scherer 2001, Scherer 1984, Scherer TaskLoad, Mozziconacci 1998, Mozziconacci 2002, Larrouy-Maestri 2024, ZeiPollermann 2002.

**Papers with notes.md confirmed present but not read in full (lower priority per rubric):**
Goudbeek 2010, Belyk 2014, Laukka 2008, Laukka 2011, Szameitat 2011, Grollero 2023, France 2000, Moore 2003, KaczmarekMajer 2024, Cui 2006, Weninger 2013, Caballero 2018, Fish 2017, Lee 2019, Herzel 1994, Titze 1991, Lucero 1999, Lucero 2005, Steinecke 1995, Vogel 2010.

**Papers without notes.md:** Scherer 1986 (PDF/PNGs only, no notes.md), Juslin 2003 (no notes.md found).

## Context from Wave 1 Verdicts

**Verdict 02 (Glottal Source Models)** established:
- LF model via Rd (Fant 1997) implemented as LFLM (Perrotin 2021) is the consensus best practice
- Aspiration noise (AH) is the most important single breathiness cue (Klatt 1990: rating 2.88/5)
- Rd range 0.3 (pressed) to 2.7 (breathy) covers the voice quality space
- Missing: aspiration-Rd coupling, female defaults, diplophonia, tracheal coupling

**Verdict 01 (Source-Filter Interaction)** established:
- Source-filter independence is adequate for most adult male speech
- Bandwidth corrections for glottal leakage are correctly implemented
- Voice quality affects are absorbed into LF parameters

## Findings by Category

### Wrong

**1. "Jitter and shimmer are primary perceptual correlates of voice quality."**
- Source: Widespread assumption in clinical voice assessment (GRBAS, MDVP protocols)
- Evidence against: Kreiman & Gerratt 2010 demonstrated listeners are "quite insensitive" to jitter/shimmer changes in sustained vowels. Hillenbrand 1994 showed CPP (a periodicity measure) explains 84% of breathiness variance, but this reflects signal-to-noise ratio, not jitter per se. Fraj 2011 showed shimmer emerges automatically from frequency jitter through vocal tract filtering -- no separate shimmer parameter is needed. Kreiman 2021 validated that the four-piece harmonic source spectrum (H1-H2, H2-H4, H4-2kHz, 2kHz-5kHz) plus noise spectral shape are necessary and sufficient for voice quality; jitter/shimmer are not in the model.
- Verdict: **WRONG as primary correlates.** Jitter contributes to perceived roughness (Wendahl 1963) and shimmer emerges from jitter via vocal tract filtering (Fraj 2011), but neither is a primary perceptual dimension of voice quality. For synthesis, Qlatt's flutter (FL) parameter provides adequate jitter; a separate shimmer parameter is unnecessary.

**2. "H1-H2 alone predicts voice quality type (breathy/modal/pressed)."**
- Source: Common simplification in voice quality literature
- Evidence against: Hanson 1997 found H1*-H2* correlation with breathiness ratings is only r = 0.25. Kreiman 2012 showed the H1*-H2*-to-OQ relationship is speaker-dependent. Kreiman 2007 PCA showed H1-H2 loads on a factor independent of overall spectral slope. Doval 2006 (from Verdict 02) proved H1-H2 depends on both Oq AND alpha_m. H1*-A3* (corrected) is a far better predictor (r = 0.69-0.86 with breathiness, Hanson 1997).
- Verdict: **WRONG.** Already established in Verdict 02 Finding #1. H1-H2 cannot be used alone. This finding is reinforced by the voice quality literature: Kreiman 2021's four-piece source model explicitly requires four spectral slope segments, not just H1-H2.

**3. "Voice quality maps one-to-one to discrete emotions."**
- Source: Implicit assumption in some emotional TTS systems
- Evidence against: Gobl 2003 demonstrated each voice quality maps to a cluster of affective states, not a single emotion. Tense voice signals stressed/angry/confident/formal/hostile. Breathy voice signals relaxed/content/intimate/friendly/sad. Tense vs harsh was not perceptually significant (same affect ratings). Voice quality primarily differentiates arousal/activation, not valence (Gobl 2003, ZeiPollermann 2002). Scherer 1984 showed voice quality operates as a parallel affect channel (covariance model), not as discrete categorical labels.
- Verdict: **WRONG.** The mapping is many-to-many. Voice quality signals activation level (high: tense/harsh; low: breathy/whispery/creaky). Valence requires additional cues: F0 contour type, spectral energy distribution (ZeiPollermann 2002: anger has 5-7 dB more mid-frequency energy than joy), and linguistic context.

### Superseded

**4. Klatt 1990 constant aspiration noise superseded by pulsatile noise (Fraj 2011, Childers & Lee 1991).**
- Klatt 1990 AH parameter adds flat-spectrum noise with optional 50% amplitude modulation during the second half of the glottal period (Gobl 2003 notes this).
- Childers & Lee 1991 showed noise onset at ~75% of pitch period, 50% duty cycle, and amplitude modulation by glottal volume velocity sounds most natural. Constant noise perceptually segregates from voice.
- Fraj 2011 provided the synthesis equation: noisy_velocity(n) = u_g(n) + n1 * u_g(n-d) * noise(n) + n2. Pulsatile noise stays perceptually integrated with the voice.
- Verdict: **SUPERSEDED.** Constant aspiration noise is a first-order approximation. Pulsatile noise modulated by glottal flow is more natural. However, Klatt 1990's AH with glottal-phase modulation (as implemented in KLSYN88) is an intermediate step already partially correct.

**5. Murray 1993 qualitative emotion-parameter mappings superseded by quantitative profiles.**
- Murray 1993 provided qualitative descriptions ("anger = very much higher pitch, breathy chest tone").
- Banse & Scherer 1996 replaced these with 29 quantitative acoustic parameters across 14 emotions with z-score profiles.
- Rutledge 1995 provided multiplicative Klatt parameter scaling factors for 11 styles (Table 3: angry F0 x1.90, AV x1.32, TL x0.85).
- Burkhardt 2009 provided explicit rate-based formulas for 5 phonation types.
- Verdict: **SUPERSEDED.** Murray 1993 remains a useful overview but its parameter directions are imprecise. Use Banse 1996 for acoustic targets and Burkhardt 2009/Rutledge 1995 for Klatt-specific synthesis parameters.

### Limited

**6. Gobl 2003 KLSYN88 voice quality parameters: correct but limited to KLSYN88 parameter space.**
- Gobl 2003 provides the most complete set of KLSYN88 parameter trajectories for 7 voice qualities. This is the primary synthesis reference for voice quality in Klatt synthesis.
- Limitation: Parameters are for a single male Swedish speaker, a single utterance ("ja adjö"), and use KLSYN88 (which has the fixed alpha_m = 2/3 limitation identified in Verdict 02). The tense-harsh distinction was not perceptually significant. The values are approximate (read from Fig. 1).
- Burkhardt 2009 extends this with rate-based formulas applicable to any baseline, validated perceptually on German, but uses "lax-creaky" rather than prototypical creaky voice.
- Verdict: **LIMITED.** Gobl 2003 parameters are the best available starting points for voice quality presets in a Klatt synthesizer, but: (a) they need adaptation for Qlatt's LF/Rd parameterization rather than KLSYN88's OQ/SQ/TL; (b) the single-speaker basis limits generalizability; (c) they should be combined with Burkhardt 2009's rate-based approach for user-controllable voice quality strength.

**7. Banse & Scherer 1996 acoustic profiles: correct for acted speech, limited generalizability.**
- 29 parameters across 14 emotions, the most comprehensive quantitative dataset.
- Limitations: Acted German speech (not spontaneous); z-score profiles after removing actor/gender/sentence effects; individual variation is large; some emotions poorly recognized (disgust 15%, shame 22%). Scherer 2001 cross-cultural study showed 66% accuracy across 9 countries, confirming reasonable universality but with cultural variation. Larrouy-Maestri 2024 review concludes no definitive acoustic signature exists for each emotion after 30 years of research.
- Verdict: **LIMITED.** The profiles are the best available empirical targets for emotional synthesis, but effect sizes are moderate and individual variation is large. Priority should be given to high-recognition emotions: anger (78%), boredom (76%), interest (75%), sadness (52%).

**8. Kreiman 2021 four-piece source model: validated but limited to sustained vowels.**
- 198/200 synthetic voices were perceptually indistinguishable from natural (d' < 2.10). Four harmonic parameters (H1-H2, H2-H4, H4-2kHz, 2kHz-5kHz) plus shaped noise are necessary and sufficient.
- Limitation: Only sustained /a/ at 10 kHz. Static parameters -- the two failures were caused by time-varying noise levels. Not tested on connected speech. The four-piece model parameterizes the output spectrum, not the underlying source (LF model); bridging the two requires deriving spectral slopes from Rd.
- Verdict: **LIMITED.** The four-piece model validates that Qlatt's source parameter space (via Rd controlling spectral slopes) is on the right track, but the specific segment boundaries and the noise spectral shape model would need adaptation for connected-speech TTS.

**9. Mozziconacci 1998 prosody-only emotional synthesis: correct finding that prosody alone is insufficient.**
- Achieved 63% emotion recognition using only F0 level, F0 range, speech rate, and intonation pattern type.
- Critical finding: sadness recognition dropped from 97% (natural) to 47% (rule-based prosody only); fear dropped from 60% to 41%. These emotions require voice quality cues.
- Verdict: **LIMITED.** Prosody parameters (pitch level, range, rate) provide the primary emotion signal, but voice quality is essential for sadness, fear, and affect distinctions at the same arousal level. Complete emotional synthesis requires both prosody rules and voice quality modification.

**10. Keating 2015 creaky voice taxonomy: correct but complicates synthesis.**
- Identifies 6 subtypes of creaky voice: prototypical, vocal fry, multiply-pulsed, aperiodic, nonconstricted, tense/pressed. Each has a different acoustic signature; no single measure captures all types.
- For synthesis: vocal fry (low F0 + periodic + damped pulses + narrow B1), prototypical creak (low F0 + jitter + low H1-H2), and tense/pressed (low H1-H2 + normal F0) are the most relevant subtypes.
- Verdict: **LIMITED.** Useful taxonomy but complicates the simple "creaky = low F0 + DI" model used by Gobl 2003 and Burkhardt 2009. For Qlatt, prototypical creak and vocal fry are the primary targets; the full taxonomy is a refinement.

### Incomparable

**11. Dimensional vs. categorical emotion models.**
- Dimensional: Arousal (activation) x Valence (pleasant-unpleasant) x Potency (dominance). Supported by Scherer 1984, ZeiPollermann 2002, Goudbeek 2010.
- Categorical: Discrete emotions (anger, fear, sadness, joy, etc.). Used by Gobl 2003, Banse 1996, Mozziconacci 1998.
- Both are partially correct. Arousal maps primarily to F0/intensity/rate; valence maps to spectral quality/voice quality (ZeiPollermann 2002: LTAS differentiates anger from joy when F0/rate cannot). For synthesis, both perspectives are needed: categorical presets defined by dimensional coordinates.
- Verdict: **INCOMPARABLE.** Different levels of description. For Qlatt implementation: use dimensional parameters (Rd for source quality, F0/rate for arousal) as the continuous controls, with named emotion presets as predefined parameter combinations.

**12. Acted vs. spontaneous emotional speech.**
- Acted: Banse 1996, Burkhardt 2005, Gobl 2003. Provides controlled, recognizable exemplars.
- Spontaneous: Laukka 2011, Scherer TaskLoad. Provides ecological validity but lower recognition rates and more variable acoustics.
- Laukka 2011 showed spontaneous affect has different acoustic profiles than acted emotion.
- Verdict: **INCOMPARABLE.** Acted speech provides parameter ranges for synthesis targets; spontaneous speech provides ecological validity constraints. Both are needed. Per the evidence hierarchy: acted speech is acceptable for parameter ranges (rubric item 3).

**13. Perceptual rating scales vs. analysis-by-synthesis measurement.**
- Rating scales (GRBAS, CAPE-V): Kreiman & Gerratt 2010 demonstrated these lack theoretical grounding and show poor inter-rater reliability.
- Analysis-by-synthesis (Gerratt 2001, Kreiman 2021): Method-of-adjustment tasks achieved 96% listener agreement and 198/200 perceptual matches.
- Verdict: **INCOMPARABLE.** Different measurement paradigms. For synthesis validation, analysis-by-synthesis is superior. For quick assessment, rating scales remain practical. Qlatt should use perceptual discrimination tests (d' methodology) for quality evaluation.

## What Subsumes What

```
Murray 1993 (qualitative emotion → parameter directions)
  └─ superseded by Banse 1996 (29 quantitative parameters × 14 emotions)
       └─ extended by Larrouy-Maestri 2024 (30-year review, 7 acoustic factors)

Klatt 1990 voice quality parameters (AV, OQ, TL, AH, DI, FL)
  └─ parameterized for emotions by Gobl 2003 (7 voice quality types)
       └─ formalized by Burkhardt 2009 (rate-based formulas for 5 phonation types)

Klatt 1990 constant aspiration noise
  └─ improved by Childers & Lee 1991 (pitch-synchronous modulated noise)
       └─ superseded by Fraj 2011 (pulsatile noise ∝ glottal volume velocity)

Wendahl 1963 (jitter → harshness)
  └─ extended by Fraj 2011 (jitter synthesis algorithm + pulsatile noise)
       └─ contextualized by Kreiman 2010 (jitter/shimmer low perceptual priority)

Kreiman 2007 (4 source spectrum factors by PCA)
  └─ validated perceptually by Kreiman 2021 (4-piece model sufficient + necessary)

Scherer 1984 (covariance vs configuration models)
  └─ extended by Banse 1996 (14-emotion profiles)
       └─ cross-culturally validated by Scherer 2001 (66% accuracy, 9 countries)
```

## Genuinely Uncertain

**1. What voice quality parameters differentiate positive from negative emotions at the same arousal level?**
ZeiPollermann 2002 showed anger has 5-7 dB more mid-frequency spectral energy than joy, but their N was only 20. Scherer 1984 showed voice quality operates as a parallel affect channel for valence, but the specific acoustic parameters were not fully resolved. Larrouy-Maestri 2024's 30-year review concludes: "No definitive acoustic signature exists for each emotion." Confidence: low.

**2. Optimal DI (diplophonia) parameter values for natural-sounding creaky voice.**
Gobl 2003 gives DI = 5-25% for creaky, 10-20% for harsh, 15-25% for lax-creaky. Burkhardt 2009 uses DI = rate for creaky. Keating 2015 showed 6 subtypes of creak with different acoustic signatures. No systematic perceptual study has established the optimal DI trajectory for each creaky subtype. Qlatt does not currently implement DI. Confidence: low.

**3. Cross-linguistic stability of emotion-acoustic mappings.**
Scherer 2001 showed 66% cross-cultural recognition, but used German actors only. The Indonesian group (non-Indo-European) achieved only 52%. Mozziconacci 1998's Dutch parameters differ from Banse 1996's German parameters in absolute values. Larrouy-Maestri 2024 notes in-group advantage for emotion recognition. Whether Qlatt's English synthesis should use German/Dutch/English-specific emotion parameters or cross-cultural averages is unresolved. Confidence: medium.

**4. Whether nonlinear dynamics (bifurcations, chaos) are needed for natural voice quality synthesis.**
Herzel 1994 and Steinecke 1995 showed period-doubling and chaos arise from vocal fold asymmetry. Keating 2015 identifies multiply-pulsed voice as a distinct creaky subtype involving subharmonics. However, Kreiman 2021 showed 198/200 voices could be matched with a linear source model. For normal and mildly disordered voices, linear models appear sufficient. For severe pathological or extreme nonmodal voices, nonlinear phenomena may be needed. Confidence: medium.

**5. Time-varying voice quality parameters during emotional speech.**
Gobl 2003 provides parameter trajectories (not just static values) for a single utterance. Cummings 1995 provides mean glottal parameters per speaking style. But how voice quality parameters should evolve over a phrase (e.g., increasing breathiness toward phrase end, glottalization at boundaries) in emotional speech is poorly characterized. Fant 1997 (Verdict 02) provides phrase-level Rd contour rules for neutral speech but not for emotional speech. Confidence: low.

## Best Current Understanding

### Voice Quality Parameter Space

Four independent perceptual dimensions of voice quality are consistently identified across the literature (Kreiman 2007 PCA, Hammarberg 1980 factor analysis, the voice-quality-papers-summary cross-synthesis):

| Dimension | Primary Control | Klatt/Qlatt Parameter | Key Papers |
|---|---|---|---|
| 1. Low-frequency spectral shape | Open quotient | Rd (→ Rk, Rg) | Kreiman 2007, Doval 2006, Childers 1991 |
| 2. Spectral tilt / HF rolloff | Closure pattern | Rd (→ Ra, Fa) | Hanson 1995/1997, Fant 1997 |
| 3. Noise excitation | Aspiration / turbulence | AH | Klatt 1990, Hillenbrand 1994, Fraj 2011 |
| 4. Aperiodicity / irregularity | Diplophonia, jitter | DI, FL | Gobl 2003, Fraj 2011, Wendahl 1963 |

**Perceptual hierarchy** (what matters most for synthesis quality):
1. Aspiration noise (AH): Most important single cue for breathiness. Klatt 1990: AH=60 rated 2.88/5 breathiness. Must be pulsatile, not constant.
2. Spectral tilt (via Rd/TL): Best single predictor of voice quality type. Hanson 1995: r = 0.69-0.75 with breathiness ratings. H1*-A3* (corrected) is the best analysis measure.
3. Combined cues: All cues together produce the strongest AND most natural percept. Klatt 1990: 3.76/5 combined vs 2.88/5 AH alone.
4. Jitter/shimmer: Low perceptual priority for sustained vowels (Kreiman 2010). Jitter contributes to roughness/harshness perception, scaled by F0 (Wendahl 1963). Shimmer emerges from jitter via vocal tract filtering (Fraj 2011).

### Emotion-Voice Quality Mapping

Voice quality primarily signals **arousal/activation**, not valence:

| Arousal | Voice Quality | Klatt Parameters | Evidence |
|---|---|---|---|
| High (anger, fear) | Tense | Low Rd (→ low OQ, low TL), narrow BWs, high AV | Gobl 2003, Burkhardt 2009, Rutledge 1995 |
| Low (sadness, boredom) | Breathy/lax-creaky | High Rd (→ high OQ, high TL), wide B1, moderate AH, DI | Gobl 2003, Burkhardt 2009, Mozziconacci 1998 |
| Neutral | Modal | Rd = 0.7 (male default) | Fant 1997 |

Valence differentiation requires F0 contour type (Mozziconacci 2002: contour type contributes ~11% to emotion ID), spectral energy distribution (ZeiPollermann 2002: anger has higher LTAS than joy), and linguistic context (Scherer 1984: configuration model).

### Synthesis Implementation Strategy

Based on the evidence hierarchy (perceptual validation of synthesis > acoustic measurement > generic analysis):

1. **Voice quality presets** via Burkhardt 2009 rate-based formulas applied to Qlatt's Rd-based system:
   - Breathy: Rd += (Rd_max - Rd_base) * rate/100; AH += AH_scale * rate/100; B1 increase
   - Tense: Rd -= (Rd_base - Rd_min) * rate/100; AV += 6 * rate/100; BWs decrease
   - Whispery: AV -= AV * rate/100; AH += AV * rate/100 (voiced-to-noise trade)
   - Creaky: DI = rate; Rd slightly increased; F0 lowered; AV reduced

2. **Emotion presets** combining prosody (Mozziconacci 1998) and voice quality (Gobl 2003, Burkhardt 2009):
   - Anger: F0 x1.90, rate x1.27, tense voice quality at rate ~70% (Rutledge 1995)
   - Sadness: F0 x0.97, rate x0.78, breathy/lax-creaky voice quality (Mozziconacci 1998: requires VQ)
   - Joy: F0 x1.46 (est.), rate x1.12-1.20, slight breathiness (Murray 1993)
   - Fear: F0 highest, rate x1.12, irregular voicing (FL increase)

3. **Priority order for implementation:**
   a. DI (diplophonia) parameter -- needed for creaky/harsh (Gobl 2003, Burkhardt 2009)
   b. AH-Rd coupling -- aspiration should covary with Rd (Verdict 02 item A1)
   c. Voice quality presets via Burkhardt rate formulas
   d. Emotion prosody rules (F0 level, range, rate scaling)
   e. Pulsatile noise for natural breathiness (Fraj 2011)

## Synthesizer Audit

### What Qlatt Gets Right

**S1. Rd as primary voice quality control.** Default 0.7, range 0.3-2.7. Correctly implements Fant 1997. Rd controls OQ, spectral tilt (via Ra/Fa), and glottal formant bandwidth (via Rk) in a single parameter. This is the correct modern approach per Verdict 02.

**S2. Bandwidth covariation with Rd.** semantics.yaml implements Fant 1997 DeltaB1 and DeltaB2 formulas. These correctly account for source-filter interaction effects on perceived bandwidth.

**S3. Flutter (FL).** Implements Klatt 1990 Eq. 1 (three sinusoids at 12.7, 7.1, 4.7 Hz). Provides adequate pitch perturbation for naturalness.

**S4. Jitter.** Per-period random perturbation based on Fraj 2011. Reasonable implementation.

**S5. AH parameter exists.** Aspiration noise is controllable per-segment in inventory.yaml. /h/ has AH=40; stop aspirations have AH=52-55.

### Audit Items (Issues Found)

**A1. No voice quality presets or emotion parameters.**
- Current state: No mechanism exists for setting voice quality type (breathy, tense, creaky, etc.) or emotional style. Rd is set to 0.7 globally; AH is set per-phoneme for linguistic purposes only; no DI parameter exists.
- Literature says: Gobl 2003, Burkhardt 2009, and Rutledge 1995 provide concrete parameter values for voice quality types and emotional styles. Mozziconacci 1998 establishes that emotions like sadness and fear cannot be expressed without voice quality modification.
- Impact: High. Without voice quality control, Qlatt cannot express emotion or speaker variation beyond F0/rate changes.
- Fix: Implement Burkhardt 2009 rate-based formulas as a voice quality layer that modifies Rd, AH, B1-B5, AV, and (once implemented) DI. Expose a `voiceQuality` parameter (enum: modal/breathy/tense/whispery/creaky) with a `rate` (0-100%) for strength.

**A2. No DI (diplophonia) parameter.**
- Current state: The LF WASM crate has no diplophonia implementation. Already identified in Verdict 02 item A7.
- Literature says: Gobl 2003 uses DI = 5-25% for creaky, 10-20% for harsh, 15-25% for lax-creaky. Burkhardt 2009 uses DI = rate for creaky. Klatt 1990 defines DI as alternate-pulse delay + attenuation. Keating 2015 identifies multiply-pulsed voice as a distinct creaky subtype.
- Impact: Medium-high. DI is essential for creaky voice (used in phrase-final positions in English), harsh voice (anger expression), and lax-creaky voice (boredom/sadness).
- Fix: Add DI parameter to lf-source crate. Implementation per Klatt 1990: every other pulse delayed by DI% of closed phase, attenuated by DI% linearly.

**A3. AH not coupled to Rd (reconfirmed from Verdict 02).**
- Current state: AH is set independently per phoneme.
- Literature says: Klatt 1990 found AH is the most important breathiness cue. Hanson 1995 Table 5.2 shows AH covaries with OQ/TL/B1 across voice quality continuum. When Rd increases (breathier voice), aspiration should increase.
- Impact: Medium. Without coupling, increasing Rd (e.g., for a breathy voice preset) produces spectral tilt change without the aspiration noise that listeners primarily use to identify breathiness.
- Fix: Add aspiration-Rd coupling rule in semantics.yaml: aspGainRdDelta = max(0, effectiveRd - RdRef) * 6.0 dB. Conservative slope per Hanson 1995 Table 5.2 data.

**A4. No tracheal pole-zero pair (reconfirmed from Verdict 02).**
- Current state: No tracheal resonance in the audio graph.
- Literature says: Klatt 1990 Table VII provides tracheal pole-zero frequencies. Burkhardt 2009 uses FNP=FNZ=550 Hz, FTP=FTZ=2100 Hz with narrowing bandwidths for breathy voice.
- Impact: Low. Breathiness perception is primarily driven by AH and TL (Klatt 1990 perceptual data). Tracheal coupling is a refinement for highly breathy voices.

**A5. No emotion prosody rules.**
- Current state: F0 contour is generated from linguistic prosody rules only.
- Literature says: Mozziconacci 1998 provides pitch level, pitch range, and speech rate multipliers for 7 emotions. Rutledge 1995 provides Klatt parameter scaling factors for 11 styles.
- Impact: Medium. Without emotion prosody, synthesized speech sounds affectively neutral.
- Fix: Implement emotion prosody as a rule phase that scales F0 baseline, F0 range, and segment durations per emotion preset. Use Rutledge 1995 Table 3 for Klatt-specific scaling factors.

**A6. Aspiration noise is constant, not pulsatile.**
- Current state: I did not verify the exact aspiration noise implementation in Qlatt's WASM crate. However, Klatt 1980 original uses constant noise; KLSYN88 added 50% modulation during second half of glottal period.
- Literature says: Fraj 2011 and Childers & Lee 1991 both demonstrate pulsatile noise modulated by glottal volume velocity sounds more natural. Constant noise perceptually segregates from voice.
- Impact: Low-medium. Affects naturalness of breathy voice synthesis.
- Fix: If not already pulsatile, modify the noise source to modulate aspiration by glottal flow waveform envelope.

## Open Questions

1. **What Rd values correspond to Gobl 2003's KLSYN88 parameter sets?** Gobl provides OQ/SQ/TL; these need conversion to Rd for Qlatt's parameterization. The mapping is: Rd can be estimated from OQ via Fant 1997 Table 1 (OQ 35% → Rd ~0.3; OQ 55% → Rd ~0.7; OQ 85% → Rd ~1.4; OQ 95% → Rd ~2.0).

2. **Should voice quality presets modify formant frequencies?** Burkhardt 2009's tense voice narrows all bandwidths B1-B5 (tissue tenseness). Gobl 2003 does not modify formant frequencies. Whether formant frequency shifts (e.g., F1 raising for anger per Murray 1993) should be included in voice quality presets or handled separately is unclear.

3. **How should voice quality transitions be handled?** Natural speech shows voice quality changes within utterances (e.g., phrase-final glottalization, stress-dependent breathiness). Klatt 1990 documents increasing noise and decreasing OQ toward utterance end. The temporal dynamics of voice quality parameter changes are poorly specified.

4. **What is the minimum parameter set for perceptually adequate emotional synthesis?** Kreiman 2021 validated 4 harmonic + noise for voice quality. Mozziconacci 1998 showed 3 prosody parameters achieve 63% emotion recognition. The joint minimum set (prosody + voice quality) for emotional TTS is unknown.
