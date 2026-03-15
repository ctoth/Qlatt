# Report: Verdict 05 — Fricative Acoustics

## Task
Read 11 assigned paper notes, audit `inventory.yaml` and `duration.yaml` for fricative parameters, write verdict.

## Deliverable
`research/verdicts/05-fricative-acoustics.md`

## Summary

All 11 papers were read. Two synthesizer files were audited:
- `public/rules/frontends/qlatt-english/inventory.yaml` — fricative AF, A-params, formant targets
- `public/rules/frontends/qlatt-english/phases/duration.yaml` — fricative duration rules

**Result: No parameters are WRONG or SUPERSEDED. The implementation is consistent with the literature.**

### Key Findings

1. **AF hierarchy is correct.** SH (66) > S (60) > F (42) > TH (40), with voiced variants 10 dB below. Matches Shadle 1985, Behrens & Blumstein 1988, Jongman 2000.

2. **A-param spectral envelopes are correct.** Two distinct shapes:
   - Sibilants: peaked rolloff (S peaks at A6, SH peaks at A3, both roll off above)
   - Non-sibilants: flat/rising HF (A8 >= A7 for F, TH, V, DH)
   - The flat/rising non-sibilant pattern matches Shadle 2023's critical finding. Already implemented with correct citation.

3. **Duration minimums are correct.** Sibilant 30 ms, labiodental 50 ms, dental 60 ms — all citing Jongman 1989.

4. **Early studies (Hughes 1956, Heinz 1961) are LIMITED but not WRONG.** Their spectral classifications and peak locations are confirmed by all later work. Band-limitation to 10 kHz means they miss non-sibilant HF detail that Shadle 2023 captures.

### Potential Improvements (not bugs)
- Gender-variant spectral peaks (Shadle 2023: women F_M ~1-2 kHz higher)
- Could split sibilant minimum: /sh/=30 ms vs /s/=50 ms (low priority, base durations already 90-100 ms)
- Time-varying A-params during fricative onset (Badin 1989: HF energy rises faster)

### Paper Verdicts
| Paper | Verdict |
|-------|---------|
| Hughes & Halle 1956 | LIMITED (bandwidth) |
| Heinz & Stevens 1961 | LIMITED (single speaker) |
| Shadle 1985 | ADEQUATE |
| Shadle 2023 | ADEQUATE |
| Jongman 2000 | ADEQUATE |
| Jongman 1989 | ADEQUATE |
| Behrens & Blumstein 1988 | ADEQUATE |
| Harris 1958 | ADEQUATE |
| Badin & Fant 1989 | LIMITED (single speaker) |
| Stevens 1971 | ADEQUATE |
| Stevens 1998 | ADEQUATE |

## Commits
- `d8c57fb` — verdict file (research/verdicts/05-fricative-acoustics.md)
- `72b0157` — report file (reports/verdict-05-fricative-acoustics.md)
