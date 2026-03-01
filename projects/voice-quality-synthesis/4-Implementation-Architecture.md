## 4. Implementation Architecture

### 4.0 Existing Infrastructure (Already Implemented)

**The Rd → LF source binding is COMPLETE.** The following infrastructure already exists and is ready to use:

#### Rd Parameter Definition (semantics.yaml)

```yaml
# experiments/klatt80-baseline/semantics.yaml, lines 215-219
Rd:
  description: "LF model voice quality parameter"
  type: float
  default: 1.0
  range: [0.3, 2.7]
```

The Rd parameter follows Fant (1995) conventions:
- **0.3**: Pressed voice (low Rd = high tension, low open quotient)
- **1.0**: Modal voice (default, neutral phonation)
- **2.7**: Breathy voice (high Rd = relaxed, high open quotient)

#### Rd Binding in Graph (graph.yaml)

```yaml
# experiments/klatt80-baseline/graph.yaml, lines 24-29
lfSource:
  type: lf-source
  params:
    f0: { bind: F0 }
    rd: { bind: Rd }
    lfMode: { bind: lfMode }
```

The binding uses the standard `{ bind: <param> }` pattern, which means:
1. The interpreter reads `Rd` from each track frame's params
2. The value is scheduled to the LF source's `rd` AudioParam
3. The LF source internally derives Ra, Rk, Rg, Oq from Rd per Fant (1995)

#### LF Source Implementation (crates/lf-source/src/lib.rs)

The LF source already implements complete Rd → LF parameter derivation:

```rust
// Fant (1995) Rd → (Ra, Rk, Rg) derivation
let ra = (-1.0 + 4.8 * rd_clamped) / 100.0;
let rk = (22.4 + 11.8 * rd_clamped) / 100.0;
let rg_denom = 0.44 * rd_clamped - 4.0 * ra * (0.5 + 1.2 * rk);
let rg = rk * (0.5 + 1.2 * rk) / rg_denom;
let oq = (1.0 + rk) / (2.0 * rg);
```

It also includes:
- Glottal formant filter (biquad) per Perrotin et al. (2021)
- Spectral tilt filter (1-pole lowpass) per Perrotin et al. (2021) Eq. C4/D2

#### What This Means for Implementation

**To use voice quality modulation, you only need to set `Rd` in track frame params.** The synthesizer will:
1. Read Rd from the frame
2. Schedule it to the LF source via the existing binding
3. Compute the correct glottal waveform shape

Example track frame with voice quality:
```javascript
{
  time: 0.5,
  params: {
    F0: 120,
    F1: 500, F2: 1500, F3: 2500,
    AV: 60,
    Rd: 0.7,  // ← Pressed voice (male speaker)
    // ... other params
  }
}
```

### 4.1 TTS Frontend Changes

**File:** `src/tts-frontend-rules.js`

**New/Modified Functions:**

```javascript
// NEW: Voice quality rule application
function rule_VoiceQuality(phonemeList, speakerConfig, emotion = 'neutral') {
  const baseRd = speakerConfig.baseRd || 0.7;  // Default male

  for (const phoneme of phonemeList) {
    // 1. Phoneme-specific Rd
    const phonemeRdDelta = PHONEME_RD[phoneme.phoneme] ?? 0;

    // 2. Stress modulation
    const stressRdDelta = getStressRdDelta(phoneme.stress);

    // 3. Emotion preset
    const emotionProfile = EMOTION_PROFILES[emotion] || EMOTION_PROFILES.neutral;
    const emotionRdDelta = emotionProfile.rdDelta;

    // 4. Effort generation (stress → effort)
    const effort = EFFORT_BY_STRESS[phoneme.stress] ?? 0;
    const effortRdDelta = effort * EFFORT_COEFFS.rdPerDb;

    // Sum deltas (phrase contour applied later)
    phoneme.params.Rd = baseRd + phonemeRdDelta + stressRdDelta + emotionRdDelta + effortRdDelta;
    phoneme.params.effort = effort;

    // Emotion-based prosody adjustments
    if (emotionProfile.ahBoost) {
      phoneme.params.AH = (phoneme.params.AH || 0) + emotionProfile.ahBoost;
    }

    // 5. Emotion-based formant modulation (France 2000)
    // Formant frequency offsets (Hz)
    if (emotionProfile.f1Delta) {
      phoneme.params.F1 = (phoneme.params.F1 || 500) + emotionProfile.f1Delta;
    }
    if (emotionProfile.f2Delta) {
      phoneme.params.F2 = (phoneme.params.F2 || 1500) + emotionProfile.f2Delta;
    }
    if (emotionProfile.f3Delta) {
      phoneme.params.F3 = (phoneme.params.F3 || 2500) + emotionProfile.f3Delta;
    }

    // Formant bandwidth scaling (multiplicative)
    if (emotionProfile.fbw1Scale && emotionProfile.fbw1Scale !== 1.0) {
      phoneme.params.B1 = (phoneme.params.B1 || 60) * emotionProfile.fbw1Scale;
    }
    if (emotionProfile.fbw2Scale && emotionProfile.fbw2Scale !== 1.0) {
      phoneme.params.B2 = (phoneme.params.B2 || 90) * emotionProfile.fbw2Scale;
    }
    if (emotionProfile.fbw3Scale && emotionProfile.fbw3Scale !== 1.0) {
      phoneme.params.B3 = (phoneme.params.B3 || 150) * emotionProfile.fbw3Scale;
    }
  }

  return phonemeList;
}

// NEW: Phrase-level Rd contour
function rule_RdPhraseContour(frames, phrases, speakerConfig) {
  const baseRd = speakerConfig.baseRd || 0.7;

  for (const phrase of phrases) {
    const phraseFrames = frames.filter(f =>
      f.time >= phrase.start && f.time <= phrase.end
    );

    for (const frame of phraseFrames) {
      const rdContourDelta = computeRdPhraseContour(
        frame.time, phrase.start, phrase.end, baseRd
      );

      // Add phrase contour to existing Rd
      frame.params.Rd += rdContourDelta;

      // Clamp to valid range
      frame.params.Rd = Math.max(0.3, Math.min(2.7, frame.params.Rd));
    }
  }

  // Apply Rd-AV covariation (Fant 1997)
  for (const frame of frames) {
    const rdRatio = baseRd / frame.params.Rd;
    const avAdjust = 40 * Math.log10(rdRatio);  // 2:1 covariation
    frame.params.AV = (frame.params.AV || 60) + avAdjust;
  }

  return frames;
}

// MODIFIED: Main pipeline integration
async function textToKlattTrack(text, options = {}) {
  const { emotion = 'neutral', speakerConfig = {} } = options;

  // ... existing text normalization, transcription ...

  // Apply phonological rules (Klatt 1979)
  phonemeList = applyPhonologicalRules(phonemeList);

  // Assign base acoustic parameters
  phonemeList = assignAcousticParameters(phonemeList);

  // NEW: Voice quality rules
  phonemeList = rule_VoiceQuality(phonemeList, speakerConfig, emotion);

  // Apply context-dependent coarticulation
  phonemeList = rule_StopBurstContext(phonemeList);

  // Duration rules
  phonemeList = rule_StressDuration(phonemeList);
  // ... other duration rules ...

  // F0 contour generation
  const f0Contour = options.f0Model === 'fujisaki'
    ? rule_GenerateF0ContourFujisaki(phonemeList, speakerConfig.baseF0)
    : rule_GenerateF0Contour(phonemeList, speakerConfig.baseF0);

  // Generate track frames
  let track = generateTrackFrames(phonemeList);

  // Apply F0 contour
  applyF0ToTrack(track, f0Contour);

  // NEW: Phrase-level Rd contour
  track = rule_RdPhraseContour(track, detectPhrases(phonemeList), speakerConfig);

  // Optional: SPG smoothing (formants only, not Rd)
  if (options.smoothFormants) {
    track = smoothTrack(track, { params: ['F1', 'F2', 'F3'] });
  }

  return track;
}
```

### 4.2 Semantics.yaml Changes

**File:** `experiments/klatt80-baseline/semantics.yaml`

```yaml
# Add to params section
params:
  # Voice quality - Fant (1995, 1997)
  Rd:
    type: float
    range: [0.3, 2.7]
    default: 1.0
    description: "LF model Rd parameter (0.3=pressed, 1.0=modal, 2.7=breathy)"

  # Vocal effort - Liénard (1999)
  effort:
    type: float
    range: [-10, 10]
    default: 0
    unit: dB
    description: "Vocal effort in dB (Liénard 1999)"

# Add to constants section
constants:
  # Liénard & Di Benedetto (1999) JASA 106(1):411-422
  effortCoeffs:
    f0HzPerDb: 5.1
    f1HzPerDb: 3.5
    rdPerDb: -0.05
    a1Slope: 1.10
    a2Slope: 1.24
    a3Slope: 1.30

# Add/modify realize section
realize:
  # Effort-adjusted F0
  f0Effective:
    expr: "F0 + effort * effortCoeffs.f0HzPerDb"
    deps: [F0, effort]

  # Effort-adjusted F1
  f1Effective:
    expr: "F1 + effort * effortCoeffs.f1HzPerDb"
    deps: [F1, effort]

  # Spectral tilt in parallel amplitudes
  a1Linear:
    expr: "dbToLinear(A1 + n12Cor + ndbScale.A1 + (effortCoeffs.a1Slope - 1) * effort) * parallelScale"
    deps: [A1, n12Cor, parallelScale, effort]

  a2Linear:
    expr: "-dbToLinear(A2 + n12Cor * 2 + n23Cor + ndbScale.A2 + (effortCoeffs.a2Slope - 1) * effort) * parallelScale"
    deps: [A2, n12Cor, n23Cor, parallelScale, effort]

  a3Linear:
    expr: "dbToLinear(A3 + n23Cor * 2 + n34Cor + ndbScale.A3 + (effortCoeffs.a3Slope - 1) * effort) * parallelScale"
    deps: [A3, n23Cor, n34Cor, parallelScale, effort]
```

### 4.3 Source Model Changes

**Current State:** LF source (`crates/lf-source/`) already implements Rd → (Ra, Rk, Rg, Oq) derivation and spectral tilt filter. No WASM changes needed for basic voice quality.

**Future Enhancements (from paper scout):**

1. **LFLM Filter Path** (Perrotin 2021)
   - 10-100x faster than current LF
   - Biquad glottal formant + 1-pole spectral tilt
   - Perceptually equivalent
   - Implement as alternative source mode

2. **Pulsatile Noise** (Fraj 2011)
   - More natural breathiness than constant AH
   - Noise bursts synchronized to glottal cycles
   - Add to lf-source as optional mode

3. **Jitter** (Fraj 2011)
   - For creaky/rough voice
   - `T0_n = T0_mean * (1 + jitter * random())`
   - Add jitter parameter to lf-source

**Recommended Implementation Order:**
1. Use existing LF source with Rd modulation (immediate)
2. Add LFLM filter path for efficiency (Phase 2)
3. Add pulsatile noise for breathiness (Phase 3)
4. Add jitter for creaky voice (Phase 4)

### 4.4 Emotion API

The emotion API provides user-facing control over voice quality synthesis. It allows specifying emotional style for speech synthesis.

#### Interface

```typescript
interface TTSOptions {
  /** Base F0 in Hz (default: 110) */
  baseF0?: number;

  /** Transition time in ms for formant smoothing (default: 30) */
  transitionMs?: number;

  /** Emotion preset name (default: 'neutral') */
  emotion?: 'neutral' | 'angry' | 'happy' | 'sad' | 'soft' | 'loud' | 'anxious' | 'fatigued';

  /** Speaker configuration */
  speakerConfig?: {
    baseRd?: number;     // 0.7 male, 1.4 female
    baseF0?: number;     // Overrides options.baseF0 if set
  };
}

function textToKlattTrack(text: string, options?: TTSOptions): KlattTrack;
```

#### Available Emotions

| Emotion | Rd Delta | F0 Scale | Duration | Primary Cue | Source |
|---------|----------|----------|----------|-------------|--------|
| `neutral` | 0.0 | 1.0 | 1.0 | Modal baseline | - |
| `angry` | -0.5 | 1.3 | 0.85 | Pressed voice, faster | Cummings 1995 |
| `happy` | -0.2 | 1.15 | 0.9 | Slight press, higher F0 | Gobl 2003 |
| `sad` | +0.3 | 1.0 | 1.2 | Breathy, formant shifts | France 2000 |
| `soft` | +1.2 | 0.95 | 1.1 | Very breathy, -6 dB | Cummings 1995 |
| `loud` | -0.4 | 1.1 | 0.95 | Pressed, +8 dB | Cummings 1995 |
| `anxious` | +0.1 | 1.1 | 1.0 | 40% more pauses | Laukka 2008 |
| `fatigued` | +0.2 | 1.0 | 1.15 | High F0 variance | Vogel 2010 |

#### Backward Compatibility

The function detects old-style positional calls:

```javascript
// Old style (deprecated but supported)
textToKlattTrack("Hello", 120, 25)

// Detected by: typeof arg2 === 'number'
// Converted to: { baseF0: 120, transitionMs: 25 }
```

#### Usage Examples

```javascript
// Neutral (default)
const neutral = textToKlattTrack("Hello world");

// Happy with custom base F0
const happy = textToKlattTrack("Hello world", {
  emotion: 'happy',
  baseF0: 150
});

// Female speaker with sad emotion
const track = textToKlattTrack("I understand", {
  emotion: 'sad',
  speakerConfig: {
    baseRd: 1.4,     // Female baseline
    baseF0: 190
  }
});
```

#### Granularity

- **v1**: Per-utterance emotion (entire text gets same emotion)
- **Future**: Per-phrase emotion via segment annotations or SSML-style markup

#### Error Handling

Unknown emotion names fall back to neutral with console warning:

```javascript
textToKlattTrack("Hello", { emotion: 'furious' })
// Console: "[TTS] Unknown emotion 'furious', using neutral"
```

#### Design Rationale

1. **Options object** preferred over positional params for extensibility
2. **Discrete presets** based on research literature, not ad-hoc scales
3. **Defaults to neutral** - no surprise voice quality changes
4. **Per-utterance scope** simplest for v1; architecture supports finer granularity

See `reports/vq-writer-4-emotion-api.md` for detailed design rationale.

### 4.5 Pause Scale (Temporal Emotion Cue)

The `pauseScale` parameter modulates pause durations as a temporal cue for emotional state. This is distinct from voice quality (Rd) and prosodic (F0) parameters because it operates on **silence frames** rather than acoustic parameters.

**Source:** Laukka et al. (2008) found that temporal disruption (pauses) is the **primary acoustic cue** for anxious speech, with effect size eta-squared = 0.21. Voice quality changes are secondary.

#### What pauseScale Does

```
actual_pause_duration = base_pause_duration * pauseScale
```

| pauseScale | Effect | Emotion Example |
|------------|--------|-----------------|
| 0.7 | Shorter pauses (rushed, confident) | angry, loud |
| 1.0 | Unchanged (neutral pacing) | neutral |
| 1.2-1.4 | Longer pauses (hesitant, slow) | anxious, sad, fatigued |

#### Pipeline Location

pauseScale is applied in the TTS frontend **after duration assignment, before track frame generation**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. PROSODIC CONTOURS                                                    │
│    - F0 contour (Fujisaki or linear)                                    │
│    - Duration adjustments (pre-boundary lengthening, etc.)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5b. PAUSE SCALING (NEW)                                                 │
│    - Identify silence/pause segments in phoneme list                    │
│    - Apply pauseScale multiplier to pause durations                     │
│    - Optional: insert hesitation pauses when pauseScale > 1.2           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. EFFORT-DERIVED ADJUSTMENTS                                           │
│    ...                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

This placement ensures:
1. Base pause durations are already assigned (from phonotactic rules)
2. Pre-boundary lengthening has been applied
3. pauseScale modifies the final pause duration before frame generation

#### Implementation

**File:** `src/tts-frontend-rules.js`

```javascript
// NEW: Apply pause scaling for emotion-based temporal modulation
// Source: Laukka et al. (2008) - pauses as primary cue for anxious speech
function rule_PauseScale(phonemeList, emotionProfile) {
  const pauseScale = emotionProfile.pauseScale ?? 1.0;

  for (const segment of phonemeList) {
    // Identify pause segments (silence, word boundaries)
    if (segment.phoneme === 'SIL' || segment.phoneme === 'PAU') {
      segment.duration *= pauseScale;
    }
  }

  // Optional: Insert hesitation pauses for high pauseScale values
  // (anxious/fatigued speech has more frequent pauses, not just longer ones)
  if (pauseScale > 1.2) {
    insertHesitationPauses(phonemeList, pauseScale);
  }

  return phonemeList;
}

// Insert additional pauses at phrase-internal word boundaries
function insertHesitationPauses(phonemeList, pauseScale) {
  const hesitationProbability = (pauseScale - 1.0) * 0.3; // 30% per 1.0 scale increase
  const hesitationDuration = 80; // ms, typical filled pause duration

  // Find word boundaries (marked by stress=1 or explicit boundary markers)
  const insertions = [];
  for (let i = 1; i < phonemeList.length - 1; i++) {
    const segment = phonemeList[i];
    const prev = phonemeList[i - 1];

    // Insert at word-initial stressed syllables (potential hesitation points)
    if (segment.stress === 1 && prev.phoneme !== 'SIL' && prev.phoneme !== 'PAU') {
      if (Math.random() < hesitationProbability) {
        insertions.push({
          index: i,
          pause: { phoneme: 'PAU', duration: hesitationDuration, params: {} }
        });
      }
    }
  }

  // Insert in reverse order to preserve indices
  for (const ins of insertions.reverse()) {
    phonemeList.splice(ins.index, 0, ins.pause);
  }
}
```

**Integration in main pipeline (textToKlattTrack):**

```javascript
async function textToKlattTrack(text, options = {}) {
  const { emotion = 'neutral', speakerConfig = {} } = options;
  const emotionProfile = EMOTION_PROFILES[emotion] || EMOTION_PROFILES.neutral;

  // ... existing pipeline stages 1-5 ...

  // Duration rules (stage 5)
  phonemeList = rule_StressDuration(phonemeList);
  phonemeList = rule_PreBoundaryLengthening(phonemeList);

  // NEW: Pause scaling (stage 5b) - after duration rules, before frame generation
  phonemeList = rule_PauseScale(phonemeList, emotionProfile);

  // Generate track frames (stage 6+)
  let track = generateTrackFrames(phonemeList);
  // ...
}
```

#### Emotion Preset Values

From Section 2.4 (Parameter Specifications):

| Emotion | pauseScale | Rationale |
|---------|------------|-----------|
| neutral | 1.0 | Baseline |
| angry | 0.7 | Confident, assertive, no hesitation |
| loud | 0.8 | Assertive speech |
| happy | 0.85 | Fluent, energetic |
| soft | 1.1 | Gentle pacing |
| sad | 1.3 | Slow, hesitant [France 2000] |
| fatigued | 1.3 | Effortful speech, needs recovery pauses [Vogel 2010] |
| anxious | 1.4 | **Primary cue** for anxiety [Laukka 2008, eta-squared=0.21] |

#### Interaction with Other Parameters

- **durationScale**: Affects *all* segment durations (phonemes + pauses). pauseScale affects *only* pauses.
- **Pre-boundary lengthening**: Applied before pauseScale, so final vowels get lengthened, then pauses get scaled.
- **Rd phrase contour**: Independent - voice quality contour and pause timing operate in parallel.

#### Design Note

pauseScale is a **temporal** parameter, not an **acoustic** parameter. It never reaches the WebAudio graph or semantics.yaml. It exists only in the TTS frontend during track generation, modifying the time coordinates of silence frames.

---

