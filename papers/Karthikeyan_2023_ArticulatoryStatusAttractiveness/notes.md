# Articulatory Effects on Perceptions of Men's Status and Attractiveness

**Authors:** Sethu Karthikeyan, David A. Puts, Toe Aung, Jennifer K. Link, Kevin Rosenfield, Alexander Mackiel, Allisen Casey, Kaelyn Marks, Michele Cristo, Jenny Patel, Aliza Santos, Glenn Geher
**Year:** 2023
**Venue:** Scientific Reports, 13:2647
**DOI:** https://doi.org/10.1038/s41598-023-29173-z

## One-Sentence Summary
Men who clearly enunciate word-final /t/ (aspirated release) are rated as more attractive for long-term relationships and higher in prestige by both women and men, linking articulatory clarity to social status perception.

## Problem Addressed
While pitch and formant frequencies are known to influence vocal attractiveness and dominance perceptions, little is known about how articulatory behavior -- specifically the clarity of consonant production -- affects social evaluations of male speakers.

## Key Contributions
- Demonstrates that aspirated (clearly released) /t/ in word-final position increases long-term mating attractiveness ratings by women (M=36.95 aspirated vs M=19.28 unreleased, p=0.006)
- Shows aspirated /t/ speakers receive higher prestige scores from men (M=53.58 vs M=51.51, p=0.001) but not higher physical dominance scores
- Finds a significant interaction between mating context (short-term vs long-term) and /t/ articulation for attractiveness (F(1,43)=11.01, p=0.002)
- Identifies jitter as differentiating the two speaker groups (aspirated /t/: M=0.024, SD=0.004 vs unreleased /t/: M=0.022, SD=0.004; p=0.004)

## Methodology
- Within-subjects repeated measures design
- 45 female raters evaluated attractiveness; 46 male raters evaluated status
- Stimuli: 40 speech samples from 80 white male speakers (ages 18-26), half with aspirated and half with unreleased word-final /t/
- 15-word set: beat, bit, bet, bait, bat, but, bout, bye, book, boot, boat, bought, bird, car, ago
- Acoustic parameters extracted via Praat: F0, F1-F3, jitter
- Analyses: 2-way mixed ANOVA, ANCOVA with F0 and formant covariates, linear mixed models

## Parameters

| Name | Symbol | Units | Value (M +/- SD) | Notes |
|------|--------|-------|-------------------|-------|
| F0 | f0 | Hz | 110.00 +/- 14.74 | Mean across all 80 speakers |
| F1 | F1 | Hz | 492.40 +/- 37.53 | Standardized formant position |
| F2 | F2 | Hz | 1450.22 +/- 53.27 | Standardized formant position |
| F3 | F3 | Hz | 2461.26 +/- 88.81 | Standardized formant position |
| Jitter | -- | ratio | 0.023 +/- 0.005 | Cycle-to-cycle F0 variation |

## Results Summary
- Aspirated /t/ speakers rated more attractive for long-term but not short-term relationships
- Aspirated /t/ speakers rated higher in prestige but not physical dominance
- F0 and formant position did not differ between the two speaker groups
- Jitter was significantly higher in aspirated /t/ speakers
- Perceived similarity to rater's community increased attractiveness ratings (p<0.05)
- Short-term attractiveness correlated negatively with f0 (r=-0.29, p=0.009)
- Physical dominance correlated negatively with formant position (r=-0.29, p=0.009)

## Figures of Interest
- **Fig 1 (page 4):** Raincloud plots showing attractiveness and status ratings by /t/ articulation type. Clear separation for long-term attractiveness and prestige ratings.

## Limitations
- Stimuli from WEIRD population (white, western, educated males only)
- Word-final /t/ patterns may not apply to non-English speakers
- Read speech (word list) rather than spontaneous conversation
- Only two discrete categories of /t/ articulation examined; gradient variation not studied
- Sample sizes modest (45 female, 46 male raters)

## Testable Properties
- Aspirated word-final /t/ should increase perceived prestige relative to unreleased /t/
- Long-term attractiveness ratings should show larger articulation effects than short-term ratings
- Jitter values should be higher for speakers who consistently aspirate word-final /t/
- F0 alone should not predict /t/ articulation group membership

## Relevance to Project
This paper demonstrates that articulatory precision -- specifically whether stops are fully released -- affects social perception of speakers. For voice profile design in Qlatt, this suggests that stop release parameters (VOT, burst amplitude, aspiration duration) contribute to the perceived social character of a synthetic voice. A "prestigious" or "trustworthy" voice preset should include full stop releases with aspiration, while a more casual/dominant preset might use unreleased or glottalized stops. The acoustic measures (F0=110 Hz, F1-F3 values, jitter) provide baseline reference data for young male American English speakers.

## Open Questions
- [ ] Would the effect replicate with spontaneous speech rather than word lists?
- [ ] How does gradient variation in VOT (not just binary aspirated/unreleased) map to prestige/attractiveness?
- [ ] Do similar articulatory clarity effects exist for other consonants beyond /t/?

## Related Work Worth Reading
- Kempe, V., Puts, D. & Cardenas, R. Masculine men articulate less clearly. Human Nat. 24, 25 (2013). [ref 62]
- Bond, Z. S. & Moore, T. J. A note on the acoustic-phonetic characteristics of inadvertently clear speech. Speech Commun. 14, 325-337 (1994). [ref 63]
- Stehr, D. A. et al. Examining vocal attractiveness through articulatory working space. J. Acoust. Soc. Am. 150, 1548-1564 (2021). [ref 12]
