# Goal
Retire obsolete YAML migration commands and migrate the live DECtalk table exporter (#224).

# State
Based on master 26cd673d. Approved smallest scope: delete the two obsolete scripts (about 400 lines), change the live exporter reader/flow serializer (8–12 lines), and this note. No local CI, new tests or regeneration.

# Decisions and why
extract-pipeline.ts and split-rules.ts both require the removed public/rules/frontend.yaml; their only remaining references are historical notes, which stay. Delete without replacements. The live exporter builds numeric tables/arrays and manually surrounds each flow row with existing comments/keys. Use parseYamlString with the actual frontend path and yaml.stringify with flow collections, lineWidth 0 and flowCollectionPadding false. Preserve numeric values and insertion order; numeric-string map keys may quote differently, so do not claim emitted byte identity. Existing --check compares semantic table values and skips when the external ROM source is unavailable. Generated frontend tables and historical evidence stay untouched. Package retirement and golden evidence remain outstanding.

# Surprises
None.

# Next step
Publish for hosted CI and full Claude review. PR256 remains held separately and untouched.
