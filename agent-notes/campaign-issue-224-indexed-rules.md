# Goal
Locate unchanged-index apply/dispatch diagnostics in authored YAML. Smallest scope: about 45–70 production and 40–60 existing-test lines. Expanded templates remain unmapped.

# State
Started from origin/master ad91bc80. Implemented unchanged-index apply span retention, composed expansion exclusion and bracket-path diagnostic matching. Existing sync/async composition fixture now exercises indexed syntax, semantic and unknown-field locations. Existing inheritance fixture verifies actual bundled foreach/for_each_field rules omit numeric spans while retaining direct locations. No local CI run.

# Decisions and why
Retain numeric authored paths only below rules.<name>.apply. At compiled handoff, omit indexed apply spans if the composed apply array contains foreach or for_each_field expansion. Read actual composed directive objects so aliases cannot conceal expansion. Other direct rule locations remain available. Match typed numeric paths using bracket notation; omit ambiguous authored string keys. Semantic expression paths use values, structural field errors use keys.

# Surprises
Hosted shard3 job 119124009690 failed four assertions because I checked only the first line of a multiline CEL diagnostic. The CEL dependency returns "Unknown variable: curent" followed by a source highlight; assertValidSpec appends the location after that full message. A standalone dependency-message probe confirmed the newline shape. Changed the existing assertion to inspect a complete diagnostic block, preserving the exact authored-coordinate expectation. Production unchanged; no local CI run.
Hosted quality job 119122685812 reported formatter wrapping in the existing test file. Applied the exact requested predicate/assertion layout; production unchanged, no local CI run. Other agents are active; preserve their edits.

# Next step
Publish for hosted CI and Claude review. Full #224 remains open.
