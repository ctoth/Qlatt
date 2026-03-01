# Documentation

Use these documents as the main entry points into the codebase:

- `synthesizer-architecture.md`: overall runtime architecture, YAML layers, and DSP extension points.
- `parameter-scheduling.md`: how `KlattFrame` values become realized and scheduled AudioParams.
- `adding-a-synthesizer.md`: practical workflow for adding a new synthesizer configuration or primitive.
- `yaml-graph-tests.md`: YAML-first test harness for semantics and scheduling assertions.

Current path conventions:

- The checked-in synthesizer configs live under `public/experiments/`.
- AudioWorklet source files live under `src/worklets/`.
- Built worklet JavaScript and copied WASM artifacts live under `public/worklets/`.
