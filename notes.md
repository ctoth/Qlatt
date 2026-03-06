# Code Review Notes

## Goal
Review codebase for:
1. Imperative code that should be declarative (or shouldn't exist)
2. General code quality / cruft

---

## Findings

### 1. DEAD F0 POLICY PARAMETERS — `tts-frontend.ts:479-482`
**Category: Leftover imperative code**

```ts
fall_rate_hz: 20 * f0RangeFactor,
declination_tau: 0.12 * f0RangeFactor,
stress_rise: 1.0 + (0.15 * f0RangeFactor),
question_rise_hz: 30 * f0RangeFactor,
```

These four params are injected into the `policy.f0` context for the prosody+finalize phases, but **no active rule in any `.yaml` file references them**. They were parameters for the old O'Shaughnessy 1976 exponential-declination F0 model, which was replaced by the Pierrehumbert/ToBI model (per `pipeline.yaml` comment). The ToBI rules use `base_hz`, `range_hz`, `h_star_height`, `downstep_k`, etc. — none of the old params.

`continuation_rise_hz` (line 483) and `continuation_minor_rise_hz` (line 484) ARE still used by `f0_continuation_rise` in `prosody.yaml`, so those stay.

The dead params also appear in multiple scripts (`profile-tts-stages.ts`, `profile-tts-engine.ts`, `profile-rule-internals.ts`, `profile-cel-waste.ts`) and in `declarative-frontend-integration-phases.test.ts` — all inherited from the same old pattern.

---

### 2. `void coreFnzTarget` — `nasal-subsystem.ts:207`
**Category: Computed but unused variable / code smell**

```ts
const coreFnzTarget = Number(params.nasalCoreFnzTarget ?? coreFnp);  // line 139
// ... 60 lines later ...
void coreFnzTarget;  // line 207 — lint suppression
```

`coreFnzTarget` is computed but never used in any logic. The `void` trick suppresses the TS/lint "unused variable" error. Either the variable needs to drive actual behavior (it's a planned target for the nasal zero interpolation but wasn't wired up), or it should be removed.

---

### 3. `(frontendSpec as any)` repeated — `tts-frontend.ts` (~7x)
**Category: Type discipline / mild imperative smell**

`loadBundledRulepackSpec` returns `PlainObject = Record<string, unknown>`. Deep property access (`.parameters?.policy?.speaker`, `.f0_model`, `.parameters?.policy?.f0`) requires cast to `any` to silence TS. Same cast also appears in `rule-pack.ts:175,200` for `(spec as any)[SPEC_VALIDATED]`.

The consistent workaround for these is to extract a typed interface for the spec's known shape. Alternatively, helper functions (like the existing `readPolicyNumber`) could be extended to cover the other extraction patterns. Currently it's inconsistent: `readPolicyNumber` exists and handles the `{value: N}` vs `N` dual-format, but:
- Lines 516-518 do `typeof f0Policy?.sag_depth_hz?.value === "number" ? f0Policy.sag_depth_hz.value` manually instead of `readPolicyNumber(f0Policy?.sag_depth_hz)`
- Lines 517-521 duplicate the same pattern for `sag_min_span_ms`

---

### 4. `QLATT_V12_CEL_RULEPACK` alias — `rule-pack.ts:218`
**Category: Legacy name / mild cruft**

```ts
export const QLATT_V12_CEL_RULEPACK = QLATT_ENGLISH_RULEPACK;
```

This alias exists for backward compatibility. It's still referenced in:
- `test/yaml-frontend-config.test.ts`
- `test/speaker-profiles.test.ts`
- `test/declarative-frontend-rulepack-shape.test.ts`
- `scripts/profile-tts-stages.ts`, `profile-tts-engine.ts`, `profile-cel-waste.ts`

The `V12` suffix is meaningless now that the spec is at `v13-cel`. Not breaking, but adds noise. Tests could import `QLATT_ENGLISH_RULEPACK` directly.

---

### 5. `console.warn` not going through `diagnostics` — multiple places
**Category: Bypasses the diagnostic system**

- `tts-frontend.ts:281` — unknown voice quality preset warning; `diagnostics` object is in scope here
- `tts-frontend.ts:316` — no baseline target for phoneme; `diagnostics` is in scope
- `track-assembler.ts:1547` — `[TTS Frontend DEBUG]` note the "DEBUG" tag; this is temporary debug logging, never converted
- `transcribe-text.ts:245`, `278` — G2P fallback and SIL fallback; no `diagnostics` plumbed here (acceptable if not part of the diagnostics-equipped path)
- `declarative-frontend/inventory.ts:140` — invalid value in target

The ones in `tts-frontend.ts` are most important: they're in code that receives a `Diagnostics` object.

---

### 6. F0 policy values hardcoded in TS, should live in YAML — `tts-frontend.ts:479-484`
**Category: Imperative / anti-declarative**

The base values for the rate-scaled F0 parameters (20, 0.12, 0.15, 30) are magic numbers embedded in the pipeline function. If they're needed at all (see finding #1 — four of the six are dead), they should be in `frontend.yaml` under `parameters.policy.f0` with citations, just like `continuation_rise_hz` (which IS in YAML at value 8).

`continuation_rise_hz: 8` and `continuation_minor_rise_hz: 5` are in YAML but then unconditionally overridden by the TS code. This is correct when rate ≠ 1.0 (the YAML holds the rate=1.0 baseline), but it means a reader of the YAML won't understand why those values are only the starting point, not the final value.

---

### 7. Prosodic annotator step number comments are off — `prosodic-annotator.ts`
**Category: Minor documentation drift**

`annotateProsody` has step comments:
- "Step 1: Identify phrases" ✓
- "Step 2-3: Mark function/content words" ✓ (function calls `markFunctionWords`)
- "Step 4: Assign accent" (but in the loop says "Step 4 (nuclear accent)")
- "Step 5-6: Identify nuclear accent and assign accent types per phrase" (in the loop)
- "Step 6: Assign break indices" (after the loop — but Step 6 was also used above!)
- "Step 6b: Assign accentIndexInPhrase"

Steps 4, 5, 6 appear to have been renumbered at some point but the old step comments were only partially updated.

---

### 8. `resolveSpeakerProfile` triple-nested ternaries — `tts-frontend.ts:150-165`
**Category: Readability**

```ts
base_f0_hz: typeof baseF0Override === "number" && Number.isFinite(baseF0Override)
  ? baseF0Override
  : (typeof baseF0 === "number" && Number.isFinite(baseF0)
      ? baseF0
      : (baseFromPolicy ?? 110)),
```

This is precedence logic (caller override → call arg → policy default → hardcoded), but expressed as nested ternaries instead of simple `??` chains with early returns. `baseFromPolicy` already comes out of `readPolicyNumber` as `number | undefined`, so the whole thing could simplify to `baseF0Override ?? baseF0 ?? baseFromPolicy ?? 110` (if we trust `readPolicyNumber`'s finiteness check).

---

### 9. `speakerPolicy` local extracted twice — `tts-frontend.ts:239,542`
**Category: Redundancy**

`(frontendSpec as any)?.parameters?.policy?.speaker` is accessed at:
- Line 140 (in `resolveSpeakerProfile`)
- Line 239 (for voice quality presets)
- Line 542 (for `speakerParams` in layered F0 model)

Three separate `(frontendSpec as any)?.parameters?.policy?.speaker` dereferences in the same function body. Could be extracted once.

---

### 10. `nasal-subsystem.ts` — frame-level provenance is speculative
**Category: Design / explainability concern**

`emitFrameStageEvents` at line 127 emits `stage: "semantics"` and `stage: "runtime"` provenance records based on frame params. But at the point this runs (called from `tts-frontend.ts` after `assembleKlattTrack`), the frames haven't been through the semantics evaluator or runtime yet — they're just Klatt parameter dictionaries. The function infers what the semantics and runtime *will* do from looking at param values. This is a documented approximation but it's philosophically at odds with the provenance system's claim to record actual decisions.

---

## Execution Results

All 10 tasks complete. 5 commits:

| Commit | What |
|---|---|
| `dbd01cb` | Remove unused coreFnzTarget (nasal-subsystem.ts) |
| `638026f` | Remove debug console.warn (track-assembler.ts) |
| `8ea9ced` | Fix step numbering comments (prosodic-annotator.ts) |
| `50ab978` | Remove QLATT_V12_CEL_RULEPACK alias, migrate 3 test files |
| `3da424f` | tts-frontend.ts: dead F0 params, continuation_rise_hz from YAML, readPolicyNumber for sag, console.warn→diagnostics, extract speaker policy, simplify ternaries; script dead params + alias renames; test cleanup |

**Pre-existing failures (not caused by these changes):**
- `E_RULE_UNKNOWN: nasal_windows` — frontend.yaml + inventory.yaml were already modified before this session; they reference a rule that doesn't exist yet
- `lf-source-wasm-compare.ts` golden test: rmsError 0.325 exceeds threshold — fails on clean master too

`npm run explain -- "hello world"` passes after all changes.

## Tasks Created
- Task #1 — Remove dead F0 policy params (fall_rate_hz, declination_tau, stress_rise, question_rise_hz) from tts-frontend.ts and scripts/tests
- Task #2 — Fix continuation_rise_hz/continuation_minor_rise_hz to read base values from YAML policy instead of hardcoding 8 and 5
- Task #3 — Remove or wire up coreFnzTarget in nasal-subsystem.ts (currently computed, never used, suppressed with `void`)
- Task #4 — Route tts-frontend.ts:281,316 console.warn calls through diagnostics
- Task #5 — Remove/convert "[TTS Frontend DEBUG]" console.warn in track-assembler.ts:1547
- Task #6 — Use readPolicyNumber for sag_depth_hz and sag_min_span_ms extraction in tts-frontend.ts:516-523
- Task #7 — Extract (frontendSpec as any)?.parameters?.policy?.speaker to a single reference (currently dereferenced 3x)
- Task #8 — Migrate tests and scripts off QLATT_V12_CEL_RULEPACK alias, then remove it
- Task #9 — Fix step numbering comments in prosodic-annotator.ts (Steps 4/5/6 are inconsistent after prior renumbering)
- Task #10 — Simplify resolveSpeakerProfile nested ternaries to ?? chains

## Files Reviewed
- [x] src/tts-frontend.ts
- [x] src/diagnostics.ts
- [x] src/nasal-subsystem.ts (new, untracked)
- [x] src/declarative-frontend/engine.ts (partial)
- [x] src/tts-frontend-provenance.ts
- [x] src/prosodic-annotator.ts (partial)
- [x] src/track-assembler.ts (partial)
- [x] src/declarative-frontend/rule-pack.ts
- [x] public/rules/frontends/qlatt-english/frontend.yaml
- [x] public/rules/frontends/qlatt-english/inventory.yaml (header)
- [x] public/rules/frontends/qlatt-english/pipeline.yaml
- [x] public/rules/frontends/qlatt-english/phases/prosody.yaml (partial)
