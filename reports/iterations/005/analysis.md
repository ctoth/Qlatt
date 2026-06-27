# Iteration 005 - unstressed non-obstruent duration floor

## Target

- Active family: F2.
- Baseline corpus summary: `J:\Qlatt-oracle-output\dectalk-vowel-soncon-f2-50\trace-summary.json`.
- Baseline F2 meanAbs: `146.1441958925807`.
- Baseline warning count: `46 / 50` not passing.
- Selected phrase: `prosody-wh-question`.
- Phrase baseline F2 meanAbs: `251.02328966521108`.

## Source observation

`prosody-wh-question` had a large F2 max error at frame 125 because Qlatt's
segment timing was late by `0.1456s`. The largest contributors were unstressed
non-obstruent vowels whose `minimumDuration` floor prevented DECtalk's percentage
rules from shortening them enough.

DECtalk 4.63 `dapi/src/PH/p_us_tim.c:432-447` adjusts `durmin` for unstressed
non-obstruents before the final duration formula:

- no-stress non-obstruents halve `durmin`;
- secondary-stressed non-obstruents subtract one quarter of `durmin`;
- `durmin` is clamped to at least three DECtalk control frames.

Qlatt's scalar resolver captures `minimumDuration` as the `duration` floor when
the first duration effect is applied, so the declarative rule must run before
duration multipliers in `pipeline.yaml` to preserve DECtalk's final
`durxx = prcnt * (durinh - durmin) / 128 + durmin` behavior.

## Slice

- Added `dectalk_unstressed_nonobstruent_floor_adjustment` in the duration phase.
- Added policy constants for the no-stress factor, secondary-stress factor, and
  three-frame minimum floor.
- Inserted the rule before duration multipliers in the duration phase order.
- Kept the implementation declarative and cited to DECtalk source.

## Verification

- Initial one-phrase attempt failed to produce a valid report because the spec
  validator rejected inline `0.75` and `0.5` literals. The factors were moved
  into `params.policy.duration`, then the gate was rerun.
- One phrase:
  - Command: `npm run oracle:run -- --phrase-id prosody-wh-question --out-root "J:\Qlatt-oracle-output\dectalk-unstressed-floor-1b" --continue-on-error 1`
  - Result: `0` failures, `1` warning.
  - Trace compare: `J:\Qlatt-oracle-output\dectalk-unstressed-floor-1b\prosody-wh-question-trace-compare.json`.
  - `prosody-wh-question` F2 meanAbs: `99.5020328263816`.
  - Duration delta improved from `0.1456s` to `0.0136s`.
- Five phrases:
  - Command: `npm run oracle:run -- --limit 5 --out-root "J:\Qlatt-oracle-output\dectalk-unstressed-floor-5" --continue-on-error 1`
  - Result: `0` failures, `5` warnings.
- Ten phrases:
  - Command: `npm run oracle:run -- --limit 10 --out-root "J:\Qlatt-oracle-output\dectalk-unstressed-floor-10" --continue-on-error 1`
  - Result: `0` failures, `10` warnings.
- Fifty phrases:
  - Command: `npm run oracle:run -- --limit 50 --out-root "J:\Qlatt-oracle-output\dectalk-unstressed-floor-50" --continue-on-error 1`
  - Result: `0` failures, `46` warnings.
  - Trace summary: `J:\Qlatt-oracle-output\dectalk-unstressed-floor-50\trace-summary.json`.
  - Corpus F2 meanAbs: `134.7050002209104`.
- `npm run typecheck:core`: pass.
- `npm test -- yaml-frontend-config declarative-frontend-rulepack-context`: pass, `60` tests.

## Decision

Keep. The corpus warning count did not increase (`46` to `46`) and the active
F2 family improved from `146.1441958925807` to `134.7050002209104`.
