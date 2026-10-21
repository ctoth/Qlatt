# Goal

Move compile-time and runtime voice YAML acquisition into the existing resource owner (#141).

# State

Fresh branch from 5c18e8d1. Implementation complete: 126 production additions /
37 removals, 113 existing fixture additions / 20 removals. Source, real callers
and owned diff inspected. PR #402 published; Claude completed its review with no
correctness defects; supervisor independently checked the final delta. Accepted
the review; no speculative changes. No local CI ran.

# Decisions and why

Approved estimate: 100–140 production additions / 30–45 removals plus 70–110
existing fixture lines. Runtime consumes one explicit selected document; compile
policy consumes default/registered documents. Owner helpers use the existing
FRONTEND_ASSET_CACHE, accept raw programmatic specs without full resource validation,
and use async acquisition for async compilation. Preserve no-rule-field returns,
invalid-policy diagnostics and open-registry requested names. No loader callbacks
inside pure consumers, new cache, framework or local CI.

# Surprises

The existing registry/policy preconditions now have a pure shared helper so invalid
policy errors still precede acquisition. Existing name validation is likewise
shared by the owner and consumer, preserving open registries and unknown-name errors.
The template-path agent confirmed its parseComposedRulepack observer addition is
independent of this explicit document argument; its observer body is untouched.
Other agents' changes are preserved. Voice YAML parsing/IO is removed entirely
from dectalk-voice; broader resource closure and aliases remain unfinished #141.
Hosted quality job119144833347 reported imported-name ordering in inventory.ts
and one fixture call wrap. Applied those exact formatter corrections; no behavior change.
Integrated origin/master after #400. The actual composition-helper conflict is
resolved with #400's macro and template-path observers plus this branch's explicit
voice documents. Its authored/compiled path mapping and related tests are retained.

# Next step

Await final integration CI and supervisor verification of the conflict resolution.
Supervisor owns merge; #141 remains open.
