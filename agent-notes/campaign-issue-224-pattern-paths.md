# Goal

Retain pattern expression and option locations in the existing diagnostic side metadata. Estimate: 8–15 production and 35–50 existing fixture lines.

# State

Started from PR407 final 0cc1e671; that prerequisite has merged. Implemented six added production lines and extended the existing fixture with semantic/syntax expression coordinates, macro ancestry and an option-key control. Six initial hosted checks passed; quality job119157119892 requested one callback formatting correction, applied exactly. No local CI; replacement hosted validation pending.

# Decisions and why

Pattern normalization preserves sequence indices and condition paths. Reuse existing source capture, macro ancestry and condition classification. Includes merge pattern names; root extends preserves winning leaf origins. A shadowing include does not inherit base patterns, and that contract remains unchanged. Missing-key sequence-node diagnostics remain outside this slice; no blanket location fallback.

# Surprises

Other agents own separate signature changes; preserve their edits during integration.

# Next step

Publish stacked on #407 for hosted CI; supervisor reviews the slice after that prerequisite merges. Respond to Claude findings. Keep #224 open.
