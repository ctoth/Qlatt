# Declarative F0 And Structural Templates - 2026-05-27

Hypothesis:
- Qlatt's prosody and stop-expansion rules can become more declarative by moving repeated point and splice shapes into first-class rule constructs.

Branch:
- `beautify-declarative-f0-structural-templates`

Integration branch:
- `master`

Target architecture:
- Qlatt prosody uses a model-level F0 contour/layer surface instead of encoding the intonation model only as many individual point rules.
- Structural stop expansion uses reusable inventory-backed segment templates instead of repeating the same inserted-token field list in every stop-release rule.

Forbidden surfaces:
- New compatibility aliases that keep old and new rule shapes as parallel production paths.
- Hand-copied stop-release inserted-token fields where a reusable structural template owns the same shape.
- Qlatt-only imperative F0 postprocessing when the frontend can name the F0 model declaratively.

Evidence commands or metric gates:
- `npm run typecheck:core`
- Focused Vitest tests for declarative frontend rulepack, splice, point/layer, and Qlatt TTS behavior.
- Search gates for repeated stop-release inserted-token field clusters and Qlatt F0 point-only model declarations.

Outcome:
- Kept.
- Added `insert_points` for multi-target contour rules.
- Added `insert_points_order: by_point` so combined contour rules preserve the old phase-wise point ordering.
- Collapsed Qlatt paired ToBI accent rules into single contour rules while preserving locked snapshot and golden metrics.
- Added inventory-backed `segment` splice templates and migrated Qlatt stop release/aspiration expansion to them.
- Preserved the old stop-token production surface by defaulting `segment` to phoneme/type/duration/inherentDuration/params/inventorySW only.

Decision:
- Keep the branch changes.
- Do not update golden artifacts; final behavior matched the existing locked snapshot and summary gates.
- `npm run typecheck:core` remains blocked by existing errors in untouched files:
  - `src/klatt-runtime.ts(181,59)` TS2359
  - `src/track-analysis.ts(95,35)`, `(98,35)`, `(101,35)`, `(145,67)`, `(146,70)`, `(147,67)`, `(148,67)` bigint/number errors.

Why:
- The current repo already contains an F0 layer command path for DECtalk. Qlatt can reuse the same owner surface instead of keeping prosody as point-only YAML.
- The kept Qlatt F0 change is a contour-rule surface over the existing point renderer, not a renderer replacement. That preserved current audio metrics while making tone pairs declarative.
- Stop expansion now names the inventory segment target and local overrides directly, instead of retyping the same inserted-token fields in each stop rule.

Kept commits:
- `f864bfc7` Normalize plural F0 point inserts
- `c27a1a97` Apply plural F0 point inserts
- `184b511f` Validate plural F0 point inserts
- `33f671df` Cover plural F0 point inserts
- `b0e0ba4c` Collapse Qlatt ToBI accent contours
- `bd72a787` Add inventory segment splice templates
- `be1e67a9` Cover inventory segment splice templates
- `ef63418b` Use numeric segment template override in test
- `d80ca354` Use segment templates for stop expansion
- `018e7d6b` Preserve segment template token surface
- `b3ab9abc` Assert behavior-preserving segment defaults
- `7a88c71b` Support phased contour point insertion
- `378d96eb` Cover phased contour point insertion
- `7d758bcc` Preserve ToBI contour point ordering
- `e943eaac` Keep phased contour test stream contiguous
- `dc474708` Match phased point cursor semantics

Final evidence:
- Pass: `npm run test -- test/declarative-frontend-point-actions.test.ts test/tts-frontend-snapshot.test.ts test/tts-frontend-declarative-golden-summary.test.ts`
- Pass: `npm run test` (125 files, 1114 tests)
- Fail, unrelated touched-scope check: `npm run typecheck:core` with the errors listed above.
- Search gates passed:
  - no `tobi_accent_*_peak`/`*_tail` deleted paired-rule references remained in Qlatt pipeline/prosody for the collapsed rules;
  - no `define_high_anchor_from_prev` stale YAML alias remained;
  - no old stop-release `phoneme: rel, stress:` / `type: rel_target.type` / `stress_value` snippets remained in Qlatt structural rules.
