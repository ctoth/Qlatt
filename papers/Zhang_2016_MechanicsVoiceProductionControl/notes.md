# Mechanics of Human Voice Production and Control

**Authors:** Zhaoyan Zhang
**Year:** 2016
**Venue:** Journal of the Acoustical Society of America, 140(4), 2614-2635
**DOI:** 10.1121/1.4964509

## One-Sentence Summary
A comprehensive review of voice physiology, biomechanics, and the physics of vocal fold vibration that establishes cause-effect relationships between laryngeal muscle control, vocal fold properties, and voice output (F0, intensity, voice quality), with critical assessment of mechanical and computational models of voice production.

## Problem Addressed
Research in voice production has been fragmented across disciplines (physiology, biomechanics, acoustics, perception), leading to disconnected understanding. Key misconceptions persist in textbooks (e.g., the Bernoulli effect's role in phonation, tension vs. stiffness conflation). This review bridges these fields to establish a causal theory linking voice physiology and biomechanics to acoustic output and its control.

## Key Contributions
- Comprehensive anatomy of vocal fold layered structure (body-cover model) with functional roles of each layer
- Clarification that the myoelastic-aerodynamic theory is incomplete: vertical phase difference and eigenmode synchronization are the primary mechanisms of self-sustained vibration, not simply the Bernoulli effect
- Two energy transfer mechanisms for phonation: (1) vertical phase difference creating pressure asymmetry between opening and closing, (2) negative damping from acoustic loading
- Phonation threshold pressure depends on eigenmode frequency spacing and coupling strength
- Detailed mapping of laryngeal muscle activations to voice parameters (F0, intensity, voice quality)
- Critical review of mechanical models (lumped-element vs. continuum), formant synthesis, and physically-based computational models
- Discussion of voice quality as primarily controlled by medial surface thickness and TA muscle activation

## Methodology
Literature review and synthesis of experimental, computational, and theoretical studies of voice production. Integrates results from excised larynx experiments, physical vocal fold models, computational (finite-element, CFD) models, and in vivo human studies.

## Key Equations

### Bernoulli Flow Pressure in Glottal Channel (Eq. 1)
$$p = P_{sup} + (P_{sub} - P_{sup})\left(1 - \frac{A_{sep}^2}{A^2}\right)$$
Where:
- $P_{sub}$, $P_{sup}$ = subglottal and supraglottal pressures
- $A_{sep}$ = glottal area at flow separation point
- $A$ = time-varying cross-sectional area within glottal channel

### Phonation Threshold Pressure (Eq. 2)
$$P_{th} = \frac{\omega_{0,2}^2 - \omega_{0,1}^2}{\beta}$$
Where:
- $\omega_{0,1}$, $\omega_{0,2}$ = eigenfrequencies of the two *in vacuo* eigenmodes participating in synchronization
- $\beta$ = coupling strength between the two eigenmodes

Key insight: phonation threshold is proportional to the frequency spacing between eigenmodes and inversely proportional to their coupling strength. Closer eigenfrequencies and stronger coupling = easier phonation onset.

## Parameters

| Name | Symbol | Units | Range | Notes |
|------|--------|-------|-------|-------|
| Vocal fold length (adult women) | L | mm | 11-15 | Anterior-posterior direction |
| Vocal fold length (adult men) | L | mm | 17-21 | Anterior-posterior direction |
| Lamina propria thickness | - | mm | ~1 | Much thinner than TA muscle |
| AP Young's modulus (cover) | E_AP | kPa | >10 | At 0.2 strain; 10x greater than transverse |
| Transverse Young's modulus | E_T | kPa | ~1-2 | At 0.2 strain |
| Stress-strain slope (tangent stiffness) | - | kPa | 20-200 | Nonlinear; increases with strain (Fig. 2) |
| Subglottal pressure (normal speech) | P_sub | Pa | ~800 | Typical voice production |
| Phonation threshold pressure | P_th | Pa | varies | Depends on eigenmode spacing and coupling |
| F0 increase from Ps (continuum model) | - | Hz/kPa | ~20 | With vocal fold contact and material nonlinearity |
| Vortex pressure perturbation | - | Pa | ~160 | At supraglottal surface; <<P_sub |

## Implementation Details

### Voice Source Spectrum: Two Spectral Slopes
The voice source spectrum has two distinct regions (Fig. 4):
1. **Low-frequency slope**: Determined by the open quotient (To/T). Longer open phase → dominant H1 → breathy quality. Short open phase → H2 or H4 dominant → pressed quality.
2. **High-frequency slope**: Determined by the return phase time constant (Ta). Abrupt closure (Ta=0) → -6 dB/octave rolloff → bright/pressed. Gradual return (large Ta) → steeper rolloff → weak high harmonics → breathy.

### Three Sound Source Mechanisms
1. **Monopole source**: Due to volume displacement by vocal fold vibration. Generally small (incompressible folds).
2. **Dipole source**: Due to fluctuating force on vocal folds from airflow. Dominant mechanism; responsible for harmonic component of voice.
3. **Quadrupole source**: Due to turbulence downstream of glottal exit. Broadband, high-frequency (>2 kHz), much weaker than dipole but responsible for aspiration noise.

### Eigenmode Synchronization Mechanism
- Vocal fold vibration with vertical phase difference results from eigenmode synchronization
- Two or more *in vacuo* eigenmodes synchronize at the same frequency with a phase difference
- Three typical eigenmodes (Fig. 6):
  - (a) Superior-inferior up-and-down motion (does not modulate airflow much)
  - (b) Medial-lateral in-phase motion (modulates airflow, does modulate glottal area)
  - (c) Medial-lateral out-of-phase motion along medial surface (essential for vertical phase difference)
- Synchronization occurs when eigenfrequencies are brought close together by increasing subglottal pressure
- At synchronization threshold, growth rate of the coupled system becomes positive → phonation onset (Fig. 7)

### Glottal Closure Requirements
- Complete membranous glottal closure is essential for strong high-frequency harmonics
- Requires: sufficient vocal fold approximation AND adequate medial surface thickness AND appropriate stiffness anisotropy
- Medial surface vertical thickness is the primary controller of closed quotient
- Thicker medial surface → larger vertical phase difference → longer closed phase
- Incomplete closure at membranous glottis → breathy, weak quality
- Incomplete closure at cartilaginous glottis only → may still have strong harmonics

### F0 Control Hierarchy
1. **Vocal fold stiffness and tension** (CT muscle activation): Primary control. Stiffening/tensioning increases eigenfrequencies.
2. **Vocal fold length** (CT muscle): Elongation increases vocal fold length which lowers F0, but the increase in stiffness/tension from elongation dominates → net F0 increase.
3. **TA muscle activation**: Complex effect. For elongated vocal fold, overall effect is to reduce eigenfrequencies. For slightly elongated or shortened folds, may increase eigenfrequencies.
4. **Subglottal pressure**: Minor effect (~20 Hz/kPa with contact and nonlinearity). Effect is through increased vocal fold contact stiffening.
5. **Vocal fold contact**: Adds restoring force → increases effective stiffness → increases F0.

### Vocal Intensity Control
- **Primary**: Subglottal pressure (controls vibration amplitude and MFDR)
- **Secondary**: Vocal tract shape (impedance matching, radiation efficiency)
- Laryngeal adjustments (CT, TA, LCA/IA) have minimal direct effect on intensity at constant Ps
- Vocal tract can amplify intensity through formant tuning (singer's formant, vowel modification in singing)
- Open glottis → large flow rate, reduced Ps, reduced speech duration between breaths

### Voice Quality Control
- **Medial surface thickness** is the primary controller (via TA and CT muscle interaction)
- CT activation reduces medial surface thickness → thinner → breathy/falsetto
- TA activation increases medial surface thickness → thicker → chest/pressed voice
- **Breathy voice**: Incomplete glottal closure, high OQ, prominent H1, turbulent noise, weak high harmonics. From weak LCA/IA/TA activation.
- **Pressed voice**: Tight vocal fold approximation, long closed phase, strong H2 (negative H1-H2), strong high harmonics. From strong medial compression.
- **Falsetto**: High F0, incomplete closure, nearly sinusoidal flow, few harmonics. From strong CT, small medial surface thickness.
- **Vocal fry (pulse register)**: Very low F0, long closed phase, irregular vibration possible. From strong TA, minimum CT, very low Ps.
- Voice register transitions may be associated with eigenmode synchronization changes

### Formant Synthesis Limitations (Sec. V.B)
Zhang identifies specific limitations of current formant synthesis:
- Source parameters in time-domain models (Klatt 1987) are "primitive" and limited
- Source parameters are NOT independent — they co-vary at different voicing conditions
- Specifying realistic parameter combinations and their time variation is a key challenge
- Spectral-domain source models (Kreiman et al., 2015) create significantly better matches to natural voices than time-domain models
- Source-filter interaction and co-variations between sub- and supra-glottal systems are not accounted for in formant synthesis → limits naturalness

## Figures of Interest
- **Fig. 1 (page 3):** Vocal fold anatomy — coronal view, histological structure, superior view, cartilage joints, muscle attachment directions
- **Fig. 2 (page 3):** Stress-strain curve of vocal fold tissue showing nonlinear stiffening behavior (tangent stiffness 20-200 kPa)
- **Fig. 3 (page 4):** Laryngeal muscle activations — LCA/IA muscles approximating and CT/TA muscle functions
- **Fig. 4 (page 6):** Glottal flow waveform, its time derivative, and correspondence to low-frequency (To/T) and high-frequency (Ta) spectral slopes
- **Fig. 5 (page 8):** Two energy transfer mechanisms — vertical phase difference with/without negative damping
- **Fig. 6 (page 9):** Three typical vocal fold eigenmodes — superior-inferior, medial-lateral in-phase, medial-lateral out-of-phase
- **Fig. 7 (page 9):** Eigenmode synchronization pattern showing frequency convergence and growth rate transition at phonation onset
- **Fig. 8 (page 12):** CQ and VPD (vertical phase difference) as functions of medial surface thickness, AP stiffness, and resting glottal angle — KEY reference for voice quality mapping
- **Fig. 9 (page 15):** Three-dimensional map of normal (b), breathy (b), and rough (c) voice as functions of subglottal pressure, vocal fold stiffness, and vocal fold approximation

## Results Summary

### Misconceptions Clarified
1. **Bernoulli effect is not the primary mechanism of phonation**: The negative Bernoulli pressure is proportional to vocal fold displacement (not a negative damping force). It does not directly provide the pressure asymmetry needed for energy transfer. The real mechanisms are vertical phase difference and negative damping from acoustic loading.
2. **Convergent-divergent glottal geometry is an effect, not a cause**: An alternatingly convergent-divergent channel does not guarantee self-sustained vibration. The vertical phase difference is what matters.
3. **Tension and stiffness are physically different**: Stiffness is a material property (elastic restoring force). Tension is the mechanical state of stress. They are often conflated in the literature.
4. **Negative intraglottal pressure is not required for phonation**: Self-sustained vibration can occur without it.

### Voice Production Map (Fig. 9)
A three-dimensional parameter space maps voice types:
- **Axes**: Subglottal pressure, vocal fold stiffness, vocal fold approximation
- **Normal voice**: Moderate values of all three
- **Breathy voice**: Low approximation, low Ps
- **Rough voice**: High Ps with moderate-low stiffness (potential for irregular vibration)
- Boundaries between regions are not sharp — gradual transitions

## Limitations
- Review paper — no new experimental data
- The eigenmode synchronization framework, while powerful, has not been fully validated in living human larynges
- Quantitative mapping from laryngeal muscle activation to voice parameters remains incomplete due to difficulty of in vivo measurement
- The role of supraglottal flow structures (vortices, jet instabilities) in voice perception remains unclear
- Nonlinear material properties of vocal folds are not well characterized across conditions

## Testable Properties
- Phonation threshold pressure should decrease when eigenmode frequencies are brought closer together (by any mechanism)
- Increasing medial surface vertical thickness should increase closed quotient and decrease H1-H2
- F0 should increase with increasing cover AP stiffness more than with body stiffness
- Subglottal pressure should have a relatively small effect on F0 compared to stiffness/tension changes
- Incomplete membranous glottal closure should reduce high-frequency harmonic energy
- The spectral slope above ~2 kHz should be controlled primarily by the abruptness of glottal closure (Ta parameter)
- Voice source noise should be broadband, predominantly above 2 kHz, and much weaker than the harmonic component

## Relevance to Project
This review provides the physiological grounding for voice source control in the Qlatt synthesizer:

1. **Voice quality presets**: The mapping from medial surface thickness → CQ → spectral characteristics provides a principled basis for breathy/modal/pressed voice quality presets that complements the companion paper (Zhang 2016a, already in collection as `Zhang_2016_VocalFoldPhysiologyVoiceProduction`).

2. **Source parameter co-variation**: Zhang explicitly notes that Klatt source parameters are not independent and co-vary across voicing conditions — this is a known limitation of our current parameter-independent approach and supports the need for HLsyn-style higher-level control (see `Hanson_2002_HLsynSourceParameters`).

3. **Spectral slope decomposition**: The two-region spectral model (low-frequency slope from OQ, high-frequency slope from Ta) maps directly to Klatt's TL parameter and the LF model's Rd/Ra parameters.

4. **Eigenmode framework**: While too complex for direct synthesis implementation, the eigenmode synchronization model explains phenomena like voice breaks, register transitions, and subharmonics that our synthesizer may need to handle for natural-sounding voice quality variation.

5. **Aspiration noise characteristics**: Turbulence noise is broadband, mostly >2 kHz, and has non-flat spectral shape depending on glottal geometry — relevant to AH parameter modeling.

## Open Questions
- [ ] How should the identified co-variation of source parameters be handled in Qlatt? Currently OQ, TL, AH are set independently — should we implement constraint relationships?
- [ ] Can the eigenmode synchronization framework inform voice onset/offset modeling (attack characteristics)?
- [ ] The paper notes spectral-domain source models (Kreiman et al., 2015) outperform time-domain models — should Qlatt investigate this approach?
- [ ] How does the finding that F0 increases ~20 Hz/kPa with contact interact with our current microprosody rules?

## Related Work Worth Reading
- Titze (1988) - Phonation threshold pressure theory (key equation validated here)
- Kreiman et al. (2015) - Spectral-domain voice source models (noted as superior to time-domain)
- Story and Titze (1995) - Three-mass body-cover vocal fold model
- Titze and Story (2002) - Rules relating laryngeal muscle activation to lumped-element model parameters
- Titze (1973) - 16-mass vocal fold model
- Titze and Talkin (1979) - Finite-difference phonation model (first continuum model)

---

## Collection Cross-References

### Already in Collection
- [[Zhang_2016_VocalFoldPhysiologyVoiceProduction]] — Companion paper by same author, same year. That paper presents NEW computational results from a 3D continuum model with parameter sweeps and R-parameter table. This paper is the REVIEW providing the broader theoretical and physiological framework. They are complementary: the review (this paper) provides context, the computational paper provides quantitative data.
- [[Fant_1985_LFModelGlottalFlow]] — LF model parameters (To, Te, Ta, Ee) discussed in Sec. III.A of this review as the standard voice source parameterization.
- [[Childers_Lee_1991_VoiceQualityFactors]] — Voice quality factors (OQ, speed quotient, closure abruptness, noise) that this review contextualizes within the eigenmode framework.
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — Formant synthesis approach critiqued in Sec. V.B as having "primitive" source controls.
- [[Klatt_1990_VoiceQualityVariations]] — KLSYN88/KLGLOTT88 source model discussed as representative of parametric time-domain approaches.
- [[Gobl_2003_VoiceQualityEmotion]] — Voice quality parameter trajectories that this review grounds in physiology.
- [[Hanson_2001_ModelsPhonation]] — HLsyn quasi-articulatory controller directly relevant to bridging the gap Zhang identifies between physiology and synthesis.
- [[Hanson_2002_HLsynSourceParameters]] — Higher-level control equations that address the source parameter co-variation problem Zhang highlights.
- [[Rothenberg_1981_InteractiveVoiceSource]] — Source-tract interaction model; Zhang discusses this interaction as a significant factor in voice production physics.
- [[Stevens_1991_HL_Parameters]] — Higher-level parameter system that maps articulatory controls to Klatt parameters, directly addressing the control complexity Zhang critiques.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Voice quality modification rules for Klatt; Zhang's review provides the physiological basis for why these rules work.
- [[Kreiman_2021_ValidatingVoiceQuality]] — Spectral-domain voice source model Zhang advocates as superior; validates four-piece spectral decomposition.
- [[Kreiman_2007_GlottalSourceSpectrum]] — PCA of source spectrum measures; Zhang notes the redundancy and gaps in current parameterization.

### Cited By (in Collection)
- [[Kamiloglu_2021_VoiceProductionPerception]] — cites this review (as Zhang 2016a) for its coverage of voice physiology and biomechanics in their comprehensive review of voice production and perception

### Conceptual Links (not citation-based)
- [[Doval_2003_VoiceSourceCALM]] — CALM model provides the spectral-domain source approach Zhang advocates, treating the voice source as a mixed causal-anticausal filter rather than a time-domain waveform.
- [[Doval_2006_SpectrumGlottalFlowModels]] — Analytical spectral formulas for glottal models that formalize the two-slope spectral structure Zhang describes in Sec. III.A.
- [[Perrotin_2021_LF_LinearFilter_Equivalence]] — Efficient linear-filter LF implementations relevant to Zhang's call for computationally efficient reduced-order models.
- [[Titze_2014_BistableVocalFoldAdduction]] — Strong. Titze's bistable adduction model demonstrates the quantal register transition behavior that Zhang reviews in the context of vocal fold eigenmode coupling; the two-spring model provides a simplified framework for the biomechanics Zhang covers.

### New Leads (Not Yet in Collection)
- **Kreiman et al. (2014)** — "Foundations of Voice Studies" — Comprehensive reference for voice perception and source characteristics
- **Titze and Story (2002)** — Rules for relating muscle activation to lumped-element model parameters — key for implementing physiologically-grounded voice control
- **Story and Titze (1995)** — Three-mass body-cover model — important intermediate between simple two-mass and full continuum models
