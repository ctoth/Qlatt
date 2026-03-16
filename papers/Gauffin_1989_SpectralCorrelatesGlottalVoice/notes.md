---
title: "Gauffin & Sundberg 1989 — Spectral Correlates of Glottal Voice Source Waveform Characteristics"
year: 1989
---

# Gauffin & Sundberg 1989 — Spectral Correlates of Glottal Voice Source Waveform Characteristics

## Key Findings for Synthesis

### Two Critical Glottogram-to-Spectrum Relationships

1. **Peak-to-peak amplitude of flow glottogram (U_G) correlates with amplitude of source spectrum fundamental (A_0)**
   - Near 1:1 relationship observed across singers and nonsingers (Figure 6)
   - More precisely: the *area under the glottogram pulse* determines fundamental amplitude (per Fant model), but peak-to-peak amplitude is a good proxy due to limited shape variation in normal voices

2. **Negative peak amplitude of differentiated flow glottogram (dU_G/dt) correlates with SPL of vowel**
   - High correlation across all subjects, registers, and phonation types
   - SPL increases at a *higher rate* than dU_G/dt (nonlinear relationship)
   - For very soft phonation: SPL is primarily determined by the fundamental
   - For louder phonation: SPL is mainly determined by the sound level of the first formant

### Fant LF Model Predictions (Confirmed by Data)

The paper validates four predictions from Fant et al. 1985:

1. **Main vocal tract excitation** occurs at the moment of flow discontinuity (t_e), when dU_G/dt reaches its negative peak
2. **Area under flow pulse** determines amplitude of voice source fundamental
3. **Amplitude of dU_G/dt** determines amplitude of source spectrum overtones near F1, hence SPL
4. **Fine details of final closing phase** (return phase, t_a parameter) determine amplitudes of higher source spectrum overtones — controls spectrum tilt

### LF Model Parameters (from Fant et al. 1985, as used here)

Four parameters describe the differentiated flow glottogram:
- **t_p** — time at which flow glottogram reaches its peak; t_p = pi/omega_g = 1/(2*F_g)
- **t_e** — time of flow discontinuity (maximum rate of decrease in flow)
- **t_a** — time constant related to rate of flow decrease during final part of closing phase (return phase)
- **E_e** — maximum rate of decrease in airflow (negative peak of differentiated glottogram)

LF model equations for differentiated flow glottogram:
- Segment 1 (t_0 <= t <= t_e): E(t) = E_0 * e^(alpha*t) * sin(omega_g * t)
- Segment 2 (t_e <= t <= t_c): E(t) = (-E_e / (epsilon * t_a)) * [e^(-epsilon*(t-t_e)) - e^(-epsilon*(t_c-t_e))]

### Effect of t_a on Spectrum

- t_a = 0.15 ms: sharp closure, strong high-frequency content (Figure 9)
- t_a = 0.6 ms: softer closure, reduced high-frequency content
- The maximum rate of airflow decrease (E_e) acts like a volume control on all overtones equally
- The spectrum *tilt* is controlled by t_a (the return phase)

### Phonation Types — Glottogram Characteristics

| Phonation Type | Peak Flow (U_G) | Glottal Closure | EPA | Subglottic Pressure |
|----------------|-----------------|-----------------|-----|---------------------|
| Pressed        | Low             | Complete, long closed phase | Small (4.3 mm^2) | High (14 cm H2O) |
| Normal         | Medium          | Complete        | Medium (8.1 mm^2) | Medium (9 cm H2O) |
| Flow           | High (maximum with closure) | Complete | Moderate (15.0 mm^2) | Medium (8 cm H2O) |
| Breathy        | High            | Incomplete (leakage) | Large (21.0 mm^2) | Low (5 cm H2O) |
| Whisper        | High DC offset  | Incomplete      | Large (19.0 mm^2) | Low (4 cm H2O) |

### Singer vs. Nonsinger Differences

- **Singers**: flow glottogram peak amplitude increases approximately at the same rate as SPL (1:1 in dB). Phonation type remains relatively stable across loudness changes.
- **Nonsingers**: 30 dB SPL increase accompanied by only ~8 dB increase in flow glottogram amplitude. Phonation shifts toward pressed phonation as loudness increases.
- **Fant (1959) rule for normal speech**: 10 dB SPL increase accompanied by 4 dB increase in fundamental amplitude — confirmed for nonsingers.
- Singers have "orthogonalized" loudness and pitch dimensions — can vary one without the other.

### Estimated Peak Glottal Area Formula

EPA (cm^2) = k^(1/2) * 7.6 * 10^(-4) * U_peak / P^(1/2)

Where:
- k = correction factor (set to 1)
- rho = density of air
- U_peak = peak volume velocity (cm^3/sec)
- P = subglottic pressure (cm H2O)

### Spectral Band Analysis (Figure 4)

For vowel /ae/ with varying loudness:
- Spectrum band 0-0.4 kHz (fundamental): dominates at very soft phonation
- Spectrum band 0.4-1 kHz (F1 region): nearly equals SPL at moderate-to-loud levels
- Higher bands (1-2 kHz, 2-4 kHz): increase *more* than SPL in middle range
- Singer shows much higher 2-4 kHz level relative to SPL than nonsinger (singer's formant effect)

### Practical Implications for Synthesis

- To model loudness variation: increase E_e (dU_G/dt peak) — this is the primary SPL control
- To model phonation type (breathy/pressed): vary U_G peak-to-peak amplitude — this controls fundamental level relative to overtones
- Spectrum tilt is controlled by t_a independently of overall level
- The relationship between SPL and dU_G/dt is consistent across registers (modal, falsetto) with only slight differences
- For normal speech synthesis: use the 10 dB SPL = 4 dB fundamental increase rule (Fant 1959)

## Collection Cross-References

### Already in Collection
- [[Fant_1985_LFModelGlottalFlow]] — the four-parameter LF model validated by this paper; provides the theoretical framework (t_p, t_e, t_a, E_e) that the spectral correlates are mapped onto
- [[Fant_1960_AcousticTheorySpeechProduction]] — foundational acoustic theory; Fant 1970 edition cited for source-filter framework

### Cited By (in Collection)
- [[Alku_1999_SPL_DpeakLinearity]] — refines Gauffin & Sundberg's single linear SPL-dpeak relationship, showing it breaks down across a wide intensity range with a "knee" at the soft-to-normal boundary
- [[Alku_1997_ParabolicSpectralParameter]] — cites for spectral correlates of glottal source; PSP method builds on this paper's spectral analysis approach
- [[Vogel_2010_FatigueSpeechAcoustics]] — cites for glottal source waveform characteristics and spectral correlates
- [[Titze_1992_VocalIntensity]] — cites in context of vocal intensity measurements
- [[Henrich_2003_JND_OpenQuotient]] — cites for open quotient and glottal source relationships
- [[Henrich_2005_GlottalOpenQuotientSinging]] — cites for glottal waveform characteristics in singing
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — cites for inverse filtering methodology

### New Leads (Not Yet in Collection)
- Rothenberg (1973) — "A new inverse-filtering technique for deriving the glottal airflow during voicing" — the inverse filtering method used to obtain flow glottograms

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [[Doval_2006_SpectrumGlottalFlowModels]] — directly extends this paper's spectral analysis by deriving closed-form expressions for how LF model parameters (OQ, asymmetry) map to spectral slope; provides the mathematical basis for the spectral correlates Gauffin & Sundberg observed empirically
- [[Childers_Lee_1991_VoiceQualityFactors]] — complementary approach to voice quality quantification; Childers & Lee use HRF (harmonic richness factor) while Gauffin & Sundberg use flow glottogram amplitude ratios, both converging on the same phonation-type distinctions
- [[Gobl_2003_VoiceQualityEmotion]] — applies the phonation type framework (breathy/modal/pressed) established here to emotional speech, connecting glottal source parameters to affect expression
- [[Kreiman_2007_GlottalSourceSpectrum]] — extends the spectral analysis of glottal source to perceptual dimensions, evaluating which spectral measures (including those derived from LF parameters) best predict perceived voice quality
