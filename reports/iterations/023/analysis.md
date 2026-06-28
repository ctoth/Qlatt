# Iteration 023 - rejected RR dictionary conversion

## Target

- Target phrase: `g2p-church`.
- Target parameter: `F3`, same-segment bucket.
- Baseline after iteration 022: `165.269341894061` meanAbs on `g2p-church`.

## Diagnosis

DECtalk's source dictionary row for `church` is:

`church,N,C'RC,00000000001000000000000000000,250`

In `scripts/build-dectalk-dict.ts`, dictionary character `R` maps through
`US_RR` to raw ARPABET `rr`. The converter still collapsed `rr` to `ER`, with
a stale comment saying the inventory had no `RR`. The current inventory does
have a bare `RR` target.

## Trial

Trial changes:

- Restored stress-bearing raw `rr` dictionary output as `RR1` / `RR0`.
- Added bare-vowel target fallback in `materializePhonemeTarget` so `RR1` can
  resolve through the existing bare `RR` target.
- Updated the dictionary validator to accept stress-bearing vowels that resolve
  through a bare inventory target.

Validation before oracle:

`node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/build-dectalk-dict.ts`

- Rebuilt `public/dectalk-dictionary.json`.

`node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/validate-dectalk-dict.ts`

- Passed: zero unknown symbols.
- Passed: stress well-formedness.

`node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/verify-dectalk-dict.ts church`

- Dictionary entry became `CH RR1 CH`.
- Frontend source layer was `dictionary_pronunciation_selected`.
- Materialized phonemes were `CH RR CH`.

## One-phrase result

Command:

`npm run oracle:run -- --phrase-id g2p-church --oracle-root J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1 --out-root J:\Qlatt-oracle-output\dectalk-rr-dict-023-1 --continue-on-error 1`

Trace summary:

`J:\Qlatt-oracle-output\dectalk-rr-dict-023-1\trace-summary.json`

The target regressed:

- F3 same-segment meanAbs worsened `165.269341894061 -> 228.67777777777775`.
- F3 overall meanAbs worsened `162.8378904249872 -> 213.0555555555555`.
- F2 same-segment meanAbs improved `89.72897271268057 -> 86.52444444444446`.

## Result

Rejected for the active F3 target. Restored:

- `src/declarative-frontend/inventory.ts`
- `scripts/build-dectalk-dict.ts`
- `scripts/validate-dectalk-dict.ts`
- `public/dectalk-dictionary.json`

Interpretation: the `rr -> ER` converter collapse is a real symbolic mismatch,
but keeping raw `RR` with the current bare `RR` acoustic target is not a valid
F3-convergence slice for `g2p-church`. The remaining hotspot is not fixed by
symbol correction alone; it likely needs a separate L0/L1 decision about RR vs
ER scoring and the acoustic target/timing consequences.
