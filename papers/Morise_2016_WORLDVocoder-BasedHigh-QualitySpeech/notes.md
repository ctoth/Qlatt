---
title: "WORLD: A Vocoder-Based High-Quality Speech Synthesis System for Real-Time Applications"
authors: "Masanori Morise, Fumiya Yokomori, Kenji Ozawa"
year: 2016
venue: "IEICE Transactions on Information and Systems, vol.E99-D, no.7, pp.1877-1884"
doi_url: "https://doi.org/10.1587/transinf.2015EDP7457"
pages: "1877-1884"
affiliation: "Interdisciplinary Graduate School, University of Yamanashi, Kofu-shi, 400-8511 Japan; Graduate School of Medicine and Engineering Science Department of Education, University of Yamanashi"
funding: "JSPS KAKENHI 15H02726 and 26540087; Research Institute of Electrical Communication, Tohoku University (H25/A08)"
---

# WORLD: A Vocoder-Based High-Quality Speech Synthesis System for Real-Time Applications

## One-Sentence Summary
WORLD is a three-analyzer + one-synthesizer source-filter vocoder (DIO for F0, CheapTrick for the spectral envelope, PLATINUM for the excitation/aperiodic parameter) whose synthesis stage reduces to a single convolution of a minimum-phase impulse response with an extracted excitation signal, giving both the best MUSHRA sound quality and a real-time factor (RTF) more than ten times better than Legacy-STRAIGHT and TANDEM-STRAIGHT *(p.1877, p.1879, p.1882)*.

## Problem Addressed
Vocoder-based analysis/manipulation/synthesis systems that reach waveform-level quality (STRAIGHT and its descendants) are too computationally expensive for real-time use, while the simplifications made to get real-time behavior (real-time STRAIGHT, real-time singing morphing) degrade the synthesized quality *(p.1877)*. WORLD targets both axes at once: high sound quality and real-time processing *(p.1877)*.

## Key Contributions
- A complete system assembling three previously published analysis algorithms (DIO, CheapTrick, PLATINUM) with one synthesis algorithm, evaluated end-to-end rather than individually *(p.1877)*.
- A synthesis architecture that computes vocal cord vibration as one convolution of the minimum-phase response with an extracted excitation signal, instead of separately synthesizing periodic and aperiodic responses and summing them *(p.1879, Fig. 3)*.
- A MUSHRA evaluation on speech *including consonants* (4-mora words), in contrast to prior evaluations of these systems that used vowels only *(p.1881)*.
- A processing-speed evaluation showing WORLD is over ten times faster and the only system with RTF indicating real-time capability *(p.1882)*.
- Public C and Matlab implementations at http://ml.cs.yamanashi.ac.jp/world/ *(p.1879)*.

## Study Design (empirical evaluation portion)
- **Type:** Subjective listening test (MUSHRA) plus computational benchmark *(p.1880, p.1881)*.
- **Population:** 10 students with normal hearing ability as listening subjects *(p.1881)*.
- **Stimuli:** 4 speakers (2 male, 2 female), 40 utterances (10 words per speaker), 4-mora words, 48 kHz / 16 bit, total length 32.18 s *(p.1881, Table 2)*.
- **Conditions compared:** Original speech, WORLD, TANDEM-STRAIGHT, Legacy-STRAIGHT *(p.1881)*.
- **Primary endpoint:** MUSHRA score (0-100) for sound quality *(p.1881)*.
- **Secondary endpoint:** Real time factor (RTF) per processing stage *(p.1882)*.
- **Trial structure:** Each evaluation set contains one reference piece plus four anonymous pieces (original + three synthesized); subjects instructed to give 100 points to at least one piece *(p.1881)*. GUI shown in Fig. 6, 20 experiments per subject ("Experiment 1/20") *(p.1881)*.
- **Environment:** 28.9 dB (A-weighted SPL), SENNHEISER HD650 headphones, Roland QUAD-CAPTURE audio I/O *(p.1881, Table 3)*.
- **No manual parameter tuning:** deliberately omitted so tuning influence would not confound the comparison of actual system performance *(p.1880)*.

## Methodology

### System architecture (Fig. 1, p.1878)
The input waveform feeds three analyzers in sequence-dependent order:
1. **DIO** estimates the F0 contour from the waveform alone *(p.1877)*.
2. **CheapTrick** estimates the spectral envelope using both the waveform and the F0 information *(p.1877)*.
3. **PLATINUM** estimates the excitation signal, used as the aperiodic parameter, from the waveform, F0, and spectral envelope *(p.1877)*.
4. **Synthesis** combines all three parameters into the output waveform *(p.1877)*.

Note on parameter semantics: WORLD's aperiodic parameter is *not* the same object as STRAIGHT's aperiodicity — it is referred to as the excitation signal extracted directly from the waveform *(p.1877, p.1879)*. Consequently WORLD cannot manipulate the aperiodic parameter as flexibly as Legacy-STRAIGHT or TANDEM-STRAIGHT, though it manipulates F0 and spectral envelope in the same manner as they do *(p.1877)*.

### 2.1 DIO: F0 estimation *(p.1877-1878)*
F0 is defined as the inverse of the smallest period of a periodic signal *(p.1877)*. Two families of F0 estimators exist: temporal-characteristic (autocorrelation) and spectral-characteristic (cepstrum) *(p.1878)*. DIO is much faster than YIN and SWIPE while its estimation performance is not inferior to theirs *(p.1878)*.

DIO has three steps *(p.1878)*:
1. **Low-pass filtering with many different cutoff frequencies.** If the filtered signal consists only of the fundamental component, it forms a sine wave with period T0, the fundamental period. Because the target F0 is unknown, many filters with different cutoffs are used.
2. **Compute F0 candidates and reliabilities in each filtered signal.** A pure fundamental-component sine wave has four intervals that must agree: the positive zero-crossing interval, the negative zero-crossing interval, the peak interval, and the dip interval (Fig. 2, p.1878). Their **standard deviation** is the reliability measure (lower standard deviation = more reliable), and their **average** is the F0 candidate.
3. **Select the candidate with the highest reliability.**

Speed advantage over STFT-based estimators: DIO filters the whole waveform and computes zero-crossing intervals, which is much faster than a per-frame STFT *(p.1883)*.

### 2.2 CheapTrick: spectral envelope estimation *(p.1878-1879)*
Motivation: cepstrum- and LPC-based envelope estimators cannot synthesize natural speech; the central problem is that the estimate depends on the temporal position, so the time-varying component must be removed while maintaining estimation accuracy *(p.1878)*.

CheapTrick is based on pitch synchronous analysis and uses a **Hanning window of length 3T0** *(p.1878)*. Procedure:
1. Compute the power spectrum from the windowed waveform *(p.1878)*.
2. Temporally stabilize the overall power of the windowed waveform (Eq. 1) *(p.1878)*.
3. Smooth the power spectrum with a rectangular window of width 2ω0/3 (Eq. 2) *(p.1878)*.
4. Apply specialized liftering (Eqs. 3-6) — smoothing lifter ls, spectral-recovery lifter lq, applied to the cepstrum of the smoothed power spectrum *(p.1879)*.

Efficiency note: the other systems use **two** power spectra to compute the spectral envelope, whereas CheapTrick uses only **one** *(p.1883)*.

### 2.3 PLATINUM: aperiodic parameter / excitation extraction *(p.1879)*
Prior approaches use mixed excitation and aperiodicity; Legacy-STRAIGHT and TANDEM-STRAIGHT use aperiodicity as a speech parameter for synthesizing both periodic and aperiodic signals. WORLD instead uses the excitation signal calculated directly from the waveform, F0, and spectral envelope *(p.1879)*.

Procedure:
1. Window the waveform with a window of length **2T0** *(p.1879)*.
2. Compute the spectrum X(ω) of the windowed signal *(p.1879)*.
3. Compute the minimum phase spectrum Sm(ω) from the liftered power spectrum Pl(ω) via Eqs. 7-9 *(p.1879)*.
4. Divide: Xp(ω) = X(ω)/Sm(ω) (Eq. 11), then inverse-transform to get the excitation signal xp(t) (Eq. 10) *(p.1879)*.

**Determining temporal positions of each vocal cord vibration** *(p.1879)*:
1. Determine the voiced section.
2. Determine the temporal center position **ta** of the section.
3. Compute the interval **ta ± T0**.
4. Within that interval, the temporal position with the maximum value of y(t)² is the origin.
5. Once an origin is determined, the algorithm automatically computes the other vocal cord positions (origins of each impulse response) on the basis of the F0 contour.
6. This process is carried out on all voiced sections.

### 2.4 Synthesis algorithm *(p.1879)*
- Legacy-STRAIGHT and TANDEM-STRAIGHT compute each vocal cord vibration independently from the periodic and aperiodic responses and add them. TANDEM-STRAIGHT uses the periodic response directly; Legacy-STRAIGHT manipulates the **group delay** to avoid buzzy timbre *(p.1879)*.
- **WORLD**: vocal cord vibration = convolution of the **minimum phase response** with the **extracted excitation signal** — a single convolution, no summation branch, hence lower computational cost (Fig. 3, p.1879).
- The F0 information determines the temporal positions of the origin of each vocal cord vibration *(p.1879)*.
- Fig. 4 (p.1880) shows that the WORLD-synthesized waveform is visually the most similar to the input waveform among the three systems. For Legacy- and TANDEM-STRAIGHT, the excitation signal depends on both spectral envelope and aperiodicity, so it was computed from the flattened spectral envelope *(p.1879)*.

### 2.5 Implementation *(p.1879-1880)*
- Implemented in C and Matlab, both available at http://ml.cs.yamanashi.ac.jp/world/ *(p.1879)*.
- Because the latest Legacy-STRAIGHT exists only in Matlab, all evaluations used the Matlab versions of all systems for a fair processing-speed comparison *(p.1879-1880)*.
- WORLD version used: **v0.1.4_2** *(p.1880)*.

## Key Equations / Statistical Models

Temporal stabilization of the overall power of the windowed waveform (Hanning window of length 3T0):

$$
\int_0^{3T_0} \left(y(t)w(t)\right)^2 dt = 1.125 \int_0^{T_0} y^2(t)\,dt
$$
Where: $y(t)$ is the waveform, $w(t)$ is the window function, $T_0$ is the fundamental period (s). The constant 1.125 is the power-normalization factor that makes the 3T0-windowed power match 1.125x the single-period power. *(p.1878, Eq. 1)*

Rectangular-window smoothing of the power spectrum:

$$
P_s(\omega) = \frac{3}{2\omega_0}\int_{-\frac{\omega_0}{3}}^{\frac{\omega_0}{3}} P(\omega+\lambda)\, d\lambda
$$
Where: $P(\omega)$ is the power spectrum of the windowed waveform, $P_s(\omega)$ the smoothed power spectrum, $\omega_0 = 2\pi/T_0$ (rad/s), and the rectangular window has total width $2\omega_0/3$. *(p.1878, Eq. 2)*

Specialized liftering producing the final spectral envelope:

$$
P_l(\omega) = \exp\left(\mathcal{F}\left[l_s(\tau)\, l_q(\tau)\, p_s(\tau)\right]\right)
$$
Where: $P_l(\omega)$ is the liftered (final) power spectral envelope, $\mathcal{F}[\,]$ is the Fourier transform, $\tau$ is quefrency (s). *(p.1879, Eq. 3)*

Smoothing lifter (removes the time-varying component of the log power spectrum):

$$
l_s(\tau) = \frac{\sin(\pi f_0 \tau)}{\pi f_0 \tau}
$$
Where: $f_0 = 1/T_0$ is the fundamental frequency (Hz), $\tau$ is quefrency (s). This is a sinc lifter. *(p.1879, Eq. 4)*

Spectral-recovery lifter (improves estimation performance):

$$
l_q(\tau) = \tilde{q}_0 + 2\tilde{q}_1 \cos\left(\frac{2\pi\tau}{T_0}\right)
$$
Where: $\tilde{q}_0 = 1.18$ and $\tilde{q}_1 = -0.09$ were obtained in [16] (Morise, "CheapTrick", Speech Communication vol.67, 2015). *(p.1879, Eq. 5)*

Cepstrum of the smoothed power spectrum:

$$
p_s(\tau) = \mathcal{F}^{-1}\left[\log\left(P_s(\omega)\right)\right]
$$
Where: $\mathcal{F}^{-1}[\,]$ is the inverse Fourier transform. *(p.1879, Eq. 6)*

Minimum phase spectrum:

$$
S_m(\omega) = \exp\left(\mathcal{F}[c_m(\tau)]\right)
$$
Where: $c_m(\tau)$ is the causal (minimum-phase) cepstrum defined below. *(p.1879, Eq. 7)*

Minimum-phase cepstrum construction (fold the cepstrum onto the causal side):

$$
c_m(\tau) = \begin{cases} 2c(\tau) & (\tau > 0) \\ c(\tau) & (\tau = 0) \\ 0 & (\tau < 0) \end{cases}
$$
Where: $c(\tau)$ is the real cepstrum of the liftered spectral envelope. *(p.1879, Eq. 8)*

Real cepstrum of the spectral envelope:

$$
c(\tau) = \mathcal{F}^{-1}\left[\log\left(P_l(\omega)\right)\right]
$$
*(p.1879, Eq. 9)*

Excitation signal in the time domain:

$$
x_p(t) = \mathcal{F}^{-1}\left[X_p(\omega)\right]
$$
*(p.1879, Eq. 10)*

Excitation spectrum by inverse filtering (whitening by the minimum phase spectrum):

$$
X_p(\omega) = \frac{X(\omega)}{S_m(\omega)}
$$
Where: $X(\omega)$ is the spectrum of the waveform windowed with a $2T_0$-length window, $S_m(\omega)$ the minimum phase spectrum from Eq. 7. *(p.1879, Eq. 11)*

Synthesis (stated in prose, Fig. 3, p.1879) — vocal cord vibration for each pulse position:

$$
v(t) = s_m(t) * x_p(t)
$$
Where: $s_m(t)$ is the minimum phase impulse response derived from $S_m(\omega)$, $x_p(t)$ the extracted excitation signal, $*$ denotes convolution. Vibration origins are placed at temporal positions determined from the F0 contour. *(p.1879)*

## Parameters

### Analysis conditions (Table 1, p.1881)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Frame shift (WORLD) | — | ms | 5 | — | 1881 | Table 1 |
| Frame shift (TANDEM-STRAIGHT) | — | ms | 5 | — | 1881 | Table 1 |
| Frame shift (Legacy-STRAIGHT) | — | ms | 1 | — | 1881 | Table 1; drives its very poor RTF |
| F0 search lower limit (WORLD) | — | Hz | 80 | 80-640 | 1881 | Table 1 |
| F0 search upper limit (WORLD) | — | Hz | 640 | 80-640 | 1881 | Table 1 |
| F0 search lower limit (TANDEM) | — | Hz | 32 | 32-650 | 1881 | Table 1 |
| F0 search upper limit (TANDEM) | — | Hz | 650 | 32-650 | 1881 | Table 1 |
| F0 search lower limit (Legacy) | — | Hz | 40 | 40-800 | 1881 | Table 1 |
| F0 search upper limit (Legacy) | — | Hz | 800 | 40-800 | 1881 | Table 1 |
| FFT size (all three systems) | — | samples | 2048 | — | 1881 | Table 1 |

### CheapTrick / PLATINUM algorithm constants

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Analysis window length (CheapTrick) | — | multiples of T0 | 3 | — | 1878 | Hanning window of length 3T0 |
| Power stabilization constant | — | — | 1.125 | — | 1878 | RHS factor in Eq. 1 |
| Smoothing rectangular window width | — | rad/s | 2ω0/3 | — | 1878 | Eq. 2; ω0 = 2π/T0 |
| Spectral recovery lifter DC term | q̃0 | — | 1.18 | — | 1879 | Eq. 5; value from [16] |
| Spectral recovery lifter cosine term | q̃1 | — | -0.09 | — | 1879 | Eq. 5; value from [16] |
| Analysis window length (PLATINUM) | — | multiples of T0 | 2 | — | 1879 | Window of length 2T0 |
| Origin search interval (PLATINUM) | ta ± T0 | s | — | — | 1879 | Search window for max y(t)² around section center |

### Evaluation corpus (Table 2, p.1881)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Number of speakers | — | count | 4 | — | 1881 | 2 males, 2 females |
| Number of speech items | — | count | 40 | — | 1881 | 10 words per speaker |
| Word type | — | — | 4-mora word | — | 1881 | Includes consonants |
| Sampling frequency | fs | kHz | 48 | — | 1881 | 16-bit quantization |
| Total corpus length | — | s | 32.18 | — | 1881 | Table 2 |
| Observed F0 range in corpus | F0 | Hz | — | 100-300 | 1881 | Fig. 5; "almost all" F0s in this band, full plot spans 50-400 Hz |

### Listening test conditions (Table 3, p.1881)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Number of subjects | — | count | 10 | — | 1881 | Students, normal hearing |
| Ambient noise level | — | dB (A-weighted SPL) | 28.9 | — | 1881 | Table 3 |
| Number of evaluation trials | — | count | 20 | — | 1881 | GUI reads "Experiment 1/20" (Fig. 6) |
| MUSHRA score scale | — | points | — | 0-100 | 1881 | Bad/Poor/Fair/Good/Excellent anchors |

### Benchmark hardware (p.1882)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| CPU clock | — | GHz | 3.00 | — | 1882 | Intel Core i7-3540M, mobile PC |
| RAM | — | GB | 16.0 | — | 1882 | — |
| Matlab version | — | — | R2013a | — | 1882 | No parallel processing used |
| WORLD version | — | — | v0.1.4_2 | — | 1880 | — |
| TANDEM-STRAIGHT version | — | — | TandemSTRAIGHTmonolithicPackage004TestRev | — | 1880 | — |
| Legacy-STRAIGHT version | — | — | STRAIGHTV40_006b | — | 1881 | NDF F0 trajectory extraction used |

## Effect Sizes / Key Quantitative Results

### MUSHRA sound quality (Fig. 7, p.1882) — read from the plotted bars, error bars are 95% CI

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Sound quality, Original | MUSHRA score | ~99 | 95% CI shown | — | All speech | 1882 |
| Sound quality, WORLD | MUSHRA score | ~94 | 95% CI shown | <0.0001 vs others | All speech | 1882 |
| Sound quality, TANDEM-STRAIGHT | MUSHRA score | ~85 | 95% CI shown | <0.0001 | All speech | 1882 |
| Sound quality, Legacy-STRAIGHT | MUSHRA score | ~90 | 95% CI shown | <0.0001 | All speech | 1882 |
| Sound quality, WORLD | MUSHRA score | ~94 | — | — | Male speech | 1882 |
| Sound quality, TANDEM-STRAIGHT | MUSHRA score | ~79 | — | — | Male speech (worst case) | 1882 |
| Sound quality, Legacy-STRAIGHT | MUSHRA score | ~86 | — | — | Male speech | 1882 |
| Sound quality, WORLD | MUSHRA score | ~95 | — | n.s. vs Legacy | Female speech | 1882 |
| Sound quality, Legacy-STRAIGHT | MUSHRA score | ~94 | — | n.s. vs WORLD | Female speech | 1882 |
| Sound quality, TANDEM-STRAIGHT | MUSHRA score | ~92 | — | — | Female speech | 1882 |

Significance statement: "There were significant differences between all combinations (all p-values are under 0.0001)" for the all-speech results *(p.1881)*. For female speech specifically, there was **no** significant difference between WORLD and Legacy-STRAIGHT *(p.1882)*.

### Real time factor by stage (Fig. 8, p.1882)

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| F0 estimation | RTF | 0.08 | — | — | WORLD (DIO) | 1882 |
| Aperiodic information | RTF | 0.01 | — | — | WORLD (PLATINUM) | 1882 |
| Spectral envelope | RTF | 0.06 | — | — | WORLD (CheapTrick) | 1882 |
| Synthesis | RTF | 0.17 | — | — | WORLD | 1882 |
| **Total** | RTF | **~0.32** | — | — | WORLD (sum of the four stages) | 1882 |
| F0 estimation | RTF | 2.79 | — | — | TANDEM-STRAIGHT | 1882 |
| Aperiodic information | RTF | 0.43 | — | — | TANDEM-STRAIGHT | 1882 |
| Spectral envelope | RTF | 0.35 | — | — | TANDEM-STRAIGHT | 1882 |
| Synthesis | RTF | 0.21 | — | — | TANDEM-STRAIGHT | 1882 |
| **Total** | RTF | **~3.78** | — | — | TANDEM-STRAIGHT | 1882 |
| F0 + aperiodicity (merged) | RTF | 1.81 | — | — | Legacy-STRAIGHT (estimated jointly) | 1882 |
| Spectral envelope | RTF | 1.31 | — | — | Legacy-STRAIGHT | 1882 |
| Synthesis | RTF | 0.43 | — | — | Legacy-STRAIGHT | 1882 |
| **Total** | RTF | **~3.55** | — | — | Legacy-STRAIGHT | 1882 |

RTF definition: RTF is 1 if an input signal lasting n seconds is processed in n seconds *(p.1882)*. Only WORLD had an RTF reflecting real-time processing capability *(p.1882)*. Even if Legacy-STRAIGHT's frame shift had been set to 5 ms, its RTF would still have been the worst *(p.1882)*.

## Methods & Implementation Details
- WORLD analysis/synthesis API call sequence (Matlab, v0.1.4_2) *(p.1880)*:
  1. `f0 = Dio(x, fs);`
  2. `spec = CheapTrick(x, fs, f0);`
  3. `source = Platinum(x, f0, spec);`
  4. `y = SynthesisByWORLD(source, spec);`
  where `x` is the input waveform, `fs` the sampling frequency, `y` the synthesized speech. Because `source` includes both F0 and the excitation signal, the synthesis function needs only `source` and `spec` *(p.1880)*.
- TANDEM-STRAIGHT call sequence for comparison *(p.1880)*: `exF0candidatesTSTRAIGHTGB` → `autoF0Tracking` → `refineVoicingDecision` → `aperiodicityRatioSigmoid(x, f0, 1, 2, 0)` → `exSpectrumTSTRAIGHTGB` → `exTandemSTRAIGHTsynthNx`. The `aperiodicityRatioSigmoid` arguments were the defaults, and the whole series matched the TANDEM-STRAIGHT tutorial *(p.1881)*.
- Legacy-STRAIGHT call sequence *(p.1881)*: `[f0, ap] = exstraightsource(x, fs);` → `spec = exstraightspec(x, f0, fs);` → `y = exstraightsynth(f0, spec, ap, fs);`. F0 and aperiodicity are estimated at the same time, which is why its RTF plot merges those two stages *(p.1881, p.1882)*.
- Default parameters were used everywhere; deliberate absence of manual tuning is a methodological choice, not an oversight *(p.1880, p.1881)*.
- DIO's low-pass filter bank is applied to the whole waveform once rather than per-frame, which is where the speed advantage over STFT-based F0 estimators originates *(p.1883)*.
- PLATINUM requires **no post-processing**, unlike Legacy-STRAIGHT, which requires post-processing after computing with a 1-ms frame shift *(p.1883)*.
- TANDEM-STRAIGHT's aperiodic parameter estimation uses an **inverse matrix**; this is a computational cost WORLD avoids *(p.1883)*.
- The synthesis-stage processing speed of *all* systems depends on F0, because each algorithm synthesizes each vocal cord vibration individually *(p.1883)*.
- DIO and TANDEM-STRAIGHT's F0 estimation are parallelizable; GPU use would dramatically increase processing speed *(p.1883)*.

## Figures of Interest
- **Fig. 1 (p.1878):** System block diagram. Waveform fans out to DIO (F0), CheapTrick (spectral envelope), PLATINUM (aperiodic parameter); all three feed the synthesis block producing the output. Shows that CheapTrick consumes the waveform plus DIO's output, and PLATINUM consumes the waveform plus both prior outputs.
- **Fig. 2 (p.1878):** The four intervals used for an F0 candidate and its reliability, drawn on a sine wave: (1) positive zero-crossing interval, (2) peak interval, (3) negative zero-crossing interval, (4) dip interval. If the filtered signal is purely fundamental, all four are equal.
- **Fig. 3 (p.1879):** Synthesis architecture contrast. Top box (Legacy/TANDEM-STRAIGHT): spectral envelope + aperiodicity fan into a periodic response convolved with a pulse and an aperiodic response convolved with white noise, summed to give vocal cord vibration. Bottom box (WORLD): spectral envelope → minimum phase response, convolved with the excitation signal, directly giving vocal cord vibration. One convolution instead of two plus a sum.
- **Fig. 4 (p.1880):** Input waveform (top), excitation signals before convolution (middle row: WORLD, TANDEM, Legacy), synthesized waveforms (bottom row), over 0.21-0.25 s. WORLD's excitation is low-amplitude with sharp negative-going spikes; TANDEM's shows tall positive pulses on a noise floor; Legacy's is intermediate. WORLD's synthesized waveform most closely resembles the input.
- **Fig. 5 (p.1881):** Cumulative distribution of F0 in the evaluation corpus, F0 axis 50-400 Hz. Curve rises steeply from ~100 Hz, has an inflection near 200-250 Hz (the male/female split), and saturates by ~320 Hz.
- **Fig. 6 (p.1881):** MUSHRAM evaluation GUI, four sliders (Sound A-D) with Bad/Poor/Fair/Good/Excellent anchors, a Play reference button, and Save and proceed.
- **Fig. 7 (p.1882):** MUSHRA scores, y-axis 60-100, grouped by Original / WORLD / TANDEM / Legacy with All / Male / Female bars and 95% CI error bars. TANDEM's male bar (~79) is the clear low outlier.
- **Fig. 8 (p.1882):** Stacked horizontal RTF bars per system, x-axis 0-4, segmented by F0 / aperiodic information / spectral envelope / synthesis. WORLD's total bar is a thin sliver next to the two ~3.5-3.8 competitors.

## Results Summary
- WORLD achieved the highest MUSHRA score of all synthesized conditions, with significant differences between all combinations at p < 0.0001 *(p.1881)*.
- The male/female split is the sharpest finding: WORLD was clearly superior on male speech, whereas on female speech there was no significant difference between WORLD and Legacy-STRAIGHT *(p.1882)*. Male speech synthesized with TANDEM-STRAIGHT and Legacy-STRAIGHT had lower quality than female speech; the female differences were relatively smaller *(p.1882)*.
- WORLD won on quality *despite* an adverse configuration: Legacy-STRAIGHT ran with a 1-ms frame shift versus WORLD's 5 ms and additionally used group delay manipulation to improve quality *(p.1882)*.
- WORLD's total RTF (~0.32) was more than ten times better than the competitors (~3.5-3.8) and the only one indicating real-time capability *(p.1877, p.1882)*.
- Perceptual differences between original speech and WORLD output appeared **at the phoneme boundaries** *(p.1882)*.
- WORLD differed from the other systems not only at phoneme boundaries but also in the sound quality of vowels *(p.1882)*.

## Limitations
- **Aperiodic parameter is not manipulable** in WORLD the way it is in Legacy-STRAIGHT or TANDEM-STRAIGHT *(p.1877)*.
- **Noise robustness:** DIO requires high-SNR speech, so WORLD cannot synthesize natural speech from speech containing additive noise; voiced/unvoiced estimation errors may degrade sound quality. Improving noise robustness is named as an important future task *(p.1882)*.
- **Minimum phase is inappropriate for low-pitch speech.** Humans perceive phase differences more easily in low-F0 speech than high-F0 speech, so the minimum-phase approximation is a weakness there; Legacy-STRAIGHT's group delay manipulation is the mechanism the authors credit for its comparatively better low-pitch behavior *(p.1882)*. Efficient phase modeling is listed as future work *(p.1882)*.
- **Pitch-shifted unvoiced speech quality is hard to assess** because the systems used different aperiodic parameters, making the sound quality depend on the F0 manipulation algorithm; per-system pitch manipulation algorithms and a further subjective evaluation with pitch-shifted speech are needed *(p.1882-1883)*.
- **No suitable objective metric exists.** PESQ and log-spectral distance (LSD) are useful for telephony evaluation but not appropriate for high-quality synthesizers; a new evaluation index for high-sampling-rate speech is needed *(p.1883)*.
- **Matlab-bound benchmarks.** All processing-speed results were obtained in Matlab; the authors expect substantial improvement from C and note the C implementations still need optimization *(p.1883)*.
- Evaluation used only 4-mora words from 4 speakers, 10 subjects *(p.1881)*.

## Arguments Against Prior Work
- **Conventional vocoders are inferior to waveform-based systems** in synthesized speech quality, with STRAIGHT as the exception *(p.1877)*.
- **Real-time STRAIGHT [10] degrades quality**: "the simplified algorithm it uses degrades the quality of the synthesized speech." Real-time singing morphing [11] has the same problem *(p.1877)*.
- **TANDEM-STRAIGHT [12][13] is hard to use for real-time analysis/synthesis** even though it is a simplified version outputting almost the same parameters as STRAIGHT and works well *(p.1877)*.
- **Cepstrum and LPC envelope estimators cannot synthesize natural speech**; their estimates depend on temporal position and the time-varying component must be removed *(p.1878)*.
- **Prior evaluations used vowels only.** Past evaluations of the conventional systems (and of CheapTrick [16] and PLATINUM [17] individually) used speech consisting of only vowels; this paper deliberately used consonant-bearing 4-mora words *(p.1881)*.
- **Legacy-STRAIGHT needs post-processing** after computing with a 1-ms frame shift, while PLATINUM requires none *(p.1883)*.
- **Other systems use two power spectra** to compute the spectral envelope, versus CheapTrick's one *(p.1883)*.
- **TANDEM-STRAIGHT's aperiodic estimation requires an inverse matrix** *(p.1883)*.
- **STFT-based F0 estimation is computationally intensive per frame** compared to DIO's whole-waveform filtering plus zero-crossing intervals *(p.1883)*.
- **PESQ and LSD are the wrong metrics** for high-quality synthesizers *(p.1883)*.

## Design Rationale
- **Single-convolution synthesis over periodic/aperiodic decomposition**: WORLD extracts the excitation signal directly from the waveform, so vocal cord vibration is one convolution of the minimum phase response with that excitation, rather than two convolutions (pulse-driven periodic response and noise-driven aperiodic response) plus a sum. Fewer convolutions → lower computational cost *(p.1879, Fig. 3)*. The tradeoff explicitly accepted is loss of aperiodic-parameter manipulability *(p.1877)*.
- **Minimum phase response** was chosen over group delay manipulation (Legacy-STRAIGHT's approach); the authors acknowledge this is a real quality cost for low-pitch speech but keep it for speed *(p.1879, p.1882)*.
- **3T0 Hanning window in CheapTrick** with power stabilization (Eq. 1) and 2ω0/3 rectangular smoothing (Eq. 2): the design target is to remove the temporal-position dependence of the envelope while keeping accuracy *(p.1878)*.
- **Spectral recovery lifter lq** exists specifically to undo the accuracy loss introduced by the smoothing lifter ls, with empirically fitted coefficients 1.18 and -0.09 *(p.1879)*.
- **Reliability by standard deviation of four intervals** in DIO: since a pure fundamental sine has four identical intervals, their dispersion is a natural, cheap confidence measure requiring no spectral transform *(p.1878)*.
- **No parameter tuning in evaluation**: tuning helps every system in specific situations and would confound the comparison, so it was excluded to measure actual system performance *(p.1880)*.
- **Matlab used for all systems in the speed benchmark** because Legacy-STRAIGHT exists only in Matlab; a same-language comparison was judged fairer than comparing WORLD's C code to competitors' Matlab *(p.1879-1880)*.

## Testable Properties
- With a pure fundamental-component signal, the positive zero-crossing, negative zero-crossing, peak, and dip intervals must all equal T0; their standard deviation must be near zero *(p.1878)*.
- Eq. 1 must hold as a normalization identity: the squared 3T0-Hanning-windowed waveform energy equals 1.125 times the single-period energy of y(t) *(p.1878)*.
- The smoothing rectangular window width must equal 2ω0/3 where ω0 = 2π/T0 *(p.1878)*.
- Spectral-recovery lifter coefficients must be q̃0 = 1.18 and q̃1 = -0.09 *(p.1879)*.
- CheapTrick window length must be 3T0; PLATINUM window length must be 2T0 *(p.1878, p.1879)*.
- The minimum-phase cepstrum must satisfy cm(τ) = 2c(τ) for τ > 0, c(0) for τ = 0, and 0 for τ < 0 *(p.1879)*.
- Inverse filtering must satisfy Xp(ω) = X(ω)/Sm(ω), so that convolving the minimum phase response back with xp(t) reconstructs the windowed waveform *(p.1879)*.
- The PLATINUM vibration origin must lie within ta ± T0 of the voiced section center and must maximize y(t)² in that interval *(p.1879)*.
- Total WORLD RTF must be below 1.0 on commodity hardware for real-time claims to hold; measured ~0.32 on an i7-3540M at 3.00 GHz in Matlab *(p.1882)*.
- WORLD's RTF must be more than 10x lower than Legacy-STRAIGHT and TANDEM-STRAIGHT *(p.1877, p.1882)*.
- MUSHRA score for WORLD must exceed those of TANDEM-STRAIGHT and Legacy-STRAIGHT on all speech, p < 0.0001 *(p.1881)*.
- On female speech, WORLD and Legacy-STRAIGHT must be statistically indistinguishable *(p.1882)*.
- Synthesis-stage processing time must scale with F0, since one vocal cord vibration is synthesized per pitch period *(p.1883)*.
- Quality degradation from the minimum-phase approximation must be larger for low-F0 (male) speech than high-F0 (female) speech *(p.1882)*.

## Relevance to Project
This is directly load-bearing for a formant/source-filter speech synthesizer:

- **The synthesis kernel is the simplest possible source-filter loop.** Place one impulse-response origin per pitch period from the F0 contour, convolve a minimum-phase impulse response (derived from the spectral envelope via the real-cepstrum fold in Eqs. 7-9) with an excitation signal, and overlap-add. A formant synthesizer can drop in its own formant-bank magnitude response in place of CheapTrick's envelope and reuse the exact same minimum-phase construction and pitch-synchronous placement.
- **Eqs. 7-9 are a reusable magnitude-to-minimum-phase-impulse-response recipe.** Any formant bank that produces a magnitude spectrum can be converted to a causal impulse response by this real-cepstrum folding, avoiding explicit pole placement and giving a well-defined phase for free.
- **The pitch-mark placement algorithm (ta ± T0, maximize y(t)²) is an implementable glottal-epoch detector** for aligning excitation pulses to the waveform, relevant to any project doing pitch-synchronous overlap-add or glottal-pulse-driven excitation.
- **The minimum-phase caveat is a direct warning for this project.** The paper documents that minimum-phase excitation costs perceptible quality for low-F0 (male) voices, and that group-delay manipulation is the known mitigation *(p.1882)*. A formant synthesizer using a purely minimum-phase cascade should expect the same male-voice weakness, and this paper names the fix direction.
- **The RTF budget gives a concrete performance target.** Analysis stages at 0.06-0.08 RTF and synthesis at 0.17 RTF in *Matlab* set a generous ceiling for what a C/WASM real-time synthesizer must beat.
- **DIO's four-interval reliability measure** is a cheap, transform-free F0 confidence estimator usable in any voicing/pitch-tracking front end.
- **CheapTrick's power stabilization and 2ω0/3 smoothing** are the standard recipe for removing pitch-harmonic ripple from a measured spectral envelope, useful if the project ever fits formant parameters to real speech spectra.
- **Evaluation methodology template:** MUSHRA with hidden reference and anchor, defaults-only (no tuning), consonant-bearing stimuli, reporting per-sex breakdowns. The male/female split finding is a reminder to always evaluate low-F0 voices separately.

## Open Questions
- [ ] What exactly is the low-pass filter bank in DIO — how many cutoffs, spaced how? The paper says "many filters with different cutoff frequencies" but the detail lives in [14] and [15].
- [ ] How are the F0 candidates from different filtered bands combined into a contour over time (continuity/tracking)? Not described here.
- [ ] How is the voiced/unvoiced decision made? The paper says voiced sections are determined but does not specify the criterion *(p.1879)*.
- [ ] How is the excitation signal represented and stored between analysis and synthesis (one 2T0 segment per period? a continuous signal?)? Fig. 4 shows a continuous excitation signal but the storage format is unstated.
- [ ] How are unvoiced sections synthesized? WORLD's excitation extraction is described only for voiced sections.
- [ ] What is the exact synthesis-stage overlap-add? Convolution and origin placement are stated, but windowing/normalization at the overlap is not.
- [ ] How were q̃0 = 1.18 and q̃1 = -0.09 fit, and over what corpus? Deferred to [16].
- [ ] Exact MUSHRA numbers are read from Fig. 7 only; the paper provides no numeric table for them.

## Related Work Worth Reading
- **[16] M. Morise, "CheapTrick, a spectral envelope estimator for high-quality speech synthesis," Speech Communication, vol.67, pp.1-7, 2015.** The full CheapTrick derivation and the origin of q̃0 / q̃1. Highest priority follow-up.
- **[17] M. Morise, "Platinum: A method to extract excitation signals for voice synthesis system," Acoust. Sci. & Tech., vol.33, no.2, pp.123-125, 2012.** The full PLATINUM algorithm including excitation representation.
- **[14] M. Morise, H. Kawahara, H. Katayose, "Fast and reliable f0 estimation method based on the period extraction of vocal fold vibration of singing voice and speech," AES 35th Int. Conf., 2009** and **[15] M. Morise, H. Kawahara, T. Nishiura, "Rapid f0 estimation for high-snr speech based on fundamental component extraction," IEICE Trans. Inf. & Syst. (Japanese Ed.), vol.J93-D, no.2, pp.109-117, 2010.** The DIO algorithm in full.
- **[5] H. Kawahara, I. Masuda-Katsuse, A. Cheveigné, "Restructuring speech representations using a pitch-adaptive time-frequency smoothing and an instantaneous-frequency-based f0 extraction," Speech Communication, vol.27, no.3-4, pp.187-207, 1999.** The original STRAIGHT, the baseline this whole line of work is measured against.
- **[31] H. Kawahara, J. Estill, O. Fujimura, "Speech representation and transformation using adaptive interpolation of weighted spectrum: vocoder revisited," ICASSP1997, pp.1303-1306.** Source of the group delay manipulation that avoids buzzy timbre — the named fix for WORLD's minimum-phase weakness.
- **[34] R. Plomp, H.J. Steeneken, "Effect of phase on the timbre of complex tones," JASA vol.46, no.2, pp.409-421, 1969.** The perceptual basis for why phase matters more at low F0.
- **[35] R. Maia, M. Akamine, M.J.F. Gales, "Complex cepstrum as phase information in statistical parametric speech synthesis," ICASSP2012, pp.4581-4584.** The phase modeling direction the authors want to incorporate.
- **[18] M. Morise, "Error evaluation of an f0-adaptive spectral envelope estimator in robustness against the additive noise and f0 error," IEICE Trans. Inf. Syst., vol.E98-D, no.7, pp.1405-1408, 2015.** Sensitivity of CheapTrick to F0 error — matters if driving it from an imperfect tracker.
- **[36] Y. Agiomyrgiannakis, "Vocaine the vocoder and applications in speech synthesis," ICASSP2015, pp.4230-4234.** Named as another route to a real-time synthesizer.
- **[26] M.V. Mathews, J.E. Miller, E.E. David, "Pitch synchronous analysis of voiced sounds," JASA vol.33, no.2, pp.179-185, 1961.** The original pitch-synchronous analysis idea CheapTrick builds on.
- **[23] B.S. Atal, S.L. Hanauer, "Speech analysis and synthesis by linear prediction of the speech wave," JASA vol.50, no.2B, pp.637-655, 1971.** The LPC baseline criticized here.
- **[3] H. Dudley, "Remaking speech," JASA vol.11, no.2, pp.169-177, 1939.** The original vocoder.

## Collection Cross-References

### Already in Collection
- (none found - none of this paper's citations are represented in the collection)

### New Leads (Not Yet in Collection)
- H. Kawahara, I. Masuda-Katsuse, A. Cheveigné (1999) - "Restructuring speech representations using a pitch-adaptive time-frequency smoothing and an instantaneous-frequency-based f0 extraction" - original STRAIGHT paper, the quality baseline this whole vocoder lineage is measured against
- A. Cheveigné, H. Kawahara (2002) - "Yin, a fundamental frequency estimator for speech and music" - alternative F0 estimator DIO is benchmarked against for speed and accuracy
- E. Moulines, F. Charpentier (1990) - "Pitch-synchronous waveform processing techniques for text-to-speech synthesis using diphones" - foundational pitch-synchronous overlap-add technique underlying WORLD's synthesis stage
- B.S. Atal, S.L. Hanauer (1971) - "Speech analysis and synthesis by linear prediction of the speech wave" - LPC baseline this paper cites as unable to synthesize natural speech
- H. Zen, K. Tokuda, A.W. Black (2009) - "Statistical parametric speech synthesis" - survey of the statistical-parametric synthesis field WORLD's vocoder is designed to serve
- D.W. Griffin, J.S. Lim (1985) - "A new model-based speech analysis/synthesis" - early model-based analysis/synthesis system in the same lineage
- R. McAulay, T.F. Quatieri (1986) - "Speech analysis/synthesis based on a sinusoidal representation" - alternative (sinusoidal) analysis/synthesis paradigm contrasting with WORLD's source-filter approach
- H. Dudley (1939) - "Remaking speech" - the original vocoder concept this entire line of work descends from

### Supersedes or Recontextualizes
- (none - no genuine supersedes relationship with any collection paper)

### Conceptual Links (not citation-based)
- [Method for the subjective assessment of intermediate quality level of audio systems (Recommendation ITU-R BS.1534-3)](../ITU-R_2015_MUSHRA_BS1534/notes.md) - Morise's listening test is a direct application of the MUSHRA methodology this recommendation defines (hidden reference, anchor conditions, 0-100 scale); Morise's Table 3/Fig. 6 describe the concrete GUI and trial structure that implements the standard.
- [CREPE: A Convolutional Representation for Pitch Estimation](../Kim_2018_CREPEConvolutionalRepresentationPitch/notes.md) - both papers target the same problem (fast, accurate F0/pitch estimation) with opposite strategies: DIO's transform-free zero-crossing/reliability approach optimizes for real-time speed on CPU, while CREPE trades that speed for CNN-based robustness to noise and octave errors - a direct speed/accuracy tradeoff comparison for any F0 front end.
- [LPCNet: Improving Neural Speech Synthesis Through Linear Prediction](../Valin_2019_LPCNetImprovingNeuralSpeechSynthesis/notes.md) - both are real-time-oriented vocoders explicit about RTF as a design constraint; LPCNet substitutes a neural excitation model for WORLD's minimum-phase-impulse-plus-extracted-excitation synthesis, making them opposite answers (classical DSP vs. learned) to the same "high quality, real-time synthesis" problem WORLD states as its target.

### Cited By (in Collection)
- (none found)
