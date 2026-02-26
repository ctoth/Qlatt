# How the Voice Persuades

**Authors:** Alex B. Van Zant, Jonah Berger
**Year:** 2019
**Venue:** Journal of Personality and Social Psychology
**DOI:** http://dx.doi.org/10.1037/pspi0000193

## One-Sentence Summary
This paper establishes that speakers modulate specific acoustic features (primarily volume and volume variability) during paralinguistic persuasion attempts, and that these cues enhance persuasion by making speakers appear more confident.

## Problem Addressed
While research has examined persuasive language (what people say), little was known about whether and how the acoustic properties of speech (how people say it) contribute to persuasion, and through what psychological mechanism.

## Key Contributions
- Demonstrates across 4 experiments that paralinguistic persuasion attempts (modulating voice) increase persuasion even when linguistic content is held constant
- Identifies the "confidence account": paralinguistic cues work because they make speakers seem more confident, not because they evade detection
- Provides quantitative acoustic measurements showing speakers increase volume, volume variability, pitch, and pitch variability when trying to persuade
- Shows that volume and volume variability are the specific cues that mediate the persuasion effect via perceived confidence
- Demonstrates paralinguistic persuasion is effective even when listeners know the speaker's persuasive intent

## Methodology
Four main experiments plus replication (4A, 4B):
- **Experiment 1**: Speakers read product reviews normally vs. persuasively; listeners rated attitudes and speaker confidence. N=713 listeners.
- **Experiment 2**: Speakers explicitly acknowledged intent to persuade; tested whether known intent reduces paralinguistic efficacy. N=1,104 listeners.
- **Experiment 3**: Personally relevant context (emotion-recognition task); compared linguistic vs. paralinguistic persuasion directly. N=1,086 listeners.
- **Experiment 4A**: Replication with clip-on microphones for acoustic analysis. N=44 speakers, N=1,313 listeners.
- **Experiment 4B**: Binary choice measure; tested confidence mediation through attitude extremity, likability, competence, dominance routes. N=1,305 listeners.

Acoustic cues extracted using Praat (Boersma & Weenik, 2018). Measures normalized as coefficients of variation to control for speaker baseline differences.

## Key Equations

No formal equations per se, but the mediation model is:

$$
\text{Paralinguistic Attempt} \xrightarrow{\beta} \text{Volume cues} \xrightarrow{\beta} \text{Perceived Confidence} \xrightarrow{\beta} \text{Attitudes/Choice}
$$

Mediation path coefficients (from Figure 2, cross-study Brunswikian Lens Analysis):
- Attempt → Volume: $\beta = .16^{***}$
- Attempt → Volume $SD_{\text{Norm}}$: $\beta = .08^{*}$
- Volume → Confidence: $\beta = .10^{***}$
- Volume $SD_{\text{Norm}}$ → Confidence: $\beta = .08^{**}$
- Confidence → Attitudes: $\beta = .53^{***}$
- Direct Attempt → Attitudes (controlling for confidence): $\beta = .05^{*}$ / $\beta = .01$ (residual)

## Parameters

### Table 1: Brunswikian Lens Analysis — Cue Display and Utilization (Experiments 1-3)

| Cue | Cue Display β (SE) | Cue Utilization β (SE) |
|-----|---------------------|------------------------|
| Volume (dB) | .16 (.02)*** | .09 (.03)*** |
| Volume SD_Norm | .08 (.03)* | .06 (.03)* |
| Pitch (ST) | .06 (.02)*** | .02 (.07) |
| Pitch SD_Norm | .09 (.03)** | .04 (.03) |
| Intonation (ΔST/second) | -.002 (.07) | -.03 (.04) |
| Articulation Rate (syll/sec) | .08 (.04)* | -.03 (.04) |
| Pauses | .06 (.04) | -.03 (.04) |

N_recordings = 188; N_perceivers = 2,903. Controlling for speaker gender.

### Table 2: Experiment 4A — Conditional Means by Condition

| Cue | Paralinguistic Attempt M (SD) | Control M (SD) | Effect Size β |
|-----|-------------------------------|----------------|---------------|
| Volume (dB) | 71.89 (4.64) | 70.89 (4.67) | .11*** |
| Volume SD_Norm | 6.67 (2.08) | 6.29 (2.05) | .07* |
| Pitch (ST) | 84.43 (4.70) | 83.54 (4.51) | .11*** |
| Pitch SD_Norm | 4.75 (2.06) | 4.28 (1.94) | .12* |
| Intonation (ΔST/second) | -11.12 (39.23) | -2.79 (13.76) | -.12 |
| Articulation Rate (syll/sec) | 4.33 (.45) | 4.38 (.47) | -.07 |
| Pauses | 1.15 (1.88) | .93 (1.56) | .05 |

N_recordings = 88. Effect sizes are standardized coefficients controlling for speaker gender.

## Implementation Details

### Acoustic Measurement Methods
- **Volume**: Mean of speakers' volume (dB) across duration of each recording
- **Volume SD_Norm**: Standard deviation of volume divided by mean, multiplied by 100 (coefficient of variation as percentage)
- **Pitch**: Mean fundamental frequency in semitones (ST; 1 Hz reference), measured using Praat with settings 75-250 Hz (males), 100-300 Hz (females)
- **Pitch SD_Norm**: Standard deviation of F0 divided by mean F0, multiplied by 100
- **Intonation**: Rate of pitch change (semitones/second) in final 30 ms segment — captures whether pitch rises or falls at utterance end
- **Articulation Rate**: Syllables per period of time speaking (from de Jong & Wempe, 2009 script)
- **Pauses**: Number of times speakers paused ≥0.2 seconds during recording

### Confidence Measurement
Two items (α = .95): "The reviewer is confident in his or her evaluation of the TV" and "The reviewer is certain in his or her attitude about the TV" (1 = strongly disagree to 7 = strongly agree).

### Effect Sizes Across Experiments
- Experiment 1: d = 0.15 (attitudes), d = 0.22 (confidence)
- Experiment 2: d = 0.18 (attitudes), d = 0.19 (confidence)
- Experiment 3: d = 0.28 (paralinguistic on attitudes), d = 0.22 (paralinguistic on confidence)
- Experiment 4A: d = 1.00 (confidence on attitudes, via volume)
- Experiment 4B: d = 0.49 (confidence), OR = 1.40 (choice)

## Figures of Interest
- **Fig 1 (page 5):** Disclosure statement condition comparison (Experiment 1)
- **Fig 2 (page 11):** Lens analysis mediation model — Paralinguistic Attempt → Volume/Volume SD → Confidence → Attitudes. Key figure showing the full mediation pathway with β coefficients.
- **Fig 3 (page 15):** Experiment 4B mediation of choice through confidence and four routes (attitude extremity, likability, competence, dominance). Shows confidence → attitudes (β=.62***) and confidence → likability (β=.49***) are the primary pathways.

## Results Summary

### Core Finding
Paralinguistic persuasion attempts consistently increased persuasion across all 4 experiments, with effect sizes of d ≈ 0.15-0.28 on attitudes. The mechanism is perceived confidence: speakers making paralinguistic attempts appeared more confident (d ≈ 0.19-0.49), which mediated the attitude effect.

### What Speakers Do
When trying to persuade through paralanguage, speakers:
1. Speak **louder** (Volume: β = .16, p < .001)
2. **Vary their volume** more (Volume SD_Norm: β = .08, p < .05)
3. Speak at **higher pitch** (Pitch: β = .06, p < .001)
4. **Vary their pitch** more (Pitch SD_Norm: β = .09, p < .01)
5. Speak at a **slightly faster rate** (Articulation Rate: β = .08, p < .05)

### What Actually Persuades Listeners
Only volume cues mediated the persuasion process:
- **Volume** (mean loudness): β = .09, p < .001 on attitudes
- **Volume variability**: β = .06, p < .05 on attitudes
- Pitch, pitch variability, speech rate, intonation, and pauses were NOT significantly utilized by listeners for persuasion judgments

### Confidence Account vs. Detectability Account
- Paralinguistic attempts worked even when listeners knew speakers' intent to persuade (Experiment 2)
- Listeners could detect paralinguistic attempts about as well as linguistic ones (Experiment 3)
- Despite being detectable, paralinguistic attempts did not backfire — they actually *enhanced* perceived sincerity
- This supports the confidence account over the detectability account

### Four Routes Through Confidence (Experiment 4B)
1. **Attitude extremity route**: Confident speakers perceived as holding more extreme attitudes → OR = 1.24*
2. **Likability route**: Confident speakers perceived as more likable → OR = 0.91 (n.s.)
3. **Competence route**: Confident speakers perceived as more competent → OR = 1.12 (n.s.)
4. **Dominance route**: Confident speakers perceived as more dominant → OR = 0.71***

The attitude extremity route was the primary mediator; dominance actually *negatively* predicted choice.

## Limitations
- Effect sizes are small (d ≈ 0.15-0.28), though consistent
- Only tested product review persuasion contexts
- Speakers were laypeople reading reviews, not professional persuaders
- Volume measurement reflects computer-to-microphone distance variation (mitigated by clip-on mics in Exp 4A)
- Only English-speaking American participants
- Did not test whether paralinguistic cues for *dissuasion* differ from persuasion
- Authors acknowledge volume may not be the only relevant cue in other domains

## Testable Properties

- **Volume increases during persuasion**: When speakers attempt paralinguistic persuasion, mean volume (dB) should be higher than control condition
- **Volume variability increases during persuasion**: Coefficient of variation of volume should increase during paralinguistic attempts
- **Pitch increases during persuasion**: Mean F0 (semitones) should be higher during paralinguistic attempts
- **Confidence mediates persuasion**: Controlling for perceived confidence should reduce the main effect of paralinguistic attempts on attitudes to non-significance
- **Paralinguistic persuasion resists detection backfire**: Even when listeners know speakers' intent, paralinguistic cues should not reduce persuasion
- **Volume but not pitch predicts listener attitudes**: In mediation models, volume should significantly predict attitudes while pitch should not

## Relevance to Project

This paper provides quantitative acoustic targets for implementing a "confident/persuasive" speaking style in the Qlatt synthesizer. The key actionable parameters are:
- **Volume**: Increase mean intensity by ~1 dB and increase intensity variation by ~6% (coefficient of variation)
- **Pitch**: Increase mean F0 by ~1 semitone and increase F0 variation by ~11%
- These map to Klatt parameters AV (voicing amplitude) and F0, plus their frame-to-frame variation

However, the paper's primary contribution is psychological mechanism (confidence perception) rather than detailed acoustic parameterization, making it more useful as background for voice quality presets than as a direct implementation reference.

## Open Questions
- [ ] How do these findings interact with voice quality parameters (breathiness, tenseness)?
- [ ] Would the volume effects be better implemented as global gain adjustment or as selective emphasis on key content words?
- [ ] The paper focuses on product reviews — do the same cues work for other persuasion contexts?
- [ ] How do these paralinguistic effects interact with prosodic structures (stress, boundary tones)?

## Related Work Worth Reading
- Mehrabian & Williams (1969) - Original study on vocal cues during persuasion
- Hall (1980) - Early study on paralinguistic persuasion with null results
- Schroeder & Epley (2015, 2016) - Voice vs. text for conveying traits and feelings
- Aronovitch (1976) - Voice cues and confidence perception
- Packwood (1974) - Volume and persuasiveness correlation
- Weinstein, Zougkou, & Paulmann (2018) - "You 'have' to hear this" — voice tone and motivation

## Collection Cross-References

### Already in Collection
- **Eyben_2015_GeMAPS_AcousticParameters** — GeMAPS includes volume/loudness and F0 parameters used in this paper
- **Banse_1996_VocalEmotionAcousticProfiles** — Emotion profiles overlap with confidence cues (high activation emotions share elevated F0 and intensity)
- **Larrouy-Maestri_2024_EmotionalProsody** — Emotional prosody review covers similar acoustic dimensions
- **ZeiPollermann_2002_AcousticPatternsEmotions** — F0 and energy patterns for emotion overlap with persuasion cues
- **Sporer_2006_ParaverbalDeceptionMetaAnalysis** — Deception paralinguistic cues; this paper explicitly distinguishes persuasion from deception

### New Leads (Not Yet in Collection)
- Schroeder & Epley (2015, 2016) — Voice evaluations and mind perception; relevant for voice quality perception
- Weinstein, Zougkou, & Paulmann (2018) — Voice tone and motivation; direct relevance to prosodic presets
- Packwood (1974) — Volume and perceived counselor persuasiveness; quantitative volume-persuasion data

### Supersedes or Recontextualizes
- Provides confidence-based explanation that recontextualizes **Sporer_2006_ParaverbalDeceptionMetaAnalysis**: where Sporer found pitch elevation for deception, Van Zant & Berger show pitch elevation for persuasion occurs via confidence rather than deception signaling
