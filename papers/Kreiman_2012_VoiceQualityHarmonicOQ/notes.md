# Variability in the Relationships among Voice Quality, Harmonic Amplitudes, Open Quotient, and Glottal Area Waveform Shape in Sustained Phonation

**Authors:** Jody Kreiman, Yen-Liang Shue, Gang Chen, Markus Iseli, Bruce R. Gerratt, Juergen Neubauer, Abeer Alwan
**Year:** 2012
**Venue:** Journal of the Acoustical Society of America, Vol. 132, No. 4, pp. 2625-2632
**DOI:** http://dx.doi.org/10.1121/1.4747007

## One-Sentence Summary
This paper empirically demonstrates that the widely assumed simple relationship between H1*-H2*, open quotient, and perceived breathiness is actually speaker-dependent and requires multiple predictors (OQ, asymmetry coefficient, F0) for accurate modeling.

## Problem Addressed
The assumed causal chain OQ -> H1*-H2* -> breathiness perception is foundational to voice quality synthesis (e.g., Klatt & Klatt 1990), but empirical support was limited and inconsistent. This study provides synchronous measurements from high-speed video and audio to test whether these relationships hold in natural speech.

## Key Contributions
- Demonstrates that H1*-H2* is predictable (57-93% variance explained per speaker) but the predictive model is **speaker-dependent**
- Shows three distinct speaker strategies for controlling H1*-H2*: (1) OQ + F0 weighted sum, (2) OQ alone, (3) asymmetry coefficient + F0
- Confirms that pulse skewness (asymmetry coefficient) plays a significant role, especially when OQ is large (>0.7-0.8)
- Shows KLGLOTT88's assumption of perfect OQ-H1*-H2* correlation is an oversimplification compared to LF model behavior

## Methodology
- 6 speakers (3F, 3M) sustained /i/ with quasi-orthogonal variation of F0 (low/normal/high) and voice quality (pressed/modal/breathy)
- High-speed video at 3000 fps synchronized with audio at 60 kHz
- OQ measured from glottal area waveforms (frame-by-frame, averaged over 100 ms windows)
- Asymmetry coefficient = t_o / (t_o + t_c), where t_o = opening phase duration, t_c = closing phase duration
- H1*-H2* corrected for vocal tract influence using Iseli et al. (2007) formula
- Multiple linear regression with OQ, asymmetry coefficient, and F0 as predictors

## Key Equations

### LF Model H1-H2 vs OQ Relationship (from Fant 1995)
$$
H1 - H2 = -6 + 0.27 \exp(0.055 \cdot OQ)
$$
Where: OQ = open quotient (percentage). Note: Fant later stated a linear fit was nearly equivalent.

### KLGLOTT88 Relationship
In KLGLOTT88 (Klatt & Klatt 1990): H1-H2 is perfectly correlated with OQ (pulse skewness is a constant).

### Open Quotient Definition
$$
OQ = \frac{t_{open \rightarrow maxclosure}}{t_{open \rightarrow next\_open}}
$$
Where: t_open->maxclosure = time from first opening to onset of maximum closure; denominator = full cycle period.

### Asymmetry Coefficient (Speed Quotient / Pulse Skewness)
$$
AC = \frac{t_o}{t_o + t_c}
$$
Where: $t_o$ = opening phase duration, $t_c$ = closing phase duration.

### Bandwidth Correction for Open Glottis (from Stevens 1998)
When OQ > 0.7: multiply calculated B1 by a factor ranging from 1 (at OQ=0.7) to 3 (at OQ=1.0).

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Open quotient | OQ | ratio | ~0.5-0.7 modal | 0.3-1.0 | Pressed ~0.44-0.67, modal ~0.47-0.82, breathy ~0.88-0.94 |
| Asymmetry coefficient | AC | ratio | - | 0-1 | Also called speed quotient or pulse skewness |
| H1*-H2* | H1*-H2* | dB | - | -10 to 30 | Corrected for vocal tract resonances |
| Fundamental frequency | F0 | Hz | - | varied | Important predictor for some speakers |
| First formant bandwidth | B1 | Hz | - | - | Multiply by 1-3x when OQ > 0.7 |

## Implementation Details

### H1*-H2* Correction for Vocal Tract
- Harmonic magnitudes corrected for effects of first two formant frequencies and their bandwidths
- Uses formula from Iseli et al. (2007)
- Analysis-by-synthesis used to verify formant frequencies when LPC fails (high F0, near-sinusoidal source, glottal gap)

### Bandwidth Handling for Open Glottis
- When OQ <= 0.7: use Hawks & Miller (1995) frequency-to-bandwidth mapping
- When OQ > 0.7: apply Stevens (1998) correction, B1 *= factor (linear interpolation from 1.0 at OQ=0.7 to 3.0 at OQ=1.0)
- This is critical: LPC-based formant estimation fails when source is near-sinusoidal or H1 is prominent

### Speaker-Dependent Regression Models (Table III)
Three groups of strategies emerged:
1. **OQ + F0** (speakers 1, 3, 5): H1*-H2* best predicted by weighted sum of OQ and F0
2. **OQ alone** (speakers 2, 4): OQ is dominant predictor
3. **Asymmetry coefficient + F0** (speaker 6): OQ not significant; skewness and F0 dominate

### Key Numerical Results
- Overall correlation H1*-H2* vs OQ: r = 0.50 (combined group)
- Individual correlations: 0.20 (speaker 3, not significant) to 0.85 (speaker 4)
- R^2 for complete data sets: 0.35 to 0.81 across speakers
- R^2 for above/below OQ cutpoint subsets: 0.24 to 0.98

### OQ Cutpoints by Speaker
Speaker-specific thresholds where regression behavior changes:
- Speaker 1: OQ = 0.70
- Speaker 2: OQ = 0.65
- Speaker 3: OQ = 0.82
- Speaker 4: OQ = 0.75
- Speaker 5: OQ = 0.65
- Speaker 6: OQ = 0.70

### Experiment 2: Dynamic Quality Glide
- Single speaker (F) changed quality from breathy to pressed over 3.3 s
- With glottal gap (OQ 0.91-0.85): asymmetry coefficient dominates (beta=-0.84, R^2=0.66), OQ not significant
- Without glottal gap (OQ 0.84-0.58): OQ dominates (beta=-1.40, R^2=0.55), asymmetry not significant

## Figures of Interest
- **Fig. 1 (page 4):** H1*-H2* vs OQ scatter plot for all speakers - shows wide spread, r=0.50
- **Fig. 2 (page 5):** Individual speaker plots - dramatically different patterns per speaker
- **Fig. 3 (page 7):** OQ over time during quality glide with high-speed video frames showing glottal closure progression
- **Fig. 4 (page 7):** H1*-H2*, OQ, and asymmetry coefficient co-varying over time during quality glide

## Results Summary

### H1*-H2* by Voice Quality (Table I)
| Speaker | Breathy H1*-H2* (dB) | Modal H1*-H2* (dB) | Pressed H1*-H2* (dB) |
|---------|----------------------|--------------------|-----------------------|
| 1 (F) | 9.92 (5.81) | 13.23 (5.42) | 1.21 (4.24) |
| 2 (F) | 11.01 (2.75) | 3.80 (6.25) | 7.29 (1.26) |
| 3 (F) | 14.57 (8.12) | 13.07 (2.20) | 12.16 (3.29) |
| 4 (M) | 20.64 (5.02) | 5.08 (1.35) | 3.71 (0.66) |
| 5 (M) | 10.33 (6.25) | 6.82 (2.72) | -2.12 (3.79) |
| 6 (M) | 20.96 (7.09) | 9.06 (4.88) | 12.57 (6.85) |

### OQ by Voice Quality (Table I)
| Speaker | Breathy OQ | Modal OQ | Pressed OQ |
|---------|-----------|---------|------------|
| 1 (F) | 0.94 (0.02) | 0.73 (0.12) | 0.44 (0.05) |
| 2 (F) | 0.88 (0.08) | 0.66 (0.14) | 0.69 (0.14) |
| 3 (F) | 0.93 (0.03) | 0.82 (0.11) | 0.67 (0.04) |
| 4 (M) | 0.91 (0.04) | 0.80 (0.10) | 0.57 (0.05) |
| 5 (M) | 0.89 (0.07) | 0.79 (0.07) | 0.56 (0.08) |
| 6 (M) | 0.89 (0.02) | 0.47 (0.02) | 0.59 (0.16) |

## Limitations
- Only sustained phonation examined (not connected speech)
- Only 6 speakers
- Glottal area waveforms measured (not airflow), so pulse skewness may differ from flow-based measurements
- Bandwidth estimation remains problematic, especially for open-glottis conditions
- H1*-H2* highly sensitive to formant/bandwidth estimation errors
- No data on bandwidth modulation during open-glottis phonation

## Relevance to Project
This paper is directly relevant to Qlatt's voice quality synthesis:
- **LF source model**: The paper's finding that OQ alone is insufficient to predict H1*-H2* means that when implementing voice quality variation, both OQ and pulse asymmetry (Ra/Rk in LF terms) must be co-varied
- **KLGLOTT88 limitation**: Confirms that the KLGLOTT88 model's assumption of perfect OQ-H1*-H2* correlation is an oversimplification
- **Speaker presets**: Different speakers use different strategies - suggests voice quality presets should offer multiple control paths (OQ-dominant, skewness-dominant, mixed)
- **Bandwidth correction**: The Stevens (1998) B1 correction for OQ > 0.7 is relevant if ever doing analysis-by-synthesis or formant bandwidth estimation
- **F0 interaction**: F0 can be a major predictor of H1*-H2* for some speakers, meaning voice quality synthesis should consider F0-dependent adjustments to source spectrum

## Open Questions
- [ ] How do these findings apply to connected speech vs sustained phonation?
- [ ] What are the implications for the LF model's Rd parameter (which bundles OQ and skewness)?
- [ ] Should Qlatt's voice quality presets include speaker-type categories (OQ-dominant vs skewness-dominant)?
- [ ] How does glottal gap (incomplete closure) affect the LF source model's output spectrum?

## Related Work Worth Reading
- Klatt & Klatt (1990) - KLGLOTT88 model, voice quality analysis/synthesis (already in papers collection)
- Fant (1995) - LF model revisited, H1-H2 vs OQ equation (already in papers collection)
- Henrich et al. (2001) - Spectral correlates of OQ and glottal flow asymmetry (theoretical foundation)
- Hanson (1997) - Glottal characteristics of female speakers (already in papers collection)
- Doval et al. (2006) - Spectrum of glottal flow models (already in papers collection)
- Iseli et al. (2007) - H1*-H2* correction formula for vocal tract effects
- Hawks & Miller (1995) - Formant bandwidth estimation procedure

---

## Collection Cross-References

### Already in Collection
- [[Doval_2006_SpectrumGlottalFlowModels]]
- [[Fant_1985_LFModelGlottalFlow]]
- [[Fant_1997_VoiceSourceConnectedSpeech]]
- [[Klatt_1990_VoiceQualityVariations]]
- [[Kreiman_Gerratt_2010_PerceptualVoiceQualityAssessment]]
- [[Stevens_1998_AcousticPhonetics]]

### New Leads (Not Yet in Collection)
- **Hawks & Miller (1995)** - Formant frequency-to-bandwidth mapping function. Used as baseline for bandwidth estimation in synthesis when OQ <= 0.7.

### Now in Collection (previously listed as leads)
- [[Henrich_2001_SpectralOqAsymmetry]] -- Derives analytical spectral formulas showing H1*-H2* depends on both Oq and asymmetry coefficient in the LF model. Confirms this paper's finding that OQ alone cannot determine H1-H2, and shows the KLGLOTT88 model's unique monotonic relationship is an artifact of its reduced parameter count.
- [[Iseli_2007_VoiceSourceAgeSexVowel]] -- Provides the spectral magnitude correction formula for removing vocal tract effects from harmonic amplitude measurements (H1*-H2*, H1*-A3*), validated across 335 speakers ages 8-39.
