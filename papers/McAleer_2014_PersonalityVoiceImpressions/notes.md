---
title: "McAleer, Todorov & Belin (2014) - Personality Impressions from Brief Novel Voices"
year: 2014
citation: "McAleer P, Todorov A, Belin P (2014) How Do You Say 'Hello'? Personality Impressions from Brief Novel Voices. PLoS ONE 9(3): e90779."
---

# McAleer, Todorov & Belin (2014) - Personality Impressions from Brief Novel Voices

## Key Finding: Two-Dimensional Social Voice Space

PCA of 10 personality trait ratings on sub-second "hello" utterances reveals two orthogonal dimensions:
- **PC1 = Valence** (Trust, Likeability, Warmth) - 56-60% variance
- **PC2 = Dominance** (Dominance, Aggressiveness, Confidence) - 26-32% variance
- Together explain ~88% of variance for both male and female voices

## PCA Loadings (Table 2)

### Male Voices
| Trait | PC1 (Valence) | PC2 (Dominance) |
|---|---|---|
| Aggressiveness | -0.74 | 0.61 |
| Attractiveness | 0.33 | 0.71 |
| Competence | 0.70 | 0.63 |
| Confidence | 0.75 | 0.44 |
| Dominance | 0.15 | 0.98 |
| Likeability | 0.95 | -0.20 |
| Trustworthiness | 0.92 | -0.05 |
| Warmth | 0.91 | -0.35 |

### Female Voices
| Trait | PC1 (Valence) | PC2 (Dominance) |
|---|---|---|
| Aggressiveness | -0.52 | 0.76 |
| Attractiveness | 0.74 | -0.45 |
| Competence | 0.88 | 0.20 |
| Confidence | 0.62 | 0.74 |
| Dominance | 0.55 | 0.80 |
| Likeability | 0.93 | -0.24 |
| Trustworthiness | 0.96 | -0.15 |
| Warmth | 0.91 | -0.12 |

## Acoustic Measures Used

8 measures extracted with Praat from 64 "hello" utterances (~390 ms):
1. Mean F0 (range: 75-600 Hz)
2. Changing F0 (max-min, index of intonation)
3. Glide (F0-end minus F0-start)
4. Formant dispersion (ratio of consecutive F1-F4 means)
5. HNR (harmonic-to-noise ratio)
6. Jitter (RAP)
7. Shimmer (APQ3)
8. Alpha ratio (low 0-1kHz vs high 1-5kHz energy)

## Acoustic-to-Dimension Regression Models

### Male PC1 (Valence/Trust): R=0.70, 49% variance
- F0: beta=0.48, p<.05 (higher F0 -> more trustworthy)
- HNR: beta=-0.57, p<.001 (lower HNR -> more trustworthy)

### Female PC1 (Valence/Trust): R=0.82, 68% variance
- HNR: beta=-0.44, p<.01
- Glide: beta=-0.58, p<.001 (falling pitch -> more trustworthy)
- Intonation: beta=0.6, p<.001 (wider pitch range -> more trustworthy)

### Male PC2 (Dominance): R=0.82, 68% variance
- Alpha ratio: beta=-0.25, p=.06
- F0: beta=-0.37, p<.05 (lower F0 -> more dominant)
- HNR: beta=-0.41, p<.05
- Formant dispersion: beta=-0.29, p<.05 (lower dispersion -> more dominant)

### Female PC2 (Dominance): R=0.52, 27% variance
- Formant dispersion: beta=-0.43, p<.05
- F0: beta=0.34, p<.05

## Attractiveness as Function of Voice Space

**Male attractiveness** = 0.4*PC1 + 0.7*PC2 (R=0.75, 54% variance)
- Dominance contributes more than Valence

**Female attractiveness** = 0.76*PC1 - 0.29*PC2 (R=0.81, 66% variance)
- Valence dominates; high dominance slightly reduces attractiveness

## Inter-rater Reliability (Cronbach Alpha)
All traits > 0.88; average = 0.92 across 30 raters per trait.

## Implementation Relevance
- For synthesizer speaker profiles: map personality targets to acoustic parameters via these regression equations
- Male dominant voice: lower F0, lower formant dispersion, lower HNR, flatter spectral slope
- Female trustworthy voice: falling glide, wider intonation range, lower HNR
- Sub-second utterances sufficient for reliable personality attribution
