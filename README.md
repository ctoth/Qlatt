# Qlatt

Explainable WebAudio Klatt formant synthesis with a declarative TTS frontend and WASM-backed AudioWorklet DSP.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Build the WASM modules:

```bash
npm run build:wasm
```

On Windows, use:

```powershell
npm run build:wasm:ps
```

3. Start the dev server:

```bash
npm run dev
```

`npm run dev` runs `predev`, which compiles `src/worklets/*-processor.ts` into `public/worklets/`. It does not build the Rust WASM crates, so step 2 is still required after DSP changes or on a fresh checkout.

4. Open the browser harness:

```text
http://localhost:8000/test/test-harness.html
```

The harness now exposes a `Frontend` selector. The default bundled frontend is `qlatt-english`, backed by `public/rules/frontends/qlatt-english/frontend.yaml`.

## Common Commands

```bash
npm test              # run the Vitest suite
npm run test:golden   # run golden audio comparisons
npm run build         # production build
npm run build:dict    # rebuild public/cmu-dictionary.json
```

## Architecture At A Glance

- `src/tts-frontend.ts` normalizes text, transcribes it, applies declarative rule phases, and emits `KlattFrame[]`.
- `public/rules/frontends/qlatt-english/` is the default declarative frontend package; `frontend.yaml`, `pipeline.yaml`, and `phases/*.yaml` live together there, while `public/rules/` keeps shared inventory and lexicon assets.
- `public/experiments/klatt80-baseline/` contains the active synthesizer configuration: `registry.yaml`, `graph.yaml`, and `semantics.yaml`.
- `src/semantics/` evaluates CEL expressions in dependency order to realize AudioParam values.
- `src/worklets/` contains the TypeScript AudioWorklet sources; the compiled JavaScript and copied WASM artifacts land in `public/worklets/`.
- `crates/` contains the Rust DSP primitives compiled to WebAssembly.
- `papers/` contains the paper library and implementation notes that back the system's citations.

## Project Conventions

- Rules in `public/rules/frontends/<frontend-id>/phases/*.yaml` must carry `citations:` and should use `tag:` on each behavioral modification.
- Non-trivial pipeline decisions should emit provenance records so frontend and runtime choices stay explainable.
- Runtime clamps, defaults, and fallbacks should emit diagnostics.

## Documentation

- `docs/synthesizer-architecture.md`: runtime layers, YAML configuration, and DSP extension points.
- `docs/parameter-scheduling.md`: how frame parameters become scheduled AudioParam changes.
- `docs/adding-a-synthesizer.md`: end-to-end workflow for adding a new synthesizer configuration.
- `docs/yaml-graph-tests.md`: YAML-first graph and semantics tests.

## Validation Workflows

- Declarative frontend regression summary:

```bash
npm run golden:declarative-summary
```

- Strict citation gate over a phrase corpus:

```bash
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/check-strict-citations.ts --corpus test/phrase-sets/linguistic.json
```

- Export an A/B listening manifest:

```bash
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/export-listening-ab-manifest.ts --corpus test/phrase-sets/linguistic.json --out test/golden/listening-ab-manifest.json
```
