# Test Harness Improvement Planning

## Current State

### Interactive Harness (`test/test-harness.js` — 1507 lines)
- Single monolithic JS file, served as the main app at `/`
- Uses new runtime stack (klatt-runtime + klatt-interpreter), NOT legacy KlattSynth
- Features: phrase input, base F0, rate slider, experiment selector, full Klatt parameter sliders, diagnostics textarea, spectrogram canvas
- Has telemetry (PLSTEP events, RMS/peak meters), spike detection, formant range checking
- Session isolation via incrementing sessionId
- `speak()` → `textToKlattTrack()` → `speakWithNewRuntime()` → interpreter.scheduleTrack()

### Test Infrastructure
- **Vitest** (75 test files) — pure Node.js, mock AudioContext, no real audio
- **Golden WASM compare** — resonator/antiresonator impulse response, LF waveform (direct WASM instantiation)
- **Golden phrase render** — Puppeteer + OfflineAudioContext + legacy KlattSynth
- **Declarative corpus golden** — track metric summaries for 20 phrases (pure TS, no audio)
- **Linguistic master golden** — offline pipeline comparing qlatt vs klatt-syn reference

### What the harness does well
- Rich diagnostics output (formant ranges, gain derivations, voicing issues, PLSTEP events)
- Telemetry from actual WebAudio nodes
- Spectrogram visualization
- Experiment switching (loads different YAML configs)

## Observations / Issues to Discuss

TBD — awaiting planning discussion with Q.
