# Goal
Retire obsolete YAML migration commands and migrate the live DECtalk table exporter (#224).

# State
Based on master 26cd673d. Approved smallest scope: delete the two obsolete scripts (about 400 lines), change the live exporter reader/flow serializer (8–12 lines), and this note. No local CI, new tests or regeneration.

# Decisions and why
extract-pipeline.ts and split-rules.ts both require the removed public/rules/frontend.yaml; their only remaining references are historical notes, which stay. Delete without replacements. The live exporter builds numeric tables/arrays and manually surrounds each flow row with existing comments/keys. Use parseYamlString with the actual frontend path and yaml.stringify with flow collections, lineWidth 0 and flowCollectionPadding false. Preserve numeric values and insertion order; numeric-string map keys may quote differently, so do not claim emitted byte identity. Existing --check compares semantic table values and skips when the external ROM source is unavailable. Generated frontend tables and historical evidence stay untouched. Package retirement and golden evidence remain outstanding.

# Surprises
Claude reviewed all four PR459 files at 29a94b9a in session 9fdaf2f1-6ade-4def-a0bb-8209947fd79f and found no actionable defects. Implementer accepts without code changes. Supervisor and implementer independently confirmed base/merge-base 26cd673d and exact GitHub file range.
Reviewer inspected installed yaml 2.9.0, while the manifest pins 2.9.1. My earlier installed-source description also incorrectly called it 2.9.1. I verified the relevant pinned-version behavior directly in upstream v2.9.1 src/stringify/stringify.ts (flow/padding options) and stringifyCollection.ts (positive-width wrapping and ordered rows): https://github.com/eemeli/yaml/blob/v2.9.1/src/stringify/stringify.ts and https://github.com/eemeli/yaml/blob/v2.9.1/src/stringify/stringifyCollection.ts. No output measurement or byte-identity claim follows. The existing exporter test skips without the external ROM tree, so hosted green checks alone do not demonstrate exporter execution.

# Next step
Await final-head hosted CI and supervisor gate/merge. PR256 remains held separately and untouched.
