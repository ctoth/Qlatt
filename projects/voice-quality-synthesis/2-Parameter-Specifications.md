## 2. Parameter Specifications

### 2.1 Base Rd by Phoneme

**Source:** Fant (1997) "The Voice Source in Connected Speech", Table on segment-specific values

| Segment Type | Rd Delta | Rd (Male) | Rd (Female) | Notes |
|--------------|----------|-----------|-------------|-------|
| **Open vowels** (AA, AE, AH, AO) | 0.0 | 0.7 | 1.4 | Reference baseline |
| **Mid vowels** (EH, ER) | +0.05 | 0.75 | 1.45 | Slight increase |
| **Close vowels** (IY, IH, UW, UH) | +0.15 | 0.85 | 1.55 | Supraglottal constriction |
| **Diphthongs** (EY, AY, OW, AW, OY) | +0.05 | 0.75 | 1.45 | Average of components |
| **Voiced stops** (B, D, G) closure | +0.5 | 1.2 | 1.9 | Voicing maintenance |
| **Nasals** (M, N, NG) | +0.3 | 1.0 | 1.7 | Soft voicing |
| **Voiced fricatives** (V, DH, Z, ZH) | +0.2 | 0.9 | 1.6 | Moderate constriction |
| **Approximants** (L, R, W, Y) | +0.1 | 0.8 | 1.5 | Relatively open |
| **HH** (voiced [h]) | +1.2 | 1.9 | 2.6 | Maximum breathiness |

**Implementation in PHONEME_TARGETS:**

```javascript
// In tts-frontend-rules.js
// Base Rd values by phoneme class (delta from speaker baseline)
const PHONEME_RD = {
  // Open vowels - reference
  AA: 0.0, AE: 0.0, AH: 0.0, AO: 0.0,
  // Mid vowels
  EH: 0.05, ER: 0.05,
  // Close vowels
  IY: 0.15, IH: 0.15, UW: 0.15, UH: 0.15,
  // Diphthongs
  EY: 0.05, AY: 0.05, OW: 0.05, AW: 0.05, OY: 0.05,
  // Voiced stops (closure phase)
  B_CL: 0.5, D_CL: 0.5, G_CL: 0.5,
  // Nasals
  M: 0.3, N: 0.3, NG: 0.3,
  // Voiced fricatives
  V: 0.2, DH: 0.2, Z: 0.2, ZH: 0.2,
  // Approximants
  L: 0.1, R: 0.05, W: 0.1, Y: 0.1,
  // Breathy [h]
  HH: 1.2,
  // Reduced vowel
  AX: 0.1
};
```

### 2.2 Stress Modulation

**Sources:** Fant (1997), Cummings & Clements (1995)

**Formula:**

```javascript
// Stress-based Rd modulation
function getStressRdDelta(stress) {
  switch (stress) {
    case 1:  return -0.15;  // Primary stress: more adducted (clearer)
    case 2:  return -0.05;  // Secondary stress: slight adduction
    case 0:  return +0.10;  // Unstressed: slightly breathier
    default: return 0.0;    // No stress marking
  }
}
```

**Rationale:**
- Stressed syllables exhibit greater glottal adduction (Fant 1997: "Rd decreases by 0.1-0.3")
- Cummings 1995: Closing slope increases 1.04-1.15x for stressed syllables
- Unstressed vowels become slightly more relaxed/reduced

### 2.3 Effort Modulation

**Source:** Liénard & Di Benedetto (1999) "Effect of Vocal Effort on Spectral Properties of Vowels"

**Effort Parameter:**
- Unit: dB (relative to neutral)
- Range: [-6, +6] for conversational speech
- Extended: [-10, +10] for extreme cases

**Effort-to-Acoustic Mappings:**

```yaml
# In semantics.yaml
constants:
  # Liénard & Di Benedetto (1999) JASA 106(1):411-422
  effortCoeffs:
    f0HzPerDb: 5.1      # F0 increases 5.1 Hz per dB effort
    f1HzPerDb: 3.5      # F1 increases ~3.5 Hz per dB effort
    rdPerDb: -0.05      # Rd decreases (more adducted) with effort
    a1Slope: 1.10       # A1 changes 1.10 dB per dB effort
    a2Slope: 1.24       # A2 changes 1.24 dB per dB effort
    a3Slope: 1.30       # A3 changes 1.30 dB per dB effort

params:
  effort:
    type: float
    range: [-10, 10]
    default: 0
    unit: dB
    description: "Vocal effort (Liénard 1999)"

realize:
  # F0 and F1 shifts
  f0Effective:
    expr: "F0 + effort * effortCoeffs.f0HzPerDb"
    deps: [F0, effort]

  f1Effective:
    expr: "F1 + effort * effortCoeffs.f1HzPerDb"
    deps: [F1, effort]

  # Rd shift from effort (inverse: louder = more adducted)
  rdEffortDelta:
    expr: "effort * effortCoeffs.rdPerDb"
    deps: [effort]

  # Spectral tilt in parallel branch amplitudes
  a1Linear:
    expr: "dbToLinear(A1 + ndbScale.A1 + (effortCoeffs.a1Slope - 1) * effort) * parallelScale"
    deps: [A1, effort, parallelScale]
```

**Stress-to-Effort Mapping (in TTS Frontend):**

```javascript
// Liénard 1999: conversational range ~±4.5 dB
const EFFORT_BY_STRESS = {
  0: -1.5,  // Unstressed: reduced effort
  1: +3.0,  // Primary stress: increased effort
  2: +1.0   // Secondary stress: mild increase
};
```

### 2.4 Emotion Presets

**Sources:** Cummings & Clements (1995), Gobl & Chasaide (2003), Banse & Scherer (1996), France et al. (2000), Laukka et al. (2008)

**Key Finding from France (2000):** F0 features are surprisingly **ineffective** discriminators of emotional state. Formant frequencies, formant bandwidths, and power spectral density are the primary acoustic markers. This suggests the perceptual quality of "flat affect" comes more from **formant rigidity and spectral flattening** than from F0 flatness.

**Emotion → Rd Mapping:**

| Emotion | Rd Delta | Cummings Slope Ratio | Notes |
|---------|----------|---------------------|-------|
| **neutral** | 0.0 | 1.00 | Modal baseline |
| **angry** | -0.5 | 2.07 (closing) | Very pressed, steep symmetric slopes |
| **loud** | -0.4 | 1.93 (closing) | Pressed but asymmetric |
| **soft** | +1.2 | 0.55 (closing) | Breathy, gentle slopes |
| **sad** | +0.3 | ~0.8 | Slightly breathy, lower energy |
| **happy** | -0.2 | ~1.3 | Slightly pressed, higher energy |
| **fearful** | +0.1 | ~0.9 | Variable, higher pitch |
| **anxious** | +0.1 | ~1.0 | Modal voice, pauses are primary cue [Laukka 2008] |

**Emotion → Formant Modulation (France 2000):**

France et al. found that depression/flat affect correlates with:
- **Elevated formant frequencies** (F1 +50-80 Hz, F2 +30-80 Hz, F3 +70-115 Hz)
- **Increased FBW1** (wider first formant bandwidth → less precise articulation)
- **Decreased FBW2/FBW3** (narrower higher bandwidths → increased vocal tract tension)
- **Spectral flattening** (less power in 0-500 Hz, more in 500-1500 Hz)

| Emotion | F1 Delta | F2 Delta | F3 Delta | FBW1 Scale | FBW2 Scale | FBW3 Scale |
|---------|----------|----------|----------|------------|------------|------------|
| **neutral** | 0 | 0 | 0 | 1.0 | 1.0 | 1.0 |
| **sad** | +50 | +40 | +80 | 1.3 | 0.85 | 0.85 |
| **angry** | -20 | -15 | -30 | 0.9 | 1.1 | 1.1 |
| **soft** | +20 | +15 | +30 | 1.15 | 0.95 | 0.95 |
| **anxious** | 0 | 0 | 0 | 1.0 | 1.0 | 1.0 |

*Note: Anxious speech primarily manifests through temporal disruption (pauses), not formant changes [Laukka 2008]. The formant elevation in sad/depressed speech may indicate increased vocal tract tension/rigidity (psychomotor retardation). This contradicts some earlier studies (Hargreaves 1965) that found decreased formants - cause unknown.*

*Note: Fatigued speech (Vogel 2010) shows INCREASED F0 variance, while anxious speech shows DECREASED F0 variance. Both have longer pauses. This distinguishes them acoustically despite both being "impaired" states.*

**Full Emotion Profiles (combining voice quality with prosody):**

```javascript
// Cummings 1995 + Gobl 2003 + Banse 1996 + France 2000 + Laukka 2008 synthesis
const EMOTION_PROFILES = {
  neutral: {
    rdDelta: 0.0,
    f0Scale: 1.0,
    durationScale: 1.0,
    intensityBoost: 0,
    ahBoost: 0,
    pauseScale: 1.0,     // Temporal: pause frequency/duration multiplier [Laukka 2008]
    // Formant modulation (France 2000)
    f1Delta: 0,          // Hz offset
    f2Delta: 0,
    f3Delta: 0,
    fbw1Scale: 1.0,      // Bandwidth multiplier
    fbw2Scale: 1.0,
    fbw3Scale: 1.0
  },
  angry: {
    rdDelta: -0.5,       // Very adducted (Cummings: 2x slopes)
    f0Scale: 1.3,        // Higher pitch
    f0Variance: 1.5,     // More pitch movement
    durationScale: 0.85, // Faster
    intensityBoost: 6,   // Louder (dB)
    ahBoost: 0,          // No added breathiness
    pauseScale: 0.7,     // Fewer/shorter pauses (high confidence)
    // Formant modulation (France 2000: inverse of sad/depressed)
    f1Delta: -20,        // Lower formants (more open, forceful)
    f2Delta: -15,
    f3Delta: -30,
    fbw1Scale: 0.9,      // Narrower BW1 (precise articulation)
    fbw2Scale: 1.1,      // Wider BW2/3 (less constricted)
    fbw3Scale: 1.1
  },
  loud: {
    rdDelta: -0.4,
    f0Scale: 1.1,
    durationScale: 0.95,
    intensityBoost: 8,
    ahBoost: 0,
    pauseScale: 0.8,     // Fewer pauses (assertive)
    f1Delta: -10,
    f2Delta: -10,
    f3Delta: -15,
    fbw1Scale: 0.95,
    fbw2Scale: 1.05,
    fbw3Scale: 1.05
  },
  soft: {
    rdDelta: +1.2,       // Breathy (Cummings: 0.55x slopes)
    f0Scale: 0.95,
    f0Variance: 0.7,
    durationScale: 1.1,
    intensityBoost: -6,
    ahBoost: 8,          // Add aspiration
    pauseScale: 1.1,     // Slightly more pauses (gentle pacing)
    // Mild formant elevation (France 2000: similar direction to sad)
    f1Delta: +20,
    f2Delta: +15,
    f3Delta: +30,
    fbw1Scale: 1.15,
    fbw2Scale: 0.95,
    fbw3Scale: 0.95
  },
  sad: {
    rdDelta: +0.3,
    f0Scale: 1.0,        // CHANGED: F0 less important (France 2000)
    f0Variance: 0.6,     // Keep: less movement
    durationScale: 1.2,
    intensityBoost: -3,
    ahBoost: 4,
    pauseScale: 1.3,     // More pauses (slow, hesitant)
    // Formant modulation (France 2000: primary markers of flat affect)
    f1Delta: +50,        // Hz - elevated formants
    f2Delta: +40,
    f3Delta: +80,
    fbw1Scale: 1.3,      // Wider FBW1 (less precise articulation)
    fbw2Scale: 0.85,     // Narrower FBW2/3 (vocal tract tension)
    fbw3Scale: 0.85
  },
  happy: {
    rdDelta: -0.2,
    f0Scale: 1.15,
    f0Variance: 1.3,
    durationScale: 0.9,
    intensityBoost: 3,
    ahBoost: 0,
    pauseScale: 0.85,    // Fewer pauses (fluent, energetic)
    f1Delta: -10,
    f2Delta: -10,
    f3Delta: -15,
    fbw1Scale: 0.95,
    fbw2Scale: 1.0,
    fbw3Scale: 1.0
  },
  // Laukka et al. (2008): Anxiety primarily manifests through pauses
  // Voice quality changes are secondary to temporal disruption
  anxious: {
    rdDelta: +0.1,       // Slight breathiness (but minimal)
    f0Scale: 1.1,        // Higher mean F0 [Laukka 2008]
    f0Max: 1.15,         // Higher F0 ceiling [Laukka 2008]
    f0Variance: 0.85,    // Reduced F0 variability (more monotone)
    durationScale: 1.0,  // Normal segment duration
    intensityBoost: 0,
    ahBoost: 0,
    pauseScale: 1.4,     // PRIMARY CUE: 40% more/longer pauses [η²=0.21]
    // HF500 increase maps to spectral tilt (more high-freq energy)
    spectralTiltBoost: -2, // Sharper voice (less tilt)
    // Formant modulation: minimal (anxiety is temporal, not spectral)
    f1Delta: 0,
    f2Delta: 0,
    f3Delta: 0,
    fbw1Scale: 1.0,
    fbw2Scale: 1.0,
    fbw3Scale: 1.0
  },
  // Vogel et al. (2010): Fatigue from sustained wakefulness (24h)
  // Peak effect at 22h (pre-dawn), partial recovery at sunrise
  // Key: F0 MEAN stable, F0 VARIANCE increases (opposite of anxiety!)
  fatigued: {
    rdDelta: +0.2,       // Slight breathiness (alpha ratio increase)
    f0Scale: 1.0,        // F0 mean unchanged [Vogel 2010 Fig 1]
    f0Variance: 1.3,     // F0 SD/CoV INCREASED at 16-24h [Vogel 2010 Fig 1]
    durationScale: 1.15, // Slower speech rate on reading tasks [Vogel 2010 Fig 3]
    intensityBoost: 0,   // Leq stable ~58 dB [Vogel 2010 Table II]
    ahBoost: 2,          // Mild aspiration increase
    pauseScale: 1.3,     // Longer pauses on cognitively demanding tasks
    // Alpha ratio increase = steeper spectral tilt [Vogel 2010 Fig 5]
    spectralTiltBoost: +3,
    // F4 variation decreases (unique fatigue marker) [Vogel 2010 Fig 2]
    f4VarianceScale: 0.7,
    // Formants F1-F3 stable [Vogel 2010: d < 0.2 for F1-F3]
    f1Delta: 0,
    f2Delta: 0,
    f3Delta: 0,
    fbw1Scale: 1.0,
    fbw2Scale: 1.0,
    fbw3Scale: 1.0
  }
};
```

**Implementation Note (France 2000):** The formant modulation parameters should be applied **additively** to base phoneme formants, similar to how Rd deltas work:

```javascript
F1_effective = F1_phoneme + emotionProfile.f1Delta
B1_effective = B1_phoneme * emotionProfile.fbw1Scale
```

**Implementation Note (Laukka 2008):** The `pauseScale` parameter controls hesitation pause insertion and duration scaling:

```javascript
// Pause insertion in TTS frontend - applies pauseScale to:
// 1. Inter-word pause duration: basePause * pauseScale
// 2. Hesitation pause probability: insert additional pauses when pauseScale > 1.0
// 3. Filled pause insertion (um, uh) for high pauseScale values

function applyPauseScale(pauseList, emotionProfile) {
  const scale = emotionProfile.pauseScale || 1.0;

  for (const pause of pauseList) {
    // Scale existing pause durations
    pause.duration *= scale;
  }

  // Insert additional hesitation pauses for anxious speech
  if (scale > 1.2) {
    // Insert pauses at phrase-internal word boundaries
    // Probability proportional to (scale - 1.0)
    insertHesitationPauses(pauseList, scale - 1.0);
  }

  return pauseList;
}
```

*Note: Pause manipulation is a **temporal** feature operating at the TTS frontend level, not in the audio graph. The primary implementation path is through the track generation phase where silence frames are inserted.*

### 2.5 Phrase Contour

**Source:** Fant (1997) "The Voice Source in Connected Speech"

**Phrase-Level Rd Dynamics:**

```javascript
// Fant 1997: Voice source changes through phrase
function computeRdPhraseContour(time, phraseStart, phraseEnd, baseRd) {
  const posInPhrase = time - phraseStart;
  const phraseDuration = phraseEnd - phraseStart;
  const relPos = posInPhrase / phraseDuration;

  let rdContour = 0;

  // 1. Onset rise: Rd starts ~0.2 lower, rises over first 50ms
  // (More adducted at phrase start - "attack")
  if (posInPhrase < 0.05) {
    const onsetFactor = posInPhrase / 0.05;
    rdContour -= 0.2 * (1 - onsetFactor);  // Starts -0.2, rises to 0
  }

  // 2. Main declination: Rd increases ~0.1 per second
  // (Gradual relaxation through phrase)
  rdContour += 0.1 * posInPhrase;

  // 3. Final breathiness: last 300ms, accelerated increase
  // (Characteristic phrase-final breathiness)
  const timeToEnd = phraseEnd - time;
  if (timeToEnd < 0.3) {
    const finalFactor = 1 - (timeToEnd / 0.3);
    rdContour += 0.3 * finalFactor;  // Up to +0.3 at very end
  }

  return rdContour;  // Returns delta to add to base Rd
}
```

**Interaction with Fujisaki F0:**

The Fujisaki F0 model (if implemented) operates independently but in parallel:
- F0 phrase commands create global declination
- Rd phrase contour creates parallel voice quality declination
- Both decline through phrase; both reset at phrase boundaries
- F0 accents do NOT affect Rd (stress effects are separate)

---

### 2.6 Epistemic Presets (Confidence/Certainty)

**Source:** Goupil & Aucouturier (2021) "Distinct signatures of subjective confidence and objective accuracy in speech prosody" *Cognition* 212:104661

**Key Findings:**
- Subjective confidence and objective accuracy are encoded in **distinct** prosodic features
- **Intonation contour shape** (LHL% vs HLH%) is the primary confidence marker
- **Loudness** reflects accuracy (competence), not subjective confidence
- **Duration** increases with confidence (5% longer utterances)
- Effects appear even without audience (natural signs, not deliberate signals)

**F0 Contour Patterns:**

| Confidence Level | F0 Pattern | Early Phase (25-55%) | Late Phase (80-100%) |
|------------------|------------|----------------------|----------------------|
| **High confidence** | LHL% (rise-then-fall) | +2 ST rise | -1.5 ST fall |
| **Neutral** | Flat | 0 | 0 |
| **Uncertainty** | HLH% (fall-then-rise) | -1.5 ST fall | +2 ST rise (terminal) |

*Note: Percentages refer to utterance position. Terminal rise is cross-linguistically recognized as an uncertainty marker.*

**Epistemic Preset Profiles:**

```javascript
// Goupil & Aucouturier (2021): Confidence/uncertainty prosody presets
// NOTE: These affect PROSODY (F0 contour, duration, intensity)
// Voice quality (Rd) changes are minimal - layer emotion presets for voice quality
const EPISTEMIC_PROFILES = {
  // High subjective confidence
  confident: {
    // Voice quality: minimal change (paper doesn't address Rd)
    rdDelta: 0.0,

    // F0 contour: LHL% pattern (rise-then-fall)
    f0Contour: 'LHL',           // Contour shape identifier
    f0EarlyBoost: +2.0,         // ST boost in segments 25-55%
    f0LateDrop: -1.5,           // ST drop in segments 80-100%
    f0Variance: 1.1,            // Slightly more dynamic

    // Duration: confident speech is longer
    durationScale: 1.05,        // 5% longer utterances [beta=0.035]

    // Loudness: higher (but reflects accuracy correlation)
    intensityBoost: +1.0,       // dB - louder when confident AND correct

    // Pauses: fewer hesitations
    pauseScale: 0.85
  },

  // Uncertainty/doubt
  doubtful: {
    // Voice quality: slight breathiness (from anxiety overlap)
    rdDelta: +0.1,

    // F0 contour: HLH% pattern (fall-then-rise)
    f0Contour: 'HLH',           // Contour shape identifier
    f0EarlyDrop: -1.5,          // ST drop in segments 25-55%
    f0LateRise: +2.0,           // ST rise in segments 80-100% (terminal rise)
    f0Variance: 0.9,            // Slightly less dynamic

    // Duration: uncertain speech is shorter
    durationScale: 0.95,        // 5% shorter utterances

    // Loudness: lower
    intensityBoost: -1.0,       // dB - quieter

    // Pauses: more hesitation
    pauseScale: 1.2
  },

  // Competence/authority (accuracy-based, not confidence)
  competent: {
    // Primary marker: loudness (accuracy correlate)
    intensityBoost: +2.0,       // dB - louder = perceived as more accurate

    // Early pitch elevation (accuracy zone)
    f0EarlyBoost: +1.0,         // ST - slight elevation in early phase

    // Duration: neutral (accuracy didn't affect duration)
    durationScale: 1.0,

    // Voice quality: slightly pressed (authoritative)
    rdDelta: -0.1,

    pauseScale: 0.9
  },

  // Epistemic hedging ("I think...", uncertain claims)
  hedging: {
    // F0: terminal rise only (partial HLH%)
    f0Contour: 'terminal_rise',
    f0LateRise: +1.5,           // ST rise in final 20%

    // Duration: slightly shorter
    durationScale: 0.97,

    // Loudness: neutral (hedging is metacognitive, not accuracy-based)
    intensityBoost: 0,

    // Voice quality: neutral
    rdDelta: 0.0,

    // Pauses: slightly more
    pauseScale: 1.1
  }
};
```

**F0 Contour Implementation:**

```javascript
// Goupil & Aucouturier (2021): Position-dependent F0 modulation
// Position: 0.0 = start, 1.0 = end of utterance
// Confidence: 0 = very uncertain, 1 = very confident
function confidenceF0Delta(position, confidence) {
  const confidenceFactor = (confidence - 0.5) * 2; // -1 to +1

  if (position < 0.25) {
    // Early (0-25%): minimal effect
    return 0;
  } else if (position < 0.55) {
    // Mid-early (25-55%): rise for confident, fall for uncertain
    const risePhase = (position - 0.25) / 0.30;
    return confidenceFactor * 2.0 * risePhase; // up to +2 ST
  } else if (position < 0.80) {
    // Transition (55-80%): return toward baseline
    const transPhase = (position - 0.55) / 0.25;
    return confidenceFactor * 2.0 * (1 - transPhase);
  } else {
    // Late (80-100%): fall for confident, rise for uncertain
    const fallPhase = (position - 0.80) / 0.20;
    return -confidenceFactor * 1.5 * fallPhase; // down to -1.5 ST
  }
}
```

**Integration Notes:**
- Epistemic presets affect **prosody** (F0 contour, duration, intensity), not voice quality
- The `doubtful` terminal rise overlaps with question intonation (see Pragmatic Presets)
- For combined confidence + emotion, apply epistemic preset on top of emotion preset
- Duration effect (confident = longer) may conflict with speech rate expectations; make configurable

---

### 2.7 Pragmatic Presets (Speech Acts)

**Source:** Trott, Reed, Kaliblotzky, Ferreira & Bergen (2022) "The role of prosody in disambiguating English indirect requests" *Language and Speech* doi:10.1177/00238309221087715

**Key Findings:**
- Prosodic cues for speech act type vary by **grammatical form**
- **F0 slope** (rising vs. flat/falling) distinguishes questions from requests
- **Duration** signals marked/non-default interpretation (cross-over interaction with form)
- Modal interrogatives: flat F0 + shorter = request; rising F0 + longer = question
- Declaratives: higher F0 + longer = indirect request (marked interpretation)

**Form-Dependent Prosodic Markers:**

| Grammatical Form | Speech Act | F0 Slope | Duration | Intensity |
|------------------|------------|----------|----------|-----------|
| Modal interrogative ("Can you X?") | Request | Flat/falling | Shorter | Higher |
| Modal interrogative ("Can you X?") | Question | Rising | Longer | Lower |
| Declarative ("My X is Y") | Statement | Flat | Shorter | Neutral |
| Declarative ("My X is Y") | Indirect request | Higher mean | Longer | Neutral |

**Pragmatic Preset Profiles:**

```javascript
// Trott et al. (2022): Speech act prosody presets
// NOTE: Effects vary by grammatical form - implementation needs form awareness
const PRAGMATIC_PROFILES = {
  // Indirect request via declarative ("It's cold in here" = turn on AC)
  indirect_request: {
    // F0 modulation: higher mean, late pitch peak (Ward 2019)
    f0Scale: 1.08,              // Higher mean F0 [beta=1.18]
    f0Contour: 'late_rise',     // Late pitch peak for declarative requests
    f0LateRise: +1.5,           // ST rise in final 20%

    // Duration: longer (marks non-default interpretation)
    durationScale: 1.10,        // 10% longer [beta=0.94]

    // Intensity: neutral (no significant effect found)
    intensityBoost: 0,

    // Pauses: slightly fewer (fluent, purposeful)
    pauseScale: 0.95,

    // Voice quality: neutral
    rdDelta: 0.0
  },

  // Direct request via modal interrogative ("Can you pass the salt?")
  direct_request: {
    // F0 modulation: flat/falling contour (not rising question)
    f0Contour: 'declarative',   // Statement-like intonation
    f0FinalRise: 0,             // No final rise
    f0Slope: 'flat',            // Less positive F0 slope [beta=-0.33]

    // Duration: shorter
    durationScale: 0.95,        // [beta=-0.75 for voiced frames]

    // Intensity: higher
    intensityBoost: +2.0,       // dB - louder, assertive [beta=0.45]

    // Voice quality: slightly pressed (assertive)
    rdDelta: -0.1,

    pauseScale: 0.9
  },

  // Genuine question via modal interrogative ("Can you reach the top shelf?")
  polite_question: {
    // F0 modulation: rising contour (yes-no question pattern)
    f0Contour: 'low_rise',      // Banuazizi & Creswell (1999)
    f0Slope: 'rising',          // Positive F0 slope
    f0FinalRise: +3.0,          // ST rise in final NP (~20 Hz from Fig 3)

    // Duration: longer
    durationScale: 1.08,

    // Intensity: lower
    intensityBoost: -1.0,       // dB - quieter than request version

    // Voice quality: neutral
    rdDelta: 0.0,

    pauseScale: 1.0
  },

  // Sarcasm (from Cheang & Pell 2008, cited in Trott et al.)
  // NOTE: Prosody alone is "rapid but less reliable" cue (Deliens 2018)
  sarcastic: {
    // F0 modulation: lower mean, reduced range, flat contour
    f0Scale: 0.92,              // Lower mean F0 [Cheang & Pell 2008]
    f0Variance: 0.8,            // Reduced pitch range
    f0Contour: 'flat',          // Monotone quality

    // Duration: slightly exaggerated/drawn out
    durationScale: 1.15,

    // Intensity: context-dependent
    intensityBoost: 0,

    // Pauses: potential emphasis pauses
    pauseScale: 1.1,

    // Voice quality: neutral
    rdDelta: 0.0
  },

  // ========================================================================
  // IMPOLITENESS PRESETS
  // Source: Caballero, Vergis, Jiang & Pell (2018) "The sound of im/politeness"
  // Speech Communication 102:39-53. doi:10.1016/j.specom.2018.06.004
  //
  // CRITICAL FINDING: Impoliteness is NOT low-intensity anger.
  // The acoustic profiles are INVERTED:
  //   - Anger:     HIGH F0, FAST rate, HIGH arousal
  //   - Rudeness:  LOW F0, SLOW rate, LOW arousal (contempt/dominance)
  //
  // Impoliteness signals dominance through deliberate, low-pitched, slow
  // speech - not through high-arousal vocal effort.
  // ========================================================================

  // Generic impoliteness - applicable to statements and requests
  // Inverse of polite speech: lower F0, narrower range, falling contour
  rude: {
    // F0 modulation: lower mean, compressed range, falling contour
    f0Scale: 0.90,              // ~10% lower mean F0 [Table 3: -0.16 norm]
    f0Variance: 0.85,           // Narrower pitch range [ηp² = 0.02-0.21]
    f0Contour: 'falling',       // Negative Elevation Index [strongest effect]
    f0OffsetDelta: -50,         // Hz below onset (terminal fall)

    // Duration: slower, deliberate pacing
    durationScale: 1.15,        // ~15% slower speech rate [ηp² = 0.08-0.17]

    // Intensity: not characterized (normalized in study)
    intensityBoost: 0,

    // Pauses: "floor-holding" effect (Culpeper 2003)
    pauseScale: 1.1,

    // Voice quality: harsher (lower HNR maps to more pressed)
    rdDelta: -0.15              // More pressed voice [HNR ηp² = 0.06-0.29]
  },

  // Dismissive - mild impoliteness, indifference
  // Signals disengagement and lack of interest
  dismissive: {
    // F0 modulation: slightly lower, very flat (monotone)
    f0Scale: 0.95,              // Slightly lower pitch
    f0Variance: 0.80,           // Compressed range (monotone)
    f0Contour: 'flat',          // Minimal pitch movement
    f0OffsetDelta: -30,         // Mild terminal fall

    // Duration: slightly slower (minimal effort)
    durationScale: 1.10,

    // Intensity: slightly quieter (disengagement)
    intensityBoost: -1,

    // Pauses: normal
    pauseScale: 1.0,

    // Voice quality: slightly pressed
    rdDelta: -0.1
  },

  // Curt - abrupt, minimal engagement
  // Short, clipped responses that signal impatience
  curt: {
    // F0 modulation: lower, very narrow range
    f0Scale: 0.92,
    f0Variance: 0.75,           // Very narrow range
    f0Contour: 'falling',
    f0OffsetDelta: -40,

    // Duration: actually faster (minimal engagement, rushing through)
    durationScale: 0.90,

    // Intensity: neutral
    intensityBoost: 0,

    // Pauses: fewer (rushing through)
    pauseScale: 0.8,

    // Voice quality: more pressed (tense)
    rdDelta: -0.2
  },

  // ========================================================================
  // INSINCERITY PRESET (Prosocial Lies / White Lies)
  // Source: Fish, Rothermich & Pell (2017) "The sound of (in)sincerity"
  // Journal of Pragmatics 121:147-161. doi:10.1016/j.pragma.2017.10.008
  //
  // CRITICAL DISTINCTION FROM SARCASM:
  //   - Sarcasm: Ironic, meaning opposite, exaggerated prosody
  //   - Insincerity: Concealing negative opinion, maintaining facade
  //
  // Insincerity signals cognitive control (facade maintenance) rather than
  // ironic contrast. The acoustic profile is more subtle than sarcasm.
  //
  // Key finding: Different features operate at different phrase positions:
  //   - Initial phrase ("I think"): F0 drops, narrower range
  //   - Main phrase: Amplitude crescendo
  //   - Throughout: Slower speech rate (strongest marker, η² = .22)
  // ========================================================================

  // Insincere compliment / prosocial lie / white lie
  // Conceals true (negative) opinion to spare feelings
  insincere: {
    // F0 modulation: lower on initial evidentiality phrases only
    // Full utterance F0 is ~4% lower overall
    f0Scale: 0.96,              // ~4% lower mean F0
    f0Variance: 0.85,           // Narrower range on initial phrase (0.44/0.57)
    f0Contour: 'initial_drop',  // F0 drops specifically on "I think/I believe"
    f0InitialScale: 0.92,       // ~8% lower on evidentiality phrases

    // Duration: PRIMARY MARKER - 27% slower speech rate
    durationScale: 1.27,        // Strongest effect (η² = .22)

    // Amplitude: crescendo pattern (gets louder through utterance)
    // Main phrase ~6% louder than sincere
    intensityBoost: 0,          // Neutral initial
    amplitudeContour: 'crescendo',
    amplitudeSlope: +0.5,       // dB/phrase

    // Pauses: not directly measured, inferred from slower rate
    pauseScale: 1.0,

    // Voice quality: not measured (assume neutral)
    rdDelta: 0.0
  }
};
```

**Relationship to Epistemic Presets:**

The prosodic markers for confidence (Goupil 2021) and speech acts (Trott 2022) share overlapping features:

| Feature | Confidence | Speech Act | Overlap |
|---------|------------|------------|---------|
| Terminal rise | Uncertainty marker | Question marker | High overlap |
| Falling contour | Confident | Request/statement | High overlap |
| Duration | Confident = longer | Marked interpretation = longer | Partial |
| Intensity | Accuracy marker | Request vs. question | Partial |

**Implication:** Confident speech sounds like assertions/requests; uncertain speech sounds like questions. This is linguistically expected - epistemic confidence and illocutionary force are related.

**Suggested Parameter Architecture (YAML):**

```yaml
# In semantics.yaml: Pragmatic layer operates BEFORE emotion/voice quality
pragmatic:
  speechAct:
    type: enum
    values: [statement, question, request, command]
    default: statement
    description: "Speech act type (Trott 2022)"

  indirectness:
    type: float
    range: [0, 1]  # 0 = direct, 1 = very indirect
    default: 0
    description: "Degree of indirectness"

  grammaticalForm:
    type: enum
    values: [declarative, interrogative, imperative]
    default: declarative
    description: "Sentence grammatical form"

# Processing order:
# 1. Base phoneme targets (formants, duration)
# 2. Pragmatic modulation (speech act + indirectness)
# 3. Epistemic modulation (confidence from Goupil)
# 4. Emotion modulation (existing presets)
# 5. Phrase contour (Fant 1997)
```

**Implementation Priority:**

1. **High priority:** F0 final rise/fall for question vs. statement distinction (already partially implemented in prosody rules)
2. **Medium priority:** Indirect request late pitch peak (Ward 2019)
3. **Lower priority:** Form-dependent duration scaling (requires grammatical form input)
4. **Low priority:** Sarcasm prosody (prosody alone unreliable; context matters more)

---

### 2.8 Speech Act Presets (Dramatic/Clear Intent)

**Source:** Hellbernd & Sammler (2016) "Prosody conveys speaker's intentions: Acoustic cues for speech act perception" *Journal of Memory and Language* 88:70-86. doi:10.1016/j.jml.2016.01.001

**Key Findings:**
- **92% acoustic classification accuracy** for 6 speech acts using prosody alone
- **Pitch rise (offset-onset F0)** is the single most discriminating feature
- These are "clear/dramatic" speech acts vs. Trott's (2022) subtle conversational distinctions
- Trained German speakers; may be slightly exaggerated compared to natural speech

**Comparison with Trott 2022 (Section 2.7):**

| Dimension | Hellbernd 2016 | Trott 2022 |
|-----------|----------------|------------|
| **Accuracy** | 82-92% | 55-65% |
| **Speech acts** | 6 distinct categories | Binary (request vs. non-request) |
| **Stimulus type** | Single words, isolation | Full sentences, conversational |
| **Prosodic contrast** | Maximally distinct by design | Subtle pragmatic distinctions |
| **Use case** | Clear intent expression | Natural conversational ambiguity |

**Hellbernd's higher accuracy** stems from: (1) maximally distinct speech acts (warning vs. wish are acoustically very different), (2) trained speakers (voice coaches), and (3) single-word isolation (no competing linguistic information).

**Speech Act Acoustic Profiles (vs. Naming baseline):**

| Speech Act | Duration | Mean F0 | Offset-Onset F0 | Intensity | Arousal | Valence |
|------------|----------|---------|-----------------|-----------|---------|---------|
| **Naming** (baseline) | 1.0x | 133 Hz | -52 Hz (falling) | 57 dB | Calm | Neutral |
| **Criticism** | 1.32x | +73% | +82 Hz (rising) | +8 dB | Excited | Negative |
| **Doubt** | 1.42x | +42% | +73 Hz (rising) | +0 dB | Calm | Neutral |
| **Suggestion** | 0.94x | +55% | +185 Hz (strong rise) | +6 dB | Moderate | Positive |
| **Warning** | 1.26x | +101% | -123 Hz (arched fall) | +15 dB | Excited | Negative |
| **Wish** | 1.42x | +11% | -62 Hz (gentle fall) | +2 dB | Calm | Positive |

**Speech Act Preset Profiles:**

```javascript
// Hellbernd & Sammler (2016): Speech act prosodic profiles
// Journal of Memory and Language 88:70-86
// doi:10.1016/j.jml.2016.01.001
// Key finding: Pitch rise (offset-onset F0) is primary discriminator
// 92% acoustic classification, 82% behavioral recognition
const SPEECH_ACT_PROFILES = {
  // Neutral baseline - naming/stating
  naming: {
    f0Scale: 1.0,               // Reference
    f0Contour: 'falling',       // Negative offset-onset
    f0OffsetDelta: -50,         // Hz below onset
    durationScale: 1.0,         // Reference
    intensityBoost: 0,          // Reference
    rdDelta: 0.0,               // Modal voice
    arousal: 'calm',
    valence: 'neutral'
  },

  // Criticism - disapproval
  criticism: {
    f0Scale: 1.73,              // +73% mean F0
    f0Contour: 'rising',        // Positive offset-onset
    f0OffsetDelta: +80,         // Hz above onset
    durationScale: 1.32,        // +32% longer
    intensityBoost: +8,         // dB
    rdDelta: -0.2,              // Slightly pressed (excited)
    arousal: 'excited',
    valence: 'negative'
  },

  // Doubt - uncertainty about proposal
  doubt: {
    f0Scale: 1.42,              // +42% mean F0
    f0Contour: 'rising',        // Positive offset-onset
    f0OffsetDelta: +73,         // Hz above onset
    durationScale: 1.42,        // +42% longer
    intensityBoost: 0,          // Same as naming
    rdDelta: +0.1,              // Slightly breathy (calm)
    arousal: 'calm',
    valence: 'neutral'
  },

  // Suggestion - inviting action
  suggestion: {
    f0Scale: 1.55,              // +55% mean F0
    f0Contour: 'strong_rise',   // Highest pitch rise
    f0OffsetDelta: +185,        // Hz above onset (strongest)
    durationScale: 0.94,        // -6% shorter
    intensityBoost: +6,         // dB
    rdDelta: 0.0,               // Modal voice
    arousal: 'moderate',
    valence: 'positive'
  },

  // Warning - alerting to danger
  warning: {
    f0Scale: 2.01,              // +101% mean F0 (highest)
    f0Contour: 'arched_fall',   // Peak in middle, then fall
    f0OffsetDelta: -123,        // Hz below onset (steep fall from peak)
    durationScale: 1.26,        // +26% longer
    intensityBoost: +15,        // dB (loudest)
    rdDelta: -0.3,              // Pressed (very excited)
    arousal: 'excited',
    valence: 'negative'
  },

  // Wish - longing expression
  wish: {
    f0Scale: 1.11,              // +11% mean F0 (lowest after naming)
    f0Contour: 'gentle_fall',   // Gradual falling
    f0OffsetDelta: -62,         // Hz below onset
    durationScale: 1.42,        // +42% longer
    intensityBoost: +2,         // dB (soft)
    rdDelta: +0.2,              // Slightly breathy (calm, positive)
    arousal: 'calm',
    valence: 'positive'
  }
};
```

**F0 Contour Implementation:**

```javascript
// Hellbernd 2016: F0 contour patterns for speech acts
// Applied at the utterance/word level
function applySpeechActF0Contour(f0Targets, speechAct, profile) {
  const onset = f0Targets[0];
  const offsetDelta = profile.f0OffsetDelta;

  switch (profile.f0Contour) {
    case 'falling':
      // Linear decrease from onset to offset
      return f0Targets.map((_, i, arr) => {
        const progress = i / (arr.length - 1);
        return onset + (offsetDelta * progress);
      });

    case 'rising':
      // Linear increase from onset to offset
      return f0Targets.map((_, i, arr) => {
        const progress = i / (arr.length - 1);
        return onset + (offsetDelta * progress);
      });

    case 'strong_rise':
      // Accelerating rise (suggestion pattern)
      return f0Targets.map((_, i, arr) => {
        const progress = i / (arr.length - 1);
        return onset + (offsetDelta * Math.pow(progress, 0.7));
      });

    case 'arched_fall':
      // Warning: rise to peak at ~40%, then steep fall
      return f0Targets.map((_, i, arr) => {
        const progress = i / (arr.length - 1);
        if (progress < 0.4) {
          // Rising phase
          const riseProgress = progress / 0.4;
          return onset + (100 * riseProgress); // Rise 100 Hz to peak
        } else {
          // Falling phase
          const fallProgress = (progress - 0.4) / 0.6;
          const peak = onset + 100;
          return peak + (offsetDelta * fallProgress);
        }
      });

    case 'gentle_fall':
      // Wish: slow, gentle decline
      return f0Targets.map((_, i, arr) => {
        const progress = i / (arr.length - 1);
        return onset + (offsetDelta * Math.pow(progress, 1.5));
      });

    default:
      return f0Targets;
  }
}
```

**Mapping to Existing Presets:**

| Trott 2022 Preset | Hellbernd Equivalent | Recommendation |
|-------------------|---------------------|----------------|
| `indirect_request` | `suggestion` | Keep both; use `suggestion` for clearer intent |
| `direct_request` | `warning` (less extreme) | Keep Trott for requests; Hellbernd for commands |
| `polite_question` | `doubt` | Keep both; `doubt` is more skeptical |
| `sarcastic` | (not covered) | Keep Trott version |

**Clarity Blending (Optional):**

```javascript
// Blend Hellbernd (clear) and Trott (subtle) based on desired clarity
// clarity: 0 = conversational (Trott), 1 = dramatic (Hellbernd)
function getSpeechActParams(speechAct, clarity = 0.5) {
  const hellbernd = SPEECH_ACT_PROFILES[speechAct];
  const trott = PRAGMATIC_PROFILES[mapToTrott(speechAct)];

  return {
    f0Scale: lerp(trott?.f0Scale || 1.0, hellbernd.f0Scale, clarity),
    durationScale: lerp(trott?.durationScale || 1.0, hellbernd.durationScale, clarity),
    intensityBoost: lerp(trott?.intensityBoost || 0, hellbernd.intensityBoost, clarity)
  };
}
```

**Relationship to Emotion Presets (Arousal/Valence Mapping):**

| Speech Act | Maps to Emotion | Arousal Match | Valence Match |
|------------|-----------------|---------------|---------------|
| Warning | angry/loud | High arousal | Negative valence |
| Criticism | angry (less intense) | Medium-high arousal | Negative valence |
| Suggestion | happy | Medium arousal | Positive valence |
| Doubt | anxious (mild) | Low arousal | Neutral valence |
| Wish | soft/sad (longing) | Low arousal | Positive valence |
| Naming | neutral | Very low arousal | Neutral valence |

**Limitations:**
- **German language:** Data are from German speakers; may not transfer perfectly to English
- **Single words:** Patterns may be exaggerated compared to sentence-level prosody
- **Trained speakers:** Voice coaches produce clearer distinctions than naive speakers
- **No voice quality measures:** Paper focuses on F0/intensity/duration, not glottal parameters (Rd deltas are extrapolated from arousal/valence)

---

### 2.9 Preset Summary Table

| Category | Preset | rdDelta | f0Scale | durationScale | intensityBoost | pauseScale | Primary Markers |
|----------|--------|---------|---------|---------------|----------------|------------|-----------------|
| **Emotion** | angry | -0.5 | 1.3 | 0.85 | +6 dB | 0.7 | Pressed voice, fast |
| | loud | -0.4 | 1.1 | 0.95 | +8 dB | 0.8 | Pressed, assertive |
| | soft | +1.2 | 0.95 | 1.1 | -6 dB | 1.1 | Breathy, gentle |
| | sad | +0.3 | 1.0 | 1.2 | -3 dB | 1.3 | Formant elevation, pauses |
| | happy | -0.2 | 1.15 | 0.9 | +3 dB | 0.85 | Pressed, energetic |
| | anxious | +0.1 | 1.1 | 1.0 | 0 | 1.4 | Pauses (primary) |
| | fatigued | +0.2 | 1.0 | 1.15 | 0 | 1.3 | F0 variance increased |
| **Epistemic** | confident | 0.0 | 1.0 | 1.05 | +1 dB | 0.85 | LHL% contour |
| | doubtful | +0.1 | 1.0 | 0.95 | -1 dB | 1.2 | HLH% / terminal rise |
| | competent | -0.1 | 1.0 | 1.0 | +2 dB | 0.9 | Loudness (accuracy) |
| | hedging | 0.0 | 1.0 | 0.97 | 0 | 1.1 | Terminal rise only |
| **Pragmatic** | indirect_request | 0.0 | 1.08 | 1.10 | 0 | 0.95 | Late pitch peak |
| | direct_request | -0.1 | 1.0 | 0.95 | +2 dB | 0.9 | Flat contour, assertive |
| | polite_question | 0.0 | 1.0 | 1.08 | -1 dB | 1.0 | Rising final |
| | sarcastic | 0.0 | 0.92 | 1.15 | 0 | 1.1 | Low F0, flat, slow |
| | rude | -0.15 | 0.90 | 1.15 | 0 | 1.1 | Low F0, falling, slow |
| | dismissive | -0.1 | 0.95 | 1.10 | -1 dB | 1.0 | Flat, monotone |
| | curt | -0.2 | 0.92 | 0.90 | 0 | 0.8 | Low F0, pressed, fast |
| | insincere | 0.0 | 0.96 | 1.27 | 0 | 1.0 | Slow rate, initial F0 drop, crescendo |
| **Speech Act** | naming | 0.0 | 1.0 | 1.0 | 0 | - | Baseline (falling contour) |
| (Hellbernd) | criticism | -0.2 | 1.73 | 1.32 | +8 dB | - | Rising +80 Hz, excited |
| | doubt | +0.1 | 1.42 | 1.42 | 0 | - | Rising +73 Hz, breathy |
| | suggestion | 0.0 | 1.55 | 0.94 | +6 dB | - | Strong rise +185 Hz |
| | warning | -0.3 | 2.01 | 1.26 | +15 dB | - | Arched fall, loudest |
| | wish | +0.2 | 1.11 | 1.42 | +2 dB | - | Gentle fall, breathy |
| **Clinical** | manic_male | -0.15 | 1.15 | 0.90 | +6 dB | 0.7 | **SEX-SPECIFIC** |
| (Kaczmarek-Majer) | manic_female | +0.1 | 0.97 | 1.0 | -2 dB | 1.0 | **INVERTED** |
| | depressive_male | +0.2 | 1.0 | 1.05 | -5 dB | 0.85 | Slurred, smoother |
| | depressive_female | +0.1 | 1.0 | 1.0 | 0 | 1.1 | Minimal modulation |

**Layer Application Order:**
1. **Base** → phoneme-intrinsic targets
2. **Speech Act** → clear intent modulation (Hellbernd 2016) - utterance-level F0 contour
3. **Pragmatic** → subtle speech act modulation (Trott 2022) - grammatical form interaction
4. **Epistemic** → confidence modulation (Goupil 2021)
5. **Emotion** → affective state (Cummings 1995, France 2000, Laukka 2008)
6. **Phrase** → contour dynamics (Fant 1997)
7. **Clinical Mood** → bipolar state modulation (Kaczmarek-Majer 2024) - **sex-specific**

---

### 2.10 Clinical Presets (Mood States)

**Source:** Kaczmarek-Majer et al. (2024) "Acoustic features from speech as markers of depressive and manic symptoms in bipolar disorder: A prospective study" *Acta Psychiatrica Scandinavica* 151(3):358-374. doi:10.1111/acps.13735

---

#### !!CRITICAL WARNING!!

**Male and female acoustic patterns for mania are EXACTLY OPPOSITE.**

| Feature | Male Mania | Female Mania | Inversion? |
|---------|------------|--------------|------------|
| Loudness | +1.6 (louder) | -0.27 (quieter) | **YES** |
| Energy | +1.4 | -0.24 | **YES** |
| F1 | +0.71 (higher) | -0.21 (lower) | **YES** |
| F2 | +0.69 (higher) | -0.23 (lower) | **YES** |
| Spectral flux | +1.35 (clearer) | -0.25 (less clear) | **YES** |
| Jitter | +1.15 (rougher) | -0.18 (smoother) | **YES** |

**A sex-agnostic "manic" preset will be WRONG for half of speakers.**

Clinical presets REQUIRE `speakerSex` to be specified in speaker configuration (see §1.4 in Design-Decisions.md).

---

#### Clinical Preset Profiles

```javascript
// Kaczmarek-Majer et al. (2024) Acta Psychiatr Scand. doi:10.1111/acps.13735
// CRITICAL: Male and female patterns invert for mania
const CLINICAL_MOOD_PROFILES = {
  // Manic state - MALE
  // Males become: louder, higher-pitched, clearer articulation, rougher voice
  manic_male: {
    // Prosodic (strongest effects)
    intensityBoost: +6,           // β = 1.6 louder
    f0Scale: 1.15,                // β = 0.71 higher pitch
    durationScale: 0.90,          // β = 0.61 faster speech rate
    pauseScale: 0.7,              // β = 1.64 longer speaking time (fewer pauses)

    // Voice quality
    rdDelta: -0.15,               // Inferred: more pressed/energetic voice
    jitterScale: 1.15,            // β = 1.15 rougher voice
    shimmerScale: 1.13,           // β = 1.13 more intensity variation

    // Formant modulation (spectral flux = clearer speech)
    f1Delta: +40,                 // β = 0.71 higher F1
    f2Delta: +40,                 // β = 0.69 higher F2
    f3Delta: 0,
    fbw1Scale: 0.85,              // Narrower BW = clearer articulation
    fbw2Scale: 0.90,
    fbw3Scale: 1.0,

    // Spectral (sharpness)
    spectralTiltBoost: -3,        // β = 0.95 sharper = less tilt
  },

  // Manic state - FEMALE (INVERTED!)
  // Females become: quieter, lower-pitched, less clear articulation, smoother voice
  manic_female: {
    // Prosodic (OPPOSITE direction, weaker magnitude)
    intensityBoost: -2,           // β = -0.27 quieter
    f0Scale: 0.97,                // Inferred: lower pitch tendency
    durationScale: 1.0,           // No correlation found
    pauseScale: 1.0,              // No correlation found

    // Voice quality (OPPOSITE)
    rdDelta: +0.1,                // Inferred: slightly breathier
    jitterScale: 0.85,            // β = -0.18 less rough
    shimmerScale: 0.90,           // Inferred: less variation

    // Formant modulation (OPPOSITE - less clear)
    f1Delta: -20,                 // β = -0.21 lower F1
    f2Delta: -20,                 // β = -0.23 lower F2
    f3Delta: 0,
    fbw1Scale: 1.15,              // Wider BW = less clear
    fbw2Scale: 1.10,
    fbw3Scale: 1.0,

    // Spectral
    spectralTiltBoost: +2,        // Less sharp = more tilt
  },

  // Depressive state - MALE
  // Males become: quieter, slurred speech, paradoxically SMOOTHER voice
  depressive_male: {
    // Prosodic
    intensityBoost: -5,           // β = -1.07 quieter
    f0Scale: 1.0,                 // No significant correlation
    durationScale: 1.05,          // Slightly slower (inferred)
    pauseScale: 0.85,             // β = 0.56 paradoxically longer calls

    // Voice quality
    rdDelta: +0.2,                // Inferred: slightly breathier
    jitterScale: 0.90,            // β = -0.63 LESS rough (surprising)
    shimmerScale: 1.0,

    // Formant modulation (slurred speech)
    f1Delta: 0,                   // No significant correlation
    f2Delta: 0,
    f3Delta: 0,
    fbw1Scale: 1.25,              // β = -1.0 spectral flux = wider BW
    fbw2Scale: 1.15,
    fbw3Scale: 1.0,

    // Spectral
    spectralTiltBoost: +2,        // Less harmonic content
  },

  // Depressive state - FEMALE
  // NO significant correlations with HDRS total score
  // Only psychomotor retardation (HDRS Q8) shows effects
  depressive_female: {
    // Use minimal modulation - depression doesn't reliably
    // manifest in female voice parameters
    intensityBoost: 0,
    f0Scale: 1.0,
    durationScale: 1.0,
    pauseScale: 1.1,              // Slight pause increase (inferred)

    rdDelta: +0.1,
    jitterScale: 1.0,
    shimmerScale: 1.0,

    f1Delta: 0,
    f2Delta: 0,
    f3Delta: 0,
    fbw1Scale: 1.0,
    fbw2Scale: 1.0,
    fbw3Scale: 1.0,

    spectralTiltBoost: 0,

    // Note: For psychomotor retardation specifically:
    // loudness INCREASES (β = 0.02) - opposite of males!
    // shimmer INCREASES (β = 0.01)
  }
};
```

#### Helper Function for Sex-Aware Preset Selection

```javascript
// Kaczmarek-Majer 2024: Sex-dependent bipolar state profiles
// CRITICAL: Clinical presets require speakerSex to be specified
function getClinicalMoodProfile(state, speakerSex) {
  if (!speakerSex) {
    throw new Error(
      'Speaker sex required for clinical mood state presets ' +
      '(Kaczmarek-Majer 2024: male/female patterns invert)'
    );
  }

  const key = `${state}_${speakerSex}`;

  if (CLINICAL_MOOD_PROFILES[key]) {
    return CLINICAL_MOOD_PROFILES[key];
  }

  // Fallback: use male profile with warning
  console.warn(`No profile for ${key}, using male profile`);
  return CLINICAL_MOOD_PROFILES[`${state}_male`];
}
```

#### Key Differences from Emotion Presets

| Dimension | Emotion Presets (§2.4) | Clinical Mood Presets (§2.10) |
|-----------|------------------------|-------------------------------|
| **Data source** | Acted/laboratory | Naturalistic phone calls |
| **Sex specificity** | Not required | **MANDATORY** |
| **Effect magnitude** | Large (performative) | Moderate (correlational) |
| **Directionality** | Consistent across speakers | **Inverts by sex for mania** |
| **Depression markers** | Clear acoustic profile | Weak for females |

#### Overlap with Existing Presets

| Emotion Preset | Clinical Overlap | Notes |
|----------------|------------------|-------|
| `fatigued` | Partial w/ depressive | Both: +pauseScale, +rdDelta. But fatigued has INCREASED F0 variance |
| `sad` | Strong w/ depressive_male | Both: quieter, wider BW1. Sad has formant elevation; depressive doesn't |
| `angry` | Partial w/ manic_male | Both: louder, faster, pressed. Angry is more extreme |

#### Limitations

1. **Polish speakers only** - may not generalize to other languages
2. **Naturalistic phone calls** - different from studio recording or TTS context
3. **Medication effects not controlled** - could be confounding
4. **No healthy controls** - compared to euthymia, not healthy baseline
5. **Female depression** - weak voice markers; preset is minimal

---

