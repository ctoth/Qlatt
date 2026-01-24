# Anticipatory Coarticulation in Predictive Articulatory Speech Modeling

**Authors:** Konstantin Sering, Fabian Tomaschek, Motoki Saito
**Year:** 2020
**Venue:** 12th International Seminar on Speech Production (ISSP 2020)
**Affiliation:** Eberhard Karls Universität Tübingen

## One-Sentence Summary

Compares segment-based and recurrent gradient-based resynthesis approaches for producing anticipatory coarticulation in VocalTractLab, finding that gradient-based planning captures formant-level coarticulation but not articulatory tongue raising.

## Problem Addressed

How well do automatic speech resynthesis methods capture anticipatory coarticulation - the phenomenon where articulatory patterns are modified in advance of upcoming phones? This is critical for natural-sounding synthesis.

## Key Contributions

1. Quantitative comparison of two resynthesis frameworks against human ultrasound data
2. Demonstrates that segment-based synthesis produces NO anticipatory coarticulation
3. Shows gradient-based planning captures acoustic (formant) coarticulation but fails at articulatory (tongue raising) coarticulation
4. Provides methodology for evaluating coarticulation using both acoustic and articulatory measures

## Methodology

### VocalTractLab (VTL) Simulator
- Version 2.3
- 3D vocal tract model (tongue, jaw, lips, glottis, sub-glottal pressure)
- Quasi-1D acoustic simulation (good up to 5000 Hz)
- **30 control parameters (cps)** defined every 110 samples (2.5 ms), linearly interpolated
- Output: 44100 Hz mono audio
- Computation: ~3 seconds per second of synthesized speech
- No muscle/motor control constraints

### Segment-Based Resynthesis
- Uses phone labels + durations from forced alignment
- VTL 2.3 API synthesizes directly from segment file
- Blends gestures for adjacent phones
- **Limitation:** Only models local phone-to-phone coarticulation, not anticipatory V-to-V coarticulation

### Recurrent Gradient-Based Resynthesis (Figure 1)
Three components:
1. **Forward Model (Predictive):** 2×350 LSTM cells + linear layer + downsampling + Conv-Resid + ReLU
2. **Inverse Model:** 2×512 LSTM cells + linear layer + upsampling + Conv-Resid
3. **VTL Simulator:** Physical ground truth

Process:
1. Initialize cp-trajectories using inverse model on target acoustics
2. Forward model predicts acoustic representation
3. Joint loss minimization:
   - **Jerk/velocity loss** on cp-trajectories (favors constant position/velocity)
   - **MSE loss** between predicted and target acoustics
4. Planning iterates 40 times
5. Forward model updated with new training sample + 10 old samples (prevents forgetting)

### Acoustic Representation
- Log-mel spectrum
- 200 Hz temporal rate
- 60 dimensions
- 10 Hz to 12,000 Hz range
- Window size: 23.2 ms

## Parameters

| Name | Value | Units | Notes |
|------|-------|-------|-------|
| VTL control parameters | 30 | dimensions | Tongue, jaw, lips, glottis |
| cp update rate | 110 | samples | 2.5 ms at 44100 Hz |
| Audio sample rate | 44100 | Hz | Mono |
| Mel spectrum rate | 200 | Hz | 5 ms frames |
| Mel dimensions | 60 | bands | 10-12000 Hz |
| Mel window | 23.2 | ms | |
| Planning iterations | 40 | cycles | Compromise accuracy/time |
| Forward LSTM cells | 2×350 | units | |
| Inverse LSTM cells | 2×512 | units | |
| Ultrasound rate | 81.6 | fps | |
| Ultrasound vectors | 64 | directions | |
| Ultrasound pixels | 842 | per vector | Depth resolution |
| Formant analysis window | 20 | ms | Before /a/ offset |
| Pitch floor | 50 | Hz | Praat setting |
| Pitch ceiling | 350 | Hz | Praat setting |

## Experimental Setup

- **Stimuli:** /baba/, /babi/, /babu/ (pseudo-words)
- **Speaker:** Single male (first author)
- **Speaking rates:** 6 conditions (1-6 repetitions in 3 seconds)
- **Analysis focus:** Second fastest rate (5 repetitions)
- **Sessions:** 3
- **Recordings analyzed:** 90 total (30 per pseudo-word)
- **Alignment:** Montreal Forced Aligner

### Coarticulation Measures

1. **Formant shifts:** F1, F2 in 20 ms before offset of first /a/
   - Expected: F1 lower in /babi/, /babu/ vs /baba/
   - Expected: F2 higher in /babi/, lower in /babu/ vs /baba/

2. **Tongue raising:** Height difference (offset - midpoint) of first /a/
   - Measured relative to lower teeth (ultrasound reference frame)
   - Expected: Greatest raising in /babi/, moderate in /babu/, none in /baba/

## Results Summary

### Formant Shifts (Figure 2)
| Condition | Human | Segment-based | Gradient-based |
|-----------|-------|---------------|----------------|
| F1 coarticulation | Yes (lower in /babi/, /babu/) | No | Yes (partial) |
| F2 coarticulation | Yes (/babi/ higher, /babu/ lower) | No | Yes (partial) |
| F1 decreasing trend | Yes | Yes | Yes |
| F2 decreasing trend | Yes | No | No |

### Tongue Raising (Figure 3)
| Condition | Human | Segment-based | Gradient-based |
|-----------|-------|---------------|----------------|
| /baba/ | ~0 (no raising) | Lowering | Raising |
| /babi/ | Strongest raising | Lowering | Raising |
| /babu/ | Moderate raising | Lowering | Raising |
| Differential pattern | Yes | No | No |

## Key Findings

1. **Segment-based synthesis fails** to produce any anticipatory vowel-to-vowel coarticulation
2. **Gradient-based planning** captures formant-level coarticulation but achieves it through different articulatory means than humans
3. The gradient-based method has **too high variability** compared to human recordings
4. Neither method captures the **differential tongue raising pattern** that distinguishes /babi/ and /babu/ from /baba/

## Limitations

1. Single speaker (first author)
2. VTL lacks muscle/motor control constraints
3. Ultrasound reference frame is jaw-relative, not palate-relative
4. VTL quasi-1D acoustics only accurate up to 5000 Hz
5. High computation time (~3 sec per sec synthesized)

## Relevance to Qlatt Project

### Direct Relevance: LOW-MEDIUM
This paper focuses on articulatory synthesis (VocalTractLab) rather than formant synthesis (Klatt). However, several insights apply:

1. **Coarticulation is acoustic, not just articulatory:** Formant transitions need to anticipate upcoming vowels, not just blend between adjacent phones
2. **Segment-based approaches have inherent limitations:** Phone-to-phone blending doesn't capture long-range anticipatory effects
3. **Formant shift patterns for /a/ coarticulation:**
   - Before /i/: F1 lowers, F2 raises
   - Before /u/: F1 lowers, F2 lowers

### Implementation Insight
For Klatt synthesis, implementing anticipatory coarticulation requires:
- Looking ahead in the phoneme sequence
- Modifying formant targets based on upcoming vowels (not just adjacent phones)
- Current segment-based interpolation may be insufficient for natural V-to-V coarticulation

## Figures of Interest

- **Fig 1 (page 3):** Full architecture of recurrent gradient-based framework with LSTM networks
- **Fig 2 (page 5):** Six-panel comparison of F1/F2 trajectories across conditions
- **Fig 3 (page 6):** Tongue raising comparison (human vs both synthesis methods)
- **Fig 4 (page 7):** Ultrasound vs VTL tongue positions for /babi/ and /baba/

## Open Questions

- [ ] How far ahead should anticipatory coarticulation look? (This paper uses V1-V2 in CVCV)
- [ ] What is the optimal formant interpolation function for capturing anticipatory effects?
- [ ] Can jerk/velocity constraints improve formant trajectory naturalness in Klatt synthesis?

## Related Work Worth Reading

- Öhman (1966) - Original coarticulation in VCV utterances
- Birkholz (2013) - Modeling consonant-vowel coarticulation for articulatory synthesis
- Fougeron & Keating (1997) - Articulatory strengthening at prosodic boundaries
- Tomaschek et al. (2018, 2020) - Lexical effects on articulation

## Technical Notes

### Loss Function for Gradient-Based Planning
Joint optimization of:
1. **Smoothness:** Jerk loss + velocity loss on cp-trajectories
2. **Acoustic match:** MSE between predicted and target log-mel spectrum

This combination encourages trajectories that are both acoustically accurate and biomechanically plausible (constant force approximation).

### Continual Learning
Forward model updated after each resynthesis with:
- 1 new sample (just synthesized)
- 10 old samples (replay buffer to prevent catastrophic forgetting)
