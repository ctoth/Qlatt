# Pages 440-479 Notes

## Chapters/Sections Covered

This chunk consists almost entirely of **F0 contour figures** (Figures 27-100) from what appears to be an appendix or data presentation section. These figures show fundamental frequency (F0) measurements from multiple speakers reading various sentence types in different prosodic contexts.

## Key Findings

### Sentence Types and F0 Patterns Documented

The figures document F0 contours for sentences with varying:

1. **Modal auxiliaries**: "might", "may", "have", "would", "not"
2. **Quantifiers**: "some", "both", "all", "the"
3. **Speaking styles**: "citation" (isolated/careful speech) vs "paragraph" (connected speech)
4. **Syntactic structures**:
   - Simple declaratives: "Joe studied his books"
   - Questions: "Have the boys been studying their books?"
   - Relative clauses: "It was the farmer who was eating the carrot"
   - Cleft constructions: "It was Joe who delivered the meat"
   - Coordinated NPs: "He bought a red car and a blue blouse"

### Speaker Variation

Figures show data from multiple speakers identified by initials:
- JA (appears frequently)
- KS
- DO (DC in some figures)

Each speaker shows characteristic F0 ranges:
- Peak F0 values typically 160-200 Hz
- Valley F0 values typically 80-130 Hz
- Individual speakers show consistent patterns across utterances

### F0 Range Observations

From the figures, typical F0 values observed:

| Context | Peak F0 (Hz) | Valley F0 (Hz) | Notes |
|---------|-------------|----------------|-------|
| Sentence-initial stressed syllable | 170-200 | - | High onset |
| Content word stress | 140-180 | - | Variable by position |
| Function words | 100-140 | - | Generally lower |
| Sentence-final | - | 80-120 | Declination endpoint |
| Question rise | 150-200 | - | Final rise pattern |

### Declination Pattern

Nearly all declarative contours show **global declination** - F0 peaks progressively lower throughout the utterance:
- First stressed syllable: highest peak (often 170-200 Hz)
- Medial stressed syllables: mid-range peaks (140-170 Hz)
- Final stressed syllable: lower peak (120-150 Hz)
- Utterance-final: lowest point (80-120 Hz)

### Stressed Syllable Markers

The figures use the symbol "$" (phi) to mark stressed syllables, showing:
- Primary stress receives highest local F0 peak
- Stressed syllables show characteristic rise-fall pattern
- Duration of stressed vowels appears longer (wider spacing on time axis)

### Citation vs Paragraph Prosody

Comparing citation and paragraph modes for same sentences:
- **Citation**: Larger F0 range, more distinct peaks, slower tempo
- **Paragraph**: Compressed F0 range, reduced peaks, faster tempo, more declination

### Time Scale Observations

Utterances typically span:
- Short sentences: 800-1200 msec
- Medium sentences: 1200-1500 msec
- Long/complex sentences: 1500-2000+ msec

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Peak F0 | F0_max | 160-200 | Hz | Sentence-initial stressed syllable |
| Valley F0 | F0_min | 80-120 | Hz | Sentence-final position |
| F0 range | - | ~80-100 | Hz | Typical speaker range within utterance |
| Sentence duration | - | 800-2000 | msec | Varies by length/complexity |

## Figures of Interest

- **Fig. 27-28** (p. 441): Comparison of "might not have studied" vs "may have been studying" - modal auxiliary effects
- **Fig. 29a-b** (p. 442): Sentence with "BOYS" quantifier showing F0 peak alignment with stressed content words
- **Fig. 32** (p. 444): Multi-word sequence "JOSEPH" showing proper noun F0 treatment
- **Fig. 39** (p. 447): Full sentence "JOSEPH... MODAL AUX... STUD-IED... BOOKS" timeline
- **Fig. 52** (p. 455): "A farmer was eating the carrot" - shows classic declination
- **Fig. 56** (p. 459): Relative clause "IT WAS... FARM-ER... WHO WAS... EAT-ING"
- **Fig. 69-70** (p. 466): Conditional "If the painter does not use a plastic/bristle brush"
- **Fig. 86-87** (p. 474): Cleft with object relative "THE ONE WHO WAS EATING"
- **Fig. 94-95** (p. 478): Copular sentences "That fish is tasty" - shows predicate F0
- **Fig. 99-100** (p. 480): Yes/no questions "Have the boys been studying their books?"

## Rules/Algorithms

From visual analysis of the contours, these F0 assignment patterns emerge:

1. **Initial High**: First stressed syllable of utterance gets highest F0 peak
2. **Declination**: Each subsequent stressed syllable peak is ~5-15 Hz lower than previous
3. **Content > Function**: Content words (nouns, verbs, adjectives) get higher F0 than function words
4. **Focus Boost**: Focused/emphasized words show ~20-30 Hz boost above normal
5. **Phrase Boundary Reset**: After major phrase boundary, F0 partially resets upward
6. **Final Lowering**: Sentence-final syllable drops to speaker's baseline (~80-100 Hz for males)
7. **Question Rise**: Yes/no questions show final rise of ~30-50 Hz

## Implementation Notes

For TTS prosody implementation, these figures suggest:

1. **Baseline declination model**: Start high (~180 Hz for male), decline ~10 Hz per stressed syllable
2. **Stress-timed peaks**: Align F0 peaks with stressed vowel onsets
3. **Phrase structure**: Use syntax to determine phrase boundaries for partial F0 reset
4. **Speaking style parameter**: Implement "citation" vs "paragraph" modes with different F0 ranges
5. **Final lowering**: Implement utterance-final F0 target ~60-80% of speaker's range minimum
6. **Question intonation**: Implement final boundary tone rise for interrogatives

### Typical F0 Contour Shape (Male Speaker)

```
F0(t) for declarative sentence:
- Onset: ~160-180 Hz (first stressed syllable)
- Medial: Linear decline with local peaks at stress
- Final: Drop to ~100-120 Hz
- Post-final: Creaky voice / ~80-100 Hz
```

### Speaker Normalization

The three speakers show different absolute ranges but similar patterns:
- JA: Higher range (~130-190 Hz)
- KS: Mid range (~120-170 Hz)
- DO: Lower range (~100-150 Hz)

This suggests F0 rules should be specified in relative terms (% of range) rather than absolute Hz values.
