# Goal

Pass selected LTS data into number normalization and remove its implicit acquisition (#141).

# State

Fresh isolated branch from origin/master after #392. Implementation complete:
56 production additions / 51 removals; 63 existing fixture additions / 5 removals.
PR #396 published; initial-head hosted CI passed. Source, actual callers and
owned diff inspected. Claude completed its two-pass review.

# Decisions and why

Smallest approved change: 60–90 production additions / 35–55 removals plus existing
fixtures. Thread optional LtsContext through existing engine/source options; only
number_phonemes requires it. Existing resource owner decodes JSON/YAML using its
cache. Delete the final private document cache; key the existing character-map
cache by character-array identity. Preserve arithmetic and selected-path provenance.
Public TTS and probe scripts acquire resources; data-only map consumers remain valid.
No new cache, framework, loader, guard or local CI.

# Surprises

The removed helper's null-document assertion now inspects the existing resource
owner's error cause. Tests retain JSON/YAML value and identity coverage, and add
consumer-only missing data, same-path character-array overrides, and selected-path
provenance. Existing public normalization fixtures cover money and dates.
Other agents' files and branches remain untouched. No local CI ran.
Accepted Claude's diagnostic wording finding: I retained the old missing-path
message after changing the condition to missing context. The selected DECtalk
frontend does declare a path. Corrected the message to name the unsupplied context
and tightened the existing assertion; routing and E_NUMBER_PHONEMES are unchanged.

# Next step

Await final-head hosted CI and supervisor verification of the review response.
Supervisor owns review and merge; #141 remains open.
