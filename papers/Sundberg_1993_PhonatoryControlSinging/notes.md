# Sundberg, Titze & Scherer 1993 — Phonatory Control in Male Singing

## Reference
Sundberg J, Titze I, Scherer R. "Phonatory control in male singing: A study of the effects of subglottal pressure, fundamental frequency, and mode of phonation on the voice source." *Journal of Voice* 7(1):15-29, 1993.

## Key Findings for Implementation

### 1. Subglottal Pressure (Ps) vs Fundamental Frequency (F0)

**Empirical relationship (Table 3, Eq. from p.19):**
```
log Ps = 1.00 + 0.88 * log F0
```
- Ps in Pa, F0 in Hz
- Mean correlation r = 0.965, SD = 0.04 across all subjects
- Mean slope C = 0.877 (SD = 0.186)
- Mean intercept I = 0.877 (this is a typo-check; the table shows C mean = 0.877)
- **Rule of thumb:** singers approximately double Ps when they raise F0 by one octave (slope ~0.88 on log-log, close to 1.0)

### 2. SPL vs Subglottal Pressure

**Linear regression (all subjects pooled, Fig. 4 caption, p.20):**
```
SPL = 51.1 + 37.0 * log10(Ps)
```
- Ps in hPa (hectopascals)
- Mean slope C = 37.0 dB per decade of Ps (SD = 27.0)
- Mean intercept I = 30.2 (but high variance)
- **Practical rule:** a doubling of Ps increases SPL by ~11.1 dB (since log10(2) * 37.0 = 11.1)

**Per-doubling of excess pressure over threshold (p.19):**
- Neutral phonation: 8-9 dB SPL increase per doubling of (Ps - Pth)/Pth
- Pressed phonation: less than 8-9 dB
- Flow phonation: most favorable Ps-to-SPL relationship

### 3. Voice Source Parameters (FLOGG measures)

The paper uses inverse-filtered flow glottogram (FLOGG) parameters:

| Parameter | Symbol | Definition |
|-----------|--------|------------|
| Peak flow | U_peak | Maximum of inverse-filtered flow waveform |
| Neg. peak of dFlow/dt | U_dot | Amplitude of negative peak of differentiated flow (MFDR) |
| Period | T0 | Fundamental period |
| Closed phase duration | T_cl | Duration when glottis is closed |
| Open-to-close separation | T_pp | Time between peak flow (U_peak) and peak dU/dt (U_dot) |
| Return time | T_rt | Time from U_dot to beginning of closed phase |

**Reproducibility (Table 2, p.18):**
- U_peak: mean difference 5.8%, SD 4.0
- U_dot: mean difference 5.5%, SD 4.8
- T0: mean difference 1.1%, SD 1.0
- T_cl: mean difference 9.4%, SD 9.5
- T_pp: mean difference 8.8%, SD 5.5
- T_rt: mean difference 14.2%, SD 12.2

### 4. SPL vs U_dot (MFDR) Relationship

**Table 6 — Correlation between SPL and log U_dot:**
- Mean r = 0.89 (SD = 0.062)
- Mean slope C = 24.8 (SD = 6.63)
- This confirms that the negative peak of dFlow/dt (MFDR) is the primary voice source determinant of SPL

**Table 7 — log U_dot as function of log Ps:**
- Mean r^2 = 0.794 (SD = 0.24)
- Mean slope C = 1.34 (SD = 0.83)
- Mean intercept I = 1.53 (SD = 0.92)

### 5. Three Mechanisms for Increasing U_dot

When Ps increases, the flow derivative peak (U_dot) increases via three mechanisms (Fig. 6, p.23):

1. **Peak amplitude increase:** Greater pulse amplitude U_peak directly increases U_dot
2. **Skewing:** Pulses become more asymmetric (steeper closing phase), increasing U_dot. Skewing is measured as duration ratio between opening and closing phases. Analytically: U_dot = k * U_peak * F0 * (Qs + 1) / Qo, where Qo = open quotient, Qs = skewing ratio
3. **Earlier closed phase onset:** The closed phase begins earlier, lengthening T_cl and shortening the closing phase

**Skewing behavior:**
- Skewing decreases with rising F0; pulses become more symmetrical at high pitches
- Pulse symmetry approaches unity when F1/F0 ratio decreases below ~3
- Skewing asymptotically approaches ~0.6 when F1/F0 > 3
- Skewing is influenced by both Ps and F1/F0 ratio (vocal tract inertance effects)

### 6. Peak Glottal Permittance

**Definition:** Peak glottal permittance = U_peak / Ps (ratio of peak transglottal airflow to subglottal pressure)

**Mode of phonation effects (Fig. 10, pp.25):**
- Flow phonation: highest permittance (most efficient airflow-to-SPL conversion)
- Neutral phonation: intermediate
- Pressed phonation: lowest permittance

**Pitch dependence (Fig. 11, pp.26):**
- Permittance generally decreases with rising pitch for most subjects
- Decrease is substantial in some subjects (CRW, SLB, TMG, SJS)
- Related to vocal fold length differences between subjects

### 7. Mode of Phonation Effects on FLOGG

In pressed vs neutral phonation at constant pitch (p.25):
- (a) U_dot tends to be lower (91% of cases)
- (b) Return phase T_rt tends to be shorter (89% of cases)
- (c) Closed quotient tends to be longer (76% of cases)
- (d) T_pp tends to be shorter (76% of cases)
- Effects (c) and (d) increase U_dot by steepening the trailing edge of the pulse
- Effect (a) counteracts this by lowering pulse amplitude
- Net result: U_dot/Ps ratio is reduced in pressed phonation

### 8. Key Quantitative Rules

| Rule | Value | Source |
|------|-------|--------|
| Ps doubles per octave of F0 | slope 0.88 on log-log | Table 3 |
| SPL increase per Ps doubling (neutral) | 8-9 dB | p.19 |
| SPL increase per Ps doubling (pressed) | <8 dB | p.19 |
| Mean SPL at Ps = 1 kPa | 84 dB (SD 6 dB) | p.21 |
| SPL slope vs log Ps (all subjects) | 37.0 dB/decade | Table 4 |
| Correlation SPL vs log U_dot | r = 0.89 | Table 6 |
| Peak glottal permittance constant k | ~1.5 for male singers | p.22 |

## Relevance to Klatt Synthesis

1. **AV (voicing amplitude) control:** The SPL-Ps relationship (8-9 dB per doubling of excess Ps over threshold) provides a principled way to derive AV from Ps settings in a voice quality model.

2. **Voice source spectral tilt:** The skewing and closed quotient data inform how spectral tilt (TL parameter) should vary with Ps and F0. Greater skewing = steeper spectral slope; as F0 approaches F1, skewing decreases and the spectrum becomes flatter (brighter).

3. **Mode of phonation modeling:** The permittance measure provides a single parameter that distinguishes flow/neutral/pressed phonation — useful for mapping voice quality presets to source parameters. Pressed phonation reduces permittance (less airflow per unit Ps), while flow phonation increases it.

4. **F0-dependent source changes:** The finding that pulse shape becomes more symmetrical as F0 approaches F1 is critical for the LF source model — the Rd parameter (or equivalently OQ and skewing) should be made F0-dependent when F1/F0 < 3.

5. **Loudness variation rules:** For prosodic stress modeling, the paper confirms that Ps is the primary control variable for loudness, with 8-9 dB per doubling being the baseline rule for neutral phonation.
