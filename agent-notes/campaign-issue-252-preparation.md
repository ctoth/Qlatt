# Goal

Implement #252 checked backend preparation using Bacon's structural validator,
before host allocation, with explicit prepared plain configuration input.

# State

Started from c7412517 in an isolated worktree. Source/caller/fixture audit complete;
implementation completed for first hosted verification. No local CI. All runtime
callers now pass prepared config; test callers explicitly prepare through a small
shared fixture adapter. Manifest, macro endpoint, isolation, semantic dependency
and source-owner regressions added. Integrated master 3927be2b. The sole conflict
was the named-port fixture: retained both new connections and all selection-reason
expectations from #440, with this branch's explicit preparation helper.
PR #443 is open. Claude reviews the full initial range in session 52843,
transcript 6fac53b6-0f07-49a9-92c3-100000000443. Hosted verification found the
copied Bacon lock's vulnerable AJV/fast-uri versions; updated compatible lock
records to 8.20.0/3.1.9 using published registry integrity values.

# Decisions and why

Smallest coherent scope: sole owner clones, expands existing macros, validates
Bacon graph/registry and Qlatt expressions/bindings/dependencies, then returns
plain graph/registry/semantics with serializable source attribution. Preserve
source spans through existing expansion and composition. Runtime requires config;
remove independent runtime/vocabulary expansion. Preserve specialized diagnostics,
dynamic invalid-input reporting and all intended wiring; report unreachable rules
without pruning. Pin merged Bacon 394603ae with apply_patch-only lock edits.
Estimate 340–520 production lines, 250–380 fixture lines, about 100 lock lines
and 35–50 mechanical harness lines. No new cache, flag, brand or envelope.
#248 portable identity remains separate; do not claim its relocation acceptance.

# Surprises

Existing fixtures intentionally accept invalid static graphs/functions. Move those
assertions to preparation rejection while preserving actual host failure tests.
Two scripts expanded already-loaded data; they now consume prepared data directly.
The realize-map dump reports one honestly labeled prepared map. Existing dynamic
failure fixtures now use registered sqrt with invalid input, preserving runtime
error behavior while unknown functions are rejected by preparation.
The initial dependency checker wrongly interpreted input names as mandatory
same-name realization dependencies. Baseline effortVoiced explicitly reads input
F0/AV/AVS before their realization. Preserve authored dependency lists and infer
only unambiguous realization references; retain required intermediate checks.
The existing realize_each loader fixture also needed declared Bacon documents,
its A2–A5 inputs, and prepared realization-object expectations.

# Next step

Push scoped hosted-failure corrections and finish Claude review/response.
Root owns independent review gate and normal merge. Historical model failures,
if exposed by validation, must be reported with evidence before expanding scope.
