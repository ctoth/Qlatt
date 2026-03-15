# Effects of Race and Sex on Acoustic Features of Voice Analysis

**Authors:** Steve An Xue, Donald Fucci
**Year:** 2000
**Venue:** Perceptual and Motor Skills, 91, 951-958
**DOI/URL:** Not provided

## One-Sentence Summary

Provides normative acoustic voice data for elderly (70-80 yr.) Euro-American and African-American speakers on 15 MDVP parameters, finding no significant race effect but significant sex effects on F0, absolute jitter, soft phonation index, and F0 standard deviation.

## Problem Addressed

Acoustic norms for voice evaluation programs (e.g., Kay Elemetrics MDVP) were established on young/middle-aged speakers only, with no norms for elderly speakers and no data on whether race affects these parameters. Clinicians had no basis for knowing whether separate norms were needed for different racial or sex groups among elderly speakers.

## Key Contributions

- No significant differences in any of the 15 acoustic voice parameters between Euro-American and African-American elderly speakers (MANOVA, race as independent variable)
- Significant sex differences found in 4 parameters: F0 Hz, absolute jitter, soft phonation index, and F0 standard deviation
- Normative data (means and SDs) for 15 MDVP parameters across race and sex groups of elderly speakers aged 70-80

## Methodology

- 84 subjects: 44 Euro-American (21M, 23F) and 40 African-American (20M, 20F), ages 70-80 (M=75 yr.)
- Sustained /a/ phonation at comfortable pitch and loudness, at least 3 seconds
- Recorded via AT825 microphone -> DA-P1 Tascam digital recorder -> digitized at 50 kHz
- Analyzed with MDVP (Multi-Dimensional Voice Profile) on Kay Elemetrics CSL Model 4300B
- 15 of 33 MDVP parameters selected; 2nd of 3 productions used for analysis
- SPSS MANOVA with race as independent variable; separate ANOVA with sex as independent variable
- Test-retest reliability: Pearson r = .98 on 12 reanalyzed samples

## Key Equations

No novel equations. The paper references Flanagan (1958) regarding source spectrum harmonic rolloff:

$$
\text{Harmonic amplitude rolloff} \approx -12 \text{ dB/octave}
$$

This is used to explain why males (lower F0) have higher SPI than females: more harmonics below 1600 Hz and fewer above, increasing the low/high energy ratio.

## Parameters

| Name | Abbreviation | Units | MDVP Threshold | All Elderly M (SD) | All Males M (SD) | All Females M (SD) |
|------|-------------|-------|----------------|-------------------|------------------|-------------------|
| Average Fundamental Frequency | F0 Hz | Hz | ns | 154.29 (46.36) | 125.91 (26.52) | 181.35 (45.18) |
| Absolute Jitter | Jita | us | 83.2 | 147.21 (147.65) | 183.01 (164.54) | 113.08 (121.87) |
| Jitter Percent | Jitt % | % | 1.04 | 1.97 (1.72) | 2.15 (1.69) | 1.80 (1.74) |
| Pitch Period Perturbation Quotient | PPQ % | % | 0.84 | 1.17 (1.07) | 1.25 (1.03) | 1.09 (1.11) |
| Phonatory Fundamental Frequency Range | PFR | st | na | 4.11 (3.44) | 3.59 (2.23) | 4.61 (4.26) |
| Relative Average Perturbation | RAP % | % | 0.68 | 1.17 (1.03) | 1.26 (1.00) | 1.07 (1.05) |
| Smoothed Pitch Period Perturbation Quotient | sPPQ | % | 1.02 | 2.29 (3.36) | 1.92 (2.30) | 2.63 (4.10) |
| Standard Deviation of F0 | STD Hz | Hz | na | 5.47 (8.60) | 3.32 (3.01) | 7.51 (11.35) |
| Fundamental Frequency Variation | vF0 % | % | 1.10 | 3.82 (6.47) | 2.72 (2.59) | 4.86 (8.61) |
| Amplitude Perturbation Quotient | APQ % | % | 3.07 | 4.00 (2.65) | 4.02 (2.42) | 3.98 (2.88) |
| Shimmer | ShdB | dB | 0.35 | 0.48 (0.36) | 0.47 (0.32) | 0.48 (0.40) |
| Shimmer Percent | Shim % | % | 3.81 | 5.29 (3.94) | 5.22 (3.70) | 5.35 (4.20) |
| Noise-to-Harmonic Ratio | NHR | ratio | 0.19 | 0.18 (0.08) | 0.17 (0.08) | 0.19 (0.09) |
| Soft Phonation Index | SPI | ratio | 14.12 | 14.54 (9.55) | 18.07 (11.28) | 11.18 (5.95) |
| Voice Turbulence Index | VTI | ratio | 0.061 | 0.069 (0.057) | 0.067 (0.056) | 0.072 (0.058) |

### Sex-specific significant differences (p < .05)

| Parameter | Males M | Females M | F(1,80) | p |
|-----------|---------|-----------|---------|---|
| F0 Hz | 125.91 | 181.35 | 42.10 | <.05 |
| Jita (us) | 183.01 | 113.08 | 4.94 | <.05 |
| SPI | 18.07 | 11.18 | 11.92 | <.05 |
| STD Hz | 3.32 | 7.51 | 5.06 | <.05 |

## Implementation Details

- MDVP parameter definitions (Kay Elemetrics Corp., 1993):
  - **SPI**: Average ratio of lower frequency harmonic energy (70-1600 Hz) to higher frequency harmonic energy (1600-4500 Hz). Sensitive to vowel formant structure.
  - **NHR**: Average energy of inharmonic components (1500-4500 Hz) to harmonic energy (70-4500 Hz).
  - **VTI**: Average ratio of spectral inharmonic high-frequency energy (2800-5800 Hz) to spectral harmonic energy (70-4500 Hz), in minimal perturbation regions.
- Jitter (us) and STD Hz are absolute measures dependent on average F0; percentage-based perturbation measures (Jitt%, PPQ%, RAP%) are normalized and showed no sex difference.
- SPI sex difference explained by -12 dB/octave harmonic rolloff: lower F0 means more harmonics packed below 1600 Hz, yielding higher SPI for males.

## Figures of Interest

- **Table 1 (page 6):** Complete means and SDs for all 15 parameters, broken out by race and sex subgroups, plus MDVP young/middle-aged thresholds.

## Results Summary

1. **Race effect**: No significant multivariate or univariate differences between Euro-American and African-American elderly speakers on any of the 15 parameters.
2. **Sex effect**: Significant differences on F0 Hz, absolute jitter, SPI, and STD Hz. All other parameters (including percentage-based jitter/shimmer measures, NHR, VTI) showed no sex difference.
3. **Aging effect**: Both racial groups showed poorer acoustic outputs compared to young/middle-aged MDVP norms (confirming Xue & Deliyski, in press).

## Limitations

- Only sustained /a/ phonation; no connected speech data
- Small sample sizes per subgroup (20-23 per cell)
- Only Euro-American and African-American groups studied; no data for Hispanic, Asian, or Native American speakers
- Subjects from one dialectal region (northeastern Arkansas) — may not generalize
- Only 15 of 33 MDVP parameters analyzed
- No age-matched young comparison group; young/middle-aged thresholds taken from Kay Elemetrics norms

## Testable Properties

- Absolute jitter (us) should be higher for lower F0 voices when percentage jitter is held constant (jitter is period-dependent)
- SPI should increase as F0 decreases, given -12 dB/octave harmonic rolloff
- STD Hz should scale with mean F0 (higher F0 -> more absolute variation in Hz for equivalent relative variation)
- NHR, VTI, shimmer, and percentage-based perturbation measures should be approximately F0-independent

## Relevance to Project

The normative data for elderly speakers provides reference values for synthesizing aged voice characteristics. The SPI analysis (linking F0 to harmonic energy distribution) is directly relevant to spectral tilt modeling in the Klatt synthesizer. The finding that absolute perturbation measures are F0-dependent while relative measures are not informs how jitter/shimmer parameters should be specified in speaker profiles.

## Open Questions

- [ ] How do these elderly norms compare to the project's current default voice parameters?
- [ ] Could the SPI relationship (F0 -> harmonic energy balance) be used to automatically derive spectral tilt from F0 in speaker presets?
- [ ] What would connected-speech perturbation norms look like for elderly speakers?

## Related Work Worth Reading

- Xue & Deliyski (in press) — Effects of aging on acoustic voice parameters (the companion elderly norms paper)
- Titze (1989) — Physiologic and acoustic differences between male and female voice
- Flanagan (1958) — Glottal source properties (12 dB/octave rolloff)
- Awan & Mueller (1996) — Speaking F0 characteristics across racial groups (kindergartners)

## Collection Cross-References

### Already in Collection
- [[Titze_1989_MaleFemaleVoices]] — cited for physiologic and acoustic differences between male and female voice; provides the anatomical scale factors (alpha, beta) that explain the F0 sex differences this paper documents

### Now in Collection
- **Flanagan (1958)** — [[Flanagan_1958_PropertiesGlottalSoundSource]] — provides the -12 dB/octave harmonic rolloff that explains SPI sex differences; foundational source spectrum reference

### New Leads (Not Yet in Collection)
- Xue & Deliyski (in press) — "Effects of aging on selected acoustic voice parameters" — companion paper establishing elderly vs. young/middle-aged acoustic norms
- Awan & Mueller (1996) — "Speaking fundamental frequency characteristics of White, African American, and Hispanic kindergartners" — extends the race/F0 question to children

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — Strong connection: Iseli provides corrected spectral measures (H1*-H2*, H1*-A3*) showing age and sex effects on voice source, including quantitative spectral tilt targets across age/sex groups. Xue's SPI finding (males have higher low-to-high harmonic energy ratio due to lower F0) is the same phenomenon Iseli captures with H1*-A3*, measured with more precise methodology and across a wider age range (8-39 vs. 70-80).
- [[Childers_Lee_1991_VoiceQualityFactors]] — Moderate connection: Childers & Lee's voice quality framework (open quotient, speed quotient, turbulent noise) provides the parametric machinery for modeling the voice quality differences Xue observes statistically. The perturbation measures (jitter, shimmer, NHR) in Xue map onto Childers & Lee's source aperiodicity and noise components.
- [[Xue_2006_VocalTractDimensionsRace]] — Strong: Same first author's later study measuring vocal tract dimensions (length, volume) across three racial groups in young adults (20-30). While this 2000 paper provides acoustic voice parameters for elderly speakers, the 2006 paper provides anatomical measurements for young adults. Together they characterize both structural and acoustic demographic variation in the Xue research program.
