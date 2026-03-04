# Streams, Phones and Transitions: Toward a New Phonological and Phonetic Model of Formant Timing

**Authors:** Susan R. Hertz
**Year:** 1991
**Venue:** Journal of Phonetics, 19, 91-109
**Affiliation:** Eloquent Technology, Inc. & Cornell University Phonetics Laboratory

## One-Sentence Summary

Proposes treating formant transitions as independent temporal units separate from phones, using multi-stream "delta" representations to simplify synthesis rules for duration, aspiration, and coarticulation.

## Problem Addressed

Conventional linear phoneme-based synthesis frameworks fail to capture the durational behavior of formant transitions vs. steady states, leading to complex rules that conflate phonological units with phonetic realizations. The paper argues that transitions should be "factored out" as independent units.

## Key Contributions

1. **Stable Transition Phenomenon**: Formant transitions (CV and VC) are durationally stable even when vowels lengthen/shorten (e.g., before voiced vs. voiceless obstruents)
2. **Multi-Stream Delta Representation**: A framework with parallel synchronized streams for phonemes, phones, transitions, syllables, nuclei, and acoustic parameters
3. **Unified Duration Rules**: Simpler rules by treating phones as stretchable units while transitions remain fixed
4. **Diphthong vs. Gliding Vowel Distinction**: Diphthongs have stable interior transitions; gliding vowels (ey, ow, uw) have transitions that stretch with the phone

## The Delta Framework

### Stream Types

| Stream | Content | Purpose |
|--------|---------|---------|
| syllable | syll tokens | Syllable boundaries |
| nucleus | nuc tokens | Syllable nucleus (sonorant sequence) |
| phoneme | /d/, /a/, /ai/ | Phonological units |
| phone | [d], [a], [i] | Phonetic realizations |
| transition | trans tokens | Formant transitions between phones |
| F2 (etc.) | Hz values | Formant targets at steady states |
| AV | dB | Voicing amplitude |
| AH | dB | Aspiration amplitude |
| millisec | ms values | Durations |

### Delta Notation Example

```
[dad]:
syllable:   |           syll              |
phoneme:    | d    |        | a   |       | d  |
transition: |      | trans  |     | trans |    |
F2:         |1840  |        |1260 |       |1750|
millisec:   |100   | 65     |150  | 70    |60  |
```

Vertical bars (sync marks) align streams temporally. Tokens in a stream are adjacent even if other streams intervene.

## Key Phonetic Observations

### 1. Vowel Lengthening Before Voiced Obstruents

| Context | [dad] | [dat] |
|---------|-------|-------|
| Vowel steady state | 150 ms | 100 ms |
| CV transition | 65 ms | 65 ms |
| VC transition | 70 ms | 70 ms |

**Finding**: Only the steady-state portion lengthens (~1.5x factor). Transitions are **stable**.

### 2. Aspiration Timing

Aspiration aligns precisely with CV transition after voiceless stops in stressed syllables.

| | [dad] | [tad] |
|---|-------|-------|
| CV trans duration | 65 ms | 90 ms |
| Aspiration | none | overlays transition |
| Vowel steady state | 150 ms | 180 ms |

Longer aspirated transition → shorter vowel steady state needed perceptually.

### 3. Diphthongs vs. VV Sequences

**VV Sequence [said] "Said"**: Two phonemes, each with one phone
- Only the second vowel [i] lengthens before voiced obstruent
- Interior transition (a→i): **stable** ~100 ms

**Diphthong [said] "side"**: One phoneme with two phones
- Both [a] and [i] portions lengthen
- Interior transition: **stable** ~100 ms
- Total phoneme lengthens by ~1.5x factor

### 4. Gliding Vowels (ey, ow, uw)

Unlike true diphthongs, interior transition is **NOT stable** - it stretches with the vowel.

| | [owd] "owed" | [owt] "oat" |
|---|-------------|-------------|
| Total [ow] | 190 ms | 145 ms |
| VC transition | 40 ms | 40 ms |

The gliding vowel is essentially just a transition with zero-duration endpoints.

```
[owd]:
phone:      |          ow        |     | d |
F2:         |1260      |     1000|     |1680|
millisec:   |0         |190      |0    |40  |60|
```

### 5. Sonorant Sequences

Lengthening applies to entire syllable nucleus, not just vowel.

[eyld] vs [eylt]:
- Both [ey] AND [l] lengthen before [d]
- Transition [ey]→[l]: stable at 80 ms

Requires **nucleus** stream to express generalization.

### 6. VC Transition Truncation

Before voiceless obstruents, VC transition appears shorter but is actually **truncated** by early voicing cessation (glottal opening/closing gesture).

```
[owt]:
transition: |        | trans        |    |
AV:         |60      |              |0   |
millisec:   |0  |145 |0   |25  |15  |80  |
```

The formant trajectory continues but voicing cuts off 25 ms into the 40 ms transition.

## Duration Rules (Informal)

1. **Pre-voiced lengthening**: Multiply duration of all phones in phoneme preceding tautosyllabic voiced obstruent by ~1.5
2. **Nucleus lengthening**: Extends to all sonorant phones in nucleus (vowel + /l/, /r/, /n/, etc.)
3. **Aspiration rule**: After voiceless stop in stressed syllable onset, overlay aspiration on CV transition and lengthen transition (~25 ms longer)
4. **Transition stability**: Do not modify transition durations for voiced/voiceless context
5. **Gliding vowel exception**: Interior transition included in phone, so it stretches

## Parameters

| Parameter | Symbol | Units | Typical Value | Notes |
|-----------|--------|-------|---------------|-------|
| CV transition duration (d→a) | - | ms | 65 | Stable across length contexts |
| VC transition duration (a→d) | - | ms | 70 | Stable across length contexts |
| Aspirated CV transition | - | ms | 90 | ~25 ms longer than unaspirated |
| Diphthong interior trans | - | ms | 100 | Stable (ai, au, oi) |
| Lengthening factor | - | ratio | 1.5 | Before voiced obstruent |
| Voicing cutoff before [-voice] | - | ms | ~25 | Into VC transition |

## F2 Values (Hz, from examples)

| Phone | F2 (Hz) | Context |
|-------|---------|---------|
| d | 1750-1840 | Locus |
| t | 1840 | Locus |
| a | 1260-1420 | Open vowel |
| i | 2200-2580 | High front |
| s | 1660 | Fricative |
| ow | 1260→1000 | Glide endpoints |
| ey | 2100→2300 | Glide endpoints |
| l | 840 | Lateral |

## Implementation Details

### Data Structures

A "delta" requires:
1. Multiple parallel streams (arrays of tokens)
2. Sync marks aligning stream positions
3. Token features (can be tested by rules)
4. Hierarchical relationships (syllable → phoneme → phone)

### Interpolation

Formant values in transitions are computed by linear interpolation between adjacent phone targets. Piecewise linearity is adequate for synthesis.

### Fast Speech

Uses "cut" tokens in a fast_speech stream to mark regions not realized. The transition slope is preserved but truncated.

```
[said] fast:
fast_speech: |        |        | cut        |    |
millisec:    |150 |30 |35  |70 |30  |30  |30 |60 |
```

Interior transition cut off after 70 ms; [i] phone not realized.

## Figures of Interest

- **Fig 1 (p.93)**: F2 patterns for [dad] vs [dat] showing stable transitions
- **Fig 4 (p.96)**: Aspiration overlaying CV transition in [tad]
- **Fig 8 (p.99)**: Diphthong [ai] with stable interior transition
- **Fig 10 (p.101)**: Gliding vowel [ow] with stretchable transition
- **Fig 12 (p.102)**: Sonorant sequence [eyl] lengthening
- **Fig 14 (p.104)**: VC transition truncation by voicing cessation

## Limitations

1. Model is "preliminary" - many open questions acknowledged
2. Examples from one General American speaker
3. Fast speech handling incomplete
4. Does not address all coarticulatory phenomena
5. Some duration constraints (min/max) may be needed but not specified

## Relevance to Qlatt Project

### Direct Applications

1. **Transition timing**: Current Qlatt likely treats entire phoneme as one unit. Could separate steady state from transitions for more accurate duration rules.

2. **Pre-voiced lengthening**: Implement the ~1.5x factor on phones (not transitions) before voiced obstruents in syllable codas.

3. **Aspiration implementation**: Overlay AH on CV transition after voiceless stops in stressed syllables; lengthen transition by ~25 ms.

4. **Diphthong handling**: Treat [ai], [au], [oi] as single phonemes with two phones and stable interior transition. Both phones stretch.

5. **Gliding vowels**: Treat [ey], [ow], [uw] as single phones whose interior transition stretches.

6. **VC truncation**: Before voiceless obstruents, truncate voicing (AV→0) partway through VC transition rather than shortening the transition.

### Architecture Considerations

The multi-stream delta architecture could inform Qlatt's internal representation:
- Separate streams for phonemes, phones, transitions
- Explicit sync marks for alignment
- Formant targets only at phone boundaries; interpolate for transitions

## Open Questions

- [ ] Are transition durations between specific phone pairs universal across languages?
- [ ] What are minimum/maximum duration constraints for phones?
- [ ] How do transitions behave under different stress levels?
- [ ] Does nucleus lengthening affect transition durations in some contexts (diphthong+liquid)?

## Related Work Worth Reading

- **Klatt (1976)** - Segmental duration in English (cited for truncation hypothesis)
- **Klatt (1979)** - Synthesis by rule of durations (contrast with this model)
- **Gay (1968)** - Diphthong formant movements in fast speech
- **Chen (1970)** - Vowel length and consonant voicing
- **Lindblom (1964)** - Articulatory undershoot
- **Peterson & Lehiste (1960)** - Duration of syllable nuclei
- **Raphael et al. (1980)** - Vowel duration cues for voicing

## Key Quotes

> "The invariance of transitions in particular contexts will henceforth be called the *stable transition phenomenon*." (p.94)

> "We propose to treat the formant transitions as independent units" (p.94)

> "The interior transition of a diphthong not only acts like the transition between the vowels [a] and [i] in words like *Said* [...] but also has the same duration." (p.99)

> "Unlike the interior transition of a diphthong, the interior transition of a gliding vowel is not stable; it lengthens and shortens along with the vowel" (p.101)

> "The universal lengthening [before voiced obstruents] seems to be a very different phenomenon from the much greater lengthening of phones in English syllable nuclei" (p.105)

---

## Collection Cross-References

### Already in Collection
- **Allen_1987_MITalk_TTS**
- **Carlson_1975_RuleBasedTTS**
- **Fant_1960_AcousticTheorySpeechProduction**
- **Hertz_1982_SRS_TextToSpeech**
- **Hertz_1985_DeltaRuleSystem**
- **Klatt_1976_SegmentalDuration**
- **Klatt_1979_SpeechPerceptionLexicalAccess**
- **Klatt_1987_TTS_Review**

### Now in Collection (previously listed as leads)
- **Goldsmith_1976_AutosegmentalPhonology** — Autosegmental phonology framework that inspired the multi-tiered parallel structure of Delta. Goldsmith's multi-tier representation with association lines maps directly to Hertz's synchronized streams. The Well-formedness Condition (association lines must not cross) formalizes the temporal alignment constraints that Hertz implements with sync marks.

### New Leads (Not Yet in Collection)
- **Gay (1968)** - Critical for understanding diphthong behavior in fast speech and the undershoot phenomenon that Hertz's model elegantly explains through the "fast_speech" stream concept.
- **Chen (1970)** - Original observation of sonorant sequence lengthening before voiced obstruents (beyond simple vowel lengthening), which motivates Hertz's nucleus-level representation.

### Conceptual Links (not citation-based)
- **Browman_1989_ArticulatoryGesturesPhonologicalUnits** / **Browman_Goldstein_1992_ArticulatoryPhonologyOverview** — Articulatory Phonology models speech as overlapping gestures where duration = 1/stiffness. Hertz's "stable transition phenomenon" (transitions hold at ~65ms while steady states stretch) is exactly what AP predicts for a gesture with high stiffness superimposed on a lower-stiffness vocalic gesture. Different formalisms, same empirical convergence.
- **Campbell_Isard_1991_SegmentDurationsSyllable** — Campbell & Isard's syllable-level duration model with differential rhyme lengthening (exponential weight 0.75^(n-i)) solves the same problem as Hertz's nucleus stream: lengthening isn't per-segment, it affects the entire sonorant sequence in the rhyme.
- **Ohman_1966_CoarticulationVCV** — Ohman's VCV model treats consonants as gestures superimposed on a vowel-to-vowel diphthongal substrate. Structurally very close to Hertz's parallel streams where transitions and phones occupy separate tiers — both factor consonants as overlays on vocalic continuity.
- **Hanson_2003_AspiratedStopsModels** — Hertz treats aspiration as an independent stream overlaying the CV transition. Hanson & Stevens later showed that for /t/ and /k/, the "aspiration" phase contains supraglottal frication (not just glottal noise), complicating Hertz's simple AH overlay — place-dependent AF may need to extend into the aspiration interval.
- **Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal** — AP's π-gestures (prosodic clock-slowing at boundaries) provide a mechanism for Hertz's observation that only steady states stretch: boundary lengthening slows the planning oscillator, but high-stiffness gestures (transitions) resist stretching while low-stiffness gestures (steady states) absorb it.

### Cited By (in Collection)
- **Hertz_1999_ETI-Eloquence_MultiLanguage** — cites this as the phone-and-transition model central to the ETI-Eloquence timing system
- **Hertz_2002_HybridFormantConcatenation** — cites this as the core phone-and-transition model underlying the ETI-Eloquence approach
- **Hertz_2006_HybridSynthesisRegularities** — cites this as the theoretical foundation for the phone-and-transition model underlying the hybrid model
- **Carlson_1995_ModelsOfSpeechSynthesis** — cites this in survey of synthesis models
- **vanSanten_1993_SegmentalDuration** — cites this for duration modeling
- **vanSanten_1994_SegmentalDurationTTS** — cites this in references
- **vanSanten_1997_ProsodicModeling** — cites this as directly instantiating the sub-segmental non-uniform stretching van Santen identifies as an open problem
- **Sproat_Fujimura_1993_AllophonicVariationEnglishL** — cites this in references
