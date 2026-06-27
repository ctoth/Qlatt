# DECtalk convergence iteration log

This ledger tracks kept or reverted source slices for the DECtalk convergence work.
The failure count is the corpus convergence warning count, not command execution
failures. A phrase with a convergence warning is treated as not passing the current
gate.

| Iteration | Start | End | Result | Commit |
| --- | ---: | ---: | --- | --- |
| 001 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `148.67747563128384`; rejected broad locus ramp candidate first (`46` -> `47` warnings), then kept F2-only locus ramp | this commit |
| 002 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `146.8509545970659`; terminal stop-closure silence no longer inherits closure F2 locus | this commit |
| 003 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `146.40834089282495`; F2 uses DECtalk sonorant-consonant-to-vowel 25/75 forward smoothing | this commit |
| 004 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `146.1441958925807`; F2 uses DECtalk vowel-to-sonorant-consonant 75/25 backward smoothing | this commit |
| 005 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `134.7050002209104`; unstressed non-obstruents use DECtalk Rule 7 `durmin` floor adjustment | this commit |
| 006 | 46 / 50 not passing | 46 / 50 not passing | Rejected postvocalic `LL -> LX`: raw target worsened target phrase F2 to `283.51007311986257`; timing-preserved rewrite still worsened to `268.81221886885044` from `265.26930388909314` | report-only |
| 007 | 46 / 50 not passing | 46 / 50 not passing | Rejected source-faithful `LL` inventory target: removed token mismatch but shortened final `LL` from `219ms` to `41ms` and worsened target phrase F2 to `277.0227104825` from `265.26930388909335` | report-only |
| 008 | 46 / 50 not passing | 46 / 50 not passing | Rejected syllable-stress lookup in duration Rule 7: syntax-corrected one-phrase runs were byte-identical for `glide-young-yard`, leaving F2 meanAbs at `265.26930388909335` | report-only |
