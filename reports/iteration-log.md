# DECtalk convergence iteration log

This ledger tracks kept or reverted source slices for the DECtalk convergence work.
The failure count is the corpus convergence warning count, not command execution
failures. A phrase with a convergence warning is treated as not passing the current
gate.

| Iteration | Start | End | Result | Commit |
| --- | ---: | ---: | --- | --- |
| 001 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `148.67747563128384`; rejected broad locus ramp candidate first (`46` -> `47` warnings), then kept F2-only locus ramp | this commit |
