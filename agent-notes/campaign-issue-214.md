# Issue 214: declared generic pronunciation priority

## Goal
Execute the generic YAML pronunciation path in its selected frontend's cited four-layer order, preserving dictionary/clitic stress and generated lexical-stress ancestry.

## State
Implemented on isolated branch from PR438 final 43e194a2. PR438 merged as df7bf954; integrate that master after committing this owned slice. Root owns merge and review ledger. No local CI; resource/transcription ownership coordinated with middle agent.

## Decisions and why
Smallest plan: 100–140 production additions/~40 removals, 5–8 YAML lines, 90–130 fixture lines. A required permutation of dictionary/clitic/morphology/lts changes priority without introducing layer disabling. Reuse existing resource assembly and implementations. Separate generic dispatch before DECtalk's bespoke flow; preserve PR438 original-word diagnostics. Selected-layer evidence augments the existing pronunciation record. Only label a dictionary miss when dictionary actually preceded the chosen layer; no duplicate lookup. Dictionary and clitic preserve source/stress; morphology/LTS pass lexical stress exactly once.

## Surprises
The explicit non-table override fixture selects DECtalk resources but supplies shared YAML LTS. It now supplies the matching declared generic layer policy while retaining its missing-morphology/stress error assertions. An attempted merge before committing refused the dirty inventory file without changing it; commit first, then integrate normally and preserve the separately merged inventory schema.

## Next step
Commit, integrate merged master, publish, then hosted CI and private Claude review/response. Preserve other work.
