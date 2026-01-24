# Loose lips and tongue tips: The central role of the /r/-typical labial gesture in Anglo-English

**Authors:** Hannah King, Emmanuel Ferragne
**Year:** 2020
**Venue:** Journal of Phonetics, 80, 100978
**DOI:** https://doi.org/10.1016/j.wocn.2020.100978

## One-Sentence Summary
This paper documents articulatory trading relations between tongue shape and lip protrusion in English /r/, showing that bunched configurations require more lip protrusion to maintain acoustic equivalence with retroflex variants.

## Problem Addressed
The exact contribution of the lips to English /r/ production was unknown, particularly how lip gestures interact with different tongue configurations (bunched vs. retroflex) to produce acoustically equivalent outputs.

## Key Contributions
1. First large-scale documentation of tongue shape variation in Anglo-English /r/ (24 speakers)
2. Establishes articulatory-acoustic trading relation between sublingual space and lip protrusion
3. Demonstrates that /r/ and /w/ have distinct lip postures (exolabial vs. endolabial)
4. Proposes mechanism for ongoing labiodentalisation of /r/ in Anglo-English

## Methodology
- **Participants:** 24 native Anglo-English speakers (22 F, 2 M), ages 18-55
- **Data:** Ultrasound tongue imaging + synchronized lip camera (front & profile)
- **Stimuli:** 16 minimal pairs contrasting /r/ and /w/ word-initially before 8 vowels
- **Analysis:** Visual classification of tongue shapes, quantitative lip protrusion/spreading/aperture measures

## Key Findings

### Tongue Shape Distribution
| Configuration | Description | % of speakers |
|--------------|-------------|---------------|
| Mid Bunched (MB) | Middle tongue raised, tip low | Part of 29% bunchers |
| Front Bunched (FB) | Front tongue bunched with dip | Part of 29% bunchers |
| Front Up (FU) | Front/blade/tip raised, convex | Part of 58% retroflexers |
| Tip Up (TU) | Tongue tip pointing up, steep | Part of 58% retroflexers |
| Curled Up (CU) | Concave tongue, tip curled | Part of 58% retroflexers |

- **14/24 (58%)** speakers used only retroflex configurations
- **7/24 (29%)** speakers used only bunched configurations
- **3/24 (13%)** speakers used both (all from South East England)

### Acoustic Properties of /r/ (Female speakers, n=22)

| Formant | Mean (Hz) | Std Dev |
|---------|-----------|---------|
| F1 | 421 | 65 |
| F2 | 1236 | 224 |
| F3 | 1881 | 198 |

**Critical finding:** No statistically significant difference in F3 between tongue configurations when speaker variation is controlled.

### Lip Protrusion by Tongue Shape (Key Result)

| Tongue Config | Lip Protrusion | Significance |
|---------------|---------------|--------------|
| Bunched (FB, MB) | ~4-5 mm | Significantly MORE |
| Retroflex (CU, TU, FU) | ~2 mm | Reference level |

Statistical model: Bunched configurations (FB, MB) have significantly more lip protrusion than Curled Up retroflex (p < 0.001 for FB, p = 0.02 for MB).

### /r/ vs /w/ Lip Postures

| Dimension | /r/ (% change from neutral) | /w/ (% change from neutral) |
|-----------|---------------------------|---------------------------|
| Protrusion | +13.18% | +18.69% |
| Spreading | -0.07% (essentially neutral) | -11.92% (compressed) |
| Aperture | +16.20% | +24.51% |

**Key discriminator:** Horizontal lip compression (spreading) is the only statistically significant predictor distinguishing /r/ from /w/ (p < 0.001).

- **/r/:** Exolabial - lips protruded without horizontal compression, elliptical opening
- **/w/:** Endolabial - lip corners pushed to center, circular opening

## Articulatory-Acoustic Trading Relation

$$
\text{Front Cavity Volume} = \text{Sublingual Space} + \text{Lip Tube Extension}
$$

The front cavity must be sufficiently large to produce the characteristic low F3 of /r/:

| Configuration | Sublingual Space | Lip Protrusion | Result |
|---------------|-----------------|----------------|--------|
| Retroflex | Large (tip up creates space) | Less needed | Low F3 |
| Bunched | Small (tip down) | More needed to compensate | Low F3 |

**Sublingual space contribution:** ~200 Hz lowering of F3 (from Espy-Wilson et al., 2000)

## Vowel Context Effects

### Retroflexion Favored By:
- **Back vowels** (LOT, THOUGHT) - most retroflexion (~75% Curled Up before LOT)
- **Open vowels** - more compatible with tongue retraction

### Bunching Favored By:
- **Front vowels** (FLEECE, KIT, GOOSE, DRESS)
- **Close vowels** - tongue shape for [i] incompatible with retroflexion

### Lip Protrusion by Vowel Context
- KIT and DRESS have significantly LESS protrusion than FLEECE
- FLEECE has elevated protrusion despite being unrounded (compensating for fronted tongue position)

## Parameters for Synthesis

### Formant Targets for /r/ (Female)
| Parameter | Value | Notes |
|-----------|-------|-------|
| F1 | 300-500 Hz | ~420 Hz typical |
| F2 | 900-1300 Hz | ~1236 Hz typical |
| F3 | 1300-2000 Hz | ~1880 Hz typical, must be close to F2 |

### Lip Parameter Differences (/r/ vs /w/)
| Parameter | /r/ | /w/ |
|-----------|-----|-----|
| Horizontal compression | Minimal | ~12% reduction |
| Lip opening shape | Elliptical/slit | Circular |
| Protrusion | Moderate | Higher |

## Implementation Notes

### For Klatt Synthesizer
1. **F3 proximity to F2** is the key acoustic cue for /r/ - maintain F3-F2 < 700 Hz
2. **Lip rounding parameter** should differ between /r/ and /w/:
   - /w/: Full endolabial rounding (lip corners compressed)
   - /r/: Exolabial protrusion (no horizontal compression)
3. **Coarticulation modeling:** /r/ before front vowels may need adjusted F3 (higher) or lip parameters

### Decision Tree for /r/ Tongue Classification (Fig. 3)
```
Is tongue tip up?
├─ YES: Is there bright region/discontinuity?
│       ├─ YES → Curled Up
│       └─ NO: Is tongue surface concave?
│               ├─ YES → Curled Up
│               └─ NO: Is surface straight/steep?
│                       ├─ YES → Tip Up
│                       └─ NO (convex) → Front Up
└─ NO: Is there distinctly bunched config (with dip)?
        ├─ YES → Front Bunched
        └─ NO → Mid Bunched
```

## Figures of Interest
- **Fig. 2 (p. 6):** Raw ultrasound frames showing all 5 tongue configurations
- **Fig. 3 (p. 6):** Decision tree for tongue shape classification
- **Fig. 4 (p. 7):** Lip protrusion measurement technique (profile view)
- **Fig. 5 (p. 7):** Lip aperture/spreading measurement (frontal view)
- **Fig. 8 (p. 10):** Proportion of tongue configs by following vowel
- **Fig. 9 (p. 10):** Tongue contour tracings for all speakers (FLEECE vs LOT)
- **Fig. 11 (p. 11):** Predicted lip protrusion by tongue configuration
- **Fig. 15 (p. 13):** Frontal lip images comparing /r/ and /w/

## Limitations
- Limited male speakers (2/24)
- Not geographically stratified - cannot make regional claims
- Sublingual space not directly visible from ultrasound
- Front lip aperture measurement challenging (vermilion border unclear in some speakers)
- No direct MRI data for vocal tract dimensions

## Relevance to Qlatt Project

### Direct Applications
1. **Different lip parameters for /r/ vs /w/:** The synthesizer should not use identical lip rounding - /w/ needs horizontal compression that /r/ lacks
2. **F3 targeting:** Maintain F3-F2 proximity (~600 Hz difference) as primary /r/ cue
3. **Coarticulation rules:** /r/ + front vowel contexts may need F3 adjustment

### Synthesis Implications
- Current Klatt implementations may oversimplify lip rounding as binary
- A "lip protrusion without compression" parameter would better model /r/
- The exolabial/endolabial distinction could be modeled via independent control of:
  - Lip protrusion (affects F1, F2, F3 lowering)
  - Lip spreading (affects horizontal constriction)

## Open Questions
- [ ] How does lip protrusion interact with other formants (F1, F2)?
- [ ] What are the perceptual thresholds for /r/-/w/ distinction based on lip configuration?
- [ ] How do American English /r/ lip postures differ quantitatively?
- [ ] Can the exolabial/endolabial distinction be implemented in Klatt synthesis?

## Related Work Worth Reading
- Espy-Wilson et al. (2000) - Acoustic modeling of American English /r/, MRI-derived vocal tract
- Alwan et al. (1997) - Front cavity dimensions for bunched vs retroflex
- Zhou et al. (2008) - MRI study showing F4-F5 differences between tongue shapes
- Stevens (1998) - Acoustic Phonetics, theoretical basis for F3 lowering
- Dalcher et al. (2008) - Perceptual differences between American and Anglo-English /r/
- Smith et al. (2019) - American English /r/ lip postures (more variable than Anglo-English)
