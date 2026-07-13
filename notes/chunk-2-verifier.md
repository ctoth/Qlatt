# Chunk 2 Verifier Notes

2026-05-24: Verifying commit f6f7258f (codex coder) on branch declarative-cleanup.

## Findings

- Gate 1 (commit shape): PASS. Only the 5 expected files.
- Gate 2 (deletion greps): PASS. All four identifiers gone from src/. formant.yaml ternary dispatch confirmed replaced.
- Gate 3 (inventory field names): PASS. Spot-checks confirmed: S `is_obstruent: true`, P `is_stop_base: true`, M `nasal_place_index: 1`.
- Gate 4 (consumer rewrites): PASS. No TS shims. Direct read of `reference.is_obstruent === true`, `reference.is_back_rounded === true`, `materialized.is_stop_base === true`, and direct numeric decode of nasalPlaceIndex.
- Gate 6 (nasal_place_index naming): PASS. Inventory has `nasal_place_index` (snake_case). CEL `target(current.phoneme).nasal_place_index` reads it. Rule's `apply` block explicitly writes `params.nasalPlaceIndex` (camelCase) — the rename is in the rule itself, not via auto-conversion. Consumer reads `params.nasalPlaceIndex`. Confirmed via reading `targetFn` at engine.ts:820 which calls `materializeInventoryTarget` and spreads inventory keys verbatim.
- Gate 7 (baselines): PASS. vitest 171 pass / 2 baseline fails. Golden: exit 1, only lf-source-wasm-compare at 0.325 (<= 0.326).
- Gate 8 (pathspec): PASS, no knowledge/ paths.

## BLOCKER for Gate 5: Silent DECtalk frontend regression

The consumer `selectDectalkObstruentProfile` is called ONLY from `dectalk-english/structural.yaml`. The new code reads:
- `reference.is_obstruent === true` (was: `OBSTRUENT_TYPES.has(reference.type)`)
- `reference.is_back_rounded === true` (was: `BACK_ROUNDED_REF_PHONEMES.has(reference.phoneme)`)

The dectalk-english inventory at `public/rules/frontends/dectalk-english/inventory.yaml` has 27 phonemes with type ∈ {fricative, affricate, stop_closure, stop_release, stop_aspiration} but ZERO of them have `is_obstruent: true`. Same for `is_back_rounded`. Only the qlatt-english inventory was updated.

Result: in dectalk-english stop-release profile selection, `resolveFollowingClass` will NEVER return "obstruent" or "back_rounded_vowel" — it always falls through to "front_vowel" or "back_unrounded_vowel". This silently changes which release profile is selected for stops in DECtalk runs.

Note: the dectalk-english formant.yaml has its OWN inline ref_is_obstruent / ref_is_back_rounded CEL expressions (reads `ref.type` and an inline phoneme list) — those still work. But the structural.yaml's dectalk_obstruent_profile() CEL function call routes through TS-side `selectDectalkObstruentProfile` which is now broken for dectalk-english.

The codex coder did not check whether dectalk-english needed the same flag migration. Codex's edge-case note flagged only qlatt phoneme absence (OY0/OR0/OR1/UR0/UR1), not the entire dectalk-english frontend.

## Verdict: NO-MERGE

The chunk silently degrades DECtalk frontend behavior. Fix: either (a) add the new flags to dectalk-english inventory.yaml, or (b) deprecate selectDectalkObstruentProfile, or (c) explicitly scope the chunk to qlatt-english only and update consumers to handle missing flags safely.
