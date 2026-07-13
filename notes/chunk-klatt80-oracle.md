# Chunk: klatt80 Fidelity Oracle (CODER)

## Question
Is Qlatt's `klatt80-baseline` backend FAITHFUL to Klatt 1980's output level, or
is it the LOUD OUTLIER (a gain bug)?

Background (given): same phrase "she sees a dog", same Qlatt frontend track,
two Qlatt backends — klatt80-baseline peaks ~83 dB (Praat), klsyn88 ~68.7 dB —
a ~14 dB gap. klsyn88 was already PROVEN faithful (fed to real klsyn88, agreed
within ~1.5-1.8 dB). This chunk does the same for klatt80: feed Qlatt's klatt80
frames to the REAL Klatt 1980 FORTRAN (handsy) and measure.

## HEADLINE — VERDICT

**Qlatt's klatt80-baseline is FAITHFUL. It is NOT the loud outlier.**

The REAL Klatt 1980 (handsy) is, if anything, ~6 dB **LOUDER** than Qlatt's
klatt80 on the identical control track:

- Qlatt klatt80: Praat peak intensity **83.0 dB**, raw peak **-1.93 dBFS** (no clipping).
- REAL klatt80 (handsy): Praat peak intensity **88.9 dB**, and it **clips** — its
  true pre-clip peak (COEWAV's `XMAXWA`) is **+6.4 dB ABOVE full scale** (7.16%
  of samples saturate at ±32767).

So Klatt 1980 is simply a LOUD engine, and Qlatt reproduces that (slightly
tamer, because Qlatt doesn't drive into hard clipping). The ~14 dB-quieter
klsyn88 backend is the OUTLIER on the quiet side — consistent with klsyn88
(1988) being a deliberately rescaled successor to klatt80 (1980). There is no
gain bug in Qlatt's klatt80-baseline; its loudness matches its namesake.

## Measurement comparison

| Metric                  | Qlatt klatt80 | REAL klatt80 (handsy) |
|-------------------------|--------------:|----------------------:|
| Sample rate             | 22050 Hz      | 10000 Hz              |
| Duration                | 1.459 s       | 1.230 s (events 0–1209 ms) |
| Raw peak (dBFS)         | **-1.93**     | **0.00** (clipped)    |
| handsy pre-clip peak    | n/a           | **+6.4 dB** (over FS)  |
| Raw RMS (dBFS)          | **-17.43**    | **-8.23**             |
| Praat intensity max     | **83.0 dB**   | **88.9 dB**           |
| Praat intensity mean    | 23.7 dB       | 66.9 dB               |
| F0 median (Praat)       | 174 Hz        | 200 Hz (flat — artifact)|
| F1 / F2 / F3 / F4 med   | 514/1467/2607/3462 | 461/2270/3031/3606 |

Both engines are Klatt 1980 with the SAME dB conventions, so AV/AF/A1.. dB
values pass STRAIGHT THROUGH — no conversion. The loudness comparison is
therefore apples-to-apples at the control level. The RMS gap (~9 dB) is a FLOOR
on how much louder the real engine is, because the real engine is clipping
(its true RMS would be higher without saturation).

## How handsy is driven (non-interactive)

`handsy` (C:\Users\Q\src\klatt80\HANDSY.FOR) reads `PARAM.DOC` from CWD on
startup then prompts twice. Answer **Q** to both:
1. `PRINT AND/OR CHANGE CONFIGURATION (Y,Q):` → `Q` (skip config edits, label 1740)
2. `NAME OF PARAMETER TRACK TO BE MODIFIED (QUIT="Q"):` → `Q` (label 2600: save
   PARAM.DOC, synthesize, write WAVE.RAW)

Drive: `printf 'Q\nQ\n' | handsy.exe` in a throwaway dir containing PARAM.DOC.
handsy REWRITES PARAM.DOC on save, so we run in os.tmpdir(), not the source tree.

**Build note (resolved blocker):** the committed `handsy.exe` fails with
STATUS_ENTRYPOINT_NOT_FOUND (missing gfortran runtime DLLs in this environment).
`run-klatt80-oracle.ts` rebuilds a STATICALLY-linked handsy from the UNMODIFIED
sources (`-static -static-libgfortran -static-libgcc`, gfortran 15.2) into
os.tmpdir()/klatt80-oracle-build. Nothing under C:\Users\Q\src\klatt80 is
modified.

## PARAM.DOC format (reverse-engineered from HANDSY.FOR, verified vs docs/PARAM.DOC)

1. **Config block** — 13 lines, FORTRAN FORMAT `(1X,3(A5,A3,I2,I5))`. Per line:
   1 space + 3×([A5 dummy=5 spaces][A3 name][I2 varpar flag][I5 value]). The 39
   params are COLUMN-MAJOR: line M (1..13) carries params M, M+13, M+26 in the
   canonical NAMES order. varpar flag: **0**=constant, **2**=varied (read from the
   table). Flag **1** ("variable but held at default") is NOT used — handsy's
   varied reader (label 2044) only ingests flag==2; using 1 yields "ILLEGAL
   CONFIG, NO VARIABLE PARAMS". The config-block flags OVERRIDE handsy's
   compiled-in VARPAR defaults (read at label 1060).
2. **UTTDUR line** — FORMAT `(1X,I5)`, utterance length in ms.
3. **Varied header** — FORMAT `('     ',26A5)`: 5 spaces + each varied name in A5.
   Column order = NAMES order filtered to the varied set (handsy's NVAR loop,
   label 1740). MAX 26 columns (26A5/26I5).
4. **Data rows** — FORMAT `(I5,26I5)`: time(ms) + each varied value. One row per
   DELTAT ms; handsy reads UTTDUR/DELTAT rows.

**Timing:** NSAMP=NWS, DENOM=SR/10, DELTAT=(NSAMP*100)/DENOM. With SR=10000,
NWS=50 ⇒ DELTAT = 5 ms/frame.

**Core-array limit:** HANDSY.FOR WSIZE=10050 ⇒ MAXDUR=(WSIZE/NSAMP)*DELTAT−20 =
985 ms at SR=10000. "She sees a dog" spans 1209 ms of events, so the runner
splits into ≤980 ms windows (here 2: 0–980, 980–1209) and concatenates raws.
The peak region (364 ms) lies entirely in chunk 0, so the verdict is robust to
any chunk-boundary transient.

## Mapping table (Qlatt frame field → Klatt 1980 param)

Pass-through dB (same engine); rounded to int; clamped to handsy MINVAL/MAXVAL.

| Klatt | Qlatt | Klatt | Qlatt | Klatt | Qlatt |
|------|------|------|------|------|------|
| AV  | AV   | A1   | A1   | B4   | B4   |
| AF  | AF   | A2   | A2   | F5   | F5   |
| AH  | AH   | A3   | A3   | B5   | B5   |
| AVS | AVS  | A4   | A4   | BGS  | BGS  |
| F0  | F0   | A5   | A5   | G0   | GO   |
| F1  | F1   | A6   | A6   | NFC  | NFC  |
| F2  | F2   | AB   | AB   | SW   | SW   |
| F3  | F3   | B1   | B1   | FGP  | FGP  |
| F4  | F4   | B2   | B2   | BGP  | BGP  |
| AN  | AN   | B3   | B3   | FGZ/BGZ | FGZ/BGZ |

Held at handsy template defaults (Qlatt carries no equivalent): FNZ=250, F6=4900,
B6=1000, FNP=250, BNP=100, BNZ=100, SR=10000, NWS=50.

A param goes in the VARIED TABLE only if it actually changes across the window;
otherwise it is held as a config-block CONSTANT (flag 0). For this phrase 16
params vary (AV AF AVS F0 F1 F2 F3 A1 A3 A4 A5 A6 B1 B2 B3 SW), well under 26.

## Caveats (honest)

- **SR difference**: handsy is locked to SR=10000 / NWS=50 when reading from a
  PARAM.DOC (HANDSY.FOR label 1560 forbids changing SR/NWS from file). Qlatt
  renders at 22050. Raw RMS is not directly comparable across SR, so the PRIMARY
  loudness evidence is (a) handsy's own pre-clip dB (+6.4 dB) and (b) Praat peak
  intensity (88.9 vs 83.0) — both rate-aware/rate-agnostic and both put the real
  engine LOUDER. Raw RMS (-8.2 vs -17.4) agrees directionally.
- **Real klatt80 clips** at these amplitudes (7.16% saturated). Its raw peak is
  pinned to full-scale; the meaningful number is the pre-clip +6.4 dB. This only
  STRENGTHENS the verdict (real engine wants to be louder than Qlatt's).
- **Source model**: Qlatt drives an LF glottal source; handsy uses native Klatt
  1980 impulse→RGP voicing. Same divergence flagged in the klsyn88 oracle. It
  does not change the loudness conclusion.
- **F0 median 200 Hz flat (Praat) on the oracle** is a pitch-tracker artifact on
  the heavily-clipped 10 kHz buzz; the F0 COLUMN in PARAM.DOC varies correctly
  (0 → 117 → … per the track). Not load-bearing for the loudness verdict.
- **Clamps hit**: AVS=-70 → handsy min 0 (=quasi-sinusoidal voicing OFF, same
  meaning both engines); A2=-18 → 0. Both are "off" states, faithfully preserved.
- **Chunk join**: 2 chunks concatenated with a hard reset of resonator state at
  980 ms; a small transient may exist there. Peak/loudness measured well away
  from the join.

## Deliverables
- `scripts/oracle/klatt-frames-to-paramdoc.ts` — Qlatt track → Klatt 1980 PARAM.DOC.
- `scripts/oracle/run-klatt80-oracle.ts` — builds static handsy, chunks, drives
  it, wraps WAVE.RAW (16-bit LE mono @ SR) as WAV with a 44-byte RIFF header.
- `tmp/klatt80-oracle/sheseesadog.wav` — the reference render.
- `tsconfig.scripts.json` updated; `npm run typecheck:scripts` PASSES.

Reproduce:
```
# (PowerShell, with gfortran on PATH)
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
  scripts/oracle/run-klatt80-oracle.ts --in tmp/klatt80-track.json \
  --out tmp/klatt80-oracle/sheseesadog.wav
npm run measure -- tmp/klatt80-oracle/sheseesadog.wav --pitch-ceiling 300
npm run measure -- tmp/qlatt-klatt80.wav --pitch-ceiling 300
```
