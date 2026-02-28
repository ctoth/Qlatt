# Formant Synthesis: Turning Cascade into Parallel with Applications to the Klatt Synthesizer

**Authors:** Qiguang Lin, Jingyun Zou, Gael Richard, James L. Flanagan
**Year:** 1995
**Venue:** 130th Meeting ASA, St. Louis, MO; JASA Vol. 98, No. 5, Pt. 2, November 1995
**DOI:** 10.1121/1.413964

## One-Sentence Summary
A method using partial fraction expansion to mathematically convert cascade formant filter configurations into equivalent parallel configurations, deriving complex amplitudes from formant frequencies, bandwidths, and higher-pole correction without additional empirical parameters.

## Problem Addressed
Switching between cascade (vowels) and parallel (consonants) formant configurations in Klatt-style synthesizers disrupts spectral continuity. The cascade model automatically produces correct formant amplitudes from frequencies and bandwidths alone, but the parallel model requires explicit amplitude parameters (A1-A6) that Klatt sets using fixed empirical scale factors (ndbScale). These fixed offsets become inaccurate when formant frequencies shift significantly from their default positions.

## Key Contributions
1. Mathematical method to compute parallel amplitudes directly from cascade parameters
2. No additional parameters required beyond formant frequencies, bandwidths, and higher-pole correction
3. Maintains spectral continuity across cascade-parallel transitions
4. Integrated into the Klatt synthesizer implementation

## Methodology

### The Mathematical Approach: Partial Fraction Expansion

The cascade transfer function (product of second-order sections):
$$H(z) = \prod_{n=1}^{N} \frac{A_n}{1 - B_n z^{-1} - C_n z^{-2}}$$

can be decomposed via partial fraction expansion into a sum (parallel form):
$$H(z) = \sum_{i=1}^{N} \frac{\alpha_i + \beta_i z^{-1}}{1 - B_i z^{-1} - C_i z^{-2}}$$

where the residues (alpha_i, beta_i) are computed from the pole locations of ALL resonators:

For each pole p_i:
$$r_i = (1 - p_i z^{-1}) \cdot H(z) \Big|_{z=p_i}$$

For real second-order sections (combining conjugate pairs):
$$\text{numerator}_i = \frac{2\text{Re}\{r_i\} - 2\text{Re}\{r_i \cdot \overline{p_i}\} z^{-1}}{1 - 2\text{Re}\{p_i\} z^{-1} + |p_i|^2 z^{-2}}$$

### What This Replaces in Klatt

Klatt's fixed ndbScale values:
| Parameter | ndbScale (dB) |
|-----------|---------------|
| A1        | -58           |
| A2        | -65           |
| A3        | -75           |
| A4        | -78           |
| A5        | -79           |
| A6        | -80           |

These are replaced by dynamically computed residue magnitudes that automatically adapt to the current formant configuration.

### Higher-Pole Correction

The "higher-pole correction" mentioned in the abstract refers to the cumulative spectral effect of formants above F5/F6 that exist in the infinite vocal tract model but are not explicitly modeled. In the cascade model, this is sometimes approximated by a fixed spectral correction. In the PFE method, the higher-pole correction can be folded into the transfer function as additional poles before decomposition.

Holmes (1983) notes:
- For a 17cm male vocal tract, the cumulative higher-pole correction at 5 kHz is ~57 dB
- In sampled-data (digital) systems, the z-transform periodicity partially compensates for missing higher poles
- The correction differs between analog and digital implementations

## Parameters

No new parameters are introduced. The method derives all parallel amplitudes from:
1. Formant frequencies (F1-F6)
2. Formant bandwidths (B1-B6)
3. Higher-pole correction factor (implicit in cascade model)

## Implementation Details

### Alternating Polarity
Adjacent parallel formants must alternate in sign for correct spectral combination:
```
output = +Y1 - Y2 + Y3 - Y4 + Y5 - Y6
```
This is already present in Klatt's COEWAV:
```
ULIPSF = Y1P - Y2P + Y3P - Y4P + Y5P - Y6P + YN - AB*UFRIC
```

### Lalwani's Q-Factor Shortcut (1992)
A simpler approximation to the PFE method:
- Set scale factor = negative of Q factor (Q = F_center / BW)
- Alternate initial phase (+1, -1) between adjacent resonators
- Better than fixed ndbScale but not as exact as full PFE

### Practical Computation for Dynamic ndbScale
For each formant F_n, the required amplitude offset is:
```
ndbScale_n = 20 * log10(|H_others(f_n)|)
```
where H_others is the cascade product of all formants EXCEPT F_n, evaluated at f_n's frequency.

## Results Summary
- Abstract only; no detailed numerical results available
- Claims successful integration into Klatt synthesizer
- Claims continuity maintenance across resonance mode changes

## Limitations
- Conference abstract only; no full paper with detailed equations published
- No perceptual evaluation reported
- No comparison with Klatt's original ndbScale approach

## Relevance to Qlatt

### Direct Application to F7-F10
Our recent addition of F7-F10 cascade formants needs parallel amplitude settings. The PFE method provides the mathematically correct approach:
1. Include F1-F10 in the cascade transfer function
2. Compute PFE residues for all 10 formants
3. Use residue magnitudes as parallel amplitudes

### Dynamic ndbScale
Instead of fixed offsets, compute per-frame based on actual formant positions. This is especially valuable for:
- Formant convergence (F2/F3 close together for /r/)
- Higher formants where spacing is regular (F7-F10 at 1000 Hz intervals)
- Cross-speaker variation (female formants shifted upward)

### Proximity Correction Subsumption
The PFE method naturally accounts for the proximity correction (NDBCOR) that Klatt applies when formants are close -- the residue magnitudes increase when poles approach each other.

## Open Questions
- [ ] How exactly does the higher-pole correction integrate with PFE for digital (z-domain) systems?
- [ ] What is the computational cost of per-frame PFE versus fixed offsets?
- [ ] Did the authors follow up with a full journal publication?
- [ ] How does the method handle the nasal pole-zero pair?

## Related Work Worth Reading
- **Klatt (1980)** - Original ndbScale values and cascade/parallel architecture
- **Holmes (1983)** - Parallel formant synthesis and higher-pole correction analysis
- **Lalwani (1992)** - Q-factor based cascade-parallel matching improvement
- **Rabiner (1968)** - Higher-pole correction in digital formant synthesizers
- **Fant (1960)** - Theoretical framework for vocal tract transfer functions

---

## Collection Cross-References

### Already in Collection
- **Klatt_1980_CascadeParallelFormantSynthesizer**
- **Holmes_1983_FormantSynthesizersCascadeParallel**
- **Lalwani_1992_FlexibleFormantSynthesizer**
- **Rabiner_1968_DigitalFormantSynthesizer**
- **Fant_1960_AcousticTheorySpeechProduction**
