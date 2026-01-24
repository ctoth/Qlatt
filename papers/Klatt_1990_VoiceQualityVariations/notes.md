# Klatt & Klatt 1990 - Voice Quality Variations Analysis

## Bibliographic Information
- **Title**: Analysis, synthesis, and perception of voice quality variations among female and male talkers
- **Authors**: Dennis H. Klatt, Laura C. Klatt
- **Publication**: J. Acoust. Soc. Am. 87(2), February 1990
- **Pages**: 820-857
- **Institution**: Research Laboratory of Electronics, MIT

## Paper Type
Comprehensive research paper combining acoustic analysis, synthesizer design, and perceptual validation for voice quality modeling.

---

## 1. Core Contribution

This paper introduces the **KLSYN88 formant synthesizer** with a new voicing source model **KLGLOTT88** that enables accurate synthesis of voice quality variations (breathy to laryngealized) for both male and female voices.

### Key Findings
1. **Aspiration noise is perceptually most important** for signaling breathiness - contrary to previous research emphasizing H1 amplitude
2. Females are more breathy than males on average, but large individual variation exists
3. Many utterances end in "breathy-laryngealized" mode
4. Diplophonia and timing irregularities contribute to naturalness

---

## 2. Voice Quality Physiology

### Glottal Configurations (Figure 1)

| Mode | Arytenoid Position | Open Quotient | H1 Amplitude | Noise |
|------|-------------------|---------------|--------------|-------|
| Laryngealized | Closed/compressed | ~30% | Reduced | Minimal |
| Modal | Nearly approximated | 50-60% | Normal | Minimal |
| Breathy | Posterior separation | 70-80%+ | Increased | Strong aspiration |

### Acoustic Cues to Breathiness
1. **Increased H1 amplitude** - due to longer open quotient
2. **Aspiration noise** - replaces higher harmonics (>1.5 kHz)
3. **Increased F1 bandwidth** - due to glottal losses
4. **Tracheal pole-zeros** - acoustic coupling to subglottal system

---

## 3. KLGLOTT88 Voicing Source Model

### Block Diagram Components
```
[F0, AV, OQ, FL, DI] -> Basic Voicing Waveform (at²-bt³)
                     -> Spectral Tilt Low-Pass [TL]
                     -> Sum with Aspiration [AH]
                     -> Output
```

### Source Control Parameters

| Parameter | Description | Range | Default |
|-----------|-------------|-------|---------|
| **F0** | Fundamental frequency | 0-5000 | 1000 (tenths Hz) |
| **AV** | Amplitude of voicing | 0-80 dB | 60 |
| **OQ** | Open quotient | 10-99% | 50 |
| **SQ** | Speed quotient (LF only) | 100-500% | 200 |
| **TL** | Spectral tilt | 0-41 dB | 0 |
| **FL** | Flutter | 0-100% | 0 |
| **DI** | Diplophonia | 0-100% | 0 |
| **AH** | Aspiration amplitude | 0-80 dB | 0 |

### Glottal Waveform Equation

During the open phase:
```
Ug(t) = at² - bt³
```
Where a and b depend on AV and open period duration.

### Flutter Formula (Equation 1)

```
Δf₀ = (FL/50)(F0/100)[sin(2π·12.7·t) + sin(2π·7.1·t) + sin(2π·4.7·t)] Hz
```

Frequencies 12.7, 7.1, 4.7 Hz chosen to ensure long period before repetition. FL=25% produces realistic pitch variation.

### Diplophonia (DI Parameter)

When DI > 0, alternate pulses are:
- **Delayed** in time (max: closure of first pulse coincides with opening of next)
- **Attenuated** in amplitude (linear scale from 1 to 0 as DI: 0%-100%)

Example: OQ=50%, DI=50% → first pulse delayed by quarter period, attenuated by half (-6 dB)

---

## 4. KLSYN88 Synthesizer Architecture

### Three Voicing Source Options
1. Old KLSYN impulsive source (SS=1)
2. KLGLOTT88 model (SS=2, **default**)
3. Modified LF model (SS=3)

### Vocal Tract Models

**Cascade Branch** (for laryngeal sources):
```
Nasal Pole-Zero → Tracheal Pole-Zero → F1 → F2 → F3 → F4 → F5 → Output
```

**Parallel Branch** (for frication):
```
Source → [F2, F3, F4, F5, F6, Bypass] → Sum → Output
```

### New Features Added to KLSYN
1. Tracheal pole-zero pair (FTP, FTZ, BTP, BTZ)
2. Pitch-synchronous F1/B1 changes (DF1, DB1)
3. Modified LF source option

---

## 5. Constant Control Parameters (Table XI)

| Symbol | Description | Min | Default | Max |
|--------|-------------|-----|---------|-----|
| DU | Duration (ms) | 30 | 500 | 5000 |
| UI | Update interval (ms) | 1 | 5 | 20 |
| SR | Sample rate (samples/s) | 5000 | 10000 | 20000 |
| NF | Number of cascade formants | 1 | 5 | 6 |
| SS | Source switch | 1 | 2 | 3 |
| RS | Random seed | 1 | 8 | 8191 |
| SB | Same noise burst | 0 | 1 | 1 |
| CP | Cascade(0)/Parallel(1) | 0 | 0 | 1 |
| OS | Output selector | 0 | 0 | 20 |
| GV | Gain for AV (dB) | 0 | 60 | 80 |
| GH | Gain for AH (dB) | 0 | 60 | 80 |
| GF | Gain for AF (dB) | 0 | 60 | 80 |

---

## 6. Time-Varying Parameters (Table XII)

### Source Parameters
| Symbol | Description | Min | Default | Max |
|--------|-------------|-----|---------|-----|
| F0 | Fundamental freq (0.1 Hz) | 0 | 1000 | 5000 |
| AV | Voicing amplitude (dB) | 0 | 60 | 80 |
| OQ | Open quotient (%) | 10 | 50 | 99 |
| SQ | Speed quotient (%) | 100 | 200 | 500 |
| TL | Spectral tilt (dB @ 3kHz) | 0 | 0 | 41 |
| FL | Flutter (%) | 0 | 0 | 100 |
| DI | Diplophonia (%) | 0 | 0 | 100 |
| AH | Aspiration (dB) | 0 | 0 | 80 |
| AF | Frication (dB) | 0 | 0 | 80 |

### Formant Parameters
| Symbol | Description | Min | Default | Max |
|--------|-------------|-----|---------|-----|
| F1 | First formant (Hz) | 180 | 500 | 1300 |
| B1 | F1 bandwidth (Hz) | 30 | 60 | 1000 |
| DF1 | F1 change during open phase | 0 | 0 | 100 |
| DB1 | B1 change during open phase | 0 | 0 | 400 |
| F2 | Second formant (Hz) | 550 | 1500 | 3000 |
| B2 | F2 bandwidth (Hz) | 40 | 90 | 1000 |
| F3 | Third formant (Hz) | 1200 | 2500 | 4800 |
| B3 | F3 bandwidth (Hz) | 60 | 150 | 1000 |
| F4 | Fourth formant (Hz) | 2400 | 3250 | 4990 |
| B4 | F4 bandwidth (Hz) | 100 | 200 | 1000 |
| F5 | Fifth formant (Hz) | 3000 | 3700 | 4990 |
| B5 | F5 bandwidth (Hz) | 100 | 200 | 1500 |

### Nasal Parameters
| Symbol | Description | Min | Default | Max |
|--------|-------------|-----|---------|-----|
| FNP | Nasal pole freq (Hz) | 180 | 280 | 500 |
| BNP | Nasal pole BW (Hz) | 40 | 90 | 1000 |
| FNZ | Nasal zero freq (Hz) | 180 | 280 | 800 |
| BNZ | Nasal zero BW (Hz) | 40 | 90 | 1000 |

### Tracheal Parameters
| Symbol | Description | Min | Default | Max |
|--------|-------------|-----|---------|-----|
| FTP | Tracheal pole freq (Hz) | 300 | 2150 | 3000 |
| BTP | Tracheal pole BW (Hz) | 40 | 180 | 1000 |
| FTZ | Tracheal zero freq (Hz) | 300 | 2150 | 3000 |
| BTZ | Tracheal zero BW (Hz) | 40 | 180 | 2000 |

### Parallel Formant Amplitudes (Frication)
| Symbol | Description | Min | Default | Max |
|--------|-------------|-----|---------|-----|
| A2F-A6F | Formant amplitudes (dB) | 0 | 0 | 80 |
| AB | Bypass amplitude (dB) | 0 | 0 | 80 |
| B2F-B6F | Formant bandwidths (Hz) | varies | varies | varies |

### Parallel Formant Amplitudes (Voicing)
| Symbol | Description | Min | Default | Max |
|--------|-------------|-----|---------|-----|
| ANV | Nasal formant (dB) | 0 | 0 | 80 |
| A1V-A4V | Formant amplitudes (dB) | 0 | 60 | 80 |
| ATV | Tracheal formant (dB) | 0 | 0 | 80 |

---

## 7. Tracheal Pole-Zero Frequencies (Table VII)

### Female Speakers (Median)
| Resonance | Pole (Hz) | Zero (Hz) |
|-----------|-----------|-----------|
| 1st | (750) | 900 |
| 2nd | 1650 | 1800 |
| 3rd | 2350 | 2200 |
| 4th | (3150) | (3100) |

### Male Speakers (Median)
| Resonance | Pole (Hz) | Zero (Hz) |
|-----------|-----------|-----------|
| 2nd | 1550 | 1800 |
| 3rd | 2200 | 2050 |
| 4th | 3275 | 3000 |

---

## 8. H1 Amplitude Data (Tables II, III)

### Gender Differences
- **Female average H1-H2**: 11.9 dB
- **Male average H1-H2**: 6.2 dB
- **Difference**: ~5.7 dB (females more breathy)

### Individual Variation
- Most breathy female (CB): 17.1 dB
- Least breathy female (SH): 8.4 dB
- Range: 12.5 dB across all speakers

### Position Effects
- Final syllable: ~2-2.5 dB weaker (laryngealization during f₀ fall)
- [ʔɑ] vs [hɑ]: Little difference at vowel midpoint

---

## 9. Noise in F3 Analysis (Tables V, VI)

### Rating Scale
1. Periodic, no visible noise
2. Periodic but occasional noise intrusion
3. Weakly periodic, clear noise evidence
4. Little/no periodicity, noise prominent

### Results
- **Female average**: 2.7
- **Male average**: 1.7
- Noise increases toward utterance end
- Noise increases for unstressed syllables
- Unstressed vs stressed difference: 0.6 units
- Final position effect: 0.55 units

---

## 10. Source-Tract Interactions

### F1 Ripple in Source
- Pharyngeal pressure fluctuations affect Ug(t)
- Standing wave causes "ripple" at F1 frequency
- Waveform changes over first 2-3 periods of onset

### Nonlinear F1-f₀ Interaction
- Glottal source strength may increase when F1 ≈ n × f₀
- Favorable phase relationship enhances closure

### F1 Truncation
- Time-varying glottal impedance affects B1
- B1 increases substantially during open phase
- Can be approximated by constant equivalent bandwidth OR pitch-synchronous changes

### Tracheal Coupling
- Provides extra pole-zero pairs in breathy vowels
- Typical locations: ~550, 1300, 2100 Hz (females)
- Zero usually immediately below corresponding pole

---

## 11. Synthesis Parameter Values

### Normal vs Breathy Voice (Speaker LK)
| Parameter | Normal | Breathy |
|-----------|--------|---------|
| AV | 60 | 60 |
| OQ | 60 | 80 |
| TL | 8 | 24 |
| AH | 0-40 | 52 |
| DI | 0 | 0 |
| FL | 25 | 25 |

### Glottalized Onset/Offset
- Rapid f₀ fall (~30 ms)
- AV reduced ~6 dB at lowest f₀
- OQ reduced to ~30%
- AH and TL reduced

### Breathy-Laryngealized Mode
- Increased noise (posterior opening)
- OQ NOT increased (medial compression maintained)
- DI may be present

---

## 12. Perceptual Experiment Results (Table XV)

### Breathiness Ratings (0-5 scale)
| Manipulation | Average Rating |
|--------------|----------------|
| H1 boosted 6 dB | 0.92 |
| H1 boosted 10 dB | 1.26 |
| f₀ lowered | 0.04 |
| Bandwidths increased | 0.46 |
| TL = 15 dB | 1.00 |
| TL = 25 dB | 1.36 |
| AH = 54 dB | 1.14 |
| **AH = 60 dB** | **2.88** |
| TL=15 + AH=55 | 2.70 |
| TL=20 + AH=50 | 2.64 |
| **All cues combined** | **3.76** |

### Key Findings
1. **Aspiration noise most important single cue**
2. H1 increase alone → nasality percept (at high f₀)
3. Bandwidth increase alone → nasal + unnatural
4. All cues combined → most breathy AND natural
5. Nasality judgments depend on cue combinations

---

## 13. Implementation Notes for Qlatt

### Critical Parameters to Implement
1. **OQ** - Open quotient (affects H1 amplitude)
2. **TL** - Spectral tilt (attenuates higher harmonics)
3. **AH** - Aspiration noise (most important perceptual cue)
4. **FL** - Flutter (naturalness)
5. **DI** - Diplophonia (for certain voice qualities)

### Waveform Generation
```javascript
// During open phase (0 to OQ*T0):
// Ug(t) = a*t² - b*t³
// where a,b set by AV and open duration

// Spectral tilt: low-pass filter with cutoff based on TL
// TL = dB down at 3 kHz

// Aspiration: add noise with ~flat spectrum
// Modulate by glottal state if voicing present
```

### Tracheal Coupling Strategy
1. Pick most prominent tracheal resonance
2. Move FTP and FTZ together to observed pole frequency
3. Gradually separate FTZ downward over ~50 ms for abduction
4. Can use nasal pole-zero for second tracheal resonance

### Pitch-Synchronous Changes
```javascript
// During open phase of each period:
F1_actual = F1 + DF1;
B1_actual = B1 + DB1;

// Example for low vowel:
// B1 = 50 Hz (closed), DB1 = 400 Hz
// Equivalent constant B1 ≈ 90 Hz
```

---

## 14. Key Equations Summary

### Glottal Waveform
```
Ug(t) = at² - bt³   (open phase)
```

### Flutter
```
Δf₀ = (FL/50)(F0/100)[sin(2π·12.7t) + sin(2π·7.1t) + sin(2π·4.7t)] Hz
```

### Source Spectrum
- Normal: -12 dB/octave average
- Breathy: -18+ dB/octave (tilted)
- H1 prominence increases with OQ

### Aspiration Spectrum
- Source: -6 dB/octave
- After radiation: essentially flat

---

## 15. Male/Female Differences Summary

| Characteristic | Female | Male |
|----------------|--------|------|
| Average f₀ | 1.7× male | Reference |
| Average OQ | Slightly larger | ~50% |
| H1-H2 | +6 dB | Reference |
| Noise in F3 | 2.7 (scale 1-4) | 1.7 |
| Tracheal poles | ~50 Hz higher | Reference |
| 80% have visible posterior aperture | 20% | |

---

## 16. References for Implementation

### Primary Sources
- Klatt 1980 - Original KLSYN synthesizer
- Fant et al. 1985 - LF model
- Rosenberg 1971 - at²-bt³ waveform

### Related Papers
- Fischer-Jorgensen 1967 - Gujarati breathy vowels
- Ladefoged & Antoñanzas-Barroso 1985 - Breathiness measures
- Holmberg et al. 1988 - Glottal flow measurements

---

## Document Metadata
- **Created**: 2026-01-23
- **Source PDF**: Klatt-1990-JAS000820.pdf
- **Relevance to Qlatt**: High - documents KLSYN88 synthesizer which is reference implementation
