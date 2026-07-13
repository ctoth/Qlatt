# ToBI Accent Table-Driven Collapse — Design + Engine-Gap Analysis

Datestamp: 2026-05-28
Scope: read-only design survey. No source/YAML edited. No git staging.

Target: the 8 near-identical ToBI pitch-accent rules in
`public/rules/frontends/qlatt-english/phases/prosody.yaml` (current
lines 65–317). Goal: collapse into one table-driven rule, and state
exactly what (if any) engine change is required.

---

## PART 1 — FACTS

### 1.1 The 8 accent rules (verified, full read of prosody.yaml lines 65–317)

The shared `where:` is one YAML anchor `&where_voiced_accent_stressed_vowel`
(defined at prosody.yaml:71–75), referenced by all 8 via `*where_...`. Each
rule ANDs that with one `accentType == '<X>'` literal. So the selector is
*already* deduplicated at the YAML-anchor level; the duplication that remains
is the `define:` blocks and `insert_point(s)` blocks.

Two `define:` anchors already exist and are shared:
- `&define_downstep_with_nuclear` (prosody.yaml:77–86) — downstep, nuclear
  suppresses it (`isNuclearAccent ? 1.0 : pow(downstep_k, accent_idx)`).
- `&define_downstep_no_nuclear` (prosody.yaml:137–148) — downstep always,
  no nuclear suppression; also defines `low_hz`.

### 1.2 The accent→tuple table (extracted verbatim)

`A` = `at_ratio(current, 0.45)` (peak anchor).
`SL` = `at_sync(current.sync_left)` (leading edge).
`SR` = `at_sync(current.sync_right)` (trailing edge).
`H_height` = `h_star_height`, `L_height` = `l_star_height`,
`Hpct` = `boundary_h_pct_fraction`. All heights map to
`base_hz + range_hz * <height-or-clamped-expr>`.

| accentType | #pts | define anchor used | point 1 (anchor / value / tag) | point 2 (anchor / value / tag) |
|---|---|---|---|---|
| `H*` (65–95) | 1 | `with_nuclear` | A / `target_hz` (downstep, nuclear-no-DS, clamped) / `f0_h_star` | — |
| `H*+L` (102–124) | 2 | `with_nuclear` | A / `target_hz` / `f0_h_star_plus_l_peak` | SR / `base+range*L_height` / `f0_h_star_plus_l_tail` |
| `L+H*` (129–161) | 2 | `no_nuclear` (+`low_hz`) | SL / `low_hz` (=`base+range*L_height`) / `f0_l_leading` | A / `target_hz` / `f0_l_plus_h_star` |
| `H+!H*` (166–201) | 2 | inline (prev_point-based) | SL / `lead_hz` (=`max(prev_f0, floor=base+range*Hpct)`) / `f0_h_leading` | A / `peak_hz` (downstep, clamped, NO nuclear suppression) / `f0_h_plus_downstepped_h_star` |
| `H*+H` (206–231) | 2 | `no_nuclear` | A / `target_hz` / `f0_h_star_plus_h_peak` | SR / `max(target_hz, base+range*Hpct)` / `f0_h_star_plus_h_tail` |
| `H+L*` (236–264) | 2 | inline (prev_point-based) | SL / `lead_hz` (=`max(prev_f0, high_floor=base+range*Hpct)`) / `f0_h_plus_l_star_lead` | A / `low_hz` (=`base+range*L_height`) / `f0_h_plus_l_star` |
| `L*` (269–287) | 1 | inline (`target_hz=base+range*L_height`) | A / `target_hz` / `f0_l_star` | — |
| `L*+H` (292–317) | 2 | inline (`low_hz`,`floor_hz`) | A / `low_hz` (=`base+range*L_height`) / `f0_l_star` | SR / `floor_hz` (=`base+range*Hpct`) / `f0_l_star_plus_h` |

Point-count: 2 of the 8 emit ONE point (`H*`, `L*`); the other 6 emit TWO.
No accent emits more than two.

Genuinely-varying axes confirmed: (a) the `accentType` literal; (b) per-point
anchor ∈ {A, SL, SR}; (c) per-point height key ∈ {H_height, L_height, Hpct};
(d) whether downstep applies to that point; (e) whether `isNuclearAccent`
suppresses downstep (TRUE only for `H*` and `H*+L`); (f) two accents (`H+!H*`,
`H+L*`) use a `prev_point('f0')`-relative leading value, not a pure height key.

### 1.3 Engine capability for `kind: point` (verified, engine.ts)

- A `point` rule may carry EITHER `insert_point` (single object) OR
  `insert_points` (array). Both are applied per selected token:
  `applyInsertPointSpec` (engine.ts:2547) and `applyInsertPointSpecs`
  (engine.ts:2559). `insert_points_order: by_point` re-orders multi-point
  insertion across tokens (engine.ts:2477–2480, 2595–2609) — used by all the
  2-point accents here.
- For each point, `at:` and `value:` are arbitrary CEL **strings** evaluated
  per token against `current` + the rule's `define:` context
  (`evaluateAnchorExpression` engine.ts:2124–2140 calls `evaluateExpression`;
  value via `evaluateNumericExpression` engine.ts:2177–2180). `tag:` is a
  literal or CEL string (engine.ts:2191–2193). So anchor/value/tag are all
  freely data-/expression-driven **today** — no new schema needed for those.
- CEL supports inline object-literal indexing in a value expr. PROOF: the
  existing `f0_continuation_rise` rule (prosody.yaml:596–600) writes
  `{ ',': ..., ';': ..., ':': ... }[current.punctuationSymbol]`. So a height
  or anchor can be selected by an inline map keyed on `current.accentType`
  inside a single CEL string, with zero engine work.

### 1.4 What the engine does NOT have (verified)

- **No per-token-variable point count.** `insert_points` is a static array
  whose length is fixed at parse/validation time (validation.ts:1830–1845
  iterates `r.insert_points[i]` as authored entries). The number of points a
  `point` rule emits cannot depend on `current.accentType`. There is no
  `for_each:` / iterate-over-a-list construct for points.
- **`for_each_field` does NOT help here.** It exists, but lives in the PARSER
  (parser.ts:64–126), expands at **rule-load time** into N static effect
  blocks by string-substituting `{field}`. It iterates a literal field-name
  list authored in the rule, not a per-token table, and only expands `apply:`
  effect blocks — not `insert_point(s)`. (Validation.ts:1535–1543 only checks
  it inside `apply[]`.) It cannot vary point count by token.
- **`maps:` holds STRINGS ONLY.** Validation requires
  `maps['name']['key']` to be a string (validation.ts:2204–2211, comment
  2153–2155 "Numeric or nested-object values are rejected"). It is surfaced to
  CEL as the `maps` identifier (engine.ts:819–822, 833–834). So the scout's
  proposed `accent_targets: H*: [{anchor:..., height:..., downstep:...}]`
  (structured-object values) **cannot be a `maps:` block** as the schema
  stands. `string_sets:` is `Record<string,string[]>` (validation.ts:1937–1949)
  — also unusable for structured per-accent tuples.
- **No rule-template / parametric-rule / generated-rule-pack feature.**
  Confirmed by the prior scout (rule-ugliness-scout.md:25–26) and by absence
  in engine/parser; `rule-pack.ts` is only an include-merger, not a templater.

---

## PART 2 — DESIGN

### 2.1 The schema gap, precisely

The scout's `accent_targets` proposal (rule-ugliness-scout.md:230–250) assumes
two things the engine lacks today:
1. a data block whose values are **structured objects/lists** (rejected by
   `maps:` string-only validation), and
2. a `for_each: "accent_targets[current.accentType]"` loop that emits a
   **variable number of points** per token (no such construct).

Both (1) and (2) are real engine additions, not pure YAML edits.

### 2.2 Two buildable designs

**Design A — single rule, max-2 static points, inline CEL tables (NO engine
change).** Author ONE `tobi_accent` rule with a static `insert_points` array
of exactly TWO entries. Drive every varying axis with inline CEL keyed on
`current.accentType`, and make the SECOND point a no-op for the single-point
accents (`H*`, `L*`).

```yaml
tobi_accent:
  kind: point
  select:
    stream: phone
    where:
      all:
        - *where_voiced_accent_stressed_vowel
        - "has(current.accentType) && current.accentType in
           ['H*','H*+L','L+H*','H+!H*','H*+H','H+L*','L*','L*+H']"
  define:
    accent_idx: "has(current.accentIndexInPhrase) && current.accentIndexInPhrase >= 0 ? current.accentIndexInPhrase : 0"
    nuclear_suppresses: "current.accentType in ['H*','H*+L']"
    is_nuclear: "has(current.isNuclearAccent) && current.isNuclearAccent == true"
    downstep_factor: "(nuclear_suppresses && is_nuclear) ? 1.0 : pow(params.policy.f0.downstep_k, accent_idx)"
    H_clamped: "max([params.policy.f0.h_star_height * downstep_factor, params.policy.f0.downstep_floor_fraction])"
    H_hz: "params.policy.f0.base_hz + params.policy.f0.range_hz * H_clamped"
    L_hz:  "params.policy.f0.base_hz + params.policy.f0.range_hz * params.policy.f0.l_star_height"
    Hpct_hz: "params.policy.f0.base_hz + params.policy.f0.range_hz * params.policy.f0.boundary_h_pct_fraction"
    prev_f0: prev_point('f0')
    prev_or_Hpct: "prev_f0 == null ? Hpct_hz : max([prev_f0.value, Hpct_hz])"
    # per-accent point-1/point-2 selection via inline-map indexing on accentType
    p1_anchor_ratio: "...{ 'L+H*':0.0,'H+!H*':0.0,'H+L*':0.0,'H*':0.45,'H*+L':0.45,'H*+H':0.45,'L*':0.45,'L*+H':0.45 }[current.accentType]..."
    ... (point-1 value, point-2 anchor, point-2 value, all inline-mapped)
  insert_points_order: by_point
  insert_points:
    - { stream: f0, at: "<p1 anchor expr>", value: "<p1 value expr>", tag: "'f0_accent_p1'" }
    - { stream: f0, at: "<p2 anchor expr>", value: "<p2 value expr>", tag: "'f0_accent_p2'" }
  citations: [Pierrehumbert 1980, Ladd 2008]
```

Problem with Design A: there is no verified way to make `insert_point` SKIP a
point for the single-point accents. `applyInsertPointSpec` (engine.ts:2142+)
unconditionally pushes a point token for any spec with a valid anchor+stream;
it has no documented "value == null → skip" or per-point guard. For `H*`/`L*`
the second point would still be emitted. So Design A would either (a) change
the output (extra spurious point) — a behavior change, NOT a refactor — or
(b) require a tiny engine guard (see 2.4). It also forces all anchors/values
into giant inline-map CEL strings, which trades 8 readable rules for one
near-unreadable rule. **Design A is not recommended.**

**Design B — small targeted engine addition: per-point `when:` guard +
structured `accent_targets` driven by it.** This is the clean collapse the
scout envisioned, and it needs ONE engine capability: a per-point predicate
that suppresses emission of that point when false. With that, a single rule
lists the union of all point slots and each slot self-guards by accentType.

### 2.3 The minimal engine change (Design B)

Add an optional `when:` (CEL boolean string) to a point spec inside
`insert_points`. In `applyInsertPointSpec` (engine.ts:2142), after resolving
`target`/`pointFunctions` and BEFORE building/pushing the token, evaluate
`pointSpec.when` (if present) with the same `extraContext`; if it is false,
return without pushing. ~5 lines, plus a one-line validation allowance for the
`when` key on point specs (validation.ts:1830 region). This is additive and
backward-compatible (absent `when` = always emit, current behavior).

With that guard, the single rule is authored with a static `insert_points`
array enumerating every distinct point slot needed across the 8 accents (the
8 accents use point slots that fall into a small set of (anchor, value-family)
shapes). Each slot carries `when: "current.accentType in [...]"`. Emission
count then varies per token via the guards — no list-iteration construct
needed, no `maps`-with-objects needed. Heights/values still come from the
shared `define:` (already mostly written as the two existing anchors).

This avoids BOTH missing features (variable-length point lists AND
structured-object data blocks): the array stays static and the data stays in
`define:` CEL; only the per-point `when:` guard is new.

### 2.4 If a true `accent_targets` table is wanted later

A fuller version (structured data block + `for_each`) would require: (1)
broadening `maps:` (or a new `tables:` block) to accept array/object values
in validation.ts, and (2) a `for_each:` point construct in the engine that
iterates `accent_targets[current.accentType]` and calls `applyInsertPointSpec`
per entry with `$each` bound into context. That is a larger change (~40–60
engine lines + validation + context binding) and is NOT required to get the
collapse — Design B's `when:` guard is the smaller path.

---

## PART 3 — VERDICT

### Engine gap

**Design B (recommended): ONE small engine change** — add an optional
per-point `when:` CEL guard to `insert_points` entries, evaluated in
`applyInsertPointSpec` (engine.ts:2142+), ~5 engine lines + 1 validation
allowance. This is the smallest change that yields a faithful (output-
identical) collapse, because 6 of 8 accents emit 2 points and 2 emit 1, and
nothing in the engine today lets a single static `insert_points` array vary
its length per token.

A pure-YAML collapse is NOT possible without changing output: `insert_point`
emits unconditionally (engine.ts:2142+ has no skip path), so a single rule with
a fixed 2-point array would add a spurious second point to `H*` and `L*`.

The scout's literal `accent_targets:` proposal (structured `maps`-style data +
`for_each`) is NOT buildable today: `maps:` is string-values-only
(validation.ts:2204–2211) and there is no point-list iteration construct.

### Estimated line delta

Current 8 rules span prosody.yaml:65–317 ≈ **253 lines** (incl. comments and
shared anchors). Design B single rule ≈ 50–70 lines (one `where`, one shared
`define`, a static `insert_points` array of ~6–8 self-guarded slots, citations).
**Estimated saving ≈ 180–200 lines** in prosody.yaml, plus ~5 net new lines in
engine.ts.

---

engine gap: ONE small change — add optional per-point `when:` CEL guard to
`insert_points` in `applyInsertPointSpec` (engine.ts:2142+), ~5 lines + 1
validation allowance. Estimated ~180–200 lines saved in prosody.yaml.
