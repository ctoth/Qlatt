# SPG Trajectory Smoothing for Qlatt

Implementation plan for adding Tokuda's Speech Parameter Generation algorithm to produce smooth formant trajectories.

## Background

### Problem

Current system produces **stepwise formant transitions**:
- TTS frontend generates frames at phoneme boundaries
- Limited 35% blending only for vowel→sonorant transitions
- Interpreter applies formant changes via `setValueAtTime` (instantaneous)
- Result: unnatural "robotic" quality, especially at consonant boundaries

### Solution: SPG Algorithm (Hu 2012)

Tokuda's Speech Parameter Generation algorithm:
1. Takes piecewise-constant targets (phoneme formant values)
2. Applies delta + delta-delta continuity constraints
3. Solves linear system to find smooth trajectory
4. Produces natural coarticulation without explicit rules

**Empirical results**: 70% vs 67% DRT accuracy, 45% vs 36% naturalness.

**Source**: `papers/Hu_2012_DynamicsModelSpeechRecognitionSynthesis/notes.md`

## Design Decision

### Where to Apply Smoothing

**Option A: Track Preprocessing** ✓ RECOMMENDED
- New module: `src/track-smoother.ts`
- Runs after frontend generates track, before interpreter
- Preserves existing track format
- Minimal changes to other components

**Option B: Interpreter Ramps**
- Mark formant params as `ramp: true`
- Uses WebAudio linear interpolation
- Problem: Only linear, can't do proper SPG constraints

**Option C: Higher Frame Density in Frontend**
- Generate more frames with computed intermediate values
- Couples smoothing logic to frontend
- Harder to tune independently

### Parameters to Smooth

| Parameter | Smooth? | Rationale |
|-----------|---------|-----------|
| F1, F2, F3 | Yes | Primary formant trajectories |
| F4, F5, F6 | Optional | Higher formants, less perceptual impact |
| B1, B2, B3 | Maybe | Bandwidths change during transitions |
| F0 | No | Already has prosodic contour from frontend |
| AV, AH, AF | No | Already use ramps; intentionally abrupt for stops |
| SW | No | Must be instantaneous for branch switching |

### Algorithm Variant

**Simplified SPG** (not full HMM-based):
- Use delta constraints only (not delta-delta)
- Window size Θ=2 (standard)
- Solve banded tridiagonal system

Full SPG equation:
```
Δc_t = Σ_{θ=1}^{Θ} θ(c_{t+θ} - c_{t-θ}) / (2 Σ_{θ=1}^{Θ} θ²)
```

Simplified: enforce C¹ continuity (velocity matching) at frame boundaries.

## Implementation Plan

### Phase 1: Core Algorithm

**File**: `src/track-smoother.ts`

```typescript
interface SmootherOptions {
  params: string[];          // Which params to smooth ["F1", "F2", "F3"]
  windowSize: number;        // Theta parameter (default 2)
  preserveDiscontinuities: boolean;  // Keep SW/mode transitions sharp
}

function smoothTrack(track: KlattFrame[], options: SmootherOptions): KlattFrame[];
```

**Steps**:
1. Extract target values for specified params at each frame
2. Build constraint matrix W (delta coefficients)
3. Solve tridiagonal system R_x * C = r_x
4. Generate new frames at fixed interval (5ms or 10ms)
5. Preserve original frame timing for non-smoothed params

### Phase 2: Integration

**File**: `src/klatt-interpreter.ts` (minor change)

Add optional preprocessing hook:
```typescript
function createKlattInterpreter(runtime, semantics, options?: {
  trackPreprocessor?: (track: KlattFrame[]) => KlattFrame[];
})
```

**File**: `src/index.ts` or main entry point

Wire up smoother:
```typescript
import { smoothTrack } from './track-smoother';

const preprocessedTrack = smoothTrack(track, {
  params: ['F1', 'F2', 'F3'],
  windowSize: 2
});
interpreter.scheduleTrack(preprocessedTrack, startTime);
```

### Phase 3: Tuning

1. **Frame rate**: Test 5ms vs 10ms output frames
2. **Smoothing strength**: May need per-parameter weights
3. **F3 caution**: Hu warns over-smoothing F3 causes "muffled" speech
4. **Boundary handling**: How to handle utterance start/end

### Phase 4: Evaluation

1. **A/B listening test**: Smoothed vs original
2. **Spectrogram comparison**: Visual inspection of transitions
3. **Golden test update**: New baseline after smoothing enabled

## Technical Details

### Delta Coefficient Calculation

```typescript
function computeDelta(values: number[], t: number, theta: number = 2): number {
  let num = 0, den = 0;
  for (let k = 1; k <= theta; k++) {
    const prev = values[Math.max(0, t - k)];
    const next = values[Math.min(values.length - 1, t + k)];
    num += k * (next - prev);
    den += k * k;
  }
  return num / (2 * den);
}
```

### Tridiagonal System

The SPG constraint O = WC creates a banded system. For delta-only (no delta-delta):

```
[1   0   0   ...] [c_0]   [target_0]
[w  1   w   ...] [c_1] = [target_1]
[0   w  1   w  ] [c_2]   [target_2]
[...           ] [...]   [...]
```

Where `w` encodes the delta constraint. Solvable in O(n) via Thomas algorithm.

### Frame Interpolation

After solving for smooth C, generate output frames:

```typescript
function interpolateFrames(
  originalTrack: KlattFrame[],
  smoothedParams: Map<string, number[]>,
  outputRate: number  // frames per second (100 = 10ms, 200 = 5ms)
): KlattFrame[]
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/track-smoother.ts` | Create | Core SPG algorithm |
| `src/klatt-interpreter.ts` | Modify | Add preprocessor hook |
| `test/track-smoother.test.ts` | Create | Unit tests |
| `experiments/klatt80-baseline/semantics.yaml` | Maybe | Could mark formants as `smooth: true` |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Over-smoothing creates muffled speech | Per-parameter smoothing strength; A/B testing |
| Latency increase from preprocessing | Pre-compute; track is already compiled upfront |
| Breaks golden tests | Expected; update baselines after validation |
| F3 tracking issues | May need to reduce F3 smoothing or exclude |
| Abrupt SW transitions smeared | Preserve discontinuities flag |

## Success Criteria

1. Spectrogram shows smooth formant transitions (no staircasing)
2. Subjective improvement in naturalness (informal listening)
3. No regression in intelligibility
4. Performance: <10ms preprocessing for typical utterance

## References

- Hu (2012) - `papers/Hu_2012_DynamicsModelSpeechRecognitionSynthesis/notes.md`
- Tokuda et al. (2000) - Original SPG algorithm for HMM synthesis
- Current system: `docs/parameter-scheduling.md`
