---
title: "A Text-to-Speech System Based Entirely on Rules"
authors: "Rolf Carlson and Björn Granström"
year: 1975
venue: "Conference paper (appears to be from proceedings, pages 686-688)"
institution: "Dept. of Speech Communication, KTH, Stockholm, Sweden"
---

# A Text-to-Speech System Based Entirely on Rules

## One-Sentence Summary
Describes an early rule-based TTS system for Swedish that uses no lexicon, relying entirely on ordered phonological rules expressed in a custom programming language notation.

## Problem Addressed
Can a TTS system work without a word dictionary, using only pronunciation rules? The authors argue that even dictionary-based systems need rules (for compounds, affixes, novel words), so why not try rules alone?

## Key Contributions
- A rule notation/programming language for phonological transformations
- Demonstration that Swedish TTS can work without a lexicon
- Segment duration rule with mathematical formulation
- Philosophy that rule errors acceptable if native speakers would make similar mistakes

## Methodology
Ordered rule system operating on string elements with:
- Distinctive features (+/- or unspecified = ternary)
- One-dimensional and two-dimensional variables (time/value pairs)
- Context-sensitive rewrite rules
- OVE III terminal synthesizer with external voice source

## Key Equations

### Segment Duration Rule
$$
\text{DURATION} = T \cdot (A + B + C) \cdot \exp(-\log(B) \cdot 0.12 - \log(A) \cdot 0.35)
$$

Where:
- $T$ = nominal (intrinsic) segment duration
- $A$ = variable depending on position in word/phrase
- $B$ = variable depending on word/phrase length
- $C$ = additional context factor

**Note:** This is an early duration model - compare to later Klatt (1976) and van Santen work.

## Rule Notation

### Basic Rule Structure
```
X → Y / A & B
```
Where:
- `&` marks position of structural description X in context A_B
- Y = structural change
- A, B, X, Y can all be empty strings
- X empty = insertion
- Y empty = deletion

### Context-Free Rule
```
X → Y
```

### Feature Specifications
```
< +CONS, -VOICE >       # Specify features
< i, STRESS > 3, x:=F1 > # Character + conditions + variable assignment
< +CONS >(1,3)          # Optional: 1-3 consonants
```

### Structural Change
```
< a, +ACCENT, F1=N >    # Change to 'a', add ACCENT, set F1 to N
```

Operators:
- `=` : set value
- `:=` : insert value
- `=#` : delete value

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Nominal duration | T | ms | - | - | Segment-specific intrinsic duration |
| Position factor | A | - | - | - | Depends on position in word/phrase |
| Length factor | B | - | - | - | Depends on word/phrase length |
| Context factor | C | - | - | - | Additional context contribution |

## Implementation Details

### System Architecture
1. **Graph-to-phoneme conversion** - Spelling to phonemic representation
2. **Phonological rules** - Devoicing, flapping, etc.
3. **Phonetic rules** - Coarticulation, reduction at parametric level
4. **Acoustic synthesis** - OVE III synthesizer

### Swedish-Specific Processing
1. Find primary stressed syllable in morph
2. Find secondary stressed syllables
3. Use cues from spelling:
   - Double-spelling indicates stress
   - Certain endings (e.g., -ent)
   - Vowels likely to carry stress: Å, Ä, Ö
   - Vowels unlikely to carry stress: A, E
   - "Heavy" consonant combinations
4. Insert morph boundaries during processing
5. Reduce non-initial morph stress in compounds

### Rule Processing Philosophy
- Obvious stress marking and consonant changes early
- Sophisticated rules applied later, conditioned on earlier transformations
- Morph-boundary insertion throughout process

### Testing Methodology
- VCV lists for articulation
- Short stories for prosody
- 10,000 most common Swedish words compared against "correct" transcriptions
- Automatic comparison program

## Figures of Interest
None - this is a text-only conference paper.

## Results Summary
- System generates some errors but "if these may be done by an uneducated speaker as well, the listener might accept them"
- Even "incorrect" transcriptions often accepted by listeners in running speech
- Validates rule-based approach as viable alternative to dictionary lookup

## Limitations
- No semantic analysis
- No syntactic analysis
- Acknowledged that these "could and should be included in the future"
- Coarticulation and reduction specified at parametric level is "artificial" - vocal tract model would be better

## Relevance to Project

### Direct Applicability
- **Duration model**: The exponential duration formula could inform `tts-frontend-rules.js` duration calculations
- **Rule notation philosophy**: Ordered rules with context - similar to what we use for letter-to-sound

### Less Relevant
- Swedish-specific stress rules don't transfer to English
- OVE III synthesizer differs from Klatt architecture
- No formant target data

### Conceptual Value
- Validates rule-only approach (no dictionary) - relevant for handling novel words
- Early example of debugging TTS via automatic comparison to reference transcriptions

## Open Questions
- [ ] What are typical values for A, B, C in the duration equation?
- [ ] How does the OVE III external voice source compare to Klatt's LF model?
- [ ] Reference 11 (Rothenberg et al. 1975) describes a "three-parameter voice source" - worth finding?

## Related Work Worth Reading
- **Allen (1973)** "Speech synthesis from unrestricted text" - pp. 416-428 in Speech Synthesis (Flanagan & Rabiner eds.)
- **Chomsky & Halle (1968)** The Sound Pattern of English - theoretical foundation for rule notation
- **Coker, Umeda, Browman (1973)** "Automatic synthesis from ordinary English text" - Bell Labs approach
- **Liljencrants (1968)** "The OVE III speech synthesizer" - IEEE Trans. Audio & Electroacoustics
- **Rothenberg, Carlson, Granström, Gauffin (1975)** "A three-parameter voice source for speech synthesis" - potentially relevant for glottal source modeling

---

## Collection Cross-References

### Already in Collection
- (none directly cited)

### Cited By (in Collection)
- [[Allen_1987_MITalk_TTS]] — references KTH synthesis-by-rule system as parallel development with different linguistic tradition (Swedish vs American English)
- [[Gobl_2003_VoiceQualityEmotion]] — cites Carlson & Granström for KTH synthesis work
- [[Stevens_1989_QuantalNatureSpeech]] — cites Carlson & Granström for rule-based synthesis
- [[Holmes_1983_FormantSynthesizersCascadeParallel]] — cites Carlson & Granström for KTH formant synthesis
- [[Carlson_1995_ModelsOfSpeechSynthesis]] — later survey by same first author references this earlier rule-based system

### New Leads (Not Yet in Collection)
- **Chomsky & Halle (1968) The Sound Pattern of English** - Foundational for phonological rule notation. Already influential on our letter-to-sound rules.
- **Rothenberg et al. (1975) "A three-parameter voice source"** - Could be relevant for glottal source modeling. The "three parameters" might relate to or predate the LF model.
- **Liljencrants (1968) "The OVE III speech synthesizer"** - Johan Liljencrants later co-authored the LF model with Fant. Understanding OVE III might provide historical context for glottal source development.

### Now in Collection (previously listed as leads)
- [[Allen_1973_SpeechSynthesisUnrestrictedText]] — Allen 1976 describes the complete MITalk pipeline: morph decomposition, letter-to-sound rules, morphophonemic rules, SPE-based stress, sentence parsing, and prosodic control with Klatt synthesizer as backend. Complements Carlson's KTH approach with a morph-dictionary-based G2P strategy vs. Carlson's rule-only approach.
- [[Coker_1973_AutomaticSynthesisOrdinaryEnglish]] — Bell Labs TTS system using Coker's articulatory vocal tract model with orthogonalized control variables. Vowel duration model T = K1 + S*(K2 + K3*C) and 9-level stress scale. Uses articulatory synthesis (natural coarticulation) vs. Carlson's formant synthesis (explicit coarticulation rules).
