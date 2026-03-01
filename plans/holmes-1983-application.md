# Holmes 1983 Application Plan

> Plan for implementing Holmes 1983 "Formant Synthesizers: Cascade or Parallel?" findings in Qlatt.

## Executive Summary

Holmes 1983 argues that parallel formant synthesizers are superior to cascade even for vowels, with three key requirements:
1. **F1 phase correction** - Different spectral shaping from F2+
2. **ALF mechanism** - Independent low-frequency amplitude control
3. **Per-formant voicing offsets** - Graduated voiced→voiceless transitions

This plan prioritizes changes by implementation complexity and expected quality impact.

## Current State Analysis

From `docs/synthesizer-architecture.md` and scout reports:

### What Qlatt Already Has (Holmes-Compatible)

| Feature | Holmes Requirement | Qlatt Status |
|---------|-------------------|--------------|
| Parallel branch | Parallel formant filters | ✓ Has parallelF1-F6 |
| F2+ differentiator | High-pass shaping for F2-F6 | ✓ `diff` node before F2-F6 |
| Sign alternation | Adjacent formants opposite polarity | ✓ `parallelSign` constant |
| FN resonator | Nasal/low-frequency formant | ✓ `np` (nasal pole) in cascade |

### What Qlatt is Missing (Holmes-Required)

| Feature | Holmes Requirement | Gap |
|---------|-------------------|-----|
| F1 phase correction | Zero at -640 Hz + all-pass at ±270 Hz | F1 gets same routing as F2-F6 |
| ALF control | Independent low-freq amplitude | Only A1 controls F1 |
| FN in parallel | FN needs parallel routing with ALF | FN only in cascade branch |
| Voicing offsets | Per-formant voicing transition rates | Single SW switches all |

## Implementation Priority

### Priority 1: F1 Phase Correction Network (HIGH IMPACT)

**Holmes says**: F1 needs special treatment:
- Real zero at -640 Hz (low-pass characteristic)
- All-pass pole-zero pair at ±270 Hz (90° phase shift)
- Result: F1 output in phase with cascade response

**Current Qlatt**: F1 path is:
```
parallelMixer → parallelSourceGain → parallelF1 → parallelF1Gain → parallelSum
```
F1 receives same (undifferentiated) input as cascade, which is partially correct. But missing phase correction.

**Implementation Steps**:

1. **Create new WASM primitive `f1-phase-correction`**
   - File: `crates/f1-phase-correction/src/lib.rs`
   - Implements: Real zero at -640 Hz + all-pass at ±270 Hz
   - Reference: Holmes 1983 Section 5, Fig. 14
   - Two cascaded second-order filters:
     - Low-pass with zero: `H(s) = (s + 640) / ((s + 270)(s - 270))` equivalent
     - All-pass: `H(s) = (s - 270) / (s + 270)`

2. **Create AudioWorkletProcessor**
   - File: `public/worklets/f1-phase-correction-processor.js`
   - Standard WASM wrapper pattern

3. **Register in registry.yaml**
   ```yaml
   f1-phase-correction:
     description: "Holmes 1983 F1 phase correction (zero at -640 Hz, all-pass at ±270 Hz)"
     worklet: "f1-phase-correction-processor.js"
     wasm: "f1-phase-correction.wasm"
     params: {}
     inputs: 1
     outputs: 1
   ```

4. **Insert in graph.yaml** between parallelF1 and parallelF1Gain:
   ```yaml
   parallelF1PhaseCorr:
     type: f1-phase-correction

   connections:
     - from: parallelF1
       to: parallelF1PhaseCorr
     - from: parallelF1PhaseCorr
       to: parallelF1Gain
   ```

5. **Update build.ps1** to compile new crate

**Effort**: Medium (new WASM primitive)
**Impact**: High (correct F1 phase alignment)

### Priority 2: ALF Mechanism (MEDIUM IMPACT)

**Holmes says**: ALF (low-frequency amplitude) controls sum of F1 and FN excitation:
```
excitation → [ALF gain] → [+] → FN → output
                         [-]
excitation → [A1 gain]  → [+] → F1 → [phase corr] → output
```
- ALF maintains correct low-frequency level independent of A1
- FN has 180° polarity reversal relative to F1

**Current Qlatt**:
- No ALF parameter
- FN (nasal pole `np`) only in cascade branch
- A1 directly controls F1 amplitude

**Implementation Steps**:

1. **Add ALF parameter to semantics.yaml**
   ```yaml
   params:
     ALF:
       type: float
       range: [0, 72]
       default: 60
       description: "Low-frequency amplitude (Holmes 1983 Fig. 15)"
   ```

2. **Add FN to parallel branch in graph.yaml**
   ```yaml
   parallelFN:
     type: resonator
     params:
       frequency: { bind: FN }
       bandwidth: { bind: BN }

   parallelFNGain:
     type: gain
     params:
       gain: { bind: fnLinear }
   ```

3. **Add realize rules in semantics.yaml**
   ```yaml
   realize:
     # ALF controls both F1 and FN excitation
     alfLinear:
       expr: "dbToLinear(GO + ALF + ndbScale.ALF)"
       deps: [GO, ALF]

     # FN amplitude (inverted polarity per Holmes)
     fnLinear:
       expr: "-dbToLinear(GO + ALF + ndbScale.ALF)"
       deps: [GO, ALF]

     # A1 now works relative to ALF
     a1Linear:
       expr: "dbToLinear(A1 + ndbScale.A1) * parallelScale"
       deps: [A1, parallelScale]
   ```

4. **Wire FN in graph.yaml connections**
   - FN gets ALF-controlled input
   - FN output sums (inverted) with F1 chain
   - Use existing mixer pattern

**Effort**: Medium (parameter + graph changes)
**Impact**: Medium (better low-frequency control, naturalness)

### Priority 3: Per-Formant Voicing Offsets (LOW-MEDIUM IMPACT)

**Holmes says**: Different formants transition voiced→voiceless at different rates:
- Mixer range = 1/3 of total voicing control range
- Offset span = 2/3 of voicing control range
- F1 becomes fully voiced first, F3/F4 last
- Creates gradual spectral energy distribution during transitions

**Current Qlatt**: Single SW parameter gates all parallel formants identically.

**Implementation Steps**:

1. **Add voicing offset parameters to semantics.yaml**
   ```yaml
   constants:
     voicingOffset:
       F1: 0.0    # First to become voiced
       F2: 0.15
       F3: 0.30
       F4: 0.45
       F5: 0.60
       F6: 0.67   # Last to become voiced
   ```

2. **Add voicing degree parameter**
   ```yaml
   params:
     VD:
       type: float
       range: [0, 1]
       default: 1.0
       description: "Degree of voicing (Holmes 1983 Section 7.3)"
   ```

3. **Create per-formant voicing mix rules**
   ```yaml
   realize:
     f1VoicingMix:
       expr: "min(1.0, max(0.0, (VD - voicingOffset.F1) * 3.0))"
       deps: [VD]

     f2VoicingMix:
       expr: "min(1.0, max(0.0, (VD - voicingOffset.F2) * 3.0))"
       deps: [VD]
     # ... etc for F3-F6
   ```

4. **Add per-formant voice/noise mixers in graph.yaml**
   - Each formant gets its own blend of voiced + voiceless excitation
   - Controlled by per-formant voicing mix values

**Effort**: High (requires per-formant mixer nodes)
**Impact**: Medium (improves voiced/voiceless transitions)

## Implementation Sequence

```
Phase 1: F1 Phase Correction (Priority 1)
├── Create f1-phase-correction WASM crate
├── Create AudioWorkletProcessor
├── Update registry.yaml
├── Update graph.yaml
├── Update build.ps1
└── Test with vowels in parallel mode

Phase 2: ALF Mechanism (Priority 2)
├── Add ALF parameter to semantics.yaml
├── Add FN to parallel branch in graph.yaml
├── Add realize rules
├── Wire connections
└── Test with nasal/oral vowel pairs

Phase 3: Per-Formant Voicing (Priority 3)
├── Add voicing offset constants
├── Add VD parameter
├── Create per-formant voicing rules
├── Add mixer nodes (if needed)
└── Test with voiced/voiceless fricative pairs
```

## Files to Modify

| File | Changes |
|------|---------|
| `crates/f1-phase-correction/` | NEW: WASM primitive |
| `public/worklets/f1-phase-correction-processor.js` | NEW: AudioWorkletProcessor |
| `experiments/klatt80-baseline/registry.yaml` | Add f1-phase-correction |
| `experiments/klatt80-baseline/graph.yaml` | Insert F1 phase corr, add FN parallel, add mixers |
| `experiments/klatt80-baseline/semantics.yaml` | Add ALF, VD, voicing offset rules |
| `build.ps1` | Add f1-phase-correction compilation |

## Testing Strategy

### Unit Tests
- F1 phase correction filter response (compare to Holmes Fig. 14)
- ALF/A1 interaction (verify independence)
- Voicing mix calculations

### Integration Tests
- Parallel vowel synthesis quality (compare to cascade)
- Voiced/voiceless transition smoothness
- Nasal vowel synthesis with ALF

### Perceptual Validation
- A/B test: current vs Holmes-modified parallel
- Focus on vowels where cascade "should" be better
- Verify no regression in fricatives/stops

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| F1 phase correction filter unstable | Use bilinear transform, test at multiple sample rates |
| ALF interaction with existing A1 rules | Document parameter semantics, may need TTS frontend changes |
| Per-formant voicing adds complexity | Make optional via config flag |
| Testing time | Prioritize F1 phase correction as highest-impact change |

## Open Questions

1. **Sample rate dependency**: Holmes design assumed specific sample rate. Need to parameterize filter coefficients.

2. **FN frequency**: Holmes suggests FN at 200±j150 Hz. Current `np` uses FNP parameter - verify compatibility.

3. **TTS frontend changes**: ALF and VD parameters need to be generated by frontend rules. Scope of frontend changes?

4. **Backward compatibility**: Should changes be behind a feature flag, or replace current parallel behavior?

## References

- Holmes, J.N. (1983). "Formant Synthesizers: Cascade or Parallel?" Speech Communication 2, 251-273.
- `papers/Holmes_1983_FormantSynthesizersCascadeParallel/notes.md` - Implementation-focused notes
- `docs/synthesizer-architecture.md` - Current Qlatt architecture
- `reports/infra-scout-*.md` - Detailed infrastructure analysis

---

*Plan created: 2026-01-27*
*Status: Ready for review*
