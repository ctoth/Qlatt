# Goal
Add #95's bounded compiled rule-expression display to explain --why using the existing committed decision-to-rule join.

# State
Approved implementation on isolated base 8203114c is complete: 25 production lines and 25 existing-test lines plus documentation. No local CI. Other agents own unrelated work; preserve it.

# Decisions and why
Smallest change: about 25–40 production lines, 30–45 existing fixture lines and 3–5 documentation lines. Include decision-keyed ruleExpressions with ruleId and compiled select/constraint/apply only for --why, using actual transaction metadata and selected decision IDs. Reuse the already loaded rulepack; no evaluator, source reload, new join or provenance fields.

Label normalized/expanded expressions as compiled, separate from authored source locations. A whole compiled apply block does not identify the selected dispatch branch or imply every literal contributed to the decision. Keep inventory-only mappings empty and preserve existing compact/verbose selection.

# Surprises
Existing ruleSources already joins committed IDs to declared rules and deliberately excludes synthetic frame-program IDs. Preserve that scope rather than inventing source associations.

# Next step
Publish for hosted CI and supervisor-owned Claude review. The existing ancestry fixture compares displayed expressions against the loaded compiled rule, verifies selected decision membership and authored rule identity, and checks text output. Inventory-only and non-why expression mappings remain empty. Full #95 remains open for its other bullets. No local CI gate or self-merge.
