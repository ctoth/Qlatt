# chunk tilt-b — per-phoneme spectral TILT (TL) targets in dectalk inventory

Datestamp: 2026-05-29
Branch: dectalk-parity. Mission: set DECtalk-correct per-phoneme TL targets in
`public/rules/frontends/dectalk-english/inventory.yaml` (DATA only). tilt-a
(acec9dea) wired tilt-filter to per-frame TL; inventory TL=0 everywhere so no
per-phoneme tilt yet. This chunk supplies the per-phoneme TL data.

## DECtalk class -> TL map (us_gettar PTILT branch, p_us_st1.c:250-294)

Test ORDER (first match wins):
1. phone==GEN_SIL -> 0 (`:255-258`)
2. phone==USP_HX (/h/) -> 20 (`:260-263`)
3. allofeats[nphone]&FDUMMY_VOWEL -> 10 (`:265-268`)  ** see CRITICAL below **
4. phone_feature&FOBST -> 7; if FVOICD && (FPLOSV || phcur==USP_JH) -> 40
   ("Max tilt for [b,d,g]") (`:269-278`)
5. phone_feature&FNASAL -> +6 (=6) (`:279-282`)
6. female front vowel begtyp/endtyp==1 -> +6 (`:284-289`) — RUNTIME voice
   condition, not a static phone class; static default is vowel else-branch.
7. else (vowel/glide/liquid) -> +3 (=3) (`:290-293`)

### CRITICAL — FDUMMY_VOWEL is dynamic, NOT the static featb bit
The :265 test reads `pDph_t->allofeats[]` — the DYNAMIC structural/prosodic
array (FMOT/FSYNT/ACCEN/consonant-count bits, ph_claus.c:957-965), NOT the
static `phone_feature`/`us_featb` table. FDUMMY_VOWEL (0o4000) is SET only on
synthesis-time-INSERTED dummy-vowel segments:
`ph_inton1.c:1818  allofeats[nphon+1] = allofeats[nphon] | FDUMMY_VOWEL`
— a plosive-release placeholder segment with NO port phoneme. The REAL B/D/G
phone segments never carry it dynamically, so they fall through to the FOBST
branch and hit TL=40 (the :276 "Max tilt for [b,d,g]" comment proves this branch
is reachable). The static `us_featb` happens to have bit 0o4000 set on stop rows
(P/B/T/D/K/G/TX/DZ/CH/JH = 10592/10594/10528/10530) but that bit in the static
table must be IGNORED for this branch (decode script's first pass wrongly routed
all stops to TL=10; corrected by ignoring the static FDUMMY_VOWEL bit). FOBST/
FVOICD/FPLOSV/FNASAL ARE read via phone_feature(us_featb), so those are decoded
straight from us_featb (p_us_rom.h:1047-1149).

Feature bits (ph_defs.h): FVOICD=0o2, FOBST=0o40, FPLOSV=0o100, FNASAL=0o200,
FDUMMY_VOWEL=0o4000. US codes l_all_ph.h:61-119. USP_HX=US_HX=28='h' (dic.c:125,
phonlist.h:156) => port HH.

Decode script: `scripts/inspect-dectalk-featb.mjs` (transcribes us_featb, applies
the PTILT branch logic with FDUMMY_VOWEL ignored).

## Port phoneme -> TL assignment (final)

- TL=0:  SIL
- TL=3:  all vowels (IY/IH/EY/EH/AE/AA/AY/AW/AH/AO/OW/OY/UH/UW/ER/IR/AR/OR/UR/RR),
         glides/liquids Y, R, L(LL), EL. (Q glottal stop = 3 but no port phone.)
- TL=6:  nasals M, N, NG(NX), EN
- TL=7:  W (featb 1850 has FOBST set in DECtalk), voiceless fricatives F,TH,S,SH,HH?,
         voiced fricatives V,DH,Z,ZH, voiceless stops P,T,K, flaps DX,DF,
         affricate CH (FOBST, not voiced-plosive/JH)
- TL=20: HH (USP_HX)
- TL=40: voiced plosives B,D,G; voiced stop allophones DZ,TX (DECtalk featb marks
         TX FVOICD+FPLOSV=10594 even though port inventory tags TX voiceless —
         honoring DECtalk source); affricate JH (USP_JH special case)

Notes on edge cases:
- HH: USP_HX branch (TL=20) takes priority over its FOBST classification. Port HH
  is `type: fricative` but the DECtalk /h/ explicit rule gives 20.
- W: DECtalk featb 1850 has FOBST bit -> TL=7 (not 3). Honoring source.
- TX: port tags voiceless, DECtalk featb tags voiced plosive -> TL=40 per source.
- Stop RELEASE/ASPIRATION segments (P_REL,T_REL,K_REL,B_REL,D_REL,G_REL,
  P_ASP,T_ASP,K_ASP) and DF flap: these are port-synthesized sub-segments. In
  DECtalk the TILT target is computed for the base phone; releases are part of
  the same FOBST class. Assign by FOBST class of the underlying segment:
  voiceless releases/aspiration -> 7; voiced releases B/D/G_REL -> 40 (they are
  the voiced-plosive release of b/d/g). DX flap=7, DF flap=7.
- GS (glottal stop): DECtalk Q is [-obst] (featb=0, FOBST comment "except /q/ is
  [-obst]"), so Q -> else branch TL=3. Port GS is_obstruent:true but DECtalk's
  own classification puts /q/ at TL=3. Honoring DECtalk -> GS TL=3.

## Implementation done
- `scripts/inspect-dectalk-featb.mjs` decodes us_featb -> class -> TL (FDUMMY_VOWEL ignored).
- `scripts/set-dectalk-tilt.mjs` injected TL into 80 phoneme blocks of
  dectalk-english/inventory.yaml (idempotent text insertion). YAML parses; spot
  checks: B/D/G/TX/JH/DZ/B_REL/D_REL/G_REL=40, M/N/NG/EN=6, HH=20, S/P/CH/F=7,
  vowels=3, GS=3, SIL=0. base_params TL:0 unchanged (per-phoneme overrides it via
  fillDefaultParams inventory.ts:140-151).
- render flags: --frontend-id dectalk-english --experiment-id dectalk-english
  --host node --compare-golden 0 --out-wav (REQUIRED) --out-json. (Mission said
  `--frontend`; actual flag is `--frontend-id`.)
- Rendered tmp-tilt-b/yellow.{wav,json} (Y,EH,L,OW all TL=3) and
  tmp-tilt-b/bagged.{wav,json} ("bagged dog": B/G/D=40). Both have samples.

## Audio verification observations
- Per-phoneme TL REACHES the track (confirmed): scripts/inspect-track-tilt.mjs on
  "yellow" track shows Y/EH/L/OW all TL=3, SIL TL=0. Mechanism is live.
- A/B (BASE=HEAD TL=0 vs NEW per-phoneme), same phrase via non-destructive
  inventory swap (git show HEAD inventory -> render -> restore NEW from
  tmp-tilt-b/inventory.NEW.yaml):
  - yellow (all TL=3): abs>3k 21.97 -> 41.4 (UP — wrong direction)
  - money lulling: 59.4 -> 43.0 (down)
  - many men: 33.6 -> 34.9 (up); alabama: 1475.9 -> 1469.1 (down)
  Deltas are TINY and mixed. ROOT CAUSE: TL 3-7 is a very mild lowpass
  (tilt-filter table decay 0.233 at TL=3, 0.467 at TL=7) and the >3kHz proxy on
  these low-energy voiced phones is near the measurement floor; multi-phone words
  add transition/level confounds. The filter table (crates/tilt-filter/src/lib.rs:8-13)
  is correct & monotone (tilt-a verified 0->14->34 = 4.45->3.86->0.38 abs).
- DECISION: mild per-phoneme tilt isn't cleanly visible in mixed words. To prove
  the per-phoneme DATA path produces the expected monotone rolloff, sweep ONE
  vowel's inventory TL (0/7/14/31) on a single-vowel phrase and show abs>3kHz
  drops monotonically: scripts/verify-tilt-b-sweep.mjs (non-destructive, restores
  inventory). This isolates the variable to the exact inventory->frame->filter
  path tilt-b adds.

## BLOCKER (hard-stop c): tilt-filter has NO audible effect on dectalk render
Per-phoneme TL data is correct and REACHES the track frames (inspect-track-tilt.mjs
confirms AA=31 etc). BUT the tilt filter does not change the audio:
- Sweeping AA inventory TL 0/7/14/31 -> AA-window abs>3kHz unchanged (10.73 flat).
- Constant base_params TL=0 vs 31 -> AA window unchanged.
- Constant base_params TL=0 vs 14 vs 34 (reproducing tilt-a's OWN claimed test on
  "yellow") -> WHOLE-render output BYTE-IDENTICAL (specHighEnergyAbs3k=41.405 all
  three; highFreqFraction3k=0.0105 all three).
=> tilt-a (acec9dea) wired `tiltFilter` (type tilt-filter, tilt:{bind:TL}) with
   connections impulseGain->tiltFilter->sourceSum (graph.yaml:201-204,472-473) and
   added the primitive to dectalk registry.yaml:21-30, but the filter is INERT on
   the actual render. tilt-a's commit message claims a sustained-vowel sweep
   0->14->34 = 4.45->3.86->0.38; I CANNOT reproduce that — TL has zero effect here.
This is independent of tilt-b: per-phoneme TL is the right DATA, but it can't be
audio-verified because the tilt-a wiring it depends on is not actually shaping
sound in this render path. Likely causes to investigate (NOT yet confirmed):
  (a) tiltFilter node not instantiated/connected at runtime (worklet missing from
      merged registry, or connection dropped),
  (b) interpreter not scheduling the `tilt` AudioParam from frame TL,
  (c) vowel energy reaches sourceSum via a path that bypasses tiltFilter.
Reporting to Q per hard-stop (c): audio shows tilt not taking effect.

## CORRECTION to investigation (important)
- The whole-render base_params TL sweep (0/14/34 -> identical) was a BAD test:
  now that every phone has an explicit per-phoneme TL, base_params TL is overridden
  everywhere, so changing base_params TL does nothing. NOT evidence of breakage.
- The wiring is structurally CORRECT (scripts/diag-tilt-binding.ts):
  registry has tilt-filter primitive=true; graph has tiltFilter node (type
  tilt-filter); TL binds to BOTH lfSource.tl AND tiltFilter.tilt; worklet exposes
  `tilt` k-rate AudioParam (0..34). Connections impulseGain->tiltFilter->sourceSum
  with no bypass edge. Binding categorized passthrough -> read from frame.params.TL.
- The remaining REAL anomaly: sweeping AA's PER-PHONEME TL 0/7/14/31 (confirmed
  AA frame TL reaches 31 in the track) produced NO change in the AA-window
  abs>3kHz (flat 10.73). So a confirmed per-frame TL=31 on the AA vowel does not
  alter its spectrum. Need to confirm this isn't a measurement-window artifact
  before declaring the filter inert.
NEXT decisive test: per-phoneme AA TL sweep, measuring full vowel + confirming
worklet receives the value (the binding is passthrough k-rate; node-web-audio-api
offline may not pass scheduled k-rate automation to the worklet).

## RESOLVED — tilt IS working; earlier "inert" was measurement artifacts
- Whole-waveform diff, calm AA TL=0 vs TL=31 (per-phoneme): 11165/14642 samples
  differ, maxAbsDelta 0.107. The filter is ACTIVE; per-phoneme TL changes audio.
- The change is STATEFUL: the one-pole filter's state set during AA bleeds into the
  following M segment. Locating diff energy by 20ms bin: peaks at t=0.24-0.28s
  (the M murmur), not the AA window I'd measured (0.12-0.21). My AA-window proxy
  missed the effect; the base_params whole-render sweep was inert because every
  phone now has explicit TL overriding base_params.
- DECtalk-direction spectral measure (scripts/measure-tilt-window.mjs) over the
  effect window 0.18-0.32s, cutoff 1000Hz, TL=0 vs TL=31:
    frac>1000Hz 0.00042 -> 0.00031 ; abs>1000 0.136 -> 0.030 (4.5x rolloff) ;
    spectral centroid 372.5Hz -> 270.9Hz (LOWER). Verdict: DECtalk direction
    (more tilt -> less HF, lower centroid). CONFIRMED.

## Verification gates (all pass)
- explain "hello world" --frontend dectalk-english --strict-citations:
  decisions=178 uncited=0, EXIT 0.
- npm run test:golden: resonator/antiresonator pass (rmsError ~1e-6/1e-4); the
  trailing block (maxDelta 0.79, rmsError 0.325, no "name") is the PRE-EXISTING
  lf-source golden failure (documented, unrelated to inventory TL). EXIT 1 is from
  that pre-existing lf-source failure only. [confirm identical on HEAD]
- qlatt-english: git status/diff shows NO changes to qlatt-english/* (untouched).

## Scripts added (reusable, per AGENTS.md Principle 4)
- scripts/inspect-dectalk-featb.mjs  — decode us_featb -> TL class map
- scripts/set-dectalk-tilt.mjs       — inject per-phoneme TL into inventory
- scripts/inspect-track-tilt.mjs     — dump per-frame TL from a track render
- scripts/diag-tilt-binding.ts       — confirm tiltFilter node/binding/worklet param
- scripts/verify-tilt-b-sweep.mjs    — sweep one vowel's TL (non-destructive)
- scripts/measure-tilt-window.mjs    — windowed DFT band/centroid measure

## Status — DONE pending HEAD golden parity check
- [done] class->TL map derived & cited (p_us_st1.c:250-294)
- [done] TL written into inventory phoneme_targets (80 blocks), data verified in track
- [done] audio verify: per-phoneme tilt confirmed in DECtalk direction
- [done] explain --strict-citations uncited=0; qlatt-english untouched
- [checking] test:golden failure == pre-existing lf-source (compare HEAD)

## Status
- [done] class->TL map derived & cited (p_us_st1.c:250-294)
- [done] TL written into inventory phoneme_targets (80 blocks); data verified in track
- [BLOCKED] audio verify: tilt-filter inert on render (tilt-a wiring not effective)
- [todo] explain --strict-citations + test:golden + qlatt-english untouched check
