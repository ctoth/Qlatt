# Sag double-apply investigation

Datestamp: 2026-05-28

## Mission
Determine with RUNTIME evidence whether F0 "sagging transition" between consecutive H* accents is applied twice (YAML rule + TS function) or one shadows the other.

## VERDICT: DISJOINT (both paths are effectively DEAD for normal input — NO double-apply, NO sag of either kind is produced in practice)

Both sag implementations require two consecutive plain `H*` accents. The tune grammar never produces two consecutive plain `H*`, so in normal operation:
- The YAML `sagging_transition` rule never fires (produced 0 `f0_sag` points in every phrase tested).
- The TS `applySaggingTransitions` never adds points (contour F0 points never carry `accentType`, so it finds 0 H* anchors and returns the contour unchanged).

They do not overlap, do not double-apply, and neither shadows the other — each independently no-ops for its own reason.

## FACTS (source)

### Path 1: YAML `sagging_transition` (prosody.yaml:479-512)
- kind: point. Fires only when `current.accentType=='H*'` AND `look_ahead_pred` next stressed vowel is also `'H*'` AND span >= sag_min_span_ms. Inserts ONE f0 point, tag `f0_sag`. In pipeline at pipeline.yaml:249.

### Path 2: TS `applySaggingTransitions` (track-assembler.ts:1009-1077)
- Collects H* anchors via `contour[i].accentType?.includes("H*")` (line 1021). `<2` -> returns unchanged (line 1026). Else inserts 3 parabola points per pair, tag `f0_sag`, merges `[...contour,...sagPoints]` (line 1074).
- Config qlatt-english: `frontend.yaml:964 sag.operator: parabolic_hstar_sag` (active). Call site track-assembler.ts:1369 invokes it.

### Why TS never adds points (structural)
- f0 point tokens are built in `engine.ts:applyInsertPointSpec` (2182-2196): pointToken gets id/stream/status/anchors/ratio/value/`tag` ONLY. `accentType` is NEVER set.
- `buildF0Point` (control-score.ts:241) reads `token.accentType` (unset) for `accent_type`.
- `buildF0ContourFromScore` (track-assembler.ts:1256) copies `point.accent_type` -> `accentType` (so contour points have no accentType).
- `tag_to_accent` map (accent-inventory.yaml:136) is NOT consumed by any TS (grep: 0 matches for tag_to_accent/tagToAccent in *.ts). So tags like `f0_h_star` are never converted to accentType `H*` on points.

### Why YAML never fires (tune grammar)
File: `public/rules/frontends/qlatt-english/policy/tune-grammar.yaml`
- ALL tunes: prenuclear first = `L+H*`, prenuclear later = `H+!H*` (or `H*+H`), nuclear = `H*+L` / `L*` / `H+L*`.
- The ONLY plain `H*` is nuclear `without_prenuclear` — i.e. a single-accent phrase. Two consecutive plain `H*` is impossible. So the YAML rule's `accentType=='H*' && next H*` constraint can never be satisfied.

## RUNTIME OBSERVATIONS (script scripts/inspect-sag.ts — now deleted; output verbatim)
```
PHRASE: the brave dog ran home today
score.f0_points count: 14
YAML f0_sag points in score: 0
score f0_points carrying accent_type: 0
score f0_point tag histogram: {"f0_baseline":1,"f0_h_star_plus_l_peak":1,"f0_h_star_plus_l_tail":1,"f0_l_leading":1,"f0_l_plus_h_star":1,"f0_h_leading":3,"f0_h_plus_downstepped_h_star":3,"f0_unaccented":2,"f0_onset_perturbation":1}
TS applySaggingTransitions: input pts=14 output pts=14 (added f0_sag=0)
TS with forced H* anchors: input=3 output=9 (added=6)

PHRASE: cats
score f0_point tag histogram: {"f0_baseline":1,"f0_h_star":1}   (single plain H*, singleton)
YAML f0_sag=0; accent_type=0; TS added=0

PHRASE: dogs run
tag histogram: {f0_baseline, f0_h_star_plus_l_peak, f0_h_star_plus_l_tail, f0_l_leading, f0_l_plus_h_star}  (no two H*)
YAML f0_sag=0; accent_type=0; TS added=0

PHRASE: big dogs run fast now
tag histogram: {f0_baseline, f0_h_star_plus_l_peak/tail, f0_l_leading, f0_l_plus_h_star, f0_h_leading x3, f0_h_plus_downstepped_h_star x3, f0_onset_perturbation}
YAML f0_sag=0; accent_type=0; TS added=0
```
Key control: "TS with forced H* anchors: input=3 output=9 (added=6)" proves the TS function IS functional — it just never receives contour points carrying accentType in the real pipeline.

explain CLI does NOT surface rule-trace point insertions or the F0 contour: `npm run explain -- "..." --format json` report (571 decisions) had grep f0_sag=0, sagging_transition=0, f0_h_star=0. So the standalone script was required (per mission's contingency).

## CLEANUP
- scripts/inspect-sag.ts: DELETE after run (throwaway, per AGENTS.md).
- sag-report.json: DELETE (throwaway explain output written to repo root).
