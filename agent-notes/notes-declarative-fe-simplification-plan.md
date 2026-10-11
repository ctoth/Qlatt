# Declarative Frontend: Declarativeness + Simplification Plan

Date: 2026-07-21. Basis: five parallel code surveys (HRG core, rule-engine+lowering,
validation/support modules, pipeline/policy split, YAML corpus) plus first-hand reading
of the three largest files. All file:line references verified against `master`.

## Current shape

| Surface | Size | Verdict |
|---|---|---|
| `src/declarative-frontend/**` | ~11,100 TS lines | 3 monster units carry most of the bloat |
| `src/tts-frontend.ts` + 6 policy modules | ~1,600 TS lines | policy modules clean; orchestrator has 4 imperative bypass blocks |
| `src/prosodic-annotator.ts` | ~620 TS lines | the single biggest declarativeness gap |
| `public/rules/**` | ~30,100 YAML lines, 66 files | qlatt-english/qlatt-beauty are near-clones (~3,900 duplicated lines) |

The three TS monsters:
- `lowering.ts:731-1982` — `lowerToFrames`, one ~1,250-line function; `appendFrame` closure alone is 270 lines (1602-1872).
- `validation.ts` (2,736 lines) — 142 hand-rolled `makeDiagnostic` sites; ~55-65% mechanical repetition.
- `rule-engine.ts:102-547` — `buildEvaluationContext`, ~445 lines of nested closures, called from ~7 sites with ~11 positional args each.

What is already *right* (do not "fix"):
- HRG core (item/relation/transaction) is genuinely generic — almost no linguistic knowledge leaks in.
- `syllabify.ts` is the model end-state: algorithm in TS, every phoneme/cluster/affix list in YAML.
- The 5 policy loaders (accent/break/tune/source-contour/speaker-profile) already split data (YAML) from algorithm (TS) with no duplication.
- Prior cleanup landed: predicates library, single `tobi_accent` rule, rate policy in YAML. The cheap rule-corpus wins are picked.
- Keep in TS: onset/nucleus/coda helpers, DECtalk locus percent math, syllabify/trajectory algorithms. Moving those into CEL/YAML would raise paper-declarativeness while making the logic strictly harder to read.

## Safety net

Thick: dozens of `hrg-*`, lowering, rule-engine, policy unit tests plus `npm run test:golden`.
Two tripwires for any refactor:
1. `graphDigest` FNV-hashes `JSON.stringify` of the whole graph — any change to write-record shape/field order breaks replay digests. Preserve serialization exactly when deduplicating write recorders.
2. Anything touching `lowerToFrames` frame arithmetic must be gated on a golden-audio diff, not just typecheck + unit tests.

---

## Phase 0 — Baseline (½ day)

Run full `vitest` + `test:golden`, record pass state. Every later phase re-runs both; goldens must be byte-identical for phases marked [golden-gated].

## Phase 1 — Dead code and dead abstraction (pure deletion, low risk, ~-450 TS lines)

1. **temporal-axis orphans** (`temporal-axis.ts:57-98,135-177`): `compareOrderValue`, `toNumericOrder`, `isStartOrder`, `isEndOrder`, `ensureMark`, `getMarkId`, `getOrderById`, `compareMarkIds`, `buildInitialBoundaryOrders`, `compareTemporalOrder`, `SyncAxis` — zero callers in src or test (grep-confirmed). Delete. (~-50)
2. **`Relation.roots`** (`relation.ts:56,142-146`) — write-only. Confirm no reader, delete. (~-5)
3. **where-prefilter** (290 lines + `parser.ts:219,271` stamping + `Prefilter` types): dead on master — nothing in `src/` reads `_prefilter` or `passesPrefilter`; only consumers are legacy `engine.ts` copies inside `.claude/worktrees/`. It is also a divergence hazard (second CEL parser, `cel2js`, re-implementing eq/membership semantics). **Decision needed from Q**: delete (preferred — the HRG engine never adopted it), or wire `passesPrefilter` into `rule-engine.ts` to reclaim the claimed ~42% eval savings. Don't do both; don't keep the limbo. (~-300 if deleted)
4. **path.ts evaluator**: `evalPath`/`pathNode`/`pathFeature` used only by one test; `rule-engine.ts:~384` re-implements the walking inline. Either refactor the engine walker to call `evalPath` and delete the inline copy, or delete the unused evaluator. Preferred: unify on `evalPath` (kills a two-implementation hazard, not just lines). (~-40 net)
5. **Single-value policy enums** (`accent-policy.ts:83-87`, `break-policy.ts:81-83`): each accepts exactly one value and throws otherwise. Delete the enum machinery. (~-20)
6. **rule-pack double parse** (`rule-pack.ts:266-267, 291-292`): root spec normalized twice through `parseDslSpec`. Parse once, resolve includes, parse the merged result only. (small, removes a footgun)

## Phase 2 — Mechanical dedup (low risk, ~-400 TS lines)

1. **Unify the 5 stamped-write recorders** (`utterance.ts:138-274, 546-600, 632-665`: `stamp`, `stampRelation`, `_writeAssociation`, `stampAnchor`, `resolveMarkTime`) into one generic `recordVersionedWrite<T>()`. Extract a shared `StampedWrite` base for the 5 write types in `types.ts:69-123, 260-319`. **Tripwire #1 applies**: preserve JSON field order. (~-150 to -180, kills the biggest drift risk in the core)
2. **Shared scalar-op algebra**: `applyEffects` (`rule-engine.ts:797-818`) and `resolveControlField` (`lowering.ts:386-401`) implement the same add/mul/max/min/unset twice. Extract `applyScalarOp(op, base, operand)`; klatt duration-floor resolution stays a wrapper. (~-20, two-spelling hazard gone)
3. **`validateApplyEffect` dedup**: the effect-block validation loop is copy-pasted for `rules[].apply` (`validation.ts:1532-1644`) and `rules[].contour.apply` (`1691-1791`). Extract once. (~-100, zero behavior change)
4. **`buildEvaluationContext` options object**: collapse the ~7 call sites with ~11 positional args (`rule-engine.ts:276, 339, 1157, 1170, 1293, 1388, 1426`) to a single context-options struct. (~-60, biggest readability win in the engine)
5. **Name the magic numbers**: the uncited `20` ms transition edge guard appears 6× in lowering (`876, 904, 953, 972, 1017, 1072`) — one cited policy constant. Inventory silence fallback (`inventory.ts:154-158`) and the hardcoded 30 ms default duration (`inventory.ts:233`) move to cited YAML blocks. (net-neutral lines; closes standing Principle-1 violations)

## Phase 3 — Structural decomposition [golden-gated] (~-550 TS lines)

Order matters: 3.1 makes 3.2 safe.

1. **Decompose `appendFrame`** (`lowering.ts:1602-1872`, 270 lines, six unrelated jobs: silence params, item params, transitions, control windows, F0 sampling, affect projection) into named sub-steps. Net-neutral in lines; prerequisite for everything else in lowering.
2. **Fold the four transition-builder blocks** (`lowering.ts:865-897, 898-926, 927-988, 1003-1089` — forward blend, backward blend, sonorant F2, loci) into one `addLinearTransition` helper. Preserve each block's guards/clamps exactly. (~-40)
3. **Unify the value-shape validator family** (`validation.ts:709-1395`: `validateDispatchValueExpression`, `validateDispatchSpec`, `validateSetValueExpression`, `validateTemplateDispatchExpressions`, `validateTemplateNumericExpression`, `validateControlWindowTemplate` — all re-implement *value = number | CEL string | {dispatch} | array | nested*). One parameterized recursion. (~-150 to -250)
4. **Schema-ify the pure-structure validation** (`validation.ts:2001-2447`, the lowering-spec block + string-sets/maps/syllabification): replace with zod (or a ~50-line local combinator core) + `.superRefine` for citation checks. **Keep imperative**: cross-reference/topology/cycle checks and the CEL/policy/critical-literal enforcement — that's the explainability core and it's genuinely bespoke. Gate on error-code parity tests (48 codes). (~-300)

Validation.ts target: 2,736 → ~1,850. And note the direction: pure-structure schemas *become data*, which is itself a declarativeness win.

## Phase 4 — Declarativize with today's engine (no new primitives needed)

1. **Duration floor → rule**: `durationFloorTransaction` (`tts-frontend.ts:562-581`) is `if duration < floor set floor` with floors already in `frontend.yaml:924-932`. Becomes a duration-phase scalar rule with type cases. Delete the TS loop.
2. **Voice-quality preset dedup**: the modal/breathy/pressed/creaky/whispery/falsetto tables exist in BOTH `public/rules/policy/source-contour.yaml` and `frontend.yaml:855-909`. Determine which is live, keep one source of truth.
3. **`speakerStamp` loop → declared projection** (`tts-frontend.ts:606-661`): ~55 lines hardcoding field lists, TL offset add, formant-scale multiply (with `1..10` formant count baked in at :638). The field/op/operand triples are policy data; express as a projection table or frontend-phase rules.
4. **Affect projection table** (`lowering.ts:224-286, 1729-1836`): ~10 of the 15 affect fields are pure `{backendKey, affectField, mode, floor}` rows — declare them. F0-variance and Rd handling stay bespoke TS (they genuinely are).
5. **annotateProsody, part 1 (the easy passes)**: `markFunctionWords` (`prosodic-annotator.ts:248-268`) → scalar rule over a `string_sets.function_words` entry (engine already supports string sets, `pipeline.yaml:34`); punctuation + word-boundary break-index passes (`:476-520`) → scalar rules (thresholds already in `frontend.yaml:129-140`).
6. **Explicit rule `kind:`**: rule kinds are currently duck-typed — `isStructuralRule` (`rule-engine.ts:1468-1477`) ORs 7 key checks and `executeMatch` tries every effect key. Add a `kind:` discriminant (with a compat shim or one-shot rulepack migration). Small line delta, large legibility gain: a rule's nature becomes declared, not inferred. Also promote the engine's buried literals (`"SIL"`, `breakIndex >= 2` at `rule-engine.ts:143-159`, `reset_break_index` default 4 at `:863`) to named policy constants.

## Phase 5 — The big prizes (each is its own project; sequence after 1-4)

1. **Cross-frontend include** — the largest single win in the repo. qlatt-beauty vs qlatt-english: 16 byte-identical files (7 of 8 shared phases, lts-rules, morphology, phonotactics, both normalization files, all policy files) plus a ~97%-identical ~880-line `parameters: policy:` tree. The `include:` mechanism only resolves same-frontend paths today. Extend it (e.g. a shared base dir, or `extends: qlatt-english` at frontend level with per-file override), then declare beauty as *english + voice-quality phase + prosody override + own inventory/voice params*. (~**-3,900 YAML lines**, and future fixes stop landing in one clone only)
2. **`foreach`/template primitive for rules** — the recurring shape: cross-products written longhand, e.g. `place_f2_locus` (`qlatt-english/phases/formant.yaml:3-44`, 8-entry dispatch = {velar,bilabial,alveolar,palatal}×{front,back}, then `place_rel_copy` repeats the same dispatch at `:45-70`). A `foreach:` expansion in the parser (it already expands `for_each_field`, `parser.ts:57-119` — same machinery) collapses these. Also add a safe optional-bool accessor to the CEL surface: `has(x) ? x == true : false` appears 21× across phase files.
3. **Phrase-domain engine primitives, then finish annotateProsody** — the remaining passes need what CEL navigation can't express today: "last accent carrier in phrase" (`prosodic-annotator.ts:357-372`), index-in-phrase with IP-boundary reset (`:430-443`), long-phrase midpoint break insertion (`:572-609`). The `contour` mechanism (domain: phrase, `prosody.yaml:377-381`) is the seed. Design a phrase-domain select/scan primitive, port the passes as rules, and **delete `prosodic-annotator.ts` (~620 lines)** plus most of accent/break/tune TS (their data moves to `string_sets:`/`maps:`, their classifiers to CEL predicates). This is the flagship declarativeness win: today the "declarative" prosody phase silently sits on a 620-line imperative substrate whose 9 decisions produce one coarse provenance record instead of per-rule traces.
4. **Flag, separately: dectalk overfit debt** — dectalk phase rules include per-test-word rules (`dectalk_cake_*`, `dectalk_the_iy_*`; the string "cake" appears 60× across dectalk phases). This is oracle-matching bloat, not abstraction failure — cleaning it requires re-verifying against the DECtalk oracle corpus, so it's a listening/oracle project, not a refactor. Do not touch in this plan.

## What this buys

| | Now | After | Delta |
|---|---|---|---|
| TS (declarative FE + orchestrator + annotator) | ~13,300 | ~11,000-11,300 | **~-2,000 to -2,300 lines** |
| YAML | ~30,100 | ~26,200 | **~-3,900 lines** |
| Imperative pipeline bypasses | 4 (annotator, speakerStamp, durationFloor, createStructure) | 1 (createStructure — legitimately structural) | 3 blocks become traced rules |
| Two-implementation hazards | 5 (scalar ops, condition-shape, navigation, CEL parsers, VQ presets) | 0 | |

## Execution notes

- Order is deliberate: deletions before dedups before decomposition before migration — each phase shrinks the surface the next one must not break.
- Every phase: full vitest + golden run; phases 3-4 byte-identical goldens (phase 4.1/4.5 may legitimately change provenance records — assert trace equivalence, not byte equality, there).
- One decision needed before Phase 1 completes: where-prefilter — delete vs wire in (item 1.3).
- Phase 5.1 (YAML include) and 5.2 (foreach) are independent of each other and of 5.3; parallelizable.
