# Models of Speech Synthesis

**Authors:** Rolf Carlson
**Year:** 1995
**Venue:** Proc. Natl. Acad. Sci. USA, Vol. 92, pp. 9932-9937 (Colloquium Paper: Human-Machine Communication by Voice)
**DOI/URL:** PNAS October 1995

## One-Sentence Summary
A comprehensive survey of speech synthesis approaches in 1995, comparing acoustic models, articulatory models, and waveform-based methods with emphasis on the trade-offs between knowledge-based rules and data-driven concatenation.

## Problem Addressed
Provides a taxonomy of speech synthesis methods and discusses the fundamental trade-offs between explicit knowledge modeling (rules, articulatory control) versus implicit knowledge (waveform concatenation, automatic learning) for TTS systems.

## Key Contributions
- Comprehensive taxonomy of synthesis methods along "knowledge about speech" and "flexibility" scales
- Clear distinction between sound-generating part and control part of synthesis systems
- Discussion of LF-model parameters (Rg, Rk, Ra) with spectral effects
- Analysis of higher-level parameters approach for formant synthesis
- Survey of unit selection/concatenation methods (PSOLA, COC)
- Discussion of voice conversion and speaker characteristics modeling

## Methodology
Survey/review paper synthesizing the state of speech synthesis in 1995, drawing from the author's experience at KTH and comparing approaches from major labs (AT&T, MIT, NTT, ATR).

## Key Equations

The paper does not present novel equations but references the **LF-model** (Fant, Liljencrants & Lin, 1985) for glottal source:

The LF model produces a truncated exponential sinusoid followed by a 6 dB/octave low-pass filter for the return phase.

## Parameters

### LF Model Parameters (from Figure 2)

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Glottal frequency quotient | Rg | % | 100 | 100-200 | Controls low-frequency harmonic amplitudes |
| Open quotient | Rk | % | 40 | 20-60 | Controls H1-H2 relationship |
| Return phase parameter | Ra | % | 1 | 0-5 | Controls high-frequency spectral tilt |

### Parameter Effects (from Figure 2 spectral plots at F0=100Hz)
- **Rg**: Higher values (200 vs 100) reduce amplitude of first few harmonics
- **Rk**: Higher values (60 vs 20) increase H1-H2 difference (more breathy)
- **Ra**: Higher values (5 vs 0) reduce high-frequency energy (spectral tilt)

## Implementation Details

### Synthesis Method Categories

1. **Acoustic Terminal Analog (Formant Synthesis)**
   - Cascade structure: automatic formant amplitudes, harder spectral matching
   - Parallel structure (Holmes): more flexible, requires explicit amplitude control
   - Klatt model: widely used, basis for MITalk, DECtalk
   - OVE/GLOVE (KTH): zero-pole-pole for fricatives vs. Klatt's parallel

2. **Articulatory Models**
   - Transform: gesture → vocal tract shape → tube model → acoustic network → output
   - Can output to formant parameters or directly filter source
   - Key models: Flanagan et al., Coker, Mermelstein

3. **Analysis-Synthesis / Concatenation**
   - PSOLA (Pitch-Synchronous Overlap-Add): manipulates windowed pitch periods
   - TD-PSOLA: time domain, efficient for real-time
   - FD-PSOLA: frequency domain, allows spectral modification
   - COC (Context-Oriented Clustering): NTT's method for allophone selection

### Source Models
- Traditional: simple/double impulse (poor for female/child voices)
- LF-model: time-domain, controls pulse shape with Rg, Rk, Ra
- Diplophonia parameter: every second pulse lowered in amplitude and shifted

### Higher-Level Parameters Concept
- Intermediate level between phonetic specification and raw synthesizer params
- Automatic adjustment of formant frequencies for nasality, glottal opening
- Automatic bandwidth/glottal settings
- Requires understanding acoustic-articulatory relationship

### Control Part Approaches

1. **Rule-based**: explicit knowledge formulation (Chomsky & Halle inspired)
2. **Library-based**: collection of segment combinations
3. **Automatic learning**: neural networks, analysis-synthesis matching

### Unit Concatenation Issues
- Spectral discontinuity at connection points
- Limited unit set distortion
- Non-uniform unit sizes (Olive's acoustic inventory elements)

## Figures of Interest

- **Fig 1 (p. 9933):** PSOLA method illustration showing pitch period marking and overlap-add resynthesis with pitch increase/decrease
- **Fig 2 (p. 9933):** LF model parameter effects (Rg, Rk, Ra) on differentiated glottal flow and spectrum at 100 Hz F0

## Results Summary

No empirical results - this is a survey paper. Key observations:
- Formant synthesis limited by incomplete phonetic knowledge and reliance on explicit rules
- PSOLA methods achieved good quality with natural speech units
- Articulatory synthesis promising but hampered by lack of data
- Trend toward automatic methods and larger unit inventories

## Limitations

- Survey from 1995, pre-dates modern neural/statistical methods
- No quantitative comparisons between methods
- Focus on European/US/Japanese research traditions

## Relevance to Project

### Directly Applicable
- **LF model parameters (Rg, Rk, Ra)**: Qlatt uses LF source, these parameters control voice quality
- **Higher-level parameters concept**: Similar to Qlatt's semantics.yaml deriving low-level params from phonetic input
- **Cascade vs parallel discussion**: Qlatt implements both with SW switching

### Conceptual Guidance
- **Knowledge scale**: Qlatt sits in formant synthesis middle ground
- **Control part separation**: Qlatt's TTS frontend (control) vs. WASM primitives (generation)
- **Coarticulation modeling**: Rules vs. unit selection trade-offs

### Specific Implementation Notes
- F1 bandwidth variation during glottal open phase mentioned but noted as potentially imperceptible
- Source-filter interaction important but often simplified
- Noise source modeling underdeveloped (noted as research gap)

## Open Questions
- [ ] How do the LF parameters (Rg, Rk, Ra) map to Qlatt's current OQ, SQ parameters?
- [ ] Is the KTH GLOVE zero-pole-pole fricative model worth investigating vs Klatt parallel?
- [ ] Are there published COC phoneme inventories that could inform Qlatt's phoneme set?

## Related Work Worth Reading
- **Fant et al. (1985)** - LF model specification (reference 24)
- **Klatt & Klatt (1990)** - Voice quality, male/female differences (reference 22)
- **Holmes (1983)** - Parallel formant synthesizer (reference 33)
- **Stevens & Bickley (1991)** - Higher-level parameters (reference 41)
- **Klatt (1987) JASA 82, 737-793** - Extensive review of synthesis technology (reference 73)
- **Gobl & Karlsson (1991)** - LF parameter effects on spectrum (reference 25, source of Fig 2)

---

## Collection Cross-References

### Already in Collection
- **Allen_1987_MITalk_TTS**
- **Badin_1989_FricativeProductionModelling**
- **Carlson_1975_RuleBasedTTS**
- **Fant_1960_AcousticTheorySpeechProduction**
- **Fant_1985_LFModelGlottalFlow**
- **Hertz_1985_DeltaRuleSystem**
- **Hertz_1991_StreamsPhonesTransitions**
- **Holmes_1983_FormantSynthesizersCascadeParallel**
- **Klatt_1976_SegmentalDuration**
- **Klatt_1987_TTS_Review**
- **Klatt_1990_VoiceQualityVariations**
- **Liberman_Mattingly_1985_MotorTheory**
- **Shadle_1985_FricativeAcoustics**
- **Stevens_1971_AirflowTurbulenceNoise**
- **Stevens_1991_HL_Parameters**

### New Leads (Not Yet in Collection)
- **Gobl & Karlsson (1991) [ref 25]** - Source of Figure 2 showing LF parameter effects on spectrum. Useful for voice quality tuning.
