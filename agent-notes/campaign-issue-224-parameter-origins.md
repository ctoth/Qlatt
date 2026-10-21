# Goal

Preserve authored root parameter locations through existing extends/include composition and expose them on the compiled rulepack. Smallest scope: about 75–105 production lines and 65–95 existing-test lines; no values, compiler or evaluation changes.

# State

Started from origin/master 23842f685735a3664315d1707667984e164fe97d after the YAML document-span loader merged. Root parameter locations are currently lost at composition clones.

# Decisions and why

Reuse immutable YamlNodeSpans with their original resource, role and source paths. Select winning child/base entries using the existing object-merge and array/scalar-replacement semantics, carry them through include clones and both compiled handoffs. Remove authored origins beneath the accent subtree that the loader replaces. Voice fields have no authored root origin. The accessor covers authored root parameters only; generated values, include rules/maps and macro source propagation remain separate #224 work.

# Surprises

None yet. Other agents are active; only rule-pack.ts, the existing extends test and this note belong to this task.

# Next step

Implemented the immutable authored-parameter accessor, merge selection, include-clone preservation and both compiled handoffs. Existing extends tests cover actual Beauty/base locations, sync/async child overrides, array/scalar replacement and generated accent/voice exclusions. No local tests or CI run. Publish for hosted CI and Claude review; #224 remains open.
