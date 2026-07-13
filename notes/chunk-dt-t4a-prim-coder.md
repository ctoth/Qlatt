# Chunk DT t4a — generic boundary-value transition primitive (coder)

Date: 2026-05-29. Branch `dectalk-parity`. Behavior-PRESERVING refactor.

## Goal
Generalize the track-assembler's single fixed-50%-midpoint backward blend into a
generic per-parameter, per-edge boundary-value linear-ramp primitive. Byte-identical.
Override hooks (locus bouval, per-param durtran span) left for later chunk; default
to current behavior.

## Observed current mechanism (verified by reading src/track-assembler.ts)
- `blendParams(base, next, [F1,F2,F3,B1,B2,B3], 0.5)` (was L1014-1030): per key,
  `blended[key] = a + (b-a)*0.5` (a=this steady, b=next steady). Midpoint.
- Apply site (L1351-1399): when both `segment.type` and `next.type` in
  `smooth_types`=[vowel,nasal,liquid,glide] AND phTransitionSec>0:
  - `steadyTime = max(start+0.02, target - transition)`
  - `transitionParams = blendParams(...)` (the bouval set at segment END edge)
  - events >= steadyTime use transitionParams; before use finalParams (steady).
  - This is a BACKWARD (segment-END) edge transition, span = phTransitionSec.
- Obstruents NOT in smooth_types -> excluded (kept as-is, per spec).
- Config: dectalk-english/frontend.yaml output.lowering.transitions
  (default_transition_ms=30, blend.factor=0.5, keys, smooth_types).

## Refactor done so far
- Replaced `blendParams` with generic `resolveBoundaryParams(steady, neighbor,
  keys, factor, spanSec, edge, resolver=midpointBoundaryResolver)`.
  - `BoundaryEdge` = "forward"|"backward"; `BoundaryValue` = {value, spanSec};
    `BoundaryValueResolver` = per-(key,edge) -> BoundaryValue|null.
  - `midpointBoundaryResolver`: value = steady + (neighbor-steady)*factor, shared
    span. With factor 0.5 == old midpoint == byte-identical.
- NEXT: rewire apply site (L~1362) to call resolveBoundaryParams with edge
  "backward". Keep steadyTime/event logic unchanged.

## Byte-identity proof
- DONE: `npx vitest run` = 125 files / 1107 passed. PASS.
- DONE: `git status` tracked changes = ONLY `src/track-assembler.ts`. Zero
  test/oracle/snapshot files modified. No regeneration.
- DONE: `npx tsc` no errors in track-assembler.ts (script/* errors pre-existing).
- DONE golden: ran the 3 golden scripts individually for exit codes:
  - render-phrase.ts EXIT=0  (PASS — render output unchanged)
  - lf-source-wasm-compare.ts EXIT=1  (the ONLY failure; pre-existing
    lf-source mismatch, maxDelta 0.79 / rms 0.325; allowed by spec)
  - klatt-tract-wasm-compare (resonator/antiresonator) PASS.
  `npm run test:golden` exit 1 is attributable solely to lf-source.
- DONE probe: confirmed `midpointBoundaryResolver` with factor 0.5 produces
  `a + (b-a)*0.5` for F1-F3/B1-B3 — identical to the removed `blendParams` —
  for a vowel-pair boundary. (Probe was a throwaway mirror check; deleted, since
  the 1107-pass vitest suite with ZERO snapshot changes is the authoritative
  byte-identity proof: any change to transition values for any test word,
  including real renders of "away"/"annoy"-class words, would flip a snapshot.)

## Primitive shape & override hooks (for t4b/t4c/t4a-data)
- `resolveBoundaryParams(steady, neighbor, keys, factor, spanSec, edge, resolver)`
  returns the param set holding AT the segment edge (the `bouval` set); keys
  with no resolver result keep their steady target. Interpreter ramps linearly
  steady -> these values, reproducing the boundary-value linear ramp.
- `BoundaryEdge` = "forward" (segment START) | "backward" (segment END).
  THIS chunk emits only "backward" with the shared span (legacy behavior).
- `BoundaryValueResolver` = per-(key,edge) -> {value, spanSec} | null. The
  default `midpointBoundaryResolver` = 50% midpoint + shared span. A later chunk
  passes a locus-aware resolver computing `bouval = locus + prcnt*(curval-locus)/100`
  and per-parameter `durtran` spans, plus a forward-edge emission — no further
  engine change needed; the apply-site already threads `spanSec`/`edge`.
- GENERIC: zero frontend-name/per-phoneme literals; driven by `transitions`
  config (keys, factor, smooth_types, default_transition_ms). Obstruent exclusion
  unchanged (smooth_types gate untouched).

## STATUS: COMPLETE. Byte-identical refactor verified.
