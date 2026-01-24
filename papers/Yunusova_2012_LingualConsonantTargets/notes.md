# Positional Targets for Lingual Consonants Defined Using Electromagnetic Articulography

**Authors:** Yunusova, Yana; Rosenthal, Jeffrey S.; Rudy, Krista; Baljko, Melanie; Daskalogiannakis, John
**Year:** ~2012 (based on references citing 2012)
**Venue:** Journal article (likely JASA or similar)
**Institution:** University of Toronto

## One-Sentence Summary

Provides empirical 3D tongue position data for English lingual consonants /t, d, s, z, ʃ, ʧ, k, g/ measured via electromagnetic articulography, establishing which consonants share positional targets and which are distinct.

## Problem Addressed

Mapping articulator positions to speech sound categories is challenging due to variability from linguistic, prosodic, anatomic, and physiological factors. While EPG and MRI studies exist, point-parameterized electromagnetic tracking data for consonant targets remained sparse, limiting speech production models (like DIVA) and clinical/speech recognition applications.

## Key Contributions

1. Established that **cognates share identical positional targets** (d-t, s-z, k-g pairs are not distinct)
2. Found **alveolar stops and fricatives have distinct target locations** (t/d differ from s/z)
3. Confirmed **postalveolar homorganics share targets** (ʃ and ʧ are not distinct)
4. Demonstrated alveolars and postalveolars occupy distinct regions
5. Identified **speaking rate and palate morphology** as significant sources of between-talker variability

## Methodology

### Participants
- 19 speakers (9 female, 10 male)
- Native Canadian English speakers
- Mean age: 28.5 (F), 32.8 (M)

### Speaking Task
- VCV syllables in carrier phrase "It's VCV game"
- Consonants: /t, d, s, z, ʃ, ʧ, k, g/
- Vowel contexts: /i, u, a/
- 10 repetitions per syllable → 30 measurable events per consonant

### Data Collection
- **System:** Wave articulography (NDI, Canada)
- **Sampling rate:** 100 Hz in 3D
- **Sensors:**
  - TF (tongue front): ~1 cm from tongue tip (M=1.3 cm, SD=0.3 cm) - for alveolars/palatals
  - TB (tongue back): 2 cm behind TF (M=2.1 cm, SD=0.4 cm) - for velars
  - Head reference sensor on nose bridge
- **Post-processing:** Low-pass filtered at 15 Hz (8-pole Butterworth, zero-phase)

### Measurements
- **Target extraction:** X, Y, Z coordinates at point of maximum tongue elevation during consonant
- **Target regions:** 2SD ellipsoids fit around all repetitions across all vowel contexts

## Key Equations

### Overlap Calculation (Kernel Density Estimator)

For observed data $w_1, w_2, ..., w_n$ where each $w_i = (w_{i,1}, w_{i,2}, w_{i,3})$:

$$
f(v) = \frac{1}{n} \sum_{i=1}^{n} \Phi(v; w_i, h)
$$

where $\Phi$ is a 3D Gaussian:

$$
\Phi(v; w_i, h) = \prod_{j=1}^{3} \frac{1}{\sqrt{2\pi}h_j} \exp[-(v_j - w_{i,j})^2 / 2h_j^2]
$$

Bandwidth (Scott's Rule):
$$
h_j = n^{-1/7} \cdot \text{sd}(w_{1,j}, w_{2,j}, ..., w_{n,j})
$$

**Overlap between two density functions:**
$$
\text{overlap} = \int \min[f(v), g(v)] \, dv
$$

This equals 1 minus the total variation distance.

### Overlap Prediction Formula (Alveolars)

$$
O_2 = 1.28 - 0.0017 \cdot R - 0.339 \cdot \alpha
$$

Where:
- $R$ = speaking rate (ms/syllable)
- $\alpha$ = palate curvature coefficient
- $R^2 = 0.4562$

## Parameters

| Name | Symbol | Units | Mean (SD) | Notes |
|------|--------|-------|-----------|-------|
| Speaking rate | R | ms/syl | 271.37 (36.64) | Range: 219.71-360.77 |
| TF sensor placement | - | cm | 1.3 (0.3) | From tongue tip |
| TB sensor placement | - | cm | 2.1 (0.4) | From TF sensor |
| Palate height (M) | - | mm | 13.98 (2.08) | Males |
| Palate height (F) | - | mm | 11.45 (1.68) | Females |
| Palate width (M) | - | mm | 34.99 (2.35) | Males |
| Palate width (F) | - | mm | 31.99 (3.87) | Females |
| Palate length (M) | - | mm | 35.21 (2.82) | Males |
| Palate length (F) | - | mm | 30.79 (4.55) | Females |
| Palate curvature (M) | α | - | 1.86 (0.19) | Males |
| Palate curvature (F) | α | - | 1.85 (0.21) | Females |
| Max overlap (front) | - | - | 0.64 (0.12) | Baseline from split data |
| Max overlap (back) | - | - | 0.70 (0.10) | Baseline from split data |

## Key Statistical Results

### Cognate Analysis (D2 vs D1, O2 vs O1)

| Pair | D1 (mm) | D2 (mm) | O1 | O2 | p-value | Distinct? |
|------|---------|---------|----|----|---------|-----------|
| /d/-/t/ | 1.52 (0.80) | 1.37 (0.77) | 0.39 (0.13) | 0.35 (0.17) | 0.790 | No |
| /z/-/s/ | 1.36 (0.90) | 1.46 (0.86) | 0.37 (0.16) | 0.31 (0.19) | 0.300 | No |
| /g/-/k/ | 2.14 (1.03) | 1.23 (0.50) | 0.34 (0.13) | 0.47 (0.13) | 0.999 | No |

### Homorganic Analysis

| Pairs | D1 (mm) | D2 (mm) | O1 | O2 | p-value | Distinct? |
|-------|---------|---------|----|----|---------|-----------|
| Alveolars (d-z, d-s, t-s, t-z) | 1.44 (0.85) | 2.72 (2.09) | 0.38 (0.15) | 0.23 (0.19) | 0.001* | **Yes** |
| Postalveolars (ʃ-ʧ) | 1.27 (0.74) | 1.47 (0.99) | 0.43 (0.15) | 0.42 (0.18) | 0.280 | No |

### Alveolar vs Postalveolar

| Pairs | D2 (mm) | O2 | p-value |
|-------|---------|----|---------|
| Stops vs postalveolars | 2.93 (1.4) | 0.19 (0.15) | 0.001* |
| Fricatives vs postalveolars | 4.32 (1.75) | 0.08 (0.09) | 0.001* |

## Implementation Details

### Coordinate System
- Anatomically-based Cartesian system
- Abscissa along plane between maxilla and mandible
- Origin at central maxillary incisors
- Established via bite plate recording (Westbury, 1994)

### Target Region Definition
- Point cloud of X,Y,Z coordinates at maximum tongue elevation
- Fit 2SD (2 standard deviation) ellipsoids around repetitions
- Compare **D1** (contextual target distances) vs **D2** (between-consonant distances)
- Compare **O1** (contextual target overlaps) vs **O2** (between-consonant overlaps)

### Statistical Method
- Mann-Whitney-Wilcoxon rank-sum test (non-parametric)
- Consonants are distinct if D2 > D1 AND O2 < O1 significantly (p < 0.05)

## Figures of Interest

- **Fig 1 (page 40):** 3D point clouds for /s/, /t/, /ʃ/ showing target regions with 2SD ellipsoids
- **Fig 2 (page 41):** Cognate pairs (s-z, d-t, k-g) for two talkers showing overlap
- **Fig 3 (page 42):** Individual differences in alveolar/postalveolar target separation (W12, W24, W25, W15)
- **Fig 4 (page 43):** Correlations between measures and covariates (rate, palate width, curvature)

## Results Summary

### Consonant Target Groupings (Shared Positional Targets)

1. **Alveolar stops:** /t/ and /d/ share a target
2. **Alveolar fricatives:** /s/ and /z/ share a target (distinct from stops)
3. **Postalveolars:** /ʃ/ and /ʧ/ share a target
4. **Velars:** /k/ and /g/ share a target

### Spatial Relationships

- /s/ is **anterior and lower** than /t/
- /ʃ/ is **~4 mm posterior** to /s,z/
- Alveolar fricatives show tongue grooving (lower position)

### Between-Talker Variability Correlates

| Comparison | D2 correlate | O2 correlates |
|------------|--------------|---------------|
| Alveolar stops vs fricatives | Speaking rate (r=0.498) | Rate (r=-0.508), Curvature (r=-0.562) |
| Alveolar fricatives vs postalveolars | Palate width (r=-0.549) | Width (r=-0.606), Curvature (r=-0.518) |
| Alveolar stops vs postalveolars | - | Width (r=-0.528), Sex (r=0.47) |

**Key findings:**
- Slower speakers → more distinct target locations
- Flatter palates → less overlap between targets
- Wider palates → more distinction between alveolars and postalveolars

## Limitations

1. Single tongue sensor may not capture full articulatory strategy
2. Sensor placement (~1 cm from tip) may miss individual differences in constriction location
3. Apical vs laminal fricative production strategies not distinguished
4. Only habitual speaking rate studied (not experimentally varied)
5. Only simple VCV syllables (not connected speech)

## Relevance to Qlatt Project

### For Formant Synthesis
- **Cognate pairs can share formant targets** - voicing distinction handled separately
- **Stops and fricatives need different targets** even at same nominal place of articulation
- /s/ formant patterns should be more anterior than /t/
- /ʃ/ transitions need targets ~4mm more posterior than /s/

### For Coarticulation Modeling
- Contextual variability (D1) provides baseline for expected coarticulation effects
- Target regions are 3D ellipsoids, not fixed points
- The DAC model (Degree of Articulatory Constraints) is supported

### Implementation Implications
- Affricates /ʧ/ can use same place targets as /ʃ/ (unified monophoneme)
- Between-speaker normalization should account for speaking rate
- Individual palate shape affects target distinctiveness

## Open Questions

- [ ] What are the exact formant correlates of these 3D positions?
- [ ] How do these targets translate to vocal tract area functions?
- [ ] Do apical vs laminal /s/ producers show different formant patterns?
- [ ] How does connected speech affect target achievement?

## Related Work Worth Reading

- Guenther (1995) - DIVA model speech sound acquisition
- Recasens & Espinosa (2009) - DAC model coarticulation in Catalan
- Mooshammer et al. (2007) - Jaw and tongue interactions (German data)
- Narayanan et al. (1995) - MRI study of fricatives
- Fletcher (1989) - Palatometric specification of stops, affricates, sibilants
- Brunner et al. (2009) - Palate shape and articulatory behavior
