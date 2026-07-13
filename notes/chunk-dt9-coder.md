# Chunk dt-9: Final minor DECtalk allophone rewrites (A1, A4, A19)

Datestamp: 2026-05-29. Coder. Branch `dectalk-parity`. Pure-declarative YAML.
Mission: implement A1 geminate-obstruent deletion, A4 s/z->sh/zh before SH,
A19 syllabic-n after a glottalized /t/ (TX). No imperative TS.

## Triggers read from source (ph_aloph.c, US branch)

### A1 geminate obstruent deletion — L558-562
```c
if (phonemes[n] == phonemes[n+1]
    && (phone_feature(phonemes[n]) & FOBST))
    dodelete = TRUE;
```
- Delete CURRENT token if its phoneme equals the NEXT phoneme AND current is an
  obstruent (FOBST). Compares raw input phonemes. `dodelete` suppresses current.
- Runs VERY EARLY — before the FBLOCK skip (L563) and before all other rules.
  => first rule in the postlexical phase.
- FOBST membership: obstruents = stops + fricatives + affricates. In this port's
  `type`: type in ['stop_closure','stop_release','stop_aspiration','fricative',
  'affricate']. At the postlexical phase the stop is still a single /t,d/-style
  token (structural split happens later), and the base inventory `type` for raw
  stops is the stop token; but to be safe and source-faithful I gate on FOBST via
  a phoneme membership set of the DECtalk obstruent symbols actually emitted at
  this stage (P B T D K G F V S Z TH DH SH ZH CH JH HH) plus type fallback.

### A4 s/z -> sh/zh before SH — L715-722
```c
if (phonemes[n+1] == USP_SH) {
    if (curr_inph == USP_S)  curr_outph = USP_SH;
    if (curr_inph == USP_Z)  curr_outph = USP_ZH;
}
```
- No stress / boundary / position gate. Pure: next phoneme == SH.
- S->SH, Z->ZH. SH and ZH both already in inventory (recon 3.1).
- Mechanism: rewrite current to the SH/ZH target. Like the other rewrites, a
  bare `op:set phoneme` does not re-materialize fricative params, so use the
  splice+target() form (same as dt-3/4/5 rules).

### A19 syllabic-n after TX — L1042-1051
```c
if (allophons[nallotot-1] == USP_TX) {              // prev OUTPUT is TX
    if (phone_feature(phonemes[n+1]) & FNASAL        // next is a nasal
        && (curr_instruc & FSTRESS) IS_MINUS         // current unstressed
        && phonemes[n] != USP_UW) {                  // current is not UW
        phonemes[n+1] = USP_EN;                      // next -> EN (syllabic)
        dodelete = TRUE;                             // delete current (the vowel)
    }
}
```
- Prev OUTPUT token == TX (the glottalized /t/ produced by glottalization A16),
  current is an unstressed vowel (not UW), next is a nasal -> next becomes EN and
  the current vowel is deleted. The vowel+nasal collapse into a syllabic EN.
- "certain" K ER T AX N: after glottalization T->TX, then AX (unstressed,!=UW)
  with next N nasal => N->EN, AX deleted => K ER TX EN.
- FNASAL membership (ph_defs.h, per existing glottalize rule citation): nasals
  M N NG. Use n.type == 'nasal' OR n.phoneme in [M,N,NG].
- Runs AFTER glottalization (reads TX output) and after flapping — placed late in
  the phase, right before dental_dh (which is last because it also reads
  last_outph). A19 reads prev OUTPUT == TX, so it must run after glottalize_t.

## Precedence (pipeline.yaml postlexical order)
Source order in ph_aloph.c per /t,d/ token:
- A1 geminate: L558 (earliest, before FBLOCK) => FIRST in phase.
- A4 s/z->sh/zh: L715 (after the GRP_R block ~L636, after FBLOCK skip) => after
  the /t,d/ palatalize/glottalize? No — A4 operates on S/Z, a different segment
  class than the /t,d/ rules, so no conflict. Placed after the /t,d/ rewrite
  rules and the /R/ rules, but BEFORE A19/dental which read last_outph. Source
  position L715 is between R-block (636) and glottalization (912). Since A4 keys
  on S/Z it cannot interfere with /t,d/ or /R/; I place it after geminate (A1)
  and before the /t,d/ rules to mirror its early source position. Order within
  non-conflicting classes is cosmetic, but I follow source order: A1, A4, then
  the existing /t,d/ + /R/ rules, then A19, then dental_dh.
- A19 syllabic-n: L1042 — after glottalization (912) and flapping (958), before
  dental Rule 4 (1066). => placed after flap_d, before dental_dh.

Final order: dectalk_geminate_delete, dectalk_s_z_assimilate_sh,
  [existing /t,d/ + /R/ rules], dectalk_syllabic_n_after_tx, dectalk_dental_dh.

## State
- Branch verified dectalk-parity. Triggers confirmed from source (above).
- Existing rules USE `kind: postlexical` and work (committed) — recon 0's "no
  postlexical kind" claim is stale; I follow the committed working pattern.
- NEXT: write 3 rules, update pipeline order, write probe, run vitest.

## OBSERVED during impl (2026-05-29)
- Engine `delete: true` on a base-stream (phone) token leaves a TIME GAP and trips
  `E_BASE_NOT_CONTIGUOUS` (engine.ts:3070). So A1 CANNOT be a bare `delete`.
  Rewrote A1 as `splice: replace_range` over [current,next] re-inserting one copy
  of the SECOND (surviving) obstruent spanning both spans (duration = sum). Same
  delete-via-replace mechanism as fusion / syllabic-n. (delete:true works only for
  derived/non-base streams, evidently.)
- "bus stop now" g2p: bus -> ...AH Z (ends in Z not S), stop -> S T... so NO S#S
  geminate there. Need real identical-obstruent joins; will confirm from probe.
- All three rules: kind: postlexical, splice+target() pattern. A19 splices
  [vowel,nasal]->EN; A4 splices S/Z->SH/ZH; A1 splices [c,c]->single c.

## RESULTS (2026-05-29)
- Probe scripts/dt9-allophone-probe.ts: ALL 13 EXPECTATIONS MET.
  - A1 geminate: "less so"->L EH S OW (S#S reduced), "bus stop"/"this sport" clean,
    "a red box" untouched. (delete expressed as splice replace_range, contiguity ok)
  - A4: "this ship"->SH SH, "those shoes"->ZH SH, "this song" stays S.
  - A19: "certain"->S ER TX EN, "kitten"->K IH TX EN, "rotten"->RR AA TX EN;
    "mountain"/"fountain" dict=T AH N (full vowel, NOT glottalizing) so NO TX/EN -
    correct non-fire (my first probe expectation was wrong, fixed).
- vitest: 1107 passed / 125 files. EXACT baseline, zero new failures, NO snapshot
  changes (no dectalk baseline regen needed).
- git status: only dectalk-english postlexical.yaml + pipeline.yaml modified;
  qlatt-english UNTOUCHED. New: notes + probe.
- golden: exit 1. run-golden runs 3 scripts: klatt-tract, lf-source, render-phrase.
  NEXT: isolate which fails — must confirm ONLY lf-source (pre-existing), NOT
  render-phrase (frontend, which my change touches).

## GOLDEN (isolated, 2026-05-29)
- lf-source-wasm-compare.ts: exit 1  <- the documented PRE-EXISTING failure.
- render-phrase.ts (runs the frontend my rules touch): exit 0  PASS.
- klatt-tract-wasm-compare.ts: exit 0  PASS.
=> golden exit-1 is ONLY lf-source; my change adds no new golden failure.

## FINAL ORDER (pipeline.yaml postlexical)
geminate_delete, assimilate_sibilant_sh, palatalize_t, palatalize_d,
glottalize_t, flap_t, flap_d, fuse_vowel_r, prevocalic_r_rr,
syllabic_n_after_tx, dental_dh.
(dental_dh moved to LAST, after the /R/ rules and syllabic_n; behavior-neutral
since /R/ rules produce rhotic vowels and syllabic_n produces EN -- none are
T/TX/D, which is dental_dh's prev trigger. Matches source order L1042 then L1066.)

## SKIPPED / NOT PORTED (with reason, all dead in this build)
- #ifdef GERMAN_out S/TS block (L705-712): compiled out.
- #ifdef talk schwa->IX block (L730-736): compiled out.
- #ifdef HLSYN r->DX block (L1052-1063): compiled out.
- temp-out "last_outph==N -> N" branch in dental rule (L1077-1081): commented out.
- A1 FBLOCK skip (L563-567): no FBLOCK tag in this port; not applicable.

## DONE
All three rules declarative (YAML/CEL splice+target / replace_range), cited with
ph_aloph.c line refs; pipeline order + precedence documented; probe 13/13;
vitest 1107 (baseline, no snapshot regen); golden only-lf-source; qlatt-english
untouched. No imperative TS. No hard-stops hit.

## Open / to verify during impl
- A1: does the postlexical phase ever see two identical adjacent obstruent tokens
  from the dectalk g2p? Probe with "big game" (g#g), "this sport"? Actually
  geminate needs SAME phoneme adjacent: e.g. "bus stop" S#S, "big game" no.
  Will test "this song" (no), "less so" S S, "bookkeeper" K K.
