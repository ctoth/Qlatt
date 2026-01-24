# Fast, Not Fancy: Rethinking G2P with Rich Data and Rule-Based Models

**Authors:** Mahta Fetrat Qharabagh, Zahra Dehghanian, Hamid R. Rabiee
**Year:** 2025
**Venue:** arXiv preprint (arXiv:2505.12973v1)
**DOI/URL:** https://arxiv.org/abs/2505.12973

## One-Sentence Summary
This paper demonstrates that rich, balanced homograph datasets can dramatically improve both neural and rule-based G2P systems, achieving ~30% improvement in homograph disambiguation while maintaining real-time performance for accessibility applications.

## Problem Addressed
Two interconnected challenges in G2P conversion for low-resource languages:
1. **Data scarcity**: Creating balanced, comprehensive homograph datasets is labor-intensive and costly
2. **Latency constraints**: Neural disambiguation methods are too slow for real-time applications like screen readers

The paper specifically targets Persian, where existing G2P systems perform worse than random chance on homograph disambiguation.

## Key Contributions
- Semi-automated pipeline for constructing rich, balanced homograph datasets using LLMs
- **HomoRich dataset**: 528,891 annotated Persian sentences covering 285 homographs (CC0-1.0 license)
- **Homo-GE2PE**: Neural G2P model with 29.72% improvement in homograph accuracy
- **HomoFast eSpeak**: Rule-based G2P with 30.66% improvement in homograph accuracy while maintaining real-time speed
- Lightweight statistical disambiguation method that works without neural networks or embeddings

## Methodology

### Dataset Construction Pipeline
1. Start with comprehensive G2P dictionary (KaamelDict with 120,000+ entries)
2. Filter words with multiple valid pronunciations
3. Manual review to exclude:
   - Words with commonly accepted multiple pronunciations
   - Archaic, poetic, or rarely used forms
4. Generate diverse, balanced sentences for each homograph pronunciation
5. Use LLM (GPT-4o) for phonemization with "Finglish" intermediate representation

### Sentence Generation Approach
- **Hybrid method**: Combine human-written and LLM-generated sentences
- ~200 native speakers wrote 5 contextually varied sentences per pronunciation
- Human examples used as few-shot prompts to guide LLM generation
- Key insight: Embedding homograph in a full sentence that implies intended meaning significantly improved LLM accuracy over explicit pronunciation instructions

### Data Augmentation Methods
1. **Synonym Replacement**: Replace frequent words with synonyms to generate new samples
2. **Sentence Reordering**: Split sentences at random words and swap segments (preserving Ezafe constructions using POS tagger)
3. **Homograph-focused Concatenation**: Append random short sentences to homograph samples

Can scale dataset up to 10x depending on augmentation configuration.

### Statistical Homograph Disambiguation (for Rule-Based Systems)

#### Algorithm
1. Tokenize sentences in dataset, remove stopwords
2. Build database mapping homograph pronunciations to co-occurring context words
3. For new sentence:
   - Compute weighted overlap between context words and each pronunciation's context list
   - Normalize scores by context list length (mitigate bias toward longer lists)
   - Select pronunciation with highest normalized score

This is purely statistical - no neural networks, no embeddings.

### Neural Model Training (Homo-GE2PE)
Three-phase fine-tuning of T5:
1. Initial fine-tuning on regular G2P subset (5 epochs)
2. Fine-tuning on LLM-generated homograph sentences (20 epochs)
3. Final fine-tuning on human-authored homograph sentences (50 epochs)

Hyperparameters: learning rate 5e-4, batch size 32

## Key Equations

No explicit equations provided, but the statistical disambiguation can be formalized as:

$$
\text{score}(p) = \frac{\sum_{w \in \text{context}} \mathbf{1}[w \in C_p]}{|C_p|}
$$

Where:
- $p$ = pronunciation variant
- $C_p$ = context word list for pronunciation $p$
- $\text{context}$ = context words in input sentence
- $\mathbf{1}[\cdot]$ = indicator function

$$
\hat{p} = \arg\max_p \text{score}(p)
$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Learning rate | lr | - | 5e-4 | - | Used across all training phases |
| Batch size | - | samples | 32 | - | Used across all training phases |
| Phase 1 epochs | - | - | 5 | - | Regular G2P data |
| Phase 2 epochs | - | - | 20 | - | LLM homograph sentences |
| Phase 3 epochs | - | - | 50 | - | Human homograph sentences |

## Implementation Details

### Data Structures
- **HomoRich Dataset Structure**:
  - `source`: Origin (human, GPT-4o, CommonVoice, ManaTTS, GPTInformal)
  - `source_index`: Unique identifier within source
  - `grapheme`: Input text sentence
  - `homograph_grapheme`: The homograph word (if applicable)
  - `phoneme`: Full phoneme sequence
  - `homograph_phoneme`: Pronunciation of homograph
  - `alternative_phoneme`: Alternative representation format
  - `alternative_homograph_phoneme`: Alternative homograph representation

### Dataset Statistics
- Total sentences: 528,891
- Homograph samples: 327,475
- Unique words: 75,715
- Homographs covered: 285
  - 257 with 2 variants
  - 21 with 3 variants
  - 7 with 4 variants
- Average appearances per homograph: >1,000 distinct contexts

### Data Sources Distribution
| Source | Count |
|--------|-------|
| GPT-4o | 257,915 |
| CommonVoice | 118,983 |
| ManaTTS | 76,561 |
| Human | 69,560 |
| GPTInformal | 5,872 |

### Computational Requirements
- Hardware: NVIDIA GTX TITAN X (12GB VRAM), Intel i7-5820K CPU
- Training time: ~24 hours total for all phases

### Phoneme Representation
Two formats provided for compatibility:
- Primary format used in KaamelDict and related studies
- Alternative format used by GE2PE model
- Special handling for Ezafe phoneme (linking /e/ in Persian noun phrases)

## Figures of Interest
- **Fig 1**: Prompt template for generating homograph sentences - shows system/user prompt structure
- **Fig 2**: LLM-powered G2P workflow - dictionary lookup, Finglish intermediate representation, LLM processing, phoneme mapping
- **Fig 3**: Dataset structure with example entry
- **Fig 6**: Data augmentation methods (synonym replacement, reordering, concatenation)
- **Fig 8**: Statistical homograph disambiguation overview - shows context word matching
- **Fig 9**: Speed vs accuracy plot - HomoFast eSpeak achieves 0.0084s inference with 74.53% homograph accuracy

## Results Summary

### Performance Comparison (SentenceBench)

| Model | PER (%) | Homograph Acc (%) | Inference Time (s) |
|-------|---------|-------------------|-------------------|
| eSpeak (baseline) | 6.92 | 43.87 | 0.0169 |
| GE2PE (baseline) | 4.81 | 47.17 | 0.4464 |
| **HomoFast eSpeak** | 6.33 | **74.53** | **0.0084** |
| **Homo-GE2PE** | **3.98** | **76.89** | 0.4473 |
| Homo-T5 | 4.12 | 76.32 | 0.4141 |

Key findings:
- HomoFast eSpeak: 30.66% improvement in homograph accuracy, actually faster than baseline
- Homo-GE2PE: 29.72% improvement in homograph accuracy with slight PER reduction
- GPT-4o phonemization achieves 6.43% PER and 64% homograph accuracy

### Speed Analysis
- eSpeak/HomoFast eSpeak: ~0.01-0.02s (suitable for real-time)
- Neural models (GE2PE, Homo-GE2PE): ~0.4-0.5s (not suitable for screen readers)
- Orders of magnitude difference makes rule-based essential for accessibility

## Limitations
- Homograph disambiguation is not the only context-dependent challenge in Persian
- **Ezafe handling**: Correct phonemization of the linking phoneme connecting words grammatically remains a major weakness in rule-based systems
- The statistical method requires pre-built context databases for each homograph
- Dataset is Persian-specific, though methodology is language-agnostic

## Relevance to TTS Systems

### Direct Applications
1. **G2P Conversion**: Both neural and rule-based approaches directly applicable
2. **Homograph Disambiguation**: Critical for natural-sounding TTS output
3. **Real-time TTS**: HomoFast approach enables accessibility applications

### Key Insights for Implementation
- **Data quality over quantity**: 528K well-curated sentences outperform 5M synthetic sentences
- **Hybrid data generation**: Combining human examples with LLM generation is effective
- **Statistical methods viable**: Simple context-word matching achieves comparable results to neural approaches
- **Phased training**: Progressive fine-tuning (general -> LLM homographs -> human homographs) improves results

### Applicability Beyond Persian
The methodology is language-agnostic:
1. Start with comprehensive pronunciation dictionary
2. Identify homographs through multi-pronunciation filtering
3. Generate balanced sentence corpus (human + LLM)
4. Build context-word database for statistical disambiguation

### For English TTS
English has significant homograph challenges:
- "read" (/ri:d/ vs /rEd/)
- "lead" (/li:d/ vs /lEd/)
- "wind" (/wInd/ vs /waInd/)
- "bass" (/beIs/ vs /b&s/)
- "bow" (/boU/ vs /baU/)

The statistical disambiguation approach could be directly applied to English homographs.

## Open Questions
- [ ] How does the statistical method scale with number of homographs? (285 in this study)
- [ ] What is the minimum context database size needed for reliable disambiguation?
- [ ] Can the approach handle homographs with more than 4 pronunciations?
- [ ] How does performance degrade on out-of-domain text (e.g., technical, poetic)?
- [ ] Could the statistical method be combined with embeddings for better generalization?
- [ ] How to handle sentences with multiple homographs (current limitation: only target homograph annotated)?

## Related Work Worth Reading
- **Yarowsky (1997)**: Data-driven decision lists using log-likelihood-ranked contextual patterns for English homograph disambiguation
- **Gorman et al. (2018)**: Wikipedia Homograph Data, hybrid rule-ML system for English
- **Ploujnikov (2024)**: SoundChoice - sentence-level G2P with BERT embeddings, curriculum learning
- **Rezackova et al. (2024a,b)**: T5 transformer for multilingual G2P
- **Nicolis and Klimkov (2021)**: BERT/ALBERT contextual embeddings for homograph disambiguation
- **Qharabagh et al. (2025a)**: LLM-powered G2P conversion (prior work by same authors)

## Resources
- **HomoRich Dataset**: https://huggingface.co/datasets/MahtaFetrat/HomoRich-G2P-Persian
- **Homo-GE2PE Model**: https://github.com/MahtaFetrat/Homo-GE2PE-Persian
- **HomoFast eSpeak**: https://github.com/MahtaFetrat/HomoFast-eSpeak-Persian
- **Benchmark Code**: https://github.com/MahtaFetrat/Persian-G2P-Tools-Benchmark
- **SentenceBench**: https://huggingface.co/datasets/MahtaFetrat/SentenceBench
