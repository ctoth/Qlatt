# Documentation

Use these documents as the main entry points into the codebase:

- `synthesizer-architecture.md`: overall runtime architecture, YAML layers, and DSP extension points.
- `parameter-scheduling.md`: how `KlattFrame` values become realized and scheduled AudioParams.
- `adding-a-synthesizer.md`: practical workflow for adding a new synthesizer configuration or primitive.
- `yaml-graph-tests.md`: YAML-first test harness for semantics and scheduling assertions.

## Path Conventions

- Synthesizer configs live under `public/experiments/` (e.g., `klatt80-baseline`, `dectalk-english`, `klsyn88`, `stevens91`).
- Frontend rulepacks live under `public/rules/frontends/` (e.g., `qlatt-english`, `dectalk-english`).
- AudioWorklet source files live under `src/worklets/`.
- Built worklet JavaScript and copied WASM artifacts live under `public/worklets/`.

## CLI Tools

- `npm run explain -- "<phrase>"` — provenance trace of the full TTS pipeline.
- `npm run tts-dsl -- <subcommand>` — rule engine inspector (phases, field, why-not, replay, explain).
- `scripts/render-phrase.ts` — offline WAV rendering via node-web-audio-api or Playwright.
- `scripts/oracle/` — DECtalk oracle pipeline: build reference binary, render corpora, compare audio.
