# Articulation and Sound Change in Romance

**Authors:** Daniel Recasens
**Year:** 2003
**Venue:** 15th International Congress of Phonetic Sciences (ICPhS), Barcelona
**ISBN:** 1-876346-48-5

## One-Sentence Summary

This paper demonstrates how articulatory constraints (tongue dorsum gestures, coarticulation, closure difficulty) drive sound changes in Romance languages, providing phonetic rationales for diphthong stability, velar palatalization paths, glide epenthesis, and consonant lenition/fortition.

## Problem Addressed

Romance linguists have long debated whether sound changes are driven by articulatory (production) or perceptual factors. This paper marshals evidence from Romance dialects to show that many changes traditionally attributed to perception are better explained by articulatory mechanics.

## Key Contributions

1. **Diphthong stability rules**: Explains why homorganic rising diphthongs ([ji], [je], [wu], [wo]) resist dissimilatory lowering while heterorganic ones ([jo], [we]) resist both raising and lowering
2. **Velar palatalization mechanism**: Front velars → palatal/alveolar affricates via closure fronting along hard palate, not perceptual confusion
3. **Glide epenthesis patterns**: Transitional glides arise from coarticulatory gestures - their quality predictable from adjacent consonant articulation
4. **Weakening vs. strengthening**: Clarifies which changes involve true articulatory reduction vs. aerodynamic/perceptual factors

## Methodology

Comparative analysis of sound change data from:
- Occitan, Francoprovençal, Gascon dialects
- Catalan, Spanish, Portuguese
- Northern Italian varieties
- Romansh

Cross-referenced with articulatory phonetics literature (palatography, coarticulation studies).

## Key Findings

### 1. Vocalic Sequences (Diphthongs/Triphthongs)

**Homorganic sequences** (glide + vowel share frontness/backness):
- [ji], [je], [wu], [wo], [jej], [jew] etc.
- Undergo assimilatory RAISING readily
- RESIST dissimilatory lowering
- **Reason**: Strong carryover coarticulation from glide constrains vowel articulation

| Sequence Type | Raising? | Lowering? | Rationale |
|--------------|----------|-----------|-----------|
| [jɛj] | Yes → [jej] → [i] | No | Tongue dorsum raising carryover |
| [jɛw] | Yes → [jew] → [iw] | No | Same + lip rounding |
| Heterorganic [jo], [we] | No | No | Antagonistic gestures block changes |

**Heterorganic sequences** ([we], [jo], [wi], [jɔ]):
- Involve antagonistic gestures (e.g., [w] = back+round, following [e] = front+unround)
- Resist both raising AND lowering
- Tend toward simplification (glide deletion, vowel rounding)

### 2. Velar Palatalization

**Mechanism**: Closure location fronting, NOT perceptual similarity of release bursts

| Stage | Articulation Zone | Example |
|-------|-------------------|---------|
| Back velar [k] | Postpalatal | - |
| Front velar | Mediopalatal | - |
| Palatal stop | Alveolopalatal | Most common for "palatal" stops |
| Palatalized dental | Dentoalveolar | Occitan [tju] < CULU |
| Affricate | Alveolar | [tʃ], [ts] |

**Key insight**: True hard palate closure is difficult - palatographic data shows "palatal" consonants are usually alveolopalatal.

**Labial palatalization** ([pj] → [tʃ]):
- NOT acoustic similarity
- Glide [j] undergoes obstruentization: [pj] > [pç] > [ptʃ] > [tʃ]
- Example: Northern Italian [ptʃen], [pʃe], [tʃeŋ] < PLENU "full"

### 3. Transitional Glide Epenthesis

Glides inserted at CV/VC boundaries arise from phonemic categorization of coarticulatory transitions.

| Context | Inserted Glide | Mechanism | Examples |
|---------|---------------|-----------|----------|
| V + dark [ɫ] | [a], [ɔ] (low F2) | Regressive tongue dorsum lowering/retraction | Limousin [ˈtjalo] < TELA |
| V + [w] | [a], [ɔ] | Anticipatory lip rounding + dorsum retraction | Romansh [awlt] < ALTU |
| V + trill [r] | [a] | Tongue dorsum lowering for trill | [ˈtjaro] < TERRA |
| Palatal C + V | [j] | Progressive dorsum raising | French chièvre < CAPRA |
| Labial/Velar + back V | [w] | Progressive lip/dorsum gesture | Occitan [kwolp] < COLAPHU |

**Articulatory timing**: For dark [ɫ] and [w], tongue dorsum moves before tongue tip raises or lips close - creates audible transition.

### 4. Weakening and Strengthening

**True articulatory weakening**:
- Consonant vocalization with predictable outcomes:
  - Palatals → [j]: [ʎuna] → [juna] (Campania LUNA)
  - Labials/velars → [w]: [dɛbt] → [dɛwtə] (Catalan DEB(I)TU)
- Dental stop deletion (small closure area, easy overlap)
- Rhotacism, [s] aspiration (closure degree reduction)

**NOT true weakening** (other mechanisms):
| Change | Traditional View | Actual Mechanism |
|--------|-----------------|------------------|
| Back velar voicing/lenition | Weakening | Incomplete closure at soft palate (aerodynamic) |
| Alveolar trill → uvular [r]→[ʀ] | Weakening | Airflow optimization (reduce tongue tip tension) |

**Strengthening**:
- [l] → [ʎ], [ll] → [ʎ]: Increased duration and constriction
- But palatals don't require more effort - large contact area due to closure difficulty at hard palate

### 5. Perceptual (Not Articulatory) Changes

Some changes ARE perceptual despite articulatory explanations in older literature:

| Change | Why Perceptual |
|--------|---------------|
| Clear [l] ↔ tap [ɾ] | Acoustic similarity, reversible |
| Labial ↔ velar stops (syllable-final) | Large articulatory distance |
| [f] → [h] aspiration | Articulatory distance |
| Nasalized vowel → [ŋ] or off-glide | Nasal formant spectral effects |
| Dark [ɫ]/[β]/[ɣ] → [j] before dental | Vowel transition integration |

## Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Carryover coarticulation strength | High for [j], [w] | Constrains following vowel targets |
| Hard palate closure | Difficult | Explains alveolopalatal realization of "palatals" |
| Back velar closure | Often incomplete | Leads to apparent voicing/lenition |

## Implementation Relevance (TTS/Synthesis)

### Coarticulation Modeling
- **Strong carryover from glides**: When synthesizing [jV] or [wV] sequences, the vowel formants should be heavily influenced by glide
- **Heterorganic sequences more variable**: [jo], [we] may have less predictable transitions

### Glide Insertion Rules
For allophonic glide insertion in careful/dialectal speech:
```
V → V[j] / _ [+palatal]C
V → V[w] / _ [+labial]C  OR  _ [+velar, +back]C
V → V[ə/a] / _ dark [ɫ]
V → V[ə/a] / _ [r]
```

### Palatalization Continuum
When modeling palatalized consonants, the closure location affects release burst:
- Mediopalatal: More stop-like release
- Alveolopalatal: Affricate-like release possible
- Implications for [kj], [gj] sequences

## Figures of Interest

None (text-only conference paper)

## Limitations

- Focus on historical/dialectal data, not controlled phonetic experiments
- Coarticulation claims cite other work rather than presenting new measurements
- Some claims about "articulatory effort" lack quantification

## Open Questions

- [ ] How do carryover vs. anticipatory coarticulation weights vary across consonant classes?
- [ ] What acoustic cues distinguish "true" weakening from aerodynamic effects?
- [ ] Can the glide epenthesis patterns be implemented as automatic allophonic rules?

## Related Work Worth Reading

- [7] Recasens 1999 "Lingual coarticulation" in Coarticulation (Hardcastle & Hewlett) - detailed coarticulation mechanics
- [13] Recasens 1990 "Articulatory characteristics of palatal consonants" J.Phonetics - palatographic evidence
- [21] Sproat & Fujimura 1993 - English /l/ allophony and timing
- [22] Recasens 1991 - Alveolar tap/trill production and coarticulation
