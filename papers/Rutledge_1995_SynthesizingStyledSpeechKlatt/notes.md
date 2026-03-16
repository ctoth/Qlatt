---
title: "Synthesizing Styled Speech Using the Klatt Synthesizer"
authors: "Janet C. Rutledge, Kathleen E. Cummings, Daniel A. Lambert, Mark A. Clements"
year: 1995
venue: "Proceedings, IEEE ICASSP 1995, pp. 648-651"
doi_url: "0-7803-2431-5/95"
---

# Synthesizing Styled Speech Using the Klatt Synthesizer

## One-Sentence Summary

Provides multiplicative scaling factors for KLSYN88A L-F glottal source parameters (F0, AV, OQ, SQ, TL) and acoustic parameters (vowel duration, word duration, consonant duration, consonant intensity) to transform normal speech into ten distinct speaking styles.

## Problem Addressed

LP- and FFT-based speaking style modification produced audible artifacts. This paper moves the style modification to the Klatt synthesizer (KLSYN88A), where high-quality formant synthesis avoids those artifacts while maintaining parametric control over style-relevant acoustic dimensions.

## Key Contributions

- Quantitative L-F parameter values (F0, AV, OQ, SQ) for 11 speaking styles (Table 1)
- Six glottal waveshape parameters (closing slope, opening slope, closed duration, closing duration, opening duration, top duration) for 11 styles (Table 2)
- Multiplicative scaling factors relative to *normal* for L-F excitation parameters (Table 3)
- Multiplicative scaling factors relative to *normal* for acoustic waveform parameters: vowel duration, word duration, consonant duration, consonant intensity (Table 4)
- Listening test confusion matrices for both synthetic and natural speech (Table 5)
- Demonstration that listeners identify synthetic styled speech as accurately as natural styled speech

## Methodology

1. Record natural utterance of "hot" in normal style
2. Analysis-by-synthesis: determine KLSYN88A parameter tracks for normal "hot"
3. For each of 10 other styles, multiply relevant parameter tracks by style-specific scaling factors derived from statistical analysis of glottal waveform and speech waveform variances (from Cummings 1992 dissertation)
4. Use modified L-F model as excitation source
5. Listening tests: 20 untrained listeners, 11 utterances in random order, forced-choice identification (each style used once), performed twice (synthetic and natural)

## Key Equations

$$
S(z) = E(z) G(z) V(z) R(z)
$$

Where:
- $S(z)$: z-transform of speech segment
- $E(z)$: z-transform of impulse train
- $G(z)$: z-transform of glottal waveform
- $V(z)$: z-transform of vocal tract impulse response
- $R(z)$: z-transform of lip radiation impedance

(Standard source-filter decomposition; no novel equations in this paper.)

## Parameters

### Table 1: L-F Glottal Model Parameters (Absolute Values)

| Style | F0 (Hz) | AV | OQ | SQ |
|-------|---------|------|-----|-----|
| normal | 140.4 | 9600 | 154 | 69 |
| angry | 266.7 | 12700 | 110 | 70 |
| clear | 150.9 | 9800 | 170 | 70 |
| 50% tasking | 140.4 | 8860 | 145 | 70 |
| 70% tasking | 145.5 | 9000 | 147 | 70 |
| fast | 150.9 | 9400 | 145 | 71 |
| Lombard | 163.3 | 9700 | 164 | 69 |
| loud | 250.0 | 12000 | 244 | 80 |
| question | 205.1 | 10200 | 159 | 64 |
| slow | 142.9 | 9700 | 152 | 70 |
| soft | 135.6 | 9300 | 127 | 70 |

Note: AV values appear to be in arbitrary internal units (not dB). OQ and SQ are percentages (ratio x 100).

### Table 2: Six Glottal Waveshape Parameters (Mean Values)

| Style | Closing Slope | Opening Slope | Closed Dur (samples) | Closing Dur (samples) | Opening Dur (samples) | Top Dur (samples) |
|-------|--------------|---------------|---------------------|----------------------|----------------------|-------------------|
| angry | -9910 | 9198 | 9.1 | 6.3 | 6.9 | 2.0 |
| 50% | -4522 | 2321 | 17.3 | 11.1 | 16.0 | 9.8 |
| clear | -5011 | 2686 | 15.8 | 9.5 | 16.0 | 6.9 |
| 70% | -4100 | 2138 | 16.7 | 10.7 | 15.7 | 9.9 |
| fast | -3972 | 2376 | 15.5 | 11.0 | 16.0 | 8.4 |
| loud | -9298 | 3532 | 6.3 | 6.9 | 17.0 | 2.9 |
| Lombard | -5430 | 2871 | 15.2 | 9.3 | 15.2 | 7.6 |
| normal | -4798 | 2643 | 17.7 | 10.2 | 15.6 | 9.9 |
| question | -4831 | 3034 | 14.0 | 9.4 | 14.9 | 7.0 |
| slow | -4786 | 2692 | 16.9 | 10.2 | 15.5 | 8.7 |
| soft | -2632 | 1921 | 17.7 | 14.7 | 18.6 | 9.9 |

Slopes are in (normalized amplitude)/(samples).

### Table 3: Excitation Parameter Scaling Factors (Relative to Normal = 1.00)

| Style | F0 | AV | OQ | SQ | TL |
|-------|------|------|------|------|------|
| normal | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| angry | 1.90 | 1.32 | 1.01 | 0.71 | 0.85 |
| 50% | 1.00 | 0.92 | 1.01 | 0.94 | 1.05 |
| 70% | 1.04 | 0.94 | 1.01 | 0.95 | 1.05 |
| clear | 1.07 | 1.02 | 1.01 | 1.10 | 1.05 |
| fast | 1.07 | 0.98 | 1.03 | 0.94 | 0.95 |
| loud | 1.78 | 1.25 | 1.16 | 1.58 | 0.75 |
| Lombard | 1.16 | 1.01 | 1.00 | 1.06 | 1.05 |
| question | 1.46 | 1.06 | 0.93 | 1.03 | 1.00 |
| slow | 1.02 | 1.01 | 1.01 | 0.99 | 1.00 |
| soft | 0.97 | 0.97 | 1.01 | 0.82 | 1.18 |

### Table 4: Acoustic Waveform Scaling Factors (Relative to Normal = 1.00)

| Style | Vowel Dur | Word Dur | Cons Dur | Cons Intensity |
|-------|-----------|----------|----------|----------------|
| normal | 1.00 | 1.00 | 1.00 | 1.00 |
| angry | 1.69 | 1.38 | 0.87 | 1.12 |
| 50% | 0.92 | 1.01 | 1.11 | 1.14 |
| 70% | 0.92 | 1.05 | 1.21 | 1.25 |
| clear | 1.26 | 1.39 | 1.80 | 0.92 |
| fast | 0.72 | 0.74 | 0.73 | 1.02 |
| loud | 1.58 | 1.36 | 1.03 | 0.84 |
| Lombard | 1.24 | 1.20 | 1.03 | 1.01 |
| question | 1.13 | 1.10 | 1.04 | 1.15 |
| slow | 1.83 | 1.73 | 1.50 | 1.06 |
| soft | 0.92 | 1.06 | 1.23 | 1.34 |

## Implementation Details

- Synthesizer: KLSYN88A (Klatt 1980/1990)
- Source model: Modified L-F (Liljencrants-Fant) glottal volume velocity derivative
- L-F parameters: F0 (fundamental frequency), AV (peak amplitude), OQ (open quotient = open-glottis time / total period), SQ (speed quotient = rising / falling duration ratio), TL (spectral tilt from corner-rounding)
- Parameter update rate: 5 ms (standard Klatt)
- Sampling rate: 8 kHz
- Style modification approach: multiply normal parameter tracks by style-specific ratios (Tables 3 & 4), plus apply style-appropriate pitch contours
- The method is relative, not absolute: given any style, transform to any other style by applying the ratio of target/source scaling factors

## Figures of Interest

- **Table 5 (page 4):** Confusion matrices for 20 listeners, both synthetic and natural speech. Shows which styles are perceptually distinct vs. confusable.

## Results Summary

- All 11 styles successfully synthesized
- All styles except angry perceived as natural-sounding
- Angry believed to require significant energy above 4 kHz (8 kHz sampling rate insufficient)
- Fast and slow were more identifiable for synthetic than natural speech
- Soft was more identifiable for natural than synthetic speech
- Clear, 50% tasking, and 70% tasking were confusable for both natural and synthetic speech
- Loud and Lombard were confused for each other in both conditions
- Several listeners volunteered they could not tell synthetic from natural speech
- Listeners made similar error patterns for synthetic and natural speech

## Limitations

- Only tested on a single word ("hot") -- no multi-word utterances
- Single speaker (Speaker One from Cummings 1992)
- 8 kHz sampling rate limits high-frequency content (angry style suffers)
- Beta function glottal model more accurate for style representation than L-F, but KLSYN88A only supports L-F
- Pitch contours were "representative" shapes for each style, not systematically derived
- No formant modification -- only source and temporal parameters varied

## Testable Properties

- F0 scaling: angry (1.90x) > loud (1.78x) > question (1.46x) > Lombard (1.16x) > normal (1.00x)
- AV scaling: angry (1.32x) > loud (1.25x) > question (1.06x) > normal (1.00x) > soft (0.97x)
- TL scaling: soft (1.18x) > normal (1.00x) > fast (0.95x) > angry (0.85x) > loud (0.75x) -- lower TL = less spectral tilt = more high-frequency energy
- Duration scaling: slow vowel duration (1.83x) > angry (1.69x) > loud (1.58x) > normal (1.00x) > fast (0.72x)
- Fast style reduces all durations: vowel (0.72x), word (0.74x), consonant (0.73x)
- Slow style increases all durations: vowel (1.83x), word (1.73x), consonant (1.50x)
- OQ varies minimally across styles (range 0.93-1.16) -- open quotient is relatively stable
- All scaling factors are > 0 (multiplicative, never negative or zero)

## Relevance to Project

The scaling factors in Tables 3 and 4 can be directly applied to Qlatt's declarative rule system for speaking style modification. Since Qlatt uses the L-F glottal source and supports F0, AV, OQ, SQ, TL parameters, these ratios could be implemented as style-specific scalar rules that multiply the normal parameter values. The duration scaling factors (vowel, consonant, word) map directly to duration rules. This provides a simple, empirically-grounded first pass at speaking style synthesis.

## Open Questions

- [ ] How do these single-word scaling factors generalize to connected speech?
- [ ] The AV values in Table 1 (e.g. 9600) are in unknown units -- how do they map to KLSYN88A's AV parameter (dB)?
- [ ] What pitch contour shapes were used for each style? Paper says "representative" but gives no specifics.
- [ ] Would the beta function glottal model (Cummings 1992) provide better style differentiation than L-F?

## Related Work Worth Reading

- Cummings 1992 (PhD dissertation) -- source data for all the style parameters; contains the beta function glottal model
- Hansen 1988 (PhD dissertation) -- analysis and compensation of stressed and noisy speech
- Klatt & Klatt 1990 -- voice quality variations, L-F model implementation in KLSYN88A
- Banse & Scherer 1996 -- vocal emotion acoustic profiles (already in collection)

## Collection Cross-References

### Already in Collection
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — cited as [7]; the synthesizer specification this paper builds on
- [[Klatt_1982_KlattalkTTS]] — cited as [8]; the Klattalk system using the same synthesizer
- [[Klatt_1990_VoiceQualityVariations]] — cited as [9]; describes the L-F source implementation in KLSYN88A used here
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited as [5]; source-filter theory foundation
- [[Cummings_1995_GlottalExcitationEmotionalSpeech]] — same research group (Cummings & Clements); the JASA paper that provides the glottal waveshape analysis underlying this paper's Tables 1-2. Rutledge applies those findings to Klatt synthesis.

### New Leads (Not Yet in Collection)
- Cummings (1992) — PhD dissertation, "Analysis, Synthesis, and Recognition of Stressed Speech," Georgia Tech — primary data source for all style parameters and the beta function glottal model
- Hansen (1988) — PhD dissertation, "Analysis and Compensation of Stressed and Noisy Speech," Georgia Tech — complementary stressed/noisy speech analysis

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Strong. Burkhardt provides rule-based Klatt parameter formulas for phonation types (breathy, tense, whispery, creaky, falsetto) using a single rate variable; Rutledge provides multiplicative scaling factors for the same L-F parameters across speaking styles (angry, loud, soft, etc.). Together they cover complementary dimensions of voice quality control in the Klatt synthesizer: Burkhardt modulates phonation type, Rutledge modulates emotional/situational style.
- [[Gobl_2003_VoiceQualityEmotion]] — Strong. Gobl provides KLSYN88 parameter trajectories mapping voice qualities (tense, breathy, harsh) to emotional states on an arousal/activation dimension; Rutledge provides scaling factors for similar parameters across a different style taxonomy (angry, Lombard, question, etc.). The two papers converge on the same finding that high-arousal styles (angry/loud) reduce spectral tilt and increase F0, while low-arousal styles (soft) increase tilt.
- [[Banse_1996_VocalEmotionAcousticProfiles]] — Moderate. Banse provides acoustic profiles (F0, energy, spectral distribution, rate) for 14 emotions from natural speech analysis; Rutledge provides the synthesizer-specific parameter scaling factors for 11 styles. Banse's prosodic profiles could inform the pitch contour shapes that Rutledge leaves unspecified.
