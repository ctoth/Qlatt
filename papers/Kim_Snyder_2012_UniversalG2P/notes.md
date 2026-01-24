# Universal Grapheme-to-Phoneme Prediction Over Latin Alphabets

**Authors:** Young-Bum Kim and Benjamin Snyder
**Year:** 2012
**Venue:** EMNLP 2012 (Conference on Empirical Methods in Natural Language Processing)
**Institution:** University of Wisconsin-Madison

## One-Sentence Summary

A cross-lingual machine learning approach that predicts grapheme-to-phoneme mappings for unknown Latin-alphabet languages by learning phonotactic patterns from 107 training languages, achieving 88% F1.

## Problem Addressed

- Pronunciation dictionaries and transcribed audio are unavailable for most of the world's languages
- Existing G2P methods assume knowledge of the target language (pronunciation dictionary or phonemically annotated text)
- Need automatic methods to determine sound-symbol relationships for resource-poor languages
- Challenge: Same grapheme can represent very different phonemes across languages (e.g., "c" → /k/, /s/, /tʃ/, /ts/, clicks)

## Key Contributions

1. Novel task formulation: Predict grapheme-phoneme mappings for *unknown* languages using only unannotated text
2. Dataset of 107 Latin-alphabet languages with grapheme-phoneme mappings + short texts (UDHR translations)
3. Undirected graphical model that learns cross-lingual phonotactic regularities
4. Key insight: Abstract "phonemic context features" (mapping graphemes to IPA equivalents) dramatically outperform raw character context features

## Methodology

### Task Framing
- **Input:** Unannotated text in unknown language + optional family/region info
- **Output:** Set of valid (grapheme, phoneme) pairs for that language
- Cast as binary classification: For each (g:p) pair, predict whether grapheme g can represent phoneme p
- Uses leave-one-out cross-validation (train on 106 languages, test on 1)

### Model Architecture
- **Undirected graphical model** (similar to CRF)
- Nodes = grapheme-phoneme pairs (75 nodes total for 17 ambiguous graphemes)
- Binary node labels: 1 if (g:p) mapping exists in language, 0 otherwise
- Sparse edges (~50 of 2,775 possible) learned via PC structure learning algorithm
- Joint prediction ensures linguistically coherent inventories

### Key Equation

Log-linear probability over node and edge factors:

$$
\log P(y^{(\ell)}|x^{(\ell)}) = \sum_i \lambda_i \cdot [f_i(x^{(\ell)}) \delta(y_i^{(\ell)} = 1)] + \sum_{j,k} \lambda_{jk1} \cdot [g_{jk}(x^{(\ell)}) \delta(y_j^{(\ell)} = 1 \land y_k^{(\ell)} = 1)] + \sum_{j,k} \lambda_{jk2} \cdot [g_{jk}(x^{(\ell)}) \delta(y_j^{(\ell)} = 1 \land y_k^{(\ell)} = 0)] + \sum_{j,k} \lambda_{jk3} \cdot [g_{jk}(x^{(\ell)}) \delta(y_j^{(\ell)} = 0 \land y_k^{(\ell)} = 1)] - \log Z(x^{(\ell)}, \lambda)
$$

Where:
- $y^{(\ell)}$ = binary labeling of graph nodes for language $\ell$
- $x^{(\ell)}$ = text of language $\ell$
- $f_i(x)$ = node features
- $g_{jk}(x)$ = edge features
- $\delta(p)$ = 1 if predicate p true, else 0
- $Z$ = normalization constant

### Training
- L2-penalized conditional log-likelihood maximization
- Gradient = difference between expected and observed feature counts
- Loopy belief propagation for inference
- L-BFGS for optimization
- L2 penalty: 0.5 for node features, 0.1 for edge features

## Parameters

| Name | Value | Notes |
|------|-------|-------|
| Languages | 107 | Latin-alphabet languages from omniglot.com, WALS, UDHR |
| Ambiguous graphemes | 17 | Selected by entropy > 0.5, appearing in 15+ languages |
| Graph nodes | 75 | One per (grapheme, phoneme) pair |
| Potential edges | 2,775 | Fully connected |
| Learned edges | ~50 | After PC structure learning |
| Raw features | 57,488 | Before filtering |
| Filtered features | 9,679 | After discretization/filtering |

## Feature Engineering (Critical Section)

### Three Feature Types

1. **Text Context Features** (poor alone)
   - Counts of graphemes to left/right of target grapheme
   - 5 templates: L1, R1, L2, R2, surrounding pairs
   - Too language-specific for cross-lingual generalization

2. **Phonemic Context Features** (most powerful)
   - Key insight: Most Latin graphemes' most common phoneme = their IPA symbol
   - Convert surrounding graphemes to IPA equivalents ("noisy IPA conversion")
   - Extract articulatory properties: voiced/unvoiced, manner, place, consonant/vowel
   - Example: L1:k=15, L1:b=3, L1:g=7 → L1:velar=22, L1:bilabial=3, L1:voiced=10
   - Captures phonotactic context abstractly

3. **Language Family Features** (surprisingly unhelpful)
   - Region (Europe, Africa, etc.)
   - Small family (Germanic, etc.)
   - Large family (Indo-European, etc.)
   - Removing these actually *improves* performance!

### Feature Preprocessing
- Recursive Minimal Entropy Partitioning (Fayyad & Irani 1993) for discretization
- Features that can't achieve single split point are discarded
- Pairwise conjunctions added after filtering

## Ambiguous Grapheme Table (Table 1)

| Grapheme | Phonemes | #Languages | Entropy |
|----------|----------|------------|---------|
| a | /a/ /e/ /ɑ/ /ə/ /ʌ/ | 106 | 1.25 |
| c | /c/ /dʒ/ /k/ /s/ /ts/ /tʃ/ /\|/ | 62 | 2.33 |
| ch | /k/ /tʃ/ /x/ /ʃ/ | 39 | 1.35 |
| e | /e/ /i/ /æ/ /ə/ /ɛ/ | 106 | 1.82 |
| h | /-/ /h/ /x/ /ø/ /ɦ/ | 85 | 1.24 |
| i | /i/ /j/ /ɪ/ | 106 | 0.92 |
| j | /dʒ/ /h/ /j/ /tʃ/ /x/ /ʝ/ /ʒ/ | 79 | 2.05 |
| o | /o/ /u/ /ɔ/ /ɤ/ | 103 | 1.47 |
| ph | /f/ /pʰ/ | 15 | 0.64 |
| q | /k/ /q/ /!/ | 32 | 1.04 |
| r | /r/ /ɾ/ /ʀ/ /ɹ/ /ʁ/ | 95 | 1.50 |
| th | /tʰ/ /θ/ | 15 | 0.64 |
| u | /u/ /w/ /y/ /ɨ/ /ʊ/ /ʏ/ | 104 | 0.96 |
| v | /b/ /f/ /v/ /w/ /β/ | 70 | 1.18 |
| w | /u/ /v/ /w/ | 74 | 0.89 |
| x | /ks/ /x/ /ǁ/ /ʃ/ | 44 | 1.31 |
| z | /dz/ /s/ /ts/ /z/ /θ/ | 72 | 0.93 |

## Results Summary (Table 3)

| Method | Precision | Recall | F1 | Grapheme Acc | Language Acc |
|--------|-----------|--------|-----|--------------|--------------|
| Majority | 80.47 | 57.47 | 67.06 | 55.54 | 2.8% |
| SVM (continuous) | 79.87 | 64.48 | 79.87 | 59.07 | 3.74% |
| SVM (discrete) | 90.55 | 78.27 | 83.97 | 70.78 | 8.41% |
| Nearest Neighbor | 85.35 | 79.43 | 82.28 | 67.97 | 2.8% |
| Model: No Edges | 89.35 | 82.05 | 85.54 | 73.96 | 10.28% |
| **Full Model** | **91.06** | **83.98** | **87.37** | **78.58** | **21.5%** |
| Model: No Family | 92.43 | 84.67 | 88.38 | 80.04 | 19.63% |
| Model: No Text | 89.58 | 81.43 | 85.31 | 75.86 | 15.89% |
| Model: No Phonetic | 86.52 | 74.19 | 79.88 | 69.6 | 9.35% |

### Key Findings
- Graph structure doubles language-level accuracy (10% → 21%)
- Phonemic context features are essential (removing them drops F1 by 8 points)
- Language family features are *redundant* - removing them slightly improves results
- Discrete features >> continuous features

## Feature Economy Analysis (Table 4)

| Measure | True | Predicted |
|---------|------|-----------|
| H(voice) | 0.9739 | 0.9733 |
| H(place) | 2.7355 | 2.6715 |
| H(manner) | 2.4725 | 2.4163 |
| Economy Index | 1.6536 | 1.6337 |

- Predictions have slightly lower feature economy than true inventories
- Suggests incorporating feature economy as constraint could improve predictions

## Limitations

1. Does not disambiguate which phoneme applies to a particular word context (only predicts inventory)
2. Predictions don't fully achieve "feature economy" observed in true phoneme inventories
3. Limited to Latin alphabets
4. Requires ~100+ training languages for effective cross-lingual transfer
5. "Noisy IPA conversion" heuristic (grapheme → same-symbol phoneme) may not hold for all graphemes

## Relevance to Project

### Direct Relevance: LOW-MEDIUM
- Qlatt uses rule-based English G2P, not ML-based cross-lingual prediction
- This paper is about *inventory* prediction, not word-level pronunciation

### Useful Concepts
1. **Phonotactic features matter**: Surrounding phoneme context (voiced/unvoiced, manner, place) is predictive
2. **Feature abstraction**: Raw character features don't generalize; phonetic features do
3. **Joint prediction**: Graphical models ensure coherent outputs (relevant if adding phoneme inventory constraints)

### Not Directly Applicable
- Qlatt already knows English phoneme inventory
- Qlatt needs word-level G2P, not inventory-level
- Training data requirement (107 languages) not practical for improving English TTS

## Open Questions

- [ ] Could phonotactic context features improve Qlatt's rule-based G2P by adding probabilistic disambiguation?
- [ ] Would feature economy constraints help validate G2P rule outputs?
- [ ] How does this compare to modern neural G2P approaches (transformers, etc.)?

## Related Work Worth Reading

1. **Jiampojamarn & Kondrak 2010** - Letter-phoneme alignment methods
2. **Dwyer & Kondrak 2009** - Minimizing training examples for G2P
3. **Reddy & Goldsmith 2010** - MDL approach to subword units for G2P
4. **Ravi & Knight 2009** - Decipherment approach to transliteration
5. **Kenstowicz & Kisseberth 1979** - *Generative Phonology* (phonotactic theory)
6. **Clements 2003** - Feature economy in sound systems

## Data Sources (Reproducibility)

- Grapheme-phoneme mappings: http://www.omniglot.com/writing/langalph.htm#latin
- Texts: Universal Declaration of Human Rights (UDHR) translations
- Language metadata: World Atlas of Language Structures (WALS)
