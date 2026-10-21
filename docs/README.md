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

For PowerShell argument forwarding and the complete explain flag reference, see [Explain Tool Reference](../AGENTS.md#explain-tool-reference). The documented direct Node invocation accepts `--phrase "..."` explicitly. `--strict-citations` checks all decisions in the full run, independently of the displayed output window or ancestry.

Explain text, including `--why`, appends authored rule-declaration locations for decisions joined through committed rule transactions. JSON exposes the same locations by decision ID in `tooling.ruleSources`; literal origins and macro-body ancestry are not included.

Use `--format dot --out decisions.dot` to export the selected provenance DAG for Graphviz.
DOT uses current-run IDs and stage colors, and reports parent links omitted by selection.
With `--why`, text also prints the full compiled rule and its referenced pattern;
JSON exposes them by decision ID in `tooling.ruleExpressions`. These normalized,
expanded definitions are distinct from authored YAML and do not identify which
dispatch branch or individual literals contributed to the decision.
