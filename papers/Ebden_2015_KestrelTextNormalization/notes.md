# The Kestrel TTS Text Normalization System

**Authors:** Peter Ebden, Richard Sproat
**Year:** 2014 (Published online: 12 December 2014)
**Venue:** Natural Language Engineering, Cambridge University Press
**DOI:** 10.1017/S1351324914000175
**Citation:** Ebden, P., Sproat, R. (2015). The Kestrel TTS text normalization system. Natural Language Engineering, FirstView Article, pp 1-21.

## One-Sentence Summary

Kestrel is Google's production text-to-speech text normalization system that separates tokenization/classification from verbalization using weighted finite-state transducers (WFSTs) and protocol buffers to handle non-standard words across 19 languages with 91.3% accuracy for English.

## Problem Addressed

Text normalization is critical but understudied in TTS: systems must correctly expand abbreviations, verbalize numbers, dates, currency amounts, and other non-standard words (NSWs). This is fundamentally important because errors immediately degrade perceived system quality regardless of voice synthesis quality. Traditional single-phase FST approaches (like Bell Labs, Sproat 1996) struggle with reordering phenomena (e.g., $200 must read "two hundred dollars" not "dollars two hundred") and become inefficient when FSTs must branch extensively to handle such cases.

## Key Contributions

- **Two-phase architecture**: Separates tokenization/classification (produces protocol buffers) from verbalization (consumes and reorders protocol buffers). This avoids expensive FST branching for reordering operations.
- **Protocol buffer representations**: Defines semiotic classes (currency, dates, times, measures, phone numbers, etc.) as structured protocol buffer messages with named fields, enabling language-independent parsing and language-dependent verbalization.
- **Universal grammar inheritance**: Many tokenization/classification rules are language-independent (e.g., parsing "200" as a number requires no language assumptions), allowing inheritance by language-particular grammars.
- **REDUP mechanism**: Provides efficient handling of text copying (e.g., Indonesian reduplication "orang2" → "orang orang") outside pure FSTs, also useful for currency field duplication.
- **Large-scale production deployment**: System runs on Android devices (constrained to ~800kb), servers, and handles 19 languages in millions of daily interactions.

## Methodology

### Architecture Overview

```
Raw Text
    ↓
[Tokenization & Classification Phase (FST-based)]
    ↓
Serialized Protocol Buffer (tokens with classified fields)
    ↓
[Parse to Protocol Buffer Objects]
    ↓
[Verbalization Phase (FST-based)]
    ↓
Text of Words (in-lexicon)
```

### Phase 1: Tokenization & Classification

- Input text is scanned by FST grammars that recognize:
  - Ordinary words
  - Semiotic classes (currency, date, time, measure, cardinal/ordinal/decimal/fraction numbers, telephone, electronic addresses)
  - Punctuation
  - Unknown individual characters
- Output: Serialized protocol buffer representation
- Grammars are constructed with **Thrax** (OpenFst-based grammar compiler)
- Process is highly non-deterministic; mitigated by look-ahead filters (Allauzen, Riley, Schalkwyk 2011)

### Phase 2: Verbalization

- Protocol buffers are reserialized (no inherent ordering in protocol buffers)
- For each semiotic class, all possible field orderings are generated as a lattice
- Verbalization grammar selects the ordering(s) that match language-specific expectations
- Example: `money { currency: "usd" amount { integer_part: "50" } }` in text becomes `money { amount { integer_part: "50" } currency: "usd" }` in lattice, verbalized as "fifty dollars" (currency word comes after number in English)
- Non-deterministic processing minimized by grammar optimization and careful rule writing

## Key Equations

No mathematical formulations per se. The system is fundamentally regular-relation based:

The Bell Labs lexical analysis transducer structure:
$$\left(\bigcup_{l \in \mathcal{L}} l \mathcal{S}\right)^*$$

Where $\mathcal{L}$ is the set of lexical classes and $\mathcal{S}$ is the space model. Kestrel separates this into distinct phases.

## Parameters

### Semiotic Classes Recognized

| Class | Examples | Fields |
|-------|----------|--------|
| Cardinal | "123", "fifty" | integer_part |
| Ordinal | "1st", "twenty-third" | integer_part |
| Decimal | "3.14" | integer_part, fractional_part |
| Fraction | "1/2", "3 and 1/4" | numerator, denominator, integer (mixed) |
| Measure | "5 kg", "3.5 meters" | integer_part, fractional_part, unit |
| Currency | "$50", "€25.99" | currency, amount (with sub-number) |
| Date | "Jan 4, 2014", "2/9/2014" | month, day, year, style (for ambiguity) |
| Time | "4:00", "3:30 PM" | hours, minutes, seconds, period (AM/PM) |
| Telephone | "+1-503-444-1234" | country_code, number_part (multiple), extension |
| Electronic | "user@example.com", "+1-800-GOOGLE" | protocol, username, domain, etc. |

### Key Design Parameters

- **style flag**: Encodes original text form (e.g., "Feb 9" vs "2/9") to control verbalization (Ebden & Sproat, 2014)
- **preserve_order flag**: For protocol buffers, enforces original field ordering when set
- **Look-ahead filter threshold**: Prunes invalid intermediate FST states during tokenization to improve performance on resource-constrained devices
- **FST serialization**: Uses compact representation (not standard VectorFst) achieving ~10x size reduction for Android deployment (800kb budget)

## Implementation Details

### Data Structures

**Protocol Buffer Message for Currency:**
```
money {
  currency: string (e.g., "usd")
  amount: message {
    integer_part: string
    fractional_part: string (optional)
  }
  quantity: int64 (optional, e.g., "k" in "$50k" → quantity=1000)
}
```

**Protocol Buffer Message for Date:**
```
date {
  month: string or int  (can be name or numeric)
  day: int
  year: int
  style: int (controls reading style)
  preserve_order: bool
  era: string (optional)
}
```

### Initialization & Edge Cases

**Faithfulness vs. Normalization:**
- Pure semiotic class interpretation (numeric month/day/year) loses original text form
- Solution: Pass `style` field encoding original form, or allow strings in protocol buffer fields
- Trade-off: System is "less pure" but more flexible

**Ambiguous Date Formats:**
- 2/9/2014 in US English could be "February ninth" or "two, nine, ..."
- Solution: Convert to consistent internal representation; decide verbalization at runtime based on style or original text clues

**Morphologically Complex Languages (e.g., Russian):**
- Date "20/10/2000" in dative case: "двадцатому октября двух тысячного года"
- Uses external morphosyntactic tagger (grad-boost based) to select correct inflection
- Grammar produces all possible morphosyntactic forms; tagger chooses contextually appropriate one

**Copying & Reduplication (REDUP mechanism):**
- Problem: Pure FSTs cannot efficiently copy arbitrary material (e.g., Indonesian "orang2" → "orang orang")
- Solution: If verbalizer grammar defines rule `REDUP`, marked-up tokens matching it trigger code-based duplication:
  1. Copy input FST with itself: `FST o FST`
  2. Add duplicated string to input lattice
  3. Continue verbalization with both original and duplicated paths
- Also efficient for currency duplication (major/minor currency handling)

### Example Trace: "$50k. Please call me at 4:00 at +1-503-444-1234."

**Phase 1 Output (serialized):**
```
tokens { name: "I" }
tokens { name: "need" }
tokens { money { currency: "usd" amount { integer_part: "50" } quantity: 1000 } }
tokens { name: "." phrase_break: true type: PUNCT }
tokens { name: "Please" }
tokens { name: "call" }
tokens { name: "me" }
tokens { name: "at" }
tokens { time { hours: 4 minutes: 0 } }
tokens { name: "at" }
tokens { telephone { country_code: "1" number_part: "503" number_part: "444" number_part: "1234" } }
tokens { name: "." phrase_break: true type: PUNCT }
```

**Phase 2 (Verbalization):**
- Money lattice: `{ currency: "usd", amount: {...} }` OR `{ amount: {...}, currency: "usd" }`
  - English grammar expects currency after amount → select second ordering
  - Outputs: "fifty thousand dollars"
- Time: `{ hours: 4, minutes: 0 }` → "four o'clock"
- Telephone: `{ country_code: "1", number_part: "503", ... }` → "plus one, five oh three, four four four, one two three four"

### Grammar Examples

**Fraction Verbalization (English, from paper):**

```
# Denominator: reuse ordinal rules with special cases
denominator_plural =
  ("1" : "over one" <-1>)
  | ("2" : "halves" <-1>)
  | ("4" : "quarters" <-1>)
  | o.ORDINAL_PLURAL;

# Standard fraction: "numerator denominator"
plural = Optimize[
  markup.fraction_numerator
  c.CARDINAL
  markup.fraction_denominator util.ins_space
  denominator_plural
  util.del_space_star
];

# Singular when numerator is 1: "a quarter" not "one quarter"
singular = Optimize[
  markup.fraction_numerator
  c.MINUS? ("1" : "a_determiner")
  markup.fraction_denominator util.ins_space
  denominator
  util.del_space_star
];

# Mixed fraction: "three and a half"
composite = Optimize[
  markup.fraction_integer
  c.CARDINAL ("" : " and ")
  ((singular<-1>) | plural)
];

# Final exported rule
export FRACTION_MARKUP = Optimize[
  markup.fraction
  util.opening_brace (
    (singular @ a_to_one) |
    (plural<20>) |
    (composite @ fix_over_one @ a_to_an)
  ) util.closing_brace
];
```

**Russian Date Verbalization (excerpt):**

```
# Genitive form of "year" (год)
god_masgen = g.F[god, "__MAS,GEN"];

year_gen = Optimize[
  (((year_num g.I[" __MAS,GEN"]) @ o_number)
   g.I[" " god_masgen]) |
  (zero ((d g.I[" __MAS,GEN"]) @ o_number)
   g.I[" " god_masgen])
];

# Day-month-year in dative case
dmy_style1_dat = Optimize[
  (m.date_day day_dat m.date_month month_gen
   m.date_year year_gen m.style1)
  @ delfeat @ u.CLEAN_SPACES
];

# Dative date (selects dmy_style1_dat or alternatives)
date_dat = Optimize[
  (dmy_style1_dat | dm_style1_dat | my_style1_dat | y_style1_dat)
  era?
  g.FeaturesWithCase["DAT"]
];
```

### Performance Optimizations

1. **Look-ahead filtering** (Allauzen, Riley, Schalkwyk 2011): Prunes invalid intermediate FST states that cannot reach final states, reducing non-determinism impact
2. **Grammar discipline**: Disallow unnecessary tokenization branches (e.g., split "hello" into "hel"+"lo") to prevent unwanted state explosion
3. **FST compaction**: Achieved ~10x size reduction (vs. standard VectorFst) for Android deployment
4. **Number factorization in code**: Language-independent digit grouping (1×10² + 2×10¹ + 3) handled outside FST to avoid grammar complexity

## Figures of Interest

- **Figure 1 (page 5):** Bell Labs multilingual TTS system architecture (Sproat 1996) showing cascaded lexical analysis → grapheme-to-phoneme transducers. Illustrates the single-phase approach that Kestrel improves upon.

## Results Summary

### Evaluation

**English Results (Table 1):**
- Overall: 91.3% accuracy
- Perfect (100%) on: Cardinals, Dates, Decimals, Electronic addresses, Fractions, Money, Ordinals
- Strong (>90%): Measures (90.8%), Telephone (94.1%), Bug fixes (93.9%)
- Challenging (<90%): Driving directions (65.6%), Roman numerals (86.8%), Time (71.5%)

**Russian Results (Table 2):**
- Overall: 93.1% accuracy
- Perfect (100%) on: Address, Cardinal, Date, Electronic, Fraction, Morphosyntax homographs, Ordinal, Telephone, Time, Transliteration
- Strong (>90%): Measure (97.1%), Bug fixes (90.3%)
- Challenging: Money (61.3%), Decimal (79.1%)

**Performance Characteristics:**
- Tokenization & classification phase dominates computation (highly non-deterministic)
- Look-ahead filters essential for mobile deployment
- Compact FST serialization reduces deployed size ~10x
- Language development: 2 weeks for easy languages (English), several months for morphologically complex languages (Russian)

## Limitations

- **No standard evaluation dataset**: Authors note lack of publicly available benchmark data suitable for Kestrel (social media datasets like Edinburgh Twitter Corpus don't match Google TTS use cases)
- **Evaluation limited to internal test sets**: Cannot release test set contents; results based on Google's proprietary data (driving directions, factoid QA answers, etc.)
- **Writing system constraint**: Assumes written language is largely regular (i.e., writable/readable via FSTs); exceptions exist and must be handled specially
- **Punctuation representation**: Current `phrase_break: bool` is insufficient to capture all punctuation nuance; future revision needed
- **Domain knowledge beyond scope**: System doesn't expand context-dependent abbreviations (e.g., "AK-47" normally shouldn't expand to "Alaska-47" in other contexts)
- **Morphosyntactic disambiguation external**: Relies on external tagger for inflection selection in languages like Russian; tagger errors propagate to final output
- **Purist semiotic class separation not tenable**: Some NSWs give clues to verbalization (e.g., "Feb 9" should read as "February ninth" not digit-by-digit); system uses workarounds (style flags, preserve_order) rather than unified framework

## Relevance to Qlatt Project

**Direct Applicability:**

1. **Text normalization front-end**: Qlatt's TTS frontend (`src/tts-frontend.js`) handles basic text normalization and G2P. Kestrel's modular two-phase approach (classify → verbalize) could improve handling of:
   - Numbers (cardinals, fractions, decimals)
   - Acronyms/abbreviations
   - Dates/times (with style control)
   - Currency and measures

2. **Protocol buffer philosophy**: While Qlatt uses YAML for declarative configuration, Kestrel's protocol buffer approach to capturing structural information (semiotic class fields) informs how to represent intermediate linguistic structures. Qlatt's track format (array of time-stamped Klatt parameter frames) is analogous to verbalization output.

3. **FST-based rule compilation**: Qlatt's semantics.yaml uses CEL expressions for parameter derivation. Kestrel's Thrax grammar compilation (from human-readable rules to executable WFSTs) represents a complementary approach to Qlatt's CEL-based topological evaluation. Both avoid hardcoding logic in code.

4. **Multilingual design**: Kestrel's separation of language-independent rules (number parsing) from language-dependent rules (verbalization, morphology) provides a model for extending Qlatt across languages with shared base components.

5. **Mobile constraints**: Kestrel's aggressive optimization for Android (~800kb footprint using compact FST serialization) mirrors Qlatt's constraint of fitting WASM primitives + semantics into a web browser. Both face similar resource trade-offs.

**Specific Implementation Notes:**

- **Non-standard word detection**: Qlatt could enhance its phoneme rules with NSW classification (follows Sproat et al. 2001) to better handle numbers, abbreviations, and special symbols in input text.
- **Reordering without FST explosion**: REDUP mechanism and protocol buffer-based reordering demonstrate how to handle phenomena (like currency word order) without expensive FST branching. Qlatt's interpreter could use similar ideas for parameter reordering based on semiotic context.
- **Morphosyntactic feature tagging**: For polyglot synthesis (if extending Qlatt to languages like Russian), external morphosyntactic disambiguation (as in Kestrel) may be necessary; Kestrel's use of grad-boost-based pointwise prediction is a practical example.

## Open Questions

- [ ] How does Kestrel's performance scale to extremely low-resource languages (< 1 month development time)?
- [ ] What is the relative contribution of tokenization vs. verbalization errors to overall system degradation?
- [ ] Can the style flag mechanism be generalized to a fully principled framework linking written form to verbalization, as proposed by "Warbler" system?
- [ ] How are complex nested semiotic classes (e.g., currency with measure sub-expressions like "3.5 kg @ $50/unit") handled in practice?
- [ ] What is the actual latency distribution on Android devices for various NSW classes?

## Related Work Worth Reading

- **Sproat (1996)**: Multilingual text analysis for text-to-speech synthesis. Natural Language Engineering. Foundational Bell Labs architecture that Kestrel improves upon.
- **Sproat et al. (2001)**: Normalization of non-standard words. Computer Speech and Language 15(3): 287–333. Defines NSW taxonomy that Kestrel adopts.
- **Tai, Skut, Sproat (2011)**: Thrax grammar compiler documentation. Essential for understanding Kestrel's rule formalism.
- **Allauzen, Riley, Schalkwyk (2011)**: Filters for efficient composition of WFSTs. Key performance optimization cited in paper.
- **Roark & Sproat (2014)**: Hippocratic abbreviation expansion. Demonstrates semi-supervised learning approach to complement hand-built rules.
- **Allen et al. (1987)**: MITalk system. Early example of finite-state lexical analysis in TTS (referenced as predecessor).

## Implementation Notes for Qlatt

**If Qlatt adopts Kestrel-style text normalization:**

1. Implement NSW classification stage upstream of phoneme rule application
2. Represent semiotic classes as JSON objects (analogous to protocol buffers) with named fields (currency, amount, month, day, year, etc.)
3. Separate classification grammar (language-independent number/date/currency parsing) from verbalization grammar (language-dependent word choices and inflection)
4. Use CEL expressions in semantics.yaml to control verbalization alternatives (e.g., date style flags)
5. Ensure phoneme rules inherit NSW handling so that verbalizations are correctly pronounced

**Citation for code:**

When implementing text normalization components inspired by Kestrel, cite:
```
Ebden, P., & Sproat, R. (2015). The Kestrel TTS text normalization system.
Natural Language Engineering, FirstView, 1–21.
https://doi.org/10.1017/S1351324914000175
```
