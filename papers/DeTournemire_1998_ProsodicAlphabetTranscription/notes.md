# Automatic Transcription of Intonation Using an Identified Prosodic Alphabet

**Authors:** S. de Tournemire
**Year:** 1998
**Venue:** 5th International Conference on Spoken Language Processing (ICSLP 98), Sydney, Australia
**DOI:** 10.21437/ICSLP.1998-24
**Affiliation:** France Telecom, CNET (Centre National d'Etudes des Telecommunications)

## One-Sentence Summary
Presents a method for rapidly adapting prosodic models to new voices by automatically identifying a prosodic alphabet (breaks, F0 shapes, accents) at the acoustic level and using the transcribed corpus to train neural network F0 and duration prediction models for French TTS.

## Problem Addressed
Hand-labelling prosodic databases for TTS is extremely time-consuming and blocks rapid adaptation to new speakers or applications. This paper proposes a quasi-automatic pipeline: identify a prosodic alphabet at the acoustic level (guided by linguistic knowledge), automatically transcribe the corpus using threshold-based rules, then train neural networks on the labelled data. The goal is to replace years of hand-tuned prosody rules with an automatic methodology that yields equivalent quality.

## Key Contributions
- **Prosodic alphabet identification**: A systematic method for constructing speaker-dependent prosodic labels (breaks, F0 shapes, accents) from acoustic analysis of a corpus
- **Syllable elasticity factor for duration**: A z-score normalization approach to duration modelling that separates microprosodic/intrinsic segment durations from prosodic organisation
- **4-point F0 stylisation**: Stylises syllable F0 contours using 4 phonologically relevant points (syllable onset, vowel onset, vowel offset, syllable offset) with linear interpolation, achieving mean error of 1 Hz
- **Neural network prosody prediction**: Two-layer backpropagation networks for F0 and duration, trained on automatically transcribed data, yielding quality equivalent to hand-crafted CNETVOX system
- **Evaluation**: Naive listeners rate the automatically trained prosody as equivalent to the expert-crafted CNETVOX system

## Methodology
1. Corpus: 312 declarative sentences (4173 words, 6767 syllables), read by 2 professional speakers (1 male, 1 female), automatically segmented
2. F0 calculated at each segment transition (2 F0 values + 1 duration per segment)
3. Duration modelled at the syllable level via elasticity factor k (z-score normalization)
4. F0 stylised using 4 points per syllable with linear interpolation
5. Prosodic alphabet identified from distributions: break labels from pause/lengthening distributions, F0 shapes from combinations of rise/fall/flat on final syllables, accent labels from F0 rise patterns
6. Corpus automatically transcribed using threshold-based rules
7. Neural networks trained on labelled data for F0 and duration prediction
8. Integrated into CNET French TTS and evaluated by 16 naive listeners

## Key Equations

### Syllable Elasticity Factor (Duration)

$$
k = \frac{D_{syll} - \sum \mu_{seg,C}}{\sum \sigma_{seg,C}}
$$

Where:
- $D_{syll}$ = total syllable duration
- $\mu_{seg,C}$ = mean duration of segment type *seg* in context *C*
- $\sigma_{seg,C}$ = standard deviation of segment type *seg* in context *C*

**Interpretation**: k is a z-score measure of how much the syllable as a whole is lengthened (k > 0) or shortened (k < 0) relative to its expected duration given segment composition.

### Segment Duration Reconstruction

$$
\hat{D}_{seg} = \mu_{seg,C} + \hat{k} \cdot \sigma_{seg,C}
$$

Given the estimated elasticity factor $\hat{k}$ of the host syllable, reconstruct individual segment durations. Mean modelling error: 8 ms and 11 ms for the two speakers.

**Note**: This is essentially the same elasticity model as Campbell & Isard (1991) / Campbell (1993), applied to French. The key insight is identical: syllable-level prosodic factors determine an overall stretch/compress factor, and individual segments accommodate proportionally to their intrinsic variability.

### F0 Stylisation

4 points per syllable, linearly interpolated:
1. Beginning of syllable
2. Beginning of vowel
3. End of vowel
4. End of syllable

Mean error: 1 Hz for both speakers. Approximately equivalent to 2 points per phoneme.

## Parameters

### Corpus Statistics (Table 1)

| Speaker | F0 Mean | F0 SD | Duration Mean | Duration SD |
|---------|---------|-------|---------------|-------------|
| 1 (male) | 217 Hz | 39 Hz | 82 ms | 41 ms |
| 2 (female) | 104 Hz | 24 Hz | 85 ms | 41 ms |

**Note**: Speaker 1 (male) has an unusually high mean F0 (217 Hz). Speaker 2 (female) at 104 Hz is unusually low. These may be segment-transition F0 measurements rather than modal F0 averages, or the speaker labels may be swapped in the table.

### Prosodic Alphabet (Table 2)

Variables: k = syllable lengthening factor, a = F0 amplitude in semitones, d = pause duration in ms.

#### Break Labels

| Label | Description | Speaker 1 | Speaker 2 |
|-------|-------------|-----------|-----------|
| B0 | Full stop | (sentence final) | (sentence final) |
| B1 | Long pause | d >= 220 ms | d >= 450 ms |
| B2 | Medium pause | 120 <= d < 220 ms | 96 <= d < 450 ms |
| B3 | Small pause | d < 120 ms | d < 96 ms |
| B4 | Strong lengthening | k >= 1 | k >= 1 |
| B5 | Weak lengthening | 0 < k < 1 | 0 < k < 1 |
| B6 | No lengthening | k <= 0, prosodic word boundary | k <= 0, prosodic word boundary |

#### F0 Shape Labels (on final syllable of prosodic word)

| Label | Description | Speaker 1 | Speaker 2 |
|-------|-------------|-----------|-----------|
| S0 | Flat | a <= 1 st | a <= 1 st |
| S1 | High fall | (not observed) | a > 6 st |
| S2 | Fall | 1 < a <= 6 st | 1 < a <= 6 st |
| S3 | High rise | a > 6 st | a > 6 st |
| S4 | Rise | 1 < a <= 6 st | 1 < a <= 6 st |
| S5 | Fall-rise | a > 1 st | a > 1 st |
| S6 | Rise-fall | a > 1 st | a > 1 st |

#### Accent Labels (within prosodic word)

| Label | Description | Speaker 1 | Speaker 2 |
|-------|-------------|-----------|-----------|
| A1 | Weak accent (secondary) | F0 rise 2 < a <= 4 st | F0 rise 4 < a <= 7 st |
| A2 | Strong accent (emphatic) | F0 rise a > 4 st | F0 rise a > 7 st |

### Key Thresholds Summary

- **Flat F0**: <= 1 semitone movement
- **Small vs large F0 movement boundary**: 6 semitones (separates "rise" from "high rise", "fall" from "high fall")
- **Lengthening boundary**: k = 0 (no lengthening) vs k > 0 (some lengthening) vs k >= 1 (strong lengthening)
- **Pause classes**: Speaker-dependent thresholds derived from distribution analysis

## Implementation Details

### Duration Model Pipeline
1. Compute mean and standard deviation for each segment type in each context from the corpus
2. For each syllable, compute k from the elasticity formula
3. To predict: estimate k from the neural network, then reconstruct segment durations using the inverse formula

### F0 Model Pipeline
1. Stylise F0 contours using 4 points per syllable (linear interpolation)
2. Label prosodic events using threshold rules on the stylised contour
3. Train neural network: input = prosodic labels (breaks, F0 shapes, accents) for current + contextual syllables; output = 4 F0 values per syllable on a log scale
4. To predict from text: map linguistic/syntactic breaks to break labels, then assign most frequent F0 shape for each break type

### Neural Network Architecture
- Two-layer fully connected network
- Trained by backpropagation
- F0 network inputs: prosodic labels (breaks, F0 shapes, accents) for current and surrounding syllables
- F0 network outputs: 4 F0 values per syllable (log scale)
- Duration network inputs: prosodic labels (breaks, accents, syllable composition) for current and surrounding syllables
- Duration network outputs: lengthening factor k per syllable
- Test errors: F0: 20 Hz and 16 Hz per phoneme; Duration: 17 ms and 16 ms per phoneme

### French Prosodic Principles Used
- Main prosodic events (pauses, lengthening, F0 movements) occur at the end of prosodic words (final stress position)
- Secondary stress assumes rhythmic function, preventing large distances between stresses
- Emphatic accent: high F0 rise at word onset
- Secondary accent: F0 rise on first or antepenultimate syllable

## Figures of Interest
- **Figure 1**: Pipeline diagram showing transcription (corpus -> duration/F0 stylisation -> prosodic alphabet) and estimation (prosodic labels -> duration/F0 prediction models -> inverse stylisation -> synthesised speech)
- **Figure 2**: Subjective evaluation bar charts (MOS for intelligibility and quality tests across 5 conditions). Key result: generated prosody scores equivalent to hand-crafted CNETVOX prosody across all criteria.

## Results Summary
1. **Duration modelling**: Syllable elasticity model achieves 8-11 ms mean error per segment. Expert listeners cannot perceive difference between modelled and original durations.
2. **F0 stylisation**: 4-point linear interpolation achieves 1 Hz mean error. No perceptible difference from original.
3. **Neural network prediction**: 20/16 Hz F0 error, 17/16 ms duration error on test data. Expert listeners judge predicted contours as same quality as natural.
4. **Overall TTS evaluation**: 16 naive listeners rate automatically generated prosody as equivalent to the hand-crafted CNETVOX system. Both synthetic systems score between natural speech at 20 dB SNR and 10 dB SNR.

## Limitations
- French only (declarative sentences); no interrogative, exclamatory, or spontaneous speech
- Only 2 speakers; prosodic alphabet thresholds are speaker-dependent (especially pause durations differ dramatically: 220 ms vs 450 ms for long pause)
- Corpus is read speech, not spontaneous -- may not generalise to conversational prosody
- Break-to-F0-shape mapping uses simple frequency analysis (most common shape per break type) rather than a learned model
- No treatment of focus, emphasis, or information structure beyond basic accent labels
- The paper does not specify the neural network hidden layer sizes or training details
- F0 error of 20 Hz is relatively large; the paper does not analyse where errors concentrate

## Testable Properties
- **Elasticity uniformity**: Within non-final syllables, segments should be lengthened/shortened by approximately the same z-score k, regardless of segment type
- **4-point F0 adequacy**: Linear interpolation through 4 syllable points should produce F0 contours perceptually indistinguishable from the original (verified by the paper at 1 Hz mean error)
- **Threshold robustness**: The 1/6 semitone boundaries for F0 shapes should produce consistent labelling across utterances of similar prosodic structure
- **Break-to-shape correlation**: In French declarative sentences, specific break types should associate predominantly with specific F0 shapes (e.g., sentence-final breaks with falls)

## Relevance to Project

This paper's main value for Qlatt is:

1. **Syllable elasticity factor**: The k formula is the same model used in Campbell & Isard (1991) but applied to French, confirming cross-language validity of the approach. If Qlatt implements syllable-level duration (per Campbell & Isard), this paper provides corroboration and French-specific thresholds.

2. **4-point F0 stylisation**: The finding that 4 points per syllable (syllable onset, vowel onset, vowel offset, syllable offset) with linear interpolation achieves 1 Hz error is directly useful. Qlatt's F0 contour generation could use these same anchor points rather than frame-by-frame specification, greatly reducing the number of F0 targets needed.

3. **Prosodic alphabet thresholds**: The semitone thresholds for classifying F0 shapes (1 st for flat, 6 st for high rise/fall boundary) provide concrete values that could inform Qlatt's prosodic rule thresholds, even for English (with appropriate adaptation).

4. **Break classification**: The three-way pause duration classification and the lengthening factor categories provide a template for Qlatt's break index system.

## Open Questions
- [ ] How do the 1/6 semitone thresholds for F0 shape classification compare to English prosodic systems (ToBI, Tilt)?
- [ ] Can the 4-point F0 stylisation be adapted for English syllable structure?
- [ ] How does the syllable elasticity model interact with Qlatt's existing Klatt 1976 segment-level duration rules?
- [ ] The speaker-dependent pause thresholds (220 ms vs 450 ms) suggest these need per-voice calibration -- how to handle this in a rule-based system?

## Related Work Worth Reading
- Campbell, W.N. (1993) - "Detecting prosodic boundaries in a speech signal" - cited as source of the elasticity factor model
- Bartkova, K. & Sorin, C. (1987) - "A model of segmental duration for speech synthesis in French" - French segment duration model
- Hamon, Moulines & Charpentier (1989) - PSOLA diphone synthesis system used for evaluation
- Martin, P. (1974) - French intonation theory
- Mertens, P. (1987) - French intonation: linguistic description to automatic recognition
- Traber, C. (1992) - "F0 generation with a database of natural F0 patterns and with a neural network" - related neural net F0 approach

## Collection Cross-References

### Already in Collection
- [[Campbell_Isard_1991_SegmentDurationsSyllable]] - The syllable elasticity factor k in this paper is the same model. Campbell (1993), cited here as reference [3], is a later application of the same idea. Campbell & Isard provide the theoretical framework; de Tournemire applies it to French.
- [[OShaughnessy_1976_F0_Prosody]] - F0 modelling for TTS; both papers address F0 contour prediction from linguistic features, though O'Shaughnessy uses rule-based approach while de Tournemire uses neural networks.
- [[Klatt_1976_SegmentalDuration]] - The segment-level duration model that the syllable elasticity approach complements (not directly cited, but Bartkova & Sorin 1987, which is cited, builds on Klatt's framework).

### Conceptual Links (not citation-based)
- [[Taylor_2000_TiltModelIntonation]] - Tilt model parameterises intonational events (rise, fall, rise-fall) with continuous amplitude/duration parameters. De Tournemire's F0 shape labels (S0-S6) are a discrete categorical version of a similar decomposition. Both try to reduce F0 contours to a finite set of shape primitives, but Tilt uses continuous parameters while this paper uses semitone thresholds.
- [[Silverman_1992_ToBILabelingProsody]] - ToBI provides a standard prosodic transcription system for English. De Tournemire's prosodic alphabet serves the same function for French but is identified from acoustic analysis rather than defined linguistically. The break indices (B0-B6) parallel ToBI's break index tier.
- [[Ladd_2008_IntonationalPhonology]] - Ladd's framework for intonational phonology provides the theoretical backdrop for the distinction between acoustic, perceptual, and linguistic levels of prosodic transcription that de Tournemire discusses in Section 2.
