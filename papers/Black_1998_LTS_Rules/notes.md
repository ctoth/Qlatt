# Issues in Building General Letter to Sound Rules

**Authors:** Alan W Black, Kevin Lenzo, Vincent Pagel
**Year:** 1998
**Venue:** The Third ESCA/COCOSDA Workshop (ETRW) on Speech Synthesis, Jenolan Caves House, Blue Mountains, NSW, Australia
**DOI/URL:** ISCA Archive (http://www.isca-speech.org/archive)

## One-Sentence Summary

This paper presents a general framework for building letter-to-sound (LTS) rules from pronunciation lexicons using CART decision trees, achieving 75% word accuracy for British English and enabling TTS systems to pronounce out-of-vocabulary words.

## Problem Addressed

TTS systems need to pronounce words not found in their lexicon. Since lexicons are finite but input text is open-ended, a principled method for predicting pronunciation from orthography is essential. This paper addresses how to automatically build such LTS rule systems from existing pronunciation dictionaries.

## Key Contributions

- A general framework for building LTS rules from word lists in any language
- Two letter-phone alignment methods: hand-seeded and automatic (epsilon scattering)
- CART decision tree-based phone prediction achieving state-of-the-art results
- Analysis showing joint phone+stress prediction outperforms separate models
- Real-world evaluation on out-of-vocabulary words from news text
- Discovery that optimal model complexity differs for lexicon test sets vs. real unknown words
- Open-source implementation in Festival Speech Synthesis System

## Methodology

### Approach

The method consists of three stages:
1. **Alignment**: Create letter-to-phone alignments for training data
2. **Training**: Build CART decision trees to predict phones from letter context
3. **Prediction**: Apply trees to new words to generate pronunciations

### Letter-Phone Alignment

Two alignment methods are presented:

#### Hand-Seeded Method (Recommended)
1. Manually create an "allowables" table listing which phones each letter can produce
2. Find all possible alignments between letters and phones for each word
3. Score alignments using probability table P(phone|letter)
4. Select highest-scoring alignment
5. Re-estimate probabilities and iterate

Example allowables for letter "c":
```
epsilon, k, ch, s, sh, t-s
```

#### Epsilon Scattering Method (Automatic)
Uses Expectation-Maximization (EM) algorithm:

```
Algorithm:
/* initialize prob(L,P) */
1 foreach word in training_set
    count with DTW all possible L/P
    association for all possible epsilon
    positions in the phonetic transcription

/* EM loop */
2 foreach word in training_set
    compute new_p(L,P) on alignment_path
3 if (prob != new_p) goto 2
```

Converges in ~5 iterations on CMU lexicon.

### CART Tree Building

For each letter in the alphabet:
1. Extract all aligned examples from training data
2. Train a CART decision tree using letter context (3 letters on each side) as features
3. Tree predicts: epsilon, single phone, or double phone

## Key Equations

No explicit mathematical equations are provided, but the core probabilistic model is:

$$
P(\text{alignment}) = \prod_{i} P(phone_i | letter_i)
$$

Where alignment probabilities are estimated from corpus counts and used to select optimal alignments via dynamic time warping (DTW).

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Stop value | - | count | 1-5 | 1-8 | Minimum examples before tree split; lower = deeper trees |
| Context window | - | letters | 3 | - | Letters on each side for prediction |
| Train/test split | - | ratio | 9:1 | - | Every 10th word held out |
| Min word length | - | letters | 4 | - | Short words excluded from training |

### Stop Value vs Performance (OALD)

| Stop | Letters Correct | Words Correct | Model Size |
|------|-----------------|---------------|------------|
| 8 | 92.89% | 59.63% | 9,884 |
| 6 | 93.41% | 61.65% | 12,782 |
| 5 | 93.70% | 63.15% | 14,968 |
| 4 | 94.06% | 65.17% | 17,948 |
| 3 | 94.36% | 67.19% | 22,912 |
| 2 | 94.86% | 69.36% | 30,368 |
| 1 | 95.80% | 74.56% | 39,500 |

## Implementation Details

### Data Structures Needed
- **Allowables table**: Map from letter -> list of possible phones (including epsilon and multi-phones)
- **Alignment corpus**: Words with letter-phone pairs aligned
- **CART trees**: One tree per letter (26 for English) or single combined tree
- **Phone inventory**: Including stressed/unstressed vowel variants for joint prediction

### Initialization Procedures
1. Build allowables table (manual or automatic)
2. Align entire lexicon
3. Remove words < 4 letters
4. Remove function words (if POS available)
5. Split 90/10 train/test
6. Train per-letter CART trees

### Edge Cases
- Words that fail alignment (<1%): abbreviations, foreign words, lexicon errors
- Examples: "dept" -> /d ih p aa r t m ah n t/, "lieutenant" (British), "Lvov"
- Multi-phone mappings: "x" -> /k s/, "o" -> /w uh/ (as in "one")

### Computational Complexity
- Alignment: O(n * m) per word where n=letters, m=phones (DTW)
- CART building: O(N log N) per letter where N=examples
- Prediction: O(w * d) per word where w=letters, d=tree depth

## Figures of Interest

No numbered figures in paper, but key tables:

- **Alignment comparison table**: Hand-seeded (93.97% letters, 78.13% words) vs epsilon scattering (90.69% letters, 63.97% words) on OALD
- **Cross-language results table**: Shows method generalizes across languages
- **Stop value table**: Critical for understanding model complexity tradeoffs
- **Unknown word analysis**: 76.6% names, 19.8% true unknowns, 3.2% spelling variants

## Results Summary

### Lexicon Test Results (Held-Out Data)

| Lexicon | Letters Correct | Words Correct |
|---------|-----------------|---------------|
| OALD (British English) | 95.80% | 74.56% |
| CMUDICT (US English) | 91.99% | 57.80% |
| BRULEX (French) | 99.00% | 93.03% |
| DE-CELEX (German) | 98.79% | 89.38% |

### Stress Prediction Comparison

| Metric | Separate Model (LTP+S) | Joint Model (LTPS) |
|--------|------------------------|---------------------|
| Letters (no stress) | 96.36% | 96.27% |
| Letters (with stress) | - | 95.80% |
| Words (no stress) | 76.92% | 74.69% |
| Words (with stress) | 63.68% | **74.56%** |

**Key finding**: Joint phone+stress prediction significantly outperforms separate models for complete word accuracy.

### Real Unknown Words (WSJ)

- 4.6% of words not in OALD lexicon
- Best model for unknown words: stop=5 (70.65% acceptable)
- Best model for lexicon test: stop=1 (74.56% correct)
- **Critical insight**: Optimal model complexity differs between test scenarios

| Stop | Lexicon Test | Unknown Words | Size |
|------|--------------|---------------|------|
| 1 | 74.56% | 62.14% | 39,500 |
| 4 | 65.17% | 67.66% | 17,948 |
| 5 | 63.15% | **70.65%** | 14,968 |
| 6 | 61.65% | 67.49% | 12,782 |

### Unknown Word Categories

| Category | Occurrences | % |
|----------|-------------|---|
| Names | 1,360 | 76.6% |
| Unknown common words | 351 | 19.8% |
| American spelling | 57 | 3.2% |
| Typos | 7 | 0.4% |

## Limitations

- **Hand-seeding required**: Best alignment requires manual allowables table creation
- **Stress prediction**: Local context insufficient for cases like "photograph" vs "photography"
- **Foreign names**: Non-Anglo-Saxon names remain difficult
- **No morphological analysis**: Morpheme boundaries not considered
- **CMUDICT performance**: Lower accuracy (57.8%) due to many foreign words/names
- **Over-training risk**: Best lexicon model is over-trained for real unknown words

## Relevance to TTS Systems

### Direct Applications

1. **G2P Module**: Core algorithm for grapheme-to-phoneme conversion in any TTS frontend
2. **Lexicon Compression**: Can remove "regular" words from lexicon, using LTS rules as fallback
3. **Multi-language Support**: Framework works across languages with different orthographic complexity
4. **Unknown Word Handling**: Essential for robust TTS on arbitrary input text

### Integration Considerations

- **POS tagging helps**: Including part-of-speech improves accuracy (95.32% -> 95.80% letters)
- **Model size tradeoff**: Smaller models (stop=5) generalize better to real unknowns
- **Stress integration**: Use joint phone+stress model, not separate post-processing
- **Festival integration**: Implementation available in Festival TTS system

### Relevance to Qlatt

For the JavaScript Klatt synthesizer:
- The G2P component could use CART-based LTS rules
- Need to consider whether to use pre-built rules or train custom models
- Joint stress prediction important for prosody generation
- Consider model size vs. accuracy tradeoff for browser deployment

## Open Questions

- [ ] How to handle morphological decomposition for stress prediction?
- [ ] Can language/origin detection improve name pronunciation?
- [ ] What is the optimal stop value for a specific deployment scenario?
- [ ] How do neural approaches compare to CART trees for this task?
- [ ] How to handle multi-word expressions and compounds?

## Related Work Worth Reading

- **Daelemans & van den Bosch (1996)**: Language-independent G2P conversion - alternative approach
- **van den Bosch et al. (1998)**: Modularity in pronunciation systems - shows joint modeling benefits
- **Luk & Damper (1996)**: Stochastic phonographic transduction - alternative statistical method
- **Pagel, Lenzo & Black (1998)**: LTS rules for lexicon compression - companion paper
- **Breiman et al. (1984)**: CART book - foundational decision tree reference

## Implementation Resources

- **Festival TTS**: http://www.cstr.ed.ac.uk/projects/festival.html (includes full LTS implementation)
- **PERL implementation**: http://www.cs.cmu.edu/~lenzo/t2p
- **CMU Pronouncing Dictionary**: http://www.speech.cs.cmu.edu/cgi-bin/cmudict
- **OALD**: Oxford Text Archive (British English lexicon used in paper)
