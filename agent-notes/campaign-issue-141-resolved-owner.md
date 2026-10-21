# Goal

Consolidate frontend acquisition in the existing rule-pack owner, pass resolved
resources into transcription, and freeze the resolved plain resource graph (#141).

# State

Isolated from #431 final efd9f220, then fast-forwarded to merged c2ba906d,
including #430 read-error preservation. Acquisition moved (557 lines), resource
freezing and combined entry points added; caller/fixture adaptation complete.
Published PR #433 at 9e9ad567; Claude full-PR review is running. GitHub reported
a conflict against #429, so CI did not start. Integrated master 36953f15, retaining
its foreach error-source implementation and fixture while selecting the relocated
owner imports in the single fixture import conflict. No local CI.
Hosted quality job 119207856330 reported import ordering/formatting after the
relocation: merged import blocks retained their insertion order. Corrected the
task-owned import blocks and type-only import, then the remaining seven exact
style diagnostics in job 119208683975; no local formatter/CI run.
Claude completed the full initial 72-file review (9e9ad567 against c2ba906d).
Implementer verified and corrected both fixture findings; supervisor gate pending.

# Decisions and why

Smallest approved scope: 180–280 changed production lines plus 550–620 moved
acquisition lines, import adapters and 80–140 existing fixture lines. Move the
existing inventory/resource caches and loaders into rule-pack.ts; inventory keeps
parsing and materialization. Preserve compile-only entry points and error causes.
Combined sync/async resolution prepares resources and declared/default/selected
voices. Later arbitrary voices use the same owner. Transcription requires resolved
resources and retains explicit overrides and dictionary lookup behavior.
Convert affect lookup Maps to null-prototype records with own-key lookup so the
existing recursive freeze can cover parsed plain data without a new map framework.
Inspect mutation consumers and clone task-owned fixture inputs where necessary.
No new cache, resolver, manifest or protocol. URL identity #248 and discovery #76
remain separate; this does not claim all #141 acceptance is complete.

# Surprises

Acquisition imports span 60 named-import sites plus namespace mocks. Existing
rate, voice, contour, speaker-profile and inventory fixtures intercepted the old
separate loaders; they now intercept the combined resolver. The Unicode
transcription fixture directly supplies its alternate inventory instead of mocking
acquisition. Existing mutation fixtures already clone cached inventory/LTS/stress
data or parse fresh YAML; production pronunciation/parser loops build separate
outputs. Affect lookup records retain prototype-like names with own-key access.
The browser resource fixture now exercises complete async rulepack/resource/voice
preparation, sync reuse and immutable nested cache values. Temporary migration
inspection script removed.
Review response: the dynamic imports in load-absence-browser still selected the
removed inventory exports; switched them to its existing rulePack namespace.
The supplied affect-library fixture still spread the former Map; it now extends
the record into a null-prototype object. Removed the newly added transcription
spy fixture that merely mirrored the deleted acquisition call. No runtime
correctness finding was reported; no new guard or compatibility shim added.
Hosted quality on the review-response head found one remaining fixture conversion:
the preset citation assertion still used Map iteration (TS2488 at input.test.ts:402).
It now uses Object.entries on the selected preset record, preserving the assertion.
The runtime shard then exposed a separate fake-browser setup error for Beauty:
the fixture served only prefixed URLs, but extends resolves its parent ID to the
existing bundled path. Serve the manifest documents at that path too, with the
same rewritten body so runtime resources remain isolated under the fixture prefix.
The failure was E_YAML_PATH_UNKNOWN for qlatt-english/frontend.yaml; production
inheritance and resource resolution are unchanged.

# Next step

Await replacement hosted CI after the fixture correction. Claude review and its
implementer response are complete; the supervisor independently checked the range.
Supervisor owns final review/merge. #141 acceptance checks and URL/discovery work
remain outstanding; this delivery does not close the issue.
