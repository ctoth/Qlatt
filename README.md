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

The harness exposes a `Frontend` selector. Available bundled frontends:

- **qlatt-english** — default frontend with CMU dictionary lookup, Elovitz LTS rules, and prosody modeled from Pierrehumbert/O'Shaughnessy
- **dectalk-english** — faithful recreation of DECtalk 4.63 timing, duration, F0 (hat pattern), stop/fricative models, and LTS rules

## Common Commands

```bash
npm test                        # run the Vitest suite
npm run test:golden             # run golden audio comparisons
npm run build                   # production build
npm run build:dict              # rebuild public/cmu-dictionary.json
npm run audit:dict-miss         # scan for dictionary misses in a phrase set
```

### Explain (Provenance Trace)

```bash
npm run explain -- "hello world"                     # compact text output (~40 decisions)
npm run explain -- "hello world" --verbose            # all decisions
npm run explain -- "hello world" --format json --out report.json
npm run explain -- "hello world" --stage rules        # filter by pipeline stage
npm run explain -- "hello world" --why d000045        # trace ancestry of a decision
npm run explain -- "hello world" --strict-citations   # exit code 2 if any uncited
npm run explain:summary -- report.json                # summarize a JSON report
```

### TTS DSL Inspector

```bash
npm run tts-dsl -- run --spec <file>       # run the rule engine on a spec
npm run tts-dsl -- validate --spec <file>  # validate a spec
npm run tts-dsl -- explain --spec <file>   # explain rule firing
npm run tts-dsl -- diff --spec <file>      # diff phase snapshots
npm run tts-dsl -- why-not --spec <file>   # explain why a rule did not fire
```

### Offline Rendering

```bash
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/render-phrase.ts \
  --phrase "hello world" --frontend-id qlatt-english --out-wav out.wav
```

Options: `--base-f0`, `--rate`, `--transition-ms`, `--sample-rate`, `--experiment-id`, `--engine`, `--out-json`.

### Oracle Comparison (DECtalk Reference)

```bash
npm run oracle:build-dectalk     # build the DECtalk reference binary
npm run oracle:run -- --corpus test/oracle-corpora/basic.yaml --out test/oracle-output/
npm run oracle:compare -- --a test/oracle-output/dectalk/ --b test/oracle-output/qlatt/
```

## Architecture At A Glance

```
Text → normalizeText() → transcribeText() → [inventory lookup]
     → rule phases (postlexical → structural → duration → formant → prosody)
     → assembleKlattTrack() → frames → interpreter → WebAudio graph
```

- `src/tts-frontend.ts` — normalizes text, transcribes it, applies declarative rule phases, and emits `KlattFrame[]`.
- `public/rules/frontends/<frontend-id>/` — each frontend is a self-contained package with `frontend.yaml`, `pipeline.yaml`, `inventory.yaml`, `lts-rules.yaml`, and `phases/*.yaml`.
- `public/experiments/` — synthesizer configurations (`registry.yaml`, `graph.yaml`, `semantics.yaml`). Active configs: `klatt80-baseline`, `dectalk-english`, `klsyn88`, `stevens91`.
- `src/semantics/` — evaluates CEL expressions in dependency order to realize AudioParam values.
- `src/declarative-frontend/` — rule engine, parser, validation, inventory, and diagnostic tooling.
- `src/rendering/` — offline WAV rendering backends (node-web-audio-api, headless browser).
- `src/worklets/` — TypeScript AudioWorklet sources; compiled JS and WASM artifacts land in `public/worklets/`.
- `crates/` — Rust DSP primitives compiled to WebAssembly (resonator, antiresonator, LF source, decay envelope, edge detector, signal switch, aerodynamic model, Fujisaki resonator, tilt filter, and more).
- `papers/` — paper library (~150 papers) with implementation-focused `notes.md` extractions backing the system's citations.
- `scripts/oracle/` — DECtalk oracle pipeline: build reference binary, render corpora, compare audio output.

## Project Conventions

- Rules in `public/rules/frontends/<frontend-id>/phases/*.yaml` must carry `citations:` and should use `tag:` on each behavioral modification.
- Non-trivial pipeline decisions should emit provenance records so frontend and runtime choices stay explainable.
- Runtime clamps, defaults, and fallbacks should emit diagnostics.
- Every magic number needs a citation. If you can't cite it, label it `# engineering estimate`.

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
