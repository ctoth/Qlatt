---
title: "Falling Vocal Intonation Signals Speaker Confidence and Conditionally Boosts Persuasion"
authors: "Thomas I. Vaughan-Johnston, Joshua J. Guyer, Leandre R. Fabrigar, Grigorios Lamprinakos, Pablo Briñol"
year: "2024 (published 2026 in journal)"
venue: "Personality and Social Psychology Bulletin, Vol. 52(1), pp. 3-21"
doi_url: "10.1177/01461672241262180"
---

# Falling Vocal Intonation Signals Speaker Confidence and Conditionally Boosts Persuasion

## One-Sentence Summary
This paper demonstrates that falling (vs. rising) vocal intonation at sentence ends signals speaker confidence and increases listener message processing under moderate elaboration conditions, with implications for how prosody affects persuasion.

## Problem Addressed
Prior research on vocal confidence and persuasion focused on high/low elaboration conditions. This paper examines the unstudied role of vocal confidence under *moderate* elaboration, where listeners have flexibility in how much cognitive effort to devote to processing a message.

## Key Contributions
- Demonstrates falling intonation signals speaker confidence (replicates prior work)
- Shows falling intonation increases message elaboration under moderate processing conditions
- Reveals that confident vocal delivery can *reduce* persuasion with weak arguments (boundary condition)
- Provides evidence for ELM's "multiple roles" postulate with vocal confidence variables

## Methodology
Three experiments using 2x2 between-subjects designs:
- **Experiment 1**: N=277, Spanish university students, junk food tax topic, male speaker
- **Experiment 2**: N=321, Canadian university students, tuition work program topic, female speaker
- **Experiment 3**: N=447, UK MTurk workers, junk food tax topic, male speaker

**Independent Variables:**
- Vocal Intonation: Falling vs. Rising (manipulated via PRAAT pitch shifting on final words of sentences)
- Argument Quality: Strong vs. Weak
- Experiment 2 also varied intonation magnitude (15-20 Hz vs. 35-75 Hz shift)
- Experiment 3 also varied intonation frequency (25% vs. 75% of sentences manipulated)

**Dependent Variables:**
- Attitudes (7-point semantic differential scales, 8 items, α=.90)
- Behavioral intentions
- Perceived speaker confidence
- Thought listing (Experiment 2): relevance and valence

## Key Findings

### Manipulation Validation
- Falling intonation consistently perceived as more confident than rising intonation
- Effect sizes: ηp² = .04-.05 for perceived confidence
- Manipulation did NOT affect ability to understand the speaker (ruling out processing ability as explanation)

### Main Results

**Experiment 1:**
- Interaction of Intonation × Argument Quality on attitudes: F(1,273) = 4.18, p = .042, ηp² = .02
- Falling intonation marginally boosted persuasion with strong arguments (Mdiff = .38)
- Falling intonation unrelated to persuasion with weak arguments (Mdiff = -.24, ns)

**Experiment 2:**
- Replicated interaction: F(1,313) = 10.88, p = .001, ηp² = .03
- Falling intonation increased persuasion with strong arguments (Mdiff = .38, p = .038)
- Falling intonation *decreased* persuasion with weak arguments (Mdiff = -.47, p = .010)
- Falling intonation increased proportion of message-relevant thoughts: 75.8% vs. 66.5%
- Thought-attitude correspondence stronger with falling (B = 1.63) vs. rising (B = 1.16) intonation

**Experiment 3:**
- Three-way interaction with frequency: F(1,439) = 4.50, p = .034
- Effects emerged at 75% frequency but not 25% frequency
- Mediation by perceived confidence significant at 75% frequency (MMI = .35, CI95 = [.09, .65])

## Parameters

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| Pitch shift magnitude | - | Hz | ±35 Hz | Exp 1, relative to baseline |
| Pitch shift (moderate rising) | - | Hz | +35 Hz | Exp 2 rising condition |
| Pitch shift (strong rising) | - | Hz | +75 Hz | Exp 2 rising condition |
| Pitch shift (moderate falling) | - | Hz | -15 Hz | Exp 2 falling condition |
| Pitch shift (strong falling) | - | Hz | -20 Hz | Exp 2 falling condition |
| Sentences manipulated | - | % | ~50% | Exp 1-2 (12 of 22 sentences) |
| Sentences manipulated (low) | - | % | 25% | Exp 3 low frequency |
| Sentences manipulated (high) | - | % | 75% | Exp 3 high frequency |
| Words changed | - | % | 4.4% | Exp 1 (only final word of selected sentences) |

## Implementation Details

### Intonation Manipulation Procedure (using PRAAT)
1. Select sentences to manipulate (evenly distributed throughout text)
2. Identify final word of each selected sentence
3. Raise or lower pitch on only the final word
4. Keep changes within natural variation range (~35 Hz shift)

### Key Design Considerations
- Personal relevance kept ambiguous to create moderate elaboration conditions
- Used declarative sentences only (no questions)
- Spread manipulated sentences evenly throughout passage
- Changes confined to sentence-final position (where falling/rising patterns naturally occur)

## Figures of Interest
- **Fig 1 (p. 8):** Interaction plot showing falling intonation benefits persuasion for strong arguments only
- **Fig 2 (p. 11):** Replication in Experiment 2
- **Fig 3 (p. 12):** Thought positivity × intonation interaction on attitudes
- **Fig 4A/B (p. 14):** Three-way interaction showing frequency moderation

## Results Summary
- Falling intonation consistently signals higher speaker confidence
- Under moderate elaboration, falling intonation increases message processing
- This can enhance persuasion (strong arguments) or eliminate/reduce it (weak arguments)
- Effect requires sufficient "dose" - 25% of sentences is insufficient, 50-75% effective
- Mediation by perceived confidence confirmed in high-frequency condition

## Limitations
- Focus exclusively on intonation (other confidence cues not tested)
- Cultural variation in intonation interpretation (e.g., Australian uptalk)
- Prepared messages only (not natural conversation)
- May not generalize when confidence is seen as domineering or triggers reactance

## Relevance to Project

**Direct relevance: LOW for speech synthesis implementation**

This is a social psychology paper about persuasion, not acoustic phonetics or speech synthesis. However, it provides:

1. **Perceptual validation** that falling intonation signals confidence - useful for understanding what prosodic patterns convey to listeners
2. **Magnitude guidelines**: ~35 Hz pitch shifts are perceptible but within natural range
3. **Frequency thresholds**: Effects require manipulation of 50%+ of utterances
4. **Sentence-final focus**: Confirms that intonation contour at utterance boundaries is perceptually salient

**For TTS expressivity**: If implementing "confident" vs. "uncertain" speaking styles, this suggests:
- Use falling terminal contours (F0 decrease at sentence ends)
- Apply consistently across utterances (not just occasionally)
- Magnitude of ~35 Hz below baseline at sentence end

## Open Questions
- [ ] What specific Hz values correspond to their "falling" baseline? (Not specified)
- [ ] What was the F0 of the speakers? (Not reported)
- [ ] How does this interact with other prosodic features (rate, intensity)?

## Related Work Worth Reading
- Guyer, Fabrigar, et al. (2019) - Speech rate, intonation, pitch effects on persuasion
- Brennan & Williams (1995) - Prosody as cue to metacognitive states
- Van Zant & Berger (2020) - How the voice persuades
- Jiang & Pell (2015, 2017) - Neural decoding of vocal confidence cues

---

## Collection Cross-References

### Already in Collection
- [[Jiang_2017_SoundOfConfidenceDoubt]]

### New Leads (Not Yet in Collection)
- **Guyer, Fabrigar, & Vaughan-Johnston (2019)** - "Speech rate, intonation, and pitch: Investigating the bias and cue effects of vocal confidence on persuasion" - Core prior work on vocal confidence and persuasion under high/low elaboration conditions.
- **Van Zant & Berger (2020)** - "How the voice persuades" - Comprehensive investigation of vocal features in persuasion, Journal of Personality and Social Psychology.
- **Brennan & Williams (1995)** - "Prosody and filled pauses as cues to listeners about metacognitive states" - Classic work on how prosody signals speaker's epistemic state.
- **Scherer, London, & Wolf (1973)** - "The voice of confidence: Paralinguistic cues and audience evaluation" - Early foundational work on vocal confidence perception.
