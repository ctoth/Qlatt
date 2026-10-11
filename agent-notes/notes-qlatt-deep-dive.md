# Qlatt deep-dive notes

## Scope and state

- Read-only architecture and issue-discovery pass against tracked `master` at `e7ea6d3b5a496f3e29d04104656c64230885d6dd`.
- Live GitHub `master` matched that SHA during this turn.
- Existing open issues #15-#19 already cover normalization preconditions, punctuation policy, speaker formant keys, layered F0 ownership, and track-assembler fallback policy.
- The worktree was already heavily untracked. Preserve all existing files and do not stage, commit, push, or open issues without Q's approval.

## Current findings

1. There is no authoritative CI verification gate. `.github/workflows/deploy.yml` runs `npm ci` and `npm run build`, but not tests, typechecks, strict citations, experiment validation, or Rust checks.
2. The named typecheck scripts passed, but `npx tsc -p tsconfig.json --noEmit` failed. Some errors came from pre-existing untracked scripts, but tracked scripts and tests also produced errors. The named configs do not establish repository-wide static coverage.
3. Rule explainability metadata is not a load-time invariant. `validateRules()` does not require citations or tags; the parser turns missing citations into `[]`; `ruleTag()` falls back to the rule name. `HrgTransaction` only rejects uncited metadata when a rule actually executes, and the strict citation test samples only three corpus phrases.
4. Primitive registry defaults and AudioWorklet `parameterDescriptors` drift. Verified examples include resonator bandwidth 100 vs 60, LF-source F0 120 vs 110, LF mode 1 vs 0, and noise cutoff 4000 vs 1000. No registry/worklet parity validator was found.
5. `createKlattRuntime()` validates inline graph expressions only. Unknown primitives, unsupported native node types, missing WASM, missing nodes, missing AudioParams, and broken connections are logged and skipped while runtime construction can continue. Runtime/interpreter observations use logger strings, while frontend/HRG uses structured `Diagnostics`.
6. Provenance is described as a DAG, but `createProvenanceCollector().add()` accepts arbitrary parent IDs, duplicates, and dangling/self references. `decisionChain()` silently ignores missing IDs. No graph-integrity validator was found.
7. Experiment loading is duplicated in `src/experiments/load-experiment-config.ts` and `test/harness/experiment.js`. Both implement only one-level inheritance, ignore manifest `path`, and have no cycle/unknown-parent validation. Tests cover only two inherited DECtalk values.
8. `expandFormantBanks()` mutates caller-owned graph and semantics objects in place and deletes `graph.meta.formantBanks`; purity/idempotence and repeat-runtime behavior are not tested.
9. The full Vitest run is still active. Partial output has two failures: stale `test/output-lp-filter.test.ts` reads `graph.formantBanks` instead of `graph.meta.formantBanks`, and the fricative-heavy runtime output-level test exceeds its peak limit. Final totals and exact second failure value are not yet known.

## Verification already run

- `npm.cmd run typecheck:core` (exit 0)
- `npm.cmd run typecheck:audio` (exit 0)
- `npm.cmd run typecheck:golden` (exit 0)
- `npm.cmd run typecheck:scripts` (exit 0)
- `npx.cmd tsc -p tsconfig.json --noEmit` (exit 1; mixed tracked and pre-existing untracked errors)
- Focused Vitest run for strict citations, YAML frontend config, realization error routing, and provenance ranges (exit 0; 4 files / 22 tests)
- Full `npm.cmd test` started; final result pending

## Blockers and next action

- Wait for the active full Vitest run to finish; do not kill other checkout/user Node processes.
- Capture exact failure output and re-check `git status` for test-created artifacts.
- Inspect recent commits behind both failing tests and separate baseline regressions from architectural issue candidates.
- Rank and draft a small set of non-duplicative GitHub issue bodies for Q to read. Do not publish them.

## Formant-bank follow-up (2026-08-17)

### Current findings

1. `graph.meta.formantBanks` crosses the YAML boundary through an unchecked TypeScript cast. Bacon intentionally treats this Qlatt extension as opaque, so Qlatt needs a real `unknown`-to-validated-value parser here.
2. A Zod-style runtime schema is appropriate for local shape checks: strict fields, finite numbers, positive integer indices, ordered ranges, defaults inside ranges, non-empty formant arrays, and discriminated cascade/parallel route data. Generated-name collisions, graph node/port references, and topology remain compiler checks rather than schema checks.
3. `proximity` is required by `FormantBankSpec` and repeated in four experiment graphs, but `expandFormantBanks()` never reads it. The PFE generator computes all pairwise resonator corrections instead. The declaration is therefore misleading dead data.
4. The type permits a record of multiple named banks, but generated graph node IDs, parameter names, and PFE realization names omit the bank name. A second bank would collide with the first. Current experiments use one bank, so the narrow honest contract is singular unless a real multi-bank use case is introduced with namespaced symbols.
5. Expansion mutates graph and semantics in place, overwrites generated names without collision checks, appends escape-hatch connections that expose generated node IDs, and deletes the source declaration.
6. PFE rules are rebuilt and topologically sorted inside every semantics evaluation. They should be compiled once into ordinary semantics IR before interpreter binding classification.
7. There is a correctness hole across the evaluator/interpreter boundary: PFE generates `aNLinear` values dynamically, but the interpreter decides which bindings are realized from authored `semantics.realize` keys only. Generated gain bindings are classified as passthrough and read from `frame.params`, where they are absent.
8. Existing PFE, proximity, and interpreter tests all pass separately (3 files, 21 tests), but no integration test checks that a generated `aNLinear` value is actually scheduled to the corresponding AudioParam.
9. Open issue #17 is adjacent but not duplicative: it derives speaker override keys from the active bank. A validated, compiled capability surface would give that issue the correct owner to query.

### Proposed direction

- Parse Qlatt-owned extension data once at experiment load/compile time. Prefer Zod if it becomes the standard parser for Qlatt configuration extensions; otherwise build an equivalent typed parser, not another unchecked interface/cast pair.
- Infer TypeScript source types from the runtime schema so schema and interface cannot drift.
- Keep the schema strict and non-coercing. Translate parser issues into stable Qlatt diagnostic codes and paths.
- Compile one validated bank into fresh graph and semantics documents. Preserve the source declaration or an origin map for diagnostics/provenance; do not delete it as cleanup.
- Lower PFE amplitudes to ordinary realization rules once, with collision checks and source/citation metadata, before interpreter setup.
- Replace `connections` to generated node names with declared semantic attachment points or compiler-resolved symbolic references.
- Remove the dead `proximity` field, or make it an explicit alternative amplitude-model variant if a legacy approximation is genuinely required.

### State, blocker, and next action

- No implementation, staging, commit, push, or issue mutation has been performed.
- No technical blocker. The remaining choice is architectural: adopt Zod as the Qlatt extension-boundary standard, or enhance/reuse a local typed parsing abstraction.
- Next: present the recommended boundary and an exact, non-duplicative issue draft for Q to review before any GitHub mutation.

## Formant-bank implementation checkpoint (2026-08-17)

### Findings and observations

- Work is isolated on local branch `fix/formant-bank-contract` from `e7ea6d3b`; nothing has been pushed.
- The tracked worktree was clean at branch creation. Extensive pre-existing untracked research and oracle output remains untouched.
- Zod `4.4.3` is the current npm `latest` tag observed during this turn and has been added to package metadata.
- `src/formant-bank.ts` now parses the Qlatt extension from `unknown` with a strict Zod schema and infers its source types from that schema.
- The schema enforces one non-empty bank, positive unique formant indices, finite ordered ranges, defaults within ranges, and complete parallel-amplitude fields.
- Expansion now preflights generated node/parameter/realization collisions and node references before mutation.
- The unused `proximity` declarations have been removed from the four bundled formant-bank graphs.
- New focused tests cover strict parsing, removed fields, invalid defaults, duplicate indices, incomplete parallel data, multiple banks, collision atomicity, missing references, and all four bundled declarations.
- Focused validation/PFE tests passed before the bundled-declaration cases were added: 3 files, 21 tests. `typecheck:core` also exited successfully after the schema implementation.
- Package installation reported the repository's existing audit baseline of 6 vulnerabilities (5 high, 1 critical). No unrelated audit fix was attempted.
- Source inspection confirmed the second defect remains to be implemented: evaluator-generated `aNLinear` rules are absent when interpreter binding source categories are built.

### Tracker state and blocker

- Exact drafts for two issues were shown to Q in commentary: YAML-boundary validation and compile-time PFE scheduling.
- GitHub issue creation remains blocked only on explicit approval of those exact bodies, per the repository rule that nothing is published under Q's name before he reads and approves it.

### Next action

- Re-run the expanded focused validation test set.
- Review and commit the first scoped schema/validation change with explicit paths only.
- Implement the second scoped PFE compilation/scheduling fix and integration test.
- Run the named TypeScript checks and proportionate audio/golden verification, then create only the approved GitHub issues.

## PFE compilation checkpoint (2026-08-17)

### Implemented state

- The first validation slice is committed locally as `6c902c6a feat(config): validate formant bank declarations`.
- The second uncommitted slice now compiles Lin (1995) PFE rules during formant-bank expansion, before interpreter binding classification.
- `SemanticsDocument.formantBanks` and the evaluator-specific mirrored formant types have been removed.
- `TopologicalEvaluator` no longer imports or generates PFE rules; it caches the dependency order for each compiled realization map so per-frame work is CEL evaluation only.
- An interpreter integration test constructs a bank, expands it, binds `a1Linear`, and verifies the computed PFE value is sent to the gain AudioParam.
- Focused verification passed after this change: 5 files, 36 tests, including validation, PFE parity, semantics proximity behavior, interpreter scheduling, and output low-pass configuration. `typecheck:core` also exited successfully.
- Edited legacy CRLF test files were restored to uniform CRLF with `unix2dos`; no mixed-EOL churn remains in those files.

### Full-suite observation

- The full Vitest run has one remaining failing test: `runtime-output-level.test.ts` for the fricative-heavy phrase.
- Focused rerun measured peak `1.9502713680267334` against the `1.05` ceiling.
- The untouched baseline already failed the same test at approximately `1.759`, so this is not a newly green-to-red test. Correctly scheduling PFE gains changes the measured value and must be reported, but the cited PFE equation and stable test must not be altered to force green.
- The stale `output-lp-filter.test.ts` failure from the baseline has been fixed by reading `meta.formantBanks` through the new validated parser.

### Blocker and next action

- Tracker creation still awaits Q's explicit approval of the exact two issue bodies shown earlier.
- No implementation blocker. Next: run all named TypeScript checks, root TypeScript detection to separate known untracked/baseline errors, build, golden/audio checks, inspect the exact second-slice diff, and commit it separately if scoped verification is satisfactory.

## Formant-bank delivery checkpoint (2026-08-17)

### Local commit state

- `6c902c6a feat(config): validate formant bank declarations`
- `96a042a7 fix(audio): compile PFE gains before scheduling`
- Both commits are on local branch `fix/formant-bank-contract`; neither has been pushed.
- Only explicitly named formant-bank/package/test paths were staged. `notes-qlatt-deep-dive.md` and all pre-existing untracked files remain unstaged.

### Verification observed this turn

- Focused formant-bank/PFE/interpreter/output-LP run: 5 files, 36 tests, exit success.
- Named TypeScript configs `typecheck:core`, `typecheck:audio`, `typecheck:golden`, and `typecheck:scripts`: exit success.
- Production `npm run build`: exit success; Vite transformed 176 modules.
- `npm run test:golden`: exit success; emitted the expected numeric comparison reports and only existing Node loader/deprecation warnings.
- Sibling Bacon CLI checked all four modified graphs: four `OK: graph.yaml passes all checks` results.
- Root `npx tsc --noEmit` remains baseline-red across scripts/tests and extensive pre-existing untracked diagnostics. No reported error named a changed source file; touched PFE/proximity test context assertions were removed so they no longer add root errors.
- Full Vitest has exactly the observed fricative output-level failure in the captured run; focused rerun measured current peak `1.9502713680267334` versus ceiling `1.05`.
- A fresh isolated worktree at untouched commit `e7ea6d3b` re-measured the same baseline test at `1.7594326734542847`. Measured delta is `0.190838694572449`, or `10.846603990693%`.
- The temporary baseline worktree was validated as an ordinary directory with zero reparse points, then removed with `git worktree remove --force`; it no longer exists.

### Remaining gate and next action

- GitHub issue creation still requires Q's explicit approval of the exact two bodies already shown.
- Once approved: create the two issues, verify their fetched bodies/URLs, then decide whether Q wants this branch pushed and a PR opened. Do not infer push/PR authorization merely from issue approval.

### 2026-08-23 local-paper implementation checkpoint
- Key finding: the strongest prerequisite candidate is a physiology-oriented voice-source substrate; nonlinear regimes and source-tract feedback build on it.
- Current state: local paper notes contain equations and implementation recipes, while existing beauty design explicitly keeps body-cover models reference-only.
- Blocker: repository TODO coverage and the existing design decision against closed-loop feedback still need exact verification before recommending a first focus.
- Next action: inspect the authoritative design/TODO surfaces and report whether any of these ideas are durably captured.
