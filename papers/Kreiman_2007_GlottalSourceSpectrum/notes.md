---
title: "Measures of the Glottal Source Spectrum"
authors: "Jody Kreiman, Bruce R. Gerratt, Norma Antonanzas-Barroso"
year: 2007
venue: "Journal of Speech, Language, and Hearing Research, Vol. 50, pp. 595-610"
doi_url: "10.1044/1092-4388(2007/042)"
---

# Measures of the Glottal Source Spectrum

## One-Sentence Summary
This paper applies PCA to 78 spectral measures of the glottal source across 70 speakers (normal and pathological) to reveal that existing measures are highly redundant, poorly capture mid-to-high-frequency spectral variability, and reduce to only 4 independent spectral factors, with H1-H2 being the most robust measure.

## Problem Addressed
Despite dozens of proposed acoustic measures of the glottal source spectrum (H1-H2, spectral tilt, harmonic richness, etc.), it remains unclear how these measures relate to each other, which ones are redundant, and whether they collectively capture the perceptually important dimensions of source spectral shape variability. Previous voice quality studies have produced inconsistent results partly because the measures themselves are poorly understood.

## Key Contributions
- Demonstrated that 78 source spectral measures reduce to only 4 independent factors via PCA (76.6% variance): H1-H2 (low-frequency excitation), overall spectral slope, high-frequency noise excitation, and H2-H4
- Showed that 5 factors describe glottal pulse shapes (88.9% variance): opening phase steepness/asymmetry, closed phase duration/OQ, return-to-zero shape, and two closing shape factors
- Established that H1-H2 is uniquely robust: it correlates with both spectral and pulse shape factors, is measurement-technique-independent, and relates to both spectral shape Factor 1 and pulse shape Factor 2
- Revealed that existing measures do NOT adequately model the higher frequency parts of the source spectrum (1.5-4 kHz), which accounts for >25% of spectral shape variance
- Proposed that spectral slope in the mid-frequencies (1-3 kHz) and high-frequency noise excitation (harmonic + inharmonic) are important but unmeasured dimensions of voice quality

## Methodology
1. Recorded sustained /a/ from 70 speakers (60 with vocal pathology + 10 normal; 23 men, 37 women)
2. Extracted glottal source via inverse filtering + LF model fitting + perceptual correction
3. Computed 78 acoustic measures on three signal versions: harmonic source (inverse filtered), complete source (harmonic + inharmonic), and complete oral speech signal
4. Applied correlational analysis to eliminate redundant measures (reduced 78 to 34)
5. Applied PCA with varimax rotation to the 34 remaining measures
6. Separately applied PCA to time-domain glottal pulse shapes (70 resampled points per pulse)
7. Compared spectral measure factors with pulse shape factors and R parameters

## Key Equations

### Modified LF Model (Equation 1)
The authors modified the standard LF model return phase to handle pathological voices:

$$U'(t) = Ee \times \exp[\dot{\varepsilon} \times (t - te)] + m(t - te)$$

Where:
- $m = [Ee/(te - tc)] \times \{\exp[-\dot{\varepsilon}(tc - te)]\}$
- $\dot{\varepsilon} = [1/(te - t_2)] \times ln[(m/Ee) \times (te - t_2) + 0.5]$
- $t_2$ equals the time increment to 50% decay in the return phase
- This forces the flow to return to 0 and flattens the return phase relative to the original LF model
- The modification improves fit to many pathological voices where the standard exponential return conflicts with the equal area constraint

## Parameters

### R Parameters (Table 1, from Fant 1995, 1997)

| Name | Definition | Notes |
|------|-----------|-------|
| EE | Negative peak of differentiated flow pulse; max excitation of vocal tract | Associated with overall signal amplitude |
| FA | 1/(2*pi*Ta) = F0/(2*pi*RA); time constant of return phase | Measure of spectral tilt |
| FG | RG x F0; measures H1-H2 range boost | Related to shape of glottal pulse |
| OQ | (1 + RK)/2RG; alternatively Te/T0 | Open quotient; controls lowest harmonics amplitude |
| RA | Ta/T0; time constant of return phase normalized | Spectral tilt; frequency above which spectrum acquires additional -6 dB/octave falloff |
| RD | In terms of LF parameters: RD = (UO/EE) x (F0/110) | Shape parameter quantifying continuum from pressed to breathy |
| RG | T0/2Tp; from 0 to peak flow | Related to shape of opening phase |
| RK | (Te-Tp)/Tp; measures pulse symmetry | RK = 0 means symmetric; higher = more skewed |

### Spectral Measures Analyzed (Table 2)

| Measure | Harmonic Source | Complete Source | Complete Voice Sample |
|---------|----------------|----------------|----------------------|
| Slope of line fit to N harmonics (dB) | X | X | |
| Deviations from ideal slope (dB) | X | X | |
| H1-H2 (dB) | X | X | X |
| H2-H4 (dB) | X | X | X |
| H1-A1 (dB) | | | X |
| H1-A3 (dB) | | | X |
| Harmonic richness factor | X | | X |
| Parabolic spectral parameter | X | | |
| Long-term average spectrum | | X | X |
| Ratio of energy above/below 1 kHz | X | X | |

### PCA Results: Spectral Measure Factors (Table 4)

| Pulse Shape Factors (88.9%) | Spectral Shape Factors (88.5%) | Spectral Measure Factors (76.6%) |
|------------------------------|-------------------------------|----------------------------------|
| Factor 1: Steepness of opening; asymmetry (31.6%) | Factor 1: Slope above 4 kHz (28.4%) | Factor 1: H1-H2, low-freq excitation (33.8%) |
| Factor 2: Duration of closed phase; OQ (19.0%) | Factor 2: Slope below 450 Hz (29.2%) | Factor 2: Overall spectral slope (23.7%) |
| Factor 3: Shape of return to 0 (14.4%) | Factor 3: Slope 1.5-2 kHz (17.0%) | Factor 3: High-freq noise excitation (10.8%) |
| Factor 4: Shape of closing A (13.6%) | Factor 4: Slope 2.3-2.7 & 3.5-4.0 kHz (13.9%) | Factor 4: H2-H4 (8.3%) |
| Factor 5: Shape of closing B (10.3%) | | |

### Canonical Correlations

- R parameters vs. pulse shape factors: R^2 = .998 (p < .01) -- essentially perfect correspondence
- R parameters vs. spectral measure factors: R^2 = .45 (p < .01) -- significant but weaker
- Spectral shape factors vs. spectral measure factors: R^2 = .57 (p < .01)
- Spectral shape Factor 1 (high-freq slope) moderately correlated with slope of line fit to all harmonics (r = .59, p < .01) but NOT with any spectral measure factor from PCA
- Spectral shape Factor 2 (low-freq slope) correlated with H1-H2 (r = -.52, p < .01)
- Spectral shape Factors 3 and 4 (mid-frequency range) NOT significantly correlated with ANY existing spectral measures

## Implementation Details

### Voice Synthesis Procedure
- Custom MATLAB formant synthesizer at 10 kHz sampling rate
- Glottal pulses extracted via inverse filtering (Javkin et al. 1987 method)
- LF model least-squares fit to extracted pulses (modified version for pathological voices)
- Perceptual correction: all synthesizer parameters adjusted until synthetic copy was indistinguishable from natural (listening pretest with 12 listeners confirmed ROC Az = 0.5 on average)
- Noise estimated via cepstral-domain comb lifter (de Krom 1993)
- Spectrally shaped noise through 100-tap FIR filter
- F0 synthesized pulse-by-pulse with interpolation to match natural pitch contour
- Formant frequencies/bandwidths via LPC with 25.6 ms window (increased to 51.2 ms when F0 < 100 Hz)

### Measurement Techniques
- Spectral slopes: line fit to first 3, 5, 7, 9 harmonics and to all harmonics in power spectrum
- Deviations from ideal slope: measured in 1-kHz-wide bands from 0-4 kHz, compared against -12 dB/octave ideal (from Carr & Trill 1964)
- H1-H2 and H2-H4: from FFT power spectra
- Harmonic richness factor (HRF; Childers & Lee 1991): ratio of fundamental amplitude to sum of harmonics above fundamental
- PSP (parabolic spectral parameter; Alku et al. 1997): steepness of parabola fit to single-cycle glottal flow pulse spectrum
- H1-A1, H1-A3: calculated using Hanson (1997) corrections with Iseli & Alwan (2004) modifications
- LTAS: pitch-synchronous FFT spectra averaged over 1-s sample
- Energy ratio: spectral energy above vs. below 1 kHz

## Figures of Interest
- **Fig 1 (page 2):** LF model of glottal voice source showing time-domain parameters (EE, t0, ti, tp, te, tc) and flow derivative waveform
- **Fig 2 (page 4):** Six-panel figure showing single glottal pulse, its FFT, concatenated pulses, their FFT, natural inverse-filtered pulses, and their FFT -- demonstrates spectral differences between synthetic and natural sources
- **Fig 3 (page 5):** Three acoustic analysis approaches: (A) H1-H2 and H2-H4 from normalized spectrum, (B) deviations from -12 dB/octave ideal slope in four 1-kHz bands, (C) regression line fit to harmonic peaks
- **Fig 4 (page 10-11):** Five pulse shape factors from PCA of glottal flow derivatives, showing mean/min/max for each factor
- **Fig 5 (page 11):** Same five factors shown as integrated glottal pulses (flow rather than flow derivative)

## Results Summary

### Correlational Analysis (pre-PCA filtering)
- 78 measures reduced to 34 after eliminating redundant ones (r > .5 within "families")
- Unsmoothed inverse-filtered pulses and LF-fitted pulses eliminated because they correlated poorly with perceptually corrected versions at higher frequencies (only low-frequency measures like H1-H2 were consistent across extraction methods)
- Key finding: measures made on perceptually corrected pulses ARE reliable; measures from unsmoothed inverse filtering include too much ripple and error

### PCA of Spectral Measures
- 4-factor solution accounting for 76.6% of variance
- Factor 1 (33.8%): H1-H2 and deviations from ideal slope in 0-1 kHz and 1-2 kHz bands -- represents low-frequency excitation shape
- Factor 2 (23.7%): slope of line fit to N harmonics -- overall spectral slope
- Factor 3 (10.8%): measures of entire glottal source (harmonic + inharmonic) -- represents high-frequency noise excitation
- Factor 4 (8.3%): H2-H4 -- represents higher-frequency harmonic structure

### PCA of Spectral Shapes (directly on spectral envelopes)
- 4-factor solution accounting for 88.5% of variance
- These factors are defined by frequency REGION, not by existing measures
- Existing measures only partially capture spectral shape variability

### PCA of Pulse Shapes (directly on time-domain waveforms)
- 5-factor solution accounting for 88.9% of variance
- Factor 1 (31.6%): opening phase steepness and pulse asymmetry -- correlated with R parameters RG and RK (rs = .81, p < .01)
- Factor 2 (19.0%): duration of closed phase / open quotient -- correlated with RG, OQ (R = .65, p < .01)
- Factor 3 (14.4%): return-to-zero shape -- associated with RG, OQ (R = .64, p < .01)
- Factors 4 and 5: closing phase shape and duration -- associated with FA (r = .50) and EE (r = .32)

### Critical Finding: Misalignment Between Measures and Shape Variability
- Spectral shape Factor 1 (high-frequency slope, 28.4% variance) moderately correlated with line fit slope (r = .59) but NOT with any PCA-derived spectral measure factor
- Spectral shape Factors 3 and 4 (mid-frequency 1.5-4 kHz, 30.9% variance combined) NOT significantly correlated with ANY existing spectral measure
- Only H1-H2 is well-aligned: it correlates with spectral shape Factor 2 (low-frequency slope)

## Limitations
- Study used sustained /a/ only; results may not generalize to connected speech with formant variability
- 60 of 70 speakers had vocal pathology (necessary for range of source variability, but skews sample)
- Modified LF model introduces its own artifacts (particularly the flattened return phase)
- Perceptual correction of synthesized copies introduces experimenter bias
- Study did not directly test perceptual hypotheses about which spectral features matter
- The -12 dB/octave "ideal" slope is derived from idealized triangular source pulses and does not match real voices well

## Testable Properties
- H1-H2 measured from unsmoothed inverse-filtered pulses, LF-fitted pulses, and perceptually corrected pulses should be highly correlated (r > .5, p < .01)
- H1-H2 and LTAS-derived H1-H2 from continuous speech should be highly correlated
- PCA of a set of glottal source measures should produce factors dominated by H1-H2 in the first component
- R parameters (set of 7) should predict glottal pulse shapes with R^2 > .99 when applied to the full set
- R parameters should predict spectral measures with R^2 < .5 (much weaker than pulse shape prediction)
- Measures of mid-frequency spectral slope (1.5-4 kHz) should be poorly correlated with H1-H2 and overall spectral slope

## Relevance to Project

This paper is highly relevant for voice quality parameter design in the Klatt synthesizer. Key takeaways:

1. **H1-H2 is the most important single measure** of glottal source spectral shape, robust across measurement techniques. This validates Qlatt's use of spectral tilt as a primary voice quality control parameter.

2. **Four independent spectral dimensions exist**: H1-H2 (low-frequency shape), overall spectral slope, high-frequency noise excitation, and H2-H4. This suggests Qlatt voice quality presets should control at least these four dimensions independently.

3. **Mid-to-high-frequency spectral detail is NOT captured by existing measures** but accounts for >25% of spectral shape variance. This means relying only on H1-H2 and overall spectral tilt for voice quality control will miss significant perceptual variation. Additional control over the 1.5-4 kHz region may be needed.

4. **Noise excitation is an independent dimension** (Factor 3) separate from harmonic spectral tilt. This validates having separate AH (aspiration) control independent of spectral tilt (TL) in the Klatt model.

5. **LF R parameters map perfectly to pulse shapes (R^2 = .998) but only partially to spectral measures (R^2 = .45)**. This means the LF model captures the time-domain source well but spectral measures derived from it (like predicted H1-H2) may not fully predict what listeners hear.

## Open Questions
- [ ] What specific spectral measures in the 1.5-4 kHz range would better capture voice quality variation?
- [ ] How do these factors relate to perceptual dimensions? (This paper explicitly did NOT test perception)
- [ ] Would a larger set of normal (non-pathological) voices show similar factor structure?
- [ ] How do these findings relate to the Hanson (1997) corrected measures (H1*-H2*, H1*-A3*) that remove formant influence?
- [ ] Can the mid-frequency spectral shape be controlled via existing Klatt parameters, or does it require new parameters?

## Related Work Worth Reading
- Fant (1995) -- "The LF-model revisited" -- R parameter definitions and voice quality continuum theory (NOT the same as Fant_1985; not yet in collection)
- Fant (1997) -- "The voice source in connected speech" -- Rd unified parameter, covariation rules, phrase contours (already in collection as Fant_1997_VoiceSourceConnectedSpeech)
- Hanson (1997) -- corrected spectral measures (H1*-H2*, etc.) (already in collection as Hanson_1997_GlottalCharacteristicsFemaleAcoustic)
- Childers & Lee (1991) -- harmonic richness factor and voice quality factors (already in collection as Childers_Lee_1991_VoiceQualityFactors)
- Ni Chasaide & Gobl (1997) -- R parameters and spectral slope relationships (related: Gobl_2003_VoiceQualityEmotion)
- Alku et al. (1997) -- parabolic spectral parameter (PSP) for glottal flow quantification
- Klatt & Klatt (1990) -- voice quality variations and KLSYN88 (already in collection as Klatt_1990_VoiceQualityVariations)
- Iseli & Alwan (2004) -- improved formant correction for H1-A1/H1-A3 measures

## Collection Cross-References

### Already in Collection
- [[Fant_1985_LFModelGlottalFlow]] -- cited for the LF model definition and R parameter framework; this paper uses the LF model directly for pulse fitting
- [[Childers_Lee_1991_VoiceQualityFactors]] -- cited for the harmonic richness factor (HRF) measure; this paper evaluates HRF as one of the 78 spectral measures
- [[Klatt_1990_VoiceQualityVariations]] -- cited for KLSYN88 and the voice quality continuum; the synthesizer used in this study is based on Klatt's architecture
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] -- cited for the corrected H1*-H2*, H1*-A1, H1*-A3* measures; these are among the measures evaluated
- [[Hanson_1999_GlottalMaleSpeakers]] -- cited for male speaker glottal data; provides the gender comparison context
- [[Hanson_1995_GlottalCharacteristicsFemale]] -- the thesis behind the corrected spectral measures used here
- [[Gobl_2003_VoiceQualityEmotion]] -- related through Ni Chasaide & Gobl's R parameter work cited here
- [[Doval_2003_VoiceSourceCALM]] -- cited as Doval & d'Alessandro 1999 for glottal flow spectrum models
- [[Doval_2006_SpectrumGlottalFlowModels]] -- related; proves H1-H2 depends on both OQ and asymmetry, consistent with this paper's finding that H1-H2 is the most robust measure
- [[Fant_1997_VoiceSourceConnectedSpeech]] -- cited for Rd parameter definitions and R parameter framework used in Table 1 of this paper; provides the unified waveshape parameter and covariation rules

### New Leads (Not Yet in Collection)
- Iseli & Alwan (2004) -- improved correction formula for harmonic magnitude estimation, essential for accurate H1*-A1 and H1*-A3 computation
- de Krom (1993) -- cepstral-domain harmonics-to-noise ratio technique for separating harmonic/noise source components

### Now in Collection (previously listed as leads)
- [[Alku_1997_ParabolicSpectralParameter]] -- PSP provides an alternative to H1-H2 for quantifying glottal source spectral shape. Kreiman uses PSP as one measure in the evaluation and finds that while PSP captures low-frequency spectral decay well, it shares the limitation of most measures in failing to characterize mid-frequency (1.5-4 kHz) variability.

### Cited By (in Collection)
- [[Kreiman_2021_ValidatingVoiceQuality]] — validates the four-factor PCA from this paper perceptually; four-piece harmonic source model directly derived from these four factors
- [[Larrouy-Maestri_2024_EmotionalProsody]] — constrains the review's recommendation to use more voice quality features by showing most measures are redundant
- [[Zhang_2016_VocalFoldPhysiologyVoiceProduction]] -- cites this paper in the context of voice source measurement and spectral characterization
- [[Zhang_2016_MechanicsVoiceProductionControl]] — cites Kreiman's work on source spectrum redundancy and the gap in mid-frequency parameterization; advocates spectral-domain source models over time-domain

### Supersedes or Recontextualizes
- This paper's finding that H1-H2 is uniquely robust across measurement techniques strongly supports Hanson_1997_GlottalCharacteristicsFemaleAcoustic's choice of corrected spectral measures as primary voice quality descriptors
- The finding that existing measures fail to capture mid-frequency (1.5-4 kHz) spectral variability suggests that neither the Hanson corrected measures nor the Klatt TL parameter fully characterize voice quality -- an open gap in the field

### Conceptual Links (not citation-based)
- **Larrouy-Maestri_2024_EmotionalProsody** — emotional prosody review recommends using more voice quality features for emotion research; Kreiman's PCA shows most measures are redundant, reducing to 4 factors (H1-H2, spectral slope, high-frequency noise, H2-H4). This constrains emotion research: the many spectral features proposed for emotion recognition likely collapse to these same factors, and the mid-frequency gap Kreiman identifies may explain why valence remains hard to capture acoustically.
