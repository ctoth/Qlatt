# Gap Report B: Symbolic Phonology / Duration — DECtalk 4.63 vs Qlatt dectalk-english

Datestamp: 2026-05-28. Scout survey. Observations only; every claim cites file:line.
Scope: symbolic/phonological processing AFTER phonemes are known, BEFORE acoustic
parameters — allophone selection, stress/syllable handling, segmental duration,
pause insertion, phoneme-context rewrites. Excludes LTS, F0/intonation contour,
formant target values, DSP.

DECtalk reference root: `C:\Users\Q\src\dectalk\463\dapi\src\PH\` (confirmed exists).

---

## 1. DECtalk 4.63 PHONOLOGY / DURATION RULES PRESENT

The PH (phonology) engine runs, in order (per `ph_main.c` / `ph_claus.c` orchestration):
syllabification → allophone rewrite (`phalloph`) → duration (`us_phtiming`) →
parameter target setting (`us_setar`). The first two are the symbolic phonology layer.

### 1.1 Allophone-rewrite engine — `ph_aloph.c` `phalloph()` (1837 lines; main loop L506)
File: `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_aloph.c`
Header L24-26: "Generates allophones ... integer allophone sequence with accent/boundary features."
Operates on `phonemes[]` (input) → `allophons[]` (output); can delete (`dodelete`) and
combine symbols. Numbered rules (US English branch):
- Geminate obstruent deletion L558-562 (identical adjacent obstruent → delete).
- FBLOCK skip L563-567.
- /ch/→/kh/ after a/o/u/au/oh L616-625.
- R→RR before syllabic (not across word boundary) L636-648.
- (OUT) syllabic EL/EM/EN selection at high rate L650-692 (#ifdef OUT_for_GOOD — disabled).
- "the" /dh ax/→/dh iy/ before syllabic L737-752.
- citation "a"→/iy/ L759-763; "and" /ae/→/eh/ unreduce L765-781; "to/into" unreduce L783-799;
  "at" /eh/→/ae/ L801-814.
- Rule 2 postvocalic R/LL allophones L821-873: LL→LX; R→RX; and vowel+R fusions replacing
  the prior vowel: AX→RR, IY/IH→IR, EY/EH/AE→ER, AA/AH→AR, OW/AO→OR, UW/UH→UR (deletes input R).
- Rule 3 unstressed /t,d/ allophone selection L875-1040:
  - palatalize t→CH, d→JH before unstressed /y/ L878-891.
  - delete German glottal stop in context L893-901.
  - t→D / t→TX (glottalized) before LL/DH/sonorant/HX/EN L912-927.
  - "to" unreduce + flap initial /t/→DF L928-956.
  - FLAPPING rule (only if number_words≥3) L958-1040: unstressed t/d preceded by sonorant
    (not m/nx/n) and followed by syllabic → word-final t→DF, d→DX; word-internal weak-vowel
    contexts → DF/DX. History notes L1030-1037.
  - Rule 3a syllabic-n: after TX, nasal→EN + delete L1042-1051.
- Rule 4 unstressed /dh/→DZ (dental stop) after t/tx/d L1066-1082.
- Rule 6 hat-pattern rise/fall location assignment (FHAT_ENDS etc.) — interleaved
  L1085, L1301-, and hat bookkeeping L597-607, L463/479-481 (hatposition/emphasislock).
- UK English branch L1088-1291 (parallel rule set; out of US scope).
- `endrul3:` Latin TH→S L1295-1298.
- Helpers: `remaining_stresses_til` L1646, `promote_last_2` L1689, `make_out_phonol` L1744.
NOTE: glottal-attack rules are NOT here — comment L818 "rules involving glottal attack are
in PHDRAWT0.C".

### 1.2 Stress assignment to consonants + legal-cluster table — `p_us_sr1.c` (229 lines)
File: `C:\Users\Q\src\dectalk\463\dapi\src\PH\p_us_sr1.c`
- `get_stress_of_conson()` L73-162: scans forward from a consonant to the next stress symbol
  before a vowel/boundary; assigns FSTRESS_1/FSTRESS_2/FEMPHASIS to the consonant only if it
  forms a legal onset cluster with the stressed vowel. >3 consonants in a row → first excluded
  L92-93.
- `us_phcluster()` L179-228: hardcoded English legal onset-cluster table:
  P+{L,R}, B+{L,R}, F+{R,L}, T+{R,W}, D/TH+{R,W}, K+{R,L,W}, G+{R,L,W},
  S+{W,L,P,T,K,M,N,F}, SH+{W,L,P,T,R,M,N}; returns CLUSTER / NOCLUSTER / CLUSTER_TRYS.

### 1.3 Syllabification engine — `ph_syl.c` (1158 lines)
File: `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_syl.c`
Header L26 "syllabification and output". Key functions:
- `syl_find_vowel` L128, `syl_find_cons` L342, `syl_find_affix` L517 (affix stripping via
  `common_affixes` table, working backward), `ph_syllab` L876 (top-level: strip affixes
  L971-986, then maximal-onset syllabification, inserts SBOUND syllable boundaries),
  `syl_clause_init` L1087, `speak_syllable` L1112, `logsyllable` L683.

### 1.4 Language-specific syllabification DATA — `p_us_sy1.c` (271 lines)
File: `C:\Users\Q\src\dectalk\463\dapi\src\PH\p_us_sy1.c`
- `us_ascky_check[]` L40-54 (phoneme→ascii sonority class), `us_common_affixes[]` L57-139
  (~95 affix strings for affix-boundary detection), `us_syl_vowels[]` L141, `us_syl_cons[]`
  L146-186 (legal onset clusters for syllabification, longest-first), `us_saysyllable()`
  L202-271 (splits symbol array into syllable chunks at SBOUND/WBOUND/punctuation).

### 1.5 Segmental DURATION rules — `p_us_tim.c` `us_phtiming()` (1156 lines)
File: `C:\Users\Q\src\dectalk\463\dapi\src\PH\p_us_tim.c`
Per-phone: durinh=inherent, durmin=min, prcnt (mult, init 128=100%), deldur (additive).
Final formula L897: `durxx = (prcnt*(durinh-durmin))>>7 + durmin`; sprate scaling L912-925;
`+deldur` L927. Numbered rules:
- Rule 1 pause L229-280 (clause-init/comma/period/paragraph; sprate-scaled; min 13ms L267).
- Rule 2 clause-final rime lengthening L281-315 (NF40MS sonorant; NF20MS voiced obst; 0
  plosive; NF15MS rx/lx before voiceless obst L296-302; short-phrase extra L304-309; less if
  next sonorant in same rime L311-314).
- Rule 3 non-phrase-final syllabic shorten N70 L316-331 (gated by sprate>160 AND boundary).
- nasal-nasal differentiation +NF30MS L332-338.
- Rule 4 syll-init/medial + monosyllable stress shorten L349-407 (monosyl N90/N85/N70 by
  stress; non-final-word vowel N85).
- Rule 5 polysyllabic N80 L397-406 (nested in Rule 4).
- Rule 6 non-word-initial consonant L408-428 (word-final fric +NF20MS else N85).
- Rule 7 unstressed shorten L429-495 (durmin halved L437 / >>2 L442; medial-syll prcnt>>1
  L455 else N70; glide w/y/r/l prcnt>>1 L482; schwa next to flap/HX +NF25MS L465-473).
- penultimate hat-fall lengthening +NF25MS L496-509 (FHAT_ENDS).
- Rule 8 emphasis +NF20MS, vowel extra +NF40MS L510-526.
- Rule 9 postvocalic-consonant influence on vowels/sonorants L527-642 (two-vowel N70 L539-543;
  voiceless fric N80 / plosive&CH N70 L570-576; voiced obst N120 +NF25MS L597-609; nasal N85
  L611-613; attenuate if not phrase-final or postvoc sonor L622-625; [nt]→N10 and rewrite
  N→D L628-639).
- Rule 10 first vowel of two-vowel seq +NF30MS L647-655.
- Rule 11 word-init stressed vowel of polysyllable +NF25MS L657-664.
- Rule 12 shorten vowel before postvocalic LX -NF20MS + N70 L665-675.
- Rule 13 consonant clusters L677-756 (first-of-pair N70 unless plosive-plosive; nasal before
  word-init C N150 L692-696; S/TH before plosive FRAC_HALF L702-709, before SH → NF15MS hard
  set L710-718; second-of-pair N70 L729; plosive after S N60 L736-739; plosive after unstressed
  nasal arg1=1638 L742-747).
- Rule 14 sonorant after aspirated plosive +NF20MS L757-766.
- Rule 15 phrase-initial vowel after SIL +NF20MS L767-775.
- Rule 16 vowel after non-nasal sonorant consonant deldur=NF20MS L776-787.
- Rule 17 short-phrase (<10 phones) prcnt+=30 L788-803.
- Rule 18 prevocalic clustered semivowel after obstruent N70 L806-816.
- Rule 19 function-word-final TH N60 L819-826.
- Rule 20 "the/me/he" IY before vowel N150 L828-836.
- Rule 21 stop after stop before fricative N25 + durmin>>1 L837-857.
- RR retroflex min-dur floor 13 L873-877; Rule 23 vowel before DF flap N35 L859-868;
  Rule 24 before NX (ing) N60 L882-889.
- Q glottal-stop slow-speak lengthen L907-908; HX cap 11 frames L936-940.
- Stress-timing (isochrony) ADJUST block L942-1085 (#ifdef danit) — sonocnt-based pull toward
  `timeref`; NOTE `adjust = 0` hardcoded L1026 disables it in this build.
- TYPING_MODE / NEWTYPING_MODE rate overrides L1095-1149.

### 1.6 Speaking-rate calibration — `ph_timng.c` (492 lines) `init_timing`
File: `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_timng.c`
Computes sprat0/sprat1/sprat2 (the multiplicative rate factors consumed by `us_phtiming`).
(Header read confirmed file; line-level detail of the piecewise rate curve not enumerated.)

---

## 2. QLATT PORT — CURRENT STATE

Pipeline phases (`public/rules/frontends/dectalk-english/pipeline.yaml` L23-63):
duration → structural → formant → prosody. There is NO syllabification phase and NO
allophone-rewrite phase.

### 2.1 Duration — `phases/duration.yaml` (352 lines, 13 scalar rules)
File: `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\phases\duration.yaml`
Implements DECtalk duration Rules 1,2,3,4,5,6,7,8,9a,9b,13,15 + rate scaling, as scalar
mul/add rules using `floor_field: minimumDuration` (the Klatt floor reproduces DECtalk's
`(prcnt*(durinh-durmin))>>7 + durmin` formula). See coder report
`C:\Users\Q\src\dectalk\463\reports\coder-duration-rules-report.md` for the mapping.

### 2.2 Structural — `phases/structural.yaml` (681 lines, 9 structural rules)
File: `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\phases\structural.yaml`
Every rule is an ACOUSTIC-transition splice (sourced from `p_us_st1.c` set-targets and the
three SPECIAL RULES), NOT a symbolic phoneme rewrite:
- diphthong trajectory windows; voiceless/voiced stop release+aspiration insertion (medial,
  pre-silence, final); interdental /th,dh/ frication weakening; voiced-fricative soft voicing
  onset; voiceless-fricative breathy onset; vowel breathy offset into silence.
These split a stop into closure+release+aspiration and add onset/offset parameter windows;
they do not select allophones, syllabify, or rewrite the phoneme string.

---

## 3. GAP — symbolic-phonology behaviors absent or simplified in the port

| # | What (DECtalk behavior) | DECtalk file:line | Port equivalent | Rough size |
|---|---|---|---|---|
| G1 | **Entire allophone-rewrite engine** (`phalloph`) — no phase exists | ph_aloph.c L453-1837 | NONE (no allophone phase in pipeline.yaml L23-63) | Large (~1800 lines C) |
| G2 | **Flapping** t→DF, d→DX in unstressed intervocalic / word-final contexts (gated number_words≥3) | ph_aloph.c L958-1040 | NONE | Medium |
| G3 | Postvocalic R/LL allophones + vowel+R fusion (LL→LX, R→RX, AX+R→RR, IY/IH+R→IR, etc., deleting prior vowel) | ph_aloph.c L821-873 | NONE | Medium |
| G4 | R→RR before syllabic | ph_aloph.c L636-648 | NONE | Small |
| G5 | Palatalization t→CH, d→JH before unstressed /y/ | ph_aloph.c L878-891 | NONE | Small |
| G6 | Glottalization t→TX / t→D before sonorant/LL/DH/HX/EN | ph_aloph.c L912-927 | NONE | Small |
| G7 | Unstressed /dh/→DZ after t/tx/d | ph_aloph.c L1066-1082 | NONE | Small |
| G8 | Syllabic-nasal: nasal after TX → EN + delete | ph_aloph.c L1042-1051 | NONE | Small |
| G9 | Geminate obstruent deletion (identical adjacent obstruents) | ph_aloph.c L558-562 | NONE | Small |
| G10 | Function-word reductions/unreductions ("the"→/dh iy/, "and", "to/into", "at", citation "a") | ph_aloph.c L737-814 | NONE | Medium |
| G11 | /ch/→/kh/ after back vowel | ph_aloph.c L616-625 | NONE | Small |
| G12 | **Syllabification** (maximal onset + affix stripping, SBOUND insertion) | ph_syl.c L876-1086; data p_us_sy1.c L40-186 | NONE — port has no syllable structure; "polysyllabic"/"medial-syll" approximated by look_back for another vowel in same word (duration.yaml L116-117) | Large (~1150 lines C + tables) |
| G13 | Legal onset-cluster table used for both stress-on-consonant and syllabification | p_us_sr1.c L179-228; p_us_sy1.c L146-186 | NONE | Medium (data tables) |
| G14 | Stress assignment to consonants (cluster-gated FSTRESS propagation) | p_us_sr1.c L73-162 | NONE (port uses per-phoneme `stress` field from transcription only) | Medium |
| G15 | Duration Rule 4 monosyllable vs word-initial vs medial distinction (FMONOSYL/FFIRSTSYL/FMEDIALSYL) | p_us_tim.c L349-407 | duration.yaml `dectalk_stress_shortening` L83-101 applies stress scaling uniformly; no syllable-type branch | Medium (depends on G12) |
| G16 | Duration Rule 7 word-medial-syllable extra shortening (prcnt>>1) + durmin halving for unstressed | p_us_tim.c L437-465 | duration.yaml `dectalk_unstressed_shortening` L173-195 has flat vowel/glide/consonant factors, no medial-syll branch, no durmin reduction | Medium |
| G17 | Duration Rule 9 detail: postvoc-sonorant lookahead (nphon+2), [nt]→N10 cluster + N→D rewrite, phrase-final attenuation | p_us_tim.c L547-642 | duration.yaml L229-284 covers only immediate-next voiceless/voiced/nasal; no nphon+2 lookahead, no [nt] handling, no attenuation | Medium |
| G18 | Duration Rules 10,11,12,14,16,17,18,19,20,21,23,24 + RR/Q/HX special cases | p_us_tim.c L647-940 | NONE (coder report L63-67 lists these as not implemented) | Medium (12+ rules) |
| G19 | nasal-nasal differentiation lengthening (+NF30MS between two distinct nasals) | p_us_tim.c L332-338 | NONE | Small |
| G20 | Clause-final Rule 2 sub-cases: rx/lx before voiceless obst (NF15MS), short-phrase vowel extra, reduce-if-next-sonorant-in-rime | p_us_tim.c L296-314 | duration.yaml `dectalk_clause_final_lengthening` L28-54 handles sonorant/voiced-obst/plosive split only | Small |
| G21 | Pause Rule 1 next-phone-sensitive clause-initial (fricative/plosive following → longer), paragraph-initial long pause, sprate scaling, 13ms floor | p_us_tim.c L229-279 | duration.yaml `dectalk_pause_duration` L7-21 sets pause purely by punctuation symbol; no next-phone or paragraph logic, no sprate scaling here | Small |
| G22 | Speaking-rate calibration sprat0/1/2 (non-linear, applied to durxx and deldur and pauses differently) | p_us_tim.c L912-925; ph_timng.c init_timing | duration.yaml `dectalk_rate_scaling` L339-351 = single linear `1/rate_scale` (coder report L80-81 notes simplification) | Medium |
| G23 | Stress-timing / isochrony adjust toward timeref (sonocnt-weighted) | p_us_tim.c L942-1085 | NONE — but DISABLED in DECtalk build too (`adjust=0` L1026), so not a behavioral gap in this build | n/a (disabled upstream) |
| G24 | Hat-pattern rise/fall LOCATION assignment to phones (FHAT_ENDS marking) done in phalloph; duration Rule "penultimate" depends on it | ph_aloph.c L1085,L1301; p_us_tim.c L496-509 | Port computes hat in prosody phase (separate F0 layer); the duration-side FHAT_ENDS penultimate lengthening has no port equivalent | Small (duration side) |

### Cross-cutting observation
The port collapses DECtalk's multi-stage symbolic pipeline (syllabify → allophone-rewrite →
duration) into duration + acoustic-structural phases only. Two whole DECtalk stages —
`phalloph()` (ph_aloph.c) and syllabification (ph_syl.c + p_us_sy1.c/p_us_sr1.c) — have no
counterpart. Consequences flow into duration: rules keyed on syllable type (G15/G16),
flap-produced phones DF/DX (G2; duration Rule 23 at p_us_tim.c L859-868 expects USP_DF that
the port never produces), and the [nt]→[d] interaction (G17) cannot fire as written.
