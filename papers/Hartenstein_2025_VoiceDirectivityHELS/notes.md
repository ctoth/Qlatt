---
title: "Sound Source Directivity Estimation via a Spherical Wave Decomposition of the Radiated Field: Application to Human Voice Directivity Measurements"
authors: "Matthieu Hartenstein, Paul Luizard, Hélène Moingeon, Cédric Pinhède, Marc Pachebat, Christian Ollivon, François Ollivier, Fabrice Silva"
year: 2025
venue: "Forum Acusticum / Euronoise 2025 (11th Convention of the European Acoustics Association), Málaga, Spain"
doi_url: "10.61782/fa.2025.0789"
---

# Sound Source Directivity Estimation via a Spherical Wave Decomposition of the Radiated Field: Application to Human Voice Directivity Measurements

## One-Sentence Summary
Applies the Helmholtz Equation Least Squares (HELS) method with a 588-microphone spherical array to reconstruct full 3D far-field directivity of a human singer, providing frequency-dependent directivity patterns from 100 Hz to 4.5 kHz.

## Problem Addressed
Previous human voice directivity studies were limited to 2D planes, relied on repeatability assumptions for scanning arrays, or used low-order spherical arrays (order 4-5) with insufficient spatial resolution above ~2 kHz.

## Key Contributions
- First experimental application of HELS to human voice directivity reconstruction
- Proposed mixed criterion for optimal SWD truncation order combining cross-validation error and condition number stability
- Demonstrated that human voice directivity requires spherical harmonic orders >9 above 2 kHz, exceeding typical array capabilities
- Full 3D directivity reconstructions showing complex off-axis lobes not visible in 2D measurements

## Methodology
- 588 MEMS microphones on 3.6 m-diameter quasi-spherical array in anechoic chamber
- Controlled source validation: 3.5 cm speaker on 8.5 cm spherical baffle
- Singer recordings: French vowel /a/, 30 s glissando spanning ~2 octaves
- Welch's method for spectral estimation (20 ms Hann window, 80% overlap)
- Transfer functions between reference mic and array mics used as HELS input

## Key Equations

### Spherical Wave Decomposition (Eq. 1)
$$
p(r, \theta, \phi) = \sum_{n=0}^{+\infty} c_{mn}(k) \psi_n^m(kr, \theta, \phi)
$$
Where: $c_{mn}$ = expansion coefficients, $\psi_n^m$ = spherical waves (products of spherical Hankel functions $h_n(kr)$ and spherical harmonics $Y_n^m(\theta, \phi)$), $k = 2\pi f / c_0$

### Matrix formulation (Eq. 2)
$$
\mathbf{p} = \mathbf{H}\mathbf{c}
$$
Where: $\mathbf{c}$ has $(N+1)^2$ coefficients in Ambisonic Channel Number ordering

### Regularized least-squares solution (Eq. 3)
$$
\hat{\mathbf{c}} = (\mathbf{H}^H \mathbf{H} + \lambda \mathbf{I})^{-1} \mathbf{H}^H \mathbf{p}
$$
Where: $\lambda$ = regularization coefficient (set to 0 in this study due to dense array)

### Far-field directivity reconstruction (Eq. 4)
$$
D_\infty(\theta, \phi) = \sum_{n=0}^{N} \sum_{m=-n}^{n} \hat{c}_{mn} j^{(n+1)} Y_n(\theta, \phi)
$$

### Cross-validation error (Eq. 5)
$$
\mathcal{L}_{CV} = \frac{\sqrt{\sum_{q=0}^{Q-1} |p(r_q, \theta_q, \phi_q) - \hat{p}(r_q, \theta_q, \phi_q)|^2}}{\sqrt{\sum_{q=0}^{Q-1} |p(r_q, \theta_q, \phi_q)|^2}}
$$

### Optimal truncation order criterion (Eq. 6)
$$
N_{opt} = \arg\min_{N \in I} \kappa(N) \quad \text{s.t.} \quad |\mathcal{L}_{CV}(N) - \mathcal{L}_{min}| \leq \epsilon
$$
Where: $I = [0, \ldots, 9]$, $\epsilon = 0.01$, $\kappa$ = condition number of $\mathbf{H}$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Truncation order | N | - | - | 0-12 | Optimal N=4 at 200 Hz, N=9 at 2 kHz for singer |
| Regularization | λ | - | 0 | - | Set to 0 (dense array) |
| CV tolerance | ε | - | 0.01 | - | Max distance to minimal CV error |
| Array radius | - | m | 1.8 | - | 3.6 m diameter |
| Microphone count | Q | - | 588 | - | MEMS microphones |
| Sampling frequency | - | kHz | 50 | - | Megamicros system |
| Spectral window | - | ms | 20 | - | Hann window, 80% overlap |
| Sweep duration | - | s | 30 | - | 100 Hz to 10 kHz |

## Implementation Details
- Spherical wave basis uses second-kind Hankel functions (outgoing waves)
- Coefficients ordered by Ambisonic Channel Number Sequence
- Cross-validation uses S random disjoint partitions of microphone set
- Condition number κ monotonically increases with N; critical increase above N=9

## Figures of Interest
- **Fig 2 (p.4):** Cross-validation error vs truncation order at 500 Hz, 2 kHz, 4 kHz — shows optimal N depends on frequency
- **Fig 3 (p.4):** Condition number vs N — nearly identical across frequencies, critical increase above N=9
- **Fig 4 (p.5):** Optimal N vs frequency — singer needs N≈4 at 200 Hz, N≈9 at 2 kHz
- **Fig 6 (p.6):** Frequency-angle maps of horizontal and vertical directivity — shows complex side lobes, non-frontal maxima at 600-900 Hz and 1500-2000 Hz
- **Fig 7 (p.7):** 3D balloon plots at 500 Hz, 1.9 kHz, 2.3 kHz — off-axis lobes not visible in 2D

## Results Summary
- Below 600 Hz: wide frontal lobe, nearly omnidirectional
- 600-900 Hz and 1500-2000 Hz: side lobes exceed frontal lobe amplitude; main radiation direction is NOT frontal
- 1000-1500 Hz and 2000-4500 Hz: frontal radiation dominant, narrowing with frequency
- Vertical plane: upward-directed lobes appear at ~800 Hz and ~1500 Hz
- Above 2.5 kHz: reconstruction becomes unreliable (truncation order limited to 9)
- Human voice directivity is inherently 3D — 2D measurements miss significant off-axis lobes

## Limitations
- Array order limited to ~9, insufficient above 2.5 kHz for complex sources
- Only one singer, one vowel (/a/), glissando task (not natural speech)
- No regularization used — may be needed for less dense arrays
- French vowel only; directivity patterns are phoneme-dependent

## Testable Properties
- Condition number κ(N) must monotonically increase with N for any frequency
- Cross-validation error must decrease from N=0 before reaching a plateau
- Far-field directivity at low frequency (<300 Hz) should be nearly omnidirectional
- At any frequency, N_opt for singer ≥ N_opt for simple controlled source (above 600 Hz)

## Relevance to Project
The frequency-dependent directivity patterns provide empirical data for acoustic radiation modeling in synthesis. The finding that voice radiation is non-frontal at certain frequency bands (600-900 Hz, 1500-2000 Hz) could inform radiation filter design if Qlatt ever models listener-position-dependent output. The 3D balloon plots at formant frequencies show that simple cosine directivity models are inadequate.

## Open Questions
- [ ] How does directivity vary across different vowels and consonants?
- [ ] What truncation order would be needed for reliable reconstruction above 4 kHz?
- [ ] How do these patterns change with vocal effort or singing style?

## Related Work Worth Reading
- Brandner et al. 2020 — singing voice directivity with horizontal/vertical arcs
- Pörschmann & Arend 2021 — phoneme-dependent voice directivity
- Pörschmann & Arend 2024 — downward-directed voice radiation and ground reflections
- Leishman et al. 2021 — high-resolution live speech directivity


## Collection Cross-References

### Already in Collection
- [[Porschmann_2024_VoiceDirectivityGroundReflection]] — uses the same directivity datasets (Porschmann & Arend 2023); Porschmann provides phoneme-class-specific vertical directivity analysis that complements Hartenstein's general spherical harmonic reconstruction

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Brandner et al. (2020) — "A pilot study on the influence of mouth configuration and torso on singing voice directivity" — relevant for understanding how mouth shape affects radiation patterns across vowels
- Pörschmann & Arend (2021) — "Investigating phoneme-dependencies of spherical voice directivity patterns" — directly relevant for phoneme-dependent directivity in synthesis
- Pörschmann & Arend (2024) — "On the impact of downward-directed human voice radiation on ground reflections" — implications for realistic acoustic modeling
- Leishman et al. (2021) — "High-resolution spherical directivity of live speech" — alternative high-resolution measurement methodology

### Conceptual Links (not citation-based)
- [[Kocon_2018_VowelDirectivityRunningSpeech]] — Kocon provides empirical 2D half-plane vowel directivity data (5 vowels, 13 angles, up to 20 kHz); Hartenstein's 3D spherical harmonic approach captures the full directivity picture that Kocon's half-plane may underestimate, especially for off-axis lobes above 2 kHz.
- [[Fant_1960_AcousticTheorySpeechProduction]] — Fant's acoustic theory models the vocal tract as a series of tubes with radiation at the lips; Hartenstein's empirical 3D directivity data shows that real voice radiation is far more complex than Fant's simplified monopole/dipole radiation model, especially above 600 Hz where off-axis lobes appear.
- [[Busquet_2023_VoiceAnalyticsRecordingDevices]] — Busquet's finding that high-proximity devices inflate amplitude by 5-15 dB is partly explained by Hartenstein's directivity physics: frequency-dependent directivity means microphones at different positions capture genuinely different signals, not just distance-scaled versions. (Moderate)
