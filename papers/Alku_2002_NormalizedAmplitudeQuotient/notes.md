---
title: "Alku, Backstrom & Vilkman 2002 — Normalized Amplitude Quotient for Parametrization of the Glottal Flow"
year: 2002
---

# Alku, Backstrom & Vilkman 2002 — Normalized Amplitude Quotient for Parametrization of the Glottal Flow

## Key Contribution

Defines the **Normalized Amplitude Quotient (NAQ)**, a voice source parameter that quantifies the glottal closing phase using only two amplitude-domain measurements, avoiding the need to extract time instants of glottal opening/closure.

## Core Equations

### Amplitude Quotient (AQ)

For a triangular glottal pulse, the closing phase duration T2 equals:

```
AQ = f_ac / d_peak                                       (Eq. 3)
```

Where:
- `f_ac` = peak-to-peak amplitude of the glottal flow (ac flow)
- `d_peak` = negative peak amplitude of the differentiated glottal flow (magnitude)

AQ has units of **time** (seconds). In discrete-time processing, AQ must be divided by sampling frequency to convert from samples to seconds.

### Normalized Amplitude Quotient (NAQ)

```
NAQ = AQ / T = f_ac / (d_peak * T)                       (Eq. 4)
```

Where:
- `T` = fundamental period (1/F0)
- NAQ is **dimensionless** (time/time)

### Relationship to Closing Quotient (CQ)

For a triangular pulse:
```
CQ = T2 / T = f_ac / (d_peak * T) = AQ / T              (Eq. 2)
```

For real glottal pulses, NAQ approximates CQ but is always smaller than the true closing phase ratio.

## Relationship to Fant's Rd Parameter

NAQ is closely related to Fant's Rd parameter (Fant 1995, 1997):

```
Rd = NAQ / 110
```

Where 110 Hz is the approximated average male F0. Fant called f_ac/d_peak the "effective declination time" and normalized by multiplying by F0/110. The equivalent rectangular pulse concept introduced here is an alternative geometric interpretation.

## Equivalent Rectangular Pulse (ERP) Concept

The key conceptual contribution: an imaginary rectangular pulse centered at the instant of d_peak, with height = d_peak. Its width (T_erp) is adjusted until its area equals f_ac:

```
A_erp = T_erp * d_peak = f_ac  =>  T_erp = f_ac / d_peak = AQ
```

This pulse captures the energetically decisive portion of the closing phase around the main excitation instant.

## Typical NAQ Values by Phonation Type

### Female speakers (n=5)

| Phonation | NAQ Mean | NAQ SD  | NAQ Range   | CQ Mean |
|-----------|----------|---------|-------------|---------|
| Breathy   | 0.22     | 0.039   | 0.15-0.27   | 0.40    |
| Normal    | 0.15     | 0.016   | 0.13-0.16   | 0.29    |
| Pressed   | 0.12     | 0.020   | 0.10-0.15   | 0.26    |

### Male speakers (n=5)

| Phonation | NAQ Mean | NAQ SD  | NAQ Range   | CQ Mean |
|-----------|----------|---------|-------------|---------|
| Breathy   | 0.28     | 0.044   | 0.23-0.35   | 0.45    |
| Normal    | 0.13     | 0.022   | 0.11-0.17   | 0.27    |
| Pressed   | 0.09     | 0.011   | 0.08-0.11   | 0.22    |

**Key pattern:** NAQ decreases monotonically along breathy -> normal -> pressed for all 10 subjects. NAQ values are ~50% of corresponding CQ values. Correlation between NAQ and CQ = 0.94.

## Robustness Properties

- NAQ is more robust than CQ against additive noise in **normal** and **pressed** phonation
- CQ is slightly more robust in **breathy** phonation (because d_peak is low and smooth in breathy voice, making it more noise-sensitive)
- ANOVA: SNR had significant effect on CQ [F(7,232)=5.81, p<0.05] but **not** on NAQ
- Both CQ and NAQ were highly dependent on phonation type: CQ [F(2,171)=300.8], NAQ [F(2,171)=361.3]
- No gender effect on either parameter

## Why NAQ Is More Robust

1. NAQ uses only two amplitude values (f_ac and d_peak), each extracted at a single time instant
2. No need to detect glottal opening or closure instants (which are prone to formant ripple errors)
3. In normal/pressed phonation, d_peak is sharp and large-amplitude, so noise barely affects it
4. The weakness: in breathy phonation, d_peak is smooth and low, making it more noise-sensitive

## Implementation Notes for Synthesis

### Computing NAQ from LF model parameters

Given an LF-model glottal pulse:
- `f_ac` = peak amplitude of the flow waveform
- `d_peak` = |E_e| (the excitation strength, negative peak of flow derivative)
- `T` = 1/F0

```
NAQ = f_ac / (|E_e| * T)
```

This is equivalent to Rd/110 (Fant 1995), so for synthesis:
```
Rd = NAQ * 110
```

### Mapping NAQ to LF parameters for synthesis control

NAQ provides a single-knob control for voice quality:
- Higher NAQ (~0.2-0.3) -> breathy voice (gradual closure, low d_peak relative to f_ac)
- Medium NAQ (~0.13-0.15) -> normal voice
- Lower NAQ (~0.08-0.12) -> pressed voice (rapid closure, high d_peak relative to f_ac)

### Inverse filtering method used

- Speech pressure waveform (free field, no flow mask needed)
- Discrete All-Pole (DAP) modeling (El-Jaroudi & Makhoul 1991) instead of standard LPC
- DAP yields better formant estimates for high-pitched voices
- Vocal tract filter order: 8-12 (adjusted per utterance to minimize formant ripple)
- Analysis bandwidth: 4 kHz (downsampled from 22.05 kHz to 8 kHz)
- Block length: 32 ms with Hamming window

## Extraction Algorithm

1. Identify t_peak: time instant of negative peak of flow derivative within glottal cycle
2. f_ac: largest ac-flow value during the fundamental period
3. d_peak: amplitude of derivative at t_peak
4. Compute NAQ = f_ac / (d_peak * T)
5. Average over 4-6 consecutive glottal periods for stable estimates

## Collection Cross-References

### Already in Collection
- `Fant_1985_LFModelGlottalFlow` — LF model whose parameters NAQ simplifies
- `Fant_1995_LFModelRevisited` — defines Rd parameter that NAQ relates to
- `Fant_1997_VoiceSourceConnectedSpeech` — uses Rd extensively; NAQ provides equivalent parametrization
- `Fant_1988_LFFrequencyDomainInterpretation` — first introduced f_ac/d_peak as "effective declination time"
- `Childers_Lee_1991_VoiceQualityFactors` — frequency-domain voice source quantification
- `Holmberg_1988_GlottalAirflowPressure` — baseline glottal flow measurements
- `Strik_Boves_1992_ControlF0IntensityVoiceQuality` — LF model fitting approach
- `ElJaroudi_Makhoul_1991_DiscreteAllPoleModeling` — DAP method used for inverse filtering
- `Alku_1997_ParabolicSpectralParameter` — authors' earlier PSP work
- `Alku_1999_SPL_DpeakLinearity` — authors' related work on d_peak

### Cited By (in Collection)
- `Doval_2006_SpectrumGlottalFlowModels` — references NAQ for voice source parametrization
- `Drugman_2020_GlottalSourceEstimation` — cites NAQ as standard voice source measure
- `Henrich_2001_SpectralOqAsymmetry` — references NAQ in context of open quotient measures
- `Zhang_2021_LaryngealSizeSexDifferences` — uses NAQ for voice quality quantification
- `Perrotin_2021_LF_LinearFilter_Equivalence` — references NAQ-Rd relationship

### Conceptual Links (not citation-based)
- `Gobl_2003_VoiceQualityEmotion` — NAQ could parametrize the voice quality dimensions Gobl studies
- `Kreiman_2012_VoiceQualityHarmonicOQ` — both address voice quality parametrization from different angles
