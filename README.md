# QLATT

WebAudio Klatt formant synthesizer with WASM-backed AudioWorklet DSP nodes.

## Quick start

1) Build the WASM modules:
```
./build.sh
```
or on Windows:
```
pwsh -File build.ps1
```

2) Run the dev server:
```
npm run dev
```

3) Open the test harness:
```
http://localhost:8000/test/test-harness.html
```

## Notes

- The LF source uses a natural glottal pulse with an Rd-driven open phase ratio and a simple spectral tilt mapping.
- Resonator and antiresonator processors implement Klatt 1980 two-pole and two-zero sections.
- `src/tts-frontend.js` uses `src/cmu-dictionary.js` (a small built-in dictionary). Swap to a full CMU dictionary if needed.

## Structure

- `crates/`: Rust WASM DSP primitives.
- `worklets/`: AudioWorklet processors and WASM outputs.
- `src/`: Synth wrapper and TTS pipeline.
- `test/`: Minimal UI harness.
