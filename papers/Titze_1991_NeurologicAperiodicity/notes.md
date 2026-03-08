# A Model for Neurologic Sources of Aperiodicity in Vocal Fold Vibration

**Authors:** Ingo R. Titze
**Year:** 1991
**Venue:** Journal of Speech and Hearing Research, 34(3), 460-472
**DOI:** 10.1044/jshr.3403.460

## One-Sentence Summary
Provides a quantitative model of how motor unit twitch summation in laryngeal muscles produces fundamental frequency (F0) perturbation (jitter), predicting perturbation magnitudes of 0.2-1.2% as a function of motor unit count, firing rate, twitch amplitude variability, and interspike interval variability.

## Problem Addressed
Voice perturbation analysis (jitter, shimmer) has been used clinically but lacked a physiologic basis connecting neurologic muscle control to F0 perturbation. This paper models how the stochastic firing of motor neurons in thyroarytenoid (TA) and cricothyroid (CT) muscles creates a ripple in vocal fold tension, which in turn creates fundamental frequency perturbation.

## Key Contributions
- Mathematical model of single muscle twitch as a two-parameter exponential: $f(t) = A e \alpha t e^{-\alpha t}$
- Extension to summation of twitches from multiple motor units firing at random intervals
- Derivation of F0 perturbation from the force ripple via $\Delta T \propto 2 F_o \Delta F_o$ (Eq. 2)
- Quantitative predictions: F0 perturbation (CV and JIT) ranges from 0.2% to 1.2% depending on model parameters
- Demonstration that neurologic jitter is a significant fraction of total measured jitter in normal voices
- Identification of quasi-periodic components in the F0 contour at motor unit firing frequencies (0-50 Hz range)

## Methodology
1. Model a single TA muscle twitch using a two-parameter function (Eq. 3)
2. Sum twitches from N motor units within a single motor unit group (Eq. 4)
3. Extend to M motor unit groups with random phase offsets (Eq. 7-8)
4. Add randomness to interspike intervals (Eq. 6) and twitch amplitudes (Eq. 7)
5. Compute F0 contour from force via $T \propto F_o^2$ relationship
6. Calculate jitter (JIT) and coefficient of variation (CV) from the simulated F0 contour
7. Vary four parameters independently: number of motor units, mean firing rate, CV of twitch amplitude, CV of interspike interval
8. Validate against measured human jitter values (0.2-0.3% for normal subjects)

## Key Equations

### Single twitch model (two-parameter)
$$
f(t) = A e \alpha t \, e^{-\alpha t}
$$
where $A$ is the force amplitude (peak value of the twitch), $e = 2.71...$, and $\alpha^{-1}$ is the contraction time. Shown as dashed line in Figure 1(a). (Eq. 3)

### Tension-frequency relationship
$$
T \propto F_o^2
$$
(Eq. 1, from simple vibrating string model)

### Frequency-force proportionality
$$
\Delta T \propto 2 F_o \Delta F_o
$$
(Eq. 2) The fundamental frequency twitch $\Delta F_o$ and force twitch $\Delta T$ are proportional, but the proportionality constant depends on the absolute value of $F_o$.

### Summation across N twitches within one motor unit (periodic firing)
$$
F(t) = \sum_{j=1}^{N} A \alpha e(t - t_j) e^{-\alpha(t - t_j)} \, u(t - t_j)
$$
(Eq. 4) where $t_j$ is the activation time of the $j$th twitch, $u(t - t_j)$ is a unit step function.

### Periodic activation times
$$
t_j = j\mu, \quad j = 1, \ldots, N
$$
(Eq. 5) where $\mu$ is the mean firing period.

### Random activation times (single motor unit)
$$
t_j = R(j\mu, \, \nu\mu)
$$
$$
= \mu R(j, \nu) \quad j = 1, N
$$
(Eq. 6) where $R(x, y)$ is a Gaussian random number generator with mean $x$ and standard deviation $y$; $\mu$ is the mean firing period; $\nu$ is the coefficient of variation of the firing period.

### Summation across M motor units
$$
F(t) = \sum_{k=1}^{M} \sum_{j=1}^{N} A_k \alpha_k e(t - t_{jk}) e^{-\alpha(t - t_{jk})} \, u(t - t_{jk})
$$
(Eq. 7) where $M$ is the total number of motor units, $A_k$ is the peak force of the $k$th motor unit twitch, $\alpha_k^{-1}$ is the contraction time.

### Activation time with random phase across motor units
$$
t_{jk} = \mu R_k(j, \nu) + R'_k(0, \mu)
$$
(Eq. 8) where $R'_k$ selects an arbitrary phase (starting time) for the $k$th motor unit.

### Jitter (JIT) measure
$$
\text{JIT} = \frac{1}{\bar{F}_o} \frac{1}{N} \sum_{i=1}^{N} |F_{o_i} - F_{o_{i-1}}|
$$
(Eq. 9) Mean rectified adjacent-cycle difference in the $F_o$ contour, normalized to mean $F_o$.

### Coefficient of Variation (CV) measure
$$
\text{CV} = \frac{1}{\bar{F}_o} \left[ \frac{1}{N} \sum_{i=1}^{N} (F_{o_i} - \bar{F}_o)^2 \right]^{1/2}
$$
(Eq. 10) Standard deviation of the $F_o$ contour normalized to mean $F_o$.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Number of motor units | M | - | 100 | 2-200 | ~100 in TA/CT muscles (Faaborg-Anderson 1957) |
| Mean firing rate | $1/\mu$ | Hz | 25 | 5-100 | Tetanus at ~90 Hz for TA; typical phonation ~25 Hz |
| Force amplitude | $A_k$ | N (normalized) | varies | - | Peak value of kth motor unit twitch |
| Contraction time | $\alpha^{-1}$ | ms | ~20-35 | - | TA: ~20 ms; CT: ~35 ms (from Figure 1) |
| CV of twitch amplitude | - | - | 1.0 | 0-1.0 | Coefficient of variation of $A_k$ across motor units |
| CV of interspike interval (ISI) | $\nu$ | - | 0.14 | 0-0.2 | Measured: 14% for human TA (Titze et al. 1989) |
| Mean F0 | $F_o$ | Hz | 100 | - | Target fundamental frequency |
| Sampling window for CV/JIT | - | s | 5.0 | - | 500 samples at 100 Hz F0 contour sampling |

## Implementation Details

### Algorithm for simulating neurologic jitter:
1. Choose parameters: M (motor units), mean firing rate, CV of twitch amplitude, CV of ISI
2. For each motor unit k = 1..M:
   - Assign random twitch amplitude $A_k$ (Gaussian with specified CV)
   - Assign random phase offset $R'_k(0, \mu)$
   - For each firing j = 1..N:
     - Compute firing time $t_{jk}$ using Eq. 8 (Gaussian jitter on periodic firing)
     - Ensure $t_{jk} > 0$ (keep positive to avoid backward twitches)
3. Compute total force $F(t)$ by summing all twitches (Eq. 7)
4. Convert force to F0 contour: $F_o(t) \propto \sqrt{F(t)}$ (from Eq. 1)
5. Extract period-by-period F0 values
6. Compute JIT (Eq. 9) and CV (Eq. 10)

### Key implementation notes:
- The twitch function $f(t) = Ae\alpha t \cdot e^{-\alpha t}$ has its peak at $t = \alpha^{-1}$ with value $A$
- Contraction time for TA is about 20 ms, for CT about 35 ms
- Tetanus (fused twitches) occurs at about 90-100 Hz firing rate for TA
- At normal phonation firing rates (~25 Hz), individual twitches are not fully fused, creating force ripple
- The force ripple has quasi-periodic components at the motor unit firing frequencies
- For the F0 contour, $\Delta F_o / F_o = \frac{1}{2} \Delta T / T$ (from differentiation of $T \propto F_o^2$)

### Edge cases:
- At very high firing rates (>90 Hz), twitches fuse and force ripple disappears
- With few motor units (2-5), force shows large discrete peaks
- With many motor units (100+), force becomes very smooth
- CV of twitch amplitude approaching 1.0 means some motor units dominate (realistic)

## Figures of Interest
- **Fig 1 (page 461):** Measured vs modeled muscle twitches for TA and CT. Shows the two-parameter model fits well. TA twitch peaks at ~20 ms, CT at ~35 ms.
- **Fig 3 (page 463):** Summation of periodic twitches at various rates. Tetanus fuses at ~90 Hz. Shows how force ripple decreases with higher firing rate.
- **Fig 5 (page 464):** ISI distribution from a human TA motor unit. Mean 87 ms (11.5 Hz), CV = 14%.
- **Fig 6 (page 465):** Effect of ISI coefficient of variation on force contour from one large motor unit. CV=0 is periodic, CV=0.1 shows moderate randomness, CV=1.0 shows chaotic firing.
- **Fig 7 (page 465):** Effect of number of motor units (2, 5, 100) on force smoothness. With 100 units, force is nearly constant despite random phases.
- **Fig 8 (page 467):** 100 motor units with random twitch amplitudes (CV=1). Force spectrum shows major peak at 25 Hz (mean firing rate) with sidebands.
- **Fig 10 (page 469):** Main results -- F0 perturbation (CV and JIT) as function of (a) number of motor units, (b) mean firing rate, (c) CV of twitch amplitude, (d) CV of ISI. Key reference figure for implementation.
- **Fig 11 (page 470):** Real F0 contour from a male subject phonating steady [a] at ~100 Hz. Shows ~3 Hz periodicity in the contour, attributed to motor unit tremor.

## Results Summary

### Predicted F0 perturbation ranges (from Figure 10):
- **Number of motor units (Fig 10a):** CV decreases from ~1.2% (2 units) to ~0.3% (100 units). JIT follows similar trend but lower.
- **Mean firing rate (Fig 10b):** CV decreases from ~0.6% (10 Hz) to ~0.05% (100 Hz). Higher firing rate = less perturbation.
- **CV of twitch amplitude (Fig 10c):** CV increases from ~0.25% (CV=0) to ~0.45% (CV=1.0). JIT from ~0.2% to ~0.35%.
- **CV of ISI (Fig 10d):** CV increases from ~0.2% (CV=0) to ~0.8% (CV=0.2). JIT from ~0.1% to ~0.5%.

### Baseline normal voice prediction:
With 100 motor units, 25 Hz mean firing rate, CV of twitch amplitude = 1.0, and CV of ISI = 0.14:
- **Predicted F0 perturbation: 0.2-0.3%** (both CV and JIT)
- This matches measured values in normal subjects (Titze, Horii, & Scherer 1987)
- Neurologic jitter appears to be a significant portion of total jitter in normal voices

### Real voice analysis (Figure 11):
- Male subject phonating steady [a] at 99.8 Hz mean F0
- CV = 0.91%, JIT = 0.60% (total, including all sources)
- F0 contour spectrum shows peaks at 3 Hz, 10 Hz, 17 Hz (attributed to motor neuron firing)
- 3 Hz peak may be involuntary tremor

## Limitations
- Model uses only TA muscle; CT not independently modeled
- Assumes $T \propto F_o^2$ (simple string model) which is approximate for real vocal folds
- Does not model recruitment and synchronization processes in detail
- Does not account for other sources of jitter: mucus, turbulence, biomechanical nonlinearity, left-right asymmetry
- ISI distribution verified for only one human subject
- Twitch amplitude distribution across motor units in laryngeal muscles is unknown (CV=1.0 is "an intelligent guess")
- Does not model the effect of vocal fold coupling back onto muscle tension

## Testable Properties
- F0 perturbation (CV) must be in range [0.05%, 1.5%] for reasonable parameter settings
- Increasing number of motor units must decrease F0 perturbation (monotonic)
- Increasing mean firing rate must decrease F0 perturbation (monotonic)
- Increasing CV of ISI must increase F0 perturbation (monotonic)
- Increasing CV of twitch amplitude must increase F0 perturbation (monotonic)
- JIT must always be less than or equal to CV for the same F0 contour
- Force contour spectrum must show a peak at the mean motor unit firing frequency
- At firing rates >= 90 Hz (tetanus), force ripple should approach zero

## Relevance to Project
This paper provides the physiological model needed to generate realistic F0 micro-perturbation (jitter) in synthesized speech. For the Qlatt synthesizer's speaker personality system:

1. **Jitter synthesis**: The model gives a principled way to add jitter that varies with speaker characteristics (age, pathology, effort level) rather than simple random noise injection
2. **Speaker profiles**: The four parameters (motor unit count, firing rate, twitch amplitude CV, ISI CV) map naturally to speaker voice quality dimensions
3. **Pathological voices**: Higher perturbation values (>1%) can model neurological disorders, aging voices, or vocal fatigue
4. **F0 contour realism**: The quasi-periodic components at motor unit firing frequencies (3-50 Hz) create more natural-sounding micro-variation than white noise jitter
5. **Effort modeling**: Mean firing rate increases with vocal effort, which would decrease jitter -- matching the observation that louder phonation is steadier

## Open Questions
- [ ] How does this interact with the LF glottal source model? The force ripple modulates tension, which modulates both F0 and possibly open quotient
- [ ] Should we model TA and CT independently with different twitch characteristics?
- [ ] What are realistic motor unit counts and firing rates across the pitch range?
- [ ] How to couple this with the F0 contour from the prosody system (additive perturbation on top of prosodic F0?)
- [ ] Can the 3-Hz tremor component be used to differentiate normal aging from pathological tremor?

## Related Work Worth Reading
- Baer, T. (1979). Vocal jitter: A neuromuscular explanation. *Transcripts of the English Symposium on Care of the Professional Voice* (pp. 19-22). -- Foundation work showing single motor unit twitches affect F0
- Horii, Y. (1979). Fundamental frequency perturbation observed in sustained phonation. *JSHR, 22*, 5-19. -- Measured jitter values for comparison
- Titze, I. R., Luschei, E. S., & Hirano, M. (1989). Role of the thyroarytenoid muscle in regulation of fundamental frequency. *J Voice, 3*(3), 213-224. -- TA muscle role in F0 control
- Larson, C., Kempster, G., & Kistler, M. (1987). Changes in voice fundamental frequency following discharge of single motor units in cricothyroid and thyroarytenoid muscles. *JSHR, 30*, 552-558. -- Direct evidence of single motor unit effects on F0
- Pinto, N., & Titze, I. R. (1990). Unification of perturbation measures in speech signals. *JASA*. -- Perturbation measure definitions

## Collection Cross-References

### Already in Collection
- (none of the key citations are in the collection)

### Cited By (in Collection)
- **Herzel_1994_VocalDisordersNonlinearDynamics** — lists Titze 1991 in Related Work as a complementary model of aperiodicity from neurologic sources (vs. their nonlinear dynamics approach)
- **Zhang_2021_LaryngealSizeSexDifferences** — cites Alipour-Haghighi & Titze 1991 (a related paper by the same group on elastic models of vocal fold tissues)
- **Steinecke_1995_BifurcationsVocalFold** — cites Wong, Ito, Cox & Titze 1991 (a related paper applying lumped-element perturbation models to pathological cases)

### New Leads (Not Yet in Collection)
- Baer, T. (1979) — "Vocal jitter: A neuromuscular explanation" — foundation work that motivated this model; showed single motor unit twitches measurably affect F0
- Horii, Y. (1979) — "Fundamental frequency perturbation observed in sustained phonation" — provides the measured baseline jitter values (0.2-0.3% for normal voices) that validate this model
- Larson, C., Kempster, G., & Kistler, M. (1987) — "Changes in voice fundamental frequency following discharge of single motor units" — direct experimental evidence that single motor unit discharge in CT and TA causes F0 perturbation

### Conceptual Links (not citation-based)

**Aperiodicity mechanisms (different sources, same phenomenon):**
- **Herzel_1994_VocalDisordersNonlinearDynamics** — Strong. Both papers model sources of aperiodicity in vocal fold vibration but from fundamentally different mechanisms: Titze models stochastic neurologic input (motor neuron firing randomness → tension ripple → jitter), while Herzel models deterministic nonlinear dynamics (biomechanical chaos, bifurcations → subharmonics, period doubling). Titze explicitly lists biomechanical nonlinearity as a separate source of jitter (item (e) in Introduction). Together they partition the jitter budget: neurologic jitter contributes 0.2-0.3% in normal voices; nonlinear dynamics contributes additional aperiodicity especially in pathological voices.
- **Steinecke_1995_BifurcationsVocalFold** — Strong. Steinecke models how left-right vocal fold asymmetry produces bifurcations (period-doubling, chaos) — another aperiodicity source that Titze explicitly excludes. The two models are complementary: Titze's neurologic jitter operates even with perfectly symmetric folds, while Steinecke's bifurcation phenomena require asymmetry.

**Jitter synthesis for voice quality:**
- **Fraj_2011_BreathyRoughVoices** — Strong. Fraj provides a practical jitter synthesis algorithm (sample-by-sample phase perturbation, Eq. 1) that implements jitter as a signal-level effect, while Titze provides the physiological model that determines what the jitter magnitude should be. Titze's model predicts 0.2-1.2% F0 perturbation; Fraj's corpus maps jitter control parameter b to measured jitter% (2.6-35.8%). The two papers are mechanism (Titze) and implementation (Fraj) for the same phenomenon.
- **Gobl_2003_VoiceQualityEmotion** — Moderate. Gobl's voice quality synthesis uses the DI (diplophonia) parameter to create creaky/harsh voice qualities, but does not model the neurologic origin of F0 perturbation. Titze's model could inform how DI and jitter parameters should covary with speaker characteristics and emotional state.
- **Burkhardt_2009_VoiceQualityFormantSynthesis** — Moderate. Burkhardt's FL (flutter/jitter) parameter simulates F0 perturbation in a Klatt-type synthesizer. Titze's model provides the physiological basis for setting FL values based on speaker characteristics rather than arbitrary settings.
