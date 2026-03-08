# Refining and Extending Measures for Fricative Spectra, with Special Attention to the High-Frequency Range

**Authors:** Christine H. Shadle, Wei-Rong Chen, Laura L. Koenig, Jonathan L. Preston
**Year:** 2023
**Venue:** Journal of the Acoustical Society of America, 154(3), 1932-1944
**DOI:** https://doi.org/10.1121/10.0021075

## One-Sentence Summary
This paper introduces refined acoustic measures for fricative spectra that extend into the 7-15 kHz range, providing empirical data on spectral peak frequencies, amplitude differences, and high-frequency energy levels for English sibilant and non-sibilant fricatives that directly inform higher parallel formant targets in a Klatt synthesizer.

## Problem Addressed
Previous fricative spectral measures were limited to frequencies below 7-8 kHz (often below 11 kHz due to typical sampling rates). High-frequency energy above 7 kHz carries significant perceptual information, and existing measures like spectral moments and LevelD (spectrum density level) had poor discriminative power for capturing high-frequency fricative contrasts, particularly for non-sibilants.

## Key Contributions
- Introduces F_h: high-frequency maximum amplitude frequency (5-12 kHz range)
- Introduces HighLevelD: a new measure combining energy from 11-15 kHz with LevelD
- Refines F_M definition for women (upper cutoff raised from 3 kHz to 8 kHz for sibilants)
- Introduces AmpRange: amplitude difference between low-frequency minimum and high-frequency maximum for non-sibilants
- Demonstrates that high-frequency spectral information (>7 kHz) significantly differentiates fricative places of articulation
- Shows that HighLevelD is more effective than LevelD or Slope for capturing spectral dynamics over time

## Methodology
- Seven adult native speakers of American English (4 women, 3 men, ages 21-58)
- Recorded in anechoic chamber at 44.1 kHz (Nyquist 22.05 kHz, analysis limited to 15 kHz by Icicle amplifier)
- Four speech tasks: picture naming (PN), rapid picture naming (RPN), grandfather passage (GF), recalling sentences (RS)
- Multitaper spectral analysis using 3 DPSS tapers with 5 Hz bandwidth
- Fricatives analyzed: /s, z, sh, f, v, theta, dh/ (8 English fricatives)
- Ensemble averages computed across all tokens per speaker per phoneme
- Both isolated words and connected speech examined

## Key Measures (Table I)

| Measure | Definition | Range |
|---------|-----------|-------|
| **F_M** | Spectral peak frequency of main resonance at critical constriction. /sh/: 2-4 kHz; /s z/: 3-7 kHz (men), 3-8 kHz (women) | Sibilants only |
| **Amp_D** | Amplitude at F_M minus minimum amplitude of low-frequency spectral valley (dB). Low-freq range: 1-2 kHz for /sh zh/, 1-3 kHz for others | Sibilants only |
| **Level_M** | Average squared magnitudes of multitaper spectrum in mid-frequency range, converted to dB. Men: 2-4 kHz for /sh zh/, 3-7 kHz for /s z/ and all others; Women: 3-8 kHz for /s z/, 3-7 kHz for all others | All sounds |
| **Level_H** | Average squared magnitudes in high-frequency range. Men: 7-11 kHz; Women: 8-11 kHz; /s z/: same range for all | All sounds |
| **Level_HH** | Average squared magnitudes from 11-15 kHz, converted to dB | All sounds |
| **Level_D** | Difference: Level_M - Level_H | All sounds |
| **HiLev_D** | Level_M + Level_H + Level_HH - Level_M - Level_H = sum across all high bands (effectively Level_M - Level_H + Level_HH) | All sounds |
| **F_h** | Frequency of maximum amplitude from 5-12 kHz | Non-sibilants only |
| **Fmax_A** | Frequency of maximum amplitude from 2-13 kHz | Non-sibilants only |
| **Fmin_A** | Frequency of minimum amplitude from 1-7 kHz | Non-sibilants only |
| **AmpRange** | Amplitude at Fmax_A minus amplitude at Fmin_A | Non-sibilants only |
| **Slope** | Regression line slope from F_M to 14 kHz for sibilants, F_h to 14 kHz for non-sibilants | All sounds |
| **HighLevel_D** | Level_M + Level_H + Level_HH (sum of Level_M and both high bands) = effectively the combined energy from 11-15 kHz relative to mid | All sounds |

**Correction on HighLevel_D:** HiLev_D = Level_M + Level_H + Level_HH. It is the sum of Level_M and the sum of Level_H and Level_HH. Specifically, from the text: "Difference between Level_M and the sum of Level_H and Level_HH (= Level_M - Level_M + Level_H - Level_HH)" -- this appears to be the total spectral density across mid+high bands combined.

## Key Findings for Klatt Synthesis

### Sibilant Spectral Peaks (F_M values)

From the data and figures:

| Fricative | F_M Range (Men) | F_M Range (Women) | Notes |
|-----------|----------------|-------------------|-------|
| **/s/** | ~4-7 kHz | ~5-8 kHz | Higher in women; front-cavity resonance |
| **/z/** | ~4-7 kHz | ~5-8 kHz | Similar to /s/ |
| **/sh/ (IPA: /esh/)** | ~2-4 kHz | ~3-4 kHz | Lower due to longer front cavity from lip rounding |
| **/zh/ (IPA: /ezh/)** | ~2-4 kHz | ~3-4 kHz | Similar to /sh/ |

### Sibilant Amp_D (Peak Prominence)

| Fricative | Amp_D Range | Notes |
|-----------|------------|-------|
| **/s/** | ~25-35 dB | Largest values; deep low-frequency trough + high peak |
| **/sh/** | ~20-30 dB | Somewhat smaller |
| Voiced sibilants | Lower than voiceless | Voice source fills low-frequency trough |

### Non-Sibilant Spectral Characteristics

Non-sibilants show qualitatively different spectra -- relatively flat with modest peaks:

| Fricative | F_h Range | AmpRange | Key Spectral Character |
|-----------|----------|----------|----------------------|
| **/f/** | ~5-12 kHz (variable) | 10-20 dB | Relatively flat; energy increase at higher frequencies; F_h sometimes highest mid-fricative |
| **/theta/ (/th/)** | ~5-12 kHz (variable) | 10-20 dB | Similar to /f/ but sometimes lower overall amplitude; maximum at higher frequencies for /f/ than /theta/ |
| **/v/** | Lower amplitude than /f/ | Smaller | Voiced reduces high-freq energy |
| **/dh/ (/eth/)** | Lower amplitude than /theta/ | Smaller | Lower overall amplitude; brief in function words |

### High-Frequency Energy (>7 kHz) -- Critical for A7-A10

Key observations from the data:

1. **Sibilants /s, z/**: Strong energy extending well above 7 kHz. The spectral peak F_M is in the 4-8 kHz range, with energy rolling off above that but still substantial through 11-15 kHz. Level_H and Level_HH are meaningful.

2. **Sibilants /sh, zh/**: Peak energy concentrated at 2-4 kHz; energy above 7 kHz is notably lower than for /s, z/. The slope from peak to high frequencies is steeper (more negative).

3. **Non-sibilants /f, theta/**: Show a broader, flatter spectrum. Energy is relatively evenly distributed across frequencies. F_h (high-frequency maximum) ranges from 5-12 kHz. These fricatives often show energy INCREASING toward higher frequencies, unlike sibilants.

4. **Non-sibilants /v, dh/**: Lower overall amplitude. The voiced excitation adds low-frequency energy but high-frequency content is reduced.

### Amplitude Measures Across Frequency Bands

From the LME model predictions (Fig. 4) for sibilants /s/ vs /sh/:

| Measure | /s/ | /sh/ | Difference | p-value |
|---------|-----|------|-----------|---------|
| F_M | ~7 kHz | ~3 kHz | ~4 kHz | p < 0.001 |
| Amp_D | ~32 dB | ~28 dB | ~4 dB | p < 0.01 |
| Level_D | ~4 dB | ~1 dB | ~3 dB | p < 0.01 |
| HighLevel_D | ~74 dB | ~68 dB | ~6 dB | p < 0.001 |

### Temporal Changes in High-Frequency Energy

- HighLevel_D was the most effective measure for tracking changes over the fricative time course
- Sibilants: energy amplitude increases over the entire range, but more so at high frequencies
- For non-sibilants: HighLevel_D showed more noticeable and consistent patterns than Level_D
- The slope from peak to high frequencies becomes less negative (less steep) over the course of fricatives, particularly sibilants

### Gender/Speaker Effects

- **F_M for /s/**: Higher for women (~5-8 kHz) than men (~4-7 kHz) due to shorter vocal tract / front cavity
- **Amplitude levels**: Male speakers showed lower Level_D and HighLevel_D values (i.e., more energy at high frequencies relative to mid, or less spectral tilt)
- **F_h for non-sibilants**: Higher for /f/ than /theta/ for all three male speakers and two of four female speakers
- AmpRange: 10-20 dB for non-sibilants (smaller than Amp_D for sibilants at 20-35 dB)

### Connected Speech vs. Isolated Words

- Non-sibilants in isolated words had higher AmpRange and higher HighLevel_D than in connected speech (by 1.2 and 3.2 dB respectively)
- Connected speech showed a higher (less negative) Slope than isolated words by 0.29 dB/kHz
- Sibilants showed no significant style differences in the main measurements

## Measurement Methodology

### Multitaper Spectral Analysis
- 3 DPSS (discrete prolate spheroidal sequence) tapers
- 5 Hz bandwidth
- Automatic F_M tracking matched the manually determined F_M by acoustic cancellation
- Each fricative token analyzed at boundary landmarks (start, middle frame at 50%, end)
- Multitaper spectra from individual analysis frames of fixed-length segments

### Frequency Ranges Analyzed
- Full range: 0-15 kHz (limited by Icicle amplifier, not Nyquist)
- F_M search range: 2-4 kHz (/sh, zh/), 3-7 kHz (/s, z/ for men), 3-8 kHz (/s, z/ for women)
- High-frequency range: 7-11 kHz (Level_H), 11-15 kHz (Level_HH)
- F_h search range: 5-12 kHz (non-sibilants only)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Spectral peak (sibilants) | F_M | kHz | - | 2-8 | Front-cavity resonance |
| Peak prominence (sibilants) | Amp_D | dB | - | 20-35 | Trough-to-peak amplitude |
| Mid-freq spectral level | Level_M | dB | - | - | Average power in mid band |
| High-freq spectral level | Level_H | dB | - | - | 7-11 kHz band |
| Very-high-freq spectral level | Level_HH | dB | - | - | 11-15 kHz band |
| Mid-high difference | Level_D | dB | - | - | Level_M - Level_H |
| Combined high level | HighLevel_D | dB | - | 60-80 | Combined mid + high energy |
| High-freq maximum (non-sibilants) | F_h | kHz | - | 5-12 | Spectral peak in high range |
| Amplitude range (non-sibilants) | AmpRange | dB | - | 10-20 | Low-min to high-max |
| Spectral slope | Slope | dB/kHz | - | - | Regression from peak to 14 kHz |

## Implications for Klatt A7-A10 Parameters

### Direct Mapping to Parallel Formant Amplitudes

The paper's frequency ranges map to Klatt higher formants as follows:

| Klatt Formant | Approx. Center Freq | Relevant Measures |
|---------------|--------------------|--------------------|
| **F5** (~4-5 kHz) | 4000-5000 Hz | Part of F_M range for /s/ |
| **F6** (~5-6 kHz) | 5000-6000 Hz | Upper F_M range, lower F_h range |
| **F7** (~7 kHz) | ~7000 Hz | Level_H lower boundary |
| **F8** (~8 kHz) | ~8000 Hz | Within Level_H range |
| **F9** (~9 kHz) | ~9000 Hz | Within Level_H range |
| **F10** (~10 kHz) | ~10000 Hz | Upper Level_H range |

### Amplitude Recommendations by Fricative Type

Based on the spectral envelope data from ensemble averages:

**For /s, z/ (alveolar sibilants):**
- A5, A6: High (near peak -- within 5-10 dB of maximum)
- A7: Moderate-high (energy still substantial at 7 kHz)
- A8: Moderate (rolling off but still present)
- A9, A10: Low-moderate (continuing rolloff at ~-3 to -6 dB/kHz)
- Overall spectral slope from F_M: approximately -3 to -6 dB/kHz

**For /sh, zh/ (postalveolar sibilants):**
- A5, A6: Moderate (peak is at 2-4 kHz, so 5-6 kHz is already past peak)
- A7: Low-moderate
- A8: Low
- A9, A10: Low (steeper rolloff than /s/)
- Spectral slope is steeper (more negative) than /s/

**For /f, v/ (labiodental):**
- A5-A10: Relatively flat distribution (no strong peak)
- Energy may actually INCREASE slightly toward higher frequencies
- AmpRange only 10-20 dB across the full spectrum
- Overall level lower than sibilants by 10-15 dB

**For /theta, dh/ (dental/interdental):**
- A5-A10: Similar to /f, v/ but with even less overall amplitude
- Flat or slightly rising spectrum at high frequencies
- /theta/ lower overall amplitude than /f/ in this dataset
- /dh/ very brief, low amplitude, especially in function words

### Key Principle for Synthesis
The critical finding for Klatt synthesis is that **non-sibilant fricatives should NOT have a steeply falling spectral envelope at high frequencies** -- instead, they should have relatively flat or even slightly rising energy from mid to high frequencies. This contrasts with the sibilants where the spectrum falls off from a prominent mid-frequency peak. Current synthesis approaches that apply uniform spectral tilt to all fricatives are incorrect.

## Figures of Interest
- **Fig 2 (p. 5-6):** Mid-fricative spectra for sibilants /s, z/ for all 7 speakers. Shows clear spectral peaks at 4-8 kHz with substantial energy through 15 kHz.
- **Fig 3 (p. 6):** Temporal changes in F_h, AmpRange, Level_D, HighLevel_D for sibilants over fricative duration.
- **Fig 4 (p. 7):** LME model predictions comparing /s/ vs /sh/ for F_M, Amp_D, Level_D, HighLevel_D.
- **Fig 5 (p. 8):** Mid-fricative spectra for non-sibilants /f, theta, dh/ -- shows flat/rising high-frequency character.
- **Fig 6 (p. 8):** Temporal changes in F_h, AmpRange, Level_D, HighLevel_D for non-sibilants.
- **Fig 7 (p. 9):** LME predictions for /f/ vs /theta/ contrasts and connected vs isolated speech.

## Results Summary

1. **F_M** successfully distinguishes /s/ from /sh/ (p < 0.001); raising the cutoff for women from 3 to 8 kHz improves the measure
2. **Amp_D** is larger for /s/ than /sh/ (20-35 dB range); the low-frequency trough is deeper for /s/
3. **HighLevel_D** outperforms Level_D and Slope for capturing temporal changes and place contrasts
4. Non-sibilants /f/ and /theta/ are partially distinguishable via F_h (higher for /f/) and AmpRange (marginally higher for /theta/)
5. Speaking style effects: isolated words show higher AmpRange and HighLevel_D for non-sibilants
6. Gender effects: F_M higher for women; male speakers show lower Level_D (relatively more high-freq energy)

## Limitations
- Only 7 speakers (small sample)
- Frequency limited to 15 kHz by amplifier (not full 22 kHz Nyquist)
- No amplitude calibration -- relative within-speaker comparisons only
- Connected speech fricatives extracted using semi-automatic methods
- No data on /h/ fricative
- Results may not generalize to children or clinical populations

## Testable Properties
- F_M for /s/ must be higher than F_M for /sh/ by at least 1-2 kHz
- Amp_D for /s/ must be larger than Amp_D for /sh/
- HighLevel_D should be higher for /s/ than /sh/ (more high-freq energy)
- Non-sibilant AmpRange (10-20 dB) must be smaller than sibilant Amp_D (20-35 dB)
- F_h for non-sibilants must fall within 5-12 kHz
- Female F_M for /s/ should be higher than male F_M by ~1-2 kHz
- Spectral slope from peak for /s/ should be shallower (less negative) than for /sh/
- Non-sibilant spectra should be relatively flat from mid to high frequencies

## Relevance to Project
This paper is highly relevant to Qlatt's recent addition of F7-F10 cascade formants. The data provides:
1. Empirical guidance on what frequencies and amplitudes the higher parallel formants (A7-A10) should target for each fricative class
2. Evidence that non-sibilant fricatives need flat/rising high-frequency energy, not a falling spectral tilt
3. The HighLevel_D measure concept (combining mid + high spectral energy) as a potential diagnostic for verifying synthesized fricative quality
4. Gender-dependent F_M targets that should influence female vs male voice parameter sets
5. Evidence that spectral dynamics change over the course of a fricative, suggesting A7-A10 should ramp during fricative segments

## Open Questions
- [ ] How exactly do the multitaper spectral levels map to Klatt parallel formant amplitudes (A7-A10)?
- [ ] What bandwidth settings are appropriate for F7-F10 when synthesizing fricatives?
- [ ] Should A7-A10 ramp over the course of a fricative to capture the temporal dynamics described?
- [ ] What are appropriate F_h values for /h/ (not measured in this paper)?
- [ ] How should the flat non-sibilant spectrum be achieved -- via equal A7-A10 or via broadband noise with minimal filtering?

## Related Work Worth Reading
- Shadle (1985) - Mechanical model fricative acoustics (already in collection as Shadle_1985_FricativeAcoustics)
- Strevens (1960) - Spectra of fricative noise in human speech
- Jongman et al. (2000) - Comprehensive acoustic analysis of English fricatives (already in collection as Jongman_2000_FricativeAcoustics)
- Fox and Nissen (2005) - Sex-related acoustic changes in voiceless English fricatives
- Maniwa et al. (2009) - Spectral peak measures and F_M original definition
- Tabain (1998) - Non-sibilant fricatives spectral information above 10 kHz
- Koenig et al. (2013) - Previous F_M and Amp_D measures for sibilants
- Fant (1970) / Stevens (1998) - Acoustic models for fricative source-filter theory

## Collection Cross-References

### Already in Collection
- [[Shadle_1985_FricativeAcoustics]] - Shadle's PhD thesis; this 2023 paper extends those mechanical model findings with human speech data up to 15 kHz
- [[Jongman_2000_FricativeAcoustics]] - Comprehensive fricative acoustic analysis; this paper extends Jongman's work into the high-frequency range
- [[Stevens_1998_AcousticPhonetics]] - Referenced for fricative source-filter theory and front-cavity resonance predictions
- [[Fant_1960_AcousticTheorySpeechProduction]] - Referenced for the acoustic theory underlying front-cavity resonance frequency predictions
- [[Behrens_Blumstein_1988_FricativeAmplitude]] - Referenced for spectral characteristics of voiceless fricatives

### New Leads (Not Yet in Collection)
- Tabain (1998) - "Non-sibilant fricatives in English: Spectral information above 10 kHz" - Directly relevant for A8-A10 targets
- Strevens (1960) - "Spectra of fricative noise in human speech" - Foundational fricative spectra data
- Fox and Nissen (2005) - "Sex-related acoustic changes in voiceless English fricatives" - Gender-specific spectral differences
- Maniwa, Jongman, and Wade (2009) - "Acoustic characteristics of clearly spoken English fricatives" - Includes F_M spectral peak data
- Koenig et al. (2013) - "Toward improved spectral measures of /s/" - Previous F_M and Amp_D definitions refined here

### Supersedes or Recontextualizes
- [[Shadle_1985_FricativeAcoustics]] - This 2023 paper extends the 1985 mechanical model findings with human speech data recorded at high sampling rates, providing empirical validation that non-sibilant spectra are indeed flat/rising at high frequencies as predicted by the tube models
- [[Jongman_2000_FricativeAcoustics]] - This paper effectively extends Jongman 2000 into the high-frequency range and introduces superior measures (HighLevelD) for capturing fricative spectral dynamics
