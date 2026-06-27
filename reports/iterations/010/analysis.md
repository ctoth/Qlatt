# Iteration 010 - onset-only consonant stress propagation

## Target

Reduce the L1 F2 mismatch on `glide-young-yard` without repeating iteration 009's duration regression.

## Baseline

- Source commit: `aa53ef71`
- Baseline run: `J:\Qlatt-oracle-output\dectalk-unstressed-floor-50`
- Corpus warnings: `46 / 50`
- Corpus F2 meanAbs: `134.70500022091034`
- Target phrase F2 meanAbs: `265.26930388909335`

## Source diagnosis

Iteration 009 proved that copying vowel stress to every same-syllable phone is too broad. It improved `glide-young-yard` but also kept coda phones such as `NG`/`LL` out of DECtalk Rule 7 shortening, regressing the first-five weighted F2 aggregate and duration error.

DECtalk's stress propagation is narrower. `p_us_sr1.c:get_stress_of_conson` searches forward from the current consonant to a stress marker before the next vowel or boundary, then applies stress only if the current consonant is part of a legal pre-vocalic cluster (`us_phcluster`, p_us_sr1.c:73-162 and :179-228). That corresponds to onset consonants before a stressed nucleus, not arbitrary coda consonants after it.

## Planned source slice

- Add an annotation rule after syllable metadata and fallback primary vowel stress.
- Select onset phones with a same-syllable stressed vowel.
- Set `stress` on that onset phone so existing duration Rule 7 reads the DECtalk-like segment stress without adding a new helper or TS path.
- Verify on `glide-young-yard`, then 5/10/50 phrases if the earlier gates improve.

## Expected result

The initial `Y` in `Young`, `yaks`, and `yelled` should avoid unstressed-glide shortening. Coda `NG` and `LL` should remain unstressed, avoiding iteration 009's duration regression.

## Result

Kept, after narrowing.

The first implementation matched the broad source behavior too directly: all onset consonants with a same-syllable stressed nucleus received `stress`. It improved full-corpus F2 to `133.47356058425666`, but it also moved `g2p-phone` from pass to warn, increasing the corpus warning count from `46 / 50` to `47 / 50`. That violated the iteration failure ledger.

The second implementation narrowed to all onset glides. It fixed `g2p-phone`, but moved `g2p-queen` from pass to warn because its onset `W` changed, again increasing warnings to `47 / 50`.

The kept implementation is an onset-`Y` slice only. It is source-aligned as a partial implementation of `p_us_sr1.c:get_stress_of_conson` for the observed DECtalk `Y` onset case, and it avoids the `W`/non-glide regressions.

Verification ladder:

| Gate | Run root | Warning count | F2 result |
| --- | --- | ---: | ---: |
| 1 phrase | `J:\Qlatt-oracle-output\dectalk-onset-y-stress-1` | `1 / 1` | `glide-young-yard` F2 `265.26930388909335` -> `218.1787738927739` |
| 5 phrases | `J:\Qlatt-oracle-output\dectalk-onset-y-stress-5` | `5 / 5` | unchanged, no target `Y` phrase in prefix |
| 10 phrases | `J:\Qlatt-oracle-output\dectalk-onset-y-stress-10` | `10 / 10` | unchanged, no target `Y` phrase in prefix |
| 50 phrases | `J:\Qlatt-oracle-output\dectalk-onset-y-stress-50` | `46 / 50` | corpus F2 `134.70500022091034` -> `132.74605745805388` |

Full 50-phrase pass/warn status is unchanged versus baseline. `Compare-Object` over sorted `phraseId/verdict` rows produced no diff.

Tradeoff: target phrase duration delta worsened from `0.010199999999999765s` to `0.08419999999999961s`. This is kept because the active slice target is L1 F2 and the full 50-phrase F2 metric improves without increasing warning count or changing token identity. The duration regression remains visible for a later duration-focused slice.
