# Formant Synthesizers: Cascade or Parallel?

**Authors:** J.N. Holmes
**Year:** 1983
**Venue:** Speech Communication 2 (1983) 251-273, Elsevier/North-Holland
**DOI/URL:** 0167-6393/83/$3.00

## One-Sentence Summary
This paper provides a rigorous technical argument that parallel formant synthesizers, when properly designed with appropriate spectral shaping filters and low-frequency compensation, are superior to cascade synthesizers for all speech sounds including vowels.

## Problem Addressed
The long-standing controversy over whether cascade or parallel formant connections are better for speech synthesis. Cascade is theoretically attractive for vowels (amplitudes "come out right"), but parallel is needed for consonants. Holmes argues the theoretical advantages of cascade are illusory in practice.

## Key Contributions
1. Demonstrates that cascade synthesizers have fundamental limitations even for vowels due to:
   - Higher pole correction inaccuracies
   - Plane wave assumption breaking down above 3 kHz
   - Inability to model vocal effort variations (source spectrum changes)

2. Provides detailed design for a practical parallel synthesizer that:
   - Can approximate cascade response when desired
   - Handles all speech sounds with same formant system
   - Directly relates controls to measurable speech properties

3. Introduces the ALF (low-frequency amplitude) control mechanism for maintaining correct low-frequency levels independent of formant amplitudes

## Methodology
- Theoretical analysis of cascade vs parallel transfer functions
- Physical acoustic modeling showing limitations of plane-wave assumption
- Experimental validation using JSRU synthesizer over 20 years of development
- Subjective listening tests comparing synthetic to natural speech

## Key Equations

### Vocal Tract Transfer Function (All-Pole)
$$
H(s) = \prod_{n=1}^{\infty} \frac{s_n s_n^*}{(s - s_n)(s - s_n^*)}
$$
Where: $s_n$ are pole locations (formant frequencies + damping)

### Average Pole Spacing
$$
d = c / 2L
$$
Where:
- $d$ = pole spacing in frequency domain (~1 kHz for adult male)
- $c$ = velocity of sound in vocal tract
- $L$ = length of vocal tract (~17 cm)

### Parallel Equivalent via Partial Fractions
For equal bandwidths, cascade can be represented exactly by parallel with gain coefficients from partial fraction expansion. Adjacent formants must have **opposite polarity** outputs to combine correctly.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| F1 spectral shaping zero | - | Hz | -640 | - | Real zero for F1 filter |
| F1 phase correction pole-zero | - | Hz | ±270 | - | All-pass for F1-F2 phase matching |
| FN resonance (nasal/LF) | - | Hz | 200±j150 | - | Low-freq formant, real part -90 to -150 |
| Higher pole correction start | - | kHz | 5.5 | - | For 5-formant, 17cm tract |
| Higher pole correction magnitude | - | dB | ~57 | at 5 kHz | Cumulative effect of poles above F5 |
| Glottal source filter poles | - | Hz | -100±j100 | - | 2nd-order low-pass approximation |

## Implementation Details

### Spectral Shaping Filter Requirements (Section 5)
For formants F2 and above:
1. Use **differentiator** (single zero at s-plane origin)
2. Provides high-pass characteristic needed for voiceless consonants
3. Peak amplitude of impulse response independent of formant frequency/bandwidth (Fig. 13)

For F1:
1. Single real zero at -640 Hz
2. Additional all-pass phase correction (pole-zero at ±270 Hz)
3. Total phase shift ~90° above F1 frequency (Fig. 14)
4. Flat low-frequency response for proper cascade approximation

### ALF Control System (Section 6, Fig. 15)
```
excitation → [dB gain: ALF] → [+] → FN resonator →
                               [-]
excitation → [dB gain: A1]  → [+] → F1 resonator → [phase corr] →
```
- ALF controls sum of F1 and FN excitation
- Maintains correct low-frequency level independent of F1 amplitude
- FN has 180° polarity reversal relative to F1

### Mixing Voiced/Voiceless Excitation (Section 7.3, Fig. 21)
- Each formant has individual excitation mixer
- Common "degree of voicing" control with per-formant offsets
- Lower formants become voiced first as voicing increases
- Mixer range = 1/3 of total voicing control range
- Offset span = 2/3 of voicing control range
- Result: F1 fully voiced while F3, F4 still voiceless during transitions

### Output Filtering (Section 8, Fig. 22)
- Voiced excitation: -6 dB/octave shaping (integrator ~600-700 Hz break)
- Voiceless: flat excitation, shaping only from output filter
- Output filter: single integrator at 640 Hz provides radiation + spectral shaping
- Avoids transient "thumps" from formant filter gain changes

## Figures of Interest
- **Fig. 2 (p. 254):** Cascade analogue vs sampled-data higher-pole correction differences
- **Fig. 4 (p. 255):** Physical model showing plane-wave breakdown above 3 kHz
- **Fig. 7 (p. 258):** Parallel can match cascade even with unequal bandwidths
- **Fig. 13 (p. 263):** Differentiated impulse responses - amplitude independent of F/BW
- **Fig. 14 (p. 263):** F1 phase shaping filter response
- **Fig. 15 (p. 265):** ALF control block diagram
- **Fig. 21 (p. 268):** Voicing mixer characteristics
- **Fig. 23 (p. 270):** Complete JSRU parallel synthesizer block diagram
- **Fig. 24 (p. 271):** Natural vs synthetic spectrogram comparison
- **Fig. 25 (p. 272):** Spectral cross-sections for vowel, liquid, nasal, aspiration

## Results Summary
- JSRU synthesizer evolved over 20 years, exists as Fortran + real-time hardware
- Hand-optimized copies "subjectively so close to natural... most judges need repeated listening"
- Some experienced judges made wrong natural/synthetic choices
- Works for formant vocoder, synthesis-by-rule, and copy synthesis
- No glottal modulation of noise needed (contrary to Klatt)

## Limitations
- Analysis focused on adult male speech; women's/children's voices need frequency range adjustment
- Design complexity higher than simple cascade for vowel-only applications
- Requires careful attention to filter phase relationships
- Still cannot model fine harmonic-by-harmonic spectrum detail

## Relevance to Project

**Critical for Qlatt**: This paper provides the theoretical justification for why our synthesizer uses parallel formant branches. Key implementation takeaways:

1. **F2+ differentiators**: Our current design should include differentiators on F2-F5 paths
2. **F1 special treatment**: Needs low-pass characteristic + phase correction, not differentiator
3. **ALF/FN for low-frequency**: Explains why we need independent low-frequency amplitude control
4. **Voicing mixer offsets**: Different formants should transition voiced→voiceless at different rates
5. **No higher-pole correction needed**: If using sampled-data at minimum rate, inherent in z-transform
6. **Phase relationships matter**: Adjacent formants must combine with correct polarity

The JSRU synthesizer block diagram (Fig. 23) is essentially what Klatt88 implements with the cascade/parallel hybrid.

## Open Questions
- [ ] Does our current implementation include the F1 phase correction network?
- [ ] Are we using the ALF mechanism correctly for low-frequency control?
- [ ] Should we add per-formant voicing offsets for mixed excitation?
- [ ] Is our FN resonator bandwidth appropriate (-90 Hz vs -150 Hz real part)?

## Related Work Worth Reading
- Holmes [17] 1973 - "Influence of glottal waveform on naturalness" - glottal source details
- Holmes [24] 1980 - ALF control mechanism original description
- Holmes [28] 1982 - JSRU Research Report 1016 - full synthesizer design details
- Rosenberg [19] 1971 - Glottal pulse shape effects
- Fant [10] 1960 - Acoustic Theory of Speech Production (foundational)
- Klatt [3] 1980 - The paper this responds to (cascade/parallel hybrid)

---

## Collection Cross-References

### Already in Collection
- [[Carlson_1975_RuleBasedTTS]]
- [[Fant_1960_AcousticTheorySpeechProduction]]
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — the cascade/parallel hybrid synthesizer that Holmes argues against; Holmes responds directly to Klatt's design choices
- [[Rabiner_1968_DigitalFormantSynthesizer]]
- [[Rabiner_1968_SynthesisByRule]]

### Cited By (in Collection)
- [[Jesus_1997_KlattSynthesiserImplementation]] — cites Holmes for the cascade vs parallel formant synthesizer analysis
- [[Lin_1995_CascadeIntoParallel]] — cites Holmes for parallel formant synthesis and higher-pole correction analysis
- [[Lalwani_1992_FlexibleFormantSynthesizer]] — references Holmes for all-parallel formant synthesizer design
- [[Carlson_1995_ModelsOfSpeechSynthesis]] — cites Holmes for parallel formant synthesizer design
- [[Feugere_2017_CantorDigitalis]] — references Holmes's cascade/parallel analysis
- [[Perrotin_2021_LF_LinearFilter_Equivalence]] — references Holmes's formant synthesizer analysis
- [[Schwarz_Rodet_SpectralEnvelopeEstimation]] — references Holmes's parallel synthesizer design
- [[Barreda_2015_FormantSpeakerSize]] — references Holmes's formant synthesizer work

### New Leads (Not Yet in Collection)
- **Holmes [17] 1973** - "The influence of glottal waveform on the naturalness of speech from a parallel formant synthesizer" - Details on glottal source modeling and the original JSRU parallel synthesizer design.
- **Flanagan [15] 1972** - "Speech Analysis, Synthesis and Perception" - Comprehensive reference on speech synthesis including source-filter model details.
- **Rosenberg [19] 1971** - "Effect of glottal pulse shape on the quality of natural vowels" - Glottal waveform modeling that informs the excitation signal design in Section 7.

### Conceptual Links (not citation-based)
- [[Hu_2012_DynamicsModelSpeechRecognitionSynthesis]] — Hu's thesis uses Holmes' 12-PFS parallel formant synthesizer as the synthesis backend; Holmes 1983 provides the theoretical justification for why parallel topology works for all speech sounds, which Hu's implementation relies on.
