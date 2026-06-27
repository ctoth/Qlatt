# Investigation: glide-young-yard lateral F2

## Facts (verified)
- Baseline run `J:\Qlatt-oracle-output\dectalk-unstressed-floor-50` has 46 / 50 corpus convergence warnings and corpus F2 meanAbs `134.7050002209104`.
- Baseline worst F2 phrase is `glide-young-yard` (`Young yaks yelled.`) with F2 meanAbs `265.26930388909335` and maxAbs `579` at frame 141.
- Baseline frontend emits final-word phones `Y EH LL D D_REL SIL`; `LL` is not in inventory and falls back, producing warning `W_PHONEME_NOT_IN_INVENTORY`.
- Iteration 006 rejected postvocalic `LL -> LX`: raw and timing-preserved attempts both worsened target phrase F2.
- Iteration 007 rejected adding a source-faithful `LL` inventory target: it removed the token mismatch but shortened final `LL` from `219ms` to `41ms` and worsened target phrase F2.
- DECtalk source `ph_aloph.c` has a postvocalic unstressed non-word-initial `LL -> LX` rule.
- Current rulepack maps DECtalk ASCKY `LL` to `"l"` and contains transition/locus policy entries for `LL` and `LX`, while baseline inventory lacks both symbols.

## Theories (plausible)
1. Late-formant theory: Qlatt needs `LL`/`LX` formant behavior without changing the already-near-correct accidental fallback duration. This predicts that changing only F2/F1/F3 values over the existing `LL` span improves F2.
2. Duration theory: the real root cause is a missing DECtalk timing exception for lexical/doubled laterals. This predicts that any materialized `LL`/`LX` target stays bad until duration rules are corrected.
3. Alignment theory: F2 worsens are mostly compare-alignment artifacts caused by the 41ms lateral collapse. This predicts that the same formant target with baseline timing improves or at least does not worsen.
4. Symbol theory: the `YELLED` LTS output should not be `LL` in the internal target stream, despite the oracle phoneme text rendering `ll`. This predicts that changing the lexical symbol to `L` plus correct timing matches better than adding `LL`.
5. Transition theory: the main F2 error is in vowel/lateral transition loci around `EH -> LL -> D`, not the steady lateral target. This predicts that steady-state retargeting alone leaves the frame-141 max error substantially intact.

## Tests Run

| Test | Hypothesis | Result | Rules Out | Supports |
|------|------------|--------|-----------|----------|
| Iteration 006 raw `LL -> LX` source slice | 2, 4 | Worsened target phrase F2 to `283.51007311986257` | Simple early allophone rewrite is sufficient | 2, 3, 5 |
| Iteration 006 duration-preserving `LL -> LX` source slice | 1, 3 | Worsened target phrase F2 to `268.81221886885044` | Naive LX target over current rule path is sufficient | 2, 5 |
| Iteration 007 `LL` inventory target source slice | 2, 4 | Worsened target phrase F2 to `277.0227104825`; `LL` duration collapsed from `219ms` to `41ms` | Missing inventory alone is sufficient | 2, 3 |

## Current Best Theory
No single theory has enough evidence yet. The strongest constraint is that source-faithful early materialization of `LL` or `LX` is not a valid fix by itself because it changes timing and worsens F2.

## Open Questions
- What DECtalk numeric `PH`/`PH2` values and F2 trajectory occur over the final word in the oracle trace?
- Does baseline Qlatt already align final-word duration closely enough that a late formant correction is viable?
- Is the frame-141 max error in the steady lateral, in the vowel-lateral transition, or after lateral closure?
- Can a data-only mutation of baseline `LL` frames predict an improving source slice before editing source?

## Next Action
Summarize the final-word oracle and Qlatt frame windows from the baseline and rejected runs, then test a data-only baseline-timing formant mutation before choosing any source patch.
