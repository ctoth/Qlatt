---
title: "From Text to Speech with SRS"
authors: "Susan R. Hertz"
year: 1982
venue: "Journal of the Acoustical Society of America, Vol. 72(4), pp. 1155-1170"
doi_url: "0001-4966/82/101155-16$00.80"
---

# From Text to Speech with SRS

## One-Sentence Summary

SRS (Speech Research System) provides a four-level rule framework (text-modification → conversion → feature-modification → parameter rules) for developing text-to-speech systems in any language, with explicit rule syntax designed for linguists.

## Problem Addressed

Early TTS systems had rules "buried in computer programs in the form of tables and code" making them language-specific and difficult to modify. SRS provides a language-independent rule framework with explicit, user-definable rules that nonprogrammers (linguists) can write and modify.

## Key Contributions

1. **Four-level rule framework** that separates concerns:
   - Text-modification rules (morphological analysis, stress marking)
   - Conversion rules (grapheme-to-phoneme)
   - Feature-modification rules (allophonic rules, stress assignment)
   - Parameter rules (synthesizer control)

2. **User-oriented design** with rule syntax familiar to linguists (similar to generative phonology notation)

3. **Powerful notational devices**:
   - Angled brackets `-(...)` for exceptions
   - At-sign `@` for referring to phonetic output of earlier rules
   - Dollar sign `$` for placeholder values in parameter rules
   - User-defined contours for arbitrary parameter shapes

4. **Multi-language development** demonstrating cross-linguistic synthesis universals

## Methodology

### Four-Level Rule Framework

```
TEXT STRING
    ↓ Text-Modification Rules
MODIFIED TEXT STRING
    ↓ Conversion Rules
PHONETIC STRING AND FEATURES
    ↓ Feature-Modification Rules
MODIFIED FEATURES
    ↓ Parameter Rules
SYNTHESIZER PARAMETER VALUES
```

### Rule Application Strategies

| Rule Type | Application Method |
|-----------|-------------------|
| Text rules | Each rule tested L→R through entire string, one pass per rule |
| Conversion rules | Single pass (or few passes); disjunctively ordered subsets by first character |
| Feature rules | Each rule tested L→R, one pass per rule (like text rules) |
| Parameter rules | Each rule tested in succession; rules can interact/modify earlier assignments |

## Key Equations

No explicit mathematical equations, but important rule notations:

### Text-Modification Rule Syntax
```
∅ → e+. / [voc][con]([con]) _ {ed|ing}+
```
(Insert `e+.` after a vowel followed by 1-2 consonants, before -ed or -ing suffix)

### Conversion Rule Syntax
```
c → [s] / _ {e|i|y}
a → [e] / _ @[con]e+
```
(The `@` refers to phonetic output of earlier rules, not text characters)

### Feature-Modification Rule Syntax
```
[-st.1 -st.2 voc] → [st.3] / +([con]([con]([con]))) _
```
(Assign highest stress to vowel in morpheme-initial syllable)

### Parameter Rule Syntax
```
[st.3 voc] AV → _ (.20,30) _ (.80,25) _
[-voic] AV → (.0,0) _ (.99,0)
```
(Underscores represent linear transitions between targets)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Voicing Amplitude | AV | dB | - | 0-30 | Controls voicing source |
| Aspiration Amplitude | AH | dB | - | 0-30+ | For aspirated stops |
| Formant 1 | F1 | Hz | - | - | First formant frequency |
| Formant 2 | F2 | Hz | - | - | Second formant frequency |
| Formant 3 | F3 | Hz | - | - | Third formant frequency |
| Duration | DU | ms | - | - | Segment duration |

### Feature System

**Binary features**: Represented by name alone (e.g., `[voic]` for ±voiced)

**N-ary features**: Name followed by dot and number of values (e.g., `[st.3]` for 3 degrees of stress)

### Symbol Types

| Type | Definition | Example |
|------|------------|---------|
| SEGMENT | Feature bundle for phoneme | `p = (SEGMENT) con stop lab` |
| PRECEDE | Adds features to preceding segment | `'3 = (PRECEDE) st.3` |
| FOLLOW | Adds features to following segment | `> = (FOLLOW) peak` |
| TEXTCHAR | Text character with optional features | `p = (TEXTCHAR) let con` |
| Marker | No features, boundary markers | `+` for morpheme boundary |

## Implementation Details

### System Architecture
- **Platform**: PDP 11/40 under DEC RT-11
- **Synthesizer**: OVE IIId terminal analog synthesizer (also software synth, Klatt synth)
- **Size**: ~140 routines, ~15,000 lines of FORTRAN code
- **Memory**: Heavily overlaid to run in ~25K 16-bit words (would need ~120K uncompressed)

### Data Structures

**Workspace**: Contains symbol definitions, feature names, utterance representation, control parameters

**Control Parameters**:
- TRF (Text Rule File number)
- CRF (Conversion Rule File number)
- FRF (Feature Rule File number)
- PRF (Parameter Rule File number)
- APF (Acoustic Parameter File number)
- CD (Contour Dictionary number)
- NREP (Number of repetitions for playback)

### Rule Application Procedure

1. **Text rules**: Applied sequentially, each rule tested L→R across entire string
2. **Conversion rules**:
   - Grouped by first character for efficiency
   - Disjunctively ordered (first matching rule wins)
   - Can specify multiple passes (e.g., consonants first, then vowels)
3. **Feature rules**: Like text rules, sequential application
4. **Parameter rules**:
   - Duration rules can stack (multiplicative percentages)
   - Target/contour rules can overwrite, add, or delete portions

### User-Defined Contours

Contours defined as 9 numbers from -100 to +100:
```
trv = 0 100 100 50 80 80 30 50 0
```
- Values represent percentage deviation from straight line between targets
- Automatically expanded/compressed to fit segment duration
- First and last values must be 0 (coincide with target values)

### Acoustic Parameter File Structure

Organized by segments, each containing frames with parameter values:
```
SEGMENT 1 (100 MS): k
FR  AV  AH  F1    F2    F3   DU
1   0   0   504   1307  1796  6
2   0   0   504   1307  1796  6
...
17  0   20  476   1099  1796  4
```

## Figures of Interest

- **Fig 1 (p. 1156)**: Overview of four-level rule framework flowchart
- **Fig 2 (p. 1156)**: Sample rules and example of their application to "pacing"
- **Fig 3 (p. 1161)**: Application of duration modifying rules showing percentage-based lengthening
- **Fig 4 (p. 1163)**: User-defined contour "trv" for Spanish trill voicing pattern

## Results Summary

- Successfully used for instruction in acoustic phonetics courses at Cornell
- Developed rules for English, German, Dutch, Spanish, and Japanese
- Students with no prior computer or acoustic phonetics knowledge became comfortable writing rules within 1-2 weeks
- Japanese TTS developed in 2 months produced "intelligible and often quite natural-sounding speech"
- Discovery of cross-linguistic synthesis universals (target placement predictable from manner class, duration, context)

## Limitations

1. **No syntactic parsing**: Cannot write rules for parsing sentences into syntactic/semantic units; natural intonation requires manual annotation
2. **Homograph disambiguation**: Spellings with multiple pronunciations (e.g., "present") require manual annotation
3. **Rule application constraints**: Cannot apply rules cyclically, right-to-left, or express certain disjunctive relationships
4. **Parameter rule limits**:
   - Maximum 2 targets per segment
   - Contours cannot span more than 3 segments
   - Cannot reference acoustic parameter values directly in rule contexts

## Relevance to Project

**High relevance to Qlatt TTS frontend:**

1. **Rule architecture insight**: The four-level framework directly maps to Qlatt's pipeline:
   - Text rules → `tts-frontend.js` text normalization
   - Conversion rules → G2P/pronunciation lookup
   - Feature rules → Phoneme feature assignment
   - Parameter rules → Track generation with CEL expressions in `semantics.yaml`

2. **Parameter rule concepts applicable to semantics.yaml**:
   - Target positions as percentages (`.20`, `.80`)
   - Linear transitions between targets (underscore notation)
   - Dollar sign placeholder concept similar to CEL expression variable references
   - Duration modification by percentage

3. **Feature system design**: The binary/n-ary feature distinction and prosody symbol concept could inform phoneme representation

4. **Cross-linguistic universals**: Target placement predictability from manner class could simplify parameter rules

## Open Questions

- [ ] How does the angled bracket exception notation compare to modern approaches?
- [ ] Could the contour definition system (9-point percentage deviation) be useful for prosody?
- [ ] What were the "cross-linguistic synthesis universals" discovered? (Referenced Hertz 1980)
- [ ] How did the Japanese rules achieve such rapid development?

## Related Work Worth Reading

- **Hertz (1979a)** - "Appropriateness of different rule types in speech synthesis" - Speech Communication Papers
- **Hertz (1979b)** - Ph.D. dissertation on interactive speech synthesis system (more details on contours, rule language)
- **Hertz (1980)** - "Multi-language speech synthesis: A search for synthesis universals" - JASA Suppl.
- **Hertz (1981)** - "SRS text-to-phoneme rules: A three-level rule strategy" - IEEE ASSP
- **Carlson & Granström (1976)** - "A text-to-speech system based entirely on rules" - IEEE ASSP (parallel development in Sweden)
- **Klatt (1980)** - "Software for a cascade/parallel formant synthesizer" - JASA (the Klatt synthesizer paper)
- **Fujimura (1979)** - "An analysis of English syllables as cores and affixes" - demisyllable approach
- **Lovins et al. (1979)** - "A demisyllable inventory for speech synthesis" - alternative to phoneme-based synthesis

---

## Collection Cross-References

### Already in Collection
- [[Allen_1987_MITalk_TTS]] -- MITalk system; competing TTS approach that SRS improves upon
- [[Carlson_1979_VowelPerceptionSalience]]
- [[Elovitz_1976_NRL_LTS]] -- NRL letter-to-sound rules; foundational G2P approach that SRS extends
- [[Klatt_1979_SpeechPerceptionLexicalAccess]]
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] -- the Klatt synthesizer driven by SRS parameter rules
- [[Rabiner_1968_DigitalFormantSynthesizer]]
- [[Rabiner_1968_SynthesisByRule]]

### Cited By (in Collection)
- [[Carlson_1979_VowelPerceptionSalience]] -- references SRS as a TTS rule system
- [[Hertz_1985_DeltaRuleSystem]] -- SRS is the predecessor system that Delta improves upon
- [[Hertz_1987_DeltaNonLinearPhonology]] -- references SRS for the linear representation limitations
- [[Hertz_1991_StreamsPhonesTransitions]] -- references SRS as part of the Hertz synthesis lineage
- [[Hertz_1999_ETI-Eloquence_MultiLanguage]] -- references SRS as predecessor to ETI-Eloquence

### New Leads (Not Yet in Collection)
- **Hertz (1979b)** - Ph.D. dissertation - Contains more detailed information about the SRS rule language, contour definition system, and implementation details not fully covered in this JASA paper.
- **Carlson & Granström (1976)** - "A text-to-speech system based entirely on rules" - Parallel development of rule-based TTS in Sweden, useful for comparing approaches to the same problem.
- **Lovins, Macchi & Fujimura (1979)** - "A demisyllable inventory for speech synthesis" - Alternative to phoneme-based synthesis that might inform coarticulation modeling.

### Now in Collection (previously listed as leads)
- [[Allen_1973_SpeechSynthesisUnrestrictedText]] — Allen 1976 describes the MIT TTS pipeline with morph-based G2P (12,000-entry lexicon from Brown Corpus), SPE-based lexical stress, and Klatt synthesizer backend. SRS's rule-based approach improves on MITalk's morph dictionary strategy by using generalized phonological rules instead of stored pronunciations.

### Conceptual Links (not citation-based)
- [[Klatt_1987_TTS_Review]] -- Moderate. Klatt's review surveys TTS systems including SRS, placing it in context of the field's development from rule-based to concatenative approaches.
