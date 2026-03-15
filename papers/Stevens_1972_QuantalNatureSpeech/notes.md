# Stevens 1972/1989 — On the Quantal Nature of Speech

**Full citation:** Stevens, K. N. (1972). The quantal nature of speech: Evidence from articulatory-acoustic data. In E. E. David & P. B. Denes (Eds.), *Human Communication: A Unified View* (pp. 51-66). New York: McGraw-Hill.

**Expanded version (this PDF):** Stevens, K. N. (1989). On the quantal nature of speech. *Journal of Phonetics*, 17(1-2), 3-45.

The 1989 paper is a substantial expansion of the 1972 chapter, containing the same core theory with much more detailed articulatory-acoustic evidence.

## Core Theory: Quantal Relations

The articulatory-acoustic mapping is **non-monotonic**: for some ranges of an articulatory parameter, acoustic output changes very little (plateau regions), while at boundary regions between plateaus, small articulatory changes cause large acoustic shifts (quantal jumps).

### Schematic (Fig. 1)
- Region I: articulatory parameter varies, acoustic output relatively stable
- Region III: articulatory parameter varies, acoustic output relatively stable (different value)
- Region II (between I and III): small articulatory change produces large acoustic change
- Languages exploit this by placing phonological categories in the stable plateau regions (I and III), ensuring robust contrast despite articulatory imprecision

## Key Articulatory-Acoustic Domains

### 1. Coupled Resonators (Vocal Tract Constrictions) — Section 2.1

When the vocal tract has a constriction, it forms two coupled tubes. The natural frequencies depend on constriction position and cross-sectional area.

**Critical equations:**

For a tube of total length L divided into back cavity (length l_b) and front cavity (length l_f = L - l_c - l, where l_c = constriction length):

Back cavity natural frequencies (closed at constriction end):
```
F_n = (2n-1) * c / (4 * l_b)     [Eq. 1, quarter-wave resonance]
```

Front cavity (open at lips):
```
F_n = (2n-1) * c / (4 * l_f)     [quarter-wave]
```

When constriction cross-sectional area A_c is small relative to tube area A (but non-zero), natural frequencies of the coupled system shift from uncoupled values. At points of intersection (where uncoupled frequencies of back and front cavities are equal), the coupled frequencies show maximum separation.

**Key parameter:** When A_c/A >= 0.17, formant frequencies show stable regions. When l_c is in the vicinity of intersection points, formants are relatively insensitive to changes in l_c.

**Quantal behavior:**
- Constriction position near a resonance intersection: formants stable (plateau)
- Constriction position between intersections: formants change rapidly
- This creates natural stable regions for vowel articulation

### 2. Vowel Formant Patterns — Section 2.2-2.5

#### Low vowels (tongue body fronted, constriction in pharyngeal region)
- F1 is high and stable; F2 is relatively low and stable
- When constriction is in lower pharyngeal region: F1 maximum, F2 relatively insensitive

#### Non-low front vowels (constriction in palatal region)
- F1 is low and stable; F2 is high and close to F3
- Constriction at hard palate creates stable high F2

#### Non-low back rounded vowels
- F1 low and stable; F2 low (close to F1)
- Lip rounding + back constriction lowers formants
- Proximity of F1 and F2 creates merged spectral peak

#### High front vowels
- Constriction near palate: F2 and F3 converge (proximity)
- Stable merged F2-F3 spectral peak

#### Constriction size effects (Section 2.4)
- For low vowels: constriction area A_c in range 0.2-1.0 cm^2 gives relatively stable F1
- F1 maximum ~ 800 Hz when A_c ~ 0.5 cm^2
- As A_c decreases below ~0.2 cm^2, the formant frequencies become sensitive to constriction size changes
- For high vowels: narrower constriction (< 0.2 cm^2) produces stable low F1

### 3. Turbulence Noise at a Constriction — Section 3

**Noise source amplitude** (from Fant 1960, Shadle 1985):

Turbulence noise generated at a constriction. The transfer function from source to output:
```
p_s = K * U^3 / A_c     [basic noise source pressure]
```
where:
- p_s = source sound pressure
- K = constant depending on constriction geometry
- U = volume velocity
- A_c = constriction cross-sectional area

For a supraglottal constriction with subglottal pressure P_s:
```
Noise amplitude ~ P_s * A_c^(1/2) * (A_g / A_c)
```
where A_g = glottal area.

**Quantal behavior of noise:**
- When constriction A_c is large (open vowel): noise amplitude is low, insensitive to A_c
- When A_c decreases below ~0.1-0.2 cm^2: noise amplitude increases dramatically
- Maximum noise at very narrow constriction
- The transition from "no significant noise" to "strong noise" is abrupt — quantal

**Spectral peak prominence:**
- For fricative consonants, the turbulence noise source spectrum exhibits a spectral peak
- The frequency of this peak is related to distance d from constriction to nearest downstream obstacle
- For sibilants: peak at ~4-5 kHz (short front cavity)
- For non-sibilants: peak at lower frequencies (longer front cavity)

### 4. Vocal Fold Vibration — Section 4

**Phonation onset/offset is quantal:**
- Vocal folds vibrate when stiffness, mass, and subglottal pressure are in appropriate ranges
- Below ~2-3 cm H2O subglottal pressure: no vibration
- Above threshold: vibration onset
- The transition is abrupt (quantal jump between no voicing and voicing)

**Modes of vibration:**
- Modal voice vs. pressed/breathy: determined by glottal configuration
- Pressed phonation: increased amplitude of fundamental component, vocal folds tightly adducted
- Breathy phonation: reduced spectral amplitude, glottal pulses with reduced peak airflow, relatively long closed phase

### 5. Auditory Processing — Section 5.1

**Spectral prominences and auditory-nerve fibers:**
- Auditory nerve fibers synchronize to the frequency of spectral peaks
- When a formant peak is prominent (well-separated from neighbors), auditory fibers at that frequency synchronize strongly
- When two formant peaks are close together: they may be perceived as a single merged peak
- Critical distance between formants: ~3-3.5 Bark

**Formant bandwidth effects:**
- Bandwidths of formants for vowels are usually less than the bandwidth of auditory filters (at frequencies up to ~3 kHz, auditory filter bandwidth ~ 135 Hz)
- Conventionally accepted bandwidths for formants (Fant 1972):
  - F1: ~50 Hz for adult male
  - F2: ~70 Hz
  - F3: ~110 Hz
  - Higher formants: proportionally wider
- At lower frequencies, formant bandwidths also fall below critical bandwidths for most naturally voiced sounds
- Wider effective bandwidths can be achieved for nasal vowels, breathy-voiced vowels, and possibly for vowels produced with open glottis

### 5.2 Perceptual Boundaries — F1 proximity

- F1-F2 spacing: when F1 and F2 are close (within ~3 Bark), they create merged spectral prominence
- Perceptual boundary between vowel categories at approximately F1 = 3 Bark from F2
- For English: boundary separating /I/ from non-high vowels corresponds to F1 ~ 400 Hz

### 6. Consonant Place of Articulation — Section 5.3

**Labial consonants:**
- Constriction at lips: front cavity very short
- Burst spectrum: relatively flat or falling
- F2 transition: lowering

**Alveolar consonants:**
- Constriction at alveolar ridge: front cavity ~2-3 cm
- Burst: high-frequency spectral peak (~4 kHz)
- Stable spectral peak regardless of vowel context

**Velar consonants:**
- Constriction position varies with vowel context (fronted before front vowels, backed before back vowels)
- Burst: mid-frequency spectral peak, variable
- F2 and F3 converge near the burst (compact spectrum)

## Implementation Relevance for Klatt Synthesizer

### Formant Target Selection
- **Vowel targets should be in stable (plateau) regions** — small perturbations in articulatory parameters should not affect acoustic output significantly
- The quantal theory predicts that natural vowel systems cluster formants in regions of articulatory-acoustic stability
- For synthesis: use formant targets from the stable regions identified in the coupled-resonator analysis

### Consonant Transitions
- Formant transitions into/out of consonant closures reflect the rapid (quantal) change region
- Transition duration and extent should reflect the constriction dynamics
- Velar consonants: F2-F3 convergence is a key cue (the "velar pinch")

### Noise Source Parameters
- Frication noise amplitude should show quantal onset as constriction narrows
- AF parameter: should transition sharply from 0 to significant values as constriction crosses the turbulence threshold (~0.1-0.2 cm^2)
- Spectral shaping of frication: front-cavity resonance determines spectral peak

### Voicing Parameters
- AV onset/offset should be modeled as relatively abrupt (quantal)
- The transition from breathy to modal phonation can be gradual but the onset of periodic vibration is quantal

### Proximity Effects
- When F1 and F2 are close (back rounded vowels): implement spectral peak merging
- When F2 and F3 are close (front vowels, retroflex): implement spectral peak merging
- The `proximity()` builtin function in the Qlatt codebase implements exactly this kind of formant-proximity correction

### Parameter Sensitivity
- In plateau regions: parameters can tolerate imprecision without perceptual consequences
- In quantal-jump regions (transitions): parameters must be precisely controlled
- This has implications for interpolation during formant transitions — more precision needed at boundaries

## Key Figures

- **Fig. 1**: Schematic of quantal articulatory-acoustic relation (plateau-jump-plateau)
- **Fig. 3**: Natural frequencies of coupled resonator system as function of constriction position — shows intersection points where formants are stable
- **Fig. 5**: Same with A_c = 0.2 cm^2 — shows more realistic coupled-tube behavior
- **Fig. 7**: Constriction size effects — shows F1 maximum ~800 Hz at A_c ~0.5 cm^2
- **Fig. 11**: Natural frequencies for back-cavity constriction showing F1-F2 proximity for back rounded vowels
- **Fig. 13**: Spectrograms showing F2-F3 proximity for front vowels and retroflex
- **Fig. 19**: Turbulence noise amplitude vs. constriction area — demonstrates quantal noise onset
- **Fig. 21**: Calculated spectra of radiated sound for fricative constriction — shows spectral peak from front-cavity resonance
- **Fig. 25**: Formant bandwidths as function of frequency — shows that formant bandwidths are narrower than auditory filter bandwidths
