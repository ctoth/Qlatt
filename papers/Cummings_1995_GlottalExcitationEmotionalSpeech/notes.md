# Analysis of the Glottal Excitation of Emotionally Styled and Stressed Speech

**Authors:** Kathleen E. Cummings, Mark A. Clements
**Year:** 1995
**Venue:** Journal of the Acoustical Society of America, Vol. 98, No. 1, pp. 88-98
**DOI:** PACS numbers: 43.72.Ar, 43.70.Aj

## One-Sentence Summary

This paper provides quantitative measurements of how glottal waveform shape parameters (opening/closing slopes, durations) vary systematically across 11 emotional/stress speech styles, giving concrete targets for synthesizing emotional speech.

## Problem Addressed

Prior work on emotional speech focused on prosodic features (F0, duration, intensity), but the glottal excitation waveform's role in conveying emotion was not well quantified. This paper establishes that glottal waveshape is an independent acoustic correlate of emotion/stress that varies predictably across speech styles.

## Key Contributions

1. **Quantified glottal parameters for 11 speech styles**: Normal, angry, loud, soft, fast, slow, clear, question, Lombard, 50% tasking, 70% tasking
2. **Six-parameter glottal waveform representation**: closing slope, opening slope, closed duration, closing duration, opening duration, top duration
3. **Statistical validation**: Kolmogorov-Smirnoff tests show styles are significantly different; Mahalanobis distance gives ~90% classification accuracy
4. **Cross-speaker consistency**: Relative trends away from "normal" are consistent across two speakers despite different absolute values

## Methodology

### Glottal Extraction

Used modified Wong closed-phase glottal inverse filtering:
1. Identify glottal closure using normalized sequential covariance LP error
2. Model vocal tract with 10-pole LP analysis during closed phase
3. Model lip radiation as pole-pair + zero-pair (per Barnwell et al. 1977)
4. Inverse filter ~4 pitch periods to extract glottal waveform

### Waveform Parametrization

Glottal pulse segmented into four phases (see Fig. 5 in paper):
- **Closed**: Period when glottis is fully closed
- **Opening**: Rising phase from closed to peak
- **Top**: Plateau at maximum flow
- **Closing**: Falling phase back to closure

Six parameters extracted:
1. Closed duration (samples)
2. Opening duration (samples)
3. Top duration (samples)
4. Closing duration (samples)
5. Opening slope (amplitude/samples) - at onset of opening
6. Closing slope (amplitude/samples) - at offset of closing

## Key Equations

### Source-Filter Model

$$
S(z) = G(z) \cdot V(z) \cdot R(z)
$$

Where:
- $S(z)$ = speech signal z-transform
- $G(z)$ = glottal source z-transform
- $V(z)$ = vocal tract filter
- $R(z)$ = lip radiation transfer function

### Glottal Extraction via Inverse Filtering

$$
G(z) = \frac{S(z)}{V(z) \cdot R(z)}
$$

### Mahalanobis Distance (for style classification)

$$
r_{ij} = (m_i - m_j)' C^{-1} (m_i - m_j)
$$

Where:
- $m_i, m_j$ = mean vectors of styles $i$ and $j$
- $C$ = pooled sample covariance matrix

### Probability of Classification Error

$$
p(e) = \int_{(1/2)\sqrt{r_{ij}}}^{\infty} \frac{1}{\sqrt{2\pi}} e^{-y^2/2} \, dy
$$

## Parameters

### Glottal Waveform Parameters by Style (Speaker One, Table III)

| Style | Closing Slope | Opening Slope | Closed Dur | Closing Dur | Opening Dur | Top Dur |
|-------|---------------|---------------|------------|-------------|-------------|---------|
| Normal | -4798 | 2643 | 17.7 | 10.2 | 15.6 | 9.9 |
| Angry | -9910 | 9198 | 9.1 | 6.3 | 6.9 | 2.0 |
| Loud | -9298 | 3532 | 6.3 | 6.9 | 17.0 | 2.9 |
| Soft | -2632 | 1921 | 17.7 | 14.7 | 18.6 | 9.9 |
| Fast | -3972 | 2376 | 15.5 | 11.0 | 16.0 | 8.4 |
| Slow | -4786 | 2692 | 16.9 | 10.2 | 15.5 | 8.7 |
| Clear | -5011 | 2686 | 15.8 | 9.5 | 16.0 | 6.9 |
| Question | -4831 | 3034 | 14.0 | 9.4 | 14.9 | 7.0 |
| Lombard | -5430 | 2871 | 15.2 | 9.3 | 15.2 | 7.6 |
| 50% task | -4522 | 2321 | 17.3 | 11.1 | 16.0 | 9.8 |
| 70% task | -4100 | 2138 | 16.7 | 10.7 | 15.7 | 9.9 |

Units: durations in samples (8 kHz), slopes in (normalized amplitude)/samples

### Key Ratios vs Normal (Table V)

| Style | Closing Slope Ratio | Opening Slope Ratio | Closing/Opening Slope |
|-------|---------------------|---------------------|----------------------|
| Normal | 1.00 | 1.00 | 1.82 |
| Angry | 2.07 | 2.48 | 1.08 |
| Loud | 1.93 | 1.34 | 2.63 |
| Soft | 0.55 | 0.73 | 1.37 |

### Glottal Closure as % of Pitch Period (Table VII)

| Style | Speaker 1 Avg Pitch (samples) | % Closed | Speaker 2 Avg Pitch | % Closed |
|-------|-------------------------------|----------|---------------------|----------|
| Normal | 56.56 | 31% | 72.29 | 20% |
| Angry | 29.93 | 30% | 36.50 | 35% |
| Loud | 32.04 | 20% | 41.59 | 23% |
| Soft | 59.43 | 30% | 88.50 | 22% |

## Implementation Details

### Data Source
- Lincoln Labs Multi-Style Speech Database
- Two male General American speakers
- Non-nasalized vowels from "fix," "six," "destination"
- 8 kHz sampling rate
- 50-100 glottal waveforms per style per speaker

### Vocal Tract Model
- 8-pole model (8 kHz → 8 poles)
- Radiation: pole-pair + zero-pair (compensates for non-minimum phase glottal pulse)

### Style-Specific Observations

**Angry:**
- Shortest pitch period
- Steepest slopes (both opening and closing nearly equal)
- Most complete/distinct glottal closure
- Very high amplitude

**Loud:**
- Very short closed phase
- Asymmetric slopes (closing >> opening)
- Abrupt transitions
- High amplitude

**Soft:**
- Nearly sinusoidal waveform
- Gentle slopes
- Incomplete glottal closure
- Low amplitude

**Lombard:**
- More similar to "clear" than "loud"
- Speaker attempts clarity, not just volume projection

**Question:**
- Amplitude decreases as pitch period shortens
- High variance in duration parameters

## Figures of Interest

- **Fig. 4 (page 91):** Example extracted glottal waveforms for all 11 styles - crucial visual reference showing shape differences
- **Fig. 5 (page 92):** Segmentation scheme showing closed/opening/top/closing phases
- **Table II (page 94):** Mahalanobis distances - squared distance >11 means <5% classification error

## Results Summary

1. **All 11 styles statistically distinguishable** using closing slope, opening slope, and closed duration alone
2. **~90% classification accuracy** possible using 6-parameter Gaussian model
3. **Angry, loud, soft** most distinct from normal (virtually always correctly identified)
4. **Cross-speaker consistency** in relative trends, despite different absolute values
5. **Opening/closing slope ratio** is ~1.8 for normal speech; lower for angry/soft, higher for loud

## Limitations

1. Only two speakers analyzed (both male, General American)
2. Hand-marked segmentation (though consistency maintained)
3. Non-nasalized vowels only
4. 8 kHz sampling rate limits analysis bandwidth
5. Database-recorded "emotions" may differ from spontaneous expression
6. Question style has high variance due to pitch contour changes

## Relevance to Project

**Direct application to Qlatt emotional speech synthesis:**

1. **LF-source parameter modulation**: The slope ratios map directly to LF model parameters:
   - Closing slope → relates to return phase (Ta, Te parameters)
   - Opening slope → relates to open phase (Tp parameter)
   - Closed duration → relates to open quotient (OQ)

2. **Style presets**: Can define emotion presets by scaling glottal parameters:
   - Angry: 2x closing slope, 2.5x opening slope, 0.5x durations
   - Soft: 0.55x closing slope, 0.73x opening slope
   - Loud: 2x closing slope, steeper asymmetry

3. **Validation targets**: Table III provides concrete numeric targets for comparing synthesized emotional speech

## Open Questions

- [ ] How do these parameters map to LF model (Tp, Te, Ta, Ee)?
- [ ] Can similar analysis be done on female speakers?
- [ ] How do tasking/Lombard styles relate to listener perception?
- [ ] What's the interaction between glottal shape and F0 modulation for emotion?

## Related Work Worth Reading

- **Titze & Talkin (1979)** - 3D vocal fold model relating physiology to glottal flow shape
- **Fant (1979)** - "Glottal source and excitation analysis" - foundational glottal modeling
- **Rosenberg (1971)** - Effect of glottal pulse shape on vowel quality
- **Wong et al. (1979)** - Closed-phase glottal inverse filtering method
- **Cummings (1992)** - PhD thesis with more complete discussion

---

## Collection Cross-References

### Already in Collection
- (none found)

### New Leads (Not Yet in Collection)
- **Fant (1979)** - "Glottal source and excitation analysis" - Foundational work on glottal modeling from Fant's STL lab; essential for understanding glottal parametrization approaches that preceded the LF model.
- **Titze & Talkin (1979)** - "A theoretical study of the effects of various laryngeal configurations on the acoustics of phonation" - Links physiological vocal fold parameters to acoustic output; explains *why* glottal shape changes with emotion (abduction, bulging, subglottal pressure).
- **Rosenberg (1971)** - "Effect of glottal pulse shape on the quality of natural vowels" - Classic paper on perceptual effects of glottal shape; relevant for understanding which shape changes matter for synthesis quality.
- **Wong et al. (1979)** - "Least squares glottal inverse filtering" - The closed-phase inverse filtering method used in this paper; useful for implementing glottal extraction to validate synthesis.
- **Cummings (1992)** - PhD thesis - More complete discussion of the work, likely contains additional detail on the extraction method and style definitions not in the JASA paper.
