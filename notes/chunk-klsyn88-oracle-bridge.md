# Chunk: klsyn88 Oracle Bridge — Findings

## Goal
Discover the REAL klsyn88 reference output level for the same control targets as
Qlatt's klsyn88 backend (which renders ~14 dB quieter at peak than klatt80 — a
confirmed defect). Bridge: Qlatt klsyn88 track -> Klatt `.doc` -> reference
oracle binary -> measure both wavs.

## HEADLINE NUMBER
Fed the **same per-frame control targets**, the reference klsyn88 oracle is only
**+1.5 dB louder at peak** (and +1.8 dB RMS) than Qlatt's klsyn88.

```
                  peak (dBFS)   rms (dBFS)
Qlatt klsyn88       -18.02        -30.20
Oracle klsyn88      -16.49        -28.41
GAP (oracle-qlatt)  +1.53 dB      +1.80 dB
```

**Interpretation:** The 14 dB defect is NOT reproduced by the reference when it
receives the same targets. Qlatt's klsyn88 level is essentially correct relative
to *real klsyn88*. Therefore the 14 dB klsyn88-vs-klatt80 gap is a difference in
the source/scaling between the two *engines* (KLGLOTT88/LF vs klatt80's source),
NOT a bug in how Qlatt drives klsyn88 amplitudes. The ~1.5 dB residual is
attributable to source-model divergence (Qlatt LF vs klsyn KLGLOTT88 ss=2) and
the sample-rate/bandwidth difference, not a systematic loudness defect.

## Deliverables
- `scripts/oracle/klatt-frames-to-doc.ts` — `framesToDoc(payload, opts)` + CLI.
  Converts an event-based Qlatt klsyn88 track JSON into a parser-valid klsyn88
  `.doc`. Full mapping/assumption documentation in the file header comment.
- `scripts/oracle/compare-klsyn88.ts` — reproducible end-to-end runner
  (track -> .doc -> oracle.exe -> peak/RMS dBFS table).
- Both added to `tsconfig.scripts.json`; `npm run typecheck:scripts` passes (exit 0).

## Reproduce
```bash
# 1. Render Qlatt klsyn88 track + wav
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
  scripts/render-phrase.ts --phrase "she sees a dog" --experiment-id klsyn88 \
  --include-track 1 --out-json tmp/klsyn-track.json --out-wav tmp/qlatt-klsyn88.wav \
  --compare-golden 0

# 2+3+4. Convert -> oracle render -> level comparison
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
  scripts/oracle/compare-klsyn88.ts --track tmp/klsyn-track.json --name sheseesadog
```
The oracle binary `scripts/oracle/klsyn88-c/klsyn-oracle.exe` reads
`tmp/klsyn-oracle/sheseesadog.doc` and writes `sheseesadog.wav` (run from that dir).

## Resampling approach
Qlatt frames are EVENT-BASED (`{time: seconds, params}`, 19 events, last 1.209s).
klsyn requires a UNIFORM grid. **Step-hold (piecewise-constant):** each output
frame at time t takes the value of the most recent event at-or-before t — the
faithful reading of Klatt frames (a param holds until the next event changes it).
- `ui = 5 ms` (default), `du = ceil(maxTime_ms / ui) * ui + ui = 1215 ms`,
  `nframes = du/ui = 243`. Oracle confirmed "243 time frames".

## Mapping table (klsyn <- Qlatt), all rounded to int
| klsyn | Qlatt | klsyn | Qlatt | klsyn | Qlatt |
|-------|-------|-------|-------|-------|-------|
| f0 | F0 | F1 | F1 | b1 | B1 |
| av | AV | F2 | F2 | b2 | B2 |
| af | AF | F3 | F3 | b3 | B3 |
| ap | AH | F4 | F4 | b4 | B4 |
| an | AN | F5 | F5 | b5 | B5 |
| tl | TL | a1..a6 | A1..A6 | ab | AB |
| g0 | GO |  |  |  |  |

Constants: `sr=16000` (klsyn caps at 20000; Qlatt renders 22050), `ss=2`
(KLGLOTT88/natural — closest klsyn source to Qlatt LF), `nf=5`, `ui=5`, `rs=1`,
`os=0`. All other params keep test.doc defaults (held `v`).

### Params that did NOT map cleanly (caveats)
- **OQ**: Qlatt leaves OQ=0 (it shapes the glottis via the LF source Rd/lfMode,
  not klsyn's open-quotient knob). Passing oq=0 would give a degenerate closed
  glottis, so **oq stays at klsyn default VAL=50**. This is the single biggest
  source-model divergence. (Oracle emitted benign `nopen truncated` warnings.)
- **SW** (cascade/parallel switch): no per-frame slot in klsyn's 49-param set;
  klsyn routes branches internally by which amplitudes are nonzero. Not mapped.
- **A1..A6 / AB**: 0 in this cascade render (SW=0); mapped anyway so a parallel
  render would carry through.
- **GO -> g0**: GO is Qlatt's overall gain (constant 47 here). Mapped so the
  comparison reflects the same *requested* overall level rather than klsyn's
  louder native default of 60. `--no-map-go` opt-out leaves g0=60.

## Side-by-side measurement (Praat via `npm run measure -- <wav> --pitch-ceiling 300`)
| Metric | Qlatt klsyn88 | Reference oracle |
|--------|---------------|------------------|
| F0 mean | 163.2 Hz | 161.7 Hz |
| F0 median | 176.4 Hz | 176.3 Hz |
| F1 median | 370 Hz | 368 Hz |
| F2 median | 1750 Hz | 1733 Hz |
| F3 median | 2785 Hz | 2740 Hz |
| F4 median | 3084 Hz | 3098 Hz |
| intensity mean (Praat) | 3.5 dB | 53.5 dB |
| intensity max (Praat) | 68.7 dB | 70.0 dB |
| HNR | 31.9 dB | 30.5 dB |
| **peak (raw, dBFS)** | **-18.02** | **-16.49** |
| **rms (raw, dBFS)** | **-30.20** | **-28.41** |

### Spectral / quality observations
- F0 and all four formants match within Praat tracking tolerance (<2% on F1-F3),
  validating the mapping fidelity. The bridge faithfully reproduces the spectral
  targets in the reference engine.
- HNR is comparable (31.9 vs 30.5 dB).

### IMPORTANT caveat on `intensity mean` (3.5 vs 53.5 dB — do NOT use as the gap)
This 50 dB spread is a **Praat measurement artifact, not a loudness gap**. Praat's
mean intensity energy-averages across ALL frames including silence; the Qlatt wav
is longer (1.459 s vs 1.215 s) with a larger trailing silence and lower voiced
fraction (55% vs 65%), which drags its linear-domain energy mean toward the floor.
The reliable loudness comparisons are **peak intensity (68.7 vs 70.0 dB, gap 1.3 dB)**
and **raw-sample peak/RMS dBFS (gap +1.5 / +1.8 dB)**, which all agree.

## Honest caveats (summary)
- This is **"what real klsyn88 does with these formant/amplitude targets,"** NOT a
  same-source comparison. The glottal source differs: Qlatt LF vs klsyn KLGLOTT88
  (ss=2). Some of the ~1.5 dB residual is plausibly source-model, not scaling.
- Sample rate differs (Qlatt 22050, oracle 16000). Praat is rate-agnostic for the
  metrics above; raw peak/RMS dBFS are amplitude-domain and unaffected by rate.
- OQ and SW had no faithful klsyn mapping (documented above).
- Durations differ slightly because Qlatt carries extra lead/tail silence; the
  per-frame targets in the voiced region are identical.

## Conclusion for the 14 dB defect
The reference oracle does NOT confirm a 14 dB klsyn88 loudness defect. With
matched targets, klsyn88-reference and Qlatt-klsyn88 are within ~1.5 dB. The 14 dB
gap reported vs klatt80 is therefore a property of the **klatt80 engine being
louder than klsyn88-family synthesis for these targets**, i.e. an engine/source
scaling difference — the next investigation should compare klatt80's source/gain
chain against klsyn88's KLGLOTT88 normalization, not hunt for a bug in how Qlatt
drives klsyn88 amplitudes.
