# Host Contract: Executing a Qlatt Synthesizer Outside the Reference Runtime

This document defines what a *host* must implement to execute a Qlatt
synthesizer definition and produce conforming audio. The declarative documents
(Bacon IR graph/registry, semantics, frontend rule packages) are the
specification of *what* to compute; this contract specifies the small set of
execution semantics that the documents themselves cannot carry. A host that
implements this contract can run every synthesizer in `public/experiments/`
without reading the TypeScript reference implementation.

Reference hosts today: the browser (WebAudio + AudioWorklet,
`src/klatt-runtime.ts` / `src/klatt-interpreter.ts`) and Node
(`node-web-audio-api`, `scripts/rendering/backends/node-runtime.ts`). A native
host (e.g. Rust + miniaudio) is the intended third.

## 1. Document set

A synthesizer is defined by:

| Document | Schema owner | Contents |
|----------|--------------|----------|
| `registry.yaml` | Bacon IR (`../bacon`) | Primitive node types: params, ports, implementation bindings |
| `graph.yaml` | Bacon IR | Node instances, connections, literal/bound param values |
| `semantics.yaml` | Qlatt | Input params, constants, CEL realize rules, scheduling flags |
| Frontend packages (`public/rules/frontends/`) | Qlatt | Text→frames pipeline (out of scope here; the frames boundary below is the cut) |

Experiments may `extends` a parent (see `public/experiments/manifest.json`);
registries, graphs, and semantics merge child-over-parent
(`src/experiments/load-experiment-config.ts`).

## 2. The frames boundary

The interchange format between frontend and backend is the `KlattFrame` track
(`src/klatt-interpreter.ts`):

```typescript
interface KlattFrame {
  time: number;                     // seconds from utterance start
  phoneme?: string;                 // label, non-normative
  word?: string;                    // label, non-normative
  params: Record<string, number>;   // Klatt parameter values
}
```

Frames are sorted by ascending `time`. A backend host consumes a track and the
three synthesizer documents; it does not need the frontend. This is the
conformance boundary: frontend conformance is text→track, backend conformance
is track→audio.

## 3. Primitive ownership rule

Registry entries carry implementation *bindings*: `wasm`, `worklet`, `native`.
These are hints for a particular host, not definitions.

**Rule: every primitive must have exactly one spec-owned definition — either a
Rust crate in `crates/` (compiled to WASM for browser/Node hosts, compiled
natively elsewhere) or a written formula in this section. A `native` binding is
an optimization a host MAY use only when the host-native node conforms to the
owned definition.**

Written definitions for the primitives that currently carry only a `native`
binding:

- `gain`: `out[n] = in[n] * gain`. (WebAudio `GainNode` conforms.)
- `constant-source`: `out[n] = offset`. (WebAudio `ConstantSourceNode`
  conforms.)

All other primitives are owned by their crate under `crates/` (the doc comment
at the top of each crate is the normative description; the crate's behavior is
the normative definition). History note: `dynamics-compressor` was bound to the
WebAudio `DynamicsCompressorNode` until 2026-07-22; it is now owned by
`crates/dynamics-compressor` precisely because the native node's semantics
(lookahead pre-delay, automatic makeup gain) were host-defined rather than
spec-owned.

## 4. Semantics evaluation

Per frame, the host derives realized parameter values from the semantics
document:

1. Build the static context once: `constants` + each param's `default` +
   `sampleRate`.
2. Per frame, overlay `frame.params` onto a copy of the static context
   (frame values win).
3. Evaluate `realize` rules as CEL expressions in topological order of their
   declared `deps`. Rules may reference params, constants, builtins, and
   previously realized values.
4. A parameter name with a realize rule binds its realized value; a name
   without one binds the frame value directly (passthrough).

**CEL dialect**: the reference evaluator is `cel-js`
(`src/semantics/cel-evaluator.ts`). Expressions used by the shipped semantics
documents are limited to arithmetic, comparisons, ternaries, member access,
and registered function calls — a port must support at least that subset.

**Required builtins** (reference implementation: `src/builtin-functions.ts`):

The conversion domains are data, not host defaults. Before registering these
builtins, load `ndbCor`, `ndbCorBinHz`, `ndbCorMinHz`, `ndbCorMaxHz`,
`klsynAmpTable`, `klsynAmpScale`, `dbFloorDb`, `dbCeilingDb`, and
`dbPerDoubling` from the owning semantics document. The shared reference values
are in `klatt80-baseline/semantics.yaml`; standalone semantics documents that
carry the tables carry the same domain constants. Reject the document unless
`ndbCor.length == (ndbCorMaxHz - ndbCorMinHz) / ndbCorBinHz` and that quotient
is an integer.

- `dbToLinear(db)`: `0` if `db <= dbFloorDb`, else
  `2^(min(db, dbCeilingDb) / dbPerDoubling)` (Klatt 1980 PARCOE.FOR).
- `dbToLinearKlsyn(db)`: `klsynAmpTable[floor(db)] * klsynAmpScale`, with the
  existing table-bound clamping (klsyn88 `parwvt.h`).
- `proximity(delta)`: `ndbCor[floor((delta - ndbCorMinHz) / ndbCorBinHz)]`;
  return `0` outside `[ndbCorMinHz, ndbCorMaxHz)` (Klatt 1980 PARCOE.FOR
  `NDBCOR`).
- `resonatorGainDb(...)` and the other exports of `builtin-functions.ts` as
  referenced by the semantics documents in use.
- The `ndbScale` constant table (source amplitude offsets incl. G0
  compensation) is carried in the owning semantics document and referenced by
  semantics expressions.

## 5. Automation model

The interpreter compiles the track into a flat schedule of events
`(time, target-param, value, mode)` where `mode ∈ {step, ramp}`:

- **Mode resolution** per bound name, in precedence order: a realize rule's
  `step: true` forces step; else `ramp: true` forces ramp; else the document's
  `defaultScheduling` applies (`ramp` in the shipped documents — Klatt 1980:
  all parameters linearly interpolated between update frames).
- **Anchor**: the first frame of a track always schedules as step, even for
  ramp-mode params (establishes the automation start value).
- **step** semantics: the parameter holds its previous value until `time`,
  then jumps to `value` (zero-order hold). WebAudio equivalent:
  `setValueAtTime`.
- **ramp** semantics: the parameter interpolates linearly from its value at
  the previous event to `value`, arriving exactly at `time`. WebAudio
  equivalent: `linearRampToValueAtTime`.

Binary switches (e.g. cascade/parallel branch gains) must be step —
intermediate values are acoustically invalid (see `docs/parameter-scheduling.md`).

## 6. Rendering model

- Audio is processed in blocks; the reference hosts use the WebAudio render
  quantum of 128 samples.
- Node parameters are k-rate: sampled once per block (the value in effect at
  the block start). A conforming host may use a different block size; the
  conformance tolerances below absorb sub-block timing differences.
- Connections sum when fan-in > 1 (WebAudio mixing semantics: unity-gain
  summing junction).
- **No hidden latency**: a primitive must not impose lookahead or other
  pre-delay unless its owned definition declares it. (This is a synthesizer
  for screen-reader use; end-to-end latency is a feature.)
- Noise-generating primitives take an explicit seed (`noise-source` derives
  per-node seeds from a base seed; see
  `scripts/rendering/backends/node-runtime.ts`) so renders are reproducible.

## 7. Conformance

- `npm run test:golden` — golden corpus under `test/golden/` (rendered via the
  Node host; `scripts/render-phrase.ts --write-golden 1` regenerates).
- `npm run lint:audio` — voiced-periodicity check: where the track says voiced,
  independent pitch tracking must detect periodicity.
- `scripts/compare-wav-levels.ts` — peak/RMS/lag A/B comparison for
  host-vs-host or before/after DSP swaps.

A new host should first reproduce the golden phrase renders within the
tolerances used by `render-phrase.ts` golden comparison, then pass
`lint:audio` on the corpus.

## Validation

All five experiment graphs pass `bacon check` against their declared registry
layers (`meta.primitives` is a list merged in order, later entries winning per
primitive). Qlatt extension data (`formantBanks`, including its
`connections` to bank-generated nodes) lives under the graph's `meta:` key, so
the static documents validate without knowledge of Qlatt's macros. Audio-rate
connections into node parameters are first-class in the schema
(`to: { node, param }`).

## Known gaps (2026-07-22)

- CEL dialect parity between `cel-js` and a native CEL implementation
  (e.g. cel-rust) has not been audited.
