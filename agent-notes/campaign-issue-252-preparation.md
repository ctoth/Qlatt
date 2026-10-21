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
Claude completed its review of all 37 original PR files at 83e3cef2. Root
independently checked the pinned Bacon API sources unavailable to that reviewer.
Accepted the unmigrated realize_each fixture and registry-attribution findings:
child registry source overlays now follow only the primitive entries actually
merged. Added generated-rule location assertions to the existing YAML fixture.
Removed two immediately overwritten test assignments. Hosted formatting/import
findings are applied through the editing tool; no local formatter or CI run.
The logger observation does not justify a new preparation logger API: existing
errors and supplied diagnostics remain. No real nonfinite-default producer was
identified; runtime invalid-value coverage remains. Repeated span reads use the
existing WeakMap and need no new mechanism. The dump's dependency report remains
meaningful for explicit prior-input reads after the dependency correction.
Initial red CI is acknowledged, not treated as completed verification. Source
and test corrections are receiving new hosted checks after normal master merges.

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
The three-generation replacement-graph fixture now uses a minimal coherent root
through its existing document map, rather than inheriting unrelated formant rules
whose input declarations came from the graph macro it deliberately replaces.
Stevens91 now intentionally rejects before host allocation: inherited fricA7–10
and fricA7Linear–10Linear reference A7–10/a7Linear–10Linear absent from its
cascade-only upper bank. Root checked and approved exact rejection coverage;
the manifest report stays nonzero and documentation names the unsupported entry.
Existing authored-bank and inherited-PLSTEP unit coverage remains with mock data,
not an unchecked runtime path. No model formulas, dummy controls, or pruning added.
#252 and #254 remain open; the latter owns the separate model repair.
Hosted quality at 808f62ed exposed seven remaining format/import errors,
including diagnostics omitted from the prior log. Applied their exact emitted
edits; the audit is clear. Runtime checks and final typecheck remain pending.
The next hosted run passed formatting and found three typecheck causes: a stale
dump console variable, a catch branch whose throwing helper did not establish
definite assignment, and mocked loader results missing prepared metadata. Fixed
the output label, made the throwing branch explicitly return, and updated both
existing mocks with plain source/unreachable fields; no behavior expansion.

# Next step

Push scoped hosted-failure corrections and finish Claude review/response.
Root owns independent review gate and normal merge. Historical model failures,
if exposed by validation, must be reported with evidence before expanding scope.
