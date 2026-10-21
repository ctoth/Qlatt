# Goal

Deliver the pause-eligibility slice of #207 using the selected inventory's declared silence symbol. Leave fixed F0 profile roles and the parent issue open.

# State

Implementation authorized from origin/master c58c6cdd in isolated branch campaign/issue-207-pause. Smallest change: 4–7 production lines in lowering and approximately 50–90 focused test lines using the existing Affect fixture. Implemented the declared-symbol gate and timing controls. `npx vitest run test/hrg-lowering-affect.test.ts` passed after the authorized fixture correction; no local CI suite run.

# Decisions and why

- `lowering.ts` currently selects pause scaling by the literal type `silence`; `LowerContext.silence.symbol` already carries the inventory identity supplied by `tts-frontend.ts`.
- Match the configured phoneme feature against that declared symbol. Without silence context, no segment qualifies; edge silence scaling remains unchanged.
- Cover renamed symbol/type, ordinary segments bearing the old type, absent context, neutral/nonneutral scales, and initial/final edge timing.

# Surprises

The active test file initially failed before lowering: the new fixture replaced direction.delta with only durationScale/pauseScale, but the schema requires all VQ fields. Raw error: `E_HRG_FEATURE_VALUE: item type 'direction' feature 'delta' at 'delta.rdDelta' must be present` (test/hrg-lowering-affect.test.ts:227, item.ts:146). Work stopped and Q explicitly approved correcting the fixture and continuing. The fixture now preserves the full compiled Affect record before overriding the two timing scales.

# Next step

Push PR for hosted CI and supervisor-arranged Claude review; respond to findings. Keep #207 open for remaining F0 profile-role work.
