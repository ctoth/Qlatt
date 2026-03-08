# Acoustic Correlates of Task Load and Stress

**Authors:** K. R. Scherer, D. Grandjean, T. Johnstone, G. Klasmeyer, T. Banziger
**Year:** ~2002 (conference paper, undated; part of EMOVOX project)
**Venue:** Conference proceedings (appears to be ICSLP or similar)
**DOI:** N/A

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

## Related Work Worth Reading
- Scherer, K. R. (1986). Vocal affect expression: A review and a model for future research. Psych. Bull., 99: 143-165.
- Banse, R. and Scherer, K. R. (1996). Acoustic emotion profiles. Already in collection.
- Tolkmitt, F. J. and Scherer, K. R. (1986). Effects of experimentally induced stress on vocal parameters. J. Exp. Psychol Hum Percept. Perform. 12: 302-313.
