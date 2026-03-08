# Vocal Intensity in Speakers and Singers

**Authors:** Ingo R. Titze, Johan Sundberg
**Year:** 1992
**Venue:** The Journal of the Acoustical Society of America, 91(5), 2936-2946
**DOI:** 10.1121/1.402929

## One-Sentence Summary

Derives analytical and empirical expressions relating lung pressure, F0, glottal waveform parameters, and vocal tract transfer to radiated sound pressure level (SPL), validated against measurements from professional tenors and nonsingers.

## Problem Addressed

Vocal intensity control mechanisms are not well understood -- most studies focus on spectral/temporal characteristics rather than intensity itself. The paper asks: (1) what is the relation between lung pressure and vocal intensity? (2) what role does F0 play? (3) how does the vocal tract affect power at the glottis? (4) how well does a classical source-filter model predict intensity variations? (5) what do singers do differently than nonsingers?

## Key Contributions

- Derives closed-form expressions for radiated acoustic power from glottal source parameters
- Introduces the concept of *excess pressure over threshold* ($P_L - P_{th}$) as the key driving variable for intensity
- Shows SPL increases at 8-9 dB per doubling of excess pressure over threshold
- Demonstrates that professional tenors produce 10-12 dB greater intensity than nonsingers at the same lung pressures (due to 3-4x greater peak airflow derivatives)
- Provides empirical constants (Table I) for modeling intensity across speaker types
- Introduces *phonation threshold pressure* $P_{th}$ as a key aerodynamic variable

## Methodology

1. Analytical derivation of radiated power from mouth radiation impedance, vocal tract transfer function, and glottal source waveform
2. Empirical measurements of glottal flow waveforms (inverse-filtered) from 5 professional tenors and 25 male + 20 female nonsingers
3. Combined analytical-empirical model validated against SPL measurements at multiple F0 values and loudness levels

## Key Equations

### Radiation resistance and inertance (Flanagan 1972)

$$R_r = 128\rho c / 9\pi^3 r^2$$
(Eq. 1)

$$I_r = 8\rho / 3\pi^2 r$$
(Eq. 2)

Where: $\rho$ = air density (1.14 kg/m^3), $c$ = sound velocity (350 m/s), $r$ = lip radius.

### Instantaneous radiated power

$$\mathscr{P} = (\rho / 2\pi c) \dot{u}^2$$
(Eq. 6)

Where: $\dot{u}$ = time derivative of volume velocity at the lips. This is the fundamental relationship: radiated power depends on the square of the flow derivative. Doubling $\dot{u}$ increases power by 6 dB.

### Vocal tract transfer function (Fant 1960, all-pole model)

$$\frac{U(s)}{U_g(s)} = \left[\prod_{i=1}^{\infty}\left(1 - \frac{s}{s_i}\right)\left(1 - \frac{s}{s_i^*}\right)\right]^{-1}$$
(Eq. 12)

Where: $s_i = -\omega_i/2Q_i + j\omega_i$, with $\omega_i$ = radian formant frequency, $Q_i$ = quality factor.

### Source-filter transfer function

$$H(s) = \frac{P_r(s)}{U_g(s)} = sR_r\left[\left(s + \frac{R_r}{I_r}\right)\prod_{i=1}^{\infty}\left(1 - \frac{s}{s_i}\right)\left(1 - \frac{s}{s_i^*}\right)\right]^{-1}$$
(Eq. 14-15)

### Time-average glottal power (triangular waveform approximation)

$$\bar{\mathscr{P}}_g = \frac{\rho}{6\pi c} \frac{T_n}{T} \left(\frac{T_n}{T_p} + 1\right) \dot{u}_m^2$$
(Eq. 18)

$$= \frac{\rho}{6\pi c} \frac{Q_o}{Q_s} \dot{u}_m^2$$
(Eq. 19)

Where:
- $T_p$ = duration of positive (increasing) flow derivative
- $T_n$ = duration of negative (decreasing) flow derivative
- $T$ = period
- $\dot{u}_m$ = maximum negative flow derivative (MFDR)
- $Q_o = (T_p + T_n)/T$ = open quotient
- $Q_s = T_p/T_n$ = speed quotient (skewing ratio)

### Source spectrum model (one-parameter)

$$U_g(nF_0) = k(nF_0)^{-\alpha}$$
(Eq. 23)

Where: $\alpha$ = spectral slope parameter. A spectral slope of 12 dB/octave yields $\alpha = 2.0$ (typical male phonation).

$$\alpha = \frac{\text{spectral slope in dB/oct}}{20 \log_{10} 2}$$
(Eq. 24)

### Radiated power per harmonic

$$\bar{\mathscr{P}}_n = (k^2 / 2R_r)(nF_0)^{-2\alpha} |H(nF_0)|^2$$
(Eq. 25)

### Total radiated power (vocal power expression)

$$\mathscr{P} = \bar{\mathscr{P}}_g G(F_0)$$
(Eq. 27)

Where:

$$G(F_0) = \sum_{n=1}^{\infty} n^{-2\alpha} |H(nF_0)|^2 \left(2\pi F_0 I_r\right)^2 \sum_{n=1}^{\infty} n^{2-2\alpha}\right)^{-1}$$
(Eq. 28)

$G(F_0)$ is the *power gain* over the glottal source due to the vocal tract.

### SPL from radiated power

$$\text{SPL} = 10\log_{10}(I/I_0)$$
(Eq. 29)

$$= 120 - 10\log_{10}(4\pi R^2) + 10\log_{10}\bar{\mathscr{P}}$$
(Eq. 31)

$$\text{SPL} = 115 + 10\log_{10}\bar{\mathscr{P}}$$
(Eq. 32, for R = 0.5 m)

Key result: *One watt of radiated power is 115 dB SPL at 0.5 m.*

### Empirical relations (Titze 1992)

$$u_{ac} = k_1(1 - \cos\pi Q_o)(P_L - P_{th})/P_{th}$$
(Eq. 33)

$$Q_o = k_2 + (1 - k_2)P_{th}/P_L$$
(Eq. 34)

$$Q_s = 1.0 + k_3(2P_m - P_L - P_{th})(P_L - P_{th})$$
(Eq. 35)

$$\dot{u}_m = k_4 u_{ac} F_0 (Q_s + 1)/Q_o$$
(Eq. 36)

### Phonation threshold pressure

$$P_{th} = 0.14 + 0.06(F_0/\bar{F}_0)^2 \text{ kPa}$$
(Eq. 37)

Where: $\bar{F}_0$ = mean speaking fundamental frequency (120 Hz males, 190 Hz females).

### Spectral slope model

$$\text{Spectral slope} = k_5 + 5[P_{th}/(P_L - P_{th})] \text{ dB/octave}$$
(Eq. 38)

### Approximate glottal power as function of $P_L$ and $F_0$

$$\bar{\mathscr{P}}_g = \frac{\rho}{6\pi c}(k_1 k_4)^2 \left(\frac{P_L - P_{th}}{P_{th}}\right)^2 F_0^2 \frac{(Q_s + 1)^2}{Q_s} \times \frac{(1 - \cos\pi Q_o)^2}{Q_o}$$
(Eq. 39)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Air density | $\rho$ | kg/m^3 | 1.14 | - | Warm, moist air in vocal tract |
| Sound velocity | $c$ | m/s | 350 | - | Vocal tract conditions |
| Lip radius | $r$ | m | 0.01 | - | 1.0 cm used in model |
| Lung pressure | $P_L$ | kPa | - | 0.3-3.0 | Typical range for speech/singing |
| Phonation threshold | $P_{th}$ | kPa | ~0.14 | 0.14-0.5 | Varies with F0 (Eq. 37) |
| Max negative flow deriv. | $\dot{u}_m$ | m^3/s^2 | - | - | MFDR; key intensity parameter |
| Open quotient | $Q_o$ | - | - | 0.4-1.0 | Decreases toward 1.0 at threshold |
| Speed quotient | $Q_s$ | - | - | 1.0-3.0 | Approaches 1.0 at threshold |
| Spectral slope | $\alpha$ | - | 2.0 | 1.5-3.0 | 12 dB/oct typical male speech |
| Formant frequencies | $F_1,F_2,F_3$ | Hz | 700,1080,2600 | - | /a/ vowel used in model |
| Formant Q | $Q_i$ | - | 10 | - | All resonances set to Q=10 |
| Mic distance | $R$ | m | 0.5 | - | Standard measurement distance |

### Empirical constants (Table I)

| Subject group | $k_1$ | $k_2$ | $k_3$ | $k_4$ | $P_m$ (kPa) |
|---|---|---|---|---|---|
| Tenors | 0.003 | 0.40 | 0.50 | 1.5 | 2.0 |
| Male nonsingers | 0.000 09 | 0.45 | 0.55 | 1.9 | 2.0 |
| Female nonsingers | 0.000 045 | 0.62 | 3.00 | 1.9 | 0.65 |

Note: $k_1$ and $k_4$ are dimensioned (involve flow in m^3/s and pressure in kPa). $k_2$ and $k_4$ are dimensionless.

## Implementation Details

### Computing SPL from source parameters

1. Compute $P_{th}$ from $F_0$ using Eq. (37)
2. Compute $u_{ac}$, $Q_o$, $Q_s$, $\dot{u}_m$ from $P_L$ and $P_{th}$ using Eqs. (33)-(36) with Table I constants
3. Compute spectral slope from Eq. (38), convert to $\alpha$ via Eq. (24)
4. Compute glottal power $\bar{\mathscr{P}}_g$ from Eq. (19) or (39)
5. Compute vocal tract gain $G(F_0)$ from Eq. (28) using formant frequencies and Q values
6. Total power: $\mathscr{P} = \bar{\mathscr{P}}_g \cdot G(F_0)$ (Eq. 27)
7. SPL = $115 + 10\log_{10}\mathscr{P}$ (Eq. 32, at 0.5 m)

### Key simplifications used
- Radiation impedance: parallel R-L circuit (valid below ~3 kHz)
- Vocal tract: all-pole model (no nasalization)
- Glottal waveform: triangular approximation of flow derivative
- Source spectrum: single-parameter exponential decay model
- Fundamental frequencies kept below half the first formant (impedance mismatch assumption)

### Edge cases
- At $P_L = P_{th}$: flow goes to zero, $Q_o \to 1.0$, $Q_s \to 1.0$ (symmetric, barely open)
- At very high $P_L$: model predicts continued SPL rise but spectral slope saturates
- Formant tuning at high F0 (singers): can add 3-5 dB via formant ripple (Fig. 11)

## Figures of Interest

- **Fig. 1 (page 2):** Parallel inertance-resistance circuit for mouth radiation load
- **Fig. 2 (page 3):** Glottal flow pulse and triangular flow derivative approximation
- **Fig. 3 (page 6):** SPL vs F0 for five tenors at four loudness levels (60 data points)
- **Fig. 4 (page 6):** Lung pressure vs F0 for tenors and male nonsingers, with $P_{th}$ multiples overlaid
- **Fig. 5 (page 7):** Spectral slope vs lung pressure for tenors at three F0 values
- **Fig. 6 (page 8):** SPL vs $P_L$ on linear scale -- shows nonlinear relation
- **Fig. 7 (page 8):** SPL vs $P_L$ on log-log scale
- **Fig. 8 (page 9):** SPL vs excess pressure over threshold ($P_L - P_{th}$) -- straightens curves
- **Fig. 9 (page 9):** SPL vs fractional excess pressure ($P_L - P_{th})/P_{th}$ -- collapses F0 dependence
- **Fig. 10 (page 9):** Computed SPL vs fractional excess pressure at three F0 values, with glottal power (dot-dashed) comparison
- **Fig. 11 (page 10):** SPL vs F0 on log scale, showing vocal tract gain ripples at formant frequencies

## Results Summary

1. **SPL-pressure relation:** 8-9 dB increase per doubling of excess pressure over threshold. First 6 dB from glottal flow amplitude increase, remaining 2-3 dB from spectral slope change (waveform skewing).
2. **F0 effect:** 8-9 dB per octave of F0 rise, assuming $P_L$ proportional to $P_{th}$.
3. **Vocal tract gain:** ~10 dB on average. Adds 2-3 dB/octave to the SPL-$P_L$ slope at higher pressures due to changing spectral slope interaction with formants.
4. **Singer vs nonsinger:** Tenors produce 10-12 dB higher SPL at same lung pressures. $u_{ac}$ (alternating flow) is 3-4x greater in tenors (ratio of $k_1$ values: 0.003 vs 0.00009 = 33x, though $k_1$ units differ). Singers achieve 3-4x greater time-varying flows for the same driving pressures, likely through lower effective glottal impedance.
5. **Practical rule:** One watt radiated = 115 dB SPL at 0.5 m. Most speakers produce 90-100 dB; singers can exceed this.
6. **Formant tuning:** At high F0 (singers), tuning a formant to a harmonic can add 3-5 dB peaks (Fig. 11 ripples), but this is a refinement, not the primary intensity mechanism.

## Limitations

- Fundamental frequencies must stay below about half F1 for the impedance mismatch assumption to hold
- Triangular flow derivative is a rough approximation -- underestimates sinusoidal source power by up to 50% (1-2 dB)
- Single-parameter spectral model ignores spectral zeros and fine structure
- All formant Q values set uniformly to 10 (simplification)
- Female singers not included in the empirical data
- Vocal tract parameters ($F_i$, $Q_i$, $r$) held constant in model -- vowel and articulatory variation not explored

## Testable Properties

- SPL must increase monotonically with $P_L$ when $P_L > P_{th}$ (all other params constant)
- SPL must increase approximately 8-9 dB per doubling of $(P_L - P_{th})$
- SPL must increase approximately 8-9 dB per octave of $F_0$ (if $P_L/P_{th}$ ratio held constant)
- $P_{th}$ must increase with $F_0$ (quadratic relationship, Eq. 37)
- At $P_L = P_{th}$: $Q_o \to 1.0$, $Q_s \to 1.0$, flow amplitude $\to 0$
- Glottal power is proportional to $\dot{u}_m^2$ (6 dB per doubling of MFDR)
- Vocal tract gain $G(F_0)$ shows peaks when harmonics align with formants
- For the same lung pressure, $\dot{u}_m$ for tenors should be 3-4x that of nonsingers

## Relevance to Project

Directly relevant to Qlatt's intensity/loudness control system. The paper provides:
1. A physics-based model for computing SPL from Klatt parameters (lung pressure, F0, formant frequencies, source waveform shape)
2. The concept of phonation threshold pressure, which sets the floor for voicing onset
3. Empirical constants for different speaker types (tenors vs nonsingers, male vs female) that could drive speaker personality profiles
4. Quantitative relationships between spectral slope and lung pressure that connect to the existing spectral tilt parameters in Klatt synthesis
5. The power gain function $G(F_0)$ that quantifies how the cascade formant chain amplifies source power -- directly maps to Qlatt's cascade branch

## Open Questions

- [ ] How do the empirical constants in Table I map to Klatt synthesizer parameters (AV, TL, etc.)?
- [ ] Can $P_{th}$ be used to set voicing onset/offset thresholds in the rule system?
- [ ] How does the spectral slope model (Eq. 38) relate to Klatt's TL (tilt) parameter?
- [ ] What is the relationship between $\dot{u}_m$ (MFDR) and the LF model parameters (Ee, Ta) used in Qlatt?
- [ ] How should formant tuning (singer's formant region) be handled for high-F0 synthesis?

## Related Work Worth Reading

- Titze, I. R. (1988). "Regulation of vocal power and efficiency by subglottal pressure and glottal width" -- predecessor with subglottal pressure model
- Titze, I. R. (1992). "Phonation threshold pressure: A missing link in glottal aerodynamics" -- companion paper defining $P_{th}$ (JASA 91, 2926-2935 -- same volume)
- Fant, G. (1960). *The Acoustic Theory of Speech Production* -- foundation for vocal tract transfer function
- Fant, G., Liljencrants, J., and Lin, Q. (1985). "A four parameter model of glottal flow" -- LF model parameters
- Holmberg, E. B., Hillman, R. E., and Perkell, J. S. (1988). "Glottal airflow and transglottal air pressure measurements for male and female speakers in soft, normal, and loud voice" -- primary empirical data source
- Sundberg, J., Scherer, R., and Titze, I. (in press). "Loudness regulation in male singers" -- companion singing data
- Ananthapadmanabha, T. (1984). "Acoustic analysis of voice source dynamics" -- source spectrum model

## Collection Cross-References

### Already in Collection
- [[Titze_1989_MaleFemaleVoices]] -- cited as Titze 1988 (same author); this 1989 paper provides the physiological scale factors (alpha, beta) for male-female differences that inform the different empirical constants in Table I
- [[Holmberg_1988_GlottalAirflowPressure]] -- primary empirical data source for airflow and pressure measurements across loudness levels; the Table I constants are derived from this dataset
- [[Lucero_2005_VocalFoldBifurcations]] -- analyzes bifurcation behavior of the Titze mucosal wave model; provides the mathematical framework for the phonation onset/offset behavior that $P_{th}$ approximates empirically

### Cited By (in Collection)
- [[Sundberg_2005_GlottalSourceLoudness]] -- cites this as ref [#17] for the vocal intensity model and PSEN (excess pressure over threshold) normalization
- [[Hanson_2002_HLsynSourceParameters]] -- cites the companion phonation threshold paper (same volume) for the $P_{th}$ equation used in HLsyn
- [[Hanson_2001_ModelsPhonation]] -- references Titze 1992 in context of phonation models
- [[Zhang_2016_VocalFoldPhysiologyVoiceProduction]] -- cites in context of vocal fold physiology and voice production modeling
- [[Henrich_2005_GlottalOpenQuotientSinging]] -- cites in context of glottal parameters in singing
- [[Drugman_2020_GlottalSourceEstimation]] -- cites in context of glottal source estimation methods

### New Leads (Not Yet in Collection)
- Titze, I. R. (1992) "Phonation threshold pressure: A missing link in glottal aerodynamics" JASA 91:2926-2935 -- companion paper in same volume; defines $P_{th}$ derivation from first principles
- Sundberg, Scherer, and Titze (in press ~1992) "Loudness regulation in male singers" -- companion singing data used in this study
- Ananthapadmanabha (1984) "Acoustic analysis of voice source dynamics" -- single-parameter source spectrum model (Eq. 23) basis

### Conceptual Links (not citation-based)
**Intensity and effort modeling:**
- [[Sundberg_2005_GlottalSourceLoudness]] -- directly extends this work: uses the same PSEN normalization (Eq. 33's excess pressure concept) to study loudness-dependent source changes in untrained voices; provides empirical data on how $Q_o$, spectral slope, and MFDR vary with effort level, validating and refining the empirical relations in our Eqs. 33-38
- [[Lienard_1999_VocalEffortVowelSpectral]] -- studies how vocal effort changes spectral characteristics of vowels; provides complementary perceptual/acoustic data on the intensity-spectral slope relationship modeled analytically here (Eq. 38)
- [[Herbst_2015_GlottalAdductionSubglottalPressure]] -- empirically measures the interaction between glottal adduction and subglottal pressure that this paper models through the $u_{ac}$ and $Q_o$ equations; provides direct experimental grounding for the Table I constants
- [[Isshiki_1964_VoiceIntensityRegulation]] -- early foundational study on voice intensity regulation mechanisms; Titze & Sundberg cite this lineage (Ladefoged & McKinney 1963, Isshiki 1964) as establishing lung pressure as the primary intensity control variable

**Source-filter interaction and spectral modeling:**
- [[Henrich_2001_SpectralOqAsymmetry]] -- derives analytical spectral formulas for LF and other glottal models that provide a more rigorous version of the one-parameter source spectrum (Eq. 23) used here; shows that $Q_o$ and asymmetry coefficient jointly determine H1-H2, relevant to mapping between this paper's waveform parameters and spectral measures
- [[Fant_1985_LFModelGlottalFlow]] -- the LF four-parameter model provides the standard parameterization for the glottal waveform features ($\dot{u}_m$, $Q_o$, $Q_s$) that this paper relates to lung pressure; mapping LF parameters (Ee, Ra, Rk, Rg) to the empirical relations in Eqs. 33-36 would connect the two frameworks

**Speaker type differences:**
- [[Titze_1989_MaleFemaleVoices]] -- provides the physiological explanation (scale factors alpha, beta) for why male and female empirical constants differ in Table I; the 1989 paper predicts the anatomical basis, the 1992 paper measures the acoustic consequence
- [[Zhang_2021_LaryngealSizeSexDifferences]] -- extends Titze 1989's two-scale-factor approach with 3D simulations; the thickness parameter's effect on MFDR and spectral tilt directly connects to the singer/nonsinger intensity differences observed here
