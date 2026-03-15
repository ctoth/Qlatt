# Report: Master Synthesis — Literature Verdict Consolidation

## Finding Counts

| Category | Count | Key Items |
|----------|-------|-----------|
| WRONG | 9 | P&B vowel formants, fixed ndbScale, /k/ VOT ordering, D_CL too short, uniform VT scaling, H1-H2 as OQ, jitter/shimmer primacy, emotion one-to-one, F0-only gender |
| SUPERSEDED | 11 | P&B by Hillenbrand, Fant 1960 source by LF, Flanagan radiation by Chalker, Klatt impulse by LFLM, LF by Rd, O'Shaughnessy by AM/ToBI, Port by Crystal & House, Klatt 1976 by van Santen, Oller by Wightman, Murray by Banse, constant aspiration by pulsatile |
| LIMITED | 20+ | Across all 12 verdicts; includes source-filter independence, HPC, fixed transitions, duration rules, ToBI reliability, Gobl 2003 parameters |

## Top 5 Implementation Priorities

1. **Update 11 vowel formant targets to Hillenbrand 1995** -- Immediate improvement to every utterance; up to 369 Hz correction (Verdict 03)
2. **Fix /k/ VOT**: K_ASP 48 -> 58 ms to restore universal place ordering (Verdict 06)
3. **Add incompressibility floor to duration rules**: D_min = 0.42 * D_inherent prevents sub-physiological durations from rule stacking (Verdict 09)
4. **Add AH-Rd coupling**: Aspiration noise must covary with breathiness; essential for voice quality, emotion, and female voice (Verdicts 02, 11, 12)
5. **Increase transition_ms from 30 to 50 ms**: Below literature consensus of 40-80 ms (Verdict 08)

## Confidence Map Summary

| Rating | Count | Topics |
|--------|-------|--------|
| Solid ground | 4 | Glottal source, formant bandwidths, fricatives, nasals |
| Needs calibration | 5 | Source-filter, vowel formants, stops/VOT, coarticulation, prosody |
| Needs repair | 1 | Duration models |
| Needs architecture | 2 | Voice quality/emotion, gender/speaker differences |

## Cross-Topic Contradictions

No direct contradictions found between the 12 verdicts. All findings are mutually consistent. The closest tension is between the reliance on Klatt 1976 multiplicative rules (best implementable option) and van Santen 1994's superior but unpublished sums-of-products parameters.

## Commit

Files written:
- `research/verdicts/00-master-synthesis.md`
- `reports/verdict-00-master-synthesis.md`
