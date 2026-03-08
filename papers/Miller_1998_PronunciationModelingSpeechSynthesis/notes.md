# Pronunciation Modeling in Speech Synthesis

**Authors:** Corey Andrew Miller
**Year:** 1998
**Venue:** PhD Dissertation, University of Pennsylvania (Linguistics)
**Supervisor:** Mark Liberman
**Committee:** William Labov, Eugene Buckley, Mark Randolph (Motorola)
**DOI/URL:** UPenn dissertations archive

## One-Sentence Summary

This dissertation demonstrates that neural networks can learn postlexical phonological rules (flapping, deletion, glottalization, vowel reduction) directly from labeled speech data, achieving 98% acceptable pronunciations while revealing that allophonic variation is largely predictable from phonetic context alone — providing the empirical foundation for which postlexical rules matter most for natural-sounding TTS.

## Problem Addressed

TTS systems typically use dictionary (lexical) pronunciations that sound canonical and "over-articulated." Real speech exhibits postlexical variation (flapping, deletion, reduction) that makes it natural but is speaker-dependent and context-dependent. This dissertation addresses the gap between dictionary forms and natural surface pronunciations by training neural networks to learn the lexical-to-postlexical mapping for an individual speaker, quantifying exactly which phenomena have the most impact.

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
4. **Comprehensive /t/ allophony analysis**: Documents deletion, flapping, glottalization, aspiration contexts with quantified rates
5. **Feature-based alignment algorithm**: Dynamic programming with phonologically-informed substitution costs
6. **Lexorola database**: 200,000 pronunciations from CMU, Moby, Pronlex with POS/sense disambiguation
7. **Trade-off between naturalness and intelligibility**: Postlexical variation improves naturalness but may reduce intelligibility in synthetic speech

## TTS Pipeline Architecture (Motorola "MotorMouth")

The dissertation is situated within a production TTS system using neural networks throughout:

1. **Text Analyzer** — text preprocessing (numbers to words, punctuation, HTML)
   - Tokenizes text into word-sized units
   - Looks up words in lexical database
   - POS disambiguation module for homographs
2. **Letter-to-Sound Conversion** — handles unknown words not in dictionary
3. **Postlexical Module** — transforms lexical pronunciations to contextual surface forms (THIS DISSERTATION)
   - Handles flapping, t/d deletion, insertions, substitutions
4. **Duration Module** — assigns phone durations using neural network
5. **Acoustic Module** — transforms phonological representation to spectral parameters (vocoder)

For each new voice, retrain modules 3-5 only. This accounts for:
- Dictionary transcription conventions
- Speech database labeling conventions
- Speaker's personal habits

## Evaluation Framework for Synthetic Speech (Ch. 2)

Four distinct evaluation dimensions (pp. 50-62):

| Dimension | Measures | Key Finding |
|-----------|----------|-------------|
| **Intelligibility** | MRT, DRT, transcription task | Segmental-level identification; larger vowel spaces → more intelligible (Bradlow et al. 1996) |
| **Comprehensibility** | Recall, recognition, word monitoring | Synthetic speech forces listeners to allocate more processing resources to acoustic-phonetic level |
| **Acceptability** | 1-7 preference scale | Motorola synth: better acceptability but worse intelligibility than competitors |
| **Naturalness** | Single-vowel discrimination, prosody tests | Even single glottal pulses distinguishable as natural vs. synthetic |

**Critical tension**: Reduced/postlexical forms sound more natural but may reduce intelligibility:
- Portele (1997): German schwa deletion — phoneticians preferred reduced forms, naive listeners preferred unreduced
- Sorin (1991): French mute *e* — elided forms reduced word identification but sounded more natural
- "Synthetic speech is perceived differently from natural speech; in the latter, canonical realizations are hardly tolerated, while synthetic speech must sound thoroughly precise" (Portele 1997)

## Phonological Theory Context

### Categorical vs. Gradient Phenomena (pp. 30-35)

Two types of postlexical rules (Kiparsky 1985):
1. **Gradient phonetic outputs** — coarticulation, vowel reduction
2. **Categorical phonological outputs** — assimilation, deletion

Example: Lexical /ʃ/ (as in "mesh") has categorical properties; postlexical /ʃ/ (as in "miss you") shows gradient progression between /s/ and /ʃ/ (Zsiga 1995).

### Prosodic Hierarchy (Nespor & Vogel 1986)

Bottom to top: syllable → foot → phonological word → clitic group → phonological phrase → intonational phrase → phonological utterance

### Postlexical Rule Types (Kaisse 1985)

- **P1 rules**: Categorical, apply in smaller prosodic domains (clitic groups, phonological phrases)
- **P2 rules**: Gradient, apply in larger prosodic domains (intonation phrases, utterances)

### Intrinsic vs. Extrinsic Allophones (Randolph 1989)

- **Extrinsic**: Alternations from structural context (syllable position) — aspirated/glottalized/flapped /t/, light/dark /l/
- **Intrinsic**: Alternations from "inherent mechanical constraints on articulatory mechanism"

## Factors Affecting Phone Realization

From Fulop and Keating (1996) study of Switchboard corpus (Table 1-2, p. 24):

| Factor | Phone Class | Phones Affected |
|--------|------------|-----------------|
| Preceding/following phoneme | Vowels | ae, ^, E, e, I, o, b, f |
| Syllable structure position | Resonants | l, n, r |
| Position within word/syllable | Plosives | d, k, t |
| No major context effects | Stridents, labials | m, s, v, w, z |

### Context Sensitivity Classes

Implementation should treat these differently:
- **Context-sensitive**: vowels (ae, ^, E, e, I, o), voiced stops (b), fricatives (f)
- **Position-sensitive**: resonants (l, n, r), plosives (d, k, t)
- **Context-insensitive**: stridents (s, z), labials (m, v, w) — essentially predictable

### Canon Faithfulness by Phone (p. 25, Figure 1-3)

Percentage of tokens matching canonical dictionary pronunciation:
- Stridents (/s/, /z/): ~95-100% (almost always canonical)
- Stops (/p/, /b/, /k/): ~40-60%
- /h/: ~30%
- Schwa: ~16% (most variable)

### Speaking Rate

From Byrd (1994) TIMIT study:
- Men: 4.69 syllables/second
- Women: 4.42 syllables/second (p < .0001)
- Women exhibited more conservative postlexical behavior: released sentence-final stops more often, produced fewer flaps

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

Plus dialect/labeling idiosyncrasies: marry/merry/Mary merger, schwa deletion/metathesis, laxing before /r/, wh voicing.

## Postlexical Reflexes Frequency Data (Table 5-1, pp. 155-157)

The most variable phones — critical for understanding which rules fire most often:

### /t/ reflexes (highest entropy consonant, ~2.5 bits)
| Realization | Count | Description |
|-------------|-------|-------------|
| [tc th] | 566 | Aspirated stop (closure + release) |
| [tc] | 273 | Unreleased (closure only) |
| [tc t] | 214 | Unaspirated release |
| [?] | 170 | Glottal stop |
| [th] | 134 | Release only (aspirated) |
| deleted | 62 | Complete deletion |
| [dx] (flap) | 45 | Intervocalic flap |

### Schwa reflexes (highest entropy vowel, ~2.5 bits)
| Realization | Count | Description |
|-------------|-------|-------------|
| deleted | 622 | Complete deletion |
| [i] | 453 | High front (barred-i) |
| [^] | 354 | Wedge |
| [ax] | 337 | Mid central schwa |
| various others | ~200+ | Multiple minor variants |

### /a/ reflexes
| Realization | Count |
|-------------|-------|
| [a] | 405 |
| [?a] (glottalized) | 17 |
| deleted | 7 |

## /t/ Allophony Rules (Critical for TTS)

/t/ has the highest entropy of any consonant — multiple realizations depending on context:

| Allophone | Context | Example |
|-----------|---------|---------|
| Deleted | Final in coda cluster | abrupt → abr^p' |
| Flap [dx] | Intervocalic V_V | better → be'dx |
| Glottal [?] | Before sonorants (n,m,r,l,w,j) | button → b^?n |
| Unreleased [tc] | Before nonsonorants | cat sat → kaet' saet |
| Aspirated [th] | Intonational phrase end | cat. → kaet^h |

### t,d Deletion by Preceding Phone

Deletion favored after segments matching /t,d/ features [+coronal, -sonorant, -continuant]. The OCP (Obligatory Contour Principle) predicts deletion when adjacent segments are featurally similar (Guy & Boberg 1997):

| Preceding | Match Features | Original % | Neural Net % |
|-----------|----------------|------------|--------------|
| n | [+cor,-cont] | 42% | 33% |
| p,b,k,g | [-son,-cont] | 22% | 33% |
| s,z,S,Z | [+cor,-son] | 8% | 4% |

Important: "The concept of t,d 'deletion' is somewhat of an abstraction. It is likely that a more precise analysis might find remnants of the /t/ or /d/ gesture in the remaining consonant" (p. 192). Cf. Browman & Goldstein 1990 on gestural remnants.

### Flapping Performance

Neural network: 9 correct applications, 3 incorrect, 2 failures.
Failures in cross-word environments: "that heavy", "brought out" — suggesting cross-word context is harder.

### /t/ Glottalization by Prosodic Position

| Position | N | Original glottalized | Neural net glottalized | Accuracy |
|----------|---|---------------------|----------------------|----------|
| Non-phrase-final | 13 | 9 | 10 | 46% |
| End of intermediate phrase | 2 | 1 | 2 | 50% |
| End of intonational phrase | 10 | 4 | 6 | **0%** |

Glottalization also varies by accentuation:
- Accented syllables: 33% neural net accuracy vs. 25% unaccented

**Key finding**: Glottalization is poorly predicted at intonational phrase boundaries (0% accuracy). "In a faithful TTS implementation of the glottalization rule, the phonological structure will have to be parsed up to the intonation phrase, and the rule will have to have access to both the immediate segmental context and the prosodic strength of the surrounding syllables." (Pierrehumbert & Frisch 1997)

## Vowel Fronting Rules

### /u/ Fronting ([u] vs [barred-u])

| Environment | Fronted [u] Prediction |
|-------------|----------------------|
| Coronals both sides | 86% accuracy |
| Preceding coronal only | 67% accuracy |
| Following coronal only | Lower |
| No coronals | Unfronted [barred-u] |

Word class effects: **iw** words (reflexes of French *u* or Middle English diphthongs: *few*, *dew*) front more than **uw** words (*boot*, *do*). The phonemic distinctiveness of **iw** was lost when the conditioning /j/ glide was deleted after apicals.

### Schwa Allophones ([i] vs [ax])

| Environment | Realization |
|-------------|-------------|
| Coronal on left AND right | [i] (high front) |
| Following [+coronal] alone | [i] |
| Preceding [+coronal] alone | Mixed |
| Non-coronal both sides | [ax] (mid central) |

**Note:** Syllable-final dark /l/ does NOT count as coronal for fronting purposes despite apical gesture. /j/ patterns with coronals (Clements 1976, Zsiga 1995). Vowel reduction target is high central [i] (Veatch 1991), not mid central schwa.

Neural network achieves 67-83% accuracy on schwa allophone prediction by coronal environment.

### Allophonic Distinction Experiments (Ch. 4)

Three allophone pairs tested with collapsed vs. separate labels in acoustic neural network:

| Pair | Complementary distribution? | Collapsed condition result |
|------|---------------------------|---------------------------|
| [schwa]/[barred-i] | Partial | Two clusters preserved (context-predictable) |
| [u]/[barred-u] | Partial | [barred-u] cloud contained within [u] (reduced contrast) |
| /a/-/open-o/ | Partial (skewed environments) | Two clusters preserved |
| /o/-/i/ (control) | No (contrastive) | Catastrophic mixing |

**Main conclusion**: "Perhaps the most interesting outcome of the acoustic investigations of allophony described here is that the allophone distributions in F1/F2 space remained distinct for [u]/[barred-u], [schwa]/[barred-i] and /a/ / /open-o/ despite the removal of the individual allophone labels and features in the collapsed condition. This indicates that the allophony in those cases is predictable from context alone." (p. 135)

F2 (front-back) is more robust than F1 (high-low) for distinguishing schwa allophones. Euclidean distance measurements confirm collapsed conditions degrade acoustic fidelity vs. separate-label conditions.

## Vowel Glottalization (Word-Initial)

- 21% glottalized in original speech
- 14% by neural network
- 72% accuracy among vowels predicted as glottalized
- Accented syllables more likely glottalized (48% vs 45%)
- Prosodic boundaries important: 21% at start of intermediate phrases, 14% at intonational phrases

## Function Word Reduction

### "the" Allomorphy
- Before consonants: [Da] (lax)
- Before vowels: [Di] (tense)
- Rule: /i/ → [a] / __C
- Neural network learned this distinction well from lexical /Di/

### "to" Reduction
- Before vowels: reduced half as often as unreduced
- Before consonants: reduced 2x more than unreduced

### "a" Reduction
- Phrase-initial: 75% NOT reduced
- Non-phrase-initial: typically reduced

### Theoretical Framework
- Function words have "strong" and "weak" forms (Selkirk 1984)
- Weak forms involve stresslessness, possible vowel/consonant deletion
- Principle of Categorial Invisibility of Function Words (PCI)
- Many function word alternations are allomorphy (word-specific processes), not general rules

## Neural Network Architecture

### Input Encoding (Window Size = 9 phones)

| Block | Content | Size |
|-------|---------|------|
| 2 | Lexical phone labels (1-of-n) | 46 × 9 = 414 |
| 3 | Phonological features | 53 × 9 = 477 |
| 4 | Stress/prominence | 4 × 9 = 36 |
| 5 | Boundary information | 14 × 9 = 126 |
| **Total input** | | **1053** |

### Phonological Features (53 binary features, Table 5-1 pp. 163-164)
- **Manner**: vocalic, vowel, sonorant, obstruent, continuant, affricate, nasal, approximant
- **Vowel position**: front, mid, back, high, low
- **Place**: bilabial, labiodental, dental, alveolar, palatal, velar, uvular
- **Other**: voiced, round, lateral, retroflex, tense, aspirated, etc.

### Stress/Prosodic Features (Block 4)

| Feature | Encoding |
|---------|----------|
| Syllable stress | 1=primary, 0.5=secondary, 0=unstressed |
| Word prominence | 0-14 scale (O'Shaughnessy 1976) |
| Word type | 0=function, 1=content |
| Pitch accent | Binary (H*, L*) |

### Boundary Features (Block 5, 14 binary)
Left/right boundaries for: syllable, word, phrase, clause, sentence, intermediate phrase, intonational phrase

### Hidden Layers
- Blocks 6-9: 10 units each
- Block 10: 20 units
- Block 11: 117 units
- Output: 117 postlexical phones (1-of-n)

### Performance by Window Size

| Window | Accuracy |
|--------|----------|
| 3 | 61.2% |
| 5 | 92.9% |
| 9 | 94.9% |

### Weight Distribution Analysis
- Current phone (position 5): highest weight (~2500)
- Following phone: more weight than preceding (anticipatory > perseverative)
- Feature importance: phone features (~800) > phone labels (~750) > boundaries (~350) > stress (~250)

## Key Equations

### Entropy (Equation 5-1)
$$H(W) = -\sum_{w \in V(W)} P(w) \log_2 P(w)$$

Where:
- $H(W)$ = entropy for lexical phone W
- $V(W)$ = set of possible postlexical reflexes of W
- $P(w)$ = probability of each reflex

**High entropy phones (hardest to predict):**
- /t/: ~2.5 bits (aspirated, unreleased, flap, glottal, deleted)
- Schwa: ~2.5 bits (deleted, [i], [^], [ax], various) — schwa has most reflexes (~22)
- /d/: ~2.0 bits

**Low entropy phones (predictable):**
- /s/, /m/, /w/, /j/: ~0 bits

Note: Number of reflexes ≠ entropy. Distribution matters: schwa has most reflexes but similar entropy to /t/.

### Ellipse Rotation (Equation 4-1)
$$\tan 2\theta = \frac{\text{covariance}(F1, F2)}{\text{variance}(F1) - \text{variance}(F2)}$$

For drawing ellipses around vowel distributions. Center = mean F1, F2; axes = 2 SD.

### Euclidean Distance (Equation 4-2)
$$d = \left(\sum_j |u_j - x_j|^2\right)^{1/2}$$

For measuring acoustic fidelity between original and synthesized speech.

## Parameters

| Name | Value | Units | Notes |
|------|-------|-------|-------|
| DP insertion cost | 7 | — | Young et al. 1995 |
| DP deletion cost | 7 | — | |
| DP default substitution | 10 | — | |
| DP similar phone substitution | 0-5 | — | Feature-based |
| Training/test split | 90/10 | % | |
| Acoustic NN frame rate | 5 | ms | Vocoder output |
| TDNN context window | 415 | ms | 30 non-uniformly sampled frames |
| Window size (postlexical) | 9 | phones | 4 left + current + 4 right |
| Output phone classes | 117 | — | |
| Phonological features | 53 | binary | Per phone |
| Boundary features | 14 | binary | Per phone |
| Stress/prominence features | 4 | — | Per phone |
| Male speaking rate | 4.69 | syl/s | Byrd 1994 |
| Female speaking rate | 4.42 | syl/s | Byrd 1994 |
| Corpus size | 7,088 | words | |
| Lexicon size | ~200,000 | entries | |

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
- [tc th] → single pseudophone
- [?] + vowel → single pseudophone
- Adapted from Sejnowski and Rosenberg (1987)

### Algorithm
1. Create pseudophones by collapsing related postlexical phones (stop closures + releases)
2. Build cost table for substitutions based on phonological similarity
3. Use dynamic programming with costs: insertion=7, deletion=7, substitution=10 (default)
4. Align lexical and postlexical strings to create training pairs
5. Insert placeholders where deletion occurred (e.g., /d/ → null)
6. Store in relational database with contextual information (24 fields)

## Evaluation Results

### Overall Performance
| Metric | Value |
|--------|-------|
| Exact match | 87.8% |
| Another allophone | 8.6% (225 cases) |
| Another allomorph | 1.4% (37 cases) |
| Dialect variant | 0.002% (7 cases) |
| **Total acceptable** | **98%** |
| Unacceptable errors | 2% (~52 cases) |

### Common Allophonic Errors
- Schwa allophones ([i] vs [ax])
- Stop release timing
- Glottalization placement

### Lexical Representation Impact on Speech Recognition (Table 7-1, p. 213)
| Representation | Accuracy |
|----------------|----------|
| Single phonemic | 93.4% |
| Single phonetic | 94.1% |
| Multiple phonetic with likelihoods | 96.3% |

## Lexorola Database

### Sources
1. Carnegie Mellon Pronouncing Dictionary (Weide 1995)
2. Moby Pronunciator II (Ward 1996)
3. COMLEX Pronlex (LDC 1995) — highest quality

### Statistics
- ~200,000 pronunciations
- 1,000+ require POS disambiguation
- 200+ require sense disambiguation
- Relational architecture: 4 tables (Variants, Orthography, Pronunciation, Properties)

### Design Principles
- Phonemic (not allophonic) — postlexical module handles allophony
- "Generalized American" dialect (distinct from "General American" — Wells 1982)
- Preserves minority distinctions that can derive merged dialects (e.g., which/witch /M/ vs /w/)
- Simplified phone set compared to source dictionaries
- Collapses syllabic nasals to schwa + nasal consonant

## Labeled Speech Corpus

### Speaker
- University-educated male from Chicago
- Age 36-38 during recording
- Exhibits /u/ fronting (sound change in progress)

### Corpus Statistics
- 7,088 total words
- 90% training / 10% testing
- Narrow phonetic labeling (TIMIT-style, CSLU guidelines)

### Labeling Tiers (8 tiers)
1. Phonetic
2. Words
3. Syllables (stress marked)
4. Phrase
5. Clause
6. Sentence
7. Tones (ToBI: H*, L*, etc.)
8. Breaks (1-4 scale for disjuncture)

### Phonemicity/Allophony Decision Framework (Table 4-1)

Four approaches for handling allophony in TTS:

| Condition | Dictionary | Corpus | Who handles allophony? | Assessment |
|-----------|-----------|--------|----------------------|------------|
| 1 | Phonemic | Phonemic | Acoustic NN | Minimal variation |
| 2 | Phonemic | Allophonic | Postlexical NN | **PREFERRED** |
| 3 | Allophonic | Allophonic | Neither (problematic for cross-word) | Poor |
| 4 | Allophonic | Phonemic | Unsatisfactory | Poor |

## Dialect Phenomena

### Documented Variations
| Feature | Status |
|---------|--------|
| /M/-/w/ (which/witch) | Merger standard in most American English |
| marry/Mary/merry | Distinct only in Eastern US |
| caught/cot | Increasingly merged |
| Stem-final tensing | Active (be-, pre-, re- prefixes) |

### Stem-Final Tensing
Underlying /I/ → [i] in:
- Word-final position (city)
- Before inflection (cities)
- Stem-final in compounds (city hall)
- Prefix environments (be-, pre-, re-)

### Central Vowel Distribution in TIMIT (Byrd 1994)
- 55% [i] (barred-i)
- 18% [^] (wedge)
- 27% [schwa]
- NYC and West prefer [i], North Midland prefers [schwa]

## Figures Summary

| Figure | Page | Description |
|--------|------|-------------|
| 1-1 | 8 | Motorola TTS architecture diagram — full pipeline from Text through modules to Speech |
| 1-2 | 12 | Training scheme for postlexical/duration/acoustic modules from labeled speech database |
| 1-3 | 25 | Percentage of tokens matching canonical pronunciation — bar chart showing schwa ~16%, /h/ ~30%, stops 40-60%, stridents ~95-100% |
| 3-1 | 72 | Lexorola relational database structure (4 tables) |
| 3-1 | 91 | Speech labeling scheme with 8 annotation tiers |
| 4-1 | 105 | Acoustic neural network architecture |
| 4-1 | 114 | [schwa]/[barred-i] F1/F2 distributions — overlapping but distinct |
| 4-1 | 120 | [u]/[barred-u] distributions — non-overlapping, contiguous |
| 4-1 | 125 | /a/-/open-o/ distributions — overlap, /open-o/ higher and backer |
| 4-1 | 131 | /o/-/i/ distributions — completely separate (control) |
| 5-1 | 158 | Entropy of lexical phones (bar chart) |
| 5-2 | 158 | Number of postlexical reflexes per phone |
| 5-1 | 160 | Postlexical neural network architecture |
| 6-1 | 170 | TDNN window weights by position |
| 6-2 | 171 | Weight distribution by input type |
| 6-1 | 183 | Schwa allophones by coronal environment |
| 6-2 | 188 | /u/ allophones by coronal environment |
| 6-1 | 191 | Distribution of syllable-final /t/ allophones |
| 6-2 | 197 | /t/ allophones at intermediate phrase ends |
| 6-3 | 198 | /t/ allophones at intonational phrase ends |
| 6-1 | 201 | "the" allomorphy — lax vs tense before consonants/vowels |

## Tables Summary

| Table | Page | Description |
|-------|------|-------------|
| 1-1 | 18 | Speech recognition error rates (WSJ 1%/12% vs Switchboard 4%/66% — human/machine) |
| 1-2 | 24 | Factors affecting phone realization by class |
| 3-1 | 82 | Phone sets across three dictionaries |
| 3-2 | 87 | Postlexical phones in corpus |
| 3-1 | 92 | Prominence rankings 0-13 (O'Shaughnessy 1976) |
| 4-1 | 98 | Phonemicity/allophony decision framework |
| 4-1 | 138 | Inter-transcriber reliability: UCLA 77.5-80.1%, OGI 55-67% |
| 5-1 | 155-157 | Postlexical reflexes of each lexical phone (frequency counts) |
| 5-1 | 163-164 | 53 phonological features |
| 5-1 | 165 | Block 4 stress features |
| 5-1 | 166 | Block 5 boundary features (14 binary) |
| 6-1 | 175 | Summary of network performance |
| 6-1 | 193 | t,d deletion by preceding phone |
| 6-2 | 194 | Flapping performance |
| 6-3 | 196 | /t/ glottalization by following phone |
| 6-4 | 196 | /t/ glottalization by prosodic position |
| 6-5 | 199 | /t/ glottalization by syllable accentuation |
| 6-1 | 202 | Function word reduction before C/V |
| 6-2 | 203 | "to" reduction by following segment type |
| 6-3/6-4 | 204 | "a" reduction by phrase-initial status |
| 7-1 | 213 | Lexical representation impact on speech recognition accuracy |
| A-1 | 216 | TIMIT/IPA correspondences |

## Implementation Details

### Pseudophone Collapsing Strategy
1. Identify phone pairs that differ only in subphonemic features
2. Collapse stop closure + release into single "pseudophone"
3. This avoids alignment problems where postlexical form has more segments than lexical form
4. 40 composite pseudophone symbols used for alignment (Table 5-6, p. 146)

### Database Fields for Postlexical Prediction (24 fields, Table 5-1 p. 152)
Including: orthographic word, lexical phone, postlexical phone, preceding/following phones, syllable stress, word prominence, word type, 14 boundary features, pitch accent

### Acoustic NN Processing Pipeline
1. Input Block 1: TDNN window with prominence, stress, function/content, phone label
2. Input Block 2: Duration info for preceding/following 4 segments
3. Blocks 3-4: Phoneme-to-feature conversion
4. Blocks 5-8: Feature processing (15-15-15-10 outputs)
5. Block 9: Combination layer (60 outputs)
6. Block 10: Hidden layer (40 outputs)
7. Block 11: Output preparation (14 outputs)
8. Block 12: Coder parameters output (5ms frame rate)

## Limitations

1. **Single speaker**: All results based on one Chicago male; generalization uncertain
2. **Read speech**: Corpus is read speech, not spontaneous — "only in spontaneous speech will we find the most advanced tokens of linguistic change in progress" (Labov 1994)
3. **Inter-transcriber reliability**: Only 55-80% agreement on phonetic labels; diacritics hurt reliability further
4. **Dialect coverage**: "Generalized American" may not match any real speaker
5. **Long-distance dependencies**: Window of 9 may miss some prosodic effects
6. **Glottalization accuracy**: Phrase-final glottalization poorly predicted (0% at intonational phrase ends)
7. **Cross-word phenomena**: Flapping failures occurred specifically in cross-word environments

## Testable Properties

- /t/ deletion rate should increase when preceded by segments sharing features [+coronal, -sonorant, -continuant]
- /t/ should never flap outside V_V environments
- /t/ glottalization should primarily occur before sonorants (n, m, r, l, w, j)
- Fronted [u] should appear more frequently in coronal environments than non-coronal
- Schwa realized as [i] should correlate with surrounding [+coronal] segments
- Dark /l/ should NOT trigger coronal-conditioned fronting of adjacent vowels
- "the" should surface as [Di] before vowels and [Da] before consonants
- "a" should resist reduction in phrase-initial position (~75% unreduced)
- Window size ≥ 5 phones should capture most contextual variation (92.9% at 5 vs 61.2% at 3)
- Following context should be more predictive than preceding context (anticipatory > perseverative)
- Stridents (/s/, /z/) should have near-zero entropy (almost always canonical)
- Schwa and /t/ should have highest entropy of all phones

## Relevance to Project

### Directly Applicable

**G2P rules applicable:** YES
- Validates that phonemic dictionaries work when paired with postlexical processing
- Feature-based phone encoding (53 features) could improve G2P generalization

**Stress rules applicable:** YES
- O'Shaughnessy (1976) prominence scale (0-14) documented
- Stress encoding: 1=primary, 0.5=secondary, 0=unstressed

**Allophony rules applicable:** YES — implement these (priority order by entropy/impact):
1. /t/ deletion in coda clusters — highest-entropy consonant
2. /t/ flapping in V_V context
3. /t/ glottalization before sonorants
4. Schwa deletion and [i]/[ax] allophony — highest-entropy vowel
5. /u/ fronting near coronals
6. Function word reduction rules for "the", "to", "a"
7. Word-initial vowel glottalization

### Implementation Recommendations

1. **Add postlexical processing stage** after phoneme generation but before acoustic synthesis
2. **Use prosodic context** (phrase boundaries, prominence) for allophone selection — esp. glottalization
3. **Prioritize /t/ and schwa** — these have highest entropy and most impact on naturalness
4. **Consider anticipatory effects** — following context more predictive than preceding
5. **Window size of 9** (4 phones each direction) captures most relevant context
6. **Trade-off awareness**: Reduced forms sound more natural but may reduce intelligibility in synthetic speech; consider register/style parameter

### Not Directly Applicable

- Neural network training approach requires speaker-specific labeled corpus
- Duration module and acoustic module are specific to concatenative/vocoder synthesis
- The acoustic NN architecture (Blocks 1-12) is vocoder-specific, not formant-based

## Open Questions

- [ ] How does the 98% acceptable rate compare to modern TTS systems?
- [ ] Would the allophony rules generalize to other American English speakers?
- [ ] Is window size of 9 sufficient for capturing all relevant prosodic effects?
- [ ] How to handle glottalization at intonational phrase boundaries (0% accuracy in dissertation)?
- [ ] What is the optimal feature set for minimal TTS implementation?
- [ ] Should reduced vowel target be [i] (Veatch 1991) or schwa?
- [ ] How to implement the naturalness-intelligibility trade-off as a style parameter?

## Related Work Worth Reading

### For G2P
- Sejnowski & Rosenberg 1987 — NETtalk
- Riley 1991 — Statistical pronunciation networks
- Torkkola 1993 — Automatic G2P rule learning
- Meng 1995, 1996 — Bidirectional letter-to-sound/sound-to-letter

### For Prosody
- O'Shaughnessy 1976 — F0 modeling, prominence scale (0-14)
- Pierrehumbert 1980 — ToBI intonation model
- Nespor & Vogel 1986 — Prosodic phonology

### For Allophony
- Pierrehumbert & Frisch 1997 — Glottalization before sonorants
- Pierrehumbert & Talkin 1992 — Prosodic effects on glottalization/lenition
- Sproat & Fujimura 1993 — /l/ allophones
- Guy & Boberg 1997 — t,d deletion and OCP
- Byrd 1994 — TIMIT variation by sex/dialect
- Zsiga 1995, 1997 — Categorical vs. gradient palatalization

### For Evaluation
- Pisoni & Hunnicutt 1980 — MITalk evaluation
- Nusbaum et al. 1995 — Naturalness measurement
- Bradlow et al. 1996 — Vowel space dispersion and intelligibility

### Key Books
- Allen, Hunnicutt & Klatt 1987 — MITalk system (synthesis by rule)
- Wells 1982 — Accents of English
- Dutoit 1997 — TTS synthesis introduction
- Chomsky & Halle 1968 — The Sound Pattern of English

### For Lexical Phonology Theory
- Kiparsky 1982, 1985 — Lexical phonology, categorical vs. gradient rules
- Kaisse 1985, 1990 — P1/P2 postlexical rule typology
- Selkirk 1984 — Phonology-syntax interface, function words

## TIMIT Symbol Mappings (for reference)

| TIMIT | IPA | Description |
|-------|-----|-------------|
| ax | ə | Mid central (schwa) |
| ix | ɨ | High central (barred-i) |
| uw | u | High back round |
| ux | ʉ | High central round (barred-u) |
| aa | ɑ | Low back |
| ao | ɔ | Low-mid back round (open-o) |
| ae | æ | Low front |
| ah | ʌ | Mid-low central (wedge) |
| iy | i | High front |
| ow | o | Mid back round |
| th | θ | Voiceless dental fricative |
| dh | ð | Voiced dental fricative |
| ch | tʃ | Voiceless postalveolar affricate |
| jh | dʒ | Voiced postalveolar affricate |
| sh | ʃ | Voiceless postalveolar fricative |
| dx | ɾ | Alveolar flap |
| nx | ɾ̃ | Nasalized flap |
| hv | ɦ | Voiced /h/ |
| el | l̩ | Syllabic /l/ |
| em | m̩ | Syllabic /m/ |
| en | n̩ | Syllabic /n/ |
| eng | ŋ̩ | Syllabic /ŋ/ |

## Collection Cross-References

### Already in Collection
- [[Allen_1987_MITalk_TTS]] — cited as foundational TTS system; Miller builds on the MITalk pipeline architecture
- [[Elovitz_1976_NRL_LTS]] — cited for the 329-rule LTS system establishing practical G2P conversion
- [[Klatt_1976_SegmentalDuration]] — cited for segmental duration rules; Miller's duration module extends this approach
- [[Klatt_1979_SpeechPerceptionLexicalAccess]] — cited for SCRIBER/LAFS diphone-based acoustic decoding
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — foundational synthesizer architecture
- [[Klatt_1987_TTS_Review]] — cited for TTS pipeline review and Klattalk specification
- [[Klatt_1990_VoiceQualityVariations]] — cited for KLSYN88 voice quality framework
- [[OShaughnessy_1976_F0_Prosody]] — cited for the 0-14 word prominence scale used in neural network input encoding
- [[Pierrehumbert_1980_EnglishIntonation]] — cited for ToBI pitch accent notation (H*, L*) used in boundary features
- [[Silverman_1992_ToBILabelingProsody]] — cited for ToBI transcription conventions used in corpus labeling
- [[Beckman_2022_ToBISystem]] — ToBI conventions referenced for prosodic labeling tiers
- [[Black_1998_LTS_Rules]] — cited for CART-based letter-to-sound rules as alternative G2P approach
- [[Hunnicutt_1976_PhonologicalRules]] — cited for MITalk phonological rule system
- [[Sproat_Fujimura_1993_AllophonicVariationEnglishL]] — cited extensively for gradient light/dark /l/ allophony and the two-gesture model
- [[Browman_1989_ArticulatoryGesturesPhonologicalUnits]] — cited for gestural approach to deletion (remnants of deleted gestures)
- [[Browman_Goldstein_1992_ArticulatoryPhonologyOverview]] — cited for "targetless" schwa concept and gestural overlap model of coarticulation
- [[Goldsmith_1976_AutosegmentalPhonology]] — cited for autosegmental phonological theory underlying multi-tier representations
- [[Ohman_1966_CoarticulationVCV]] — cited for coarticulation in VCV utterances
- [[Recasens_1997_LingualCoarticulationDAC]] — related coarticulation framework (DAC model)
- **vanSanten_1993_SegmentalDuration** — cited for sums-of-products duration models outperforming Klatt-style multiplicative rules
- **vanSanten_1994_SegmentalDurationTTS** — cited for advanced duration prediction framework
- [[Hombert_1979_PhoneticToneDevelopment]] — cited for consonant voicing effects on F0

### Cited By (in Collection)
- [[Montoyo_2005_WSD_Hybrid]] — lists Miller 1998 in its "Already in Collection" cross-references (WSD for homograph disambiguation relevant to TTS)

### New Leads (Not Yet in Collection)
- Pierrehumbert & Frisch (1997) — "Synthesizing allophonic glottalization" — directly relevant to Qlatt's postlexical glottalization rules; establishes that glottalization requires parsed prosodic structure up to intonational phrase level
- Riley & Ljolje (1996) — "Automatic generation of detailed pronunciation lexicons" — multiple allophonic pronunciations from decision trees, relevant to postlexical rule design
- Nespor & Vogel (1986) — *Prosodic Phonology* — defines the prosodic hierarchy that conditions P1/P2 rule application domains
- Byrd (1994) — TIMIT variation study by sex/dialect; quantifies central vowel distribution and gender differences in postlexical behavior
- Guy & Boberg (1997) — t,d deletion and OCP; the feature-matching analysis of deletion rates
- Zsiga (1995, 1997) — categorical vs. gradient palatalization; demonstrates lexical/postlexical distinction acoustically

### Conceptual Links (not citation-based)

**Allophony and coarticulation:**
- [[Recasens_2012_LateralAllophones]] — Miller cites Sproat & Fujimura 1993 for /l/ allophony but not Recasens 2012, which provides the comprehensive cross-language F2 data (clear ~1300 Hz, dark ~900 Hz) that would ground Miller's observation that dark /l/ does NOT count as coronal for vowel fronting purposes — the dorsal retraction gesture dominates acoustically
- [[Harrington_2011_HighBackVowelFronting]] — Miller documents /u/ fronting in his Chicago speaker as coronal-conditioned allophony; Harrington demonstrates that SSBE /u/ fronting involves tongue advancement with maintained lip rounding. Different dialects, same phenomenon, complementary articulatory explanation
- **vanSon_1997_ConsonantReduction** — Miller focuses on vowel reduction and stop allophony; van Son extends reduction analysis to consonants, showing parallel acoustic reduction (duration, spectral center of gravity, coarticulation) in informal speech. Together they suggest reduction is a unified phenomenon across segment types

**Duration and prosody:**
- [[Klatt_1976_SegmentalDuration]] — Miller's TTS pipeline uses a separate duration module; Klatt 1976 provides the incompressibility principle and multiplicative rules that van Santen's sums-of-products models later improved upon. Miller's prosodic hierarchy conditioning of allophony (P1/P2 rules) interacts with Klatt's phrase-final lengthening
- **vanSanten_1997_ProsodicModeling** — van Santen identifies the "concatenative assumption" and spectral coarticulation effects across boundaries; Miller's cross-word flapping failures (64% accuracy, failures in "that heavy", "brought out") are exactly the kind of cross-boundary phenomenon van Santen warns about

**TTS architecture:**
- [[Hertz_1991_StreamsPhonesTransitions]] — Hertz proposes treating formant transitions as independent temporal units with stable durations; Miller's postlexical module operates at the phone level. The two approaches address different layers of the same problem: Hertz handles acoustic realization, Miller handles phonological surface form selection
- **Hertz_1999_ETI-Eloquence_MultiLanguage** — Hertz's multi-language TTS architecture separates language-universal from language-specific components; Miller's postlexical module is inherently speaker-specific, but the general architecture of phonemic dictionary → postlexical rules → acoustic realization parallels Hertz's pipeline
