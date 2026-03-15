# Report: Verdict 03 — Vowel Formants

## Summary

Peterson & Barney 1952 is superseded by Hillenbrand et al. 1995 as the source of vowel formant targets for Qlatt's American English synthesizer. Every vowel except ER in `public/rules/frontends/qlatt-english/inventory.yaml` needs updating.

## Key Finding

Hillenbrand 1995 wins on every dimension of the evidence hierarchy:
- **Sample size:** 139 vs 76 speakers
- **Methodology:** LPC 14-pole vs spectrograph with Plexiglass templates
- **Coverage:** 12 vowels (adds /e/, /o/) vs 10
- **Additional data:** F4, duration, spectral change (20%/80% sampling)
- **Dialect control:** Homogeneous Michigan vs mixed pool

## Most Urgent Fixes (by delta magnitude)

| Phoneme | Parameter | Current | Recommended | Delta | % Off |
|---------|-----------|---------|-------------|-------|-------|
| EY1 | F2 | 1720 | 2089 | +369 | 18% |
| AA1 | F2 | 1090 | 1333 | +243 | 18% |
| AE1 | F2 | 1720 | 1952 | +232 | 12% |
| UH1 | F3 | 2240 | 2434 | +194 | 8% |
| AE1 | F3 | 2410 | 2601 | +191 | 7% |
| OW1 | F2 | 1100 | 910 | -190 | 21% |

All exceed Flanagan's 3% JND threshold and are perceptually significant.

## Papers Reviewed

20 papers read. Categories:
- **SUPERSEDED:** Peterson & Barney 1952, Delattre 1952 (for AE synthesis targets)
- **LIMITED:** Hao 2002 (smaller sample, L2 speakers), Story 1996 (single subject)
- **INCOMPARABLE:** Fant 1960 (Russian), Harrington 2011 (SSBE), Ericsson 2020 (Swedish), Collins 2003, Fitch 1999, Deloche 2020

## Verdict File

Full analysis with complete replacement value tables: `research/verdicts/03-vowel-formants.md`

## Open Questions

1. Should monophthongs get spectral change data? H95 shows classification jumps from 68% to 94% with trajectory info.
2. The /ae/ F1 discrepancy (P&B 660, H95 588, Hao 653) may reflect dialect variation — flag for perceptual testing.
3. EY1 and OW1 current values appear to be interpolations since P&B lacked /e/ and /o/ — replace with H95 direct measurements.

## Commit

Commit hash: TBD (will be filled after commit)
