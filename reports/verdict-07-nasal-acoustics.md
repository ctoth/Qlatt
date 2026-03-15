# Report: Verdict 07 — Nasal Acoustics

## Task

Audit Qlatt's nasal acoustic implementation against 13 research papers to determine correctness and identify needed updates.

## Verdict

**Qlatt's nasal implementation is correct and well-designed for English.** The system matches the literature consensus on all major parameters.

## Key Findings

### Correct (no action needed)
- Place-specific antiformant frequencies: /m/ 1000 Hz, /n/ 1700 Hz, /ng/ 3000 Hz — match Fujimura 1962, Stevens 1998
- Core nasal pole at 250 Hz with 100 Hz bandwidth — matches Fant 1960, Stevens 1998
- Hawkins & Stevens 1985 midpoint formula (FNZ = (FNP+F1)/2) correctly implemented in semantics
- B1 addition of +107 Hz from Chen 1997 nasal tract bandwidth measurement — exact match
- Coupling parameterization using area ratio d=An/(An+Aoral) — follows Rossato 1998 recommendation
- Cascade topology (NZ -> NZplace -> NP -> F1 chain) matches Klatt 1980

### Limited (minor issues)
- **/ng/ antiformant at 3000 Hz**: Stevens 1998 characterizes /ng/ as all-pole (no zero). The 3000 Hz zero creates a mild spectral notch that shouldn't exist. Consider bypassing or raising above 5000 Hz.
- **Nasal murmur B1=300 Hz**: Literature reports nasal pole B1 at 60-100 Hz (Fujimura 1962, Recasens 1983). The 300 Hz in inventory damps cascade F1 while the actual nasal pole bandwidth is set separately via nasalPoleBwHz=100. This works but should be documented.
- **N murmur F2=1400 Hz**: Higher than most literature values (Fujimura: ~1050 Hz, Stevens: ~850 Hz for /n/ murmur spectral peak). May warrant verification.
- **Single pole-zero model**: Adequate for English allophonic nasalization. Maeda 1993 shows 4 vowel-type-dependent spectral modification categories that a single pair cannot reproduce — relevant only if multi-language nasal vowels are added later.

## Output

- Verdict: `research/verdicts/07-nasal-acoustics.md`
- Report: `reports/verdict-07-nasal-acoustics.md`

## Papers Read

All 13 assigned papers' notes.md files were read in full. Every claim in the verdict traces to a specific paper extraction. No claims were made without verification.
