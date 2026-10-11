
Issue 32: move affect presets to cited YAML; validate fields against voice-quality channels; declare variants and degree curve; provenance on application.
Authorized: clean worktree, TDD, commit and PR with Closes #32; no merge requested.
Created C:\Users\Q\code\Qlatt-issue-32 on issue-32-affect-presets from origin/master d6432b67cd512c68b3f99d47a93046d0d5cf320a.
Global worktree-output guard installed after inventory truncation; bounded retry succeeded. No issue32 prior worktree or open PR found.
Next: inspect current affect implementation and voice-quality channel dependency, then red regression.

Current inspection: src/input/affect.ts owns typed arrays and compileAffect; clinical variant names hardcoded at resolveAffectPreset.
Dependency exists: public/rules/policy/vq-channels.yaml and src/input/vq-channels.ts export VQ_FIELDS, VQ_NEUTRAL.
compileAffect scales VQ/dimensions, returns preset citations; apply-affect.ts applies compiled output and returns citations without a collector.
No implementation or regression yet; worktree remains initial candidate. Reads limited to 8 lines after output truncation.
Next: inspect loader/provenance consumers and test setup; create migration script and focused red regression.

Installed worktree dependencies with npm ci; manifest/lock diff empty (Node 22.18 engine warning for lint-staged).
Additional actual consumer: src/input/parse.ts compileAffect at line 396; existing Direction decisions already use compiled citations.
ProvenanceCollector uses add(AddDecisionInput), getDecisions(); createProvenanceCollector() available.
Plan: YAML explicit variant mapping and degree curve, strict VQ_FIELDS validation; preserve every legacy preset via automated extraction.
Need inspect parse application boundary before choosing collector propagation; no candidate edits yet.

Red regression: test/affect-presets.test.ts has three expected failures (missing YAML, no field validation, no compile collector emission). Legacy numeric snapshot saved.
Migration script scripts/migrate-affect-presets.mjs failed before writing on neutral object spread; active Rule 0 repair.
Durable global initializer-shape guard appended to C:\Users\Q\.codex\AGENTS.md; immediate repair still pending.
Raw cause: affect.ts line94 spreads NEUTRAL_DIMENSIONS; direction-track.ts lines98-102 defines frozen valence/arousal/dominance zeros.
Next: support only that verified spread in extractor, verify guard and successful migration, then resume loader implementation.

Extractor repair complete: validated_presets=31, migrated_presets=31; both global guards verified; repo AGENTS unchanged.
Created public/rules/affect/presets.yaml preserving values/citations with declared variant map and degree points.
Added src/input/affect-presets.ts parser and curve evaluator; validates VQ_FIELDS, dimensions, duplicates, citations, variants, points.
Created scripts/refactor-affect.mjs (NOT RUN); immediate next read must inspect this new file before further work.
Next: execute refactor, connect parse.ts collector, green regressions and policy mutation tests; static/full gates and PR remain.

Production affect.ts now uses AFFECT_LIBRARY, declared variants and affectDegree, emits degree/application records; parse.ts passes shared collector.
Focused affect-presets.test.ts green (4 tests), unchanged legacy digest preserved. YAML neutral empty map repaired to {}.
Global EOF/empty-map serialization guards installed and verified after migration defects; immediate tests passed.
Added affect-policy.test.ts for malformed documents and alternate curve/variant policies, not yet run. Two temporary migration scripts remain in worktree.
Next: finish provenance DAG propagation/estimate handling, run focused/static gates, inspect full gate prerequisites and CI, commit and open PR with Closes #32.

CI npm run typecheck passed before latest estimate metadata changes; config includes src/test/scripts.
Added red engineering-estimate regression; implemented engineeringEstimate boolean on three annotated YAML presets and uncited degree/estimate records.
CompiledAffect now exposes application decision plus decisions array; shared collector forwarded from parse.ts. Need parent link from Direction to application.
Verified reusable diagnostic log: C:\Users\Q\AppData\Local\Temp\tmpklmvva.tmp (empty, inspected).
Next: format changed files, run full focused input/affect tests and typecheck; remove own temporary scripts; commit, PR, exact-head CI. No PR yet.

Focused six-file affect/input suite now green: 50 tests. Added provenance initially displaced direct parent; fixed by retaining original plus new application parent.
Repository guard committed standalone as a77fe89f94a12d898295ffb01996cac7bbcc17a2 (AGENTS.md only); guard and focused repair verified.
Biome check --write processed five changed TS files. Latest typecheck still needed after estimate metadata edits.
Two own temporary scripts verified untracked with ls-files --error-unmatch and targeted status; ready for removal as task cleanup.
Next: remove temporary scripts, final static/diff review, commit product files, fetch base and publish PR with Closes #32; CI full gate on head.

PR created: https://github.com/ctoth/Qlatt/pull/125 (open, no merge authority). Product commit 37d77bc2; standalone guard commit a77fe89f.
Final worktree status worktree_changes=0; base freshly fetched unchanged d6432b67cd512c68b3f99d47a93046d0d5cf320a.
Focused six-file suite and final npm run typecheck passed; Biome formatted checked files; full WASM/test gate delegated to exact-head CI.
PR body file C:\Users\Q\AppData\Local\Temp\tmp5awd33.tmp contains Closes #32. Must verify remote canonical body, ownership, head and checks.
Next: bounded CI inventory and wait for full gate, fixing only issue failures; final link and concise raw verification. Temporary scripts removed.

Completed authorized delivery: PR https://github.com/ctoth/Qlatt/pull/125 remains open; no merge requested or performed.
Exact-head quality CI SUCCESS/COMPLETED on 37d77bc26e716fbf2be8ba16683e712b16b8791a (run 34174885878).
Canonical PR body equality True; Closes #32 True; isCrossRepository false.
Local focused suite, typecheck, Biome and whitespace gates passed; full CI covered WASM build and npm test.
Worktree C:\Users\Q\code\Qlatt-issue-32; product and standalone AGENTS guard commits pushed; no further work required.
