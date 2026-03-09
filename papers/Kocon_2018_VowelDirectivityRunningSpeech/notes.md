# Horizontal Directivity Patterns Differ Between Vowels Extracted from Running Speech

**Authors:** Paulina Kocon, Brian B. Monson
**Year:** 2018
**Venue:** The Journal of the Acoustical Society of America, 144(1), EL7-EL12 (Express Letter)
**DOI/URL:** https://doi.org/10.1121/1.5044508

## One-Sentence Summary
Provides vowel-specific horizontal directivity patterns and third-octave band weighting functions (up to 20 kHz, 15-degree resolution) for five vowels extracted from running speech, showing that /a/ is significantly more directional than /o/ and /u/.

## Problem Addressed
Prior directivity studies used either long-term averaged speech, sustained/sung vowels, or voiceless fricatives. It was unknown whether vowels in natural running speech exhibit distinct directivity patterns, and existing third-octave band weighting functions (Chu & Warnock 2002) were limited to 8 kHz and collected by rotating the talker (non-simultaneous).

## Key Contributions
- First demonstration that vowels extracted from running speech exhibit vowel-category-dependent directivity patterns
- Complete third-octave band weighting functions for running speech from 79 Hz to 20 kHz at 13 angles (0-180 degrees in 15-degree steps) — Table 1
- Mean directivity indices (DIs) for five vowels: /a/=3.9 dB, /i/=3.3 dB, /e/=3.1 dB, /u/=2.9 dB, /o/=2.8 dB
- LTAS analysis at 21.5-Hz spectral resolution showing fine-grained directivity fluctuations above 2 kHz

## Methodology
- 15 native American English speakers (8 female, age 20-71, mean 28.5)
- 20 six-syllable phrases with alternating stress and low semantic predictability
- 13 half-inch precision microphones at 60 cm, semicircle 0-180 degrees (15-degree steps)
- 24-bit, 44.1 kHz sampling
- Manual vowel segmentation from 0-degree recording; steady-state extraction with 10-ms raised cosine fade
- Vowel sample counts per subject: /a/=6, /e/=12, /i/=10, /o/=6, /u/=6
- Levels normalized relative to 0 degrees; averaged across subjects
- LTAS: 2048-point FFT, Hamming window, 50% overlap (21.5-Hz resolution)

## Key Equations

### Directivity Index (half-plane)

$$
DI_m(\omega) = 10 \log_{10} \frac{|H_{m,0}(\omega)|^2}{\frac{1}{N} \sum_{n=0}^{N-1} |H_{m,n}(\omega)|^2}
$$

Where:
- $H$ = sound pressure
- $m$ = subject number
- $n$ = direction index (0 to N-1)
- $N$ = total number of directions (13)
- $\omega$ = frequency

From Tylka and Choueiri (2014). Represents ratio of energy at 0 degrees to average energy across all measured directions.

## Parameters

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| DI /a/ | DI | dB | 3.9 +/- 1.1 | Most directional; significantly different from /o/ and /u/ |
| DI /i/ | DI | dB | 3.3 +/- 0.8 | |
| DI /e/ | DI | dB | 3.1 +/- 0.7 | |
| DI /u/ | DI | dB | 2.9 +/- 0.7 | |
| DI /o/ | DI | dB | 2.8 +/- 0.7 | Least directional |
| Mic distance | - | cm | 60 | Conversational distance |
| Angular resolution | - | degrees | 15 | 0-180 half-plane |
| Sampling rate | - | kHz | 44.1 | 24-bit |
| FFT size (LTAS) | - | points | 2048 | Hamming, 50% overlap |
| LTAS resolution | - | Hz | 21.5 | |
| Fade duration | - | ms | 10 | Raised cosine |

### Third-Octave Band Weighting Functions for Running Speech (Table 1)

Levels in dB relative to 0 degrees. Full table reproduced from paper:

| Freq (Hz) | 0 | 15 | 30 | 45 | 60 | 75 | 90 | 105 | 120 | 135 | 150 | 165 | 180 |
|-----------|-----|------|------|------|------|------|------|-------|-------|-------|-------|-------|-------|
| 79 | 0.0 | 0.7 | -0.2 | 0.0 | -0.6 | -1.0 | -1.4 | -1.7 | -2.2 | -2.5 | -2.7 | -2.7 | -2.7 |
| 99 | 0.0 | 0.7 | -0.2 | -0.5 | -0.6 | -1.1 | -1.5 | -1.8 | -2.5 | -2.9 | -3.1 | -3.2 | -3.2 |
| 125 | 0.0 | 0.8 | -0.1 | -0.4 | -0.6 | -1.0 | -1.5 | -2.0 | -2.6 | -3.1 | -3.4 | -3.5 | -3.6 |
| 157 | 0.0 | 0.8 | -0.2 | -0.5 | -0.7 | -1.3 | -1.8 | -2.3 | -3.0 | -3.4 | -3.8 | -4.0 | -4.0 |
| 198 | 0.0 | 0.8 | -0.2 | -0.6 | -0.9 | -1.5 | -2.2 | -2.8 | -3.5 | -4.0 | -4.2 | -4.4 | -4.4 |
| 250 | 0.0 | 0.7 | -0.2 | -0.5 | -0.8 | -1.5 | -2.3 | -3.0 | -3.9 | -4.4 | -4.8 | -4.9 | -5.0 |
| 315 | 0.0 | 0.7 | -0.1 | -0.5 | -0.8 | -1.6 | -2.5 | -3.5 | -4.6 | -5.4 | -5.8 | -6.1 | -6.1 |
| 397 | 0.0 | 0.6 | -0.1 | -0.4 | -0.6 | -1.4 | -2.4 | -3.5 | -4.8 | -5.8 | -6.4 | -6.7 | -6.7 |
| 500 | 0.0 | 0.6 | 0.0 | -0.2 | -0.4 | -1.0 | -2.0 | -3.2 | -4.6 | -5.6 | -6.1 | -6.2 | -6.2 |
| 630 | 0.0 | 0.7 | 0.5 | 0.7 | 0.9 | 0.5 | -0.3 | -1.7 | -3.6 | -5.0 | -5.3 | -5.1 | -4.9 |
| 794 | 0.0 | 0.4 | 0.4 | 0.9 | 1.6 | 1.7 | 1.5 | 0.2 | -2.0 | -4.1 | -4.5 | -3.9 | -3.4 |
| 1000 | 0.0 | -0.3 | -1.4 | -2.8 | -3.2 | -2.8 | -2.6 | -3.3 | -5.4 | -8.3 | -9.2 | -7.8 | -7.0 |
| 1260 | 0.0 | -0.6 | -1.2 | -3.0 | -5.5 | -7.2 | -6.8 | -6.6 | -7.8 | -10.9 | -14.2 | -12.7 | -11.3 |
| 1587 | 0.0 | -0.6 | 0.0 | -0.8 | -3.0 | -6.0 | -7.7 | -7.3 | -7.5 | -9.4 | -13.8 | -14.8 | -12.7 |
| 2000 | 0.0 | -1.2 | 0.3 | 0.4 | -0.5 | -2.7 | -5.7 | -7.1 | -7.3 | -7.6 | -10.9 | -14.2 | -12.6 |
| 2520 | 0.0 | -1.8 | -0.9 | -2.6 | -3.9 | -4.1 | -6.4 | -9.4 | -10.9 | -11.4 | -13.6 | -16.9 | -15.3 |
| 3175 | 0.0 | -1.8 | -0.5 | -1.2 | -3.6 | -5.0 | -6.0 | -9.1 | -12.7 | -13.7 | -16.0 | -19.8 | -17.7 |
| 4000 | 0.0 | -1.6 | -1.1 | -2.3 | -4.3 | -5.6 | -6.6 | -9.0 | -13.3 | -15.5 | -17.1 | -22.4 | -19.7 |
| 5040 | 0.0 | -1.3 | -0.3 | -1.0 | -3.8 | -5.3 | -6.1 | -8.5 | -11.7 | -14.7 | -17.7 | -22.0 | -21.3 |
| 6350 | 0.0 | -1.3 | -1.5 | -2.6 | -5.3 | -7.0 | -8.9 | -11.1 | -14.7 | -17.0 | -20.5 | -24.7 | -24.8 |
| 8000 | 0.0 | -0.9 | -1.6 | -3.2 | -6.3 | -7.8 | -9.5 | -12.8 | -16.3 | -19.1 | -21.8 | -25.3 | -26.7 |
| 10079 | 0.0 | -1.1 | -1.9 | -3.4 | -5.6 | -6.2 | -7.8 | -10.6 | -14.2 | -17.2 | -22.0 | -24.9 | -27.4 |
| 12699 | 0.0 | 0.0 | -0.6 | -2.6 | -4.5 | -5.1 | -7.1 | -10.0 | -13.9 | -17.6 | -21.5 | -24.3 | -27.5 |
| 16000 | 0.0 | -0.7 | -0.5 | -2.2 | -4.7 | -5.3 | -7.7 | -11.1 | -15.6 | -19.1 | -23.1 | -22.2 | -26.3 |
| 20159 | 0.0 | -0.1 | -0.7 | -1.1 | -4.2 | -5.7 | -7.3 | -9.7 | -14.8 | -17.4 | -21.1 | -17.0 | -21.9 |

## Implementation Details
- Weighting functions are applied to on-axis recordings to simulate off-axis listening
- For a given angle theta, multiply on-axis signal spectrum by the weighting function at that angle in each third-octave band
- Below 500 Hz, directivity is nearly omnidirectional (< 6 dB attenuation even at 180 degrees)
- Above 1 kHz, directivity increases rapidly and nonlinearly
- The 4-kHz octave band shows the strongest vowel-dependent differences: /a,e,i/ more directional than /o,u/
- Third-octave resolution misses some fine structure above 2 kHz visible in the 21.5-Hz LTAS analysis
- Within-subject variance for DI across vowel tokens: 0.1-0.5 dB (low)
- Between-subject variance: ~0.7-1.1 dB SD (relatively high)

## Figures of Interest
- **Fig 1 (page 4):** Polar plots of overall and octave band (125 Hz to 16 kHz) directivity for all five vowels and speech. Shows vowel differences emerge above 1 kHz.
- **Fig 2 (page 5):** Third-octave band levels at 60 and 90 degrees for vowels vs speech vs Chu & Warnock data. Shows 2.5-5 dB disparities between speech average and individual vowels at 2 kHz+.
- **Fig 3 (page 6):** Heatmap of spectral levels vs angle, comparing third-octave and LTAS (21.5 Hz) resolution. Shows fine directivity fluctuations above 2 kHz.

## Results Summary
- Significant effect of vowel on DI (F=9.14, p<0.001, repeated-measures ANOVA)
- Bonferroni-corrected pairwise: /a/ vs /u/ (p<0.05), /a/ vs /o/ (p<0.05); no other pairs significant
- Directivity differences between vowels driven by 1 kHz band and above
- Strongest vowel separation in 4-kHz octave band: /a,e,i/ more directional than /o,u/
- At 90 degrees, individual vowels differ from long-term speech average by 2.5-5 dB at 2 kHz+
- Differences between spoken and sung vowel directivity exist: Marshall & Meyer (1985) found sung /e/ most directional; this study finds spoken /a/ most directional

## Limitations
- Half-plane measurement only (right side of talker, 0-180 degrees); no left-side or vertical data
- 15-degree angular resolution; finer changes exist (Katz & d'Alessandro 2007 showed this)
- Head not physically constrained during recording
- Only 5 vowel categories examined (no diphthongs, no reduced vowels)
- No consonant directivity data (except prior work on voiceless fricatives)
- Perceptual consequences of phoneme-level directivity changes are unknown

## Testable Properties
- DI must be non-negative (energy at 0 degrees >= average energy by definition of forward-facing speech)
- Weighting function at 0 degrees must be 0.0 dB for all frequencies (reference direction)
- Weighting function must be monotonically non-increasing from 0 to 180 degrees for frequencies above ~1 kHz (general trend, not strict per-band)
- At frequencies below 500 Hz, attenuation at 180 degrees should be less than ~7 dB
- At frequencies above 8 kHz, attenuation at 180 degrees should exceed 20 dB
- /a/ DI must exceed /o/ and /u/ DI (statistically significant finding)

## Relevance to Project
This paper provides the empirical directivity data needed to simulate off-axis listening in Qlatt. The Table 1 weighting functions could be implemented as a post-synthesis filter bank to model how speech sounds to a listener not directly in front of the talker. The vowel-specific DI data suggests that a more accurate model would apply different directivity filters per phoneme, though the third-octave speech average is a reasonable first approximation. Relates directly to Monson et al. 2012 (already in collection as Monson_2012_SpeechDirectivityHFE).

## Open Questions
- [ ] What are the directivity patterns for consonants in running speech (beyond voiceless fricatives)?
- [ ] Do diphthongs show intermediate or distinct directivity from their component vowels?
- [ ] What is the perceptual impact of phoneme-level directivity changes for listeners?
- [ ] Would vowel-specific directivity filters measurably improve synthesized speech naturalness in spatial audio?
- [ ] How does vocal effort level interact with vowel-specific directivity in running speech?

## Collection Cross-References

### Already in Collection
- [[Monson_2012_SpeechDirectivityHFE]] — directly cited as Monson et al. (2012a); this paper's parent dataset. Kocon & Monson extend the corpus analysis from fricative directivity to vowel directivity in running speech.

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Chu & Warnock (2002) — "Detailed directivity of sound fields around human talkers" — the most comprehensive prior speech directivity reference; provides comparison weighting functions up to 8 kHz
- Blandin et al. (2016) — "Influence of higher order acoustical propagation modes on variable section waveguide directivity" — physics-based modeling of vowel directivity; could inform a model-based approach beyond empirical tables
- Katz & d'Alessandro (2007) — "Directivity measurements of the singing voice" — finer angular resolution data for singing; useful for understanding the limits of 15-degree measurements

### Supersedes or Recontextualizes
- [[Monson_2012_SpeechDirectivityHFE]] — Kocon 2018 extends Monson 2012 from fricative-only to vowel-specific directivity. The Monson 2012 data remains valid; this paper adds vowel analysis from the same corpus.

### Conceptual Links (not citation-based)
- [[Porschmann_2024_VoiceDirectivityGroundReflection]] — Porschmann measures vertical directivity with phoneme-class distinctions; Kocon measures horizontal directivity with vowel-category distinctions. Together they provide complementary axes of the full 3D directivity picture, both demonstrating phoneme-dependent radiation.
- [[Hartenstein_2025_VoiceDirectivityHELS]] — Hartenstein reconstructs full 3D far-field directivity using spherical harmonics (orders >9 above 2 kHz); Kocon's 2D half-plane data is a subset of what 3D measurement captures. Hartenstein's finding of significant off-axis lobes invisible in 2D studies suggests Kocon's half-plane approach may underestimate directivity complexity.
- [[Chalker_1985_MouthRadiationImpedance]] — Chalker models mouth radiation impedance as a function of aperture size; Kocon observes that vowel-dependent aperture changes affect directivity. The radiation impedance models provide the theoretical mechanism for the empirical directivity differences Kocon reports.

## Related Work Worth Reading
- Monson et al. (2012a) - Directivity of low- and high-frequency energy in speech and singing (already in collection)
- Chu & Warnock (2002) - Detailed directivity of sound fields around human talkers (comprehensive reference data)
- Flanagan (1960) - Analog measurements of sound radiation from the mouth (foundational)
- Blandin et al. (2016) - Higher order acoustic propagation modes and vowel directivity modeling
- Katz & d'Alessandro (2007) - Singing voice directivity at finer angular resolution
