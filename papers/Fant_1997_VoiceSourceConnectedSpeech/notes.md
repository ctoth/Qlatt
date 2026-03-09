# The Voice Source in Connected Speech

**Authors:** Gunnar Fant
**Year:** 1997
**Venue:** Speech Communication 22 (1997) 125-139
**DOI:** S0167-6393(97)00017-4

## One-Sentence Summary

Provides comprehensive rules for varying LF glottal source parameters (Rd, Ee, Fa) across connected speech based on segment type, F0, stress, and phrase position.

## Problem Addressed

Most voice source studies focus on stationary qualities; this paper addresses dynamic variations in connected speech including prosodic context, coarticulation, and phrase-level contours needed for natural synthesis.

## Key Contributions

- Introduces the **Rd parameter** as a unified waveshape descriptor that predicts default values for Ra, Rk, Rg
- Establishes **covariation rules**: 1 dB change in 1/Rd corresponds to 2 dB change in Ee
- Provides **formant bandwidth increase formulas** due to glottal leakage
- Documents **phrase contour** patterns for Ee including onset rise (~50ms), declination (~2dB/s), and final fall
- Relates **H1*-H2*** spectral measure to open quotient via exponential formula

## Methodology

Analysis of Swedish vowels and consonants using inverse filtering to extract LF parameters; correlation studies across multiple speakers; validation through synthesis experiments.

## Key Equations

### Fa (glottal spectrum cutoff) from Ra

$$
F_a = \frac{1}{2\pi T_a} = \frac{F_0}{2\pi R_a}
$$

Where: $T_a$ = return phase duration, $R_a = T_a/T_0$

### Rd (unified waveshape parameter)

$$
R_d = \frac{U_o}{E_e} \cdot \frac{F_0}{110} \cdot 1000 = \frac{1}{0.11} \cdot \frac{T_d}{T_0}
$$

Where: $U_o$ = peak glottal flow, $E_e$ = excitation amplitude, $T_d = U_o/E_e$ (effective declination time ~1ms)

Alternative with Td in ms:
$$
R_d = \frac{U_o}{E_e} \cdot \frac{F_0}{110}
$$

### Rd from LF parameters

$$
R_d = \frac{1}{0.11}(0.5 + 1.2R_k)(R_k/4R_g + R_a)
$$

Accuracy: within 0.5 dB for $R_d < 1.4$, max error 1.5 dB at $R_d = 2.7$

### Open Quotient (complete form)

$$
OQ_e = \frac{T_e + T_a}{T_0} = \frac{1 + R_k}{2R_g} + R_a
$$

### Open Quotient (reduced form, Klatt definition)

$$
OQ_i = \frac{T_e}{T_0} = \frac{1 + R_k}{2R_g}
$$

### Default LF parameters from Rd

$$
R_{ap} = \frac{-1 + 4.8R_d}{100}
$$

$$
R_{kp} = \frac{22.4 + 11.8R_d}{100}
$$

### H1*-H2* from OQ (exponential)

$$
H1^* - H2^* = -6 + 0.27 \exp(5.5 \cdot OQ_i)
$$

### H1*-H2* from Rd (linear approximation)

$$
H1^* - H2^* = -7.6 + 11.1 R_d
$$

### Formant bandwidth increase from glottal leakage

$$
\Delta B1 = 250 \cdot \left(\frac{F1}{500}\right)^2 \cdot \frac{R_a}{12}
$$

$$
\Delta B2 = \frac{\Delta B1 \cdot F1}{2 \cdot F2}
$$

### SPL change from F0 alone

$$
\Delta SPL = 10 \log_{10}\left(1 + \frac{\Delta F_0}{F_0}\right) \text{ dB}
$$

### SPL change from subglottal pressure

$$
\Delta SPL = 20 \log_{10}\left[\frac{P_s + \Delta P_s}{P_s}\right]^{1.1} \times \left[\frac{F_0 + \Delta F_0}{F_0}\right]^{1.35+0.5}
$$

With $F_0 = 100$ Hz, $\Delta F_0 = 16$ Hz (from doubling $P_s$ 4→8 cm H2O): ~9 dB increase

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Waveshape parameter | Rd | - | 0.7 (male) | 0.3-2.7 | Male: 0.5-1.5, Female: 0.8-2.5 |
| Excitation amplitude | Ee | dB | - | - | Scale factor of formant excitation |
| Return phase ratio | Ra | % | from Rd | 0.44-12% | Ra = (-1 + 4.8*Rd)/100 |
| Rise time ratio | Rg | % | from Rd | 95-179% | Rg = (22.4 + 11.8*Rd)/100 |
| Skew ratio | Rk | % | from Rd | 26-54% | From Rd via eq. 4 |
| Glottal spectrum cutoff | Fa | Hz | 680 (male) | 133-3600 | Fa = F0/(2*pi*Ra) at 100Hz |
| Open quotient (reduced) | OQi | - | 0.55 (male) | 0.35-0.79 | Klatt definition |
| Declination time | Td | ms | ~1 | - | Td = Uo/Ee |
| Abduction factor | ka | - | 1.0 | - | ka = Ra/Rap, >1 = breathy |
| Rise factor | kg | - | 1.0 | - | kg = Rg/Rgp |
| Critical F0 | F0r | Hz | 110-160 (M) | 200-300 (F) | Boundary where Ee saturates |
| Phrase rise time | - | ms | ~50 | - | Ee onset |
| Phrase declination | - | dB/s | ~2 | 6 final | Ee decay rate |

## Default LF-parameters Table (from paper Table 1)

| Rd | Ra (%) | Fa (Hz) | Rk (%) | Rg (%) | OQi (%) |
|----|--------|---------|--------|--------|---------|
| 0.3 | 0.44 | 3600 | 26 | 179 | 35 |
| 0.5 | 0.71 | 1590 | 28.3 | 137 | 47 |
| 0.7 | 2.36 | 674 | 30.7 | 118 | 55.5 |
| 1.0 | 3.8 | 420 | 34.2 | 103 | 65 |
| 1.4 | 5.7 | 280 | 39.0 | 95 | 73 |
| 2.0 | 8.6 | 185 | 46.0 | 93.5 | 78 |
| 2.7 | 12.0 | 133 | 54.3 | 98.0 | 79 |

Note: Fa values refer to F0 = 100 Hz

## Sensitivity Table (Table 2)

| Parameter | dR/dH1 | dR/d(H1-H2) |
|-----------|--------|-------------|
| Ra | 1.0 | 1.25 |
| Rk | 3.0 | 4.5 |
| Rg | -12 | -10 |

(Values in %, factor 100 larger than nominal)

## Implementation Details

### Six-Stage Production Model

1. **Speaker-specific parameters**: Set base Rd (male ~0.7, female ~1.4)
2. **Segment-specific values**: Voiced consonants have higher Rd, lower Ee (~10dB span from vowels to stops)
3. **Coarticulation**: Interpolate at boundaries; onset faster than offset
4. **F0 dependencies**: Ee proportional to F0^p (p=1.5-2) below F0r; saturates above
5. **Stress/intensity**: Increase Ee, decrease Rd and Ra (increase Fa)
6. **Phrase contour**: 50ms rise, 2dB/s declination, faster fall at end

### Covariation Rule (Critical!)

**1 dB change in 1/Rd ↔ 2 dB change in Ee**

This applies across:
- Within and across segments
- Voice effort changes
- Dynamic variations

### Glottal Abduction Effects

When ka > 1 (breathy):
- Increased aspiration noise
- Increased Rd (lower Fa, more spectral tilt)
- Increased formant bandwidths (especially B1)
- H1 dominance increases
- High-frequency energy decreases

### Phrase Contour Implementation

```
Ee(t) contour:
1. Onset rise: ~50ms time constant
2. Main declination: ~2 dB/s
3. Final 300-500ms: accelerating decay to ~6 dB/s
4. Add F0-dependent modulation: Ee ~ F0^1.35 * Ps^1.1
5. Add segment-specific dips for voiced consonants
```

### Stress/Emphasis Effects

- Moderate stress: ~2dB SPL, ~3dB SPLH difference
- Emphatic stress: Ee increase + Rd/Ra decrease (Fa increase)
- SPLH gain ~1.5x SPL gain at increased effort
- Close vowels may show *reduced* intensity under stress (constriction effect)

### Boundary Signals

- Final lengthening
- F0 fall
- F0 resetting
- Creaky voice (multiple excitations per period)

## Figures of Interest

- **Fig. 1 (p.126)**: LF-model waveform showing Ug(t), Ug'(t), and parameter definitions
- **Fig. 2 (p.129)**: Source spectra for Rd = 0.3, 0.7, 1.4, 2.7 showing spectral tilt progression
- **Fig. 3 (p.129)**: H1*-H2* vs OQ exponential relationship
- **Fig. 5 (p.131)**: Ee vs 1/Rd covariation showing 2:1 dB relationship
- **Fig. 6 (p.132)**: Bandwidth increase from glottal leakage area
- **Fig. 9 (p.135)**: Long-time average spectra at low/normal/high voice effort
- **Fig. 10 (p.136)**: Schematic Ee phrase contour
- **Fig. 11 (p.137)**: Temporal contours of Ee, L0, L1, L2 in isolated vowel

## Results Summary

- Rd captures voice source characteristics with single parameter
- Male Rd: 0.5-1.5, Female Rd: 0.8-2.5
- Dynamic variations more perceptually important than static values
- Tolerance: <0.5 octave in Fa, <3dB in H1-H2 not significant
- F0r boundary (110-160Hz male, 200-300Hz female) critical for Ee-F0 relationship

## Limitations

- Statistical basis limited; outline rather than comprehensive validation
- LF-model occasionally fails to match human samples
- Non-uniqueness in analysis, especially with gradual pulse onset
- Subglottal pressure not included as direct parameter
- Does not address period-to-period variations (jitter, shimmer)

## Relevance to Project

**High relevance for Qlatt LF source implementation:**
- Rd parameter could replace/supplement current OQ-based approach
- Covariation rules (Ee ↔ 1/Rd) essential for natural prosody
- Phrase contour model directly applicable
- Bandwidth formulas needed for voiced consonant modeling
- H1*-H2* formulas useful for voice quality synthesis

## Open Questions

- [ ] How to map Rd to current LF-source parameters in Qlatt?
- [ ] Should ka factor be exposed as synthesis parameter?
- [ ] How to implement phrase-level Ee contour in TTS frontend?
- [ ] Integration with existing AV/stress rules?

## Related Work Worth Reading

- Fant (1995) - "The LF-model revisited" - more detailed LF parameter analysis
- Fant et al. (1985) - Original LF-model paper
- Klatt & Klatt (1990) - Voice quality variations, OQi definition
- Stevens & Hanson (1994) - H1*-H2* frequency domain measures
- Hanson (1997) - Female speaker glottal characteristics
- Gobl (1988) - Voice source dynamics in connected speech
- Strik & Boves (1992a,b) - F0/intensity/Ps relationships

---

## Collection Cross-References

### Already in Collection
- [[Fant_1985_LFModelGlottalFlow]] — the original LF model paper; this paper extends it with the Rd unified parameter
- [[Fant_1986_GlottalFlowModelsInteraction]] — source-tract interaction; this paper builds on its interaction framework
- [[Fant_1988_LFFrequencyDomainInterpretation]] — frequency domain LF analysis; this paper uses its derivation approach for Rd
- [[Klatt_1990_VoiceQualityVariations]] — defines OQi used here; this paper extends voice quality continuum with Rd

### Now in Collection (previously listed as leads)
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — corrected spectral measures (H1*-H2*, H1*-A1, H1*-A3*) for female speakers. Complements this paper's male-focused Rd analysis by quantifying female voice quality differences. The ~9.6 dB gender gap in H1*-A3* maps to the Rd range differences (male 0.5-1.5, female 0.8-2.5) described here.

### New Leads (Not Yet in Collection)
- **Fant (1995)** — "The LF-model revisited" — More detailed treatment of transformed parameters and frequency domain analysis. Provides deeper background for Rd parameter.
- **Gobl (1988)** — "Voice source dynamics in connected speech" — Detailed data on glottal parameter variations across segments. Source for much of the coarticulation data.
- **Strik & Boves (1992a,b)** — F0/intensity/subglottal pressure relationships; provides empirical basis for the Ee-F0 covariation rules

### Cited By (in Collection)
- [[Gobl_2003_VoiceQualityEmotion]] — uses Rd framework for characterizing voice quality in emotional speech
- [[Gobl_2021_LFModelFrequencyDomain]] — extends the Rd-based LF model to frequency domain with alias-free digital implementation
- [[Kreiman_2007_GlottalSourceSpectrum]] — uses Rd/R parameters from this paper for PCA of glottal source measures
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] — builds on Rd parameter framework for voice quality characterization
- [[Lu_Smith_GlottalSourceSingingVoice]] — applies Rd voice source parameterization to singing voice analysis
- [[Muthukumar_2013_IterativeLFParameterFitting]] — uses LF parameters and Rd framework for iterative fitting
- [[Bonada_2008_VoiceSynthesisSpectralModels]] — references voice source parameterization for spectral synthesis

### Conceptual Links (not citation-based)
- [[Feugere_2017_CantorDigitalis]] — Feugère implements a real-time singing synthesizer using open quotient and spectral tilt parameters that directly correspond to this paper's Rd-derived OQ and Fa values. The vocal effort mapping (Eq. 16-19 in Feugère) parallels Fant's six-stage production model. (Strong)
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — Iseli documents age/sex effects on voice source spectral measures (H1*-H2*, H1*-A3*) that map directly to Rd variation across speaker populations. (Moderate)
