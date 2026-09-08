---
title: "LPCNet: Improving Neural Speech Synthesis Through Linear Prediction"
authors: "Jean-Marc Valin, Jan Skoglund"
year: 2019
venue: "ICASSP 2019 (arXiv:1810.11846v2, 19 Feb 2019)"
doi_url: "https://arxiv.org/abs/1810.11846"
pages: 5
affiliations: "Mozilla (Mountain View, CA, USA); Google LLC (San Francisco, CA, USA)"
---

# LPCNet: Improving Neural Speech Synthesis Through Linear Prediction

## One-Sentence Summary
LPCNet is a source-filter neural vocoder that hands the vocal-tract (spectral envelope) modeling to a classical short-term all-pole linear predictor computed from an 18-band Bark cepstrum, leaving a small sparse two-GRU WaveRNN to predict only the spectrally flat excitation, achieving high-quality 16 kHz speaker-independent synthesis under 2.8 GFLOPS (real-time on a single Apple A8 core, or 20% of a 2.4 GHz Broadwell core). *(p.1, p.4)*

## Problem Addressed
Neural speech synthesis (WaveNet, SampleRNN, WaveRNN, FFTNet) reaches high quality but requires the neural network to model the *entire* speech production process: glottal pulses, noise excitation, **and** the vocal tract response. That costs tens of GFLOPS and needs a high-end GPU, which rules out end-user devices such as mobile phones with limited battery. Meanwhile classical low-bitrate parametric vocoders are efficient at modeling the spectral envelope by linear prediction, but no comparably simple model exists for the excitation, so their quality has always been severely limited. *(p.1)*

LPCNet's thesis: split the two. Model the vocal tract with the "much older technique of linear prediction" and spend the network capacity only on the residual/excitation, which is the part with no good classical model. *(p.1, p.2, p.4)*

## Key Contributions
- **Combining linear prediction with WaveRNN** so the network predicts the excitation rather than the sample, taking the spectral-envelope burden off the network. Matches state-of-the-art neural synthesis quality with fewer neurons. *(p.1, p.2, p.4)*
- **LPC computed from the transmitted/synthesized 18-band Bark cepstrum**, not from the input signal, so no side information beyond the cepstrum is needed in a coding context and nothing extra must be predicted in a TTS context. *(p.2)*
- **Embedding of the discrete µ-law signal values** into the GRU, with the embedding matrix pre-multiplied into the GRU's non-recurrent weight submatrices, so all non-recurrent input contributions collapse to one add per gate per input. *(p.3)*
- **Dual fully-connected (DualFC) output layer**, an element-wise weighted sum of two tanh FC layers, which improves quality at equivalent complexity. *(p.2)*
- **Improved sampling**: pitch-correlation-dependent logit scaling plus a probability-floor subtraction with renormalization, to suppress impulse noise without a hard voicing decision. *(p.3)*
- **Pre-emphasis before µ-law quantization** (and de-emphasis on output), shaping µ-law noise down 16 dB at Nyquist, making 8-bit µ-law output viable at 16 kHz. *(p.2)*
- **Noise injection in the µ-law domain during training, applied inside the prediction loop** (Fig. 2), so the network learns to minimize error in the *signal* domain even though its output is the residual, analogous to analysis-by-synthesis in CELP. *(p.3)*
- **Open-source implementation** at https://github.com/mozilla/LPCNet/ (evaluation at commit `0ddcda0`). *(p.4)*

## Study Design (empirical part)
- **Type:** Subjective listening test (MUSHRA-derived, ITU-R BS.1534-1) plus complexity analysis. *(p.4)*
- **Population:** 100 participants; 8 utterances (2 male and 2 female speakers). *(p.4)*
- **Conditions compared:** Reference (clean), µ-law (pre-emphasized µ-law quantization = upper bound on achievable quality), LPCNet, WaveRNN+ (WaveRNN with all Section-3 improvements *except* the LPC part; it predicts `s_t` from `s_{t-1}` and conditioning only). *(p.4)*
- **Independent variable:** dense-equivalent GRU_A size, swept over 3 points. *(p.4)*
- **Primary endpoint:** MUSHRA quality score. *(p.4)*
- **Training data:** 4 hours of speech from the NTT Multi-Lingual Speech Database for Telephonometry (21 languages), with all test-speaker samples excluded (speaker-independent evaluation). *(p.4)*
- **Feature source at test time:** features computed from the original recorded audio (ground truth), then audio re-synthesized by each model, to isolate vocoder quality. *(p.4)*

## Architecture Overview (Fig. 1, p.2)

Two networks:

1. **Frame rate network** (yellow in Fig. 1) — runs once per 10-ms frame (160 samples at 16 kHz), output held constant across the frame.
   - Input: 20 features = 18 Bark-scale cepstral coefficients + 2 pitch parameters (period, correlation). *(p.1)*
   - Two convolutional layers, filter size 3 (conv 1x3, described also as "conv 3x1"), giving a receptive field of 5 frames — two frames ahead and two frames back. *(p.2)*
   - Output of the two conv layers is added to a **residual connection**, then passes through **two fully-connected layers**. *(p.2)*
   - Output: a **128-dimensional conditioning vector `f`**, held constant for the frame duration. *(p.2)*

2. **Sample rate network** (blue in Fig. 1) — runs at 16 kHz.
   - Inputs concatenated: previous sample `s_{t-1}`, previous excitation `e_{t-1}`, current prediction `p_t`, and `f`. *(p.2)*
   - `GRU_A` (large, **sparse**, block-sparse 16x1 blocks + full diagonal) → `GRU_B` (small, dense; replaces the FC+ReLU layer of the original WaveRNN) → **DualFC** → **softmax** over 256 µ-law excitation levels → **sampling** → excitation `e_t`. *(p.2, p.3)*
   - Output sample `s_t = p_t + e_t`, then de-emphasis filter applied to `s_t`. *(p.2)*
   - The `compute LPC` and `compute prediction` blocks (purple) sit outside the neural path: LPC is derived per frame from the features, and prediction is computed from the previous 16 samples `s_{t-16} … s_{t-1}`. *(p.2)*
   - µ-law↔linear conversions are omitted from Fig. 1 for clarity. *(p.2)*

**Source-filter split summary:** the classical all-pole filter `1/(1-P(z))` is the *filter*; the neural network is the *source*, emitting one 8-bit µ-law excitation sample per audio sample. The network still sees `s_{t-1}` and `p_t` in addition to `e_{t-1}`, because *open-loop* synthesis conditioned only on `e_{t-1}` produces bad quality speech. *(p.2)*

## Key Equations

### WaveRNN baseline (the model LPCNet modifies)

$$
\mathbf{x}_t = [s_{t-1}; \mathbf{f}]
$$
Where: `s_{t-1}` is the previous audio sample, `f` the conditioning parameter vector, `x_t` the GRU non-recurrent input. *(p.1)*

$$
\mathbf{u}_t = \sigma\left(\mathbf{W}^{(u)}\mathbf{h}_{t-1} + \mathbf{U}^{(u)}\mathbf{x}_t\right)
$$
Where: `u_t` is the GRU update gate, `W^(u)`/`U^(u)` the recurrent and non-recurrent update-gate weights, `σ(x) = 1/(1+e^{-x})` the sigmoid. *(p.1)*

$$
\mathbf{r}_t = \sigma\left(\mathbf{W}^{(r)}\mathbf{h}_{t-1} + \mathbf{U}^{(r)}\mathbf{x}_t\right)
$$
Where: `r_t` is the reset gate. *(p.1)*

$$
\widetilde{\mathbf{h}}_t = \tanh\left(\mathbf{r}_t \circ \left(\mathbf{W}^{(h)}\mathbf{h}_{t-1}\right) + \mathbf{U}^{(h)}\mathbf{x}_t\right)
$$
Where: `∘` is element-wise (Hadamard) multiply; `h̃_t` the candidate state. *(p.1)*

$$
\mathbf{h}_t = \mathbf{u}_t \circ \mathbf{h}_{t-1} + (1-\mathbf{u}_t)\circ\widetilde{\mathbf{h}}_t
$$
Where: `h_t` is the GRU hidden state. *(p.1)*

$$
P(s_t) = \mathrm{softmax}\left(\mathbf{W}_2\,\mathrm{relu}\left(\mathbf{W}_1\mathbf{h}_t\right)\right)
$$
Where: `P(s_t)` is the discrete output distribution over sample values; `W_1`, `W_2` are the two FC layers. Biases are omitted throughout the paper for clarity. The synthesized sample `s_t` is obtained by sampling from `P(s_t)`. Collectively equation (1). *(p.1)*

Note: the original WaveRNN is a 16-bit model split into 8 coarse + 8 fine bits; the authors omit the coarse/fine split for clarity and **do not use it** in this work. *(p.1)*
GRU matrices can be made sparse; [7] proposes non-zero blocks of size 4x4 or 16x1 to keep vectorization efficient. *(p.1)*

### Pre-emphasis / de-emphasis

$$
E(z) = 1 - \alpha z^{-1}
$$
Where: `E(z)` is the first-order pre-emphasis filter applied to the training data; `α = 0.85` gives good results. *(p.2)*

$$
D(z) = \frac{1}{1-\alpha z^{-1}}
$$
Where: `D(z)` is the inverse (de-emphasis) filter applied to the synthesis output; equation (2). This shapes the µ-law white quantization noise so its power at the Nyquist rate is reduced by **16 dB**, significantly reducing perceived noise and making 8-bit µ-law output viable for high-quality 16 kHz synthesis. *(p.2)*

Rationale: speech energy is concentrated at low frequencies, so flat µ-law quantization noise is audible at high frequencies, especially at 16 kHz where spectral tilt is steeper. Some approaches instead extend the output to 16 bits [7]; LPCNet's pre-emphasis avoids that cost. *(p.2)*

### Linear prediction

$$
p_t = \sum_{k=1}^{M} a_k s_{t-k}
$$
Where: `p_t` is the linear prediction of sample `s_t`; `a_k` are the `M`-th order LPC coefficients for the current frame; `M = 16` in practice (Fig. 1 shows `s_{t-16} … s_{t-1}`). Equation (3). *(p.2)*

**LPC computation chain (per frame):** 18-band Bark-frequency cepstrum → linear-frequency power spectral density (PSD) → auto-correlation via inverse FFT → Levinson-Durbin → predictor `a_k`. *(p.2)*

Design consequence: computing the predictor *from the cepstrum* means no additional information must be transmitted (coding) or synthesized (TTS). The LPC so computed is less accurate than LPC from the input signal (low cepstral resolution), but the effect on output is small because the network learns to compensate — an advantage over *open-loop* filtering approaches [12]. *(p.2)*

### DualFC output layer

$$
\mathrm{dual\_fc}(\mathbf{x}) = \mathbf{a}_1 \circ \tanh\left(\mathbf{W}_1\mathbf{x}\right) + \mathbf{a}_2 \circ \tanh\left(\mathbf{W}_2\mathbf{x}\right)
$$
Where: `W_1`, `W_2` are weight matrices; `a_1`, `a_2` are weighting vectors; `∘` element-wise multiply. Equation (4). *(p.2)*

Intuition: deciding whether a value falls *within* a range (a µ-law quantization interval) requires two comparisons, and each tanh FC layer implements the equivalent of one comparison. Visualizing weights on a trained network supports this. Output of DualFC feeds a softmax to give `P(e_t)`. It is not strictly necessary but "slightly improves quality at equivalent complexity." *(p.2)*

### LPCNet sample rate network with embeddings (equation 5)

$$
\mathbf{u}_t = \sigma\left(\mathbf{W}_u\mathbf{h}_t + \mathbf{v}^{(u,s)}_{s_{t-1}} + \mathbf{v}^{(u,p)}_{p_{t-1}} + \mathbf{v}^{(u,e)}_{e_{t-1}} + \mathbf{g}^{(u)}\right)
$$

$$
\mathbf{r}_t = \sigma\left(\mathbf{W}_r\mathbf{h}_t + \mathbf{v}^{(r,s)}_{s_{t-1}} + \mathbf{v}^{(r,p)}_{p_{t-1}} + \mathbf{v}^{(r,e)}_{e_{t-1}} + \mathbf{g}^{(r)}\right)
$$

$$
\widetilde{\mathbf{h}}_t = \tanh\left(\mathbf{r}_t \circ \left(\mathbf{W}_h\mathbf{h}_t\right) + \mathbf{v}^{(h,s)}_{s_{t-1}} + \mathbf{v}^{(h,p)}_{p_{t-1}} + \mathbf{v}^{(h,e)}_{e_{t-1}} + \mathbf{g}^{(h)}\right)
$$

$$
\mathbf{h}_t = \mathbf{u}_t \circ \mathbf{h}_{t-1} + (1-\mathbf{u}_t)\circ\widetilde{\mathbf{h}}_t
$$

$$
P(e_t) = \mathrm{softmax}\left(\mathrm{dual\_fc}\left(\mathrm{GRU}_B(\mathbf{h}_t)\right)\right)
$$
Where: `v^{(·,·)}_i` are lookups of column vector `i` from the corresponding pre-computed `V^{(·,·)}` matrix; `GRU_B(·)` is a regular, non-sparse GRU used in place of the FC+ReLU layer of equation (1); `g^{(·)} = U^{(·)} f` is the per-frame conditioning contribution to each gate. Collectively equation (5). *(p.3)*

### Embedding algebraic simplification

$$
\mathbf{V}^{(u,s)} = \mathbf{U}^{(u,s)}\mathbf{E}
$$
Where: `E` is the µ-law embedding matrix mapping each µ-law level to a vector; `U^{(u,s)}` is the submatrix of the update-gate non-recurrent weights `U^{(u)}` corresponding to the `s_{t-1}` input; `V^{(u,s)}` directly maps the sample `s_{t-1}` to the non-recurrent update-gate term. The same transformation applies for all **3 gates** (`u`, `r`, `h`) and all **3 embedded inputs** (`s`, `p`, `e`), for a total of **9 pre-computed `V` matrices**. *(p.3)*

Consequence: the embedding contribution reduces to **one add per gate, per embedded input**. Because only a single column of each embedding matrix is used per sample, the large size of these matrices is not an issue even if they do not fit in cache. *(p.3)*

$$
\mathbf{g}^{(\cdot)} = \mathbf{U}^{(\cdot)}\mathbf{f}
$$
Where: `f` is the 128-d frame conditioning vector, constant over an entire frame, so `g^(·)` is computed **once per frame** for each GRU gate. Together with the embedding trick this makes the cost of all non-recurrent inputs to the main GRU negligible. *(p.3)*

Also noted: visualizing the trained embedding matrix confirms the embedding learned, among other things, the µ-law→linear conversion function. *(p.3)*

### Sampling: temperature / logit scaling

$$
c = 1 + \max\left(0,\ 1.5 g_p - 0.5\right)
$$
Where: `c` is the constant multiplying the logits (lowering the sampling "temperature"); `g_p` is the pitch correlation, `0 < g_p < 1`. Equation (6). This replaces the binary voicing decision of [6], which used a fixed `c = 2` for voiced sounds. *(p.3)*

### Sampling: probability floor with renormalization

$$
P'(e_t) = \mathcal{R}\left(\max\left[\mathcal{R}\left(\left[P(e_t)\right]^c\right) - T,\ 0\right]\right)
$$
Where: `R(·)` renormalizes the distribution to unity (applied both between the two steps and on the result); `T = 0.002` is the probability threshold below which entries are zeroed. Equation (7). This prevents impulse noise caused by low probabilities; `T = 0.002` is a good trade-off between reducing impulse noise and preserving naturalness. *(p.3)*

### Complexity

$$
C = \left(3 d N_A^2 + 3 N_B\left(N_A + N_B\right) + 2 N_B Q\right)\cdot 2 F_s
$$
Where: `N_A` and `N_B` are the sizes of the two GRUs; `d` is the density of the sparse GRU; `Q` is the number of µ-law levels; `F_s` is the sampling rate. The factor 2 counts two operations (one add, one multiply) per weight per sample. Equation (8). *(p.4)*

Worked value: with `N_A = 384`, `N_B = 16`, `Q = 256`, `F_s = 16000`, plus ~0.5 GFLOPS for neglected terms (biases, conditioning network, activation functions), total ≈ **2.8 GFLOPS**. *(p.4)*

### Training step size schedule

$$
\alpha = \frac{\alpha_0}{1 + \delta\cdot b}
$$
Where: `α_0 = 0.001`, `δ = 5 × 10^{-5}`, `b` is the batch number. Optimizer is AMSGrad [21] (an Adam variant). *(p.4)*

### Noise-injection prediction filter (Fig. 2)

$$
P(z) = \sum_{k=1}^{M} a_k z^{-k}
$$
Where: `P(z)` is the prediction filter applied to the noisy, quantized input during training noise injection; the synthesis filter is `1/(1-P(z))`. *(p.3)*

## Parameters

### Signal / framing

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Sampling rate | F_s | Hz | 16000 | — | 4 | Wideband speech; sample rate network runs at 16 kHz |
| Frame length | — | ms | 10 | — | 1 | = 160 samples |
| Frame length | — | samples | 160 | — | 1 | At 16 kHz |
| Feature vector size | — | — | 20 | — | 1 | 18 Bark cepstral coefficients + 2 pitch parameters |
| Bark-scale cepstral bands | — | — | 18 | — | 1 | Band layout same as [20] (Valin 2018 hybrid DSP/deep-learning enhancement) |
| Pitch parameters | — | — | 2 | — | 1 | Period and correlation; pitch estimator is open-loop cross-correlation search |
| LPC order | M | — | 16 | — | 2 | Fig. 1 shows s_{t-16} … s_{t-1} |
| µ-law levels | Q | — | 256 | — | 3, 4 | 8-bit µ-law output |
| Pre-emphasis coefficient | α | — | 0.85 | — | 2 | E(z) = 1 - αz^{-1}; 16 dB noise reduction at Nyquist |

### Network sizes

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Main (sparse) GRU size | N_A | units | 384 | 192-640 | 3, 4 | Evaluated at 192, 384, 640 |
| Second GRU size | N_B | units | 16 | — | 4 | Dense; replaces WaveRNN's FC+ReLU layer |
| Sparse GRU non-zero density | d | — | 0.1 | — | 4 | Block-sparse |
| Sparse block shape | — | — | 16x1 | 4x4 or 16x1 | 3 | 16x1 chosen for good accuracy + vectorizable; all diagonal terms also kept non-zero |
| Dense-equivalent GRU sizes | — | units | — | 61, 122, 203 | 4 | For N_A = 192, 384, 640 at d = 0.1; matches "equivalent" sizes in [7] |
| Conditioning vector dim | f | — | 128 | — | 2 | Output of frame rate network, constant per frame |
| Frame conv layers | — | — | 2 | — | 2 | Filter size 3 |
| Frame conv receptive field | — | frames | 5 | — | 2 | 2 ahead, 2 back |
| Frame FC layers | — | — | 2 | — | 2 | After the residual add |
| Pre-computed embedding-fold matrices | V | — | 9 | — | 3 | 3 gates (u, r, h) x 3 inputs (s, p, e) |

### Sampling / inference

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Logit scaling constant | c | — | 1 + max(0, 1.5g_p - 0.5) | 1-2 | 3 | g_p = pitch correlation; c = 2 fixed in [6] |
| Pitch correlation | g_p | — | — | 0-1 | 3 | Strictly 0 < g_p < 1 |
| Probability floor threshold | T | — | 0.002 | — | 3 | Below-threshold entries zeroed, then renormalized |

### Training

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Training data duration | — | hours | 4 | — | 4 | NTT Multi-Lingual Speech Database for Telephonometry, 21 languages |
| Epochs | — | — | 120 | — | 4 | = 230k updates |
| Batch size | — | — | 64 | — | 4 | |
| Sequence length | — | frames | 15 | — | 4 | 15 x 10-ms frames |
| Initial step size | α_0 | — | 0.001 | — | 4 | AMSGrad |
| Step-size decay | δ | — | 5e-5 | — | 4 | α = α_0/(1+δ·b), b = batch number |
| Training noise range (µ-law domain) | — | µ-law steps | — | [-3, 3] | 3 | Uniform; varied across training data from no noise up to this range |

### Complexity

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| LPCNet total complexity | C | GFLOPS | 2.8 | — | 4 | N_A=384, N_B=16, Q=256, F_s=16000 |
| Neglected-terms complexity | — | GFLOPS | 0.5 | — | 4 | Biases, conditioning network, activation functions |
| FFTNet complexity | — | GFLOPS | 16 | — | 4 | Speaker-dependent [6] |
| WaveRNN complexity (sparse mobile) | — | GFLOPS | ~10 | — | 4 | Authors' interpretation of [7]; not explicitly stated in that paper |
| SampleRNN complexity | — | GFLOPS | ~50 | — | 4 | Authors' estimate; mostly the 1024-unit MLP layers |
| Real-time CPU budget (Broadwell) | — | % of core | 20 | — | 4 | 2.4 GHz Intel Broadwell |
| Real-time platform | — | — | Apple A8 single core | — | 4 | iPhone 6 |

## Effect Sizes / Key Quantitative Results

MUSHRA quality vs dense-equivalent GRU_A units (read from Fig. 3, p.4; approximate values off the plotted curves).

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Reference (clean) quality | MUSHRA | ~94 | error bars plotted | — | 100 listeners, 8 utterances | 4 |
| µ-law upper bound (pre-emphasized µ-law quantization) | MUSHRA | ~93 | error bars plotted | — | Same | 4 |
| LPCNet @ 61 dense-equiv units (N_A=192) | MUSHRA | ~59 | — | — | Same | 4 |
| LPCNet @ 122 dense-equiv units (N_A=384) | MUSHRA | ~80 | — | — | Same | 4 |
| LPCNet @ 203 dense-equiv units (N_A=640) | MUSHRA | ~88 | — | — | Same | 4 |
| WaveRNN+ @ 61 dense-equiv units | MUSHRA | ~44 | — | — | Same | 4 |
| WaveRNN+ @ 122 dense-equiv units | MUSHRA | ~71 | — | — | Same | 4 |
| WaveRNN+ @ 203 dense-equiv units | MUSHRA | ~85 | — | — | Same | 4 |

Interpretation stated by the authors: LPCNet quality "significantly exceeds" WaveRNN+ at equal complexity; equivalently, the same quality is reachable at significantly reduced complexity. The µ-law condition sitting essentially at reference level validates that pre-emphasized 8-bit µ-law quantization noise is negligible compared to the synthesis artifacts. *(p.4)*

## Methods & Implementation Details

- **Feature extraction at test time**: features are computed from the original recorded audio (ground truth) rather than predicted, to isolate vocoder quality from any text-to-speech or coding front end. *(p.4)*
- **Cepstrum band layout** is the same as in [20] (Valin, "A hybrid DSP/deep learning approach to real-time full-band speech enhancement", MMSP 2018). *(p.4)*
- **Pitch estimator**: open-loop cross-correlation search. *(p.4)*
- **LPC per frame, 5 steps** *(p.2)*:
  1. Take the 18-band Bark-frequency cepstrum for the frame.
  2. Convert to a linear-frequency power spectral density.
  3. Inverse FFT the PSD to get the auto-correlation.
  4. Run Levinson-Durbin on the auto-correlation to get the predictor `a_k`.
  5. Hold `a_k` constant for the frame; use with `s_{t-16..t-1}` to form `p_t` each sample.
- **Sparsification schedule**: training starts with **dense** matrices, and the blocks with the lowest magnitudes are **progressively forced to zero** until the desired sparseness is reached. *(p.3)*
- **Diagonal retention**: all diagonal terms of the sparse matrix are kept non-zero because those are most likely to be non-zero anyway. Although not aligned horizontally or vertically with the 16x1 blocks, diagonal terms are still easy to vectorize since they become an element-wise multiply with the vector operand. This avoids forcing a whole 16x1 non-zero block just to hold a single diagonal element. *(p.3)*
- **Noise injection procedure (Fig. 2, p.3)**: clean input speech → pre-emphasis `1-αz^{-1}` → `s_t`. `s_t` is µ-law quantized (`Q`), noise is added in the µ-law domain (orange `+`), converted back to linear (`Q^{-1}`), and fed to the prediction filter `P(z) = Σ a_k z^{-k}` to produce `p_t`. The **excitation `e_t` is computed as the difference between the clean, unquantized input `s_t` and the prediction `p_t`**. The noisy quantized signal, its delayed copy, `p_t` and the delayed quantized excitation form the *training inputs*; the quantized `e_t` is the *training target*. *(p.3)*
- **Why noise injection matters here specifically**: injecting noise in the signal while training the network on the *clean* excitation produces artifacts like the pre-analysis-by-synthesis vocoder era, where noise takes the shape of the synthesis filter `1/(1-P(z))`. Arranging it as in Fig. 2 makes the network minimize error in the signal domain even though its output is the residual, because one of its inputs is the same prediction used to compute that residual. Analogous to analysis-by-synthesis in CELP [18, 19]; greatly reduces synthesis artifacts. *(p.3)*
- **Noise magnitude schedule**: injected directly in the µ-law domain so it is proportional to signal amplitude; the distribution is varied across the training data from *no noise* to a uniform distribution over `[-3, 3]`. *(p.3)*
- **Training stack**: Nvidia GPU, Keras/TensorFlow, CuDNN GRU implementation, AMSGrad optimizer. *(p.4)*
- **Source code**: https://github.com/mozilla/LPCNet/ ; evaluation at commit `0ddcda0`. Audio samples: https://people.xiph.org/~jm/demo/lpcnet/. *(p.4)*
- **Quantization for coding**: for low-bitrate coding applications the cepstrum and pitch parameters would be quantized [4]; for TTS they would be computed from text by another neural network [1]. *(p.1)*

## Figures of Interest
- **Fig. 1 (p.2):** Overview of the LPCNet algorithm. Yellow = frame rate network (once per frame, output held constant); blue = sample rate network. The `compute LPC` → `compute prediction` chain feeds `p_t`. Inputs to `concat` are `p_t`, `s_{t-1}`, `e_{t-1}`, plus `f`. Path is concat → GRU_A → GRU_B → dual FC → softmax → `P(e_t)` → sampling → `e_t`, then `s_t = p_t + e_t`. µ-law/linear conversions omitted; de-emphasis applied to `s_t`.
- **Fig. 2 (p.3):** Noise injection during training. `Q` = µ-law quantization, `Q^{-1}` = µ-law→linear. Prediction filter `P(z)` applied to the noisy quantized input. Excitation = clean unquantized input minus prediction. Noise added in the µ-law domain.
- **Fig. 3 (p.4):** MUSHRA quality vs dense-equivalent GRU_A units for Reference, µ-law, LPCNet, WaveRNN+. LPCNet curve sits clearly above WaveRNN+ at every size, with the gap widest at the smallest size (~15 MUSHRA points at 61 units, ~9 at 122, ~3 at 203).

## Results Summary
LPCNet significantly exceeds WaveRNN+ quality at matched complexity across all three network sizes, with the advantage largest at small network sizes — exactly the regime that matters for embedded deployment. *(p.4)* Total complexity is ~2.8 GFLOPS at `N_A=384`, against ~10 GFLOPS for sparse mobile WaveRNN, ~16 GFLOPS for FFTNet, and ~50 GFLOPS for SampleRNN. *(p.4)* Real-time synthesis runs on a single core of an Apple A8 (iPhone 6) or 20% of a 2.4 GHz Intel Broadwell core. *(p.4)* Computing only a single 256-value distribution (rather than the original 16-bit WaveRNN's coarse/fine pair) further reduces complexity. *(p.4)*

## Limitations
- **Roughness between pitch harmonics** is the main audible artifact in generated samples, present in both WaveRNN+ and LPCNet, attributed to noise. A possible remedy — post-denoising as suggested in [6] — was **not investigated**. *(p.4)*
- Objective metrics such as **PESQ and POLQA cannot adequately evaluate non-waveform neural vocoders** [4], so only subjective MUSHRA results are reported. *(p.4)*
- LPC computed from the cepstrum is **less accurate** than LPC computed from the input signal, due to the low resolution of the cepstrum; the authors argue the effect is small because the network compensates, but they do not quantify it. *(p.2)*
- Training set is small (4 hours) and the evaluation covers 8 utterances from 4 speakers. *(p.4)*
- The coarse/fine 16-bit split of the original WaveRNN is dropped without ablation; it is simply not used. *(p.1)*
- DualFC is described as only "slightly" improving quality; no numeric ablation is given. *(p.2)*
- Long-term (pitch) prediction is **not** incorporated; listed as future work. *(p.4)*

## Arguments Against Prior Work
- **WaveNet [5] and the first generation of neural synthesis**: gave real-time results only with a high-end GPU providing tens of GFLOPS, unusable on mobile phones with limited battery. *(p.1)*
- **Neural models that model the whole production process [4, 5, 6, 7, 16]**: they must learn glottal pulses, noise excitation *and* the vocal tract response, even though the vocal tract response is already well represented by a simple all-pole linear filter [17]. This is wasted network capacity. *(p.2)*
- **Classical low-bitrate parametric vocoders [8, 9]**: efficient at spectral-envelope modeling but quality "has always been severely limited" because no simple model exists for the excitation; advances in [10, 11, 12] have not solved excitation modeling. *(p.1)*
- **Open-loop filtering approaches [12]** (e.g. speaker-independent raw waveform glottal excitation models): LPCNet's closed-loop arrangement, where the network sees `s_{t-1}` and `p_t` and can compensate for inaccurate LPC, is presented as an advantage over these. *(p.2)*
- **16-bit output extension in WaveRNN [7]**: LPCNet argues pre-emphasis plus 8-bit µ-law is sufficient and cheaper; the MUSHRA µ-law anchor at reference level supports this. *(p.2, p.4)*
- **Fixed-temperature sampling in FFTNet [6]** (constant `c = 2` for voiced sounds): requires a binary voicing decision; LPCNet replaces it with a continuous function of pitch correlation. *(p.3)*
- **General element-wise sparsity**: prevents efficient vectorization, hence block-sparse matrices instead. *(p.3)*
- **Naive noise injection** (noise in the signal, training on clean excitation): produces pre-analysis-by-synthesis-era artifacts where noise takes the shape of the synthesis filter. *(p.3)*
- **Open-loop synthesis on `e_{t-1}` alone**: produces bad quality speech, which is why `s_{t-1}` and `p_t` are retained as inputs. *(p.2)*

## Design Rationale
- **Give the vocal tract to LPC, keep the excitation for the network.** The vocal tract response is well modeled by a simple all-pole filter [17]; the excitation is not. Spending network capacity only where no classical model exists is what buys the complexity reduction. *(p.1, p.2)*
- **Compute LPC from the cepstrum, not the signal.** Guarantees the decoder/synthesizer can derive `a_k` from information it already has, so nothing extra is transmitted or predicted. Accepts a resolution penalty in exchange, mitigated by network compensation. *(p.2)*
- **Predict the excitation, not the sample.** Slightly easier task and slightly less µ-law quantization noise, since the excitation has smaller amplitude than the pre-emphasized signal. *(p.2)*
- **Still feed `s_{t-1}` and `p_t`.** Open-loop synthesis from `e_{t-1}` alone was tried and gives bad quality. *(p.2)*
- **Pre-emphasis instead of a 16-bit output.** Shapes µ-law noise 16 dB down at Nyquist, keeping the output distribution at 256 values and avoiding the coarse/fine split. *(p.2)*
- **Block-sparse 16x1 instead of unstructured sparsity or 4x4.** 16x1 gives good accuracy while staying vectorizable. *(p.3)*
- **Keep the diagonal.** Diagonal terms are most likely non-zero and vectorize as an element-wise multiply, so forcing whole blocks around single diagonal elements is avoided. *(p.3)*
- **Learned embedding of µ-law levels instead of scaling scalars.** Exploits the discrete nature of µ-law values to learn a set of non-linear functions of the µ-law value; the trained embedding was confirmed to have learned the µ-law→linear conversion among other things. *(p.3)*
- **Fold the embedding into the GRU input weights.** Reduces embedded-input cost to a single add per gate per input, so the large embedding matrices never need to fit in cache. *(p.3)*
- **Fold the conditioning vector once per frame.** `f` is constant over a frame, so `g^(·) = U^(·)f` is a per-frame cost, not a per-sample one. *(p.3)*
- **GRU_B replaces the FC+ReLU layer.** A small dense GRU in place of WaveRNN's ReLU FC layer. *(p.3)*
- **DualFC instead of one FC.** Two tanh comparisons per output, matching the two-sided nature of "is this value inside this µ-law bin". *(p.2)*
- **Noise injection in the loop.** Makes the network minimize signal-domain error even though its output is the residual, analogous to CELP analysis-by-synthesis. *(p.3)*
- **Noise in the µ-law domain.** Makes injected noise proportional to signal amplitude. *(p.3)*
- **Continuous logit scaling from pitch correlation.** Avoids a hard voicing decision. *(p.3)*
- **Probability floor with renormalization.** Kills impulse noise from very low-probability bins while preserving naturalness at `T = 0.002`. *(p.3)*

## Testable Properties
- Pre-emphasis with `α = 0.85` followed by de-emphasis must reduce µ-law quantization noise power at Nyquist by ~16 dB. *(p.2)*
- The µ-law (pre-emphasized 8-bit quantization) MUSHRA anchor must sit at or near the clean reference score, i.e. quantization noise is negligible relative to synthesis artifacts. *(p.4)*
- LPCNet MUSHRA must exceed WaveRNN+ MUSHRA at every matched dense-equivalent GRU_A size, with the gap decreasing as size increases. *(p.4)*
- Complexity `C = (3dN_A² + 3N_B(N_A+N_B) + 2N_B Q)·2F_s` must yield ≈2.3 GFLOPS before neglected terms and ≈2.8 GFLOPS total at `N_A=384, N_B=16, Q=256, F_s=16000, d=0.1`. *(p.4)*
- A sparse GRU of `N_A` units at density `d = 0.1` must have the same non-zero weight count as a dense GRU of size ≈61 (`N_A=192`), 122 (`N_A=384`), 203 (`N_A=640`). *(p.4)*
- Sampling constant `c` must lie in `[1, 2]` given `0 < g_p < 1`, equalling 1 for `g_p ≤ 1/3` and approaching 2 as `g_p → 1`. *(p.3)*
- Zeroing output probabilities below `T = 0.002` and renormalizing must reduce impulse noise; larger `T` must degrade naturalness. *(p.3)*
- Synthesis conditioned only on `e_{t-1}` (dropping `s_{t-1}` and `p_t`) must degrade quality noticeably. *(p.2)*
- Training noise applied in the signal domain with clean-excitation targets must produce synthesis-filter-shaped artifacts, whereas the Fig. 2 arrangement must not. *(p.3)*
- LPC derived from the 18-band Bark cepstrum must be less accurate than LPC from the signal, but the quality impact must be small. *(p.2)*
- Real-time factor must be ≤ 1.0 on a single Apple A8 core at 16 kHz with `N_A = 384`. *(p.4)*

## Relevance to Project
This is the cleanest modern statement of the **source-filter contract** that a formant/source-filter synthesizer already lives inside, with the filter kept classical and only the source replaced. Concretely reusable ideas, independent of whether a neural excitation is ever adopted:

- **Excitation-domain synthesis with an in-loop prediction filter.** `s_t = p_t + e_t` with `p_t = Σ a_k s_{t-k}` computed from the *synthesized* history is exactly the structure of a classical LPC synthesizer; LPCNet only swaps the excitation generator. Any excitation generator (Klatt-style impulse+noise, KLGLOTT88, a learned model) can be dropped into the same slot.
- **Deriving the filter from the same parameters the frontend already carries.** The cepstrum → PSD → autocorrelation → Levinson-Durbin chain gives a principled way to convert a spectral-envelope parameterization into an all-pole filter without transmitting or predicting extra coefficients. A formant synthesizer's target spectrum could be converted to LPC through the same path when an all-pole realization is wanted.
- **Pre-emphasis (`α = 0.85`) before quantization, de-emphasis after.** A 16 dB Nyquist noise reduction for two multiply-adds. Directly applicable to any 8-bit or low-precision output path, and to noise shaping in a fixed-point worklet.
- **Complexity accounting formula (eq. 8).** A usable template for budgeting a per-sample DSP or neural inner loop against a real-time deadline, with a concrete "20% of a 2.4 GHz Broadwell core" reference point.
- **Sparsity discipline for anything matrix-heavy**: dense-then-prune-by-block-magnitude, 16x1 blocks, keep the diagonal. Relevant if the project ever adds a learned component.
- **The sampling post-processing (eqs. 6 and 7)** encodes voicing softly through pitch correlation instead of a binary voiced/unvoiced switch. That is directly transferable to how a rule-based synthesizer might blend periodic and aperiodic excitation continuously rather than switching.
- **Evaluation methodology**: MUSHRA with 100 participants, an explicit quantization-only anchor to bound achievable quality, and the explicit claim that PESQ/POLQA do not work on non-waveform vocoders. Useful when designing listening tests for the project's own output.
- **Compute budget calibration**: ~2.8 GFLOPS is real-time on a 2014 phone core. Any browser-based worklet budget can be sanity-checked against this number.

## Open Questions
- [ ] What exactly is the "dense equivalent units" mapping? The paper gives 61/122/203 for `N_A` = 192/384/640 at `d = 0.1` but does not show the derivation.
- [ ] How much does DualFC actually buy over a single FC at equal complexity? No numbers given.
- [ ] How much does the reduced-accuracy cepstral LPC cost versus signal-derived LPC? Asserted small, never measured.
- [ ] Does the coarse/fine 16-bit split of the original WaveRNN add anything once pre-emphasis is in place?
- [ ] Would long-term (pitch) prediction reduce complexity further, as the conclusion suggests?
- [ ] Would post-denoising [6] remove the inter-harmonic roughness artifact?
- [ ] What is the exact 18-band Bark layout from [20]?
- [ ] What is the µ-law-domain noise schedule across the training set ("from no noise to uniform [-3, 3]") — how is it varied?

## Related Work Worth Reading
- **[17] Makhoul, "Linear prediction: A tutorial review," Proc. IEEE 63(4):561-580, 1975.** The authority LPCNet cites for the all-pole vocal tract claim; the foundation for the whole filter side.
- **[7] Kalchbrenner et al., "Efficient neural audio synthesis" (WaveRNN), arXiv:1802.08435, 2018.** The direct baseline; source of the block-sparse GRU technique and the "equivalent dense size" convention.
- **[20] Valin, "A hybrid DSP/deep learning approach to real-time full-band speech enhancement," MMSP 2018.** Source of the 18-band Bark layout used for the cepstrum.
- **[18] Atal and Remde, "A new model of LPC excitation for producing natural-sounding speech at low bit rates," ICASSP 1982**, and **[19] Schroeder and Atal, "Code-excited linear prediction (CELP)," ICASSP 1985.** The analysis-by-synthesis lineage that LPCNet's noise-injection scheme deliberately imitates.
- **[12] Juvela et al., "Speaker-independent raw waveform model for glottal excitation," Interspeech 2018.** The open-loop glottal-excitation approach LPCNet argues against; directly relevant to source modeling.
- **[8] Atal and Hanauer, "Speech analysis and synthesis by linear prediction of the speech wave," JASA 50(2B):637-655, 1971.** Origin of LPC speech synthesis.
- **[6] Jin et al., "FFTNet: A real-time speaker-dependent neural vocoder," ICASSP 2018.** Source of the temperature-sampling and noise-injection ideas LPCNet refines, and of the post-denoising suggestion.
- **[22] ITU-R BS.1534-1 (MUSHRA).** The listening-test methodology. → NOW IN COLLECTION: [Method for the subjective assessment of intermediate quality level of audio systems (Recommendation ITU-R BS.1534-3)](../ITU-R_2015_MUSHRA_BS1534/notes.md)

## Collection Cross-References

### Already in Collection
- (none - the specific papers cited here, e.g. Makhoul 1975, Atal & Hanauer 1971, are not yet in the collection; see Conceptual Links for a close relative)

### New Leads (Not Yet in Collection)
- J. Makhoul (1975) - "Linear prediction: A tutorial review" - the authority LPCNet cites for the claim that the vocal tract response is well modeled by a simple all-pole filter; foundational for the filter side of any source-filter synthesizer
- N. Kalchbrenner et al. (2018) - "Efficient neural audio synthesis" (WaveRNN) - the direct baseline LPCNet modifies; source of the block-sparse GRU technique and coarse/fine 16-bit output split
- B.S. Atal, J. Remde (1982) - "A new model of LPC excitation for producing natural-sounding speech at low bit rates" - origin of the analysis-by-synthesis idea LPCNet's noise-injection training scheme deliberately reproduces
- M. Schroeder, B.S. Atal (1985) - "Code-excited linear prediction (CELP)" - the analysis-by-synthesis lineage LPCNet's in-loop noise injection imitates
- L. Juvela et al. (2018) - "Speaker-independent raw waveform model for glottal excitation" - the open-loop glottal-excitation approach LPCNet explicitly argues against
- B.S. Atal, S.L. Hanauer (1971) - "Speech analysis and synthesis by linear prediction of the speech wave" - origin of LPC speech synthesis
- D. Griffin, J. Lim (1985) - "A new model-based speech analysis/synthesis system" - cited among the classical parametric vocoders whose excitation modeling LPCNet argues is severely limited

### Supersedes or Recontextualizes
- (none)

### Now in Collection (previously listed as leads)
- [Method for the subjective assessment of intermediate quality level of audio systems (Recommendation ITU-R BS.1534-3)](../ITU-R_2015_MUSHRA_BS1534/notes.md) - The normative MUSHRA specification LPCNet's listening test implements (ref [22]): hidden reference, mandatory anchors, 0-100 scale. LPCNet's µ-law quantization-only condition functions as a de facto low anchor, consistent with the Recommendation's anchor requirement.

### Conceptual Links (not citation-based)
- [WORLD: A Vocoder-Based High-Quality Speech Synthesis System for Real-Time Applications](../Morise_2016_WORLDVocoder-BasedHigh-QualitySpeech/notes.md) - both are real-time-oriented vocoders explicit about RTF/complexity as a design constraint; LPCNet substitutes a neural excitation model for WORLD's minimum-phase-impulse-plus-extracted-excitation synthesis, making them opposite answers (learned vs. classical DSP) to the same "high quality, real-time synthesis" problem.
- [Implementation Notes: El-Jaroudi & Makhoul 1991 — Discrete All-Pole Modeling](../ElJaroudi_Makhoul_1991_DiscreteAllPoleModeling/notes.md) - LPCNet derives its LPC coefficients from a coarse 18-band Bark cepstrum via PSD-then-autocorrelation-then-Levinson-Durbin, accepting a resolution penalty it argues the network compensates for; DAP's discrete Itakura-Saito criterion is a purpose-built alternative for fitting an all-pole filter directly to a sparse/discrete spectral representation, which is exactly LPCNet's situation and a candidate fix for the very inaccuracy it flags as an open question.

---
*Provenance: read from `pngs/page-000.png` … `page-004.png` (5 pages, arXiv:1810.11846v2). All 5 pages read directly.*
