---
title: "Heinz & Stevens 1961 — On the Properties of Voiceless Fricative Consonants"
year: 1961
---

# Heinz & Stevens 1961 — On the Properties of Voiceless Fricative Consonants

## Implementation-Relevant Notes

### Core Model: Fricative Production as Poles and Zeros

The transfer function for fricative consonants is:

```
T(s) = P(s) * R(s) * Z(s)
```

Where:
- **P(s)**: poles (natural frequencies of vocal tract) — same as vowel with same configuration
- **R(s)**: radiation characteristic
- **Z(s)**: zeros — dependent on noise source position, unique to fricatives

Key insight: fricative spectra share the same poles as a vowel produced with the same vocal-tract shape, but add zeros (antiresonances) at frequencies where the impedance looking back from the noise source is infinite.

### Source Characteristics

- Fricative noise source is a **constant-pressure source** (not constant-velocity like glottal source)
- Source is located **within the vocal tract** at the constriction, not at the glottis
- Source has **low internal acoustical impedance** and **relatively broad spectrum**
- Additional damping from: turbulence losses at constriction + glottal losses (glottis more open than for vowels)

### Pole-Zero Cancellation Mechanism

Below the frequency where constriction length = lambda/4, pole-zero pairs tend to cancel each other. Above this frequency, there are more poles than zeros, creating the characteristic formant structure.

Alternative view: when the constriction is narrow, coupling to back cavities is small. The output spectrum is approximately determined by **front cavities and constriction only**, with antiresonances contributed by the constriction.

### Idealized /s/ Model (Fig. 3)

- Constriction: 2.5 cm long, 0.2 cm^2 cross-section
- Front (mouth) cavity: 1 cm long
- Source at junction of constriction and front cavity
- Below 10 kHz: **2 poles, 1 zero**
  - Pole 1 (constriction lambda/2): ~6800 Hz
  - Pole 2 (front cavity lambda/4): ~8600 Hz
  - Zero (constriction lambda/4): ~3400 Hz

### Table I: Pole and Zero Frequencies and Bandwidths (Hz)

Measured by matching electric circuit spectra against natural speech (Hughes & Halle data, one speaker). All spectra matched with **2 poles + 1 zero**.

#### /sh/ (postalveolar fricative)

| Context | Pole 1 freq | Pole 1 BW | Pole 2 freq | Pole 2 BW | Zero freq | Zero BW |
|---------|-------------|-----------|-------------|-----------|-----------|---------|
| sheep   | 2400        | 400       | 5400        | 1100      | 3400      | 1800    |
| shack   | 2200        | 600       | 5100        | 1000      | 3900      | 1500    |
| sure    | 2500        | 500       | 4300        | 1100      | 3400      | 1400    |
| bush    | 2200        | 400       | 4900        | 1100      | 3800      | 1400    |
| leash   | 2400        | 500       | 4800        | 900       | 3700      | 1400    |
| lush    | 2700        | 600       | 5400        | 900       | 4400      | 1600    |

**Summary /sh/**: Pole 1 = 2200-2700 Hz, Pole 2 = 4300-5400 Hz, Zero = 3400-4400 Hz

#### /s/ (alveolar fricative)

| Context | Pole 1 freq | Pole 1 BW | Pole 2 freq | Pole 2 BW | Zero freq | Zero BW |
|---------|-------------|-----------|-------------|-----------|-----------|---------|
| sect    | 6400        | 900       | 8000        | 1400      | 2900      | 1100    |
| soothe  | 3500        | 600       | 8100        | 700       | 2700      | 1100    |
| salve   | 5700        | 800       | 8000        | 1200      | 2900      | 1100    |
| moose   | 4000        | 600       | 8000        | 600       | 3300      | 1000    |
| niece   | 4900        | 700       | 8400        | 1100      | 2400      | 1300    |
| bus     | 4600        | 800       | 8000        | 800       | 2300      | 1100    |

**Summary /s/**: Pole 1 = 3500-6400 Hz, Pole 2 = 8000-8400 Hz, Zero = 2300-3300 Hz

#### /f/ (labiodental fricative)

| Context | Pole 1 freq | Pole 1 BW | Pole 2 freq | Pole 2 BW | Zero freq | Zero BW |
|---------|-------------|-----------|-------------|-----------|-----------|---------|
| fear    | 7900        | 900       | 8200        | 900       | 6800      | 600     |
| cuff    | 8400        | 1000      | 12200       | 1000      | 5900      | 1100    |
| aloof   | 6800        | 1000      | 9000        | 1100      | 4600      | 1000    |

**Summary /f/**: Pole 1 = 6800-8400 Hz, Pole 2 = 8200-12200 Hz, Zero = 4600-6800 Hz

### /sh/ Spectral Modeling Detail

For /sh/, an additional circuit was needed to provide a sharp cut-off below 3000 Hz (+18 dB/octave rising slope up to 3000 Hz, flat above). This compensates for a pole-zero pair in the actual spectrum: zero near 900 Hz, pole (F2 of vocal tract) near 2000 Hz.

### Simplified Synthesis Model

A circuit with **1 pole + 1 zero** (instead of 2 poles + 1 zero) produces reasonably good approximations to measured fricative spectra, at least up to somewhat above the first major peak.

Key simplification: **zero frequency is roughly one octave below pole frequency**.

### Perceptual Results — Isolated Fricatives (Fig. 8)

Resonant frequency determines fricative identity:
- ~2000-3000 Hz: perceived as /sh/
- ~3000-5000 Hz: perceived as /s/
- ~5000-8000 Hz: perceived as /f/ or /th/ (listeners could not distinguish /f/ from /th/ in isolation)

Bandwidth had **no significant effect** on identification over a 2:1 range.

Addition of low-frequency noise to high-resonance stimuli slightly increased /f,th/ responses at expense of /s/.

### Perceptual Results — Fricative-Vowel Syllables (Figs. 10-11)

Test parameters:
- Resonant frequencies: 2500, 3500, 5000, 6500, 8000 Hz
- Bandwidths: 400, 600, 800, 1000, 1500 Hz (at respective frequencies)
- Fricative-to-vowel level: -5, -15, -25 dB
- F2 transition loci: L=900, M=1700, H=2400 Hz
- Duration of fricative: ~200 ms
- Formant transitions began 25 ms before voicing onset

Key findings:
- **/sh/** always associated with resonant freq ~2500 Hz regardless of transitions
- **/s/** responses obtained for resonant freq > 3000 Hz
- **/f/ vs /th/** distinguished primarily by F2 transition:
  - /f/: low F2 locus (~900 Hz) — labio-dental configuration
  - /th/: high F2 locus (~2400 Hz) — dental configuration
- F2 transition loci consistent with articulatory place:
  - Low F2 (~1000 Hz): bilabial/labio-dental
  - Mid F2 (1500-2000 Hz): alveolar
  - High F2 (>2000 Hz): palatal
- Formant transitions had less effect on /s/ and /sh/ identification
- Lower fricative intensity relative to vowel shifted boundaries

### Implementation Guidance for Klatt Synthesizer

1. **Fricative source**: noise-excited, constant-pressure (not volume-velocity)
2. **Spectral shaping**: minimum viable model is 1 pole + 1 zero, with zero ~1 octave below pole
3. **Place-dependent resonance frequencies**:
   - /sh/: first pole ~2200-2700 Hz
   - /s/: first pole ~3500-6400 Hz (context-dependent)
   - /f/: first pole ~6800-8400 Hz
4. **Bandwidths** are wide (400-1800 Hz) — wider than vowel formants due to turbulence and glottal losses
5. **F2 transition loci** are important for /f/ vs /th/ distinction
6. **Relative level** of fricative to vowel matters (tested -5 to -25 dB)
7. For /sh/: need additional low-frequency attenuation (sharp cutoff below ~3000 Hz)
8. For /f/: may need additional uncoupled low-frequency noise (turbulence at lips)

## Collection Cross-References

### Already in Collection

- `Fant_1960_AcousticTheorySpeechProduction` — Fant 1960 is cited for acoustic theory foundation; pole-zero framework for fricative modeling
- `Hughes_1956_SpectralPropertiesFricatives` — Hughes & Halle 1956 is the direct source of the fricative spectra analyzed and modeled in this paper

### Cited By (in Collection)

- `Shadle_1985_FricativeAcoustics` — Cites Heinz & Stevens 1961 for pole-zero model of fricative production
- `Jongman_2000_FricativeAcoustics` — References Heinz & Stevens for fricative acoustic theory
- `Jongman_1989_FricativeDuration` — Cites Heinz & Stevens for fricative spectral properties
- `Behrens_Blumstein_1988_FricativeAmplitude` — References Heinz & Stevens for fricative perceptual cues
- `Stevens_1971_AirflowTurbulenceNoise` — Cites Heinz & Stevens for noise source properties in fricatives
- `Stevens_1991_HL_Parameters` — References Heinz & Stevens for fricative pole-zero analysis
- `Fujimura_1962_NasalConsonantAnalysis` — Cites Heinz & Stevens for pole-zero modeling approach applied to nasal consonants
- `Monson_2014_HighFrequencyVoice` — References for high-frequency spectral data

### New Leads (Not Yet in Collection)

- Harris, K. S. (1958). "Cues for the discrimination of American English fricatives in spoken syllables." Language and Speech 1, 1. — Fricative perception cues including transitions
- Delattre, P. C., Liberman, A. M., & Cooper, F. S. (1955). JASA 27, 769-773. — F2 locus theory for consonant place

### Conceptual Links (not citation-based)

- `Hughes_1956_SpectralPropertiesFricatives` — Companion study: Hughes & Halle 1956 provides empirical spectral measurements; Heinz & Stevens 1961 provides the pole-zero acoustic theory explaining those measurements
- `Stevens_1978_InvariantCuesPlaceArticulation` — Stevens is co-author of both; the invariant spectral template approach for stops parallels the pole-zero modeling of fricative spectra
