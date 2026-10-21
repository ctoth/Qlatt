# Goal
Complete the #212 Direction Track policy design audit without changing input semantics.

# State
Approved documentation-only task, isolated from origin/master 7fe84a77. Read actual parser, frontend rate routing, duration rules, HRG affect composition/projection, VQ schema/data, and existing input fixtures.
Authored the audit with code/data locations, conditional arithmetic examples, explicit DECtalk and clock limits, ownership table, algebra/default inventory, direct parent edges, and bounded follow-up acceptance. No changed-behavior choice was specified.
Accepted Claude's full two-file, two-pass review in session 35cbc391-b74e-4419-977c-c5e43faff72d. Corrected the reversed parent wording and two source line references after checking production; corrected the actual speech_rate_scaling rule name as independently requested by the supervisor. Review gate completed before findings were relayed. Claude verified conditional arithmetic, DECtalk routing, vocabulary/algebra and scope; no runtime changes or local CI.

# Decisions and why
Smallest delivery: one 120–180-line source-grounded audit plus this task note. Preserve distinct global frontend-rate and local Affect duration scopes as the compatibility baseline. Document engineering algebra and existing configured citations without claiming paper verification. List bounded implementation follow-ups under #46; do not mark them delivered or change speech policy.

# Surprises
DECtalk routes normalized rate through its words-per-minute mapping and sets the generic duration/F0/transition rate to one. Direction Track emphasis/break are authored records, not proof of an implemented acoustic mapping.

# Next step
Await final-head hosted CI and supervisor audit/merge. Supervisor owns #212 closure and #46 follow-up bookkeeping; no residual implementation is marked complete here.
