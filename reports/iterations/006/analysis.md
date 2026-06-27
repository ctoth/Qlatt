# Iteration 006 - rejected postvocalic LL -> LX slice

Target surface: L1 F2 convergence, focused on `glide-young-yard`, the worst F2 phrase after iteration 005.

Baseline:
- 50-phrase run: `J:\Qlatt-oracle-output\dectalk-unstressed-floor-50`
- Corpus warnings: 46 / 50
- Corpus F2 meanAbs: `134.7050002209104`
- Target phrase F2 meanAbs: `265.26930388909314`

Attempt:
- Inspected DECtalk 4.63 `ph_aloph.c:823-828`, which rewrites postvocalic unstressed non-word-initial `USP_LL` to `USP_LX`.
- Confirmed Qlatt had no `LX` inventory target.
- Extracted DECtalk `US_LX` code 30 target values from `p_us_rom.h`:
  - F1/F2/F3: 425/800/2800
  - B1/B2/B3: 140/222/233
  - AV: 63
  - inherent/minimum duration: 100/70
- Tried adding the `LX` target plus a postlexical `LL -> LX` rule before the existing Rule 2 `/R/` handling.

Results:
- Raw `LX` target run:
  - Run root: `J:\Qlatt-oracle-output\dectalk-postvocalic-lx-1`
  - Warnings: 1 / 1
  - Duration delta: `-0.15080000000000005`
  - Target phrase F2 meanAbs: `283.51007311986257`
- Timing-preserving rewrite run:
  - Run root: `J:\Qlatt-oracle-output\dectalk-postvocalic-lx-preserve-duration-1`
  - Warnings: 1 / 1
  - Duration delta: `-0.0748000000000002`
  - Target phrase F2 meanAbs: `268.81221886885044`

Decision:
- Rejected. Both attempts worsened the target phrase F2 meanAbs versus `265.26930388909314`.
- Restored source files to the iteration 005 state and removed the temporary extraction script.
- No source commit was kept for this iteration.
