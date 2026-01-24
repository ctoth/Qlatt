# The Kestrel TTS Text Normalization System

**Authors:** Peter Ebden, Richard Sproat
**Year:** 2014 (published online December 2014, journal March 2015)
**Venue:** Natural Language Engineering, Cambridge University Press
**DOI:** 10.1017/S1351324914000175

## One-Sentence Summary

Describes Google's production text normalization system using weighted finite-state transducers (WFSTs) with a novel two-phase architecture separating tokenization/classification from verbalization via protocol buffers.

## Problem Addressed

Text normalization for TTS must handle "non-standard words" (NSWs) like numbers, dates, currency, abbreviations - expressions that cannot be pronounced using standard dictionary lookup. Errors are immediately noticeable regardless of voice quality. Previous FST-based systems had limitations handling reordering (e.g., "$200" → "two hundred dollars") efficiently.

## Key Contributions

- Two-phase architecture separating **tokenization/classification** from **verbalization**
- Use of **protocol buffers** as intermediate representation between phases
- Automatic reordering via protocol buffer serialization permutations
- Support for 19+ languages with shared universal rules
- Deployed on hundreds of millions of Android devices (~800KB footprint)
- **Thrax** grammar development toolkit (open-sourced at OpenFst)

## Architecture

### Phase 1: Tokenization and Classification

Input text → tokenized → each token classified as:
1. Ordinary word
2. Semiotic class (currency, date, time, measure, number types, telephone, electronic address)
3. Punctuation
4. Unknown character

Output: Serialized protocol buffer representation

### Phase 2: Verbalization

Protocol buffers → reserialized with **all possible field orderings** → verbalization grammar selects correct order for target language.

**Key insight:** Protocol buffers have no inherent ordering. During verbalization, Kestrel produces a lattice of all permutations. The grammar matches only valid orderings for the language.

Example:
```
Input: $50
Classified as: money { currency: "usd" amount { integer_part: "50" } }
Verbalization input permutations include:
  - money { currency: "usd" amount { integer_part: "50" } }
  - money { amount { integer_part: "50" } currency: "usd" }  ← English grammar matches this
Output: "fifty dollars"
```

### Semiotic Classes Recognized

| Class | Fields |
|-------|--------|
| Money | currency, amount (integer_part, fractional_part), quantity |
| Time | hours, minutes, seconds, period (AM/PM) |
| Date | day, month, year, style |
| Telephone | country_code, number_part[], extension |
| Measure | unit, amount |
| Cardinal | integer_part |
| Ordinal | integer_part |
| Decimal | integer_part, fractional_part |
| Fraction | numerator, denominator, integer (for mixed) |
| Electronic | URL, email components |

## Algorithm

### Overall Pipeline

1. **Input text** received (raw, partly normalized, or fully structured)
2. **Tokenize** using WFST composition with lexical analysis transducer
3. **Classify** tokens into semiotic classes, output protocol buffer serialization
4. **Parse** serialization into protocol buffer objects
5. **Reserialize** with all field orderings (lattice)
6. **Verbalize** by composing with language-specific verbalization grammar
7. **Output** normalized word sequence

### Lexical Analysis Transducer Construction

$$
\left(\bigcup_{l \in \mathcal{L}} l\mathcal{S}\right)^*
$$

Where:
- $\mathcal{L}$ = set of lexical class transducers (numbers, dates, words, etc.)
- $\mathcal{S}$ = space/separator model for the language
- $^*$ = transitive closure (Kleene star)

### Number Factorization

Numbers are factored into sums of products of powers of ten:
$$
123 = 1 \times 10^2 + 2 \times 10^1 + 3
$$

This is handled in code (language-independent), then language-specific grammar converts to number names.

## Implementation Details

### Thrax Grammar Syntax

Grammars use regular expression syntax with:
- **Mappings:** `("input" : "output")`
- **Union:** `|`
- **Concatenation:** implicit
- **Weights:** `<weight>` (negative = preferred in Tropical semiring)
- **Composition:** `@`
- **Context-dependent rewrite:** `CDRewrite[target, left, right, sigma*]`

### Example: English Fraction Verbalization

```thrax
# Special denominators
denominator_plural =
    ("1" : "over one" <-1>)
  | ("2" : "halves" <-1>)
  | ("4" : "quarters" <-1>)
  | o.ORDINAL_PLURAL;

# Singular fractions use "a" not "one"
singular = Optimize[
  markup.fraction_numerator
  c.MINUS? ("1" : "a_determiner")
  markup.fraction_denominator util.ins_space
  denominator
  util.del_space_star
];

# Mixed fractions: "three and a half"
composite = Optimize[
  markup.fraction_integer
  c.CARDINAL ("" : " and ")
  ((singular<-1>) | plural)
];

# Fix "a eighth" → "an eighth"
a_to_an = CDRewrite["a_determiner" : "an", "", " " util.VOWELS, sigma*];
```

### Russian Morphological Agreement

For inflected languages, grammars produce all possible forms with morphosyntactic features. A separate **grad-boost tagger** selects correct form based on context.

```thrax
god = "year" @ nouns;  # Maps to all Russian inflections
god_masgen = g.F[god, "__MAS,GEN"];  # Masculine genitive

year_gen = Optimize[
  (((year_num g.I[" __MAS,GEN"]) @ o_number) g.I[" " god_masgen])
];
```

### REDUP Mechanism for Copying

FSTs cannot efficiently handle arbitrary copying. Kestrel provides special `REDUP` rule:
- If grammar defines `REDUP` and token matches, token is duplicated in code
- Both original and duplicated versions enter verbalization lattice

**Use cases:**
- Indonesian morphological reduplication: `orang2` → `orang orang`
- Currency splitting: Split `$1.20` into major (`$1`) and minor (`20 cents`) for verbalization

### Structured Input API

Applications can bypass classification by providing pre-structured protocol buffers:
```
money { currency: "usd" amount { integer_part: "10" } }
text: "equals"
money { currency: "myr" amount { integer_part: "33" fractional_part: "08" } }
```

### Style Preservation

To maintain fidelity to original text form:
- **style field:** Encodes how expression was written
- **preserve_order field:** Boolean to maintain original element order
- **String fields:** Allow passing normalized names (e.g., month names) instead of just integers

## Parameters

| Parameter | Purpose | Notes |
|-----------|---------|-------|
| `style` | Encodes original text format | Used for date verbalization choices |
| `preserve_order` | Maintain original field order | Distinguishes "9 Feb" from "Feb 9" |
| `phrase_break` | Punctuation induces break | Boolean (acknowledged as insufficient) |
| `quantity` | Non-digit number portion | e.g., "k" in "$50k" → 1000 |

## Deployment Specifications

| Deployment | Size Limit | Notes |
|------------|------------|-------|
| Android compact voices | ~800KB for text norm | ~4MB total voice pack |
| High-quality Android | Relaxed | Downloaded separately |
| Server-side | No practical limit | Millions of queries/day |

### Performance Optimizations

1. **Look-ahead filter** (Allauzen, Riley & Schalkwyk 2011): Prunes invalid intermediate states during non-deterministic tokenization
2. **Grammar optimization:** Disallow spurious tokenizations (e.g., "hello" as "hel" + "lo")
3. **FST compaction:** ~10x size reduction vs standard VectorFst serialization

## Evaluation Results

### English (91.3% overall)

| Category | Accuracy |
|----------|----------|
| Cardinal | 100% |
| Date | 100% |
| Decimal | 100% |
| Fraction | 100% |
| Money | 100% |
| Ordinal | 100% |
| Electronic | 100% |
| Telephone | 94.1% |
| Measure | 90.8% |
| Roman numeral | 86.8% |
| Time | 71.5% |
| Driving directions | 65.6% |

### Russian (93.1% overall)

Notable: 100% on morphosyntactic homograph disambiguation (using external tagger).

## Limitations

- **Driving directions:** Hardest category due to ambiguous abbreviations (N = North vs Newton)
- **Time expressions:** Relatively low accuracy (71.5% English)
- **No public evaluation data:** Cannot compare directly to other systems
- **Pure semiotic class assumption breaks down:** Written form often constrains valid verbalizations
- **Phrase break prediction:** Out of scope; boolean field acknowledged as insufficient
- **Word segmentation:** Requires external preprocessor for Chinese, Japanese, Thai

## Relevance to TTS Systems

### Direct Applications

1. **Text normalization module:** Core frontend component for any TTS system
2. **Number verbalization:** Reusable grammars for 50+ languages (used in both TTS and ASR)
3. **Abbreviation expansion:** Context-dependent expansion with "do no harm" principle
4. **Morphological agreement:** Framework for handling inflected languages

### Architectural Lessons

1. **Separation of concerns:** Tokenize/classify vs verbalize enables reordering without FST explosion
2. **Protocol buffers as interchange:** Language-independent intermediate representation
3. **Lattice-based ambiguity:** Let grammar select from permutations rather than hard-coding order
4. **Weights for preference:** Use Tropical semiring weights to prefer specific analyses

### For Qlatt Implementation

- Consider similar two-phase architecture if handling complex NSWs
- Protocol buffer-style intermediate format could simplify multi-language support
- Number verbalization factorization approach is reusable
- REDUP mechanism pattern for handling non-regular operations

## Open Questions

- [ ] How does morphosyntactic tagger integrate with verbalization? (grad-boost algorithm mentioned but not detailed)
- [ ] What specific features used for homograph disambiguation?
- [ ] How are ambiguous abbreviations like "St" (Saint vs Street) resolved?
- [ ] Details of "Warbler" experimental system with tighter classification-verbalization integration?

## Related Work Worth Reading

- **Allen et al. 1987** - MITalk system (DECOMP lexical analysis)
- **Sproat 1996** - Bell Labs multilingual TTS (first systematic FST use)
- **Sproat et al. 2001** - NSW normalization taxonomy
- **Taylor 2009** - Text to Speech Synthesis (semiotic classes term origin)
- **Kaplan & Kay 1994** - WFST compilation algorithms
- **Mohri & Sproat 1996** - Efficient weighted rewrite rule compiler
- **Roark & Sproat 2014** - "Hippocratic" abbreviation expansion (high precision approach)
- **Thrax toolkit** - http://openfst.cs.nyu.edu/twiki/bin/view/GRM/Thrax

## Languages Supported (as of 2014)

Cantonese, Danish, Dutch, English, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Mandarin, Polish, Portuguese, Russian, Spanish, Swedish, Turkish, Thai

## Key Terminology

| Term | Definition |
|------|------------|
| **NSW** | Non-Standard Word - tokens not in dictionary (numbers, abbreviations, etc.) |
| **Semiotic class** | Language-independent expression type (date, currency, measure) |
| **Verbalization** | Converting semiotic class to speakable word sequence |
| **Tropical semiring** | Weight algebra where lower = better (used for preferences) |
| **WFST** | Weighted Finite-State Transducer |
