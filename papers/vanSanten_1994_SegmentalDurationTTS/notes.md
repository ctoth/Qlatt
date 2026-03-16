---
title: "Assignment of Segmental Duration in Text-to-Speech Synthesis"
authors: "Jan P. H. van Santen"
year: 1994
venue: "Computer Speech and Language, Vol. 8, pp. 95-128"
doi_url: "10.1006/csla.1994.1005"
---

# Assignment of Segmental Duration in Text-to-Speech Synthesis

## One-Sentence Summary
This paper presents a complete duration prediction system for TTS based on sums-of-products models organized within a category tree, achieving 0.93 correlation with observed durations and significantly outperforming Klatt-style multiplicative rules in perceptual evaluation.

## Problem Addressed
Existing duration systems (Klatt 1976 rules, CART-based approaches) fail to properly handle: (1) factor interactions where one factor amplifies or attenuates the effect of another, (2) extreme sparsity of the linguistic feature space where most factor combinations never occur in training data, and (3) the inability of simple multiplicative models to capture non-multiplicative interaction patterns.

## Key Contributions
- **Sums-of-products duration models**: A mathematical framework that generalizes both additive and multiplicative duration models, capturing interaction patterns in duration data with fewer parameters
- **Category tree architecture**: Hierarchical grouping of phonetic contexts (vowels, intervocalic consonants, consonants in clusters) with separate sums-of-products models for each leaf
- **Statistical methodology**: Techniques for robust parameter estimation under severe data sparsity including quasi-minimal sets, piecewise multiplicative correction, and diagnostic residual analysis
- **Perceptual validation**: Forced-choice experiments showing 73% listener preference for the new system over the old MITalk-style rules, with 60% of sentences rated significantly better
- **Speaking rate modeling**: Duration ratios for fast/slow speech across phonetic categories

## Methodology

### The Feature Vector
Each phonetic segment is described by a feature vector of contextual factors:
1. **Pitch accent**: accented, deaccented, cliticized
2. **Syllabic stress** (vowels): primary stressed, unstressed, secondary stressed
3. **Syllabic stress** (consonants): stress of surrounding vowels
4. **Surrounding phonemes**: identity of adjacent segments
5. **Within-syllable position** (consonants): coda vs. onset (intervocalic = ambisyllabic)
6. **Within-word position**: word-initial syllable vs. not word-initial, word-final syllable vs. not word-final
7. **Within-utterance position**: utterance-final syllable vs. utterance-penultimate syllable vs. other

### The Category Tree (Figure 1, page 98)
```
ALL CASES
├── VOWELS
└── CONSONANTS
    ├── INTERVOCALIC
    └── IN CLUSTERS
        ├── CODAS
        │   ├── ONSETS
        │   ├── PHRASE-MEDIAL
        │   └── PHRASE-FINAL
        └── [each with CONSONANT CLASSES subdivisions]
```

### Key Equations

**Klatt Model (Equation 2-3)**:

$$T_{out} = k_{f_j}(T_{in} - D_{min,P}) + D_{min,P}$$

$$DUR(P, \mathbf{f}) = k_{f_1} \times \ldots \times k_{f_n} \times (D_{inh,P} - D_{min,P}) + D_{min,P}$$

Where $P$ is the phoneme, $k_{f_j}$ is the multiplicative factor for factor level $f_j$, $D_{inh,P}$ is inherent duration, and $D_{min,P}$ is minimum duration.

**Sums-of-Products Model (Equation 5)**:

$$DUR(\mathbf{f}) = \sum_{i \in T} \prod_{j \in I_i} S_{i,j}(f_j)$$

Where $T$ indexes the product terms, $I_i$ indexes the factors in each product term, and $S_{i,j}$ are the factor scales.

**Generalized Additive Model (Equation 6)**:

$$DUR(vowel, voicing, position) = t[S_{1,1}(vowel) + S_{2,2}(voicing) + S_{3,3}(position)]$$

Where $t$ is a monotonically increasing transformation (exponential gives the multiplicative model).

**Vowel Duration Model (Equation 13)**:

$$log[DUR(A, S, V, C_{pre}, C_{post}, W_{pre}, W_{post}, U)] = S_{1,1}(A) \times S_{1,2}(S) + S_{2,3}(V) + S_{3,4}(C_{pre}) + S_{4,6}(W_{pre}) + S_{5,7}(W_{post}) + S_{6,4}(C_{post}) + S_{7,5}(C_{post}) \times S_{7,8}(U)$$

Where: **A** = pitch accent, **S** = syllabic stress, **V** = vowel identity, **C_pre** = class of preceding consonant, **C_post** = class of postvocalic consonant, **W_pre** = number of consonants preceding vowel in word, **W_post** = number of syllables following vowel in word, **U** = phrasal position. 32 total parameters.

**Intervocalic Consonant Model (Equation 14-15)**:

$$log[DUR(consonant, stress, word\ position)] = S_{1,[1;3]}(consonant, position) + S_{2,[1;3]}(consonant, position) \times S_{2,2}(stress)$$

With additional additive terms for accent and phrasal position. 196 total parameters.

**Piecewise Multiplicative Correction (Equation 10)**:

$$log[DUR(f_1, \ldots, f_n)] = A(f_1) + B(f_2, \ldots, f_n)$$

Used when critical factor ($F_1$) and corrective factors combine multiplicatively.

## Parameters

| Factor | Levels | Role | Notes |
|--------|--------|------|-------|
| Pitch accent (A) | accented, deaccented, cliticized | Vowels & consonants | Interacts with syllabic stress |
| Syllabic stress (S) | 0-stressed, 1-stressed, 2-stressed | Vowels & consonants | Combined with accent: "stress accent" compound factor |
| Vowel identity (V) | ~15 vowel classes | Vowels only | Single scale, no interactions with context |
| Postvocalic consonant (C_post) | voiceless stops, nasals, voiced stops, voiceless fricatives, etc. | Vowels | Interacts with phrasal position |
| Preceding consonant (C_pre) | consonant classes | Vowels | Additive effect |
| Within-word position (W_pre, W_post) | # consonants before, # syllables after | Vowels & consonants | Shortening with more syllables |
| Phrasal position (U) | phrase-medial, phrase-final | All | Phrase-final lengthening |
| Consonant identity | 32 consonants | Consonants | Combined with position |
| Syllable boundary | onset vs. coda, word-initial vs. not | Clusters | Determines which model applies |
| Surrounding segment class | stops, nasals, fricatives, affricates, liquids/glides, vowels, /h/ | Clusters | Identity and voicing |

## Implementation Details

### Database
- Single male American English speaker
- 2162 isolated, short, meaningful sentences
- 41,588 segments covering 5073 feature vector types
- Manual segmentation with ~3 ms average error
- No disfluencies; re-recorded until clean

### Key Data Findings

**Vowels (8 factors, 86% variance explained)**:
- Two major interactions: pitch accent x syllabic stress (amplification), postvocalic consonant x phrasal position
- Vowel identity does NOT interact with contextual factors (ordered/single-scale)
- Correlation: 0.898-0.908 across conditions

**Intervocalic Consonants (Figure 6-8)**:
- Effects of combined stress: consonant duration increases with stress of following vowel, decreases with stress of preceding vowel
- Word position interacts with consonant identity
- Flapping extends beyond /t/ to most other consonants
- Correlation: 0.903 (10,420 segments)

**Consonants in Clusters**:
- More complex: syllable position, word boundary, and segment context all matter
- Separate analyses for onsets, phrase-medial codas, phrase-final codas
- Voiceless stop bursts in onsets: duration affected by following segment class, stress, preceding segment
- Correlation: 0.874 overall (0.841 onsets, 0.824 phrase-medial codas, 0.871 phrase-final codas)

**Combined model across all categories**: r = 0.93

### Speaking Rate (Table I, III)

| Speaking Rate | Median Duration (ms) | SD (ms) |
|--------------|---------------------|---------|
| Predicted (default) | 52 | 39 |
| Fast | 44 | 38 |
| Normal | 53 | 46 |
| Slow | 68 | 57 |

- Normal rate was 22% slower than fast rate and 28% faster than slow rate
- Fast rate was 56% faster than slow rate
- Duration ratios (normal/fast, slow/fast, slow/normal) were NOT among the factors that distinguished stressed from unstressed vowels -- fast/slow ratios were larger for unstressed vowels by only 4% (non-significant)
- Stop closures have larger rate ratios than stop bursts
- Vowels (not schwa) show larger phrase-final than phrase-medial rate effects

### Parameter Estimation Procedure
1. Estimate multiplicative correction $S_{2,2}(stress)$ for phrase-medial, accented words
2. Substitute into model, estimate consonant-position parameters $S_{1,[1;3]}$ and $S_{2,[1;3]}$
3. Iterate steps 1-3 until convergence (criterion: 0.01 change value)
4. Estimate accent and phrasal position from residuals
5. Set negative slope estimates to zero at p=0.05 significance

### Comparison with Klatt Model
- The Klatt model (Equation 3) uses pure multiplication of factor scales
- Van Santen's model differs: vowel factor uses two scales (D_inh - D_min) and D_min, not just one
- The MITalk system added manual corrections (L_s, M_p parameters) making it mathematically untractable
- Van Santen's approach: fewer parameters but more principled interaction structure

## Figures of Interest
- **Fig 1 (p. 98):** Category tree structure for the duration system
- **Fig 2 (p. 99):** Frequency distribution of feature vectors showing extreme lopsided sparsity
- **Fig 4 (p. 105):** Hypothetical data showing sums-of-products model interpolation vs. CART pooling
- **Fig 5 (p. 107):** Same with noisy data -- sums-of-products still predicts well with 67% missing data
- **Fig 6 (p. 116):** Effects of within-word position and combined stress on six intervocalic consonants
- **Fig 7 (p. 117):** Effects of stress levels of preceding/following vowels on intervocalic consonants
- **Fig 8 (p. 118):** Magnitude of combined stress effect across consonant-position combinations
- **Fig 9 (p. 121):** Duration data for voiceless stop bursts in onsets, voiceless fricatives in codas, voiced stop closures in codas
- **Fig 10 (p. 122):** Cumulative distribution of correlation coefficients (median 0.47)
- **Fig 11 (p. 125):** Perceptual preference results -- new system preferred 73% overall
- **Fig 12 (p. 125):** Per-sentence t-statistics distribution showing consistent preference

## Results Summary

### Prediction Accuracy
- Overall correlation: 0.93 (41,558 segments across all categories)
- Vowels: 0.898-0.908 correlation
- Intervocalic consonants: 0.903
- Consonants in clusters: 0.874

### Perceptual Evaluation
- 200 sentences selected where predictions differed maximally from old system
- 8 listeners, two-alternative forced-choice with 1-6 certainty rating
- 73% preference for new system (27% old)
- 60% of sentences significantly better (t > 2.36)
- Only 1 sentence out of 200 where old was significantly preferred
- With randomly selected sentences (prior experiment), improvement was less dramatic but still present

## Limitations
- Single speaker, American English only
- Para-linguistic factors (speaking rate) modeled externally, not part of the core model
- No syntactic factors beyond what is implicit in pitch accent prediction
- Speaking rate assumed constant throughout database (10% variability found)
- Phrase boundary strength limited to utterance-medial vs. utterance-final (no internal phrase boundaries)
- Sub-segmental timing (e.g., steady-state vs. transition) not modeled
- No accounting for diphthong internal timing differences

## Testable Properties
- Duration must be non-negative for all parameter combinations
- Stressed vowels must be longer than unstressed vowels in the same context
- Phrase-final segments must be longer than phrase-medial segments
- Correlation between observed and predicted durations should exceed 0.85
- Combined stress effect slopes ($S_{2,[1;3]}$) should be non-negative for all consonant-position combinations
- Vowel identity effect should be ordered (inherent duration ranking preserved across contexts)
- The sums-of-products model should produce better predictions than a pure multiplicative model when factor interactions are amplificatory

## Relevance to Project
This paper is directly applicable to Qlatt's duration assignment system. The key takeaways for implementation are:
1. **Category tree**: Group segments into vowels, intervocalic consonants, and consonants-in-clusters, with separate duration models for each
2. **Sums-of-products**: Use product terms that capture key interactions (pitch accent x stress, postvocalic consonant class x phrasal position) rather than pure multiplication
3. **Log-domain computation**: Work in log-duration space where interactions become additive
4. **Speaking rate**: Apply as a uniform multiplier with category-specific ratios (Table III)
5. **Factor prioritization**: The 8 factors for vowels (accent, stress, vowel identity, surrounding consonants, word position, phrasal position) account for 86% of variance

## Open Questions
- [ ] How well does this model generalize to other speakers?
- [ ] Can the 32 consonant identity levels be reduced without loss?
- [ ] How should sub-segmental timing (closure vs. burst, steady-state vs. transition) be incorporated?
- [ ] What are the precise parameter values for the AT&T system (not published in full)?
- [ ] How does this compare to modern neural duration prediction?

## Related Work Worth Reading
- van Santen (1992a) - Contextual effects on vowel duration (detailed vowel analysis)
- van Santen (1993a) - Analysing N-way tables with sums-of-products models (mathematical foundations)
- van Santen & Olive (1990) - Analysis of contextual effects on segmental duration
- Crystal & House (1988a,b,c) - Segmental durations in connected speech signals
- Klatt (1976) - Linguistic uses of segmental duration in English (the baseline rules)
- Allen et al. (1987) - From Text to Speech: The MITalk System (the system this improves upon)
- Riley (1992) - Tree-based modeling for speech synthesis (CART approach compared against)

## Collection Cross-References

### Already in Collection
- [[Klatt_1976_SegmentalDuration]] - The baseline multiplicative duration rules this paper improves upon
- [[Allen_1987_MITalk_TTS]] - The MITalk system whose duration module is being replaced
- [[Klatt_1987_TTS_Review]] - Comprehensive review including duration rules (Klatt's 11 rules)
- **vanSanten_1993_SegmentalDuration** - Earlier version of this work (speaker-dependent system)
- **vanSanten_1997_ProsodicModeling** - Later paper discussing obstacles to prosodic quality including duration
- [[Crystal_House_1988_StopConsonantDuration]] - Referenced for connected speech duration data
- [[Hertz_1991_StreamsPhonesTransitions]] - Referenced for alternative duration modeling via phone-and-transition segmentation

### New Leads (Not Yet in Collection)
- Umeda (1977) - "Consonant duration in American English" - JASA 61, 846-858 -- comprehensive consonant duration data
- Umeda (1988a) - "Vowel duration in American English" - JASA 58, 434-445 -- comprehensive vowel duration data
- Port (1981) - "Linguistic timing factors in combination" - JASA 69, 262-273 -- on factor interaction
- Lindblom & Rapp (1973) - "Some temporal properties of spoken Swedish" -- cross-linguistic duration

### Supersedes or Recontextualizes
- [[Klatt_1976_SegmentalDuration]]: Van Santen demonstrates that Klatt's pure multiplicative model is a special case of sums-of-products, and that key interactions (especially pitch accent x syllabic stress) are not properly captured by multiplication alone. The new system is perceptually preferred 73% of the time.
- **vanSanten_1993_SegmentalDuration**: This 1994 paper is the full journal version of the earlier work, with more complete description of the statistical methodology and perceptual evaluation.
