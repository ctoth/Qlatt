# Chunk ampsep — Scout Report (FINAL)

Goal: separate amplitude tables per backend so each DSP backend uses ITS OWN amplitude
scaling instead of all backends borrowing klatt80-baseline's. Fixes confirmed defect:
klsyn88 renders ~14 dB quieter at peak than klatt80, because klsyn88 is forced to use
klatt80's amplitude tables.

## TL;DR — the real shape of the defect

There are TWO independent amplitude-table mechanisms, and they are NOT both broken:

1. **`ndbScale` (and `ndbCor` as a constant) reach CEL exprs as DATA via the active
   backend's MERGED semantics.constants** — this path is ALREADY backend-aware. Each
   backend's `semantics.constants.ndbScale` flows through `loadExperimentConfig` →
   `createKlattInterpreter` → `buildStaticContext` → CEL context.

2. **`proximity()` and `dbToLinearKlsyn()` are TS functions that read MODULE-GLOBAL
   tables (`ndbCor`, `klsynAmpTable`) loaded ONCE at import time from a HARDCODED
   klatt80-baseline path.** These are blind to the active backend. THIS is the broken
   path. klsyn88's entire amplitude chain runs through `dbToLinearKlsyn()`, which reads
   `klsynAmpTable` — a table that physically lives in klatt80-baseline's YAML.

So the defect is NOT "klsyn88 has no table." The klsyn table EXISTS, but it is
(a) stored in the wrong backend's file and (b) reached via a global rather than the
active backend's semantics. The 14 dB gap is produced by the klsyn88 realize exprs +
the shared `klsynAmpTable` + the per-formant scale multipliers (0.4, 0.15, 0.06, ...)
— all of which currently sit half in klatt80's YAML and half in klsyn88's YAML.

---

## 1. The hardcoded loader (src/builtin-functions.ts)

EXACT hardcoded path, lines 15-16:
```ts
const KLATT_AMPS_YAML_PATH =
  "/experiments/klatt80-baseline/semantics.yaml";
```

Module-doc header lines 8-10 states the intent explicitly:
```
 * Klatt amplitude tables (ndbCor, ndbScale, klsynAmpTable) are loaded from
 * public/experiments/klatt80-baseline/semantics.yaml at module load time.
 * There is no TS-side fallback — a missing YAML constant is a build error.
```

TIMING = **module-load time, runs once on import**. Line 85:
```ts
const klattAmpTables = loadKlattAmpTables();   // top-level, sync, runs ONCE on import
```
`loadKlattAmpTables()` (63-83) calls `loadYamlDocumentSync(KLATT_AMPS_YAML_PATH)` (sync
XHR in browser / sync fs read in node, via yaml-loader.ts:80). This is THE crux: a
module-load global cannot know which backend is active at synthesis time. By the time
`loadExperimentConfig("klsyn88")` runs, the globals are already frozen to klatt80 values.

Exported symbols DERIVED from that YAML (all top-level `export const`):
- `ndbCor: number[]` (line 92) ← `constants.ndbCor`
- `ndbScale: Record<string,number>` (line 99) ← `constants.ndbScale`
- `klsynAmpTable: number[]` (line 106) ← `constants.klsynAmpTable`

Functions in the same file and their table dependency:
- `dbToLinear(db)` (112-115) — **pure math** `2^(min(96,db)/6)`, NO table dependency,
  backend-neutral. Do not touch its values.
- `dbToLinearKlsyn(db)` (120-124) — reads GLOBAL `klsynAmpTable`. BLIND to backend.
- `proximity(delta)` (130-134) — reads GLOBAL `ndbCor`. BLIND to backend.
- `resonatorMagnitudeDb(...)` (146-173) — pure math, no table.

Validation helpers `requireNumberArray` / `requireNumberMap` (26-61) throw
`E_KLATT_AMP_TABLE_MISSING` / `E_KLATT_AMP_TABLE_INVALID`. There is no fallback.

## 2. What's in klatt80-baseline/semantics.yaml

Real path CONFIRMED: `public/experiments/klatt80-baseline/semantics.yaml`. There is ALSO
a repo-root `experiments/` dir, but it contains only one markdown design doc
(`declarative-f0-and-structural-templates-2026-05-27.md`), NOT configs. All runtime
configs live under `public/experiments/`.

`constants:` block starts line 392. Amp tables:
- **ndbScale** (403-419): AV:-119, AH:-134, AF:-119, AVS:-91, A1:-58, A2:-65, A3:-73,
  A4:-78, A5:-79, A6:-80, A7:-81, A8:-82, A9:-83, A10:-84, AN:-58, AB:-84.
  Source comment: Klatt 1980 PARCOE.FOR NDBSCA, -47 offset for G0 compensation.
- **ndbCor** (424): `[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]` — Klatt 1980 PARCOE.FOR NDBCOR.
- **klsynAmpTable** (429-447): 89-entry int table 0..32767. Comment (426-428):
  "klsyn88 amptable (parwvt.h): DBtoLIN(dB) = amptable[dB] * 0.001 ... Used by
  dbToLinearKlsyn()."

**CRITICAL FINDING (the "already exists?" question):** `klsynAmpTable` is a KLSYN-SPECIFIC
table that LIVES IN klatt80-baseline's semantics but is NEVER used by klatt80's own
realize exprs (klatt80 uses `dbToLinear()` + `ndbScale.*`, see 711-805). It sits in
klatt80's YAML PURELY so the module-global export can serve klsyn88. So yes — a klsyn
amplitude table already exists; it is just mislocated in the wrong backend's file.

## 3. Do other backends have their own amp tables?

- **klsyn88/semantics.yaml** (standalone, NO `extends`): `constants:` block (line 300)
  has ONLY `F7/B7/F8/B8` + `plstepThreshold/plstepBurstOffsetDb`. It has NO ndbScale,
  NO ndbCor, NO klsynAmpTable. Its realize (398-462) runs every gain through
  `dbToLinearKlsyn(...)` × per-formant scale (voiceGain, parVoiceGain, aspGain×0.05,
  fricGain×0.25, a1Gain×0.4, a2Gain×0.15, a3Gain×0.06, a4Gain×0.04, a5Gain×0.022,
  a6Gain×0.03, anpGain×0.6, abGain×0.05, gain0Linear×0.0000305...). It NEVER uses
  `ndbScale` and NEVER uses `proximity`. So klsyn88's ONLY external table dependency is
  the GLOBAL `klsynAmpTable` (currently sourced from klatt80's YAML).
- **dectalk-english/semantics.yaml** (`extends: klatt80-baseline`): 93 lines, NO
  `constants:` block, NO amp references at all. Inherits ndbScale/ndbCor/klsynAmpTable
  from klatt80 via `mergeSemantics`. Uses klatt80's realize exprs (cascade dbToLinear +
  ndbScale).
- **stevens91/semantics.yaml** (`extends: klatt80-baseline`): NO own constants. Realize
  (119-133) uses `dbToLinear(GO + ... + ndbScale.AV/AH/AF)`. Relies on inherited klatt80
  ndbScale. Uses `proximity` only if inherited klatt80 realize fires (the merged doc).

Implication for the fix: this is mostly **"relocate the klsyn table into klsyn88's own
semantics + make the TS functions source tables from the active backend"** rather than
"author brand-new tables." But note: klsyn88 may need its OWN `klsynAmpTable` value to
close the 14 dB gap — relocating identical values alone will NOT change loudness. The
coder must decide whether the fix is purely mechanical (relocate) or also numeric
(retune klsyn88's table/scales). See hardest decisions.

## 4. Every consumer (blast radius), file:line

### A. CEL function registration (the indirection layer)
- `src/semantics/register-builtins.ts:28-31` registers `dbToLinear` → calls TS `dbToLinear`.
- `register-builtins.ts:33-36` registers `dbToLinearKlsyn` → calls TS `dbToLinearKlsyn`
  (reads global `klsynAmpTable`). **BLIND to backend.**
- `register-builtins.ts:54-57` registers `proximity` → calls TS `proximity` (reads global
  `ndbCor`). **BLIND to backend.**
- These are registered globally per CelEvaluator via `registerNumericBuiltins`, called
  from `src/semantics/evaluator-factory.ts:12` (used by both interpreter and runtime).
  The evaluator is created INSIDE `createKlattInterpreter` (klatt-interpreter.ts:199
  `createConfiguredEvaluator()`), which DOES know the active semantics/backend. So the
  registration site CAN become backend-aware (see seam, §5).

### B. CEL data access to ndbScale (already backend-aware — DATA, not function)
- `cel-evaluator.ts:60-64` merges `context.constants` into eval context → `ndbScale.AV`
  resolves from the active backend's MERGED constants.
- `klatt-interpreter.ts:202` `const constants = {...(semantics.constants ?? {})}` — pulls
  from the ACTIVE backend's merged semantics. → `buildStaticContext` (117-128, called 217).
- YAML exprs using `ndbScale.*`: klatt80 semantics 711-805; stevens91 119-133.

### C. Direct TS imports of the globals (legacy synth + analysis — NOT the runtime path)
- `src/klatt-synth.ts:1` imports `dbToLinear, proximity, ndbScale`. Heavy user:
  proximity at 669-671; ndbScale.* at 678/685/687/691/820-851/899-900; many dbToLinear
  calls. **This is the LEGACY hardcoded-topology synth** (AGENTS.md §"Legacy Synthesizer").
  It bakes klatt80 ndbScale numbers as literals in places (467 `-44`, 480 `-84`, 486
  `-58`, 678/969 etc.) — it is intrinsically klatt80-only and used by the test harness.
- `src/track-analysis.ts:4` imports `dbToLinear, proximity, ndbScale`; uses at 345/353-368.
  Analysis/range-estimation only — klatt80-flavored.
- `src/klatt-interpreter.ts:18` imports `dbToLinear` only (used 386 for PLSTEP burst).
  Pure math, backend-neutral.
- `src/formant-bank.ts:26-27,196` and `src/semantics/pfe-codegen.ts:44-69` reference an
  `ndbScale` FIELD on formant specs (per-formant codegen) — these are spec-driven literals
  from graph.yaml formantBanks, NOT the global; separate concern but same name.
- `src/semantics/types.ts:36` `ndbScale?: number` — type on FormantSpec, not the global.

### D. Knows-active-backend? per call site
- register-builtins.ts registrations: registration happens inside the interpreter that
  HAS the semantics → **CAN be made backend-aware**.
- klatt-synth.ts / track-analysis.ts: klatt80-only by design → leave on klatt80 tables.
  These do NOT participate in the per-backend runtime render path that produced the
  measured klsyn88 defect (that path is interpreter + node-runtime, §5).

## 5. The runtime backend-load path (the seam)

Chain (node render path, the one that measured the 14 dB gap):
`scripts/render-phrase.ts:24` (default experimentId klatt80-baseline; klsyn88 via flag)
→ `scripts/rendering/backends/node-runtime.ts:69` `loadExperimentConfig(request.experimentId)`
→ `node-runtime.ts:98` `createKlattInterpreter({ semantics: config.semantics, ... })`
→ `klatt-interpreter.ts:199` `createConfiguredEvaluator()` → registers builtins
→ `klatt-interpreter.ts:202/217` reads `semantics.constants` into the CEL context.

`loadExperimentConfig` (load-experiment-config.ts:83-119) is ASYNC and KNOWS the
experimentId. `mergeSemantics` (45-63) deep-merges constants so a child backend's
`constants.klsynAmpTable`/`ndbScale`/`ndbCor` would OVERRIDE klatt80's. (NOTE: the
`basePathPrefix` 2nd-arg seen in scripts/diag-tilt-binding.ts:20 is STALE — the live
signature takes only `experimentId`.)

**Recommended seam:** the active backend's `semantics.constants` (already merged, already
backend-correct) is the single source of truth. The two BLIND TS functions
(`proximity`, `dbToLinearKlsyn`) must stop reading module globals and instead read tables
from the active backend's constants. The cleanest seam is at CEL registration inside
`createKlattInterpreter` (klatt-interpreter.ts:199 region): register `proximity` and
`dbToLinearKlsyn` as CLOSURES over `semantics.constants.ndbCor` / `.klsynAmpTable` for
THIS interpreter instance, instead of importing the module-global versions. This makes
the functions per-render/per-backend without touching the global file's hardcoded path
for legacy consumers (klatt-synth.ts/track-analysis.ts can keep importing the globals).

Alternative seam: keep `register-builtins.ts` generic but have it accept a `tables`
argument (`{ndbCor, klsynAmpTable}`) sourced from `semantics.constants`, defaulting to
the current globals when absent. This isolates the change to one function signature.

## 6. CEL-registration implication

Currently `registerNumericBuiltins(celEvaluator)` (register-builtins.ts:27) registers
`proximity`/`dbToLinearKlsyn` as GLOBAL closures over module-level imports — i.e. ALL
evaluators share klatt80's tables regardless of backend. If tables become
backend-specific, registration MUST become PER-RENDER (per interpreter instance), because
each `createKlattInterpreter` call has a different `semantics.constants`. Architecturally:
`registerNumericBuiltins` should take the active backend's amp tables as a parameter (or
a sibling `registerAmpBuiltins(evaluator, tables)` should run after, overriding the two
table-dependent functions). `dbToLinear` / `min` / `max` / `pow` / `sqrt` etc. stay
global (pure math, no table). NOTE: `cel-evaluator.ts:72-77` silently skips re-registering
CEL builtins; not an issue for `proximity`/`dbToLinearKlsyn` (not CEL builtins), but the
coder must ensure the per-render override actually REPLACES the prior registration if both
run on the same evaluator.

## 7. Regression surface — klatt80-byte-identical invariant

- `npm run test:golden` (package.json:38) runs `scripts/run-golden.ts`, which invokes
  `klatt-tract-wasm-compare.ts`, `lf-source-wasm-compare.ts`, and `render-phrase.ts`.
  `render-phrase.ts` defaults to `experiment-id = klatt80-baseline` (line 24). So golden
  exercises the klatt80 amplitude path through the interpreter (CEL ndbScale + dbToLinear
  + proximity via global ndbCor).
- **Invariant the coder MUST preserve:** klatt80-baseline's realized amplitudes must be
  BYTE-IDENTICAL after the change. klatt80's table VALUES do not change — only the loading
  mechanism generalizes. Concretely:
  - klatt80 `ndbScale` (semantics.constants, 403-419) values unchanged.
  - klatt80 `ndbCor` (424) values unchanged, and `proximity()` for the klatt80 render must
    still resolve to that same `[10..1]` table.
  - `dbToLinear` math (112-115) unchanged.
  - If `klsynAmpTable` is RELOCATED out of klatt80's YAML into klsyn88's, verify the
    klatt80 golden render does NOT depend on it (klatt80 realize never calls
    dbToLinearKlsyn — confirmed, §3 — so relocation is safe for klatt80, but the
    module-global load at builtin-functions.ts:78-81 would then FAIL on klatt80's YAML
    because `constants.klsynAmpTable` would be absent). That hard-throw at load time is a
    trap: either keep a copy of klsynAmpTable in klatt80's YAML, OR remove the
    module-global load entirely and make all three tables per-render.
- Also re-run the klsyn88 render explicitly (`render-phrase --experiment-id klsyn88
  --out-wav`, node backend) and MEASURE peak/RMS to confirm the 14 dB gap closes — that
  is the actual acceptance signal, per MEMORY "how to actually test."

---

## Hardest decisions the coder will face

1. **Mechanical relocation vs numeric retune.** Moving `klsynAmpTable` (identical values)
   into klsyn88's YAML and sourcing it per-backend will NOT change klsyn88's loudness by
   itself — klsyn88 already uses that exact table via the global. If the 14 dB gap is
   produced by the table+scales klsyn88 ALREADY uses, then "separate the tables" alone
   does not fix loudness; the coder may need to ALSO retune klsyn88's `klsynAmpTable`
   and/or the per-formant scale multipliers (0.4, 0.15, ...). The scout cannot tell from
   static reading whether the plan intends mechanical separation (architectural) or
   numeric correction (loudness). THIS AMBIGUITY SHOULD BE RESOLVED BEFORE CODING — if the
   plan only says "separate tables," loudness may not move, and the golden/measured gap
   stays open. Flag to foreman.

2. **The module-global hard-throw trap.** `builtin-functions.ts:85` loads all three tables
   at import time and THROWS if any is missing. If `klsynAmpTable` is removed from
   klatt80's YAML, that import-time load fails for every consumer. Decide: (a) keep the
   global load but stop USING `klsynAmpTable`/`ndbCor` globals in the runtime path
   (legacy klatt-synth.ts/track-analysis.ts still use them), or (b) make
   `proximity`/`dbToLinearKlsyn` per-render closures over active `semantics.constants` and
   leave the global as a klatt80-only fallback for legacy consumers. Option (b) is the
   minimal, byte-safe path but leaves a dormant klatt80-flavored global.

3. **Where to seam: per-render registration vs table-parameter.** Either close
   `proximity`/`dbToLinearKlsyn` over `semantics.constants` inside `createKlattInterpreter`
   (klatt-interpreter.ts:199), or pass `tables` into `registerNumericBuiltins`
   (register-builtins.ts:27). The latter is smaller surface but changes a shared signature
   used by both interpreter and runtime via evaluator-factory.ts. Must ensure the override
   actually replaces any earlier global registration on the same evaluator.

4. **Legacy klatt-synth.ts / track-analysis.ts.** These import the globals directly and
   bake klatt80 ndbScale literals. They are klatt80-only by design and feed the test
   harness. Decide explicitly to leave them on klatt80 tables (do NOT make them
   backend-aware) so klatt80 golden stays byte-identical — but document that they will be
   WRONG if ever pointed at klsyn88. Confirm they are not on the klsyn88 render path
   (they are not — klsyn88 uses interpreter + node-runtime).
