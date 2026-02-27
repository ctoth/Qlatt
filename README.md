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
- `src/tts-frontend.ts` preloads `public/cmu-dictionary.json` at runtime (generate/update it with `npm run build:dict`).
- The frontend runtime is declarative-first: `src/declarative-frontend/rule-pack.ts` + `src/declarative-frontend/engine.ts` drive structural, duration, prosody, and finalize phases.
- Legacy imperative frontend mutators (`rule_K_Context`, `rule_GenerateF0Contour`) are removed from runtime usage and module exports.

## Declarative Validation

- Run declarative frontend + frontend migration tests:
```
npx vitest run (Get-ChildItem -Path test -Filter 'declarative-frontend-*.test.ts' | ForEach-Object { $_.FullName }) test/tts-frontend-declarative-prosody.test.ts test/tts-frontend-declarative-corpus.test.ts test/tts-frontend-declarative-golden-summary.test.ts
```

- Regenerate locked declarative corpus golden summary:
```
npm run golden:declarative-summary
```

## Structure

- `crates/`: Rust WASM DSP primitives.
- `worklets/`: AudioWorklet processors and WASM outputs.
- `src/`: Synth wrapper and TTS pipeline.
- `test/`: Minimal UI harness.
