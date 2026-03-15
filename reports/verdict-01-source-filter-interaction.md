# Report: Verdict 01 -- Source-Filter Interaction

## Summary

Read 22 papers (20 with substantive notes, 2 with minimal relevance: Richards 1968 has no speech relevance, Milner 2002 has low relevance). Cross-topic papers Stevens 1998 and Fant 1985 provided critical additional context.

## Key Findings

The source-filter independence assumption underlying Klatt synthesis is approximately correct for adult male conversational speech but breaks down for high-F0 voices, vowel-dependent source variation, and voiced fricatives. The LF parametric source model (Fant 1985) implicitly absorbs most interaction effects, making explicit aerodynamic coupling unnecessary for most practical synthesis. Two concrete errors in Qlatt were identified: (1) fixed ndbScale values should be dynamically computed per Lin 1995, and (2) the radiation filter uses a first-order Flanagan approximation superseded by Chalker 1985's two-term model.

## Synthesizer Audit Items

8 audit items total:
- **2 WRONG:** Fixed ndbScale values (Lin 1995 replacement); Rabiner 1968 digital HPC claim (Laine 1988 correction)
- **3 LIMITED:** Source-filter independence (vowel-dependent Rd needed), cascade/parallel switching, static HPC for F7-F10
- **1 SUPERSEDED:** First-order radiation filter (Chalker 1985 two-term replacement)
- **2 CORRECT:** F0-proximity B1 widening (Stevens 1998), glottal leakage bandwidth (Fant 1997)

## Critical Gaps

- **Flanagan (1972) "Speech Analysis, Synthesis and Perception"** -- primary source for radiation impedance model used by Klatt. Not in collection. Cited by multiple papers.
- No perceptual evaluation of dynamic ndbScale vs. fixed offsets exists in the literature.
- No calibration data for vowel-dependent Rd adjustment in connected speech.

## Verdict Location

Full verdict: `research/verdicts/01-source-filter-interaction.md`
