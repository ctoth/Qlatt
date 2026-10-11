Checkpoint 2026-09-03: issue #93 is open and has no existing pull request.
Contract: isolated worktree, regression-first fix, scoped PR, exact-head CI, normal merge commit.
Current state: origin/master fetched; main checkout has 341 tracked changes and remains untouched.
Rule 0 repair: global guards now bound noisy status output and reject double-quoted backtick rg patterns.
Next: create C:\Users\Q\code\Qlatt-issue-93 from origin/master and inspect the validation architecture.

Checkpoint 2026-09-03: issue #93 gaps are confirmed in parser, validation, CEL, rule engine, and inventory lookup.
Current state: validator returns warnings, but loaders discard them; tags collapse to one transaction tag.
TDD surface: test/declarative-frontend-schema.test.ts plus focused engine/inventory/CLI tests.
Blocker: none; the acceptance criteria require coordinated schema validation and rulepack migration.
Next: add comprehensive failing regression cases before modifying production code.

Checkpoint 2026-09-03: exact-lock dependencies are installed with no manifest or lockfile diff.
Key finding: cel-js supports strict registered variables, so unknown identifiers need no custom parser.
Key finding: HrgTransaction.set can accept an effect tag while retaining one atomic transaction.
Current state: validation and engine test surfaces are mapped; no production files changed.
Next: land and run the focused red regression suite, then implement the narrow schema/runtime changes.

Checkpoint 2026-09-03: focused validation regression is red with 5 expected failures.
Current state: parser normalizes tags; CEL validation accepts an explicit declared-variable environment.
Current state: validation constants now define allowed kinds and rule/select/apply fields.
Blocker: none; helper validation and rulepack migration remain.
Next: finish schema/reference diagnostics and rerun the focused regression.

Checkpoint 2026-09-03: focused validation suite is 4/5 green after schema/reference implementation.
Current state: only undeclared CEL identifier detection remains red.
Key finding: cel-js parse is syntax-only; documented check performs environment type checking.
Blocker: none; this is an isolated validator API correction.
Next: use Environment.check for strict validation, rerun focused tests, then typecheck.

Checkpoint 2026-09-03: validation regression is green; per-write tag regression is now staged.
Audit: 32 Qlatt-English, 25 DECtalk, and 3 Beauty declarations; one DECtalk effect lacks a tag.
Current state: Qlatt-English declarations and its 50-tag vocabulary are migrated.
Blocker: bundled load correctly stops before engine tests until remaining declarations are migrated.
Next: migrate DECtalk and Beauty schemas/vocabularies, then rerun per-write tag TDD.

Checkpoint 2026-09-03: all bundled pipeline declarations and tag vocabularies are migrated.
Audit evidence: zero real missing fields, citations, tags, or undeclared tags across three frontends.
Current state: include merging carries tags; per-effect write tags pass while the transaction stays atomic.
Blocker: none; inventory fallback and warning surfacing remain.
Next: add unknown-target TDD, replace SIL fallback with an explicit error, then cover CLI warnings.

Checkpoint 2026-09-03: unknown inventory lookup now throws E_INVENTORY_PHONEME_UNKNOWN under TDD.
Current state: explain warning and --strict regression is red as expected.
Key finding: strict load exposed valid stressless vowel bases plus normalization-only AX, NX, and WH.
Blocker: inventory vocabulary needs an explicit alias declaration before CLI warning tests can run.
Next: add inventory aliases and stress-base expansion, preserving fatal runtime lookup for unknown symbols.

Checkpoint 2026-09-03: inventory aliases and stress-base expansion now pass strict bundled load.
Current state: explain warnings print and --strict exits 2; core typecheck is green.
New red evidence: undeclared identifiers still escape from apply-value CEL expressions.
Blocker: none; the remaining CEL gap is isolated to effect/definition expression environments.
Next: validate all expression-bearing rule effects against captures, definitions, and core variables.

Checkpoint 2026-09-03: strict CEL checks now cover effects, definitions, predicates, and patterns.
Current state: bundled optional-field syntax remains accepted; unknown apply identifiers are rejected.
Workflow repair active: a repeated call-argument patch anchor was not proven unique.
Durable state: global patch guidance now forbids standalone repeated call-argument hunks.
Next: inspect the exact validation diff, correct or verify both call sites, then resume tests.

Checkpoint 2026-09-03: Rule 0 anchor verification is complete.
Current state: CEL validation covers conditions, effects, dispatch, definitions, points, predicates, and patterns.
New red coverage targets undeclared item fields and misspelled nested parameter paths.
Blocker: reference context still needs threading through rule and pattern validation calls.
Next: finish that context wiring, rerun focused validation and bundled-load tests.

Checkpoint 2026-09-03: reference validation now rejects unknown item fields and parameter paths.
Current state: the strengthened five-test validation regression passes.
Finding: bundled rulepacks need existing runtime item fields declared in their relation schemas.
Blocker: the first bundled-load probe was too verbose and its output was truncated.
Next: strengthen the global bounded-test guard, rerun to a log, and summarize declarations.

Checkpoint 2026-09-03: the global verbose-test guard is strengthened and verified.
Current state: bundled-load output is captured to a bounded log; two of three suites pass.
Finding: the remaining DECtalk pack reports 87 unique undeclared fields and unknown inherited tags.
Blocker: generated for-each writes and imported Qlatt rules exceed the DECtalk local declarations.
Next: make inherited relation and tag vocabularies authoritative, then rerun the bounded gate.

Checkpoint 2026-09-03: bounded failures are now separated by frontend.
Current state: DECtalk has 34 missing field declarations and no missing tags.
Finding: qlatt-beauty overrides the base pipeline metadata while reusing its rule files.
Blocker: beauty therefore lacks the shared Qlatt tag and relation declarations.
Next: sync the shared declarations into beauty and complete DECtalk generated-write fields.

Checkpoint 2026-09-03: DECtalk and qlatt-beauty now pass strict load individually.
Current state: shared fields and tags are explicit in beauty; generated DECtalk fields are declared.
Finding: two legacy DECtalk tags encode oracle verification method instead of rule motivation.
Blocker: those tag names still violate the issue's semantic-tag contract despite loading cleanly.
Next: retag formant traces as segmental context and boundary transfers as coarticulation.

Checkpoint 2026-09-03: all verification-method tag spellings are removed from DECtalk.
Current state: 399 trace tags now say segmental_context and two boundary transfers say coarticulation.
Finding: the combined bundled metadata/shape/single-parse gate passes all six tests.
Blocker: older value-shape validators still check CEL syntax without the declared-variable context.
Next: thread variables, item variables, and parameters through every CEL value validator.

Checkpoint 2026-09-03: core and scripts typechecks pass after explicit capture narrowing.
Current state: 38 of 39 focused tests pass; one programmatic params overlay test is red.
Finding: static nested parameter validation must not reject execution-time params when no schema exists.
Durable repair: Qlatt AGENTS now records that static-versus-runtime parameter distinction.
Next: commit AGENTS alone, guard nested checks on schema presence, and rerun the focused suite.

Checkpoint 2026-09-03: two standalone AGENTS commits now preserve the parameter-schema contract.
Current state: the first code repair still fails because parsing synthesizes an empty parameters object.
Finding: declaration presence must travel as an explicit validation option from raw compile input.
Blocker: validateDslSpec currently receives only the normalized spec.
Next: add the explicit option, pass it from compileRuleEngineSpec, and rerun both red tests.

Checkpoint 2026-09-03: parameter schema presence now crosses the raw compile boundary explicitly.
Current state: programmatic runtime params and static typo detection both pass; focused set is 39 green.
Finding: phoneme membership lists also need inventory validation, not only equality and target calls.
Current repair: membership regression is red then green for current.phoneme in literal arrays.
Next: preserve syntax compilation alongside strict identifier checks, then run final candidate gates.

Checkpoint 2026-09-03: strict CEL now preserves syntax compilation and specialized cursor errors.
Current state: a broader four-file schema gate found two regressions before candidate testing.
Finding: the predicate test failure was undeclared fixture fields, not lost predicate variables.
Durable repair: Qlatt guidance now requires complete strict-validation fixture schemas.
Next: add the two fixture declarations, add the global diagnosis guard, and rerun the exact gate.

Checkpoint 2026-09-03: the exact four-file CEL/schema gate now passes all 39 tests.
Current state: core and scripts typechecks pass after validation-order and fixture repairs.
Finding: the candidate contains 21 tracked product/test files plus one new validation test.
Blocker: none in focused verification; the full repository test gate has not run yet.
Next: stage the exact candidate, run cached diff checks, then run the full test suite once.

Checkpoint 2026-09-03: the full suite completed with a bounded 138676-byte log and failed.
Current state: seven klsyn88 failures are confirmed missing-WASM prerequisites.
Finding: fresh bundled loading also rejects DECtalk EM membership literals absent from inventory.
Durable repair: Qlatt AGENTS now requires WASM preflight and fresh-process literal validation.
Next: resolve EM as a real normalization/target contract, build WASM, then rerun full tests.

Checkpoint 2026-09-03: normalization aliases are now explicit alias-to-target mappings.
Current state: AX maps to stress-aware AH, NX to NG, WH to W, and DECtalk EM to M.
Finding: alias materialization is red then green; fresh bundled single-parse passes all three packs.
Blocker: the WASM artifacts required by klsyn88 are still absent in this worktree.
Next: run the documented Windows build once, verify outputs, restage, and rerun full tests.

Checkpoint 2026-09-03: the WASM build passed and all seven required target artifacts exist.
Current state: the second full suite reaches 120 of 126 files and 1072 of 1079 tests.
Finding: three failures are incomplete fixtures; cake expects the deliberately removed old tag.
Finding: AX-to-AH aliasing moved normalization earlier and changed contextual-N acoustics.
Next: preserve SIL placeholder semantics for normalized aliases, update tag/fixture assertions, rerun.

Checkpoint 2026-09-03: the interrupted explain process is definitively absent and its artifacts exist.
Current state: a global guard now excludes the probe and parent wrapper from command-line process matches.
Finding: mapping normalized aliases directly to target keys changes legacy alias identity and frame timing.
Blocker: the contextual-N regression remains red until alias identity is preserved during materialization.
Next: separate alias lookup target from returned phoneme identity, then rerun the focused inventory and DECtalk tests.

Checkpoint 2026-09-03: alias materialization and the complete DECtalk E2E file pass 113 tests.
Current state: DECtalk AX is again stress-resolved from AX0/AX1; only undeclared symbols use explicit aliases.
Finding: the prior runtime-output-level and tts-dsl failures reproduce in an isolated two-file run.
Blocker: the bounded 1,945-byte failure log has not yet been inspected.
Next: read the isolated diagnostics, repair only confirmed candidate regressions, and rerun those two files.

Checkpoint 2026-09-03: both remaining failures reproduce alone; runtime peak is 1.9503 and replay digests differ.
Current state: graph digests include feature-write metadata, including each write's provenance tag.
Finding: effect-level tags reach writes but are omitted from journal set_feature operations and replay.
Blocker: replay cannot be green until the journal carries and reapplies each effect tag.
Next: add the tag to the journal type and replay path with a regression, then diagnose output level separately.

Checkpoint 2026-09-03: journal tag replay regression and tts-dsl now pass six tests.
Current state: the output-level test still reports a deterministic peak of 1.9502713680267334.
Finding: the same test and exact peak fail at clean detached base commit 4fed5749.
Blocker: the repository-wide suite has one confirmed pre-existing base failure unrelated to issue 93.
Next: run candidate typechecks and full suite, compare any remaining failures to this base evidence, then review and publish.

Checkpoint 2026-09-03: core and scripts typechecks pass; full suite is 1078 passed and one base-identical failure.
Current state: 29 intended paths are staged with no unstaged tracked edits and cached diff check passes.
Finding: all 399 large DECtalk line replacements normalize exactly to the two approved tag renames.
Finding: a 4,889-path tracked scan reports zero remaining old-tag spellings.
Next: finish source diff review, commit the implementation, open the closing PR, and monitor exact-head CI.

Checkpoint 2026-09-03: implementation commit aed4501d is pushed and PR 105 closes issue 93.
Current state: GitHub reports the PR head as exact but mergeable CONFLICTING with no checks started.
Finding: the issue worktree was created from a stale local origin/master ref at 4fed5749.
Blocker: CI and merge are blocked until the branch is synchronized with current remote master.
Next: install a global fresh-base guard, fetch, merge current master into the branch, verify, and push.

Checkpoint 2026-09-03: global guidance now requires fetching before worktree creation and publication.
Current state: current master 714b259f is merged by two-parent commit 425cbebf without an AGENTS delta.
Finding: the only merge conflict was AGENTS.md; product source and tests merged automatically.
Current state: the two base-only AGENTS additions are staged as the sole path for standalone commit.
Next: commit that instruction reconciliation, rerun post-merge focused gates, push, and resume CI.
