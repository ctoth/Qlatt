# Report: Verdict 04 — Formant Bandwidths

## Summary

Audited Qlatt's formant bandwidth values (B1-B6 for all vowels, B7-B10 derived rules, dynamic adjustment system) against 8 papers from the collection.

## Verdicts

| Component | Verdict | Notes |
|-----------|---------|-------|
| B1-B3 steady-state (per vowel) | **LIMITED** | Within K&V 2018 ranges but no authoritative American English vowel-specific BW dataset exists. OW1 B3=70 Hz is below all published ranges. |
| B4-B6 defaults | **LIMITED** | B4=250 reasonable (Fant 1960). B5=200 below B4 (uncited). B6=1000 engineering approx for HPC regime. |
| B7-B10 derived (Rabiner 1968 Q) | **CORRECT** | Correctly cited and implemented. |
| B1/B2 dynamic adjustment | **CORRECT** | Fant 1997 glottal leakage + Stevens 1998 F0-proximity + nasal coupling. All citations verified. |

## Key Finding

Bandwidth is the "dark matter" of formant synthesis. Kent & Vorperian 2018 did NOT resolve the problem -- their Table 5 provides only broad ranges (B1=50-80, B2=70-120, B3=100-180 Hz male), not vowel-specific values. The best vowel-specific data in the collection is Fant 1960 Table 2.34-1 (Russian vowels). Qlatt's current approach -- K&V ranges as guide, per-vowel tuning, dynamic correction from Fant 1997 and Stevens 1998 -- is the best available engineering strategy.

## Action Items

1. **Fix OW1 B3=70 Hz** -- below all published minimums (K&V min 100, Fant min 77). Raise or cite.
2. **Cite B5=200 Hz** -- currently uncited; if engineering estimate, label it.
3. No urgent changes to the bandwidth adjustment system.

## Files Audited

- `public/rules/frontends/qlatt-english/inventory.yaml` — all vowel B1-B3 values
- `public/experiments/klatt80-baseline/semantics.yaml` — B1/B2 realize rules, B4-B6 defaults, B7-B10 derivation

## Verdict Written To

`research/verdicts/04-formant-bandwidths.md`

## Commit

Pending -- see below.
