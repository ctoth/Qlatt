# Generation of the Vocal Tract Spectrum from the Underlying Articulatory Mechanism

**Authors:** Tokihiko Kaburagi, Jiji Kim
**Year:** 2007
**Venue:** Journal of the Acoustical Society of America, Vol. 121, No. 1, pp. 456-468
**DOI:** 10.1121/1.2384847

## One-Sentence Summary

Presents a four-stage articulatory synthesis model that generates vocal tract spectra from phoneme sequences by determining articulatory timing, specifying phonemic tasks as invariant articulatory constraints, forming continuous articulatory trajectories via a dynamic model, and estimating spectra from articulatory-acoustic data pairs.

## Problem Addressed

Existing articulatory synthesis methods either rely on rigid segmental concatenation or require extensive context-dependent unit inventories to handle coarticulation. This paper proposes a model where contextual variability emerges naturally from the dynamic articulatory mechanism rather than being explicitly encoded, using context-independent phonemic tasks.

## Key Contributions

- A four-stage generative model: timing determination, task specification, articulatory movement formation, spectrum estimation
- Context-independent phonemic tasks that produce context-dependent acoustic output through a dynamic articulatory model
- A statistical articulatory-to-acoustic mapping using weighted interpolation of nearest-neighbor data pairs
- Quantitative evaluation using simultaneous EMA and acoustic measurements showing ~1.27 mm articulatory error and ~3.44 dB spectral error

## Methodology

1. **Articulatory timing determination**: Predicts when each phoneme is articulated using a type-I quantification method (linear regression with categorical variables) that considers the current, preceding, and following phoneme types
2. **Phonemic task specification**: Defines articulatory constraints as projections into invariant-feature subspaces where articulatory variance is minimal
3. **Dynamic articulatory model**: Generates continuous articulator trajectories satisfying all tasks using a second-order dynamic system with smoothness constraints
4. **Spectrum estimation**: Estimates vocal tract spectrum from articulatory positions using weighted interpolation of M nearest articulatory-acoustic data pairs

Data: EMA measurements (8 markers, 16 dimensions) + synchronized 8 kHz speech from one male Japanese speaker, 50 sentences x 2 repetitions.

## Key Equations

### Articulatory timing (Eq. 4)

$$n_k = n_{k-1} + M_{k-1} + L_k \quad (k = 2, 3, \ldots, K)$$

Where:
- $n_k$ = articulatory timing of the $k$-th phoneme (sample index)
- $L_k$ = phoneme onset duration (initiation to articulatory goal)
- $M_k$ = phoneme offset duration (articulatory goal to next phoneme initiation)
- $K$ = total number of phonemes

### Phoneme onset/offset prediction (Eqs. 5-6)

$$L_k = \bar{L} + L_1(p_k) + \sum_{i=1}^{N_c} \delta_i(p_{k-1}) L_{2i} + \sum_{i=1}^{N_c} \delta_i(p_{k+1}) L_{3i}$$

$$M_k = \bar{M} + M_1(p_k) + \sum_{i=1}^{N_c} \delta_i(p_{k-1}) M_{2i} + \sum_{i=1}^{N_c} \delta_i(p_{k+1}) M_{3i}$$

Where:
- $\bar{L}, \bar{M}$ = mean durations per phonemic group
- $L_1, M_1$ = phoneme-specific adjustments
- $L_{2i}, M_{2i}$ = preceding phoneme group effects
- $L_{3i}, M_{3i}$ = following phoneme group effects
- $\delta_i(p)$ = 1 if phoneme $p$ belongs to group $i$, else 0
- $N_c = 13$ phonemic groups, $N_p = 23$ phoneme types
- Total parameters: 748

### Phonemic boundary determination (Eqs. 7-8)

$$n_{k,k+1} = \arg\min_n \{e_k(n) - e_{k+1}(n)\}$$

$$e_k(n) = (x(n) - x_k)^T W (x(n) - x_k)$$

Where:
- $n_{k,k+1}$ = boundary between $k$-th and $(k+1)$-th phonemes
- $e_k(n)$ = weighted articulatory distance from phoneme $k$'s target
- $x(n)$ = measured articulatory position at time $n$
- $x_k$ = mean articulatory position for phoneme $k$
- $W$ = weighting matrix

### Phonemic task specification (Eqs. 9-10)

$$z_k = E_k x(n_k) \quad (1 \le k \le K)$$

$$0 = f_{pl}^T (x - \bar{x}_p) \quad (l = 1, 2, \ldots, L_p)$$

Where:
- $z_k$ = target values of articulatory variables for phoneme $k$
- $E_k$ = transformation matrix
- $f_{pl}$ = invariant-feature transformation vector for phoneme $p$
- $\bar{x}_p$ = mean articulatory position for phoneme type $p$
- $L_p \le L_x$ = task dimension (number of constraints) for phoneme $p$

### Dynamic articulatory model (Eq. 11)

$$J = \sum_{l=1}^{L_x} \left[ w_l \sum_{n=1}^{N} (\ddot{x}_l(n))^2 + \frac{1}{\tau_l} \sum_{k=1}^{K} d_l (e_{kl}(n_k))^2 \right]$$

Where:
- $J$ = cost function minimized by the articulatory model
- First term: smoothness cost (penalizes acceleration)
- Second term: task achievement cost
- $w_l$ = weight for smoothness of $l$-th articulatory dimension
- $\tau_l$ = balance parameter between smoothness and task accuracy
- $d_l$ = 1 if dimension $l$ is task-relevant for phoneme $k$, else 0
- $e_{kl}$ = task error for $l$-th dimension at phoneme $k$

### Spectrum estimation (Eqs. 15-16)

$$e_i = (x - x_i)^T W (x - x_i)$$

$$y = \sum_{j=1}^{M} \alpha_j y_j$$

Where:
- $e_i$ = articulatory distance between input position $x$ and data sample $x_i$
- $y$ = estimated vocal tract spectrum (LSP parameters)
- $\alpha_j \propto e_j^{-1}$ with $\sum \alpha_j = 1$ (inverse-distance weighting)
- $M$ = number of neighboring samples (optimal: 64-128)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Articulatory dimensions | $L_x$ | - | 16 | - | 8 markers x 2D |
| Acoustic dimensions | $L_y$ | - | 14 | - | 14th order LSP |
| Number of phoneme types | $N_p$ | - | 23 | - | Japanese phonemes |
| Number of phonemic groups | $N_c$ | - | 13 | - | Articulatory grouping |
| Timing parameters | - | - | 748 | - | Total for onset/offset prediction |
| Neighbor samples | $M$ | - | 64 | 1-256 | Optimal at 64-128 |
| EMA sampling rate | - | Hz | 250 | - | Carstens AG100 |
| Speech sampling rate | - | Hz | 8000 | - | Synchronized with EMA |
| LPC order | - | - | 14 | - | For spectral estimation |
| Analysis window | - | ms | 30 | - | Hamming window |
| EMA accuracy | - | mm | 0.1 | - | On midsagittal plane |

## Implementation Details

- **Articulatory variables**: 8 EMA marker points (jaw, upper lip, lower lip, velum, 4 tongue points T1-T4), each in 2D midsagittal coordinates = 16 dimensions
- **Acoustic variables**: 14th-order LSP parameters from LPC analysis of pre-emphasized speech (spectral tilt cancellation + lip radiation compensation)
- **Phoneme grouping**: 13 groups based on articulatory features (Table I): vowels, unvoiced stops, voiced stops, nasals, liquids, etc. A 13th "neutral" group represents utterance boundaries
- **Timing model training**: Type-I quantification method (categorical linear regression) on manually-labeled articulatory data
- **Task dimensions ($L_p$)**: Varies per phoneme; determined to minimize mean articulatory prediction error across all data
- **Dynamic model solution**: Minimization of cost function (Eq. 11) produces continuous trajectories as a linear system; solved analytically
- **Spectrum estimation**: Phonemic matching first narrows candidates, then articulatory distance selects $M$ nearest neighbors for weighted interpolation

### Edge cases
- When articulatory distance $e_1 = 0$ (exact match), output spectrum is $y = y_1$ directly (interpolation undefined)
- Boundary conditions: first and last phonemes pinned at $n_1 = 1$ and $n_K = N$
- Task-free dimensions allow coarticulatory variation (remaining $L_x - L_p$ DOF unconstrained)

## Figures of Interest

- **Fig. 1 (p. 2):** Block diagram of the four-stage generative model
- **Fig. 2 (p. 2):** EMA marker placement on articulatory organs (8 points)
- **Fig. 3 (p. 3):** Articulatory timing model showing phoneme onset ($L_k$) and offset ($M_k$) durations
- **Fig. 4 (p. 4):** Task generation showing how phonemic constraints are imposed at articulatory timings
- **Fig. 5 (p. 5):** Block diagram of spectrum estimation from articulatory positions using data pair search
- **Fig. 7 (p. 7):** Spectral estimation error vs. number of neighbors $M$; minimum at $M = 64$-128 (~3.08 dB)
- **Fig. 8 (pp. 8-9):** Full synthesis results for /hanayakanautagoe/: articulatory trajectories + spectrograms (observed vs. synthesized)
- **Figs. 9-12 (pp. 9-12):** VCV coarticulation experiments for /b/, /g/, /m/, /r/ showing context-dependent articulatory and spectral variability

## Results Summary

- **Timing prediction**: Mean error ~10.3 ms (onset) and ~10.4 ms (offset); ~29-32% improvement over mean-only baseline by adding phoneme-specific and context-dependent terms
- **Spectrum estimation from observed articulatory positions**: ~3.08 dB cepstral distance at $M = 64$-128 (Fig. 7)
- **Spectrum estimation from generated articulatory movements**: ~2.53 dB when using observed articulatory timings, ~3.44 dB when using predicted timings (Table II)
- **Articulatory accuracy**: Mean error ~1.27 mm across 13 test utterances
- **Coarticulation**: Model successfully reproduces context-dependent formant transitions and articulatory configurations for bilabial, velar, nasal, and liquid consonants in VCV contexts

## Limitations

- Single speaker (one male Japanese subject)
- Japanese phoneme inventory only (23 phonemes, 13 groups)
- 2D articulatory representation (midsagittal plane only) — authors plan 3D extension
- No glottal source or noise modeling — only vocal tract transfer function
- Statistical spectrum estimation produces widened formant bandwidths due to interpolation averaging
- Training data from sentences but VCV test data showed some timing mismatch
- Dynamic model tends to neutralize articulatory postures (less extreme than natural speech)
- Relatively small articulatory database due to EMA recording burden

## Testable Properties

- Articulatory distance must be non-negative: $e_i \ge 0$
- Interpolation weights must sum to 1: $\sum_{j=1}^{M} \alpha_j = 1$
- Increasing $M$ should monotonically increase mean articulatory distance of selected neighbors
- Spectral error should decrease then increase as $M$ grows (U-shaped curve, minimum around 64-128)
- Task-constrained articulatory dimensions should show lower cross-phoneme variance than unconstrained dimensions
- Phoneme onset + offset durations must be positive: $L_k > 0, M_k > 0$
- Total predicted timing should equal sum of all onset and offset durations

## Relevance to Project

This paper provides theoretical context for articulatory-based approaches to coarticulation modeling, which is relevant to Qlatt's formant transition rules. The key insight — that context-independent phonemic targets combined with a dynamic smoothness model can reproduce coarticulatory effects — parallels Qlatt's approach of applying context-dependent rules to static inventory targets. However, the paper's articulatory model and statistical spectrum estimation method are fundamentally different from Qlatt's Klatt formant synthesis architecture and would not be directly implementable. The coarticulation data for Japanese VCV sequences provides qualitative validation that formant transitions emerge from articulatory dynamics rather than requiring explicit context-dependent spectral targets.

## Open Questions

- [ ] How does the 3.44 dB spectral error compare to perceptual thresholds for formant synthesis quality?
- [ ] Could the invariant-feature task representation inform how Qlatt defines its phonemic inventory targets?
- [ ] Would a similar nearest-neighbor interpolation approach be useful for deriving formant transition parameters from measured data?

## Related Work Worth Reading

- Kaburagi and Honda (1996) — Dynamic articulatory model foundation (JASA 99:3154-3170)
- Kaburagi and Honda (2001) — Multidimensional invariant-feature task representation (JASA 110:441-452)
- Mermelstein (1972) — Articulatory model for vocal tract area function
- Coker and Fujimura (1966) — Vocal tract area function model
- Broad and Clermont (1987) — Vowel formant contours in CVC context (JASA 81:155-165)
- Maeda (1982) — Acoustic tube model for vocal tract

## Collection Cross-References

### Already in Collection
- [[Blumstein_Stevens_1979_AcousticInvariance]] — Blumstein (1986) cited for acoustic invariance in speech; the 1979 paper is the collection entry
- [[Maeda_1982_VowelNasalizationCues]] — cited for acoustic tube model of the vocal tract
- [[Saltzman_1989_DynamicalGesturalPatterning]] — cited for superposition of phonemic patterns and task dynamics framework

### Cited By (in Collection)
- (none found — Zhang_2016 cites a different Kaburagi paper: Kaburagi & Tanabe 2009 on glottal flow)

### New Leads (Not Yet in Collection)
- Broad and Clermont (1987) — "A methodology for modeling vowel formant contours in CVC context," JASA 81:155-165 — directly relevant to Qlatt's formant transition modeling in consonant contexts
- Gay (1977) — "Articulatory movements in VCV sequences," JASA 62:185-193 — classic VCV coarticulation study
- Coker (1976) — "A model of articulatory dynamics and control," Proc. IEEE 64:452-460 — early articulatory dynamics model

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
**Coarticulation modeling:**
- [[Ohman_1966_CoarticulationVCV]] — Both papers study VCV coarticulation with overlapping consonant-on-vowel gesture models. Kaburagi's invariant-feature tasks are a formal counterpart to Ohman's observation that formant transitions vary ~280 Hz depending on vowel context; both conclude that consonant gestures are superimposed on an underlying vowel trajectory.
- [[Recasens_1997_LingualCoarticulationDAC]] — Recasens' DAC model predicts coarticulation magnitude from tongue-dorsum involvement, which provides a complementary phonological explanation for why Kaburagi's model shows different task dimensions ($L_p$) per phoneme — phonemes with higher DAC values would correspond to higher task dimensions (more articulatory constraints).
- [[Saltzman_1989_DynamicalGesturalPatterning]] — Both papers use critically damped dynamic systems to generate smooth articulatory trajectories from context-independent targets. Kaburagi's cost function (Eq. 11) minimizing acceleration subject to task constraints is mathematically equivalent to Saltzman's point-attractor formulation, arrived at independently from different theoretical traditions.

**Articulatory-acoustic mapping:**
- [[Fowler_2006_CoarticulationGesturePerception]] — Fowler's direct-realist account of coarticulation perception aligns with Kaburagi's demonstration that listeners can recover phonemic identity from coarticulated segments because the invariant articulatory targets persist through the dynamic variation.
