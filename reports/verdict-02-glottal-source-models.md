# Report: Verdict 02 -- Glottal Source Models

## Papers Read

44 of 47 assigned papers had `notes.md` available and were read. Missing: Fant 1995 (no notes.md; content subsumed by Fant 1997), Lu & Smith (singing voice, notes read), Moore 2004 (notes read). Three papers (Fant_1995, Koenig_LaryngealFactors, Anumanchipalli_KLATTSTAT) had limited or missing notes but their contributions are covered by other papers in the set.

## Key Findings

The LF model (Fant 1985) implemented via the LFLM causal linear-filter equivalent (Perrotin 2021) is the consensus best-practice glottal source for formant synthesis -- no paper in the set argues for replacing it. Fant's Rd parameter (1995/1997) is the single most important voice quality control, compressing the LF parameter space into one perceptually meaningful dimension (0.3=pressed, 2.7=breathy). The most critical gap in Qlatt's current implementation is the absence of aspiration noise coupling to Rd: Klatt & Klatt 1990 showed that aspiration noise (AH) is the single most important perceptual cue for breathiness, more important than spectral tilt or OQ, yet Qlatt's AH is independent of Rd.

## Synthesizer Audit Items

| ID | Priority | Issue | Action |
|---|---|---|---|
| A1 | HIGH | AH (aspiration) not coupled to Rd | Add `AH = max(0, 10*(effectiveRd - 1.0))` in semantics.yaml |
| A2 | CONFIRMED OK | B1 already has Fant 1997 glottal leakage formula | No action needed |
| A3 | MEDIUM | No female voice defaults | Add Rd=1.0 female preset; inventory or persona system |
| A4 | MEDIUM | No tracheal pole-zero (FTP/FTZ) | Add ~2 kHz pole-zero pair per Hanson 2001 |
| A5 | LOW | B1 correction not pitch-synchronous | Would need per-cycle recalculation; defer |
| A6 | LOW | Rd range validation weak | Clamp more aggressively at boundaries; current code already clamps 0.3-2.7 |
| A7 | LOW | No diplophonia/subharmonics | Add period-alternating Rd perturbation; low priority |

## Critical Gaps

1. **Aspiration-Rd coupling** (A1): Highest priority. Klatt 1990 perceptual data shows AH is the most important single breathiness cue, yet Qlatt treats AH as fully independent of voice quality.
2. **Female voice defaults** (A3): Holmberg 1995, Hanson 1995/1997 all show female voice source differs systematically (higher TL, more aspiration, different H1*-H2* distributions). No female-specific Rd default exists.
3. **Tracheal coupling** (A4): Hanson 2001/2002 show the ~2 kHz tracheal pole-zero pair is essential for natural female voice quality and important for male pressed voice.

## Verdict Categories

- **WRONG (2)**: H1-H2 as reliable OQ estimator (Henrich 2001 disproved); triangular glottal pulse as adequate source (Rosenberg 1971 disproved)
- **SUPERSEDED (4)**: Rosenberg pulse by LF model; KLGLOTT88 by LF+Rd; independent source parameters by Rd covariation; Flanagan quasi-static approximation by full aerodynamic models
- **LIMITED (4)**: LF model itself (no aspiration noise, no subglottal coupling, no anterior-posterior phase differences); Rd regression (breaks at extremes Rd<0.3, Rd>2.5); H1*-A3* as spectral-tilt proxy (confounded by F4/F5 effects); inverse-filtering accuracy (systematic errors above F3)
- **INCOMPARABLE (2)**: CALM vs LF (different parameterization goals, both valid); EGG vs flow-based OQ (measure different things)
