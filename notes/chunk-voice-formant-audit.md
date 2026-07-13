# DECtalk Voice Formant/Bandwidth Audit (F4/B4/F5/B5/F7/F8)

2026-05-29 — scout (recon only, no files modified except this report)

## TL;DR Verdict

**F5=6000 / B5=6000 in the converted speaker YAMLs is NOT a conversion bug. It is a
faithful transcription of a DECtalk source SENTINEL.** The source arrays literally
write the macro tokens `ZAPF` for F5 and `ZAPB` for B5 (and Betty writes `ZAPF` for
F8 too). `ZAPF`/`ZAPB` are "zap" sentinels meaning *disable this resonator*, not real
formant frequencies. On the active (non-MSDOS) build they expand to **6000**, which is
above the 8 kHz-sample Nyquist (4 kHz) so the 5th cascade formant contributes nothing.

The mission's triggering observation — "ph_vdefi.c:262-265 shows a voice with
F5=2500/B5=100" — is a **misread**. Those lines are the `limit[]` *range-check* table
(per-param **minimum, maximum**), not a voice definition. F5 min = 2500, F5 max = `ZAPF`;
B5 min = 100, B5 max = `ZAPB`. No voice has F5=2500.

## Evidence chain

### 1. The "F5=2500/B5=100" rows are the range limiter, not a voice
`C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_vdefi.c:250-265`:
```
const LIMIT limit[] = {
  ...
  2000, ZAPF,   /* F4 */
  100,  ZAPB,   /* B4 */
  2500, ZAPF,   /* F5 */   <- line 264: {min=2500, max=ZAPF}
  100,  ZAPB,   /* B5 */   <- line 265: {min=100,  max=ZAPB}
```
These are `{min, max}` pairs used to clamp user `:dv` voice-override commands. Not a voice.

### 2. The real voice tables are in P_us_vdf1.h, and write ZAPF/ZAPB literally
`C:\Users\Q\src\dectalk\463\dapi\src\PH\P_us_vdf1.h`:
- Paul `paul_8[]` (line 125): F4=`3500` (143... line 141), B4=`260` (142), **F5=`ZAPF`** (143),
  **B5=`ZAPB`** (144), F7=`3350` (145), F8=`4350` (146).
- Betty `betty_8[]` (line 268): F4=`4550` (280), B4=`400` (281), **F5=`ZAPF`** (282),
  **B5=`ZAPB`** (283), F7=`4150` (284), **F8=`ZAPF`** (285).
- Harry `us_harry_8[]` (line 315): F4=`3300` (327), B4=`200` (328), **F5=`3850`** (329),
  **B5=`180`** (330), F7=`3200` (331), F8=`4000` (332). *(Harry has a REAL F5/B5 — not zapped.)*
- Frank `frank_8[]` (line 363): F4=`3400` (375), B4=`260` (376), **F5=`ZAPF`** (377),
  **B5=`ZAPB`** (378), F7=`3350` (379), F8=`3850` (380).

### 3. ZAPF/ZAPB = 6000 on the active build; 2500/2048 only under MSDOS
`C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_defs.h:722-728`:
```
#ifdef  MSDOS
#define ZAPF 2500   /* Magic f value to zap b constant of diff eqn */
#define ZAPB 2048
#else
#define ZAPF 6000   /* <- active branch for WIN32/_UNIX_LIKE_ */
#define ZAPB 6000
#endif
```
(Same dual definition in `VTM/viphdefs.h:334-338`; the MSDOS-only 2500/2048 variant also
appears in `hardware/src/dll/dll_cust.c:33-34`.) The Qlatt extraction picks the active
value: `scripts/shared_constants.py:255-260` sets `SPEAKER_MACROS = {'ZAPF':6000,'ZAPB':6000}`.

### 4. ZAPF means "disable the resonator", confirmed in setspdef()
`C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_vset.c:732-741` (general voice path):
```
if (curspdef[SPD_F5] == ZAPF)  spdef->r5cb = ZAPF;     // pass sentinel straight to chip
else { nlong = curspdef[SPD_F5] * fnscale; r5cb = nlong>>12; }  // else scale by FNscale
```
and `:756-759`: if computed `r5cb` exceeds Nyquist (`uiSampleRate>>1`) it is forced back to
`ZAPF`/`ZAPB`. So ZAPF is deliberately above Nyquist to null the 5th formant. F4 has the
identical guard at `:714-717` and a >4950 overflow zap at `:726-729`. The comment at the
`#define` is explicit: "Magic f value to zap b constant of diff eqn".

Note also that F4 in the chip is scaled by `FNscale = (200 - HS) * 41` then `>>12`
(`ph_vset.c:712-722`) — i.e. F4 is head-size-scaled before reaching the resonator. The
Qlatt YAMLs store the **raw** F4 (pre-FNscale), and the qlatt port applies a separate
`formant_scale` (1.0 male / 1.17 female, `convert_speakers.py:83`). The HS-based FNscale is
NOT reproduced as such; this is a modeling choice, not a transcription error (all sampled
voices have HS=100 except Harry HS=110, Frank HS=97).

### 5. The conversion script just passes the macro-substituted ints through
`C:\Users\Q\src\dectalk\463\scripts\extract_speakers.py:116-120` substitutes
`SPEAKER_MACROS` (ZAPF->6000) while tokenizing, after stripping comments
(`:108-112`). `scripts/convert_speakers.py:103-108` copies F4/B4/F5/B5/F7/F8 verbatim
("Higher formants (pass through)"). **No column offset, no unit bug** — the index map
`shared_constants.py:221-235` (10:F4 11:B4 12:F5 13:B5 14:F7 15:F8) matches the source
row order exactly, and the extraction `validate()` (`extract_speakers.py:141-159`)
checks Paul AP=122 / Betty AP=208 / Harry AP=90, all of which match the source — so the
column alignment is correct.

## Audit table (source vs converted YAML vs inventory default)

| Param | Source Paul (P_us_vdf1.h) | YAML paul.yaml | Source Betty | YAML betty.yaml | Inventory default |
|-------|---------------------------|----------------|--------------|-----------------|-------------------|
| F4 | 3500 (`:141`) | 3500 (`:28`) | 4550 (`:280`) | 4550 (`:28`) | 3500 (`inventory.yaml:13`) |
| B4 | 260 (`:142`) | 260 (`:29`) | 400 (`:281`) | 400 (`:29`) | 260 (`:14`) |
| F5 | ZAPF=6000 (`:143`) | 6000 (`:30`) | ZAPF=6000 (`:282`) | 6000 (`:30`) | 4500 (`:15`) |
| B5 | ZAPB=6000 (`:144`) | 6000 (`:31`) | ZAPB=6000 (`:283`) | 6000 (`:31`) | 600 (`:16`) |
| F7 | 3350 (`:145`) | 3350 (`:32`) | 4150 (`:284`) | 4150 (`:32`) | — (no F7 in base_params) |
| F8 | 4350 (`:146`) | 4350 (`:33`) | ZAPF=6000 (`:285`) | 6000 (`:33`) | — (no F8 in base_params) |

Harry is the lone sampled voice with a real (non-zapped) F5/B5: source F5=3850/B5=180
(`P_us_vdf1.h:329-330`) — worth spot-checking `harry.yaml` reflects 3850/180 (not read
this pass; predicted from source). Frank: F5/B5 = ZAPF/ZAPB like Paul (`:377-378`).

All checked YAML values **match the source exactly**. No mismatch found. No conversion bug.

## Answers to the specific questions

1. **Is converted F5/B5=6000 a bug?** No. It is the verbatim DECtalk sentinel ZAPF/ZAPB
   (active build = 6000) meaning "5th cascade formant disabled". Correct transcription.
2. **F4/B4/F7/F8?** Faithful real values (Paul 3500/260/3350/4350; Betty 4550/400/4150 +
   F8 also ZAPF). Correct.
3. **Is inventory F5=4500 / B5=600 "right" vs DECtalk?** It is a Qlatt synthesis default,
   NOT a DECtalk voice value. DECtalk's Paul has no real F5 (it's zapped). 4500/600 is a
   reasonable generic 5th-formant default for an 8-formant cascade; it does not correspond
   to any DECtalk number and is not claimed to. Not wrong — it is Qlatt's own baseline.
4. **Correct values for a coder to "fix"?** There is nothing to fix in the data. The
   values are faithful. If a future coder ever wires F5/B5 from voices, they must treat
   6000 as "disable the 5th formant," not "place a formant at 6000 Hz" — otherwise they'd
   inject a bogus 6 kHz resonance. That semantic is exactly why F5/B5 are currently NOT
   wired (see below).

## What is currently WIRED to audio

`public/rules/frontends/dectalk-english/frontend.yaml:48-59`:
- `speaker_frame_params: [F4, B4]` — **only F4 and B4** are stamped onto frames.
- F5/B5 are **deliberately EXCLUDED**, with an in-file comment (`:48-51`) stating exactly
  the finding above: "every DECtalk voice stores F5=B5=6000 (identical across voices, so
  they cannot distinguish a voice) while the inventory default is F5=4500/B5=600 —
  stamping them would silently change the default voice (Paul)."
- F7/F8 are **not** in `speaker_frame_params` and have no parallel-formant binding here —
  dormant. (Gains GV/GH/GF/LO/G1-G4 ARE wired via `speaker_gain_offsets:` `:86-95`.)

**Audio impact of any fix:** None pending, because F5/B5/F7/F8 are dormant. The matching
mission claim "dt-7a wired F4/B4 only; F5/B5/F7/F8 dormant" is confirmed by
`frontend.yaml:57-59`. Paul's F4/B4 equal the inventory default (3500/260) so the default
voice stays byte-identical; Betty etc. get their real F4/B4 (4550/400).

## Ambiguities / not determined
- Did not read harry.yaml/frank.yaml/dennis.yaml/kit.yaml/ursula.yaml/rita.yaml/wendy.yaml/
  chris.yaml this pass; predicted from source they carry the same pattern (zapped voices ->
  6000, Harry -> real 3850/180). Spot-check recommended but the mechanism is proven.
- The HS/FNscale F4 scaling in the chip (`ph_vset.c:712-722`) is not reproduced as a runtime
  step in the qlatt port; F4 is stored raw + a sex-based formant_scale applied. Modeling
  difference, flagged for awareness — not a transcription error.
