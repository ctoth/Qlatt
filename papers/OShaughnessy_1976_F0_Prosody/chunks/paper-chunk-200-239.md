# Pages 200-239 Notes

## Chapters/Sections Covered

- **Chapter 5 (continued)**: Syntactic Transformations and F0
  - 5.3.3) Type-of-clause effects
    - 5.3.3.1) Parenthetical expressions and quotations
    - 5.3.3.2) Embedding the Second Clause
    - 5.3.3.3) Pseudo-clefted sentences
    - 5.3.3.4) Other Variations with Embedded Clauses
    - 5.3.3.5) Matrix versus Embedded Clauses
    - 5.3.3.6) Independent versus Dependent Clauses
  - 5.3.4) Summary
- **Chapter 6**: Syntactic Effects
  - 6.1) Terminal patterns
    - 6.1.1) Types of terminals
    - 6.1.2) Yes/no Questions
      - 6.1.2.1) Yes/no questions with Modality Operators
      - 6.1.2.2) Yes/no questions with Varied Phonetics
      - 6.1.2.3) Yes/no Questions with Embedded Clauses and Vocatives
      - 6.1.2.4) Alternatives versus Examples
    - 6.1.3) Wh-questions
      - 6.1.3.1) Wh-questions with Modality Operators
      - 6.1.3.2) Other Wh-questions
    - 6.1.4) Other Combinations
    - 6.1.5) Perceptual Differences
    - 6.1.6) Summary
  - 6.2) Delimitation of syntactic units
    - 6.2.1) Segmenting

## Key Findings

### Parenthetical Expressions vs Quotations
- **Parenthetical expressions**: pitch level lowered, volume reduced, extremes set off by pauses and CRs, accents flattened, "monotonic" speech with reduced speech power
- **Quotations**: use "upshift" - raised F0, opposite effect from parentheses
- Parenthetical content preceded by sustained level F0 (no CR)
- "Afterthought" at end of sentence: F0 falls below BOR with reduced F0

### Multi-Clause Utterance F0 Patterns
- Multi-clause utterances have higher initial F0 levels than single-clause utterances (anticipation effect)
- "Bruce" initial position: 167 Hz (2-clause), 168 Hz (3-clause) vs 148 Hz (1-clause)
- Peak pattern for 2-clause "Bruce - Joseph - studied": 167-132-111 Hz
- Peak pattern for 3-clause: 168-139-112 Hz
- Most drop-off in first clause; later clauses maintain relatively smooth descent

### Modality Operators (MOs) - "might", "not", "actually"
- MOs receive accent in virtually all cases
- When MO is only word in clause: "actually" +22 accent in either clause
- "might" had +10 more accent in first clause than second (+15 vs +5)
- Adjacent MOs show "rhythm effect" - middle MO's accent reduced
- When "might have actually" in verb group: modal had little accent (+1), adverb had heavy one (+38)

### Matrix vs Embedded Clauses
- Content words in main clauses have larger F0 accents than those in embedded clauses
- Main clause provides major information; embedded clause yields background/peripheral information
- "The prominence of a constituent decreases in direct proportion to its degree of embedding" (Langacker, 1974)

### Terminal Patterns - Tune A vs Tune B

**Tune A (Terminative/Falling)**:
- Steeply falling end-contour starting close to end of last stressed word
- Used for simple declarative sentences
- "The deeper the fall, the more conclusive"
- Signals 'finality' or 'definiteness'

**Tune B (Continuative/Rising)**:
- Level end-contour to indicate more phrases will follow (i.e., CR)
- Used for yes/no questions

**Elicitative mode**: Rising end-contour for questions and surprise

### Yes/No Questions (Tune B)
- Lesser falling declination rate than Tune A
- F0 remains above BOR (even in USs)
- Sharp "question rise" on last syllable to high level (usually highest in utterance)
- For JA: F0 never fell below 139 Hz after initial accent rise, rose to final peak >175 Hz
- Rise accents on each AS (even small rises on USs after the big rise on AS)
- Sharp jump+rise on final syllable to very high level

### Wh-Questions (Tune A with modifications)
- Basic Tune A contour shape (falling terminal)
- Wh-word receives heavy accent (like quantifier in initial position)
- Peak pattern: 176-120-126 (fall to valley before second peak, then low 85 at end)
- Large peak differential between first 2 peaks
- Inserting negative/modal provides only local F0 variation

### Question Perception Parameters
- Terminal rise slope: 0.6 Hz/msec for terminal rise of 60 Hz (Rabiner, 1968)
- Endpoint values 170-190 Hz cue QUESTION >75% of time
- Endpoint values 70-100 Hz cue STATEMENT
- Terminal glide is "single most powerful determinant" for Q vs S distinction
- Turning point height affects perception indirectly
- Peak F0 has "direct linguistic function"

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Question terminal rise slope | - | 0.6 | Hz/msec | Rabiner synthesis algorithm |
| Question terminal rise total | - | 60 | Hz | Terminal rise for question |
| Question endpoint F0 | - | 170-190 | Hz | Cues QUESTION perception >75% |
| Statement endpoint F0 | - | 70-100 | Hz | Cues STATEMENT perception |
| 2.5 semitone rise equiv | - | 350 | msec silence | Syntactic boundary indicator |
| Syntactic boundary F0 change | - | ~7% | of F0 | Decrease at end, increase at start of next constituent |
| Multi-clause initial peak (2-clause) | - | 167 | Hz | "Bruce" in initial position |
| Multi-clause initial peak (3-clause) | - | 168 | Hz | "Bruce" in initial position |
| Single-clause initial peak | - | 148 | Hz | "Bruce" in initial position |
| Yes/no question F0 floor | - | 139 | Hz | JA speaker - F0 never fell below this |
| Yes/no question final peak | - | >175 | Hz | JA speaker - final rise target |
| Parenthetical F0 descent | - | -68 | Hz prior | Heavy de-accenting before parenthetical |

## Rules/Algorithms

### Parenthetical Expression Rule
1. Parenthetical expression preceded by sustained, level F0 (no CR)
2. If at end of utterance ("afterthought"): F0 falls below BOR, reduced F0
3. If "important afterthought": gets its own accent with non-lowered F0

### Quotation Rule
1. Quotations use "upshift" - raised F0 (opposite of parenthetical)
2. "said" as quotation-introducer: causes syntactic break before quotation
3. Content words in quotation have increased accent (+34 more, +11 higher peak)

### Multi-Clause F0 Planning
1. Higher initial F0 for multi-clause utterances (anticipation effect)
2. Most F0 drop-off occurs in first clause
3. Later clause heads remain above ensuing verb peaks
4. Pseudo-clefted utterances: larger accents on final, focussed clause

### Yes/No Question (Tune B) Algorithm
1. Middle of question: lesser falling declination rate than statements
2. F0 remains above BOR throughout (even on USs)
3. Sharp "question rise" on LAST syllable only
4. Rise to high level (usually highest in utterance)
5. All ASs have rise accents (small rises even on USs)
6. Terminal rise occurs ONLY after last ICTIC (accented) syllable
7. Rise spread gradually over post-ictic syllables (not necessarily abrupt)

### Wh-Question (Tune A variant) Algorithm
1. Use basic Tune A shape (falling terminal)
2. Wh-word gets heavy accent (like IC word)
3. Large peak differential between Wh-word and next peak
4. Fall to valley before second peak
5. End with low F0 (~85 Hz)
6. Negatives/modals add only local variation

### Terminal Pattern Selection
1. **Statements**: Tune A (falling) - signals finality
2. **Yes/no questions**: Tune B (rising) - requests response
3. **Wh-questions**: Tune A (falling) - but higher register overall
4. **Echo questions**: Rising (surprise/misunderstanding)
5. **Rhetorical questions**: Falling (speaker has information)
6. **Alternative questions**: Fall on each alternative, rise on "or"

### Syntactic Boundary Marking
1. Sharp F0 fall marks end of syntactic unit
2. F0 remaining high signals continuing phrase
3. Phrases start with rising F0, end with falling F0
4. Initial phrase: rise+level+fall (Tune A "hat" pattern)
5. Internal boundaries: fall+rise gestures
6. Boundary presence depends on: speaking rate, utterance length, boundary "major"-ness

### Syntactic Constituent F0 Rule (Lea & Kloker)
1. ~7% F0 decrease at end of each major syntactic constituent
2. ~7% F0 increase near beginning of following constituent
3. Very large F0 changes accompany clause and sentence boundaries
4. Just before pauses: F0 often drops very rapidly
5. 2.5 semitone rises equivalent to 350 msec silences as boundary indicators
6. F0 valley often located AFTER underlying syntactic boundary (not at it)

## Figures of Interest
- Figs. 90-93: F0 patterns for multi-clause sentences
- Figs. 96-98: Matrix vs embedded clause comparisons
- Figs. 99-100: Yes/no question patterns
- Fig. 106: Wh-question patterns
- Fig. 107: Wh-questions with vocatives

## Quotes Worth Preserving

> "the prominence of a constituent decreases in direct proportion to its degree of embedding" (page 216, citing Langacker 1974:660)

> "the deeper the fall, the more conclusive; . . . with the rise, the steeper it is the more inconclusive it is" (page 221, citing Bolinger 1964b:28)

> "Intonation goes down on the last stressed syllable and remains down to the end of the utterance" for statements (page 221, citing Pierce 1966:68)

> "the final question rise occurs only after the LAST ICTIC [i.e., accented] SYLLABLE" and "in natural speech, the rise is not necessarily abrupt, but is usually spread over all the post-ictic syllables as a gradual rise" (page 223, citing Isacenko & Schadlich 1970:35)

> "the terminal glide is the single most powerful determinant" for distinguishing questions from statements (page 236)

> "intonation can be a connective device . . . [or] a disconnective device," in which a sharp Fo fall would mark the end of a syntactic unit, while Fo remaining high would signal a continuing phrase (page 239, citing Lee 1956:359)

> "a decrease (of about 7% or more) in Fo usually occurred at the end of each major syntactic constituent, and an increase (of about 7% or more) in Fo occurred near the beginning of the following constituent" (page 240, citing Lea & Kloker 1975:2)

## Implementation Notes

### For TTS Prosody System

1. **Question Detection and Handling**:
   - Yes/no questions: implement Tune B with terminal rise
   - Rise slope: ~0.6 Hz/msec
   - Target endpoint: 170-190 Hz range
   - Rise occurs only on/after last accented syllable
   - Spread rise gradually over post-stress syllables

2. **Wh-Question Handling**:
   - Use Tune A (falling) pattern
   - But give Wh-word heavy accent (IC-level prominence)
   - Higher overall register than statements
   - Maintain large peak differential (Wh-word to next accent)

3. **Multi-Clause Utterances**:
   - Raise initial F0 based on anticipated clause count
   - ~20 Hz higher for 2-3 clause vs 1 clause utterances
   - Implement smooth declination across clauses
   - First clause gets most of the F0 drop

4. **Parenthetical/Quotation Handling**:
   - Parentheticals: lower pitch, reduce amplitude, flatten accents
   - Quotations: raise pitch ("upshift")
   - Mark boundaries with sustained level F0 (no CR before parenthetical)

5. **Syntactic Boundary Markers**:
   - ~7% F0 decrease at end of major constituents
   - ~7% F0 increase at start of next constituent
   - Very large changes at clause/sentence boundaries
   - Rapid F0 drop just before pauses
   - F0 valley typically AFTER the actual boundary point

6. **Embedded Clause Handling**:
   - Reduce accent prominence in embedded clauses
   - Main clause content words get larger accents
   - Degree of reduction proportional to embedding depth
