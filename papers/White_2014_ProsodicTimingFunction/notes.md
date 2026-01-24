# Communicative Function and Prosodic Form in Speech Timing

**Authors:** Laurence White
**Year:** 2014
**Venue:** Speech Communication 63-64 (2014) 38-54
**DOI:** http://dx.doi.org/10.1016/j.specom.2014.04.003

## One-Sentence Summary

A functional framework for prosodic speech timing in English, proposing that durational variation is communicatively useful only through **localised lengthening effects** at domain heads and domain edges, not through diffuse compensatory/rhythmic processes.

## Problem Addressed

Multiple putative timing effects have been proposed (polysyllabic shortening, isochrony, stress-timing), but there's no systematic account of which effects actually serve communicative functions for listeners. The paper argues for parsimony: only include effects that are reliably produced, perceptually salient, and disambiguable.

## Key Contributions

1. **Functional criteria** for prosodic timing effects: must be consistent, audible (~25ms JND), and have distinct loci
2. **Domain-and-locus framework**: timing effects are localised at specific structural positions, not diffuse
3. **Lengthening-only principle**: shortening is NOT a useful structural cue (articulatory limits, perceptual asymmetry)
4. **Rejection of compensatory effects**: polysyllabic shortening, foot-level isochrony are weak/inconsistent
5. **Reinterpretation of "shortening"**: apparent shortening is actually attenuation of lengthening when more segments share the prosodic lengthening

## The Functional Framework

### Core Principles (Table 1, p.46)

| Principle | Description |
|-----------|-------------|
| No privileged timing unit | No unit (foot, phrase) consistently imposes timing constraints on subconstituents |
| Prosodic timing domains | Timing relates to organisation of syllables into words and higher constituents |
| Localised lengthening effects | Structure influences timing ONLY at domain edges and domain heads |
| Structurally-defined loci | Each effect has a distinct, characteristic locus |
| No temporal mediation outside loci | No direct relationship between structure and duration except at heads/edges |

### The Four Lengthening Effects

| Effect | Domain | Locus | Magnitude | Perceptual Function |
|--------|--------|-------|-----------|---------------------|
| Word-initial lengthening | Word | Onset of word-initial syllable | 20-30% longer than medial | Lexical segmentation cue |
| Phrase-final lengthening | Phrase | "Word-rhyme" (final stressed V to boundary) | Progressive toward boundary | Syntactic boundary cue |
| Lexical stress lengthening | Syllable | Stressed syllable (greatest on vowel) | Varies | Stress perception |
| Phrasal accent lengthening | Word | Accented word (greatest on primary stress + edges) | Distributed across word | Prominence/focus cue |

### Locus Definitions

**Word-initial lengthening:**
- Affects onset consonants of word-initial syllable
- Does NOT extend to vocalic nucleus (Turk & Shattuck-Hufnagel 2000)
- Greater at higher prosodic boundaries (Fougeron & Keating 1997)
- Utterance-initial may be SHORT (no preceding boundary to cue)

**Phrase-final lengthening:**
- Locus = "word-rhyme": nucleus of final stressed syllable → boundary
- Progressive: closer to boundary = more lengthening
- NOT all post-stress segments necessarily affected
- Distribution depends on size and segmental composition

**Lexical stress:**
- Locus = stressed syllable
- Greatest lengthening on vowel
- ~5% difference between primary and secondary stress (Klatt 1975)

**Phrasal accent:**
- Locus = entire accented word
- Greatest on primary stressed syllable
- Word edges also show significant lengthening
- In polysyllables, lengthening spreads to unstressed syllables (attenuating stress lengthening)

## Key Equations

No formal equations, but key quantitative relationships:

**Just Noticeable Difference (JND):**
$$\Delta t \approx 25 \text{ ms}$$
(Klatt & Cooper 1975)

**Word-initial lengthening magnitude:**
$$\frac{d_{initial}}{d_{medial}} \approx 1.2 - 1.3$$
(20-30% longer, Oller 1973; White & Turk 2010)

## Parameters

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| JND for duration | - | ms | ~25 | Minimum perceptible difference |
| Word-initial lengthening | - | ratio | 1.2-1.3 | Onset duration ratio (initial/medial) |
| Primary/secondary stress difference | - | % | ~5% | Klatt 1975 |

## Implementation Details

### For TTS Duration Model

1. **Identify prosodic domains**: words, phrases, utterances
2. **Mark domain heads**: lexically stressed syllables, phrasally accented words
3. **Mark domain edges**: word boundaries, phrase boundaries
4. **Apply lengthening at loci**:
   - Word-initial: lengthen onset consonants
   - Phrase-final: lengthen from final stressed vowel to boundary (progressive)
   - Stress: lengthen stressed syllable (especially vowel)
   - Accent: lengthen accented word (distribute across syllables)

5. **Do NOT apply**:
   - Polysyllabic shortening (reinterpret as distributed lengthening)
   - Foot-level isochrony
   - Compensatory compression

### Segmental Elasticity

Different segments have different "stretchability":
- Vowels: relatively uniform response to lengthening (van Santen 1992)
- Consonants: sonorants and fricatives more expandable than plosives (Klatt 1976)
- Voiced consonants less expandable than voiceless (affects coda voicing effect)

### Interaction Examples

**Coda voicing + final lengthening:**
- Large coda voicing effects only seen phrase-finally (Klatt 1976)
- Interpretation: voiced codas less expandable → more lengthening goes to nucleus

**Accent + word length:**
- In monosyllables: all accent lengthening on one syllable
- In polysyllables: lengthening distributed → less on primary stress
- This IS "polysyllabic shortening" - but it's attenuation of lengthening, not compression

## Evidence Against Compensatory Effects

### Isochrony Hypothesis (Rejected)

- Inter-stress intervals increase linearly with syllable count (Lehiste 1973; Dauer 1983)
- No less variability in "stress-timed" vs "syllable-timed" languages (Roach 1982)
- Listeners don't attend to inter-stress intervals (Lehiste 1975) - because they convey no information

### Polysyllabic Shortening (Reinterpreted)

- Strong effects ONLY in accented words (White & Turk 2010)
- In unaccented words: durational effects relate to boundary alignment, not word length
- Residual effects are tiny (few ms) and inconsistent

### Speech Cycling Experiments (Task-Specific)

- Cummins & Port (1998): speakers CAN produce periodic rhythm when constrained
- But this is task-specific coordination, not natural speech
- Clinton example (Fig. 1, p.45): achieves quasi-isochrony through PAUSES, not segment compression

## Figures of Interest

- **Fig. 1 (p.45):** Bill Clinton's "I did not have sexual relations with that woman" - shows quasi-periodic inter-stress intervals achieved through inserted pauses, not segmental compression. Inter-stress intervals: 901ms, 845ms, 805ms, 640ms, (771ms), (771ms).

## Results Summary

The functional framework offers:
1. **Parsimony**: Only 4 lengthening effects needed
2. **Distinct loci**: Effects can be disambiguated by listeners
3. **Perceptual plausibility**: Lengthening is more salient than shortening
4. **Articulatory plausibility**: No impossible compression required

## Limitations

- Primarily based on English data
- Cross-linguistic applicability needs modification for:
  - French (no lexical stress, phrase-level prominence only)
  - Korean (may lack even contrastive rhythm)
- Speech rate mechanisms not fully specified
- Interaction between domain-head and domain-edge effects complex

## Relevance to Qlatt Project

**Directly applicable to duration modeling:**

1. **Simplify duration rules**: Remove compensatory shortening, focus on lengthening
2. **Implement four lengthening effects with distinct loci**:
   - Word-initial: onset consonants only
   - Phrase-final: from final stressed vowel to boundary, progressive
   - Lexical stress: stressed syllable, especially vowel
   - Phrasal accent: distribute across word, concentrate on primary stress + edges

3. **Segmental elasticity**: Model different stretchability for different segment types

4. **Key insight for TTS**: "Polysyllabic shortening" should be implemented as *distributed lengthening* - when a word is accented, the total lengthening is shared among syllables rather than concentrated

5. **Timing cues for boundaries**: Use distinct loci to signal structure unambiguously

## Open Questions

- [ ] How exactly to distribute phrasal accent lengthening across polysyllabic words?
- [ ] Magnitude of lengthening at different boundary strengths (word vs phrase vs utterance)?
- [ ] How does speech rate interact with structural lengthening?
- [ ] Implementation of "segmental elasticity" - which segments are more/less stretchable?

## Related Work Worth Reading

- **Klatt (1976)** - Segmental duration rules (already have)
- **Turk & Shattuck-Hufnagel (2007)** - Multiple targets of phrase-final lengthening
- **Oller (1973)** - Position in utterance effects
- **White & Turk (2010)** - Polysyllabic shortening reconsidered
- **van Santen (1992, 1997)** - Segmental duration modeling
- **Campbell & Isard (1991)** - Segment durations in syllable frame
- **Wightman et al. (1992)** - Durations near prosodic boundaries

## Key Quotes

> "There is no direct, consistent relationship between prosodic structure and segment duration apart from at domain edges and domain heads" (p.46)

> "Compensatory shortening effects are small and – at best – inconsistently observed, diffuse rather than associated with a particular domain or locus" (p.46)

> "The interpretation of polysyllabic shortening as the attenuation of a lengthening effect is parsimonious, invoking only one well-established process – salient elements (domain heads) are lengthened in speech" (p.46)

> "For temporal units in speech production, the smaller, the better." (van Santen 1997, quoted p.47)
