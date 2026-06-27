# Iteration 009 - explicit syllable stress annotation

## Target

Reduce `glide-young-yard` F2 error by correcting the timing decision that treats consonants in stressed syllables as unstressed.

## Hypothesis

DECtalk stores stress in segment structural features (`allofeats`), so consonants in a primary-stressed syllable are not Rule-7 shortened as unstressed. Qlatt currently exposes `stress` only on vowel tokens. Iteration 008 tried to derive the same-syllable vowel stress inside duration rules, but the nested lookup was a no-op. A better fix is to annotate each phone with explicit `syllable_stress` during the syllabification phase and make duration Rule 7 read that field.

## Planned source slice

- Add a generic `syllable_stress()` CEL builtin beside the existing `syllable_index()` / `syllable_role()` / `syllable_position_in_word()` builtins.
- Add a DECtalk annotation rule that writes `syllable_stress`.
- Make Rule 7 durmin and unstressed-shortening use `current.syllable_stress` before falling back to token-local `stress`.

## Expected result

The initial `Y` in `Young` should stop receiving the extra unstressed-glide shortening. One-phrase F2 should change from the baseline; if it improves without increasing warnings, proceed to 5/10/50.

## Result

Rejected.

The source slice did make the intended decision explainable and observable: `syllable_stress()` propagated the primary stress from the vowel in the same syllable to neighboring consonants, and `glide-young-yard` changed from the baseline F2 meanAbs `265.26930388909335` to `219.3462750582751` after guarding silence-type fallback tokens. That is a real one-phrase improvement on the target phrase.

The five-phrase gate disproved it as a kept convergence slice. Against the same five phrase IDs in the baseline summary:

| Metric | Baseline | Candidate |
| --- | ---: | ---: |
| weighted F2 meanAbs | `96.22480940034815` | `96.89979799460761` |
| weighted abs duration delta | `0.0027894088669951317` | `0.028250738916256183` |

Per-phrase F2 deltas were mixed:

| Phrase | Baseline F2 meanAbs | Candidate F2 meanAbs | Result |
| --- | ---: | ---: | --- |
| `g2p-church` | `118.09394777265744` | `117.89389656938044` | improved |
| `g2p-dog` | `240.40468360556565` | `242.16013338917588` | regressed |
| `g2p-she` | `30.673766233766234` | `29.480389610389608` | improved |
| `g2p-the` | `30.880633093525184` | `29.23493525179856` | improved |
| `g2p-this` | `33.47476729559748` | `37.829383647798736` | regressed |

Artifacts:

- One-phrase guarded run: `J:\Qlatt-oracle-output\dectalk-syllable-stress-annotation-guard-1`
- Five-phrase guarded run: `J:\Qlatt-oracle-output\dectalk-syllable-stress-annotation-guard-5`
- Five-phrase summary: `J:\Qlatt-oracle-output\dectalk-syllable-stress-annotation-guard-5\trace-summary.json`

The correct next direction is narrower than "syllable stress everywhere": explainable segment-level stress is needed, but applying it directly to Rule 7 duration changes over-lengthens several short words. The next slice should isolate the exact DECtalk `FSTRESS`/`FTYPESYL` availability by segment class before changing Rule 7 again.
