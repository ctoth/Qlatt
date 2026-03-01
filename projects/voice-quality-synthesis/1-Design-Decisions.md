## 1. Design Decisions

### 1.1 Canonical Parameters

**Primary Control: Rd (0.3-2.7)**

The single canonical parameter for voice quality control is **Rd** (Fant 1995). This decision resolves competing approaches:

| Approach | Source Plan | Resolution |
|----------|-------------|------------|
| Rd directly | fant1997, voice-quality-fa | **Adopted** - Single parameter derives all LF coefficients |
| Fa override | voice-quality-fa | Rejected - Redundant; Fa derivable from Rd |
| Rate-based (0-100) | Burkhardt 2009 | Rejected - Maps to Rd internally anyway |
| OQ/TL/AH explicit | Gobl 2003 | Reserved for emotion presets only |

**Rationale** (citing vanDinther 2001, 2004):
- LF model is perceptually "effectively 1-2 parameters"
- Ra (→ spectral tilt via Fa) carries most perceptual weight
- 4.3 dB EPD = 1 JND - don't over-parameterize
- Rd bundles Ra, Rk, Rg coherently

**Secondary Parameters:**

| Parameter | Purpose | When Used |
|-----------|---------|-----------|
| `effort` | Vocal effort modulation (dB) | Always - stress/loudness |
| `emotion` | Emotion preset selector | Optional - style control |
| `AH` | Aspiration noise amplitude | Breathiness reinforcement |
| `jitter` | F0 micro-perturbation | Creaky/rough voice only |

**Important Finding (France 2000):**

F0 features are **surprisingly ineffective** as discriminators of emotional/affective state. In a multivariate classification study (control vs. depressed vs. suicidal speech), formant frequencies and power spectral density features achieved 75-94% accuracy, while F0 features contributed little discriminative power.

**Implication:** The perceptual quality of "flat affect" or emotional speech comes more from:
- Formant frequency shifts (F1, F2, F3 elevation in sad/depressed)
- Formant bandwidth changes (FBW1 wider, FBW2/FBW3 narrower)
- Spectral tilt (power distribution shift)

...rather than from F0 flatness alone. This suggests emotion presets should prioritize **formant modulation over F0 scaling** for perceptual effectiveness.

### 1.2 Factor Combination Model

Voice quality emerges from **five additive factors** applied to a base Rd:

```
Rd_final = Rd_base + ΔRd_phoneme + ΔRd_stress + ΔRd_effort + ΔRd_emotion + ΔRd_phrase
```

**Factor Combination Rules:**

1. **Base Rd** - Speaker-dependent default (male: 0.7, female: 1.4) [Fant 1997]
2. **Phoneme ΔRd** - Additive offset per segment type [Fant 1997 Table]
3. **Stress ΔRd** - Subtractive for stress (more adducted) [Fant 1997, Cummings 1995]
4. **Effort ΔRd** - Derived from effort via inverse relationship [Liénard 1999]
5. **Emotion ΔRd** - Preset offset [Cummings 1995, Gobl 2003]
6. **Phrase ΔRd** - Contour over utterance [Fant 1997]

**Clamping:** Final Rd clamped to [0.3, 2.7] per LF model constraints.

**Saturation:** No multiplicative stacking. Each factor is capped independently before summation to prevent runaway values:

| Factor | Max |ΔRd| | Notes |
|--------|-----|-------|
| Phoneme | ±1.2 | HH (breathy [h]) at limit |
| Stress | ±0.3 | |
| Effort | ±0.5 | |
| Emotion | ±0.7 | |
| Phrase | ±0.5 | |

*Note: The phoneme cap was raised from ±1.0 to ±1.2 to accommodate HH, which requires maximum laryngeal abduction (breathiness). See §2.1 in Parameter Specifications.*

### 1.3 Speaker Configuration

**Required for Clinical Presets:**

The `speakerSex` parameter is **MANDATORY** when using clinical mood state presets (manic, depressive). This is due to the complete inversion of acoustic patterns between sexes discovered by Kaczmarek-Majer et al. (2024).

```javascript
// Speaker configuration schema
const speakerConfig = {
  // REQUIRED for clinical affect states (Kaczmarek-Majer 2024)
  // Male and female patterns INVERT for mania
  speakerSex: 'male' | 'female',  // MANDATORY for clinical presets

  // Voice quality baseline
  baselineRd: 0.7,    // Male default; female default = 1.4 [Fant 1997]

  // Prosodic baseline
  baselineF0: 120,    // Hz; male default; female ~200 Hz

  // Optional overrides
  baselineFormants: { // Override phoneme defaults if needed
    F1: null,         // Use phoneme table
    F2: null,
    F3: null
  },

  // ------------------------------------------------------------------
  // OPTIONAL SPEAKER SCALING PARAMETERS
  // Unlike speakerSex (which has interaction effects), these are pure
  // baseline calibration parameters with no mood/emotion interactions.
  // ------------------------------------------------------------------

  // Formant scaling for vocal tract length simulation
  // Applied uniformly to F1-F5 (Barreda 2015 validates uniform scaling)
  // Default: 1.0 (adult male baseline)
  // Typical values:
  //   - Child (6-12 yrs): 1.3-1.5 [Peterson & Barney 1952; Kent_Vorperian 2018]
  //   - Adult female: 1.15-1.20 [Kent_Vorperian 2018]
  //   - Larger adult: 0.95 [Barreda 2015]
  formantScale: 1.0,

  // Duration scaling for age-typical timing
  // Applied uniformly to all segment durations
  // Default: 1.0 (adult baseline)
  // Typical values:
  //   - Child: 1.4-1.5 [Schotz 2006: children 1209ms vs adults 813ms]
  //   - Elderly: 1.1-1.2 [Schotz 2006]
  durationScale: 1.0
};

// Validation function - call before applying clinical presets
function validateSpeakerForClinicalAffect(config, preset) {
  const clinicalPresets = ['manic', 'depressive', 'manic_male', 'manic_female',
                           'depressive_male', 'depressive_female'];

  if (clinicalPresets.some(p => preset.includes(p))) {
    if (!config.speakerSex) {
      throw new Error(
        'speakerSex required for clinical mood presets ' +
        '(Kaczmarek-Majer 2024: male/female patterns invert for mania)'
      );
    }
  }
  return true;
}
```

**Why Sex Matters for Clinical Presets:**

| Manic Feature | Male Direction | Female Direction |
|---------------|----------------|------------------|
| Loudness | +6 dB | -2 dB |
| F0 | +15% | -3% |
| F1/F2 | +40 Hz | -20 Hz |
| Spectral clarity | Clearer | More slurred |
| Jitter | Rougher | Smoother |

A "manic" preset tuned for males will make female speech sound the **opposite** of how manic females actually sound. See §2.10 in Parameter Specifications for the full clinical profiles.

### 1.4 Computation Order

The voice quality pipeline integrates with the existing TTS frontend in this order:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. PHONOLOGICAL RULES (phoneme identity transforms)                     │
│    - Palatalization, flapping, geminate reduction [Klatt 1979]          │
│    - BEFORE any acoustic parameter assignment                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. BASE PARAMETER ASSIGNMENT                                            │
│    - Rd_base from speaker config                                        │
│    - Phoneme Rd from PHONEME_TARGETS                                    │
│    - Phoneme-specific formants, durations                               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. STRESS ASSIGNMENT                                                    │
│    - Generate stress levels (0, 1, 2)                                   │
│    - Compute ΔRd_stress                                                 │
│    - Compute effort from stress [Liénard 1999]                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. EMOTION OVERLAY (if specified)                                       │
│    - Apply emotion preset ΔRd                                           │
│    - Apply emotion-specific F0/duration scaling                         │
│    - Apply formant modulation: F1/F2/F3 deltas, BW scaling [France 2000]│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. PROSODIC CONTOURS                                                    │
│    - F0 contour (Fujisaki or linear)                                    │
│    - Rd phrase contour (onset rise, declination, final breathiness)     │
│    - Duration adjustments (pre-boundary lengthening, etc.)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. EFFORT-DERIVED ADJUSTMENTS                                           │
│    - F0_effective = F0 + effort * 5.1 Hz/dB [Liénard 1999]              │
│    - F1_effective = F1 + effort * 3.5 Hz/dB [Liénard 1999]              │
│    - ΔRd_effort = -effort * 0.05 (inverse relationship)                 │
│    - Spectral tilt: A1/A2/A3 differential scaling                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. FINAL Rd COMPUTATION                                                 │
│    - Sum all ΔRd factors                                                │
│    - Clamp to [0.3, 2.7]                                                │
│    - Apply Rd-AV covariation [Fant 1997]: AV += 40*log10(Rd_base/Rd)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. TRAJECTORY SMOOTHING (optional)                                      │
│    - SPG algorithm on F1, F2, F3 [Hu 2012]                              │
│    - Rd NOT smoothed (already contour-based)                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 9. TRACK OUTPUT                                                         │
│    - Frame sequence with: F0, F1-F6, B1-B6, AV, AH, AF, Rd, effort      │
│    - Sent to interpreter → WebAudio graph                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

