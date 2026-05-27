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
- In progress.

Decision:
- In progress.

Why:
- The current repo already contains an F0 layer command path for DECtalk. Qlatt can reuse the same owner surface instead of keeping prosody as point-only YAML.
