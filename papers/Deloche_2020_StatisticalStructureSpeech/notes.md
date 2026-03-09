# Fine-grained statistical structure of speech

**Authors:** François Deloche
**Year:** 2020
**Venue:** PLoS ONE 15(3): e0230233
**DOI:** https://doi.org/10.1371/journal.pone.0230233

## One-Sentence Summary

This paper uses a parametric Gabor dictionary decomposition to characterize the optimal time-frequency trade-off (parameter β) for every American English phoneme, revealing that structured sounds (vowels, nasals) favor time-localized representations while non-structured sounds (fricatives) favor frequency-localized representations, with the trade-off governed by formant bandwidths and lip radiation for vowels, and burst/frication localization for obstruents.

## Problem Addressed

Previous ICA-based analyses of speech statistics used broad phonetic categories (e.g., "fricatives" vs "vowels") and could not explain the within-category variation in time-frequency trade-offs. A finer-grained analysis linking the optimal decomposition parameter β to specific acoustic properties of individual phonemes was missing.

## Key Contributions

- Introduces a parametric approach using Gabor filter dictionaries indexed by a single parameter β (the Q₁₀/f_c power-law exponent) to characterize the statistical structure of speech at the phoneme level
- Maps all American English phonemes in a (β, h) plane, revealing two clusters: structured sounds (h < 0.7: vowels, semivowels, nasals) and non-structured sounds (h > 0.7: stops, fricatives, affricates)
- Shows that stop/affricate releases are biphasic: the burst phase favors time decomposition (low β), while the opening/aspiration phase favors frequency decomposition (high β, similar to fricatives)
- Demonstrates that for vowels, β is related to formant bandwidths and degree of acoustic radiation at the lips — unrounded vowels with wider lip opening yield lower β
- Shows β decreases with increasing sound intensity level, consistent with nonlinear cochlear filter broadening

## Methodology

1. Construct 30 overcomplete Gabor filter dictionaries, each indexed by β ∈ [0.3, 1.2], with 600 filters per dictionary
2. For each 16 ms speech slice (n=256 samples at 16 kHz, high-pass filtered at 1.5 kHz), decompose into all dictionaries
3. Compute a sparsity-based cost function h(β) for each dictionary
4. The optimal β* = argmin_β h(β) identifies the best time-frequency trade-off for that speech segment
5. Two analyses: (1) per-phoneme β* from 400 random occurrences in TIMIT, (2) temporal evolution of β* within phonemes using 8 time steps

## Key Equations

$$
w(t) = C \sin(\omega t + \phi) \exp\left(-\frac{(t-\tau)^2}{4\sigma_t^2}\right)
$$
Where: $w(t)$ is a Gabor filter, $\tau$ = time shift, $\sigma_t$ = time deviation, $\phi$ = phase, $f_c$ = center frequency, $C$ = normalization constant (Eq. 1)

$$
\log Q_{10}(f) = \log Q_0 + \beta(\log f - \log f_0) + 0.04\eta
$$
Where: $Q_{10}$ = quality factor (10dB bandwidth), $f$ = center frequency, $f_0$ = 1 kHz, $Q_0$ = 2, $\beta$ = power-law exponent, $\eta$ = i.i.d. normal noise (Eq. 2)

$$
h_{\text{raw}}(\beta) = \mathbb{E}(\|Y_\beta\|_1) = \mathbb{E}\left(\sum_i |[W_\beta^T X]_i|\right)
$$
Where: $Y_\beta = W_\beta^T X$ is the decomposition of signal $X$ in dictionary $W_\beta$, and $h$ is the L₁ norm measuring sparsity (Eq. 3)

$$
h(\beta) = \mathbb{E}\left(\sum_i \gamma(f_i) |[W_\beta^T X]_i|\right)
$$
Where: $\gamma(f_i)$ is a frequency-dependent weight for the i-th filter at center frequency $f_i$ (Eq. 8)

$$
Z = \rho_0 c \left[\frac{(kr)^2}{1+(kr)^2} + j\frac{kr}{1+(kr)^2}\right]
$$
Where: $Z$ = radiation impedance for a sphere of radius $r$, $k = \omega/c$, $\rho_0$ = air density, $c$ = speed of sound (Eq. 10, used in Simulation 2 for vocal tract radiation)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Power-law exponent | β | dimensionless | 0.75 (overall speech) | 0.3–1.2 | β=0: constant-Q (wavelet); β=1: constant resolution (STFT) |
| Quality factor at f₀ | Q₀ | dimensionless | 2 | — | Intercept of Q₁₀ vs f_c on log-log scale at f₀=1 kHz |
| Cost function (sparsity) | h | dimensionless | — | 0.47–1.0 | Low h = structured (vowels); high h = noise-like |
| Contrast | c | % | — | 0.4–2.1 | (h_max - h_min)/h_max; measures significance of β minimum |
| Time window | T | ms | 16 | — | Duration of speech slices |
| Sampling frequency | f_s | kHz | 16 | — | TIMIT corpus rate |
| High-pass cutoff | — | kHz | 1.5 | — | Butterworth order 8; analysis focuses on 1.5–8 kHz |
| Smoothing σ | σ | — | 0.03 | — | Gaussian smoothing on β axis for h(β) curves |
| Filter count per dictionary | m | — | 600 | — | Overcomplete (m > n=256) |
| Dictionary count | — | — | 30 | — | One per β value in [0.3, 1.2] |

### β values by phoneme category (from Fig 2 and Fig 3)

| Category | Mean β | Mean h | Notes |
|----------|--------|--------|-------|
| Semivowels | ~0.55 | ~0.58 | Most structured; lowest β |
| Vowels | ~0.6 | ~0.60 | Tight cluster at β ≈ 0.6 ± 0.2 |
| Nasals | ~0.9 | ~0.70 | Higher β than vowels due to antiresonances |
| Overall speech | ~0.75 | ~0.75 | — |
| Stops | ~0.5 (burst), ~1.0 (opening) | ~0.80 | Biphasic: burst=time, opening=frequency |
| Affricates | ~0.65 | ~0.90 | Wide confidence intervals |
| Fricatives | ~1.0 | ~0.95 | Frequency representation; sibilants β > 1 |

### β values by specific vowel (from Fig 3)

| Phoneme | Approx. β | Notes |
|---------|-----------|-------|
| [æ] | 0.40 | Unrounded, wide opening |
| [eɪ] | 0.42 | Diphthong |
| [aɪ] | 0.43 | Diphthong |
| [aʊ] | 0.48 | Diphthong |
| [ɛ] | 0.55 | — |
| [ɹ] | 0.55 | Rhotic approximant |
| [ɑ] | 0.60 | Back vowel; does not match the radiation pattern |
| [ɔ] | 0.62 | — |
| [ɪɔ] | 0.63 | — |
| [ə] | 0.65 | — |
| [ʌ] | 0.58 | — |
| [oʊ] | 0.68 | — |
| [ʊ] | 0.70 | Rounded |
| [i] | 0.65 | — |
| [ɪ] | 0.68 | — |
| [u] | 0.72 | Rounded, smallest opening |

## Implementation Details

### Data preprocessing
- Speech from TIMIT database, American English
- 16 ms slices (256 samples at 16 kHz)
- High-pass Butterworth filter, order 8, cutoff 1.5 kHz
- RMS normalization per slice
- Stop closures excluded (no high-frequency content)
- TIMIT release annotations used to separate stop burst from opening phase

### Weighting strategies
- **Strategy A** (raw scores): γ(f) = γ₀ (constant) — naive, no spectral compensation
- **Strategy B** (spectral whitening): γ(f) inversely proportional to amplitude spectral density (+5 dB/octave)
- **Strategy C** (compromise): +2.5 dB/octave gain — used for main results

### Analysis procedures
- **Analysis 1**: 400 occurrences per phoneme (800 per category), single random 16ms slice each; β* from bootstrap (3000 reps), 70% CI reported
- **Analysis 2**: 400 occurrences per phoneme, 8 consecutive 16ms slices per occurrence (relative time steps 1–8); β* estimated per time step

### Simulation 1 (noise localization)
- Parameter u ∈ [0,1]: u=0 → time-windowed noise (σ_t=0.16ms), u=1 → frequency-windowed noise (σ_f=80 Hz)
- Time localization → low β; frequency localization → high β
- Demonstrates the basic mechanism: localized structure determines optimal β

### Simulation 2 (vocal tract radiation)
- Uniform cylindrical waveguide, open at one end
- Radius r from 0.2 cm (u=0) to 1.3 cm (u=1)
- Radiation impedance Z per Eq. 10, with surface loss correction k = ω/c - jα
- Greater aperture → wider bandwidths → lower β
- Phase transition around u=0.5 (r≈0.7 cm)

## Figures of Interest

- **Fig 1 (page 5):** Interpretation of β — the Q₁₀ vs f_c relationship on log-log scale; filter shapes at different β values
- **Fig 2 (page 8):** Box plots of broad phonetic categories in (β, h) plane — key result showing two clusters
- **Fig 3 (page 11):** All American English phonemes in (β, h) plane with 70% bootstrap CIs — the central figure
- **Fig 4 (page 12):** Simulation results — modulated noises and cylindrical waveguide vowels in (β, h) plane
- **Fig 5 (page 14):** Stop/affricate biphasic decomposition — burst (_rl) vs opening (_rl2) in (β, h) plane
- **Fig 6 (page 15):** Temporal evolution of β within phonemes — 8 time steps from start to end
- **Fig 7 (page 17):** β vs intensity level — decreasing β with increasing intensity, paralleling cochlear nonlinearity

## Results Summary

### Non-structured sounds (obstruents)
- Fricatives: most are β > 1 (frequency representation), consistent with spectral filtering of noise
  - Sibilants [s], [ʃ] have highest β (~1.1–1.2) due to sharp spectral shaping by short front cavity
  - Wide-band fricatives [f], [θ] have lower β (~0.4–0.5) and maximal h (least structured)
  - Voiced fricatives shift toward lower β/h vs unvoiced (voicing adds time localization)
- Stops: biphasic after release
  - Burst phase: minimal β (time-localized, like noise with temporal gate)
  - Opening phase: β close to 1 (frequency-localized, similar to fricatives)
  - Transition speed varies: [t] → fast transition (sibilant-like opening); [p] → gradual (formant structure appears)
- [h] clusters with fricatives, not semivowels (despite traditional classification)
- [v] and [ð] cluster with stops, not fricatives

### Structured sounds (sonorants)
- Vowels: tight cluster β ≈ 0.6 ± 0.2, governed by formant bandwidths and lip radiation
  - Unrounded vowels [æ], [eɪ], [aɪ] yield lower β (wider radiation → wider bandwidths)
  - Rounded vowels [u], [ʊ] yield higher β (smaller opening → narrower bandwidths)
  - Back vowel [ɑ] doesn't match pattern (constriction at back weakens radiation effect)
- Nasals: β ≈ 0.9, higher than vowels, attributed to antiresonances cutting formant bandwidths
- Semivowels: similar β/h range as vowels
- Rhotic [ɹ] and r-colored vowels: β ≈ 0.8, h ≈ 0.47 (very structured, strong high-frequency peak ~1 kHz)

### Level dependence
- β decreases with increasing intensity for all speech
- Parallels cochlear filter broadening at high levels (nonlinear compression)
- Suggests efficient coding strategy reduces frequency selectivity with intensity

## Limitations

- Analysis restricted to 1.5–8 kHz range (high-pass at 1.5 kHz) — does not capture low-frequency structure including F0 and F1 for many vowels
- 16 ms time window means F0 harmonics not resolved (shorter than glottal period for male voices)
- Gabor filters are symmetric in time; cochlear filters are asymmetric — noted as a limitation for auditory modeling
- Parametric model constrains all filters in a dictionary to the same β; ICA can depart from power-law model for individual phonemes
- β values depend somewhat on experimental settings (f₀, Q₀, preprocessing, weighting strategy), though distribution patterns are robust
- TIMIT corpus only (American English) — cross-linguistic generalization not tested

## Testable Properties

- β for overall speech should be ~0.75 (between constant-Q and constant-resolution)
- Vowels should cluster tighter in β than stops or affricates
- Unrounded vowels should yield lower β than rounded vowels (wider radiation → wider bandwidths)
- Stop releases should show biphasic β: low at burst onset, high in opening/aspiration phase
- Increasing sound intensity should decrease β
- Sibilant fricatives [s], [ʃ] should have higher β than non-sibilant [f], [θ]
- Voiced fricatives should have lower β than their unvoiced counterparts
- h (cost/structuredness) should be < 0.7 for vowels/nasals/semivowels and > 0.7 for fricatives/stops

## Relevance to Project

This paper provides a principled, data-driven characterization of how different phoneme classes are optimally represented in time-frequency space. For Qlatt's formant synthesizer:

1. **Formant bandwidth validation**: The finding that vowel β is governed by formant bandwidths and lip radiation confirms that bandwidth parameters in the Klatt synthesizer are acoustically important for perceptual naturalness — narrower bandwidths (higher β, more frequency-localized) for rounded vowels vs wider bandwidths for unrounded.

2. **Stop release modeling**: The biphasic burst/opening result (Fig 5, Fig 6) provides independent evidence that the PLSTEP burst mechanism (time-localized transient) must be distinct from the aspiration/frication phase that follows, and that the transition timing varies by place of articulation.

3. **Fricative characterization**: Confirms that sibilants [s], [ʃ] have sharper spectral structure than [f], [θ], supporting different parallel branch gain profiles in the Klatt synthesizer.

4. **Voicing effects**: Voiced consonants shifting toward time-localized representations supports the importance of modeling periodic excitation as a distinct, time-localized feature.

## Open Questions

- [ ] Would the vowel β values correlate with Klatt bandwidth parameters (B1–B5) from the inventory?
- [ ] Can the biphasic stop transition timing inform PLSTEP envelope duration vs aspiration onset timing?
- [ ] How do the β values for nasals relate to the nasal pole-zero frequency settings in the Klatt synthesizer?
- [ ] Does the intensity-dependent β suggest that formant bandwidths should widen with amplitude in synthesis?

## Related Work Worth Reading

- Stilp CE, Lewicki MS (2013) — ICA applied to phonetic categories; predecessor study with β values for broad classes
- Lewicki MS (2002) — Efficient coding of natural sounds; foundational ICA-on-speech study establishing Q₁₀/f_c power law
- Erra RG, Gervain J (2016) — Cross-linguistic differences in efficient coding of speech
- Fant G (1972) — Vocal tract wall effects, losses, and resonance bandwidths [Ref 32]
- Stevens KN (1998) — Acoustic Phonetics [Ref 33]
- Hanna et al. (2016) — Frequencies, bandwidths and magnitudes of vocal tract resonances measured through lips [Ref 28]

## Collection Cross-References

### Already in Collection
- [[Stevens_1998_AcousticPhonetics]] — cited as [33] for acoustic phonetic framework; Deloche's statistical results quantitatively validate Stevens' phoneme-level descriptions

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Stilp, C. E. & Lewicki, M. S. (2013) — "Statistical structure of speech sound classes is congruent with cochlear nucleus response properties" — direct predecessor with broad phonetic class β values
- Lewicki, M. S. (2002) — "Efficient coding of natural sounds" — foundational paper establishing Q₁₀/f_c power law for ICA-learned filters
- Erra, R. G. & Gervain, J. (2016) — "The efficient coding of speech: Cross-linguistic differences" — extends Deloche's approach cross-linguistically
- Hanna, N. et al. (2016) — "Frequencies, bandwidths and magnitudes of vocal tract resonances measured through lips" — lip radiation measurements connecting to Deloche's vowel β findings

### Conceptual Links (not citation-based)
- [[Kent_Vorperian_2018_VowelFormantBandwidths]] — (Strong) Kent & Vorperian provide comprehensive formant bandwidth data; Deloche's finding that vowel β is governed by formant bandwidths and lip radiation provides independent statistical validation that bandwidth parameters are acoustically critical
- [[Jongman_2000_FricativeAcoustics]] — (Strong) Jongman provides detailed acoustic characterization of English fricatives; Deloche's statistical analysis independently confirms the sibilant vs non-sibilant spectral structure distinction (sibilants β > 1, non-sibilants lower β)
- [[Shadle_1985_FricativeAcoustics]] — (Moderate) Shadle's fricative acoustic theory explains why sibilants have sharper spectral structure; Deloche's β values quantify this distinction in terms of optimal time-frequency representation
- [[Badin_1989_FricativeProductionModelling]] — (Moderate) Badin models fricative production with source-filter approach; Deloche's biphasic stop/affricate finding (burst = time-localized, opening = frequency-localized like fricatives) validates the distinct source mechanisms
