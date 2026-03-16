---
title: "Titze 2014 - Bi-stable Vocal Fold Adduction: Implementation Notes"
year: 2014
---

# Titze 2014 - Bi-stable Vocal Fold Adduction: Implementation Notes

Titze, I. R. (2014). "Bi-stable vocal fold adduction: A mechanism of modal-falsetto register shifts and mixed registration." J. Acoust. Soc. Am. 135(4), 2091-2101.

## Core Mechanism: Bistability in Glottal Geometry

The central finding is that **smooth changes in glottal convergence angle produce abrupt changes in intraglottal pressure**, creating a bistable system with two stable configurations:

1. **Convergent glottis** (modal register): Bottom of vocal folds is narrower than top. Entry area a1 < exit area a2, so area ratio a1/a2 < 1. Strong vocal fold collision, efficient phonation, low phonation threshold pressure.

2. **Divergent glottis** (falsetto register): Bottom wider than top. a1/a2 > 1. Reduced collision, higher phonation threshold pressure, thinner contact.

3. **Rectangular glottis** (mixed registration): Nearly parallel surfaces, a1/a2 ~ 1. Less stable than either extreme unless specific conditions are met. Desirable because it yields low phonation threshold pressure with moderate collision.

The bistability arises because the **mean intraglottal pressure** changes sign abruptly near the convergent-divergent boundary (a1/a2 ~ 1). For convergent shapes, intraglottal pressure is positive (pushing folds apart). For divergent shapes, it becomes negative (Bernoulli suction pulling folds together). This sign change is rapid near the rectangular configuration, creating a "jump" region.

## Key Equations

### Bernoulli Pressure Integration (Eq. 2)

Mean intraglottal pressure on vocal fold surfaces:

```
p = (a1/a2)^2 * (1/a1)(a2 - a1) * ps + p_e    (ideal Bernoulli)
```

where:
- a1 = entry (bottom) glottal area
- a2 = exit (top) glottal area
- ps = subglottal pressure
- pe = supraglottal pressure (at epilarynx tube entry)

This is a simplification. The actual pressures used in the model are from **Scherer et al. (2010)** empirical data, which include flow separation, viscous losses, and turbulence losses.

### Phonation Threshold Pressure (Eq. 1)

```
P_th = k_t * B1 * (a1/a2) * x_0 / T
```

where:
- k_t = transglottal pressure coefficient
- B1 = first formant bandwidth (damping)
- x_0 = prephonatory glottal half-width
- T = vibratory period (1/F0)
- a1/a2 = area ratio (convergence measure)

Key insight: P_th is lowest for convergent shapes (a1/a2 < 1) and increases for divergent shapes. The trend toward a1/a2 = 1 (rectangular) also gives low threshold.

### Elastic Recoil Model (Eq. 3)

Static elastic recoil pressure of entire vocal fold surface:

```
p = (k/L)(a1/a2)^2 * [1/(a1)(a2 - a1)] + p_s(a1 + a2)/2 + p_e
```

This was simplified via midpoint surface displacement:

```
x_mid = p_mid / (k / L)
```

### Two-Spring Model (Eqs. 5-6, Section IV.A)

The vocal fold is modeled with two springs representing lower and upper tissue portions:

```
k_L = 20 N/m   (lower 2/3)
k_U = 10 N/m   (upper 1/3)
```

Combined stiffness = 30 N/m total (similar to body stiffness in Tokuda et al. 2010).

### Equilibrium Equations (Eqs. 7-8)

Pressure forces balanced against elastic recoil:

```
F_L = P_L * (2T/3) * L = k_L * (x_L - x_L0)     (lower portion)
F_U = P_U * (T/3) * L = k_U * (x_U - x_U0)       (upper portion)
```

where P_L and P_U are driving pressures on lower and upper portions from Scherer et al. (2010) empirical data.

## The Bistability Mechanism in Detail

### What Controls the Transition

The area ratio a1/a2 is the key variable. When plotted against the supraglottal/subglottal pressure ratio pe/ps:

- **pe/ps near 0** (high transglottal pressure): Strong bistability. The system jumps abruptly between convergent and divergent states.
- **pe/ps near 1** (low transglottal pressure): Bistability is reduced. The transition becomes more gradual.

Critical finding: **Large transglottal pressure exacerbates bistability.** This is counterintuitive -- one might expect more driving pressure to help, but it actually makes register breaks worse.

### Role of Stiffness Gradient

- **Stiffening bottom** (TA contraction, modal register): Increases k_L. Convergent shapes become less convergent, divergent shapes become less divergent. Rectangular shapes remain. More stable in modal register.

- **Stiffening top** (CT activation, falsetto register): Increases k_U. Creates a positive stiffness gradient from bottom to top. An increase in supraglottal pressure pe produces a strong push on the softer bottom portion while the stiffer top is held in place -- drives toward divergence (falsetto). A bistable situation is noted in the top right panel of Fig. 8.

- **Balanced stiffness** (mixed registration): Upper and lower stiffnesses balanced. Near-rectangular configuration maintained.

### pe/ps = 0.4 as Critical Value

A value of pe/ps = 0.4 flips a convergent surface to a divergent one. For pre-pressure divergent glottis, supraglottal pressure does not help produce a rectangular shape.

## Muscle Control Mapping

| Muscle | Action | Register Effect |
|--------|--------|----------------|
| **LCA** (lateral cricoarytenoid) | Primary adductor; brings vocal processes together | Dominant for adduction; sets overall medial compression |
| **TA** (thyroarytenoid) | Stiffens body (lower portion); shortens folds | Drives toward modal register; increases lower stiffness k_L |
| **CT** (cricothyroid) | Stretches/stiffens cover (upper portion); lengthens folds | Drives toward falsetto register; increases upper stiffness k_U |
| **IA** (interarytenoid) | Adducts posterior glottis | Contributes to overall closure |

Key relationships:
- TA activation → stiffer bottom → convergent glottis → modal register
- CT activation → stiffer top (ligament) → divergent glottis → falsetto register
- Balanced TA/CT → near-rectangular → mixed registration
- LCA dominates in adduction; TA dominates in modal register stiffness

The convergence angle can be predicted by a TA/LCA activation ratio (non-dimensional). CT determines fold length and ligament stiffness.

## Empirical Evidence: EGG Signatures

### Modal vs Falsetto EGG (Fig. 10)

- **Modal register**: EGG signal shows a "knee" in the declination phase, indicating rapid release of lower vocal fold contact. Bottom contact leads top contact in phase.
- **Falsetto register**: EGG shows smooth, more sinusoidal waveform without the knee. Less vertical phase difference.
- **Register transition**: Characterized by a jump in frequency (often slight), a reduction of EGG amplitude, and a change in EGG wave shape.

### EGG as Medial Surface Proxy

The EGG signal, rotated 90 degrees clockwise, approximates the medial surface shape of the vocal folds in coronal view. This is because:
- Bottom contact generally leads top contact in phase
- "Squaring up" of medial surface toward rectangular shape → flattening of EGG declination
- More triangular (convergent/divergent) shapes → more angular EGG features

## Implications for Register Control in Synthesis

### The Fundamental Problem

Register is not a simple binary switch. It is a **quasi-static geometrical property** of the vocal fold medial surface that interacts with:
1. Transglottal pressure (affected by vowel, loudness, vocal tract impedance)
2. Vertical stiffness gradient (TA/CT muscle balance)
3. Overall adduction level (LCA)
4. Subglottal pressure (lung pressure)

### For a Klatt-Style Synthesizer

The paper suggests that register control requires coordinating multiple parameters simultaneously:

1. **Open quotient (OQ)**: Convergent (modal) → lower OQ (more complete closure). Divergent (falsetto) → higher OQ (incomplete or brief closure). Rectangular (mixed) → intermediate OQ.

2. **Spectral tilt**: Modal (convergent) → sharper closure → less tilt. Falsetto (divergent) → softer closure → more tilt. This maps to H1-H2 and the LF model's return phase.

3. **Phonation threshold pressure**: Lower for convergent/rectangular, higher for divergent. This means falsetto requires more subglottal pressure to sustain, which affects amplitude and dynamic range.

4. **Register transitions**: The bistability means that **smooth parameter interpolation between modal and falsetto will not sound natural**. There should be a tendency for the system to "snap" between states unless specific mixed-voice conditions are maintained.

5. **Mixed voice stability**: Requires:
   - Reduced transglottal pressure (pe/ps closer to 1, i.e., higher supraglottal pressure via vocal tract loading)
   - Balanced upper/lower stiffness
   - Moderate adduction (not too pressed, not too lax)

### Specific Parameter Implications

- **Vowel dependence of register breaks**: Different vowels create different supraglottal pressures (pe), changing pe/ps ratio. Close vowels with higher impedance may facilitate mixed registration by increasing pe.

- **Loudness interaction**: Louder phonation → higher ps → lower pe/ps → more bistability → harder to maintain mixed voice. This matches the observation that register breaks are more likely at loud dynamics.

- **F0 interaction**: Higher F0 generally requires CT activation → upper stiffness increase → tendency toward divergent/falsetto. The transition from modal to falsetto with rising F0 is a consequence of this stiffness shift.

## Key Figures

| Figure | Content |
|--------|---------|
| Fig. 1 | Glottal shapes: (a) convergent, (b) rectangular, (c) divergent. Shows area ratio a1/a2 for each. |
| Fig. 2 | Phonation threshold pressure vs convergence angle for three glottal half-widths. Shows -1 to 3 deg convergence has lowest threshold. |
| Fig. 3 | Evidence for quantal pressure change with a1/a2 from Scherer data. |
| Fig. 4 | Midpoint surface displacement x vs pressure ratio p1/ps for three area ratios (0, 0.5, 0.7). Shows how displacement varies with transglottal pressure. |
| Fig. 5 | Two-spring model diagrams for convergent and divergent glottis. |
| Fig. 6 | Driving pressures P_L and P_U on lower/upper vocal fold portions vs area ratio, for four transglottal pressures (1.5, 1.0, 0.5, 0.3 kPa). Shows P_L has greatest rate of change near a1/a2 ~ 1. |
| Fig. 7 | Surface displacements as function of pressure ratio p_e/p_s. Shows convergent/divergent jump behavior. |
| Fig. 8 | Area ratio a1/a2 vs pe/ps for increased bottom stiffness (TA contraction). Shows modal register stabilization. |
| Fig. 9 | Area ratio vs pe/ps for increased top stiffness (CT activation, falsetto). Shows divergent tendency with stiff upper portion. |
| Fig. 10 | (a) EGG comparison for modal and falsetto register. (b) Vocal fold adduction sketches showing medial surface shape correspondence to EGG. |

## Collection Cross-References

### Already in Collection (cited or citing)
- [[Childers_Lee_1991_VoiceQualityFactors]] — Voice quality factors (OQ, speed quotient) for modal/falsetto; this paper explains the geometric origin of those differences.
- [[Fant_1985_LFModelGlottalFlow]] — The LF return phase parameter ta relates to closure abruptness, which Titze links to convergent vs divergent medial surface geometry.
- [[Klatt_1990_VoiceQualityVariations]] — Voice quality variations; bistability explains why register transitions can be abrupt rather than gradual.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Falsetto voice quality parameters; this paper provides the physical basis for why those parameters take the values they do.
- [[Gobl_2003_VoiceQualityEmotion]] — Voice quality and emotion; register bistability constrains which voice quality transitions are physically smooth vs abrupt.
- [[Stevens_1989_QuantalNatureSpeech]] — The bistability here is a quantal phenomenon; small geometric changes produce large acoustic consequences near the rectangular configuration.

### Cited By (in Collection)
- [[Zhang_2016_MechanicsVoiceProductionControl]] — Cites Titze 2014 for the bistable adduction mechanism in the context of voice production mechanics.

### Conceptual Links (not citation-based)
- [[Titze_1989_MaleFemaleVoices]] — Strong. The 1989 paper documents male-female physiological voice differences (fold length, mass, stiffness); the 2014 paper explains how those stiffness differences create register behavior differences via the bistability mechanism.
- [[Titze_1992_VocalIntensity]] — Strong. The vocal intensity model depends on subglottal pressure and glottal geometry; the 2014 paper shows how the same geometric variables (convergence angle, area ratio) create bistable register states that interact with intensity control.
- [[Hanson_1999_GlottalMaleSpeakers]] — Moderate. Hanson's glottal source measurements (OQ, H1-H2) for male speakers reflect the convergent-glottis modal configuration described here; the bistability framework explains why those parameters cluster into distinct modal/falsetto groups rather than varying continuously.
- [[Doval_2003_VoiceSourceCALM]] — Moderate. The CALM model parameterizes the glottal source; the bistability framework constrains which parameter combinations are physically realizable (convergent geometry produces certain OQ/tilt combinations that divergent geometry cannot).
- [[Kreiman_2007_GlottalSourceSpectrum]] — Moderate. Kreiman's glottal source spectrum measurements should show discontinuities at register transitions, consistent with the bistable jump behavior described here.
