# QLATT: WebAudio Klatt Synthesizer with WASM DSP Nodes

## Project Goal

Build a Klatt formant synthesizer where each DSP component is a WASM-backed AudioWorkletNode, wired together using the WebAudio graph. The WebAudio API handles routing, parameter automation, and output. WASM handles correct DSP math.

## Architecture

**NOT a black box.** Each DSP primitive is its own worklet node:
```
┌─────────────────┐     ┌─────────────────┐
│ LfGlottalSource │────▶│ Resonator (RGP) │──┐
└─────────────────┘     └─────────────────┘  │
                                              ▼
┌─────────────────┐     ┌─────────────────┐  ┌─────────────┐
│  NoiseSource    │────▶│ Resonator (RGS) │─▶│ VoicedMixer │
└─────────────────┘     └─────────────────┘  └──────┬──────┘
                                                    │
                        ┌───────────────────────────┘
                        ▼
            ┌───────────────────┐
            │ Cascade Resonators │ (R1→R2→R3→R4→R5→R6 in series)
            │ (6 x Resonator)    │
            └─────────┬─────────┘
                      │
                      ▼
              ctx.destination
```

Each `Resonator` node exposes AudioParams: `frequency`, `bandwidth`, `gain`
Each source node exposes its own params: `f0`, `openQuotient`, etc.

## Reference Materials

### papers/
- **klatt1980.pdf** - The canonical Klatt paper. Cascade/parallel structure, resonator equations.
- **Klatt1987.pdf** - Klatt & Klatt follow-up with refinements.
- **1273_1_online.pdf** - Perrotin et al. 2021 "Perceptual equivalence of the Liljencrants-Fant and linear-filter glottal flow models". **Critical for implementation.** Shows LF_LM (fully causal linear filter) is perceptually identical to true LF. Means glottal source can be a filter chain rather than time-domain LF math - fits WebAudio architecture.

The original Fant/Liljencrants/Lin 1985 LF paper is available at:
https://www.researchgate.net/profile/Qiguang-Lin/publication/243630331_A_Four-Parameter_Model_of_Glottal_Flow/links/58466edd08ae2d21756a1f9e/A-Four-Parameter-Model-of-Glottal-Flow.pdf

NOTE: The return phase equation in Fig. 2 of the 1985 paper is wrong. Corrected version in implementation notes below.

### old/
Previous JS implementation. **Never worked** - don't use for comparison. Salvage selectively:

- **tts-frontend.js**, **tts-frontend-rules.js** - Text-to-phoneme pipeline, CMU dict lookup, prosodic rules. The phoneme tables and rule logic are sound, reuse.
- **klatt-synth.js** - Graph wiring patterns are reasonable reference for node topology. DSP is wrong.
- **voicing-source-processor.js** - Broken impulse-pair source. Discard.
- **noise-source-processor.js** - LP filtered noise. Sample rate handling is suspect (hardcoded 10kHz reference). Evaluate carefully.

## Components to Build

### 1. `resonator-processor` (WASM + Worklet)

Two-pole resonator. Workhorse - need ~10 instances.

**Rust struct:**
```rust
pub struct Resonator {
    y1: f32,
    y2: f32,
    a1: f32,
    a2: f32,
    b0: f32,
}

impl Resonator {
    pub fn set_params(&mut self, freq: f32, bw: f32, sample_rate: f32);
    pub fn process(&mut self, input: &[f32], output: &mut [f32]);
}
```

**Coefficient calculation** (Klatt 1980):
```
C = -exp(-2π * BW / SR)
B = 2 * exp(-π * BW / SR) * cos(2π * F / SR)  
A = 1 - B - C
```

**AudioParams:** `frequency`, `bandwidth`

### 2. `antiresonator-processor` (WASM + Worklet)

Two-zero filter for nasal zero. Inverts resonator transfer function.

**AudioParams:** `frequency`, `bandwidth`

### 3. `lf-source-processor` (WASM + Worklet)

Two options from literature:

**Option A: True LF (time-domain)**

Open phase (0 < t < te):
```
E(t) = E0 * exp(α*t) * sin(ω*t)
```
where ω = π/tp, α solved numerically.

**CORRECTED return phase** (te < t < tc):
```
E(t) = -Ee * (exp(-ε*(t-te)) - exp(-ε*(tc-te))) / (1 - exp(-ε*(tc-te)))
```
where ε solved to make integral = 0.

**Option B: LF_LM (filter-based, recommended)**

From 1273_1_online.pdf: Perceptually equivalent, computationally simpler. Glottal source = shaped impulse through:
1. Glottal formant (low-frequency resonance)
2. Spectral tilt filter (first-order lowpass)

Fits WebAudio node paradigm. Impulse generator → filter nodes.

**AudioParams:** `f0`, `Rd` (single voice quality parameter)

### 4. `noise-source-processor`

LP filtered white noise. May need rewrite - old/ version has 10kHz sample rate baked in.

### 5. `differentiator-processor` (pure JS worklet)

Radiation characteristic: `y[n] = x[n] - x[n-1]`

Not worth WASM.

## File Structure
```
qlatt/
├── README.md
├── PROMPT.md
├── Cargo.toml
├── papers/
│   ├── klatt1980.pdf
│   ├── Klatt1987.pdf
│   └── 1273_1_online.pdf
├── old/
│   ├── klatt-synth.js
│   ├── tts-frontend.js
│   ├── tts-frontend-rules.js
│   ├── voicing-source-processor.js
│   └── noise-source-processor.js
├── crates/
│   ├── resonator/
│   ├── antiresonator/
│   └── lf-source/
├── worklets/
│   ├── resonator-processor.js
│   ├── antiresonator-processor.js
│   ├── lf-source-processor.js
│   └── differentiator-processor.js
├── src/
│   ├── klatt-synth.js
│   ├── tts-frontend.js
│   └── tts-frontend-rules.js
├── build.sh
└── test/
    └── test-harness.html
```

## Implementation Notes

### Sample Rate
Design for 48kHz. Old code has 10kHz artifacts. All coefficients use actual sample rate.

### The Rd Parameter
From 1273_1_online.pdf - single parameter controls voice quality:
- Rd ≈ 0.3-0.5: pressed/tense
- Rd ≈ 1.0: modal voice  
- Rd ≈ 2.0-2.5: breathy

Maps to underlying LF params via regression. Much easier than raw tp/te/ta.

### Cascade vs Parallel
Start cascade only. Handles vowels. Add parallel for fricatives/stops later.

### Worklet ↔ WASM Pattern
```javascript
// Constructor
this.wasm = null;
WebAssembly.instantiateStreaming(fetch('resonator_bg.wasm'), imports)
  .then(({ instance }) => {
    this.wasm = instance.exports;
    this.resonator = this.wasm.resonator_new();
  });

// process()
if (!this.wasm) return true;
this.wasm.resonator_set_params(this.resonator, freq, bw, sampleRate);
this.wasm.resonator_process(this.resonator, inputPtr, outputPtr, blockSize);
```

## Success Criteria

1. **Resonator**: Impulse → bandpass response at F/BW
2. **LF source**: Waveform matches literature
3. **Minimal chain**: LF → diff → R1 → R2 → R3 → recognizable vowel
4. **Full integration**: Frontend → synth → intelligible speech

## Build Order

1. Resonator
2. LF source  
3. Differentiator
4. Wire: LF → diff → R1 → R2 → R3 → out
5. Test with hardcoded /a/ (F1≈700, F2≈1200, F3≈2600)
6. Antiresonator + nasal path
7. Integrate frontend
8. Parallel path

## Don't

- Don't monolithic WASM blob
- Don't bypass AudioParam
- Don't fight WebAudio graph
- Don't optimize early
- Don't trust old/ DSP math