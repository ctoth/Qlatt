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
