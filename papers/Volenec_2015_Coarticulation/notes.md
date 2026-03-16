---
title: "Coarticulation"
authors: "Veno Volenec"
year: 2015
venue: "Chapter 2 in *Phonetics* (ed. Jasmine Davis), Nova Science Publishers, ISBN 978-1-63483-637-1"
doi_url: "N/A"
---

# Coarticulation

## One-Sentence Summary
A comprehensive review chapter covering the definition, classification, theories, measurement techniques, and phonological implications of coarticulation — the phenomenon where adjacent speech segments influence each other's articulatory and acoustic properties.

## Problem Addressed
Coarticulation is universal in continuous speech but its definition, scope, and theoretical explanation remain contested across multiple competing frameworks. This chapter consolidates the major approaches into a single reference.

## Key Contributions
- Systematic taxonomy of coarticulation types (anticipatory vs. perseverative; V-to-C, C-to-V, V-to-V, C-to-C; labial, lingual, velar, laryngeal)
- Review of three major theoretical frameworks: Speech Economy (Lindblom), Window Model (Keating), and Coproduction Theory (Fowler/Browman & Goldstein)
- Detailed presentation of the Degree of Articulatory Constraint (DAC) model (Recasens et al.)
- Survey of measurement techniques (ultrasound, EPG, EMG)
- Discussion of coarticulation vs. assimilation distinction and its phonology-phonetics interface implications

## Methodology
Literature review and theoretical synthesis, with illustrative examples from English, Swedish, Russian, Croatian, French, Catalan, German, Turkish, and other languages.

## Key Equations

### Locus Equation (Sussman et al. 1993)

$$
F2_{\text{onset}} = k \cdot F2_{\text{middle}} + c
$$

Where:
- $F2_{\text{onset}}$ = F2 frequency at vowel onset (CV transition)
- $F2_{\text{middle}}$ = F2 frequency at vowel midpoint (target)
- $k$ = slope (higher slope → more coarticulation, consonant influenced more by vowel)
- $c$ = intercept (locus frequency when slope = 0 → no coarticulation)

**Interpretation:** When $k=1$ and $c=0$, maximal coarticulation (onset = target). When $k=0$, no coarticulation (onset independent of target; corresponds to classical fixed locus).

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| DAC value | DAC | integer | — | 1-3 | Degree of Articulatory Constraint (tongue dorsum involvement) |
| Locus equation slope | k | dimensionless | — | 0-1 | Higher = more C-to-V coarticulation |
| Locus equation intercept | c | Hz | — | varies | Apparent locus frequency |

### DAC Value Assignments (Recasens et al. 1997)

| DAC | Tongue Dorsum Role | Example Segments |
|-----|-------------------|-----------------|
| 1 (minimal) | Not involved | bilabials [p, b, m], labiodentals [f, v], schwa [ə] |
| 2 (intermediate) | Constrained by primary articulator | alveolars [t, d, n, s], low vowel [a] |
| 3 (maximal) | Primary articulator | alveolopalatals [ʃ, ʒ], palatals [j, ɲ], velars [k, g, x], high vowel [i] |

**Key principle:** Higher DAC → more coarticulatory resistance and more coarticulatory dominance over neighbors. Lower DAC → more susceptible to influence from neighbors.

## Implementation Details

### Coarticulation Classification System

**By direction:**
- **Anticipatory** (right-to-left, L ← R): upcoming segment influences current production
  - Example: velar [k] fronted before [i] (*ski*), retracted before [u] (*cool*)
  - Can span up to 6 segments for labial coarticulation (Benguerel & Cowan 1974)
  - Lip-rounding can start 600 ms ahead of rounded vowel (Lubker et al. 1975)
- **Perseverative** (left-to-right, L → R): current segment's influence persists into following segments
  - Example: devoicing of approximants after voiceless aspirated stops (*please* [pʰl̥i:z])

**By segment classes:**
- **V-to-C**: vowel influences consonant (e.g., [kʷ] in *cool* from [u] rounding)
- **C-to-V**: consonant influences vowel (e.g., vowel nasalization before nasal consonant)
- **V-to-V**: transconsonantal vowel-to-vowel influence (Öhman 1966, 1967) — vowels in V₁CV₂ influence each other through consonant
- **C-to-C**: consonant-to-consonant (e.g., [k] and [l] overlap ~28 ms in *weakling*)

**By articulator:**
- **Labial**: lip rounding/spreading (longest scope, up to 6 segments)
- **Lingual**: tongue position along high/low and front/back (usually within syllable)
- **Velar**: velum lowering for nasality (crosses syllable and word boundaries)
- **Laryngeal**: vocal fold abduction/adduction for voicing

**By scope:**
- Labial coarticulation: broadest (transsyllabic, transword)
- Velar coarticulation: crosses syllable and word boundaries
- Lingual coarticulation: usually within syllable (but can be transsegmental)

### Three Major Theoretical Frameworks

**1. Speech Economy Theory (Lindblom 1963, 1983, 1989, 1990)**
- Coarticulation = target undershoot due to articulatory economy
- Hyper-speech (clear) → less coarticulation, more perceptual contrast
- Hypo-speech (casual) → more coarticulation, economy principle dominates
- Speech rate and style modulate degree of undershoot
- Locus equations quantify degree of C-to-V coarticulation

**2. Window Model (Keating 1985, 1988, 1990)**
- Each phonological feature has a "window" — range of permissible articulatory values
- Specified features (+/−) → narrow windows → less coarticulation
- Unspecified features (0) → wide windows → more coarticulation
- Contours (interpolation between windows) follow economy of effort
- Language-specific: window widths vary across languages
- Limitation: doesn't correctly predict V-to-V lingual effects (Liker et al. 2008)

**3. Coproduction Theory (Fowler 1977-1993; Browman & Goldstein 1986-1992)**
- Basic units = articulatory gestures (dynamical, context-independent)
- Coarticulation = temporal overlap of invariant gestures
- Gestures have intrinsic timing; they are "coproduced," not modified
- Greater overlap → larger coarticulatory effect
- Degree of overlap determined at cognitive planning level
- DAC model (Recasens) developed within this framework

### Coarticulation vs. Assimilation
- No consensus on whether these are the same or different phenomena
- Assimilation: phonological, categorical feature change (e.g., Croatian voicing assimilation)
- Coarticulation: phonetic, gradient articulatory overlap
- Articulatory Phonology view: assimilation is extreme gestural overlap (Browman 1995)
- Fowler's perceptual criterion: if listeners perceive the change → assimilation (grammatical); if only instrumentally measurable → coarticulation (non-grammatical)

## Figures of Interest
- **Fig 1 (p. 60/page 13):** Locus equations schematic — F2(onset) vs F2(middle), showing maximal and no-coarticulation lines
- **Fig 2 (p. 62/page 16):** Window model diagram for [apa] vs [asa] showing narrow/wide windows and contour interpolation
- **Fig 3 (p. 65/page 19):** Coproduction of articulatory gestures — overlapping prominence curves showing anticipatory and perseverative scopes
- **Fig 4 (p. 69/page 22):** Ultrasound image of tongue body
- **Fig 5 (p. 70/page 23):** EPG image of the word *actor* showing [k][t] overlap (~20 ms C-to-C coarticulation)

## Results Summary
This is a review chapter, not an experimental study. Key empirical generalizations synthesized:
- Coarticulation is universal in continuous speech
- Anticipatory coarticulation cannot be explained by inertia alone — requires planning
- DAC values predict coarticulation magnitude and direction based on tongue dorsum involvement
- Labial coarticulation has the broadest scope; lingual coarticulation is more constrained
- Speaking style modulates coarticulation: casual speech shows more, clear speech shows less

## Limitations
- Primarily a review; no new experimental data
- DAC model limited to lingual coarticulation only
- Coarticulation vs. assimilation distinction remains unresolved
- No quantitative acoustic data (formant values, durations) — this is a theoretical review

## Testable Properties
- **Locus equation slope for velars should be higher than for alveolars** (more C-to-V coarticulation for velars)
- **DAC 1 segments should show more formant variation across vowel contexts than DAC 3 segments**
- **Anticipatory labial coarticulation should span more segments than lingual coarticulation**
- **Faster speech rate → more formant undershoot** (target not reached)
- **Clear/hyper speech → formant trajectories closer to canonical targets**
- **V-to-V coarticulation in VCV should be detectable in F2 transitions** (Öhman effect)

## Relevance to Project
This chapter provides the theoretical framework for implementing coarticulation in Qlatt's formant synthesis:

1. **Formant transition rules**: The DAC model directly informs how much to blend formant targets between adjacent segments. DAC 3 consonants (velars, palatals) resist coarticulation and maintain their formant targets; DAC 1 consonants (labials) allow vowel formants to pass through relatively unmodified.

2. **Locus equations**: The F2(onset) = k·F2(middle) + c framework provides a quantitative basis for computing consonant-vowel transition onset frequencies as a function of vowel target and consonant-specific parameters.

3. **Anticipatory lookahead**: The chapter confirms that formant transition computation must look ahead to upcoming vowels (not just blend with the immediately preceding segment), particularly for labial and velar coarticulation.

4. **Speaking style**: The hyper/hypo-speech continuum suggests that coarticulation parameters should be modulated by a "speech style" or "effort" parameter — more effort means tighter formant targets, less coarticulation.

5. **V-to-V effects**: Öhman's finding that vowels influence each other through intervening consonants means that Qlatt's formant transition model should implement transconsonantal vowel blending, not just local phone-to-phone smoothing.

## Open Questions
- [ ] How to map DAC values to specific formant blending weights in Klatt parameter space?
- [ ] What are the actual locus equation parameters (k, c) for English consonants that could be used in synthesis?
- [ ] How to implement the Window Model's variable-width windows in a frame-based synthesizer?
- [ ] Does the distinction between coarticulation and assimilation matter for synthesis? (Probably not — both produce acoustic changes that need to be modeled)

## Related Work Worth Reading
- Hardcastle & Hewlett (eds.) (1999) *Coarticulation: theory, data and techniques* — definitive reference
- Farnetani & Recasens (2013) "Coarticulation and connected speech processes" in *Handbook of Phonetic Sciences* — updated comprehensive treatment
- Recasens et al. (1997) "A model of lingual coarticulation based on articulatory constraints" — the original DAC model paper (ALREADY IN COLLECTION)
- Öhman (1966) "Coarticulation in VCV utterances" (ALREADY IN COLLECTION)
- Keating (1990b) "The window model of coarticulation" — primary source for window model
- Sussman et al. (1993) "Locus equations as a source of relational invariance for stop place categorization" — locus equation methodology
- Lindblom (1990) "Explaining phonetic variation: a sketch of the H&H theory" — hyper/hypo speech framework
- Browman & Goldstein (1992) "Articulatory phonology: An overview" — coproduction theory
- Fowler & Saltzman (1993) "Coordination and coarticulation in speech production" — coproduction details

## Collection Cross-References

### Already in Collection
- [[Ohman_1966_CoarticulationVCV]] — cited extensively for V-to-V transconsonantal coarticulation and the VCV model
- [[Recasens_1997_LingualCoarticulationDAC]] — cited as the primary DAC model paper
- [[Recasens_2003_ArticulationSoundChangeRomance]] — cited for coarticulation-driven sound change
- [[Recasens_2012_LateralAllophones]] — relevant to lateral coarticulation (not directly cited but Recasens' work pervades)
- [[Fowler_1980_CoarticulationTheoriesExtrinsicTiming]] — cited for coarticulation and theories of extrinsic timing; foundational intrinsic timing framework
- [[Fowler_2006_CoarticulationGesturePerception]] — cited for coproduction theory and gesture perception
- [[Sering_2020_AnticipatoryCoarticulation]] — relevant to anticipatory coarticulation in synthesis
- [[Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal]] — related to AP/coproduction framework
- [[Liberman_Mattingly_1985_MotorTheory]] — related to gesture-based perception
- [[Saltzman_1989_DynamicalGesturalPatterning]] — the task-dynamic model that computationally implements the coproduction theory reviewed here; provides the formal equations for gestural blending and overlap

### New Leads (Not Yet in Collection)
- Keating (1990b) "The window model of coarticulation" — primary theoretical framework for grammar-based coarticulation
- Lindblom (1990) "H&H theory" — hyper/hypo speech framework, relevant to speaking style control
- Browman & Goldstein (1992) "Articulatory phonology: An overview" — foundational AP reference
- Sussman et al. (1993) "Locus equations" — quantitative coarticulation measurement, potentially useful for deriving formant transition parameters

### Supersedes or Recontextualizes
- This chapter provides broader theoretical context for Recasens_1997_LingualCoarticulationDAC by situating the DAC model within the coproduction framework and contrasting it with competing approaches
- Contextualizes Ohman_1966_CoarticulationVCV as one of the pioneering studies that established V-to-V transconsonantal coarticulation
