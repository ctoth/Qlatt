# Phonological Rules for a Text-to-Speech System

**Authors:** Sharon Hunnicutt
**Year:** 1976
**Venue:** American Journal of Computational Linguistics, Microfiche 57
**Affiliation:** Natural Language Processing Group, Research Laboratory of Electronics, MIT

## One-Sentence Summary

Complete specification of MIT's letter-to-sound and stress placement algorithms using ordered phonological rules with suffix/prefix classification for handling unknown words.

## Problem Addressed

Converting unrestricted English text to phonemes when words are not in the lexicon - the "fallback" system for morphological decomposition failures.

## Key Contributions

1. Three-stage letter-to-sound conversion architecture (suffix/prefix stripping, consonant conversion, vowel conversion)
2. Cyclic stress placement algorithm with suffix classification
3. Empirical validation showing 67-72% accuracy on Brown Corpus
4. Complete rule set specification (413 rules) with formal notation

## System Architecture

Two-phase phonological model:
1. **Letter-to-phoneme rules**: Convert letters to phonemes
2. **Stress placement algorithm**: Assign stress contour

### Letter-to-Sound (Three Stages)

| Stage | Operation | Direction |
|-------|-----------|-----------|
| 1 | Recognize/isolate prefixes and suffixes | right-to-left (suffixes), left-to-right (prefixes) |
| 2 | Convert consonants in root | left-to-right |
| 3 | Convert vowels and affixes | left-to-right |

### Rule Ordering Principles
- Longer strings before shorter strings
- Specific context before general context
- Consonants converted before vowels (less context-dependent)
- Converted phonemes can serve as context for subsequent rules

## Key Equations

### Main Stress Rule (cyclic)
$$V \rightarrow [1 \text{ stress}] / [X\_\_C_0 ( (\{W/V\}) \{[-\text{long}]V/V\} C_0 ) ]$$

Algorithmic order:
1. If final syllable is only syllable OR has long vowel + consonant(s) → stress final
2. Else if only two syllables OR penult ends in >1 consonant OR has long vowel → stress penult
3. Else → stress antepenult

### Stressed Syllable Rule (cyclic)
$$V \rightarrow [1 \text{ stress}] / [X\_\_C_0 (( (\{W/V\}) VC_0) [V/1 \text{ stress}] ) Y]$$

### Alternating Stress Rule (cyclic)
$$V \rightarrow [1 \text{ stress}] / [X\_\_C_0 (V) VC_0 [V/1 \text{ stress}] C_0 ]$$

### Destressing Rule (non-cyclic)
$$V \rightarrow [-\text{long}/-\text{stress}] / [C_0 (VC_0X)_a [(-\text{long})]_b C [V/+\text{stress}] Y ]$$

### Vowel Reduction Rules (non-cyclic)
$$\{/i/, /e/\} [-\text{stress}] \rightarrow /\text{barred-i}/ / X\_\_Y$$
$$[V/-\text{long}/-\text{stress}] \rightarrow /\text{schwa}/ / X\_\_Y$$

## Parameters

### Suffix Classification for Stress

| Category | Effect | Examples |
|----------|--------|----------|
| Stress-forcing | Force stress on final/penult | -EE, -EER, -ESQUE, -ETTE, -OON, -IC, -IFIC, -ITION |
| Non-stress-affecting | Cycle skipped | -ABLE, -AGE, -ED, -ER, -FUL, -ING, -LY, -MENT, -NESS |

### System Statistics

| Metric | Value |
|--------|-------|
| Current rule set | 413 rules |
| Consonant rules | 127 |
| Prefix rules | 46 (40 prefixes) |
| Suffix rules | 155 (96 suffixes) |
| Vowel rules | 206 |
| Brown Corpus accuracy | 67% |
| Heritage accuracy | 72% |

### Phoneme Symbol Mappings

| Symbol | IPA | Example |
|--------|-----|---------|
| E | i | beat |
| ^I | I | bit |
| A | ey | bait |
| ^E | E | bet |
| "A | ae | bat |
| 'A | a | father |
| ^O | open-o | bought |
| O | o | boat |
| ^U | U | put |
| U | u | boot |
| Y | schwa | but |
| ^S | S | ship |
| ^Z | Z | measure |
| ^C | tS | church |
| ^J | dZ | judge |

## Implementation Details

### Rule Format
```
S1 > S2 / S3 <- S4
```
- S1: letter string to convert
- S2: phoneme string result
- S3: left context
- S4: right context

### Context Markers

| Char | Left Context | Right Context |
|------|--------------|---------------|
| ] | letter | letter |
| [ | phoneme | letter |
| ) | letter | phoneme |
| ( | phoneme | phoneme |

### Palatalization Rules

**/t/ → /ch/** if:
- Not in initial consonant cluster AND
- Precedes unstressed /u/ or /U/, OR
- Precedes unstressed schwa that was /u/ before stress rules

**/d/ → /j/** under same conditions

Example: perpetuity /t/ vs perpetual /ch/

### Vowel Lengthening Contexts
- Pre-vocalic position (before another vowel)
- Followed by [Cle#] where C is neither [r] nor [l] (maple, bible, ogle, bugle)
- Exceptions: treble, triple (where [e] is part of digraph)

### Silent Letter Rules
- [bt] and [mb]: [b] is silent
- Morph-initial [pt], [pm], [ps]: [p] is silent
- [r] is syllabic if preceded by consonant (not [r]) and followed by morph-final [e] or [+s], [+ed]

### High-Frequency Exceptions (require lexicon)
- said, should, would, could
- two, do, to
- break, steak
- of, corps
- have, behave, shave, one, some, come

## Worked Example: MULTINUCLEOLATED

```
Input: MULTINUCLEOLATED
1. Morpheme parse: MULTI=NUCLEOL+ATE+ED
2. Letter-to-phoneme: mAlti=nukliol+et+Id
3. Main Stress Rule cycle 1 (domain: multi=nukliol)
4. Stressed Syllable Rule cycle 1
5. Alternating Stress Rule cycle 1
6. Main Stress Rule cycle 2 (domain: +et added)
7. Stressed Syllable Rule cycle 2
8. Alternating Stress Rule cycle 2
9. Strong First Syllable Rule: assigns 2-stress to first syllable
10. Destressing Rule: removes stress, shortens vowels
11. Compound Stress Rule: primary -> secondary
12. Vowel Reduction: unstressed -> schwa/I-bar
Final: m^ltinukli^letId (stress: 2-1-2)
```

## Mispronunciation Categories

1. Single vowel: international /e/, menu /u/
2. Vowel digraph: said /e/, break /i/
3. Single consonant: of /f/, eager /J/
4. Consonant cluster: chef /c/, laugh /-/
5. Incorrect suffix recognition: water, heated
6. Incorrect prefix recognition: unit, cool, deem
7. Non-recognition of prefix: apart, refer
8. Incorrect stress: motel, palette, sonata

## Limitations

- ~33% error rate on general text without lexicon
- Medical/technical terms only 53% without specialized prefixes
- Requires morph lexicon for common irregular words
- Some suffix/prefix patterns ambiguous (water, heated)

## Relevance to Qlatt

1. **Rule ordering**: Three-stage approach matches typical G2P pipeline
2. **Suffix handling**: Extensive classification for stress - verify current implementation
3. **Palatalization**: /t/→/ch/, /d/→/j/ before unstressed /u/ - add to rules
4. **Vowel reduction**: /E/, /I/ → barred-i; others → schwa
5. **Cyclic stress**: Well-defined algorithm for implementation

## Open Questions

- [ ] How does current tts-frontend-rules.js handle suffix-dependent stress?
- [ ] Is palatalization of /t/ and /d/ implemented?
- [ ] Does vowel reduction distinguish /E/, /I/ from other vowels?

## Related Work Worth Reading

- Chomsky & Halle (1968) - Sound Pattern of English (theoretical foundation)
- Klatt (1976) - Linguistic uses of segmental duration
- Allen (1976) - MIT TTS system overview
