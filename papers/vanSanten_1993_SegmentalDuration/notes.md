# Quantitative Modeling of Segmental Duration

**Authors:** Jan P. H. van Santen
**Year:** 1993
**Venue:** ACL 1993, pp. 323-328
**Affiliation:** AT&T Bell Laboratories

## One-Sentence Summary
Presents a speaker-dependent segmental duration prediction system using sums-of-products models with 42 separate models for different phonetic categories, achieving 0.93 correlation with observed durations and significantly outperforming Klatt-style rules in subjective TTS evaluation.

## Problem Addressed
Existing duration models (Klatt, additive, multiplicative) fail to capture the complex interactions between contextual factors affecting segmental duration. General-purpose methods (CART, neural nets) perform poorly on rare feature vectors due to "lopsided sparsity" in linguistic data.

## Key Contributions
1. Identifies "lopsided sparsity" as fundamental challenge - rare vectors guaranteed even in small samples
2. Shows ordinal patterns in duration data can be captured by sums-of-products models
3. Develops 42-model category tree covering vowels, intervocalic consonants, non-intervocalic consonants
4. Achieves 0.93 correlation, 73% listener preference over Klatt-style rules
5. Demonstrates cross-speaker generalization (0.96 correlation male→female)

## Key Equations

### Klatt Duration Model
$$
DUR(\mathbf{f}) = s_{1,1}(f_1) \times \cdots \times s_{1,n+1}(f_{n+1}) + s_{2,n+1}(f_{n+1})
$$
Where:
- $\mathbf{f}$ = feature vector
- $f_j$ = j-th component of feature vector
- $s_{i,j}$ = factor scale (first subscript = product term, second = factor)
- Example: $s_{1,1}(stressed) = 1.40$

### General Sums-of-Products Model
$$
DUR(C, P, S) = s_{1,1}(C) \times s_{1,2}(P) \times s_{1,3}(S) + s_{2,1}(C) \times s_{2,2}(P)
$$
Where:
- $C$ = consonant class
- $P$ = place of articulation
- $S$ = stress condition
- All factor scales positive

### Model Space Size
For $n$ factors:
$$
\text{Number of models} \to 2^{2^n - 1} - 1
$$
- 5 factors → 2 billion models
- 8 factors → 10^76 models

## Parameters

### Training Data Statistics
| Metric | Value |
|--------|-------|
| Sentences | 2,162 |
| Segments | 41,588 |
| Feature vector types | 5,073 |
| Speaker | Male American English |
| Segmentation error | 3 ms average |

### Model Statistics
| Category | Parameters |
|----------|------------|
| Vowels | 32 |
| Intervocalic consonants | 196 |
| Non-intervocalic consonants | 391 |
| **Total** | **619** |
| Models | 42 |
| Data points per parameter | ~8 average |

### Performance Metrics
| Metric | Value |
|--------|-------|
| Overall correlation | 0.93 |
| Vowel correlation | 0.90 |
| Intervocalic consonant correlation | 0.90 |
| Non-intervocalic consonant correlation | 0.87 |
| Cross-validation correlation | 0.987 |
| Cross-speaker (M→F) correlation | 0.96 |
| Listener preference (new vs old) | 73% |
| Sentences with significant preference for new | 60% |

### Example Duration Data (Table 1 - Intervocalic Consonants)
| Segment | Unstressed/Stressed | Stressed/Unstressed | Difference | Percent |
|---------|---------------------|---------------------|------------|---------|
| /s/ | 149 ms | 112 ms | 37 ms | 33% |
| /f/ | 126 ms | 101 ms | 26 ms | 25% |
| /t/burst | 71 ms | 9 ms | 62 ms | 716% |
| /p/burst | 61 ms | 18 ms | 43 ms | 238% |
| /d/burst | 12 ms | 7 ms | 5 ms | 67% |
| /b/burst | 9 ms | 8 ms | 1 ms | 12% |
| /t/closure | 75 ms | 20 ms | 55 ms | 274% |
| /p/closure | 90 ms | 68 ms | 22 ms | 33% |
| /n/ | 63 ms | 39 ms | 24 ms | 62% |
| /m/ | 75 ms | 62 ms | 14 ms | 22% |

### Lopsided Sparsity (Table 2)
| Sample Size | Type Count | Lowest Type Frequency |
|-------------|------------|----------------------|
| 20 | 18 | 13 per million |
| 320 | 254 | ≈1 per million |
| 5,120 | 1,767 | <1 per million |
| 81,920 | 5,707 | <1 per million |
| 22,249,882 | 17,547 | <1 per million |

## Implementation Details

### Category Tree Structure
```
Linguistic Space
├── Vowels (32 params)
└── Consonants
    ├── Intervocalic (196 params)
    └── Non-intervocalic
        ├── Syllable onsets
        ├── Non-phrase-final codas
        └── Phrase-final codas
            └── [Split by consonant class]
```

### System Construction Steps
1. **Category structure**: Divide linguistic space by phonetic/phonological distinctions
2. **Factor relevance**: Statistical analysis per category to identify relevant factors
3. **Model selection**: Diagnostic methods to find best sums-of-products model (31 analyses for 5 factors)
4. **Parameter estimation**: Weighted least-squares with gradient descent

### Key Interactions Found
- Consonant × stress interaction (Table 1)
- Postvocalic consonant × phrasal position
- Syllabic stress × pitch accent
- Place of articulation modulates stress effects (alveolar > labial)

### Ordinal Patterns in Data
1. Unstressed/Stressed always > Stressed/Unstressed
2. Stress effects larger for alveolars than labials (same class)
3. Within place, stress effect order consistent across consonant classes
4. BUT: consonant duration order reverses between stress conditions

## Figures of Interest
- **Table 1 (p. 2)**: Intervocalic consonant durations showing consonant × stress interaction
- **Table 2 (p. 2)**: Lopsided sparsity demonstration

## Results Summary
- 42 sums-of-products models, 619 total parameters
- 0.93 overall correlation with observed durations
- Subjective test: 73% preference for new system over Klatt-style rules
- Only 1/200 sentences showed significant preference for old system
- Cross-speaker generalization works well (0.96 correlation)

## Limitations
1. Speaker-dependent (one male speaker for training)
2. Manually segmented data required (3 ms error)
3. Automatic segmentation boundaries differ from manual → different duration patterns
4. No sub-segmental timing (e.g., diphthong steady-state vs glide)
5. Text-independent variability ~15% (21.4 ms residual SD for vowels)

## Relevance to Qlatt Project
- **Direct application**: Sums-of-products model structure for duration rules
- **Category tree**: Separate models for vowels vs intervocalic vs coda consonants
- **Interaction handling**: Model captures stress × consonant × position interactions
- **Factor scales**: Multiplicative approach with additive correction terms
- **Validation approach**: Cross-validation and listener preference testing

## Open Questions
- [ ] What are the 8 factors used for vowel duration modeling?
- [ ] Exact factor scale values for implementation?
- [ ] How to handle sub-segmental timing (diphthong components)?
- [ ] Training data requirements for new speaker?

## Related Work Worth Reading
- Klatt (1976) - Linguistic uses of segmental duration in English (JASA 59)
- Allen, Hunnicutt & Klatt (1987) - From Text to Speech: The MITalk System
- van Santen (1992) - Contextual effects on vowel duration (Speech Comm. 11) **DETAILED VERSION**
- Crystal & House (1988a,b) - Segmental durations in connected speech (JASA 83)
- Campbell (1992) - Syllable-based segmental duration
- Hertz (1991) - Streams, phones and transitions (J. Phonetics 19)
