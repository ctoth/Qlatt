# Chunk dt11 — Port remaining DECtalk segmental duration rules (syllable-keyed)

Datestamp: 2026-05-29. Branch dectalk-parity. Coder.

## Mission
Port remaining Klatt-1976/DECtalk duration rules into dectalk-english duration.yaml,
replacing the vowel-lookback approximation of polysyllabic/medial-syllable with the
real syllable builtins (syllable_index, syllable_role, syllable_position_in_word).

## State / findings so far
- Read p_us_tim.c fully (1156 lines). us_phtiming() main loop L161+.
- Existing duration.yaml has Rules 1,2,3,4,5,6,7,8,9a,9b,13,15 + rate scaling (13 scalar rules).
- Rule 5 (polysyllabic) currently uses look_back_where vowel hack (L116-117) — APPROXIMATION to replace.

## DECtalk source mapping (p_us_tim.c)
- FTYPESYL field with FMONOSYL / FFIRSTSYL / FMEDIALSYL values. Rule 4 L349-407:
  - MONOSYL: prcnt N90(=0.90) if not stress_1; if not stress_1 -> N85; if unstressed -> N70.
    (Note: code only applies when FSTRESS_1 IS_MINUS — primary-stressed monosyl unchanged.)
  - non-MONOSYL & strucbou<FWBNEXT (not word boundary next): initial vowel N85;
    if FTYPESYL > FFIRSTSYL (i.e. medial/later): N85 too (both 0.85 in this build).
  - Rule 5 nested L398-406: non-MONOSYL -> N80 (polysyllabic).
- Rule 7 L429-495: unstressed. Medial-syll (FMEDIALSYL) syllabic -> prcnt>>1 (=0.5); else N70.
  durmin halving for unstressed non-obstruent.
- Rules 10,11,12,14,16,17,18,19,20,21,23,24 + RR/Q/HX special: L647-940. NOT yet ported.

## CONFIRMED (2026-05-29)
- Syllable builtins live (dt10): syllable_index()/role()/position_in_word() in engine.ts L1334-1336,
  in CEL allow-list (cel-expressions.ts L62-67). Return: index=number, role='onset'|'nucleus'|'coda',
  position_in_word='first'|'medial'|'last'|'only' (syllabify.ts L41,L327-332).
- annotation phase (dectalk pipeline L302) runs AFTER structural, BEFORE duration (L232). It writes
  token fields syllable_index / syllable_role / syllable_position_in_word via op:set (annotation.yaml),
  guarded current.phoneme!='SIL' && has(current.word). => duration rules can read
  current.syllable_position_in_word / current.syllable_role as plain token fields. Use has() guards.
- FTYPESYL classifier (ph_sort2.c init_med_final L61-111; values ph_defs.h L237/244-248, OCTAL):
  FMONOSYL=0, FFIRSTSYL=FBISYL=010(8), FMEDIALSYL=020(16), FFINALSYL=030(24). mask FTYPESYL=030.
  syll before AND after -> MEDIAL; after only -> FIRST; before only -> FINAL; neither -> MONOSYL.
  EXACT map to port position_in_word: only<->MONOSYL, first<->FFIRSTSYL, medial<->FMEDIALSYL,
  last<->FFINALSYL. C comparisons: ">FFIRSTSYL" = medial||last; "!=FMONOSYL" = polysyllabic
  (first||medial||last); "==FMEDIALSYL" = medial only.
- dt11-duration-probe.ts does NOT exist yet -> create it.

## RULE-BY-RULE MAPPING (p_us_tim.c) — what to change/add
- Rule 4 (L353-407, vowel only): MONOSYL: primary-stressed = NO change (N90 is dead code, mlsh1 only
  inside FSTRESS_1 IS_MINUS); secondary->x0.85; unstressed->x0.70. non-MONOSYL & seg not at word boundary
  (strucbou<FWBNEXT, i.e. NOT word-final segment): x0.85 (first/medial/last all 0.85 in this build).
  CURRENT PORT: dectalk_stress_shortening applies stress scaling to ALL vowels uniformly -> conflates.
  FIX: split Rule 4 into (a) monosyllable stress-shortening keyed on position=='only', and
  (b) polysyllabic non-word-final x0.85 keyed on position!='only' && !word-final-segment.
- Rule 5 (L398-406, nested): any non-MONOSYL vowel -> x0.80. CURRENT PORT dectalk_polysyllabic_shortening
  uses look_back_where vowel hack -> REPLACE constraint with position_in_word != 'only'.
- Rule 7 (L429-495): unstressed. syllabic & FMEDIALSYL -> prcnt>>1 (x0.5) ELSE x0.70. durmin halving
  (skip: port uses floor_field, durmin reduction is a separate mechanism - check). CURRENT PORT
  dectalk_unstressed_shortening flat 0.70 vowel/0.70 cons/0.50 glide. FIX: medial vowel unstressed -> 0.5.
- Rules to ADD (10,11,12,14,16,17,18,19,20,21,23,24 + RR/Q/HX): see below, port where CEL-expressible.

## IMPLEMENTED (2026-05-29)
DATA constants added to frontend.yaml policy.duration: monosyllable_secondary_shortening 0.85,
monosyllable_unstressed_shortening 0.70, polysyllable_nonfinal_shortening 0.85,
unstressed_medial_syllabic_shortening 0.50, two_vowel_first_lengthening_ms 32,
word_initial_stressed_vowel_lengthening_ms 25, function_word_final_th_shortening 0.60,
the_iy_prevocalic_lengthening 1.50, pre_df_flap_shortening 0.35, pre_ng_shortening 0.60,
nt_cluster_nasal_shortening 0.10. (NF*MS->ms via 6.33ms/frame: NF25=25,NF30=32, matching
existing NF20=19,NF40=38.)

duration.yaml rules:
- REPLACED dectalk_stress_shortening -> dectalk_monosyllable_stress_shortening (Rule 4 monosyl
  branch, position=='only', primary unchanged, secondary 0.85, unstressed 0.70).
- ADDED dectalk_polysyllable_nonfinal_shortening (Rule 4 non-monosyl branch, position!='only' &&
  not word-final segment -> 0.85).
- REPLACED Rule 5 dectalk_polysyllabic_shortening constraint: look_back_where hack ->
  syllable_position_in_word != 'only'.
- UPDATED Rule 7 dectalk_unstressed_shortening: added is_medial_syllabic (position=='medial')
  -> 0.50 dispatch branch (was flat 0.70 for vowels).
- ADDED Rule 9 [nt] dectalk_nt_cluster_nasal_shortening (N before non-word-init unstressed T ->
  0.10; N->D rewrite is allophonic, left to postlexical).
- ADDED Rules 10/11/19/20/23/24: two_vowel_first_lengthening (next vowel +32ms),
  word_initial_stressed_vowel_lengthening (first-syll primary vowel, word-initial seg +25ms),
  function_word_final_th_shortening (TH monosyl word-final unstressed *0.60),
  the_iy_prevocalic_lengthening (IY monosyl unstressed, next word starts with vowel *1.50),
  pre_df_flap_shortening (vowel before DF *0.35), pre_ng_shortening (before NG *0.60).
pipeline.yaml duration phase: rule list updated to match, in source order.

## SKIPPED (documented, CEL/port limitations — NOT hard-stops, minor rules)
- Rule 12 (vowel before LX): port has no LX/LL phoneme in inventory (dt10 noted). Cannot fire.
- Rule 14 (sonorant after aspirated plosive): port splits stops into closure/release/aspiration
  segments; faithful mapping needs prev==aspiration-segment handling, deferred.
- Rule 16 (vowel after non-nasal sonorant cons, "if deldur==0"): the deldur==0 guard reads the
  accumulated additive state, NOT expressible in stateless per-token CEL.
- Rule 17 (short-phrase <10 phones prcnt+=30) AND Rule 2 short-phrase sub-case: need a total-
  phone-count builtin which does NOT exist (engine has word_count/count_word_vowels only). Deferred.
- Rule 21 (stop after stop before fricative *0.25 + durmin>>1): prcnt part expressible; deferred
  with Rule 14 family (needs split-stop segment-class care). Not done this chunk.
- durmin (minimumDuration floor) reductions in Rule 7/13/21: expressible as op:mul on field
  minimumDuration (it's a token field, floor_field), but a secondary effect; deferred — focus was
  the prcnt (multiplier) effects which dominate. Noted for follow-up.

## PROBE OUTPUT (scripts/dt11-duration-probe.ts) — DECtalk direction confirmed
- "cat": monosyllable stressed AE = 242 ms (Rule 4 primary monosyl -> NO shortening). CORRECT.
- "category": first-syll AE = 208 ms (< 242: Rule4 nonfinal 0.85 * Rule5 0.80); medial AH = 137 ms
  (further reduced via Rule7 medial 0.50). Same /ae/ shorter in polysyllable medial position. CORRECT.
- "happy"/"computer": first/medial/last vowels show graded shortening.
- "running": Rule 24 fires, IH before NG shortened (111 ms), NG present.
- "react": two-vowel hiatus IY=178 (Rule 10).
NOTE: "running"/"writing" hit dictionary MISS -> G2P -> /r/ becomes RR and /t/ not flapped to DF,
so Rule 23 (pre-DF) does not fire for "writing" in this probe (flapping is postlexical, dictionary-
gated; not this chunk's concern).

## tsc: pre-existing script errors only (dt9-allophone-probe, dump-track, oracle/symbolic,
## render-phrase — .ts-extension/null/predicate issues). I edited ONLY YAML; probe runs clean via tsx.

## DONE — final evidence (2026-05-29)
- npx vitest run: 126 files / 1119 tests PASSED, ZERO failures (== baseline 1119). The dectalk-e2e
  oracle assertions are structural (well-formedness/ranges) and stayed green despite the timing shifts;
  audit-dictionary "segment duration floors: 0 violations / 19352 segments".
- git status: ONLY my 3 YAML files modified + scripts/dt11-duration-probe.ts new. ZERO test/ or
  oracle/ or golden snapshot files changed -> no baseline regeneration required (timing shifts within
  structural ranges; no EXACT snapshot/oracle drift).
- qlatt-english: untouched (no edits to its tree; it declares no syllable annotation so syllable-keyed
  rules are dectalk-only).
- tsc --noEmit: only PRE-EXISTING unrelated script errors (dt9-allophone-probe, dump-track,
  oracle/symbolic, render-phrase). My edits are YAML-only.
- lf-source golden: not touched.

## Files changed
public/rules/frontends/dectalk-english/{frontend.yaml, phases/duration.yaml, pipeline.yaml}
scripts/dt11-duration-probe.ts (new)
