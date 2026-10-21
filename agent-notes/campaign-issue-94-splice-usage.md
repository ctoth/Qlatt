# Goal

Correct #94 unused-policy warnings for policy references in evaluated splice templates.

# State

Authorized isolated branch campaign/issue-94-splice-usage from origin/master 43efe0af. Smallest planned change: 20–35 production lines and 30–50 existing schema-test lines. Implemented usage collection for evaluated splice values and flat/wrapped regression controls. `npx vitest run test/declarative-frontend-schema.test.ts` passed. No local CI suite run.

# Decisions and why

- Direct splice leaves are omitted by TEMPLATE_DISPATCH_WALK_SHAPE's validateLeaves:false. Live flap rules read duration.flap_duration_ms there, so the unused warning is false.
- Mirror runtime applySplice's selection of target, flat template fields, or nested segment.fields plus phoneme. Descend structured expression values as evaluateStructured does; exclude copy_from/copy_fields/outside_structure/target/fields metadata from the feature loop.
- Reuse existing policy reference extraction and marking only. Do not add expression validation, change rule scheduling, or suppress warning categories. #94 remains open.

# Surprises

None.

# Next step

Push for hosted CI and supervisor Claude review. #94 remains open for the other warning dispositions.
