# Goal
Join committed rule decisions to authored rule declarations in explain text and JSON. Smallest change: about 35–50 production lines, 30–45 existing-test lines and two documentation lines, using existing journal IDs and the compiled rule span index.

# State
Started from origin/master 8a5d86b5. Implemented the declaration-only journal join in the CLI, filtered to displayed/ancestry decisions. Text appends resource:line:column; JSON tooling.ruleSources carries the existing serializable span. Extended the existing hello-world ancestry tests to cover text/JSON, unchanged decision records, replay and absent inventory locations. No local CI run.

# Decisions and why
The journal's metadata.ruleId and decisionIds identify ordinary rule writes. Match only exact authored ['rules', ruleId] declarations; do not attribute a multi-rule frame transaction to every fired rule. Put locations beside decisions in the tooling payload, never in DecisionRecord or replay data. Missing declarations remain absent. This covers declaration locations, not literal origins or macro ancestry.

# Surprises
None. Other agents are active; preserve their changes.

# Next step
Publish for hosted CI and Claude review. Keep #224 open.
