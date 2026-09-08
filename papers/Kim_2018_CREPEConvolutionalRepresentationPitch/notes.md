---
title: "CREPE: A Convolutional Representation for Pitch Estimation"
authors: "Jong Wook Kim, Justin Salamon, Peter Li, Juan Pablo Bello"
year: 2018
venue: "ICASSP 2018 (IEEE International Conference on Acoustics, Speech and Signal Processing); arXiv:1802.06182v1 [eess.AS], 17 Feb 2018"
doi_url: "https://arxiv.org/abs/1802.06182"
pages: 5
affiliations: "1 Music and Audio Research Laboratory, New York University; 2 Center for Urban Science and Progress, New York University"
---

# CREPE: A Convolutional Representation for Pitch Estimation

## One-Sentence Summary
CREPE is a six-layer 1-D convolutional neural network that consumes a 1024-sample raw time-domain audio frame at 16 kHz and emits a 360-bin sigmoid activation over a 20-cent-resolution pitch grid spanning C1-B7 (32.70-1975.5 Hz), from which a deterministic weighted-average decoding yields an f0 estimate that beats pYIN and SWIPE on raw pitch accuracy at 50, 25, and 10 cent thresholds and is more robust to additive noise. *(p.1)*

## Problem Addressed
Monophonic f0 estimation ("pitch tracking") has for half a century been done by hand-designed DSP pipelines: a candidate-generating function plus pre- and post-processing heuristics. Nothing in those pipelines is learned from data except manually tuned hyperparameters. *(p.1)* This contrasts with chord ID and beat detection, where data-driven methods consistently outperform heuristics. Because f0 is a low-level physical attribute directly tied to periodicity, heuristics get raw pitch accuracy close to 100% on easy material, leading some to call the task solved. It is not: even pYIN, the best method to date, produces noisy results on uncommon instruments or fast-fluctuating pitch curves. This matters most where a flawless f0 estimate is required, e.g. generating reference annotations for melody and multi-f0 datasets. *(p.1)*

## Key Contributions
- A fully data-driven monophonic pitch tracker operating directly on the time-domain waveform, with no candidate-generating function and no post-processing heuristics. *(p.1)*
- State-of-the-art raw pitch accuracy, outperforming pYIN and SWIPE on both a homogeneous-timbre synthetic dataset (RWC-synth) and a timbrally diverse one (MDB-stem-synth). *(p.1, p.3)*
- Demonstration of high *precision*: over 90% raw pitch accuracy is maintained even at a strict 10-cent evaluation threshold, where the baselines fall to 82-83%. *(p.1, p.3)*
- Noise-robustness evaluation across four noise types and seven SNR levels, showing CREPE is best in essentially all conditions except brown noise. *(p.3)*
- A first-layer filter analysis showing the network adapts what it learns (overtone-tracking vs. f0-periodicity filters) to the timbral homogeneity of the training set. *(p.3-4)*
- An open-source pre-trained Python module at https://github.com/marl/crepe *(p.1)*

## Study Design
- **Type:** Supervised deep-learning benchmark study with 5-fold cross-validation and a controlled noise-degradation experiment.
- **Datasets (two, both synthesized so ground-truth f0 is exact):** *(p.2)*
  - **RWC-synth:** 6.16 hours of audio synthesized from the RWC Music Database [24]; the same data used to evaluate pYIN in [13]. Signals were synthesized as a fixed sum of a small number of sinusoids, so the dataset is highly homogeneous in timbre and is an over-simplified scenario. *(p.2)*
  - **MDB-stem-synth:** 230 monophonic stems taken from MedleyDB and re-synthesized with the analysis/synthesis framework of [18], giving a perfect f0 annotation while preserving the timbre and dynamics of the original track. 230 tracks, 25 instruments, 15.56 hours of audio. *(p.2)*
- **Why not MedleyDB directly:** its annotation process includes manual corrections, so it does not guarantee a 100% perfect match between annotation and audio and is affected by human subjectivity. Perfectly objective evaluation demands synthesized audio with full control over f0. *(p.2)*
- **Splits:** 5-fold cross-validation with a 60/20/20 train/validation/test split. For MDB-stem-synth the folds are **artist-conditional**, to avoid training and testing on the same artist, which can inflate performance through artist or album effects [25]. *(p.2)*
- **Primary metrics:** raw pitch accuracy (RPA) and raw chroma accuracy (RCA) at a 50-cent threshold [26]; the proportion of frames whose estimate is within 50 cents (a quarter-tone) of ground truth. Computed with the reference implementation in `mir_eval` [27]. *(p.2)*
- **Secondary metric variants:** RPA at stricter 25-cent and 10-cent thresholds. *(p.3)*
- **Baselines:** pYIN [13] and SWIPE [12]. *(p.2)*
- **Noise conditions:** four noise sources from the Audio Degradation Toolbox (ADT) [28] applied to MDB-stem-synth: pub, white, pink, brown. Pub noise is an actual recording of a crowded pub; white noise is a random signal with constant power spectral density over all frequencies; pink and brown noise have highest PSD at low frequencies with densities falling off at 10 dB and 20 dB per decade respectively. Seven SNR values: ∞, 40, 30, 20, 10, 5, 0 dB. *(p.2-3)*

## Methodology
CREPE is a deep 1-D CNN applied directly to the time-domain audio signal to produce a pitch estimate. The input is a 1024-sample excerpt of the waveform at 16 kHz sampling rate. Six convolutional layers produce a 2048-dimensional latent representation, which is densely connected to a 360-dimensional output layer with sigmoid activations, giving output vector ŷ. The pitch estimate is then computed deterministically from ŷ. *(p.1)*

Each of the 360 output nodes corresponds to a specific pitch value defined in cents. The 360 pitch values ¢₁ … ¢₃₆₀ are chosen to cover six octaves with 20-cent intervals between C1 and B7, i.e. 32.70 Hz to 1975.5 Hz. *(p.2)*

Training targets are 360-dimensional vectors where the bin containing the ground-truth f0 has magnitude one, Gaussian-blurred in frequency (σ = 25 cents) so near-correct predictions are penalized softly, following [19]. The network minimizes binary cross entropy between target y and prediction ŷ. *(p.2)*

### Architecture, layer by layer (Fig. 1, p.2)
Input: 1024 raw audio samples.

| Layer | Kernel size | Stride | Filters | Pooling | Output length after layer |
|-------|-------------|--------|---------|---------|---------------------------|
| conv1 | 512 | 4 | 1024 | maxpool 2 | 128 |
| conv2 | 64 | 1 | 128 | maxpool 2 | 64 |
| conv3 | 64 | 1 | 128 | maxpool 2 | 32 |
| conv4 | 64 | 1 | 128 | maxpool 2 | 16 |
| conv5 | 64 | 1 | 256 | maxpool 2 | 8 |
| conv6 | 64 | 1 | 512 | maxpool 2 | 4 |
| reshape | — | — | — | — | 2048 |
| FC (dense, sigmoid) | — | — | — | — | 360 (C1 … B7) |

Notes on the figure: the orange bars in Fig. 1 label the channel depth at each stage (1024, 128, 128, 128, 256, 512) and the numbers between stages label the temporal length (128, 64, 32, 16, 8, 4). The final 4 × 512 activation map is reshaped to a 2048-dimensional vector and fully connected to the 360 output nodes, whose activation profile approximates a Gaussian curve as in Equation 3; the exact pitch is then read out with Equation 2. *(p.2)*

Every convolutional layer is **preceded by batch normalization** [21] and **followed by a dropout layer** [22] with dropout probability 0.25. *(p.2)*

## Key Equations / Statistical Models

### Equation 1: cents, the log-frequency pitch scale

$$
\mathrm{\c{c}}(f) = 1200 \cdot \log_2 \frac{f}{f_{\mathrm{ref}}}
$$

Where: `f` is frequency in Hz; `f_ref` is a reference pitch in Hz, fixed at **10 Hz** throughout the experiments; the result is in cents. The unit gives a logarithmic pitch scale where 100 cents equal one semitone. *(p.2)*

### Equation 2: decoding the output vector to a frequency estimate

$$
\hat{\mathrm{\c{c}}} = \frac{\sum_{i=1}^{360} \hat{y}_i \, \mathrm{\c{c}}_i}{\sum_{i=1}^{360} \hat{y}_i}, \qquad \hat{f} = f_{\mathrm{ref}} \cdot 2^{\hat{\mathrm{\c{c}}}/1200}
$$

Where: `ŷ_i` is the sigmoid activation of output node i; `¢_i` is the pitch in cents associated with node i; `¢̂` is the weighted-average predicted pitch in cents; `f̂` is the resulting frequency estimate in Hz; `f_ref = 10` Hz. The estimate is a weighted average of the associated pitches, so it is not quantized to the 20-cent grid. *(p.2)*

### Equation 3: Gaussian-blurred training target

$$
y_i = \exp\left( -\frac{(\mathrm{\c{c}}_i - \mathrm{\c{c}}_{\mathrm{true}})^2}{2 \cdot 25^2} \right)
$$

Where: `y_i` is the target activation of output node i; `¢_i` is the pitch in cents of node i; `¢_true` is the ground-truth f0 in cents; the standard deviation is **25 cents**. The energy surrounding the ground-truth frequency decays with this standard deviation, so high activations in the last layer indicate the input signal likely has a pitch close to the associated pitches of the high-activation nodes. *(p.2)*

### Equation 4: training loss (binary cross entropy over 360 bins)

$$
\mathcal{L}(\mathbf{y}, \hat{\mathbf{y}}) = \sum_{i=1}^{360} \left( -y_i \log \hat{y}_i - (1 - y_i) \log (1 - \hat{y}_i) \right)
$$

Where: both `y_i` and `ŷ_i` are real numbers in [0, 1]. Note this is a *sum* over the 360 bins, not a mean, and the target is a soft Gaussian rather than a one-hot vector, so this is multi-label binary cross entropy rather than categorical cross entropy. *(p.2)*

## Parameters

### Signal / representation parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Input frame length | — | samples | 1024 | — | 2 | Raw time-domain excerpt; 64 ms at 16 kHz |
| Sampling rate | — | Hz | 16000 | — | 1 | Fixed |
| Latent representation size | — | dimensions | 2048 | — | 1, 2 | After reshape of final conv output (4 × 512) |
| Output layer size | — | bins | 360 | — | 1, 2 | Sigmoid activations |
| Pitch bin spacing | — | cents | 20 | — | 2 | 360 bins × 20 cents = 7200 cents = 6 octaves |
| Pitch range low | — | Hz | 32.70 | — | 2 | C1 |
| Pitch range high | — | Hz | 1975.5 | — | 2 | B7 |
| Cent reference frequency | f_ref | Hz | 10 | — | 2 | Used in Eq. 1 and Eq. 2 |
| Semitone size | — | cents | 100 | — | 2 | Definition of the cent scale |

### Architecture parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Number of conv layers | — | — | 6 | — | 1, 2 | All 1-D, operate on time-domain samples |
| Layer 1 kernel size | — | samples | 512 | — | 2 | Fig. 1 |
| Layer 1 stride | — | samples | 4 | — | 2 | Only strided layer |
| Layer 1 filter count | — | — | 1024 | — | 2 | Spectra of these filters analysed in Fig. 3 |
| Layers 2-6 kernel size | — | samples | 64 | — | 2 | Fig. 1 |
| Layer 2 filter count | — | — | 128 | — | 2 | Fig. 1 |
| Layer 3 filter count | — | — | 128 | — | 2 | Fig. 1 |
| Layer 4 filter count | — | — | 128 | — | 2 | Fig. 1 |
| Layer 5 filter count | — | — | 256 | — | 2 | Fig. 1 |
| Layer 6 filter count | — | — | 512 | — | 2 | Fig. 1 |
| Max-pooling factor | — | — | 2 | — | 2 | Applied after every conv layer |
| Dropout probability | — | — | 0.25 | — | 2 | Layer after each conv layer |
| Batch normalization | — | — | on | — | 2 | Precedes each conv layer |

### Training parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Optimizer | — | — | ADAM | — | 2 | Kingma & Ba [20] |
| Learning rate | α | — | 0.0002 | — | 2 | Fixed |
| Early-stopping patience | — | epochs | 32 | — | 2 | Stop when validation accuracy no longer improves |
| Batches per epoch | — | — | 500 | — | 2 | One epoch = 500 batches |
| Batch size | — | examples | 32 | — | 2 | Randomly selected from the training set |
| Target Gaussian std. dev. | σ | cents | 25 | — | 2 | Eq. 3 |
| Framework | — | — | Keras | — | 2 | Chollet [23] |
| Cross-validation folds | — | — | 5 | — | 2 | 60/20/20 train/val/test |

### Evaluation parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| RPA/RCA tolerance (standard) | — | cents | 50 | 10-50 | 2, 3 | A quarter-tone; standard in [26] |
| RPA tolerance (strict) | — | cents | 25 | — | 3 | Secondary threshold |
| RPA tolerance (strictest) | — | cents | 10 | — | 3 | Where CREPE's advantage is largest |
| SNR levels tested | — | dB | — | 0, 5, 10, 20, 30, 40, ∞ | 2-3 | Seven values |
| Pink noise roll-off | — | dB/decade | 10 | — | 2-3 | ADT |
| Brown noise roll-off | — | dB/decade | 20 | — | 2-3 | ADT |

### Dataset parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| RWC-synth duration | — | hours | 6.16 | — | 2 | Synthesized from RWC Music Database [24] |
| MDB-stem-synth duration | — | hours | 15.56 | — | 2 | Re-synthesized MedleyDB stems |
| MDB-stem-synth tracks | — | — | 230 | — | 2 | Monophonic stems |
| MDB-stem-synth instruments | — | — | 25 | — | 2, 4 | Electric bass 58 tracks, male singer 41 tracks are most common |

## Effect Sizes / Key Quantitative Results

### Table 1 (p.3): Average raw pitch/chroma accuracy at the 50-cent threshold, mean ± standard deviation

| Outcome | Measure | CREPE | pYIN | SWIPE | Dataset | Page |
|---------|---------|-------|------|-------|---------|------|
| Raw pitch accuracy | RPA @ 50c | **0.999 ± 0.002** | 0.990 ± 0.006 | 0.963 ± 0.023 | RWC-synth | 3 |
| Raw chroma accuracy | RCA @ 50c | **0.999 ± 0.002** | 0.990 ± 0.006 | 0.966 ± 0.020 | RWC-synth | 3 |
| Raw pitch accuracy | RPA @ 50c | **0.967 ± 0.091** | 0.919 ± 0.129 | 0.925 ± 0.116 | MDB-stem-synth | 3 |
| Raw chroma accuracy | RCA @ 50c | **0.970 ± 0.084** | 0.936 ± 0.092 | 0.936 ± 0.100 | MDB-stem-synth | 3 |

### Table 2 (p.3): Average raw pitch accuracy at three evaluation thresholds, mean ± standard deviation

| Dataset | Threshold | CREPE | pYIN | SWIPE | Page |
|---------|-----------|-------|------|-------|------|
| RWC-synth | 50 cents | **0.999 ± 0.002** | 0.990 ± 0.006 | 0.963 ± 0.023 | 3 |
| RWC-synth | 25 cents | **0.999 ± 0.003** | 0.972 ± 0.012 | 0.949 ± 0.026 | 3 |
| RWC-synth | 10 cents | **0.995 ± 0.004** | 0.908 ± 0.032 | 0.833 ± 0.055 | 3 |
| MDB-stem-synth | 50 cents | **0.967 ± 0.091** | 0.919 ± 0.129 | 0.925 ± 0.116 | 3 |
| MDB-stem-synth | 25 cents | **0.953 ± 0.103** | 0.890 ± 0.134 | 0.897 ± 0.127 | 3 |
| MDB-stem-synth | 10 cents | **0.909 ± 0.126** | 0.826 ± 0.150 | 0.816 ± 0.165 | 3 |

Derived comparisons stated by the authors:
- On RWC-synth, CREPE's **error rate is lower than the baselines by more than an order of magnitude** at the 50-cent threshold (0.001 vs 0.010 for pYIN, 0.037 for SWIPE). *(p.3)*
- At the 10-cent tolerance CREPE outperforms the baselines **by over 8 percentage points** on MDB-stem-synth (0.909 vs 0.826 / 0.816). *(p.3)*
- CREPE also exhibits **consistently lower variance** in performance than both baselines across all conditions. *(p.3)*
- Degradation from RWC-synth to MDB-stem-synth is **more severe for the baselines** than for CREPE, implying CREPE is more robust to complex timbres. *(p.3)*

### Noise robustness (Fig. 2, p.3)
Qualitative summary of the four-panel figure, which plots RPA at 50 cents against SNR ∈ {∞, 40, 30, 20, 10, 5, 0} dB with error bars spanning one standard deviation:
- **Pub noise:** CREPE highest at every SNR level. At 0 dB CREPE stays near 0.8 while pYIN falls to roughly 0.55 and SWIPE collapses toward 0.2. *(p.3)*
- **White noise:** CREPE highest at every SNR level; at 0 dB roughly 0.85 vs pYIN and SWIPE both near 0.55. *(p.3)*
- **Pink noise:** CREPE highest at all SNR levels **except the highest level of pink noise** (0 dB), where pYIN edges ahead; SWIPE collapses toward 0 at 0 dB. *(p.3)*
- **Brown noise:** the exception. pYIN's performance is **almost unaffected** by brown noise, because brown noise has most of its energy at low frequencies, to which the YIN algorithm (on which pYIN is based) is particularly robust. *(p.3)*
- **Overall claim:** CREPE performs better in all cases where SNR is below 10 dB; above that noise level, which method wins depends on the spectral properties of the noise. The approach is reliable under a reasonable amount of additive noise. *(p.3)*

### Performance by instrument (Fig. 4, p.4)
- The model performs **worse for instruments with higher average f0**, but performance also depends on timbre. *(p.4)*
- Worst case is the **dizi** (Chinese transverse flute): all dizi tracks came from the same artist and therefore all landed in the same artist-conditional split, so for the fold where dizi is in the test set, training and validation contain no dizi track at all and the model fails to generalize to the unseen timbre. *(p.4)*
- Five instruments occur only once in the dataset (bass clarinet, bamboo flute, and the saxophone family) yet perform decently, because their timbres do not deviate far from other instruments present. *(p.4)*
- **Flute and violin**: many same-instrument tracks exist in training, yet performance is low when the tested track is too low (flute) or too high (violin) relative to other tracks of the same instrument. *(p.4)*
- **Piccolo**: low performance is due to a dataset annotation error, where the annotation is inconsistent with the correct pitch range of the instrument. *(p.4)*
- Conclusion: the model performs well on test tracks whose **timbre and frequency range are well-represented in the training set**. *(p.4)*
- The colour axis in Fig. 4 spans RPA from 0.2 to 1.0; most tracks sit at or above 0.9 (yellow) with a small number of failures below 0.5. Tracks are sorted by average frequency from tuba (lowest, ~60 Hz) through electric bass, double bass, cello, baritone sax, male rapper, bass clarinet, bassoon, trombone, french horn, male singer, tenor sax, female singer, viola, piccolo, trumpet, alto sax, erhu, soprano sax, clarinet, violin, bamboo flute, oboe, flute, to dizi (highest, ~900 Hz). *(p.4)*

## Methods & Implementation Details
- Frame-level operation: CREPE estimates the pitch of **every frame independently**, with **no temporal tracking**, unlike pYIN which uses an HMM to enforce temporal smoothness. *(p.4)*
- Decoding is deterministic and differentiable-friendly: the weighted-average of Eq. 2 over all 360 sigmoid activations, not an argmax, so output resolution is finer than the 20-cent bin grid. *(p.2)*
- Sigmoid (not softmax) output with per-bin binary cross entropy summed over bins, matching the Gaussian-blurred multi-hot target. *(p.2)*
- Batch normalization before every convolution; dropout p = 0.25 after every convolution. *(p.2)*
- ADAM, learning rate 0.0002; best model selected by early stopping with patience 32 epochs on validation accuracy; one epoch = 500 batches of 32 randomly selected training examples. *(p.2)*
- Implemented in Keras. *(p.2)*
- Evaluation uses `mir_eval` [27] reference implementations of RPA and RCA. *(p.2)*
- Artist-conditional fold construction is required on MDB-stem-synth to avoid artist/album effects [25]. *(p.2)*
- Noise degradation applied with the Audio Degradation Toolbox [28]. *(p.2-3)*
- Pre-trained model and Python module released at https://github.com/marl/crepe *(p.1)*

## Figures of Interest
- **Fig. 1 (p.2):** Block diagram of the full CREPE architecture. Six convolutional layers on the time-domain signal, showing kernel sizes, strides, pooling, filter counts, intermediate tensor shapes, the reshape to 2048, the fully-connected layer, and the 360-node output spanning C1 to B7 with a Gaussian-shaped activation profile drawn to the right of the output bar. This figure is the authoritative source for every architecture hyperparameter.
- **Fig. 2 (p.3):** Four panels (pub, white, pink, brown noise) of RPA at 50 cents vs SNR (∞ to 0 dB) for CREPE, pYIN, SWIPE, with error bars spanning one standard deviation.
- **Fig. 3 (p.4):** Fourier spectra of the 1024 first-layer filters, sorted by the frequency of the peak magnitude, for the RWC-synth-trained model (top) and the MedleyDB-Synth-trained model (bottom), each with a histogram of the dataset's ground-truth frequency distribution to the right. Frequency axis 0-4 kHz. For RWC-synth the filter spectral density is concentrated between **600 Hz and 1500 Hz** while ground-truth f0 is mostly **100-600 Hz**, showing the first layer learns to distinguish **overtone** frequencies rather than the fundamental. For MDB-stem-synth the filter peaks also range well above the f0 distribution, but the majority of filters **overlap** the ground-truth distribution, unlike RWC-synth.
- **Fig. 4 (p.4):** Per-track RPA of CREPE on all 230 MDB-stem-synth tracks, plotted as average track frequency (0-1000 Hz) against instrument (25 instruments sorted by average frequency), coloured by RPA (0.2-1.0).

## Results Summary
On RWC-synth CREPE reaches essentially perfect performance (RPA 0.999 at 50 cents, 0.995 even at 10 cents), an order-of-magnitude error reduction over pYIN and SWIPE. *(p.3)* On the timbrally diverse MDB-stem-synth CREPE reaches RPA 0.967 at 50 cents against 0.919 (pYIN) and 0.925 (SWIPE), and the margin widens as the tolerance tightens: at 10 cents CREPE holds 0.909 while both baselines fall below 0.83. *(p.3)* CREPE has the highest accuracy at every SNR for pub and white noise, at all but the worst SNR for pink noise, and loses only to pYIN under brown noise, whose low-frequency energy YIN is intrinsically robust to. *(p.3)* Filter analysis shows the first convolutional layer adapts to the dataset: with a fixed identical timbre (RWC-synth) it models the harmonics/overtones, whereas with heterogeneous timbre (MDB-stem-synth) it cannot rely on harmonic structure alone and additionally learns filters capturing f0 periodicity directly. *(p.3-4)* Per-instrument analysis shows failures concentrate where the test timbre or frequency range is absent from training. *(p.4)*

## Limitations
- **No temporal modelling.** Pitch is continuous over time, but CREPE estimates each frame independently and exploits no temporal continuity, unlike pYIN's HMM. The authors plan a convolutional-recurrent (CRNN) extension trained jointly with the convolutional front-end. *(p.4)*
- **Generalization is bounded by training-set coverage.** The model performs poorly on timbres absent from training (dizi) and on frequency ranges under-represented for a given instrument (very low flute, very high violin). *(p.4)*
- **Not invariant to pitch-preserving transformations.** Ideally the model would be invariant to all transformations that do not affect pitch, e.g. distortion and reverberation. Pooling layers give some translation invariance, but designing an architecture to specifically ignore other pitch-preserving transformations is not straightforward and remains an intriguing open problem. Data augmentation is proposed as the practical substitute. *(p.4)*
- **Brown noise weakness.** pYIN beats CREPE under brown noise at all levels. *(p.3)*
- **Accuracy above 10 dB SNR is noise-type dependent**; the "CREPE is best" claim is only unconditional below 10 dB SNR. *(p.3)*
- **Fixed pitch range** of six octaves, C1-B7 (32.70-1975.5 Hz). Anything outside is not representable by the output layer. *(p.2)*
- **Evaluation is on synthesized audio only.** Real annotated data such as MedleyDB was deliberately excluded because its manual corrections do not guarantee perfect annotation, so no result here is on natural recordings. *(p.2)*
- **Dataset annotation errors** exist and depress measured accuracy (piccolo tracks). *(p.4)*

## Arguments Against Prior Work
- Earlier methods (cepstrum [6], ACF [7], AMDF [8], NCCF/RAPT [9], PRAAT [10], YIN [11], SWIPE [12], pYIN [13]) all rest on a candidate-generating function plus pre- and post-processing heuristics; **none of them is directly learned from data** except through manual hyperparameter tuning. *(p.1)*
- This is anomalous within MIR: in chord ID [16] and beat detection [17] data-driven methods consistently outperform heuristic approaches. *(p.1)*
- The near-100% raw pitch accuracies reported for heuristic methods have led some to consider pitch tracking a **solved problem; the authors argue it is not**. Even pYIN, the best method to date, produces noisy results for challenging audio such as uncommon instruments or very fast pitch fluctuation. *(p.1)*
- The failure is most damaging where a flawless f0 estimate is a hard requirement, e.g. using a pitch tracker to generate reference annotations for melody and multi-f0 estimation [18, 19]. *(p.1)*
- Empirical evidence for the criticism: at a 10-cent tolerance the heuristic baselines lose over 8 percentage points to CREPE on MDB-stem-synth, and their degradation from homogeneous to heterogeneous timbre is markedly larger than CREPE's. *(p.3)*
- pYIN's brown-noise advantage is explicitly attributed to a property of YIN rather than treated as a general superiority. *(p.3)*

## Design Rationale
- **Operate on the raw time-domain waveform** rather than a spectral representation, letting the network learn its own front-end filters. Fig. 3 justifies this by showing the learned first-layer filters differ substantially depending on the timbral statistics of the training data, an adaptation a fixed transform could not perform. *(p.1, p.3-4)*
- **360 sigmoid outputs over a 20-cent grid, not a scalar regression.** A distributed activation profile permits the weighted-average decoding of Eq. 2 and gives an interpretable confidence profile over pitch. *(p.2)*
- **Gaussian-blurred targets (σ = 25 cents) instead of one-hot**, following [19], to soften the penalty for near-correct predictions; without blurring, a prediction one bin away is penalized exactly as hard as one an octave away. *(p.2)*
- **Weighted-average decoding rather than argmax**, so the estimate is not quantized to the 20-cent bin grid, which is essential to reaching 10-cent accuracy. *(p.2)*
- **Artist-conditional folds** rather than random folds, to prevent artificially high performance from artist or album effects [25]. *(p.2)*
- **Synthesized ground truth rather than MedleyDB's manual annotations**, because at these accuracy levels annotation subjectivity would dominate the measurement. *(p.2)*
- **Two datasets, one timbrally homogeneous and one heterogeneous**, so that generalizability across timbre can be isolated from raw accuracy. *(p.2-3)*
- **Reporting 25- and 10-cent thresholds** because the standard 50-cent tolerance saturates and hides precision differences that matter for transcription and analysis/resynthesis. *(p.3)*
- Rejected/deferred alternatives: architecturally enforcing invariance to distortion and reverberation was considered and judged not straightforward, so **data augmentation** (including pitch shifts [29] and software-instrument timbres as in NSynth [30]) is proposed instead; **temporal smoothing** is deferred to a future CRNN rather than bolted on as a post-processing heuristic. *(p.4)*

## Testable Properties
- RPA and RCA are proportions in [0, 1]; the weighted-average decode of Eq. 2 must lie within the cent range spanned by the 360 bins. *(p.2)*
- Predicted frequency must lie in [32.70, 1975.5] Hz for any input, since ¢̂ is a convex combination of the bin centres. *(p.2)*
- With f_ref = 10 Hz, ¢(32.70) ≈ 2053 cents and ¢(1975.5) ≈ 9174 cents; consecutive bin centres differ by exactly 20 cents, and 360 bins span 7180 cents between the first and last centre (6 octaves less one interval). *(p.2)*
- The 360 target values of Eq. 3 must sum to a constant independent of ¢_true, up to truncation at the range edges, since the Gaussian shape is fixed. *(p.2)*
- Decreasing the evaluation tolerance from 50 to 10 cents must decrease RPA monotonically for every algorithm. Verified in Table 2 for all three algorithms on both datasets. *(p.3)*
- CREPE's RPA exceeds both baselines at every threshold on both datasets. *(p.3)*
- CREPE's standard deviation is lower than both baselines in every row of Tables 1 and 2. *(p.3)*
- RPA is monotonically non-increasing as SNR decreases from ∞ to 0 dB for every algorithm and noise type. *(p.3)*
- Below 10 dB SNR, CREPE's RPA exceeds pYIN's and SWIPE's for pub, white, and pink noise; the brown-noise case is the stated exception where pYIN is unaffected. *(p.3)*
- CREPE's per-track RPA correlates negatively with the track's average f0 on MDB-stem-synth. *(p.4)*
- A test track whose instrument timbre is entirely absent from the training fold should show markedly degraded RPA (dizi is the worked example). *(p.4)*
- Degradation from RWC-synth to MDB-stem-synth must be smaller for CREPE than for pYIN or SWIPE: 0.999 → 0.967 (−0.032) vs 0.990 → 0.919 (−0.071) and 0.963 → 0.925 (−0.038) at 50 cents; at 10 cents 0.995 → 0.909 (−0.086) vs 0.908 → 0.826 (−0.082) and 0.833 → 0.816 (−0.017). *(p.3)*

## Relevance to Project
For a formant / source-filter speech synthesizer that needs pitch tracking for analysis, CREPE is the accuracy ceiling reference and a directly usable tool.

- **Analysis-side f0 extraction.** Any analysis/resynthesis loop that measures f0 from a reference recording to drive the synthesizer's voice source needs the highest-precision tracker available. CREPE holds 90.9% of frames within 10 cents on heterogeneous timbre, where pYIN and SWIPE hold 82.6% and 81.6%. For pitch-contour fitting and for measuring source-filter separation quality, that 10-cent-level precision is the difference between a usable and an unusable contour. *(p.3)*
- **Range coverage matches speech.** C1-B7, 32.70-1975.5 Hz, comfortably covers both male and female speaking and singing f0, with headroom for creaky-low and falsetto-high excursions. The 20-cent bin grid with weighted-average decoding gives sub-bin resolution. *(p.2)*
- **The cent scale and Gaussian-blurred target is a reusable pattern.** Any place the synthesizer needs to predict or represent a frequency as a distribution rather than a scalar (pitch targets, formant frequency posteriors, f0 confidence) can borrow Eq. 1-3 verbatim: log-frequency binning, Gaussian target with σ in cents, sigmoid + summed BCE, weighted-average decode. *(p.2)*
- **Frame independence is both a feature and a caveat.** CREPE gives an unsmoothed, per-frame estimate. That is ideal if the synthesizer project wants to apply its *own* prosodic model or intonational smoothing rather than inherit an HMM's smoothing prior. It also means raw CREPE output will be jittery and will need explicit post-smoothing for a synthesizer's target contour. *(p.4)*
- **Noise robustness matters for real recordings.** Below 10 dB SNR CREPE beats the baselines for pub, white, and pink noise, so it is the better choice for analysing field or consumer-microphone speech recordings; use pYIN if the interfering noise is dominantly low-frequency rumble. *(p.3)*
- **Caveat for speech specifically.** CREPE was trained and evaluated entirely on *music* (RWC-synth instruments and MedleyDB stems, 25 instruments including male/female singer and male rapper but no ordinary speech). The per-instrument result says performance depends on the training set containing the test timbre and range. Speech, with its rapid formant transitions, creak, and unvoiced regions, is out of distribution relative to the training data, so accuracy on conversational speech should not be assumed from these numbers. *(p.2, p.4)*
- **No voicing decision.** The paper reports raw *pitch* accuracy only, which by definition is evaluated on voiced frames. CREPE emits an activation profile for every frame, voiced or not; a voicing/confidence threshold is not part of the paper and would need to be added for speech, where unvoiced segments are a large fraction of the signal. *(p.2-3)*
- **Available off the shelf** as a pre-trained open-source Python module, so it can be dropped into an analysis pipeline without retraining. *(p.1)*

## Open Questions
- [ ] What is the analysis frame hop? The paper specifies a 1024-sample input frame but never states the stride between successive frames, so the output frame rate is unspecified in the text.
- [ ] What confidence measure, if any, should gate the estimate? The paper never proposes a voicing detector or a confidence threshold derived from ŷ.
- [ ] How does CREPE perform on natural (non-synthesized) speech? No speech corpus is evaluated; the only voice material is sung/rapped stems inside MedleyDB.
- [ ] Total parameter count and inference cost are not reported, so real-time viability is not established from the paper alone.
- [ ] What is the effect of the σ = 25 cents target blur? No ablation is reported over σ, over the 20-cent bin width, or over the 360-bin range.
- [ ] Would the proposed CRNN extension close the brown-noise gap against pYIN? Left as future work.
- [ ] Is the loss of Eq. 4 summed or averaged over the batch? Only the per-example sum over 360 bins is specified.

## Related Work Worth Reading
- **[13] Mauch & Dixon, "pYIN: A fundamental frequency estimator using probabilistic threshold distributions," ICASSP 2014** — the main baseline and the previous state of the art; its HMM temporal smoothing is exactly what CREPE lacks.
- **[12] Camacho & Harris, "A sawtooth waveform inspired pitch estimator for speech and music," JASA 2008** — SWIPE, the second baseline; explicitly targets speech as well as music.
- **[11] de Cheveigné & Kawahara, "YIN, a fundamental frequency estimator for speech and music," JASA 2002** — the algorithm underneath pYIN, and the source of its brown-noise robustness.
- **[19] Bittner, McFee, Salamon, Li & Bello, "Deep salience representations for f0 tracking in polyphonic music," ISMIR 2017** — the origin of the Gaussian-blurred frequency target used in Eq. 3.
- **[18] Salamon, Bittner, Bonada, Bosch Vicente, Gómez Gutiérrez & Bello, "An analysis/synthesis framework for automatic f0 annotation of multitrack datasets," ISMIR 2017** — the analysis/synthesis method that produced MDB-stem-synth; directly relevant to a source-filter analysis/resynthesis project.
- **[10] Boersma, "Accurate short-term analysis of the fundamental frequency and the harmonics-to-noise ratio of a sampled sound," IFA 1993** — the PRAAT autocorrelation method, the default in phonetics.
- **[9] Talkin, "A robust algorithm for pitch tracking (RAPT)," Speech Coding and Synthesis 1995** — the NCCF-based tracker still widely used in speech synthesis pipelines.
- **[26] Salamon, Gómez, Ellis & Richard, "Melody extraction from polyphonic music signals," IEEE SPM 2014** — defines RPA/RCA and the 50-cent convention.
- **[27] Raffel et al., "mir_eval," ISMIR 2014** — the reference metric implementation used here.
- **[30] Engel et al., "Neural audio synthesis of musical notes with WaveNet autoencoders" (NSynth), arXiv 2017** — proposed as a source of timbral diversity for augmentation.

## Collection Cross-References

### Already in Collection
- (none found - the specific papers cited here, e.g. Mauch & Dixon's pYIN, de Cheveigné & Kawahara's YIN, are not yet in the collection)

### New Leads (Not Yet in Collection)
- M. Mauch, S. Dixon (2014) - "pYIN: A fundamental frequency estimator using probabilistic threshold distributions" - the primary baseline, whose HMM-based temporal smoothing is exactly what CREPE omits
- A. de Cheveigné, H. Kawahara (2002) - "YIN, a fundamental frequency estimator for speech and music" - the algorithm underneath pYIN, and the stated source of its brown-noise robustness
- A. Camacho, J.G. Harris (2008) - "A sawtooth waveform inspired pitch estimator for speech and music" - SWIPE, the second baseline, explicitly designed for speech as well as music
- D. Talkin (1995) - "A robust algorithm for pitch tracking (RAPT)" - the NCCF-based tracker still widely used in speech synthesis pipelines
- P. Boersma (1993) - "Accurate short-term analysis of the fundamental frequency and the harmonics-to-noise ratio of a sampled sound" - the PRAAT autocorrelation method, the default pitch analysis in phonetics
- R.M. Bittner, B. McFee, J. Salamon, P. Li, J.P. Bello (2017) - "Deep salience representations for f0 tracking in polyphonic music" - source of the Gaussian-blurred frequency-bin target CREPE reuses in Eq. 3
- J. Salamon, R.M. Bittner, J. Bonada, J.J. Bosch Vicente, E. Gómez Gutiérrez, J.P. Bello (2017) - "An analysis/synthesis framework for automatic f0 annotation of multitrack datasets" - the method used to build the MDB-stem-synth evaluation set

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [WORLD: A Vocoder-Based High-Quality Speech Synthesis System for Real-Time Applications](../Morise_2016_WORLDVocoder-BasedHigh-QualitySpeech/notes.md) - both papers target fast, accurate F0/pitch estimation with opposite strategies: DIO's transform-free zero-crossing/reliability approach optimizes for real-time speed on CPU, while CREPE trades that speed for CNN-based robustness to noise and octave errors - a direct speed/accuracy tradeoff comparison for any F0 front end.
