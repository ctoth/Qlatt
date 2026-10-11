2026-09-08 checkpoint: Epic #38 children #143-149 remain open; #142/#98/#77 merged.
User requests TDD, clean worktrees, PR closing phrases, no stacking; selected one epic PR against master, no merge authority assumed.
Worktree C:/Users/Q/code/Qlatt-epic-38 branch epic-38-normalization at base 2ec12406; npm ci complete.
Added failing untimed text expansion regression, then initial engine/schema/validator implementation; focused expansion, acoustic structural, schema tests pass.
Next: complete #143 lookup evidence/handoff/config validation and tests, then YAML reader components and final cutover; no PR published yet.
2026-09-08 checkpoint: Expansion supports terminal/request records, source history, tags and unresolved-request errors; included abbreviation fixture reaches pronunciation with exact vocabulary evidence.
Loader tracks map origins outside DSL; vocabulary(table,key) emits typed evidence; initial expansion/source/include tests pass, typecheck passed before latest edits.
Started #144 number component and 21 red tests in isolated epic worktree; no commits or PR yet.
Current failure: CEL macro bodies forbid comprehensions, so tn_words must emit one record or move splitting to rule output rather than relaxing macro validation.
Next: fix number component composition, complete foundation negative/scheduling tests and docs, migrate remaining readers and final callers; root notes uncommitted.
2026-09-08 checkpoint: Shared numbers YAML passes 21 tests; currency passes 10, time passes 6, year/date passes 6, including alternate vocabulary/precision/order fixtures.
Components live in public/rules/normalization; bounded requests progress through existing phases; terminal splitting stays at rule call site because macros reject comprehensions.
Captured 45-row legacy corpus in test/fixtures/normalization-baseline.json using scripts/capture-normalization-baseline.ts via Vite SSR; contains partial-currency and dotted-meridiem quirks.
Async user question pending: preserve legacy bugs or explicitly fix/document; default preserve. Decimal/fraction test written red (component file absent).
Next: decimal/fraction YAML, recognition/include composition, final normalization wiring and legacy deletion/caller tests, full gates and epic PR; nothing committed/published.
2026-09-08 checkpoint: Numeric components complete at focused-test level; combined graph corpus matched all 45 legacy cases after preserving ordinal zero and currency suffix quirks.
Bundled frontend includes now select shared normalization components and frontend policy maps; normalizeText entry point uses graph; legacy code still present pending caller migration.
Added CEL regexReplace/regexSplit/literalPattern and transcription context to preserve the single punctuation inventory (#16).
Latest corpus failures are test fixture selecting only period while expected corpus uses six punctuation tokens; fix fixture inventory, then migrate old resource/dispatcher tests and delete legacy assets/module.
Remaining: source fixture adaptation, stronger validations/negative tests, docs, full WASM/tests/static gates, reviews, scoped commits and one epic PR; no publication yet.
2026-09-08 checkpoint: Legacy dispatcher and four legacy YAML assets deleted; public callers migrated to normalizeGraphText/normalizeText. Old dispatcher tests replaced with graph validation and retained punctuation controls.
Source-recognition ancestry tests caught preceding-source contamination via list membership; current normalization feature reads now use own value ancestry, explicit neighbor navigation retains ordering evidence; regression passes.
WASM build, typecheck and npm check pass. Full npm test running in exec session 13714, output normalization-full-test.log (ignored).
Full gate has Chen/Crystal duration fixture failures: they spread bundled spec then replace phases, leaving normalization.phases referencing omitted phases; inspect exact diagnostics and fix fixture selection contract rather than weakening production validation.
Docs added host operations/text-normalization migration evidence. Remaining validations, full gate fixes, final tests/build, scoped commits, PR publication; no PR yet.

Checkpoint: epic 38 implementation remains in isolated Qlatt-epic-38 worktree; no commit or PR yet.
Production normalization now uses declarative HRG expansion; legacy dispatcher and assets removed.
Focused tests, typecheck, lint, WASM and production build passed before latest regression test.
Full suite session 13714 is still running; two duration fixture failures have been corrected.
Latest red test proves 82 repeated static CEL validations; next cache immutable recognition configurations and rerun gates.

Checkpoint: immutable recognition cache now passes the red regression; missing vocabulary emits diagnostics atomically.
Synthetic production recognition covers alternate currencies, precision and clock settings; focused fixtures pass.
Typecheck, lint and production build pass; final full suite is running in session 74240.
Diff review confirms one graph normalization path and removal of legacy dispatcher/assets; no PR or commit yet.
Next finish review and full gate, then scope commit and publish one unstacked epic PR closing 38 and 143-149.

Checkpoint: review caught partial vocabulary overrides attributing inherited keys to child resources; red/green regression now covers per-key origins.
All 53 epic files are explicitly staged, diff whitespace checks pass, and no unstaged worktree edits remain.
Tracked removal search finds only historical notes/plans; active callers and documentation are migrated.
Full suite session 74240 remains running on the preceding candidate; final per-key changes need final exact-tree gates.
Next commit scoped epic, complete gates, publish one PR against master with Closes #38 and #143-149; no merge authorized.

Checkpoint: PR #200 https://github.com/ctoth/Qlatt/pull/200 is published against master at cbb84ab3, mergeable and unmerged.
Remote closing references verified for #38 and #143-149; one commit, no stacked branches.
Final committed tree passed npm test, typecheck, lint, WASM prerequisite build and production build.
Isolated worktree is clean; root unrelated files preserved and this checkpoint remains uncommitted.
GitHub CI run 34274549690 is still running tests; no merge authority was requested or exercised.
