# Flanagan 1958 — Some Properties of the Glottal Sound Source

## Implementation-Focused Notes

### Paper Overview
Quantitative analysis of the glottal sound source for use in electrical analog speech synthesis. Derives volume velocity waveforms from high-speed photography of glottal area, computes their Fourier spectra, derives a small-signal equivalent circuit for the glottal source, and analyzes the acoustic impedance and "efficiency" of the glottis as a function of duty cycle.

### Key Equations

#### Glottal Orifice Resistance (Steady Flow)

Van den Berg's empirical formula for glottal resistance to steady flow:

**Eq. 9:**
```
R = (12 * mu * L) / (l * w^3) + 0.875 * (rho * Q) / (2 * P * w^2)
```
where:
- mu = coefficient of viscosity
- L = thickness of glottis (approx 3 mm)
- l = length of glottal slit (approx 18 mm)
- w = width of glottal slit (variable)
- rho = air density
- Q = volume velocity
- P = perimeter of cross-section

Valid for 0.1 <= w <= 2.0 mm, subglottic pressures up to 64 cm H2O, volume velocities up to 2000 cm^3/sec at large widths.

#### Simplified Orifice Resistance

**Eq. 7** (kinetic energy approximation):
```
R = rho * Q / (2 * (delta * A)^2)
```
where delta = delta_c * delta_v is an empirical flow coefficient (approx 0.8 for glottal flows), A = glottal area.

#### Rise Time of Glottal Flow

**Eq. 13:**
```
T = 2 * L_e / U_o
```
where L_e = rho * A * L_effective, effective thickness L_e = (L + 0.8 * sqrt(A)).

For typical adult male:
- L = 3 mm, mean glottal area A_o ~ 6 mm^2
- Subglottic pressure ~ 8 cm H2O
- **T ~ 0.3 msec, giving 1/10T ~ 330 cps** (Eq. 14)
- This means for frequencies < ~300 cps, the glottal flow can be treated as quasi-static (successive steady states)

#### Triangular Wave Glottal Model

**Eq. 20** — Idealized triangular volume velocity waveform:
```
f(t) = { (1/a) * [1 - |t|/a],   0 <= |t| <= a
        { 0,                      a <= |t| <= T/2
```
where T = fundamental period, 2a = open phase duration, mean flow f_bar(t) = 1/T.

**Eq. 21** — Spectral envelope of triangular wave:
```
F(omega) = sin^2(omega*a/2) / (omega*a/2)^2
```
This is a sinc^2 function with zeros at omega = 2*pi*n/a.

#### Glottal Duty Cycle and Source Efficiency

**Eq. 25** — Ratio of AC component RMS to mean value as function of duty cycle phi:
```
f_ac_rms / f_bar = sqrt((4 - 3*phi) / (3*phi))
```
where phi = 2a/T (ratio of open time to total period).

Key insight: as duty cycle decreases (shorter open phase), the AC component increases relative to the mean, producing a "richer" spectrum with stronger harmonics. This is the physical basis for the relationship between vocal intensity and spectral tilt.

#### Small-Signal Equivalent Circuit (Figure 9)

The glottal source can be modeled as a current source with:
- **Current source**: generates q_s(t) = (dQ/dA)|_{P_o,A_o} * a(t), proportional to AC component of area
- **Shunt conductance**: dQ/dP|_{P_o,A_o} = (delta*A_o)^2 / (rho*Q_o)
- **Series conductance**: dQ/dA|_{P_o,A_o} = Q_o/A_o

**Eq. 19** — Incremental resistance:
```
dQ/dA|_{P_o,A_o} = Q_o / A_o
dQ/dP|_{P_o,A_o} = (delta*A_o)^2 / (rho*Q_o)
```

The differential acoustic resistance ~ rho*Q_o / (delta*A_o)^2, which is about twice the steady-flow resistance. Using typical values Q_o ~ 150 cm^3/sec, A_o ~ 6 mm^2, delta ~ 0.8:
- **Incremental resistance ~ 73 cgs acoustic ohms**

### Glottal Source Impedance vs Vocal Tract

Key finding: The glottal impedance is high compared to the vocal tract driving-point impedance (except near the first formant). This means the glottis functions approximately as a **constant volume velocity source** — an important simplification for synthesizer design.

- Vocal tract impedance: ~ 3 rho*c/A for unconstricted tube (approx +j3 at 100 cps, +j18 at 500 cps for hard-walled tube)
- Glottal resistance: ~ 73 cgs acoustic ohms
- The subglottal system impedance is small compared to glottal impedance

### Spectral Tilt Data

From Fourier analysis of measured glottal waveforms (Figures 7, 8):

**Spectral slope of volume velocity: approximately -10 to -12 dB/octave**

- At low pitch/low intensity: area function approximates velocity well; slope ~ -10 to -12 dB/octave
- At high pitch/high intensity: velocity function has steeper leading/trailing edges than area; velocity harmonics slightly more intense at high frequencies; slope still roughly -12 dB/octave but fit is less clean
- The spectral components of velocity vary inversely with harmonic number raised to the power 1.7 to 2.0

### Subglottic Pressure Data (Table 1)

From van den Berg (ref 14), adapted:

| Pitch (cps) | Liminal SPL (dB) | P_s at +0 dB | P_s at +5 dB | P_s at +10 dB | P_s at +15 dB |
|---|---|---|---|---|---|
| 97  | 56 | 4 | 7  | 9  | -- |
| 145 | 57 | 6 | 7  | 10 | -- |
| 218 | 62 | 9 | 11 | 14 | 19 |
| 274 | 67 | 12| 21 | 26 | 29 |

(P_s in cm H2O; SPL measured 25 cm from mouth)

### Glottal Area Waveform Data (Table 2)

From Fletcher (ref 6), two male subjects phonating /ae/:

| Subject | Condition I (cps) | II (cps) | III (cps) | IV (cps) | Intensity diff II-I (dB) | IV-III (dB) |
|---|---|---|---|---|---|---|
| A | 125 | 125 | 250 | 235 | 7  | 16 |
| B | 111 | 111 | 222 | 250 | 5  | 17 |

Conditions: (I) lowest pitch/intensity, (II) same pitch higher intensity, (III) lowest intensity higher pitch, (IV) highest pitch/intensity.

### Key Findings for Synthesizer Implementation

1. **Glottal source = high-impedance current source**: The glottis presents much higher impedance than the vocal tract load, so it approximates a constant volume velocity source. This justifies the current-source excitation model used in Klatt-type synthesizers.

2. **Spectral tilt ~ -12 dB/octave**: The volume velocity spectrum falls at approximately -12 dB/octave (harmonics vary as n^{-1.7} to n^{-2}). This is the baseline spectral tilt for the glottal source before vocal tract filtering.

3. **Duty cycle controls spectral richness**: Shorter open phase (lower duty cycle) produces stronger harmonics relative to the fundamental. This is the mechanism by which vocal effort affects spectral tilt — louder phonation with more complete glottal closure produces a "flatter" source spectrum.

4. **Quasi-static approximation valid below ~300 Hz**: The inertia of the air in the glottis limits the rise time to ~0.3 ms, meaning the flow can track area changes quasi-statically only for frequencies below about 300 cps. Above this, the flow waveform is "sharper" than the area waveform.

5. **Phase spectrum may matter for voice quality**: While amplitude spectra of area and velocity functions are similar, their phase spectra differ. Flanagan notes this could be relevant to perceived voice quality, though existing analogs disregard phase.

## Collection Cross-References

### Already in Collection
- [[Stevens_1955_QuantitativeVowelArticulation]] — Stevens & House 1955 cited for quantitative description of vowel articulation
- [[Stevens_House_1956_FormantTransitionsVocalTract]] — Stevens & House 1956 cited for analog studies of vowel nasalization
- [[Fant_1960_AcousticTheorySpeechProduction]] — Fant 1953 cited for speech communication research (precursor work to the 1960 monograph)

### Cited By (in Collection)
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — cites Flanagan 1957 and 1958 for terminal analog design and glottal sound source properties
- [[Rosenberg_1971_EffectGlottalPulseShape]] — cites Flanagan 1958 for properties of glottal sound source and source spectral decay characterization
- [[Isshiki_1964_VoiceIntensityRegulation]] — cites Flanagan 1958 for opening quotient effects on intensity and efficiency
- [[Xue_2000_RaceSexAcousticVoice]] — cites Flanagan 1958 for the -12 dB/octave harmonic rolloff that explains SPI sex differences
- [[Allen_1987_MITalk_TTS]] — cites Flanagan 1958 for glottal sound source properties

### New Leads
- van den Berg, J. W., Zantema, J. T., & Doornenbal Jr., P. (1957). On the air resistance and the Bernoulli effect of the human larynx. *JASA*, 29, 626-631. -- Primary empirical source for glottal resistance formulas
- Fletcher, W. W. (1950). A study of internal laryngeal activity in relation to vocal intensity. Ph.D. Thesis, Northwestern University. -- High-speed glottal area measurements used for volume velocity derivation

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [[Rosenberg_1971_EffectGlottalPulseShape]] — **Strong.** Rosenberg extends Flanagan's characterization of the glottal source by systematically testing how pulse shape affects perceived voice quality, building directly on the spectral analysis framework Flanagan established.
- [[Fant_1985_LFModelGlottalFlow]] — **Strong.** The LF model provides the modern parametric glottal flow model that replaces Flanagan's triangular wave approximation with a more accurate four-parameter waveform, while preserving Flanagan's key insight about duty cycle controlling spectral richness.
- [[Fant_1995_LFModelRevisited]] — **Strong.** Revisits the LF model with refined parameter relationships; Flanagan's duty cycle/spectral tilt relationship is formalized through the Rd parameter.
- [[Rothenberg_1975_ThreeParameterVoiceSource]] — **Strong.** Rothenberg develops a more sophisticated parameterization of the glottal source that extends Flanagan's analysis of glottal impedance and flow-pressure relationships.
- [[Holmberg_1988_GlottalAirflowPressure]] — **Moderate.** Holmberg et al. measure glottal airflow and pressure in running speech, providing modern validation of Flanagan's steady-flow resistance models.
- [[Doval_2003_VoiceSourceCALM]] — **Moderate.** The CALM model provides an alternative parameterization of the source waveform that, like the LF model, builds on Flanagan's spectral analysis of the glottal pulse.
- [[Holmes_1973_GlottalWaveformParallelFormant]] — **Moderate.** Holmes develops a glottal waveform model for parallel formant synthesis that builds on Flanagan's analysis of source spectral properties.
- [[Gauffin_1989_SpectralCorrelatesGlottalVoice]] — **Moderate.** Gauffin & Sundberg investigate spectral correlates of glottal voice source parameters, extending Flanagan's duty cycle analysis with perceptual data.
- [[Hanson_1995_GlottalCharacteristicsFemale]] — **Moderate.** Hanson measures glottal characteristics in female speakers, applying modern methods to the same fundamental questions about source spectrum properties that Flanagan addressed.
