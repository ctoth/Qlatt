# Algorithm for Automatic Glottal Waveform Estimation Without the Reliance on Precise Glottal Closure Information

**Authors:** Elliot Moore, Mark Clements
**Year:** 2004
**Venue:** ICASSP 2004 (IEEE International Conference on Acoustics, Speech, and Signal Processing)
**DOI/URL:** 0-7803-8484-9/04 IEEE

## One-Sentence Summary
Presents an automated iterative algorithm that estimates glottal waveforms from acoustic speech by sliding LP analysis windows around approximate closure regions and selecting the smoothest candidate via first-order LP coefficient magnitude.

## Problem Addressed
Glottal waveform estimation traditionally requires either precise glottal closure instant (GCI) detection (difficult, especially for females and disordered voices) or external sensors like electroglottographs (EGG). Previous manual extraction techniques [5] produced excellent results but required human intervention. This algorithm automates that process without needing precise GCI locations.

## Key Contributions
- Automated version of the manual glottal extraction technique from Cummings & Clements (1995)
- Uses a smoothness criterion (first-order LP coefficient a1 close to 1) to automatically select the best glottal derivative estimate
- Does not require precise GCI detection — only approximate closure regions from LP residual negative peaks
- Produces estimates visually identical to EGG-based ground truth across male and female speakers
- Successfully applied to singing voice in subsequent work [6]

## Methodology
The algorithm operates on single frames of speech (~4-5 pitch periods) and iteratively searches for the smoothest glottal waveform estimate by sliding analysis windows around estimated closure regions.

## Key Equations

### Source-Filter Model
$$S(z) = G(z) \cdot V(z) \cdot R(z)$$
Where:
- $S(z)$ = acoustic speech waveform (voiced speech)
- $G(z)$ = glottal waveform shaping
- $V(z)$ = vocal tract configuration (modeled as all-pole via LP)
- $R(z)$ = lip radiation (first-order zero, $0.95 \leq z_0 < 1$)

### Glottal Inverse Filtering (GIF)
$$G(z) = \frac{S(z)}{V(z) \cdot R(z)}$$

### Smoothness Criterion (1st-order LP coefficient)
$$a_1 = \frac{-r(1)}{r(0)}$$
Where:
- $r(1)$ = autocorrelation at lag 1
- $r(0)$ = autocorrelation at lag 0
- $|a_1|$ closer to 1 indicates smoother (less noisy) estimate

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| LP model order | P | - | 10 | - | Controls vocal tract model complexity |
| Number of iterations | 2P | - | 20 | - | Total sliding window positions |
| Window length | 2P | samples | 20 | - | For covariance LP analysis |
| Frame size | - | pitch periods | 4-5 | - | Input speech frame |
| Sampling rate | fs | Hz | 8000 | - | Used in experiments |
| Selection percentile | - | % | 99th | - | Top 1% smoothest estimates chosen |
| Lip radiation zero | z0 | - | - | 0.95-1.0 | Pre-emphasis filter |

## Implementation Details

### Algorithm Steps (from block diagram, Fig. 2):

1. **Input**: Single speech frame $s_k[n]$ covering 4-5 pitch periods
2. **Initial LP Analysis**: Pitch-synchronous LP analysis (order P) on raw speech → coefficients $a_p$
3. **Residual Signal**: Inverse-filter speech with $A(z)$ to get LP residual
4. **Find Starting Points**: Locate most negative peaks in residual (approximate GCI locations). Set starting points $c$ = peak locations minus P
5. **Iterative Window Sliding** (2P iterations, i = 1 to 2P):
   a. Place multiple disjoint windows (length 2P) at positions specified in $c$
   b. Compute LP analysis using covariance method at each window (verify pole stability, reflect if necessary)
   c. Average LP estimates from all disjoint windows within the frame → smoothed vocal tract estimate
   d. Inverse-filter to get glottal derivative estimate $gldv$
   e. Store: $G[i] = gldv$, $A[i] = ac$
   f. Update: $c = c + 1$ (shift windows by one sample)
6. **Select Best Estimates**:
   a. Compute 1st-order LP analysis (autocorrelation method) on each $G[k]$, store $a_1[k]$
   b. Find indices $e$ where $|a_1[k]| \approx 1$ (top 99th percentile)
   c. Average: $gldv = \text{avg}(G[e])$, $a = \text{avg}(A[e])$
7. **Output**: Integrate glottal derivative → glottal waveform estimate; LP coefficients $a$ → vocal tract estimate

### Edge Cases / Notes
- Covariance method used (not autocorrelation) due to limited window size
- Pole stability must be verified and poles reflected as necessary
- Females may not exhibit complete glottal closure — algorithm handles this gracefully
- Algorithm sometimes selects points on closing phase or early opening phase rather than at GCI
- The smoothness criterion works because closed-phase LP analysis yields less contaminated (smoother) glottal estimates

## Figures of Interest
- **Fig. 1 (page 1):** Ideal glottal waveform showing opening phase (OP), closing phase (CP), closed phase (C), and open phase (O)
- **Fig. 2 (page 2):** Complete block diagram of the algorithm
- **Fig. 3 (page 3):** LP residual with algorithm starting points (dark circles at negative peaks)
- **Fig. 4 (page 3):** Six glottal derivative approximations showing how |a1| correlates with smoothness — |a1|=0.93 is smooth, |a1|=0.06 is noisy
- **Figs. 5-8 (pages 3-4):** Side-by-side comparisons of algorithm estimates vs. EGG-based estimates for 2 males and 2 females

## Results Summary
- Tested on speech recordings at fs = 8 kHz with concurrent EGG data
- 4 subjects: 2 males, 2 females
- Algorithm estimates were "virtually identical" to EGG-based estimates in nearly every case
- Algorithm sometimes selects different analysis points than EGG would indicate, yet still produces excellent estimates
- Demonstrates that approximate closure regions are sufficient; precise GCI is not needed

## Limitations
- Only visual comparison shown (no quantitative error metrics)
- Small test set (4 subjects)
- Tested only at 8 kHz sampling rate
- No formal evaluation of failure cases
- Requires pitch tracking to determine frame size (4-5 pitch periods)
- LP model order P must be chosen appropriately (P=10 used)

## Testable Properties
- |a1| values of selected estimates should be in top 1% (99th percentile) of all candidates
- Smoother glottal derivatives should have |a1| closer to 1.0
- For modal phonation, estimates should show clear opening, closing, and closed phases
- Integrated glottal waveform should be quasi-periodic within the analysis frame
- Algorithm should produce similar estimates regardless of whether analysis windows land on closing or opening phase

## Relevance to Project
This paper's primary value is as a **speech analysis tool** that enables extraction of glottal source parameters from natural speech recordings — audiobooks, voice samples, corpora — without needing EGG hardware or precise GCI detection. This is the bridge between "here is a recording" and "here are glottal parameters to match in the synthesizer."

Concrete applications:
- **Voice quality extraction from corpora**: Extract glottal waveforms from audiobook recordings, then fit LF model parameters (via Plumpe_1999 or similar) to derive voice quality presets for different speakers/emotions
- **Analysis-by-synthesis validation**: Compare Qlatt's LF source output against glottal estimates extracted from natural speech to tune source parameters
- **Smoothness metric**: The |a1| ≈ 1 criterion could evaluate whether synthesized glottal waveforms have realistic smoothness properties
- **Female voice modeling**: Algorithm explicitly handles incomplete glottal closure common in female speech, making it suitable for extracting parameters across speaker types

## Open Questions
- [ ] How does the algorithm perform at higher sampling rates (e.g., 16 kHz, 44.1 kHz)?
- [ ] What quantitative metrics (besides visual inspection) validate the estimates?
- [ ] How sensitive is the algorithm to the choice of P?
- [ ] Could this be combined with LF model fitting for parameter extraction?

## Related Work Worth Reading
- Cummings & Clements (1995) - The manual technique this algorithm automates (already in collection)
- Plumpe, Quatieri & Reynolds (1999) - Glottal flow derivative modeling (already in collection)
- Wong, Markel & Gray (1979) - Least squares glottal inverse filtering

## Collection Cross-References

### Already in Collection
- [[Cummings_1995_GlottalExcitationEmotionalSpeech]] - [5] in paper, the manual technique this algorithm automates
- [[Plumpe_1999_GlottalFlowDerivativeModeling]] - [3] in paper, glottal flow derivative modeling with speaker ID application

### New Leads (Not Yet in Collection)
- Kounoudes, Naylor & Brookes (2002) - DYPSA algorithm for GCI estimation - relevant for comparison
- Brookes & Loke (1999) - Energy flow modeling for GCI detection
- Wong, Markel & Gray (1979) - Least squares GIF - classic foundational reference
- Moore, Clements, Peifer & Weisser (2003) - Glottal features for clinical depression classification

### Supersedes or Recontextualizes
- None — this paper builds on Cummings_1995 but doesn't invalidate it
