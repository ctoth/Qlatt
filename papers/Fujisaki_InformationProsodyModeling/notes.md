# Information, Prosody, and Modeling — with Emphasis on Tonal Features of Speech

**Authors:** Hiroya Fujisaki
**Year:** Unknown (appears to be ~2003-2005 based on references)
**Venue:** Conference/Workshop paper (appears to be a keynote or invited talk)
**Affiliation:** Professor Emeritus, University of Tokyo

## One-Sentence Summary

Presents the Fujisaki model for F0 contour generation using superposition of phrase and accent commands filtered through critically-damped second-order systems, with physiological grounding and cross-linguistic validation.

## Problem Addressed

How to mathematically model the generation of fundamental frequency (F0) contours in speech in a way that:
1. Separates linguistic/paralinguistic information from physiological mechanisms
2. Applies across multiple languages with minimal modification
3. Has a principled physiological basis

## Key Contributions

1. **Command-Response Model**: F0 contour = baseline + phrase components + accent components
2. **Physiological Grounding**: Links model parameters to cricothyroid muscle mechanics
3. **Cross-Linguistic Validation**: Demonstrates model works for 14+ languages with language-specific command patterns
4. **Language Classification**: Groups languages by whether they use only positive accent commands or both positive/negative

## Methodology

Analysis-by-Synthesis: Given an observed F0 contour, decompose it into phrase and accent components by estimating the underlying commands, then verify by regenerating the contour.

## Key Equations

### Main F0 Generation Model

$$
\log_e F_0(t) = \log_e F_b + \sum_{i=1}^{I} A_{pi} G_p(t - T_{0i}) + \sum_{j=1}^{J} A_{aj} \{G_a(t - T_{1j}) - G_a(t - T_{2j})\}
$$

Where the components are:
- $F_b$: baseline fundamental frequency (speaker-dependent)
- $A_{pi}$: magnitude of the i-th phrase command (impulse)
- $A_{aj}$: amplitude of the j-th accent command (step)
- $T_{0i}$: timing of the i-th phrase command
- $T_{1j}$: onset of the j-th accent command
- $T_{2j}$: end of the j-th accent command

### Phrase Control Response (impulse response of critically-damped 2nd order system)

$$
G_p(t) = \begin{cases} \alpha^2 t \exp(-\alpha t), & t \geq 0 \\ 0, & t < 0 \end{cases}
$$

Where $\alpha$ = natural angular frequency of phrase control mechanism

### Accent Control Response (step response of critically-damped 2nd order system)

$$
G_a(t) = \begin{cases} \min[1 - (1 + \beta t) \exp(-\beta t), \gamma], & t \geq 0 \\ 0, & t < 0 \end{cases}
$$

Where:
- $\beta$ = natural angular frequency of accent control mechanism
- $\gamma$ = relative ceiling level of accent components (set to 0.9)

### Physiological Basis: Tension-Stiffness Relationship

$$
\frac{dT}{dl} = a + bT
$$

Leading to:
$$
T = T_0 \exp(bx)
$$

And since $F_0 = c_0 \sqrt{T/\sigma}$:
$$
\log_e F_0(t) = \log_e F_b + (b/2)x(t)
$$

Where $x(t)$ is the change in vocal cord length.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Baseline F0 | $F_b$ | Hz | Speaker-dependent | ~60-480 | Varies by speaker gender/age |
| Phrase natural frequency | $\alpha$ | rad/s | ~2-3 | Nearly constant | Controls phrase component decay |
| Accent natural frequency | $\beta$ | rad/s | ~20 | Nearly constant | Controls accent component rise/fall |
| Accent ceiling | $\gamma$ | ratio | 0.9 | - | Limits max accent contribution |
| Phrase command magnitude | $A_p$ | - | Variable | 0.3-1.0 typical | Positive; negative at utterance end |
| Accent command amplitude | $A_a$ | - | Variable | 0-0.8 typical | Always positive in Japanese; can be negative in tone languages |

### Command Timing (for Japanese)

| Command Type | Timing Relative to Segment |
|--------------|---------------------------|
| Accent onset ($T_{1j}$) | 40-50 ms before vowel onset of high mora |
| Accent end ($T_{2j}$) | 40-50 ms before segmental end of high mora |
| Phrase command ($T_{0i}$) | ~200 ms before utterance onset or major syntactic boundary |

## Implementation Details

### Data Structures
```
PhraseCommand:
  magnitude: float (Ap)
  timing: float (T0, seconds)

AccentCommand:
  amplitude: float (Aa)
  onset: float (T1, seconds)
  end: float (T2, seconds)

FujisakiModel:
  baseline_f0: float (Fb, Hz)
  alpha: float (phrase control frequency)
  beta: float (accent control frequency)
  gamma: float (accent ceiling, default 0.9)
  phrase_commands: list[PhraseCommand]
  accent_commands: list[AccentCommand]
```

### Generation Algorithm
1. Initialize: `log_f0(t) = log(Fb)` for all t
2. For each phrase command i:
   - Compute `Gp(t - T0i)` using impulse response formula
   - Add `Api * Gp(t - T0i)` to log_f0(t)
3. For each accent command j:
   - Compute `Ga(t - T1j)` and `Ga(t - T2j)` using step response formula
   - Add `Aaj * [Ga(t - T1j) - Ga(t - T2j)]` to log_f0(t)
4. Convert: `F0(t) = exp(log_f0(t))`

### Edge Cases
- Negative phrase commands at utterance-final position model the falling F0
- For tone languages (Chinese, Thai), accent commands can be negative
- Swedish lexical accent: Accent 1 = positive then negative; Accent 2 = negative then positive

## Figures of Interest

- **Fig 1 (page 1):** Information flow diagram showing how linguistic/paralinguistic/nonlinguistic information maps to speech features
- **Fig 3 (page 3):** Functional block diagram of the model - phrase and accent control mechanisms as parallel paths
- **Fig 4 (page 3):** Analysis-by-Synthesis example showing decomposition of Japanese F0 contour
- **Fig 8 (page 5):** Thyroid translation vs rotation by CT muscle parts
- **Fig 10 (page 6):** Cross-linguistic analysis examples (English, German, Greek, Korean, Polish, Spanish)
- **Fig 11 (page 7):** Standard Chinese with tone commands (At notation)
- **Fig 17-18 (page 9):** Mechanism of F0 lowering via thyrohyoid muscle

## Results Summary

- Model achieves "perceptually indistinguishable" F0 contours from natural speech
- Parameters $\alpha$ and $\beta$ are nearly constant across speakers and languages
- Only command patterns (timing, magnitude, polarity) differ between languages
- Validated on: Japanese, English, Estonian, German, Greek, Korean, Polish, Spanish, Standard Chinese, Thai, Swedish, Hindi, Portuguese

## Language Classification

| Group | Command Polarity | Languages |
|-------|-----------------|-----------|
| 1 | Positive only | English*, Estonian, German, Greek, Japanese, Korean, Polish, Spanish |
| 2 | Positive + Negative | Hindi, Portuguese, Swedish, Chinese (tones), Thai (tones) |

*Some English speakers use negative commands for paralinguistic emphasis

## Physiological Mechanisms

### Phrase Component (slow, global)
- Controlled by **pars obliqua** of cricothyroid muscle
- Causes **translation** of thyroid cartilage
- Larger time constant (~1/α)

### Accent Component (fast, local)
- Controlled by **pars recta** of cricothyroid muscle
- Causes **rotation** of thyroid cartilage around crico-thyroid joint
- Smaller time constant (~1/β)

### F0 Lowering (for negative commands)
- Involves **thyrohyoid (TH)** muscle
- Sternohyoid (SH) stabilizes hyoid bone
- TH contraction rotates thyroid in opposite direction to CT
- Supported by EMG studies in Chinese, Thai, Swedish

## Limitations

- Parameters γ fixed at 0.9 without strong justification
- Critically-damped assumption is approximation ("may not be exactly critically-damped")
- Model focuses only on F0, not intensity or duration
- Command extraction requires Analysis-by-Synthesis (not a closed-form solution)

## Relevance to Qlatt Project

**Direct Applicability:**
- Provides a principled way to generate F0 contours from linguistic structure
- Two-component model (phrase + accent) maps well to prosodic hierarchy
- Can replace ad-hoc F0 rules with parametric model

**Implementation Path:**
1. Implement Gp(t) and Ga(t) response functions
2. Define command timing rules for English (accent ~40-50ms before stressed vowel)
3. Add phrase commands at phrase boundaries (~200ms before)
4. Superpose in log domain, convert to Hz

**Key Insight:** The model separates what is speaker/language-dependent (commands) from what is physiologically universal (response functions).

## Open Questions

- [ ] What are good values for α and β for American English?
- [ ] How to automatically derive accent command timing from phoneme durations?
- [ ] How does this interact with microprosody (segmental perturbations)?
- [ ] Should phrase commands align with breath groups or syntactic phrases?

## Related Work Worth Reading

- Öhman, S., 1967. "Word and sentence intonation: A quantitative model" - Earlier quantitative model
- Fujisaki & Hirose, 1984. "Analysis of voice fundamental frequency contours for declarative sentences of Japanese" - Core model paper
- Mixdorff & Fujisaki, 1994. "Analysis of voice fundamental frequency contours of German utterances" - Application to Germanic language
- Taylor, 2000. "The Tilt model of intonation" - Alternative approach (already in papers collection)
