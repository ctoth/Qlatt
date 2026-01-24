# A Model for Synthesizing Speech by Rule

**Authors:** Lawrence R. Rabiner
**Year:** 1969 (presented 1968)
**Venue:** IEEE Transactions on Audio and Electroacoustics, Vol. AU-17, No. 1, pp. 7-13
**DOI:** 10.1109/TAU.1969.1162023

## One-Sentence Summary
Presents a complete synthesis-by-rule architecture with a two-stage transformation strategy: linguistic preprocessing followed by interdependent segmental (formant contours via critically-damped differential equations) and suprasegmental (F0 via subglottal pressure model) models.

## Problem Addressed
Converting discrete phoneme symbols to continuous synthesizer control signals requires inserting the redundancy removed at input (50-100 bps input → 30,000 bps output speech). Fixed phoneme durations cannot account for stress, reduction, or consonant lengthening.

## Key Contributions
1. Two-stage synthesis strategy: preprocessing + segmental/suprasegmental models
2. Critically-damped differential equation model for smooth formant transitions
3. Frequency region metric for dynamic timing control (not fixed durations)
4. Physiological F0 model based on subglottal pressure (Ps) and laryngeal tension (LT)
5. Three-component F0 contour: archetypal + stress perturbation + consonant perturbation

## Architecture

### Overall Model (Fig. 1)
```
Discrete Input Symbols → Synthesis Strategy → Continuous Control Signals → Speech Synthesizer → Speech
                              ↑
                    Linguistic Rules + Stored Rules/Data
```

### Synthesis Strategy Detail (Fig. 3)
```
Discrete Input {P1, P2, ..., Pn}
        ↓
   PREPROCESSOR ← Linguistic Rules
        ↓
Modified Input {P'1, P'2, ..., P'k}
        ↓
   ┌────────────────────────────────┐
   │                                │
   ↓                                ↓
SEGMENTAL MODEL          SUPRASEGMENTAL MODEL
(Formant + timing)       (F0 control)
   │                                │
   └──────← bidirectional →─────────┘
   ↓                                ↓
Formant Controls              F0 Control
+ Other Controls
```

### Synthesizer (Fig. 2)
Same as companion paper - serial terminal analog with:
- Pitch impulse generator + frication generator
- Voiced fricative excitation network
- Nasal branch (NPOL, NZER, ANASAL)
- Higher-pole correction network
- 20 kHz sampling, 100 Hz control rate

## Key Equations

### Formant Contour Differential Equation
$$
\frac{d^2 f_N(t)}{dt^2} + \frac{2}{\tau_{AB}^N} \frac{df_N(t)}{dt} + \frac{1}{(\tau_{AB}^N)^2} f_N(t) = \frac{P_N(t)}{(\tau_{AB}^N)^2}
$$
Where:
- $N$ = formant number (1, 2, or 3)
- $P_N(t)$ = step functions for Nth formant targets
- $f_N(t)$ = formant contour response
- $\tau_{AB}^N$ = time constant between phonemes A and B for formant N

### Step Response (from rest)
$$
f_N(t) = A_f + (A_i - A_f)(1 + t/\tau) \exp(-t/\tau); \quad t \geq 0
$$
Where:
- $A_i$ = initial formant value
- $A_f$ = final (target) formant value
- $\tau$ = time constant

### General Response (non-zero initial velocity)
$$
f_N(t) = A_f + (A_i - A_f) \exp(-t/\tau) + \left[ V_i + \frac{(A_i - A_f)}{\tau} \right] t \exp(-t/\tau); \quad t \geq 0
$$
Where:
- $V_i = \frac{df_N}{dt}\bigg|_{0^-}$ = initial formant velocity

**Key property**: Both value AND slope are continuous at target change times.

## Parameters

### System Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| Sampling rate | 20 kHz | Output |
| Control rate | 100 Hz | Parameter updates |
| Input info rate | 50-100 bps | Information-bearing elements only |
| Output info rate | ~30,000 bps | Full speech redundancy |

### Segmental Model Parameters
| Parameter | Description | Notes |
|-----------|-------------|-------|
| Target positions | Steady-state formant values per phoneme | Virtual for noncontinuants |
| Frequency regions (Δ) | Tolerance bands around targets | Control timing |
| Time constants (τ) | Independent per formant, per transition | Control transition rate |
| Phoneme influence | 2 phonemes | Coarticulation window |

### Suprasegmental Model Parameters
| Parameter | Symbol | Value | Notes |
|-----------|--------|-------|-------|
| Max F0 stress rise | - | 32 Hz | For stress level 1 vowel |
| F0 consonant perturbation | - | ±20 Hz | +voiced, -voiceless |
| Laryngeal tension | LT | Constant | Except yes-no questions |

### F0 Contour Components (Fig. 6)
| Component | Description |
|-----------|-------------|
| Archetypal contour | Utterance-level declination |
| Stress perturbation | Local rise proportional to log(stress level) |
| Consonant perturbation | Rise for voiced, fall for voiceless |

## Implementation Details

### Preprocessing Steps
1. **Choose speech quantum**: Phoneme (simplest), diphone, syllable, or word
2. **Usage transcription**: Replace book forms with spoken forms
   - /ðə/ → /də/ (the)
   - /ænd/ → drop final /d/ (and)
   - /æn/ → /ən/ (an)
3. **Linguistic substitution rules**:
   - Intervocalic /t/ → /d/ (writer)
   - Voiced consonant near unvoiced → unvoiced (abscond: /b/ → voiceless)
4. **Syntactic structure** (not implemented): Modifiers from parsing

### Timing Control Algorithm
1. Each phoneme has target positions + frequency regions (Δ values)
2. Transition to next phoneme initiated when ALL formants within their Δ regions
3. For stressed vowels: suprasegmental model determines lengthening
4. Frequency regions can be modified by preprocessor for contextual effects

### Formant Contour Generation (Fig. 4)
- Two formants shown with independent time constants (τ₁₂, τ₂₃, τ₃₄)
- Phoneme transitions at t₁, t₂, t₃ triggered by frequency region criterion
- Smooth exponential transitions between all targets

## Input Format
Example: "We saw the cat" with emphasis on "cat":
```
W-IY-STR3-SPACE-S-OW-STR2-SPACE-THE-UH-SPACE-K-AE-STR1-T-END
```
IPA: /wi³ sɔ² ðə kæt¹/

Input includes: phonemes, vowel stress marks (1-4), word/sentence markers, pauses, punctuation. No POS tagging.

## Figures of Interest
- **Fig. 1 (p. 2)**: Overall synthesis-by-rule model
- **Fig. 2 (p. 3)**: Block diagram of serial terminal analog synthesizer
- **Fig. 3 (p. 3)**: Expanded synthesis strategy with segmental/suprasegmental interaction
- **Fig. 4 (p. 5)**: Two-formant contour example showing frequency regions and timing
- **Fig. 5 (p. 5)**: Real formant + F0 contours for "What does Bob do?"
- **Fig. 6 (p. 6)**: Ps contour composition from three components

## Results Summary
- VCV tests: ~80% intelligibility
- Simple declarative sentences: ~90% intelligibility
- Beranek's difficult sentences: ~80% (high variance across subjects)
- F0 model favored over alternatives in comparative tests

## Limitations
1. **Timing**: Major unsolved problem; intelligible but unnatural rhythm
2. **Buzziness**: Synthetic voiced speech sounds very buzzy
3. **Source control**: No dynamic glottal source shaping, only pulse rate
4. **Syntactic rules**: Not implemented despite acknowledged importance
5. **Source-system interaction**: Acknowledged but not modeled (F1 effects on source)

## Relevance to Qlatt Project
- **Direct application**: Differential equation formant model provides smooth transitions
- **Timing metric**: Frequency region approach superior to fixed durations
- **F0 model**: Three-component Ps contour usable for prosody generation
- **Preprocessing**: Usage transcription rules for natural pronunciation
- **Architecture validation**: Confirms segmental/suprasegmental separation

## Open Questions
- [ ] Optimal time constant values τ for different phoneme transitions?
- [ ] Exact frequency region (Δ) values used?
- [ ] How does the Lieberman F0 model [9] compare to later approaches?
- [ ] What causes the "buzziness" and how to reduce it?

## Related Work Worth Reading
- Rabiner (1968) - "Speech synthesis by rule: an acoustic domain approach" (Bell Sys. Tech. J.) - Full implementation details [5]
- Rabiner (1968) - "Digital formant synthesizer" (JASA) - Synthesizer details [6]
- Flanagan (1965) - Speech Analysis, Synthesis and Perception - Theory [7]
- Lieberman (1967) - Intonation, Perception and Language - F0 model basis [9]
- Pickett & Coulter (1966) - F2 statistics and prediction [8]
