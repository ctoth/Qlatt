# Control Windows Flag-Day Plan

## Non-Negotiable Constraint

This is a **flag-day schema cutover**.

1. `param_windows` is removed.
2. `control_windows` replaces it everywhere.
3. No compatibility alias.
4. Both declarative frontends migrate in the same change set.

The goal is to land one generic timed-control model that is not branded around DECtalk and does not carry legacy parser/runtime baggage.

## Why This Change Exists

The current `param_windows` shape is too limited:

1. It only supports whole-object param replacement.
2. It implicitly targets the current token only.
3. It forces structural splice hacks when we really want timed control over `current`, `next`, or `prev`.
4. It makes field clearing and additive deltas awkward or impossible.

The right abstraction is a generic **control trajectory/window** over an existing segment.

## Generic Literature Basis

These sources in `papers/` support a generic timed control model rather than a DECtalk-specific one:

1. `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md`
   - Variable control parameters are updated every 5 ms.
2. `papers/Allen_1977_ModularAudioResponse/notes.md`
   - The synthesis-by-rule stage generates control parameters every 5 ms.
3. `papers/Allen_1987_MITalk_TTS/notes.md`
   - Explicit transition classes (`DISCON`, `SETSMO`, `SMODIS`, `DISSMO`, `SMOOTH`) justify richer generic boundary behavior.
4. `papers/Burkhardt_2009_VoiceQualityFormantSynthesis/notes.md`
   - Parameter modification is explicitly additive/subtractive, which supports per-field ops rather than whole-object replacement.
5. `papers/Abramson_Whalen_2017_VOTat50/notes.md`
   - Closure / release / aspiration are generic acoustic subspans (`VLCLO`, `REL`, `ASP`), not DECtalk-specific data structures.
6. `papers/Volenec_2015_Coarticulation/notes.md`
   - The window model is explicitly the right conceptual frame for variable-width overlap in a frame-based synthesizer.

## Replacement Schema

Replace:

```yaml
param_windows:
  - start_ms: 0
    end_ms: 40
    params:
      AH: 48
      AV: 0
```

With:

```yaml
control_windows:
  - target: current   # current | next | prev
    start_ms: 0
    end_ms: 40
    fields:
      AH:
        op: set
        value: 48
      AV:
        op: set
        value: 0
```

### Allowed Span Forms

1. `start_ms` / `end_ms`
2. `start_ratio` / `end_ratio`
3. Optional shorthands:
   - `prefix_ms`
   - `suffix_ms`

If both ms and ratio are present, ms wins.

### Allowed Targets

1. `current`
2. `next`
3. `prev`

### Allowed Field Ops

1. `set`
2. `add`
3. `mul`
4. `max`
5. `min`
6. `unset`

This is intentionally generic and reusable across all declarative frontends.

## Deterministic Mapping From Old Schema

Every existing `param_windows` entry maps mechanically to:

1. `target: current`
2. preserve `start_ms` / `end_ms` / `start_ratio` / `end_ratio`
3. convert `params.KEY: VALUE` to:
   - `fields.KEY.op: set`
   - `fields.KEY.value: VALUE`

So:

```yaml
param_windows:
  - start_ms: 0
    end_ms: asp_duration
    params:
      AH: 48
      AV: 0
```

becomes:

```yaml
control_windows:
  - target: current
    start_ms: 0
    end_ms: asp_duration
    fields:
      AH: { op: set, value: 48 }
      AV: { op: set, value: 0 }
```

## Scope Audit (Current Surface Area)

Current `param_windows` usage is small and controlled:

1. `src/tts-frontend-types.ts`
2. `src/track-assembler.ts`
3. `src/declarative-frontend/validation.ts`
4. `public/rules/frontends/dectalk-english/phases/structural.yaml` (3 sites)

This is small enough for a clean flag day and a scripted migration.

## Change Set

### 1) Type System

Update token and window types in:

1. `src/tts-frontend-types.ts`

Tasks:

1. Remove `ParamWindowSpec`.
2. Add:
   - `ControlWindowSpec`
   - `ControlWindowTarget`
   - `ControlFieldOp`
   - `ControlFieldSpec`
3. Rename token property:
   - `param_windows` -> `control_windows`

### 2) Validation

Update:

1. `src/declarative-frontend/validation.ts`

Tasks:

1. Remove `param_windows` validation.
2. Add `control_windows` validation.
3. Validate:
   - target enum
   - exactly one valid span form
   - `fields` object shape
   - valid op enum
   - `value` required except for `unset`
4. Update all diagnostic paths/messages to reference `control_windows`.

### 3) Assembler / Runtime Interpretation

Update:

1. `src/track-assembler.ts`

Tasks:

1. Replace window parsing logic:
   - `resolveParamWindows()` -> `resolveControlWindows()`
2. Interpret per-field ops instead of object overwrite.
3. Apply windows to:
   - `current`
   - `next`
   - `prev`
4. Define deterministic precedence:
   - base params
   - transition blending
   - control windows in declaration order
5. Implement `unset` by removing the field from the effective params object before downstream defaults fill as normal.

### 4) Rulepack Migration

Update all declarative frontend rulepacks to the new schema.

Immediate known file:

1. `public/rules/frontends/dectalk-english/phases/structural.yaml`

Tasks:

1. Convert all existing `param_windows` blocks to `control_windows`.
2. Replace any structural splice whose only purpose was “apply timed control to neighbor” with the new `target: next/prev` shape where possible.
3. Ensure every new rule entry keeps citations and tags intact.

### 5) Other Declarative Frontend

Audit and migrate the second declarative frontend in the same PR.

Tasks:

1. Search `public/rules/frontends/*/` for any current or future `param_windows` usage.
2. If it has none, still update schema examples/docs to only reference `control_windows`.
3. Ensure both frontends validate under the new schema and no rulepack references `param_windows`.

### 6) Docs / Specs

Update any frontend docs that mention timed window controls.

Likely files:

1. `plans/frontend-spec.md` if it mentions the old schema
2. any inline code comments in `src/track-assembler.ts`

The repo should no longer document `param_windows` anywhere.

## Programmatic Migration Strategy

This should be scripted, not hand-edited piecemeal.

### Migration Script

Add a repo-local migration script, for example:

1. `scripts/migrate-param-windows.ts`

Responsibilities:

1. Parse YAML files under `public/rules/frontends/`.
2. Rewrite `param_windows` -> `control_windows`.
3. Inject `target: current`.
4. Rewrite `params` maps into `fields` maps with `op: set`.
5. Preserve ordering and comments as much as practical.
6. Emit a deterministic diff suitable for review.

This script is for the one-time cutover. It does not remain in runtime code.

### Safety Rules

1. No ad hoc regex-only rewrite for nested YAML objects.
2. Use a real parser if available; otherwise, constrain the transformation to the known existing shape and manually review the small diff.
3. After scripted conversion, run validation immediately.

## Merge Gates

All of these must be true in the same change set:

1. No `param_windows` references remain in `src/` or `public/rules/`.
2. Both declarative frontends validate under the new schema.
3. Existing behavior is preserved for simple `set`-only migrated windows.
4. New tests cover:
   - `set`
   - `add`
   - `unset`
   - `target: next`
   - `target: prev`
5. Oracle / render smoke tests still run.

## Test Plan

### Unit Tests

Add or update tests for:

1. validator acceptance/rejection of `control_windows`
2. assembler application order
3. field ops semantics
4. span resolution (`ms` vs `ratio`)
5. target routing (`current/next/prev`)

### Integration Tests

1. Render a phrase with a rule that applies a prefix `control_window` to `next`.
2. Verify expected timed parameter changes in the output track.
3. Re-run the DECtalk stop probe to ensure the migrated windows behave identically before adding richer ops.

## Implementation Order

1. Add the plan-specific migration script.
2. Change TS types.
3. Change validator.
4. Change assembler/runtime interpretation.
5. Run the scripted YAML migration.
6. Manually review both frontend rulepacks.
7. Add unit tests.
8. Run targeted render/oracle smoke tests.
9. Remove the migration script if it is no longer useful.

## Non-Goals

This change does **not**:

1. add DECtalk-specific primitives
2. add a second legacy schema
3. redesign the full rule engine
4. solve formant-transition parity by itself

It is only the generic timed-control substrate that will make the remaining declarative frontend work cleaner.
