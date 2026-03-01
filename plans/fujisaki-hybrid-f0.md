# Plan: Hybrid Fujisaki F0 Contour Generation

## Overview

Replace Qlatt's linear F0 declination model with a hybrid system that:
1. **Data-driven**: Command placement and magnitudes derived from phoneme context
2. **Fujisaki dynamics**: Physiologically-grounded response functions for natural contours

## Current State

**File:** `src/tts-frontend-rules.js:1261-1375`

```javascript
// Current approach: linear declination + hard-coded stress peaks
targetF0 = baseF0 - fallRate * position;        // Linear fall
targetF0 *= 1 + 0.08 * exp(-3 * position);      // Initial boost
peakF0 = targetF0 * stressRise;                 // stressRise = 1.15 (hard-coded)
```

**Problems:**
- Linear transitions sound robotic
- Fixed 15% stress rise regardless of context
- No distinction between pitch accent types
- Phrase components are just resets, not shaped curves

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PHONEME SEQUENCE (data-driven)                  │
│  [{phoneme, stress, word, duration, type, params, ...}, ...]        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    COMMAND EXTRACTION                                │
│  - Detect phrase boundaries → phrase commands (Ap, T0)              │
│  - Detect stressed vowels → accent commands (Aa, T1, T2)            │
│  - Context-dependent magnitude lookup/computation                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FUJISAKI RESPONSE GENERATION                      │
│  log(F0) = log(Fb) + Σ Ap·Gp(t-T0) + Σ Aa·[Ga(t-T1) - Ga(t-T2)]    │
│                                                                      │
│  Gp(t) = α²t·exp(-αt)                    [phrase: impulse response] │
│  Ga(t) = min[1-(1+βt)·exp(-βt), γ]       [accent: step response]    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    F0 CONTOUR OUTPUT                                 │
│  [{time: 0.0, f0: 110}, {time: 0.05, f0: 112}, ...]                 │
│  (Same format as current rule_GenerateF0Contour output)             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Core Fujisaki Functions

### 1.1 Response Functions

**File:** `src/fujisaki.js` (new)

```javascript
/**
 * Phrase control impulse response (critically-damped 2nd order)
 * Models slow, global F0 movements from pars obliqua of CT muscle
 *
 * @param {number} t - Time in seconds (relative to command)
 * @param {number} alpha - Natural frequency (~3 rad/s typical)
 * @returns {number} Response value (dimensionless, adds to log F0)
 */
export function Gp(t, alpha = 3.0) {
  if (t < 0) return 0;
  return alpha * alpha * t * Math.exp(-alpha * t);
}

/**
 * Accent control step response (critically-damped 2nd order)
 * Models fast, local F0 movements from pars recta of CT muscle
 *
 * @param {number} t - Time in seconds (relative to command)
 * @param {number} beta - Natural frequency (~20 rad/s typical)
 * @param {number} gamma - Ceiling level (0.9 typical)
 * @returns {number} Response value (dimensionless, adds to log F0)
 */
export function Ga(t, beta = 20.0, gamma = 0.9) {
  if (t < 0) return 0;
  return Math.min(1 - (1 + beta * t) * Math.exp(-beta * t), gamma);
}
```

### 1.2 Contour Generator

```javascript
/**
 * Generate F0 contour from phrase and accent commands
 *
 * @param {number} Fb - Baseline F0 in Hz
 * @param {Array<{Ap: number, T0: number}>} phraseCommands
 * @param {Array<{Aa: number, T1: number, T2: number}>} accentCommands
 * @param {number} duration - Total duration in seconds
 * @param {number} sampleRate - Points per second (e.g., 200 for 5ms frames)
 * @param {Object} params - {alpha, beta, gamma}
 * @returns {Array<{time: number, f0: number}>}
 */
export function generateF0Contour(
  Fb,
  phraseCommands,
  accentCommands,
  duration,
  sampleRate = 200,
  { alpha = 3.0, beta = 20.0, gamma = 0.9 } = {}
) {
  const contour = [];
  const dt = 1.0 / sampleRate;

  for (let t = 0; t <= duration; t += dt) {
    // Start with log of baseline
    let logF0 = Math.log(Fb);

    // Add phrase components
    for (const { Ap, T0 } of phraseCommands) {
      logF0 += Ap * Gp(t - T0, alpha);
    }

    // Add accent components (onset minus offset)
    for (const { Aa, T1, T2 } of accentCommands) {
      logF0 += Aa * (Ga(t - T1, beta, gamma) - Ga(t - T2, beta, gamma));
    }

    contour.push({ time: t, f0: Math.exp(logF0) });
  }

  return contour;
}
```

---

## Part 2: Command Extraction (Data-Driven)

### 2.1 Phrase Command Detection

Phrase commands occur at:
- Utterance onset (~200ms before first phoneme)
- Major syntactic boundaries (., !, ?)
- Minor boundaries (,) with smaller magnitude
- Utterance end (negative command for final lowering)

```javascript
/**
 * Extract phrase commands from phoneme sequence
 *
 * @param {Array} phonemeList - Phoneme sequence with timing
 * @returns {Array<{Ap: number, T0: number, type: string}>}
 */
export function extractPhraseCommands(phonemeList) {
  const commands = [];
  let currentTime = 0;

  // Utterance-initial command (200ms before onset)
  commands.push({
    Ap: 0.5,           // Initial phrase magnitude
    T0: -0.2,          // 200ms before start
    type: 'initial'
  });

  for (let i = 0; i < phonemeList.length; i++) {
    const ph = phonemeList[i];
    const duration = ph.duration / 1000; // Convert ms to s

    // Check for phrase boundaries
    if (ph.phoneme === 'SIL' && i > 0) {
      const prevPh = phonemeList[i - 1];

      // Look at what caused the silence
      if (prevPh.punctuation === '.' || prevPh.punctuation === '!') {
        // Major boundary: reset phrase, prepare for new one
        commands.push({
          Ap: -0.3,                    // Negative for final lowering
          T0: currentTime - 0.1,       // Just before silence
          type: 'major-end'
        });

        // If not utterance-final, add new phrase command
        if (i < phonemeList.length - 1) {
          commands.push({
            Ap: 0.4,                   // Slightly smaller than initial
            T0: currentTime + duration - 0.1, // Before next phrase
            type: 'major-onset'
          });
        }
      } else if (prevPh.punctuation === ',') {
        // Minor boundary: smaller reset
        commands.push({
          Ap: 0.2,
          T0: currentTime + duration - 0.1,
          type: 'minor'
        });
      }
    }

    currentTime += duration;
  }

  // Utterance-final lowering (if not already added)
  const lastCommand = commands[commands.length - 1];
  if (lastCommand.type !== 'major-end') {
    commands.push({
      Ap: -0.4,
      T0: currentTime - 0.15,
      type: 'final'
    });
  }

  return commands;
}
```

### 2.2 Accent Command Detection

Accent commands align with stressed syllables:
- Onset (T1): ~40-50ms before stressed vowel onset
- Offset (T2): ~40-50ms before stressed vowel offset
- Magnitude (Aa): Context-dependent (see Part 3)

```javascript
/**
 * Extract accent commands from phoneme sequence
 *
 * @param {Array} phonemeList - Phoneme sequence with timing and stress
 * @param {Function} getMagnitude - Context → magnitude function (data-driven)
 * @returns {Array<{Aa: number, T1: number, T2: number, phoneme: string}>}
 */
export function extractAccentCommands(phonemeList, getMagnitude) {
  const commands = [];
  let currentTime = 0;

  for (let i = 0; i < phonemeList.length; i++) {
    const ph = phonemeList[i];
    const duration = ph.duration / 1000;

    // Only process stressed vowels
    if (ph.type === 'vowel' && ph.stress === 1) {
      const context = buildAccentContext(phonemeList, i);
      const Aa = getMagnitude(context);

      commands.push({
        Aa: Aa,
        T1: currentTime - 0.045,           // 45ms before vowel onset
        T2: currentTime + duration - 0.045, // 45ms before vowel offset
        phoneme: ph.phoneme,
        context: context  // Keep for debugging/learning
      });
    }

    currentTime += duration;
  }

  return commands;
}

/**
 * Build context features for accent magnitude lookup
 */
function buildAccentContext(phonemeList, index) {
  const ph = phonemeList[index];
  const prev = index > 0 ? phonemeList[index - 1] : null;
  const next = index < phonemeList.length - 1 ? phonemeList[index + 1] : null;

  return {
    // Phoneme identity
    phoneme: ph.phoneme,

    // Position features
    positionInUtterance: index / phonemeList.length,
    isFirstStress: !phonemeList.slice(0, index).some(p => p.stress === 1),
    isLastStress: !phonemeList.slice(index + 1).some(p => p.stress === 1),

    // Word position
    isWordInitial: prev?.word !== ph.word,
    isWordFinal: next?.word !== ph.word,

    // Prosodic context
    followedByPause: next?.phoneme === 'SIL',
    precededByPause: prev?.phoneme === 'SIL',

    // Vowel features
    vowelHeight: ph.hi ? 'high' : ph.low ? 'low' : 'mid',
    vowelBackness: ph.back ? 'back' : ph.front ? 'front' : 'central',

    // Duration (intrinsic prominence cue)
    duration: ph.duration
  };
}
```

---

## Part 3: Data-Driven Magnitude Functions

### 3.1 Rule-Based Baseline (Phase 1)

Start with interpretable rules that can be tuned:

```javascript
/**
 * Rule-based accent magnitude function
 * Returns Aa value (typically 0.1 to 0.6)
 */
export function getAccentMagnitudeRules(context) {
  let Aa = 0.3;  // Base magnitude

  // Position-based adjustments
  if (context.isFirstStress) {
    Aa += 0.15;  // First accent is prominent
  }
  if (context.isLastStress && !context.followedByPause) {
    Aa += 0.1;   // Nuclear accent (sentence focus)
  }

  // Declination: reduce magnitude through utterance
  Aa *= 1.0 - 0.3 * context.positionInUtterance;

  // Pre-boundary strengthening
  if (context.followedByPause) {
    Aa *= 1.2;
  }

  // Vowel intrinsic effects (high vowels have higher F0)
  if (context.vowelHeight === 'high') {
    Aa *= 0.9;  // Reduce command since intrinsic F0 is higher
  } else if (context.vowelHeight === 'low') {
    Aa *= 1.1;  // Boost to compensate for intrinsic low F0
  }

  return Math.max(0.1, Math.min(0.6, Aa));  // Clamp to reasonable range
}

/**
 * Rule-based phrase magnitude function
 * Adjusts the default phrase commands based on context
 */
export function getPhraseMagnitudeRules(type, context) {
  const baseMagnitudes = {
    'initial': 0.5,
    'major-onset': 0.4,
    'major-end': -0.3,
    'minor': 0.2,
    'final': -0.4
  };

  let Ap = baseMagnitudes[type] || 0.3;

  // Adjust for sentence type (if available)
  if (context.isQuestion) {
    if (type === 'final') {
      Ap = 0.3;  // Rise instead of fall for questions
    }
  }

  return Ap;
}
```

### 3.2 Lookup Table (Phase 2)

Graduate to learned/tuned values stored in a table:

**File:** `src/accent-magnitudes.yaml` (new)

```yaml
# Accent magnitude lookup table
# Key: context hash → magnitude value
# Values tuned from listening tests or corpus analysis

defaults:
  base_magnitude: 0.30
  alpha: 3.0
  beta: 20.0
  gamma: 0.9
  baseline_f0_male: 110
  baseline_f0_female: 200

# Position-based modifiers (multiplicative)
position_modifiers:
  first_stress: 1.5
  last_stress: 1.3
  utterance_initial: 1.2
  utterance_final: 0.8
  pre_boundary: 1.2

# Phoneme-specific base magnitudes
phoneme_magnitudes:
  # Tense vowels - longer, more prominent
  IY: 0.32
  EY: 0.30
  AY: 0.35
  OW: 0.30
  UW: 0.28

  # Lax vowels - shorter, less prominent
  IH: 0.28
  EH: 0.30
  AE: 0.32
  AH: 0.25
  UH: 0.26

  # Reduced vowels
  AX: 0.15
  IX: 0.12

# Word class modifiers (requires POS tagging)
word_class_modifiers:
  content_word: 1.0
  function_word: 0.6
  focus_word: 1.4      # If focus marking available

# Phrase command magnitudes
phrase_magnitudes:
  utterance_initial: 0.50
  major_boundary_onset: 0.40
  major_boundary_end: -0.35
  minor_boundary: 0.20
  utterance_final_statement: -0.40
  utterance_final_question: 0.30
  utterance_final_exclamation: -0.50
```

### 3.3 Learned Model (Phase 3 - Future)

Train a small neural network or gradient-boosted model:

```javascript
/**
 * ML-based magnitude prediction (future extension)
 *
 * Training data:
 *   - Input: context features (one-hot phoneme, position, word features)
 *   - Output: optimal Aa/Ap from Analysis-by-Synthesis on natural speech
 *
 * Model options:
 *   - Linear regression (interpretable, fast)
 *   - Small MLP (2 hidden layers, ~50 params)
 *   - XGBoost (if we want feature importance)
 */
export class LearnedMagnitudeModel {
  constructor(weightsPath) {
    this.weights = loadWeights(weightsPath);
  }

  predict(context) {
    const features = this.encodeContext(context);
    return this.forward(features);
  }

  encodeContext(context) {
    // Convert context object to feature vector
    // One-hot encode categorical, normalize continuous
    return [...];
  }
}
```

---

## Part 4: Integration with Existing Pipeline

### 4.1 New F0 Generation Function

**File:** `src/tts-frontend-rules.js` (modify)

```javascript
import {
  generateF0Contour,
  extractPhraseCommands,
  extractAccentCommands,
  getAccentMagnitudeRules
} from './fujisaki.js';

/**
 * Fujisaki-based F0 contour generation (replaces rule_GenerateF0Contour)
 *
 * @param {Array} phonemeList - Phoneme sequence with timing
 * @param {number} baseF0 - Baseline frequency in Hz
 * @param {Object} options - Model parameters
 * @returns {Array<{time: number, f0: number}>}
 */
export function rule_GenerateF0ContourFujisaki(
  phonemeList,
  baseF0 = 110,
  options = {}
) {
  const {
    alpha = 3.0,
    beta = 20.0,
    gamma = 0.9,
    magnitudeFunction = getAccentMagnitudeRules,
    questionRise = true
  } = options;

  // Calculate total duration
  const totalDuration = phonemeList.reduce((sum, ph) => sum + ph.duration, 0) / 1000;

  // Detect if this is a question (for phrase command adjustment)
  const isQuestion = phonemeList.some(ph => ph.punctuation === '?');

  // Extract commands from phoneme data
  const phraseCommands = extractPhraseCommands(phonemeList);
  const accentCommands = extractAccentCommands(phonemeList, magnitudeFunction);

  // Adjust final phrase command for questions
  if (isQuestion && questionRise) {
    const finalCmd = phraseCommands.find(c => c.type === 'final');
    if (finalCmd) {
      finalCmd.Ap = 0.3;  // Rise instead of fall
    }
  }

  // Generate contour
  const contour = generateF0Contour(
    baseF0,
    phraseCommands,
    accentCommands,
    totalDuration,
    200,  // 5ms frame rate
    { alpha, beta, gamma }
  );

  return contour;
}
```

### 4.2 Switchable F0 Mode

**File:** `src/tts-frontend.js` (modify around line 647)

```javascript
// Add option to choose F0 model
const f0Model = options.f0Model || 'fujisaki';  // or 'linear' for legacy

let f0Contour;
if (f0Model === 'fujisaki') {
  f0Contour = rule_GenerateF0ContourFujisaki(parameterSequence, baseF0, {
    alpha: options.fujisakiAlpha,
    beta: options.fujisakiBeta,
    gamma: options.fujisakiGamma
  });
} else {
  f0Contour = rule_GenerateF0Contour(parameterSequence, baseF0);
}
```

### 4.3 Expose Parameters in UI

**File:** `index.html` or control panel (if exists)

```html
<fieldset>
  <legend>F0 Model</legend>
  <select id="f0-model">
    <option value="fujisaki">Fujisaki (hybrid)</option>
    <option value="linear">Linear declination</option>
  </select>

  <div id="fujisaki-params">
    <label>α (phrase rate): <input type="range" id="alpha" min="1" max="10" step="0.5" value="3"></label>
    <label>β (accent rate): <input type="range" id="beta" min="10" max="40" step="1" value="20"></label>
    <label>Base F0: <input type="range" id="base-f0" min="80" max="300" step="5" value="110"></label>
  </div>
</fieldset>
```

---

## Part 5: Testing & Validation

### 5.1 Unit Tests

**File:** `test/fujisaki.test.js` (new)

```javascript
import { Gp, Ga, generateF0Contour } from '../src/fujisaki.js';

describe('Fujisaki response functions', () => {
  test('Gp returns 0 for negative time', () => {
    expect(Gp(-0.1)).toBe(0);
  });

  test('Gp peaks around t = 1/alpha', () => {
    const alpha = 3.0;
    const peakTime = 1 / alpha;
    const atPeak = Gp(peakTime, alpha);
    const before = Gp(peakTime - 0.1, alpha);
    const after = Gp(peakTime + 0.1, alpha);
    expect(atPeak).toBeGreaterThan(before);
    expect(atPeak).toBeGreaterThan(after);
  });

  test('Ga approaches gamma asymptotically', () => {
    const gamma = 0.9;
    expect(Ga(10, 20, gamma)).toBeCloseTo(gamma, 2);
  });

  test('Ga is 0 at t=0', () => {
    expect(Ga(0)).toBeCloseTo(0, 5);
  });
});

describe('F0 contour generation', () => {
  test('baseline only produces flat contour', () => {
    const contour = generateF0Contour(100, [], [], 1.0, 100);
    const allSame = contour.every(p => Math.abs(p.f0 - 100) < 0.01);
    expect(allSame).toBe(true);
  });

  test('phrase command creates rise then fall', () => {
    const contour = generateF0Contour(100, [{Ap: 0.5, T0: 0.2}], [], 1.0, 100);
    const peak = Math.max(...contour.map(p => p.f0));
    expect(peak).toBeGreaterThan(100);
    expect(contour[contour.length - 1].f0).toBeLessThan(peak);
  });

  test('accent command creates local hump', () => {
    const contour = generateF0Contour(100, [], [{Aa: 0.3, T1: 0.3, T2: 0.5}], 1.0, 100);
    const midF0 = contour.find(p => p.time >= 0.4).f0;
    const startF0 = contour[0].f0;
    const endF0 = contour[contour.length - 1].f0;
    expect(midF0).toBeGreaterThan(startF0);
    expect(midF0).toBeGreaterThan(endF0);
  });
});
```

### 5.2 Golden Master Tests

Compare output against known-good sentences:

```javascript
describe('F0 contour regression', () => {
  test('simple declarative matches golden', () => {
    const phonemes = loadPhonemeSequence('test/golden/hello-world-phonemes.json');
    const contour = rule_GenerateF0ContourFujisaki(phonemes, 110);
    const golden = loadGolden('test/golden/hello-world-f0.json');

    for (let i = 0; i < contour.length; i++) {
      expect(contour[i].f0).toBeCloseTo(golden[i].f0, 1); // Within 1 Hz
    }
  });
});
```

### 5.3 Listening Tests

Create A/B comparison samples:

```javascript
// Generate both versions for same text
const texts = [
  "Hello, how are you?",
  "The quick brown fox jumps over the lazy dog.",
  "I can't believe it's not butter!",
  "What time is it?"
];

for (const text of texts) {
  // Linear version
  const wavLinear = synthesize(text, { f0Model: 'linear' });
  saveWav(`test/comparison/${slug(text)}-linear.wav`, wavLinear);

  // Fujisaki version
  const wavFujisaki = synthesize(text, { f0Model: 'fujisaki' });
  saveWav(`test/comparison/${slug(text)}-fujisaki.wav`, wavFujisaki);
}
```

### 5.4 Visualization

Add F0 contour plotting to diagnostics:

```javascript
// In diagnostics output, show:
// 1. Raw F0 contour over time
// 2. Phrase commands (impulses) and accent commands (rectangles)
// 3. Phrase component and accent component separately
// 4. Final superimposed contour
```

---

## Part 6: Implementation Phases

### Phase 1: Core Functions (Day 1)
- [ ] Create `src/fujisaki.js` with Gp, Ga, generateF0Contour
- [ ] Unit tests for response functions
- [ ] Manual verification: plot response curves

### Phase 2: Command Extraction (Day 1-2)
- [ ] Implement extractPhraseCommands
- [ ] Implement extractAccentCommands
- [ ] Rule-based magnitude functions
- [ ] Integration test: simple sentence

### Phase 3: Pipeline Integration (Day 2)
- [ ] Add rule_GenerateF0ContourFujisaki to tts-frontend-rules.js
- [ ] Add f0Model switch to tts-frontend.js
- [ ] Verify existing tests still pass

### Phase 4: Tuning & Comparison (Day 3)
- [ ] Generate comparison audio (linear vs Fujisaki)
- [ ] Tune α, β, γ parameters by ear
- [ ] Tune magnitude rules for natural sound
- [ ] Create golden master tests

### Phase 5: Data-Driven Magnitudes (Day 4+)
- [ ] Create accent-magnitudes.yaml
- [ ] Implement YAML-based lookup
- [ ] Per-phoneme magnitude tuning
- [ ] Position-based modifier tuning

### Phase 6: Future Extensions
- [ ] Corpus-based magnitude learning
- [ ] Speaker-dependent parameter estimation
- [ ] Emotion/style modulation via command scaling

---

## Parameters to Tune

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| α (alpha) | 3.0 | 1-10 | Phrase component speed. Lower = slower rise/fall |
| β (beta) | 20.0 | 10-40 | Accent component speed. Lower = more gradual peaks |
| γ (gamma) | 0.9 | 0.7-1.0 | Accent ceiling. Prevents over-modulation |
| Fb (baseF0) | 110 | 80-300 | Speaker baseline. Higher for female voices |
| Ap (phrase mag) | 0.3-0.5 | 0.1-0.8 | Phrase prominence. Higher = more dynamic |
| Aa (accent mag) | 0.2-0.4 | 0.1-0.6 | Accent prominence. Higher = more stress contrast |

---

## Success Criteria

1. **Functional**: F0 contours generate without errors
2. **Correct Shape**: Phrase shows declination; accents show local peaks
3. **Natural Dynamics**: Rise/fall times match natural speech (~50-200ms)
4. **Improved Quality**: Listener preference for Fujisaki over linear (A/B test)
5. **Tunable**: Parameters demonstrably affect output
6. **Data-Ready**: Magnitude functions can be swapped for learned versions

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Over-engineering | Start with simplest rule-based magnitudes; iterate |
| Wrong timings | Follow Fujisaki's empirical values (40-50ms offsets) |
| Parameter sensitivity | Provide sensible defaults; expose sliders for tuning |
| Integration breakage | Keep old F0 model as fallback; A/B switch |
| Sounds worse | Compare carefully; may need per-phoneme tuning |

---

## References

- Fujisaki paper: `papers/Fujisaki_InformationProsodyModeling/notes.md`
- Current F0 code: `src/tts-frontend-rules.js:1261-1375`
- Prosody research: `reports/research-prosody.md`
- Fujisaki & Ohno 1995 (English): For English-specific timing values
