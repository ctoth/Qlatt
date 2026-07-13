# Chunk dt-5: DECtalk postvocalic-R allophony + vowel+R fusion (coder)

Datestamp: 2026-05-29. Branch dt-dt-parity. Baseline `npx vitest run` = 1107/1107 GREEN (confirmed before changes).

## Source branching (ph_aloph.c, read directly)

### A5 — prevocalic R->RR (L636-648, in `switch(curr_inph) case GRP_R`)
- Trigger: `next phone FSYLL+` AND `(sentstruc[n] & FWBNEXT) IS_MINUS` (no word boundary to right).
- Rewrite: `curr_outph = GRP_RR`. NO stress/word-initial gate. Just "R before a syllabic, not across a word boundary".
- Runs BEFORE the postvocalic block.

### A11/A12/A13 — postvocalic block (L821-873, "Rule 2")
Gate (L823-824): `(curr FSTRESS|FWINITC) IS_MINUS` AND `n>0` AND `prev phone FVOWEL+`.
Inside the gate:
- **A11 (L827-828):** `curr_inph == USP_LL` -> `curr_outph = USP_LX`.
- **A12 (L832-834):** `curr_inph == USP_R` -> `curr_outph = USP_RX` (FIRST, unconditionally inside the R branch).
- **A13 (L835-872):** STILL inside `if (curr_inph == USP_R)`, checks `symlas = prev phoneme`:
  - AX->RR, IY/IH->IR, EY/EH/AE->ER, AA/AH->AR, OW/AO->OR, UW/UH->UR.
  - On match: rewrite PRIOR output token to fused vowel + `dodelete=TRUE` (delete current R).
- **KEY:** A12 and A13 are NOT mutually exclusive — A12 sets RX, then A13 overrides by deleting the R when prev vowel is in the fusion map. RX only SURVIVES when prev vowel is NOT in the map. The map covers AX,IY,IH,EY,EH,AE,AA,AH,OW,AO,UW,UH = essentially all vowels. So RX is dead for real vowels -> per mission, DO NOT ADD RX.

### A5 vs A13 interaction
A5 sets curr_outph=RR (output). A13 reads curr_inph==USP_R (INPUT, still R) and deletes it. So when both could match (R between two vowels, e.g. "story" OW R IY), fusion wins (prev vowel fuses, R deleted), A5's RR discarded. A5 only survives when postvocalic gate FAILS (R not preceded by vowel, or stressed/word-initial) — e.g. word-initial R before syllabic ("real" R IY L). They are COMPLEMENTARY.

## Runtime transcription observations (dectalk-english, postlexical runs PRE-structural)
NOTE: probe renders show POST-structural stream (K K_REL...). At postlexical-rule time stops are NOT yet split, so prev-vowel is directly adjacent to R.
- car  -> K AA/0 R   (G2P; AA stress 0!)
- card -> K AA/1 R D
- start-> S T AA/1 R T
- cure -> K Y UW/0 R
- here -> HH IY/1 ER/0   (NO R token! already ER from dict/g2p)
- for  -> F ER/0          (NO R token! already ER)
- bird -> B ER/1 D        (already ER)
- red  -> R EH/1 D        (word-initial R, prev=null -> postvocalic gate fails, protected)
- real -> R IY/1 L        (word-initial R, A5 candidate: next IY syllabic, no wbound -> RR)
- fear -> F IY/1 R        (postvocalic: IY+R -> IR, fuse+delete)
- story-> S T OW/1 R IY/0 (R between OW and IY: A13 fuses OW+R->OR, R deleted)
- bottle-> B AO/1 T EL    (no LL symbol; port has L/EL only)

## Decisions
- **A11 SKIPPED**: port has no LL input symbol (laterals are L/EL). LX not added (dead). Confirmed via render of "feel"/"bottle" -> L/EL.
- **A12/RX SKIPPED**: RX dead (see above) — fusion consumes all postvocalic R for real vowels.
- **here/for/bird already ER** from transcription, not via this rule — mission's "here->H IR" is a transcription-layer difference; my rule cannot fire (no R token). Will document; out of scope for postlexical rewrite.
- Stress: fused vowel name = base + (prev.stress==1 ? '1':'0'). RR is single symbol (schwa-rhotic, AX->RR always unstressed-ish), no stress variant.
- Inventory: add RR only. Fusion vowels IR/ER/AR/OR/UR already exist as X1/X0.

## Stress digit format: phoneme is digit-STRIPPED, stress lives in `.stress` (0/1). Fused target names DO carry digit (AR1/AR0).

## Plan
1. Add RR inventory target (sourced from us_maltar/us_inhdr US_RR) to dectalk-english + check qlatt-english.
2. postlexical.yaml: `dectalk_fuse_vowel_r` (A13) selecting R, gate prev=vowel & current unstressed/non-word-initial, define fused name via CEL map table, splice replace_range [prev.sync_left, current.sync_right] -> one token copy_from prev with fused target.
3. postlexical.yaml: `dectalk_prevocalic_r_rr` (A5) selecting R, next syllabic & no wbound -> RR. Order AFTER fusion (fusion is more specific; if fusion fired R is gone).
4. pipeline.yaml postlexical order: add fusion + A5. They don't touch /t,d/ so no conflict with flap/glottalize/palatalize.
5. Probe scripts/dt5-rhotic-probe.ts.

## RR target values (probe_rr.py against us_maltar/us_mindur, AUTHORITATIVE)
RR diphthong F1 450->390, F2 1320, F3 1540, B 90/110/250, AV 65, inherent 180, min 90.
Encoded as steady (F1 390/F2 1320/F3 1540) matching existing fusion-vowel format. (probe also
confirmed RX/LX have distinct targets but they're dead per analysis -> not added.)

## IMPLEMENTED
- inventory.yaml: added RR (type vowel, rhotic) + citation line. qlatt-english NOT touched (no RR there, no fusion rule there; mission forbids).
- postlexical.yaml: added dectalk_fuse_vowel_r (A13) + dectalk_prevocalic_r_rr (A5).
  - Fusion: select R; gate current_unstressed + r_not_word_initial + prev vowel + prev in fusion map.
    Fused name = base + (prev.stress==1?'1':'0'); RR has no digit. splice [p.sync_left, current.sync_right] -> 1 token copy_from p with target acoustics. Carries trajectory if target has one.
  - A5: select R; next syllabic & NOT word boundary -> RR. splice single token.
- NEXT: add both to pipeline.yaml postlexical order (fusion BEFORE A5 so fusion wins for intervocalic R). Then probe + vitest.

## DONE / VERIFIED (2026-05-29)
- pipeline.yaml: postlexical order appended dectalk_fuse_vowel_r then dectalk_prevocalic_r_rr (after /t,d/ rules; rhotic rules don't touch /t,d/ so no conflict; fusion BEFORE A5 so fusion wins for intervocalic R).
- Probe scripts/dt5-rhotic-probe.ts (extended the recon stub) -> ALL EXPECTATIONS MET:
  car->K AR0, card->K AR1 D, start->S T AR1 T, cure->K Y UR0, fear->F IR1,
  store->S T OR1, story->S T OR1 IY (fusion beats A5, no bare RR),
  real->RR IY L (A5 word-initial prevocalic R), red->RR EH D (word-initial R does NOT fuse, EH intact),
  bird->ER unchanged, for->ER unchanged.
- Stress correct: stressed AA->AR1, unstressed AA->AR0; derived via prev.stress digit, not hardcoded branch.
- `npx vitest run` = 1107/1107 GREEN. NO snapshot changed -> no dectalk baseline regen needed (no existing snapshot renders a vowel+R word through dectalk-english).
- Golden: exit 1 = PRE-EXISTING lf-source failure (rmsError 0.325 block). run-golden.ts tests DSP WASM primitives only, never reads frontend YAML -> independent of this change. resonator/antiresonator pass (tiny error). qlatt-english + lf-source UNTOUCHED (git diff = 3 dectalk files only).

## Mission-vs-reality notes
- here->H IR / for / bird: the port's dict/G2P ALREADY emits ER (no separate R token), so the fusion rule has no R to fire on -- the rhotic nucleus exists at the transcription layer, not the postlexical layer. This is a transcription difference, not a postlexical-rule miss. The faithful DECtalk fusion IS implemented; it fires wherever the transcription emits a real vowel+R (car/card/start/cure/fear/store/story).
- A11 (LL->LX) SKIPPED: port has no LL input symbol (laterals are L/EL, confirmed feel->...L, bottle->...EL). LX not added (would be dead).
- A12 (R->RX) / RX SKIPPED: A12 sets RX then A13 deletes the R for every vowel in the fusion map; RX dead for real vowels. Not added.
- RR added (single symbol, no stress variant): AX->RR is the reduced schwa-rhotic; A5 also targets RR.
