---
title: "Effect of Vocal Effort on Spectral Properties of Vowels"
authors: "Jean-Sylvain Liénard, Maria-Gabriella Di Benedetto"
year: 1999
venue: "Journal of the Acoustical Society of America, Vol. 106, No. 1"
doi_url: "S0001-4966(99)02707-1"
---

# Effect of Vocal Effort on Spectral Properties of Vowels

## One-Sentence Summary
Quantifies how vocal effort (soft to loud speech) systematically modifies F0, F1, and formant amplitudes in vowels, providing empirical rates (5 Hz/dB for F0, 3.5 Hz/dB for F1) and spectral tilt changes essential for synthesizing natural loudness variation.

## Problem Addressed
Speech synthesis systems need to model how acoustic parameters change with vocal effort (speaking softly vs loudly) to produce natural-sounding speech across different loudness levels, but the quantitative relationships between effort and acoustic parameters were not well established for everyday conversational ranges.

## Key Contributions
- Established linear relationship: F0 increases at ~5 Hz/dB of vocal effort
- Established correlated relationship: F1 increases at ~3.5 Hz/dB of vocal effort
- F2 and F3 do NOT vary significantly with vocal effort
- Spectral tilt changes: higher formants increase MORE than lower formants (A1: 1.1 dB/dB, A2: 1.24 dB/dB, A3: 1.30 dB/dB)
- Vowel triangle shifts upward in F1 (not expanding/contracting) with increased effort

## Methodology
- CORENC database: 9 French oral vowels, 10 speakers (5M/5F), 3 distance conditions
- Distance conditions induced vocal effort: Close (0.4m), Normal (1.5m), Far (6m) → ~9 dB dynamic range
- Manual measurement of F0, F1, F2, F3, A1, A2, A3, A, AX from narrow-band spectra
- Three-way ANOVA (speaker × vowel × distance condition)
- Perceptual validation confirmed vowel identity preserved across effort levels

## Key Equations

### F0 vs Vocal Effort (Linear)
$$
\Delta F0 = 5.1 \cdot \Delta AX \text{ (Hz/dB)}
$$
Where: $r^2 = 0.75$, AX = maximum amplitude in dB

### F1 vs Vocal Effort (Correlated but not strongly linear)
$$
\Delta F1 \approx 3.5 \cdot \Delta AX \text{ (Hz/dB)}
$$
Where: $r^2 = 0.18$ (Spearman rank correlation = 0.41)

### Formant Amplitude vs Overall Amplitude
$$
A1 = 1.10 \cdot AX \text{ (dB/dB)}
$$
$$
A2 = 1.24 \cdot AX \text{ (dB/dB)}
$$
$$
A3 = 1.30 \cdot AX \text{ (dB/dB)}
$$

### Spectral Center of Gravity (for formant integration)
$$
F_{23} = \frac{A2 \cdot F2 + A3 \cdot F3}{A2 + A3}
$$
Where: A2, A3 in linear (not dB) units

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| F0 rate | - | Hz/dB | 5.1 | - | Linear with vocal effort |
| F1 rate | - | Hz/dB | 3.5 | - | Correlated, not strictly linear |
| A1 rate | - | dB/dB | 1.10 | - | Per dB increase in AX |
| A2 rate | - | dB/dB | 1.24 | - | Per dB increase in AX |
| A3 rate | - | dB/dB | 1.30 | - | Per dB increase in AX |
| Effort range | - | dB | 9 | ~40 total | Within-speaker C→F |
| Front/back threshold | - | Bark | 3.5 | - | F3-F2 < 3.5 = front vowel |

## Implementation Details

### For Synthesis (Vocal Effort Modeling)
1. **Base case**: Establish neutral (normal) F0, F1, formant amplitudes
2. **Increase effort**:
   - Add 5.1 Hz to F0 per dB increase in target amplitude
   - Add 3.5 Hz to F1 per dB increase
   - Keep F2, F3 unchanged
   - Scale A1 by 1.10×, A2 by 1.24×, A3 by 1.30× per dB
3. **Decrease effort**: Reverse the above relationships

### Spectral Tilt Implementation
For 10 dB increase in overall amplitude:
- A1 increases by 11 dB
- A2 increases by 12.4 dB
- A3 increases by 13 dB

This creates "spectral tilt" - high frequencies become relatively more prominent in loud speech.

### Key Insight for Vowel Space
The vowel triangle **shifts upward** in F1 with increased vocal effort, rather than expanding or contracting. This means:
- Vowel identity is preserved
- Only the F1 dimension moves
- F2 dimension remains stable

## Figures of Interest
- **Fig. 1 (p. 415):** A1, A2, A3 vs distance condition per speaker - shows consistent increase pattern
- **Fig. 3 (p. 416):** AX and formant amplitudes as function of distance - key rate data
- **Fig. 4 (p. 418):** Normalized F0, F1 vs AX - shows linear/correlated relationships
- **Fig. 5 (p. 418):** F1 vs F2 vowel plane across conditions - shows upward shift, not expansion

## Results Summary
- F0: highly linear correlation with AX ($r^2 = 0.75$), 5.1 Hz/dB
- F1: significant correlation (Spearman = 0.41), ~3.5 Hz/dB, high scatter
- F2, F3: NO significant variation with vocal effort
- All formant amplitudes increase with effort, but differentially (spectral tilt)
- Vowel identity preserved despite acoustic changes (9.3% perceptual error rate)

## Limitations
- French vowels only (9 oral vowels)
- Isolated vowels, not connected speech
- Everyday effort range only (~9 dB), not extreme shouting/whispering
- Manual measurements introduce some variability
- Linear F1 correlation weak ($r^2 = 0.18$) though rank correlation significant

## Relevance to Project

### Direct Application to Qlatt
1. **Prosody/Stress modeling**: Spectral tilt changes (A1/A2/A3 rates) can implement prominence/stress
2. **Loudness variation**: F0 and F1 shifts with AV parameter changes
3. **Emotional speech**: Loud = angry, soft = intimate - these relationships provide acoustic basis
4. **Lombard effect**: Same mechanisms apply when speaking in noise

### Implementation Suggestions
- Add `vocalEffort` parameter (dB) that modulates:
  - F0 base: `F0 = F0_base + 5.1 * vocalEffort`
  - F1: `F1 = F1_target + 3.5 * vocalEffort`
  - Formant gains: differential scaling per above rates
- Could tie to overall `GO` (master gain) parameter

## Open Questions
- [ ] Does the F1-F0 correlation hold for English vowels in connected speech?
- [ ] How do these relationships interact with intrinsic F0 (vowel-specific pitch)?
- [ ] Can spectral tilt alone convey effort perception without F0/F1 changes?
- [ ] What happens at extremes (whisper, shout) beyond this study's range?

## Related Work Worth Reading
- Schulman (1989) - Shouted speech (extreme vocal effort)
- Junqua (1993) - Lombard speech (noise-induced effort)
- Sluijter & Van Heuven (1996) - Spectral balance and stress
- Traunmüller (1981) - F1-F0 perceptual relationship
- Syrdal & Gopal (1986) - Auditory vowel representation
- Granström & Nord (1992) - Long-term spectral effects of speaking style

---

## Collection Cross-References

### Already in Collection
- [[Henrich_2005_GlottalOpenQuotientSinging]] -- cites Lienard for vocal effort and spectral characteristics

### Conceptual Links (not citation-based)
- [[Herbst_2015_GlottalAdductionSubglottalPressure]] — Moderate. Lienard quantifies how vocal effort modifies spectral tilt and F0 from the radiated speech perspective; Herbst measures the same phenomenon at the source level (pressure-adduction interactions), providing the physiological mechanism behind Lienard's acoustic observations.

### New Leads (Not Yet in Collection)
- **Sluijter & Van Heuven (1996)** - Directly relevant: shows spectral balance (same effect as spectral tilt) is a cue for linguistic stress. Critical for implementing stress/prominence in synthesis.
- **Junqua (1993)** - Lombard effect (speech in noise) produces similar acoustic changes. Important for robust synthesis that adapts to noisy environments.
- **Syrdal & Gopal (1986)** - Auditory vowel representation using Bark-scale formant differences. Useful for understanding perceptual stability across vocal effort changes.
- **Granström & Nord (1992)** - "Neglected dimensions in speech synthesis" - explicitly addresses what synthesis systems miss, including speaking style effects.
- **Chistovich et al. (1979)** - Spectral center of gravity effect. Foundational for understanding how formant proximity affects vowel perception - relevant to the F3-F2 < 3.5 Bark criterion for front vowels.
