# Goal
Complete the #212 Direction Track policy design audit without changing input semantics.

# State
Approved documentation-only task, isolated from origin/master 7fe84a77. Read actual parser, frontend rate routing, duration rules, HRG affect composition/projection, VQ schema/data, and existing input fixtures.
Authored the audit with code/data locations, conditional arithmetic examples, explicit DECtalk and clock limits, ownership table, algebra/default inventory, direct parent edges, and bounded follow-up acceptance. No changed-behavior choice was specified.

# Decisions and why
Smallest delivery: one 120–180-line source-grounded audit plus this task note. Preserve distinct global frontend-rate and local Affect duration scopes as the compatibility baseline. Document engineering algebra and existing configured citations without claiming paper verification. List bounded implementation follow-ups under #46; do not mark them delivered or change speech policy.

# Surprises
DECtalk routes normalized rate through its words-per-minute mapping and sets the generic duration/F0/transition rate to one. Direction Track emphasis/break are authored records, not proof of an implemented acoustic mapping.

# Next step
Publish for hosted CI and private Claude review/response; supervisor owns merge and issue bookkeeping. No local CI run.
