# Implementation Notes: Allen 1976 — Synthesis of Speech from Unrestricted Text

**Citation:** Allen, J. (1976). Synthesis of speech from unrestricted text. *Proceedings of the IEEE*, 64(4), 433-442. DOI: 10.1109/PROC.1976.10152

## 1. Overall TTS Architecture

The paper defines the canonical text-to-speech pipeline that became MITalk:

```
Text → Morph Decomposition → Dictionary Lookup / Letter-to-Sound Rules
     → Morphophonemic Rules → Lexical Stress Rules
     → Sentence Parsing (phrase detection → clause detection)
     → Prosodic Rules (duration, F0, pauses)
     → Vocal Tract Model (Klatt formant synthesizer)
     → Speech Waveform
```

Key architectural insight: both text and speech are **surface representations** of a shared underlying linguistic structure. The correct approach is to analyze text into this abstract representation, then synthesize speech from it. This avoids ad hoc rules and allows a concise set of comprehensive rules to describe an infinite range of phenomena.

## 2. Vocal Tract Models

### Klatt Terminal-Analog Model (Fig. 1)
- Tuned resonance model with cascade and parallel branches
- Parameters: F1-F5 with bandwidths, AV (voicing amplitude), AH (aspiration), AF (frication), nasal formant (FNP, FNZ), radiation characteristic
- Stored voicing period with modulation
- Random noise generator for frication source
- Explicitly credited to Klatt [1] (ref: Klatt 1972 conference paper on terminal analog synthesis)

### Articulatory Model (Fig. 2)
- Coker's model: controls for glottal opening, velar opening, tongue mass, tongue tip position, lip and jaw position
- Advantage: coarticulation, vowel reduction, and place allophones produced automatically without special rules

## 3. Word-Level Processing

### Morph Decomposition
- English words decomposed into atomic units called **morphs** (~12,000 morphs vs. 100,000+ words)
- Morph types: prefixes, derivational suffixes, inflectional suffixes, free roots, bound roots
- Word formation: compounding (houseboat) and affixation (enable, kindnesses)
- Lee's algorithm: recursive longest-match from right end of word
- Allen's extension: generate ALL possible decompositions, then apply **selection rules** to pick the correct one
  - Affixation preferred over compounding (tighter binding)
  - Inflectional affixation preferred over derivational
  - Example: "scarcity" → scarce+ity (not scar+city, not scar+cite+y)
  - Example: "resting" → rest+ing (not re+sting)
- Handles strong forms: "wounded" → wound+ed, but disambiguates via rule (wind+PAST+ed has two inflections, rejected)

### Morph Lexicon
- ~12,000 entries, derived from decomposing the entire Brown Corpus (1,014,232 words, 50,406 distinct)
- Sufficient to generate at least 10x that number of English words
- Each entry: pronunciation, part-of-speech, stress effect

### Affix Stripping (for words not fully covered)
- Sequential redundancy rules constrain allowable letter/sound sequences
  - "co-" cannot strip from "corpuscular" because initial "rp" is not allowable
  - "cor-" restricted to roots starting with "r"
- Suffix syntactic compatibility (Fig. 4):
  - Suffix chain must be syntactically compatible
  - Each suffix has a POS it forms and a POS it requires to its left
  - Example: dictatorship = dict + ATE(V) + OR(N) + SHIP(N) — compatible chain
  - Rejection example: scandalousness ≠ scand+al+ous+ness because "-al" forms ADJ, breaking the chain

## 4. Letter-to-Sound Rules

### Architecture
- Two-phase: (1) convert consonants to phonemes, (2) convert vowels with maximal context
- Several hundred rules (developed by Hunnicutt [10])
- Rules apply **within morph boundaries only**
  - "hothouse" — medial "th" is NOT a cluster (it spans morph boundary)
  - "houseboat" — medial "e" is silent only if morph boundary is known

### Key Rule Examples (Fig. 5)

**"table":**
- No affixes stripped
- [t], [b] by direct lookup
- [l] before morph-final [e], preceded by consonant → syllabic [l]
- [a] in context "C-l-e-#" → long/tense /eɪ/ (maple, bible, bugle; exception: triple)
- Final [e] morph-final → silent

**"subversion":**
- Affix strip: sub- and -ion
- [v] → one pronunciation
- [s] before "+i-vowel" and preceded by vowel or [r] → /ʒ/ (palatalization)
- [e] in context "[r]-consonant(not [r])" → /ɜ/

**"science":**
- "-ence" cannot strip (remnant has no syllabic nucleus)
- [sc] morph-initial → not palatalized
- [i] preceding vowel, morph-initial position → /aɪ/

### Robustness
- Can process nonsense words (Jabberwocky's "brillig")
- Recovers from spelling errors: "percieve" → per+cieve → correct pronunciation
- 14 pronunciations of digraph "ea" handled by ordered rule set

## 5. Morphophonemic and Lexical Stress Rules

### Morphophonemic Rules (Fig. 6)
- PLURAL realization: {-es, -s} →
  - /ɪz/ after /s, z, ʃ, ʒ, tʃ, dʒ/ (busses, judges)
  - /s/ after /p, t, k, f, θ/ (cats, giraffes)
  - /z/ elsewhere (dogs, donkeys)
- PAST realization: {-ed} →
  - /ɪd/ after /t, d/ (persuaded, stated)
  - /t/ after /p, k, s, f, θ, ʃ, tʃ/ (walked, laughed)
  - /d/ elsewhere (doomed, measured)
- Palatalization across morpheme boundaries:
  - -ion: aggress+ion → /s/→/ʃ/, /i/ deleted; but rebellion: no change
  - -ure: depart+ure → /t/→/tʃ/; but failure: no change
  - -ary: infirmary /ɛri/ vs. dictionary /ɛri/ (stress-dependent)

### Lexical Stress Rules (Fig. 7)
- Based on Chomsky & Halle 1968 (SPE)
- Bisyllabic rule: stress placement depends on tenseness of final vowel
  - Final vowel [+tense] → stress on final syllable, initial vowel reduced (caprice, regime, parole)
  - Final vowel [-tense] → stress shifts to first syllable (venom, edit, cabin)
- Six classes of suffixes for stress placement:
  - Stress-retaining on suffix: -ee, -eer, -ade, -self (trainee, mountaineer)
  - Stress on pre-suffix vowel: -ic, -ial (humanistic, reverential)
- Vowel color changes computable by rule: "systemate, systematic, systematize" — suffix "-ate" has different pronunciation in each

## 6. Sentence-Level Processing

### Parsing Strategy
- Phrase detection first (local), then clause-level tests (global)
- Advantage: all phrases found even if full parse tree cannot be constructed
- Garden-path sentences affect <5% of corpus sentences
- Parse tree example (Fig. 8): "He insisted that foreigners be placed under the jurisdiction of the Chinese government"
- POS ambiguity resolution: "refuse", "survey", "separate" change stress/phonemes depending on syntactic role

### Functional/Semantic Effects on Prosody
- Surface syntax alone insufficient for correct stress
- Agent vs. place: "walked by the river" vs. "walked by their master" — different stress on PP
- Modal emphasis: "Joe might build the house" — "might" stressed for speaker doubt
- Focus/contrast: "She slapped him in the face and then she hit the man" — stress on "hit" vs. "man" changes meaning
- Halliday's three functional components:
  1. **Ideational**: propositional content
  2. **Interpersonal**: speaker's belief/modality (past-tense modals, negatives, quantifiers get pitch prominence)
  3. **Textual/discourse**: old/new information, focus

## 7. Prosodic Control

### Duration Factors
- Vowel duration controlled by:
  - Intrinsic vowel quality
  - Following consonant or syllable boundary
  - Number of syllables in word
  - Grammatical function (compounding causes severe shortening)
  - Position relative to syntactic breaks
  - Word frequency
- Example: /oʊ/ in "snow" is 2x longer in "heavy snow" vs. "snow plow"
- Consonant duration: initial > final; heavily influenced by clusters (ref: O'Shaughnessy 1974)
- ~25 word-boundary adjustment rules

### F0 Control
- F0 correlated with: vowel tongue height, preceding consonant, breath group contour, syntactic/semantic content, question vs. statement, intonation, glottalization
- Discourse context required: "The farmer was eating the carrot" has different F0 contour when answering "What was the farmer doing?" (Fig. 10 vs. 11)
- Clefting transformation marks focus in pitch contour (Fig. 12)
- Modal items (might, not) receive pitch prominence (Fig. 9)

### Word Boundary Effects
- Vowel-vowel transitions: glottalization or glottal stop when vowels close in tongue height
- Geminate shortening: "bus stop" → two /s/'s shortened
- Stop blocking: "stag party" → first stop unreleased, modified closure
- Word-boundary consonants longer than elsewhere
- Cross-boundary palatalization: "bid you"
- Pauses: before/after relative clauses, when S-V-O temporal order disturbed

## 8. Relevance to Qlatt

This paper is the architectural precursor to Allen et al. 1987 (MITalk), which is already in the collection. Key relevances:

1. **Pipeline architecture**: Qlatt's pipeline (normalize → transcribe → rule phases → assemble track → interpreter) directly descends from this architecture
2. **Klatt synthesizer**: Explicitly shows the Klatt model as the vocal-tract backend (Fig. 1)
3. **Morph decomposition**: The morph-based G2P approach informs dictionary design
4. **Letter-to-sound rules**: The two-phase consonant-then-vowel approach with morph-boundary awareness
5. **Duration rules**: Duration factors (intrinsic vowel, consonant context, grammatical function, syntactic position) are implemented in Qlatt's duration rule phase
6. **Prosodic control**: The functional model (ideational/interpersonal/textual) for F0 contour generation
7. **Word boundary rules**: The ~25 boundary adjustment rules (palatalization, geminate shortening, glottalization) map to Qlatt's postlexical rule phase

## Collection Cross-References

### Already in Collection
- [[Allen_1987_MITalk_TTS]] — the full MITalk book, production implementation of the system described here. Allen 1976 is the theoretical blueprint.
- [[Allen_1977_ModularAudioResponse]] — describes the modular hardware/software architecture for the same MIT TTS system
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — the Klatt synthesizer explicitly shown in Fig. 1 as the vocal-tract backend
- [[OShaughnessy_1976_F0_Prosody]] — O'Shaughnessy 1974 consonant duration data cited as [16]; O'Shaughnessy was Allen's collaborator on F0 contour work
- [[Coker_1973_AutomaticSynthesisOrdinaryEnglish]] — cited as [15], the Bell Labs parallel TTS system compared in this paper

### Cited By (in Collection)
- [[Hertz_1985_DeltaRuleSystem]] — references Allen's MITalk pipeline as competing approach that Delta improves upon
- [[Hertz_1982_SRS_TextToSpeech]] — cites Allen 1976 for MIT approach to unrestricted text synthesis
- [[Carlson_1975_RuleBasedTTS]] — cites Allen 1973 as the MITalk precursor for comparison to KTH approach
- [[Klatt_1979_SpeechPerceptionLexicalAccess]] — cites Allen for text-to-speech architecture

### New Leads (Not Yet in Collection)
- Hunnicutt (1974) — Letter-to-sound rules (several hundred rules), became core of MITalk G2P
- Chomsky & Halle (1968) — SPE lexical stress rules, basis for stress assignment algorithm
- Halliday (1970) — Functional model of language (ideational/interpersonal/textual) for F0 contour theory
- Barnwell (1971) — Segment duration algorithm for reading machine context

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [[Klatt_1976_SegmentalDuration]] — Allen describes duration factors (intrinsic vowel quality, consonant context, grammatical function, syntactic position) that Klatt 1976 later quantifies with specific rules and measurements. Allen provides the theoretical motivation; Klatt provides the implementation parameters.
- [[Coker_1973_AutomaticSynthesisOrdinaryEnglish]] — contemporary Bell Labs TTS system using articulatory rather than formant synthesis, with a complementary vowel duration model (T = K1 + S*(K2 + K3*C)) and 9-level stress scale. Different synthesis backends, similar linguistic pipeline challenges.
- [[Pierrehumbert_1980_EnglishIntonation]] — Allen's functional model of F0 (ideational/interpersonal/textual components) represents an earlier framework for the same phenomenon that Pierrehumbert later formalizes with the autosegmental-metrical approach.
