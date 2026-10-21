# Issue 214: declared generic pronunciation priority

## Goal
Execute the generic YAML pronunciation path in its selected frontend's cited four-layer order, preserving dictionary/clitic stress and generated lexical-stress ancestry.

## State
Implemented on isolated branch from PR438 final 43e194a2, then normally merged master 3927be2b including PR438, PR436 inventory schema, and PR440. Compared combined inventory against master: only the pronunciation policy import/field differ. Root owns merge and review ledger. No local CI; resource/transcription ownership coordinated with middle agent.

## Decisions and why
Smallest plan: 100–140 production additions/~40 removals, 5–8 YAML lines, 90–130 fixture lines. A required permutation of dictionary/clitic/morphology/lts changes priority without introducing layer disabling. Reuse existing resource assembly and implementations. Separate generic dispatch before DECtalk's bespoke flow; preserve PR438 original-word diagnostics. Selected-layer evidence augments the existing pronunciation record. Only label a dictionary miss when dictionary actually preceded the chosen layer; no duplicate lookup. Dictionary and clitic preserve source/stress; morphology/LTS pass lexical stress exactly once.

## Surprises
The explicit non-table override fixture selects DECtalk resources but supplies shared YAML LTS. It now supplies the matching declared generic layer policy while retaining its missing-morphology/stress error assertions. An attempted merge before committing refused the dirty inventory file without changing it; commit first, then integrate normally and preserve the separately merged inventory schema.

## Next step
PR442 published. Hosted quality job119244443660 reported four formatting/import-order errors in the generic engine and two fixtures; applied its exact corrections without behavior changes in 42700676. That replacement passed quality/native/audio and shards 3/4. Shards 1/2 exposed two outdated fixture assumptions: DOT edge selection matched arrow text inside node tooltips (119245410255), and the lexicon assertion omitted the newly declared layer/order/citations (119245410548). Anchored the existing DOT assertion to actual edge syntax and retained exact edge equality; updated exact lexicon reason/citation expectations from the selected policy. No runtime changes. Await final hosted CI/root verification and merge.

## Review response
Accepted Claude's two-pass full eleven-file review of 3927be2b...96809452, with no defects reported. Transcript 37ab8565-8ac6-4cb5-85eb-a37cb58acc99 in the campaign214 Claude project; execution 13425 completed. Reviewer checked actual table-only early returns, dictionary/clitic stress preservation, generated stress once, direct ancestry, honest dictionary-miss diagnostics, acquisition/inheritance and the unchanged inventory schema. Its passing-quality observation belongs to replacement 42700676, not the initial reviewed head. Subsequent changes are the hosted formatter/import-order response and the two fixture corrections described above. No local CI or reviewer program execution; root owns the ledger and final source verification. No new machinery for the review's explicitly non-finding hypothetical overrides.
