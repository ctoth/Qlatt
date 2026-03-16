---
title: "Acoustic Patterns of Emotions"
authors: "Branka Zei Pollermann, Marc Archinard"
year: 2002
venue: "Chapter 23 in *Improvements in Speech Synthesis*, COST 258"
doi_url: "Liaison Psychiatry, Geneva University Hospitals"
---

# Acoustic Patterns of Emotions

## One-Sentence Summary
Provides empirical acoustic parameter values (F0, energy, delivery rate, LTAS) for anger, joy, and sadness in French speakers, demonstrating that arousal is carried by F0/energy/rate while hedonic valence may be carried by long-term spectral shape.

## Problem Addressed
How to differentiate the acoustic expression of emotions that share the same arousal level (anger vs. joy, both high-arousal) using measurable vocal parameters beyond F0 and energy.

## Key Contributions
- Empirical F0, energy, and delivery rate values for anger, joy, and sadness in 66 French speakers (30 male, 36 female)
- Demonstration that F0/energy/rate differentiate arousal levels but NOT hedonic valence
- Bark-based LTAS analysis (13 bands, 40–5500 Hz) showing anger has significantly higher spectral energy than joy across 300–3400 Hz (males) and 800–3400 Hz (females)
- Partial correlation analysis showing F0 level predicts F0 range and variability across emotions
- Gender-differentiated parameter values for all three emotions

## Methodology
- 72 French speakers, emotion induction via autobiographical verbal recall (Mendolia & Kleck, 1993)
- Standard sentence: "Alors, tu acceptes cette affaire" (So you accept the deal)
- 66 subjects retained who reported emotional arousal during sentence production
- Acoustic analysis via Signalyze (Keller, 1994)
- Parameters: mean F0, F0 SD, F0 max/min ratio, voiced energy range (pseudo dB), delivery rate (syl/s)
- LTAS: 128 data points, 40–5500 Hz, analyzed in 13 Bark-based intervals (1.5 Bark each)
- Statistics: ANOVA for gender effects, paired t-tests for inter-emotion comparisons, partial correlations

## Key Equations

No formal equations presented. The paper uses the **covariance model** (Scherer et al., 1984; Scherer & Zei, 1988):

> Speech patterns covary with emotionally induced physiological changes in respiration, phonation, and articulation.

Three levels of acoustic variation:
1. Suprasegmental: pitch level, energy level, timing
2. Segmental: tense/lax articulation, articulation rate
3. Intrasegmental: voice quality

Two emotion dimensions:
1. **Activation** (aroused ↔ calm) → mainly reflected in F0, energy, rate
2. **Hedonic valence** (positive ↔ negative) → mainly reflected in LTAS / voice quality

## Parameters

### F0 Parameters by Gender and Emotion (Table 23.1)

| Emotion | F0 Mean (M) | F0 Mean (F) | F0 max/min (M) | F0 max/min (F) | F0 SD (M) | F0 SD (F) |
|---------|-------------|-------------|-----------------|-----------------|-----------|-----------|
| Anger   | 128 Hz      | 228 Hz      | 2.0             | 1.8             | 21.2      | 33.8      |
| Joy     | 126 Hz      | 236 Hz      | 1.9             | 1.9             | 22.6      | 36.9      |
| Sadness | 104 Hz      | 201 Hz      | 1.6             | 1.5             | 10.2      | 19.0      |

### Partial Correlations: Mean F0 vs Other Parameters (gender partialled out, N=66)

| Condition       | F0 max/min | F0 SD  | Voiced Energy Range | Delivery Rate |
|-----------------|-----------|--------|---------------------|---------------|
| F0 in Anger     | .43**     | .77**  | −.03                | .39**         |
| F0 in Joy       | .36**     | .66**  | −.08                | .16           |
| F0 in Sadness   | .32**     | .56**  | −.43**              | −.13          |

### Inter-Emotion Differentiation: Male Speakers (Table 23.3, N=30)

| Comparison       | F0 Mean | F0 max/min | F0 SD | Voiced Energy | Delivery Rate |
|-----------------|---------|-----------|-------|--------------|---------------|
| Sadness→Anger   | 104→128*** | 1.6→2.0*** | 10.2→21.2*** | 9.6→14.2*** | 3.9→4.6* |
| Sadness→Joy     | 104→126*** | 1.6→1.9*** | 10.2→22.7*** | 9.6→12.1*   | 3.9→4.5** |
| Joy→Anger       | 126→128 ns | 1.9→2.0 ns | 22.7→21.2 ns | 12.0→14.2** | 4.5→4.6 ns |

### Inter-Emotion Differentiation: Female Speakers (Table 23.4, N=36)

| Comparison       | F0 Mean | F0 max/min | F0 SD | Voiced Energy | Delivery Rate |
|-----------------|---------|-----------|-------|--------------|---------------|
| Sadness→Anger   | 201→228** | 1.5→1.8** | 19.0→33.8*** | 10.9→14.2** | 4.2→5.0** |
| Sadness→Joy     | 201→236** | 1.5→1.9*** | 19.0→37.0*** | 10.9→12.8* | 4.2→5.0** |
| Joy→Anger       | 236→228 ns | 1.9→1.8 ns | 37.0→33.8 ns | 12.8→14.2 ns | 5.0→5.0 ns |

### LTAS Bark-Band Energies: Anger vs Joy (Table 23.5, N=20)

| Band (Hz)     | Male A  | Male J  | Sig   | Female A | Female J | Sig   |
|---------------|---------|---------|-------|----------|----------|-------|
| 40–161        | 18.6    | 17.6    | ns    | 12.2     | 13.8     | ns    |
| 161–297       | 23.5    | 20.8    | ns    | 19.1     | 18.9     | ns    |
| 297–453       | 26.7    | 22.0    | *     | 21.9     | 20.8     | ns    |
| 453–631       | 30.9    | 24.3    | **    | 24.2     | 21.3     | ns    |
| 631–838       | 28.5    | 21.0    | **    | 23.6     | 19.3     | ns    |
| 838–1081      | 21.1    | 15.8    | **    | 19.4     | 14.7     | *     |
| 1081–1370     | 19.6    | 14.8    | **    | 16.9     | 12.6     | *     |
| 1370–1720     | 22.5    | 17.0    | **    | 17.5     | 12.9     | **    |
| 1720–2152     | 20.7    | 14.6    | **    | 19.7     | 16.1     | *     |
| 2152–2700     | 18.7    | 13.0    | **    | 15.2     | 12.4     | *     |
| 2700–3400     | 13.3    | 10.1    | *     | 14.7     | 11.3     | *     |
| 3400–4370     | 10.6    | 4.1     | ns    | 8.8      | 3.9      | ns    |
| 4370–5500     | 1.9     | 0.6     | ns    | 1.3      | 0.5      | ns    |

All energy values in pseudo dB. A = anger, J = joy.

## Implementation Details

### For Klatt Synthesis Emotion Presets

**Arousal axis (anger/joy vs sadness):**
- F0 mean: increase ~23% (male) or ~14-17% (female) for high-arousal emotions
- F0 range (max/min): increase from ~1.5–1.6 to ~1.8–2.0
- F0 SD: roughly double for high-arousal emotions
- Voiced energy range: increase ~3–5 pseudo dB
- Delivery rate: increase ~0.7–0.8 syl/s

**Valence axis (anger vs joy):**
- F0, energy, and rate parameters are NOT significantly different
- Spectral energy (LTAS) is significantly higher in anger than joy across mid-frequencies
- Males: anger > joy from ~300–3400 Hz (broadband, ~5–7 dB difference at peak)
- Females: anger > joy from ~800–3400 Hz (narrower range, ~3–5 dB difference)
- This suggests voice quality / spectral tilt as the valence differentiator

### Bark Band Boundaries (1.5 Bark intervals)
40, 161, 297, 453, 631, 838, 1081, 1370, 1720, 2152, 2700, 3400, 4370, 5500 Hz

## Figures of Interest
- **Table 23.1 (p. 239):** F0 parameters by gender and emotion with ANOVA
- **Table 23.2 (p. 240):** Partial correlations between F0 and other parameters
- **Table 23.3 (p. 241):** Male inter-emotion differentiation (paired t-tests)
- **Table 23.4 (p. 242):** Female inter-emotion differentiation (paired t-tests)
- **Table 23.5 (p. 243):** LTAS Bark-band energy comparison anger vs joy

## Results Summary
- Arousal-related parameters (F0, energy, rate) cleanly separate high-arousal (anger, joy) from low-arousal (sadness)
- These parameters do NOT differentiate emotions at the same arousal level (anger vs joy)
- LTAS shows anger has higher spectral energy than joy in mid-frequency bands, suggesting voice quality/spectral shape carries valence information
- Gender differences exist mainly in F0-related parameters (expected from vocal tract anatomy), not in energy range or delivery rate
- Higher F0 correlates with higher F0 range and variability across all emotions
- In sadness, higher F0 is negatively correlated with voiced energy range

## Limitations
- Only three emotions tested (anger, joy, sadness); no fear, disgust, contempt, surprise
- Single standard sentence in French only — limited generalizability
- Emotion induction via recall rather than natural emotions
- LTAS analysis uses only N=20 subjects (subset of the 66)
- The LTAS anger-joy difference could reflect arousal differences rather than valence (authors acknowledge this)
- No voice quality measures beyond LTAS (no H1-H2, OQ, jitter, shimmer)
- Energy measured in "pseudo dB" — not standard calibrated dB

## Testable Properties

- **F0 ordering:** For both genders, sadness F0 < anger F0 and sadness F0 < joy F0
- **F0 range ordering:** Sadness max/min ratio < anger max/min ratio and < joy max/min ratio
- **Arousal discrimination:** All F0/energy/rate parameters should significantly differ between sadness and anger, and between sadness and joy
- **Valence non-discrimination:** F0 mean, F0 range, F0 SD, delivery rate should NOT significantly differ between anger and joy
- **LTAS valence signal:** Anger spectral energy > joy spectral energy in the 300–3400 Hz range
- **Gender invariance of energy/rate:** Voiced energy range and delivery rate should NOT differ significantly between genders for any emotion

## Relevance to Project

This paper provides concrete numerical targets for implementing emotion presets in the Qlatt voice quality synthesis layer. The F0 and rate values can directly parameterize the TTS frontend prosody rules for anger/joy/sadness. The LTAS finding that spectral energy (not F0) differentiates valence supports the approach of using spectral tilt / voice quality parameters (TL, OQ in Klatt terms) to distinguish positive from negative emotions at the same arousal level. The Bark-band energy values in Table 23.5 provide specific targets for validating that anger presets produce more mid-frequency energy than joy presets.

## Open Questions
- [ ] Is the LTAS difference between anger and joy truly a valence signal, or just residual arousal difference?
- [ ] How do these French-speaker values compare to English-speaker data (e.g., Banse & Scherer 1996)?
- [ ] What specific Klatt parameters (TL, OQ, AV, AH) would reproduce the observed LTAS differences?
- [ ] Would adding jitter/shimmer measurements help differentiate anger from joy?

## Related Work Worth Reading
- Williams, C.E. and Stevens, K.N. (1972). Emotion and speech: Some acoustical correlates. JASA, 52, 1238–1250. — Original activation-vocal expression model
- Scherer, K.R., Ladd, D.R., and Silverman, K.E.A. (1984). Vocal cues to speaker affect. JASA, 76, 1346–1356. — Two-model test of emotion vocal cues

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cited for acoustic profiles of 14 emotions (broader emotion set, more parameters)
- [[Scherer_2001_VocalEmotionCrossCultural]] — cited for cross-cultural emotion recognition (tests universality of these patterns)
- **Larrouy-Maestri_2024_EmotionalProsody** — comprehensive review synthesizing 30 years including this work
- [[Burkhardt_2005_GermanEmotionalSpeechDatabase]] — German emotion corpus with EGG data (complementary dataset)
- [[Gobl_2003_VoiceQualityEmotion]] — voice quality parameter trajectories for emotional expression via KLSYN88
- [[Eyben_2015_GeMAPS_AcousticParameters]] — standardized acoustic parameter set overlapping with measures here

### New Leads (Not Yet in Collection)
- Williams & Stevens (1972) — "Emotion and speech" — foundational activation-vocal expression model
- Pittam (1987) — "Discrimination of five voice qualities" — voice quality perception ratings

### Now in Collection (previously listed as leads)
- [[Scherer_1984_VocalCuesSpeakerAffect]] — Tests covariance vs configuration models for vocal affect signaling. Finds voice quality cues (spectral energy distribution) convey affect independently of text (covariance model), while intonation contour type conveys affect only in interaction with question type (configuration model). Zei Pollermann & Archinard's use of the covariance model as theoretical framework is directly grounded in this 1984 study's empirical validation.

### Supersedes or Recontextualizes
- None — this paper is complementary to Banse_1996 (fewer emotions but real induced emotions rather than acted) and to Gobl_2003 (empirical data vs synthesis parameter targets)
