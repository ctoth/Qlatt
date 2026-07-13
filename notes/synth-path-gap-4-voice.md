# Synth-path gap 4: per-voice parameter diff (DECtalk 4.63 vs Qlatt port)

Scout report, 2026-05-29. Observations only. Every claim cites file:line.

## Source of truth: the 8 kHz voice tables

The port models the **8 kHz** voice structs (`*_8[SPDEF]` arrays), not the
10/11 kHz `us_*[]` arrays. Both live in
`C:\Users\Q\src\dectalk\463\dapi\src\PH\P_us_vdf1.h`. The 8 kHz Paul is
`paul_8[]` (P_us_vdf1.h:125); the alternate `us_paul[]` (P_us_vdf1.h:699) and
`#ifdef KEN` `paul[]` (P_us_vdf1.h:651) are NOT built on the standard path.
The Qlatt YAML values match `paul_8[]` (e.g. F7=3350, F8=4350, GH/GF=67, GV=68,
GN=52, G1=51, LO=81), NOT `us_paul[]` (F7=3550/F8=4850/GN=52 but G1=51/LO=81 —
mostly the same except F7/F8) and NOT `paul[]`/`#ifdef KEN`. So the converter
took `paul_8[]`. Confirmed: paul.yaml F7=3350/F8=4350 == paul_8 P_us_vdf1.h:145-146.

## Field order (the SPDEF struct layout)

From `C:\Users\Q\src\dectalk\463\dapi\src\INCLUDE\cmd.h:159-209` (SPD_* indices):

```
0 SEX  1 SM  2 AS  3 AP  4 PR  5 BR  6 RI  7 NF  8 LA  9 HS
10 F4  11 B4  12 F5  13 B5  14 P4  15 P5  16 GF  17 GH  18 GV  19 GN
20 G1  21 G2  22 G3  23 G4  24 LO  25 FT  26 BF  27 LX  28 QU  29 HR
30 SR  31 AGO  32 AGVO  33 AGUO  34 UNVOW  35 CHINK  36 OQ  37 GP  38 GZ ...
```

NOTE a label mismatch: the SPD_ enum names index 14/15 **P4/P5**
(cmd.h:173-174), but the P_us_vdf1.h struct comments and the Qlatt YAML call
them **F7/F8** (P_us_vdf1.h:145-146). ph_vset.c:761-762 wires
`SPD_P4 -> r4pb (F4p / "F7")` and `SPD_P5 -> r5pb (F5p / "F8")`. Same slot, two
names; the port's F7/F8 naming follows the struct comment and the parallel-
formant role. Not a bug.

---

## Q2 + Q5 SETTLED: the F5/B5 "6000" is NOT a converter bug

`paul_8[]` stores F5 and B5 as the macro `ZAPF` / `ZAPB`
(P_us_vdf1.h:143-144). Those macros are defined in
`C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_defs.h:722-728`:

```
#ifdef  MSDOS
#define ZAPF 2500   #define ZAPB 2048
#else
#define ZAPF 6000   #define ZAPB 6000   <-- the non-MSDOS (8 kHz target) build
#endif
```

So for the standard build **Paul F5 = ZAPF = 6000, B5 = ZAPB = 6000**. The
converted `paul.yaml:30-31` F5=6000/B5=6000 is a **faithful literal expansion
of the macro**, not a column-offset bug. ZAPF is a sentinel meaning "no 5th
cascade resonator": ph_vset.c:732-734 — `if (curspdef[SPD_F5]==ZAPF) r5cb=ZAPF`
— and ZAPF as a resonator center "zaps the b constant of the diff eqn"
(ph_defs.h:723 comment), i.e. disables that formant. **Paul has no active F5.**

Per-voice F5/B5 from the 8 kHz structs (real source numbers):

| Voice  | F5     | B5     | struct line (P_us_vdf1.h) |
|--------|--------|--------|---------------------------|
| Paul   | ZAPF(6000) | ZAPB(6000) | :143-144 |
| Chris  | ZAPF(6000) | 280    | :235-236 |
| Betty  | ZAPF(6000) | ZAPB(6000) | :282-283 |
| Harry  | 3850   | 180    | :329-330 |
| Frank  | ZAPF(6000) | ZAPB(6000) | :377-378 |
| Kit    | 4700   | 600    | :424-425 |
| Ursula | ZAPF(6000) | ZAPB(6000) | :470-471 |
| Rita   | 4800   | 700    | :516-517 |
| Wendy  | 4800   | 600    | :562-563 |
| Dennis | 3800   | 280    | :609-610 |

So F5 is **genuinely per-voice** for Harry/Kit/Rita/Wendy/Dennis/Chris(B5) —
5 of 10 voices have a real active F5. F5 is NOT "identical across all voices."

### The port's F5/B5 handling — and a factual error in frontend.yaml's comment

- inventory.yaml:15-16 base default F5=4500, B5=600.
- frontend.yaml:48-56 deliberately EXCLUDES F5/B5 from `speaker_frame_params`
  (only F4,B4 are stamped: frontend.yaml:57-59).
- **frontend.yaml:49-50 justifies this with the claim "every DECtalk voice
  stores F5=B5=6000 (identical across voices)." That claim is FALSE per the
  table above** — Harry 3850/180, Kit 4700/600, Rita 4800/700, Wendy 4800/600,
  Dennis 3800/280 all differ. The exclusion rationale is therefore based on an
  incorrect premise. (Whether F5 is audibly relevant: it is the 5th cascade
  resonator at 8 kHz; the voices that set it are exactly the brighter/female
  voices.)
- Consequence in the port: ALL 10 voices currently render with the inventory
  default F5=4500/B5=600 (since F5/B5 are never stamped from the voice). For
  Paul this is already "wrong" relative to source (source disables F5 via
  ZAPF; port gives Paul an active F5 at 4500). For Harry/Kit/Rita/Wendy/Dennis
  the port also ignores their real distinct F5. This is a real per-voice gap.
- The YAML voice files DO store the real F5/B5: paul.yaml:30-31 has F5=6000
  B5=6000 (the converter kept ZAPF's expansion). So the data is present but
  un-wired (case (b): yaml-only, not stamped).

---

## Q3 SETTLED: true-Paul base F0 — calibration debt is CLOSED

Paul `paul_8[]` AP (average pitch) = **122 Hz** (P_us_vdf1.h:133, guarded by
`#ifdef SCI` 115 / else 122).

ph_vset.c general path (the path the port models) derives:
- `f0minimum = (AP - 12) * 10` (ph_vset.c:683) -> (122-12)*10 = **1100**
- `f0scalefac = PR * 41` (ph_vset.c:684) -> 100*41 = **4100**
- `f0_lp_filter = 1500 + 15*QU` (ph_vset.c:679) -> 1500+15*40 = **2100**
- `size_hat_rise = HR*10` (ph_vset.c:680) -> 18*10 = **180**
- `assertiveness = AS*41` (ph_vset.c:677) -> 70*41 = **2870**
- `f0basefall = BF*10` (ph_vset.c:685) -> 18*10 = **180**

The current port matches ALL of these:
- frontend.yaml:510-512 base_f0_hz = **122** (NOT the old 110)
- frontend.yaml:522-524 f0_minimum = **1100**
- frontend.yaml:525-527 f0_scale_factor = **4100**
- frontend.yaml:528-530 f0_lp_filter = **2100**
- frontend.yaml:534-536 hat_rise_hz10 = **180**
- frontend.yaml:540-542 assertiveness = **2870**
- frontend.yaml:543-545 baseline_fall_hz10 = **180**
- paul.yaml:15 base_f0_hz = **122**, paul.yaml:19 f0_minimum=1100, :20 f0_scale_factor=4100

The task's flagged "default base_f0 110 vs DECtalk 122" debt is RESOLVED —
commit e118f9b6 ("dectalk default voice is now genuinely Paul (110 -> 122)")
moved it. **Calibration debt for base F0: CLOSED.** Current default is 122 and
matches `paul_8[]` AP exactly. (Note: there is a `-12` "fudge factor" in
ph_vset.c:682-683; the port reproduces it via f0_minimum=1100, so f0min is NOT
122*10. This is faithful.)

---

## Q1 + Q4 + Q6: full per-voice parameter table (PAUL reference)

For each SPDEF field: DECtalk Paul value (paul_8[], P_us_vdf1.h line) and port
status. "stamped" = applied to synth frames; "yaml-only" = stored in voice YAML
but never reaches the audio graph; "f0-policy" = consumed by F0 speaker-scaling
(real audible effect via pitch, not a per-frame formant param); "absent" = not
in YAML at all.

| # | Param | Paul value | src line | Port status | Where / note |
|---|-------|-----------|----------|-------------|--------------|
|0|SEX|MALE(1)|:127|yaml-only|paul.yaml:14 sex:male; not wired to synth params (informational)|
|1|SM (tilt)|3|:128|yaml-only|paul.yaml:18 spectral_tilt_offset_db:0 (NOTE: derived, not raw SM=3; see Q6)|
|2|AS (assertiveness)|70|:129|f0-policy STAMPED|frontend.yaml:540 assertiveness=2870 (=70*41); feeds F0 final fall|
|3|AP (avg pitch)|122|:133|f0-policy STAMPED|base_f0/f0_minimum (Q3). Audible.|
|4|PR (pitch range)|100|:135|f0-policy STAMPED|f0_scale_factor=4100 (=100*41)|
|5|BR (breathiness)|0|:136|yaml-only|paul.yaml:49 breathiness:0. For Paul 0 so no effect; other voices' BR (Betty 25, Kit 47, Wendy 55, Frank/Dennis 30, Rita 36) NOT wired -> B1-widening (ph_vset.c:703-704) and aturb (ph_vset.c:786) absent. GAP.|
|6|RI (richness)|70|:137|yaml-only|paul.yaml:50 richness:70. Drives nopen1 (ph_vset.c:783); not wired.|
|7|NF|0|:138|absent|No NF field in paul.yaml. nopen2 (ph_vset.c:784). Paul NF=0; other voices NF=10. GAP (minor).|
|8|LA (laryngealization)|0|:139|yaml-only|paul.yaml:52 laryngealization:0. -> t0jit (ph_vset.c:763). Rita LA=1 only nonzero.|
|9|HS (head size)|100|:140|yaml-only|paul.yaml:53 head_size:100. Drives fnscale=(200-HS)*41 (ph_vset.c:712) which SCALES F4/F5. Port stamps F4 raw without HS scaling. For Paul HS=100 -> fnscale=4100 -> F4*4100>>12 == F4*1.0009 ~ identity, so Paul OK; Chris HS=125, Harry 110, Kit 96, Ursula 94, Frank 97 -> their F4/F5 should be HS-scaled but port stamps raw. GAP for non-100-HS voices.|
|10|F4|3500|:141|**STAMPED**|frontend.yaml:58 speaker_frame_params [F4]. paul.yaml:28. inventory default 3500 == Paul -> Paul byte-identical.|
|11|B4|260|:142|**STAMPED**|frontend.yaml:59 [B4]. paul.yaml:29.|
|12|F5|ZAPF(6000)|:143|yaml-only|paul.yaml:30. NOT stamped (Q2/Q5). GAP.|
|13|B5|ZAPB(6000)|:144|yaml-only|paul.yaml:31. NOT stamped. GAP.|
|14|P4/"F7"|3350|:145|yaml-only|paul.yaml:32 F7:3350. -> r4pb parallel 4th (ph_vset.c:761). Not stamped. GAP (parallel branch timbre).|
|15|P5/"F8"|4350|:146|yaml-only|paul.yaml:33 F8:4350. -> r5pb (ph_vset.c:762). Not stamped. GAP.|
|16|GF (frication gain)|67|:147|**STAMPED**|frontend.yaml:90 {GF,AF}. Paul-relative offset (tts-frontend.ts:229-232,649).|
|17|GH (aspiration gain)|67|:148|**STAMPED**|frontend.yaml:89 {GH,AH}.|
|18|GV (voicing gain)|68|:149|**STAMPED**|frontend.yaml:87-88 {GV,AV},{GV,AVS}.|
|19|GN (nasal gain)|52|:150|yaml-only|paul.yaml:37 GN:52. frontend.yaml:81-83 EXPLICITLY OMITTED ("no additive destination" — nasal gain derives from nasalMurmurStrength not a per-frame AN dB). -> rnpgain (ph_vset.c:805). GAP, documented.|
|20|G1|51|:151|**STAMPED**|frontend.yaml:95 {G1,A5}.|
|21|G2|60|:152|**STAMPED**|frontend.yaml:94 {G2,A4}.|
|22|G3|50|:153|**STAMPED**|frontend.yaml:93 {G3,A3}.|
|23|G4|67|:154|**STAMPED**|frontend.yaml:92 {G4,A2}.|
|24|LO (loudness)|81|:155|**STAMPED**|frontend.yaml:91 {LO,A1}.|
|25|FT (f0-dep tilt)|75|:156|yaml-only? |paul.yaml has no FT field. -> f0_dep_tilt (ph_vset.c:676). ABSENT in paul.yaml. GAP.|
|26|BF (baseline fall)|18|:157|f0-policy STAMPED|frontend.yaml:543 baseline_fall_hz10=180 (=18*10).|
|27|LX (lax breathiness)|0|:158|yaml-only|paul.yaml has no LX field; ABSENT. -> spdeflaxprcnt=LX*41 (ph_vset.c:686). Paul 0; Betty 60, Wendy 80, Dennis 70, Kit 75 nonzero. GAP.|
|28|QU (quickness)|40|:159|yaml-only|paul.yaml:54 quickness:40. Drives f0_lp_filter=1500+15*QU (ph_vset.c:679). Port f0_lp_filter=2100 is the PRE-COMPUTED Paul value (frontend.yaml:528), not re-derived per voice. So other voices' QU is stored but their f0_lp_filter is NOT recomputed. GAP (per-voice F0 smoothing).|
|29|HR (hat rise)|18|:160|f0-policy STAMPED|hat_rise_hz10=180 (=18*10), frontend.yaml:534.|
|30|SR (stress rise)|32|:161|f0-policy STAMPED|scale_str_rise=32, frontend.yaml:537; paul.yaml:24.|
|31|AGO|400|:162|yaml-only|paul.yaml:43 AGO:400. -> NOM_VOIC_GLOT_AREA (ph_vset.c:668), aerodynamic. Not wired.|
|32|AGVO|900|:163|yaml-only|paul.yaml:44 AGVO:900. ph_vset.c:669.|
|33|AGUO|1900|:164|yaml-only|paul.yaml:45 AGUO:1900. ph_vset.c:670.|
|34|UNVOW|10|:165|yaml-only|paul.yaml:46 UNVOW:10 (struct comment says "chink area" but SPD_UNVOW=34; ph_vset.c:667 NOM_UNSTRESSED_VOWEL). ph_vset.c:667.|
|35|CHINK|50|:166|yaml-only|paul.yaml:47 CHINK:50 (struct comment "open quotient" but SPD_CHINK=35; ph_vset.c:671 NOM_Area_Chink). ph_vset.c:671.|
|36|OQ (open quotient)|—|—|partial|paul.yaml:51 nopen_fraction:0. SPD_OQ=36 -> NOM_Open_Quo (ph_vset.c:672). The paul_8[] array ends at index 35 (chink) + output-gain (P_us_vdf1.h:165-168); OQ/GP/GZ not in the 8k array. See "struct-length" note below.|

Additional YAML fields with no direct paul_8[] slot:
- paul.yaml:16 formant_scale:1, :17 rd_default:0.7 (derived for the Klatt LF
  source, frontend.yaml:516-518 cites "Paul BR=0 male base 0.7"), :48
  smoothness:3 (== raw SM, paul_8 SM=3 P_us_vdf1.h:128). smoothness yaml-only.
- paul.yaml:21 f0_lp_filter_alpha:0.5126953125 = 2100/4096 (frontend.yaml:531).
- paul.yaml:22 hat_rise_hz10:180, :23 scale_str_rise:32 (redundant w/ above).

### Struct-length note (UNVOW/CHINK/OQ label drift)
The paul_8[] 8 kHz array (P_us_vdf1.h:125-169) ends after index 35 with inline
comments "chink area" (val 10) and "open quotient" (val 50), then a -1 output-
gain (P_us_vdf1.h:165-168). But the SPD_ enum says index 34=UNVOW, 35=CHINK,
36=OQ (cmd.h:194-196). So the array's last two values (10, 50) are positionally
UNVOW=10 and CHINK=50, and the inline comments "chink area"/"open quotient" are
SHIFTED BY ONE relative to the canonical enum. The Qlatt YAML labels them
UNVOW=10, CHINK=50 (paul.yaml:46-47) — i.e. it followed the **enum index**, not
the misleading inline comment. nopen_fraction=0 (paul.yaml:51) maps to OQ but
paul_8[] has no index-36 value, so OQ defaults. This is a real ambiguity in the
source; the converter resolved it by enum position. UNKNOWN whether enum-
position is the intended reading — the inline comments disagree. Flag for human.

---

## Q7 Converter audit: field-by-field Paul + Betty

Converter: `C:\Users\Q\src\dectalk\463\scripts\convert_speakers.py` (not read in
full this pass — UNKNOWN whether it reads the array by enum-index or by comment).
But the OUTPUT can be checked against source directly:

PAUL (paul.yaml vs paul_8[]): F4 3500✓(:141), B4 260✓(:142), F5 6000✓(ZAPF :143),
B5 6000✓(ZAPB :144), F7 3350✓(:145), F8 4350✓(:146), GF 67✓, GH 67✓, GV 68✓,
GN 52✓, G1 51✓, G2 60✓, G3 50✓, G4 67✓, LO 81✓, AGO 400✓, AGVO 900✓, AGUO 1900✓,
UNVOW 10✓, CHINK 50✓, smoothness 3✓(SM), richness 70✓(RI), laryngealization 0✓,
head_size 100✓, quickness 40✓(QU). **Paul matches paul_8[] field-for-field.**
No column-offset bug found for Paul.

The original conversion output `~/src/dectalk/463/output/qlatt/speakers/paul.yaml`
exists (verified present) and the in-repo speakers/*.yaml were imported from it
(paul.yaml:1-3 header). Byte-diff between the two NOT performed this pass.

BETTY (betty.yaml) NOT individually read this pass; betty_8[] source values are:
SEX FEMALE, AP 208, F4 4550/B4 400, F5 ZAPF(6000)/B5 ZAPB(6000), F7 4150/F8 ZAPF,
GF/GH 63, GV 60, GN 63, LO 63, BR 25, HS 100 (P_us_vdf1.h:268-309). Betty F4=4550
differs from Paul 3500, so Betty's F4 stamp WILL change her timbre (good — proves
the F4 stamp path is doing per-voice work). Betty F8=ZAPF(6000) is notable: her
parallel 5th formant is also zapped. UNKNOWN whether betty.yaml stored F8=6000.

---

## GAP SUMMARY (ranked by likely audible impact)

1. **F5/B5 not stamped, and Paul's F5 is wrong by construction.** Source: Paul
   F5=ZAPF=6000 means NO active 5th cascade resonator; the port instead gives
   every voice the inventory default F5=4500/B5=600 (inventory.yaml:15-16), i.e.
   an active F5 Paul should not have, AND ignores the 5 voices
   (Harry/Kit/Rita/Wendy/Dennis) that DO set a distinct real F5. The
   frontend.yaml:49-50 rationale ("identical across voices, F5=B5=6000") is
   factually wrong. HIGH impact on upper-spectrum timbre / female voices.

2. **HS (head size) F4/F5 scaling absent for non-100-HS voices.** ph_vset.c:712
   scales F4/F5 by (200-HS)*41/4096. Port stamps F4 raw. Chris(125)/Harry(110)/
   Kit(96)/Ursula(94)/Frank(97)/Wendy(105)/Rita(110)/Dennis(105) all have HS!=100
   so their stamped F4 is mis-scaled. Paul HS=100 unaffected. MEDIUM-HIGH.

3. **BR (breathiness) not wired.** Drives B1-widening (ph_vset.c:703-704, BR^2/2)
   and aturb (ph_vset.c:786). Paul BR=0 (no effect) but Betty 25 / Kit 47 /
   Wendy 55 / Frank 30 / Dennis 30 / Rita 36 — breathy voices lose their breath.
   MEDIUM-HIGH for those voices.

4. **GN (nasal gain) omitted.** frontend.yaml:81-83, documented. ph_vset.c:805
   rnpgain. Per-voice nasal balance lost. MEDIUM (nasals only).

5. **F7/F8 (parallel P4/P5) not stamped.** ph_vset.c:761-762. Affects parallel-
   branch (fricative/stop) timbre per voice. MEDIUM.

6. **QU-derived per-voice F0 smoothing frozen at Paul.** f0_lp_filter hardcoded
   2100 (frontend.yaml:528) not re-derived from each voice's QU (ph_vset.c:679).
   LOW-MEDIUM (F0 contour smoothness).

7. **LX, FT, NF, RI, LA, AGO/AGVO/AGUO, UNVOW, CHINK** — stored yaml-only or
   absent; feed aerodynamic/source-shape params that the Qlatt graph does not
   consume on this path. LOW each, given current graph topology.

8. **UNVOW/CHINK/OQ label drift** (struct comments vs SPD_ enum disagree by one;
   paul_8[] array shorter than enum). Converter used enum-position. Needs human
   confirmation of intended reading. Correctness UNKNOWN.

## CALIBRATION DEBT VERDICT

- **base F0 (110 vs 122): CLOSED.** Default voice is now Paul at 122
  (frontend.yaml:510-512, paul.yaml:15; commit e118f9b6). f0_minimum 1100,
  f0_scale_factor 4100, hat_rise 180, assertiveness 2870, baseline_fall 180 all
  match the ph_vset.c general-path derivation from paul_8[] exactly.
- **F5/B5 6000 "artifact": NOT a converter bug — CLOSED as a conversion
  question, OPEN as a wiring/correctness gap.** 6000 is the literal ZAPF macro
  (ph_defs.h:726). The real open issue is (a) F5/B5 are never stamped so Paul
  gets a spurious active F5 from the inventory default, and (b) frontend.yaml's
  stated reason for not stamping them is factually incorrect (5 voices DO set a
  distinct F5). That is a live gap, not a calibration debt.

## NOT VERIFIED THIS PASS (honest gaps)
- convert_speakers.py internals (enum-index vs comment parsing) — inferred from
  output match, not read.
- Per-voice byte-diff of in-repo speakers/*.yaml vs ~/src/dectalk output copies.
- betty.yaml / other 9 voice YAMLs read individually (only paul.yaml read full;
  others' source struct values tabulated from P_us_vdf1.h).
- Whether F6/B6 (inventory.yaml:17-18, F6=5500) corresponds to any DECtalk slot
  — DECtalk 8k struct has no F6; appears to be a Qlatt inventory extension. The
  task asked about F6-F8; DECtalk's "F7/F8" are the parallel P4/P5, and there is
  no per-voice cascade F6 in paul_8[]. Port inventory F6 has no DECtalk per-voice
  source.
