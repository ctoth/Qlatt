# Regulatory Mechanism of Voice Intensity Variation

**Authors:** Nobuhiko Isshiki
**Year:** 1964
**Venue:** Journal of Speech and Hearing Research, 7, 17-29
**DOI:** 10.1044/jshr.0701.17

## One-Sentence Summary
Establishes quantitative relationships between voice intensity (SPL), subglottic pressure, airflow rate, and glottal resistance across pitch registers, showing that the dominant intensity-regulation mechanism shifts from laryngeal (glottal resistance) at low pitch to respiratory (flow rate) at high pitch.

## Problem Addressed
Prior work (Vogelsanger 1954, van den Berg 1956a, Ladefoged & McKinney 1963) had established individual relationships between voice intensity and subglottic pressure or flow rate, but simultaneous recording of all parameters at different pitches had not been done. The regulatory mechanism of intensity variation across pitch registers was unknown.

## Key Contributions
- Simultaneous measurement of SPL, subglottic pressure (P), flow rate (U), and air volume during phonation of sustained [a] at varying intensities across multiple pitch levels
- Discovery that SPL is proportional to approximately the 3.3 power of subglottic pressure across all pitch registers: $I \propto P^{3.3 \pm 0.7}$
- Demonstration that the mechanism of intensity control shifts with pitch: glottal resistance dominates at low pitch, flow rate dominates at high pitch (falsetto)
- Quantification of glottal resistance ranges across pitch registers
- Key equation linking voice intensity to underlying parameters: $I = R U^2 E_g E_{tr}$

## Methodology
- Single male subject with normal larynx
- Sustained vowel [a] at intensities from 65 to 95 dB SPL at constant pitch
- Repeated across pitch range from E2 to C5 (low to falsetto)
- Subglottic pressure measured via lumbar puncture needle into trachea (30 cm plastic tube to strain gauge transducer, Sanborn 268B)
- Flow rate measured via pneumotachograph with differential pressure gauge (400-mesh monel wire screen, 20.5 cm^2)
- SPL measured via condenser microphone (Sony C-37A) at 20 cm from pneumotachograph outlet
- Glottal resistance calculated as ratio of mean subglottic pressure to mean flow rate (approximate substitute for glottal impedance)
- Subglottic power approximated as product of mean subglottic pressure and mean volume velocity

## Key Equations

### Voice intensity as function of subglottic pressure
$$
I \propto P^{3.3 \pm 0.7}
$$
Where: I = voice intensity (SPL), P = subglottic pressure. Applies across all pitch registers.

### Subglottic power relation
$$
W = PU = \frac{P^2}{R} = RU^2
$$
Where: W = subglottic power, P = subglottic pressure, U = volume velocity (flow rate), R = glottal resistance.

### Voice intensity expression
$$
I = W \cdot E_g \cdot E_{tr}
$$

$$
I = R \cdot U^2 \cdot E_g \cdot E_{tr}
$$
Where: I = voice intensity at a point outside the mouth, W = subglottic power, E_g = glottal efficiency (ratio of radiated acoustic power to subglottic power), E_tr = transfer and radiation efficiency of the vocal tract.

### Speech power calculation
$$
\log W = IL/10 + \log I_{ref} + \log 4\pi r^2, \quad (4\pi r^2 \sim 5000)
$$
$$
\log W = (64-1)/10 - 16 + 3.7
$$
$$
W = 10^{-4} \text{ (Watt)}
$$
Where: IL = intensity level in dB, r = distance from source. Used to calculate radiated acoustic power from SPL measurements.

### Efficiency of voice
$$
E_g \cdot E_{tr} = \frac{\text{radiated acoustic power}}{\text{subglottic power}}
$$
Ranged from $0.9 \times 10^{-4}$ to $4.0 \times 10^{-4}$ for low pitch (G2), from $0.7 \times 10^{-4}$ to $14.0 \times 10^{-4}$ for medium pitch (C3), and from $0.3 \times 10^{-4}$ to $1.7 \times 10^{-4}$ for high pitch (G4).

### Flow rate proportionality at high pitch (falsetto)
$$
I \propto U^{3.5}
$$
At high pitch where glottal resistance is approximately constant (~150 dyne-sec/cm^5), voice intensity is proportional to the 3.5 power of the flow rate.

### Efficiency proportionality
$$
E_g \cdot E_{tr} = K \cdot U^{1.3}
$$
Total efficiency of voice radiated through the mouth increases in proportion to the 1.3 power of volume velocity. This is interpreted as the glottal generator increasing efficiency with higher flow rates, possibly through shortening of opening quotient (OQ) and sharpening of the volume velocity waveform.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| SPL | I | dB re 0.0002 dyne/cm^2 | - | 65-95 | At 20 cm from mouth |
| Subglottic pressure | P | cm H2O | - | 2-30+ | Varies with pitch and intensity |
| Flow rate | U | cc/sec | - | 100-500 | Volume velocity |
| Glottal resistance | R | dyne-sec/cm^5 | - | 20-200 | Ratio of mean P to mean U |
| SPL-pressure exponent | - | - | 3.3 | 3.3 +/- 0.7 | Power law across all registers |
| Low pitch glottal resistance | R_low | dyne-sec/cm^5 | - | 20-100 | Highly variable with intensity |
| Medium pitch glottal resistance | R_med | dyne-sec/cm^5 | - | 20-100 | Less variable than low pitch |
| High pitch glottal resistance | R_high | dyne-sec/cm^5 | ~150 | ~constant | Nearly independent of intensity |
| Voice efficiency (low pitch) | E | dimensionless | - | 0.9e-4 to 4.0e-4 | Increases with intensity |
| Voice efficiency (medium pitch) | E | dimensionless | - | 0.7e-4 to 14.0e-4 | Greater range than low pitch |
| Voice efficiency (high pitch) | E | dimensionless | - | 0.3e-4 to 1.7e-4 | Narrower range |

## Implementation Details
- Glottal resistance is defined as ratio of mean subglottic pressure to mean flow rate (not true impedance since phase information is unavailable)
- At low pitch, flow rate may slightly *decrease* with increasing intensity while glottal resistance increases greatly -- this means intensity control at low pitch is primarily laryngeal (adduction force)
- At high pitch (falsetto), glottal resistance is approximately constant at ~150 dyne-sec/cm^5 and cannot be further increased, so intensity is controlled almost entirely by respiratory effort (flow rate)
- Medium pitch shows intermediate behavior with both mechanisms contributing
- The mutual compensation between flow rate and glottal resistance at low pitch explains why their individual relationships to SPL appear weak -- they are interdependent
- Vocal break at low pitch occurs when glottal resistance is too low, allowing too much flow and resulting in hoarse/husky voice quality

## Figures of Interest
- **Fig 1 (page 18):** Diagram of experimental arrangement showing pneumotachograph, pressure transducer, and recording equipment
- **Fig 2 (page 21):** SPL vs subglottic pressure for low pitch -- shows ~3.3 power relationship
- **Fig 3 (page 21):** SPL vs flow rate for low pitch -- shows no clear relationship
- **Fig 4 (page 22):** SPL vs glottal resistance for low pitch -- positive trend with scatter
- **Fig 5 (page 22):** Flow rate vs glottal resistance for low pitch -- inverse relationship showing mutual compensation
- **Fig 6 (page 22):** SPL vs subglottic pressure for medium pitch -- ~3.3 power relationship
- **Fig 7 (page 22):** SPL vs flow rate for medium pitch -- slight positive trend
- **Fig 8 (page 23):** SPL vs glottal resistance for medium pitch -- positive trend
- **Fig 9 (page 23):** SPL vs subglottic pressure for high pitch -- steeper relationship
- **Fig 10 (page 23):** SPL vs flow rate for high pitch -- clear positive relationship
- **Fig 11 (page 23):** SPL vs glottal resistance for high pitch -- no clear relationship (resistance ~constant)
- **Fig 12 (page 25):** Schematic of glottal resistance vs SPL at different pitch levels with resonance effects
- **Fig 13 (page 25):** Schematic of flow rate vs SPL at different pitch levels

## Results Summary

### Low Pitch Phonation
- SPL proportional to P^3.3 (treating intensity as function of subglottic pressure alone)
- Flow rate ranges 100-200 cc/sec; no clear relationship to intensity
- Glottal resistance increases with intensity (dominant control mechanism)
- Resistance and flow rate are inversely coupled (mutual compensation)

### Medium Pitch Phonation
- SPL proportional to P^(3.3 +/- 0.7)
- Flow rate shows slight tendency to increase with intensity (more than at low pitch)
- Glottal resistance increases with intensity but with less variation than low pitch

### High Pitch Phonation (Falsetto)
- SPL proportional to P^(~3.3)
- Flow rate clearly increases with intensity -- proportional to U^3.5
- Glottal resistance approximately constant at ~150 dyne-sec/cm^5
- Minimum subglottic pressures higher than at low/medium pitch
- Intensity range narrower at low pitch, wider at high pitch

### Efficiency
- Radiated acoustic power / subglottic power ranges from ~1e-4 to ~14e-4
- Efficiency increases greatly with intensity, especially at medium pitch
- $E_g \cdot E_{tr} \propto U^{1.3}$ at high pitch (falsetto) where resistance is constant
- Efficiency increase attributed to decreased opening quotient (OQ) and sharpened volume velocity waveform at higher intensities

## Limitations
- Single subject (one male with normal larynx)
- Subglottic pressure measurement via lumbar puncture has ~0.05 sec time constant, limiting dynamic measurement
- Glottal resistance calculated as mean P / mean U (not true impedance -- no phase information)
- Actual subglottic power may be less than P*U since pressure and volume velocity may not be in phase
- Resonance effects of the pneumotachograph cavity introduce some artifact in absolute SPL values (though relative relationships preserved)
- Mouth opening kept constant (pneumotachograph inserted), eliminating variable radiation impedance but creating somewhat artificial conditions

## Testable Properties
- SPL must increase monotonically with subglottic pressure at any given pitch
- $I \propto P^{3.3 \pm 0.7}$: the power law exponent should be in range [2.6, 4.0] for any pitch
- At high pitch (falsetto), glottal resistance should be approximately constant regardless of intensity
- At low pitch, increasing intensity should increase glottal resistance while flow rate stays roughly constant or decreases
- At high pitch, increasing intensity should increase flow rate while resistance stays roughly constant
- Voice efficiency (radiated power / subglottic power) should increase with intensity
- Glottal resistance at falsetto (~150 dyne-sec/cm^5) should exceed that at low or medium pitch (~20-100 dyne-sec/cm^5)

## Relevance to Project
This paper provides the physiological basis for how voice intensity is controlled across pitch registers, which is essential for the speaker personality system's effort/loudness modeling. The key insight is that intensity control is not a single mechanism but shifts from laryngeal (glottal resistance / adduction) at low pitch to respiratory (flow rate) at high pitch. This means that a synthesizer's intensity parameter should adjust different underlying Klatt parameters depending on the pitch register: at low F0, increase AV (amplitude of voicing, reflecting tighter glottal closure / higher resistance) with little change in flow; at high F0 (falsetto), increase flow-related parameters. The power law $I \propto P^{3.3}$ provides a quantitative constraint for mapping effort to SPL. The efficiency expression $E_g \cdot E_{tr} = KU^{1.3}$ connects flow rate to spectral characteristics through opening quotient changes.

## Open Questions
- [ ] How do these relationships change for female voices and across age groups?
- [ ] What is the relationship between Isshiki's glottal resistance and Klatt's AV parameter?
- [ ] How does the efficiency increase relate to spectral tilt changes (H1-H2) at different intensities?
- [ ] Can the pitch-dependent intensity mechanism shift be modeled as a smooth crossover function?

## Collection Cross-References

### Already in Collection
- (none — no cited papers are currently in the collection)

### New Leads (Not Yet in Collection)
- van den Berg (1956a) — "Direct and indirect determination of the mean subglottic pressure" — foundational methodology for Ps measurement; reported 4th power relationship between intensity and flow rate
- Ladefoged & McKinney (1963) — "Loudness, sound pressure, and subglottic pressure in speech" — emphasized relation between subglottic power and loudness in running speech
- Flanagan (1958) — "Some properties of the glottal sound source" — opening quotient effects on intensity and efficiency; explains the mechanism behind Isshiki's efficiency findings

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- **Bjorklund_2016_SubglottalPressureSPL** — Directly extends Isshiki's core finding 50 years later with 31 speakers (vs Isshiki's 1). Bjorklund establishes SPL = a + b*log2(Ps) with gender-specific slopes (11.1 dB/doubling female, 9.3 dB/doubling male), and reports pitch has no significant effect on the Ps-SPL slope. This is consistent with Isshiki's finding that the power law exponent (~3.3) is similar across registers, but Bjorklund's log2 formulation obscures the mechanism shift Isshiki identified (resistance-dominant at low pitch, flow-dominant at high pitch). Bjorklund's finding that females gain more SPL per pressure doubling may relate to Isshiki's efficiency expression E_g*E_tr = KU^1.3 and sex-dependent glottal resistance.
- **Zhang_2021_LaryngealSizeSexDifferences** — Zhang's simulation finding that vocal fold length dominates SPL differences between sexes provides a structural explanation for Isshiki's observed pitch-register dependence: longer folds (lower pitch) have different resistance characteristics than shorter folds (higher pitch), and length-dependent contact pressure differences may underlie the resistance-vs-flow tradeoff Isshiki observed.
- **Stathopoulos_2011_VoiceAcrossLifespan** — SPL measurements across ages 4-93 provide population data on the acoustic output side of Isshiki's intensity equation. Stathopoulos found sex is not a significant predictor of SPL, which contrasts with Bjorklund's finding of gender differences in the Ps-SPL mapping — suggesting the mechanism differences Isshiki identified may compensate to equalize output.

## Related Work Worth Reading
- van den Berg, Jw (1956a). Direct and indirect determination of the mean subglottic pressure. *Folia phoniatr.*, 8, 1-24.
- Ladefoged, P. and McKinney, N. P. (1963). Loudness, sound pressure, and subglottic pressure in speech. *J. acoust. Soc. Amer.*, 35, 454-460.
- Flanagan, J. L. (1958). Some properties of the glottal sound source. *J. Speech Hearing Res.*, 1, 99-116.
- Fant, G. (1960). *Acoustic theory of speech production*. 'S-Gravenhage: Mouton, 265-272.
- Stevens, K. N. and House, A. S. (1961). An acoustical theory of vowel production and some of its implications. *J. Speech Hearing Res.*, 4, 303-320.
