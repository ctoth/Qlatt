# Chunk t4b — DECtalk setloc prcnt adjustments + us_special_coartic (coder)

Date: 2026-05-29. Branch `dectalk-parity`. Builds on committed t4a-data (9b44cb50 /
loci framework). Mission: add the DEFERRED place-dependent prcnt adjustments
(ph_sttr2.c:294-307) + us_special_coartic (p_us_st1.c:314-410) declaratively.

## DECtalk source — the two setloc prcnt adjustments (ph_sttr2.c)
Inside setloc, AFTER locus/prcnt/durtran are read from the table, BEFORE
`bouval = locus + prcnt*(curval-locus)/100`:

(a) ph_sttr2.c:294-298 — rounded-soncon, non-palatal/non-dental obstruent, F2/F3:
```
if ((typso == ROUNDED_SONOR_CONS) && (np > &PF1)
    && ((place(fonobst) & (FPALATL | FDENTAL)) IS_MINUS))
    prcnt = (prcnt >> 1) + 50;     // prcnt = prcnt/2 + 50
```
typso = the SONORANT's begtyp/endtyp; ROUNDED_SONOR_CONS = 5 (e.g. /w/, /r/-ish
rounded sonorant consonants). np > &PF1 means F2 or F3 (NOT F1). place(fonobst)
is the OBSTRUENT's place bits; condition fires when obstruent is NEITHER palatal
NOR dental. Effect: reduce transition extent (prcnt toward 50+).

(b) ph_sttr2.c:303-307 — F2 of back-cavity-affiliated vowel (e.g. [iy]):
```
if ((f2backaffil IS_PLUS) && (np == &PF2))
    prcnt += (25 - (prcnt >> 2));      // prcnt += 25 - prcnt/4
    durtran = (durtran >> 1) + 2;      // durtran = durtran/2 + 2
```
f2backaffil = place(fonsonor) & F2BACKI (forward/'i') or & F2BACKF (backward/'f').
Only F2. The vowel/sonorant is back-cavity-affiliated (iy, y, yu fwd; iy,y,ey bwd).
Effect: reduce trans extent by 1/4, shorten durtran.

## DECtalk source — us_special_coartic (p_us_st1.c:314-410)
Called ONLY for diphthongized vowels (a vowel). Returns Hz `temp` added to the
F2 or F3 TARGET (not boundary). foncur=this vowel, fonlas=prev, fonnex=next.

F3 (np==PF3), vowel & not RR:
  - prev OR next in {W,R,RX} -> temp = -150.
F2 (np==PF2):
  - next==LX: front vowel (IY..AE, or IX) -> -150; AY/OY diphpos==1 -> -250;
    AY/OY diphpos>1 -> -350.
  - prev in {W,LL,LX}: front vowel (IY..AE, or IX) -> -150 (not cumulative w/ next).
  - foncur==UW: prev place&FALVEL -> temp=200.
  - foncur==UW OR (YU & diphpos>0): next place&FALVEL -> temp += 200.
  - unstressed (FSTRESS IS_MINUS): temp += temp/2; unstressed YU diphpos>0 -> temp=400.
  - else phrase-final stressed (FBOUNDARY >= FVPNEXT): temp = temp/2.
  - clamp |temp| <= 400.

## Feature data needed (the feasibility question)
- place bits per phoneme: us_place[] (p_us_rom.h:982-1042, 59 entries). Bits:
  FDENTAL=2(0o2), FPALATL=4(0o4), FALVEL=8(0o10), [16=0o20 alveolar-ish?],
  F2BACKI=64(0o100), F2BACKF=128(0o200). (ph_defs.h:340-346).
- ROUNDED_SONOR_CONS=5: a begtyp/endtyp VALUE (ph_defs.h:176). The vowel_category
  table already extracted in t4a is begtyp/endtyp CLAMPED to 1/2/3 — so the raw
  "==5 rounded soncon" distinction was LOST in clamping. setloc:134-135 maps
  typso==5 -> sontyx=3 (BACK_ROUNDED). So sontyx==3 in the existing data is the
  signal that typso WAS rounded (5) OR was a genuine back-rounded vowel. The
  prcnt(a) adjustment specifically needs typso==ROUNDED_SONOR_CONS (the consonant
  case, /w/,/l/-rounded), NOT all sontyx==3. NEED a separate rounded-soncon flag.
- diphpos: position within a diphthong. Stop split is <BASE>+<BASE>_REL; diphthongs
  use trajectory waypoints. diphpos in DECtalk = which half of the diph. MUST CHECK
  if Qlatt exposes it.
- stress / phrase-final boundary: prosody has stress; boundary = FVPNEXT+ (verb
  phrase or stronger). MUST CHECK what dectalk prosody exposes.

## OPEN FEASIBILITY QUESTIONS (must answer before implementing)
1. Does Qlatt inventory/engine expose per-phoneme PLACE (FALVEL/FPALATL/FDENTAL)?
   If not -> add as DATA (cited from us_place[]).
2. rounded-soncon detection: need a per-phoneme rounded_sonorant_consonant flag
   (the ==5 case). Add as DATA.
3. F2BACKI/F2BACKF: the t4a vowel_category lost these (clamped). Add as DATA
   (per-vowel f2_back_initial / f2_back_final flags).
4. diphpos exposure in Qlatt? special_coartic AY/OY/YU cases need it.
5. stress + phrase-final boundary exposure for special_coartic.
6. us_special_coartic modifies the TARGET (steady), not bouval -> a SCALAR rule
   on F2/F3 steady targets. The prcnt adjustments modify the locus resolver's
   prcnt -> resolver-internal, driven by DATA flags.

## FEASIBILITY VERDICT (resolved — NOT blocked)
Engine/inventory EXPOSE enough; missing features addable as DATA.
- Scalar rules read `current.front`/`back`/`is_back_rounded` (inventory.yaml), `current.stress`,
  `prev`/`next`/`.phoneme`/`.type`, and `define`+`dispatch` (formant.yaml example). PROVEN.
- Obstruent PLACE (FALVEL/FPALATL/FDENTAL): NOT in inventory -> add as DATA from us_place[]
  (p_us_rom.h:982-1042, 59 entries, 1:1 with US_PHONEME_NAMES). bits FDENTAL=2,FPALATL=4,FALVEL=8.
- rounded-soncon (ROUNDED_SONOR_CONS=5): add as DATA list (begtyp==5 phonemes: w,y?,r,ll,rx,lx...).
- F2BACKI(64)/F2BACKF(128): add as DATA per-vowel f2_back {forward,backward} from us_place[].
- diphpos: NOT exposed (diphthongs are trajectory waypoints, no per-half index). The AY/OY-diphpos
  and unstressed-YU-diphpos special cases CANNOT be expressed -> DEFER those sub-cases, document.
- phrase-final boundary (FVPNEXT+): Qlatt signal = next==null||next.phoneme=='SIL' (SIL-adjacency,
  coarser than DECtalk verb-phrase). Approximate; document.

## ARCHITECTURE (two mechanisms)
1. prcnt adjustments (a)(b) = RESOLVER-INTERNAL (resolveLocusBoundary, track-assembler.ts:1256).
   Resolver already has vowelPhoneme + obstruentPhoneme + edge. Add OPTIONAL data params:
   obstruent_place (palatal_or_dental bool per obstruent), rounded_sonorant_consonant (set),
   f2_back (per-vowel forward/backward bool). Resolver applies:
   (a) if sonorant in rounded_soncon AND key in {F2,F3} AND obstruent NOT palatal/dental:
       prcnt = floor(prcnt/2)+50.
   (b) if key==F2 AND f2_back[vowel][edge]: prcnt += 25 - floor(prcnt/4); durtran = floor(durtran/2)+2.
   Use integer (>>) semantics: prcnt>>1 = floor(prcnt/2), prcnt>>2 = floor(prcnt/4). Generic; no literals.
2. us_special_coartic = SCALAR RULE on F2/F3 steady targets in formant.yaml (like the amp rules).
   Reads prev/next phoneme, current front, place(FALVEL) of neighbors (DATA), stress, SIL-boundary.
   Pure declarative, NO engine change. diphpos sub-cases deferred.

## DATA extraction
- extract_features.py already parses us_place[] (scripts/extract_features.py:35). Write a NEW small
  script scripts/extract_place_coartic.py in dectalk repo: emit obstruent_place (palatal_or_dental),
  alveolar set (FALVEL for special_coartic), rounded_sonorant_consonant (begtyp==5), f2_back per vowel.

## NEXT
- Write extraction script -> get the three DATA tables. Splice into frontend.yaml transitions
  (place/rounded/f2_back) + add alveolar DATA for special_coartic rule.
- Extend resolver (prcnt adj a/b). Add special_coartic scalar rule. Probe/audio/golden.

## DATA EXTRACTED (dectalk repo scripts/extract_place_coartic.py -> output/us_place_coartic.yaml)
- obstruent_place: palatal_or_dental per phoneme. TRUE: CH DH DZ JH SH TH TZ ZH. (FPALATL|FDENTAL)
- alveolar (FALVEL): D EN N S T TX Z.
- rounded_sonorant_consonant (begtyp==5): EL LL LX R W.
- f2_back (per ACTUAL us_place, comments approximate): IY{bwd}, EY{bwd}, Y{fwd,bwd}, YU{fwd}.
  (validation assertion fixed to match data: IY has F2BACKF only, not F2BACKI.)

## POLICY DATA mechanism CONFIRMED
- params.policy.X.Y reachable in CEL. A node {value: <list>, citations:[...]} -> CEL sees the LIST
  (projectPolicyValueTree returns node.value); citation satisfied; counts as ONE cited leaf
  (validation.ts:38-39,68-77). So `prev.phoneme in params.policy.coarticulation.alveolar` works.
- Unused policy leaf -> W_POLICY_PARAM_UNUSED warning (must be referenced by a rule).

## IMPLEMENTATION PLAN (locked)
A) Resolver prcnt adjustments (track-assembler.ts):
   - Add optional fields to transitions: obstruent_place (map name->{palatal_or_dental}),
     rounded_sonorant_consonant (string[]), f2_back (map name->{forward,backward}).
   - Thread into resolveLocusBoundary. Per key, after reading entry.prcnt/durtran:
     (a) if vowelPhoneme in rounded_soncon && key in {F2,F3} && !obstruent_place[obst].palatal_or_dental:
         prcnt = Math.floor(prcnt/2)+50.
     (b) if key=='F2' && f2_back[vowelPhoneme]?.[edge]: prcnt += 25 - Math.floor(prcnt/4);
         durtran = Math.floor(durtran/2)+2. (durtran affects spanSec.)
   - Generic: branches on DATA only. undefined data -> no adjustment (legacy).
   - Validation: extend validateLocusTables to accept optional obstruent_place/rounded.../f2_back.
B) us_special_coartic = scalar rule in formant.yaml (dectalk):
   - F3 rule: vowel & not RR & (prev|next in [W,R,RX]) -> F2... no: F3 += -150.
   - F2 rule: dispatch of the offset cases (LX next, W/LL/LX prev, UW alveolar adj), then
     unstressed *1.5, phrase-final(SIL-adj) *0.5, clamp +-400. Add as F3/F2 op:add on steady target.
   - alveolar list -> params.policy.coarticulation.alveolar (cited). front detection: current.front.
   - DEFER: AY/OY diphpos (-250/-350) & unstressed-YU=400 (need diphpos, not exposed).
     Implement the front-vowel/UW/W-R cases (diphpos-independent).

## ENGINE IMPLEMENTED (track-assembler.ts)
- TrackLoweringSpec.transitions += obstruent_place / rounded_sonorant_consonant / f2_back (all optional).
- LocusPrcntAdjustments type + resolveLocusBoundary(...prcntAdjust?) applies (a) and (b) per key
  using integer Math.floor semantics (matches DECtalk >> shifts). Undefined data => legacy no-op.
- Apply site builds prcntAdjust from transitions DATA; threaded into BOTH resolver calls.
## VALIDATION (validation.ts)
- validateLocusTables extended: optional obstruent_place (palatal_or_dental bool),
  rounded_sonorant_consonant (string[]), f2_back (forward/backward bool). Wired at call site.

## NEXT
- Splice DATA into dectalk frontend.yaml transitions (gen script). Scope obstruent_place to obstruents
  with loci. Add special_coartic scalar rule(s) in formant.yaml + alveolar policy list.
- tsc, probe (audio+track), explain --strict-citations, golden, qlatt-english byte-identity.

## DATA SPLICED + special_coartic policy added
- frontend.yaml transitions: obstruent_place(26) + rounded_sonorant_consonant[EL,LL,LX,R,W] +
  f2_back{EY,IY,Y,YU}. policy.formant.special_coartic: alveolar list + 6 cited offset/gain/clamp values.
- Generators: scripts/gen-dectalk-place-coartic-yaml.mjs (Qlatt), scripts/extract_place_coartic.py (dectalk).

## INVENTORY FACTS (dectalk inventory.yaml phoneme_targets) for special_coartic rule
- Vowels carry STRESS DIGITS: IY1/IY0 etc. Consonants do NOT (B, D, W, R...).
- `front:true` ONLY on IY*/IR* (narrower than DECtalk USP_IY..AE). DO NOT use current.front for
  the front set -> enumerate DECtalk front set by name.
- DECtalk front set USP_IY..AE = IY IH EY EH AE (+IX, +none here). Qlatt: IY1 IY0 IH1 IH0 EY1 EY0
  EH1 EH0 AE1 AE0. IX absent. YU absent (no YU phoneme). UW1/UW0 present.
- So special_coartic implementable cases: F3 near W/R/RX (-150); F2 front-vowel before LX or after
  W/LL/LX (-150); F2 UW adjacent alveolar (+200). unstressed *1.5, phrase-final(SIL-adj) *0.5, clamp 400.
  YU/diphpos cases naturally absent/deferred.

## RULE DESIGN (phases/formant.yaml, dectalk)
- Two scalar rules (F3, F2). select vowels (type=='vowel'). Use define for neighbor phonemes +
  membership against policy lists; dispatch/value with op:add on params.F3 / params.F2.
- Neighbor phoneme (consonant) bare: prev.phoneme in ['W','R','RX'] etc. (literals = DT phoneme
  identities from p_us_st1.c, cited). front-vowel set: need a policy list (stress-suffixed) OR
  enumerate startsWith. CEL has no startsWith? -> use explicit name list in policy DATA.
- stress: current.stress (1=primary). phrase-final: next==null||next.phoneme=='SIL'.
- Phase ordering: must run AFTER targets set, alter steady F2/F3 (op:add). Place in formant phase.

## PROBE RESULTS (npx tsx scripts/dt-t4b-prcnt-probe.ts) — partial, 2 issues
- tsc: ZERO errors in src/track-assembler.ts + validation.ts. explain dectalk --strict-citations
  uncited=0 exit0 (190 decisions). YAML parses, validation passes.
- "dwell" D->W: W forward edge fires; F2 boundary 1077 between locus 1700 & W-steady 810,
  pulled toward vowel = adjustment (a) reducing extent. OK.
- "ease" -> phones IY S (LTS gives S not Z). IY before S backward edge: F2 1803 boundary
  (back-cavity (b) applies). OK direction.
- ISSUE 1: "two" T->UW: UW steady F2 = 1060 UNCHANGED (expected +200 -> 1260). special_coartic
  F2 rule did NOT fire because prev.phoneme == 'T_REL' (stop release glue), not 'T'. Same _REL
  glue problem t4a solved in the resolver. Scalar rule sees the RELEASE neighbor, not the alveolar.
- ISSUE 2: "we" W->IY: IY steady F3 = 2655 (base 2880, delta -225 not -150). F2 = 2100 unchanged
  (expected front-vowel -150 -> 1950). Need to check why F2 rule didn't fire / F3 delta wrong.
  Possibly inventory base IY F3 already differs, or forward locus pull on F3 stacks. INVESTIGATE.

## NEXT (fix issues)
- Determine how scalar rules can see the BASE obstruent past _REL/aspiration glue. Options:
  (i) use look_back_where/look_ahead_pred navigation to skip glue; (ii) check if a "base phoneme"
  field exists. Verify what prev/next resolve to and whether nav helpers skip glue.
- Re-examine "we": is F2 rule matching IY? prev.phoneme for IY is 'W' (W is not a stop, no glue) so
  it SHOULD fire. Check if op:add value evaluated; check base IY F3 in inventory; F3 -225 source.

## ROOT CAUSE of probe issues (verified from SOURCE, not comment)
- current.phoneme in rules is BARE — stress suffix STRIPPED: tts-frontend.ts:452 `phoneme:
  targetKeyBase`; stress lives in `.stress`. (Contradicts my INVENTORY-FACTS note above which
  said vowels carry digits — that was true of the INVENTORY KEY / TRACK frame, NOT the rule token.)
  -> front_vowels list must be BARE [IY,IH,EY,EH,AE]. FIXED in frontend.yaml.
  -> is_uw must be bare 'UW' (not UW0/UW1). FIX PENDING.
- _REL glue: stop = <BASE> + <BASE>_REL. In "two" UW's prev token is T_REL, not T, so the
  alveolar test misses. DECtalk fonlas/fonnex = the base stop phoneme. The special_coartic
  neighbour test must skip stop_release/stop_aspiration glue (same issue t4a fixed in resolver).
  (Existing amp rule has same latent suffix bug with 'AO0' entries — pre-existing, NOT my scope.)
- "we" F3=2655: IY base F3 is 2880; -225 not -150. Re-derive after fixing F3 rule firing /
  forward-locus interaction. RE-PROBE after fixes.

## FIXES APPLIED + RE-PROBE (all special_coartic cases now EXACT)
- front_vowels -> bare; is_uw -> bare 'UW'. prev_ph in both rules now uses
  look_back_where(current,3,'candidate.type != "stop_release" && != "stop_aspiration"') to skip
  glue (generic, by type). next is already base closure (no glue between vowel and following stop).
- "we" (W IY, IY unstressed stress=0): F2 steady 2100 -> 1875 = base - 150*1.5 (unstressed_gain).
  F3 2880 -> 2655 = base -150*1.5. EXACT (front-vowel-after-W -150; near-W F3 -150; *1.5 unstressed).
- "two" (T T_REL UW, UW stress=1 phrase-final): F2 steady 1060 -> 1160 = base +200*0.5
  (phrase_final_gain; UW adjacent alveolar T, glue-skipped to T). EXACT.
- "dwell" D->W: forward locus on W, prcnt-adj (a) reduces extent (rounded-soncon W, non-pal/dental D).
- "ease" IY->S backward: F2 back-cavity adj (b) applies. Direction correct.
- explain dectalk --strict-citations uncited=0 (re-verify after fixes). qlatt-english untouched.

## FULL VERIFICATION (DONE)
- explain "hello world" --frontend dectalk-english --strict-citations: uncited=0, exit 0 (190 decisions).
- AUDIO: render-phrase "we two dwell" dectalk-english/dectalk-english host node -> inspect-audio:
  samples=23792 nonZero=22405 nanInf=0 rms=0.102 peak=0.914 flag OK. Paul healthy.
- test:golden: klatt-tract exit0, lf-source exit1 (ONLY pre-existing failure, maxDelta 0.79, untouched),
  render-phrase qlatt-english exit0. No NEW failure.
- qlatt-english: NOT modified (only dectalk-english YAML + 2 generic src files). render-phrase
  qlatt golden passes (byte-identical audio). loci undefined for qlatt -> resolver no-op.
- tsc: ZERO errors in src/track-assembler.ts + validation.ts (rest are pre-existing scripts/ + test errors).
- DECLARATIVITY: zero hardcoded phoneme/place literals in track-assembler.ts / validation.ts (grep clean).
  All place/rounding/f2-back classification is cited DATA in frontend.yaml; resolver + rules generic.

## FILES CHANGED (this chunk)
- src/track-assembler.ts: TrackLoweringSpec.transitions += obstruent_place/rounded_sonorant_consonant/
  f2_back (optional); LocusPrcntAdjustments type; resolveLocusBoundary applies prcnt adj (a)+(b)
  per-key (Math.floor = DECtalk >>); prcntAdjust built at apply site + threaded to both calls.
- src/declarative-frontend/validation.ts: validateLocusTables extended for the 3 optional tables.
- public/.../dectalk-english/frontend.yaml: transitions.{obstruent_place,rounded_sonorant_consonant,
  f2_back} DATA + policy.formant.special_coartic (alveolar, front_vowels, 6 cited offsets/gains/clamp).
- public/.../dectalk-english/phases/formant.yaml: dectalk_special_coartic_f3 + _f2 scalar rules.
- public/.../dectalk-english/pipeline.yaml: registered the 2 rules in formant phase.
- NEW: scripts/gen-dectalk-place-coartic-yaml.mjs (Qlatt), scripts/dt-t4b-prcnt-probe.ts,
  scripts/dt-t4b-diag.ts; dectalk repo scripts/extract_place_coartic.py + output/us_place_coartic.yaml.

## DEFERRED (documented)
- AY/OY before LX (-250/-350) + unstressed YU 2nd-half (+400): need diphpos (diphthong-half index),
  NOT exposed to scalar rules (diphthongs are trajectory waypoints). Also no YU/IX allophone here.
- Per-formant durtran in the locus window (inherited from t4a; MAX-span approximation).
- Female loci prcnt adjustments use the same DATA (place/rounding/f2-back are sex-independent) — fine.

## EXACT FORMULA VERIFICATION (track values match adjusted bouval, NOT raw)
- (a) "dwell" D->W forward: D sontyx3 F2 {1700,40} -> adj prcnt 70 -> bouval 1077 (track 1077; raw=1344).
  F3 {2601,30} -> adj 65 -> bouval 2325 (track 2325). Adjustment fired, extent reduced. EXACT.
- (b) "ease" IY->S backward: S sontyx1 F2 {1440,40,50} -> adj prcnt 55 -> bouval 1803 (track 1803;
  raw=1704), durtran 50->27ms. IY F2BACKF=true. EXACT.
- special "we": IY(unstr) F2 2100->1875 (-150*1.5), F3 2880->2655 (-150*1.5). EXACT.
- special "two": UW(stressed,phrase-final) F2 1060->1160 (+200*0.5). EXACT.

## Blockers
- None. COMPLETE. diphpos-dependent special-coartic sub-cases DEFERRED (feature genuinely unavailable).
