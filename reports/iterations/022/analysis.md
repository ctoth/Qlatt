# Iteration 022 - per-formant locus ramp

## Target

- Target phrase: `g2p-church`.
- Target parameter: `F3`, same-segment bucket.
- Baseline after iteration 020: `191.30337078651687` meanAbs on `g2p-church`.

## Diagnosis

`g2p-church` exposed an explainable mismatch at the start of ER:

- DECtalk source path: `ph_sttr2.c:setloc` computes a boundary value and `durtran` per formant.
- Qlatt source path: `applyControlWindowsAtOffset` ramped keyed transition windows only when `key === "F2"`.
- Effect: Qlatt's ER-start F3 held the CH->ER boundary value (`2560`) across the forward window instead of linearly moving toward the ER steady target.

This was not a vowel-category data issue. The ER forward category remains source-backed by `us_begtyp[]`.

## Change

Changed `src/track-assembler.ts` so forward and backward locus smoothing ramp any key that has a per-key transition steady time, not only `F2`.

## Verification

One phrase, cached oracle:

`npm run oracle:run -- --phrase-id g2p-church --oracle-root J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1 --out-root J:\Qlatt-oracle-output\dectalk-formant-ramp-022-1 --continue-on-error 1`

`node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/oracle/summarize-trace-run.ts --run-root J:\Qlatt-oracle-output\dectalk-formant-ramp-022-1\dectalk-us-v1 --out J:\Qlatt-oracle-output\dectalk-formant-ramp-022-1\trace-summary.json`

- `g2p-church` F3 same-segment meanAbs improved `191.30337078651687 -> 165.269341894061`.
- F2 same-segment remained `89.72897271268057`.

Five phrases, cached oracle:

`npm run oracle:run -- --limit 5 --oracle-root J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1 --out-root J:\Qlatt-oracle-output\dectalk-formant-ramp-022-5 --continue-on-error 1`

- F3 meanAbs improved `76.51219211822661 -> 64.99908136295271`.
- F3 same-segment improved `75.92745849297575 -> 64.22725762015011`.
- F2 unchanged at `88.32929802338359`.
- F1 meanAbs improved `45.466748768472904 -> 45.33568114643977`.

Ten phrases, cached oracle:

`npm run oracle:run -- --limit 10 --oracle-root J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1 --out-root J:\Qlatt-oracle-output\dectalk-formant-ramp-022-10 --continue-on-error 1`

- F3 meanAbs improved `98.49221957040574 -> 90.6172774551179`.
- F3 same-segment improved `80.42384661473936 -> 71.94753936255823`.
- F2 unchanged at `150.8770681194634`.
- F1 meanAbs improved `67.91522673031027 -> 67.32425609976339`.
- F1 same-segment changed `66.06776512881966 -> 66.0713610610081`.

Fifty phrases, cached oracle:

`npm run oracle:run -- --limit 50 --oracle-root J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1 --out-root J:\Qlatt-oracle-output\dectalk-formant-ramp-022-50 --continue-on-error 1`

- Failures: `0`.
- Warnings: `46 / 50`, unchanged.
- F3 meanAbs improved `87.2055875074665 -> 83.4492673562371`.
- F3 same-segment improved `78.19802334460566 -> 73.75906911642157`.
- F3 different-segment improved `122.96211490424646 -> 121.57642695982769`.
- F2 unchanged at `125.33449260000893`.
- F1 meanAbs improved `54.62369656114003 -> 53.76583650203253`.
- F1 same-segment improved `51.04194938365877 -> 49.42081977690421`.
- F1 different-segment regressed `71.33661532056618 -> 73.33812784031575`.

Static gate:

`npm run typecheck:core`

- Passed.

## Decision

Kept. The slice is source-backed, improves the target phrase, improves 5/10/50 phrase F3 metrics, leaves F2 unchanged, and improves F1 overall/same-segment. The F1 different-segment regression is recorded as a caveat.
