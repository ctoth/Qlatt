# Airflow and Turbulence Noise for Fricative and Stop Consonants: Static Considerations

**Authors:** Kenneth N. Stevens
**Year:** 1971
**Venue:** Journal of the Acoustical Society of America, Vol. 50, No. 4 (Part 2), pp. 1180-1192
**DOI/URL:** JASA Volume 50

## One-Sentence Summary
Derives the aerodynamic and acoustic equations relating airflow, pressure drop, constriction geometry, and turbulence noise source strength for fricative and stop consonants, providing a quantitative framework for predicting noise source levels in the vocal tract.

## Problem Addressed
The relationship between articulatory configurations (constriction size, location), aerodynamic conditions (airflow, pressure drop), and the resulting turbulence noise was poorly understood. Previous work measured acoustic properties of consonants but lacked precise descriptions of the articulatory configurations and aerodynamic conditions during production. This paper ties together the articulatory, aerodynamic, and acoustic phenomena.

## Key Contributions
- Complete set of equations relating constriction geometry → airflow → pressure drop → turbulence noise level
- Equivalent circuit model for turbulence noise generation in the vocal tract
- Charts mapping constriction size vs. airflow vs. pressure drop for various speech sound classes
- Demonstration that the noise source is proportional to pressure drop ΔP, with radiated sound pressure proportional to ΔP^β where β ≈ 1.0-1.5
- Separate analysis for supraglottal constrictions, glottal constrictions, and combined configurations
- Identification of distinct airflow regions for vowels, fricatives, and aspirated sounds

## Methodology
Theoretical derivation of aerodynamic equations for air flowing through constricted tubes, validated against experimental data from pipe-immersed spoiler experiments (Gordon, Heller & Widnall). Applied to vocal tract configurations using measured articulatory and aerodynamic data from speech.

## Key Equations

### Eq. 1: Kinetic pressure loss
$$
\Delta P_L = k_L (\rho U^2 / 2A^2)
$$
Where:
- $\Delta P_L$ = pressure drop due to kinetic losses (cm H₂O)
- $k_L$ = loss constant (0.5-1.7, typically ~0.9 for vocal tract)
- $\rho$ = density of air (~0.00114 g/cm³)
- $U$ = volume velocity (cm³/sec)
- $A$ = cross-sectional area of constriction (cm²)

### Eq. 2: Laminar resistance (rectangular)
$$
R = 12\mu l / bw^3
$$
Where:
- $\mu$ = viscosity of air
- $l$ = length of constriction
- $b$ = width of constriction
- $w$ = height of constriction ($w \ll b$)

### Eq. 3: Laminar resistance (circular)
$$
R = 128\mu l / \pi d^4
$$
Where:
- $d$ = diameter of circular cross section

### Eq. 4: Total pressure drop at constriction
$$
\Delta P = RU + k_L (\rho U^2 / 2A^2)
$$
Where: R = laminar resistance, first term usually negligible for speech-relevant flows.

### Eq. 5: Simplified pressure drop (practical)
$$
\Delta P = 0.9(\rho U^2 / 2A^2)
$$
i.e., Eq. 4 with $k_L = 0.9$ and laminar term neglected.

### Eq. 6: Radiated sound power from turbulence
$$
W = k \Delta P^3 d^2 / (\rho^2 c^3)
$$
Where:
- $d$ = pipe diameter (or characteristic constriction dimension)
- $c$ = velocity of sound
- $k$ = a constant
- Power proportional to $\Delta P^3$ for semiinfinite pipe

### Eq. 7: Transfer function pole factor
$$
T_1(s) = s_1 s_1^* / (s - s_1)(s - s_1^*)
$$
Where:
- $s_1$, $s_1^*$ = conjugate pair of complex pole frequencies
- $s$ = complex frequency variable

### Eq. 8: Radiated sound pressure (key result)
$$
p_r \sim \Delta P^{\beta} A^{1/2}
$$
Where:
- $\beta$ ≈ 1.0 to 1.5 (experimentally measured 1.2-1.4)
- Sound pressure depends primarily on pressure drop, weakly on constriction area

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Kinetic loss constant | $k_L$ | dimensionless | 0.9 | 0.5-1.7 | Depends on constriction shape; 0.9 avg for vocal tract |
| Pressure drop exponent | $\beta$ | dimensionless | ~1.5 | 1.0-1.5 | For radiated sound pressure; experimentally 1.2-1.4 |
| Subglottal pressure | $P_s$ | cm H₂O | 8 | 5-15 | Typical speech production |
| Vowel airflow | $U$ | cm³/sec | 100-200 | 50-300 | Normal voiced vowels |
| Fricative airflow | $U$ | cm³/sec | 200-500 | 100-1000 | Depends on voicing and constriction |
| Aspiration airflow | $U$ | cm³/sec | 500-1500 | 300-2000 | Wide glottal opening |
| Fricative constriction area | $A$ | cm² | 0.05-0.2 | 0.02-0.5 | Supraglottal |
| Vowel constriction area | $A$ | cm² | 0.3-2.0 | 0.1-10 | Supraglottal |
| Glottal area (voicing peak) | $A_g$ | cm² | 0.05-0.2 | 0.02-0.5 | During vibratory cycle |
| Glottal area (aspiration) | $A_g$ | cm² | 0.1-0.5 | 0.05-1.0 | Wide opening for [h] |
| Glottal width (voicing) | | mm | 0.3-1.0 | 0.1-5.0 | Rectangular slit ~1.8 cm long |

## Implementation Details

### Equivalent Circuit Model (Fig. 5, Fig. 6)
The turbulence noise source in the vocal tract is modeled as:
- A pressure source $p_s$ in series with the transmission line
- Upstream impedance $Z_1$ (from source to lungs)
- Downstream impedance through radiation $Z_r$
- Source spectrum is flat over ~1.5-3 octaves centered on $f \approx 0.2 V/D$

Where $V$ is flow velocity and $D$ is characteristic dimension of constriction.

### Source Spectrum Characteristics
1. **Below cutoff**: Sound power proportional to $V^4$ (dipole in pipe)
2. **Center frequency**: $f_c \approx 0.2 U/A^{1/2}$ (where $A \cong (\pi/4)D^2$)
3. **Typical center frequency**: 500-3000 Hz for speech
   - Aspiration: 500 Hz (lower end)
   - Frication: up to 3000 Hz (upper end)
4. **Spectral shape**: Flat over 1.5-3 octaves, then rolls off

### Noise Source Level Independence
- For a given pressure drop $\Delta P$, the sound-pressure level is approximately the same regardless of where noise is produced in the vocal tract
- Exception: noise near mouth is ~5 dB weaker (factor of 3 in power)
- Constant $\Delta P$ lines in Fig. 1 correspond to ~20 dB difference in sound level

### Transfer Function Effects
- Spectrum is modified by poles and zeros of vocal tract transfer function $U_o/p_s$
- The lowest pole not cancelled by a nearby zero is usually not bounded
- Pole position depends on distance from constriction to lips
- For [h]: first pole ~500 Hz; for [s]: ~4000 Hz; for [f]: anterior, even higher

### Airflow Regions by Sound Class (Fig. 9)
- **Vowels**: U = 100-200 cm³/sec, $A_{supraglottal}$ > 0.3 cm²
- **Fricatives**: U = 200-500 cm³/sec, $A_{supraglottal}$ = 0.05-0.2 cm²
- **Aspirated sounds**: U = 500-1500 cm³/sec, $A_{glottal}$ = 0.1-0.5 cm²
- **Stop releases** [p,t,k]: Brief transient airflow, aspiration contour region

### Voiced Fricatives
- Both glottal and supraglottal constrictions affect airflow simultaneously
- Airflow and pressure modulated synchronously with vocal-cord vibration
- Glottal area swings between ~0 and 0.3 cm² during vibratory cycle
- Supraglottal constriction area approximately constant
- Noise is modulated at fundamental frequency → rougher quality

### Aspiration Noise at Glottis
- Peak volume velocity through glottis: 250-750 cm³/sec
- Average volume flow considerably less (factor of 3+)
- For breathy voicing or whispered vowels: airflow 500-1500 cm³/sec
- Glottal area for aspiration: 0.1-0.5 cm², width 0.6-3.0 mm
- Noise at glottis during aspiration comparable to supraglottal fricative noise
- Radiated sound pressure generally lower for glottal source (transfer function from $p_s$ to $U_o$ is smaller)

### Key Finding: Noise ∝ Pressure Drop
- The sound-pressure level of the equivalent noise source is proportional to $\Delta P$
- For a given pressure drop, level is approximately independent of place where noise is produced
- Level is only weakly dependent on constriction area
- Lines of constant $\Delta P$ in Fig. 1 ≡ lines of constant sound-pressure of turbulence noise source
- Lines differing by factor of 10 in $\Delta P$ → 20 dB difference in source level

### Relative Fricative Levels
- [f] in English: 15-30 dB below [s] or [ʃ]
- This is because [f] is produced near the lips where transfer function gain is lower
- Sibilants [s, ʃ] have major spectral pole near their source → amplified

## Figures of Interest
- **Fig. 1 (p. 1181):** Airflow chart — volume velocity vs. constriction area with constant pressure drop and constant alveolar pressure contours. Fundamental reference chart.
- **Fig. 2 (p. 1182):** Airflow vs. supraglottal constriction size for various glottal openings
- **Fig. 3 (p. 1183):** Obstruction/spoiler in pipe experimental setup for turbulence measurements
- **Fig. 4 (p. 1183):** Spectrum of fluctuating force on spoiler (a) and radiated sound (b) — Strouhal number scaling
- **Fig. 5 (p. 1184):** Equivalent circuit for turbulence noise in pipe
- **Fig. 6 (p. 1185):** Equivalent circuit for vocal tract turbulence — (a) physical configuration, (b) circuit model with upstream impedance Z₂
- **Fig. 7 (p. 1186):** Volume velocity vs. constriction area with contours of constant radiated sound pressure from turbulence noise
- **Fig. 8 (p. 1187):** Experimental validation — Meyer-Eppler data fit to theoretical ΔP^(3/2)A^(1/2) curve
- **Fig. 9 (p. 1188):** Key summary diagram — regions of airflow conditions for vowels, fricatives, and aspirated sounds
- **Fig. 10 (p. 1189):** Glottal airflow ranges for voicing vs. aspiration
- **Fig. 11 (p. 1189):** Supraglottal constriction noise level as function of glottal opening
- **Fig. 12 (p. 1190):** Airflow path estimates for glottal + supraglottal constrictions during voiced fricative cycle

## Results Summary
- Turbulence noise source is well-modeled as a series pressure source whose magnitude is proportional to $\Delta P$
- Radiated sound pressure $p_r \propto \Delta P^\beta A^{1/2}$ where $\beta$ ≈ 1.0-1.5
- For fricative consonants: constriction areas 0.05-0.2 cm², airflows 200-500 cm³/sec, pressure drops 2-8 cm H₂O
- Noise source level is approximately independent of constriction size for constant $\Delta P$
- When glottal opening is small (~1 mm), noise at supraglottal constriction is within 3 dB of fully-open glottis case
- For voiced fricatives, noise is substantially modulated (≈15 dB) at the supraglottal constriction during each glottal cycle

## Limitations
- Static analysis only — does not treat rapid articulatory movements during stop releases
- No experimental data from vocal tract models validating the source spectrum shape
- Source spectrum modified by resonators surrounding constriction — cannot always derive complete spectrum
- Voiced fricative analysis is approximate — compliance and wall effects simplified
- Limited to adult male speakers for parameter ranges
- Does not address turbulence at teeth (relevant for [s])

## Relevance to Project
- **Frication noise modeling**: Provides the theoretical basis for AF (frication amplitude) parameter in Klatt — noise level proportional to pressure drop across constriction
- **Aspiration noise**: Explains why AH (aspiration amplitude) is controlled similarly — turbulence at glottis follows same physics
- **Source location effects**: Justifies why [f,θ] are weaker than [s,ʃ] by 15-30 dB in Klatt parallel branch amplitudes
- **Voiced fricative modulation**: Explains pitch-synchronous noise modulation that should be implemented for voiced fricatives
- **Airflow regions**: Fig. 9 provides the aerodynamic basis for distinguishing vowel, fricative, and aspiration parameter ranges

## Open Questions
- [ ] How should pitch-synchronous modulation of frication noise be implemented for voiced fricatives?
- [ ] What are the exact transfer function gains for different places of articulation in the Klatt framework?
- [ ] The companion paper (Stevens 1971, ref 1) covers dynamic/transient aspects — is it available?

## Related Work Worth Reading
- Stevens (1971 companion paper) — "Aerodynamic and Acoustic Events at the Release of Stop and Fricative Consonants" (covers dynamic aspects)
- Fant (1960) — Acoustic Theory of Speech Production (transfer functions)
- Hixon (1966) — Turbulent Noise Sources for Speech
- Meyer-Eppler (1953) — Turbulence noise generation experiments
- Heinz & Stevens — Fricative consonant properties

---

## Collection Cross-References

### Already in Collection
- **Fant_1960_AcousticTheorySpeechProduction**

### New Leads (Not Yet in Collection)
- **Heinz & Stevens (1961, ref 15)** — "On the Properties of Voiceless Fricative Consonants" — direct acoustic measurements of fricative spectra that complement this aerodynamic analysis. Relevant for setting parallel branch amplitudes.
- **Klatt, Stevens & Mead (1966, ref 10)** — "Studies of Articulatory Activity and Airflow During Speech" — experimental airflow measurements during speech that ground this paper's theoretical predictions.
- **Rothenberg (1968, ref 23)** — *The Breath-Stream Dynamics of Simple-Released-Plosive Production* — comprehensive aerodynamic analysis of stop consonant production relevant to PLSTEP burst modeling.
