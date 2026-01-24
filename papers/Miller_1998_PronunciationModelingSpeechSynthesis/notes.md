# Pronunciation Modeling in Speech Synthesis

**Author:** Corey Andrew Miller
**Year:** 1998
**Venue:** PhD Dissertation, University of Pennsylvania (Linguistics)
**Supervisor:** Mark Liberman
**Committee:** William Labov, Eugene Buckley, Mark Randolph (Motorola)

## One-Sentence Summary

This dissertation demonstrates that neural networks can learn postlexical phonological rules (flapping, deletion, glottalization, vowel reduction) directly from labeled speech data, achieving 98% acceptable pronunciations while revealing that allophonic variation is largely predictable from phonetic context alone.

## Problem Addressed

TTS systems typically use dictionary (lexical) pronunciations that sound canonical and "over-articulated." Real speech exhibits postlexical variation (flapping, deletion, reduction) that makes it natural but is speaker-dependent and context-dependent. This dissertation addresses the gap between dictionary forms and natural surface pronunciations by training neural networks to learn the lexical-to-postlexical mapping for an individual speaker.

## Dissertation Structure

| Chapter | Title | Pages | Content |
|---------|-------|-------|---------|
| 1 | Introduction | 1-49 | TTS architecture, lexical vs postlexical distinction, neural network approaches, computational phonology |
| 2 | Rationale for Modeling Postlexical Variation | 50-65 | Evaluation dimensions (intelligibility, comprehensibility, acceptability, naturalness), trade-offs |
| 3 | Data Sources | 66-96 | Lexorola lexical database, labeled speech corpus design, ToBI conventions |
| 4 | Experimental Approach | 97-138 | Acoustic neural network experiments on allophony ([schwa]/[barred-i], [u]/[barred-u], /a/-/open-o/) |
| 5 | Methods for Learning Postlexical Variation | 139-169 | Alignment algorithms, neural network architecture, feature encoding |
| 6 | Results | 170-209 | Network performance (87.8% exact, 98% acceptable), allophony analysis, function words, dialect |
| 7 | Conclusion | 210-215 | Summary, implications for TTS and speech recognition |
| Appendix | TIMIT/IPA Correspondences | 216 | Phone symbol mappings |
| References | Bibliography | 217-234 | ~300 citations |

## Key Contributions

1. **Neural network postlexical module**: Achieves 87.8% exact match, 98% acceptable rate for lexical-to-postlexical conversion
2. **Proof that allophonic variation is context-predictable**: Experiments show [u]/[barred-u], [schwa]/[barred-i], /a/-/open-o/ distinctions can be predicted from phonetic context alone
3. **Entropy-based analysis of pronunciation variability**: /t/ and schwa have highest entropy (hardest to predict); stridents have lowest
4. **Comprehensive /t/ allophony analysis**: Documents deletion, flapping, glottalization, aspiration contexts
5. **Feature-based alignment algorithm**: Dynamic programming with phonologically-informed substitution costs
6. **Lexorola database**: 200,000 pronunciations from CMU, Moby, Pronlex with POS/sense disambiguation

## Postlexical Phenomena Learned

The neural network successfully learned these transformations:

| Phenomenon | Lexical | Postlexical | Context |
|------------|---------|-------------|---------|
| Unreleased stops | fed | fed' | Word-final |
| Glottalized vowels | and | ?aend | Word-initial |
| Glottalized /t/ | straight | stre?t | Before sonorants |
| /d/ deletion | and follow | aen falo | Cluster-final |
| /t/ deletion | abrupt | abr^p' | Cluster-final |
| Flapping | dirty | da'ri | Intervocalic |
| Nasal flapping | corner | kor~a' | After nasal |
| /h/ voicing | in her | in fia' | Intervocalic |
| Schwa epenthesis | curls | ka'lz | After /r/ |
| /u/ fronting | dune | dun | Coronal context |
| Syllabic consonants | poodles | pudlz | Unstressed syllable |

## /t/ Allophony Rules (Critical for TTS)

/t/ has the highest entropy of any consonant - multiple realizations depending on context:

| Allophone | Context | Example |
|-----------|---------|---------|
| Deleted | Final in coda cluster | abrupt -> abr^p' |
| Flap [r] | Intervocalic V_V | better -> be'r |
| Glottal [?] | Before sonorants (n,m,r,l,w,j) | button -> b^?n |
| Unreleased [tc] | Before nonsonorants | cat sat -> kaet' saet |
| Aspirated [th] | Intonational phrase end | cat. -> kaet^h |

### t,d Deletion by Preceding Phone

Deletion favored after segments matching /t,d/ features [+coronal, -sonorant, -continuant]:

| Preceding | Match Features | Original % | Neural Net % |
|-----------|----------------|------------|--------------|
| n | [+cor,-cont] | 42% | 33% |
| p,b,k,g | [-son,-cont] | 22% | 33% |
| s,z,S,Z | [+cor,-son] | 8% | 4% |

## Vowel Fronting Rules

### /u/ Fronting ([u] vs [barred-u])

| Environment | Fronted [u] Prediction |
|-------------|----------------------|
| Coronals both sides | 86% accuracy |
| Preceding coronal only | 67% accuracy |
| Following coronal only | Lower |
| No coronals | Unfronted [barred-u] |

### Schwa Allophones ([i] vs [ax])

| Environment | Realization |
|-------------|-------------|
| Coronal on left AND right | [i] (high front) |
| Following [+coronal] alone | [i] |
| Preceding [+coronal] alone | Mixed |
| Non-coronal both sides | [ax] (mid central) |

**Note:** Syllable-final dark /l/ does NOT count as coronal for fronting purposes despite apical gesture.

## Function Word Reduction

### "the" Allomorphy
- Before consonants: [Da] (lax)
- Before vowels: [Di] (tense)
- Rule: /i/ -> [a] / __C

### "to" Reduction
- Before vowels: reduced half as often as unreduced
- Before consonants: reduced 2x more than unreduced

### "a" Reduction
- Phrase-initial: 75% NOT reduced
- Non-phrase-initial: typically reduced

## Neural Network Architecture

### Input Encoding (Window Size = 9 phones)

| Block | Content | Size |
|-------|---------|------|
| 2 | Lexical phone labels (1-of-n) | 46 x 9 = 414 |
| 3 | Phonological features | 53 x 9 = 477 |
| 4 | Stress/prominence | 4 x 9 = 36 |
| 5 | Boundary information | 14 x 9 = 126 |

### Phonological Features (53 binary features)
- Manner: vocalic, vowel, sonorant, obstruent, continuant, affricate, nasal, approximant
- Place: front, mid, back, high, low, bilabial, labiodental, dental, alveolar, palatal, velar, uvular
- Other: voiced, round, lateral, retroflex, tense, aspirated, etc.

### Stress/Prosodic Features (Block 4)
| Feature | Encoding |
|---------|----------|
| Syllable stress | 1=primary, 0.5=secondary, 0=unstressed |
| Word prominence | 0-14 scale (O'Shaughnessy 1976) |
| Word type | 0=function, 1=content |
| Pitch accent | Binary (H*, L*) |

### Boundary Features (Block 5, 14 binary)
- Left/right boundaries for: syllable, word, phrase, clause, sentence, intermediate phrase, intonational phrase

### Hidden Layers
- Blocks 6-9: 10 units each
- Block 10: 20 units
- Block 11: 117 units
- Output: 117 postlexical phones

### Performance by Window Size

| Window | Accuracy |
|--------|----------|
| 3 | 61.2% |
| 5 | 92.9% |
| 9 | 94.9% |

## Key Equations

### Entropy (Equation 5-1)
$$H(W) = -\sum_{w \in V(W)} P(w) \log_2 P(w)$$

Where:
- H(W) = entropy for lexical phone W
- V(W) = set of possible postlexical reflexes of W
- P(w) = probability of each reflex

**High entropy phones (hardest to predict):**
- /t/: ~2.5 bits (aspirated, unreleased, flap, glottal, deleted)
- Schwa: ~2.5 bits (deleted, [i], [^], [ax], various)
- /d/: ~2.0 bits

**Low entropy phones (predictable):**
- /s/, /m/, /w/, /j/: ~0 bits

### Ellipse Rotation (Equation 4-1)
$$\tan 2\theta = \frac{\text{covariance}(F1, F2)}{\text{variance}(F1) - \text{variance}(F2)}$$

For vowel space visualization.

### Euclidean Distance (Equation 4-2)
$$d = \left(\sum_j |u_j - x_j|^2\right)^{1/2}$$

For measuring acoustic fidelity between original and synthesized speech.

## Lexical-Postlexical Alignment

### Dynamic Programming Costs
| Operation | Cost |
|-----------|------|
| Insertion | 7 |
| Deletion | 7 |
| Default substitution | 10 |
| Phonologically similar | 0-5 (feature-based) |

### Pseudophones for Alignment
Stop closures and releases collapsed into single units to avoid many-to-one alignment issues:
- [tc th] -> single pseudophone
- [?] + vowel -> single pseudophone

## Evaluation Results

### Overall Performance
| Metric | Value |
|--------|-------|
| Exact match | 87.8% |
| Another allophone | 8.6% |
| Another allomorph | 1.4% |
| Dialect variant | 0.002% |
| **Total acceptable** | **98%** |
| Unacceptable errors | 2% |

### /t/ Allophony Performance

| Context | Correct/Total | Accuracy |
|---------|---------------|----------|
| Flapping (V_V) | 9/14 | 64% |
| Glottalization (before sonorants) | Variable by position | 33-50% |
| Deletion (coda cluster) | ~33% match | Context-dependent |

### Vowel Glottalization
- 21% glottalized in original speech
- 14% by neural network
- 72% accuracy among predicted glottalized vowels

## Error Analysis

### Error Types
| Category | Count | % of Errors |
|----------|-------|-------------|
| Allophonic | 225 | 8.6% |
| Destressing | 37 | 1.4% |
| Dialect | 7 | 0.002% |
| Unacceptable | ~52 | 2% |

### Common Allophonic Errors
- Schwa allophones ([i] vs [ax])
- Stop release timing
- Glottalization placement

### Weight Distribution Analysis
- Current phone (position 5): highest weight (~2500)
- Following phone: more weight than preceding (anticipatory > perseverative)
- Phone features > phone labels > boundaries > stress

## Lexorola Database

### Sources
1. Carnegie Mellon Pronouncing Dictionary (Weide 1995)
2. Moby Pronunciator II (Ward 1996)
3. COMLEX Pronlex (LDC 1995)

### Statistics
- ~200,000 pronunciations
- 1,000+ require POS disambiguation
- 200+ require sense disambiguation

### Design Principles
- Phonemic (not allophonic) - postlexical module handles allophony
- "Generalized American" dialect
- Preserves minority distinctions that can derive merged dialects (e.g., which/witch)

## Labeled Speech Corpus

### Speaker
- University-educated male from Chicago
- Age 36-38 during recording
- Exhibits /u/ fronting (sound change in progress)

### Corpus Statistics
- 7,088 total words
- 90% training / 10% testing
- Narrow phonetic labeling (TIMIT-style)

### Labeling Tiers
1. Phonetic
2. Words
3. Syllables (stress marked)
4. Phrase
5. Clause
6. Sentence
7. Tones (ToBI: H*, L*, etc.)
8. Breaks (1-4 scale)

## Dialect Phenomena

### Documented Variations
| Feature | Status |
|---------|--------|
| /M/-/w/ (which/witch) | Merger standard in most American English |
| marry/Mary/merry | Distinct only in Eastern US |
| caught/cot | Increasingly merged |
| Stem-final tensing | Active (be-, pre-, re- prefixes) |

### Stem-Final Tensing
Underlying /I/ -> [i] in:
- Word-final position (city)
- Before inflection (cities)
- Stem-final in compounds (city hall)
- Prefix environments (be-, pre-, re-)

## Figures Summary

| Figure | Page | Description |
|--------|------|-------------|
| 1-1 | 8 | Motorola TTS architecture diagram |
| 1-2 | 12 | Training scheme for postlexical/duration/acoustic modules |
| 3-1 | 72 | Lexorola relational database structure |
| 3-1 | 91 | Speech labeling scheme with annotation tiers |
| 4-1 | 105 | Acoustic neural network architecture |
| 5-1 | 158 | Entropy of lexical phones (bar chart) |
| 5-2 | 158 | Number of postlexical reflexes per phone |
| 5-1 | 160 | Postlexical neural network architecture |
| 6-1 | 170 | TDNN window weights by position |
| 6-2 | 171 | Weight distribution by input type |
| 6-1 | 191 | Distribution of syllable-final /t/ allophones |

## Tables Summary

| Table | Page | Description |
|-------|------|-------------|
| 1-1 | 18 | Speech recognition error rates (WSJ vs Switchboard) |
| 1-2 | 24 | Factors affecting phone realization |
| 3-1 | 82 | Phone sets across dictionaries |
| 3-2 | 87 | Postlexical phones in corpus |
| 4-1 | 98 | Phonemicity/allophony conditions |
| 5-1 | 155-157 | Postlexical reflexes of each lexical phone |
| 5-1 | 163-164 | 53 phonological features |
| 6-1 | 175 | Summary of network performance |
| 6-1 | 193 | t,d deletion by preceding phone |
| A-1 | 216 | TIMIT/IPA correspondences |

## Limitations Acknowledged

1. **Single speaker**: All results based on one Chicago male; generalization uncertain
2. **Read speech**: Corpus is read speech, not spontaneous
3. **Inter-transcriber reliability**: Only 55-80% agreement on phonetic labels
4. **Dialect coverage**: "Generalized American" may not match any real speaker
5. **Long-distance dependencies**: Window of 9 may miss some prosodic effects
6. **Glottalization accuracy**: Phrase-final glottalization poorly predicted (0% at intonational phrase ends)

## Relevance to Qlatt Project

### Directly Applicable

**G2P rules applicable:** YES
- The dissertation validates that phonemic dictionaries work when paired with postlexical processing
- Feature-based phone encoding (53 features) could improve G2P generalization

**Stress rules applicable:** YES
- O'Shaughnessy (1976) prominence scale (0-14) documented
- Stress encoding: 1=primary, 0.5=secondary, 0=unstressed

**Allophony rules applicable:** YES - implement these:
1. /t/ deletion in coda clusters
2. /t/ flapping in V_V context
3. /t/ glottalization before sonorants
4. /u/ fronting near coronals
5. Schwa -> [i] in coronal environments
6. Function word reduction rules for "the", "to", "a"

### Implementation Recommendations

1. **Add postlexical processing stage** after phoneme generation but before acoustic synthesis
2. **Use prosodic context** (phrase boundaries, prominence) for allophone selection
3. **Prioritize /t/ and schwa** - these have highest entropy and most impact on naturalness
4. **Consider anticipatory effects** - following context more predictive than preceding
5. **Window size of 9** (4 phones each direction) captures most relevant context

### Not Directly Applicable

- Neural network training approach requires speaker-specific labeled corpus
- Duration module and acoustic module are specific to concatenative/vocoder synthesis

## Important Citations to Follow

### For G2P
- Sejnowski & Rosenberg 1987 - NETtalk
- Riley 1991 - Statistical pronunciation networks
- Torkkola 1993 - Automatic G2P rule learning

### For Prosody
- O'Shaughnessy 1976 - F0 modeling, prominence scale
- Pierrehumbert 1980 - ToBI intonation model
- Nespor & Vogel 1986 - Prosodic phonology

### For Allophony
- Pierrehumbert & Frisch 1997 - Glottalization
- Sproat & Fujimura 1993 - /l/ allophones
- Guy & Boberg 1997 - t,d deletion

### For Evaluation
- Pisoni & Hunnicutt 1980 - MITalk evaluation
- Nusbaum et al. 1995 - Naturalness measurement

### Key Books
- Allen, Hunnicutt & Klatt 1987 - MITalk system (synthesis by rule)
- Wells 1982 - Accents of English
- Dutoit 1997 - TTS synthesis introduction

## Open Questions

- [ ] How does the 98% acceptable rate compare to modern TTS systems?
- [ ] Would the allophony rules generalize to other American English speakers?
- [ ] Is window size of 9 sufficient for capturing all relevant prosodic effects?
- [ ] How to handle glottalization at intonational phrase boundaries (0% accuracy in dissertation)?
- [ ] What is the optimal feature set for minimal TTS implementation?
- [ ] Should reduced vowel target be [i] (Veatch 1991) or schwa?

## TIMIT Symbol Mappings (for reference)

| TIMIT | IPA | Description |
|-------|-----|-------------|
| ax | schwa | Mid central |
| ix | barred-i | High central |
| uw | u | High back round |
| ux | barred-u | High central round |
| aa | a | Low back |
| ao | open-o | Low-mid back round |
| ae | ae-ligature | Low front |
| ah | wedge | Mid-low central |
| iy | i | High front |
| ow | o | Mid back round |
| th | theta | Voiceless dental fricative |
| dh | eth | Voiced dental fricative |
| ch | tS | Voiceless postalveolar affricate |
| jh | dZ | Voiced postalveolar affricate |
| sh | S | Voiceless postalveolar fricative |
