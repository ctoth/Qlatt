# Goal

Carry authored relation locations through composition and validation, including scalar floor fallback expressions. Estimate: 15–25 production and 40–55 existing fixture lines.

# State

Started from PR410 final 7259b6a8; that prerequisite has merged. Implemented relation source capture, whole-name shadow selection and fallback-expression classification. Existing fixtures check error coordinates and child/base source selection. Six initial hosted checks passed; quality job119161540313 requested one if-condition formatting change, applied exactly. No local CI; replacement hosted validation pending.

# Decisions and why

Reuse the existing document side metadata. Shadowed includes replace relations by whole name, like predicates; source metadata must select the same winner. Preserve authored scalar paths and classify only floor_fallback.value as an expression. Do not add macro expansion, missing-key fallback or runtime machinery.

Accepted Claude's full four-file review through 8b0e7fef: no defects. The additional negative-assertion suggestion is an observation, not a demonstrated failure; no new guard requested. This response changes only the task note.

# Surprises

Other agents own separate changes; preserve those during integration.

# Next step

Await final-head hosted CI and supervisor merge. Start the separately approved four-root metadata slice in its own worktree. Keep #224 open.
