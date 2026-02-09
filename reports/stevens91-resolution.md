# Stevens91 Issue Resolution

Date: 2026-02-09

This report closes the acceptance checklist in `reports/stevens91-paper-faithful-spec.md` with concrete implementation evidence.

## Checklist Closure

- [x] Citation text references Journal of Phonetics 19:161-174.
  - Evidence: `public/experiments/stevens91/registry.yaml`, `public/experiments/stevens91/semantics.yaml`, `public/experiments/stevens91/graph.yaml`, `public/worklets/aerodynamic-model-processor.js`, `crates/aerodynamic-model/src/lib.rs`

- [x] Experiment exposes all 10 HL params (`f1 f2 f3 f4 f0 ag ac an st pm`).
  - Evidence: `public/experiments/stevens91/semantics.yaml` (`params` + `realize` mappings), `public/experiments/manifest.json`

- [x] `pm` is HL control; `ps` is contextual (not replacement HL control).
  - Evidence: `public/experiments/stevens91/semantics.yaml` (HL parameter set omits `ps`), `public/experiments/stevens91/graph.yaml` (`ps: 8.0` constant into `aeroModel`)

- [x] `ag/ac/an/st/pm` ranges/defaults align to Table I intent.
  - Evidence: `public/experiments/stevens91/semantics.yaml`, `public/experiments/stevens91/registry.yaml`

- [x] Aerodynamic mapping derives and wires `AV`, `AH`, `AF`, `B1`.
  - Evidence: `crates/aerodynamic-model/src/lib.rs` (model outputs), `public/worklets/aerodynamic-model-processor.js` (8-output worklet bridge), `public/experiments/stevens91/graph.yaml` (AudioParam connections)

- [x] Nasal/stridency pathways implemented (`an`, `st` are active signals).
  - Evidence: `crates/aerodynamic-model/src/lib.rs` (`an -> FNP/FNZ/B1`, `st -> AF scale`), `public/experiments/stevens91/graph.yaml` (`aeroModel` output ports wired to nasal/edge/frication paths)

- [x] `ac` defaults consistent between semantics and registry.
  - Evidence: `public/experiments/stevens91/semantics.yaml` (`ac` default `0.4`), `public/experiments/stevens91/registry.yaml` (`ac` default `0.4`)

- [x] Non-exact mappings are clearly labeled as approximations.
  - Evidence: approximation language in `public/experiments/stevens91/graph.yaml`, `public/experiments/stevens91/semantics.yaml`, and inline comments/docstrings in `crates/aerodynamic-model/src/lib.rs`

## Validation Run

- `cargo test -p aerodynamic-model` -> pass (5/5)
- `npm test -- test/yaml-graph.test.ts` -> pass (8/8)
- `npm test -- test/yaml-graph.test.ts test/klsyn88.test.ts` -> fails in existing unrelated `klsyn88` primitive tests (`impulsive-source`, `square-source`, `pitch-sync-mod`)
