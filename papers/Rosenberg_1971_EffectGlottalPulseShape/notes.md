# Rosenberg 1971 - Effect of Glottal Pulse Shape on the Quality of Natural Vowels

## Implementation-Focused Notes

### Overview

Pitch-synchronous analysis-resynthesis study investigating which glottal pulse shapes produce the most natural-sounding synthetic vowels. Uses inverse filtering to extract the natural excitation, then substitutes simulated excitation waveforms with controlled pulse shapes.

### Key Result: Preferred Pulse Shape

**The "Rosenberg pulse" (type B or C) -- a pulse with a single slope discontinuity at glottal closure -- is consistently preferred over all other shapes tested.**

### Pulse Shape Parameterization (Fig. 2)

- **T**: pitch period
- **T_P**: opening time (positive slope portion)
- **T_N**: closing time (negative slope portion)
- Pulse amplitude held constant; only T_P/T and T_N/T ratios vary
- Parameters expressed as percentages of the period

### Experiment I: Six Pulse Shapes Tested (Fig. 3)

All shapes tested with T_P/T = 0.40 (40%) and T_N/T = 0.16 (16%).

| Shape | Description | Slope Discontinuities | Spectral Decay |
|-------|-------------|----------------------|----------------|
| A | Triangle | 3 (opening, peak, closing) | 12 dB/oct |
| B | Polynomial (two polynomials joined at t=T_P) | 1 (at closing) | 12 dB/oct |
| C | Trigonometric (two trig functions joined at t=T_P) | 1 (at closing) | 12 dB/oct |
| D | Trigonometric (smooth everywhere) | 0 | 18 dB/oct |
| E | Trigonometric (discontinuities at opening and closing) | 2 (opening + closing) | 12 dB/oct |
| F | Trapezoid (truncated triangle) | 4 | 12 dB/oct |

### Pulse Shape Equations (from Fig. 3)

For a = 1000, T_P = 40, T_N = 16:

**Opening phase** (0 <= t <= T_P):
- f_A = a * (t / T_P)  -- linear ramp
- f_B = a * [3(t/T_P)^2 - 2(t/T_P)^3]  -- polynomial S-curve
- f_C = (a/2) * [1 - cos(t/T_P * pi)]  -- raised cosine
- f_D = (a/2) * [1 - cos(t/T_P * pi)]  -- same as C during opening
- f_E = a * sin(t/T_P * pi/2)  -- quarter sine
- f_F = (3a/2) * (t/T_P), capped at <= a  -- steep linear ramp

**Closing phase** (T_P <= t <= T_P + T_N):
- f_A = a * [1 - (t - T_P)/T_N]  -- linear descent
- f_B = a * [1 - ((t - T_P)/T_N)^2]  -- quadratic descent
- f_C = a * cos((t - T_P)/T_N * pi/2)  -- cosine descent
- f_D = (a/2) * [1 + cos((t - T_P)/T_N * pi/2)]  -- smoother cosine
- f_E = a * cos((t - T_P)/T_N * pi/2)  -- same as C during closing
- f_F = (3a/2) * [1 - ((t - T_P)/T_N)], capped at <= a  -- steep linear descent

### Experiment I Results (Fig. 4): Preference Ranking

For CVC syllables (HAYED, HOD, HODE):
1. **N** (Natural) -- highest
2. **B** (Polynomial, 1 discontinuity at closure)
3. **C** (Trigonometric, 1 discontinuity at closure)
4. **E** (2 discontinuities)
5. **A** (Triangle, 3 discontinuities)
6. **F** (Trapezoid, 4 discontinuities) -- tied last
6. **D** (No discontinuities, 18 dB/oct) -- tied last

For sentence ("FEW THIEVES ARE NEVER SENT TO THE JUG"):
1. **B** (Polynomial)
2. **C** (Trigonometric)
3. **N** (Natural) -- ranked third!
4. **E**, **A**, **D**, **F** -- lower

**Key finding**: Preference order matches the order of *increasing* slope discontinuities, EXCEPT shape D (no discontinuities) ranks worst. The critical feature is having exactly one slope discontinuity at closure.

### Experiment II: Opening/Closing Time Ratios (Fig. 5)

Using pulse shape C, 16 combinations of T_P/T and T_N/T tested:
- T_P/T values: {0.10, 0.18, 0.33, 0.60}
- T_N/T values: {0.04, 0.09, 0.19, 0.40}

**Preferred region** (top 6 rankings, both utterances):
- T_P/T in {0.33, 0.60} AND T_N/T in {0.09, 0.19, 0.40}
- Excludes: smallest T_P/T (0.10), smallest T_N/T (0.04), and cases where T_P/T <= T_N/T

**Best match to natural excitation**: T_P/T = 0.40, T_N/T = 0.16 (approximately center of preferred area)

**Rules for acceptable pulse shapes:**
1. Opening time must be greater than closing time (T_P > T_N)
2. Neither opening nor closing time should be very small
3. Broad tolerance within these constraints

### Spectral Implications

1. **12 dB/oct source spectral decay is essential** -- shapes with first-derivative discontinuities (all except D) produce this. Shape D at 18 dB/oct is too steep and sounds poor.
2. **6 dB/oct is also poor** -- discontinuous pulses (e.g., rectangular) with 6 dB/oct decay also sound bad (footnote 13).
3. **Avoid symmetric pulse shapes** -- symmetric pulses have spectral zeros on the j-omega axis, creating sharp spectral dips that can cancel formant peaks. Asymmetric shapes (B, C) avoid this.
4. **Spectral irregularities increase when T_P/T <= T_N/T** -- matches the finding that such shapes are not preferred.

### Observed Natural Excitation Properties (from inverse filtering)

For the low-pitched male speaker used:
- Duty cycle (open time / period) somewhat less than 50%
- Single sharp slope discontinuity at closure
- Excitation is "clean" and pulse-like
- Typical of low-pitched males speaking moderately loud

### Relevance to Klatt Synthesizer

The Rosenberg pulse shapes B and C are direct predecessors to the source models used in the Klatt synthesizer. Klatt (1980) cites Rosenberg as the basis for the default glottal source waveform. The key parameters map as follows:
- T_P/T corresponds to the open quotient (OQ) in later models
- T_N/T corresponds to the speed quotient complement
- The requirement for 12 dB/oct spectral tilt matches the Klatt source design
- The preferred ratio T_P > T_N (opening slower than closing) is the fundamental asymmetry built into all subsequent glottal models (LF, KLGLOTT88, etc.)

### Implementation Parameters for Qlatt

For a default "Rosenberg C" pulse in the synthesizer:
- **T_P/T = 0.40** (40% of period is opening phase)
- **T_N/T = 0.16** (16% of period is closing phase)
- **Duty cycle = T_P/T + T_N/T = 0.56** (56% open)
- Opening phase: raised cosine from 0 to peak
- Closing phase: cosine quarter-wave from peak to 0
- Single slope discontinuity at closure (t = T_P + T_N)

### Citations in This Paper

1. Rosenberg 1969 - Computer-controlled subjective evaluation system
2. Miller 1959 - Nature of the vocal cord wave (inverse filtering pioneer)
3. Mathews, Miller & David 1961a - Pitch synchronous analysis
4. Mathews, Miller & David 1961b - Accurate glottal waveshape estimate
5. Miller & Mathews 1963 - Glottal waveshape by automatic inverse filtering
6. Holmes 1962a - Volume velocity waveform at larynx (inverse filter)
7. Holmes 1962b - Effect of simulating natural larynx behavior on quality
8. Michaels, Soron, Strong & Lieberman 1961 - Glottal waveshape estimate
9. Michaels & Strong 1965 - Analysis-synthesis of glottal excitation
10. Cramer 1958 - Mathematical Methods of Statistics
11. Flanagan 1958 - Some Properties of the Glottal Sound Source
12. Flanagan 1961 - Some Influences of the Glottal Wave upon Vowel Quality
13. Dunn, Flanagan & Gestrin 1962 - Complex Zeros of Triangular Approximation to Glottal Wave

## Collection Cross-References

### Already in Collection
- `Flanagan_1958_PropertiesGlottalSoundSource` — Flanagan 1958, properties of glottal sound source; cited as ref 11
- `Holmes_1973_GlottalWaveformParallelFormant` — Holmes related work on glottal waveform in parallel formant synthesis
- `Holmes_1983_FormantSynthesizersCascadeParallel` — Holmes cascade/parallel formant synthesizer design

### Cited By (in Collection)
- `Klatt_1990_VoiceQualityVariations` — discusses Rosenberg pulse shapes in context of voice quality
- `Doval_2003_VoiceSourceCALM` — references Rosenberg pulse shape in survey of source models
- `Doval_2006_SpectrumGlottalFlowModels` — references in spectral analysis of source models
- `Childers_Lee_1991_VoiceQualityFactors` — references Rosenberg pulse shapes
- `Fant_1985_LFModelGlottalFlow` — LF model supersedes Rosenberg pulse with more parameters
- `Gobl_2021_LFModelFrequencyDomain` — discusses Rosenberg in context of LF model frequency domain
- `Cummings_1995_GlottalExcitationEmotionalSpeech` — references Rosenberg source model

### New Leads
- Miller 1959 — Nature of the vocal cord wave (inverse filtering pioneer)
- Mathews, Miller & David 1961 — Pitch synchronous analysis / glottal waveshape estimation

### Conceptual Links (not citation-based)
- `Fant_1988_LFFrequencyDomainInterpretation` — Frequency-domain analysis of LF model, the successor to Rosenberg's simpler pulse shapes
- `Sun_2006_VocalTractGlottalSource` — Joint estimation of source and tract, building on the source-filter separation assumption Rosenberg explicitly noted
- `Plumpe_1999_GlottalFlowDerivativeModeling` — Glottal flow derivative modeling extends Rosenberg's work on pulse shape parameterization
