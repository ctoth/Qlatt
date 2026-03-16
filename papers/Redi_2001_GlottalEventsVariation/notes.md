---
title: "Redi & Shattuck-Hufnagel 2001 — Implementation Notes"
year: 2001
---

# Redi & Shattuck-Hufnagel 2001 — Implementation Notes

## Reference
Redi, L. & Shattuck-Hufnagel, S. (2001). Variation in the realization of glottalization in normal speakers. *Journal of Phonetics*, 29, 407–429. doi:10.1006/jpho.2001.0145

## Core Contribution
Systematic documentation of when, where, and how glottalization occurs in American English speech at phrase boundaries. Defines four acoustic categories of glottalization and quantifies their distribution by prosodic position, speaker, and gender.

## Four Acoustic Categories of Glottalization

### 1. Aperiodicity
- Irregularity in duration of glottal pulses from period to period
- Pitch periods show jumps (e.g., short→long→short, or long-short-long alternation)
- Differences in longest pitch period of aperiodic region vs. nearest modal region > 2 ms
- Perceptual correlate: consonant-like abruptness and/or general lowness of pitch

### 2. Creak
- Prolonged low fundamental frequency accompanied by near-total damping of glottal pulses
- Gradual widening in pitch period, resulting in very low f0 with strong damping
- Alternatively: dip in f0 at intervocalic position (intervocalic creak)
- Unifying characteristic: decrease in fundamental frequency
- Perceptual correlate: consonant-like abruptness and/or general lowness of pitch
- f0 drop alone is sufficient cue for perception of glottal stop (Hillenbrand & Houde 1996)

### 3. Diplophonia
- Regular alternation in shape, amplitude, or duration of successive glottal periods
- Can be simple repeating pattern or more complex
- Perceptual correlate: rough voice quality, perceived pitch approximately one octave below nearby modal region (consistent with period doubling)

### 4. Glottal Squeak
- Instantaneous increase in fundamental frequency, sustained for multiple periods
- Very low amplitude
- Theorized as shift from modal/vocal fry register to falsetto register
- Rare: < 1% of all glottalized tokens as sole acoustic correlate
- Almost always occurred adjacent to other types of glottalization
- Strong speaker preference: some speakers (e.g., SK: 56%) produced it frequently, while 6/10 speakers never produced it

## Quantitative Findings

### Overall Glottalization Rates (Table II)
| Speaker | Rate (%) | Speaker | Rate (%) |
|---------|----------|---------|----------|
| F1 (pro)| 68       | FS (non)| 55       |
| F2 (pro)| 88       | MK (non)| 52       |
| F3 (pro)| 64       | MM (non)| 80       |
| M1 (pro)| 13       | ES (non)| 73       |
| M2 (pro)| 39       | HH (non)| 49       |
| M3 (pro)| 47       | RM (non)| 30       |
| FJ (non)| 51       | SK (non)| 41       |

- Range: 13% (M1) to 88% (F2) — massive inter-speaker variation
- Professional speakers: 13–88%
- Nonprofessional speakers: 30–80%

### Position within Utterance
- **Utterance-final > phrase-final, utterance-medial** for ALL 14 speakers
- Significant for 4/10 Labnews speakers (p < 0.01 for F1, M2; p < 0.02 for F3; p < 0.05 for MK)
- ALL 4 ABC corpus speakers showed significantly higher utterance-final rates (p < 0.001 for HH, SK; p < 0.01 for ES, RM)

### Full vs. Intermediate Intonational Phrase Boundaries
- **Full IP boundaries > intermediate ip boundaries** for ALL 6 speakers examined
- Significant for 4/6 speakers (p < 0.001 for F2, FS, MM, FJ)

### Aperiodicity vs. Creak
- Aperiodicity more frequent than creak for most speakers
- 5/6 professional speakers: significantly more aperiodicity than creak
- 7/8 nonprofessional speakers: more aperiodicity than creak (4 significantly)
- Aperiodicity is the dominant glottalization type

### Gender Effects
- Professional speakers: all 3 females glottalized significantly more than all 3 males (p < 0.05)
- Nonprofessional speakers: mixed results, harder to interpret
- Among nonprofessionals (Labnews), male MM glottalized most; among ABC corpus, male ES glottalized most

## Key Implementation Implications for Synthesis

### When to Insert Glottalization
1. **Utterance-final position**: highest probability of glottalization
2. **Full intonational phrase boundaries** (utterance-medial): higher than intermediate
3. **Intermediate intonational phrase boundaries**: lowest probability
4. **Word-initial vowels at phrase onsets and pitch accents** (from prior literature: Pierrehumbert & Talkin 1992, Dilley et al. 1996)

### How to Realize Glottalization in a Synthesizer
Priority order (by frequency of occurrence):
1. **Aperiodicity**: Introduce irregularity in pitch periods (jitter). Differences > 2 ms from modal period duration.
2. **Creak**: Lower f0 gradually with increased damping of glottal pulses. Can be realized as gradual f0 decline.
3. **Diplophonia**: Alternate pulse amplitude or period in a regular pattern (period doubling).
4. **Glottal squeak**: Sudden shift to high f0 with very low amplitude. Very rare — can be omitted for most voices.

### Speaker-Level Parameters for Voice Profiles
- Overall glottalization rate: 13–88% (speaker-specific parameter)
- Preferred acoustic type: some speakers favor aperiodicity, others creak, some diplophonia
- Glottal squeak: binary speaker trait (produces/doesn't produce)
- These preferences appear stable within speakers across different materials

### Acoustic Correlates Useful for Detection/Synthesis
- H1 and H2 relative amplitudes have been used as glottalization diagnostics (Kirk, Ladefoged & Ladefoged 1984; Klatt & Klatt 1990)
- Relative amplitude of H1 and F1 also diagnostic
- Period-to-period irregularity in the waveform is the primary visual/acoustic marker

## Relationship to Other Acoustic Parameters
- Glottalization can occur at locations where f0 is at the speaker's midrange or even rising (not only at f0 minima)
- This suggests glottalization can be independently planned, not purely a byproduct of low f0
- Low subglottal pressure and low f0 at phrase boundaries may co-occur with but not fully cause glottalization

## Limitations
- Study examined only phrase-boundary glottalization (not word-initial vowel onsets, pitch accents, or allophonic /t/ replacement)
- No systematic investigation of segmental context effects
- Gender effects inconclusive for nonprofessional speakers
- No acoustic measurements beyond classification (no jitter/shimmer values, no spectral measures)

## Collection Cross-References

### Already in Collection
- `Klatt_1990_VoiceQualityVariations` — Klatt & Klatt 1990 H1-H2 diagnostics for glottalization
- `Gobl_1988_VoiceSourceDynamicsConnectedSpeech` — voice source dynamics at phrase boundaries

### Cited By (in Collection)
- `Hanson_2001_ModelsPhonation` — references Redi & Shattuck-Hufnagel for glottalization patterns
- `Kreiman_2007_GlottalSourceSpectrum` — cites Redi for nonmodal phonation variation

### Now in Collection
- `Dilley_2005_RaPLabelingSystem` — Dilley, cited for prosodic conditioning of glottalization

### Conceptual Links (not citation-based)
- `Keating_2015_CreakyVoiceAcoustics` — both study creaky/nonmodal phonation in American English; Keating focuses on acoustic measurement while Redi focuses on distributional patterns
- `Hollien_1968_VocalFryPhonationalRegister` — foundational work on vocal fry that relates to Redi's creak category
- `Gobl_2003_VoiceQualityEmotion` — both document voice quality variation; Gobl studies emotional dimension while Redi studies prosodic conditioning
