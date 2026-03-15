# Dilley & Brown 2005 — The RaP (Rhythm and Pitch) Labeling System

## Overview

RaP is a prosodic annotation system for spoken English that captures both **rhythm** (metrical prominence) and **pitch** (tonal patterns) on separate tiers. It differs from ToBI primarily in (1) explicitly labeling rhythmic structure, (2) using relative pitch labels rather than phonological tone categories, and (3) maintaining independence between rhythm and tonal tiers.

## Four Annotation Tiers

| Tier | Content | Labels |
|------|---------|--------|
| **Words** | Syllabic organization, orthography | Syllable boundaries, word text |
| **Rhythm** | Metrical prominences, phrase boundaries | `X` (beat/strong), `x` (nonbeat/weak), `[x]` (uncertain prominence), `)` (minor boundary), `))` (major boundary), `)?)` (uncertain boundary size) |
| **Tones** | Tonal patterns on prominent & nonprominent syllables | `H*`, `L*`, `E*` (starred = on metrically prominent syllable); `H`, `L`, `E` (unstarred = on nonprominent syllable); diacritics `+:` position markers |
| **Misc** | Parallelism, pitch range, disfluencies | `"!"` (expanded range), `">"`/`"<"` (high/low in range), `"(/"` and `"/)"` (parallelism brackets), `"dis"`, `"cut"`, `"hes"`, `"res"` |

## Rhythm Tier Details

### Beat/Nonbeat Assignment

Syllables are labeled as **beats** (`X` or `x` — metrically prominent) or **nonbeats** (no label). Four conventions guide labeling:

1. **Clash/lapse convention**: Prefer alternating beats separated by one or two nonbeats. Five or more consecutive nonprominent syllables are prohibited.
2. **Lexical stress convention**: For polysyllabic words, stressed syllables get `X`/`x`; unstressed unreduced syllables (including secondary stress) do NOT get metrical prominence.
3. **Content/function word convention**: For monosyllables — content words (nouns, "full" verbs, adjectives, adverbs, numerals) are beats; function words (determiners, prepositions, conjunctions, auxiliaries, particles) are nonbeats.
4. **Multiple-word phrase convention**: In multi-word phrases, the most prominent syllable(s) are beats; least prominent elements are nonbeats.

### Ambiguity Labels

- `x?` or `X?` — uncertain whether a syllable is a beat
- `x?> <X` or similar angled brackets — two adjacent strong syllables where one must be a beat, indicating relative prominence
- `[x]` — lexically unstressed syllable that sounds metrically prominent in context

### Phrase Boundaries

- `)` — minor phrasal boundary (small disjuncture)
- `))` — major phrasal boundary (significant disjuncture, pause)
- `)?)` — uncertain boundary size
- `")"` — boundary is present but uncertain whether small or large

Boundary labeling is **independent** of tonal labeling — a phrasal boundary on the rhythm tier does not require a tonal marker on the tones tier (unlike ToBI).

## Tones Tier Details

### Tone Labels

Each RaP tone label specifies **relative pitch level** with respect to the preceding tone:

| Label | Meaning |
|-------|---------|
| `H*` | High tone on metrically **prominent** syllable (starred) |
| `L*` | Low tone on metrically **prominent** syllable |
| `E*` | Equal-pitch tone on metrically **prominent** syllable |
| `H` | High tone on metrically **nonprominent** syllable (unstarred) |
| `L` | Low tone on metrically **nonprominent** syllable |
| `E` | Equal-pitch tone on metrically **nonprominent** syllable |

### Key Tonal Properties

- **H tone**: Associated syllable has **higher** pitch than preceding tone-associated syllable. F0 peak in vicinity of high-toned syllable.
- **L tone**: Associated syllable has **lower** pitch. F0 valley in vicinity of low-toned syllable.
- **E tone**: Associated syllable has **same** pitch level as preceding. Level F0 contour.
- Starred tones on **prominent** syllables: F0 extrema aligned with metrically prominent syllables
- Unstarred tones on **nonprominent** syllables: F0 extrema aligned with nonprominent syllables

### F0 Contour Correspondences

- **H-L tonal sequence**: High-low pitch contour. H* on prominent syllable corresponds to F0 peak, L on following nonprominent corresponds to F0 valley.
- **L-H tonal sequence**: Low-high pitch contour. L on nonprominent, followed by H* on prominent = rising pitch.
- **Equal tone sequences**: Level/monotone F0 contour. E* flanked by equal tones = flat pitch region.

### Relationship to ToBI

- RaP `L+ H*` and `L*+ H` correspond to ToBI bitonal pitch accents `L+H*` and `L*+H`
- RaP `H+ L*` corresponds to ToBI `H+!H*` (sequence appears as "vertical mirror image")
- RaP sequence `H* L+ H*` overlaps with ToBI `H+!H*` pitch accent (which is a rotational variant of `H+L*`)
- RaP reveals symmetries in English intonation not captured by ToBI (e.g., "vertical mirror images" of tonal patterns)

### Position Diacritics

- `+:` — indicates relative position of a starred tone with respect to unstarred tone
  - `+:` on **right** side of unstarred tone = starred tone is to the right
  - `+:` on **left** side of unstarred tone = starred tone is to the left
  - When starred tones on both sides, `+:` defaults to right side

### Sequence Restrictions

- Maximum two adjacent high tones or two adjacent low tones in non-phrase-initial position
- Maximum three adjacent identical tones in phrase-initial position
- Maximum two adjacent equal tones in phrase-initial position
- Equal tones never occur in adjacent positions (an equal tone must be followed by a high or low tone)

## Pitch Range and Interval Size

### Range Diacritics

- `"!"` — pitch interval between tone and preceding context is **small** (locally reduced pitch range)
  - Absence of `"!"` indicates a **large** pitch interval (expanded pitch range)
- Criteria for "small" vs "large": pitch interval of 1-2 semitones = small; 3+ semitones = large
- Shape of F0 trajectory also matters: gradual/smooth = small; jump/rapid change = large

### Extreme Pitch Diacritics

- `">"` — tone is very **high** in speaker's pitch range
- `"<"` — tone is very **low** in speaker's pitch range
- Used for phrase-final tones at extremes of range (very high rise, very low fall)

## False Pitch Accents and Backgrounding

### False Pitch Accents `[*]`

Two situations where pitch excursions on metrically prominent syllables are NOT true pitch accents:

1. **Backgrounding**: In alternating H-L sequences on prominent syllables, some tones fail to sound accented (Gestalt-like grouping). Bracketed starred tone `[*]` marks these.
2. **Prominence mismatch**: A pitch excursion on a syllable that cannot be interpreted as a pitch accent due to its lexical/prosodic status (e.g., unstressed unreduced syllable bearing a L.H.L.H pattern).

## Phrase-Final and Phrase-Initial Conventions

### Phrase-Final Tones

- Every syllable at the **beginning or end of an utterance** must have at least one tone
- If contour rises/falls smoothly to end with no local change, an **unstarred** tone is labeled
- If contour levels off at end on a prominent syllable, a **starred** tone is preferred
- If there is **any uncertainty about tone type on a phrase-final metrically prominent syllable**, label a starred tone (or bracketed starred tone)
- Phrase-final tones are indicated with a `"<"` diacritic when ending at bottom of range, or `">"` when at top

### Phrase-Initial Tones

- Two conditions require a tone label on a phrase-initial syllable:
  1. The syllable marks a **local change in pitch** (no smooth interpolation from preceding phrase)
  2. The syllable is **preceded by a pause of >100 ms**
- If there is smooth interpolation across the phrase-initial syllable, **no tone label** is placed
- Phrase-initial syllables preceded by a long pause are "utterance initial" and labeled with colons (e.g., `:H`, `:L`, `:E`)

## Parallelism

- **Parallelism**: Repetition of all or part of an intonation contour giving rise to parallel tonal event sequences with similar metrical structure
- Labeled in "misc" tier with `"(/"` and `"/)"` brackets enclosing the parallel region
- Numbered markers (e.g., `"1(/"`, `"/1)"`, `"2(/"`, `"/2)"`) identify corresponding parallel parts
- Long-distance parallelism can also occur (patterns separated by intervening material)
- Parallelism affects both rhythm and tone labeling decisions

## Disfluency and Hesitation Labels (Misc Tier)

| Label | Meaning |
|-------|---------|
| `dis` | Generalized disfluency marker |
| `cut` | Syllable or word is cut off |
| `hes` | Hesitation |
| `res` | Restart |

- Disfluencies often co-occur with phrase boundaries and unexpected metrical prominences
- Function words gaining prominence near disfluencies are labeled as beats
- Well-formed rhythmic structure can persist even in disfluent speech

## Perceptual Isochrony

- RaP captures **perceptual isochrony**: the tendency for metrically prominent syllables to occur at approximately equal temporal intervals
- Labeled optionally with `"pI"` in the misc tier
- Speech only intermittently sounds perceptually isochronous

## Implementation Relevance for Synthesis

### F0 Contour Generation

The RaP system provides a framework for mapping between:
- **Metrical structure** (beat/nonbeat pattern) and **F0 target placement**
- **Relative pitch labels** (H/L/E) and **F0 contour shape**

Key rules for synthesis:
1. **Starred H tones** → F0 peak aligned with metrically prominent syllable
2. **Starred L tones** → F0 valley aligned with metrically prominent syllable
3. **Starred E tones** → Level F0 on prominent syllable, equal to preceding tonal context
4. **Unstarred tones** → F0 targets on nonprominent syllables
5. **Transitions between adjacent tones are monotonic** (always rising or falling, never overshooting)
6. F0 peaks for **starred H** on prominent syllables may occur slightly after syllable onset (possible "F0 peak delay")
7. **Equal tones** correspond phonetically to F0 "corners" — transitions from rise to level or level to fall

### Duration/Rhythm Modeling

- Beat placement follows predictable patterns from lexical stress, content/function word status, and phrasal position
- Perceptual isochrony suggests beats tend toward equal temporal spacing (relevant for duration modeling)
- Phrase boundaries correlate with lengthening and pausing

### Pitch Range

- Local pitch range expansion on focused/contrastive elements (marked with absence of `"!"`)
- Compression of pitch range in backgrounded material (marked with `"!"`)
- Range diacritics `">"` and `"<"` indicate phrase-final boundary tones at pitch extremes
