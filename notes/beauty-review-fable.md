# Beauty voice review — notes (Fable, 2026-07-01)

Reviewing README + FE (`public/rules/frontends/qlatt-beauty/`) + BE
(`public/experiments/qlatt-beauty/`) against the design corpus
(`design/beauty-synthesis/`) and the papers. Looking for what's WRONG.

## Method
- Read design intent (07-beauty-spec is the contract; 01/02/05/06/09 are axes).
- Read as-built BE graph/semantics + FE phases/inventory.
- Diff intent vs build. Flag divergences, missing pieces, spec violations.

## Running findings

### F-1: BE graph is a klatt80 fork, not clean-room (spec violation, cosmetic-ish)
`public/experiments/qlatt-beauty/graph.yaml` line 2 `name: klatt80-synth`,
meta.description "Klatt 80 formant synthesizer topology per Klatt (1980)".
Spec 07 §CORNERSTONE + "Clean-room: reuses nothing from klatt80/klsyn88/dectalk."
The build reused the klatt80 graph topology wholesale and bolted "BEAUTY DELTAS"
on the end. Not necessarily bad engineering, but it directly contradicts the
stated clean-room cornerstone and means the source is NOT the LF/CALM design —
need to check semantics to see what source is actually wired.

(more below as I read)
