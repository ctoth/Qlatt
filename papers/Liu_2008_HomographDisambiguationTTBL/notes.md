# Tree-Guided Transformation-Based Homograph Disambiguation in Mandarin TTS System

**Authors:** Fangzhou Liu, Qin Shi, Jianhua Tao
**Year:** 2008
**Venue:** ICASSP 2008
**DOI/URL:** IEEE 1-4244-1484-9/08

## One-Sentence Summary
Hybrid algorithm combining decision trees with transformation-based learning (TBL) to automatically generate disambiguation templates for Mandarin polyphones, achieving 90.36% accuracy.

## Problem Addressed
Mandarin grapheme-to-phoneme conversion requires disambiguating **polyphones** (characters with multiple pronunciations). Manual rule systems suffer from rule conflicts; conventional TBL requires manual template creation which is labor-intensive and incomplete.

## Key Contributions
1. **TTBL algorithm**: Automatically generates TBL templates from decision tree rules, eliminating manual template summarization
2. **Error-driven template generation**: Using templates from both all training data AND error-only data improves performance
3. **Keyword selection comparison**: Log-likelihood ratio is simplest and most effective for keyword feature extraction
4. **Performance**: 80.66% → 90.36% accuracy on 33 key Mandarin polyphones

## Methodology

### Transformation-Based Learning (TBL) Framework
1. Initialize with simple statistics (baseline annotator)
2. Greedily learn ordered rules that correct mistakes
3. Stop when no net improvement possible
4. At evaluation: apply rules in learned order

### TTBL: Tree-Guided TBL
1. Train decision tree on training data
2. Convert paths from root to leaf nodes into TBL templates
3. Example: Path through POS(-1) → POS(1) → leaf A becomes template `POS(X, -1) & POS(X, 1)`

### Critical Insight: Error-Driven Template Generation
- Templates from ALL training data: Good at not breaking correct predictions, weak at error correction
- Templates from ERROR data only: Good at error correction, may cause wrong transformations
- **Best approach**: Combine both template sets (achieves 90.36% vs 89.38% or 88.31% alone)

## Key Equations

### Keyword Selection Measures

**Log-Likelihood Ratio** (best performer):
$$LogLikelihoodRatio(W) = P(W) \sum_i P(P_i) \left| \log \frac{P(P_i|W)}{P(P_i|\bar{W})} \right|$$

**Mutual Information**:
$$MutualInformation(W) = \sum_i P(P_i) \log \frac{P(W|P_i)}{P(W)}$$

**Information Gain**:
$$InformationGain(W) = P(W) \sum_i P(P_i|W) \log \frac{P(P_i|W)}{P(P_i)} + P(\bar{W}) \sum_i P(P_i|\bar{W}) \log \frac{P(P_i|\bar{W})}{P(P_i)}$$

**Cross Entropy**:
$$CrossEntropy(W) = P(W) \sum_i P(P_i|W) \log \frac{P(P_i|W)}{P(P_i)}$$

**Odds Ratio**:
$$OddsRatio(W) = P(W) \sum_i P(P_i) \left| \log \frac{P(W|P_i)(1-P(W|P_i))}{(1-P(W|P_i))P(W|P_i)} \right|$$

Where:
- $P(W)$ = probability word W occurs
- $P(P_i)$ = probability of i-th pronunciation
- $P(P_i|W)$ = conditional probability of pronunciation given word presence
- $P(W|P_i)$ = conditional probability of word given pronunciation

## Parameters

| Name | Value | Notes |
|------|-------|-------|
| Polyphones studied | 33 | Most ambiguous, frequently used |
| Training samples | ~5000 sentences/polyphone | From People's Daily |
| Train/Dev/Test split | 8:1:1 | Standard split |
| Keywords selected | 200/polyphone | Highest scoring by metric |
| POS categories | 39 | Chinese POS tagset |
| Semantic classes | 67 | From semantic dictionary |
| Character offset | ±2, ±1 | Context window |
| Word offset | ±2, ±1, 0 | Including target |

## Feature Set

| Feature Type | Offset Range | Value Range |
|--------------|--------------|-------------|
| Character | ±2, ±1 | - |
| Word | ±2, ±1, 0 | - |
| POS | ±2, ±1, 0 | 39 categories |
| Semantic class | ±2, ±1, 0 | 67 classes |
| Length of word | ±2, ±1, 0 | 1-8 |
| Keyword | Entire sentence | - |
| POS of keyword | Entire sentence | 39 categories |
| Semantic class of keyword | Entire sentence | 67 classes |
| Position in word | - | Beginning, middle, end, single |
| Position in sentence | - | Beginning, middle, end, single |

## Implementation Details

### TBL Template Format
```
POS(X, -1) & POS(X, 1)
```
- Feature name (e.g., POS)
- X = placeholder for feature value
- Number = offset from polyphone (-1 = preceding, +1 = following)

### Algorithm Steps
1. Train decision tree on training corpus
2. Extract all root-to-leaf paths
3. Convert each path into a TBL template
4. **Repeat** for error-only subset of training data
5. Combine template sets
6. Run standard TBL with combined templates

### Initial State Annotator
- Based on manual rules
- Achieves 80.66% baseline accuracy
- TBL rules correct errors from this baseline

## Results Summary

| Method | Average Precision |
|--------|-------------------|
| Initial (manual rules) | 80.66% |
| Mutual Information keywords | 81.66% |
| Information Gain keywords | 84.30% |
| Cross Entropy keywords | 84.84% |
| Odds Ratio keywords | 85.27% |
| **Log-Likelihood Ratio keywords** | **85.50%** |
| Decision Tree (no lexical features) | 87.82% |
| Decision Tree (with lexical features) | 85.30% |
| DT templates (all data) | 89.38% |
| DT templates (error data) | 88.31% |
| **DT templates (combined)** | **90.36%** |
| Manual templates | 90.60% |
| Manual + DT templates | 91.13% |

### Key Finding: Decision Tree + Lexical Features Hurts Performance
- DT without lexical features: 87.82%
- DT with lexical features: 85.30% (worse!)
- Cause: Data fragmentation problem in decision trees
- TBL doesn't recursively split data, so avoids this problem

## Limitations
- Evaluated only on Mandarin Chinese polyphones
- Requires pre-existing POS tagger and word segmenter
- Semantic dictionary lookup needed for semantic class features
- 200 keywords per polyphone may not generalize to other tasks

## Relevance to Project

### Direct Relevance: LOW
- Paper is specific to Mandarin Chinese polyphone disambiguation
- English homographs are different problem (heteronyms like "read", "lead", "wind")

### Transferable Concepts: MEDIUM
1. **Error-driven learning**: Generate rules from errors, not all data
2. **Template combination**: Rules from different data subsets complement each other
3. **Feature offset notation**: `FEATURE(value, offset)` is clean representation
4. **Log-likelihood ratio**: Simple, effective keyword/context selection metric
5. **TBL for G2P**: Ordered rule lists are interpretable and can incorporate manual rules

### Potential Application
For English heteronym disambiguation in TTS frontend:
- Could use similar feature set (POS, word position, keywords)
- TBL allows incorporating existing manual rules as initial state
- Decision tree template generation avoids manual rule writing

## Open Questions
- [ ] How does this compare to modern neural approaches (BERT, etc.)?
- [ ] Would the error-driven template insight transfer to English heteronyms?
- [ ] What is the computational cost at runtime vs. training?

## Related Work Worth Reading
- **Yarowsky (1997)** - "Homograph disambiguation in speech synthesis" - Log-likelihood approach for English
- **Brill (1995)** - "Transformation-based error-driven learning" - Original TBL paper
- **Zhang & Chu (2002)** - ESC-based stochastic decision lists for Chinese G2P

## Figures of Interest
- **Fig 1 (p.2):** TBL framework flowchart - shows initial state → rules → evaluation loop
- **Fig 2 (p.2):** Decision tree to template conversion - visual example of path extraction
- **Fig 3 (p.3):** Keywords from error data outperform all-data keywords by 2.43%
- **Fig 4 (p.3):** Combined templates beat either alone
- **Fig 5 (p.4):** DT templates nearly match manual templates
- **Fig 6 (p.4):** TTBL (90.36%) greatly exceeds decision tree (87.82%)
