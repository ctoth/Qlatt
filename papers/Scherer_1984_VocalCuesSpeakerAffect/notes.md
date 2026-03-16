---
title: "Scherer, Ladd, Silverman (1984) -- Vocal Cues to Speaker Affect: Testing Two Models"
year: 1984
---

# Scherer, Ladd, Silverman (1984) -- Vocal Cues to Speaker Affect: Testing Two Models

## Key Concepts

### Two Models of Vocal Affect Signaling

1. **Covariance Model**: Nonverbal acoustic cues function as a *parallel channel*, independently of verbal content. Acoustic parameters (F0 mean, F0 SD, spectral energy) covary continuously with the strength/type of affect. Implies scalar, gradient cues that can be studied in isolation.

2. **Configuration Model**: Affect is conveyed by *configurations of categorical variables* -- intonation contour type (rise/fall), question type (wh/yes-no), interacting with linguistic structure of the text. The same suprasegmental cue may mean different things depending on linguistic context. Implies that intonation categories are the relevant unit, not scalar parameters.

**Key finding**: Both models are partially correct. Voice quality operates per the covariance model (parallel channel). Intonation contour type operates per the configuration model (interacts with text).

## Experimental Design

### Stimulus Material
- 66 utterances from tape-recorded interviews between German social agency workers and clients
- 11 speakers, 4-11 utterances each
- Complete sentences, 5-25 syllables (mean = 11 syllables)
- Half wh-questions, half yes/no questions
- Digitized at 16 kHz with 7.5-kHz antialiasing filter

### Rating Scales (9 adjectives, reduced from 250)
- *hoflich* (POLITE)
- *ungeduldig* (IMPATIENT)
- *vorwurfsvoll* (REPROACHFUL)
- *zweifelnd* (DOUBTFUL) -- dropped due to low inter-rater reliability
- *freundlich* (FRIENDLY)
- *unsicher* (INSECURE)
- *gelassen* (RELAXED)
- *verstandnisvoll* (UNDERSTANDING)
- *aggressiv* (AGGRESSIVE)

### Combined Affect Scales (from cluster analysis)
- **Challenging** = reproachful + aggressive
- **Agreeable** = friendly + understanding
- **Aroused** = impatient + relaxed (negative loading)

### Signal Masking Conditions
1. **Full audio**: Unmodified recordings
2. **Low-pass filtered**: Cutoff at each utterance's highest F0 (typically ~130 Hz), 60 dB/oct rolloff. Removes verbal content and most voice quality, preserves F0 contour.
3. **Random spliced**: 310-ms segments with 3-ms overlap, linearly attenuated at boundaries, randomly reordered. Destroys F0 contour temporal structure, preserves voice quality (spectral characteristics).
4. **Reversed**: Played backwards. Preserves voice quality and overall F0 level/range, creates new (artifact) contour with emphatic final peaks.

## Key Results

### Table I: Inter-rater reliability (correlation between two groups of raters, N=11 shared utterances)

| Adjective | Full audio | Transcript |
|-----------|-----------|------------|
| Polite | 0.75** | 0.82** |
| Unsure | 0.89*** | 0.46 |
| Doubtful | 0.41 | 0.63* |
| Relaxed | 0.69* | -0.09 |
| Impatient | 0.91*** | 0.65* |
| Friendly | 0.64* | 0.66* |
| Understanding | 0.77** | 0.62* |
| Reproachful | 0.83** | -0.08 |
| Aggressive | 0.93*** | 0.82** |

### Table IV: Multiple regression -- parameters contributing to affect variance (full audio, 66 utterances)

| Affect scale | Significant parameters | % variance per param | Total % |
|-------------|----------------------|---------------------|---------|
| **Challenging** | Intonation x question type | 10.6%** | 19.2% |
| | Question type | 7.9%* | |
| | Intonation | 6.8%* | |
| **Agreeable** | Mean F0 | 19.6%*** | 34.6% |
| | Intonation x question type | 15.0%*** | |
| **Polite** | Mean F0 | 18.3%*** | 25.4% |
| | Intonation x question type | 7.1%* | |
| **Insecure** | Intonation | 7.9%* | 13.1% |
| | Mean F0 | 5.2%, p=0.062 | |
| **Aroused** | s.d. F0 | 24.3%*** | 30.8% |
| | Mean F0 | 6.5%* | |

### Table V: Parameters contributing in signal masking conditions

| Affect scale | Full audio | Reversed | Random spliced | Filtered |
|-------------|-----------|----------|---------------|----------|
| Challenging | Intonation 22.9%* | s.d. F0 17.1%* | ... | ... |
| Agreeable | Mean F0 32.8%** | ... | Mean F0 17.0%*, Intonation 16.3%* | ... |
| Polite | Mean F0 28.0%** | ... | ... | ...^d |
| Insecure | Mean F0 23.3%* | Mean F0 30.2%**, s.d. F0 25.5%** | Mean F0 22.0%* | ... |
| Aroused | s.d. F0 23.8%*, Intonation 11.8% p=0.064, Mean F0 14.0%* | s.d. F0 18.1%* | Mean F0 12.9% p=0.085, Intonation 14.8% p=0.051 | ... |

^d Floor and high/low (not included in regressions) together accounted for 39.8% (p<0.01) of *polite* variance in filtered condition.

## Implementation-Relevant Findings

### Voice Quality as Parallel Affect Channel
- Voice quality cues (spectral energy distribution, laryngeal settings) convey affect **independently of text** and **independently of F0 contour**
- Evidence: Random-spliced and reversed conditions (which retain voice quality but destroy/alter F0 contour) still correlate with full-audio affect judgments on scales with voice quality cues retained
- This supports implementing affect as **scalar modifications to voice quality parameters** (e.g., AV, OQ, spectral tilt, TL, breathiness) that overlay on top of any text

### F0 Parameters and Affect
- **Mean F0**: Higher mean F0 associated with lower *agreeable* and *polite* ratings, higher *insecure* ratings. Accounts for 18-33% of variance on these scales.
- **F0 standard deviation**: Higher s.d. F0 associated with higher *aroused* ratings (24.3% variance). Higher s.d. F0 also associated with higher *insecure* ratings in reversed and random-spliced conditions.
- **Intonation contour type** (rise vs. fall): Affects *challenging* and interacts with question type for *agreeable*, *polite*, and *challenging* scales.

### Intonation-Affect Interactions (Configuration Model Evidence)
- The interaction between intonation contour type and question type is key:
  - **Falling wh-questions** and **rising yes/no questions** = "normal/unmarked" intonation = rated as more *polite* and *agreeable*
  - **Rising wh-questions** and **falling yes/no questions** = "marked" intonation = rated as more *challenging* (reproachful + aggressive)
- This means intonation contour type does NOT convey affect independently -- it only works in conjunction with the text's grammatical structure

### Practical Implications for Synthesis
1. **Voice quality parameters** (spectral tilt, breathiness, laryngeal tension) can be applied as affect overlays regardless of text content
2. **F0 mean and F0 range/variability** can be scaled as gradient parameters for affect (higher mean = less agreeable/polite, higher variability = more aroused)
3. **Intonation contour selection** must respect the linguistic context -- a "fall" is not inherently aggressive; it only signals affect relative to what contour is expected for that sentence type
4. **Low-pass filtering at ~130 Hz** (near F0) with 60 dB/oct rolloff effectively removes all verbal content but retains F0 contour -- useful as a masking technique reference

### F0 Measurement Method
- F0 extracted via autocorrelation of 31-ms segments of smoothed pitch from digitized speech
- Parameters: mean F0, F0 standard deviation
- Contour categorized as "rise" or "fall" based on final pitch movement (high vs. low boundary tone, cf. Pierrehumbert 1980)

## Relationship to Other Papers
- Builds on Scherer & Oshinsky (1977) -- cue utilization in emotion attribution from auditory stimuli
- Uses Pierrehumbert (1980) intonation framework for contour categorization
- Related to Ladd et al. (in press, 1984) -- further theoretical discussion of configuration model
- Extends Lieberman & Michaels (1962) and Lieberman (1962) work on F0 and emotion
- Williams & Stevens (1972) -- emotion and speech acoustical correlates

## Collection Cross-References

### Already in Collection
- [[Pierrehumbert_1980_EnglishIntonation]] — Pierrehumbert 1980 intonation framework used for categorizing contours as rise vs. fall (high vs. low boundary tone)

### Cited By (in Collection)
- [[Ladd_1985_IndependentFunctionIntonation]] — cites Scherer et al. 1984 as predecessor study testing continuous vs categorical vocal cue distinction; Ladd is a co-author on both papers
- [[Caballero_2018_SoundOfImpoliteness]] — cites for covariance vs configuration models of how acoustic cues encode affect
- [[ZeiPollermann_2002_AcousticPatternsEmotions]] — uses the covariance model from Scherer et al. 1984 as theoretical framework
- [[Mozziconacci_2002_ProsodyEmotions]] — cites for covariance vs configuration approaches to affect
- [[Mozziconacci_1998_SpeechEmotionProsody]] — references for affect signaling methodology
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cites Scherer et al. 1984 for vocal cues to affect
- [[Goudbeek_2010_ValencePotencyVocalEmotion]] — cites for vocal affect testing methodology
- [[Murray_1993_SimulationEmotionSyntheticSpeech]] — cites Scherer 1984 for emotion component process approach

### New Leads (Not Yet in Collection)
- Laver (1980) — *The Phonetic Description of Voice Quality* — framework for voice quality parameters relevant to affect
- Williams & Stevens (1972) — "Emotion and speech: Some acoustical correlates" — foundational activation-vocal expression model
- Lieberman & Michaels (1962) — F0 and envelope amplitude related to emotional content

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [[Gobl_2003_VoiceQualityEmotion]] — Scherer et al. demonstrate that voice quality conveys affect independently of text (covariance model), and Gobl & Chasaide 2003 provide the specific Klatt synthesis parameter values (AV, OQ, TL, spectral tilt) that produce perceived voice quality differences for different emotions. Scherer identifies the channel; Gobl provides the synthesis implementation.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Burkhardt provides Klatt-parameter formulas for voice quality modification in emotional speech synthesis. Scherer's finding that voice quality operates as a parallel affect channel supports Burkhardt's approach of applying voice quality modifications as overlays on any text.
- [[Scherer_2001_VocalEmotionCrossCultural]] — Scherer's own later cross-cultural study extends the covariance/configuration framework to test universality of vocal emotion recognition, finding substantial cross-cultural agreement that supports the voice-quality-as-parallel-channel hypothesis.
- [[Ladd_1985_IndependentFunctionIntonation]] — direct successor study by overlapping author team that builds on the covariance/configuration distinction, proposing three independent prosodic dimensions (F0 range, voice quality, contour type) for affect signaling.
