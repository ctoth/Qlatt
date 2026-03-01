# Implementation Plan: Klatt 1979 Diphone-Based Phonological Rules

**Source Paper:** Klatt (1979) "Speech perception: a model of acoustic-phonetic analysis and lexical access"
**Target:** Qlatt TTS system
**Date:** 2026-01-27

## Executive Summary

Klatt 1979 establishes that:
1. **Diphone transitions** (mid-phone to mid-phone) capture most coarticulatory variation
2. **Phonological rules** must handle cross-word phenomena (palatalization, flapping, reduction)
3. **Context-dependent templates** are needed for stops (burst spectra vary by vowel class)
4. Coarticulation extends **~half-way** into adjacent phones (not phone boundaries)

This plan integrates these principles into Qlatt's existing rules + runtime + interpreter architecture.

---

## Current Architecture Summary

| Component | File | Role |
|-----------|------|------|
| Rules System | `src/tts-frontend-rules.js` | PHONEME_TARGETS, duration/F0/coarticulation rules |
| Frontend Pipeline | `src/tts-frontend.js` | Text → phonemes → track with transitions |
| Interpreter | `src/klatt-interpreter.ts` | Schedules track onto AudioParams |
| Semantics | `src/semantics/` | CEL expression evaluation |

**Current Gaps:**
- Only K context rule implemented (velar fronting/backing)
- Fixed 0.35 blend factor for all transitions
- No phonological rules (flapping, palatalization, etc.)
- No diphone-based transition structure
- Transitions anchored at phone boundaries, not midpoints

---

## Phase 1: Phonological Rules Engine

### 1.1 Rule Infrastructure

**File:** `src/tts-frontend-rules.js`

Create a phonological rule application system that operates on the phoneme sequence *before* acoustic parameter assignment.

```javascript
// New section: Phonological Rules (operate on phoneme identities, not params)

/**
 * Rule application order matters:
 * 1. Word-boundary phenomena (palatalization, flapping)
 * 2. Reduction rules (schwa insertion, vowel shortening)
 * 3. Geminate simplification
 * 4. Coarticulation (K context, etc.)
 */

const PHONOLOGICAL_RULES = [
  rule_Palatalization,      // /d#y/ → /JH/, /t#y/ → /CH/
  rule_Flapping,            // intervocalic /t,d/ → /DX/
  rule_GeminateReduction,   // /t#t/ → /t/
  rule_SchwaReduction,      // unstressed vowels in function words
  rule_GlottalStop,         // optional: /t/ → /?/ before syllabic /n/
];

function applyPhonologicalRules(phonemeList) {
  let result = [...phonemeList];
  for (const rule of PHONOLOGICAL_RULES) {
    result = rule(result);
  }
  return result;
}
```

### 1.2 Palatalization Rule (Table II, Rule 1)

**Pattern:** /d/ + word boundary + /y/ → [dʒ] (JH)
**Pattern:** /t/ + word boundary + /y/ → [tʃ] (CH)

```javascript
/**
 * Palatalization: Alveolar + /y/ across word boundary
 * "would you" → [wʊdʒu], "hit you" → [hɪtʃu]
 *
 * From Klatt 1979 Table II, Rule 1
 */
function rule_Palatalization(phonemeList) {
  const result = [];
  for (let i = 0; i < phonemeList.length; i++) {
    const curr = phonemeList[i];
    const next = phonemeList[i + 1];

    // Check for word boundary between current and next
    const isWordBoundary = next && curr.word !== next.word;

    if (isWordBoundary && next?.phoneme === 'Y') {
      if (curr.phoneme === 'D' || curr.phoneme === 'D_REL') {
        // /d#y/ → JH (voiced palato-alveolar affricate)
        result.push({
          ...curr,
          phoneme: 'JH',
          originalPhoneme: curr.phoneme,
          rule: 'palatalization'
        });
        // Skip the /y/ - it's absorbed
        i++;
        continue;
      } else if (curr.phoneme === 'T' || curr.phoneme === 'T_REL' || curr.phoneme === 'T_ASP') {
        // /t#y/ → CH (voiceless palato-alveolar affricate)
        result.push({
          ...curr,
          phoneme: 'CH',
          originalPhoneme: curr.phoneme,
          rule: 'palatalization'
        });
        // Skip the /y/
        i++;
        continue;
      }
    }
    result.push(curr);
  }
  return result;
}
```

### 1.3 Flapping Rule (Table II, Rule 3)

**Pattern:** Intervocalic /t/ or /d/ between vowels → [ɾ] (flap)
**Condition:** Second vowel is unstressed or across word boundary

```javascript
/**
 * Flapping: /t,d/ → [ɾ] between vowels
 * "hit it" → [hɪɾɪt], "butter" → [bʌɾɚ], "ladder" → [læɾɚ]
 *
 * From Klatt 1979 Table II, Rule 3
 * Condition: Following vowel is unstressed OR across word boundary
 */
function rule_Flapping(phonemeList) {
  const result = [];

  for (let i = 0; i < phonemeList.length; i++) {
    const prev = phonemeList[i - 1];
    const curr = phonemeList[i];
    const next = phonemeList[i + 1];

    // Is current a /t/ or /d/ (any phase)?
    const isAlveolarStop = /^[TD](_CL|_REL|_ASP)?$/.test(curr.phoneme);

    if (isAlveolarStop && prev && next) {
      const prevIsVowel = isVowelPhoneme(prev.phoneme);
      const nextIsVowel = isVowelPhoneme(next.phoneme);
      const nextIsUnstressed = next.stress === 0 || next.stress === null;
      const acrossWordBoundary = curr.word !== next.word;

      if (prevIsVowel && nextIsVowel && (nextIsUnstressed || acrossWordBoundary)) {
        // Replace entire stop sequence with flap
        // Skip closure/release/aspiration phases - flap is single segment
        if (curr.phoneme.endsWith('_CL')) {
          result.push({
            ...curr,
            phoneme: 'DX',  // ARPABET flap symbol
            originalPhoneme: curr.phoneme,
            rule: 'flapping',
            dur: 30  // Flaps are very short (~25-40ms)
          });
          // Skip following release and aspiration phases
          while (i + 1 < phonemeList.length &&
                 /^[TD]_(REL|ASP)$/.test(phonemeList[i + 1].phoneme)) {
            i++;
          }
          continue;
        }
      }
    }
    result.push(curr);
  }
  return result;
}

function isVowelPhoneme(phoneme) {
  // Match vowel phonemes (with or without stress markers)
  return /^(IY|IH|EY|EH|AE|AA|AO|OW|UH|UW|AH|ER|AX)[012]?$/.test(phoneme);
}
```

### 1.4 Geminate Reduction Rule (Table II, Rule 5)

**Pattern:** Identical consonant across word boundary → single consonant

```javascript
/**
 * Geminate Reduction: /C#C/ → /C/ when identical
 * "it to" → [ɪtu] (single [t]), "Bob Brown" → [bɑbraʊn]
 *
 * From Klatt 1979 Table II, Rule 5
 */
function rule_GeminateReduction(phonemeList) {
  const result = [];

  for (let i = 0; i < phonemeList.length; i++) {
    const curr = phonemeList[i];
    const next = phonemeList[i + 1];

    // Check for word boundary
    const isWordBoundary = next && curr.word !== next.word;

    if (isWordBoundary) {
      // Get base consonant (strip _CL, _REL, _ASP suffixes)
      const currBase = curr.phoneme.replace(/_(CL|REL|ASP)$/, '');
      const nextBase = next?.phoneme.replace(/_(CL|REL|ASP)$/, '');

      if (currBase === nextBase && isConsonantPhoneme(currBase)) {
        // Keep current, skip next (geminate simplified)
        result.push({
          ...curr,
          rule: 'geminate_reduction',
          // Slightly lengthen to preserve some geminate quality
          dur: (curr.dur || 80) * 1.2
        });
        // Skip the duplicate
        i++;
        continue;
      }
    }
    result.push(curr);
  }
  return result;
}

function isConsonantPhoneme(phoneme) {
  const base = phoneme.replace(/_(CL|REL|ASP)$/, '');
  return /^(P|T|K|B|D|G|M|N|NG|F|V|TH|DH|S|Z|SH|ZH|HH|CH|JH|L|R|W|Y)$/.test(base);
}
```

### 1.5 Vowel Reduction Rule (Table II, Rule 2, 4)

**Pattern:** Unstressed vowels in function words → schwa

```javascript
/**
 * Vowel Reduction: Unstressed vowels in common words → schwa
 * "you" (unstressed) → [jə], "to" → [tə]
 *
 * From Klatt 1979 Table II, Rules 2 and 4
 */
const REDUCIBLE_WORDS = new Set([
  'a', 'an', 'the', 'to', 'for', 'of', 'and', 'or', 'but',
  'you', 'your', 'he', 'she', 'we', 'they', 'them', 'him', 'her',
  'can', 'could', 'would', 'should', 'will', 'shall',
  'have', 'has', 'had', 'do', 'does', 'did',
  'at', 'in', 'on', 'from', 'with', 'by'
]);

function rule_SchwaReduction(phonemeList) {
  const result = [];

  for (let i = 0; i < phonemeList.length; i++) {
    const curr = phonemeList[i];

    // Check if this is an unstressed vowel in a function word
    const inFunctionWord = REDUCIBLE_WORDS.has(curr.word?.toLowerCase());
    const isUnstressedVowel = isVowelPhoneme(curr.phoneme) &&
                              (curr.stress === 0 || curr.stress === null);

    if (inFunctionWord && isUnstressedVowel) {
      // Reduce to schwa (AX) with shortened duration
      result.push({
        ...curr,
        phoneme: 'AX',
        originalPhoneme: curr.phoneme,
        rule: 'schwa_reduction',
        dur: Math.max(40, (curr.dur || 80) * 0.6)  // Short schwa
      });
    } else {
      result.push(curr);
    }
  }
  return result;
}
```

### 1.6 Add Flap (DX) to PHONEME_TARGETS

```javascript
// Add to PHONEME_TARGETS in tts-frontend-rules.js

DX: {
  // Alveolar flap/tap - very brief tongue contact
  F1: 400,
  F2: 1600,
  F3: 2500,
  F4: 3300,
  F5: 3750,
  F6: 4900,
  B1: 60,
  B2: 90,
  B3: 150,
  B4: 250,
  B5: 200,
  B6: 1000,
  AV: 55,      // Voiced
  AF: 0,
  AH: 0,
  AVS: -70,
  dur: 30,     // Very short (25-40ms typical)
  type: 'flap',
  voiced: true,
  alveolar: true
},

// Add schwa if not present
AX: {
  // Reduced schwa - central mid vowel
  F1: 500,
  F2: 1500,
  F3: 2500,
  F4: 3300,
  F5: 3750,
  F6: 4900,
  B1: 60,
  B2: 100,
  B3: 150,
  B4: 250,
  B5: 200,
  B6: 1000,
  AV: 55,
  AF: 0,
  AH: 0,
  AVS: -70,
  dur: 60,
  type: 'vowel',
  voiced: true,
  reduced: true
},
```

---

## Phase 2: Diphone-Based Transition System

### 2.1 Diphone Concept

Klatt 1979 establishes that a **diphone** = transition from mid-phone to mid-phone. This captures coarticulation better than phone-boundary transitions.

**Current:** Transitions at phone boundaries with 0.35 blend
**Target:** Transitions centered at phone boundaries, extending ~half into each phone

### 2.2 Transition Duration Model

```javascript
// Add to tts-frontend-rules.js

/**
 * Diphone transition durations (ms) based on phone class pairs
 * From Klatt 1979 and Hertz 1987
 *
 * Key insight: Transitions are ~40ms for sonorant-obstruent,
 * ~90ms for sonorant-sonorant (vowel-to-vowel)
 */
const TRANSITION_DURATIONS = {
  // Sonorant → Sonorant (smooth, long transitions)
  'vowel-vowel': 90,
  'vowel-nasal': 70,
  'vowel-liquid': 80,
  'vowel-glide': 70,
  'nasal-vowel': 70,
  'liquid-vowel': 80,
  'glide-vowel': 70,

  // Sonorant → Obstruent (abrupt, short transitions)
  'vowel-stop': 40,
  'vowel-fricative': 50,
  'vowel-affricate': 45,
  'nasal-stop': 30,
  'liquid-stop': 40,

  // Obstruent → Sonorant (release transitions)
  'stop-vowel': 50,      // Includes burst + aspiration
  'fricative-vowel': 60,
  'affricate-vowel': 55,

  // Default
  'default': 50
};

function getTransitionDuration(prevType, currType) {
  const key = `${prevType}-${currType}`;
  return TRANSITION_DURATIONS[key] || TRANSITION_DURATIONS['default'];
}
```

### 2.3 Diphone Transition Points

```javascript
/**
 * Calculate diphone transition anchor points
 *
 * Klatt 1979: Coarticulation extends ~half-way into adjacent phones
 * We place transition START at prev phone midpoint,
 * transition END at curr phone midpoint
 */
function calculateDiphoneTransitions(phonemeList) {
  const transitions = [];
  let currentTime = 0;

  for (let i = 0; i < phonemeList.length; i++) {
    const prev = phonemeList[i - 1];
    const curr = phonemeList[i];
    const next = phonemeList[i + 1];

    const currDur = curr.dur || curr.duration || 100;
    const currMidpoint = currentTime + currDur / 2;

    if (prev) {
      const prevDur = prev.dur || prev.duration || 100;
      const prevMidpoint = currentTime - prevDur / 2;

      const transitionDur = getTransitionDuration(
        prev.type || 'vowel',
        curr.type || 'vowel'
      );

      transitions.push({
        // Diphone spans from prev midpoint to curr midpoint
        startTime: prevMidpoint,
        endTime: currMidpoint,
        transitionDuration: transitionDur,

        // Anchor points for parameter interpolation
        // Transition region centered at phone boundary
        transitionStart: currentTime - transitionDur / 2,
        transitionEnd: currentTime + transitionDur / 2,

        fromPhoneme: prev.phoneme,
        toPhoneme: curr.phoneme,
        fromParams: prev.params,
        toParams: curr.params
      });
    }

    currentTime += currDur;
  }

  return transitions;
}
```

### 2.4 Modified Track Generation

Replace the current `blendParams` approach with diphone-aware transitions:

```javascript
/**
 * Generate track with diphone-based transitions
 *
 * Instead of fixed 0.35 blend at boundaries:
 * 1. Steady-state regions at phone midpoints
 * 2. Smooth interpolation through transition regions
 * 3. Transition duration varies by phone class pair
 */
function generateDiphoneTrack(phonemeList, sampleRate = 100) {
  const track = [];
  const transitions = calculateDiphoneTransitions(phonemeList);

  let currentTime = 0;

  for (let i = 0; i < phonemeList.length; i++) {
    const curr = phonemeList[i];
    const currDur = curr.dur || curr.duration || 100;
    const currDurSec = currDur / 1000;

    // Find transitions into and out of this phone
    const transIn = transitions.find(t => t.toPhoneme === curr.phoneme &&
                                          Math.abs(t.endTime - (currentTime + currDur/2)) < 1);
    const transOut = transitions.find(t => t.fromPhoneme === curr.phoneme &&
                                           Math.abs(t.startTime - (currentTime + currDur/2)) < 1);

    // Steady-state region: between incoming and outgoing transitions
    const steadyStart = transIn ? transIn.transitionEnd / 1000 : currentTime / 1000;
    const steadyEnd = transOut ? transOut.transitionStart / 1000 : (currentTime + currDur) / 1000;

    // Add steady-state frame at midpoint
    if (steadyEnd > steadyStart) {
      const midTime = (steadyStart + steadyEnd) / 2;
      track.push({
        time: midTime,
        phoneme: curr.phoneme,
        word: curr.word,
        params: { ...curr.params },
        region: 'steady'
      });
    }

    // Add transition frames (interpolated)
    if (transIn && i > 0) {
      const prev = phonemeList[i - 1];
      const numFrames = Math.ceil(transIn.transitionDuration / (1000 / sampleRate));

      for (let f = 0; f < numFrames; f++) {
        const t = f / (numFrames - 1 || 1);  // 0 to 1
        const frameTime = transIn.transitionStart / 1000 +
                         (transIn.transitionDuration / 1000) * t;

        // Smooth interpolation (cosine or sigmoid)
        const blend = smoothstep(t);

        track.push({
          time: frameTime,
          phoneme: `${prev.phoneme}->${curr.phoneme}`,
          word: curr.word,
          params: interpolateParams(prev.params, curr.params, blend),
          region: 'transition'
        });
      }
    }

    currentTime += currDur;
  }

  // Sort by time and remove duplicates
  track.sort((a, b) => a.time - b.time);
  return deduplicateTrack(track);
}

/**
 * Smooth interpolation function (避免 linear discontinuities)
 */
function smoothstep(t) {
  // Hermite interpolation: 3t² - 2t³
  return t * t * (3 - 2 * t);
}

/**
 * Interpolate all Klatt parameters between two frames
 */
function interpolateParams(from, to, t) {
  const result = {};
  const interpKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6',
                      'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
                      'AV', 'AH', 'AF', 'AVS',
                      'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'AB', 'AN',
                      'FNP', 'FNZ', 'BNP', 'BNZ'];

  for (const key of Object.keys(from)) {
    if (interpKeys.includes(key) &&
        Number.isFinite(from[key]) &&
        Number.isFinite(to[key])) {
      result[key] = from[key] + (to[key] - from[key]) * t;
    } else {
      result[key] = t < 0.5 ? from[key] : to[key];
    }
  }

  return result;
}
```

---

## Phase 3: Context-Dependent Stop Burst Templates

### 3.1 Vowel Class System

Klatt 1979 Figure 3 shows stop burst spectra depend on following vowel class:
- **Front vowels:** High F2 burst locus
- **Back unrounded vowels:** Mid F2 burst locus
- **Back rounded vowels:** Low F2 burst locus

```javascript
/**
 * Vowel classification for stop burst coarticulation
 */
const VOWEL_CLASSES = {
  // Front vowels
  front: ['IY', 'IH', 'EY', 'EH', 'AE'],

  // Back unrounded vowels
  back_unrounded: ['AH', 'AA', 'ER'],

  // Back rounded vowels
  back_rounded: ['AO', 'OW', 'UH', 'UW'],

  // Central (treat as back unrounded)
  central: ['AX']
};

function getVowelClass(phoneme) {
  const base = phoneme.replace(/[012]$/, '');
  for (const [cls, vowels] of Object.entries(VOWEL_CLASSES)) {
    if (vowels.includes(base)) return cls;
  }
  return 'back_unrounded';  // Default
}
```

### 3.2 Extended Stop Context Rules

Extend beyond just K to all stops:

```javascript
/**
 * Stop burst F2/F3 targets by place and vowel context
 * Based on Klatt 1979 Figure 3 and Zue 1976
 */
const STOP_BURST_TARGETS = {
  // Velars (K, G) - most context-dependent
  K: {
    front:          { F2: 2200, F3: 3000 },  // Fronted before front vowels
    back_unrounded: { F2: 1500, F3: 2500 },  // Neutral
    back_rounded:   { F2: 1100, F3: 2300 }   // Backed before rounded
  },
  G: {
    front:          { F2: 2100, F3: 2900 },
    back_unrounded: { F2: 1400, F3: 2400 },
    back_rounded:   { F2: 1000, F3: 2200 }
  },

  // Alveolars (T, D) - relatively stable
  T: {
    front:          { F2: 1800, F3: 3000 },
    back_unrounded: { F2: 1700, F3: 2900 },
    back_rounded:   { F2: 1600, F3: 2800 }
  },
  D: {
    front:          { F2: 1750, F3: 2950 },
    back_unrounded: { F2: 1650, F3: 2850 },
    back_rounded:   { F2: 1550, F3: 2750 }
  },

  // Labials (P, B) - least context-dependent, low F2
  P: {
    front:          { F2: 1100, F3: 2700 },
    back_unrounded: { F2: 1000, F3: 2600 },
    back_rounded:   { F2: 900,  F3: 2500 }
  },
  B: {
    front:          { F2: 1050, F3: 2650 },
    back_unrounded: { F2: 950,  F3: 2550 },
    back_rounded:   { F2: 850,  F3: 2450 }
  }
};

/**
 * Apply stop burst coarticulation based on following vowel
 * Extends current rule_K_Context to all stops
 */
function rule_StopBurstContext(phonemeList) {
  for (let i = 0; i < phonemeList.length; i++) {
    const curr = phonemeList[i];

    // Check if this is a stop closure or release
    const stopMatch = curr.phoneme.match(/^([PTKBDG])_(CL|REL|ASP)$/);
    if (!stopMatch) continue;

    const stopBase = stopMatch[1];
    const phase = stopMatch[2];

    // Find the following vowel
    let vowelClass = 'back_unrounded';  // Default
    for (let j = i + 1; j < phonemeList.length && j < i + 4; j++) {
      const next = phonemeList[j];
      if (isVowelPhoneme(next.phoneme)) {
        vowelClass = getVowelClass(next.phoneme);
        break;
      }
    }

    // Apply context-dependent targets
    const targets = STOP_BURST_TARGETS[stopBase];
    if (targets && targets[vowelClass]) {
      // For closure: prepare for burst
      // For release/aspiration: apply burst spectrum
      if (phase === 'REL' || phase === 'ASP') {
        curr.params.F2 = targets[vowelClass].F2;
        curr.params.F3 = targets[vowelClass].F3;
      } else if (phase === 'CL') {
        // Closure F2 should trend toward burst target
        curr.params.F2 = targets[vowelClass].F2 * 0.8;
        curr.params.F3 = targets[vowelClass].F3 * 0.9;
      }

      curr.burstContext = vowelClass;
    }
  }

  return phonemeList;
}
```

---

## Phase 4: Nasalization Coarticulation

### 4.1 Vowel Nasalization Before Nasals

Klatt 1979 mentions nasal coarticulation. Implement anticipatory nasalization:

```javascript
/**
 * Anticipatory nasalization of vowels before nasal consonants
 * "man" → vowel becomes nasalized before /n/
 *
 * Acoustic correlates (from Hawkins & Stevens 1985):
 * - F1 amplitude reduction (~5-10 dB)
 * - F1 bandwidth increase (1.5-2x)
 * - Nasal pole/zero introduction
 */
function rule_AnticpatoryNasalization(phonemeList) {
  for (let i = 0; i < phonemeList.length; i++) {
    const curr = phonemeList[i];
    const next = phonemeList[i + 1];

    // Is current a vowel followed by nasal?
    if (isVowelPhoneme(curr.phoneme) && next && isNasalPhoneme(next.phoneme)) {
      // Calculate nasalization onset (last 40% of vowel)
      const nasalizationPortion = 0.4;

      // Create nasalized variant
      curr.nasalization = {
        onset: 1 - nasalizationPortion,  // 60% into vowel
        // Acoustic modifications
        A1_reduction: -6,   // dB reduction in F1 amplitude
        B1_increase: 1.5,   // Bandwidth multiplier
        FNP: 300,           // Nasal pole ~300 Hz
        FNZ: 450,           // Nasal zero ~450 Hz
        AN: 45              // Nasal amplitude
      };
    }
  }

  return phonemeList;
}

function isNasalPhoneme(phoneme) {
  return /^(M|N|NG)$/.test(phoneme);
}
```

### 4.2 Apply Nasalization in Track Generation

```javascript
/**
 * Apply nasalization parameters during track generation
 */
function applyNasalization(frame, phoneme, positionInPhoneme) {
  if (!phoneme.nasalization) return frame;

  const { onset, A1_reduction, B1_increase, FNP, FNZ, AN } = phoneme.nasalization;

  if (positionInPhoneme >= onset) {
    // Calculate nasalization amount (ramps up from onset to 1.0)
    const nasalAmount = (positionInPhoneme - onset) / (1 - onset);

    // Apply modifications
    frame.params.A1 = (frame.params.A1 || 60) + A1_reduction * nasalAmount;
    frame.params.B1 = (frame.params.B1 || 60) * (1 + (B1_increase - 1) * nasalAmount);
    frame.params.FNP = FNP;
    frame.params.FNZ = FNZ;
    frame.params.AN = AN * nasalAmount;
    frame.params.BNP = 100;
    frame.params.BNZ = 100;
  }

  return frame;
}
```

---

## Phase 5: Integration with Current Pipeline

### 5.1 Modified Pipeline Order

Update `src/tts-frontend.js` to integrate new systems:

```javascript
/**
 * Full TTS Pipeline with Klatt 1979 enhancements
 */
async function synthesize(text, options = {}) {
  // 1. Text normalization
  const normalizedText = normalizeText(text);

  // 2. Transcription (CMU dict lookup)
  let phonemeList = transcribeText(normalizedText);

  // 3. Insert stop phases (closure/release/aspiration)
  phonemeList = insertStopReleases(phonemeList);

  // === NEW: Phonological Rules (Phase 1) ===
  // Apply BEFORE acoustic parameter assignment
  phonemeList = applyPhonologicalRules(phonemeList);

  // 4. Assign acoustic parameters from PHONEME_TARGETS
  phonemeList = assignAcousticParameters(phonemeList);

  // === NEW: Context-dependent coarticulation (Phase 3) ===
  phonemeList = rule_StopBurstContext(phonemeList);

  // === NEW: Nasalization (Phase 4) ===
  phonemeList = rule_AnticpatoryNasalization(phonemeList);

  // 5. Duration rules (existing)
  phonemeList = rule_StressDuration(phonemeList);
  phonemeList = rule_VowelShortening(phonemeList);
  phonemeList = rule_PreBoundaryLengthening(phonemeList);

  // 6. F0 contour generation (existing)
  const f0Contour = rule_GenerateF0Contour(phonemeList, options.baseF0 || 100);

  // === NEW: Diphone-based track generation (Phase 2) ===
  const track = generateDiphoneTrack(phonemeList);

  // 7. Apply F0 contour to track
  applyF0ToTrack(track, f0Contour);

  return track;
}
```

### 5.2 Rule Application Order

```javascript
/**
 * Complete rule application order
 *
 * PHONOLOGICAL RULES (operate on phoneme identities):
 * 1. Palatalization (/d#y/ → JH)
 * 2. Flapping (intervocalic /t,d/ → DX)
 * 3. Geminate reduction (/t#t/ → /t/)
 * 4. Schwa reduction (unstressed function word vowels)
 *
 * COARTICULATION RULES (operate on acoustic parameters):
 * 5. Stop burst context (F2/F3 by vowel class)
 * 6. Anticipatory nasalization
 * 7. K context (legacy, now subsumed by #5)
 *
 * DURATION RULES:
 * 8. Stress duration
 * 9. Vowel shortening (before voiceless C)
 * 10. Pre-boundary lengthening
 *
 * PROSODY RULES:
 * 11. F0 contour generation
 */
```

---

## Phase 6: Testing & Validation

### 6.1 Test Utterances (from Klatt 1979 Table II)

```javascript
const TEST_UTTERANCES = [
  // Palatalization
  { text: "Would you hit it to Tom",
    expected: ["W", "UH1", "JH", "...", "T", "AO1", "M"] },  // /d#y/ → JH

  // Flapping
  { text: "hit it",
    expected: ["HH", "IH1", "DX", "IH0", "T"] },  // intervocalic /t/ → DX

  // Geminate reduction
  { text: "it to",
    expected: ["IH1", "T", "UW1"] },  // /t#t/ → single /t/

  // Schwa reduction
  { text: "Would you",
    expected: ["W", "UH1", "D", "Y", "AX"] },  // /u/ → schwa in "you"

  // Combined
  { text: "butter",
    expected: ["B", "AH1", "DX", "ER0"] }  // flapping in "butter"
];
```

### 6.2 Acoustic Validation

```javascript
/**
 * Validate that generated tracks match expected acoustic patterns
 */
function validateTrack(track, utterance) {
  const issues = [];

  // Check transition durations are in expected ranges
  for (let i = 1; i < track.length; i++) {
    const dt = (track[i].time - track[i-1].time) * 1000;
    if (track[i].region === 'transition') {
      if (dt < 20 || dt > 150) {
        issues.push(`Unusual transition duration: ${dt}ms at ${track[i].time}s`);
      }
    }
  }

  // Check formant continuity (no jumps > 500 Hz)
  for (let i = 1; i < track.length; i++) {
    for (const f of ['F1', 'F2', 'F3']) {
      const delta = Math.abs(track[i].params[f] - track[i-1].params[f]);
      if (delta > 500) {
        issues.push(`Large ${f} jump: ${delta}Hz at ${track[i].time}s`);
      }
    }
  }

  return issues;
}
```

---

## Implementation Schedule

| Phase | Component | Files Modified | Effort |
|-------|-----------|----------------|--------|
| 1.1 | Rule infrastructure | `tts-frontend-rules.js` | 2 hours |
| 1.2 | Palatalization | `tts-frontend-rules.js` | 1 hour |
| 1.3 | Flapping | `tts-frontend-rules.js` | 1.5 hours |
| 1.4 | Geminate reduction | `tts-frontend-rules.js` | 1 hour |
| 1.5 | Schwa reduction | `tts-frontend-rules.js` | 1 hour |
| 1.6 | New phoneme targets (DX, AX) | `tts-frontend-rules.js` | 0.5 hours |
| 2.1-2.4 | Diphone transitions | `tts-frontend.js` | 4 hours |
| 3.1-3.2 | Stop burst context | `tts-frontend-rules.js` | 2 hours |
| 4.1-4.2 | Nasalization | `tts-frontend-rules.js`, `tts-frontend.js` | 2 hours |
| 5.1-5.2 | Pipeline integration | `tts-frontend.js` | 2 hours |
| 6.1-6.2 | Testing | `test/` | 3 hours |

**Total estimated effort:** ~20 hours

---

## Dependencies

- No new npm packages required
- Uses existing PHONEME_TARGETS structure
- Compatible with current interpreter/runtime
- No changes to semantics system needed

---

## Success Criteria

1. **Palatalization:** "would you" produces audible affricate, not /d/ + /y/
2. **Flapping:** "butter" has fast tap, not full /t/ closure+release+aspiration
3. **Smooth transitions:** No audible discontinuities at phone boundaries
4. **Stop bursts:** K before /i/ sounds fronted, K before /u/ sounds backed
5. **Nasalization:** Vowels before nasals have audible nasal quality onset

---

## References

- Klatt, D. H. (1979). Speech perception: a model of acoustic-phonetic analysis and lexical access. *Journal of Phonetics* 7, 279-312.
- Klatt, D. H. (1976). Linguistic uses of segmental duration in English. *JASA* 59, 1208-21.
- Zue, V. W. (1976). Acoustic characteristics of stop consonants. MIT Technical Report.
- Hawkins, S. & Stevens, K. N. (1985). Acoustic and perceptual correlates of the non-nasal-nasal distinction for vowels. *JASA* 77, 1560-75.
- Hertz, S. R. (1987). Delta: A non-linear phonology. *Working Papers Cornell Phonetics Lab* 2.
