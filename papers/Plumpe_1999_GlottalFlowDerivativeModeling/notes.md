# Modeling of the Glottal Flow Derivative Waveform with Application to Speaker Identification

**Authors:** Michael D. Plumpe, Thomas F. Quatieri, Douglas A. Reynolds
**Year:** 1999
**Venue:** IEEE Transactions on Speech and Audio Processing, Vol. 7, No. 5, September 1999
**Publisher Item Identifier:** S 1063-6676(99)06562-1

## One-Sentence Summary
Presents an automatic technique for decomposing the glottal flow derivative into coarse structure (LF model) and fine structure (aspiration, ripple from source-vocal tract interaction), with NL2SOL nonlinear least-squares fitting of LF parameters and application to GMM-based speaker identification.

## Problem Addressed
Prior glottal flow analysis methods relied on linear prediction error residuals or cepstral features that did not explicitly model the temporal structure of the glottal flow derivative. This paper develops a complete pipeline: inverse filtering via closed-phase estimation, LF model fitting to the coarse structure, and energy-based characterization of the fine structure (aspiration + ripple from source-filter interaction), yielding features that capture speaker-dependent glottal characteristics not available from standard mel-cepstral analysis.

## Key Contributions
- Automatic estimation of glottal flow derivative from speech via inverse filtering during a statistically-identified closed phase
- Decomposition into **coarse structure** (piecewise LF model) and **fine structure** (aspiration + ripple from source/vocal tract interaction)
- Closed-phase detection via formant modulation stationarity (first formant tracks formant frequency change function)
- Two-window covariance method for high-pitch speakers where closed phase is very short
- NL2SOL nonlinear least-squares algorithm for fitting 7 LF parameters per pitch period with physically motivated bounds
- Feature set combining coarse (7 LF params) and fine (5 energy + 3 formant modulation) parameters for speaker ID
- Demonstration that source features contain significant speaker-dependent information complementary to vocal tract features
- Combined source + filter features achieve ~93.7% SID accuracy on TIMIT; 5% error reduction on NTIMIT when added to mel-cepstra

## Methodology

### Overall Pipeline (Fig. 1)
```
Speech → Pitch/Voicing → Glottal Flow Derivative Estimation → Coarse Structure Model → Coarse Glottal Features
                                            ↓                                              ↓
                                       Synthesize ← Coarse Structure                    Speaker ID
                                            ↓
                                    Fine Structure Model → Fine Glottal Features
```

### Glottal Flow Model (Section II)
Speech production viewed as linear filtering: source $u_g(t)$ excites vocal tract $h(t)$, lip radiation approximated by differentiation, giving speech pressure:

$$s(t) \approx d[u_g(t) * h(t)] / dt = [du_g(t)/dt] * h(t)$$

The glottal flow derivative $v_g(t) = \dot{u}_g(t)$ consists of:
1. **Coarse structure** $v_{gc}(t)$: general pulse shape (LF model)
2. **Fine structure** $v_{gf}(t) = v_g(t) - v_{gc}(t)$: ripple + aspiration

### Source-Vocal Tract Interaction (Section II-B)
Ananthapadmanabha and Fant [1] model: time-varying vocal tract impedance controlled by glottal area function creates formant frequency modulation. The approximate transfer function (pseudo-Laplace transform with time-varying coefficients):

$$H(s, t) = \frac{P_o(s, t)}{U_{gc}(s)} = \frac{s/C}{s^2 + B_1(t)s + \omega_1^2(t)} \tag{1}$$

where the time-varying first formant frequency and bandwidth are:

$$\omega_1(t) = \omega_0 \sqrt{1 + \alpha \dot{g}_o(t)}$$
$$B_1(t) = B_0[1 + \beta g_o(t)] \tag{2}$$

$\omega_0$, $B_0$ = first formant frequency/bandwidth; $g_o(t)$ = glottal area function; $\alpha$, $\beta$ = coupling constants.

### Approximate Glottal Flow Derivative

$$v_g(t) \approx v_{gc}(t) + f(t) e^{-0.5t B_1(t)} \cos\left[\int_0^t \omega_1(\tau)\,d\tau\right] \tag{3}$$

The second term is **ripple** — a sinusoidal-like perturbation at the first formant frequency, modulated by the time-varying source-filter coupling. The function $f(t)$ represents amplitude modulation controlled by glottal area.

## Key Equations

### LF Model for Glottal Flow Derivative (Eq. 4)

$$v_{LF}(t) = \begin{cases}
0 & 0 \le t < T_o \\
E_o e^{\alpha(t - T_o)} \sin[\omega_o(t - T_o)] & T_o \le t < T_e \\
-E_1[e^{-\beta(t - T_e)} - e^{-\beta(T_c - T_e)}] & T_e \le t < T_c
\end{cases} \tag{4}$$

where $E_1 = E_e / (1 - \exp(-\beta(T_c - T_e)))$, and $t = 0$ is the start of the closed phase (end of previous return phase).

### Covariance-Based Inverse Filtering (Eq. 5)

$$s[n] = \sum_{i=1}^{p} a_i s[n - i] + v_g[n] \tag{5}$$

All-pole model of order $p = 14$. Vocal tract filter estimated during closed phase via covariance method (preferred over autocorrelation for correct solution at any analysis window length $M > p$).

### Formant Change Function (Eq. 6)
Used to identify stationary (closed-phase) regions:

$$D(n_o) = \sum_{i=n_o}^{n_o+4} |F(i) - F(i-1)|, \quad 1 \le n_o < N - N_w - 5 \tag{6}$$

where $F(i)$ is the first formant value at sample $i$, $N$ is the pitch period in samples. The 5-sample window finds where formant modulation is minimal (= closed phase).

### Two-Window Covariance for High-Pitch Speakers (Eq. 7)

$$\phi_{i,j} = \sum_{n=M_1}^{M_1+L_1-1} s[n-i]s[n-j] + \sum_{n=M_2}^{M_2+L_2-1} s[n-i]s[n-j] \tag{7}$$

Two non-overlapping closed-phase windows from consecutive pitch periods, for speakers where a single closed phase is too short (< 2.1 ms). Used when pitch period < 6.5 ms empirically.

### LF Parameter Error Criterion (Eq. 8)

$$E(\vec{x}) = \sum_{n=0}^{N_o-1} \hat{v}_g^2[n] + \sum_{n=N_o}^{N_e-1} (\hat{v}_g[n] - E_o e^{\alpha(n-N_o)} \sin[\Omega_o(n-N_o)])^2 + \sum_{n=N_e}^{N_c-1} (\hat{v}_g[n] - E_1[e^{-\beta(N_e-N_e)} - e^{-\beta(n-N_e)}])^2 \tag{8}$$

Minimized using NL2SOL (Nonlinear Second-Order Least squares) algorithm with bounds constraints.

### Normalized Fine Structure Energy (Eq. 11)

$$E^i = \frac{1}{E_{tot}} \sum_{n=N_o}^{N_c-1} (\hat{v}_g[n] - \hat{v}_{gc}[n])^2 \tag{11}$$

Computed over 5 time intervals $I_1$ through $I_5$.

### Ripple (Formant Modulation) Model (Eq. 12)

$$F_1(t) = a + b(t - T_f) + cn^2 \tag{12}$$

where $e[n] = (a + bn + cn^2) - F_1[n]$, fitted over open-phase interval $I_5 = [T_f, T_c)$ via least median-of-squares regression.

### Normalized LF Timing Parameters (Eq. 17)

$$CQ = \frac{N_o - N_{c-1}}{N_c - N_{c-1}}; \quad OQ = \frac{N_e - N_o}{N_c - N_{c-1}}; \quad RQ = \frac{N_c - N_e}{N_c - N_{c-1}} \tag{17}$$

These normalize pitch out of the timing parameters.

## Parameters

| Name | Symbol | Units | Description | Notes |
|------|--------|-------|-------------|-------|
| Glottal opening time | $T_o$ | s | Time of glottal opening | Start of open phase |
| Shape parameter | $\alpha$ | 1/s | Ratio of $E_o$ to peak height of positive portion | Controls open-phase waveform shape |
| Open-phase frequency | $\omega_o$ | rad/s | Controls flow derivative curvature; determines zero-crossing to $T_e$ | |
| Glottal pulse time | $T_e$ | s | Time of maximum negative value | Most negative point = glottal closure instant |
| Peak amplitude | $E_e$ | - | Value of flow derivative at $T_e$ | Absolute value of negative peak |
| Return phase decay | $\beta$ | 1/s | Exponential time constant for return to zero | Controls spectral tilt |
| Glottal closure time | $T_c$ | s | Time of glottal closure | End of return phase |
| Closed quotient | CQ | ratio | Fraction of cycle that is closed | Normalized, pitch-independent |
| Open quotient | OQ | ratio | Fraction of cycle from opening to $T_e$ | Normalized, pitch-independent |
| Return quotient | RQ | ratio | Fraction of cycle from $T_e$ to closure | Normalized, pitch-independent |
| Fine-structure energy | $E^i$ | ratio | Normalized energy in 5 time intervals | $i = 1..5$ |
| Ripple parameters | $a, b, c$ | Hz, Hz/s, Hz/s² | Parabola fit to open-phase F1 modulation | $\Delta F_1$, slope, curvature |
| LP order | $p$ | - | Covariance LP filter order | Fixed at 14 |
| Analysis window | $N_w$ | samples | Covariance analysis window length | $N/4$ where $N$ = pitch period |
| Formant change window | 5 | samples | Size for formant stationarity test | Fixed |

## Implementation Details

### Closed-Phase Detection Algorithm (Fig. 6)
1. Track first formant frequency via sliding covariance LP + formant tracking (4 lowest poles < 500 Hz bandwidth, Viterbi search)
2. Compute formant change function $D(n_o)$ over 5-sample windows
3. Find minimum $D$ → initial stationary region $[N_1, N_2]$
4. Grow region to the right: include next sample if $|F(N_2+1) - F_{avg}| < 2\sigma_F$
5. Grow region to the left: include sample if within 2 standard deviations of mean (using final mean/std from right extension)
6. Result: stationary formant region → inverse filter during this interval

### LP Analysis Parameters
- Order: $p = 14$ (all-pole model)
- Window: rectangular, length $N_w = N/4$ (constrained: $p + 3 \le N_w \le 2p$)
- Frame update: one pitch period
- Sliding covariance with one-sample shift
- Formant tracking: 4 formants < 500 Hz BW, Viterbi search with frequency cost function

### Two-Window Method (High Pitch)
- Triggered when pitch period < 6.5 ms empirically
- Each half-window: slightly larger than $p/2$ samples
- Minimum closed-phase duration: 1.3 ms (five sequential windows × standard minimum window of 17 samples ÷ 5)
- Works for speakers up to ~200 Hz F0

### NL2SOL Fitting
- Fits 7 LF parameters per pitch period
- Uses both Gauss-Newton and full Newton steps (switches adaptively)
- Bounds: $\Omega_o > \pi$ (prevents negative open-phase flow), $E_e > 0$, $\beta > 0$
- Singularities: parameters at bounds → frame discarded (improves SID by ~15%)
- First- and second-order gradients computed via closed-form LF partial derivatives (with finite-difference approximation for Hessian second term)

### Feature Normalization for SID
- Timing parameters ($T_o$, $T_e$, $T_c$) normalized to pitch period → CQ, OQ, RQ
- Removes pitch as confounding variable
- Waveshape parameters ($\alpha$, $\omega_o$, $E_e$, $\beta$) + 3 timing = 7 coarse features
- 5 energy measures + 3 formant modulation = 8 fine features
- Complete source vector: 12 parameters per voiced frame

### GMM Speaker ID System
- 16 Gaussians, diagonal covariance
- EM training, 10 iterations, variance floor 0.0001
- Male/female models trained separately
- Outlier detection: frames with very low GMM probability discarded
- ~1/3 of voiced frames used after singularity + unvoiced removal

## Figures of Interest
- **Fig. 1 (p. 570):** Block diagram of the full system pipeline
- **Fig. 2 (p. 571):** Relation between glottal flow $u_{gc}(t)$ and its derivative $v_{gc}(t)$, showing closed/open/return phases
- **Fig. 3 (p. 571):** Glottal flow derivative showing coarse structure with ripple component overlaid
- **Fig. 4 (p. 572):** LF model waveform with parameter annotations ($T_o$, $T_e$, $T_c$, $\alpha$, $\omega_o$, $E_o$, $\beta$, $E_e$)
- **Fig. 5 (p. 573):** Time intervals for fine structure: (a) glottal flow derivative with intervals $I_1$-$I_5$; (b) first formant frequency modulation parabola
- **Fig. 6 (p. 575):** Flow chart for closed-phase detection via formant stationarity
- **Fig. 7 (p. 576):** Example of glottal flow derivative estimation steps: original speech, whitened speech, estimated derivative
- **Fig. 8 (p. 576):** Multiple estimated glottal flow derivatives showing speaker-dependent variation
- **Fig. 9 (p. 578):** Coarse vs fine structure decomposition with LF overlay and time interval labels
- **Fig. 10 (p. 579):** LF model fits for two speakers showing different timing characteristics
- **Fig. 11 (p. 580):** Fine structure examples showing ripple and aspiration in different glottal phases
- **Fig. 12 (p. 581):** Histograms of $\alpha$, OQ, and closed-phase energy for two speakers — show clear speaker separation
- **Fig. 13 (p. 582):** Effect of singularity removal on feature distributions
- **Fig. 14 (p. 585):** Atypical examples showing multiple excitation points within a glottal cycle

## Results Summary

### SNR for Closed-Phase Detection (Tables II, III)
Using F1 frequency gives much higher SNR than F1 bandwidth or F2:

| Measure | Male | Female |
|---------|------|--------|
| F1 Freq | 161 | 155 |
| F1 BW | 8.7 | 4.2 |
| F2 Freq | 42.7 | 59.4 |
| F2 BW | 1.2 | 0.9 |

### Speaker ID Accuracy on TIMIT (Table IV)

| Features | Male | Female |
|----------|------|--------|
| 7 LF coarse | 58.3% | 68.2% |
| 5 fine energy | 39.5% | 41.8% |
| 12 LF + energy (source) | 69.1% | 73.6% |
| 3 formant modulation | 7.6% | 16.4% |
| 14 LPC cepstral (filter) | 91.0% | 93.6% |
| 26 combined (LF+energy+cep) | 93.7% | 92.6% |

### Mel-Cepstral Comparison (Table V)

| Features | Male | Female |
|----------|------|--------|
| Modeled GFD mel-cepstra | 41.1% | 51.8% |
| Estimated GFD mel-cepstra | 95.1% | 95.5% |

### NTIMIT (Telephone Speech, Tables VI, VII)
Combined speech + source mel-cepstra: 60.0% male, 69.0% female (vs 56.7%/66.3% speech alone) — ~5% error reduction.

## Limitations
- NL2SOL fitting sometimes hits parameter bounds → singularities (~15% of frames discarded)
- Two-window method has minimum closed-phase duration of 1.3 ms; may fail for very high-pitched speakers (>200 Hz F0 with high open quotient)
- Formant modulation features contribute only marginally to SID (~7-16%)
- Phase distortion from telephone channels degrades glottal flow estimation significantly
- Energy measures do not distinguish between ripple and aspiration components
- Algorithm assumes inverse-filtered speech cleanly separates source and filter
- Multiple excitation points (secondary glottal pulses) observed in some speakers but not modeled

## Testable Properties
- CQ + OQ + RQ = 1.0 (they partition the glottal cycle)
- $E_e > 0$ always (absolute value of negative peak)
- $\Omega_o > \pi$ always (physical constraint: no negative open-phase flow)
- $\beta > 0$ always (return phase must decay)
- $0 < T_o < T_e < T_c$ (temporal ordering of glottal events)
- F1 frequency SNR >> F2 frequency SNR for closed-phase detection
- F1 frequency SNR >> F1 bandwidth SNR for closed-phase detection
- Formant frequencies stationary during closed phase, modulated during open phase
- Removing singularity frames improves SID accuracy by ~15%
- Source features complementary to filter features (combined > either alone)
- Normalized timing parameters (CQ, OQ, RQ) are pitch-independent

## Relevance to Project
This paper provides:
1. **LF model fitting methodology**: The NL2SOL-based approach to fitting LF parameters could inform analysis-by-synthesis workflows for tuning Qlatt's LF source
2. **Source-filter interaction quantification**: The ripple and formant modulation framework explains why first-formant frequency varies within a pitch period — relevant for understanding bandwidth/frequency modulation in the Klatt cascade
3. **Closed-phase detection**: The formant stationarity algorithm provides a principled way to identify inverse-filtering windows for any speech analysis tool
4. **Speaker-dependent glottal features**: The normalized timing parameters (CQ, OQ, RQ) and waveshape parameters ($\alpha$, $\omega_o$) could inform speaker presets in Qlatt

## Open Questions
- [ ] How do the ripple energy measures relate to Klatt's TL (spectral tilt) parameter?
- [ ] Could the normalized LF timing parameters (CQ, OQ, RQ) serve as higher-level controls for voice quality in Qlatt?
- [ ] The formant modulation model suggests F1 varies within a pitch period — does Qlatt need sub-frame F1 modulation?
- [ ] How does this decomposition relate to Doval's CALM model (already in collection)?

## Related Work Worth Reading
- Ananthapadmanabha & Fant (1982) — Source/vocal tract interaction theory (foundational for the ripple model)
- Wong et al. (1979) — Sliding covariance analysis for closed-phase estimation
- Cummings & Clements (1995) — Prediction error for closed-phase identification
- Dennis, Gay & Welsch (1981) — NL2SOL algorithm (ACM algorithm 573)
- Krishnamurthy (1983) — Average formant bandwidth difference between open/closed phases

## Collection Cross-References

### Already in Collection
- **Fant_1985_LFModelGlottalFlow** — cited as [14] for the LF model definition; Plumpe fits this model per-pitch-period
- **Childers_Lee_1991_VoiceQualityFactors** — cited as [7] for prior iterative LF parameter estimation approach
- **Klatt_1990_VoiceQualityVariations** — related to voice quality characterization; Plumpe provides automatic extraction of the source features Klatt characterized manually
- **Doval_2003_VoiceSourceCALM** — not cited but closely related; CALM provides an alternative filter-based view of the same LF decomposition
- **Doval_2006_SpectrumGlottalFlowModels** — relates to spectral interpretation of the LF parameters that Plumpe estimates in the time domain
- **Hanson_1995_GlottalCharacteristicsFemale** — relates to female glottal characteristics; Plumpe's system handles male/female separately
- **Gobl_2003_VoiceQualityEmotion** — related voice quality work using KLSYN88
- **vanDinther_2001_PerceptualGlottalPulse** and **vanDinther_2004_PerceptualGlottalPulse** — perceptual relevance of the LF parameters that Plumpe extracts
- **Perrotin_2021_LF_LinearFilter_Equivalence** — efficient filter implementation of the LF model that Plumpe fits in time domain
- **Yegnanarayana_1998_VocalTractExtraction** — cited as [35] for independent development of multi-pitch-period analysis

### New Leads (Not Yet in Collection)
- Ananthapadmanabha & Fant (1982) — "Calculation of true glottal flow and its components" — foundational source-filter interaction theory used throughout
- Dennis, Gay & Welsch (1981) — NL2SOL algorithm — the specific optimizer used
- Wong, Markel & Gray (1979) — "Least squares glottal inverse filtering from the acoustic speech waveform" — closed-phase estimation baseline
- Krishnamurthy (1983) — "Glottal source estimation using a model of formant frequency modulation"
- Reynolds (1995) — "Speaker identification and verification using Gaussian mixture models" — the GMM-SID system used

### Supersedes or Recontextualizes
- Provides automated extraction pipeline for the LF parameters that **Fant_1985_LFModelGlottalFlow** defines theoretically
- Quantifies the source-filter interaction that **Doval_2003_VoiceSourceCALM** models analytically
