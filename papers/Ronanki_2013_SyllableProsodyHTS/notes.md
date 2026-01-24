# Syllable Based Models for Prosody Modeling in HMM Based Speech Synthesis

**Authors:** Srikanth Ronanki, Oliver Watts, Simon King, Rob Clark
**Year:** 2013 (part of Simple4All project, FP7/2007-2013)
**Venue:** Technical Report / Conference Paper (IIIT Hyderabad + University of Edinburgh CSTR)
**DOI/URL:** N/A

## One-Sentence Summary

Proposes using syllable-level HMMs for better F0/duration modeling while retaining phone-level HMMs for spectral features, combined via DTW in a hybrid TTS system.

## Problem Addressed

- Phone-based HTS systems model prosody poorly because phones are too short to capture pitch contours
- Syllable-based systems have better prosody but worse spectral modeling (data sparsity)
- Need a way to get best of both worlds

## Key Contributions

1. **Named segment clustering** - Unsupervised algorithm to form "named segments" from syllables using linguistic/syntactic features
2. **Levenshtein back-off** - Strategy to handle missing syllable units at synthesis time
3. **Hybrid DTW system** - Combines phone spectral features with syllable prosodic features via dynamic time warping

## Methodology

### Syllable Naming Scheme

Syllables are clustered into "named segments" using feature encoding:

| Feature Type | Features | Notation |
|--------------|----------|----------|
| Primary | stress | 0/1 |
| Primary | accent | 0/1 |
| Primary | word initial | 0/1 |
| Primary | word final | 0/1 |
| Primary | phrase initial | 0/1 |
| Primary | phrase final | 0/1 |
| Secondary | onset | 0/1/2 (none/voiced/unvoiced) |
| Secondary | coda | 0/1/2 (none/voiced/unvoiced) |
| Secondary | POS | 0-8 (9 categories for English) |

Feature representation format: `(primary_features secondary_features)` read right-to-left.

Example: "All" (aol) → (020 011101) → Seg413

### Back-off Strategy

For missing syllables at synthesis time:
- Use **Levenshtein distance** between feature strings
- **Weight word-initial and word-final features highest**
- Find nearest optimal segment based on edit distance

### Hybrid Synthesis Pipeline

1. Generate spectral features (MGC) from **phone HMMs**
2. Generate prosodic features (F0, duration) from **syllable HMMs**
3. Use **DTW** to align phone spectral trajectory to syllable timing
4. Synthesize with MLSA filter or STRAIGHT vocoder

## Key Equations

### Mel Cepstral Distortion (MCD)

$$
MCD = \frac{10}{\log 10} \cdot \sqrt{2 \cdot \sum_{i=1}^{40}(mc^e_i - mc^o_i)^2}
$$

Where:
- $mc^o_i$ = original mel-generalized cepstral coefficient
- $mc^e_i$ = estimated mel-generalized cepstral coefficient
- 40 = number of MGC coefficients

### Root Mean Square Error (F0)

$$
RMSE = \sqrt{\frac{\sum_{i=1}^{n}(y_i^2 - \hat{y}_i^2)}{n}}
$$

Where:
- $y_i$ = original F0 contour
- $\hat{y}_i$ = predicted F0 contour

### Linear Correlation Coefficient

$$
CORR = \frac{n\sum(xy) - (\sum x)(\sum y)}{\sqrt{n(\sum x^2) - (\sum x)^2} \cdot \sqrt{n(\sum y^2) - (\sum y)^2}}
$$

### DTW Viterbi Recursion

$$
\alpha_t(j) = \max_i \{\alpha_{t-1}(i) a_{i,j}\} P(y(t), x(j))
$$

Where:
- $P(y(t), x(j)) = \exp(\|y(t) - x(j)\|^2)$ (Euclidean distance)
- $i \in \{j, j-1, j-2\}$
- $a_{i,j} = 1$ (uniform path weighting)

Backtracking:
$$
\phi_t(j) = \arg\max_i \{\alpha_{t-1}(i) a_{i,j}\}
$$

## Parameters

| Name | Value | Notes |
|------|-------|-------|
| Training data | 1 hour | Per language |
| MGC coefficients | 40 | Mel-generalized cepstral |
| Top segments for clustering | 200 | By frequency in training data |
| MOS scale | 1-5 | 5=excellent, 4=good, 3=fair, 2=poor, 1=bad |

## Results Summary

### Spectral Quality (MCD - lower is better)

| Language | Phone HMM | Syllable HMM |
|----------|-----------|--------------|
| English | 5.57 | 7.57 |
| Telugu | 5.85 | 6.6 |
| Kannada | 5.45 | 6.31 |

**Finding:** Phone HMMs significantly better for spectral modeling

### F0 Quality (RMSE - lower is better, CORR - higher is better)

| Language | RMSE Phone | RMSE Syllable | CORR Phone | CORR Syllable |
|----------|------------|---------------|------------|---------------|
| English | 24.82 | 23.06 | 0.78 | 0.87 |
| Telugu | 19.04 | 15.84 | 0.81 | 0.88 |
| Kannada | 18.56 | 14.72 | 0.80 | 0.88 |

**Finding:** Syllable HMMs significantly better for F0 modeling

### Subjective MOS (1-5 scale)

| Language | Phone HTS | Hybrid HTS |
|----------|-----------|------------|
| English | 4.2 | 4.3 |
| Telugu | 4.2 | 4.35 |
| Kannada | 4.1 | 4.3 |

**Finding:** Hybrid system shows modest improvement across all languages

## Implementation Details

### Training Pipeline
1. Extract MGC + dynamic features from speech
2. Extract log F0 + dynamic features
3. Train monophone HMMs on time-aligned transcriptions
4. Expand to context-dependent pentaphones
5. Apply decision tree clustering (MDL criterion)
6. Re-estimate with Baum-Welch (EM)
7. Model state durations with multivariate Gaussian

### Synthesis Pipeline
1. Text → context-dependent phone labels
2. Concatenate HMMs into sentence HMM
3. Generate MGC and F0 via ML criterion
4. Duration from state duration distributions
5. Synthesize via MLSA filter or STRAIGHT vocoder

### For Syllable System
- Label file uses named segments instead of phones
- Ignore previous-previous and next-next context questions
- Top 200 segments get "current segment followed by any" questions
- Remaining segments use syllable-relevant questions only

## Figures of Interest

- **Fig 1 (page 2):** HMM-based Speech Synthesis System overview - shows training/synthesis pipeline

## Limitations

- Only 10 subjects in MOS evaluation
- Only 5 utterances per experiment
- Modest MOS improvement (0.1-0.25 points)
- DTW alignment may introduce artifacts
- No analysis of computational cost of hybrid approach

## Relevance to Qlatt Project

**Low direct relevance** - This paper is about HMM-based statistical parametric synthesis (HTS), not formant synthesis. However:

1. **Prosody modeling insight:** Syllable-level features better capture pitch contours than phone-level features - could inform F0 rule design
2. **Feature encoding:** The primary/secondary feature scheme (stress, accent, word position, phrase position, onset/coda voicing, POS) is a useful checklist for prosodic context in rule-based systems
3. **Back-off strategy:** Levenshtein distance for finding similar contexts could apply to rule lookup

## Open Questions

- [ ] How does hybrid DTW affect concatenation smoothness?
- [ ] What is the computational overhead of running two HMM systems?
- [ ] Would the feature encoding scheme translate to formant synthesis rules?

## Related Work Worth Reading

- [3] **Klatt 1980** - Cascade/parallel formant synthesizer (already core reference)
- [1] **Klatt 1987** - TTS review (already have)
- [25] Prahallad et al. 2002 - Syllable-based synthesis for Indian languages
- [20] Kawahara 1999 - STRAIGHT vocoder (pitch-adaptive analysis)
