# Automatic Translation of English Text to Phonetics by Means of Letter-to-Sound Rules

**Authors:** Honey Sue Elovitz, Rodney W. Johnson, Astrid McHugh, John E. Shore
**Year:** 1976
**Venue:** NRL Report 7948, Naval Research Laboratory, Washington, D.C.
**Date:** January 21, 1976
**Pages:** 102

## One-Sentence Summary
Presents 329 letter-to-sound rules achieving 90% frequency-weighted accuracy on English text, using a simple context-sensitive pattern matching system that became the foundation for many later TTS G2P implementations.

## Problem Addressed
Converting unrestricted English text to phonetic transcription without requiring large dictionaries or complex linguistic analysis - enabling real-time text-to-speech synthesis on 1970s minicomputers.

## Key Contributions
1. Complete set of 329 letter-to-sound rules for American English
2. Context pattern notation with 10 special symbols (#, *, ., $, %, &, @, ^, +, :)
3. Quantitative evaluation against 50,000-word Brown Corpus
4. SNOBOL implementation with supporting tools (TRANS, DICT, STAT)
5. IPA-to-Votrax synthesizer translation rules

## Methodology
- Left-to-right scan through text
- First matching rule wins (ordered rules)
- Context-sensitive pattern matching
- No dictionary lookup, pure rule-based
- Iterative rule development against Brown Corpus

## Key Equations

### Rule Format
```
A[B]C=D
```
Where:
- A = left context (what precedes the letter)
- B = letter(s) to translate (in brackets)
- C = right context (what follows the letter)
- D = phonetic output (IPA codes)

**Example:** `C[O]M=/AA/` - O after C and before M produces /AA/ (father sound)

## Parameters

### System Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| Total rules | 329 | English-to-IPA rules in final version |
| Accuracy (freq-weighted) | 90% | On random English text |
| Top 1000 words accuracy | 96.1% | Frequency-weighted |
| Errors per sentence | <2 | Average for ordinary English |
| Version evolution | 182→264→319 | Rules per version |

### Context Pattern Symbols
| Symbol | Meaning | Pattern |
|--------|---------|---------|
| `#` | One or more vowels | `[AEIOUY]+` |
| `*` | One or more consonants | `[BCDFGHJKLMNPQRSTVWXZ]+` |
| `.` | Voiced consonant | `[BDVGJLMNRWZ]` |
| `$` | Consonant + E or I | `[cons][EI]` |
| `%` | Suffix | `(ER\|E\|ES\|ED\|ING\|ELY)` |
| `&` | Sibilant | `(S\|C\|G\|Z\|X\|J\|CH\|SH)` |
| `@` | Non-palatal consonant | `(T\|S\|R\|D\|L\|Z\|N\|J\|TH\|CH\|SH)` |
| `^` | Single consonant | `[BCDFGHJKLMNPQRSTVWXZ]` |
| `+` | Front vowel | `[EIY]` |
| `:` | Zero or more consonants | `[BCDFGHJKLMNPQRSTVWXZ]*` |

### IPA Encoding (Latin letters)
| IPA | Code | Example | IPA | Code | Example |
|-----|------|---------|-----|------|---------|
| i | IY | beet | g | G | goat |
| I | IH | bit | f | F | fault |
| e | EY | gate | v | V | vault |
| E | EH | get | θ | TH | ether |
| æ | AE | fat | ð | DH | either |
| a | AA | father | s | S | sue |
| O | AO | lawn | z | Z | zoo |
| o | OW | lone | ʃ | SH | leash |
| U | UH | full | ʒ | ZH | leisure |
| u | UW | fool | h | HH | how |
| ɝ | ER | murder | m | M | sum |
| ə | AX | about | n | N | sun |
| ʌ | AH | but | ŋ | NX | sung |
| aI | AY | hide | l | L | laugh |
| aU | AW | how | w | W | wear |
| OI | OY | toy | j | Y | young |
| p | P | pack | r | R | rate |
| b | B | back | tʃ | CH | char |
| t | T | time | dʒ | JH | jar |
| d | D | dime | hw | WH | where |
| k | K | coat | | | |

## Implementation Details

### Translation Algorithm
1. Insert blank before first character to delimit word
2. Start scan at first character
3. For current character, search rules for that letter in order
4. Check if left context matches text before pointer
5. Check if right context matches text after bracketed portion
6. If match: output phoneme(s), advance past bracketed characters
7. Continue until end of word (blank encountered)

### Rule Categories by Letter
| Letter | Rules | Letter | Rules | Letter | Rules |
|--------|-------|--------|-------|--------|-------|
| A | 32 | J | 1 | S | 24 |
| B | 6 | K | 2 | T | 27 |
| C | 11 | L | 5 | U | 17 |
| D | 10 | M | 2 | V | 2 |
| E | 35 | N | 8 | W | 13 |
| F | 2 | O | 45 | X | 1 |
| G | 10 | P | 5 | Y | 11 |
| H | 6 | Q | 3 | Z | 1 |
| I | 28 | R | 2 | Numbers | 10 |

### Complete Rule Sets (Key Examples)

**A Rules (32 rules):**
```
[A] =/AX/           # default (schwa)
 [ARE] =/AA R/      # word "are"
[AR]#=/EH R/        # AR before vowel
[AW]=/AO/           # AW digraph
[A]^+#=/EY/         # A before cons+front vowel+vowel
[AI]=/EY/           # AI digraph
[AY]=/EY/           # AY digraph
[AU]=/AO/           # AU digraph
[ALK]=/AO K/        # ALK as in "walk"
[A]=/AE/            # default A
```

**E Rules (35 rules):**
```
#:[E] =/ /          # silent final E after vowel
 :[E]=/IY/          # E as only vowel in word
#[ED] =/D/          # past tense after vowel
[ER]=/ER/           # ER default
@[EW]=/UW/          # EW after @-consonants
[EW]=/Y UW/         # EW default
[EE]=/IY/           # EE digraph
[EA]=/IY/           # EA default
[EIGH]=/EY/         # EIGH
[E]=/EH/            # default E
```

**Common Words:**
```
 [THE] =/DH AX/     # "the"
 [TO] =/T UW/       # "to"
 [OF] =/AX V/       # "of"
 [ONE]=/W AH N/     # "one"
 [WERE]=/W ER/      # "were"
```

**Numbers:**
```
[0]=/Z IH R OW/
[1]=/W AH N/
[2]=/T UW/
[3]=/TH R IY/
[4]=/F OW R/
[5]=/F AY V/
[6]=/S IH K S/
[7]=/S EH V AX N/
[8]=/EY T/
[9]=/N AY N/
```

## Figures of Interest
- **Figure 1 (p. 9)**: NRL speech lab system diagram
- **Table 1 (p. 8)**: Latin-letter IPA representation
- **Table 2 (p. 9)**: Special symbol definitions
- **Tables 3-5 (pp. 13-14)**: Accuracy by word frequency and version
- **Tables 6-8 (pp. 15-41)**: Complete rule statistics from Brown Corpus
- **Figure A1 (p. 46)**: Sample TRANS program dialog
- **Figure B1 (p. 91)**: DICT program rule testing example

## Results Summary

### Accuracy by Word Frequency
| Sample | % Correct | Freq-Weighted % |
|--------|-----------|-----------------|
| Top 1000 | 86.8% | 96.1% |
| 2nd 1000 | 83.0% | 83.4% |
| 3rd 1000 | 76.5% | 76.5% |
| 4th 1000 | 76.6% | 76.6% |
| 5th 1000 | 72.8% | 72.9% |
| Tail (rare) | 65.0% | 65.6% |

### Version Evolution
| Version | Rules | % Correct | Freq-Weighted % |
|---------|-------|-----------|-----------------|
| 1 | 182 | 43.9% | 68.1% |
| 2 | 264 | 70.4% | 87.7% |
| 3 | 319 | 86.8% | 96.1% |

### Most Frequently Matched Rules
1. `[T]=/T/` - 183,179 word frequencies (6.37%)
2. `[N]=/N/` - 170,584 word frequencies (5.94%)
3. `[I]=/IH/` - 128,923 word frequencies (4.49%)
4. `[A]=/AE/` - 118,519 word frequencies (4.12%)
5. `[S]=/S/` - 104,475 word frequencies (3.64%)

### Comparison with Other Systems
| System | Rules | Dictionary | Accuracy |
|--------|-------|------------|----------|
| MIT | ~400 | 11,000 words | Not published |
| Keele (Ainsworth) | ~100 | None | 89-92% |
| Bell (McIlroy) | 750+ | 100 words | 97% top 2000 |
| NRL (this paper) | 329 | None | 90% freq-weighted |

## Limitations
1. No stress assignment (produces "flat monotone")
2. Proper nouns and foreign words problematic
3. Homographs not distinguished (READ, LEAD)
4. No morphological analysis
5. Rare words have lower accuracy (~65%)
6. Single speaker orientation (no dialect variation)

## Relevance to Qlatt Project
- **Direct application**: Rule format directly adaptable to JavaScript
- **Pattern symbols**: Can implement as regex or custom matcher
- **IPA encoding**: Use same two-letter codes for phoneme representation
- **Rule ordering**: First-match-wins strategy simple to implement
- **Testing tool**: DICT concept valuable - test rules against word list
- **Baseline**: Establishes 90% accuracy as benchmark

## JavaScript Implementation Pattern
```javascript
const PATTERNS = {
  '#': /[AEIOUY]+/,
  '*': /[BCDFGHJKLMNPQRSTVWXZ]+/,
  '.': /[BDVGJLMNRWZ]/,
  '$': /[BCDFGHJKLMNPQRSTVWXZ][EI]/,
  '%': /(ER|E|ES|ED|ING|ELY)/,
  '&': /(CH|SH|[SCGZXJ])/,
  '@': /(TH|CH|SH|[TSRDLZNJ])/,
  '^': /[BCDFGHJKLMNPQRSTVWXZ]/,
  '+': /[EIY]/,
  ':': /[BCDFGHJKLMNPQRSTVWXZ]*/
};
```

## Open Questions
- [ ] How to handle stress assignment (paper notes this as major limitation)
- [ ] Rule priority when multiple rules could match?
- [ ] Optimal exception dictionary size vs rule complexity tradeoff?
- [ ] How do NRL rules compare to MITalk rules for same words?

## Related Work Worth Reading
- Ainsworth (1973) - Keele LTS rules (British English)
- McIlroy (1973) - Bell Labs LTS rules (750+ rules, higher accuracy)
- Allen, Hunnicutt & Klatt (1987) - MITalk system (full TTS with morphology)
- Klatt (1987) - Review of text-to-speech conversion for English
- Hunnicutt (1976) - Phonological rules for speech synthesis **[IN PAPERS FOLDER]**
