# Cho & Ladefoged 1999 - Variation and Universals in VOT: Evidence from 18 Languages

## Key Findings for Synthesizer Implementation

### VOT by Place of Articulation (Universal Tendencies)

For **unaspirated voiceless stops** across 18 languages (Table IV, mean VOT in ms):

| Place | Typical VOT range | General pattern |
|-------|------------------|----------------|
| Bilabial /p/ | 10-22 ms | Shortest |
| Dental/Alveolar /t/ | 6-76 ms | Intermediate |
| Velar /k/ | 20-95 ms | Longest |

**Universal ordering**: VOT(bilabial) < VOT(coronal) < VOT(velar), with exceptions.

The velar-coronal VOT difference (~18.9 ms for unaspirated, ~16.7 ms for aspirated) is robust across languages. The bilabial-coronal difference (~4.6 ms) is smaller and not always significant.

### VOT for Aspirated Stops

From Lisker & Abramson 1964 data (Table II, ms):

| Place | Cantonese | English | Eastern Armenian | Korean |
|-------|-----------|---------|-----------------|--------|
| /p^h/ | 77 | 58 | 78 | 91 |
| /t^h/ | 75 | 70 | 59 | 94 |
| /k^h/ | 87 | 80 | 98 | 126 |

### Four VOT Categories (Figure 9)

Cross-linguistic data on velar stops suggests four approximate phonetic categories:
1. **Unaspirated**: ~10-30 ms (Khonoma Angami, Dahalo, Tsou, Gaelic, Defaka, etc.)
2. **Slightly aspirated**: ~30-50 ms (Tlingit unasp., Apache unasp., Chickasaw, Bowiri, Banawa, etc.)
3. **Aspirated**: ~60-90 ms (Gaelic asp., Apache asp., Aleut E, Aleut W, Hupa asp., etc.)
4. **Highly aspirated**: ~90-160 ms (Khonoma Angami asp., Jalapa Mazatec asp., Tlingit asp., Navajo asp.)

An arbitrary boundary at ~50 ms separates aspirated from unaspirated stops.

### Ejective VOT (Table V)

For languages with ejectives, VOT measured from oral release to glottal release (ms):

| Language | Bilabial | Alveolar | Velar | Uvular |
|----------|----------|----------|-------|--------|
| Apache | - | 46 | 60 | - |
| Hupa | - | 93 | 80 | 89 |
| Montana Salish | 81 | 65 | 86 | 81 |
| Navajo | - | 108 | 94 | - |
| Tlingit | - | 95 | 84 | 117 |
| Yapese | 60 | 64 | 78 | - |

No consistent place-of-articulation pattern for ejectives (unlike plosives).

### Three-Way Stop Contrasts (Table VI)

Languages with ejective/unaspirated/aspirated velar stops (ms):

| Language | Unaspirated k | Ejective k' | Aspirated k^h |
|----------|--------------|-------------|---------------|
| Apache | 31 | 60 | 80 |
| Hupa | 44 | 80 | 84 |
| Navajo | 45 | 94 | 154 |
| Tlingit | 28 | 84 | 128 |

Ejective VOT falls between unaspirated and aspirated, enhancing contrastiveness.

### Physiological/Aerodynamic Explanations for VOT Place Effects

Six factors account for the velar > alveolar > bilabial VOT ordering:

1. **Cavity volume behind constriction**: Smaller supraglottal cavity behind velar stops means longer time for transglottal pressure equalization.
2. **Cavity volume in front of constriction**: Larger air mass in front of velar stops creates greater obstruction to pressure release.
3. **Articulator movement velocity**: Faster lip/tongue-tip movement (vs. tongue dorsum) produces more rapid pressure decrease and earlier voicing.
4. **Extent of articulatory contact**: Greater contact area for velars (dorsum-palate) means slower release due to Bernoulli effect pulling articulators together.
5. **Glottal opening area change** (for aspirated stops): Glottal area decreases less rapidly for velars because intraoral pressure drops more slowly.
6. **Closure duration / VOT trade-off**: Fixed vocal fold opening duration means shorter closure = longer aspiration (VOT), and velars have shorter closures.

### Implementation Notes for Klatt Synthesizer

**For setting AH (aspiration) and AF (frication) timing after stop release:**

- VOT determines the interval between burst release and voicing onset (AV rise)
- Use place-dependent VOT values:
  - Bilabial: ~15 ms (unaspirated), ~58 ms (aspirated, English)
  - Alveolar: ~20 ms (unaspirated), ~70 ms (aspirated, English)
  - Velar: ~30 ms (unaspirated), ~80 ms (aspirated, English)
- During VOT interval: AH > 0 (aspiration noise), AV = 0 (no voicing)
- English uses the "slightly aspirated" to "aspirated" range for voiceless stops

**For voiced stops** (not main focus of paper): VOT is negative (voicing lead) or near zero. The paper focuses only on positive VOT (voiceless stops).

**Language-specific variation**: Even with universal place effects, the absolute VOT values are language-specific. The grammar must contain language-specific components for VOT targets.

### Key Distinction: Phonetic vs. Phonological VOT

The authors propose redefining VOT for phonological purposes as the interval between the articulatory gesture for release and the laryngeal gesture for voicing (rather than the acoustic interval between burst and voicing onset). This is compatible with articulatory phonology (Browman & Goldstein 1990, 1992).
