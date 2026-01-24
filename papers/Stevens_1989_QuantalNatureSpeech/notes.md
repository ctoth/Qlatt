# On the Quantal Nature of Speech

**Authors:** Kenneth N. Stevens
**Year:** 1989
**Venue:** Journal of Phonetics, 17, 3-45
**Institution:** Research Laboratory of Electronics, MIT

## One-Sentence Summary
Speech production exhibits quantal (non-linear) articulatory-acoustic relationships where certain articulatory configurations produce stable acoustic outputs insensitive to small perturbations, forming the physical basis for distinctive phonetic features.

## Problem Addressed
Why do languages use specific phonetic features rather than arbitrary acoustic dimensions? Stevens argues that the human vocal tract and auditory system have inherent non-linearities that create natural "quantal" boundaries—regions where acoustic output is stable despite articulatory variation, separated by regions of rapid acoustic change.

## Key Contributions
1. **Quantal Theory of Speech**: Articulatory-acoustic relations show plateau regions (stable output) separated by rapid-transition regions
2. **Coupled Resonator Analysis**: Explains how vocal tract configurations create formant proximity and stability
3. **Feature Grounding**: Proposes that distinctive features correspond to these naturally stable articulatory-acoustic regions
4. **Turbulence Noise Analysis**: Explains fricative consonant acoustics through constriction position and noise source characteristics
5. **Auditory Constraints**: Identifies perceptual thresholds (e.g., 3.5 Bark critical distance) that shape phonetic categories

## Core Concept: The Quantal Relation

The fundamental relation (Figure 1) shows:
- **Region I**: Plateau—acoustic parameter stable, insensitive to articulatory changes
- **Region II**: Transition—rapid acoustic change for small articulatory shifts
- **Region III**: Plateau—different stable acoustic state

This creates natural phonetic boundaries: features implemented in plateau regions are robust to production variability.

## Acoustic-Articulatory Relations

### 1. Coupled Resonators (Section 2.1)

When vocal tract has a constriction, it behaves as two coupled resonators (back cavity + front cavity).

**Key equation for lowest natural frequency with constriction:**

$$
F_1 = \frac{c}{2\pi\sqrt{A_1 l_1 \left(\frac{l_c}{A_c} + \frac{l_2}{A}\right)}}
$$

Where:
- $c$ = speed of sound (~35,000 cm/s)
- $A_1$ = back cavity area
- $l_1$ = back cavity length
- $A_c$ = constriction area
- $l_c$ = constriction length
- $A$ = average cross-sectional area (~3 cm²)

**Frequency splitting at resonance crossover:**

$$
\Delta F = \frac{c^2}{2\pi^2 l_c l_2 F_n} \times \frac{A_c}{A}
$$

Where $F_n$ is the uncoupled natural frequency.

### 2. Vowel Configurations

#### Non-low Front Vowels (/i/, /e/)
- Constriction in palatal region (back cavity 6.5-9 cm)
- F₂ achieves maximum, close to F₃ (and possibly F₄)
- Stable region: F₂ insensitive to anterior-posterior tongue position

#### Non-low Back Rounded Vowels (/u/, /o/)
- Constriction in upper pharynx with lip rounding
- F₂ achieves minimum, close to F₁
- Rounding lowers front-cavity resonance, enabling F₂ minimum
- Without rounding, no stable F₂ minimum exists in pharyngeal region

#### Low Vowels (/a/, /æ/)
- Narrow constriction in pharynx, wide oral cavity
- F₁ high and close to F₂ (minimum separation)
- Two configurations possible:
  - Backed low tongue: F₁ maximum, F₂ minimum (~7-9 cm back cavity)
  - Fronted low tongue: F₁ high but stable, F₂ near maximum (~4 cm)

### 3. Effect of Rounding (Section 2.5)

Rounding affects formant-constriction relationships:
- **Back vowels**: Rounding enables F₂ minimum in pharyngeal region
- **Front vowels**: Rounding shifts F₂-F₃ proximity region, creates narrower/more prominent spectral peak
- **Bandwidth effect**: Closer formant spacing + reduced radiation loss = more prominent single-peaked spectral prominence

### 4. Consonant Configurations (Section 2.6)

**Velar consonants**: F₂-F₃ proximity at ~2/3 distance from glottis to lips
- Creates midfrequency spectral prominence characteristic of velars
- Relatively insensitive to exact constriction position

**Pharyngeal consonants**: F₁ high, F₂ low and close to F₁
- Constriction in lower pharynx
- Pattern visible in Arabic /ʕ/ transitions

**Retroflex consonants**: F₃-F₄ proximity
- Space under tongue blade lengthens front cavity
- Back cavity length ~11.2 cm brings front-cavity resonance to F₃ region

**Alveolar/Labial consonants** ([+anterior]):
- Front cavity too short for resonance coupling with back cavity
- No perceptually significant spectral prominence from coupled resonators
- Classified as "diffuse" (Jakobson et al.) or [+anterior] (Chomsky & Halle)

## Turbulence Noise Generation (Section 3)

### Source Amplitude

**Airflow relation:**

$$
P_s = \frac{\rho U^2}{2A_g^2} + \frac{\rho U^2}{2A_c^2}
$$

Where:
- $P_s$ = subglottal pressure
- $\rho$ = air density
- $U$ = airflow
- $A_g$ = glottal area
- $A_c$ = supraglottal constriction area

**Noise source amplitude:**

$$
p_s = K U^3 A^{-5/2}
$$

Where $K$ depends on constriction shape and downstream obstacles (e.g., teeth).

### Key Finding: Broad Maximum in Noise Amplitude
- Noise source amplitude within 3 dB of maximum for constriction sizes 0.03-0.2 cm²
- Articulator can move continuously; no fixed position needed for constant noise
- Wall compliance further broadens this stable region

### Voiced Fricatives
- Simultaneous voicing + frication is **inherently unstable**
- Requires precise balance of glottal and supraglottal configurations
- Often produced with voicing only over portion of consonant interval

### Constriction Position Effects (Section 3.2)

**Optimal position for fricatives**: ~2-3 cm from lips (alveolar ridge)
- Maximizes high-frequency spectrum amplitude
- Lower teeth form obstacle enhancing turbulence (+20 dB possible)
- Creates [+strident] characteristic

**Front cavity resonance affiliation** changes with constriction position:
- Short front cavity → F₄ or F₅ affiliated (/s/)
- Longer front cavity → F₃ affiliated (/ʃ/)
- Velar region → F₂ affiliated

**Coronal vs. Non-coronal (Grave)** distinction:
- Coronals: Significant high-frequency energy from front-cavity resonance
- Labials/velars: No prominent high-frequency peak from front cavity

## Vocal-Fold Vibration (Section 4)

### Conditions for Vibration
- Glottal width < 2-3 mm
- Transglottal pressure > 2-3 cm H₂O
- Appropriate vocal fold stiffness/adduction

### Three Proposed Phonation Types

| Type | Configuration | Waveform | Spectrum |
|------|--------------|----------|----------|
| **Modal** | Folds touching along length | Abrupt closure, discontinuity in airflow | Baseline |
| **Breathy** | Posterior portion abducted | Sinusoidal component added (no posterior closure) | Enhanced low frequencies, reduced highs |
| **Pressed** | Tightly adducted, tissue compressed | Narrow pulses, long closed phase | Reduced low frequencies |

### Acoustic Correlates
- **Breathy**: Increased H1 amplitude (first harmonic prominence)
- **Pressed**: Reduced H1, spectrum energy shifted to higher frequencies
- Modal serves as baseline between these states

## Auditory Processing (Section 5)

### 5.1 Spectral Prominences

**Auditory nerve synchrony**:
- Narrow spectral prominence → fibers synchronize to prominence frequency ("capture")
- Broad spectrum → fibers synchronize to their characteristic frequencies

**Critical bandwidth comparison** (Figure 25):

| Frequency | Critical Bandwidth | Formant Bandwidth |
|-----------|-------------------|-------------------|
| 500 Hz | ~100 Hz | ~50-60 Hz |
| 1000 Hz | ~150 Hz | ~60-80 Hz |
| 2000 Hz | ~250 Hz | ~80-120 Hz |
| 3000 Hz | ~350 Hz | ~120-200 Hz |

Formant bandwidths typically **less than** critical bandwidths in 800-3000 Hz range → formants create captured auditory response.

### 5.2 Critical Distance: 3.5 Bark

**Chistovich's finding**: When two formants are within 3.5 Bark:
- Listeners match to a single intermediate frequency
- Perceived as single spectral prominence

When spacing > 3.5 Bark:
- Listeners match to one formant or show high variability
- Two separate peaks perceived

**Implications**:
- Back vowels: F₂ close to F₁ (within 3.5 Bark)
- Front vowels: F₂ close to F₃ (within 3.5 Bark)

### 5.3 F₁ Region Perception

**Vowel height boundary**: F₁ - F₀ ≈ 3.0-3.2 Bark
- Separates high vowels (/i, u, o/) from non-high vowels
- Perceptual boundary, not just articulatory

**Nasalization threshold**: 6-9 dB perturbation in F₁ region
- Pole-zero pair creating ~6 dB deviation perceived as nasal
- Language-independent (tested across language backgrounds)

**Breathiness threshold**: 5-8 dB increase in H1 amplitude
- Crossover for breathy/non-breathy judgments
- Note: For female F₀ range, enhanced H1 may be heard as nasalization instead

### 5.4 Sonorant vs. Non-Sonorant

**Low-frequency amplitude continuity**:
- Sonorant consonants: No dip in low-frequency amplitude at consonant-vowel boundary
- Non-sonorant consonants: Dip in low-frequency amplitude (pressure buildup reduces voicing amplitude)

**Perceptual boundary**: ~0 dB relative amplitude
- Nasal heard when low-frequency consonant amplitude ≥ vowel amplitude
- Stop heard when consonant amplitude < vowel amplitude

### 5.5 Continuant vs. Non-Continuant

**Onset transient** distinguishes stops/affricates from fricatives:
- Abrupt onset with overshoot → "pluck" category
- Rise time ≥ 15 ms → "bow" category
- Boundary is categorical, not continuous

### 5.6 Place of Articulation

**Coronal vs. Labial** (burst spectrum):
- Crossover at ~3 dB above vowel onset amplitude in high frequencies
- Coronals: Burst high-frequency amplitude > vowel onset
- Labials: Burst high-frequency amplitude < vowel onset

**Velar vs. Non-velar** (compactness):
- Velar: Single compact midfrequency prominence (3-5 dB below vowel F₂/F₃)
- Non-velar: Prominence absent or reduced

**[+anterior] vs. [-anterior]** (midfrequency prominence):
- [-anterior] (velars, palatals): Midfrequency prominence ~1-3 kHz
- [+anterior] (alveolars, labials): No such prominence

## Parameters Summary

| Parameter | Symbol | Typical Value | Notes |
|-----------|--------|---------------|-------|
| Vocal tract length | $l$ | 16 cm | Adult male |
| Average cross-sectional area | $A$ | 3 cm² | Volume ~50 cm³ |
| Minimum sonorant constriction | $A_c$ | 0.2-0.3 cm² | Below this: pressure buildup |
| Fricative constriction range | $A_c$ | 0.03-0.2 cm² | Stable noise amplitude region |
| Critical formant spacing | - | 3.5 Bark | Integration threshold |
| High vowel boundary | F₁-F₀ | 3.0-3.2 Bark | Perceptual threshold |
| Nasalization threshold | - | 6-9 dB | Perturbation in F₁ region |
| Breathiness threshold | H1 | +5-8 dB | First harmonic increase |
| Glottal vibration threshold | width | <2-3 mm | Beyond this: no vibration |
| Transglottal pressure threshold | P | >2-3 cm H₂O | Below this: no vibration |

## Implementation Notes

### For Formant Synthesis
1. **Vowel targets**: Use coupled-resonator analysis to understand why certain F1-F2-F3 patterns cluster
2. **Consonant transitions**: Formant proximity regions (F₂-F₃ for velars, F₃-F₄ for retroflex) should be preserved
3. **Rounding**: Creates formant proximity—model as single more-prominent peak when formants within 3.5 Bark

### For Fricative Synthesis
1. **Noise source position**: Model front-cavity resonance based on constriction location
2. **Amplitude stability**: Noise amplitude relatively constant across fricative constriction sizes
3. **Strident enhancement**: Include obstacle effect (+up to 20 dB at alveolar ridge)

### For Voice Source
1. **Three modes**: Modal, breathy, pressed have distinct spectral tilts
2. **H1 amplitude**: Key correlate for breathiness (but context-dependent)
3. **Voicing/frication**: Simultaneous generation is unstable—expect temporal separation

## Figures of Interest
- **Fig. 1 (p. 4)**: Core quantal relation schematic—Regions I, II, III
- **Fig. 3 (p. 7)**: Formant frequencies vs. back cavity length (coupled resonators)
- **Fig. 8 (p. 12)**: Non-low front vowel formant patterns
- **Fig. 11 (p. 13)**: Non-low back rounded vowel formant patterns
- **Fig. 19 (p. 22)**: Turbulence noise amplitude vs. constriction size (key stability result)
- **Fig. 21 (p. 25)**: Fricative radiated spectrum vs. constriction position
- **Fig. 24 (p. 28)**: Three phonation types: modal, breathy, pressed waveforms
- **Fig. 25 (p. 32)**: Critical bandwidth vs. formant bandwidth comparison

## Limitations
1. **Incomplete feature coverage**: Duration, tone, ATR, distributed features not fully explained by quantal relations
2. **Auditory processing uncertainty**: F₁ region processing (high, nasal, breathy features) not fully understood
3. **Cross-language variation**: Same features may have different acoustic implementations across languages
4. **Continuant feature**: Release transient details need more investigation

## Relevance to Qlatt Project

### Direct Applications
1. **Formant target selection**: Use coupled-resonator stability regions for vowel/consonant formant targets
2. **Fricative synthesis**: Model noise source with front-cavity resonance affiliation
3. **Transitions**: Understand why certain formant trajectories are more natural
4. **Perceptual priorities**: Focus on acoustic attributes that create quantal boundaries

### Feature Implementation Guidance
| Feature | Key Acoustic Correlate | Synthesis Priority |
|---------|----------------------|-------------------|
| [high] | F₁-F₀ < 3.0 Bark | Low F₁ relative to F₀ |
| [back] | F₂ close to F₁ (<3.5 Bark) | F₂ proximity to F₁ |
| [front] | F₂ close to F₃ (<3.5 Bark) | F₂ proximity to F₃ |
| [round] | F₁, F₂ lowered; formant proximity enhanced | Lower formants |
| [nasal] | Perturbation in F₁ region >6 dB | Add pole-zero near F₁ |
| [sonorant] | Low-freq amplitude continuous | No amplitude dip |
| [continuant] | No onset transient | Gradual onset |
| [coronal] | High-freq burst > vowel onset | Strong burst |
| [anterior] | No midfrequency prominence | Diffuse spectrum |
| [strident] | Enhanced high-freq noise | Obstacle effect |

## Open Questions
- [ ] How exactly does the 3.5 Bark integration manifest in neural processing?
- [ ] What determines the boundary between breathy perception and nasal perception for H1 enhancement?
- [ ] How do quantal relations apply to tonal features?
- [ ] What is the detailed acoustic structure of stop release transients?

## Related Work Worth Reading
- Fant, G. (1960) *Acoustic Theory of Speech Production* - Foundation for resonator analysis
- Chistovich et al. (1979) - Critical distance experiments
- Shadle, C. (1985) - Fricative acoustics (RLE Technical Report 506)
- Stevens & Keyser (1989) - Enhancement theory for consonants
- Liljencrants & Lindblom (1972) - Vowel space optimization
