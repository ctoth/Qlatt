# dt-vtm1 — wire KLGLOTT88 (oversampled-glottal-source) into dectalk graph

2026-05-30. Plan approved (C:\Users\Q\.claude\plans\agile-dreaming-codd.md). Implementing
dt-vtm1: add oversampled-glottal-source as selectable source_mode=3, default unchanged (Paul
byte-identical). Goal = the big timbre win; A/B listen gate after; default flip = dt-vtm1b.

## Baseline
- `npm run test:golden` exit 0 (clean, before edits). Branch dectalk-parity.

## Verified facts (from reading)
- klsyn88 registry block to copy: registry.yaml:330-378 (9 params f0/av/aturb/tilt/openQuotient/
  skew/asymmetry/source/seed; inputs:0 outputs:2). source default 2=natural=KLGLOTT88.
- klsyn88 graph node `glottalSource` (graph.yaml:14-25): binds av←avDb, aturb←Aturb, tilt←
  effectiveTiltDb, openQuotient←effectiveKopen, skew←Kskew, asymmetry←as, source←ss, seed←seed.
  Port0=voice, port1=noise.

## CRATE BEHAVIOR (verified by reading lib.rs 200-427)
- `av_db` does NOT scale voice amplitude — only sets nmod noise gate (line 253). Voice =
  vwave*0.03 (source==2, line 370), amplitude independent of AV. => routing crate voice through
  dectalk downstream voiceGain (=dbToLinear(GO+AV+...)) applies loudness ONCE, no double-apply. GOOD.
- Crate outputs glottal FLOW (vwave accumulates a/b), then internal tilt filter (418), then
  open-phase breathiness (423). No differentiation in crate.
- RISK: crate raw voice level (vwave*0.03, vwave can be large) differs from impulse doublet level.
  mode 3 may be much louder/clip vs mode 0. NEEDS empirical level trim (klglottGain const or extra norm).

## ROUTING (verified)
- dectalk voice path: sourceSum → rgp/rgs → sourceDirectGain/sourceDiffGain → voiceGain(306,GO+AV) → mixer.
- At sourceMode=3: sourceBypassSwitch=0, sourceDirectSwitch=0, sourceDiffSwitch=1 (SAME as impulse
  mode 0). So mode3 uses diff route (rgp→rgz→radiationDiff→sourceDiffGain). NO change to those switches.
- UNKNOWN(empirical): crate already outputs shaped flow; diff route adds rgp/rgz+radiationDiff
  (differentiation). May over-process. Render + measure + Q ear decides. Reversible.
- Only switch edits: ADD klglottSourceSwitch (==3); OVERRIDE impulseSourceSwitch (!=1 → ==0,
  else double-voice at mode3).

## EDITS DONE
- [x] registry.yaml: oversampled-glottal-source primitive added (after tilt-filter).
- [x] graph.yaml: klglottSource node (av←AV, tilt←TL, source 2=natural, seed 305419889) + klglottGain.
- [ ] graph.yaml connections: klglottSource port0 → klglottGain → sourceSum.
- [ ] semantics.yaml: range [0,3]; add klglottSourceSwitch; override impulseSourceSwitch.
- [x] EDITS DONE: registry + graph nodes + connections + semantics (range[0,3],
  klglottSourceSwitch, impulseSourceSwitch→==0). explain dectalk paul: 190 dec, 0 uncited, no hang.

## A/B PROBE RESULTS (scripts/dt-vtm1-source-ab.ts, "hello world", 22050Hz)
- "0 samples" theory REFUTED: both modes render audio. Prior 0-samples = frontend/experiment
  MISMATCH (dectalk frontend through klatt80-baseline graph). Pass experiment-id=dectalk-english.
- mode0 (impulse): peak 0.8446 rms 0.07359 brightness 0.3911 nonzero 29489/30848
- mode3 (KLGLOTT88): peak 0.8447 rms 0.05045 brightness 0.5566 nonzero 17458/30848
- KLGLOTT88 = +42% brightness (the goal: brighter/buzzier DECtalk). Peaks ~identical → NO level
  trim needed (downstream voiceGain normalizes). More closed-phase silence (pulsed source) = correct.
- WARNING: [ANTIRESONATOR EXPLOSION] rgz outRms=1342 / rgzAvs 299 at mode3 ONLY (not mode0). Crate
  outputs glottal FLOW (low-freq heavy); diff route rgp(glottal pole) double-boosts lows → drives
  rgz(zero @1500/bw6000) near-unstable. OUTPUT still bounded (peak 0.8447) but routing not clean.

## DECISION POINT: source route for mode 3
- crate = self-contained flow source + own tilt. Diff route (rgp→rgz→radiationDiff) is tuned for an
  impulse DOUBLET, not a pre-shaped flow. rgp likely WRONG for crate (double low-freq).
- OPT A diff (current): bright 0.557 but rgz explosion warning.
- OPT B bypass (sourceSum→voiceGain, no shaping): test brightness+stability.
- OPT C direct (rgp only): test.
- TESTING bypass next (crate may want minimal extra shaping).

## ROUTING RESOLVED (inspect + bypass test)
- Merge VERIFIED works (load-experiment-config.ts:60 child realize wins). Confirmed merged config:
  klglottSourceSwitch=`sourceMode==3?1:0`, impulseSourceSwitch=`sourceMode==0?1:0` (NO double-voice),
  klglottSource/klglottGain nodes present, primitive in registry. (scripts/dt-vtm1-inspect-switches.ts)
- Bypass test gave IDENTICAL output because rgz explosion is fed by UNCONDITIONAL sourceSum→rgp→rgz
  connection — output switch only gates the voiceGain tap, not whether rgz processes. Can't dodge
  the rgz warning via switches alone; needs graph surgery (gate sourceSum→rgp/rgz by mode) = dt-vtm1b.
- DECISION: ship dt-vtm1 with diff route (bright 0.557, bounded peak 0.8447, audible). rgz warning =
  KNOWN, documented for dt-vtm1b (restructure cascade glottal feed to match klsyn88: crate voice
  should NOT pass through impulse-tuned rgp/rgz).

## GATE (dt-vtm1)
- explain dectalk paul: 190 dec, 0 uncited, no hang.
- test:golden EXIT=0. maxDelta 0.79 block = PRE-EXISTING lf-source-wasm-compare (== baseline,
  orthogonal). No NEW failure. Default dectalk (mode 0) byte-identical. qlatt-english untouched.
- A/B WAVs for Q: test/tmp/dt-vtm1-source-0-impulse.wav + dt-vtm1-source-3-klglott88.wav.
- Declarativity: ALL changes are YAML data (registry/graph/semantics) + pre-existing crate. NO engine
  TS touched (only scripts/ probes). Adversary not needed (no imperative linguistic logic added).

## DONE dt-vtm1: KLGLOTT88 wired as selectable source_mode=3, declarative, default unchanged.
## NEXT: dt-vtm1b = clean rgz routing + flip default to 3 (gated on Q's listen of the A/B WAVs).

## dt-vtm1b (Q said "do it properly/fully" — no listen gate)
- CLEAN ROUTING DONE: klglottGain → voiceGain + avsGain DIRECTLY (was → sourceSum). Matches klsyn88
  (voice→voiceGain→cascade; crate is self-contained, radiation baked in). sourceDiffSwitch overridden
  to 0 at mode3. Now sourceSum empty at mode3 → rgp/rgz see silence.
- VERIFIED: explosion-warning-count=0 (was 2). mode3 output BYTE-IDENTICAL to old diff-route
  (peak 0.8447 bright 0.5566) — diff-chain was acoustically transparent for crate, just internally
  unstable. So routing is cleaner with same good sound.
- Graph edits ARE live (decisive test: source=4 → brightness 0.063 vs source=2 0.557). childGraph
  used wholesale (load-experiment-config.ts:115 childGraph||parentGraph).
- DEFAULT FLIPPED: source-contour.yaml baseline.source_mode 0→3; semantics.yaml sourceMode default
  0→3; inventory.yaml sourceMode 0→3 (3 lead frames fell back to inventory default). Distribution
  after contour-only flip = {0:3, 3:165}; inventory flip aligns the 3 stragglers.
- TODO: verify dist all-3 + render health; golden gate (qlatt byte-identical, dectalk not goldened
  by run-golden so no regen needed — run-golden renders qlatt-english default only); commit dt-vtm1b.
- NOTE: run-golden (scripts/run-golden.ts) renders render-phrase with NO frontend args = qlatt-english.
  No dectalk golden fixture exists -> default flip can't break golden. e2e/vitest dectalk tests assert
  loose F0 ranges, not audio bytes -> should survive. Verify.




- dectalk registry.yaml: primitives: block has tilt-filter only (extends klatt80-baseline). ADD
  oversampled-glottal-source here.
- dectalk graph source nodes start ~line 105: lfSource(105) impulseSource(116) noiseSource(123,
  seed 305419896) fricationSource(~136). ADD klglottSource + klglottGain.
- dectalk semantics.yaml: sourceMode default 0 range [0,2] (line 16-20). Widen to [0,3]; add
  klglottSourceSwitch; override impulseSourceSwitch (==0); add params Kskew/sourceAsymmetry/
  klglottSourceType/klglottSeed; copy effectiveKopen/effectiveTiltDb chain (klsyn88-only).

## STILL TO READ before editing
- dectalk graph connections + sourceSum routing (where impulseGain→tiltFilter→sourceSum).
- baseline impulseSourceSwitch realize rule (klatt80-baseline/semantics.yaml ~771-794).
- klsyn88 semantics effectiveKopen/effectiveTiltDb/avDb/Aturb dependency chain (~316-396).

## Decision banked
Node strategy = ADD node + source_mode=3 (NOT mutate impulseSource) → keeps Paul byte-identical,
lf available, impulse available. Voice port0 only (keep seeded noiseSource/fricationSource; no
double-noise). av bind RAW AV dB (crate linearizes; don't bind voiceGain → double-convert).
