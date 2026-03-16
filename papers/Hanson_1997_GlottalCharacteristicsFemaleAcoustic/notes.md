---
title: "Glottal Characteristics of Female Speakers: Acoustic Correlates"
authors: "Helen M. Hanson"
year: 1997
venue: "Journal of the Acoustical Society of America, Vol. 101, No. 1, January 1997"
doi_url: "S0001-4966(97)03001-4"
---

# Glottal Characteristics of Female Speakers: Acoustic Correlates

## One-Sentence Summary
Defines corrected spectral measures (H1\*-H2\*, H1\*-A1, H1\*-A3\*, B1, noise ratings) that quantify female glottal voice quality variations caused by incomplete vocal fold closure and nonabrupt closure patterns.

## Problem Addressed
Female speakers exhibit more variation in voice quality (breathy to pressed) than males, largely due to incomplete glottal closure. Previous work required invasive fiberscopy or inverse filtering; this paper derives non-invasive acoustic measures directly from the speech spectrum that reliably indicate underlying glottal configuration.

## Key Contributions
- Five corrected acoustic parameters measurable from speech spectra that indicate glottal configuration
- Theoretical framework linking glottal chink area to F1 bandwidth, spectral tilt, and aspiration noise
- Empirical data from 22 female speakers classifying them into two glottal closure groups
- Correction procedures for removing vocal tract influence from harmonic amplitude measurements
- Quantitative prediction of spectral tilt from glottal chink area (Table I)

## Methodology
Theoretical modeling of four glottal configurations (Sec. I), then measurement of acoustic parameters from 22 female speakers producing /ae, ʌ, ɛ/ in "Say bVd again" carrier phrases. Parameters include H1\*-H2\*, H1\*-A1, H1\*-A3\*, B1 (first-formant bandwidth), and subjective noise ratings. ANOVA and correlation analysis relate parameters to underlying glottal configurations.

## Key Equations

### Eq. 1: Time constant of exponential closure approximation
$$T \approx \frac{T_D}{2}$$
Where: $T_D$ is the time from anterior closure to posterior closure of the vocal folds.

### Eq. 2: Breakpoint frequency for spectral tilt
$$f_T = \frac{1}{2\pi T} = \frac{1}{\pi T_D}$$
Above this frequency, spectrum slope increases by 12 dB/octave (if exponential approximation holds).

### Eq. 3: Increase in tilt at 2750 Hz (average F3 for female speakers)
$$20 \log_{10} \frac{2750}{f_T} \text{ dB}$$
Example: $T_D = 0.5$ ms, $f_T = 637$ Hz, tilt increase = 13 dB.
Example: $T_D = 1.0$ ms, $f_T = 318$ Hz, tilt increase = 19 dB.
Minimum tilt due to nonabrupt closure estimated at ~9 dB for female speakers (Hanson, 1995).

### Eq. 4: Glottal contribution to formant bandwidth
$$B_g = \frac{\rho c^2}{\pi A_v l_v R_{ch}(1 + 4\pi^2 f^2 M_{ch}^2 / R_{ch}^2)}$$
Where: $\rho$ = air density (g/cm^3), $c$ = speed of sound (cm/s), $A_v$ = vocal tract area (cm^2), $l_v$ = vocal tract length (cm), $R_{ch}$ = glottal chink resistance (dyn s/cm^5), $f$ = formant frequency (Hz), $M_{ch}$ = glottal chink acoustic mass (g/cm^4). Effect is greatest on F1 and decreases with frequency.

### Eq. 5: Glottal chink resistance
$$R_{ch} = \frac{d\Delta P}{dU_{ch}} \approx \frac{\rho U_{ch}}{A_{ch}^2}$$

### Eq. 6: Airflow through glottal chink
$$U_{ch} = A_{ch}\sqrt{\frac{2P_s}{\rho}}$$
Where: $A_{ch}$ = chink area (cm^2), $P_s$ = subglottal pressure (dyn/cm^2).

### Eq. 7: Acoustic mass of glottal chink
$$M_{ch} = \frac{\rho l_g}{A_{ch}}$$
Where: $l_g$ = vertical thickness of glottis (~0.3 cm, Fant 1960).

### Eq. 8: Total acoustic mass at glottal closure
$$M = M_t + M_c + M_v = \rho\left(\frac{l_t}{A_t} + \frac{l_g}{A_{ch}} + \frac{l_v}{A_v}\right)$$
Where: $l_t$ = trachea length (~11 cm female), $A_t$ = trachea area (~2 cm^2 female), $l_v$ = vocal tract length (~15 cm), $A_v$ = vocal tract area (~3 cm^2).

### Eq. 9: Simplified total acoustic mass (female vocal tract)
$$M \approx \rho\left(10.5 + \frac{0.3}{A_{ch}}\right)$$

### Eq. 10: Time constant for spectral tilt due to glottal chink
$$T = \frac{M}{R_{ch}} = \sqrt{\frac{\rho}{2P_s}}(10.5 A_{ch} + 0.3)$$
This leads to an additional 6 dB/octave tilt above $f_T = 1/(2\pi T)$.

## Parameters

### Table I: Glottal Chink Area vs. Acoustic Effects
Assumes P_s = 5500 dyn/cm^2, vocal tract losses B_v = 50 Hz.

| A_ch (cm^2) | B_g (Hz) | B1 (Hz) | 20log10(B1) (dB) | U_ch (cm^3/s) | T (ms) | Tilt (dB) |
|-------------|----------|---------|-------------------|----------------|--------|-----------|
| 0.00        | 0        | 50      | 34                | 0              | 0      | 0         |
| 0.01        | 25       | 75      | 38                | 31             | 0.13   | 7         |
| 0.02        | 50       | 100     | 40                | 62             | 0.16   | 9         |
| 0.03        | 76       | 126     | 42                | 93             | 0.20   | 11        |
| 0.04        | 101      | 151     | 44                | 124            | 0.23   | 12        |
| 0.05        | 126      | 176     | 45                | 155            | 0.27   | 13        |
| 0.06        | 151      | 201     | 46                | 186            | 0.30   | 14        |
| 0.07        | 176      | 226     | 47                | 217            | 0.33   | 15        |
| 0.08        | 202      | 252     | 48                | 249            | 0.37   | 16        |
| 0.09        | 227      | 277     | 49                | 280            | 0.40   | 17        |
| 0.10        | 252      | 302     | 50                | 311            | 0.43   | 18        |

### Mean Acoustic Parameter Values (22 female speakers)

| Parameter  | /ae/ Mean (s.d.) | /ʌ/ Mean (s.d.) | /ɛ/ Mean (s.d.) |
|------------|------------------|------------------|------------------|
| H1\*-H2\* | 3.4 (1.4)        | 2.6 (1.1)        | 3.1 (1.3)        |
| H1\*-A1   | -4.2 (2.3)       | -4.1 (1.7)       | -4.7 (1.9)       |
| H1\*-A3\* | 24.1 (3.4)       | 22.0 (3.3)       | 22.5 (3.4)       |
| B1 (Hz)   | 165 (34)         | --               | --               |
| Nw        | 2.1 (0.5)        | 2.2 (0.6)        | 2.3 (0.5)        |
| Ns        | 2.1 (0.5)        | 2.0 (0.6)        | 1.9 (0.8)        |

### Parameter Ranges Across Speakers

| Parameter  | Min    | Max   | Range |
|------------|--------|-------|-------|
| H1\*-H2\* | 0.6    | 6.9   | ~10 dB |
| H1\*-A1   | -12.1  | 5.8   | ~16 dB |
| H1\*-A3\* | 14.7   | 35.0  | ~26 dB |
| B1         | 53     | 302   | ~250 Hz |
| Noise      | 1.0    | 3.8   | 1-4 scale |

## Implementation Details

### Correction Procedures (Critical for Accurate Measurement)
The "\*" notation means corrections have been applied to remove vocal-tract transfer function effects:

1. **H1\*-H2\***: H1 and H2 corrected for boosting by F1. The vocal-tract transfer function boosts harmonics near F1; corrections remove this effect so the measure reflects glottal source characteristics.

2. **H1\*-A1**: H1 corrected as above. A1 is the amplitude of the strongest harmonic of the F1 peak. Corrections applied for formant influence on H1.

3. **H1\*-A3\***: H1 corrected as above. A3 is the amplitude of the strongest harmonic of the F3 peak. A3 is corrected for the effects of F1 and F2 on the F3 region, and for F3 bandwidth. Normalization procedure: for /ae/, A3 increased by 4 dB; for /ɛ/, A3 increased by 3 dB (based on F3 bandwidth differences from male data, House and Stevens 1958).

4. **B1 measurement**: Estimated from the decay rate of F1 oscillations during the initial part of the glottal cycle (closed phase). Waveform bandpass filtered at 600 Hz bandwidth centered on F1. Rate of decay of peak-to-peak amplitude measured over first two cycles of F1 oscillation. Related to bandwidth by $B1 = \alpha/\pi$ Hz (where $\alpha$ is the decay constant of $e^{-\alpha t}\cos 2\pi ft$). 40 estimates per speaker averaged.

5. **Noise ratings**: Subjective 1-4 scale (1 = no noise interference, 4 = little evidence of periodicity). Two independent judges rated waveform-based (Nw) and spectra-based (Ns) noise. Correlation between judges r > 0.92.

### Two Speaker Groups Identified
- **Group 1** (11 speakers, H1\*-A3\* <= 23 dB): Shallow spectral tilt, prominent F1 peaks. Hypothesized to have abrupt glottal closure with posterior glottal chinks. H1\*-A3\* ~ 15 dB, H1\*-A1 ~ 11 dB.
- **Group 2** (11 speakers, H1\*-A3\* > 23 dB): Steep spectral tilt (25+ dB), breathier voices. Hypothesized to have nonsimultaneous closure along vocal fold length. Greater noise in speech.

### H1\*-H2\* Not a Reliable Independent Measure
H1\*-H2\* is commonly used as an open quotient indicator, but this paper finds it poorly correlated with other glottal measures (r < 0.59). The authors argue that H1\*-H2\* is nearly independent of other glottal parameters because a speaker may adjust open quotient while the rate of closure flow change (and thus tilt) remains the same. Therefore H1\*-H2\* should NOT be used alone as a voice quality indicator.

### Key Correlation Structure (Table VIII, N=66)
| Pair              | r    |
|-------------------|------|
| H1\*-A3\* & Ns   | 0.86 |
| H1\*-A3\* & Nw   | 0.80 |
| H1\*-A1 & Ns     | 0.80 |
| H1\*-A1 & Nw     | 0.73 |
| H1\*-A3\* & H1\*-A1 | 0.68 |
| H1\*-H2\* & H1\*-A1 | 0.53 |
| H1\*-H2\* & H1\*-A3\* | 0.46 |

## Figures of Interest
- **Fig. 1 (p. 468):** Waveforms and spectra of periodic glottal source for OQ=30%/70% and TL=0/15 dB, showing effect of open quotient and spectral tilt on source spectrum
- **Fig. 2 (p. 470):** Effect of speed quotient (SQ=140 vs 320) on glottal derivative spectrum - shows how waveform skewness affects high-frequency content
- **Fig. 3 (p. 471):** Two real female speakers with narrow (60 Hz) and wide (275 Hz) B1, showing the effect on F1 peak prominence
- **Fig. 5 (p. 472):** Circuit model of glottal flow with fixed opening at arytenoid cartilages during closed phase
- **Fig. 6 (p. 473):** Spectra and F3-filtered waveforms for two speakers with different spectral tilts, showing aspiration noise
- **Fig. 7 (p. 474):** Calculated periodic and noise source spectra showing crossover point
- **Fig. 8 (p. 478):** H1\*-A3\* vs H1\*-A1 scatterplot showing two speaker groups with slope=1 line
- **Fig. 9 (p. 479):** Noise ratings vs H1\*-A3\* with regression line (r^2=0.62)
- **Fig. 10 (p. 479):** H1\*-A1 vs B1 (log scale) showing group separation

## Results Summary
- Female speakers fall into two distinct groups based on glottal configuration
- H1\*-A3\* is the best single measure of spectral tilt and is most strongly correlated with perceived noise/breathiness
- H1\*-A1 provides information about F1 bandwidth (glottal losses)
- B1 ranges from 53-302 Hz; lower values indicate more complete closure
- H1\*-H2\* provides independent information about open quotient but is poorly correlated with other measures
- Aspiration noise is strongly correlated with spectral tilt
- Mean H1\*-H2\* for females: ~3 dB (compare to Klatt & Klatt 1990 reporting mean H1-H2 of 11.9 dB for females before correction)

## Limitations
- Only female speakers studied (male comparison deferred to future work)
- Only three vowels (/ae, ʌ, ɛ/) - all with well-separated F1 from higher formants
- Glottal configuration hypothesis not directly verified physiologically (only preliminary fiberscopy data from 4 subjects)
- H1\*-H2\* correction procedure may not fully remove formant effects
- B1 estimates sensitive to F1 frequency and pitch period length
- Small sample (5 repetitions per vowel per speaker)

## Testable Properties
- B1 must be >= ~50 Hz (vocal-tract losses alone for closed-glottis condition)
- As glottal chink area increases: B1 increases, spectral tilt increases, noise increases (monotonic)
- H1\*-A3\* and noise ratings should correlate r > 0.7
- H1\*-A1 range should be approximately -11 to +5 dB for female speakers
- H1\*-A3\* range should be approximately 15-35 dB for female speakers
- Group 1 speakers (abrupt closure): H1\*-A3\* ~ 15 dB, H1\*-A1 ~ -11 dB
- Group 2 speakers (gradual closure): H1\*-A3\* > 23 dB
- For slope-1 relationship: H1\*-A3\* should increase linearly with H1\*-A1 for speakers with abrupt closure (Group 1)
- Spectral tilt from glottal chink alone (Table I): max ~18 dB for A_ch = 0.10 cm^2

## Relevance to Project
**Directly relevant to Klatt synthesizer voice quality control:**
- Maps acoustic measures to Klatt parameters: H1\*-A3\* → TL (spectral tilt), H1\*-A1 → B1 (first formant bandwidth), noise ratings → AH (aspiration amplitude)
- Table I provides quantitative relationship between glottal chink area and Klatt TL/B1 settings
- Two speaker groups correspond to different Klatt voice quality presets (modal vs breathy female)
- Correction procedures needed when analyzing natural speech to extract Klatt-compatible parameters
- Female speakers need higher default B1 (~165 Hz) than the standard 50 Hz closed-glottis value
- H1\*-H2\* maps to OQ (open quotient) in KLGLOTT88/LF model but is nearly independent of tilt
- Complements the 1995 Hanson thesis (already in collection) with published JASA data

## Open Questions
- [ ] How do these measures map to specific Klatt parameter values (quantitative mapping)?
- [ ] What B1 default should be used for female vs male voices?
- [ ] How should the two speaker groups inform voice quality presets?
- [ ] Relationship between these measures and fundamental frequency?
- [ ] How to implement the spectral corrections (H1\*, H2\*, A3\*) in analysis code?

## Related Work Worth Reading
- Stevens, K. N. (to appear at time of publication). *Acoustic Phonetics* - comprehensive phonetics reference
- Holmberg et al. (1995) - aerodynamic, EGG, and acoustic spectral measures compared for female voices
- Karlsson (1988, 1992a, 1992b) - glottal waveform parameters for different voice types via inverse filtering
- Cranen and Schroeter (1995) - acoustic consequences of glottal openings

## Collection Cross-References

### Already in Collection
- [[Hanson_1995_GlottalCharacteristicsFemale]] - The PhD thesis this paper summarizes; contains the full theoretical development and additional data
- [[Klatt_1990_VoiceQualityVariations]] - Klatt and Klatt (1990) cited for H1-H2 gender differences and KLGLOTT88 source model
- [[Fant_1960_AcousticTheorySpeechProduction]] - Fant (1960) cited for vocal tract area, glottis thickness, bandwidth formulas
- [[Shadle_1985_FricativeAcoustics]] - Shadle (1985) cited for turbulence noise source models
- [[Childers_Lee_1991_VoiceQualityFactors]] - Related voice quality factor analysis
- [[Gobl_2003_VoiceQualityEmotion]] - Voice quality parameter trajectories for emotion (uses similar measures)
- [[Stevens_1998_AcousticPhonetics]] - Stevens (to appear) cited extensively for theoretical framework
- [[Stevens_1991_HL_Parameters]] - Stevens (in preparation) cited for higher-level parameter framework
- [[House_Stevens_1956_NasalizationVowels]] - House and Stevens (1958) cited for F1 bandwidth measurements

### New Leads (Not Yet in Collection)
- Holmberg et al. (1995) - "Comparisons among aerodynamic, EGG, and acoustic spectral measures of female voice" - J. Speech Hear. Res. 38, 1212-1223 - directly relevant for validating acoustic measures against physiological data
- Karlsson, I. (1992a) - "Analysis and synthesis of different voices with emphasis on female speech" - PhD thesis - comprehensive female voice modeling
- Cranen & Schroeter (1995) - "Acoustic consequences of glottal openings" - addresses the same glottal chink modeling
- Södersten & Lindestad (1990) - "Glottal closure and perceived breathiness" - direct physiological validation

### Cited By (in Collection)
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — extends Hanson's correction formula for harmonic magnitudes; provides systematic age/sex/vowel data using the corrected measures across 335 speakers
- [[Goudbeek_2010_ValencePotencyVocalEmotion]] — references Hanson (1997) on glottal tension and spectral shape in the context of vocal emotion
- [[Chen_2022_AcousticMasculinityFemininity]] — related work on gender-specific voice source parameters; Hanson's spectral tilt measures relate to Chen's perturbation clusters
- [[Kreiman_2007_GlottalSourceSpectrum]] — uses Hanson (1997) corrections with Iseli & Alwan modifications for spectral measures
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] — cites Hanson 1997 for corrected acoustic correlates using KLGLOTT88
- [[Laukka_2011_SpontaneousAffectIrritation]] — cites Hanson for voice source spectral correlates
- [[Fant_1997_VoiceSourceConnectedSpeech]] — corrected spectral measures complement Fant's Rd analysis; the ~9.6 dB gender gap in H1*-A3* maps to Rd range differences
- [[Koenig_LaryngealFactors]] — references Hanson (1997) for acoustic measures of female voice quality and breathiness
- [[Starr_2015_SweetVoiceJapaneseFeminine]] — cites Hanson for correction formulas applied to H1-H2, H1-A1, H1-A3 measures

### Supersedes or Recontextualizes
- This is the published JASA paper version of the analysis in [[Hanson_1995_GlottalCharacteristicsFemale]] (the PhD thesis). The thesis contains more detail; this paper provides the condensed, peer-reviewed findings with corrected measures and group classification.

---

**See also:** Hanson_1999_GlottalMaleSpeakers - extends this study to 21 male speakers with direct gender comparison; spectral tilt (H1*-A3*) found to be the strongest gender differentiator (~9.6 dB).

---

**See also:** Hanson_2001_ModelsPhonation - Extends this work by combining the female data with male speaker data (21M+22F), connecting the acoustic measures to the HLsyn synthesizer framework, and applying the models to disordered speech.

---

**See also:** Titze_1989_MaleFemaleVoices - provides the physiological model (linearly convergent female glottis, medial surface bulging in males) that explains the acoustic patterns Hanson measures: incomplete closure and gradual closing producing elevated H1*-H2* and spectral tilt in female voices.
