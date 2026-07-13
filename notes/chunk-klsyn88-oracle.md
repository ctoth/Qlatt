# Chunk: stand up the klsyn88 reference oracle

Session 2026-06-11. Branch dectalk-parity. Goal charter: notes/actual-goal-engine-separation.md.
Q decision: PAUSE amp-table chunk; stand up klsyn88 oracle FIRST so klsyn88's true
loudness is known before retuning. Then do separation+loudness against ground truth.

## Why an oracle (the clean property)
klsyn88 is a PARAMETER→speech synth (not TTS). So the oracle is a pure BACKEND
conformance test: feed the real klsyn88 the SAME Klatt frames Qlatt's klsyn88
backend gets, compare waveforms — frontend entirely out of the picture. Also
yields klsyn88's true loudness to fix the 14 dB quiet (baseline in charter).

## What the reference actually is (scout: notes via Explore, 2026-06-11)
- C:\Users\Q\src\klsyn = Dennis Klatt's C core (c/parwv.c, 42KB; c/klsyn.c, 34KB)
  wrapped by Python/Cython (klsyn/*.pyx, scripts/klattsyn.py). NOT Nim.
- Python path is Python 2.6/2.7 + Cython + numpy + scipy + wxpython → PAINFUL on
  modern Windows. AVOID if possible.
- **KEY: c/klsyn.c HAS standalone `int main()` (line 116).** So a standalone C CLI
  exists → compile klsyn.exe from c/klsyn.c + c/parwv.c with gcc/MSVC, bypass
  Python entirely. THIS IS THE PLANNED PATH.
- Nim IS installed (2.2.8) but irrelevant — no Nim in this repo.

## Input format (.klp) — generate from Qlatt frames
Text file: constant params (du, sr, nf, ss, ui, oq, g0, agc...), then a
`_varied_params_` marker, then a header row `_msec_ f0 av F1 b1 F2 b2 ...` and one
row per frame (frame interval = `ui` ms, typically 5). Sample: c/.. doc/testklp.klp.
Param map (from klatt_wrap.pyx): f0,av,F1,b1,F2,b2,F3,b3,F4,b4,F5,b5,f6,b6,fz,bz,
fp,bp,ah,oq,at,tl,af,sk,a1..a6,p1..p6,an,ab,ap,g0,dF,db. All amps in dB.

## Amplitude semantics (THE quiet-defect clue, from c/parwv.c)
- av (voicing): `AVdb = av - 7`, then DBtoLIN, then **×0.05** voice scale.
- af (frication): DBtoLIN ×0.25. ap (aspiration): DBtoLIN ×0.05.
- g0 (master gain): `Gain0 = g0 - 3`; if ≤0 → 57. Final out = DBtoLIN(Gain0)×signal.
- Defaults: av=60, g0=60. Scout note: av=60→AVdb=53 is modest; nominal strong
  voice ≈ av=67-70. Qlatt's klsyn88 backend must replicate av-7, ×0.05, g0 or be
  off-level. Output: 16-bit WAV, sr default 11025 Hz.

## Plan
1. Read c/klsyn.c main() + c/README → learn standalone CLI invocation + EXACT
   input format it reads (.doc? .klp?) + output. [NEXT]
2. Compile standalone (gcc first, MSVC fallback): klsyn.c + parwv.c → klsyn.exe.
3. Write scripts/oracle/klatt-frames-to-klp.ts (Qlatt track → .klp), honoring dB
   conversions + ui frame interval.
4. Render a phrase's klsyn88 track through both Qlatt backend and klsyn.exe;
   measure both WAVs with `npm run measure`; compare peak/spectra. Establishes
   true klsyn88 loudness + backend conformance baseline.

## BUILD PROGRESS (the C standalone path — CHOSEN)
The standalone klsyn.c is GUTTED: read_doc commented out in main (line ~158),
WAV-writing commented out in 's' handler (writwave, edit 000005, lives in a
MISSING writwave.c — replaced by Python/scipy). So restoring needs: re-enable
read_doc + write a NEW WAV writer (writwave.c is gone).

Facts nailed:
- iwave = `int16_t *` (klsyn.c:74), nsamtot samples, rate = SAMRAT. Trivial RIFF.
- Flag chars (klsyn.h): FIXED='C', VARIABLE='v', VARRIED='V'. NPAR=49.
- Param tables in klsyn.h: maxval[], minval[], cdefval[] (sr=11025,nf=5,du=500,
  ss=2,ui=5,rs=1, f0=100, av=60, F1=500...). Symbol names 2-char (f0,av,F1,b1...).
- .doc format (from doc/test.doc, doc/shUt.doc — REAL TEMPLATES in ~/src/klsyn/doc):
  boilerplate lines (ignored) → `    49 parameters` → config block, 2 params/line
  `SYM V/C MIN VAL MAX  SYM V/C MIN VAL MAX` (sr..db, 49 total) → blank → 
  `Varied Parameters:` → header `time f0 av F1 ...` → nframes rows `tms v0 v1 ...`.
  Params flagged 'V' (upper) appear in the varied table; 'v'/'C' do not.
  nframes = du/ui. All values INTEGER (Hz, dB). shUt.doc varies f0,av,F1,F2,F3,
  F4,oq,af,a3,a4,a5,a6.
- compilers present: MinGW gcc 15.2, clang 19. Build with gcc.

Edits made to scripts/oracle/klsyn88-c/klsyn.c (copies; ~/src/klsyn untouched):
- [done] +#include <stdint.h>
- [done] +write_wav() minimal 16-bit mono RIFF writer (after symdigit decl).
- [TODO] uncomment read_doc(dname) in main.
- [TODO] in 's' handler: call write_wav(wname,iwave,nsamtot,SAMRAT); if(batch)exit(0);
  (batch loops forever otherwise — while(1) re-synth).
Diagnostics so far = only MSVC-style deprecation warnings (clang LSP) — benign for gcc.

Invocation target: `klsyn-oracle -b NAME` → reads NAME.doc, writes NAME.wav, exits.

## ✅ ORACLE BINARY WORKS (2026-06-11)
Build: `gcc -std=gnu89 -O2 -w -o klsyn-oracle.exe klsyn.c parwv.c -lm` (K&R-era
code needs gnu89 — empty-paren decls of fopen/exp/cos conflict with C23 protos).
Edits beyond the 3 planned: makefilenames used `.klt` → changed to `.doc` (read_doc
reads the .doc format; all sample files are .doc; .klt format has no samples and
read_klt stays disabled).
Invocation: `klsyn-oracle.exe -b NAME` (run from dir with NAME.doc) → NAME.wav, exits.
VALIDATED: rendered ~/src/klsyn/doc/shUt.doc → 8000 samples @ 16000 Hz (matches
doc config), authentic Klatt warnings ("At f0=75 nopen truncated"), measured F0
112 Hz, F1 435/F2 1340/F3 2152, intensity max 73.8 dB. Real synth, real audio.

## NEXT: frames→.doc bridge (delivers the loudness answer)
scripts/oracle/klatt-frames-to-doc.ts: Qlatt klsyn88 render payload (track frames,
--include-track 1 --experiment-id klsyn88) → .doc. Then render via oracle, measure
both, compare peak intensity → klsyn88's TRUE loudness vs Qlatt's klsyn88 (baseline
68.7 dB) and klatt80 (83 dB). CONFORMANCE assumption: pass Qlatt frame control
values straight through to klsyn .doc params, so output delta reveals where Qlatt's
DSP diverges from real klsyn88 (that's the point of the oracle).
.doc config block: copy doc/test.doc's 49-param min/val/max/flags as template; set
sr/du/ui; mark time-varying params 'V'; emit Varied table. All values integer.
Need: inspect Qlatt klsyn88 track frame param keys (F0/F1-5/B1-5/AV/AF/AH/...) → NEXT.

## MAJOR FINDING: Qlatt klsyn88 ≠ klsyn88 at the source level (2026-06-11)
Qlatt klsyn88 track frames carry LF-source params: Rd=0.7, RdRef, lfMode=1,
sourceMode=1, EePhraseDb, AV=57, GO=47, OQ=0 (LF uses Rd not OQ). Classic klsyn88
(the C reference) has NO LF source — voicing is KLGLOTT88 polynomial (ss=2),
impulse (ss=1), or triangular (ss=3), with amplitude pipeline av-7→DBtoLIN→×0.05
under g0 master gain. So Qlatt's klsyn88 is a DIFFERENT synth with a modern LF
source — likely a major contributor to the 14 dB quiet (LF Ee scaling vs klsyn
av/g0). Full Qlatt frame param set: F0,F1-6,B1-6,AV,AF,AH,AVS,AN,A1-10,AB,OQ,TL,
SW,GO + LF(Rd,lfMode,sourceMode,...) + nasal(NFC,FGP,BGP,FGZ,BGZ,...).
OPEN FORK for Q: is klsyn88-the-backend MEANT to be faithful klsyn88 (→ making it
"actual klsyn88" means restoring KLGLOTT88 source, big) or an intentionally
modernized LF variant (→ hold only formants/amplitude to the reference)?

## Current state / blockers
- No blocker yet. Toolchain present: gcc? (unverified — check), MSVC (used by
  DECtalk build), Python via uv. About to read c/klsyn.c main + c/README.
- Risk: c/klsyn.c main may read the legacy .doc format only, not .klp (.klp is the
  Python-layer format). If so, generate .doc instead, or feed params via whatever
  main() parses. Resolve by reading main() next.
