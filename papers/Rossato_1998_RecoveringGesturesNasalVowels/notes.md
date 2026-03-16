---
title: "Recovering Gestures from Speech Signals: A Preliminary Study for Nasal Vowels"
authors: "Solange Rossato, Gang Feng, Rafael Laboissiere"
year: 1998
venue: "5th International Conference on Spoken Language Processing (ICSLP 98), Sydney, Australia"
doi_url: "10.21437/ICSLP.1998-546"
---

# Recovering Gestures from Speech Signals: A Preliminary Study for Nasal Vowels

## One-Sentence Summary

Uses Maeda's articulatory model to simulate nasal vowel transfer functions across varying velar port openings, then applies probabilistic (Bayesian) inversion to estimate velar port area or area ratio from cepstral coefficients.

## Problem Addressed

The articulatory-to-acoustic relationship for nasal vowels is complex and poorly understood. No corpus of simultaneous velar port measurements and speech signals existed. This study asks: can statistical inversion recover velum position from acoustic transfer functions?

## Key Contributions

- Created two synthetic databases (7000 and 8000 transfer functions) using Maeda's 9-parameter articulatory model with varying velar port configurations
- Showed that nasality projects onto an axis nearly perpendicular to the 4D oral vowel subspace (86.77 degrees)
- Demonstrated that velar port area (An) is well-estimated for small openings (< 0.8 cm^2), while area ratio (d) is a better parameter for larger openings
- Compared four spectral representations (CC, MFCC, LAR, LSP) for inversion; linear prediction coefficients (LAR, LSP) perform better for small area ratios

## Methodology

1. **Articulatory model**: Maeda's model (8 oral parameters + 1 velum parameter vm) based on X-ray data from speaker Patricia Barbier
2. **Database 1 (nasal area An)**: 1000 random oral configurations x 7 velum positions (An = 0, 0.2, 0.4, 0.8, 1.8, 2.2, 2.4, 2.6 cm^2) = 7000 transfer functions
3. **Database 2 (area ratio d)**: 1000 random oral configs x 8 area ratio values (d = 0, 0.05, 0.25, 0.5, 0.75, 0.95, 1.0) = 8000 transfer functions. Area ratio avoids tongue-position-dependent saturation of velar port area.
4. **Analysis**: PCA, linear regression, Curvilinear Component Analysis (CCA), large-scale spectral integration (3-Bark smoothing)
5. **Inversion**: Bayesian maximum-likelihood estimation of An or d from 20 cepstral coefficients, with 70/30 train/test split

## Key Equations

### Area ratio (Feng & Castelli 1996)

$$
d = \frac{A_n}{A_n + A_{oral}}
$$

Where:
- $A_n$ = nasal (velar port) area
- $A_{oral}$ = oral tract area at velum extremity
- $d = 0$: velar port closed (oral vowel)
- $d = 1$: pharyngo-nasal tract only (oral tract blocked)

### Bayesian inversion

$$
\hat{v} = \arg\max_v p(v \mid H)
$$

$$
p(v \mid H) = \frac{p(H \mid v) \cdot p(v)}{p(H)}
$$

With uniform priors $p(v)$ and $p(H)$, the estimate maximizes the likelihood $p(H \mid v)$, modeled as multivariate Gaussian for each discrete value of $v$.

## Parameters

| Name | Symbol | Units | Values | Notes |
|------|--------|-------|--------|-------|
| Velum parameter | vm | normalized | -1 to 4 | Maeda model; 0 = closed velar port, >0 = lowered velum |
| Nasal area | An | cm^2 | 0, 0.2, 0.4, 0.8, 1.8, 2.2, 2.4, 2.6 | Database 1 levels |
| Area ratio | d | dimensionless | 0, 0.05, 0.25, 0.5, 0.75, 0.95, 1 | Database 2 levels |
| Cepstral coefficients | - | - | 20 coefficients | CC, MFCC, LAR, or LSP representations |
| Pharyngo-nasal target | F'1, F'2 | Hz | ~300, ~800 | Large-scale integration peaks for fully nasal configuration |

## Implementation Details

- Transfer functions represented by 20 cepstral coefficients (four variants: CC, MFCC, LAR, LSP)
- PCA reduces oral vowel space to 4 dimensions preserving 90% variance
- Nasality axis from linear regression is nearly perpendicular to oral subspace (86.77 degrees vs 90 degrees)
- Velum saturation: for high vm, the velum rests on the tongue, causing An to plateau depending on tongue position; area ratio d avoids this confound
- 3-Bark large-scale integration (after Chistovich & Lublinskaya 1979) extracts F'1 and F'2 as perceptual features

## Figures of Interest

- **Fig 1 (page 1):** X-ray outline vs Maeda model midsagittal section showing velum
- **Fig 2 (page 3):** Projection onto nasality axis -- shows An values 0-0.8 well separated, higher values overlap; area ratio values remain distinguishable up to d=1
- **Fig 3 (page 4):** F'1-F'2 plane showing oral vs maximally nasal configurations; pharyngo-nasal target clusters around F'1=300, F'2=800 Hz
- **Fig 4 (page 4):** Correct estimation rates -- An database: excellent (<0.8 cm^2), drops above 1.8 cm^2; area ratio database: good across all values, best for high ratios

## Results Summary

- **Nasal area (An) estimation**: Near-perfect accuracy for An <= 0.8 cm^2 regardless of coefficient type; drops sharply above 1.8 cm^2 due to tongue saturation
- **Area ratio (d) estimation**: Good accuracy across all values; best for high area ratios; LAR/LSP coefficients outperform CC/MFCC for small ratios (small velar openings relative to oral tract)
- Transfer function changes are largest for small velar openings (constriction-like regime); once coupling is established, area ratio better captures progressive changes

## Limitations

- Simulation-only study: no natural speech validation
- Based on a single speaker's articulatory model (Patricia Barbier)
- Area functions derived from midsagittal sections (2D to area conversion introduces error)
- Nasal tract parameters borrowed from Feng & Castelli 1996, not from the same speaker
- Static vowels only -- no dynamic velum trajectories

## Testable Properties

- Nasality axis should be approximately perpendicular to the first 4 PCA dimensions of oral vowel cepstra (angle > 80 degrees)
- For An < 0.8 cm^2, spectral changes from velum opening should be large enough for reliable classification
- Pharyngo-nasal transfer functions (d=1) should cluster in the F'1-F'2 plane near (300, 800) Hz
- Area ratio d should remain discriminable across its full range, unlike An which saturates

## Relevance to Project

This paper is tangentially relevant to a Klatt formant synthesizer. The key insight is how nasal coupling affects the spectral domain: weak F1 and additional spectral complexity from pole-zero pairs introduced by the nasal tract. The area ratio parameter d = An/(An + Aoral) is a potentially cleaner parameterization than raw velar port area for controlling nasality in synthesis, since it avoids tongue-position-dependent saturation. The pharyngo-nasal target (F'1~300, F'2~800 Hz) provides a reference for fully nasal configurations. However, the paper's main contribution (acoustic-to-articulatory inversion) is the reverse of the synthesis direction and the simulation framework is not directly usable.

## Open Questions

- [ ] How does the area ratio parameterization relate to Klatt's FNZ/FNP nasal zero/pole parameters?
- [ ] Could the nasality axis concept inform a continuous nasality parameter rather than discrete nasal/oral phoneme categories?
- [ ] What are realistic dynamic trajectories of velum lowering during nasal consonant-vowel sequences?

## Related Work Worth Reading

- Feng & Castelli 1996 -- Acoustic features of nasal and nasalized vowels (source of area ratio parameter and nasal tract data)
- Maeda 1988 -- Improved articulatory model (the underlying vocal tract model)
- Dang, Honda & Suzuki 1994 -- Morphological and acoustical analysis of nasal and paranasal cavities
- Chistovich & Lublinskaya 1979 -- Center-of-gravity effect / large-scale spectral integration
- Wright 1986 -- Behavior of nasalized vowels in perceptual space (truncated cone hypothesis)

## Collection Cross-References

### Already in Collection
- [[Feng_1996_NasalVowelTarget]] — cited as source of the area ratio parameter d = An/(An+Aoral) and nasal tract area functions used in the simulation databases
- [[Maeda_1982_VowelNasalizationCues]] — cited as Maeda 1984 (spectral peak pair as acoustic correlate of nasalization); the collection entry is the 1982 paper on vowel nasalization cues which addresses the same spectral-flattening phenomenon

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Maeda S. (1988) — "Improved Articulatory model" J. Acoust. Soc. Amer. 84, S146 — the 9-parameter articulatory model underlying this study; relevant if implementing articulatory vocal tract models
- Dang J., Honda K., Suzuki H. (1994) — "Morphological and acoustical analysis of the nasal and paranasal cavities" J. Acoust. Soc. Amer. 96, 2088-2100 — nasal cavity morphology data useful for parameterizing nasal resonances
- Chistovich L.A. & Lublinskaya V.V. (1979) — "The center of gravity effect in vowel spectra and critical distance between formants" Hear. Res. 1, 185-195 — perceptual integration relevant to formant proximity modeling
- Wright J.T. (1986) — "The behavior of nasalized vowels in the perceptual vowel space" — truncated cone hypothesis for nasal vowel space contraction
