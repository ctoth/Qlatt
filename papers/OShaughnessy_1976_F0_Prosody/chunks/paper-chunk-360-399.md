# Pages 360-399 Notes

## Chapters/Sections Covered

- 7.4.3) Emotional Connotations (page 361)
- 7.4.4) Speaking Rate (page 362-363)
- 7.4.5) Summary (page 364)
- 7.5) Economy in Fundamental Frequency Movements (pages 364-367)
- **8) An Algorithm for Fo Generation-by-rule** (pages 368-394) - CORE CONTENT
  - 8.1) The High Level System (HLS) (pages 369-381)
  - 8.2) The Low Level System (LLS) (pages 381-390)
  - 8.3) An Example (pages 391-394)
- 9) Summary of Thesis (pages 395-399)

## Key Findings

### Two-Level F0 Generation Architecture (page 368)

The algorithm divides F0 effects into two main groups:
- **High Level (HLS)**: Semantic meaning and syntactic framework - the speaker has DIRECT control
- **Low Level (LLS)**: Phonemic/lexical modifications to the abstract F0 gestures - speaker has LITTLE direct control

These can be viewed as:
- HLS = Psychological system (converting mental image into basic F0 gestures)
- LLS = Physiological system (converting abstract commands into actual F0 movements obeying physical constraints)

### High Level System (HLS) - Prosodic Indicators (PIs)

The HLS accepts semantic and syntactic information and produces a set of "prosodic indicators" (PIs) for each WORD:

| PI Name | Description | Values |
|---------|-------------|--------|
| accent | Relative gauge of accent (not Hz) | Integer (higher = more accent) |
| break | Whether word begins/ends P-unit with F0 rise/fall | Positive = rise, Negative = fall, 0 = neither |
| CR | Continuation rise size and type | Integer + label (fall+rise or monotonic) |
| level | What F0 level word should assume | +1 = hold level, -1 = drop level, 0 = default |
| Tune | Final contour type | 'A' (fall), 'B' (question rise), or 'null' |
| # of phrases | Count of syntactic phrases in sentence | Integer |

Default values: all numbered PIs = 0, default CR = fall+rise

### Inherent Accent Potential by Word Class (pages 377-378)

**CRITICAL FOR TTS IMPLEMENTATION:**

| Word Class | Accent Value |
|------------|--------------|
| articles | 0 |
| conjunctions, relative pronouns | 1 |
| prepositions, aux's, B modals, vocatives | 2 |
| personal pronouns | 3 |
| finite verbs, demonstrative pronouns | 6 |
| nouns, adjectives, ordinary adverbs, negative contractions | 7 |
| reflexive pronouns | 8 |
| A modals | 9 |
| quantifiers | 10 |
| interrogative words | 11 |
| negative adverbs | 12 |
| sentential adverbs | 14 |

Words in classes a-d (0-3) are 'function words'; classes e-l (6-14) are 'content words' and 'modality operators' (MOs).

### Accent Modifications

1. **Multisyllabic words**: Add +2 to accent number for words with 2+ syllables
2. **Compounds**: If 2 words function as compound, reduce second's accent by -5
3. **Focus transformation**: Increase accent +4 for cleft, +3 for other focus transformations
4. **Passive**: Increase verb accent by +2
5. **Repetition**: Decrease non-initial occurrences by -3
6. **Anaphoric reference**: Reduce by -3 unless subset relationship
7. **Parallel positions**: Increase non-final by +2, final by +1
8. **Contrastive stress**: Raise by +4, decrease others by -2

### Low Level System (LLS) Parameters (page 382)

Standard speaker parameters:
- **F0 range**: 100 Hz
- **Lowest F0 (BOR - Bottom of Range)**: 85 Hz
- **BOR range**: 95-110 Hz

Each syllable receives an **F0 triplet**:
1. Amount of prior jump/drop
2. Amount of rise/fall in nucleus
3. F0 peak value

### Accented vs Unaccented Syllables

- **Head syllable**: First syllable with accent > 5
- **Accented Syllable (AS)**: accent >= 5
- **Unaccented Syllable (US)**: accent < 5

### F0 Peak Calculations (page 383)

1. **Initial (head) peaks**:
   - Base value = 115 Hz
   - Add +10 for each 'phrase' up to limit of 185 Hz
   - For subsequent independent clauses: decrease base by -8 and increment by -2

2. **F0 'room'** (distance between head peak and BOR):
   - Tune A clause: 110 Hz (peak - BOR)
   - Tune B clause: 125 Hz as lower value
   - Calculate 'drop' between successive AS peaks by dividing 'room' by number of ASs

3. **Peak adjustment by accent number**:
   - Multiply (accent_number - 8) by 10% of local F0 'room'
   - Add this product to the peak
   - This raises peaks of words with numbers > 8 and lowers those < 8

### Rise and Fall Accent Formulas (pages 384-385)

**Rise accent** on AS:
- Basic amount = 40% of local F0 'room'
- If word has non-zero 'break' number: add 20% of (rise * break_number) to basic rise
- Head AS gets rise accent = peak - 110 (starting from top of BOR)

**Fall accent** on AS:
- Basic amount = -20% of local F0 'room'
- In words with non-zero 'break' PIs: add (break_number * 20%) of local F0 'room' to descent

**Within P-unit modification**: If word has zero 'break' and is preceded by word with positive 'break', reduce accent amounts by -30%

### Separation Effects (page 385-386)

The rise accent depends on:
- Number of preceding USs (except for first AS in clause)
- Number of following USs

**Adjacent ASs** (no US between):
- Reduce rise accents of both by -40%
- Reduce first F0 peak by -20% of local 'room'
- Raise second peak by +20%
- Increase fall accent of first OR rise accent of second so endpoints meet

**2+ intervening USs**:
- Add 15% more to each AS rise accent for one extra US
- Add 10% for second US, 5% for third US

**Preceding USs effect on peaks**:
- One extra prior US: decrease peak by -15% of local F0 'room'
- Second extra prior US: decrease by another -10%

**Following USs effect**:
- One extra following US: increase current peak by +10% of local F0 'room'
- Second: +5%

### Terminal Patterns (pages 386, 388)

**Tune A (statement) word-final**:
- Increase descent so F0 reaches 85 Hz

**Tune B (question) word-final**:
- Add rise after AS's descent so F0 reaches value 20% above biggest prior peak

**In Tune B clause**: Transfer 80% of fall accent to additional rise accent

### Continuation Rises (CRs) (page 387)

- If word has non-zero CR PI: last syllable gets additional F0 change = 8 * CR_number
- Monotonic CR: reduce fall accent on AS by 80%
- Fall+rise CR: increase fall accent by 30%

### Phonetic Modifications - Consonant Voicing Effects (page 389)

**Unvoiced consonant begins AS**: Increase peak F0 by +20%

**Division of rise accent by initial consonant voicing**:
- Unvoiced: prior jump = 80%, nucleic rise = 20%
- Voiced: prior jump = 20%, nucleic rise = 80%

**Standard F0 descent division**: half fall, half drop after nucleus

**Voicing effect on fall:drop ratio**:
- Unvoiced consonant between accented and following unaccented vowel: ratio = 1:2
- All voiced consonants: ratio = 4:1 (almost all descent in nucleus), 30% of descent shifted to next US

### Syllable Nucleus Definition (page 388)

The syllabic nucleus = section of syllable having energy above 40% of maximum on that syllable. Includes:
- Entire vowel
- About half of sonorants (/l,r,w,y/)
- Little of nasals or voiced obstruents

### US F0 Patterns (pages 387-388)

**Within P-unit** (after positive break, before negative break):
- Linear falling rate
- Each successive US gets equal share of F0 decrease

**Outside P-unit** ('exponential' pattern):
- 3+ USs in sequence: let X = F0 difference between first AS end-point and 105
- First US gets descent of 45% of X
- Second US gets 35%
- Third US gets 20%
- Further USs: small rises and falls within BOR (accent_number * 4 Hz)

**2 USs only between ASs**: First gets 60% of decrease, second gets 40%

### Speaker Adaptation (page 390)

To adjust for speakers other than 'standard':
1. Scale all F0 changes (rises, falls, jumps, drops) by ratio of new speaker's range to 100 Hz
2. Add F0 offset to all peaks = difference between new speaker's lowest F0 and 85 Hz
3. Use appropriate fall:drop ratio for the speaker

### Post-processing (page 390)

For actual synthesis, the linearized F0 contour should be **smoothed** (e.g., by a low-pass filter).

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Standard F0 range | - | 100 | Hz | Reference speaker |
| Bottom of Range (BOR) | - | 85 | Hz | Lowest F0 value |
| BOR range | - | 95-110 | Hz | Typical speaker variation |
| Head peak base | - | 115 | Hz | Initial AS peak |
| Head peak max | - | 185 | Hz | Upper limit |
| Phrase increment | - | +10 | Hz | Per phrase in sentence |
| Tune A room | - | 110 | Hz | Peak - BOR for statements |
| Tune B lower | - | 125 | Hz | For questions |
| Rise accent basic | - | 40% | of room | Basic rise on AS |
| Fall accent basic | - | -20% | of room | Basic fall on AS |
| Adjacent AS reduction | - | -40% | - | When no US between ASs |
| Accented threshold | - | 5 | accent units | AS vs US boundary |
| Syllable nucleus threshold | - | 40% | of max energy | Defines nucleus extent |
| Unvoiced jump:rise ratio | - | 80:20 | % | Prior jump vs nucleic rise |
| Voiced jump:rise ratio | - | 20:80 | % | Prior jump vs nucleic rise |
| Standard fall:drop ratio | - | 50:50 | % | Half fall, half drop |
| Unvoiced fall:drop ratio | - | 1:2 | - | More drop after nucleus |
| Voiced fall:drop ratio | - | 4:1 | - | More fall in nucleus |
| CR multiplier | - | 8 | Hz | Times CR number |

## Rules/Algorithms

### HLS Algorithm (Sentence Level - Fig. 137)

1. **Statement/exclamation**: Mark last word with Tune A
   - Exception: tag question - mark last word with Tune B, word before question with Tune A
2. **Yes/no question**: Mark last word with Tune B
   - Exception: alternatives question - Tune A before last alternative, Tune B on last
3. **Wh-question**: Mark last word with Tune A
   - Exception: with examples - Tune A before examples, Tune B on final
4. **Vocative ending**: Give word before vocative same Tune as vocative; if Tune A, delete that from vocative

### HLS Algorithm (Phrase Level - Fig. 138)

1. **Non-final clause boundaries**:
   - Independent clause: break = -4, CR = 3
   - Dependent clause: break = -2, CR = 1 (first boundary); break = -3, CR = 2 (second)
2. **Syntactic transformation boundaries**:
   - Focus (clefting/pseudo-clefting): break = -4
   - There-insertion: break = -3
   - Dummy-insertion: break = -2, CR = 2 only if focussed phrase follows
   - Preposing: break = -2, CR = 1
   - Left-offsetting (topicalization): break = -4, CR = 2 or 3
   - Right-offsetting: break = -4 (no CR, give Tune A for right dislocation)
   - Ellipsis: break = -1, CR = 1
3. **Within clause**: Allocate one break for every 4 content words
   - Place breaks at 'strongest' syntactic boundaries
   - Relatively even word counts between breaks

### HLS Algorithm (Word Level - Fig. 139)

1. Assign inherent accent potential by word class (see table above)
2. Add +2 for multisyllabic words
3. Reduce by -5 for second word of compound
4. Apply syntactic transformation adjustments
5. Apply repetition/anaphora adjustments (-3 for repeated, varies for anaphoric)
6. Apply parallel structure adjustments (+2 non-final, +1 final)
7. Apply semantic effects (contrastive stress +4, quotation +2, indirect object -1, etc.)

### LLS Algorithm (Preliminaries)

1. Assume 'standard' speaker (range 100 Hz, lowest 85 Hz, BOR 95-110 Hz)
2. Consider each syllable as receiving F0 triplet: (prior_jump, rise_fall, peak)
3. Assign syllable accent = word's accent number on lexically-stressed syllable, 0 elsewhere
4. Head syllable = first with accent > 5
5. AS = accent >= 5, US = accent < 5
6. Divide sentence into independent clauses, treat each separately

### LLS Algorithm (F0 Peaks - Fig. 140)

1. Initial peak = 115 + (10 * num_phrases), max 185
   - For each successive clause: decrease base by -8, increment by -2
2. Calculate F0 'room' = peak - BOR (110 for Tune A, use 125 lower for Tune B)
3. Find 'drop' between successive AS peaks = room / num_ASs_in_clause
   - If 4+ ASs: increase first-to-next drop by 15%, decrease remaining drops proportionally
4. Assign peaks by subtracting drops from preceding AS peak
5. Adjust peaks by accent number: peak += (accent - 8) * 0.10 * local_room

### LLS Algorithm (Rise/Fall Accents - Fig. 141)

1. Rise accent = 0.40 * local_room
   - If non-zero break: rise += 0.20 * break * rise
   - Head AS: rise = peak - 110
2. Fall accent = -0.20 * local_room
   - If non-zero break: fall += break * 0.20 * local_room
3. If word has zero break preceded by positive break word: reduce accents by -30%

### LLS Algorithm (Phonetic Modifications - Fig. 142)

1. **Separation**: Adjust based on number of intervening USs between ASs
2. **Terminals**: Handle Tune A (fall to 85 Hz) and Tune B (rise 20% above max peak)
3. **Unvoiced consonant**: +20% to peak; divide rise 80:20 (jump:nucleic)
4. **Voiced consonant**: divide rise 20:80; shift 30% of descent to next US if all voiced
5. **Fall:drop ratio**: 1:2 if unvoiced between AS and following US; 4:1 if all voiced

### LLS Algorithm (US Patterns - Fig. 144)

1. Within P-unit: linear falling, equal shares per US
2. Outside P-unit: 'exponential' - 45%/35%/20% for first 3 USs
3. USs at clause start: small rises/falls = accent_number * 4 Hz

### LLS Algorithm (Time Synchronization - Fig. 146)

1. If AS initiates P-unit and US follows within same word: use 20% of accent as prior jump on US
2. Distribute rise and fall durationally in proportion to their amounts
3. CR starts no earlier than halfway through syllabic nucleus

## Figures of Interest

- Fig. 136 (page 369): Block diagram of cascaded HLS and LLS systems
- Fig. 137 (page 373): Sentence-level HLS flowchart
- Fig. 138 (page 374): Phrase-level HLS flowchart
- Fig. 139 (page 377): Word-level HLS flowchart
- Fig. 140 (page 383): F0 peaks calculation flowchart
- Fig. 141 (page 384): Rise and fall accents flowchart
- Fig. 142 (page 385): Phonetic modifications flowchart
- Fig. 143 (page 387): Continuation rises flowchart
- Fig. 144 (page 387): US F0 patterns flowchart
- Fig. 145 (page 388): Jumps, rises, and local perturbations flowchart
- Fig. 146 (page 389): Time synchronization flowchart
- Fig. 147-148 (page 391+): Example algorithm application and comparison with actual contours

## Quotes Worth Preserving

> "High level Fo effects in an utterance are those related to the semantic meaning of a sentence, and the syntactic framework in which those ideas are conveyed. These are the Fo phenomena which are directly related to the linguistic content of the sentence to be spoken, and for which the speaker has most direct control." (page 368)

> "Low level Fo effects are those involved in modification of the Fo contour specified by the abstract, underlying Fo gestures which are the output of the High Level System. Phonemics, lexical stress, and the number of syllables have direct effects in the actual implementation of an Fo contour." (page 368)

> "One general principle of Fo implementation is that of economy of effort. As in many other human activities, with speech the speaker seeks to optimize his communicative ability with the least amount of effort." (page 364)

> "The speaker follows 2 rules: 1) give the words least predictable in context the biggest amounts of accent, and 2) use sharply rising Fo at the start and sharply falling Fo at the end of syntactic phrases." (page 395)

> "Fo contour production can be viewed at 2 levels: a high, 'psychological' level, at which the semantic and syntactic objectives of the speaker are initiated in terms of broad vocal cord commands of the type 'increase accent on word X' or 'place a sharp fall on word Y,' and a low, 'physiological' level, at which these commands are combined with the phonemic composition of the sentence to actually implement the rises and falls" (page 399)

## Implementation Notes

### For TTS Prosody System

1. **Two-pass architecture**: First pass (HLS) assigns prosodic indicators per word based on syntax/semantics. Second pass (LLS) converts to actual F0 values per syllable.

2. **Word class lookup table**: Implement the accent potential table (0-14 scale) as primary source of word importance.

3. **Key percentages to implement**:
   - 40% of room for rise accent
   - 20% of room for fall accent
   - 10% of room for accent number adjustment
   - 20% boost for unvoiced consonants
   - 80:20 vs 20:80 jump:rise ratios based on voicing

4. **Declination**: The gradual decrease of peaks through the utterance is handled by the 'room' division algorithm.

5. **Smoothing required**: The algorithm outputs linear segments; actual synthesis needs low-pass filtering.

6. **Speaking rate effect**: Changes F0 slopes rather than amounts - same variation in less time means steeper slopes.

7. **The nucleus definition** (40% energy threshold) is crucial for timing the F0 movements correctly within syllables.

8. **P-unit structure**: The positive/negative break numbers encode phrase boundaries and direction of F0 movement at those boundaries.
