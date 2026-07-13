# Chunk 1.1 coder notes

2026-05-24: Starting chunk 1.1 — add 3 predicates (prev_is_voiced, prev_is_voiceless, next_diff_word), rewrite prosody.yaml:642-672 and postlexical palatalization pattern steps.

Branch: declarative-cleanup. HEAD: fb59b72a.

Status checkpoint (mid-task):
- Added 3 predicates to pipeline.yaml (prev_is_voiced, prev_is_voiceless, next_diff_word).
- Rewrote prosody.yaml f0_voiceless_onset_perturbation and f0_voiced_onset_perturbation to all-blocks with predicates.
- Rewrote postlexical.yaml palatalization_dy_pattern and palatalization_ty_pattern to all-blocks with next_diff_word predicate.
- Truth-table walked all rewrites — semantics preserved.

Verification done so far:
- rulepack-context: 48/48 pass.
- declarative-frontend: 171 pass / 2 fail (slice.test.ts) — matches pre-existing baseline expected per prompt.

Verification complete:
- 3 greps all zero matches.
- Golden tests: exit 1, only lf-source-wasm-compare failed at rmsError 0.32504812... <= 0.326 (locked baseline). Resonator/antiresonator within tolerance.
- (Earlier `EXIT: 0` was tail's exit, not npm's — verified by redirecting to log file first.)

Committed: c219a8f8 (pathspec-only, 3 files / +23 / -18). Nothing else was staged at commit time (confirmed via empty `git diff --cached --name-status`).

TODO: write reports/chunk-1.1-coder.md.
