# Articulatory Phonology: An Overview

**Authors:** Catherine P. Browman, Louis Goldstein
**Year:** 1992
**Venue:** Phonetica, Vol. 49, pp. 155-180
**DOI:** 10.1159/000261913

## One-Sentence Summary
This paper presents the foundational framework of articulatory phonology where gestures -- abstract characterizations of articulatory events with intrinsic duration -- replace segments and features as the basic units of phonological contrast, enabling unified accounts of coarticulation, allophonic variation, assimilation, and fluent speech alternations through gestural overlap.

## Problem Addressed
Traditional phonological theories posit abstract units (features, segments) that are categorically distinct from the physical events of speech production, requiring separate "implementation rules" to convert phonological representations into articulation. This creates a fundamental disconnect: phonological and phonetic descriptions use different vocabularies and primitives, and systematic phonetic variation (coarticulation, allophonic variation) must be handled by ad hoc rules rather than following from the phonological representation itself.

## Key Contributions
- Establishes gestures as the basic phonological units that are simultaneously abstract (contrastive) and physical (articulatory events with intrinsic time/duration)
- Introduces the gestural score as the phonological representation of utterances, displaying temporal overlap of gestures across tract variable tiers
- Demonstrates that coarticulation, allophonic variation, assimilation, deletion, and speech errors all follow naturally from gestural overlap patterns rather than requiring special rules
- Shows that "categorical" allophonic distinctions (e.g., aspirated vs. unaspirated stops, clear vs. dark /l/) are actually gradient consequences of gestural overlap and reduction
- Proposes that phonological development in children involves differentiation and coordination of prelinguistic gestural primitives

## Methodology
Theoretical framework paper that synthesizes findings from:
- Computational gestural modeling at Haskins Laboratories (task dynamic model)
- X-ray microbeam articulatory data
- Electropalatography (EPG) data
- Acoustic analysis of natural and computationally-generated speech
- Developmental speech production studies

## Key Concepts

### 1. Gestures as Dynamic Articulatory Structures (Section 1.1)

Gestures are defined in terms of **task dynamics** [Saltzman, 1986; Saltzman & Kelso, 1987; Saltzman & Munhall, 1989]:
- Task dynamics uses damped second-order dynamical equations to characterize articulatory movements
- It is the motion of **tract variables** (not individual articulators) that is characterized dynamically
- A tract variable characterizes a dimension of vocal tract constriction (location and degree)
- Articulators contributing to a constriction are organized into a coordinative structure [Turvey, 1977; Fowler et al., 1980]
- A **gesture** is specified using a set of related tract variables

### Tract Variables (Figure 1, p. 157)

| Abbreviation | Tract Variable | Articulators Involved |
|---|---|---|
| LP | lip protrusion | upper & lower lips, jaw |
| LA | lip aperture | upper & lower lips, jaw |
| TTCL | tongue tip constrict location | tongue tip, tongue body, jaw |
| TTCD | tongue tip constrict degree | tongue tip, tongue body, jaw |
| TBCL | tongue body constrict location | tongue body, jaw |
| TBCD | tongue body constrict degree | tongue body, jaw |
| VEL | velic aperture | velum |
| GLO | glottal aperture | glottis |

### Dynamic Parameters
Each gesture has parameters for its task-dynamic equation:
- **Target** (rest position)
- **Stiffness** (related to duration -- higher stiffness = shorter duration)
- **Damping**

These parameters distinguish gestures from each other and can vary to create different phonetic qualities (e.g., vowels vs. glides differ in stiffness).

### 2. Gestural Constellations (Section 1.2)

- Gestures occur in space and over time; they can overlap
- An utterance is an organized pattern (**constellation**) of overlapping gestures
- The **gestural score** (Figure 4, p. 161) displays duration, activation, and overlap of gestures
- Boxes indicate gestural activation; height indicates targeted constriction degree; horizontal extent indicates active duration
- Gestural scores are **inherently underspecified** -- not every tract variable is specified at every time point [Browman & Goldstein, 1989]

### Phasing Principles
Three types of temporal overlap proposed [Browman & Goldstein, 1991]:
1. **Minimal overlap** -- gestures barely touch temporally
2. **Partial overlap** -- some temporal co-occurrence
3. **Complete overlap** -- one gesture entirely within the timespan of another

Phasing is implemented by synchronizing specific **landmarks** within gestures:
- Achievement of target
- Beginning of movement away from target
- Onset of movement towards target

### Organizational Principles for Glottal Gestures
In word-initial onsets [Browman & Goldstein, 1986]:
1. Glottal peak opening is synchronized to the midpoint of any fricative gesture
2. At most a single glottal gesture is word-initial
3. Release of any closure gesture is synchronized to the glottal gesture

### 3. Coarticulation of Consonants and Vowels (Section 2.1)

Two functional classes of oral constriction gestures:
- **Vocalic gestures**: lower constriction degree, shorter time constant (longer duration)
- **Consonantal gestures**: greater constriction degree, shorter time constant (more rapid)

Key insight: When consonant and vowel gestures use **different tract variables** (e.g., TT for [d] and TB for vowels), the consonant achieves its TT target invariantly regardless of overlapping vowel -- but the overall vocal tract shape differs because different articulators contribute to the TT target depending on the co-occurring TB position. This produces coarticulatory variation automatically.

When consonant and vowel gestures use the **same tract variables** (e.g., TB for [g] and TB for vowels), they cannot both achieve targets simultaneously -- one is "undershoot" -- producing front/back allophone distinction for velars.

### 4. Higher-Level Units in Velic and Oral Subsystems (Section 2.2)

Detailed analysis of nasals and /l/ showing:
- **Nasals**: constellation includes oral closure + velic lowering
- Initial nasals: velum lowering onset synchronized with lip closing onset
- Final nasals: velum lowering occurs substantially earlier (100-350 ms) before lip movement
- **English /l/**: constellation includes tongue tip + tongue body retraction gestures
- Initial /l/: TB follows TT slightly ("clear" /l/)
- Final /l/: TB leads TT substantially ("dark" /l/)
- Both nasals and /l/ show parallel organization where syllable-final gestures have wider constriction preceding narrower constriction (a sonority-hierarchy-like pattern)

### 5. Aspiration in English (Section 2.3.1)

Aspiration is **not** accurately characterized by a categorical [+spread glottis] feature:
- A single glottal opening gesture exists in word-initial position
- Aspiration presence/absence depends on **timing** of this gesture relative to oral gesture
- In [s]-stop clusters: glottal opening synchronized to fricative midpoint; by stop release, glottis is already narrowing -- "short lag" VOT results
- Stress and position cause **gradient** (not categorical) variation in glottal gesture magnitude
- Cooper [1991] using transillumination found glottal spreading gesture in ALL environments, varying only in magnitude
- Final position: both glottal spreading and oral closure gestures reduced to limiting cases -- explains why final /h/ doesn't occur in English

### 6. Flapping (Section 2.3.3)

Flapping of medial unstressed alveolar stops is analyzed as:
- A **reduced** tongue tip closure gesture (reduced in time and displacement)
- The same general reduction process that affects glottal gestures in the same environments
- Tongue tip and glottal gestures show parallel behavior under stress and position changes
- Whether the reduced gesture is perceived as a flap depends on whether an open vocal tract exists before and after

### 7. Variation during Talking (Section 3)

#### 3.1 Speech Production Errors
- Speech errors show gradient rather than all-or-none behavior [Mowrey & MacKay, 1990]
- Errors involve anomalous muscle activity that is gradient in magnitude
- Positioning (organization) of errors is categorical; magnitude is gradient
- Gestural framework naturally handles this: errors are misphased or duplicated gestures, with variable magnitudes

#### 3.2 Assimilation of Final Alveolars
- Final alveolar stops (e.g., /t/ in "late calls") show reduced but present alveolar closure gestures even when perceived as assimilated [Nolan, 1992]
- Gestures are never changed into other gestures, nor are they added
- Perceptual assimilation occurs when overlap + reduction exceed a perceptual threshold
- Formant transitions into final alveolars vary as a function of overlap with following consonant [Zsiga & Byrd, 1990]

#### 3.3 Reduced Syllable Deletion
- Schwa deletion in words like "beret" analyzed as increased overlap hiding the vocalic gesture
- The lexical difference between "bray" and "beret" modeled only by coordination of labial and /r/ gestures (overlapping vs. separated)
- No explicit tongue gesture for schwa needed -- the average tongue body position suffices
- However, in ['pVpapVp] forms, an explicit tongue gesture for schwa was required

#### 3.4 Rate and Overlap
- Faster speech rate consistently increases gestural overlap
- Effect observed at all phonological/syntactic boundary types (syllable, word, clause, sentence)
- Slow rates show "separation" (long intervals); fast rates show "considerable overlap"
- Increased overlap can produce "gestural hiding" -- complete acoustic obscuring of one gesture by another
- Example: "perfect memory" -- in fluent phrase version, final [t] completely hidden by overlapping [k] and [m] closures; in word-list version, [t] was clearly audible
- All phonetic units (gestures) remain present in both versions; only overlap varies

## Parameters

| Name | Description | Units | Notes |
|------|-------------|-------|-------|
| Target | Rest position of tract variable | (dimension-specific) | Constriction degree for vowels vs. stops |
| Stiffness | Controls gesture duration | (dimensionless ratio) | Higher = shorter gesture; vowels lower than consonants |
| Damping | Controls trajectory shape | (dimensionless) | Critical damping assumed in task dynamic model |
| Constriction Location | Where along the tract the constriction is formed | (tract position) | Distinguishes place of articulation |
| Constriction Degree | How narrow the constriction is | (aperture) | Ranges from wide (vowels) through narrow (fricatives) to closed (stops) |

## Figures of Interest
- **Fig. 1 (p. 157):** Tract variables and associated articulators -- schematic showing the 8 tract variables (LP, LA, TTCL, TTCD, TBCL, TBCD, VEL, GLO) and which articulators each controls
- **Fig. 2 (p. 158):** Schematic gestural scores for 'add', 'had', 'bad', 'pad', 'dad', 'pan', 'span' -- showing how different words are represented as patterns of overlapping gestures on VEL, TB, TT, LIPS, and GLO tiers
- **Fig. 3 (p. 160):** Gestural computational model architecture -- intended utterance -> Linguistic Gestural Model -> Gestural Score; Task Dynamic Model -> Articulatory Trajectories; Articulatory Synthesizer -> output speech
- **Fig. 4 (p. 161):** Gestural score for 'palm' showing actual tract variable curves generated by the computational model, with boxes indicating gestural activation periods

## Testable Properties
- Coarticulation follows automatically from gestural overlap; invariant gesture targets should be measurable in articulatory data even when acoustic output varies contextually
- Consonantal gestures should have higher stiffness (shorter durations) than vocalic gestures
- Increased speech rate should increase gestural overlap at all prosodic boundary levels
- Flapping should correlate with reduced glottal gesture magnitude in the same environments
- Syllable-final nasals should show velum lowering onset 100-350 ms before oral closure onset
- "Assimilated" final alveolars should show residual tongue tip gesture present in articulatory data
- Schwa deletion should correlate with increased overlap between flanking consonant gestures

## Limitations
- The phasing model is acknowledged as a "first approximation" -- more detailed investigation needed
- Hierarchical structure above the consonant cluster is not well-developed (syllables represented by phasing associations, not hierarchical nodes)
- The underspecification of gestural scores means not all articulatory detail is captured
- Interaction between glottal and oral subsystems is complex and not fully formalized
- The framework does not address how gestures map to acoustic output in detail (relies on separate articulatory synthesizer)
- Developmental data (Section 4) is suggestive but does not conclusively distinguish gestural from featural accounts

## Relevance to Project
This paper provides the theoretical framework for understanding:
1. **Coarticulation rules**: Formant transitions in Qlatt should reflect overlapping gestural influence rather than fixed locus frequencies. The paper shows that coarticulation patterns follow from gestural overlap and need not be stipulated by separate rules.
2. **Allophonic variation**: Clear/dark /l/ and aspirated/unaspirated stops are not categorical switches but gradient consequences of gestural timing, informing how Qlatt's declarative rules should implement position-dependent allophony.
3. **Duration and rate effects**: The stiffness parameter controlling gesture duration and the rate-dependent overlap increase provide theoretical grounding for Qlatt's duration and coarticulation rules.
4. **Assimilation modeling**: Final consonant assimilation should be modeled as increased overlap + reduction rather than segment replacement.
5. **Formant transition shapes**: The task-dynamic (critically damped second-order) model predicts specific transition trajectory shapes that should inform Qlatt's formant interpolation approach (consistent with Iskarous & Pouplier, 2022).

## Open Questions
- [ ] How exactly do gestural parameters map to Klatt synthesis parameters? (Need articulatory-to-acoustic mapping)
- [ ] Can the stiffness parameter be used to derive segment durations automatically?
- [ ] How should the three overlap types (minimal, partial, complete) be parameterized in a frame-based synthesizer?
- [ ] What are the actual numerical values of gestural stiffness for different sound classes?

## Related Work Worth Reading
- Saltzman & Munhall (1989) - Task dynamics model (the computational engine behind articulatory phonology)
- Browman & Goldstein (1990a) - Gestural specification using dynamically-defined articulatory structures (detailed computational model)
- Browman & Goldstein (1990b) - Gestural structures: Distinctiveness, phonological processes, and historical change
- Byrd (1992) - Acoustic evidence for gestural overlap in consonant sequences (perception/production link)
- Nolan (1992) - Evidence from assimilation that gestures are reduced but not replaced
- Kingston (1990) and Stevens (in press) - Acoustic landmarks related to gestural synchronization points
- Zsiga & Byrd (1990) - Formant frequency transitions as acoustic evidence for gestural overlap
- Cooper (1991) - Transillumination study of glottal aperture showing gradient (not categorical) aspiration differences

## Collection Cross-References

### Already in Collection
- [[Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal]] - A comprehensive 21st-century appraisal of AP and Task Dynamics; extends this paper's framework with coupled oscillator timing, pi-gestures, and acoustic phonology proposals
- [[Sorensen_Gafos_2016_GestureAutonomousDynamicalSystem]] - Extends the task-dynamic gesture model with nonlinear anharmonic potential, predicting sigmoid transition profiles
- [[Lisker_Abramson_1964_CrossLanguageVoicingStops]] - Cited in this paper for VOT measurements; the gestural account of aspiration in Section 2.3 builds directly on their VOT framework
- [[Stevens_1989_QuantalNatureSpeech]] - Cited for quantal theory; this paper's gestural approach offers a complementary articulatory perspective on phonological contrast
- [[Liberman_Mattingly_1985_MotorTheory]] - Cited for motor theory of speech perception; gestural primitives in AP are the "intended gestures" that motor theory posits listeners recover
- [[Ohman_1966_CoarticulationVCV]] - Cited for X-ray data showing vowel-dependent consonant variation; this paper's gestural overlap model explains Ohman's observations
- [[Recasens_1997_LingualCoarticulationDAC]] - The DAC model quantifies coarticulation resistance that this paper explains through gestural overlap on same vs. different tract variables
- [[Recasens_2012_LateralAllophones]] - Provides acoustic data for the clear/dark /l/ allophony that this paper explains through gestural timing (TB leading vs. lagging TT)
- [[Volenec_2015_Coarticulation]] - Reviews coarticulation theory including the coproduction/AP framework presented in this paper
- [[Fowler_2006_CoarticulationGesturePerception]] - Perceptual evidence supporting the gesture-based view of coarticulation advocated here
- [[Sproat_Fujimura_1993_AllophonicVariationEnglishL]] - Cited (as "submitted") in this paper; provides articulatory/acoustic data for English /l/ allophony that validates the gestural timing account
- [[Saltzman_1989_DynamicalGesturalPatterning]] — the computational engine behind AP; formalizes tract-variable dynamics, gestural blending, and transformation gating

### New Leads (Not Yet in Collection)
- Browman & Goldstein (1990a) - "Gestural specification using dynamically-defined articulatory structures" - Detailed computational specification of gestural scores
- Nolan (1992) - "The descriptive role of segments: Evidence from assimilation" - EPG evidence that assimilated consonants retain residual gestures
- Cooper (1991) - "An articulatory account of aspiration in English" - Transillumination data on gradient aspiration
- Byrd (1992) - "Perception of assimilation in consonant clusters: a gestural model" - Links overlap to perceptual assimilation
- Krakow (1989) - "The articulatory organization of syllables" - Kinematic analysis of labial and velar gestures; details nasal timing data cited in Section 2.2

### Conceptual Links (not citation-based)
- [[Hertz_1991_StreamsPhonesTransitions]] — Hertz's multi-stream delta framework independently converges on the same insight: formant transitions are independent temporal units with stable durations, while steady-state portions stretch. Hertz formalizes this with synchronized parallel streams; AP formalizes it with gestural overlap and stiffness parameters. The two frameworks are complementary implementations of the same observation.

### Supersedes or Recontextualizes
- [[Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal]] extends and critically evaluates this 1992 overview with 30 years of subsequent research; this paper provides the original framework that Iskarous & Pouplier appraise

---

**See also:** Browman_1989_ArticulatoryGesturesPhonologicalUnits - the foundational 1989 paper that first proposed gestures as phonological units, with more detailed treatment of tube geometry, CD hierarchy, and comparison with feature geometry
