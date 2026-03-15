# Report: Verdict 08 -- Coarticulation

## Task

Audit Qlatt's coarticulation models and formant transition rules against 24 research papers. Determine which models are correct, superseded, or limited, and whether transition rules need updating.

## Verdict

**Qlatt's coarticulation architecture is well-designed.** The DAC-based VCV blending, context-dependent F2 loci, dark /l/ allophony, and /r/ F3 lowering are all correctly implemented and properly cited. The main weakness is the fixed 30ms transition duration, which is too short and too uniform compared to the literature consensus of 40-80ms.

## Key Findings

### Correct (no action needed)
- VCV coarticulation rule using DAC-weighted blending (Recasens 1997, Ohman 1966) -- formula and parameters defensible
- Context-dependent F2 locus dispatch for velars, bilabials, alveolars (Stevens & House 1956, Allen et al. 1987)
- Dark /l/ F2=900 Hz, F3=2400 Hz in coda position (Recasens 2012, Sproat & Fujimura 1993)
- /r/ F3 lowering: onset 1600 Hz, coda 1400 Hz (Espy-Wilson 2000, Dalston 1975, King 2020)
- DAC values assigned to all 64 phonemes in inventory

### Limited (needs improvement)
- **transition_ms: 30 is too short.** Hertz 1991 finds stable transitions of ~65ms. Stevens & House 1956 shows 40-80ms range. Recommend raising to 50ms default.
- **No consonant-class transition variation.** Liquids need ~70ms (Dalston 1975), velars ~60ms, alveolars ~40ms. Currently all use the same 30ms.
- **No formant-specific transition durations.** /r/ F3 transitions are longer than F2 transitions (~71ms vs ~50ms per Dalston 1975).
- **No rate-dependent transition behavior.** Hertz 1991's key finding: transitions are durationally stable while steady states compress at fast rates.
- **blend.factor 0.35** provides crude smoothing but is not linguistically motivated per consonant class or formant.

### Incomparable (cannot directly implement)
- Articulatory Phonology (Browman & Goldstein 1989, 1992) and Task Dynamics (Saltzman & Munhall 1989) operate in articulatory space; they validate Qlatt's general approach but cannot be directly parameterized for a formant synthesizer.
- Kirkham 2025's under-damping finding and Sorensen & Gafos 2016's nonlinear dynamics lack articulatory-to-acoustic mappings.

## Priority Recommendations

1. Raise `transition_ms` from 30 to 50ms (Hertz 1991, Stevens & House 1956)
2. Add per-class transition overrides: velars 60ms, liquids 70ms, alveolars 40ms (Dalston 1975)
3. When rate scaling is implemented, keep transitions stable (Hertz 1991)
4. Consider /r/-specific F3 transition duration of ~70ms (Dalston 1975)

## Output

- Verdict: `research/verdicts/08-coarticulation.md`
- Report: `reports/verdict-08-coarticulation.md`
- Commit: pending

## Papers Read

All 24 assigned papers' notes.md files were read (23 with extracted notes, 1 without -- Saltzman 1987 covered by Saltzman 1989). Both Wave 1 verdicts read for context. Every claim traces to a specific paper. No unverified claims.
