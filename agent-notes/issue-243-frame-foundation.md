# Goal
Revise existing PR #256 for the adopted #243 pure Frame evaluation boundary.

## State
Verified the protected worktree clean at b67cae06 before normal integration of
origin/master 1fca5759. Resolved conflicts preserving current schema/resource
ownership, channel-driven affect, pause identity and DECtalk output-clock ratio.
The candidate completes clock/metadata/Frames effects before evaluating numeric
events in their original enumeration order. Emission uses stable output order.
FrameValues now records imperative computations without numeric Item writes.
The shared authored frame_copy definitions use assoc and the common checked
requested evaluator for F1; immutable evidence projects to ordinary provenance
records, deduplicated by evidence identity. Existing programmatic lowerers that
do not supply a checked program keep imperative copying; no fake checked handle.
Existing Frame fixtures now distinguish clock writes from evaluated numbers and
exercise memoization, source spans, actual dependency ancestry and public IDs.
No local CI, browser runs or measurements have been executed.

## Decisions and why
- Smallest approved revision: 240–340 production lines including deletions,
  15–25 YAML, 100–150 existing fixture lines and 20–35 documentation lines.
- Complete event/clock/metadata/Frames effects before numeric evaluation; retain
  original numeric event enumeration separately from sorted output order.
- One authored F1 copy uses the common checked requested-attribute evaluator.
  Remaining imperative producers retain explicit provenance, pending #244–#247.
- No numeric transactions, synthetic latestWrite records, new DSL or record shape.
- Preserve historical baselines. Revised measurement acceptance remains pending;
  the old DECtalk 3.48x result is not a measurement of this revision.
- Other agents own other work; preserve current master and unrelated edits.

## Surprises
Normal integration conflicted in lowering, TTS, rule-engine and seven existing
fixtures. Newer frame-program outputs also write the existing parameter maps;
the emitter retains their actual source IDs without requiring synthetic writes.

## Next step
Publish the integrated revision for hosted CI and full-PR Claude review.
Measurement acceptance remains outstanding; do not merge or close #243 on the
strength of old baseline reports or hosted correctness checks alone.
