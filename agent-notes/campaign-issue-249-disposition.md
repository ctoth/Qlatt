# Goal

Record Q's #249 disposition and #167 override boundary without implementing them.

# State

Written from base c58c6cdd: approximately 160-line decision matrix plus proposal
status links. Own docs/frontend-model-decisions.md, status paragraphs in
docs/frontend-document-model.md and docs/language-package.md, and this note.
Main checkout's dirty documents are outside this worktree and remain untouched.

# Decisions and why

Smallest delivery: roughly 150–220 documentation lines covering adopted versus
proposed scope, current-source evidence, compatibility and implementation owners.
Q adopted schema-as-data, generic references, universal language ownership and
keyed inventory/policy overrides with whole ordered-resource replacement.
One effective variety per request follows #167; later command-driven variety
switching is outside this delivery. No runtime code, format, gate or new issue.
Existing source was read before making claims; audit revision is recorded in
the decision document. Source paths and line ranges refer to that revision.

# Surprises

Claude review of PR #332 found three documentation corrections. I treated
whole-resource replacement as excluding #169's separately declared shared then
variety ordering; the contract instead replaces the selected variety resource
whole while preserving shared resource order. I also named the programmatic
compile helper without the two shipped loading paths, and overstated one source
range (frontend-vocabulary ends at line 55). Corrected those statements and added
#169 to issue synchronization. No runtime change or additional adoption.

DECtalk's shared stress/morphology paths are required by the loader but its
compiled-table pronouncer returns before those execution steps. Preserve its
fidelity behavior when resource requirements move to the selected kernel.

# Next step

Push the bundled review response for PR #332 and read replacement CI. No local CI.
Supervisor handles final review, issue synchronization
and merge; documentation does not claim runtime work or all of #249 complete.
