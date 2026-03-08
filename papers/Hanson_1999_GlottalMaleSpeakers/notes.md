# Glottal Characteristics of Male Speakers: Acoustic Correlates and Comparison with Female Data

**Authors:** Helen M. Hanson, Erika S. Chuang
**Year:** 1999
**Venue:** J. Acoust. Soc. Am. 106(2), pp. 1064-1077, August 1999
**DOI:** 10.1121/1.427115

## One-Sentence Summary

Provides quantitative acoustic measurements of glottal source characteristics (open quotient, spectral tilt, aspiration noise, first-formant bandwidth) for 21 male speakers across three vowels, with predicted ranges from theoretical models and direct comparison to female speaker data from Hanson (1995a, 1997).

## Problem Addressed

Prior work on acoustic correlates of glottal configuration focused primarily on female speakers. Male speakers were assumed to have more complete glottal closure and less spectral tilt, but quantitative data was lacking. This paper fills that gap and provides gender-comparative data for voice quality modeling.

## Key Contributions

- Quantitative measurements of five acoustic parameters (H1\*-H2\*, H1\*-A1, H1\*-A3\*, N_w, B1) for 21 male speakers on vowels /ae/, /epsilon/, /wedge/
- Predicted ranges for these parameters based on theoretical models of glottal chink contribution (Tables II, III)
- Direct comparison with 22 female speakers (Table X), showing males have lower H1\*-H2\* (~3 dB), lower H1\*-A1 (~3 dB), and much lower H1\*-A3\* (~9.6 dB)
- Discovery of secondary glottal excitation pulses in some male speakers, complicating noise and bandwidth measurements
- Demonstration that gender differences in voice quality are primarily due to glottal configuration details, not simple F0 scaling

## Methodology

- 21 adult male speakers (ages 19-71), American English
- Three nonhigh vowels /ae, epsilon, wedge/ in carrier phrase "Say bVd again"
- 7 repetitions per utterance, first and last discarded, 5 tokens analyzed
- Microphone at 20 cm, low-pass filtered at 4.5 kHz, sampled at 10 kHz
- Five acoustic measures computed per token (see below)
- Compared with 22 female speakers from Hanson (1995a, 1997)

## Key Equations

### Frequency-domain scaling for gender comparison

If male source waveform $U_M(t)$ is female source $U_F(t)$ scaled in time by factor 2:

$$U_M(t) = U_F(t/2)$$

In frequency domain:

$$U_M(\omega) = 2 U_F(2\omega)$$

Net effect at frequency $\omega$:

$$20 \log_{10}|U_M(\omega)| = 6 \text{ dB} + 20 \log_{10}|U_F(\omega)| - 6 \text{ dB}$$

This predicts that simple F0 scaling alone would not change H1\*-H2\* but would increase H1\*-A3\* by 6 dB for males. Observed differences exceed this, indicating glottal configuration differences beyond F0 scaling.

### First-formant bandwidth from waveform decay

A formant oscillation is modeled as a damped sinusoid:

$$e^{-\alpha_i t} \cos 2\pi f_i t$$

where $f_i$ is the formant frequency and $\alpha_i$ is the exponential decay rate. The bandwidth $B1$ (in Hz) is estimated from the peak-to-peak decay rate of the first two F1 oscillations in a bandpass-filtered waveform.

### Spectral tilt from glottal chink

The gradual glottal closure from a posterior chink acts as a low-pass filter. Above the effective cutoff frequency, spectral tilt increases by 6 to 12 dB per octave (depending on chink size and closure dynamics).

## Parameters

### Table I: Average vocal tract dimensions (male speakers)

| Parameter | Value | Units |
|-----------|-------|-------|
| Length of vocal tract | 17 | cm |
| Vertical length of glottis | 0.4 | cm |
| Length of trachea | 12 | cm |
| Cross-sectional area of vocal tract | 4 | cm^2 |
| Cross-sectional area of trachea | 2.5 | cm^2 |

### Table II: Glottal chink effects on acoustic parameters (vowel /ae/, F0=100 Hz, F1=500 Hz, F2=1500 Hz, OQ=50%)

| A_ch (cm^2) | B_g (Hz) | B1 (Hz) | 20 log_10 B1 (dB) | U_ch (cm^3/s) | T (ms) | Tilt (dB) |
|-------------|----------|---------|-------------------|----------------|--------|-----------|
| 0.00 | 0 | 73 | 37 | 0 | 0 | 0.0 |
| 0.01 | 15 | 88 | 39 | 33 | 0.13 | 7.3 |
| 0.02 | 31 | 104 | 40 | 66 | 0.16 | 8.8 |
| 0.03 | 46 | 119 | 42 | 100 | 0.17 | 10.0 |
| 0.04 | 62 | 135 | 43 | 133 | 0.20 | 11.1 |
| 0.05 | 77 | 150 | 44 | 166 | 0.23 | 12.1 |
| 0.06 | 93 | 166 | 44 | 199 | 0.25 | 13.0 |
| 0.07 | 108 | 181 | 45 | 232 | 0.28 | 13.8 |
| 0.08 | 124 | 197 | 46 | 265 | 0.30 | 14.5 |
| 0.09 | 139 | 212 | 47 | 299 | 0.32 | 15.2 |
| 0.10 | 155 | 228 | 47 | 332 | 0.35 | 15.8 |

Where: A_ch = chink area, B_g = glottal contribution to F1 bandwidth, B1 = total F1 bandwidth, U_ch = minimum (dc) airflow through chink, T = time constant of effective low-pass filter, Tilt = spectral tilt increase at 2500 Hz. Assumes subglottal pressure 6300 dynes/cm^2 (6.4 cm H2O).

### Table III: Predicted male speaker values (F0=100 Hz, OQ=50%)

| Measure | Average | Minimum | Maximum |
|---------|---------|---------|---------|
| H1-A1 (dB) | -7.0 | -11.3 | -2.3 |
| H1-A3 (dB) | 13.7 | 4.7 | (19.7) |
| B1 (Hz) | 119 | 73 | 205 |

Note: Maximum H1-A3 in parentheses assumes simultaneous glottal closure; actual maximum could be higher.

### Table VIII: Measured vs. predicted acoustic parameters (male, combined vowels)

| Measure | Measured Mean | Predicted Mean | Measured Min | Measured Max | Measured Range |
|---------|-------------|----------------|-------------|-------------|---------------|
| H1\*-H2\* (dB) | 0 | -- | -3.3 | 4.2 | 7.5 |
| H1\*-A1 (dB) | -6.9 | -7.0 | -16.1 | 0.4 | 16.5 |
| H1\*-A3\* (dB) | 13.8 | 13.7 | 4.8 | 24.1 | 19.3 |
| N_w | 1.8 | -- | 1.2 | 3.2 | 2.0 |
| B1 /ae/ (Hz) | 126 | 119 | 58 | 245 | 187 |

### Table X: Male vs. female comparison

| Measure | Male Mean | Female Mean | Male s.d. | Female s.d. |
|---------|-----------|-------------|-----------|-------------|
| H1\*-H2\* (dB) | 0.0 | 3.1 | 1.8 | 2.0 |
| H1\*-A1 (dB) | -6.9 | -3.9 | 3.5 | 4.3 |
| H1\*-A3\* (dB) | 13.8 | 23.4 | 4.8 | 6.6 |
| N_w | 1.9 | 2.3 | 0.5 | 0.7 |
| B1 /ae/ (Hz) | 126 | 165 | 54 | 61 |

## Five Acoustic Measures

### 1. First-formant bandwidth (B1)
Estimated from decay rate of bandpass-filtered (600 Hz BW, Butterworth) waveform around F1. Uses peak-to-peak amplitude of first two F1 oscillations. Measured on /ae/ only (F1 high enough for reliable oscillation counting). Eight consecutive pitch periods used, 40 estimates averaged per speaker.

### 2. H1\*-H2\* (Open quotient indicator)
Amplitude of first harmonic relative to second, corrected for vocal-tract transfer function (first-formant influence). Correction from Hanson (1997, footnote 5; 1995a, Appendix A). Valid when harmonic frequencies are not within ~100 Hz of F1.

### 3. H1\*-A1 (First-formant prominence / bandwidth)
Amplitude of first harmonic relative to F1 spectral peak. Corrected for first-formant effect. Reflects B1 and may also be affected by posterior glottal chink presence.

### 4. H1\*-A3\* (Spectral tilt indicator)
Amplitude of first harmonic relative to F3 spectral peak, corrected for F1 and F2 effects on A3 amplitude. Correction factor from Hanson (1997, footnote 6; 1995, Appendix A). Vowel-dependent correction: A3 corrected by -7.8 dB for /ae/, -4.6 dB for /epsilon/, +2 dB for /wedge/ (based on average F3 bandwidths from House and Stevens 1958).

### 5. Noise rating (N_w)
Visual/perceptual rating of aspiration noise on a 4-point scale after bandpass filtering around F3 (600 Hz BW). Scale: (1) periodic, no visible noise; (2) periodic with occasional noise intrusion; (3) weakly periodic, clear evidence of noise; (4) little/no periodicity, noise predominant. Two judges, ratings averaged (inter-rater r=0.77).

### Spectral measurement procedure
- 512-point DFT with Hamming window
- Window length covers minimum 2 complete pitch periods (32-50 ms depending on speaker F0)
- Measurements at 20-ms intervals for /epsilon/ and /wedge/, centered on initial part of glottal cycle for /ae/
- Corrections applied to remove vocal-tract transfer function influence on harmonic amplitudes

## Implementation Details

### Vocal-tract correction for H1 and H2
The first-formant "boosts" H1 and H2 amplitudes. Correction removes this effect so that harmonic amplitudes approximate actual source spectrum levels. This is critical when comparing across vowels with different F1 values.

### A3 correction for neighboring formants
The amplitude of the third-formant peak (A3) is influenced by the first and second formants. Average corrections applied:
- /ae/: subtract 7.8 dB from A3
- /epsilon/: subtract 4.6 dB from A3
- /wedge/: add 2 dB to A3

These come from differences in average F3 bandwidths by vowel (House and Stevens 1958: F3 BWs at 103, 64, 88 Hz for /ae, wedge, epsilon/).

### KLGLOTT88 model predictions
Predicted values for H1-A1 and H1-A3 were derived from KLGLOTT88 (Klatt and Klatt 1990) combined with minimum airflow data from Holmberg et al. (1988) and Perkell et al. (1994). The model assumed:
- F0 = 100 Hz
- OQ = 50% (typical male)
- Uniform vocal tract (Table I dimensions)
- Subglottal pressure = 6300 dynes/cm^2 (6.4 cm H2O)

## Figures of Interest

- **Fig. 1 (page 3):** Speech waveform and vowel spectrum from female speakers showing H1, H2, A1, A3 labels, plus N_w bandpass-filtered waveform and B1 first-formant oscillation decay
- **Fig. 2 (page 6):** Four examples of aspiration noise ratings (N_w 1-4) showing waveforms bandpass-filtered in F3 region for vowel /ae/
- **Fig. 3 (page 8):** Comparison of spectra from two male speakers: M20 (strong harmonics, sharp formants, low spectral tilt) vs. M18 (noisy, weak formants, high spectral tilt)
- **Fig. 4 (page 9):** Speech waveforms showing secondary glottal excitation pulses in male speakers (subjects M9, M16)
- **Fig. 5 (page 9):** Spectrum showing alternating harmonic attenuation pattern caused by second excitation pulse delayed by ~50% of glottal cycle
- **Fig. 7 (page 11):** Histograms comparing male and female distributions for all five acoustic measures
- **Fig. 8 (page 12):** Spectral comparison of average male vs. female vowel /wedge/, showing steeper spectral tilt and weaker formant peaks in female spectrum
- **Fig. 10 (page 13):** H1\*-A1 vs. H1\*-A3\* scatter plot showing clear separation between male (low H1\*-A3\*) and female group 2 (high H1\*-A3\*) speakers

## Results Summary

- Male H1\*-H2\* mean = 0.0 dB (range 7.5 dB), compared to female mean = 3.1 dB. Difference ~3 dB, consistent with males having lower open quotients (~50% vs ~60%).
- Male H1\*-A1 mean = -6.9 dB, close to predicted -7.0 dB. Female mean = -3.9 dB. Difference ~3 dB, consistent with wider female F1 bandwidths from posterior glottal chinks.
- Male H1\*-A3\* mean = 13.8 dB, close to predicted 13.7 dB. Female mean = 23.4 dB. Difference ~9.6 dB, the largest gender difference. Reflects much greater source spectral tilt in females.
- Male B1 mean = 126 Hz (range 58-245 Hz), predicted 119 Hz. Female mean = 165 Hz.
- Male N_w mean = 1.9 (range 1.2-3.2). Female mean = 2.3.
- Only H1\*-A3\* showed statistically significant difference across vowels (ANOVA F(2,40)=11.0, p<0.01)
- Moderate correlations (0.49-0.60) among H1\*-A1, H1\*-A3\*, and N_w
- Males show tighter clustering (smaller s.d.) than females for most measures

## Limitations

- Only 5 tokens per vowel per speaker, limited statistical power for individual variation
- Secondary excitation pulses in some male speakers complicate noise ratings and bandwidth estimates; these tokens are flagged but still included
- B1 measurement assumes exponential decay of F1 oscillation, which may not hold when secondary excitation pulses are present
- Noise rating (N_w) is perceptual/visual, not a physical measurement; judges were uncertain about tokens with secondary pulses
- A3 vowel correction assumes average F3 bandwidths; individual variation in F3 BW is not accounted for
- Vocal tract modeled as uniform tube for predictions; real vocal tracts differ

## Testable Properties

- H1\*-H2\* for male speakers should be in range [-3.3, 4.2] dB (measured range)
- H1\*-A1 for male speakers should be in range [-16.1, 0.4] dB
- H1\*-A3\* for male speakers should be in range [4.8, 24.1] dB
- B1 for male /ae/ should be in range [58, 245] Hz
- N_w ratings should be in range [1.0, 3.8] (measured range across speakers)
- Increasing posterior glottal chink area monotonically increases B1, spectral tilt, and dc airflow (Table II)
- H1\*-A3\* should be on average ~9.6 dB lower for males than females
- H1\*-H2\* should be on average ~3 dB lower for males than females
- For a synthesizer: increasing OQ should increase H1\*-H2\*; increasing glottal chink area should increase H1\*-A1 and H1\*-A3\*

## Relevance to Project

This paper provides quantitative targets for setting voice quality parameters when synthesizing male vs. female voices in the Klatt synthesizer. The five acoustic measures (H1\*-H2\*, H1\*-A1, H1\*-A3\*, N_w, B1) can be used to validate that synthesized voice quality falls within natural ranges. The Table II data linking glottal chink area to bandwidth and spectral tilt is directly useful for parameterizing the LF source model differently for male and female voices. The finding that spectral tilt (H1\*-A3\*) is the strongest gender differentiator (~10 dB) should guide voice preset design.

## Open Questions

- [ ] How to map the 4-point N_w noise rating to AH (aspiration amplitude) parameter in the Klatt synthesizer?
- [ ] Can the secondary excitation pulse phenomenon be modeled in the LF source? Would multipulse excitation improve male voice naturalness?
- [ ] The paper's A3 correction factors depend on vowel identity; should we implement vowel-dependent spectral tilt correction in the frontend rules?

## Related Work Worth Reading

- Hanson (1995a) - Ph.D. thesis, full theoretical framework for these measures
- Hanson (1997) - Female speaker data (the comparison set for this paper)
- Klatt and Klatt (1990) - KLGLOTT88 model, voice quality synthesis, gender differences
- Holmberg et al. (1988, 1989) - Glottal airflow measurements, male/female, source for A_ch estimates
- Stevens (1998) - Acoustic Phonetics textbook, theoretical basis for spectral tilt from glottal chink
- Fant (1995) - LF model, relevant for implementing spectral tilt control

## Collection Cross-References

### Already in Collection
- [[Klatt_1990_VoiceQualityVariations]] - cited extensively; KLGLOTT88 model used for predictions in Table II/III
- [[Hanson_1995_GlottalCharacteristicsFemale]] - Ph.D. thesis with full theoretical derivations for all five measures
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] - the direct female comparison dataset (22 speakers)
- [[Stevens_1998_AcousticPhonetics]] - theoretical framework for spectral effects of glottal configuration
- [[Fant_1985_LFModelGlottalFlow]] - LF model basis (Fant 1995 LF-model-revisited paper not in collection but 1985 version is)
- [[Fant_1960_AcousticTheorySpeechProduction]] - foundational acoustic theory

### New Leads (Not Yet in Collection)
- Holmberg, E. B. et al. (1988) - "Glottal airflow and transglottal air pressure measurements" JASA 84, 511-529 - source for airflow data used in chink area estimates
- Perkell, J. S. et al. (1994) - "Group differences in measures of voice production and revised values of maximum airflow declination rate" JASA 96, 695-698 - revised MFDR values
- Fant, G. (1995) - "The LF-model revisited" - frequency domain analysis of LF model (we have 1985 but not 1995 revision)
- Titze, I. R. (1989) - "Physiologic and acoustic differences between male and female voices" JASA 85, 1699-1707 - gender voice differences

### Supersedes or Recontextualizes
- This paper extends Hanson_1997_GlottalCharacteristicsFemaleAcoustic to male speakers and provides the first direct gender comparison using these five measures.

---

**See also:** Hanson_2001_ModelsPhonation - Combines this male speaker data with female data into a unified 43-speaker analysis, introduces the HLsyn synthesizer, and applies phonation models to disordered speech populations.
