# Group Differences in Measures of Voice Production and Revised Values of Maximum Airflow Declination Rate

**Authors:** Joseph S. Perkell, Robert E. Hillman, Eva B. Holmberg
**Year:** 1994
**Venue:** Journal of the Acoustical Society of America, Vol. 96, No. 2, pp. 695-698
**DOI:** 10.1121/1.410307

## One-Sentence Summary

Identifies that lower 1988 MFDR values were caused by excessive low-pass filtering in the inverse-filtering algorithm, provides revised normative values, and demonstrates that core male-female and loudness-effect conclusions remain valid.

## Problem Addressed

The 1988 study (Holmberg, Hillman, & Perkell, JASA 84:511-529) established normative glottal airflow parameters for 25 males and 20 females. A subsequent 1993 study of female speakers (eventually published as Holmberg et al. 1995) used an improved inverse-filtering algorithm and found discrepancies in several parameters, particularly MFDR. This paper identifies the sources of those discrepancies.

## Key Findings

### Source of MFDR Discrepancy
- The 1988 inverse-filtering algorithm applied excessive low-pass filtering to the oral airflow signal before differentiation
- Low-pass filtering attenuates the sharp negative peak of the glottal flow derivative, which defines MFDR
- The 1993 algorithm corrected this, yielding higher (and more accurate) MFDR values
- This is particularly important because MFDR is the primary correlate of vocal intensity (SPL) via the acoustic theory prediction of 6 dB per doubling of MFDR (Fant 1979)

### Implications for 1988 Data
- The male MFDR values from 1988 (soft: 171.1, normal: 279.6, loud: 481.1 l/s/s) are likely underestimates
- The female MFDR values from 1988 were also affected
- The 1993/1995 female values (comfortable: 190.8, loud: 421.4 l/s/s) use the corrected algorithm and should be preferred
- Other parameters (open quotient, speed quotient, ac/dc ratio, etc.) were less affected by the filtering change

### Group Differences Between Studies
- Some parameter differences between the 1988 and 1993 cohorts were genuine group variation (different subject pools, age ranges, etc.)
- Methodological improvements beyond the filtering fix also contributed to some differences
- Despite numerical changes, the fundamental conclusions about male-female voice production differences and loudness-related parameter changes remained valid

## Parameters

### Revised Female MFDR Values (1993 study, from Holmberg et al. 1995)

| Condition | MFDR (l/s/s) Mean | MFDR SD | Notes |
|---|---|---|---|
| Comfortable /pae/ | 190.8 | 75.8 | Revised algorithm |
| Loud /pae/ | 421.4 | 140.9 | Revised algorithm |
| Comfortable /ae/ | 171.8 | 70.9 | Sustained vowel |
| Loud /ae/ | 372.0 | 139.5 | Sustained vowel |

### Original 1988 Male MFDR Values (potentially underestimated)

| Condition | MFDR (l/s/s) Mean | Notes |
|---|---|---|
| Soft | 171.1 | May be underestimated |
| Normal | 279.6 | May be underestimated |
| Loud | 481.1 | May be underestimated |

### Original 1988 Female MFDR Values (superseded)

| Condition | MFDR (l/s/s) Mean | Notes |
|---|---|---|
| Soft | 248.9 | Superseded by 1993 values |
| Normal | 164.0 | Superseded; ~190.8 with corrected algorithm |
| Loud | 248.9 | Superseded; ~421.4 with corrected algorithm |

## Implementation Details

### Low-Pass Filtering Effect on MFDR
- MFDR is defined as the maximum negative peak of the first derivative of inverse-filtered glottal airflow
- The derivative operation amplifies high-frequency content, making it sensitive to the cutoff frequency of any preceding low-pass filter
- Excessive low-pass filtering smooths the closing phase of the glottal waveform, reducing the sharpness of the negative peak in the derivative
- The correction involved using a less aggressive low-pass filter (1100 Hz in the 1993 study vs the original filtering in 1988)

### Practical Guidance for Synthesis
- When using Holmberg 1988 MFDR data for Klatt/LF model calibration, treat the values as lower bounds
- Prefer the Holmberg 1995 female data which uses the corrected algorithm
- The relationship MFDR ~ Ee (LF model excitation strength) means that LF Ee targets derived from 1988 data may be too low
- The 6 dB/doubling SPL-MFDR relationship (Fant 1979) provides a cross-check: if SPL values are correct but MFDR seems too low, the MFDR is likely underfiltered

## Relevance to Project

This paper is important as a calibration correction for the Holmberg 1988 data already in the collection. Key implications:

1. **MFDR-to-Ee mapping**: When converting Holmberg 1988 MFDR values to LF model Ee parameters, apply an upward correction factor, or preferably use the Holmberg 1995 data for female speakers
2. **Male data gap**: No revised male MFDR data is available from the corrected algorithm, since the 1993 study only included female speakers. The 1988 male values should be treated as conservative estimates.
3. **Loudness scaling**: The SPL-MFDR relationship remains valid but the absolute MFDR values at each loudness level should be revised upward
4. **Inverse filtering methodology**: When implementing inverse filtering for analysis purposes, the low-pass cutoff frequency is critical for MFDR accuracy. A cutoff of at least 1100 Hz is needed to preserve the closing-phase derivative peak.

## Testable Properties

- Revised female MFDR at comfortable loudness (~190.8 l/s/s) is higher than the 1988 value (~164.0 l/s/s)
- The 6 dB/doubling rule: doubling MFDR from 190.8 to ~421.4 should produce ~8.5 dB SPL increase (actual: 74.5 to 83.1 = 8.6 dB, close match)
- Low-pass filtering at 900 Hz (as in 1988) vs 1100 Hz (as in 1993) produces measurably different MFDR values from the same signal

## Open Questions

- [ ] What are the corrected male MFDR values? The 1993 study only included females.
- [ ] How large is the correction factor between the 1988 and 1993 algorithms? Could it be applied retroactively to the 1988 male data?

## Related Work Worth Reading

- Holmberg, Hillman, & Perkell (1988) — Original normative data (already in collection)
- Holmberg et al. (1995) — Female speaker study with revised algorithm (already in collection)
- Fant (1979) — Voice source theory, 6 dB/doubling MFDR prediction
- Holmberg, Hillman, & Perkell (1994a) — Intra-speaker variation in aerodynamic measures

---

## Collection Cross-References

### Already in Collection
- `Holmberg_1988_GlottalAirflowPressure` — Original 1988 study whose MFDR values this paper revises
- `Holmberg_1995_AerodynamicEGGAcousticFemaleVoice` — 1993/1995 female study using the corrected algorithm
- `Klatt_1990_VoiceQualityVariations` — Uses glottal source parameters that relate to MFDR
- `Fant_1988_LFFrequencyDomainInterpretation` — LF model whose Ee parameter maps to MFDR
- `Titze_1992_VocalIntensity` — Uses airflow and pressure data from Holmberg 1988
- `Hanson_1995_GlottalCharacteristicsFemale` — Uses aerodynamic measures of female voice
- `Hanson_1999_GlottalMaleSpeakers` — Uses Holmberg's minimum airflow data

### Cited By (in Collection)
- `Holmberg_1995_AerodynamicEGGAcousticFemaleVoice` — directly references this correction paper
- `Hanson_2001_ModelsPhonation` — references Perkell et al. 1994
- `Hanson_1999_GlottalMaleSpeakers` — references Perkell et al. 1994
- `Hanson_1997_GlottalCharacteristicsFemaleAcoustic` — references Perkell et al. 1994
- `Sundberg_2005_GlottalSourceLoudness` — references Perkell et al. 1994
- `Hanson_1995_GlottalCharacteristicsFemale` — references Perkell et al. 1994

### Conceptual Links (not citation-based)
- `Cranen_1995_PhysiologicalVoiceSourceModelling` — physiological voice source model that uses MFDR-related measures

### New Leads (Not Yet in Collection)
- **Holmberg, Hillman, Perkell, & Gress (1994a)** — Intra-speaker variation in aerodynamic measures; JSLHR 37:484-495. Relevant for understanding measurement reliability.
- **Holmberg, Perkell, Hillman, & Gress (1994b)** — Individual variation in measures of voice; Phonetica 51:30-37. Quantifies individual differences in voice production measures.
