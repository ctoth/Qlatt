---
title: "Stevens & House 1961 - An Acoustical Theory of Vowel Production and Some of its Implications"
year: 1961
---

# Stevens & House 1961 - An Acoustical Theory of Vowel Production and Some of its Implications

## Key Concepts

### Source-Filter Theory for Vowels

The vowel sound pressure spectrum measured at distance r from the lips is the product of three terms (Eq. 2):

```
p_r(jw) = U_s(jw) * T(jw) * R(jw)
```

Where:
- `U_s(jw)` = glottal source spectrum (volume velocity)
- `T(jw)` = vocal tract transfer function
- `R(jw)` = radiation characteristic (rises at 6 dB/octave)

These are independent: source and radiation are articulatory-invariant; only T(jw) varies from vowel to vowel.

### Glottal Source Spectrum

- For a fundamental frequency of 125 Hz, the spectrum envelope of U_s falls at approximately 12 dB/octave above ~250 Hz
- Below 250 Hz the slope is less steep (derived from Fourier analysis of quasi-triangular waveforms)
- The overall spectral shape is relatively independent of vocal tract configuration

### Transfer Function Equations

**Single resonator (lumped-circuit, Eq. 3-4):**

```
T_1(jw) = (s_1 * s_1*) / ((jw - s_1)(jw - s_1*))
```

where `s_1 = sigma_1 + j*omega_1`, `s_1* = sigma_1 - j*omega_1`

Half-power bandwidth = `sigma_1 / pi` (in Hz)

Magnitude (Eq. 4):
```
|T_1(jw)| = omega_1^2 / ((omega + omega_1) * [(omega - omega_1)^2 + sigma_1^2]^(1/2))
```

**Transmission-line model (distributed, Eq. 5):**

```
T(jw) = (U_o / U_s) = product of [s_n * s_n* / ((jw - s_n)(jw - s_n*))]
```

for all resonances n, where `s_n = sigma_n + j*omega_n`

### Uniform Tube Properties

For a uniform tube of length l, open at one end:
- Resonant frequencies: `f_n = (2n + 1) * c / (4l)`
- For l = 17 cm (male): F1 ~ 500, F2 ~ 1500, F3 ~ 2500 Hz
- The magnitude |T(jw)| is the same at each resonant frequency
- |T(jw)| is approximately unity at zero frequency and midway between resonances

### Bandwidth Data and Assumptions

**Key assumption used throughout:** Half-power bandwidths of all resonances were assumed to be **100 Hz** (cps) for all vowels. This is stated to be "not greatly different from the bandwidths of the first three resonances for spoken vowels" (refs 2, 18, 23).

**Table 1 - Measured Bandwidths for Four Vowels (from ref 19, three male speakers):**

| Vowel | F1 (Hz) | B1 (Hz) | F2 (Hz) | B2 (Hz) |
|-------|---------|---------|---------|---------|
| /i/   | 300     | 50      | 2260    | 120     |
| /ae/  | 730     | 100     | 1650    | 100     |
| /a/   | 720     | 130     | 1190    | 80      |
| /u/   | 320     | 60      | 1110    | 100     |

Reference 19 = House, Stevens, K.N., and Fujisaki, H. (1960) - Automatic measurement of formants in diverse consonantal environments. JASA 32, 1960, 1117.

**Bandwidth correction formula:** If bandwidth B differs from 100 Hz, a correction of `10 * log10(100/B)` dB must be added to the resonance level read from contour plots (Figures 8-9).

### Resonance Level Calculations (Table 1 expanded)

Table 1 provides computed relative intensities for four vowels. Column meanings:
- A = average F1, F2 frequencies
- B = relative level of resonance peak (dB, from Figure 8 contours)
- C = half-power bandwidth (Hz)
- D = correction for bandwidth deviation from 100 Hz: `10 * log10(100/B_Hz)`
- E = contribution of resonance to overall intensity (= B + D)
- F = overall relative intensity of vowel (sum of resonance contributions on power scale)

**Computed vowel relative intensities (F column):**

| Vowel | F (dB relative) |
|-------|----------------|
| /i/   | 1.3            |
| /ae/  | 3.8            |
| /a/   | 5.6            |
| /u/   | 1.2            |

Range of ~4.4 dB across these four vowels, matching published measurements of ~4.8 dB.

### Spectral Peak Amplitude Relations

From isoamplitude contour plots (Figures 8-9):

**First resonance peak level** (relative, with F1 = 500, F2 = 1500, F3 = 2500 as reference):
- Contours in Figure 8 show dB iso-level lines as function of F1 vs F2
- At F1 = 500, F2 = 1500: first resonance = 0 dB (reference)
- Second resonance = -9.5 dB
- Third resonance = -15 dB

**Key relationship:** The level of a given resonance is influenced strongly by the frequencies of the lower resonances. When F1 and F2 are close together, both resonance levels are relatively high. When F2 is below 1500 Hz and F1 above 500 Hz, the second resonance level drops sharply.

### Amplitude Relations Within Syllables

- In a CVC syllable, the vowel portion has highest overall intensity
- F1 frequency decreases as vocal tract constriction increases (toward consonant)
- Therefore overall vowel amplitude decreases as F1 decreases
- The rate of decrease accelerates as F1 falls below ~300 Hz (close to the first resonant frequency of the uniform tube)

### On Defining the Formant

Stevens & House propose that "formant" should be defined as a **normal mode of vibration of the vocal tract** - i.e., the pole of the transfer function, characterized by:
- A complex number with real part (bandwidth/damping) and imaginary part (frequency)
- This definition applies regardless of excitation type (voiced, voiceless)
- The formant exists as a property of the tract even when not manifested as a spectral peak

This is the pole-based definition later adopted universally in speech synthesis (including by Klatt 1980).

## Implementation Relevance for Klatt Synthesizer

### Direct Applications

1. **Spectrum construction method:** The overall vowel spectrum = source spectrum + transfer function + radiation, computed by adding dB values. This is exactly the Klatt 1980 approach (cascade formant chain).

2. **Bandwidth assumption:** 100 Hz is a reasonable default bandwidth for all formants. The actual measured values in Table 1 range from 50-130 Hz. This aligns with Klatt 1980 defaults.

3. **Resonance level prediction from formant frequencies:** The isoamplitude contour plots (Figures 8-9) allow computing the expected amplitude of each formant peak from knowledge of F1, F2, F3 alone. This is the theoretical basis for the Klatt parallel synthesizer branch amplitude parameters (A1, A2, A3).

4. **F1 and overall vowel intensity:** F1 frequency is the primary determinant of overall vowel intensity. This justifies the Klatt AV parameter tracking with F1.

5. **Bandwidth correction:** When bandwidth differs from 100 Hz, the correction `10 * log10(100/B)` dB should be applied to resonance amplitude. This is a simple formula useful for formant amplitude rules.

### Transfer Function Form

Equation 5 gives the exact product-of-poles form for the transfer function. Each resonance contributes a factor:

```
s_n * s_n* / ((jw - s_n)(jw - s_n*))
```

This is the standard second-order resonator form used in Klatt's cascade formant chain. The paper provides the theoretical foundation for why the cascade chain works.

### Source Spectrum

- Glottal source spectrum envelope falls at ~12 dB/octave (for normal voice)
- Below ~250 Hz the slope is less steep
- This is consistent with the Liljencrants-Fant model source spectrum used in Qlatt

## Collection Cross-References

### Already in Collection
- `Fant_1960_AcousticTheorySpeechProduction` — parallel development of acoustic theory
- `Peterson_Barney_1952_VowelFormants` — vowel formant data referenced

### Cited By (in Collection)
- `Stevens_House_1963_PerturbationVowelConsonant` — extends this theory to consonantal context
- `Fujimura_1962_NasalConsonantAnalysis` — extends to nasal consonant transfer functions
- `Isshiki_1964_VoiceIntensityRegulation` — references for source-filter framework
- `Klatt_1990_VoiceQualityVariations` — references for formant amplitude theory
- `Stevens_1991_HL_Parameters` — Stevens' later work extending these amplitude relations

### Conceptual Links (not citation-based)
- `Lindblom_1971_AcousticConsequencesArticulatory` — both derive formant patterns from vocal tract models; Stevens & House focus on amplitude relations, Lindblom & Sundberg on articulatory parameters
- `Holmes_1983_FormantSynthesizersCascadeParallel` — Stevens & House 1961 provides theoretical basis for why cascade synthesis naturally produces correct amplitude ratios
- `Kent_Vorperian_2018_VowelFormantBandwidths` — both provide bandwidth data; Stevens & House use 100 Hz default, Kent & Vorperian provide age/sex-dependent empirical values
