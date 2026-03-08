# Vocal and Visual Attractiveness Are Related in Women

**Authors:** Sarah A. Collins, Caroline Missing
**Year:** 2003
**Venue:** Animal Behaviour, 65, 997-1004
**DOI:** 10.1006/anbe.2003.2123

## One-Sentence Summary
Provides empirical data linking female F0, formant frequencies, formant dispersion, and body size to perceived vocal attractiveness, with specific acoustic measurements from 30 women's vowel productions judged by 30 male listeners.

## Problem Addressed
Whether vocal attractiveness in women is correlated with visual (facial) attractiveness and whether acoustic parameters of the voice (F0, harmonics, formant frequencies, formant dispersion) predict attractiveness judgements and perceived age.

## Key Contributions
- Demonstrates that vocal and visual attractiveness are significantly correlated in women (r=0.404, P<0.05), even when age is partialled out
- Shows that higher F0 and higher formant frequencies predict higher vocal attractiveness ratings
- Confirms formant dispersion (F4-F5 spacing) is inversely related to height (shorter women = wider dispersion), following Fitch & Giedd 1999
- Shows body size (BMI/weight) negatively predicts both vocal and visual attractiveness, and larger women have lower-frequency voices

## Methodology
- 30 British women (age 19-26, mean 21.4) recorded speaking four vowels (A as in 'cat', E as in 'get', I as in 'sit', O as in 'hot') three times each
- Vowels sustained ~0.29 s (range 0.25-0.38 s)
- Recording: Tascam DAP1 DAT recorder, Sennheiser MKH60 microphone, 20 cm distance, constant level
- Analysis: logarithmic power spectra via Avisoft SASlab (sampling frequency 11 kHz); LPC via Praat 4.0.11 (Burg method) for formant extraction
- Body measures: height (156-178 cm), weight (47-95 kg), waist (62-95 cm), hip (80-120 cm), WHR (0.66-0.85), BMI (15.5-34.5)
- 30 male judges (age 17-30, mean 22.14) rated vocal attractiveness (1-10 scale) and estimated age from vowel recordings; then rated facial attractiveness (1-10) from head-shot photographs
- Kendall rank scores used to normalize across judges
- PCA with varimax rotation to reduce correlated vocal and body measures

## Key Equations

No formal equations provided. PCA was used to reduce variables:

**Vocal PCA** yielded 4 components (87.9% variance):
- Harm (harmonics, 38%): F0, H2-H5, harmonic spacing all load >0.92
- Formdisp (formant dispersion, 19.6%): F5 (0.93), HighDispersion (0.94), average dispersion (0.82)
- Forms (formants, 16.6%): F2 (0.79), F4 (0.86), F3 (0.68)
- Peakf (peak frequency, 13.7%): peak frequency (0.86), F1 (0.95)

**Body PCA** yielded 2 components (72% variance):
- Body (52%): BMI (0.96), weight (0.97), hip (0.92), waist (0.95)
- Whrhgt (20%): WHR (-0.79), height (0.70)

## Parameters

| Name | Symbol | Units | Range | Notes |
|------|--------|-------|-------|-------|
| Fundamental frequency | F0 | Hz | not reported (women 19-26 yrs) | Harmonic 1 in the PCA; lower limit constrained by vocal fold dimensions |
| Peak frequency | Pk | Hz | - | Usually coincides with F1 or F2 |
| Harmonics 1-5 | H1-H5 | Hz | - | Peak frequencies of first 5 harmonics |
| Harmonic spacing | - | Hz | - | Mean spacing between H1-H5 |
| Formants 1-5 | F1-F5 | Hz | - | LPC (Burg method, Praat 4.0.11) |
| Formant dispersion | - | Hz | - | Mean spacing between all formants |
| LowDispersion | - | Hz | - | Mean spacing F1-F3 |
| HighDispersion | - | Hz | ~500-1900 (from Fig 2a) | Mean spacing F4-F5; inversely related to height |
| Height | - | m | 1.56-1.78 | |
| Weight | - | kg | 47-95 | |
| BMI | - | kg/m^2 | 15.5-34.5 | |
| WHR | - | ratio | 0.66-0.85 | |
| Vowel duration | - | s | 0.25-0.38 (mean 0.29) | Sustained vowels |

## Implementation Details
- Vowel analysis used logarithmic power spectra (sampling freq 11 kHz)
- LPC analysis: Burg method via Praat 4.0.11 for formant extraction (5 formants)
- Means across all four vowels used for each speaker (to get general vocal range measure)
- Speed of utterance and amplitude equalized across subjects in stimulus tapes
- Kendall rank scoring to normalize judge variability

## Figures of Interest
- **Fig 1 (page 3):** Power spectrum of vowel A showing F0, harmonics H1-H5, harmonic differences HD1-HD4, and peak frequency (Pk). Frequency range 0-5 kHz, amplitude range 0 to -60 dB.
- **Fig 2a (page 5):** Mean dispersion of F4-F5 vs height -- shows inverse relationship (R^2=0.17). HighDispersion ranges ~500-1900 Hz for heights 1.5-1.7 m.
- **Fig 2b (page 5):** Harmonic component vs body size component -- shows negative relationship (R^2=0.14).
- **Fig 3 (page 5):** Visual vs vocal attractiveness scatter plot showing positive correlation (r=0.404).
- **Fig 4a (page 6):** Harm component vs vocal attractiveness -- positive relationship.
- **Fig 4b (page 6):** Harm component vs estimated age rank -- positive relationship (higher harmonics = judged younger).

## Results Summary

### Key statistical results:
- Vocal-visual attractiveness correlation: r_28=0.404, P<0.05 (holds when age partialled out: r_27=0.41, P<0.05)
- Age rank vs vocal attractiveness: r_18=-0.59, P<0.01 (younger-sounding = more attractive)
- Vocal attractiveness predicted by Harm + Formdisp + Forms: F_3,26=4.5, P=0.01, R^2=0.34
  - Harm: beta=0.321, P=0.05
  - Formdisp: beta=0.363, P=0.03
  - Forms: beta=0.321, P=0.05
- Perceived age predicted by Harm: F_1,18=6.3, P=0.02, R^2=0.26
- Visual attractiveness predicted by low Body scores: F_1,28=8.8, P=0.006, R^2=0.24
- Body vs vocal attractiveness: r_28=-0.4, P=0.03
- HighDispersion vs height: F_1,28=5.8, P=0.02, R^2=0.17 (shorter = wider dispersion)
- F0 vs age: r_S=0.35, N=30, P=0.055 (trend: older = lower F0)
- Harm vs Body: F_1,28=4.4, P=0.04, R^2=0.14 (larger body = lower harmonics)
- No correlation between actual age and judges' age estimates (r_18=0.11, NS)

### Inter-judge agreement (Kendall W):
| Group | Vocal attractiveness W | Age W |
|-------|----------------------|-------|
| A | 0.438 (P<0.001) | 0.315 (P<0.005) |
| B | 0.602 (P<0.001) | 0.320 (P<0.005) |
| C | 0.600 (P<0.001) | 0.114 (NS) |

## Limitations
- Narrow age range (19-26) means age effects on F0 could not be fully observed
- No control for menstrual cycle stage (premenstrual changes affect ~33% of women not on contraceptive pill)
- Small sample (N=30 speakers, N=30 judges)
- Actual F0 values not reported in the paper -- only PCA component scores
- No explanation for why body size affects F0 specifically (vocal tract size predicts formant dispersion, not F0)
- Cannot rule out that smaller women voluntarily use higher frequencies (e.g., "babylike" voice)
- Judges saw only head shots, not full body -- yet body size predicted facial attractiveness

## Testable Properties
- Higher F0 in women should correlate with higher perceived vocal attractiveness
- Formant dispersion (especially F4-F5 spacing) should be inversely proportional to speaker height
- Larger body size (higher BMI/weight) should correlate with lower F0 and harmonics
- Vocal and visual attractiveness ratings for the same individual should be positively correlated
- Within a narrow age range, perceived age from voice should not correlate with actual age
- Higher Harm, Formdisp, and Forms PCA scores should independently predict vocal attractiveness

## Relevance to Project
This paper provides empirical data on the relationship between female voice acoustics (F0, formant frequencies, formant dispersion) and perceived attractiveness/age. For a formant synthesizer like Qlatt, the key takeaways are:
1. The formant dispersion-height relationship (Fitch & Giedd 1999) is confirmed empirically, which could inform voice preset design for different speaker body types
2. Higher F0 and formant frequencies are perceived as more attractive and younger-sounding in women, relevant for voice quality presets
3. The PCA structure showing harmonics, formant dispersion, formants, and peak frequency as independent components provides a useful dimensionality reduction for voice parameterization

## Open Questions
- [ ] What are the actual mean F0 values for these speakers? The paper only reports PCA scores.
- [ ] How much does voluntary F0 raising contribute to the body size-F0 correlation?
- [ ] Would the same relationships hold for synthesized voices (i.e., can vocal attractiveness be synthesized by targeting these acoustic features)?

## Related Work Worth Reading
- Collins 2000 - "Men's voices and women's choices" (male voice attractiveness, same methodology)
- Fitch & Giedd 1999 - Vocal tract morphology via MRI, formant dispersion-body size relationship (already in collection as Fitch_Giedd_1999_VocalTractMRI if present)
- Fant 1960 - Acoustic Theory of Speech Production (foundational; already in collection)
- Abitbol et al. 1999 - Sex hormones and the female voice (hormonal effects on F0)
- Childers & Wu 1991 - Gender recognition from speech (already in collection)
- Reby & McComb 2003 - Formant frequency as honest cue to age/weight in red deer

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]] - cited for formant frequency theory and vocal tract dimensions
- [[Childers_Lee_1991_VoiceQualityFactors]] - cited as Childers & Wu 1991 for gender recognition from speech

### New Leads (Not Yet in Collection)
- Fitch (1997) - "Vocal tract length and formant frequency dispersion" in rhesus macaques - body size to formant dispersion relationship
- Collins (2000) - "Men's voices and women's choices" - male voice attractiveness using same paradigm
- Abitbol et al. (1999) - "Sex hormones and the female voice" - hormonal modulation of F0 and formant production

### Now in Collection (previously listed as leads)
- [[Fitch_1999_VocalTractMorphology]] - MRI study of 129 subjects ages 2-25 establishing VTL-body size regressions (height r=0.926, log weight r=0.941) and documenting that male-female VTL differences arise at puberty through disproportionate pharyngeal elongation. Provides the anatomical basis for the formant dispersion-height relationship that Collins 2003 confirmed acoustically.

### Supersedes or Recontextualizes
None - this paper extends prior work on vocal attractiveness but does not correct or supersede existing collection papers.

---

**See also:** Feinberg_2008_FemininityAveragenessVoicePitch - extends Collins 2003 by showing F0 alone (via PSOLA manipulation) drives vocal attractiveness, not just correlated vocal qualities. Linear pitch-attractiveness relationship confirmed.
