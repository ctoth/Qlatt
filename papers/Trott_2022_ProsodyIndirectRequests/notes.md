---
title: "The Role of Prosody in Disambiguating English Indirect Requests"
authors: "Sean Trott, Stefanie Reed, Dan Kaliblotzky, Victor Ferreira, Benjamin Bergen"
year: 2022
venue: "Language and Speech (SAGE)"
doi_url: "https://doi.org/10.1177/00238309221087715"
---

# The Role of Prosody in Disambiguating English Indirect Requests

## One-Sentence Summary
This paper demonstrates that prosodic features (F0 slope, duration, mean pitch) reliably signal whether an utterance is intended as an indirect request vs. a literal statement/question, with both humans and machine classifiers achieving above-chance accuracy using acoustic cues alone.

## Problem Addressed
Indirect requests (e.g., "My office is really hot" meaning "please turn on the AC") are extremely frequent in English (46-97% of all requests) but inherently ambiguous. How do comprehenders determine speaker intent without explicit markers? This paper investigates whether prosody provides disambiguating information.

## Key Contributions
- Demonstrated that human listeners can identify intended interpretation at 55% accuracy (above chance) from prosody alone
- Machine classifier using 7 acoustic features achieved 65% accuracy on intent classification
- Identified specific prosodic cues that differ by grammatical form:
  - **Modal interrogatives** ("Can you X?"): Requests have *less* positive F0 slope and fewer voiced frames than questions
  - **Declaratives** ("My X is Y"): Requests have *more* voiced frames and higher mean F0 than statements

## Methodology
1. **Norming Study** (N=78): Established prior probability of each sentence being interpreted as request (91% for modal interrogatives, 16% for declaratives)
2. **Production Study** (N=18): Recorded speakers producing same sentences as requests vs. non-requests; extracted 7 acoustic features
3. **Behavioral Experiment** (N=81): Listeners judged whether utterances were intended as requests
4. **Machine Learning**: Logistic regression classifier with LOOCV

## Key Equations

No equations provided. The paper uses statistical models (logit mixed effects) rather than acoustic processing formulas.

## Parameters

| Name | Symbol | Units | Description | Notes |
|------|--------|-------|-------------|-------|
| Mean F0 | F0_mean | Hz | Average fundamental frequency | Z-scored per speaker |
| F0 Range | F0_range | Hz | Max - min F0 | |
| F0 Slope | β_F0 | Hz/s | Linear regression of F0 ~ time | Proxy for rising/falling contour |
| F0 SD | σ_F0 | Hz | Standard deviation of F0 | |
| Duration | N_voiced | frames | Number of voiced frames | Proxy for utterance length |
| Mean Intensity | I_mean | dB | Average intensity | |
| Intensity SD | σ_I | dB | Standard deviation of intensity | |
| Degree of Rise | ΔF0_final | Hz | Final F0 - initial F0 (final segment) | Exploratory measure |

## Implementation Details

### Feature Extraction
- Used Parselmouth (Python interface to Praat) for acoustic feature extraction
- Features z-scored per speaker to account for individual variability
- Final segment analysis: hand-coded timestamps for final NP (interrogatives) or final word (declaratives)

### Classifier
- Logistic regression with all 7 features + interaction with Form
- Leave-one-out cross-validation (LOOCV) on 432 utterances
- 65% held-out accuracy

### Key Prosodic Patterns

**For modal interrogatives ("Can you X?"):**
- Requests: less positive F0 slope (falling or flat)
- Non-requests (questions): more positive F0 slope (rising)
- Non-requests: more voiced frames (longer duration)

**For declaratives ("My X is Y"):**
- Requests: more voiced frames (speakers emphasize to mark deviation from literal interpretation)
- Requests: higher mean F0

## Figures of Interest
- **Fig 1 (p. 6):** Request interpretation proportions by item and form
- **Fig 2 (p. 10):** Classifier probability distributions by true intent
- **Fig 3 (p. 11):** Final rise by Form and Intent - shows interaction
- **Fig 4 (p. 13):** Pitch contours comparing question vs request versions
- **Fig 6 (p. 17):** F0 slope by Form and Interpretation
- **Fig 7 (p. 18):** Number of voiced frames cross-over interaction
- **Fig 8 (p. 18):** Summary table of acoustic feature effects

## Results Summary

| Analysis | Accuracy | Key Finding |
|----------|----------|-------------|
| Human perception | 55% | Above chance (50%) |
| Machine classifier | 65% | Using 7 features + Form interaction |
| Prior work (Hellbernd & Sammler, 2016) | 82-92% | Single-word speech acts (more constrained) |

**Significant predictors of interpretation:**
- F0 slope (β = -0.16, negative slope → more request-like)
- F0 slope × Form interaction (conventional items: β = -0.22)
- Voiced frames × Form interaction (cross-over effect)
- Mean F0 × Form (conventional only: higher F0 → less request-like)

## Limitations
- American English speakers only
- Only two grammatical forms (modal interrogatives, declaratives)
- Utterance-level features may miss word-specific prosodic marking
- Lab recordings, not naturalistic speech
- No gesture or situational context

## Relevance to Project

### Direct Relevance: Medium-Low
This paper is about *perception* of pragmatic intent from prosody, not *generation*. However:

1. **Prosodic correlates of speech acts**: The finding that requests vs. statements/questions have distinct prosodic signatures could inform how a TTS system might vary prosody based on intended pragmatic function.

2. **Key acoustic features for pragmatic meaning:**
   - F0 slope/contour (rising = question, flat/falling = request)
   - Duration (longer = marked/non-default interpretation)
   - These could be parameters in prosody generation rules

3. **Grammatical form matters**: Different prosodic cues apply to different sentence types. A TTS system would need form-specific prosody rules.

### Potential Applications
- If implementing question vs. statement prosody, use rising F0 for questions
- Duration manipulation could signal pragmatic emphasis
- Could inform rules for "polite request" vs. "command" prosody

## Open Questions
- [ ] Would these findings replicate with synthesized speech?
- [ ] What are the exact F0 contour shapes (not just linear slope)?
- [ ] How do word-level prosodic features contribute?
- [ ] Cross-linguistic validity?

## Related Work Worth Reading
- Pierrehumbert & Hirschberg (1990) - Meaning of intonational contours
- Hellbernd & Sammler (2016) - Prosody conveys speaker intentions (92% classifier accuracy)
- Ward (2019) - Prosodic patterns in English conversation
- Shriberg et al. (1998) - Prosody for dialog act classification
- Banuazizi & Creswell (1999) - Yes-no question intonation

## Data Availability
Code and recordings: https://github.com/seantrott/pros_scaled

---

## Collection Cross-References

### Already in Collection
- [[Caballero_2018_SoundOfImpoliteness]]
- [[Hellbernd_2016_ProsodySpeechActIntention]]
- [[Jiang_2017_SoundOfConfidenceDoubt]]

### New Leads (Not Yet in Collection)
- **Pierrehumbert & Hirschberg (1990)** - "The meaning of intonational contours in the interpretation of discourse" - Foundational work on how intonation patterns map to pragmatic meaning. Essential for understanding question vs. statement prosody.
- **Shriberg et al. (1998)** - "Can prosody aid the automatic classification of dialog acts in conversational speech?" - Pioneering work on using prosodic features (duration, pause, F0, energy, speech rate) for dialog act classification.
- **Ward (2019)** - "Prosodic patterns in English conversation" - Comprehensive treatment of how prosody functions in conversation, including the "late pitch peak" pattern for declarative requests.
- **Beckman et al. (2004)** - "The original ToBI system and the evolution of the ToBI framework" - For understanding how to annotate and analyze pitch contours systematically, relevant if implementing prosody generation.
