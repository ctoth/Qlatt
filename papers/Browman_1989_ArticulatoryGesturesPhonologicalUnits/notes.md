# Articulatory Gestures as Phonological Units

**Authors:** Catherine P. Browman and Louis Goldstein
**Year:** 1989
**Venue:** Phonology, Volume 6, Issue 2, pp. 201-251
**DOI:** 10.1017/S0952675700001019

## One-Sentence Summary
This paper proposes that dynamically defined articulatory gestures -- discrete constriction actions within vocal tract subsystems -- serve as the primitive units of phonological representation, replacing traditional segments and features.

## Problem Addressed
Traditional phonological representations (segments, features, feature geometry) are abstract symbolic entities with no direct physical interpretation. There is a disconnect between these symbolic units and the physical articulations that produce speech. The authors argue this creates problems for explaining coarticulation, assimilation, deletion, and other connected-speech phenomena.

## Key Contributions
- Establishes articulatory gestures as pre-linguistic primitives present in infant babbling, which are then recruited as phonological units
- Defines a formal computational model (task dynamics) where gestures are specified as tract variable targets with stiffness parameters
- Introduces the GESTURAL SCORE notation: a two-dimensional representation with articulatory tiers on the vertical axis and time on the horizontal axis
- Shows that "deletion" and "assimilation" in connected speech emerge naturally from two mechanisms: (1) reduction of gestural magnitude and (2) increase of inter-gestural overlap
- Proposes TUBE GEOMETRY as a hierarchical constriction degree (CD) representation that maps to both articulatory and acoustic properties
- Demonstrates that the CD hierarchy provides a principled basis for natural classes (sonorants, obstruents, nasals) at different levels

## Methodology
The paper combines:
1. Evidence from infant babbling studies showing pre-linguistic gestures
2. A computational model (task dynamics) that generates articulator movements from gestural specifications
3. Articulatory data (from X-ray microbeam and other studies) showing gestural overlap in connected speech
4. Comparison with feature geometry proposals (Clements 1985, Sagey 1986, McCarthy 1988)
5. Development of tube geometry as a framework for constriction degree hierarchy

## Key Equations

### Task Dynamic Model (Second-order dynamical system)

$$
m\ddot{x} + b\dot{x} + k(x - x_0) = 0
$$

Where:
- $m$ = mass of the object (articulator)
- $b$ = damping of the system
- $k$ = stiffness (controls rate of movement toward target)
- $x_0$ = equilibrium position (tract variable target)
- $x$ = instantaneous displacement
- $\dot{x}$ = instantaneous velocity
- $\ddot{x}$ = instantaneous acceleration

For oral gestures, damping $b$ is always set for **critical damping** (approach target without overshoot/ringing).

## Parameters

### Vocal Tract Variables (Fig. 1, p. 207)

| Variable | Name | Articulators Involved |
|----------|------|----------------------|
| LP | lip protrusion | upper & lower lips, jaw |
| LA | lip aperture | upper & lower lips, jaw |
| TTCL | tongue tip constrict location | tongue tip, body, jaw |
| TTCD | tongue tip constrict degree | tongue tip, body, jaw |
| TBCL | tongue body constrict location | tongue body, jaw |
| TBCD | tongue body constrict degree | tongue body, jaw |
| VEL | velic aperture | velum |
| GLO | glottal aperture | glottis |

### Gestural Descriptors (Eq. 3, p. 209)

Each gesture is formally specified by:

| Descriptor | Description | Applies To |
|-----------|-------------|-----------|
| Constriction Degree (CD) | Target value ($x_0$) for degree tract variable (LA, TTCD, TBCD, VEL, GLO) | All gestures |
| Constriction Location (CL) | Target value ($x_0$) for location tract variable (LP, TTCL, TBCL) | Oral gestures only |
| Constriction Shape (CS) | Target for shape tract variable (not yet implemented) | Oral gestures only |
| Stiffness | Value of $k$ for all tract variables in the gesture | All gestures |

### CD Descriptor Values (Eq. 4, p. 209)
- CD: closed, critical, narrow, mid, wide
- CL: protruded, labial, dental, alveolar, postalveolar, palatal, velar, uvular, pharyngeal

### Articulator Set Inventory (Fig. 2, p. 210)

| Articulator Set | Dimensions | Tract Variables |
|----------------|-----------|----------------|
| LIPS | CD, CL, stiffness | LA, LP |
| TT (tongue tip) | CD, CL, CS*, stiffness | TTCD, TTCL |
| TB (tongue body) | CD, CL, CS*, stiffness | TBCD, TBCL |
| TR* (tongue root) | CD*, CL*, stiffness* | (not yet implemented) |
| VEL | CD, stiffness | VEL |
| GLO | CD, CL*, stiffness | GLO |

(* = not yet implemented at time of publication)

### Default CD Values for Basic Tubes (Table IV, p. 239)

| Tube/Terminator | Default CD |
|----------------|-----------|
| Nasal | closed |
| Lateral | = Central [CD] |
| Central | open |
| LIPS | open |
| GLO | critical |

### Percolation of CD (Table II, p. 237)

| Node | CD Calculation |
|------|---------------|
| Nasal | [CD] = VEL [CD] |
| Lateral | [CD] = TB [CD, CS = narrowed] |
| Central | [CD] = MIN(TT [CD], TB [CD, CS = normal]) |
| Tongue | [CD] = MAX(Central [CD], Lateral [CD]) |
| Oral | [CD] = MIN(Tongue [CD], LIPS [CD]) |
| Supra | [CD] = MAX(Oral [CD], Nasal [CD]) |

### Acoustic Consequences at VT Level (Table III, p. 238)

| VT Output | Condition |
|-----------|----------|
| Occlusion | Supra [clo] OR GLO [clo] |
| Resonance | Supra [open] AND GLO [crit] |
| Noise | Otherwise |

Parallel tubes: effective CD = maximum (widest) component.
Series tubes: effective CD = minimum (narrowest) component.

## Implementation Details

### Gestural Score Structure
The gestural score is a two-dimensional representation:
- **Vertical axis**: Articulatory tiers (VEL, TB, TT, LIPS, GLO)
- **Horizontal axis**: Time
- **Boxes**: Each box represents the activation interval of one gesture, labeled with CD and CL descriptors

### Overlap Mechanisms
Two key mechanisms drive connected-speech variation:
1. **Hiding**: When gestures on DIFFERENT articulatory tiers overlap, one may completely obscure the other acoustically (e.g., final /t/ in "perfect memory" hidden by overlapping velar and labial closures)
2. **Blending**: When gestures on the SAME articulatory tier overlap, their dynamical parameters blend (e.g., /n/ + /th/ in "ten themes" produces intermediate tongue tip position)

### Phasing Principles
- Gestures are coordinated via **phasing rules** that specify synchronization between specific phases of different gestures
- Example: GLO [wide] gesture (180 degrees) synchronized with release phase (290 degrees) of LIPS [clo labial] gesture for aspiration

### Stiffness as Distinctive Parameter
- /j/ and /w/ differ from their corresponding vowels /i/ and /u/ primarily in having increased stiffness value
- Trills and taps likely involve characteristic stiffness values
- Stiffness can be modified by stress and speaking rate

## Figures of Interest
- **Fig. 1 (p. 207):** Tract variables and contributing articulators of computational model
- **Fig. 2 (p. 210):** Inventory of articulator sets and associated parameters
- **Fig. 3 (p. 212):** Gestural score for "palm" [pam] -- both box notation and model-generated tract variable motions
- **Fig. 4 (p. 213):** Gestural score for "palm" using point notation with association lines
- **Fig. 5 (p. 216):** Gestural scores for "perfect memory" -- word list vs. fluent speech (showing gestural hiding)
- **Fig. 6 (p. 217):** Gestural scores for "seven plus" -- slow vs. fast rate (showing assimilation via overlap)
- **Fig. 7 (p. 218):** Gestural scores for "ten themes" -- pause vs. fluent (showing blending)
- **Fig. 8 (p. 223):** Articulatory geometry tree
- **Fig. 9 (p. 227):** Possible mappings between articulator sets and constriction locations
- **Fig. 10 (p. 231):** Gestural score for "palm" combined with articulatory geometry
- **Fig. 11 (p. 232):** Comparison of gestural score and feature geometry for contour and complex segments
- **Fig. 12 (p. 234):** Gestural score for "palm" mapped onto prosodic structure
- **Fig. 13 (p. 236):** Vocal tract hierarchy: articulatory and tube geometry combined
- **Fig. 14 (p. 240):** CD hierarchies for vowel /a/, lateral /l/, nasal /n/, and oral stop /d/

## Results Summary
The gestural approach:
- Unifies deletion, assimilation, and coarticulation as consequences of two simple processes (magnitude reduction and overlap increase)
- Makes testable predictions about connected speech variation across languages
- Provides a notation (gestural score) that simultaneously represents temporal and structural information
- Accounts for natural classes (sonorants, obstruents) via the CD hierarchy at different tube geometry levels
- Resolves the distinction between input (gestural) and output (acoustic) features

## Limitations
- Tongue root (TR) tract variable not yet implemented
- Constriction shape (CS) variables not yet implemented
- No explicit prosodic tier in the gestural score (prosodic structure is not an inherent aspect)
- Phasing rules and their integration with prosodic structure not fully developed
- Lateral tube default CD is "seriously oversimplified"
- The computational model uses simplified tube geometry; actual aerodynamic details (where turbulence is generated, voicing conditions) are beyond scope

## Testable Properties
- Increasing gestural overlap between two gestures on different tiers must produce hiding (acoustic masking) of the weaker gesture
- Increasing gestural overlap between gestures on the same tier must produce blending (intermediate tract variable trajectories)
- The CD at any tube geometry node must be predictable from the CDs of its children using MIN (series) and MAX (parallel) operations
- Sonorants must have Supra CD = [open] AND VT output = resonance
- Obstruents must have Supra CD = [closed] or [critical] AND VT output = occlusion or noise
- Nasals must share Supra CD and VT characterization with vowels and laterals (all resonance) but diverge at Oral level
- Aspiration requires GLO [wide] timing synchronized with oral release phase
- Glides /j/ and /w/ must have same CD and CL as /i/ and /u/ but higher stiffness

## Relevance to Project
This paper provides the theoretical foundation for understanding articulatory phonology as an alternative to segment-based representations in speech synthesis. For Qlatt's formant synthesizer, the key insights are:

1. **Coarticulation modeling**: The overlap/blending framework provides principled rules for how adjacent phoneme targets interact -- directly applicable to formant transition rules
2. **Connected speech phenomena**: "Deletion" and "assimilation" rules in the TTS frontend can be modeled as gestural overlap changes rather than discrete symbolic operations
3. **Natural class definitions**: The CD hierarchy (Table III) provides a principled basis for which sounds are stops/fricatives/sonorants -- useful for rule conditions
4. **Duration and stiffness**: The stiffness parameter ($k$) directly relates to transition speed, relevant to formant transition duration rules
5. **Tube geometry and acoustic output**: Table III maps directly to the SW parameter (cascade vs. parallel) and source selection in Klatt synthesis

The companion 1992 paper (already in collection as Browman_Goldstein_1992_ArticulatoryPhonologyOverview) extends and refines this work.

## Open Questions
- [ ] How does the stiffness parameter $k$ map to formant transition durations in a Klatt-type synthesizer?
- [ ] Can the CD hierarchy be used to automatically derive the cascade/parallel switching (SW parameter)?
- [ ] How to represent the phasing rules computationally for TTS frontend gestural overlap rules?

## Related Work Worth Reading
- Saltzman & Kelso (1987) - Task dynamic model (the underlying dynamical equations)
- Browman & Goldstein (1986) - GEST computational model specification
- Browman & Goldstein (1987) - Tiers in articulatory phonology and casual speech
- Browman & Goldstein (1988) - Syllable structure in articulatory phonology
- Stevens (1972, 1989) - Quantal theory (basis for CD categorical ranges)
- Sagey (1986) - Feature geometry (the primary comparison framework)
- Fowler (1980, 1981) - Coarticulation and extrinsic timing

## Collection Cross-References

### Already in Collection
- [[Browman_Goldstein_1992_ArticulatoryPhonologyOverview]] - extends and elaborates this 1989 framework with additional data and refinements

### New Leads (Not Yet in Collection)
- Saltzman & Kelso (1987) "Skilled actions: a task dynamic approach" - the formal dynamical model underlying gesture definitions
- Sagey (1986) "The representation of features and relations in non-linear phonology" - the primary feature geometry comparison
- Fowler (1980) "Coarticulation and theories of extrinsic timing" - foundational coarticulation theory
- Stevens (1972) "The quantal nature of speech" - basis for CD categorical distinctions

### Conceptual Links (not citation-based)
- [[Hertz_1991_StreamsPhonesTransitions]] — Hertz's "stable transition phenomenon" (formant transitions hold at ~65ms while steady states stretch) is exactly what AP predicts for a high-stiffness gesture superimposed on a lower-stiffness vocalic gesture. Different formalisms (multi-stream deltas vs. gestural scores), same empirical convergence on transitions as independent temporal units.

### Supersedes or Recontextualizes
- This 1989 paper is the foundational version; the 1992 paper (already in collection) is the more accessible overview that extends it
