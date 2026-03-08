# The Effects of Text-To-Speech Gender and Accent on the Trustworthiness and Listening Experience of Informational News Content

**Authors:** B.J.W. Beckers
**Year:** 2021
**Venue:** Master's Thesis, Tilburg University (Communication and Information Sciences)
**DOI:** N/A

## One-Sentence Summary
Male TTS voices are perceived as significantly more trustworthy than female TTS voices for news content reading, while national (Dutch) accent TTS voices produce a more positive listening experience than foreign (Belgian) accent voices, with perceived accent similarity mediating the accent-experience relationship.

## Problem Addressed
As TTS is increasingly used for long-form content like news articles, the study examines whether voice gender (male vs female) and accent (national vs foreign) affect listeners' trustworthiness judgments and listening experience, and whether similarity-attraction mediates these effects.

## Key Contributions
- Male TTS voice rated significantly more trustworthy than female TTS voice (M=5.09 vs M=4.00, p<.001)
- National (Dutch) accent TTS voice produced marginally better listening experience than foreign (Belgian) accent (M=4.84 vs M=4.41, p=.003)
- Perceived accent similarity mediates the relationship between accent condition and listening experience
- Gender similarity does not mediate listening experience
- Qualitative interviews revealed three themes: intelligibility, similarity, seriousness/expertise

## Methodology
- Mixed-method: quantitative survey (N=326) + qualitative follow-up interviews (N=10)
- 2x2 between-subjects design: gender (male/female) x accent (Dutch/Belgian)
- Dutch TTS voices from Google Cloud TTS (WaveNet)
- Participants listened to ~3 minute news article audio
- 7-point Likert scales for listening experience, trustworthiness, similarity
- PROCESS model 4 mediation analyses
- Manipulation checks: 86.5% correctly identified gender, 76.1% correctly identified accent

## Parameters

| Measure | Male Voice (M, SD) | Female Voice (M, SD) | Significance |
|---------|--------------------|--------------------|-------------|
| Listening Experience | 4.66, 1.19 | 4.60, 1.30 | n.s. |
| Trustworthiness | 5.09, 1.50 | 4.00, 1.52 | p<.001, t(324)=6.54 |
| Gender Similarity (male raters) | 4.79, 1.69 | 2.55, 1.75 | p<.05 |
| Gender Similarity (female raters) | 4.97, 1.55 | 3.14, 1.86 | p<.05 |

| Measure | Dutch Accent (M, SD) | Belgian Accent (M, SD) | Significance |
|---------|---------------------|----------------------|-------------|
| Listening Experience | 4.84, 1.23 | 4.41, 1.22 | p=.003 |
| Trustworthiness | 4.35, 1.79 | 4.67, 1.70 | n.s. |
| Accent Similarity | 3.81, 1.51 | 2.95, 1.60 | p<.05 |

## Results Summary
- H1 (gender affects listening experience): NOT supported -- no significant difference
- H2 (accent affects listening experience, mediated by similarity): SUPPORTED -- Dutch accent rated better, mediated by similarity
- H3 (accent affects trustworthiness, mediated by similarity): SUPPORTED -- similarity mediates accent-trustworthiness relationship
- H4 (male voice more trustworthy): SUPPORTED -- Mdiff=1.09, p<.001
- Qualitative: Participants associated male voices with "seriousness" and "expertise" in news contexts
- Qualitative: Some participants explicitly acknowledged gender bias but still reported trusting male voice more

## Figures of Interest
- **Table 2 (page 40):** Descriptive statistics for all conditions
- **Pages 36-39:** Mediation analyses details
- **Pages 42-44:** Thematic analysis of interview responses

## Limitations
- All Dutch participants -- culturally specific findings
- Google WaveNet voices only -- may not generalize to other TTS systems
- Belgian accent manipulation was subtle (one accent variant of Dutch)
- Self-report trustworthiness may differ from behavioral trust
- Between-subjects design means individual differences not controlled

## Testable Properties
- Male TTS voices should receive higher trustworthiness ratings than female TTS voices in news contexts
- National accent TTS voices should produce better listening experience than foreign accent
- Accent similarity perception should mediate accent-experience relationship
- Voice gender should not significantly affect listening experience per se

## Relevance to Project
This thesis demonstrates that TTS voice gender and accent have measurable effects on listener trust and experience. For Qlatt voice preset design, the finding that male voices are perceived as more trustworthy for news content suggests that voice parameter selection has downstream social consequences. The similarity-attraction finding means that matching a TTS voice to the listener's regional variety improves reception. However, this is a social psychology thesis with no acoustic parameter data -- it uses commercial Google WaveNet voices with no control over synthesis parameters. Its relevance to Qlatt is primarily conceptual (voice persona design) rather than parametric.

## Open Questions
- [ ] Would the trustworthiness gender effect replicate with non-news content?
- [ ] Do the effects depend on TTS quality level (parametric vs neural)?
- [ ] Would the findings hold in English or other languages?

## Related Work Worth Reading
- Nass, C. & Lee, K. M. (2001). Does computer-synthesized speech manifest personality? Experimental tests of recognition, similarity-attraction, and consistency-attraction.
- Lee, K. M., Nass, C., & Brave, S. (2000). Can computer-generated speech have gender? An experimental test of gender stereotype.
