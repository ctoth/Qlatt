# Studies of Formant Transitions Using a Vocal Tract Analog

**Authors:** Kenneth N. Stevens and Arthur S. House
**Year:** 1956
**Venue:** The Journal of the Acoustical Society of America, Vol. 28, No. 4, pp. 578-585
**DOI:** 10.1121/1.1908403

## One-Sentence Summary
This paper uses a 35-section electrical vocal tract analog to empirically determine how formant frequencies change during consonant-vowel transitions, establishing that F2 loci vary by consonant class and adjacent vowel rather than being fixed per consonant place.

## Problem Addressed
Delattre, Liberman, and Cooper (DLC, 1955) proposed the "locus hypothesis": each stop consonant class has a single fixed F2 locus frequency from which formant transitions originate. Stevens and House test this hypothesis using an articulatory (analog) approach rather than perceptual experiments, to see whether the acoustic data from a physical vocal tract model support fixed loci.

## Key Contributions
- Demonstrates that F2 loci for **bilabial** stops vary from ~700 to ~1500 cps depending on adjacent vowel
- Demonstrates that F2 loci for **velar** stops vary from ~600 to ~2500 cps depending on adjacent vowel (due to cavity affiliation switching between F2 and F3)
- Confirms that F2 loci for **post-dental** (alveolar) stops are relatively fixed at ~1800-2000 cps, independent of adjacent vowel
- F1 locus is zero cps for all stop consonants (manner-of-articulation cue)
- F3 loci vary less than F2 loci and do not reliably distinguish consonant classes
- Provides a three-dimensional articulatory space (r0, d0, A/l) that continuously maps vowels through transitions to consonantal closures

## Methodology
- Used a 35-section electrical analog of the vocal tract (previously described in Stevens, Kasowski, and Fant, 1953)
- Vocal tract shape parameterized by three numbers:
  - **r0**: radius at point of greatest constriction (cm)
  - **d0**: distance of constriction point from glottis (cm)
  - **A/l**: ratio of mouth opening area to mouth opening length (cm)
- For vowels: r0 >= 0.4 cm, shapes follow parabolic equation
- For consonants: r0 reduced toward 0 (velar/post-dental closure) or A/l reduced toward 0 (bilabial closure)
- Formant frequencies measured with oscillator-meter combination for each configuration

## Key Equations

### Vocal tract shape (parabolic)
$$
r - r_0 = 0.025(1.2 - r_0)x^2
$$
Where:
- $r$ = radius at point $x$ along the vocal tract (cm)
- $r_0$ = radius at point of maximum constriction (cm)
- $x$ = horizontal distance from point of constriction (cm)

### Equivalent cylindrical constriction radius
$$
r_0^2 = \frac{4}{\int_{-2}^{+2} dx/r^2} \text{ cm}^2
$$
Where:
- The integral is over a 4-cm length centered on the deformation
- This defines $r_0$ for values < 0.4 cm as the radius of an equivalent uniform cylindrical tube with the same acoustic impedance

## Parameters

| Name | Symbol | Units | Default/Range | Notes |
|------|--------|-------|---------------|-------|
| Constriction radius | r0 | cm | 0-0.8 | 0.4 cm typical for vowels; 0 = complete closure |
| Constriction position | d0 | cm | 4-13.5 | Distance from glottis; ~8 for velars, ~13.5 for post-dentals |
| Mouth opening | A/l | cm | 0-17 | Area/length ratio; 0 = bilabial closure |
| Vocal tract length | - | cm | 14.5 | Vocal tract proper (glottis to mouth opening boundary) |
| Total tract length | - | cm | ~17 | Including mouth opening |
| Local deformation length | - | cm | 4 | Length of consonantal narrowing region |

## F2 Locus Values by Consonant Class

These are the key data for coarticulation rules:

### Bilabial (/p/, /b/)
- F2 locus varies from ~700 to ~1500 cps depending on vowel
- Always **lower** than the F2 of the adjacent vowel
- /up/ context: F2 locus ~700-800 cps
- /ip/ context: F2 locus ~1200-1500 cps
- DLC originally reported a fixed locus at 720 cps

### Post-dental/Alveolar (/t/, /d/)
- F2 locus relatively **fixed** at ~1800-2000 cps
- Independent of adjacent vowel
- Independent of A/l (mouth opening)
- With d0=13.0 base + closure at 13.5: F2=2000, F3=3200
- With d0=12.0 base + closure at 13.5: F2=1800, F3=3000 (more realistic tongue retraction)
- DLC reported 1800 cps -- consistent with the retracted-tongue configuration

### Velar (/k/, /g/)
- F2 locus varies **widely** from ~600 to ~2500 cps
- Generally **higher** than F2 of adjacent vowel
- /uk/ context: F2 locus ~600-900 cps (closure at d0=8-10)
- /yk/ context: F2 locus ~1200+ cps
- /ik/ context: F2 locus ~2300-2400 cps
- /ak/ context: F2 locus ~1500 cps
- Variation due to consonant place moving forward/back with adjacent vowel
- F2 and F3 exchange cavity affiliations around d0 ~ 2/3 of vocal tract length

### F1 Locus (all stops)
- Always zero cps at complete closure
- Provides manner-of-articulation cue (stop vs. non-stop)

### F3 Loci
- Post-dental: ~3000-3200 cps (relatively fixed)
- Velar: ~2400-3400 cps range
- Less variation than F2; does not reliably distinguish consonant classes

## Implementation Details

### Mapping to Qlatt Coarticulation Rules
The paper's findings nuance the simple locus values used in our coarticulation rules:
- Our rules use bilabial F2=1200, alveolar F2=1800, palatal F2=2600
- This paper shows bilabial F2 locus is vowel-dependent (700-1500 range)
- Alveolar F2 locus of 1800 is well-supported (matches retracted-tongue model)
- The "palatal" value of 2600 in our rules likely corresponds to a velar /k/ before front vowels

### Physical Mechanism for Velar F2/F3 Variation
- At complete closure, front and back cavities are decoupled
- Anterior cavity: quarter-wavelength resonance (closed-open)
- Posterior cavity: half-wavelength resonance (closed-closed)
- At critical d0 position (~2/3 of tract length), F2 and F3 loci coincide
- Moving constriction toward glottis: posterior cavity -> F3 (increases), anterior -> F2 (decreases)
- Moving constriction away from glottis: roles reverse (F2 with posterior, F3 with anterior)
- This nonmonotonic behavior explains perceptual anomalies in DLC studies

### Bilabial Closure Mechanism
- Reducing A/l to 0 increases acoustic mass at mouth opening
- F1 is a resonance between mouth opening mass and tract compliance
- As mass -> infinity, F1 -> 0
- F2 transitions from three-quarter-wavelength resonance (~1500 cps open tube) to half-wavelength resonance (~1000 cps closed tube)

## Figures of Interest
- **Fig. 1 (p. 578):** Idealized vocal tract configuration showing r0, d0, A/l parameters
- **Fig. 2 (p. 579):** Contours of constant F1 and F2 frequency vs. constriction point and mouth opening (r0=0.4)
- **Fig. 3 (p. 579):** Vowel articulation regions mapped in the d0 vs. A/l plane
- **Fig. 4 (p. 580):** Three-dimensional articulatory space (r0, d0, A/l) showing vowel-to-consonant continuum
- **Fig. 5 (p. 580):** Steps in creating consonant-like configurations by local deformation
- **Fig. 6 (p. 581):** F1 and F2 contours extrapolated to bilabial closure (A/l=0), showing loci
- **Fig. 7 (p. 582):** Schematic of formant transition extrapolation and locus determination
- **Fig. 8 (p. 582):** F1, F2, F3 contours for A/l=0.11 (rounded vowels) -- loci at r0=0 line
- **Fig. 9 (p. 583):** F1, F2, F3 contours for A/l=3.2 (unrounded vowels) -- loci at r0=0 line

## Results Summary
- The "simple locus hypothesis" (one fixed F2 frequency per consonant class) is too simplistic
- Post-dental loci are genuinely fixed (~1800-2000 cps)
- Bilabial and velar loci vary with vowel context
- Bilabial F2 locus range: 700-1500 cps (always below vowel F2)
- Velar F2 locus range: 600-2500 cps (wide variation due to cavity affiliation switching)
- F1 locus is universally zero for all stops

## Limitations
- Model uses idealized three-parameter vocal tract shapes (parabolic contour)
- Does not account for nasals, laterals (/l/), or rhotics (/r/) which require more complex tube shapes
- Assumes static configurations (no dynamic time-varying articulation)
- Vocal tract excitation characteristics not modeled (only tract shape -> formant frequencies)
- Limited to stop consonants (no fricatives, affricates)
- Assumes male vocal tract dimensions (14.5 cm tract proper, ~17 cm total)

## Testable Properties
- F1 locus must approach 0 Hz as any constriction approaches complete closure
- For bilabial stops, F2 locus must be <= F2 of adjacent vowel
- For post-dental stops, F2 locus should be approximately 1800-2000 Hz regardless of vowel context
- For velar stops, F2 locus should generally be >= F2 of adjacent vowel
- Reducing mouth opening (A/l -> 0) should monotonically decrease F1
- Post-dental F2 and F3 loci should be independent of A/l value

## Relevance to Project
This paper provides the articulatory-acoustic foundation for our coarticulation rules. The key locus values (especially alveolar F2~1800) are directly used in our formant transition implementation. The paper also shows that our simple fixed-locus approach is an approximation -- bilabial and velar loci are actually vowel-dependent, which could be a future refinement for more natural-sounding transitions.

## Open Questions
- [ ] Should our bilabial F2 locus be vowel-dependent rather than fixed at 1200?
- [ ] The paper's alveolar F2 locus (1800-2000) matches our value of 1800 -- should we use 1800 or 2000?
- [ ] Our "palatal" F2=2600 doesn't directly correspond to any single finding here -- it may correspond to a palato-alveolar place or a velar before front vowels
- [ ] Could we implement the velar F2 locus as a function of adjacent vowel F2?

## Related Work Worth Reading
- Delattre, Liberman, and Cooper (1955) - "Acoustic Loci and Transitional Cues for Consonants" - the locus hypothesis that this paper tests
- Stevens, Kasowski, and Fant (1953) - The vocal tract analog used in this study
- Stevens and House (1955) - Previous vowel articulation study using the same analog
- Peterson and Barney (1952) - Canonical vowel formant data referenced for mapping vowel regions

## Collection Cross-References

### Already in Collection
- **Peterson_Barney_1952_VowelFormants** (likely) - cited for vowel formant frequency ranges used to map articulatory regions to vowels

### New Leads (Not Yet in Collection)
- Delattre, Liberman, and Cooper (1955) "Acoustic Loci and Transitional Cues for Consonants" JASA 27, 769 - the original locus hypothesis; essential companion to this paper
- Stevens, Kasowski, and Fant (1953) "An Electrical Analog of the Vocal Tract" JASA 25, 734 - the analog instrument used here
- House and Stevens (1955) "Estimation of Formant Band Widths" JASA 27, 882 - vowel production data with the same analog

### Supersedes or Recontextualizes
- Modifies the DLC (1955) simple locus hypothesis by showing bilabial and velar loci are vowel-dependent rather than fixed
