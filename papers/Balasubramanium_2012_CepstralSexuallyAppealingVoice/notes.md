---
title: "Cepstral Analysis of Sexually Appealing Voice"
authors: "Radish Kumar Balasubramanium, Jayashree S. Bhat, Manav Srivastava, Aimy Eldose"
year: 2012
venue: "Journal of Voice, Vol. 26, No. 4, pp. 412-415"
doi_url: "10.1016/j.jvoice.2011.03.011"
---

# Cepstral Analysis of Sexually Appealing Voice

## One-Sentence Summary
Higher Cepstral Peak Prominence (CPP) -- indicating stronger harmonic organization and greater periodicity -- characterizes sexually attractive voices in both male and female speakers.

## Problem Addressed
- Voice is known to convey biological and mate-selection information (sex, body configuration, personality)
- No prior study had examined the acoustic characteristics of sexually appealing voice specifically
- Needed an objective acoustic measure to differentiate attractive from unattractive voices

## Key Contributions
1. First study to apply cepstral analysis to voice attractiveness (as distinct from dysphonia research)
2. Demonstrates CPP differentiates attractive from unattractive voices in both genders
3. Links vocal attractiveness to harmonic organization rather than pitch or intensity alone

## Methodology
1. **Participants:** 200 adults (100M/100F), age 18-24, native Malayalam speakers, normal voice
2. **Recording:** Spontaneous narration via CSL 4150 hardware, Shure SM-48 dynamic mic at 10 cm, sound-treated room
3. **Perceptual rating:** 6 heterosexual Hindi-speaking judges (3M/3F), cross-gender rating on 5-point scale (1=very unattractive to 5=very attractive)
4. **Intrajudge reliability:** 90-96% (retested after 15 days)
5. **Interjudge reliability:** 85-96%
6. **Acoustic analysis:** CPP extracted via CSL (Hillenbrand-style cepstral peak, not CPP with linear regression)

## Parameters

### CPP Values (Table 3)

| Vocal Attractiveness | Gender | Mean CPP | SD |
|---------------------|--------|----------|--------|
| Sexually appealing | Males (n=39) | 2.64 | 0.0121 |
| Sexually appealing | Females (n=28) | 2.45 | 0.0578 |
| Sexually nonappealing | Males (n=61) | 2.56 | 0.0733 |
| Sexually nonappealing | Females (n=72) | 2.39 | 0.0346 |

### Statistical Results
- Males: t=9.638, df=98, p<0.05
- Females: t=9.844, df=98, p<0.05

Note: The CPP differences are small in absolute terms (~0.08 for males, ~0.06 for females) but statistically significant due to very small standard deviations in the attractive group.

## Key Findings

1. **Higher CPP = more attractive voice:** Both genders showed higher CPP in attractive voices
2. **Harmonic organization is the mechanism:** CPP captures both periodicity and overall harmonic energy; attractive voices have more well-defined harmonic structure
3. **Small SDs in attractive group:** Attractive male voices had remarkably tight CPP distribution (SD=0.0121), suggesting a narrow acoustic "sweet spot" for attractiveness
4. **Gender asymmetry in ratings:** 39% of male voices rated attractive vs only 28% of female voices
5. **Culture caveat:** Results may be culture-specific (Hindi-speaking judges rating Malayalam speakers)

## Implementation Details

### What CPP Measures
- Cepstral Peak Prominence reflects the degree of harmonic organization in the voice signal
- Higher CPP = stronger harmonics relative to noise = more periodic voicing
- CPP is increased by: (a) greater periodicity, (b) higher overall cepstral energy
- This is the same measure used as a dysphonia predictor (Heman-Ackah et al., 2003), here repurposed for attractiveness

### CSL-Specific Notes
- The CSL software extracts cepstral peak only, not CPP with linear regression (unlike Hillenbrand's algorithm)
- Values are unitless ratios (not in dB as in some implementations)

## Figures of Interest
- **Table 3 (page 414):** CPP values for attractive vs unattractive voices by gender -- the core data

## Limitations
1. CPP was the only acoustic measure analyzed -- no comparison with F0, jitter, shimmer, HNR, formants
2. Small effect sizes despite statistical significance
3. Culture-specific judges (Hindi speakers only)
4. CSL cepstral peak =/= standard CPP (no regression line normalization)
5. No control for speaking rate, intensity, or content differences
6. No investigation of what voice source parameters produce higher CPP

## Relevance to Project

### For Qlatt Implementation
- **Indirect relevance only.** This paper identifies CPP as a perceptual correlate of attractiveness but does not provide synthesis parameters.
- The implication for synthesis: voices with greater periodicity (lower jitter, lower noise, cleaner glottal source) will sound more "attractive"
- In Klatt terms, this maps to: lower AH (aspiration noise), lower TL (spectral tilt), lower jitter -- i.e., a clean modal voice with well-defined harmonics
- Could inform a "voice quality preset" for attractive voice: emphasize harmonic clarity by keeping source parameters near ideal modal values

### Connection to Voice Quality Research
- The CPP measure used here is the same one Gobl & Ni Chasaide (2003) would have implicitly maximized in their "modal" voice quality
- Higher CPP aligns with the "modal" end of the voice quality spectrum -- minimal breathiness, no creakiness, strong periodicity
- This supports the idea that modal voice (not breathy, not creaky) is the baseline for perceived attractiveness

## Open Questions
- [ ] What specific F0 range within each gender correlates with attractiveness? (not addressed)
- [ ] Does formant structure (vowel space size, formant dispersion) independently predict attractiveness?
- [ ] How does CPP interact with prosodic features (F0 dynamics, rhythm) in attractiveness judgments?

## Related Work Worth Reading
- Hillenbrand, 1987 -- Cepstral methodology for voice quality measurement
- Heman-Ackah et al., 2003 -- CPP as dysphonia predictor (same measure, different application)
- Hughes et al., 2004 -- Voice attractiveness predicting sexual behavior and body configuration
- Klatt & Klatt, 1990 -- Voice quality variations in synthesis (what source parameters control periodicity)

---

## Collection Cross-References

### Already in Collection
- [[Klatt_1990_VoiceQualityVariations]] -- provides the synthesis parameters (AV, AH, TL, jitter) that control the harmonic organization this paper measures via CPP
- [[Gobl_2003_VoiceQualityEmotion]] -- modal voice quality settings maximize the harmonic clarity that correlates with attractiveness here
- [[Childers_Lee_1991_VoiceQualityFactors]] -- voice quality analysis methods including harmonics-based measures
- [[Hughes_2004_VoiceAttractivenessSexualBehavior]] -- cited as motivation; establishes that voice attractiveness predicts sexual behavior and body configuration, providing the behavioral rationale for investigating acoustic correlates of sexually appealing voices

### Cited By (in Collection)
- [[Starr_2015_SweetVoiceJapaneseFeminine]] — cites Balasubramanium 2012 in context of cross-cultural acoustic correlates of voice attractiveness
- [[Hughes_2004_VoiceAttractivenessSexualBehavior]] — cited by Balasubramanium as motivation; reciprocally, Hughes' Cited By section lists this paper

### Conceptual Links (not citation-based)
- [[Fant_1985_LFModelGlottalFlow]] -- the LF glottal source model determines harmonic structure; cleaner LF pulses (lower RA, higher EE) would produce higher CPP
- [[Cummings_1995_GlottalExcitationEmotionalSpeech]] -- glottal excitation characteristics that affect harmonic energy distribution
- [[Babel_2014_VocalAttractiveness]] -- Babel finds breathiness (high H1-A3, low CPP) predicts female attractiveness, which seemingly contradicts Balasubramanium's finding that higher CPP = more attractive; the resolution may be gender-specific: Babel's breathiness effect is for female voices only, while Balasubramanium pools both genders and finds the harmonic clarity effect (Moderate)
