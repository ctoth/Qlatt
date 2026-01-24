# Acoustic Modeling of American English /r/

**Authors:** Carol Y. Espy-Wilson, Suzanne E. Boyce, Michel Jackson, Shrikanth Narayanan, Abeer Alwan
**Year:** 2000
**Venue:** Journal of the Acoustical Society of America, Vol. 108(1), pp. 343-356
**DOI:** 10.1121/1.429469

## One-Sentence Summary
Provides MRI-derived vocal tract dimensions and acoustic tube models for American English /r/, demonstrating that the sublingual space is critical for achieving the characteristically low F3, and offering equations for calculating formants from cavity dimensions.

## Problem Addressed
Previous acoustic models could not adequately account for the very low F3 (1300-1950 Hz) characteristic of American English /r/. The paper tests whether Perturbation Theory or decoupling (tube) models better explain /r/ acoustics using speaker-specific MRI data.

## Key Contributions
1. Demonstrates that Perturbation Theory fails to predict actual constriction locations for /r/
2. Shows that sublingual space is essential for modeling mid-to-low F3 values (adds 200-300 Hz lowering)
3. Develops a simple tube model with MRI-derived dimensions that accurately predicts F1-F4
4. Establishes F3 as a front cavity resonance, with F1, F2, F4 arising from mid/back cavities
5. Proposes trading relations for F3 lowering via sublingual space vs. palatal constriction position

## Articulation of /r/

Three constriction locations:
1. **Pharynx** - back constriction
2. **Palatal vault** - oral constriction (most variable)
3. **Lips** - front constriction

Three articulatory configurations:
1. **Tip-up retroflex**: tongue tip raised, dorsum lowered
2. **Tip-up bunched**: both tongue tip and dorsum raised
3. **Tip-down bunched**: tongue dorsum raised, tip lowered

## Key Acoustic Characteristics

| Formant | Range (Hz) | Notes |
|---------|------------|-------|
| F1 | 250-550 | Similar to central rounded vowel |
| F2 | 900-1500 | Similar to central rounded vowel |
| F3 | 1300-1950 | Characteristically low, often approaches F2 |
| F4 | Variable | Depends on pharyngeal constriction degree |

**Critical finding**: F3 for /r/ is 60%-80% below the F3 of neutral vowel (~2500 Hz)

## Key Equations

### Helmholtz Resonance (F1)
For back cavity with palatal constriction:
$$F1 = \frac{c}{2\pi} \sqrt{\frac{A_{oc}}{L_{oc} \cdot A_b' \cdot L_b'}}$$
(lumped approximation)

Or via admittance summation:
$$Y_{back} = -j\frac{A_b'}{\rho c} \tan\frac{\omega L_b'}{c}$$
$$Y_{constriction} = -j\frac{A_c}{\rho c} \cot\frac{\omega L_c}{c}$$

Find first zero crossing of $Y_{back} + Y_{constriction}$

### Half-Wavelength Resonance (F2)
For long back cavity model:
$$F2 = \frac{c}{2 L_b'}$$

### Double-Helmholtz Model (when pharyngeal constriction is narrow)
For F1 and F2 when pharyngeal constriction creates separate cavities:
Use Fant's coupled double-Helmholtz formula (Fant, 1960, p. 286)

- Decoupled F1: resonance of mid-cavity + palatal constriction
- Decoupled F2: resonance of back-cavity + pharyngeal constriction
- Coupled values shift F1 down and F2 up proportionally

### F3 Calculation (Front Cavity Resonance)
Combined oral + sublingual cavity with lip constriction:
$$Y_{front} = -j\frac{A_f'}{\rho c} \tan\frac{\omega L_f'}{c}$$
$$Y_{lip} = -j\frac{A_l}{\rho c} \cot\frac{\omega L_l}{c}$$

Find first zero crossing. Where:
- $A_f'$, $L_f'$ = augmented front cavity (oral + sublingual)
- $A_l$, $L_l$ = lip constriction area and length

**Important corrections** (cancel out):
- Radiation impedance at lips: lowers F3 by ~200 Hz
- Acoustic mass from palatal constriction: raises F3 by ~200 Hz

### F4 Calculation
- **Long back cavity model**: Second half-wavelength of back cavity: $F4 = \frac{2c}{2L_b'} = \frac{c}{L_b'}$
- **Additional cavity model**: Half-wavelength of mid-cavity: $F4 = \frac{c}{2L_m}$

## Parameters

### Speed of Sound
| Parameter | Value | Notes |
|-----------|-------|-------|
| c | 35,000 cm/s | Used in VTCALCS (Maeda) |

### MRI-Derived Area Functions (from Table VII)

| Parameter | PK tip-up | PK tip-down | MI initial | MI syllabic | Description |
|-----------|-----------|-------------|------------|-------------|-------------|
| $A_l$ (cm²) | 0.71 | 0.67 | 1.58 | 1.62 | Lip constriction area |
| $L_l$ (cm) | 0.90 | 0.90 | 1.50 | 1.50 | Lip constriction length |
| $A_f$ (cm²) | 2.66 | 2.03 | 3.84 | 4.47 | Front cavity area |
| $L_f$ (cm) | 1.5 | 1.5 | 1.5 | 1.5 | Front cavity length |
| $A_f'$ (cm²) | 2.19 | 1.58 | 2.57 | 3.05 | Augmented front (incl. sublingual) |
| $L_f'$ (cm) | 2.40 | 2.40 | 3.00 | 2.70 | Augmented front length |
| $A_{oc}$ (cm²) | 0.53 | 0.45 | 0.78 | 0.87 | Oral (palatal) constriction area |
| $L_{oc}$ (cm) | 3.00 | 3.00 | 2.70 | 3.00 | Oral constriction length |
| $A_m$ (cm²) | 2.18 | 2.07 | 3.88 | 3.70 | Mid-cavity area |
| $L_m$ (cm) | 4.20 | 4.20 | 4.50 | 4.20 | Mid-cavity length |
| $A_{pc}$ (cm²) | 0.94 | 0.62 | 1.94 | 1.93 | Pharyngeal constriction area |
| $L_{pc}$ (cm) | 2.40 | 2.40 | 4.20 | 4.20 | Pharyngeal constriction length |
| $A_b$ (cm²) | 2.56 | 2.12 | 3.53 | 3.56 | Back cavity area |
| $L_b$ (cm) | 3.30 | 3.30 | 3.60 | 3.60 | Back cavity length |
| $A_b'$ (cm²) | 2.29 | 1.74 | 3.12 | 3.25 | Long back cavity area |
| $L_b'$ (cm) | 9.9 | 9.9 | 12.3 | 12.0 | Long back cavity length |

### Sublingual Space Areas (Table I)
Sections are 0.3 cm each.

| Speaker | Section 1 | Section 2 | Section 3 | Section 4 | Section 5 |
|---------|-----------|-----------|-----------|-----------|-----------|
| PK tip-up | 2.707 | 0.897 | 0.594 | - | - |
| PK tip-down | 1.025 | 0.984 | 0.465 | - | - |
| MI initial | 1.833 | 0.865 | 0.542 | 0.419 | 0.156 |
| MI syllabic | 2.88 | 1.251 | 0.659 | 0.306 | - |

- PK sublingual: 0.9 cm long, starts 2.1 cm from lips
- MI sublingual: 1.2-1.5 cm long, starts 3.0 cm from lips

### Vocal Tract Lengths
| Speaker | Length | Sections |
|---------|--------|----------|
| PK | 15.3 cm | 51 × 0.3 cm |
| MI | 18.0 cm | 60 × 0.3 cm |

## Implementation Details

### Model Selection Criteria
Choose between two variants based on pharyngeal constriction:

1. **Long back cavity model** (wide pharyngeal constriction, ~2 cm²):
   - Use when $A_{pc} > 1.5$ cm²
   - F2 = half-wavelength of long back cavity
   - F4 = second half-wavelength of long back cavity
   - Better for speaker MI

2. **Additional cavity model** (narrow pharyngeal constriction, <1 cm²):
   - Use when $A_{pc} < 1$ cm²
   - F1, F2 from double-Helmholtz resonator
   - F4 = half-wavelength of mid-cavity
   - Better for speaker PK

### Constriction Classification Thresholds
| Speaker | Constriction threshold | Cavity threshold |
|---------|----------------------|------------------|
| PK | <1.0 cm² | >1.5 cm² |
| MI | <1.5 cm² (lip/palatal) | >2.0 cm² (general), >2.6 cm² (mid/back) |

### Sublingual Space Modeling Options
Two equivalent methods for achieving F3 lowering:

1. **Side branch model**: Sublingual as parallel branch from front cavity
   - Generates antiresonance at 5-6 kHz (for 0.9-1.5 cm length)
   - Volume adds to front cavity

2. **Extended front cavity**: Simply add sublingual volume to front cavity
   - Simpler calculation
   - Equivalent F3 results for short sublingual spaces

Both lower F3 by ~200-300 Hz compared to supralingual-only model.

### VTCALCS Program
- Time-domain vocal tract simulation (Maeda, 1982)
- Assumes 1D plane wave propagation
- Includes losses: yielding walls, fluid viscosity, radiation
- Modified to allow side branch in palatal region (not just velar/nasal)

## Figures of Interest
- **Fig 1 (p. 344)**: Spectrogram of "barring" showing F3 dip to 1264 Hz
- **Fig 2 (p. 345)**: Stevens' simple tube model for tip-up retroflex /r/
- **Fig 3 (p. 346)**: Midsagittal vocal tract profiles for PK and MI
- **Fig 4 (p. 347)**: MRI-derived supralingual area functions (4 plots)
- **Fig 6 (p. 349)**: Circuit diagram for side-branch model
- **Fig 7 (p. 350)**: Generic simple tube model showing all cavity parameters
- **Fig 8 (p. 351)**: Simple tube model overlaid on MRI area function

## Results Summary

### Formant Predictions vs. Real Speech (Table II)

| | PK Mean | PK Range | MI Mean | MI Range |
|---|---------|----------|---------|----------|
| F1 | 349.5 Hz | 202-517 | 388.0 Hz | 234-489 |
| F2 | 1355.4 Hz | 989-1698 | 1383.8 Hz | 989-1586 |
| F3 | 1833.8 Hz | 1479-2157 | 1664.9 Hz | 1400-1946 |
| F4 | 4110.8 Hz | 3898-4483 | 3113.7 Hz | 2742-3483 |

### Effect of Sublingual Space on F3 (comparing Tables IV and VI)

| | Without sublingual | With sublingual | Lowering |
|---|-------------------|-----------------|----------|
| PK tip-up | 1938.9 Hz | 1692.5 Hz | 246 Hz |
| PK tip-down | 2167.5 Hz | 1947.6 Hz | 220 Hz |
| MI initial | 1921.0 Hz | 1719.8 Hz | 201 Hz |
| MI syllabic | 1883.5 Hz | 1682.5 Hz | 201 Hz |

## Limitations
1. MRI and audio recorded at different times (not simultaneous)
2. Supine position during MRI may differ from upright speech
3. Lip area measurement error up to 1 cm (significant F3 effect)
4. Does not model piriform sinuses (may further lower formants)
5. Model does not fully account for lowest F3 values (<1500 Hz)
6. Lumped approximations overshoot true values by 100-200 Hz

## Relevance to Project

**For Klatt synthesizer /r/ implementation:**
1. F3 target should be 60-80% of neutral vowel F3 (around 1500-1800 Hz for males)
2. F3 is a front cavity resonance - lowered by:
   - Sublingual space (adds effective front cavity volume)
   - Lip rounding/constriction
   - Posterior palatal constriction placement
3. F1/F2 pattern similar to central rounded vowel (like schwa but lower F2)
4. F4 varies significantly with pharyngeal constriction degree:
   - Narrow pharynx: F4 ~4100 Hz
   - Wide pharynx: F4 ~3100 Hz
5. Trading relations exist - multiple articulatory configurations produce equivalent acoustics

**Formant targets for /r/ synthesis:**
| Formant | Male Target | Female Target (approx) |
|---------|------------|----------------------|
| F1 | 350-450 Hz | 400-550 Hz |
| F2 | 1000-1400 Hz | 1100-1500 Hz |
| F3 | 1500-1800 Hz | 1700-2000 Hz |
| F4 | 3100-4100 Hz | 3300-4300 Hz |

## Open Questions
- [ ] How do piriform sinuses affect /r/ acoustics?
- [ ] What are lip constriction dimensions for true tip-up retroflex /r/?
- [ ] How does sublingual antiresonance (5-6 kHz) affect perception?
- [ ] What causes speaker-specific F4 differences (pharyngeal constriction)?

## Related Work Worth Reading
- Alwan, Narayanan, & Haker (1997) - MRI data source, liquid approximant models
- Stevens (1999) *Acoustic Phonetics* - Detailed /r/ model for retroflex configuration
- Narayanan, Byrd, & Kaun (1999) - Tamil retroflex liquids (longer sublingual space)
- Guenther et al. (1999) - Articulatory trading relations for /r/
- Fant (1960) - Double-Helmholtz resonator equations
- Maeda (1982) - VTCALCS vocal tract simulation
- Dang & Honda (1997) - Piriform fossa acoustic effects
