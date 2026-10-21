# Goal

Carry authored relation locations through composition and validation, including scalar floor fallback expressions. Estimate: 15–25 production and 40–55 existing fixture lines.

# State

Started from PR410 final 7259b6a8; supervisor sequences its merge. Implemented relation source capture, whole-name shadow selection and fallback-expression classification. Existing fixtures check error coordinates and child/base source selection. No local CI; hosted validation pending.

# Decisions and why

Reuse the existing document side metadata. Shadowed includes replace relations by whole name, like predicates; source metadata must select the same winner. Preserve authored scalar paths and classify only floor_fallback.value as an expression. Do not add macro expansion, missing-key fallback or runtime machinery.

# Surprises

Other agents own separate changes; preserve those during integration.

# Next step

Publish stacked on #410 for hosted CI; supervisor reviews after prerequisite merge. Respond to Claude review. Keep #224 open.
