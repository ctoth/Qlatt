# Report: Verdict 11 — Voice Quality & Emotion

## Summary

Reviewed 38 of 47 assigned papers (notes.md) covering voice quality parameterization, emotional speech synthesis, perceptual assessment, and nonlinear vocal dynamics. Audited Qlatt synthesizer files (semantics.yaml, inventory.yaml) for voice quality and emotion capabilities.

## Key Findings

**3 WRONG claims identified:**
1. Jitter/shimmer as primary voice quality correlates — refuted by Kreiman 2010, Kreiman 2021, Fraj 2011
2. H1-H2 alone predicts voice quality type — refuted by Hanson 1997, Kreiman 2012, Doval 2006
3. Voice quality maps one-to-one to discrete emotions — refuted by Gobl 2003, Scherer 1984

**2 SUPERSEDED findings:**
4. Klatt 1990 constant aspiration noise superseded by pulsatile noise (Fraj 2011, Childers & Lee 1991)
5. Murray 1993 qualitative emotion mappings superseded by Banse 1996, Rutledge 1995, Burkhardt 2009

**5 LIMITED findings:**
6. Gobl 2003 KLSYN88 parameters — best available but single-speaker, needs Rd conversion
7. Banse 1996 emotion profiles — most comprehensive but acted speech, moderate effect sizes
8. Kreiman 2021 four-piece source model — validated but only on sustained vowels
9. Mozziconacci 1998 prosody-only emotion — confirms voice quality is essential for sadness/fear
10. Keating 2015 creaky voice taxonomy — correct but complicates synthesis

**3 INCOMPARABLE:** Dimensional vs categorical emotion models, acted vs spontaneous speech, rating scales vs analysis-by-synthesis.

## Synthesizer Audit

**Correct:** Rd as primary control (S1), bandwidth covariation (S2), flutter (S3), jitter (S4), AH parameter exists (S5).

**Issues (6):**
- A1: No voice quality presets or emotion parameters (HIGH impact)
- A2: No DI (diplophonia) parameter (MEDIUM-HIGH)
- A3: AH not coupled to Rd (MEDIUM)
- A4: No tracheal pole-zero pair (LOW)
- A5: No emotion prosody rules (MEDIUM)
- A6: Aspiration noise may not be pulsatile (LOW-MEDIUM)

## Implementation Priority

1. DI parameter in lf-source crate
2. AH-Rd coupling in semantics.yaml
3. Voice quality presets via Burkhardt 2009 rate-based formulas
4. Emotion prosody rules (F0 level/range/rate scaling)
5. Pulsatile noise for natural breathiness

## Output Files

- Verdict: `research/verdicts/11-voice-quality-emotion.md`
- Report: `reports/verdict-11-voice-quality-emotion.md`
