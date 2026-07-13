# Chunk dt-4 (DECtalk allophones: glottalization, palatalization, dental) — Coder notes

Datestamp: 2026-05-29. Branch `dectalk-parity`. Mission: three MORE DECtalk 4.63 allophone
rewrites in `dectalk-english`, declaratively, exact dt-3 flapping pattern:
(1) GLOTTALIZATION /t/→TX (and /t/→D), (2) PALATALIZATION /t/→CH /d/→JH, (3) DENTAL /dh/→DZ.

## TEMPLATE (dt-3 flapping) — verified pattern
- `public/rules/frontends/dectalk-english/phases/postlexical.yaml` — kind:postlexical,
  select.where on phoneme, `define:` block (p=prev,n=next, target('X'), CEL flags),
  `constraint:` (skip if false), `splice: replace_range` over current.sync_left..sync_right,
  insert one token copy_from:current copy_fields[stress,word] with phoneme/type/params/durations
  from target('X'). A bare `apply op:set phoneme` only renames — does NOT re-materialize params,
  so splice+target() is required to realize acoustics.
- Phase runs after normalize, BEFORE structural (raw T/D/DH pre stop-split). Hardcoded slot
  in tts-frontend.ts runPhases — phase MUST be named `postlexical` to run. pipeline.yaml order
  is cosmetic.
- Generic builtin `word_count()` already added by dt-3 (distinct non-SIL words in stream).

## DECtalk SOURCE — VERIFIED (ph_aloph.c, US branch)
### Palatalization L878-891
`((next==USP_YU || next==USP_YX) && (sentstruc[n+1] & FSTRESS) IS_MINUS)`:
  if curr==USP_T → curr_outph=CH; if curr==USP_D → curr_outph=JH. goto endrul3.
OPEN Q (recon #2): does this port emit YU/YX vs Y? MUST check l_us_ph.h codes + g2p mapping.
File: C:/Users/Q/src/dectalk/463/dapi/src/INCLUDE/l_us_ph.h

### Glottalization L912-927 (NEW RULE)
`if (curr==USP_T && (phone_feature(phonemes[n-2]) & FLABIAL) IS_MINUS)`:
  `if (next==USP_LL || next==USP_DH
      || ( ((curr_instruc & FBOUNDARY) >= FMBNEXT) && ((feature(next)&FSON2)IS_PLUS || next==USP_HX) )
      || next==USP_EN )`:
       curr_outph = USP_D;
       `if (feature(last_outph) & FSON1) IS_PLUS`: curr_outph = USP_TX;
       goto endrul3.
So: T→D by default in those contexts, UPGRADED to TX if prev (last_outph) is FSON1+ (sonorant).
Mission framed it as "/t/→TX before a syllabic nasal (button, mountain)" — that's the next==EN
clause with prev sonorant. But faithful port must cover the full trigger. NOTE precedence:
palatalization (L878) has goto endrul3 BEFORE glottalization (L912) — palatalize wins.

### dh→DZ L1066-1082 (Rule 4)
`if (curr==USP_DH && (curr_instruc & FSTRESS) IS_MINUS)`:
  `if (last_outph==USP_T || last_outph==USP_TX || last_outph==USP_D)`: curr_outph=USP_DZ.
The `last_outph==USP_N → N` clause is commented out ("temp out per KEN") — skip.
HLSYN block L1052-1063 is #ifdef HLSYN — compiled out — skip.

## INVENTORY (dectalk-english/inventory.yaml) — VERIFIED present
- DF (L1524), DX (L1512), CH (L1543), JH (L1558) all present.
- TX: NOT YET CHECKED in full file (recon says MISSING — must add).
- DZ: NOT YET CHECKED (recon says MISSING — must add).
- Source for TX/DZ targets: p_us_rom.h us_maltar/us_inhdr/us_mindur by US code.
  Probe mechanism: C:/Users/Q/src/dectalk/463/scripts/probe_df_dx.py (extend for TX/DZ).
  US codes in l_us_ph.h.

## FEATURE DEFS (from dt-3 notes, ph_defs.h) — reuse
- FSYLL = vowels + EL/EM/EN. FSON1 = +sonor except si/h = vowels/glides/liquids/nasals.
- FNASAL = nasals. FSON2 = w,y,r,l,yu, m,n,ng,em,en.
- FLABIAL: place feature — MUST extract membership (p,b,m,f,v,w typically). NOT YET READ.

## CODES (l_us_ph.h): YU=16, Y=25, LL=27, HX=28, DZ=35, EN=36, DH=40, T=47, D=48,
##   DX=51, TX=52, Q=53, CH=54, JH=55, DF=56.
## USP_ macros (p_all_ph.h): USP_YX == US_Y (25)! USP_YU == US_YU (16).
##   => palatalization fires when next is YU(16) OR plain Y(25). Port inventory has only
##   `Y` glide (no YU token) => map "next in {YU,YX}" to next.phoneme=='Y'.

## FEATURE MEMBERSHIP (ph_defs.h L316-346) — VERIFIED
## featb byte: FSYLL=vowels+EL/EM/EN; FSON1=+sonor exc si/h=vowels/glides/liquids/nasals;
##   FNASAL=nasals(M,N,NG/NX,EN,EM); FSON2=w,y,r,l,yu,m,n,ng,em,en.
## place byte: FLABIAL=p,b,m,f,v; FDENTAL=th,dh,d$; FALVEL=t,d,n,en,s,z,tx.
## => Qlatt mapping:
##   FLABIAL(x): x.phoneme in [P,B,M,F,V]
##   FSON2(x): x.phoneme in [W,Y,R,L,YU,M,N,NG,EL,EN] (port: W,Y,R,L,M,N,NG,EL,EN)
##   FSON1(x): x.type in [vowel,glide,liquid,nasal]  (reused from dt-3)

## OBSERVED phone streams (scripts/dt4-probe-scratch.ts, dectalk-english, PRE my rules):
##  "did you go"  D D_REL IH/0 D D_REL Y UW/0 G G_REL OW/1  -> D before Y (palatalize D->JH)
##  "got you now" G G_REL AA/1 T T_REL Y UW/0 N AW/1        -> T before Y (palatalize T->CH)
##  "i bet you"   ...T T_REL Y UW/0...                       -> T before Y -> CH
##  "would you"   ...D D_REL Y UW/0...                       -> D before Y -> JH
##  "button it up" B B_REL AH/1 DF EN IH/0 DF AH/0 P  <-- /t/ ALREADY -> DF via FLAPPING
##       (next==EN is in flapping weak-vowel list). DECtalk glottalization (next==EN, prev
##       sonorant) should make this TX and comes FIRST (L912 < L958, goto endrul3).
##       => PRECEDENCE: glottalization must run BEFORE flapping; with prev=AH (FSON1) it
##          upgrades to TX, and goto endrul3 stops flapping. So "button" t -> TX not DF.
##  "a mountain road" M AW/1 N T T_REL AH/0 N R ...  <- /t/ next is AH (schwa), NOT EN.
##       So glottalization next==EN clause does NOT fire here (g2p gave AH not EN). The
##       word-boundary FSON2 clause also no (next AH is a vowel, mid-word). => "mountain"
##       /t/ does NOT glottalize in THIS port's transcription. Honest gap: depends on g2p
##       emitting EN; it emits AH. Document, do not hack.
##  "width of the box" W IH/1 D D_REL TH ...  <- no DH after T/D adjacency for DZ here.
##  "at the door now" AE/0 T T_REL DH AH/0 ...  <- T then DH (next word). For dh->DZ the DH's
##       last_outph must be T/TX/D. Here prev of DH is T -> DZ SHOULD fire on the DH.
##       Glottalization: T's next is DH -> next==DH clause -> T->D, prev AE(FSON1) -> TX.
##       Then DH's last_outph would be TX -> DZ. Chain! (matches A19/Rule4 interplay).
##  "let the dog out" L EH/1 T T_REL DH AH/0 ... <- same T-then-DH -> TX, then DH->DZ.

## PRECEDENCE (ph_aloph.c source order, all use goto endrul3 = mutually exclusive per token):
##  1. palatalization L878 (T/D before Y -> CH/JH)   [first, wins]
##  2. glottalization  L912 (T -> D/TX)              [second]
##  3. flapping        L958 (T/D -> DF/DX)           [third]
##  4. dh->DZ          L1066 (DH -> DZ)              [separate phoneme, no conflict, but
##       depends on last_outph being the ALREADY-REWRITTEN prev (T/TX/D)]
## In the engine, separate rules in one phase run in file order; a token rewritten by an
## earlier rule won't match a later rule's select (phoneme changed). So ORDER rules in
## postlexical.yaml: palatalize_t, palatalize_d, glottalize_t, [existing flap_t, flap_d], dh_dz.
## Caches invalidated after each structural mutation (recon L21) so `prev`/`next` see rewrites.

## CONFIRMED: TX,DZ absent in dectalk-english inventory. qlatt-english has NONE of DF/DX/TX/DZ
##   (untouched, good).

## PHASE RULE LIST is in pipeline.yaml L40-43 (NOT frontend.yaml). Engine runs rules in the
## order listed in pipeline.yaml phase.rules (engine.ts L3202 for ruleName of phase.rules).
## Current postlexical: [dectalk_flap_t, dectalk_flap_d]. I will set order to:
##   dectalk_palatalize_t, dectalk_palatalize_d, dectalk_glottalize_t,
##   dectalk_flap_t, dectalk_flap_d, dectalk_dental_dh
## (matches source precedence: palatalize L878 -> glottalize L912 -> flap L958 -> dh L1066;
##  dh_dz last so it reads the already-rewritten prev as last_outph T/TX/D.)
## A token rewritten by an earlier rule changes .phoneme so later rules' select.where won't
## re-match it (palatalized T is now CH, won't flap). Cache invalidated after each splice.

## TX/DZ TARGETS — VERIFIED via scripts/probe_tx_dz.py (extends probe_df_dx mechanism,
##   reads us_maltar/us_inhdr/us_mindur in p_us_rom.h by US code; TX=52, DZ=35):
##  TX (52): F1 280 F2 1600 F3 2600 B1 110 B2 100 B3 170 AV 0; inherent 70 min 50 burst 0.
##     => glottalized voiceless /t/. Inventory: type stop_closure, alveolar, voiceless,
##        is_obstruent (mirrors T entry which is stop_closure alveolar voiceless obstruent).
##  DZ (35): F1 300 F2 1400 F3 2600 B1 90 B2 110 B3 200 AV 50; inherent 60 min 35 burst 13.
##     => dental voiced stop. Inventory: type stop_closure, dental, voiced, is_obstruent.
##  Citation: DECtalk 4.63 p_us_rom.h us_maltar/us_inhdr/us_mindur (US_TX 52 / US_DZ 35).

## SCHEMA (inventory): F1..F3,B1..B3,AV[,AF,AH], dur, minimumDuration, type, place flags
##   (alveolar/dental/...), voiced|voiceless, is_obstruent. DF/DX use type:flap voiced.

## IMPLEMENTED (2026-05-29):
## - inventory.yaml: added TX (stop_closure alveolar voiceless obstruent) + DZ (stop_closure
##   dental voiced obstruent), cited p_us_rom.h US codes.
## - postlexical.yaml: 4 rules dectalk_palatalize_t, _palatalize_d, _glottalize_t, _dental_dh.
## - pipeline.yaml postlexical order: palatalize_t,_d, glottalize_t, flap_t,_d, dental_dh.

## PROBE RESULTS (scripts/dt4-allophone-probe.ts + dt4-glot-scratch.ts):
## PALATALIZATION: WORKS. "got you"->CH, "did you"->JH, "i bet you"->CH, "would you"->JH.
##   "a yellow boat" no CH/JH (correct). Note: palatalize T->CH happens, the following Y
##   STAYS (DECtalk only rewrites the /t,d/; the y is the onset of the next syllable).
## DENTALIZATION: WORKS + CHAIN. "at the"-> AE TX DZ (T glottalized to TX, then DH after TX
##   -> DZ). "let the"-> TX DZ. "this is the box" stays DH (prev not stop). Confirms dh_dz
##   reads the already-rewritten prev (last_outph) and runs AFTER glottalize.
## GLOTTALIZATION: WORKS where DECtalk would fire. "certain"->S ER TX EN, "gotten"->G AA TX EN,
##   "curtain"->K ER TX EN, "atlas"->AE TX L (next L = USP_LL clause), "outline"->AW TX L.
##   - "button" -> B AH DF EN: /t/ FLAPS to DF, does NOT glottalize. FAITHFUL: glottalization
##     requires phonemes[n-2] NOT FLABIAL; for "button" n-2 from T is B (labial) -> guard
##     blocks glottalization -> flapping catches it. DECtalk does the same. Mission's "button"
##     example is imperfect; the rule is correct. "certain/gotten/curtain" are the real cases.
##   - NO double-application: where TX fires, DF does NOT (mutually exclusive via rule order +
##     phoneme change; glottalize runs before flap and changes T->TX so flap_t won't match).
## ANOMALY TO RESOLVE: "rotten"/"kitten" -> "...T D D_REL EN" (T and D both present?!). prev
##   of T is AA (vowel=FSON1) so expected TX not D. INVESTIGATING next.

## TX/DZ values: TX F1 280 F2 1600 F3 2600 B110 B100 B170 AV0 dur70 min50;
##   DZ F1 300 F2 1400 F3 2600 B90 B110 B200 AV50 dur60 min35.

## ANOMALY RESOLVED (not my rules): "rotten"/"kitten" (NOT in dict -> LTS) transcribe to
##   R AA T AH N / K IH T AH N. At postlexical time T's next is AH (vowel), NOT EN, so
##   glottalize does NOT fire; flap is gated (1 word). The "T D D_REL EN" in FINAL output is
##   a pre-existing LTS/structural artifact for out-of-dict words, independent of dt-4. Dict
##   words "certain/gotten/curtain" come as "...T EN" so glottalize sees EN and -> TX (correct).
##   Probe positive glottalization cases therefore use dict words (no word-count gate on glot).

## DOUBLE-APPLICATION: NONE. Where TX fires, DF does not (rule order: glottalize before flap,
##   and glottalize changes T->TX so flap_t's select where current.phoneme=='T' no longer
##   matches). "button" intentionally flaps (DF) not glottalizes: FLABIAL guard on n-2=/b/.

## VERIFICATION (2026-05-29):
## - npx vitest run = 1107 passed / 1107 (baseline held, NO snapshot changes).
## - golden: PENDING run (expect only pre-existing lf-source failure).
## - qlatt-english: PENDING git diff confirm untouched.
## Scratch scripts removed; kept scripts/dt4-allophone-probe.ts. probe_tx_dz.py lives in
## DECtalk source tree (extraction helper), not in Qlatt repo.

## FINAL VERIFICATION (2026-05-29) — DoD met
## 1. Three rewrites in postlexical.yaml: dectalk_palatalize_t/_d (T->CH/D->JH before
##    unstressed Y, ph_aloph.c:878-891), dectalk_glottalize_t (T->TX if prev sonorant else
##    ->D, in glottalizing context, ph_aloph.c:912-927), dectalk_dental_dh (DH->DZ after
##    t/tx/d, ph_aloph.c:1066-1082). All have citations: with exact line ranges + feature
##    defs + target source. Compiled-out branches NOT ported: glottalization's word-initial
##    FWINITC clause is N/A (it's in flapping); the dh "last_outph==N -> N" branch (temp out
##    per KEN) skipped; #ifdef HLSYN r-block skipped.
## 2. TX + DZ inventory targets added, cited to p_us_rom.h us_maltar/us_inhdr/us_mindur
##    (US_TX 52, US_DZ 35) via scripts/probe_tx_dz.py.
## 3. scripts/dt4-allophone-probe.ts: ALL 13 cases pass. Palatalize (got/did/bet/would you;
##    yellow negative). Glottalize TX (certain/curtain/atlas; button & attic negatives).
##    Dental DZ (at the/let the; this is the negative). No DF where TX fires (no double-apply).
## 4. npx vitest run = 1107 passed (baseline held, NO snapshot regen needed — no declarative
##    track baseline legitimately changed). Golden: render-phrase EXIT 0, klatt-tract EXIT 0,
##    lf-source EXIT 1 (pre-existing WASM DSP, maxDelta 0.790002666, == dt-3 baseline). No new
##    golden failure. qlatt-english untouched (git diff empty); src/ untouched (no engine change
##    needed — word_count/behind primitives from dt-3 sufficed).
## 5. PRECEDENCE implemented (pipeline.yaml postlexical order): palatalize_t, palatalize_d,
##    glottalize_t, flap_t, flap_d, dental_dh. Matches ph_aloph.c source order with goto
##    endrul3 making each per-token rewrite mutually exclusive; dental last to read last_outph.

## TAG FIELD NOTE (DoD #1 says "and tag"): the engine reads `tag` ONLY on apply-effect
## entries (engine.ts L1587), point specs (L2225), layer specs (L2356) — NOT on a top-level
## structural/splice rule. validation.ts L1372 validates tag only inside apply entries. The
## dt-3 flapping template (which the mission says to follow EXACTLY) is a splice rule with
## citations and NO tag, for this reason. These three rules are splices too, so they carry
## citations (which feed provenance) but no tag — same as the template. Adding a top-level
## `tag:` would be ignored by the engine. Flagging so the verifier sees this was deliberate.

## NO HARD-STOPS HIT: declarativity preserved (YAML/CEL splices + target() only, zero
## rule-specific TS); no new engine primitive needed (behind()/word_count()/target() existed);
## no rule fired wrongly that couldn't be constrained in CEL. No git add/commit performed.
