---
title: "Speaker Race Identification From Acoustic Cues in the Vocal Signal"
authors: "Julie H. Walton, Robert F. Orlikoff"
year: 1994
venue: "Journal of Speech and Hearing Research, 37, 738-745"
doi_url: "0022-4685/94/3704-0738"
---

# Speaker Race Identification From Acoustic Cues in the Vocal Signal

## One-Sentence Summary
This paper demonstrates that listeners can identify speaker race from sustained /a/ vowels at 60% accuracy using differences in vocal perturbation (jitter, shimmer) and harmonics-to-noise ratio, not F0 or formant structure.

## Problem Addressed
Previous studies showed listeners could identify speaker race from speech samples, but it was unknown what specific acoustic information in signals devoid of linguistic-phonetic content (sustained vowels) enables this discrimination.

## Key Contributions
- Demonstrated 60% race identification accuracy from 1-second sustained /a/ samples, significantly above chance
- Showed identification accuracy is independent of listener race, sex, or experience
- Identified amplitude perturbation (shimmer) and harmonics-to-noise ratio as the significant acoustic discriminators between groups
- Showed that F0 and formant structure (F1, F2) did not differ significantly between groups
- Demonstrated that identification accuracy correlates with magnitude of perturbation differences between paired speakers

## Methodology
50 black and 50 white adult males produced sustained /a/ vowels. One-second mid-portion samples were extracted, paired (one black + one white speaker per pair), and presented to 12 listeners (6 expert, 6 naive; 6 black, 6 white) in a forced-choice paradigm. Acoustic analysis measured F0, F1, F2, jitter (RAP), shimmer (dB), and harmonics-to-noise ratio.

## Key Equations

No novel equations introduced. Standard acoustic measures used:
- **RAP (Relative Average Perturbation):** Koike (1973) jitter calculation
- **Shimmer:** Mean amplitude perturbation in dB
- **H/N ratio:** Yumoto (1983, 1987) harmonics-to-noise ratio

## Parameters

| Name | Symbol | Units | Black M (SD) | White M (SD) | Significant? | Notes |
|------|--------|-------|--------------|--------------|-------------|-------|
| Fundamental frequency | F0 | Hz | 108.85 (14.48) | 107.55 (15.11) | No | Range: ~83-148 Hz |
| First formant | F1 | Hz | 660 (60) | 662 (72) | No | /a/ vowel |
| Second formant | F2 | Hz | 1181 (90) | 1181 (88) | No | /a/ vowel |
| Jitter | RAP | % | 0.40 (0.36) | 0.28 (0.12) | No (p>.02) | Greater variability in black speakers |
| Shimmer | - | dB | 0.331 (0.150) | 0.275 (0.111) | Yes (p=.016) | Bonferroni-adjusted alpha = .02 |
| Harmonics-to-noise ratio | H/N | dB | 14.77 (3.38) | 16.32 (2.56) | Yes (p=.005) | Lower = more noise |

### Correctly Identified Pairs (30/50 pairs, >= 7/12 listeners correct)

| Name | Black M (SD) | White M (SD) | Significant? |
|------|--------------|--------------|-------------|
| F0 | 106.94 (15.12) | 109.07 (16.64) | No |
| Jitter (RAP) | 0.46% (0.43) | 0.26% (0.06) | Yes (p=.009) |
| Shimmer | 0.372 dB (0.153) | 0.271 dB (0.122) | Yes (p=.003) |
| H/N ratio | 14.36 dB (3.19) | 16.31 dB (2.60) | Yes (p=.006) |

### Incorrectly Identified Pairs (14/50 pairs)
No significant differences in any vocal noise measure between the two groups.

## Implementation Details
- Voice samples recorded in sound-treated booth, Sony TC 142, mic at 8 inches
- Digitized at 51,200 samples/sec, 16-bit, low-pass filtered at 20 kHz
- Analysis via Kay Elemetrics CSL 4300 (Voicing Analysis software v2.10)
- Formants measured via wide-band spectrography, downsampled to 6.4 kHz for formant tracking
- Forced-choice paired comparison: each pair = one black + one white speaker
- Bonferroni correction applied (alpha = .05/3 = .017, rounded to .02) for jitter/shimmer/H/N

## Figures of Interest
- **Table 2 (page 3/740):** Complete acoustic data (means, SDs, ranges) for both groups
- **Table 3 (page 4/741):** Listener demographics and identification performance
- **Table 4 (page 5/742):** Acoustic data for correctly identified pairs at 58%, 75%, 92% thresholds
- **Table 5 (page 6/743):** Acoustic data for incorrectly identified pairs

## Results Summary
- Overall 60% identification accuracy (significantly above 50% chance; z=4.77, p<.001)
- Individual listener accuracy ranged 52%-70%
- First 10 pairs showed poorer identification; excluding them raised accuracy to 65%
- Listener race, sex, experience, dialect exposure, and geography did not predict accuracy
- Shimmer and H/N ratio were significantly different between groups overall
- For correctly identified pairs, all three noise measures (jitter, shimmer, H/N) were significant
- For incorrectly identified pairs, no noise measures were significantly different
- Higher listener confidence correlated with greater acoustic differences between paired speakers
- Post-listening: 8/12 listeners described black voices as "rougher," 6/12 as "breathier"

## Limitations
- Subject population: newly admitted prison inmates, may not represent general population
- Could not control for drug/alcohol use or smoking habits
- 1-second samples may be too short to adequately characterize vocal function
- Cannot determine whether vocal noise differences are physiological or paralinguistic/dialectal
- Tape recording introduces its own perturbation artifacts (Doherty & Shipp, 1988)
- Forced-choice pair method differs from single-voice judgment; method effects unknown

## Testable Properties
- Shimmer values for healthy adult males should fall within 0.095-0.704 dB (observed range)
- H/N ratio for healthy adult males should fall within 6.68-21.45 dB (observed range)
- RAP jitter for healthy adult males should fall within 0.14-2.33% (observed range)
- F0 for adult male sustained /a/: 83-148 Hz range
- F1 of /a/ for adult males: 515-898 Hz; F2: 1030-1501 Hz
- When shimmer and H/N differences between two voices are minimal, perceptual discrimination should approach chance (50%)

## Relevance to Project
This paper provides normative acoustic perturbation data (jitter, shimmer, H/N ratio) for adult male sustained vowels that could inform voice quality parameter ranges in the synthesizer. The finding that listeners rely on spectral noise characteristics rather than F0 or formants for voice quality discrimination suggests that perturbation and noise parameters in the Klatt synthesizer (AV turbulence, spectral tilt) are perceptually salient for speaker differentiation. The shimmer and H/N normative ranges can constrain voice quality presets.

## Open Questions
- [ ] Whether the vocal noise differences are physiological (laryngeal anatomy) or learned (dialectal voice quality)
- [ ] How these perturbation ranges map to Klatt synthesizer parameters (AV, TL, FL)
- [ ] Whether female speakers show similar patterns
- [ ] How these findings extend beyond sustained /a/ to connected speech

## Collection Cross-References

### Already in Collection
- (none of the key citations are in the collection)

### Cited By (in Collection)
- [[Meek_2018_VocalParametersEthnicGroups]] — cites Walton 1994 as the most directly relevant prior work on race-related vocal parameter differences; Meek's thesis extends the investigation to four ethnic groups but with a much smaller sample (n=15)
- [[Babel_2014_VocalAttractiveness]] — cites Walton 1994 in its references on speaker characteristics identifiable from voice

### New Leads (Not Yet in Collection)
- Yumoto, Gould, & Baer (1982) — "Harmonics-to-noise ratio as an index of the degree of hoarseness" — foundational H/N ratio method used in this study
- Kreiman, Gerratt, Kempster, Erman, & Berke (1993) — "Perceptual evaluation of voice quality" — framework for voice quality assessment (note: Kreiman papers are in collection but this specific 1993 paper may not be)
- Mayo (1990) — F0 and formant frequencies of African-American vs European-American adults

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)

**Voice quality and perturbation:**
- [[Childers_Lee_1991_VoiceQualityFactors]] — Childers & Lee characterize voice qualities (modal, breathy, rough) through source parameters including turbulent noise. Walton's finding that shimmer and H/N ratio (but not F0 or formants) distinguish speakers is consistent with Childers & Lee's framework where voice quality differences are primarily source phenomena, not resonance phenomena.
- [[Gobl_2003_VoiceQualityEmotion]] — Gobl maps voice quality types to acoustic parameters for emotional speech. Walton's perceptual findings (listeners described black voices as "rougher" and "breathier") map directly onto Gobl's voice quality categories, suggesting the perturbation differences Walton measured correspond to perceptible voice quality dimensions.
- [[Klatt_1990_VoiceQualityVariations]] — Klatt's voice quality synthesis framework provides the parameter space (AV, TL, OQ, etc.) within which Walton's observed perturbation differences would need to be modeled for synthesizer implementation.

**Speaker demographics and voice source:**
- [[Meek_2018_VocalParametersEthnicGroups]] — Meek extends Walton's paradigm to four ethnic groups with physiological data (videostroboscopy), finding posterior glottal chink in non-Caucasian males but no significant acoustic differences in a small sample. The contrast (Walton found significant shimmer/H/N differences with n=100; Meek did not with n=15) highlights the importance of sample size for detecting these subtle effects.
- [[Babel_2014_VocalAttractiveness]] — Babel measures the same perturbation parameters (jitter, shimmer, HNR) as Walton and finds they predict vocal attractiveness ratings. Both studies demonstrate that within-normal-range perturbation differences are perceptually salient, whether for race identification or attractiveness judgments.
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — Iseli provides voice source parameter norms across age, sex, and vowel. Combined with Walton's race-related perturbation data, these studies suggest that voice source characteristics vary systematically across multiple demographic dimensions.

## Related Work Worth Reading
- Lass, Tecca, Mancuso, & Black (1979) - Race identification from vowel prolongation segments
- Mayo (1990) - F0 and formant frequencies of African-American vs European-American adults
- Yumoto, Gould, & Baer (1982) - H/N ratio as hoarseness index (foundational method)
- Boshoff (1945) - Anatomical differences in laryngeal structure between racial groups
- Murry (1988) - Laryngeal features in voice quality preference
- Kreiman et al. (1993) - Perceptual evaluation of voice quality framework
