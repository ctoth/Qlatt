# Goal

Retain pattern expression and option locations in the existing diagnostic side metadata. Estimate: 8–15 production and 35–50 existing fixture lines.

# State

Started from PR407 final 0cc1e671; that prerequisite has merged. Implemented six added production lines and extended the existing fixture with semantic/syntax expression coordinates, macro ancestry and an option-key control. Six initial hosted checks passed; quality job119157119892 requested one callback formatting correction, applied exactly. No local CI; replacement hosted validation pending.

# Decisions and why

Pattern normalization preserves sequence indices and condition paths. Reuse existing source capture, macro ancestry and condition classification. Includes merge pattern names; root extends preserves winning leaf origins. A shadowing include does not inherit base patterns, and that contract remains unchanged. Missing-key sequence-node diagnostics remain outside this slice; no blanket location fallback.

Accepted Claude's full four-file review through 93053051: no actionable defects. Normalization, authored indices, key/value selection, shadowing and macro ancestry were reviewed. This response changes only the note; supervisor reconciles the current PR base and completes the review gate.

# Surprises

Other agents own separate signature changes; preserve their edits during integration.

# Next step

Await final-head hosted CI and supervisor merge. Begin the separately approved relation-location slice in its own worktree. Keep #224 open.
