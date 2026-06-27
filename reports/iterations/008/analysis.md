# Iteration 008 - syllable stress for duration

## Target

Reduce the `glide-young-yard` F2 error without changing lateral inventory again.

## Hypothesis

DECtalk timing carries syllable stress features onto consonants. Qlatt currently stores lexical `stress` only on vowel tokens, so duration Rule 7 treats stressed-syllable consonants such as the initial `Y` in `Young` as unstressed and applies the extra consonant shortening. In the baseline oracle window, DECtalk holds the first `Y` for about 77ms, while Qlatt holds it for 47ms; that early timing lead carries into the later low-F2 lateral region.

## Planned source slice

Make duration rules derive `stress_val` from the same-syllable vowel when the current token has no direct stress. Apply this first to the unstressed non-obstruent floor adjustment and Rule 7 unstressed shortening, the two rules that directly over-shorten stressed-syllable consonants.

## Expected result

The one-phrase `glide-young-yard` oracle run should improve F2 meanAbs from `265.26930388909335` without increasing convergence warnings. If it does not improve, revert this source slice and record the rejection.

## Result

Rejected. The first edit had invalid CEL syntax because single-quoted predicate strings cannot span lines. After fixing syntax, three one-phrase runs completed but the output stayed byte-identical at the trace-summary level:

- `J:\Qlatt-oracle-output\dectalk-syllable-stress-duration-1b`
- `J:\Qlatt-oracle-output\dectalk-syllable-stress-duration-1c`
- `J:\Qlatt-oracle-output\dectalk-syllable-stress-duration-1d`

Each completed run kept `glide-young-yard` at one warning, trace duration delta `0.010199999999999765`, and F2 meanAbs `265.26930388909335`. The frontend phone durations also stayed unchanged (`Y` in `young` remained `47ms`). The source slice therefore did not actually propagate syllable stress into these duration rules and was restored.

## Follow-up

The source-backed root-cause hypothesis remains plausible, but the rule expression did not observe the same-syllable vowel through `find_within_word`. The next attempt should first prove, with an isolated rule-engine test or explain trace, which fields are visible inside nested `find_within_word` predicates before editing production duration rules again.
