# An Interactive Model for the Voice Source

**Authors:** Martin Rothenberg (Syracuse University; guest researcher at KTH Stockholm)
**Year:** 1981 (presented); 1983 (published in proceedings)
**Venue:** Vocal Fold Physiology: Contemporary Research and Clinical Issues, D. M. Bless and J. H. Abbs (Eds.), College Hill Press, San Diego, pp. 155-165. Also from STL-QPSR #4, KTH Stockholm.
**URL:** http://www.rothenberg.org/Interactive/Interactive.htm

## One-Sentence Summary
Presents a parametric model of the voice source that accounts for acoustic interaction between the glottal source and the subglottal/supraglottal vocal tract, explaining how inertive loading transforms symmetric glottal area pulses into asymmetric sawtooth-like airflow waveforms.

## Problem Addressed
Classical source-filter theory treats the glottal source and vocal tract as independent subsystems, but this fails to explain: (1) the observed variety of glottal airflow waveforms from inverse filtering, (2) the relationship between these complex airflow waveforms and the relatively simple triangular glottal area waveforms from photoglottographic measurements, and (3) how f1/f0 interactions affect higher formant amplitudes.

## Key Contributions
- Identifies **vocal tract inertance** at frequencies below f1 as the primary mechanism causing asymmetric glottal flow pulses
- Introduces the **normalized vocal tract inertance** parameter Lt (L-bar-t) as the key control variable
- Demonstrates a critical range of Lt from 0.2 to 1.0 where glottal flow transitions from symmetric triangle to rounded sawtooth
- Proposes a complete parametric model with physiologically-based parameters (T0, Ay, S1, S2, B1, B2, B3, Lt, C0)
- Establishes parameter significance ordering for synthesis
- Shows that f1/f0 interaction affects ALL formant amplitudes, not just f1 (contradicting linear non-interactive model)

## Methodology
- Nonlinear differential equation analysis of a resistance-inductance glottal model
- Analog electrical circuit simulation of the voice source model
- Comparison of model predictions with inverse filtering and photoglottographic measurements

## Key Equations

### Normalized Vocal Tract Inertance

$$
\bar{L}_t = L_t \cdot \frac{2 Y_{g_{MAX}}}{\tau_p}
$$

Where:
- $L_t$ = sum of subglottal and supraglottal inertance near f0 (acoustic mass)
- $Y_{g_{MAX}}$ = maximum glottal conductance (inverse of minimum glottal resistance)
- $\tau_p$ = duration of the glottal pulse (open phase)

### Circuit Model Variables

- $Y_g = 1/R_g$ = glottal conductance (time-varying)
- $P_L$ = average alveolar (lung) pressure
- $U_g$ = glottal volume velocity (airflow)
- Time constant for flow lag: $L_t / R_g$

### Critical Relationships

- When $\bar{L}_t > 1.0$: flow waveform slope becomes infinite at closure (maximum excitation)
- When $\bar{L}_t \approx 0.2 - 1.0$: critical transition range from symmetric to sawtooth flow
- Flow dependence of glottal resistance can be approximated by reducing $L_t$ by ~50%

## Parameters

| Name | Symbol | Description | Significance |
|------|--------|-------------|-------------|
| Fundamental frequency | f0, T0 | Glottal period | Most basic (Tier 1) |
| Lung pressure | PL | Average alveolar pressure | Most basic (Tier 1) |
| Adduction state | B1 | Vocal fold abduction (+) / adduction (-) | Most basic (Tier 1) |
| Amplitude | Ay (AL) | Peak-to-peak glottal conductance amplitude | Most basic (Tier 1) |
| Vocal tract inertance | Lt | Sum of sub/supra-glottal inertance | Important, should vary dynamically (Tier 2) |
| Glottal offset | B2 | Incomplete glottal closure (posterior chink) | Important, should vary dynamically (Tier 2) |
| Oral compliance | C0 | First formant interaction coupling | Moderately important (Tier 2) |
| Shape: tri/sine | S1 | Triangular vs sinusoidal conductance waveform | Less significant (Tier 3) |
| Shape: asymmetry | S2 | Opening vs closing time asymmetry | Less significant (Tier 3) |
| Breathy component | B3 | Conductance variation during closed phase | Less significant (Tier 3) |

### Extended Model Parameters (Fig I-A-4)

| Name | Symbol | Description |
|------|--------|-------------|
| Pharyngeal inertance | L1 | Rear component of supraglottal inertance |
| Oral inertance | L2 | Forward component of supraglottal inertance |
| Oral compliance | C0 | Lumped air compressibility + wall compliance |
| Compression dissipation | ROC | Dissipation from air compressibility/wall compliance |
| Velocity dissipation | ROL | Boundary layer / velocity-related dissipation |
| Shunting dissipation | RON | Velopharyngeal leakage / nasality shunting |

## Implementation Details

### Source-Tract Interaction Mechanism
1. Vocal folds open after closure; subglottal+supraglottal air mass has inertia
2. Air flow builds up with a lag relative to glottal area increase (time constant Lt/Rg)
3. During opening phase (~first 3/4 of pulse): linear approximation holds, flow is delayed/rounded
4. During closing phase (last ~1/4 of pulse): nonlinear regime
   - Closing folds force Rg toward infinity
   - Subglottal pressure rises (inertive compression)
   - Supraglottal pressure falls (inertive rarefaction)
   - Transglottal pressure becomes much higher than during rest of pulse
   - This supports airflow until actual closure, creating sharp slope discontinuity

### f1/f0 Interaction Rules
- When f1/f0 > 3: inertive loading dominates; f1 interaction is small
- When f1/f0 < 3: f1/f0 ratio increasingly determines voice quality
- When f1/f0 near integer: energy from previous cycles decreases supraglottal pressure during closure -> sharper flow drop -> stronger high-frequency excitation
- When f1/f0 near half-integer: opposite effect -> less sharp closure -> weaker excitation
- This affects ALL formant amplitudes, not just f1

### Vowel-Dependent Inertance Distribution
- Back vowels (e.g., [a]): high pharyngeal inertance L1, low oral inertance L2
- Front vowels (e.g., [i]): low pharyngeal inertance L1, high oral inertance L2
- Pharyngeal component is more important for glottal flow asymmetry (acts directly on glottis)

### Parameter Significance Ordering (for synthesis)
**Tier 1 (most basic, required):** f0, PL, B1, AL
- These alone should allow reasonably intelligible formant synthesis with fixed values for other params

**Tier 2 (improve naturalness):** Lt (dynamic), B2 (dynamic), C0
- Lt and B2 should vary dynamically during speech

**Tier 3 (refinements):** B3, S1, S2, vocal fold air displacement

### Flow Dependence Approximation
- Flow-dependent glottal resistance produces similar patterns to flow-independent model
- Compensation: reduce Lt by approximately 50% when flow dependence is removed
- This allows using the simpler linear conductance model with adjusted Lt

### Glottal Inertance (time-varying)
- Effect is entirely different from fixed vocal tract inertance
- At high f1/f0: minimal effect on flow asymmetry
- Causes small amplitude reduction and gradual flow onset
- Significance increases at lower f1/f0 ratios

## Figures of Interest
- **Fig I-A-1:** Block diagram of three independent subsystems (respiratory, glottal, vocal tract)
- **Fig I-A-2:** Diagrammatic illustration of inertive loading mechanism with area and flow waveforms
- **Fig I-A-3:** Solutions of nonlinear differential equation showing flow waveforms for different Lt values (0.2 to 1.0+) - the key figure demonstrating the transition from symmetric to sawtooth
- **Fig I-A-4:** Extended circuit model with oral compliance C0, split inertances L1/L2, and dissipative elements
- **Fig I-A-5:** Glottal conductance waveform (Yg) showing all parameters (T0, Ay, S1, S2, B1, B2, B3)

## Limitations
- No closed-form solution for flow-dependent glottal resistance
- Model validated primarily through analog simulation, not extensive acoustic measurements
- Does not explicitly include subglottal resonances (important for singing/high f0)
- f2 effects at low frequencies not included
- Exact closed-phase conductance variation pattern not well specified
- Parameter dependencies (e.g., Ay on PL, Ug, B1) not formally specified

## Testable Properties
- Normalized inertance Lt in range [0.2, 1.0] should transition from symmetric to sawtooth flow
- Lt > 1.0: flow slope must be infinite at closure instant
- Increasing pharyngeal inertance L1 should increase flow pulse asymmetry more than increasing oral inertance L2
- f1/f0 near integer values should produce stronger high-frequency excitation than half-integer values
- Flow-dependent model with Lt should approximate flow-independent model with 0.5*Lt
- Back vowels should show greater glottal flow asymmetry than front vowels (due to higher pharyngeal inertance)

## Relevance to Project
This paper is foundational for the Qlatt project's aerodynamic model and LF voice source implementation. Key implications:

1. **Source-filter interaction**: The Klatt synthesizer traditionally treats source and filter as independent. This paper establishes when and why that approximation breaks down, and what parameters control the interaction.

2. **Voice quality control**: The parameter hierarchy (f0, PL, B1, AL as tier 1; Lt, B2 as tier 2) maps directly to voice quality presets in our voice quality synthesis project.

3. **Vowel-dependent source variation**: The f1/f0 interaction mechanism explains why the same voice source settings sound different across vowels, informing our semantics rules for source parameter adjustment.

4. **Connection to LF model**: Rothenberg's glottal conductance parameterization (Ay, S1, S2, B1, B2, B3) is a precursor to the LF model parameters. The normalized inertance Lt directly relates to the spectral tilt and excitation strength that the LF model's return phase controls.

5. **Aerodynamic model processor**: Our `aerodynamic-model-processor.js` worklet should implement the source-tract interaction described here, particularly the inertive loading effect that shapes the glottal flow derivative.

## Open Questions
- [ ] How does this model map to specific Klatt parameters (AV, AH, TL, OQ)?
- [ ] Can Lt be estimated from formant frequencies and f0 at runtime?
- [ ] What is the quantitative relationship between Rothenberg's Lt and the LF model's Rd parameter?
- [ ] Should we implement the f1/f0 interaction as a correction to source spectrum in our semantics?

## Related Work Worth Reading
- Rothenberg (1973) "A new inverse-filtering technique for deriving the glottal air flow waveform during voicing" - JASA 53, the companion inverse filtering paper
- Rothenberg (1981) "Acoustic interaction between the glottal source and the vocal tract" - in Vocal Fold Physiology, pp. 305-323, a companion paper with more acoustic interaction detail
- Fant (1960) Acoustic Theory of Speech Production - the foundational source-filter theory this paper extends
- Fant & Martony (1963) "Formant amplitude measurements" - experimental confirmation of f1-higher formant interaction
- Titze & Talkin (1979) "A theoretical study of the effect of various laryngeal configurations on the acoustics of phonation" - detailed physical-acoustic model referenced

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]] - cited as foundational source-filter theory; Rothenberg extends it with interaction
- [[Fant_1985_LFModelGlottalFlow]] - the LF model that succeeds Rothenberg's parameterization
- [[Doval_2003_VoiceSourceCALM]] - CALM model builds on this interaction concept
- [[Doval_2006_SpectrumGlottalFlowModels]] - spectral analysis of glottal models including interaction effects
- [[Childers_Lee_1991_VoiceQualityFactors]] - voice quality parameterization that follows from Rothenberg's framework
- [[Klatt_1990_VoiceQualityVariations]] - KLSYN88 voice source relates to these interaction parameters
- [[Hanson_1995_GlottalCharacteristicsFemale]] - female voice quality measures trace back to Rothenberg's B2 (chink) parameter
- [[Stevens_1991_HL_Parameters]] - higher-level parameters include aerodynamic calculations inspired by this work
- [[Plumpe_1999_GlottalFlowDerivativeModeling]] - LF parameter extraction relates to Rothenberg's model
- [[Perrotin_2021_LF_LinearFilter_Equivalence]] - efficient LF implementations descend from this theoretical framework

### New Leads (Not Yet in Collection)
- Flanagan & Landgraf (1968) "Self oscillating source for vocal tract synthesizers" - early self-oscillating source model
- Mrayati & Guerin (1976) "Etude de l'impedance d'entree du conduit vocal" - vocal tract input impedance and source coupling
- van den Berg (1960) "An electrical analogue of the trachea, lungs and tissues" - subglottal system modeling

### Supersedes or Recontextualizes
- Provides the theoretical justification for why LF model parameters (especially return phase/spectral tilt) behave as they do -- the sharp slope discontinuity at closure that the LF model captures is explained physically here as a consequence of inertive loading
- Explains the f1/f0 interaction that Fant & Martony (1963) observed experimentally but could not justify with linear models
