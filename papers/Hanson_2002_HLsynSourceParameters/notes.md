# A Quasiarticulatory Approach to Controlling Acoustic Source Parameters in a Klatt-Type Formant Synthesizer Using HLsyn

**Authors:** Helen M. Hanson, Kenneth N. Stevens
**Year:** 2002
**Venue:** Journal of the Acoustical Society of America, 112(3), 1158-1182
**DOI:** 10.1121/1.1498851

## One-Sentence Summary
This paper provides the complete equations for mapping 13 higher-level quasiarticulatory parameters (HLsyn) to Klatt synthesizer source parameters (AV, AF, AH, OQ, TL, DI, F0), using an equivalent-circuit aerodynamic model of the vocal tract that enforces physically realistic source-filter constraints.

## Problem Addressed
Conventional Klatt-type formant synthesizers treat sources and filters as independent, requiring ~50 parameters with no physical constraints preventing impossible combinations (e.g., simultaneously high voicing and high frication during a closure). HLsyn reduces control complexity to 13 physiologically-motivated parameters while automatically deriving interdependent source and filter behaviors from a vocal-tract circuit model.

## Key Contributions
- Complete set of mapping equations from 13 HL parameters to all Klatt source parameters
- Equivalent-circuit aerodynamic model (Fig. 4) that computes pressures and airflows from constriction sizes
- Physically-grounded constraints: when oral pressure builds up (e.g., stop closure), AV automatically drops and AF rises
- Five intermediate area parameters (acd, acl, agx, agf, acx) that bridge HL and KL parameter spaces
- Comprehensive speaker constants tables (Tables IV-VIII) enabling gender-specific synthesis
- Worked examples for fricatives, stops, liquids, voice quality, and F0 perturbations

## Methodology
The HLsyn system uses a low-frequency equivalent-circuit model of the vocal tract (Rothenberg 1968; Stevens 1993) to compute pressures and airflows from HL parameters. The circuit includes:
- Glottal resistance $R_g$ (viscous + kinetic components)
- Supraglottal constriction resistance $R_c$
- Nasal port resistance $R_n$
- Wall compliance $C_w$ and resistance $R_w$

Given these, the system solves for intraoral pressure Pm, then derives KL source parameters from Pm, constriction sizes, and subglottal pressure.

## HLsyn Parameters (Table I)

| Parameter | Description | Units |
|-----------|-------------|-------|
| **f1**-**f4** | First four natural frequencies of vocal tract | Hz |
| **f0** | Fundamental frequency (intentional prosodic contour) | Hz |
| **ag** | Average glottal area (membranous portion) | mm^2 |
| **ap** | Area of posterior glottal opening | mm^2 |
| **ps** | Subglottal pressure | cm H2O |
| **al** | Cross-sectional area of lip constriction | mm^2 |
| **ab** | Cross-sectional area of tongue-blade constriction | mm^2 |
| **an** | Cross-sectional area of velopharyngeal port | mm^2 |
| **ue** | Rate of vocal-tract volume change | cm^3/s |
| **dc** | Change in vocal-fold/wall compliance | % |

## Key Equations

### Kinetic resistance (Eq. 1)
$$R_{kin} = \frac{\rho U}{2A^2}$$
Where $U$ = volume velocity, $A$ = cross-sectional area, $\rho$ = 0.00114 gm/cm^3.

### Volume velocity through orifice (Eq. 2)
$$U = A\sqrt{\frac{2\Delta P}{\rho}}$$

### Effective glottal area agx (Eq. 3)
$$agx = (ag + 100 \cdot Pm \times Cg \times 2L_g) \text{ mm}^2$$
Where Pm = intraoral pressure (dynes/cm^2), Cg = vocal-fold compliance, $L_g$ = effective horizontal length of vocal folds.

### Vocal-fold compliance Cg (Eq. 4)
$$Cg = C_{gm}(1 + K_{Cg} \cdot dc/100) \text{ cm}^3/\text{dyne}$$
Default $C_{gm}$: $5 \times 10^{-6}$ cm^3/dyne. Default $K_{Cg}$: 0.34. **dc** range: -150 to 150%.

### First formant from tongue-body constriction (Eq. 7)
$$f1 = f1_{min}\sqrt{1 + \left(\frac{c}{2\pi f1_{min}}\right)^2 \frac{acd}{100 V_{acd} L_{c-acd}}} \text{ Hz}$$

### Tongue-body constriction area acd (Eq. 8)
$$acd = 100 V_{acd} L_{c-acd} \left(\frac{2\pi f1_{min}}{c}\right)^2 \left[\left(\frac{f1}{f1_{min}}\right)^2 - 1\right] \text{ mm}^2$$

### Supraglottal constriction acx (Eq. 12)
$$acx = \min(acd, acl, ab, al)$$

### Wall compliance Cw (Eq. 13)
$$Cw = C_{wm}(1 + K_{Cw} \cdot dc/100)$$

### Wall velocity Uw (Eq. 15)
$$Uw = \left(\frac{ag + ap}{100} + 2Cg L_g Pm\right)\sqrt{\frac{2(980 \cdot ps - Pm)}{\rho}} - ue - \frac{an + acx}{100}\sqrt{\frac{2Pm}{\rho}}$$

### Pressure update (Eqs. 19-22, difference equations)
The system uses Brent's algorithm to solve for Pm at each time step T (default 0.1 ms):
$$Uw(nT+T) = \left(\frac{ag+ap}{100} + 2CgL_gPm(nT+T)\right) \times \sqrt{\frac{2(980 \cdot ps - Pm(nT+T))}{\rho}} - ue - \frac{an + acx}{100}\sqrt{\frac{2Pm(nT+T)}{\rho}}$$
$$Pm(nT+T) = Pcw(nT+T) + R_w Uw(nT+T)$$
$$Qw(nT+T) = Cw(nT+T) Pcw(nT+T)$$

### Voicing amplitude AV (Eq. 23)
$$AV = 20\log_{10}[(ps - Pm)^{3/2}] + K_v + K_{dAV} \times \frac{[agx - agm]}{100}$$
Where:
- $(ps - Pm)^{3/2}$: three-halves power relation between transglottal pressure and voicing amplitude
- $K_v$ = 33 dB (scale factor, both genders)
- $K_{dAV}$ has three slopes depending on agx region (see Eq. 24)

### AV slope factor $K_{dAV}$ (Eq. 24)
$$K_{dAV} = \begin{cases} K_{dAVagm-}, & agx_{min} \leq agx < agm \\ -K_{dAV1agm+}, & agm \leq agx < agm + agx_{mid} \\ -K_{dAV2agm+}, & agm + agx_{mid} \leq agx < agm + agx_{max} \end{cases}$$

### Phonation threshold (Eq. 25)
$$P_T = ps - P_m < P_{thr\text{-}m} - K_{Pthr\text{-}dc} \cdot dc$$
Default $P_{thr\text{-}m}$: 3.5-cm H2O. Default $K_{Pthr\text{-}dc}$: 0.03-cm H2O/percent.

### Aspiration amplitude AH (Eq. 26)
$$AH = 20\log_{10}\left[(ps - P_m)^{3/2} \times \frac{agf^{1/2}}{10}\right] + K_{AH}$$
Default $K_{AH}$: 27 dB. AH is about 20 dB less than AV at modal glottal area.

### Frication amplitude AF (Eq. 27)
$$AF = 20\log_{10}\left[P_m^{3/2} \times \frac{acx^{1/2}}{10}\right] + K_{AF}$$
Default $K_{AF}$: 40 dB.

### Open quotient OQ (Eq. 28)
$$OQ = OQm + (agx - agm) \times K_{OQ}$$
Default $OQm$: 50% (male), 65% (female). Constrained: $OQ_{min}$ to $OQ_{max}$ (0%-99%).

### Spectral tilt TL (Eq. 29)
$$TL = TLm + K_{TL}(agx - agm) + K_{TL}\max(0, [acx_{TL} - \max(acx, an)]) + \max(0, 20\log_{10}(3000 \times 2\pi T_{TL}))$$
Where:
- Term 1: modal tilt value (TLm, default 10 dB female, 5 dB male)
- Term 2: agx deviation from modal area changes TL
- Term 3: narrow supraglottal constriction or nasal port reduces TL (loss of abrupt closure)
- Term 4: posterior glottal chink adds high-frequency rolloff

### Acoustic mass M and glottal resistance $R_g$ (Eqs. 30-31)
$$M = \rho\left(\frac{L_t}{A_t} + \frac{L_v}{A_v} + 100\frac{L_{vg}}{ap}\right)$$
$$R_g = \frac{12\mu L_{vg} L_{hp}^2}{(ap/100)^3} + \frac{\sqrt{2\rho} \times 980|ps - P_m|}{ap/100}$$

### Vowel height effect on F0 (Eq. 32)
$$\Delta F0_{height} = f0 \times K_{dF0\text{-}height}(f_{neutral} - \max(f1, f1_{min\text{-}F0}))$$
Default $f_{neutral}$: 590 Hz (female), 500 Hz (male). Default $K_{dF0\text{-}height}$: 0.46 ms (female), 0.5 ms (male).

### Subglottal pressure effect on F0 (Eq. 33)
$$\Delta F0_{ps} = K_{dF0\text{-}ps} \times (ps - Pm - psm)$$
Default $K_{dF0\text{-}ps}$: 30 dHz/cm-H2O (male), 30 dHz/cm-H2O (female). Default psm: 8 cm H2O (male), 6.5 cm H2O (female).

### Vocal-fold compliance effect on F0 (Eq. 34)
$$\Delta F0_{dc} = -K_{dF0\text{-}dc} \cdot dc$$
Default $K_{dF0\text{-}dc}$: 0.3 Hz/percent (both genders). 50% dc increase -> 15 Hz F0 increase.

### Combined F0 (Eq. 35)
$$F0 = \begin{cases} f0 + \Delta F0_{height} + \Delta F0_{ps} + \Delta F0_{dc}, & AV > 0 \\ 0, & AV = 0 \end{cases}$$

### Diplophonia DI (Eq. 37)
$$DI = K_{DI} \times \frac{agm - agx}{agx}$$
When $agx_{min\text{-}DI} < agx < agm$ (default $agx_{min\text{-}DI}$: 1 mm^2).

### Liquid constriction acl (Eq. 11)
$$acl = \left(\frac{f1}{f1_{liquid}}\right)^2 \times K_{acl} \text{ mm}^2$$
Default $K_{acl}$: 25 mm^2. Default $f1_{liquid}$: 450 Hz (female), 400 Hz (male).

### Liquid/stop constriction timing acx (Eq. 38)
$$acx = \begin{cases} al, & 0 \leq t \leq 100 \\ acl \text{ [Eq. 11]}, & 100 < t \leq 200 \\ acd \text{ [Eq. 8]}, & 200 < t \end{cases}$$
Where $t$ is time in ms from stop release.

## Parameters

### Speaker Constants: Physical Characteristics (Table IV)

| Constant | Description | Female | Male |
|----------|-------------|--------|------|
| $L_v$ | Length of vocal cavity | 15 cm | 17 cm |
| $A_v$ | Cross-sectional area of oral vocal cavity, neutral | 3 cm^2 | 3.5 cm^2 |
| $L_t$ | Length of trachea | 11 cm | 12 cm |
| $A_t$ | Cross-sectional area of trachea | 2 cm^2 | 2.5 cm^2 |
| $L_g$ | Effective horizontal length of glottis | 0.7 cm | 1 cm |
| $L_{hp}$ | Horizontal length of posterior glottal opening | 0.2 cm | 0.3 cm |
| $L_{vg}$ | Vertical length of glottis | 0.3 cm | 0.4 cm |
| $L_{c\text{-}acd}$ | Length of velar constriction | 3.5 cm | 4 cm |
| $V_{acd}$ | Volume of cavity behind velar constriction | 40 cm^3 | 50 cm^3 |
| $C_{wm}$ | Modal compliance of vocal-tract walls | 0.001 cm^5/dyne | 0.001 cm^5/dyne |
| $R_w$ | Resistance of vocal-tract walls | 10 dyne-s/cm^5 | 10 dyne-s/cm^5 |
| $C_{gm}$ | Modal compliance of vocal folds | 5e-6 cm^3/dyne | 5e-6 cm^3/dyne |

### Speaker Constants: Acoustic (Table V)

| Constant | Description | Female (Hz) | Male (Hz) |
|----------|-------------|-------------|-----------|
| $f_{neutral}$ | F1 border between high and low vowels | 590 | 500 |
| $f1_{min}$ | Lowest Helmholtz frequency of vocal tract | 180 | 180 |
| $F1_{max}$ | Upper threshold on first resonance | 1100 | 900 |
| $f1_{liquid}$ | First resonance for liquid consonants | 450 | 400 |
| $f1_{phar}$ | Lowest first-formant resonance for pharyngeal constriction | 650 | 540 |
| $B1_m$ | Modal bandwidth of first formant | 80 | 80 |
| $B2_m$ | Modal bandwidth of second formant | 90 | 90 |

### Speaker Constants: Source Characteristics (Table VI)

| Constant | Description | Female | Male |
|----------|-------------|--------|------|
| $agm$ | Modal value of **ag** | 3 mm^2 | 4 mm^2 |
| $TLm$ | Modal source spectral tilt | 10 dB | 5 dB |
| $OQm$ | Modal open quotient | 65% | 50% |
| $psm$ | Modal subglottal pressure | 6.5-cm H2O | 8-cm H2O |

### Speaker Constants: Thresholds and Breakpoints (Table VII)

| Constant | Description | Female | Male |
|----------|-------------|--------|------|
| $acx_{TL}$ | acx above which supraglottal constriction does not affect TL | 20 mm^2 | 20 mm^2 |
| $AF_{min}$ | Threshold below which frication does not occur | 35 dB | 35 dB |
| $agx_{min\text{-}DI}$ | Minimum agx for DI>0 | 1 mm^2 | 1 mm^2 |
| $agx_{max}$ | Maximum agx for which voicing occurs (AV>0) | 9 mm^2 | 11 mm^2 |
| $agx_{mid}$ | Downward slope transition point | 6 mm^2 | 7 mm^2 |
| $agx_{min}$ | Minimum agx for voicing | 1 mm^2 | 1 mm^2 |
| $f1_{min\text{-}F0}$ | Lowest first formant for intrinsic pitch calculation | 250 Hz | 250 Hz |
| $F1_{min\text{-}liq}$ | Min f1 for liquid consonant assumption | 400 Hz | 350 Hz |
| $F1_{max\text{-}liq}$ | Max f1 for liquid consonant assumption | 550 Hz | 500 Hz |
| $OQ_{max}$ | Maximum OQ | 99% | 99% |
| $OQ_{min}$ | Minimum OQ | 0% | 0% |
| $P_{thr\text{-}m}$ | Modal phonation threshold pressure | 3.5-cm H2O | 3.5-cm H2O |
| $TL_{max}$ | Maximum TL | 41 dB | 41 dB |
| $TL_{min}$ | Minimum TL | 0 dB | 0 dB |

### Speaker Constants: Scale Factors (Table VIII)

| Constant | Description | Female | Male |
|----------|-------------|--------|------|
| $K_v$ | Scale factor for AV | 33 dB | 33 dB |
| $K_{dAVagm-}$ | Slope of AV vs agx for agx < agm | 220 dB/cm^2 | 200 dB/cm^2 |
| $K_{dAV1agm+}$ | Slope for agx > agm (first portion) | 120 dB/cm^2 | 100 dB/cm^2 |
| $K_{dAV2agm+}$ | Slope for agx > agm (second portion) | 420 dB/cm^2 | 400 dB/cm^2 |
| $K_{AH}$ | Scale factor for AH | 27 dB | 27 dB |
| $K_{AF}$ | Scale factor for AF | 40 dB | 40 dB |
| $K_{OQ}$ | Scale for OQ from agx | 3.96%/mm^2 | 3.3%/mm^2 |
| $K_{TL}$ | Scale for TL from agx, acx, ap | 1.8 dB/mm^2 | 1.5 dB/mm^2 |
| $K_{DI}$ | Scale factor for DI | 15 | 15 |
| $K_{dF0\text{-}dc}$ | dc effect on F0 | 3 dHz/percent | 3 dHz/percent |
| $K_{dF0\text{-}ps}$ | ps effect on F0 | 30 dHz/cm-H2O | 30 dHz/cm-H2O |
| $K_{dF0\text{-}height}$ | Vowel height effect on F0 | 0.46 ms | 0.5 ms |
| $K_{acl}$ | Cross-sectional area for liquid constriction | 25 mm^2 | 25 mm^2 |
| $K_{Pthr\text{-}dc}$ | dc effect on phonation threshold | 0.03 cm-H2O/percent | 0.03 cm-H2O/percent |
| $K_{Cw}$ | dc effect on wall compliance | 1 (dimensionless) | 1 (dimensionless) |
| $K_{Cg}$ | dc effect on vocal-fold compliance | 0.34 (dimensionless) | 0.34 (dimensionless) |

### Typical Formant Frequencies for Liquids (Table II)

| Phoneme | Gender | f1 (Hz) | f2 (Hz) | f3 (Hz) |
|---------|--------|---------|---------|---------|
| /l/ | Female | 450 | 1200 | 3000 |
| /l/ | Male | 400 | 1000 | 2800 |
| /r/ | Female | 450 | 1200 | 1800 |
| /r/ | Male | 400 | 1100 | 1500 |

### Formant Ranges for Liquid/Retroflex Detection (Table III)

| | Retroflex | | Lateral | |
|---|---|---|---|---|
| | Males | Females | Males | Females |
| f1 | 350 < f1 < 500 | 400 < f1 < 550 | 350 < f1 < 500 | 400 < f1 < 550 |
| f2 | f2 < 1400 | f2 < 1600 | f2 < 1300 | f2 < 1400 |
| f3 | f3 < 1800 | f3 < 2000 | f3 > 2700 | f3 > 2900 |

## Implementation Details

### Circuit model solution
- Time step T = 0.1 ms (default, user-adjustable)
- Uses Brent's root-finding algorithm to solve for Pm at each step
- Initial conditions: Pm = 0, zero pressure in oral cavity
- Rapid closure modeled by setting initial Pm = 0 at constriction onset

### Voicing cutoff logic
- AV = 0 when agx < agx_min OR agx > agm + agx_max
- AV decreases rapidly when agx > agm + agx_mid
- Phonation threshold: transglottal pressure must exceed P_T (Eq. 25)
- dc modulates threshold: increasing dc (stiffer folds) raises threshold

### Source amplitude interdependencies
- During stop closure: Pm rises -> transglottal pressure drops -> AV drops automatically
- Simultaneously: Pm rises -> AF rises (frication from supraglottal constriction)
- Cannot have AV high and AF high simultaneously (physical constraint)
- For voiced fricatives: AV lower than for vowels, AF present but weaker than voiceless

### Parameter notation conventions
- **Bold**: HL input parameters (ag, ab, etc.)
- ALL CAPS: KL output parameters (AV, AF, AH, TL, OQ, DI, F0)
- Sans serif: intermediate parameters (agx, agf, acx, acd, acl, Pm, Uw, etc.)
- *Italic*: speaker constants

## Figures of Interest
- **Fig. 1 (p. 1159):** Block diagram of Klatt synthesizer (cascade and parallel branches)
- **Fig. 2 (p. 1160):** (a) HLsyn parameters and their relation to vocal tract; (b) Schematic of HLsyn system: 13 HL params -> mapping relations -> ~50 KL params -> synthesis
- **Fig. 3 (p. 1161):** Two examples of ab variation showing how HLsyn automatically derives AV and AF contours
- **Fig. 4 (p. 1163):** (a) Low-frequency equivalent circuit model; (b) Simplified version for non-nasalized vowels
- **Fig. 5 (p. 1165):** Helmholtz resonator model for tongue-body constriction
- **Fig. 6 (p. 1165):** acd vs f1 plots for females and males with superimposed vocal tract measurements
- **Fig. 7 (p. 1168):** Complete pressure/flow traces for three constriction configurations
- **Fig. 8 (p. 1169):** AV vs agx curve (three-region piecewise relationship)
- **Fig. 9 (p. 1172):** Fricative synthesis examples: "lacy" and "lazy"
- **Fig. 10 (p. 1174):** Stop consonant synthesis: "a Kaiser" and "a geyser"
- **Fig. 11 (p. 1176):** Liquid consonant + stop synthesis: "pray" and "bray"
- **Fig. 12 (p. 1177):** Voice source characteristics across segmental environment
- **Fig. 13 (p. 1178):** F0 perturbation examples showing height, pressure, and compliance effects

## Results Summary
- HLsyn reduces control from ~50 independent KL parameters to 13 physiologically-motivated HL parameters
- Synthesized fricatives, stops, and liquids show appropriate spectral characteristics matching natural speech
- The aerodynamic model correctly predicts: oral pressure buildup during closures, voicing cessation at high Pm, frication onset at constriction release
- Voiced stop synthesis requires dc parameter (vocal-fold compliance) adjustment for proper voice bar
- Posterior glottal opening (ap) improves voiced fricative quality significantly
- Speaker constants allow gender-specific synthesis without changing the mapping equations

## Limitations
- Filter parameters (formant frequencies, bandwidths) derivation deferred to future papers
- Transient source at stop release not implemented in current version
- Phonation threshold is simplified (single threshold for both initiation and termination)
- F0 perturbation from transglottal pressure at low pitch range not yet implemented
- No explicit model of source-tract interaction (though captured implicitly through circuit model)
- Constriction area estimates from formant frequencies are approximations

## Testable Properties
- AV must decrease when Pm approaches ps (transglottal pressure -> 0)
- AF must increase with increasing Pm (when supraglottal constriction exists)
- AV and AF cannot both be at maximum simultaneously for any valid HL configuration
- OQ must stay within [OQ_min, OQ_max] range
- TL must stay within [TL_min, TL_max] range (0-41 dB)
- AV = 0 when agx < agx_min or agx > agm + agx_max
- F0 must increase with vowel height (lower f1 -> higher F0)
- F0 must increase with increasing transglottal pressure (above modal)
- Increasing dc (stiffer folds) must raise phonation threshold pressure
- agx >= ag when Pm > 0 (oral pressure pushes folds apart)

## Relevance to Project
This paper is directly relevant to Qlatt. It provides the complete mathematical framework for implementing an HLsyn-style higher-level control layer on top of the existing Klatt synthesizer. The mapping equations (Eqs. 23-37) could be implemented as a new parameter derivation stage in the pipeline, sitting between the TTS frontend rule system and the existing semantics/interpreter layer. The aerodynamic circuit model (Eqs. 15-22) would allow Qlatt to enforce physically realistic source-filter constraints, preventing impossible parameter combinations that currently require careful manual rule tuning. The speaker constants tables provide gender-specific defaults that could directly populate voice preset configurations. This is essentially the companion paper to Stevens 1991 (already in collection as Stevens_1991_HL_Parameters), providing the detailed source parameter equations that Stevens 1991 outlined conceptually.

## Open Questions
- [ ] How do the filter parameter mapping equations (deferred to future papers) complete the system?
- [ ] Can the circuit model be simplified for real-time synthesis without significant quality loss?
- [ ] How should the speaker constants be adjusted for child voices?
- [ ] What is the interaction between this system and the LF glottal model (the paper uses KLGLOTT88)?

## Related Work Worth Reading
- Stevens and Bickley (1991) - The original HL parameter proposal (already in collection as Stevens_1991_HL_Parameters)
- Bickley et al. (1997) and Hanson et al. (1997) - Earlier descriptions of HLsyn implementation
- Rothenberg (1968, 1981) - Equivalent circuit model of vocal tract (Rothenberg_1981_InteractiveVoiceSource in collection)
- Hanson (1995a, 1997) - Glottal characteristics for females (in collection)
- Hanson (1999) - Glottal characteristics for males (in collection)
- Stevens (1998) - Acoustic Phonetics textbook (in collection as Stevens_1998_AcousticPhonetics)

## Collection Cross-References

### Already in Collection
- [[Stevens_1991_HL_Parameters]] — cited as the original 10-parameter HL system that this paper extends to 13 parameters with full source equation derivations
- [[Rothenberg_1981_InteractiveVoiceSource]] — cited for the equivalent-circuit model of the vocal tract that forms the aerodynamic basis of HLsyn
- [[Klatt_1990_VoiceQualityVariations]] — cited for the KLSYN88 synthesizer and KLGLOTT88 source model that HLsyn maps to
- [[Hanson_1995_GlottalCharacteristicsFemale]] — cited for glottal voice quality measures in female speakers that inform the gender-specific speaker constants
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — cited for corrected acoustic measures (H1*-H2*, H1*-A3*) linking to glottal configurations
- [[Hanson_1999_GlottalMaleSpeakers]] — cited for male speaker glottal characteristics informing the male speaker constants
- [[Stevens_1998_AcousticPhonetics]] — cited extensively for acoustic theory underlying the derivation equations
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for vocal tract resonance theory and minimum formant frequency ($f1_{min}$)
- [[Shadle_1985_FricativeAcoustics]] — cited for turbulence noise generation theory underlying the AF equation
- [[EspyWilson_2000_AcousticModelingAmericanR]] — cited (as Espy-Wilson 1992) for liquid consonant formant frequency data

### New Leads (Not Yet in Collection)
- Titze (1992) — "Phonation threshold pressure: A missing link in glottal aerodynamics" JASA 91:2926-2935 — key paper for phonation threshold equation (Eq. 25)
- Rothenberg (1968) — "The breath-stream dynamics of simple-released-plosive production" — complete circuit model derivation underlying HLsyn
- Hanson et al. (2001) — "Towards models of phonation" J. Phonetics 29:451-480 — extends phonation model with vocal-fold mechanics (NOTE: Hanson_2001_ModelsPhonation IS in collection)
- Svirsky et al. (1997) — "Tongue surface displacement during bilabial stops" JASA 102:562-571 — vocal-tract wall effects at stop release

### Supersedes or Recontextualizes
- [[Stevens_1991_HL_Parameters]] — This 2002 paper provides the complete, detailed source parameter equations that Stevens & Bickley (1991) proposed conceptually. The 1991 paper had 10 parameters; this paper uses 13. The equation set here (Eqs. 23-37 plus the aerodynamic circuit Eqs. 15-22) is the definitive implementation reference.
- [[Hanson_2001_ModelsPhonation]] — The 2001 paper described HLsyn qualitatively and referenced this paper (then "submitted") for the full equations. This 2002 paper delivers those equations.

### Cited By (in Collection)
- [[Hanson_2001_ModelsPhonation]] — cites this paper (as "Hanson & Stevens, submitted") for the full HLsyn mapping equations from HL to KL parameters
- [[Hanson_2003_AspiratedStopsModels]] — uses HLsyn for synthesis examples of stop consonant releases
- [[Zhang_2016_MechanicsVoiceProductionControl]] — higher-level control equations address the source parameter co-variation problem Zhang highlights
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — HLsyn uses parameters (OQ, TL) directly related to the H1*-H2* and H1*-A3* measures Iseli characterizes; age/sex norms could parameterize HLsyn speaker profiles
- [[Titze_1992_VocalIntensity]] — cites the companion phonation threshold paper for the phonation threshold pressure equation used in HLsyn
