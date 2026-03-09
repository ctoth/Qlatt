# Physiologic and acoustic differences between male and female voices

**Authors:** Ingo R. Titze
**Year:** 1989
**Venue:** Journal of the Acoustical Society of America, 85(4), 1699-1707
**DOI:** 10.1121/1.397959

## One-Sentence Summary
Derives two physiologic scale factors relating male and female larynges (alpha = 1.2 for overall size, beta = 1.6 for membranous vocal fold length) and uses them to predict sex differences in F0, airflow, sound power, glottal efficiency, and glottographic waveform shape.

## Problem Addressed
Most speech production theory was developed from male voice data. This paper systematically quantifies the physiologic basis for male-female voice differences using anatomical scale factors, tissue mechanics, and a glottal simulation model, rather than treating sex differences as arbitrary parameter offsets.

## Key Contributions
- Defines two scale factors: alpha (~1.2, general larynx size) and beta (~1.6, membranous vocal fold length ratio male/female)
- Derives the string model equation F0 = 1700/L_m relating fundamental frequency to membranous length
- Shows vocal fold thickness scales with alpha (not beta), meaning thickness is 20-30% greater in males vs 60% longer
- Derives stress-strain curves for male and female vocal fold tissue, showing females are slightly stiffer
- Introduces a prephonatory glottis model with shape quotient Q_s, bulging quotient Q_b, and abduction quotient Q_a to parameterize glottal shape
- Derives equations for mean airflow, aerodynamic power, radiated acoustic power, and glottal efficiency as functions of the scale factors
- Shows male vocal folds have medial surface bulging (Q_b > 0) producing different contact area waveforms and glottographic signatures
- Predicts female voice is ~25% more efficient than male at higher F0

## Methodology
Combines cadaveric measurement data (Kahane 1978, Hirano 1983, Hollien 1960) with a vibrating string model and a computer simulation of vocal fold contact area. Uses Holmberg et al. (1988) airflow data to evaluate scale factors for aerodynamic quantities.

## Key Equations

### Equation 1: String model for F0
$$
F_0 = \frac{1700}{L_m}
$$
Where: $L_m$ is membranous vocal fold length in mm. Predicts F0 = 170 Hz for female (L_m = 10 mm) and F0 = 106 Hz for male (L_m = 16 mm).

### Equation 2: Fundamental frequency of a string
$$
F_0 = \frac{1}{2L}\left(\frac{\sigma}{\rho}\right)^{1/2} = \frac{1}{2L_0(1+\epsilon)}\left(\frac{\sigma}{\rho}\right)^{1/2}
$$
Where: $L_0$ is reference (abducted) length, $\epsilon = L/L_0 - 1$ is normalized elongation (strain), $\sigma$ is tissue stress (force per unit area), $\rho$ is tissue density.

### Equation 3: Longitudinal stress from string model
$$
\sigma(\epsilon) = 4L_0^2(1+\epsilon)^2 F_0^2 \rho
$$
Where: tissue density $\rho$ = 1.03 g/cm^3 (Perlman and Durham, 1987). Derived by solving Eq. 2 for stress.

### Equation 4: Female stress-strain approximation
$$
\sigma(\epsilon) = e^{9.21(\epsilon + 0.623)} \text{ kPa}
$$
Exponential fit to human female stress-strain data over 0 to 80 kPa range, within +/- 1 kPa.

### Equation 5: Glottal half-width (prephonatory + dynamic)
$$
h(y,z,t) = \left[Q_a + \left(Q_s - \frac{4Q_b z}{T}\right)\left(1 - \frac{z}{T}\right)\right]\left(1 - \frac{y}{L}\right) + \sin\frac{\pi y}{L}\sin\left(\omega t - \frac{2\pi Q_p z}{T}\right)
$$
Where: $Q_a$ = abduction quotient, $Q_s$ = shape quotient, $Q_b$ = bulging quotient, $Q_p$ = phase-delay quotient, $T$ = vocal fold thickness, $L$ = vocal fold length, $y$ = anterior-posterior position, $z$ = inferior-superior position. First term = static prephonatory shape; second term = time-varying vibrational displacement.

### Equations 6-9: Aerodynamic and acoustic quantities
$$
u_0 = (2p_s/\rho)^{1/2}(2LA)(a_0/2)
$$
Mean airflow, where $p_s$ = subglottic pressure, $A$ = vibrational amplitude, $a_0$ = zeroth Fourier coefficient of glottal area.

$$
p_a = p_s(2p_s/\rho)^{1/2}(2LA)(a_0/2)
$$
Aerodynamic power.

$$
p_r = \frac{\pi F_0^2}{2c} \cdot \frac{2P_s}{\rho} \cdot (2LA)^2 \sum_{n=1}^{\infty} n^2 a_n^2
$$
Radiated acoustic power, where $a_n$ = Fourier coefficients of glottal area waveform, $c$ = speed of sound.

$$
e = \frac{\sqrt{2}\pi k}{c} (F_0^2)(pP_s)^{-1/2}(LA) \cdot \frac{2}{a_0} \sum_{n=1}^{\infty} n^2 a_n^2
$$
Glottal efficiency, where $k \approx 0.5$ is an empirical correction for nonisotropy in radiation and nearfield effects.

## Parameters

| Name | Symbol | Units | Male Value | Female Value | Scale Factor | Notes |
|------|--------|-------|------------|--------------|--------------|-------|
| General size scale factor | alpha | dimensionless | 1.0 (ref) | 0.83 (1/1.2) | 1.2 | Anterior-posterior thyroid dimension |
| Membranous length scale factor | beta | dimensionless | 1.0 (ref) | 0.625 (1/1.6) | 1.6 | Vocal fold membranous length |
| Membranous vocal fold length | L_m | mm | 16 | 10 | beta | Cadaveric, fully developed |
| Vocal fold thickness | T | mm | ~4-5 | ~3.5-4 | alpha | Scales with alpha, not beta |
| Tissue density | rho | g/cm^3 | 1.03 | 1.03 | 1.0 | Perlman & Durham 1987 |
| Vocal fold growth rate (male) | - | mm/year | 0.7 | - | - | Hirano 1983 |
| Vocal fold growth rate (female) | - | mm/year | 0.4 | - | - | Hirano 1983 |
| Mean airflow scale | a_0 | dimensionless | 0.52 | 0.62 | ~0.75 | Holmberg et al. 1988 |
| Avg-to-peak flow ratio (male) | - | dimensionless | 0.52 | - | - | Holmberg et al. 1988 |
| Avg-to-peak flow ratio (female) | - | dimensionless | 0.62 | - | - | Holmberg et al. 1988 |
| Radiated source power scale | - | dimensionless | 1.0 | ~0.6-0.7 | 1.4-1.6 | Estimated overall |
| Glottal efficiency scale | - | dimensionless | 1.0 | ~1.25 | beta^-1 * alpha | Female ~25% more efficient |
| Shape quotient (female sim) | Q_s | dimensionless | 5.0 | 5.0 | - | Same for both |
| Bulging quotient (female sim) | Q_b | dimensionless | 0.0 | 2.5 (male) | - | Male has medial bulging |
| Abduction quotient | Q_a | dimensionless | 0.3 | 0.3 | - | Same for both |
| Phase-delay quotient | Q_p | dimensionless | 0.2 | 0.2 | - | Same for both |
| Register transition (female) | - | Hz | 300-360 | - | - | Primary register transition |
| Register transition (male) | - | Hz | 300-360 | - | - | Secondary; primary much lower |
| Nonisotropy correction | k | dimensionless | ~0.5 | ~0.5 | - | Empirical radiation correction |

## Implementation Details

### Scale Factor Application
- F0 scales primarily with beta (membranous length): F0_female/F0_male ~ beta = 1.6
- Thickness scales with alpha (general size): T_male/T_female ~ 1.2
- Mean airflow scales as beta * alpha (combined length and amplitude): u0 scales ~1.9
- Aerodynamic power scales as beta * alpha * (subglottic pressure factor) ~ 1.7
- Radiated acoustic power scales primarily with alpha^2 (due to F0^2 and (LA)^2 terms canceling each other)
- Glottal efficiency scales as beta^-1 * alpha (excluding subglottic pressure and spectral effects)

### Glottal Shape Differences
- Female: linearly convergent glottis (Q_b = 0), more triangular prephonatory shape
- Male: medial surface bulging (Q_b = 2.5), more rectangular closure pattern
- This produces different contact area waveforms: female A_C is more triangular, male A_C has a definite knee in its decreasing portion
- Female U_G waveform has longer open time, smaller baseline flow variation
- Male U_G has no inflection point in decreasing portion due to medial bulging adducting the folds

### Vocal Fold Length During Phonation
- Phonation length is always less than abducted length (both sexes)
- Length changes systematically from ~50% to 70-80% of abducted length with F0
- In chest register: length shortens to ~50% of abducted length
- In falsetto: length approaches abducted length
- No systematic length change with F0 in falsetto for untrained speakers

### Stress-Strain Properties
- Both male and female tissue show nonlinear stress-strain curves
- Female tissue is slightly stiffer (solid lines above dashed lines for males at higher strains)
- Male vocal folds have greater percentage of collagenous fibers (Hirano 1983)
- Collagen produces very nonlinear stress-strain; female tissue more linear
- Canine vocal fold cover tissue has similar shape but different reference lengths

## Figures of Interest
- **Fig. 1 (page 1):** Male-female larynx size comparison showing 20% difference in sagittal and 60% in horizontal (membranous) dimensions
- **Fig. 2 (page 2):** Vocal fold length growth curves; membranous length grows 0.7 mm/year (male) vs 0.4 mm/year (female)
- **Fig. 3 (page 2):** F0 vs membranous length hyperbola (F0 = 1700/L_m) for males and females across ages
- **Fig. 4 (page 3):** Membranous length vs F0 during phonation, showing chest vs falsetto register behavior
- **Fig. 5 (page 4):** Vocal fold thickness and length vs F0 range, showing inverse relationship and alpha-scaling for thickness
- **Fig. 6 (page 5):** Stress-strain curves for human male/female and canine vocal fold tissue
- **Fig. 7 (page 5):** Prephonatory glottis model schematic with Q_a, Q_s, Q_b parameters
- **Fig. 8 (page 6):** Dynamic glottis showing horizontal string mode and vertical ribbon mode
- **Fig. 9 (page 6):** Full simulation output: vocal tract, waveforms (P_o, U_o, P_I, P_G, P_S, U_G, A_G, A_C), and vocal fold cross-section
- **Fig. 10 (page 7):** Male vs female medial surface contour and contact area waveform differences
- **Fig. 11 (page 8):** Glottis scaling diagram showing length L, amplitude A, and width W

## Results Summary
- The beta = 1.6 scale factor (membranous length) accounts almost entirely for differences in mean F0, mean airflow, and aerodynamic power
- Combined with alpha = 1.2 for vibrational amplitude, the male larynx has greater source strength but female radiates more efficiently at higher frequencies
- Male medial surface bulging creates distinct glottographic waveform features (knee in contact area, abrupt posterior closure)
- Female voice predicted ~25% more glottally efficient than male, primarily due to higher F0
- Male larynx is like a woofer (larger cone, more air), female like a tweeter (comparable power at higher frequencies)

## Limitations
- String model is first-order approximation; bending beam model (Bickley & Brown 1987) may be more appropriate for small lengths
- Thickness data based on cross-sectional cadaveric studies, not longitudinal
- Direct amplitude measurements not available; scale factors inferred from flow data
- Stress-strain measurements on excised tissue may not reflect in vivo conditions
- Contact area simulation results not yet confirmed by EGG measurements
- Spectral shaping effects of vocal tract not included in efficiency analysis

## Testable Properties
- F0 * L_m should approximate 1700 Hz*mm for modal phonation across speakers
- Male/female membranous length ratio should be ~1.6 in adult speakers
- Male/female thyroid cartilage size ratio should be ~1.2
- Vocal fold thickness should scale with alpha (~1.2), not beta (~1.6)
- Mean airflow ratio male/female should be ~1.5-1.9
- Female stress-strain curve should be above (stiffer than) male at equal strain
- Contact area waveform for male voice should show a knee/inflection absent in female
- Glottal efficiency should be higher for female voices at matched effort level

## Relevance to Project
This paper provides the physiological foundation for parameterizing male-female voice differences in the Qlatt synthesizer. The two scale factors (alpha for size, beta for membranous length) directly map to the speaker profile system's approach of having orthogonal dimensions for voice variation. The glottal shape quotients (Q_a, Q_s, Q_b, Q_p) provide a compact parameterization for prephonatory glottal configuration that could drive the LF glottal source model. The aerodynamic equations give principled scaling laws for how airflow, power, and efficiency should change with speaker size, rather than requiring arbitrary per-parameter adjustments. The stress-strain relationships connect F0 range to tissue mechanics, enabling realistic pitch range modeling per speaker type.

## Open Questions
- [ ] How does Q_b map to the LF model's Rd or other source parameters?
- [ ] Can the stress-strain relationship (Eq. 4) be used to derive realistic F0 range limits per speaker?
- [ ] How do the scale factors interact with the body-cover model used in Zhang 2021?
- [ ] What values of Q_s, Q_b, Q_a, Q_p produce realistic EGG-like waveforms for intermediate voices (e.g., children, tenors)?

## Related Work Worth Reading
- Bickley, C. and Brown, K. (1987) - Bending-beam model of vocal fold vibration
- Holmberg, E., Hillman, R., and Perkell, J. (1988) - Glottal airflow measurements male/female
- Hirano, M. (1983) - Structure of the vocal folds (in Vocal Fold Physiology)
- Titze, I. (1988a) - Four-parameter glottis and vocal fold contact area model
- Titze, I. (1988c) - Regulation of vocal power and efficiency by subglottal pressure
- Perlman, A. and Durham, P. (1987) - In vitro studies of vocal fold mucosa isometric conditions

## Collection Cross-References

### Already in Collection
- [[Holmberg_1988_GlottalAirflowPressure]] — cited as the primary empirical source for male/female airflow and pressure data; Titze uses their average-flow to peak-flow ratios (0.52 male, 0.62 female) and dc flow scale factor of 1.5 to derive the aerodynamic scale factors in Eqs. 6-9
- [[Zhang_2021_LaryngealSizeSexDifferences]] — cites this paper (ref 33); Zhang's 3D body-cover simulation extends Titze's two-scale-factor approach by systematically isolating length, thickness, and depth effects on voice production using 216,000 simulations

### Cited By (in Collection)
- [[Zhang_2021_LaryngealSizeSexDifferences]] — cites this for the theoretical framework of male/female voice differences based on scale factors
- [[Simpson_2009_PhoneticGenderDifferences]] — cites this for the computational model predicting female breathiness from vocal fold geometry (posterior glottal chink)
- [[Hanson_1995_GlottalCharacteristicsFemale]] — cites this (as Titze 1989a) for establishing physiologic and acoustic differences between male and female voices relevant to sex-specific synthesis

### New Leads (Not Yet in Collection)
- Bickley, C. and Brown, K. (1987) — "Bending-beam model of vocal-fold vibration" — proposed improvement over string model for small vocal fold lengths (children, females)
- Hirano, M. (1983) — "The structure of the vocal folds" — cadaveric measurement data underlying the scale factors
- Titze, I. (1988a) — "A four-parameter model of the glottis and vocal fold contact area" — the Q_a/Q_s/Q_b/Q_p parameterization used in the simulation

### Conceptual Links (not citation-based)
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — Hanson's corrected spectral measures (H1*-H2*, H1*-A3*) for female speakers provide the acoustic consequence of Titze's physiological predictions: the linearly convergent female glottis with posterior chink produces the incomplete closure and gradual closing patterns that Hanson measures as elevated H1*-H2* and spectral tilt
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — Iseli's age/sex-dependent H1*-H2* and H1*-A3* measurements across 335 speakers provide empirical validation targets for the voice source differences Titze predicts from anatomy; the 4 dB male H1*-H2* drop from childhood to adulthood corresponds to the development of medial surface bulging (Q_b increasing)
- [[Fant_1985_LFModelGlottalFlow]] — the LF model provides the glottal flow parameterization that could express Titze's glottal shape differences acoustically; mapping Q_b to Rd/Ra/Rk would connect the physiological model to the synthesis source
- [[Herbst_2015_GlottalAdductionSubglottalPressure]] — addresses the interaction between adduction and subglottal pressure that Titze's Q_a parameter controls; provides empirical grounding for the prephonatory configuration model
- [[Titze_1992_VocalIntensity]] — the 1992 paper measures the acoustic intensity consequences of the male-female physiological differences predicted here; the different empirical constants in Table I (tenors vs male/female nonsingers) reflect the scale factor differences in airflow and glottal efficiency that the 1989 paper derives from anatomy
- [[Titze_2014_BistableVocalFoldAdduction]] — Strong. The 2014 paper explains how the stiffness differences between male and female vocal folds (documented here as scale factors) create different register behaviors via the bistability mechanism: males' stronger TA activation drives convergent (modal) configurations, while females' relatively higher CT contribution tends toward more rectangular or divergent shapes.
- [[Stathopoulos_2011_VoiceAcrossLifespan]] — Moderate. Stathopoulos provides the empirical F0/SPL/SNR trajectories across ages 4-93 that map onto Titze's anatomical explanations of sex-specific voice differences; the F0 convergence before puberty and divergence after corresponds to the vocal fold length/mass scale factor changes described here.
