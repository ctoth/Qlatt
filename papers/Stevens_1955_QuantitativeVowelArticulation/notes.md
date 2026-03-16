---
title: "Development of a Quantitative Description of Vowel Articulation"
authors: "Kenneth N. Stevens, Arthur S. House"
year: 1955
venue: "Journal of the Acoustical Society of America, Vol. 27, No. 3, pp. 484-493"
doi_url: "10.1121/1.1907943"
---

# Development of a Quantitative Description of Vowel Articulation

## One-Sentence Summary
This paper develops a three-parameter articulatory model (tongue constriction position, constriction size, mouth opening ratio) and maps it to the first three formant frequencies using a 35-section electrical vocal tract analog.

## Problem Addressed
Existing vocal tract analogs were either too complex (35 independent switches) or too simple (Dunn's 3-control model with limited accuracy). A description was needed that combines the simplicity of few control parameters with the accuracy of a detailed tract model, for both speech bandwidth compression and phonetic description.

## Key Contributions
- A three-parameter articulatory description of vowels: constriction distance from glottis ($d_0$), constriction radius ($r_0$), and mouth opening ratio ($A/l$)
- A parabolic equation (Eq. 1) defining the tract profile from the constriction parameters
- Comprehensive experimental data: 306 configurations measured on a 35-section LC electrical analog, yielding F1, F2, F3 for all combinations
- Contours of constant F1 and F2 in articulatory space (Fig. 5)
- Vowel articulation contours (Fig. 7) showing ranges of articulatory positions that produce each vowel, mapped from Peterson & Barney (1952) data
- Finding that /i/ is primarily determined by tongue position while /u/ is primarily determined by mouth opening (lip rounding)

## Methodology
- Used a 35-section LC electrical analog of the vocal tract (Stevens, Kasowski, & Fant, 1953)
- Each section represents a 1/2-cm length of the vocal tract
- Cross-sectional area variable through 11 values from 0.17 to 17 cm^2
- Swept audio oscillator through frequencies up to 4000 cps, measured transmission peaks (formant frequencies)
- 306 total configurations: 10 values of $d_0$ (4-13 cm) x 6 values of $r_0$ (0.3-1.2 cm) x 6 values of $A/l$ (0.11-17 cm)
- Note: for $r_0$ = 1.2 cm, shape is independent of $d_0$, so 54 of the 360 possible configurations are identical

## Key Equations

### Eq. 1: Parabolic tongue contour

$$
r - r_0 = 0.25(1.2 - r_0)x^2
$$

Where:
- $r$ = radius of tube at distance $x$ from constriction (cm)
- $r_0$ = radius at the point of constriction (cm)
- $x$ = horizontal distance from point of constriction (cm)
- Cross-sectional area = $\pi r^2$

**Behavior:**
- When $r_0 \to 1.2$ cm, coefficient $\to 0$, parabola is flat (uniform tube)
- When $r_0$ is small (e.g., 0.3 cm), coefficient is large, parabola is peaked (narrow constriction with large cavities on either side)
- Parabolic contour defines radius up to 14.5 cm from glottis

### Mouth opening impedance

$$
Z_{mouth} \propto l/A
$$

Where:
- $A$ = average cross-sectional area of the mouth opening section
- $l$ = length of the mouth opening section
- $A/l$ ratio used as the single parameter (rank-orders by size)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Constriction distance | $d_0$ | cm from glottis | - | 4-13 | Position of tongue constriction |
| Constriction radius | $r_0$ | cm | - | 0.3-1.2 | Radius at narrowest point; area = $\pi r_0^2$ |
| Mouth opening ratio | $A/l$ | cm | - | 0.1-20 | Large = open (/ae/), small = rounded (/u/) |
| Maximum radius near glottis | - | cm | 0.7-1.6 | - | Varies from 0.7 cm adjacent to glottis to 1.6 cm at 2.5 cm from glottis |
| Parabola coefficient | $0.25(1.2 - r_0)$ | cm^{-1} | - | 0-0.225 | Controls the "peakedness" of the tongue contour |

## Implementation Details

### Vocal tract model rules:
1. Compute $r$ at each point along the tube using Eq. (1) from the constriction parameters
2. The parabolic contour applies up to 14.5 cm from the glottis
3. Near glottis: apply maximum radius constraint (0.7 cm at glottis, 1.6 cm at 2.5 cm from glottis)
4. Beyond 14.5 cm: mouth opening section characterized by $A/l$ ratio as a lumped acoustic element
5. Cross-sectional area at each point = $\pi r^2$

### Key trends from experimental data (Fig. 3):
- **F1**: High when constriction is narrow and near glottis with large mouth opening. Low when mouth opening is small/rounded OR narrow constriction near mouth.
- **F2**: Increases as constriction moves forward and as $A/l$ increases. More pronounced with narrow constriction.
- **F3**: Small increase as constriction moves forward and mouth opening increases.
- **Crossover point** (Fig. 4): At certain constriction positions (near $d_0$ = 7 cm for $A/l$ = 3.2), formant frequency is almost independent of constriction size.

### Vowel-specific articulatory findings (Fig. 7):
- **/i/**: Constriction always >9.5 cm from glottis (front); requires narrow constriction; insensitive to mouth opening
- **/u/**: Produced over wide range of constriction positions but restricted to small $A/l$ values; production depends primarily on lip rounding
- **/ae/**: Large mouth opening, forward constriction
- With uniform tube ($r_0$ = 1.2 cm), only mouth opening determines output; high vowels impossible

## Figures of Interest
- **Fig. 1 (p. 485):** Mid-sagittal section of /i/ from Chiba & Kajiyama x-ray, shown as acoustic tube
- **Fig. 2 (p. 486):** Four idealized vocal tract configurations showing the three parameters
- **Fig. 3 (p. 487):** Core data -- F1, F2, F3 vs. constriction position for 6 constriction sizes and 6 mouth openings (6 panels)
- **Fig. 4 (p. 488):** F1 and F2 vs. constriction position for $A/l$ = 3.2 cm, showing crossover point
- **Fig. 5 (p. 489):** Contours of constant F1 and F2 in articulatory coordinates ($d_0$ vs. $A/l$) for 6 constriction sizes
- **Fig. 6 (p. 490):** F1-F2 vowel space from Peterson & Barney (1952) with adult male estimates
- **Fig. 7 (p. 491):** Vowel articulation contours -- ranges of articulatory positions producing each vowel, for 6 constriction sizes

## Results Summary
- The three-parameter model generates formant patterns consistent with natural speech
- One-to-one correspondence between articulatory dimensions and F1/F2 over most of the range
- Limited regions of double-valued solutions (two articulatory configurations yielding same formants), particularly for /u/ with small constrictions
- Front vowel series (/i/ -> /I/ -> /e/ -> /ae/) is well-ordered in articulatory space
- Back vowel series is less orderly, consistent with phonetic observations and x-ray research
- All English vowels except /u/ can be produced with mouth opening restricted to 1-4 cm range (pencil-between-teeth experiment)

## Limitations
- Static model only -- no dynamics of articulation
- No bandwidth data reported (acknowledged: bandwidth has "second-order effect on vowel quality")
- Idealized tract shapes are similar but not identical to x-ray observations
- Systematic auditory validation "now in progress" but not reported
- Adult male vocal tract dimensions only (17 cm total length assumed)
- Does not address consonant production or coarticulation

## Testable Properties
- For $r_0$ = 1.2 cm, formant frequencies must be independent of $d_0$ (uniform tube)
- F2 must increase monotonically as $d_0$ increases (constriction moves forward) for small $r_0$
- F1 must decrease as constriction moves forward for narrow constrictions
- At the crossover point (~$d_0$ = 7 cm), varying $r_0$ must produce minimal change in formant frequencies
- The parabolic contour must produce $r = r_0$ at $x = 0$ (apex condition)
- Mouth opening $A/l$ must be in range [0.1, 20] cm
- Constriction distance $d_0$ must be in range [4, 13] cm
- Constriction radius $r_0$ must be in range [0.3, 1.2] cm

## Relevance to Project
This paper provides the foundational articulatory-to-acoustic mapping for vowels. However, it does NOT contain formant locus values for consonant-vowel coarticulation. The locus values cited in our frontend.yaml rules (bilabial F2=1200 Hz, alveolar F2=1800 Hz, palatal F2=2600 Hz) likely come from a different Stevens work -- probably Stevens & House (1956) "Studies of formant transitions using a vocal tract analog" (JASA 28:578-585) or Delattre, Liberman & Cooper (1955).

**For Qlatt specifically:**
- The three-parameter model could inform an articulatory-to-formant mapping if we ever add articulatory control
- The F1/F2/F3 data in Figs. 3-5 provides a comprehensive reference for validating vowel formant targets
- The crossover point concept may be relevant for understanding coarticulation resistance

## Open Questions
- [ ] Verify which Stevens paper actually provides the formant locus values (1200/1800/2600 Hz) cited in our frontend.yaml
- [ ] The follow-up paper Stevens & House (1956) on formant transitions may be the one we actually need
- [ ] Does the parabolic model extend to consonant constrictions (radius < 0.3 cm)?

## Related Work Worth Reading
- Stevens & House (1956) "Studies of formant transitions using a vocal tract analog" -- LIKELY the paper with locus values we need
- Peterson & Barney (1952) -- canonical vowel formant data (F1-F2 areas for 9 vowels)
- Chiba & Kajiyama (1941) "The Vowel, Its Nature and Structure" -- x-ray vocal tract data
- Fant (1952) Tech. Rept. No. 12, MIT Acoustics Lab -- vocal tract analog theory
- Stevens, Kasowski, & Fant (1953) JASA 25:734-742 -- the 35-section electrical analog used in this study
- Delattre (1951) PMLA 66:864-875 -- relations between formant frequencies and cavity configurations
- Dunn (1950) JASA 22:740-753 -- earlier 3-control vocal tract analog

## Collection Cross-References

### Already in Collection
- [[Peterson_Barney_1952_VowelControl]] -- canonical F1-F2 vowel data used directly in this paper's Fig. 6-7
- [[Fant_1960_AcousticTheorySpeechProduction]] -- Fant's foundational text; this 1955 paper predates it but Fant was a co-author on the analog (ref 12)
- [[Fant_1985_LFModelGlottalFlow]] -- later Fant work, not directly related
- [[Delattre_1952_AcousticDeterminantsVowelColor]] -- Delattre's vowel work; the 1951 Delattre citation in this paper is a predecessor
- [[Stevens_1989_QuantalNatureSpeech]] -- Stevens' later quantal theory builds conceptually on the crossover-point findings here
- [[Stevens_1998_AcousticPhonetics]] -- Stevens' textbook incorporates and extends this work
- [[House_Stevens_1956_NasalizationVowels]] -- same authors, nasalization study from the following year
- [[Blumstein_Stevens_1979_AcousticInvariance]] -- Stevens' later work on acoustic invariance for consonants

### New Leads (Not Yet in Collection)
- Stevens & House (1956) "Studies of formant transitions using a vocal tract analog" JASA 28:578-585 -- THIS is likely the paper with the formant locus values (bilabial 1200 Hz, alveolar 1800 Hz, palatal 2600 Hz) cited in our frontend.yaml coarticulation rules
- Chiba & Kajiyama (1941) "The Vowel, Its Nature and Structure" -- x-ray vocal tract area functions that motivated the parabolic model
- Stevens, Kasowski, & Fant (1953) JASA 25:734-742 -- the 35-section electrical analog used in this study

### Supersedes or Recontextualizes
- None identified -- this is foundational work that predates most of the collection
