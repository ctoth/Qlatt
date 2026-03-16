---
title: "Acoustic Correlates of Task Load and Stress"
authors: "K. R. Scherer, D. Grandjean, T. Johnstone, G. Klasmeyer, T. Banziger"
year: "~2002 (conference paper, undated; part of EMOVOX project)"
venue: "Conference proceedings (appears to be ICSLP or similar)"
doi_url: "N/A"
---

# Acoustic Correlates of Task Load and Stress

## One-Sentence Summary
Cognitive load and psychological stress produce distinguishable acoustic effects on speech: load primarily increases speech rate and energy attack/decay gradients, while stress primarily affects F0 and spectral energy distribution, with large individual differences moderating both effects.

## Problem Addressed
Prior research on vocal correlates of stress suffered from two problems: (1) failure to distinguish cognitive load from psychological stress, and (2) reliance on single-case or few-speaker studies. This study uses 100 speakers across three languages with controlled experimental induction to separate load from stress effects.

## Key Contributions
- Distinguishes cognitive load vs psychological stress effects on voice
- N=100 speakers (25 German, 16 English, 59 French)
- Computer-aided emotion induction via dual-task paradigm
- Split-attention task creates both load (single vs dual task) and stress (anticipation of difficult task)
- Shows mean results hide large individual differences in stress responsivity

## Methodology
- Speakers performed logic deduction tasks while speaking standard phrases
- Single task (low load/low stress) vs dual task (high load/high stress)
- Before vs during task comparison for load; single vs dual task for stress
- Speech recorded via headset condenser microphone
- Automatic acoustic analysis: speech rate, energy gradients, F0, spectral energy distribution
- Repeated measures ANOVA with Load (low/high) x Stress (low/high)

## Parameters

### Cognitive Load Effects (highly significant):
| Parameter | Effect | p |
|-----------|--------|---|
| Speech rate (avg syllable duration) | Faster under high load (0.255 vs 0.285 s) | <.001 |
| Energy attack gradient | Steeper under high load | .005 |
| Energy decay gradient | Steeper under high load | .011 (interaction) |

### Psychological Stress Effects:
| Parameter | Effect | p |
|-----------|--------|---|
| Mean F0 | Higher under stress (~2 Hz increase on average) | .01 |
| F0 variability (SD) | Marginal trend | .09 |
| Proportion of energy below 500 Hz | Decreased under stress (from ~0.66 to ~0.63) | <.001 |
| Proportion of energy 500-1600 Hz | Increased under stress | corresponding |

### Individual Differences:
- Only ~55 speakers (N=55) showed F0 change in predicted direction
- For those 55: significant stress effect on proportion of energy below 500 Hz and 500-1600 Hz increase
- No correlation between F0 mean and spectral parameters (r not significant)
- Self-report stress correlated only with syllable duration (r=-.28, p=.014)

## Figures of Interest
- **Fig 1 (page 3):** Speech rate differences between load and stress levels -- clear load effect, no stress effect
- **Fig 2 (page 3):** Energy decay gradient -- interaction between load and stress
- **Fig 3 (page 3):** Mean F0 differences -- stress effect visible, no clear load effect
- **Fig 4 (page 3):** Proportion of energy below 500 Hz -- load effect dominant

## Limitations
- Conference paper format (4 pages) -- limited detail
- Stress induction works only for subset of speakers
- Self-report stress is unreliable measure (only correlated with syllable duration)
- Average effects are small (~2 Hz F0 change) and may not be useful as parameter estimates
- Three language groups -- no major between-language differences reported but not fully analyzed

## Testable Properties
- Cognitive load should increase speech rate without affecting F0
- Psychological stress should increase F0 without strongly affecting speech rate
- High load should steepen energy attack and decay gradients
- Stress effects should show in spectral energy distribution (less energy below 500 Hz, more in 500-1600 Hz)
- Individual differences should be large: not all speakers show expected stress patterns

## Relevance to Project
This paper provides the key distinction between cognitive load and psychological stress effects on voice, which is important for designing voice presets that sound "busy/focused" vs "anxious/stressed." For Qlatt, the findings suggest: (1) to simulate cognitive load, increase speech rate and steepen energy envelopes without changing F0; (2) to simulate stress, raise F0 slightly and shift spectral energy upward. However, the effect sizes are small and individual differences are large, making these parameters guidelines rather than firm targets.

## Open Questions
- [ ] What are the actual mean F0 values (not just ~2 Hz difference)?
- [ ] Do the spectral effects correspond to specific formant changes or global tilt?
- [ ] How do these load/stress effects interact with emotional speech effects?

## Collection Cross-References

### Already in Collection (cited or citing)
- [[Banse_1996_VocalEmotionAcousticProfiles]] — Same senior author (Scherer). Banse & Scherer 1996 established acoustic profiles for 14 emotions; this paper extends their work by separating cognitive load from psychological stress as distinct influences on voice.
- [[Scherer_2001_VocalEmotionCrossCultural]] — Same author. The 2001 cross-cultural emotion study provides the broader theoretical framework (appraisal theory) within which this task-load/stress study operates.

### Conceptual Links (not citation-based)
- [[Gobl_2003_VoiceQualityEmotion]] — Strong. Gobl maps voice quality dimensions (breathy, tense, etc.) to emotional categories. This paper's finding that stress shifts spectral energy upward (less below 500 Hz, more 500-1600 Hz) corresponds to increased vocal tension, connecting to Gobl's tense voice quality profile for negative emotions.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Strong. Burkhardt synthesizes emotional speech using formant parameters. This paper's load/stress acoustic distinctions (rate vs F0/spectral) provide synthesis guidance: cognitive load presets should modify rate and energy envelopes, while stress presets should modify F0 and spectral tilt.
- [[Weninger_2013_AcousticsEmotionAudio]] — Moderate. Weninger finds loudness is the primary cross-domain arousal correlate. This paper's finding that energy attack/decay gradients change with cognitive load (but not stress) suggests energy dynamics encode load specifically, while F0 and spectral distribution encode stress/arousal.
- [[Mozziconacci_1998_SpeechEmotionProsody]] — Moderate. Mozziconacci maps Dutch emotion prosody patterns; this paper adds the critical distinction that F0 changes reflect psychological stress rather than cognitive load.
- [[ZeiPollermann_2002_AcousticPatternsEmotions]] — Moderate. Zei Pollermann identifies acoustic patterns across emotion categories; this paper's load-vs-stress distinction provides a mechanistic decomposition of what drives those patterns.
- [[Eyben_2015_GeMAPS_AcousticParameters]] — Moderate. GeMAPS includes many of the same acoustic features (F0, energy, spectral) used here; this paper's finding that different features index load vs stress informs which GeMAPS features to use for each dimension.

## Related Work Worth Reading
- Scherer, K. R. (1986). Vocal affect expression: A review and a model for future research. Psych. Bull., 99: 143-165.
- Banse, R. and Scherer, K. R. (1996). Acoustic emotion profiles. Already in collection.
- Tolkmitt, F. J. and Scherer, K. R. (1986). Effects of experimentally induced stress on vocal parameters. J. Exp. Psychol Hum Percept. Perform. 12: 302-313.
