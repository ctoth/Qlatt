# On the Impact of Downward-Directed Human Voice Radiation on Ground Reflections

**Authors:** Christoph Pörschmann, Johannes M. Arend
**Year:** 2024
**Venue:** Acta Acustica, 8, 12
**DOI:** 10.1051/aacus/2024004

## One-Sentence Summary

This paper quantifies the phoneme-dependent vertical radiation directivity of the human voice across frequency, showing a characteristic downward main radiation direction (MRD) for most phonemes below 800 Hz that causes ground reflections stronger than the direct sound at listener distances > 3 m.

## Problem Addressed

Previous studies on voice directivity mostly focused on horizontal patterns; vertical/spherical directivity was under-studied and phoneme-specific differences in vertical radiation had not been systematically analyzed. The practical impact of downward-directed radiation on ground reflections was unknown.

## Key Contributions

1. Systematic measurement of vertical MRD for 23 phonemes (vowels, plosives, fricatives, nasals, alveolars) plus a phonetically balanced sentence, using full-spherical directivity data from 13 subjects
2. Quantification of MRD gain (MRDG) — how much the radiation in the MRD exceeds omnidirectional radiation — showing phoneme-class and frequency dependencies
3. Calculation of Ground Reflection Gain (GRG) as a function of speaker-listener distance, showing ground reflection exceeds direct sound below 800 Hz for most phonemes at distances > 3 m
4. Identification of statistically significant phoneme-class differences: unvoiced fricatives [f], [s], [ʃ] have weaker downward radiation; nasals have strongest downward radiation above 4 kHz; voiced alveolars [l], [r] have strongest low-frequency downward radiation

## Methodology

- Used previously published full-spherical directivity datasets from 13 subjects (7 male, 6 female)
- 32-position spherical microphone array, spatially upsampled to 2702-point Lebedev grid via SUpDEq method
- Directivity stored as 128-coefficient impulse responses at 48 kHz
- Voiced phonemes measured via glissando method (singing with increasing pitch over ≥1 octave)
- Plosives and unvoiced fricatives: repeated articulations
- Analysis in 1/3-octave and 1/12-octave bands, 125 Hz to 8 kHz
- Statistical analysis: repeated measures ANOVA with Greenhouse-Geisser correction

## Key Results

### Main Radiation Direction (MRD)

| Frequency Range | MRD (degrees, negative = downward) | Notes |
|---|---|---|
| < 800 Hz | −15° to −45° | Downward for all phonemes |
| 800 Hz – 1.6 kHz | ~+15° (upward) | Caused by shoulder/torso diffraction and reflection |
| > 1.6 kHz | Varies by phoneme | Generally returns downward |

### MRD by Phoneme Class

- **Vowels** [a, e, i, o, u]: Follow the general pattern; MRD ~−25° to −35° below 800 Hz
- **Plosives** [p, t, k, b, d, g]: Similar to general pattern; small inter-subject standard deviations
- **Unvoiced fricatives** [f, s, ʃ, x, h]: Weaker downward radiation below 1 kHz (statistically significant); [f], [s], [ʃ] specifically lack the prominent 700 Hz MRDG peak
- **Voiced fricatives** [z, v]: [z] resembles [s]/[ʃ] pattern but with much larger inter-subject variability below 1 kHz
- **Nasals** [m, n, ŋ]: Strongest MRDG above 4 kHz (up to 6 dB); significantly different from all other groups at high frequencies
- **Voiced alveolars** [l, r]: Strongest MRDG peak at ~700 Hz; significantly different from all other groups at low frequencies

### MRDG Peak at ~700 Hz

A prominent MRDG peak occurs at approximately 700 Hz for most phonemes. This is attributed to diffraction and reflection from shoulders and torso (not phoneme-specific articulation), based on Birkholz et al.'s simulations showing the effect disappears when the torso model is removed.

### Ground Reflection Gain (GRG)

Assumes:
- Mouth height and listener ear height = 1.5 m
- Ideal reflecting ground floor (absorption α = 0)

| Condition | Maximum GRG | Frequency | Distance |
|---|---|---|---|
| Sentence (average) | 2.6 dB | 750 Hz | 4 m |
| Vowel [i] | 4.6 dB | 700 Hz | 3.85 m |
| Alveolar [l] | 4.6 dB | 800 Hz | 3.2 m |
| Plosive [d] | 2.7 dB | 5.5 kHz | ~4 m |
| Nasal [m] | 3.2 dB | 7.5 kHz | 4 m |

For α = 0.2 (typical indoor floor): GRG > 0 dB region persists below 1 kHz at distances > 3 m.
For α = 0.4: GRG > 0 dB only around 700 Hz at ~5 m distance.
For α ≥ 0.6: GRG ≤ 0 dB everywhere.

### GRG Formula

$$
GRG = -\alpha + D(\theta_r, f) - D(\theta_d, f) + 20 \log_{10}\left(\frac{d_d}{d_r}\right)
$$

Where:
- α = ground absorption coefficient
- D(θ, f) = directivity gain at elevation angle θ and frequency f (relative to frontal direction)
- θ_r = elevation angle from speaker to ground reflection point
- θ_d = elevation angle from speaker to listener (direct path)
- d_d = direct distance, d_r = reflected path distance

## Figures of Interest

- **Fig. 1**: Vertical directivity heatmaps (angle vs. frequency) for sentence, vowels, plosives — shows the downward MRD below 800 Hz and upward shift at 800–1600 Hz
- **Fig. 2**: Same heatmaps for fricatives, nasals, alveolars
- **Fig. 3**: MRD vs. frequency (1/12-octave) per phoneme group with standard deviations
- **Fig. 4**: MRDG vs. frequency per phoneme group — shows the 700 Hz peak and nasal high-frequency prominence
- **Fig. 5-6**: GRG heatmaps (distance vs. frequency) for each phoneme
- **Fig. 7**: GRG for sentence at different floor absorption coefficients (α = 0, 0.2, 0.4, 0.6)
- **Fig. 8**: Interference patterns at listener position (direct + ground reflection superposition)

## Implementation Relevance for Qlatt

This paper is primarily about **room acoustics and spatial sound propagation**, not vocal tract acoustics or synthesis parameters. Its relevance to Klatt-based synthesis is indirect:

1. **Not directly implementable**: The paper does not provide formant frequencies, bandwidths, source parameters, duration rules, or any parameter that maps to Klatt synthesizer inputs. The directivity data describes what happens *after* sound leaves the mouth.

2. **Potential future use — spatial rendering**: If Qlatt ever adds spatial/room acoustic modeling (e.g., binaural rendering, virtual room simulation), phoneme-dependent directivity patterns would be needed. This paper provides the empirical basis for such a system.

3. **Phoneme-class radiation differences confirmed**: The finding that unvoiced fricatives [f, s, ʃ] have distinctly different radiation patterns from voiced sounds reinforces the physical basis for treating fricative sources differently in synthesis — though the paper doesn't change how we'd set AF, AH, or formant parameters.

4. **Torso/shoulder diffraction at ~700–800 Hz**: The prominent MRDG peak attributed to torso diffraction is an acoustic phenomenon that occurs downstream of the vocal tract. This is relevant context for understanding why measured speech spectra at different microphone positions may show systematic level differences around 700–1000 Hz, which could affect how we calibrate synthesis targets against recorded speech.

## Limitations

- Only 13 subjects (7M, 6F) — limited statistical power for gender comparisons
- Glissando method for voiced phonemes uses singing, not natural speech
- Assumed non-tilted frontal head orientation (people move their heads during speech)
- Ground reflection analysis assumes ideal reflecting floor (α = 0) as baseline
- No perceptual validation — unclear whether GRG differences are audible
- Datasets publicly available on Zenodo but impulse responses, not synthesis parameters

## Testable Properties

1. At a microphone placed at ear height 4 m from a speaker standing on a hard floor, the ground reflection should be 2–3 dB stronger than direct sound below 800 Hz
2. Unvoiced fricatives [f, s, ʃ] should show less ground-reflection amplification than vowels under the same conditions
3. Nasals should show the strongest ground-reflection amplification above 4 kHz
4. The 700 Hz MRDG peak should appear regardless of phoneme, since it's caused by torso geometry not articulation


## Collection Cross-References

### Already in Collection
- [[Monson_2014_HighFrequencyVoice]] — cited in citations.md; relates to the finding that nasals have strongest directivity above 4 kHz, where high-frequency voice energy is perceptually important
- [[Jongman_2000_FricativeAcoustics]] — cited in citations.md; the directivity differences for unvoiced fricatives relate to their distinct source characteristics documented by Jongman
- [[Shadle_2023_FricativeSpectraHighFreq]] — cited in citations.md; relevant to understanding why fricatives radiate differently in the vertical plane

### Cited By (in Collection)
- [[Kocon_2018_VowelDirectivityRunningSpeech]] — lists this paper as a conceptual link for complementary vertical vs. horizontal directivity data
- [[Hartenstein_2025_VoiceDirectivityHELS]] — cites Porschmann's directivity datasets; Hartenstein's spherical harmonic approach captures the full 3D picture

### Conceptual Links (not citation-based)
- [[Kocon_2018_VowelDirectivityRunningSpeech]] — Kocon measures horizontal vowel-specific directivity; Porschmann measures vertical phoneme-class directivity. Together they provide complementary axes of 3D directivity, both demonstrating phoneme-dependent radiation patterns. (Strong)
- [[Hartenstein_2025_VoiceDirectivityHELS]] — Hartenstein reconstructs full 3D far-field directivity using spherical harmonics; Porschmann's phoneme-specific vertical analysis provides the empirical phoneme-class distinctions that Hartenstein's general approach averages over. (Strong)
