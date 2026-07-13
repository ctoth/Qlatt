# The Actual Goal: Engine Separation → Fidelity, then Beauty

Status: goal charter, 2026-06-11. Found by asking "what is divergence FROM,
and what does beautiful mean" instead of assuming divergence = DECtalk.
Companion to notes/agent-audition-territory.md (the measurement-tooling charter).

## The reframe

"Drive divergence down and get it beautiful" is NOT one instruction. It is two
missions with opposite success criteria, and conflating them is why the work
felt muddy.

### Mission 1 — Fidelity engines (klatt80, klsyn88, dectalk)

Each must authentically BE its reference, warts and all. Beauty is explicitly
not the goal; faithfulness is. Each engine is measured against its own oracle:

| Engine | Faithful to | Reference oracle | Oracle status today |
|---|---|---|---|
| klatt80 | Klatt 1980 (PARCOE/COEWAV) | `~/src/klatt80` FORTRAN; `~/src/klatt-syn` (chdh TS); `test/golden/klatt_paper.json` | reference impls NOT wired; golden exists |
| klsyn88 | Klatt & Klatt 1990 / klsyn88 | `~/src/klsyn` (Nim); `test/golden/klatt_syn_frame.json` | reference impl NOT wired; golden exists |
| dectalk | DECtalk 4.6.3 "Paul" | `say.exe` renders, checked in under `test/oracle-output/dectalk-us-v1/` | built out; all 10 phrases FAIL |

"Divergence down" for these = conformance to the engine's own reference,
measured in Praat feature space (the new `measure` sidecar) + the existing
oracle waveform/STOI metrics.

### Mission 2 — Our experimental synth (the ONLY place "beautiful" lives)

Beauty = all axes at once, Q's ranking: intelligibility/crispness first, then
prosody, then voice quality. No external oracle. Judged by: the acoustic
literature (formant ellipses, duration tables — charter layer 4), ASR
round-trip / minimal-pair intelligibility (charter layer 5), and Q's ear spent
sparingly on prepared experiments.

Built ON TOP of the fidelity engines' trustworthy DSP. This is why fidelity
comes first: you cannot tune beauty on a foundation you cannot trust. The
experimental engine doesn't exist yet.

## Current separation state (scout, 2026-06-11)

Mostly clean, which is the good news:
- Backends (public/experiments/): klatt80-baseline, klsyn88, dectalk-english,
  stevens91, test-inherit(stub). Each has independent graph.yaml + semantics.yaml.
  No shared DSP topology.
- Frontends (public/rules/frontends/): qlatt-english, dectalk-english.
  Authentically separate — own inventory.yaml, lts-rules, dictionary
  (dectalk: 13,272 custom entries), phases, speakers (dectalk: 5 voices).
- Selection: frontendId × experimentId independent, no hardcoded pairing.
  Default frontend qlatt-english; backend chosen by caller.
- Pipeline shape is clean: frontend (linguistic) → backend-agnostic Klatt
  track → backend (DSP). Correct separation of concerns.

### The one real contamination (fidelity blocker)

`src/builtin-functions.ts:15-16`:
```
const KLATT_AMPS_YAML_PATH = "/experiments/klatt80-baseline/semantics.yaml";
```
Amplitude tables (ndbCor, ndbScale, klsynAmpTable) load from klatt80-baseline
at module-load, used globally regardless of selected backend. So **klsyn88 and
dectalk synthesize with klatt80's amplitude scaling, not their own.** A backend
cannot "be itself" while borrowing another's amplitude tables.

LIKELY CONNECTS TO A HEARD DEFECT: memory project_klsyn88_quiet_observation
(2026-05-24, Q's ear): "klsyn88 sounds quiet... may relate to chunk 5 (Klatt
amplitude table consolidation)." Hypothesis: the quiet IS klsyn88 wearing
klatt80's amplitude clothes. Now mechanically checkable — `measure` reports
intensity in dB; compare klsyn88 render before/after table separation.

### Non-issues (scout-cleared)
- g2p/index.ts, text-normalize.ts, accent/break/tune-policy: hardcode
  qlatt-english paths only as STANDALONE defaults; real pipeline overrides via
  loadFrontendResources(). Acceptable.
- engine.ts `resolution === "klatt"`: linguistic feature class, not backend selector.
- cel-expressions `dectalk_obstruent_profile`: properly frontend-scoped builtin.

### Naming smell (note, not bug)
`dectalk-english` names BOTH a backend (public/experiments/) and a frontend
(public/rules/frontends/). The "dectalk engine" = that backend + that frontend.
Worth disambiguating later so "dectalk" the engine is unambiguous.

## Proposed attack order (recommendation, pending Q)

The move that converts the goal from aspiration to a number, and ties to a
heard defect:

1. **Separate amplitude tables per backend.** Make `builtin-functions` load amp
   tables from the ACTIVE backend's semantics, not a hardcoded klatt80 path.
   klsyn88 and dectalk get their own (or explicitly inherit, declared not
   accidental). Verify with `measure` that klsyn88 intensity changes and the
   "quiet" defect moves. This unblocks every engine being itself.
2. **Stand up a klatt80 conformance harness.** Wire `~/src/klatt-syn` (or the
   FORTRAN) as klatt80's oracle the way say.exe is dectalk's. Make "klatt80 is
   real Klatt 1980" a passing/failing feature-space number. klatt80 first
   because everything descends from Klatt 1980.
3. **klsyn88 conformance harness** against `~/src/klsyn` (Nim).
4. **Re-attribute the dectalk scorecard.** With backends provably separate,
   each failing dectalk phrase becomes attributable to frontend vs backend vs
   (now-eliminated) contamination.
5. **Only then** scaffold the experimental beauty synth on the trusted stack.

### Q decisions (2026-06-11)
- **Greenlit: amp-table separation as chunk 1.** Runs through the gauntlet + zoo
  (shared load-bearing code, chunk-2 regression scar). Coder ≠ verifier model.
- **Experimental synth = a fork of klsyn88, once klsyn88 is healthy.** Therefore
  klsyn88 is doubly load-bearing: a fidelity engine AND the foundation of the
  future beauty synth. Fixing its quiet (amp tables) is the linchpin.

### Pre-registration baseline (chunk 1, measured 2026-06-11, "she sees a dog")
- klatt80-baseline: mean intensity 23.7 dB, **peak 83.0 dB**.
- klsyn88:          mean intensity  3.5 dB, **peak 68.7 dB**.
- klsyn88 peak is **14 dB under** klatt80 — confirms the heard "klsyn88 quiet"
  defect as a number. FALSIFIABLE CLAIM: after klsyn88 uses its OWN amplitude
  tables (not klatt80's via builtin-functions.ts), the peak gap should close.
  Re-measure klsyn88 peak post-fix; that is the chunk's acceptance test.

### HYPOTHESIS FALSIFIED (2026-06-11, by the klsyn88 oracle — chunk-klsyn88-oracle)
The klsyn88 reference oracle (Dennis Klatt's C synth, built standalone) rendered
"she sees a dog" from Qlatt's OWN klsyn88 control frames. Verified independently
(raw RMS dBFS + raw peak + Praat peak, all agree):
- Qlatt klsyn88:      RMS -30.20 dBFS, peak -18.02 dBFS, Praat-peak 68.7 dB.
- Reference klsyn88:  RMS -28.41 dBFS, peak -16.49 dBFS, Praat-peak 70.0 dB.
Gap = ~1.5–1.8 dB. Qlatt's klsyn88 is FAITHFUL to real klsyn88's level. The 14 dB
"quiet" vs klatt80 is NOT a Qlatt bug — real klsyn88 is just quieter than klatt80.
(The 50 dB Praat intensity-MEAN gap was a silence-averaging artifact; raw RMS is
the honest proxy.) CONSEQUENCES:
- Amp-table separation = pure architectural cleanup, NOT a loudness fix.
- Making klsyn88 louder would BREAK fidelity. The quiet is correct for klsyn88.
- Loudness normalization is a BEAUTY concern → belongs in the experimental synth
  (forks from klsyn88), not the fidelity engine.
- Open: is Qlatt's klatt80 the faithful one or the loud outlier? Needs a klatt80
  oracle to know which side of the 14 dB is "right." Also: Qlatt klsyn88 uses an
  LF source where real klsyn88 uses KLGLOTT88 (ss=2) — level matches anyway, but
  timbre fidelity is a separate open question.

### klatt80 oracle — IN PROGRESS (Q chose this next, 2026-06-11)
Resolves "is Qlatt's klatt80 faithful, or the LOUD outlier of the 14 dB?" We know:
Qlatt klatt80 peak ~83 dB; Qlatt klsyn88 ~68.7 = faithful to real klsyn88 (~70).
If real klatt80 ≈ 83 → Qlatt klatt80 faithful (klatt80 is just louder than klsyn88
by nature). If real klatt80 ≈ 70 → Qlatt klatt80 is too loud (~13 dB bug).
ORACLE CHOICE: FORTRAN handsy (~/src/klatt80, handsy.exe prebuilt, gfortran 15.2)
over chdh klatt-syn TS — because (a) conventions match Qlatt's klatt80-baseline
(both native Klatt 1980; chdh re-normalizes amplitudes = convention risk for a
LOUDNESS test), (b) Qlatt klatt80 frames carry the Klatt-1980 39-param set nearly
1:1 (FGP/BGP/FGZ/BGZ/BGS/NFC/SW/AVS/AN/A1-6/AB all present). chdh = easy but
convention-risky; handsy = authoritative. Same logic that made klsyn88 av match.
NOTE: Qlatt klatt80-baseline frames ALSO carry LF params (Rd/lfMode) — the FRONTEND
emits one track; the BACKEND graph interprets it. klatt80 vs klsyn88 get identical
frames; the 14 dB is purely backend-graph/semantics, not frames.

### klatt80 VERDICT (2026-06-12, verified independently): FAITHFUL, not loud outlier
Fed Qlatt's klatt80 frames to the real FORTRAN klatt80 (handsy). Verified:
- Qlatt klatt80:      raw peak -1.93 dBFS, clip 0.00%, Praat-peak 83.0 dB.
- Reference klatt80:  raw peak  0.00 dBFS, clip 7.16% (HARD-CLIPS), Praat-peak 88.9 dB,
  handsy self-reports +6.4 dB over full-scale pre-clip.
Direction unambiguous (clipping + SR 10k-vs-22050 blur the exact dB): the REAL
klatt80 is LOUDER than Qlatt's — wants to clip; Qlatt sits 2 dB under. So Qlatt's
klatt80 is NOT the loud outlier; if anything slightly conservative = faithful.

## FIDELITY PICTURE COMPLETE — both engines faithful, no gain bug
- Qlatt klsyn88 ≈ real klsyn88 (within ~1.8 dB). Faithful.
- Qlatt klatt80 ≤ real klatt80 level (real clips, Qlatt 2 dB under). Faithful.
- The 14 dB klatt80-vs-klsyn88 gap is REAL, FAITHFUL engine character: klatt80 is
  intrinsically a loud (clipping-hot) engine; klsyn88's 1988 rescale is genuinely
  quieter. Both Qlatt backends reproduce their references' levels. NEITHER is buggy.
- Original premise ("klsyn88 quietly buggy → fix it") FULLY RESOLVED: the quiet is
  correct. Loudness normalization is a BEAUTY task for the experimental synth, not a
  fidelity fix. Amp-table separation = optional cleanup only.
- Remaining fidelity nuance (low priority): Qlatt klatt80 ~6 dB under real klatt80 at
  matched nominal params, and both backends use an LF source where the references use
  native Klatt voicing — timbre fidelity unverified (level is settled).
