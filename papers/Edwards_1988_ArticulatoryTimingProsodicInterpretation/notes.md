# Edwards & Beckman 1988 — Articulatory Timing and the Prosodic Interpretation of Syllable Duration

## Key Findings for Synthesis

### Central Claim
Different prosodic contrasts have qualitatively different effects on syllable-internal timing, not just quantitative duration scaling. Phrase-final lengthening and stress lengthening are NOT the same kind of operation applied with different magnitudes — they affect different parts of the syllable.

### Prosodic Conditions Tested
Four conditions using nonsense words (*pop*, *poppa*, *pop opposed*, *pop posed*):
1. **Intonation-phrase-final** vs. phrase-internal position
2. **Nuclear accent** (pitch accent) vs. unaccented
3. **Monosyllable vs. disyllable** (*pop* vs. *poppa*)
4. **Stress clash** (*pop posed* vs. *pop opposed*)

Three speaking rates: fast, normal, slow. Two subjects (JRE, KAJ).

### Measurement Framework: Sonority Rise
Instead of raw millisecond durations, they measure the **sonority profile** of the vocalic gesture:
- **Articulatory vowel period**: time course of jaw opening and closing gestures (mandibular displacement)
- **Sonority rise**: duration from opening gesture onset to peak sonority (maximum jaw opening)
- This captures *how* the syllable unfolds, not just *how long* it lasts

### Finding 1: Phrase-Final Lengthening — Disproportionate Closing Phase
- Phrase-final syllables have significantly **shorter sonority rise ratios** relative to total vowel period
  - JRE: t(29) = 9.316, p < 0.001
  - KAJ: t(25) = 6.508, p < 0.001
- This means lengthening is concentrated in the **latter part of the vocalic gesture** (the closing phase)
- The sonority profile shape changes: phrase-final syllables have a steeper rise and longer fall
- This is an **edge effect** — it slows the closing gesture, extending the tail of the sonority profile

**Implementation implication**: Phrase-final lengthening should NOT be modeled as a uniform duration multiplier. The closing portion of the vowel (and any following sonorant) should be lengthened more than the opening portion.

### Finding 2: Nuclear Stress — More Even Distribution
- Nuclear-accented syllables show increased prominence that affects the sonority profile **more evenly throughout the syllable**
- Greater overall sonority (larger jaw displacement) but the ratio of sonority rise to vowel period remains more constant
- Increased prominence also affects the **opening gesture**: longer and more extreme F1 movement
- The primary result of nuclear accent is to increase a syllable's **overall sonority** with a much lesser influence on the **shape** of the sonority profile

**Implementation implication**: Stress-related lengthening can be modeled more uniformly across the syllable — a duration multiplier applied to the whole segment is a reasonable approximation for stress (though not ideal).

### Finding 3: Phrase-Final + Accent Interaction
- When both phrase-final position and nuclear accent are present, the effects combine
- The phrase-final edge effect (disproportionate closing-phase lengthening) is the dominant pattern
- Phrase-final lengthening is associated with absolutely shorter sonority rise relative to phrase-internal counterparts, even with a nuclear accent

### Finding 4: Monosyllables vs. Disyllables
- The contrast between monosyllabic *pop* and disyllabic *poppa* does NOT show the same sonority profile shape differences as phrase-final lengthening
- The ratio of sonority rise to vowel period remains constant across the two conditions
- The word-final acoustic difference is NOT a lower-level counterpart of phrase-final lengthening

### Finding 5: Stress Clash
- Stress clash (adjacent stressed syllables) does NOT result in significantly longer acoustic durations
- Sonority rises are clearer in stress-clash contexts, suggesting articulatory reorganization rather than simple durational changes
- Stress clash involves the timing relationship between the accent peak (F0, sonority) and the opening gesture — not duration per se

### Statistical Results Summary

| Contrast | Measure | Subject | Statistic |
|----------|---------|---------|-----------|
| IP-final vs internal | Sonority ratio | JRE | t(29) = 9.316, p < 0.001 |
| IP-final vs internal | Sonority ratio | KAJ | t(25) = 6.508, p < 0.001 |
| Nuclear accent | Sonority ratio | JRE | t(29) = 12.42, p < 0.001 |
| Nuclear accent | Sonority ratio | KAJ | t(30) = 12.813, p < 0.001 |
| Accented mono vs disyll | Vowel dur | JRE | t(25) = 7.515, p < 0.001 |
| Accented mono vs disyll | Vowel dur | KAJ | t(25) = 5.934, p < 0.001 |

### Implications for Duration Modeling in Synthesis

1. **Phrase-final lengthening** should be implemented as a **non-uniform stretch** that disproportionately affects the closing portion of the vowel and following consonant transitions. A simple duration multiplier is inadequate.

2. **Stress/accent lengthening** can be more reasonably approximated by a uniform duration multiplier, though the articulatory correlate is really increased displacement (greater sonority) rather than slowed timing.

3. **Sonority profile** is proposed as the appropriate phonological representation for prosodic timing effects, rather than millisecond values or durational ratios.

4. The authors argue that a complete model of timing must provide a quantitative description of the interactions between prosodic levels (stress, phrasing) and the rise and fall of sonority within the syllable — relating suprasegmental features to the realization of segmental features affiliated with the syllable.

### Connection to F0 and Formant Patterns
- The sonority peak and the accent's F0 peak are prosodically related — the F0 peak for a high accent occurs earlier relative to the sonority peak in phrase-final position
- The accent's F0 target and the vowel's sonority target are related to the same structural unit (the same syllable)
- Predicting F0 peak position relative to sonority peak for each syllable is proposed as a better approach than independent timing of F0 and duration

### Relation to Klatt 1976 Duration Model
- Klatt 1976 uses multiplicative durational factors for various prosodic effects
- Edwards & Beckman argue this framework is insufficient because it treats all prosodic effects as the same type of operation (scaling duration)
- Their data show that phrase-final lengthening requires a qualitatively different representation than stress lengthening
- However, for practical synthesis, a two-factor approach could work: uniform scaling for stress, plus a separate closing-phase scaling for phrase-final position
