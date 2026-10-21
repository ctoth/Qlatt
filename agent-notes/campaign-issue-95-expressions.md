# Goal
Add #95's bounded compiled rule-expression display to explain --why using the existing committed decision-to-rule join.

# State
PR #404 on isolated base 8203114c. Initial hosted checks passed. Claude found that the three-field projection omitted actual rule definitions and effects; response implemented below. No local CI. Other agents own unrelated work; preserve it.

# Decisions and why
Smallest change: about 25–40 production lines, 30–45 existing fixture lines and 3–5 documentation lines. Include decision-keyed ruleExpressions with ruleId, the full compiled rule and its referenced compiled pattern only for --why, using actual transaction metadata and selected decision IDs. Reuse the already loaded rulepack; no evaluator, source reload, new join or provenance fields.

Label normalized/expanded expressions as compiled, separate from authored source locations. A whole compiled apply block does not identify the selected dispatch branch or imply every literal contributed to the decision. Keep inventory-only mappings empty and preserve existing compact/verbose selection.

# Surprises
Existing ruleSources already joins committed IDs to declared rules and deliberately excludes synthetic frame-program IDs. Preserve that scope rather than inventing source associations.

Review response: the selective projection was the cause. duration_floor_from_inventory (duration.yaml19–33) needs its define bindings basis/model/stress_scale; palatalization_dy (postlexical.yaml231 onward, scheduled by pipeline.yaml479) uses match/define/splice and its named pattern at postlexical.yaml3. Replaced field selection with the full existing compiled entry plus referenced pattern; no evaluator or provenance changes. The existing ancestry fixture now covers the actual duration rule and cross-word D/Y palatalization on “Did you see the red car?”, including define/splice/pattern presence. Whole-definition labeling does not claim which branch executed or which literal contributed. Implementer accepts and addresses the finding.

# Next step
Read replacement hosted CI and supervisor verification of the review response. The existing ancestry fixture compares displayed expressions against the loaded compiled rule, verifies selected decision membership and authored rule identity, and checks text output. Inventory-only and non-why expression mappings remain empty. Full #95 remains open for its other bullets. No local CI gate or self-merge.
