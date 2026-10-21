# Goal

Pass selected LTS data into number normalization and remove its implicit acquisition (#141).

# State

Fresh isolated branch from origin/master after #392. Implementation complete:
56 production additions / 51 removals; 63 existing fixture additions / 5 removals.
Source, actual callers and final owned diff inspected. Publishing for hosted CI.

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

# Next step

Await hosted CI and Claude; respond to actual findings.
Supervisor owns review and merge; #141 remains open.
