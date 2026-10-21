# Goal

Retain diagnostic locations for maps, string_sets, tags and frame_programs in one batch. Estimate: 45–65 production and 70–95 existing fixture lines.

# State

Started from PR411 final 575f5c19; that prerequisite merged as bda4899e. Implemented all four root captures, unchanged-path retention, exact maps/tags shadow source selection and explicit value/key classification. Existing fixtures cover array elements, frame expression leaves including frame_ms, structural output-column keys, macro ancestry and inherited/overridden map/tag locations. All seven initial hosted checks passed. No local CI.

# Decisions and why

These roots preserve their authored paths through parsing and keyed include merging. Shadowed includes inherit maps/tags only; preserve that exact behavior. Frame expression leaves use value coordinates while structural codes retain key coordinates. String-set array elements explicitly use value coordinates. Do not infer indices for phase concatenation, topology deduplication or frame-rule effects; no generic missing-key fallback or new diagnostic field.

Accepted Claude's full review of 5f611ccb: no defects. Supervisor independently verified source and completed the review gate. This response changes only the note and corrects the PR dependency wording.

# Surprises

Other agents own rulepack acquisition entrypoints. This slice owns only metadata capture/composition, diagnostic location selection and existing fixtures; preserve other edits.

# Next step

Await final-head hosted CI and supervisor merge. Start separately approved frame-set/multi-point source mapping in its own worktree. Keep #224 open.
