# Implementation Notes: Lindblom & Sundberg 1971 — Acoustical Consequences of Articulator Movement

## Overview

This paper provides a complete articulatory-to-acoustic model mapping four articulator parameters to formant frequencies F1-F4. The model uses Fant's electrical line analog (LEA) with 45 filter sections to compute formant frequencies from area functions derived from the articulatory parameters.

## The Articulatory Model

### Input Parameters

The model takes five inputs that define vocal-tract shape:

| Parameter | Symbol | Range | Description |
|-----------|--------|-------|-------------|
| Jaw opening | j | 5-23 mm | Separation between jaws |
| Labial width | W_m | -10 to +10 mm | Labiomuscular component; negative = rounded, positive = spread |
| Labial height | H_m | 0 | Set to zero for passive lip conditions |
| Tongue body position | d | -1.0 to 1.0 | Anterior-posterior; d=-1.0 palatal, d=0 velar, d=1.0 pharyngeal |
| Tongue body shape | c | 0 to 1.0 | Degree of constriction; c=0 neutral, c=1.0 maximum constriction |
| Larynx lowering | - | 0 or 10 mm | Binary: normal or lowered by 10 mm |

### Tongue Shape Parameterization (c, d)

Three reference tongue contours from x-ray data (Swedish vowels):
- [i]-contour: palatal constriction (d = -1.0)
- [u]-contour: velar constriction (d = 0, but combined with lip rounding)
- [a]-contour: pharyngeal configuration (d = 1.0)

Intermediate shapes derived by interpolation between reference contours in a semipolar coordinate system referenced to the mandible. The parameter c acts as an interpolation coefficient controlling constriction degree. The parameter d controls which pair of reference shapes is used for interpolation.

### Lip Opening Model

Lip opening area A derived from lip geometry:

**Eq. 1:** Lip contour shape (frontal plane):
```
y = +/- (h/2) * [1 - (2/w)^p * |x|^p]
```
where h = vertical lip separation, w = horizontal distance between innermost contact points, p = curvature parameter (typically p = 2).

**Eq. 2:** Lip opening area:
```
A = h * w * p / (p + 1)
```

**Eq. 3:** Jaw-dependent lip height (passive lips):
```
h_0 = j - k
```
where j = jaw separation, k = distance mandible moves before lips begin to open.

**Eq. 4:** Jaw-dependent lip width (passive lips):
```
w = W^p * sqrt(h/H)
```
where W = total distance between mouth corners, H = midsagittal lip separation.

**Eq. 5:** Vocal-tract termination point (l):
```
l = (H - h) / H * (C^2 - H^2/4)^(1/2)
```
where C = constant (~12 mm) denoting length of outer lip contour projected laterally.

Default values used throughout: W = 38 mm, H - h = 2 mm, k = 4 mm, p = 2, C = 12 mm, L_m = +/-5 mm.

### Cross-sectional Area Computation

**Eq. 6:** Area from cross-distance (pharynx):
```
A = k * a^alpha
```

**Table I:** Constants for distance-to-area conversion:

| Region | k | alpha |
|--------|---|-------|
| Mouth | 2.2 | 1.38 |
| Upper pharynx | 0.68 | 1.9 |
| Lower pharynx | 1.1 | 2.21 |

Area function computed using Fant's LEA (electrical line analog) with 45 filter sections, each 0.5 cm, representing cross-sectional areas from 0.16 to 16 cm^2.

## Acoustic Results

### A. Effect of Jaw Movement (Fig. 12)

Jaw opening (j from 5 to 23 mm) has major effects on F1:

- **F1 rises substantially** with jaw opening for all tongue shapes (several hundred Hz shift)
- For [i]-like tongue (c=1.0, d=-1.0): F1 rises from ~250 to ~500 Hz as j goes from 5 to 25 mm
- For neutral tongue (c=0): F1 also rises substantially
- At j=23 mm (wide open), the tract approaches a straight uniform tube; F1 approaches quarter-wavelength resonance (~500 Hz)
- At small j (5 mm), two constrictions exist (lips and velum for "spread" conditions), creating double Helmholtz resonator pattern in F2

**F2:** Most affected when c=1.0 and d=0 (palatal-to-velar tongue). The sensitivity varies greatly with tongue configuration. For neutral tongue (c=0), F2 is relatively unaffected by jaw.

**F3:** Largest variation for c=1.0 and d=-1.0 (palatal constriction). Can be approximated as half-wave resonance of front cavity (5c/4l approximation works at large j).

### B. Effect of Tongue Body Position (d) (Fig. 13)

Changing d from -1.0 to 1.0 (palatal to pharyngeal):

- **F2 is extremely sensitive** to tongue body positioning. Effect diminishes somewhat as mandible is lowered but remains ~1000 Hz in all cases.
- High F2 for palatal position (d=-1.0): interpreted as half-wavelength resonance between palatal constriction and glottis.
- As tongue hump slides toward pharynx, F2 is considerably lowered.
- **F3 is less sensitive** than F2 to this movement.
- **F1 is raised** somewhat by the mandible movement that accompanies tongue positioning (d contributes toward raising F1 somewhat).

### C. Effect of Lip Movement (Figs. 12, 13, 14)

"Rounding" (W_m = -10 mm) vs. "Spreading" (W_m = +10 mm):

- **Rounding lowers all formant frequencies** under all conditions.
- The lowering is particularly pronounced for:
  - F3 with palatal constriction shapes
  - F2 with (palato-)velar and velopharyngeal constrictions
- F1 shifts are of smaller magnitude but slightly larger for pharyngeal constrictions (F1 front-cavity dependent).
- Rounding affects F3 and F2 most markedly in the top left graph of Fig. 12; spreading has notable effects on these formants too.

### D. Effect of Larynx Lowering (Table II)

Simulated by adding 10 mm to pharynx cavity length. Lowers all formant frequencies.

**Table II: Formant frequencies with and without larynx lowering (Hz)**

| Vowel | F1 (normal) | F1 (lowered) | F2 (normal) | F2 (lowered) | F3 (normal) | F3 (lowered) | F4 (normal) | F4 (lowered) |
|-------|------|------|------|------|------|------|------|------|
| [i] | 250 | 235 | 2255 | 2038 | 2702 | 2663 | 3534 | 3424 |
| [e] | 315 | 295 | 1940 | 1810 | 2520 | 2490 | 2955 | 2786 |
| [epsilon] | 460 | 436 | 1704 | 1840*| 2520*| 2597*| 3165 | 3040 |
| [y] | 199 | 188 | 1935 | 1830 | 2060 | 2040 | 2883 | 2713 |
| [oe] | 410 | 389 | 1720 | 1600 | 2480 | 2418 | 2965 | 2870 |
| [u] | 246 | 224 | 775 | 766 | 2340 | 2224 | 2964 | 2813 |
| [o] | 452 | 435 | 818 | 800 | 2423 | 2410 | 2770 | 2670 |
| [a (open)] | 650 | 600 | 920 | 882 | 2663 | 2580 | 3510 | 3260 |
| [a] | 683 | 662 | 1130 | 1034 | 2550 | 2470 | 3576 | 3327 |
| [ae] | 570 | 548 | 1563 | 1407 | 2498 | 2445 | 3109 | 2945 |
| [barred-u] | 282 | 271 | 1612 | 1495 | 2300 | 2247 | 2911 | 2744 |

*Note: some [epsilon] values appear anomalous in the original table.

**Summary of larynx lowering effects:**
- F1: ~5-6% decrease; strongest for [u] and [a], weaker for [i]
- F2: ~6.3% average decrease; strongest effect
- F3: ~3% decrease; rather insensitive ("front-cavity affiliation")
- F4: ~5% average decrease; largest absolute shift (~160 Hz for some vowels)
- Net effect: decreases frequency distance between F3 and F4 -- characteristic of lowered-larynx singing

### Table III: Model Parameter Values for Swedish Vowels

| Vowel | d | c | W | j |
|-------|-----|-----|------|-----|
| [i] | -1.0 | 1.0 | 10 | 9 |
| [e] | -1.0 | 1.0 | 10 | 11 |
| [epsilon] | -1.0 | 1.0 | 10 | 23 |
| [ae] | 0 | 0 | 10 | 23 |
| [oe] | -1.0 | 1.0 | -10 | 9 |
| [y] | -1.0 | 1.0 | -10 | 5 |
| [u] | 0 | 1.0 | -10 | 5 |
| [o] | 0.5 | 1.0 | -10 | 5 |
| [a (open)] | 1.0 | 1.0 | -10 | 10 |
| [a] | 1.0 | 1.0 | 10 | 10 |
| [barred-u] | 0 | 0 | -10 | 5 |
| [oe (open)] | 0.5 | 0 | -10 | 15 |
| [a (back)] | 1.0 | 1.0 | 10 | 15 |

## Key Findings for Synthesis

### Jaw-Tongue Synergism

The paper's central theoretical contribution: jaw opening is "optimized" to cooperate with the tongue. The optimal jaw position prevents excessive tongue deformation while achieving the desired area function. This means:
- For "close" vowels [i, u]: small jaw opening (j = 5-9 mm)
- For "open" vowels [a, ae]: large jaw opening (j = 15-23 mm)
- "Tongue height" is actually a derived feature of the combined jaw + tongue configuration, not a primary articulatory parameter

### Compensatory Articulation Evidence

The fixed-mandible experiment showed that for all artificial jaw positions, formant patterns approached normal values rather closely -- evidence that jaw position is not essential for vowel quality, and that tongue shape can compensate. This is consistent with "superpalatalization" (tongue raised to compensate for lowered jaw in [i]) and "superpharyngealization" (tongue backed to compensate in [a]).

### Relevance to Formant Synthesis Rules

1. **F1 is primarily jaw-controlled**: For a formant synthesizer, the F1 target is largely determined by vowel openness/jaw opening
2. **F2 is primarily tongue-position-controlled**: The d parameter (palatal vs. pharyngeal) is the main F2 determinant
3. **Lip rounding lowers all formants**: Rules implementing rounding effects should lower F1 slightly, F2 moderately (especially for back vowels), and F3 substantially (especially for front vowels)
4. **Larynx height affects all formants uniformly**: ~5-6% lowering per 10 mm descent, applicable as a multiplicative scaling factor
5. **F3 is front-cavity affiliated**: sensitive to palatal constriction geometry and lip configuration, relatively insensitive to pharyngeal changes

### Acoustic Sensitivity Summary

| Articulator | F1 effect | F2 effect | F3 effect | F4 effect |
|-------------|-----------|-----------|-----------|-----------|
| Jaw opening (increase) | Large increase | Variable (tongue-dependent) | Variable | Variable |
| Tongue position (palatal to pharyngeal) | Small increase | Large decrease (~1000 Hz) | Moderate decrease | Small |
| Tongue constriction (increase) | Small | Large (especially palatal) | Moderate | Small |
| Lip rounding | Small decrease | Moderate decrease | Large decrease (front vowels) | Moderate decrease |
| Larynx lowering (10 mm) | ~5% decrease | ~6% decrease | ~3% decrease | ~5% decrease |
