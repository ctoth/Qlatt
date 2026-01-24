# The Duration of American-English Stop Consonants: An Overview

**Authors:** Thomas H. Crystal and Arthur S. House
**Year:** 1988
**Venue:** Journal of Phonetics, 16, 285-294
**DOI/URL:** 0095-4470/88/030285

## One-Sentence Summary

Provides empirical duration statistics (hold, release, total) for American English stops /p t k b d g/ in connected speech, showing that many laboratory-derived generalizations about voicing and place effects do not hold in natural discourse.

## Problem Addressed

Previous studies measured stop durations in citation forms or controlled word frames, yielding generalizations (e.g., voiceless holds longer than voiced) that may not apply to connected speech. This paper examines whether such durational cues are actually present in natural read speech.

## Key Contributions

1. **Completeness statistics**: Only 59% of stops in connected speech are "complete" (have both hold + release); word-initial 85% complete vs. word-final 33%
2. **Hold duration invariance**: Voiced vs. voiceless stop holds are essentially the same (~53 ms) in connected speech, contrary to citation-form studies
3. **Release duration differentiation**: Release (burst/aspiration) durations DO differ by voicing: voiced ~18 ms, voiceless ~39 ms
4. **Place effects on release**: Velars have longest releases (44 ms), then alveolars (30 ms), then labials (20 ms)
5. **Contextual tables**: Comprehensive duration data for stops in multiple phonetic contexts

## Methodology

- 6 talkers (3 slow, 3 fast) reading ~600 words of connected text
- Manual segmentation identifying hold (occlusion) and release (burst) portions
- 1891 total stop tokens analyzed
- Compared to citation-form studies in literature

## Key Equations

None - this is an empirical measurement study with statistical summaries.

## Parameters

### Complete Stop Durations (All Talkers Combined)

| Stop | Context | N | Hold (ms) | Total (ms) |
|------|---------|---|-----------|------------|
| /p/  | #C (word-initial) | 37 | 60 | 107 |
| /t/  | #C | 204 | 50 | 96 |
| /k/  | #C | 134 | 59 | 122 |
| /b/  | #C | 163 | 55 | 69 |
| /d/  | #C | 94 | 59 | 78 |
| /g/  | #C | 50 | 57 | 84 |

### Summary Statistics by Voicing (Complete Stops)

| Measure | Voiced | Voiceless |
|---------|--------|-----------|
| Hold (ms) | 54 | 53 |
| Hold SD | 23 | 21 |
| Release (ms) | 18 | 39 |
| Release SD | 10 | 23 |
| Total (ms) | 72 | 92 |
| Total SD | 25 | 32 |

### Summary Statistics by Place (Complete Stops)

| Measure | Labial | Alveolar | Velar |
|---------|--------|----------|-------|
| Hold (ms) | 57 | 49 | 58 |
| Hold SD | 24 | 19 | 22 |
| Release (ms) | 20 | 30 | 44 |
| Release SD | 16 | 19 | 25 |
| Total (ms) | 77 | 80 | 103 |
| Total SD | 30 | 27 | 34 |

### Completeness Rates by Context

| Context | Voiced | Voiceless | ALL |
|---------|--------|-----------|-----|
| All stops (C) | 51% | 65% | 59% |
| Word-initial (#C) | 82% | 89% | 85% |
| Word-final (C#) | 18% | 42% | 33% |
| Prepausal (C# pause) | 33% | 55% | 48% |
| After /s/ (#sCV) | - | 100% | - |

### Completeness by Individual Stop

| Stop | All Contexts | Word-initial | Word-final |
|------|--------------|--------------|------------|
| /p/  | 55% | 88% | 23% |
| /t/  | 61% | 84% | 36% |
| /k/  | 77% | 98% | 69% |
| /b/  | 79% | 79% | - |
| /d/  | 34% | 81% | 18% |
| /g/  | 87% | 93% | 34% |

### Tempo Effects (Slow vs. Fast Talkers)

| Category | Slow (ms) | Fast (ms) |
|----------|-----------|-----------|
| Overall stop duration | 76 | 66 |
| Hold duration | 55 | 50 |
| Complete stop total | 89 | 81 |

### Special Contexts (Table V selections)

| Context | Stop | N | Hold (ms) | Total (ms) |
|---------|------|---|-----------|------------|
| #CV (word-initial prevocalic) | /p/ | 20 | 66 | 105 |
| #CV | /t/ | 145 | 55 | 69 |
| #CV | /k/ | 89 | 61 | 122 |
| #Cr (before /r/) | /t/ | 18 | 58 | 74 |
| #Cr | /k/ | 17 | 54 | 121 |
| #sCV (after /s/) | /t/ | 66 | 51 | 69 |
| #sCV | /k/ | 6 | 56 | 78 |
| C# pause (prepausal) | /t/ | 40 | 59 | 90 |
| C# pause | /k/ | 21 | 79 | 121 |
| VC# pause | /t/ | 30 | 57 | 83 |
| VC# pause | /k/ | 8 | 86 | 146 |

### Flap Duration

| Measure | Value |
|---------|-------|
| Mean duration | 29 ms |
| N | 161 |

## Implementation Details

### For TTS Duration Modeling

1. **Default hold duration**: ~50-55 ms for all stops regardless of voicing
2. **Release duration by voicing**:
   - Voiced: ~18 ms
   - Voiceless: ~39 ms
3. **Release duration by place**:
   - Labial: ~20 ms
   - Alveolar: ~30 ms
   - Velar: ~44 ms
4. **Context adjustments**:
   - Word-initial: use full durations
   - Word-final non-prepausal: often no release (hold-only)
   - Prepausal: longer holds and releases
   - Post-/s/ clusters: ~20 ms shorter total, but same hold

### Completeness Decision Logic

```
if word_initial:
    complete = 85% probability
elif word_final:
    if prepausal:
        complete = 48% probability
    elif stressed_syllable:
        complete = 97% probability
    else:
        complete = 6% probability  # unstressed word-final
```

### Key Implementation Notes

- Hold-only stops (no burst) have same hold duration as complete stops
- In /st/, /sk/ clusters, the stop portion shortens by ~20 ms but shortening is in release, not hold
- Voicing distinction carried primarily by release duration, NOT hold duration
- Velars are longest overall due to long releases

## Figures of Interest

- **Fig 1 (page 289):** Distribution histograms showing:
  - Complete stops total: Mean 86 ms, SD 31 ms, right-skewed
  - Complete stops hold: Mean 53 ms, SD 21 ms, right-skewed
  - Both fit Markov (B) distribution model

## Results Summary

1. **Hold portions do NOT reliably distinguish voicing** in connected speech (contrary to laboratory studies)
2. **Release portions DO distinguish voicing** (~18 ms voiced vs ~39 ms voiceless)
3. **Place of articulation effects are weak for holds** but strong for releases (velars longest)
4. **Tempo affects all durations** but differences are small (~5-10 ms)
5. **Many stops are incomplete** (no measurable release), especially word-finally

## Limitations

- Only 6 talkers (limited speaker variation)
- Read speech only (not spontaneous)
- American English only
- No distinction between burst frication and aspiration components
- Small N for some contextual categories

## Relevance to Project

**High relevance for Qlatt TTS:**

1. **Duration rules**: Current synthesis likely uses citation-form durations; this data suggests:
   - Simplify hold duration (uniform ~50 ms)
   - Vary release duration by voicing and place
   - Consider completeness (word-final stops often lack burst)

2. **Stop burst modeling**: Release duration varies significantly:
   - Voiced: short burst (~18 ms)
   - Voiceless: longer aspiration (~39 ms)
   - Velars need longest release (~44 ms)

3. **Incomplete stops**: TTS should model stops without releases in:
   - Word-final unstressed syllables
   - Before other consonants
   - Fast speech

4. **Cluster timing**: Post-/s/ stops have shorter releases but same holds

## Open Questions

- [ ] How does Klatt synthesizer model incomplete stops (hold without release)?
- [ ] Should TTS probabilistically omit releases based on context?
- [ ] Does current implementation distinguish release duration by voicing?
- [ ] Are velar releases appropriately longer than labial/alveolar?

## Related Work Worth Reading

- **Zue (1976)** - "Acoustic characteristics of stop consonants: A controlled study" - MIT dissertation, detailed stop acoustics
- **Klatt (1973)** - Consonant cluster shortening effects
- **Crystal & House (1988a,b,c)** - Companion papers on vowel duration and syllable stress
- **Umeda (1977)** - "Consonant duration in American English" - JASA
- **Port (1979)** - Tempo effects on stop closure

## Key Quotes

> "The overall conclusion that seems warranted, for these data at least, is that in connected speech materials the hold portions of stop consonants are not strong indicators of their (nominal) source characteristic or (nominal) place of articulation." (p. 291)

> "Only 437 out of a total of 972 identified stops were complete... the difficulties encountered in identifying stop sounds by means of automatic algorithms were exacerbated." (p. 285)

> "When the syllable was stressed, the stops tended to be complete (97%), but the proportion of nonprepausal stressed word-final syllables ending in a stop varied from 0.05 when the word-boundary was followed by a stop to 0.69 when the word-boundary was followed by a vowel." (p. 287)
