# Plan: Minimal Provenance + Citations (v1)

Status: Proposed  
Scope: Design only

## 1. What we are building

A CLI mode where you type a phrase and get:

1. A reason for each decision made in the pipeline.
2. At least one citation attached to each decision (or an explicit uncited error in strict mode).
3. Full machine-readable records in JSON.

This is for provenance and citations only. No broader platform work.

## 2. What we are not building in v1

1. No schema package/versioning framework.
2. No compression/streaming modes.
3. No multiple output profiles.
4. No internet-based citation lookup.
5. No rewrite of synthesis logic.

## 3. Minimal decision record

Each decision record needs only:

- `id`
- `seq` (monotonic integer order in this run)
- `stage` (`transcribe|rules|semantics|interpreter|runtime`)
- `type` (short stable string)
- `subject` (token/frame/param/node)
- `reason` (one line)
- `citations` (list of strings)
- `parents` (optional list of decision IDs)

That is enough for both humans and agents.

## 4. Citation sources (v1)

1. Rule citations from `public/rules/frontend.yaml`:
   - `rules.<name>.citation`
2. Policy citations from `public/rules/frontend.yaml`:
   - `parameters.policy.*.citations`
3. Semantics citations from:
   - inline `citation/citations` on realize rules, or
   - a simple sidecar map file if inline is not ready

No canonical resolver system in v1. We keep citation strings as they are.

## 5. CLI (minimal)

Proposed command:

```bash
npm run explain -- --phrase "hello world"
```

Flags:

```txt
--phrase <text>           required
--format <text|json>      default text
--strict-citations        fail if any decision has zero citations
--stage <csv>             optional filter
--subject <selector>      exact subject match; suffix * means prefix match
--range <spec>            optional bounded dump window
--why <decision-id>       dump ancestry chain for one decision
--verbose                 full text dump (default text is compact)
--out <path>              optional file output
```

Exit codes:

1. `0` success
2. `1` runtime error
3. `2` strict citation failure

## 6. Output behavior

### 6.1 Text output (default)

Compact and readable. One line per important decision:

```txt
[stage] [type] [subject] reason | citations: [...]
```

Default text mode is compact (high-value decision types, capped output).  
Use `--verbose` to print full text decision output.

### 6.2 JSON output

Full list of decision records (not summarized away).  
This is the agent/mechanical surface.

### 6.3 Range dumping (diagnostic slice)

`--range` limits what is dumped, without changing what is computed internally.

Supported specs:

1. Sequence window: `seq:120-220`
2. Time window (ms): `time:340-520`
3. Token window: `token:ph_10-ph_24`
4. Decision-ID window: `id:<startId>-<endId>`
5. Open-ended: `seq:300-` or `time:-400`

Rules:

1. Range bounds are inclusive.
2. Invalid range syntax returns a CLI error.
3. Empty match returns an empty result with a clear notice.
4. `--strict-citations` still applies to the dumped set.

Marking:

1. Text lines are prefixed with `#<seq>`.
2. JSON records include `seq`.
3. JSON root includes `rangeApplied`, `rangeMatchedCount`, and `totalDecisionCount`.

## 7. Instrumentation points

## 7.1 `src/tts-frontend.ts`

Emit:

1. dictionary pronunciation chosen
2. fallback pronunciation chosen
3. inventory target selection

## 7.2 `src/declarative-frontend/engine.ts`

Emit from existing trace:

1. rule matched
2. rule rewrite applied

Attach rule citation automatically.

## 7.3 `src/semantics/topological-evaluator.ts`

Emit per realize rule:

1. rule evaluated
2. output value produced
3. error fallback if evaluation fails

Attach semantics citation where available.

## 7.4 `src/klatt-interpreter.ts`

Emit:

1. step vs ramp choice
2. schedule write decision

## 7.5 `src/klatt-runtime.ts`

Emit:

1. bind mapping decisions
2. semantics fallthrough warnings as provenance decisions

## 8. Strict citation behavior

If `--strict-citations`:

1. Any decision with empty `citations` is marked as an error decision.
2. CLI exits with code `2`.
3. Text output ends with uncited decision count.

## 9. Keep it usable

1. Default text output should show only high-value decisions first:
   - fallbacks
   - rule rewrites
   - semantics errors
   - schedule mode changes
2. JSON always includes full decision list.

## 10. Acceptance criteria

1. `hello world` produces decision records across all active stages.
2. OOV phrase shows explicit fallback decisions.
3. Rule rewrite decisions include rule citations.
4. Semantics decisions appear per realize rule evaluation.
5. Strict mode fails when any decision is uncited.
6. Explain mode does not change synthesized audio behavior.
7. `--range` returns only requested records and preserves stable `seq` order.
8. `--subject` supports exact and prefix (`*`) matching.
9. `--why <decision-id>` returns that decision and its parent chain.

## 11. Implementation phases

Phase 1:

1. decision collector
2. CLI command (`text` + `json`)
3. rule trace + frontend provenance

Phase 2:

1. semantics provenance
2. interpreter/runtime provenance
3. strict citation gate

Phase 3:

1. cleanup/tuning of text readability
2. integration tests for strict mode and fallback paths

## 12. Deferred on purpose

Out of scope for this v1 and intentionally deferred:

1. schema formalization
2. compatibility/version policy
3. compressed/streaming formats
4. advanced ranking/scoring of decisions
