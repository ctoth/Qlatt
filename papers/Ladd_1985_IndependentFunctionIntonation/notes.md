# Ladd et al. 1985 — Evidence for the Independent Function of Intonation Contour Type, Voice Quality, and F0 Range in Signaling Speaker Affect

## Implementation-Relevant Findings

### Core Result: Three Independent Acoustic Channels for Affect

The study demonstrates that **intonation contour type**, **F0 range**, and **voice quality** function as largely independent acoustic variables in signaling speaker affect. ANOVA across three experiments found virtually no interactions between these variables.

This is directly relevant to a synthesizer's prosody model: these three dimensions can be controlled independently without worrying about cross-interactions.

### F0 Range Manipulation Formula

The paper provides an explicit formula for scaling F0 range relative to a speaker floor:

```
F0(range2) = Fr * [F0(range1) / Fr]^R
```

Where:
- `Fr` = speaker floor (bottom of speaking range), a speaker constant
- `R` = range parameter (1.0 = baseline)
- F0 targets are scaled relative to Fr on a **logarithmic** axis

**R values used in experiments:**
- Experiment I: R = 1.0 (narrow), R = 1.7 (wide)
- Experiment II: R = 0.75 (narrow), R = 1.25 (wide)
- Experiment III: R = 0.6, 0.8, 1.0, 1.2, 1.4 (five-level continuum)

**Speaker floor (Fr):** Approximated by taking the average value of the low endpoints of contours ending with an ordinary declarative fall.

**Note:** The formula somewhat exaggerates the effect of range expansion on target points that are already fairly high, but produces acceptable-sounding output.

### Contour Type Modeling: Anchor Point System

Contours were modeled as a sequence of F0 values at **six anchor points** corresponding to phonologically distinctive elements:
1. Beginning of contour (prehead)
2. First accent rise (two points: onset and peak)
3. Second accent fall (two points: peak and valley)
4. End of contour (endpoint)

**Two contour types studied:**
- **Downtrend**: Gradual fall between accents; downstepped second peak; first accent peak reached early (first syllable of accented word)
- **Uptrend**: Gradual rise between accents; raised second peak; delayed first peak (second syllable of accented word)

Both types: begin mid-range, end at bottom of range. Both show sharp rise on first accent and fall on second.

**Interpolation:** Quadratic spline function (Hirst 1983) between anchor points.

**Segmental perturbations:** V-shaped dips, ~15 Hz deep and ~70 ms wide, centered over voiced consonants. These improve naturalness and intelligibility.

**Intrinsic pitch compensation:** Anchor points at accents adjusted per vowel:
- /i/ (high vowel): +0.5 semitone relative to /y/
- /a/ (low vowel): -1.0 semitone relative to /i/
- Prehead and endpoint F0 not adjusted across text types.

### Affect Signaling Patterns

**F0 Range effects (strongest, most consistent across experiments):**
- Wide range -> more aroused, annoyed, involved, emphatic, contradicting, reproachful
- Wide range -> less cooperative
- Largest effect sizes on arousal judgments (d > 5.0 in Experiment I)
- Effect is **continuous** (linear), not categorical — confirmed by trend analysis in Experiment III (all 8 scales had highly significant linear trends, p < 0.002)

**Voice Quality effects:**
- Harsh voice -> more aroused, annoyed, involved, emphatic, reproachful
- Harsh voice -> less cooperative, more deceitful, more arrogant
- Voice quality has a **valence** component (positive/negative evaluation) that range lacks
- Surprise related to RANGE only, not voice quality

**Contour Type effects (weaker, less consistent):**
- Uptrend -> more emphatic, stronger contradiction, less cooperative
- Uptrend also affects arousal scales (possibly artifactual — see footnote 6)

**Effect size benchmarks (Cohen's d):**
- d = 0.2 small, d = 0.8 large
- Range and voice quality effects on arousal: d > 3.5 (very large)
- Contour effects: d ~ 1.5-2.0

### Resynthesis Method

- Digitized at 16 kHz
- Linear prediction analysis: 29 filter coefficients, 98% pre-emphasis, 256-point windows overlapped by 64 points
- Voice quality differences captured in LP filter coefficients and survived F0 manipulation
- Interactive F0 modification using FRED software (Silverman 1985)

### Key Design Insight for Synthesizers

The absence of interactions means a synthesizer can implement these three dimensions as **orthogonal controls**:
1. F0 range (R parameter) — continuous, scales all targets relative to speaker floor
2. Contour type — categorical choice between contour shapes (phonological)
3. Voice quality — independent spectral/source manipulation

This maps naturally onto Klatt synthesizer parameters:
- F0 range -> scale F0 targets using the R formula
- Contour type -> different F0 contour templates/rules
- Voice quality -> source parameters (AV, TL, OQ, spectral tilt) and possibly formant bandwidths
