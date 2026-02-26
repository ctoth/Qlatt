# The Sound of (In)sincerity

**Authors:** Karyn Fish, Kathrin Rothermich, Marc D. Pell
**Year:** 2017
**Venue:** Journal of Pragmatics 121 (2017) 147-161
**DOI:** https://doi.org/10.1016/j.pragma.2017.10.008

## One-Sentence Summary
This paper identifies specific prosodic acoustic features (speech rate, F0, amplitude) that differentiate sincere from insincere compliments (prosocial lies), providing empirically-validated parameters for synthesizing utterances that convey different degrees of perceived sincerity.

## Problem Addressed
Prior research on deception focused on high-stakes lies with limited attention to prosocial lies (white lies told to spare others' feelings). The acoustic markers that signal sincerity vs. insincerity in speech were poorly characterized, and the role of conversational context in shaping these impressions was unexplored.

## Key Contributions
- Demonstrated that listeners can reliably differentiate sincere from insincere compliments based primarily on vocal cues
- Identified specific acoustic parameters that predict perceived sincerity with 87% accuracy
- Showed that conversational context (confident vs. uncertain question prompts) modulates sincerity perception
- Provided phrase-level acoustic analysis showing cues are position-dependent within utterances

## Methodology
Two-phase study:
1. **Stimulus Elicitation**: Recorded 256 Question-Response pairs (4 speakers × 16 items × 2 sincerity × 2 question types) with female speakers producing compliments in sincere or insincere contexts
2. **Perceptual-Acoustic Study**: 30 listeners rated sincerity on 5-point scale (-2 to +2); subset of 109 reliably-perceived items (58 sincere, 51 insincere) analyzed acoustically

## Key Equations

No formal equations provided. Statistical models used:
- 2×2 repeated-measures ANOVA (Question × Response type)
- MANOVA with repeated measures on Question, Response, Utterance Position
- Discriminant function analysis for classification

## Parameters

| Parameter | Symbol | Sincere | Insincere | Effect | Notes |
|-----------|--------|---------|-----------|--------|-------|
| Mean F0 (initial phrase) | MeanF0 | Higher (.86) | Lower (.68) | p < .001, η² = .06 | Z-normalized values |
| Mean F0 (main phrase) | MeanF0 | .44 | .44 | n.s. | No difference in main utterance |
| F0 Range (initial phrase) | f0Range | .57 | .46 | p = .062 | Marginal trend |
| Mean Amplitude (initial phrase) | MeanAmp | .38 | .38 | n.s. | - |
| Mean Amplitude (main phrase) | MeanAmp | .35 (softer) | .37 (louder) | p = .004 | Insincere gets louder |
| Speech Rate (overall) | SpeechRate | 7.01 syl/s | 5.45 syl/s | p < .001, η² = .22 | Strongest discriminator |
| Speech Rate (initial phrase) | SpeechRate | 7.59 syl/s | 5.90 syl/s | p < .001 | - |
| Speech Rate (main phrase) | SpeechRate | 6.44 syl/s | 5.00 syl/s | p < .001 | - |

### Discriminant Function Correlations (for classification)
| Measure | Position | Correlation |
|---------|----------|-------------|
| Speech Rate | Initial phrase | r = .46 |
| Speech Rate | Main utterance | r = .29 |
| Mean Amplitude | Initial phrase | r = .49 |
| Mean Amplitude | Main utterance | r = .28 |
| Mean F0 | Initial phrase | r = .34 |
| F0 Range | Initial phrase | r = .31 |

## Implementation Details

### Acoustic Feature Extraction
- Used Praat for acoustic analysis
- F0 measures visually inspected and manually corrected for extraction errors
- F0 and amplitude normalized per-speaker relative to neutral baseline
- Range = max - min within utterance

### Normalization Procedure
Each speaker's F0/amplitude measures were normalized relative to their neutral condition:
- Individual mean, min, max values compared to mean minimum of all neutral utterances by same speaker
- Allows meaningful cross-speaker comparison

### Utterance Structure
Compliments had two-part structure:
1. **Initial phrase** (evidentiality marker): "I think" / "I found"
2. **Main phrase** (compliment content): "you look really amazing"

Different acoustic features marked differently in each position.

### Stimulus Design
- 16 compliment items, 9-11 syllables each
- 4 themes: Appearance, Creative Acts, Interpersonal Acts, Third Parties
- Questions: Confident ("So, what do you think of my...?") vs Uncertain ("Do you think my [item] looks [negative]?")
- Inter-turn silence: 750ms (neutral timing)

## Figures of Interest
- **Fig 1 (page 153):** Visual pitch contour comparison showing sincere vs insincere compliments - sincere starts higher on "I think" then converges
- **Fig 2 (page 154):** Bar chart of sincerity ratings by Question × Response showing interaction effect

## Results Summary

### Perceptual Results
- Sincere compliments rated significantly higher than insincere (F(1,29) = 123.12, p < .0001, η² = .81)
- Question × Response interaction (F(1,29) = 22.88, p < .0001, η² = .44): Uncertain questions reduce the perceived difference between sincere/insincere

### Acoustic Results
- **Speech rate**: Strongest cue - sincere utterances faster throughout
- **F0**: Sincere compliments have higher pitch on initial phrase ("I think") only
- **Amplitude**: Insincere compliments get louder as utterance unfolds

### Classification Accuracy
- 88% (51/58) of sincere utterances correctly classified
- 86% (44/51) of insincere utterances correctly classified

## Limitations
- Female speakers only (justified by literature on prosocial lies in female dyads)
- Laboratory elicitation may not fully capture naturalistic variation
- Limited to North American English speakers
- Only 4 speakers recorded compliments
- Actors may have enacted preconceived stereotypes about sincerity cues

## Relevance to Project

### Direct Applications to Qlatt
1. **Prosody parameters for sincerity/attitude expression:**
   - Faster speech rate → more sincere
   - Higher initial F0 → more sincere
   - Softer amplitude in main content → more sincere
   - Amplitude crescendo → less sincere

2. **Phrase-position effects:**
   - Different parameters matter in different utterance positions
   - Initial "evidentiality" phrases (I think, I believe) need special treatment

3. **Context-dependent prosody:**
   - Same compliment can be perceived differently based on preceding context
   - TTS should consider dialogue history

### Implementation Suggestions
- Add "sincerity" parameter to voice quality controls
- Map sincerity to: speech rate scaling, F0 offset on initial phrases, amplitude envelope shaping
- Consider phrase-structure-aware prosody: detect "I think/believe/found" and boost initial F0

## Open Questions
- [ ] How do these findings generalize to male speakers?
- [ ] What are the F0 values in Hz (paper only reports normalized z-scores)?
- [ ] How does voice quality (beyond F0/amplitude/rate) contribute?
- [ ] Does sincerity interact with emotional prosody (e.g., happy insincere vs neutral insincere)?

## Related Work Worth Reading
- Cheang & Pell (2008, 2009) - Acoustic markers of sarcasm
- Jiang & Pell (2017) - Sound of confidence and doubt
- DePaulo et al. (2003) - Comprehensive meta-analysis of deception cues
- Rigoulot et al. (2014) - ERP study using these same stimuli (neural correlates)
- Sporer & Schwandt (2006) - Meta-analysis of paraverbal deception indicators

---

## Collection Cross-References

### Already in Collection
- **Jiang_2017_SoundOfConfidenceDoubt**
- **White_2014_ProsodicTimingFunction**

### New Leads (Not Yet in Collection)
- **Cheang & Pell (2008) - "The sound of sarcasm"** - Related work on acoustic markers of non-literal speech from the same lab; likely provides complementary parameters for sarcasm that could be contrasted with sincerity cues.
- **DePaulo et al. (2003) - "Cues to deception"** - Comprehensive meta-analysis of 158 deception cue studies; essential background for understanding which acoustic features reliably signal deception vs. which are folk beliefs.
- **Sporer & Schwandt (2006) - "Paraverbal indicators of deception: a meta-analytic synthesis"** - Meta-analysis specifically focused on vocal/paralinguistic cues; provides effect sizes for speech rate, pitch, pauses, and other prosodic features.
- **Rigoulot, Fish & Pell (2014) - "Neural correlates of inferring speaker sincerity"** - ERP study using the same stimulus set; provides neural timing data showing P600 differences that could inform real-time sincerity processing models.
- **Pell et al. (2009) - "Factors in the recognition of vocally expressed emotions"** - From same lab; describes the acoustic normalization methodology used in this paper and provides cross-linguistic emotion recognition data.
