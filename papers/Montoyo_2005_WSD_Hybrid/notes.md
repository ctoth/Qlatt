# Combining Knowledge- and Corpus-based Word-Sense-Disambiguation Methods

**Authors:** Andres Montoyo, Armando Suarez, German Rigau, Manuel Palomar
**Year:** 2005
**Venue:** Journal of Artificial Intelligence Research (JAIR), Volume 23, pages 299-330
**DOI/URL:** Submitted 07/04; published 03/05

## One-Sentence Summary

This paper demonstrates that combining knowledge-based (WordNet taxonomy) and corpus-based (Maximum Entropy) WSD methods improves disambiguation accuracy beyond either method alone, providing techniques applicable to TTS lexicon disambiguation and homograph resolution.

## Problem Addressed

Word sense disambiguation (WSD) is a central problem for NLP applications including TTS systems. State-of-the-art accuracy at the time was only 60-70%. The paper addresses the question of whether combining fundamentally different WSD approaches (knowledge-based and corpus-based) can yield improved results compared to using either approach in isolation.

## Key Contributions

- Specification Marks (SM) method: A knowledge-based WSD algorithm using WordNet taxonomy
- Maximum Entropy (ME) method: A corpus-based supervised learning approach with novel "collapsed" features
- Three hybrid combination schemes demonstrating complementary strengths
- Empirical validation on Senseval-2 Spanish and English lexical-sample tasks
- Evidence that combining approaches yields ~79.8% upper-bound potential accuracy (vs. ~64% individual)

## Methodology

### Approach

Two complementary WSD methods are presented and combined:

1. **Specification Marks (SM)**: Knowledge-based method using WordNet's IS-A taxonomy to find the most specific common concept subsuming context words
2. **Maximum Entropy (ME)**: Corpus-based supervised learning using feature vectors from annotated corpora

### Specification Marks Algorithm

**Step 1:** Extract all nouns from context:
$$Context = \{w_1, w_2, ..., w_n\}$$

**Step 2:** For each noun $w_i$, obtain all possible senses $S_i = \{S_{i1}, S_{i2}, ..., S_{in}\}$ from WordNet. For each sense, obtain and store the hypernym chain.

**Step 3:** For each sense in the stacks, associate the list of subsumed senses from the context.

**Step 4:** Beginning from the Initial Specification Mark (ISM - top synsets), descend recursively through the hierarchy, assigning to each specification mark the count of context words subsumed.

**Step 5:** Select the word sense with the greatest word count. If tied, descend further in the taxonomy until a single sense is obtained or a leaf is reached.

### SM Heuristics

Five supplementary heuristics when SM alone fails:

1. **Hypernym/Hyponym Heuristic**: Check hypernym/hyponym chains for compound matches with context words. Weight by depth:
$$weight(sense) = \sum_{i=1}^{depth} \frac{level}{total\_levels}$$

2. **Definition Heuristic**: Check glosses for context word matches; count coincidences

3. **Gloss Hypernym/Hyponym Heuristic**: Extends hypernym heuristic using glosses of hypernym/hyponym synsets

4. **Common Specification Mark Heuristic**: Select specification mark common to all context word senses (partial disambiguation)

5. **Domain WSD Heuristic**: Uses "Relevant Domains" resource combining WordNet glosses with WordNet Domains

### Domain Heuristic - Association Ratio

$$AR(w|D) = P(w|D) \cdot \log \frac{P(w|D)}{P(w)}$$

Where:
- $w$ = word
- $D$ = domain
- $P(w|D)$ = probability of word given domain
- $P(w)$ = overall probability of word

Context vectors (CV) and sense vectors (SV) are built from relevant domains, then compared using cosine similarity.

### Maximum Entropy Method

The classification function selects the class with highest conditional probability:
$$cl(x) = \arg\max_c p(c|x)$$

**Feature function (non-collapsed):**
$$f(x, c) = \begin{cases} 1 & \text{if } c' = c \text{ and } cp(x) = true \\ 0 & \text{otherwise} \end{cases}$$

**Conditional probability:**
$$p(c|x) = \frac{1}{Z(x)} \prod_{i=1}^{K} \alpha_i^{f_i(x,c)}$$

Where:
- $\alpha_i$ = parameter/weight of feature $i$
- $K$ = number of features
- $Z(x)$ = normalization factor ensuring $\sum_c p(c|x) = 1$

**Collapsed feature function:**
$$W_{(c')} = \{data\ of\ sense\ c'\}$$
$$f_{(c',i)}(x, c) = \begin{cases} 1 & \text{if } c' = c \text{ and } CP(x) \in W_{(c')} \\ 0 & \text{otherwise} \end{cases}$$

## Key Equations

### Association Ratio (Domain Relevance)
$$AR(w|D) = P(w|D) \cdot \log \frac{P(w|D)}{P(w)}$$

### Maximum Entropy Conditional Probability
$$p(c|x) = \frac{1}{Z(x)} \prod_{i=1}^{K} \alpha_i^{f_i(x,c)}$$

### Hypernym Weight Calculation
$$weight(sense) = \sum_{i=1}^{depth} \frac{level_i}{total\_levels}$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Context window | - | nouns | 15 | - | 7 nouns before and after target |
| Keyword threshold | m | % | 3-10 | 3-10 | Min % occurrence for keyword features |
| Feature positions | - | words | ±3 | ±1 to ±3 | Local context window |
| Collocation positions | - | pairs | (-2,-1),(-1,+1),(+1,+2) | - | Bigram positions |

## Implementation Details

### Data Structures
- **Hypernym stacks**: Store hypernym chain for each sense of each word
- **Specification mark tree**: Track word counts at each taxonomy level
- **Feature vectors**: Binary or collapsed representations of context features

### ME Feature Types (Figure 9)
- **0**: Word form of target word
- **s**: Words at positions ±1, ±2, ±3
- **p**: POS-tags at positions ±1, ±2, ±3
- **b**: Lemmas of collocations at (-2,-1), (-1,+1), (+1,+2)
- **c**: Collocations at same positions
- **km**: Lemmas of nouns occurring ≥m% with a sense
- **r**: Grammatical relation to ambiguous word
- **d**: Word that ambiguous word depends on
- **m**: Multi-word if identified by parser
- **L, W, S, B, C, P, D, M**: Collapsed versions

### Initialization
- ME classifiers trained per word using annotated corpus
- 3-fold cross-validation for feature selection
- Generalized Iterative Scaling for parameter estimation

### Computational Complexity
- SM: O(n × s × h) where n=context size, s=senses, h=hierarchy depth
- ME: Training depends on corpus size and feature count; inference is fast

## Figures of Interest

- **Figure 1:** Specification Marks illustration showing how "plant" is disambiguated with context {tree, perennial, leaf}
- **Figure 2:** Data structure showing subsumed senses for each specification mark level
- **Figure 3:** Word counts demonstrating disambiguation process for "plant"
- **Figure 8:** Domain WSD heuristic example with context/sense vectors for "genotype"
- **Figure 9:** Complete feature set definition for ME system

## Results Summary

### Knowledge-Based (SM) Results on SemCor
| Method | Recall |
|--------|--------|
| SM + Voting Heuristics | 0.391 |
| SM with Cascade Heuristics | 0.311 |
| Lesk | 0.274 |
| Conceptual Density | 0.220 |

### Maximum Entropy Results on Senseval-2 Spanish
| POS | Accuracy | Best Features |
|-----|----------|---------------|
| Nouns | 0.683 | LWSBCk5 |
| Verbs | 0.595 | sk5 |
| Adjectives | 0.783 | LWsBCp |
| ALL | 0.671 | 0LWSBCk5 |

### Combined System (vME+SM) on Senseval-2 Spanish
- ALL: 0.684 (2nd place, tied with JHU(R) for nouns at 0.702)
- Nouns: 0.702

### Complementarity Analysis (Spanish Nouns)
| Condition | Contexts | Percentage |
|-----------|----------|------------|
| Both OK | 240 | 30.0% |
| One OK | 398 | 49.8% |
| Zero OK | 161 | 20.2% |

Upper bound precision: 0.798 (combining both methods optimally)

## Limitations

- SM only works with nouns (WordNet noun taxonomy)
- State-of-the-art still far below most-frequent-sense baseline
- ME performance highly dependent on training data size
- Verbs are difficult to learn (lower accuracy than nouns/adjectives)
- Domain heuristic classification as "knowledge-based" vs "corpus-based" is debatable
- Feature selection process is computationally expensive (exhaustive search)

## Relevance to TTS Systems

### Homograph Resolution
- Direct application: disambiguating heteronyms (e.g., "read" /rid/ vs /rɛd/, "bow" /boʊ/ vs /baʊ/)
- Context-based sense selection maps to pronunciation selection
- ME features (POS, collocations) directly applicable

### G2P Enhancement
- WSD can inform grapheme-to-phoneme conversion for ambiguous words
- Domain information could help with technical/domain-specific pronunciations

### Prosody Generation
- Word sense affects prosodic phrasing and emphasis
- Different senses may warrant different intonation patterns

### Lexicon Design
- Knowledge-based (WordNet) structure useful for organizing pronunciation variants
- Corpus-based features identify disambiguating context patterns

### Practical Considerations
- ME method provides confidence scores (probabilities) for sense selection
- Voting systems offer robustness when individual methods fail
- Feature selection per POS type (nouns, verbs, adjectives) improves accuracy

## Open Questions

- [ ] How would modern contextual embeddings (BERT, etc.) compare to these 2005 methods?
- [ ] Can the domain heuristic be adapted for TTS-specific domains (e.g., news, conversational)?
- [ ] What is the minimum training data needed for acceptable ME performance on TTS-relevant words?
- [ ] How to handle out-of-vocabulary words not in WordNet?
- [ ] Can the specification marks approach be extended to verbs and adjectives?

## Related Work Worth Reading

- Miller, G.A. (1995). WordNet: A lexical database for English
- Agirre & Rigau (1996). Word Sense Disambiguation using Conceptual Density
- Berger et al. (1996). A maximum entropy approach to natural language processing
- Magnini & Strapparava (2000). WordNet Domains
- Ng & Lee (1996). Integrating multiple knowledge sources to disambiguate word senses
- Ratnaparkhi (1998). Maximum Entropy Models for Natural Language Ambiguity Resolution
- Yarowsky (1994). Decision lists for lexical ambiguity resolution
