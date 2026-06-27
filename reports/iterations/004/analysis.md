# Iteration 004 - vowel to sonorant-consonant F2 smoothing

## Target

- Active family: F2.
- Baseline corpus summary: `J:\Qlatt-oracle-output\dectalk-soncon-vowel-f2-50\trace-summary.json`.
- Baseline F2 meanAbs: `146.40834089282495`.
- Baseline warning count: `46 / 50` not passing.
- Selected phrase: `prosody-hello-world`.
- Phrase baseline F2 meanAbs: `246.24700460829496`.

## Source observation

DECtalk 4.63 `dapi/src/PH/p_us_st1.c` lines 837-849 applies the US backward
formant smoothing rule for vowel to sonorant-consonant transitions:

- default boundary is midpoint between current and next target;
- vowel-soncon F2 boundary then moves halfway from that default boundary toward
  the next target, making a 25/75 current/next boundary;
- transition duration remains `NF45MS`.

This explains the early F2 fall in `hello world`: DECtalk pulls EH F2 toward the
following L/OW region before Qlatt's prior midpoint transition did.

## Slice

- Added an F2-only vowel to nasal/liquid/glide backward transition in
  `src/track-assembler.ts`.
- The implementation records diagnostic `I_VOWEL_SONCON_F2_TRANSITION_APPLIED`
  with citation `DECtalk 4.63 p_us_st1.c:837-849`.
- Added a focused assembler test for the 75/25 F2 boundary and NF45MS timing.

## Verification

- `npm test -- track-assembler`: pass, `32` tests.
- One phrase:
  - Command: `npm run oracle:run -- --phrase-id prosody-hello-world --out-root "J:\Qlatt-oracle-output\dectalk-vowel-soncon-f2-1" --continue-on-error 1`
  - Result: `0` failures, `1` warning.
  - Trace compare: `J:\Qlatt-oracle-output\dectalk-vowel-soncon-f2-1\prosody-hello-world-trace-compare.json`.
  - `prosody-hello-world` F2 meanAbs: `245.87972350230413`.
- Five phrases:
  - Command: `npm run oracle:run -- --limit 5 --out-root "J:\Qlatt-oracle-output\dectalk-vowel-soncon-f2-5" --continue-on-error 1`
  - Result: `0` failures, `5` warnings.
- Ten phrases:
  - Command: `npm run oracle:run -- --limit 10 --out-root "J:\Qlatt-oracle-output\dectalk-vowel-soncon-f2-10" --continue-on-error 1`
  - Result: `0` failures, `10` warnings.
- Fifty phrases:
  - Command: `npm run oracle:run -- --limit 50 --out-root "J:\Qlatt-oracle-output\dectalk-vowel-soncon-f2-50" --continue-on-error 1`
  - Result: `0` failures, `46` warnings.
  - Trace summary: `J:\Qlatt-oracle-output\dectalk-vowel-soncon-f2-50\trace-summary.json`.
  - Corpus F2 meanAbs: `146.1441958925807`.
- `npm run typecheck:core`: pass.

## Decision

Keep. The corpus warning count did not increase (`46` to `46`) and the active
F2 family improved from `146.40834089282495` to `146.1441958925807`.
