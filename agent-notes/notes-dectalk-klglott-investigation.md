# Notes: DECtalk KLGLOTT88 worklet voice bug investigation

Task source: `prompts/dectalk-bug.md`. Full structured investigation lives in
`investigations/dectalk-klglott-worklet-voice.md` (facts/theories/tests table, kept
up to date throughout). This file is the running session notes per repo convention.

## PHASE 2 UPDATE (2026-07-01): Q chose fix direction, plan approved, gauntlet in progress

After the investigation above closed (root cause: `nopen` clamp in `crates/
oversampled-glottal-source/src/lib.rs` calibrated for klsyn88's implicit ~10kHz
reference rate, never rescaled — confirmed via `~/src/klsyn/c/parwv.c:333-334`
showing OTHER constants ARE rescaled by `samrate/10000` but this one isn't), I
presented Q two fix directions: (A) rescale the clamp dynamically by live device
rate, or (B) run internal physics at a fixed virtual rate, decimate to device rate.
Q asked a good follow-up ("virtualize even higher than 48000?") which led to
confirming: picking a virtual rate above all real device rates doesn't remove the
need for constant-rescaling (same math as A) but makes the resample step always a
decimation (never upsample) and is ~free extra since a fractional resampler is
needed either way. **Q chose Option B.**

Entered plan mode. Ran 2 parallel Explore agents (crate survey: found `pitch-sync-
mod` has the SAME unscaled-clamp bug, out of scope for this fix; worklet/buffer
architecture: no ring-buffer infra exists, but state-persists-via-struct-pointer
pattern already fits a resampler's needs) + 1 Explore agent (test/verification
gates: `npm run lint:audio` (Praat periodicity) and `npm run measure` (Praat
acoustic measurement) are the right NON-VISUAL proof mechanisms for Q, who is
blind — not "listen and confirm"). Then 2 parallel Plan agents (implementation
design + pure DSP correctness review) — the DSP reviewer caught 3 real issues in
my first-draft design: single-biquad AA filter inadequate (~12-13dB rejection at
44.1/48kHz, need cascaded 2+ stages), noise recursive-smoother coefficient (0.75)
needs re-derivation for the new internal rate not a direct carry-over, and the
phase-accumulator should be a drift-free DERIVED index (from existing
`output_sample_count` field) rather than an incrementally-summed f32/f64
accumulator. Wrote final plan to `C:\Users\Q\.claude\plans\validated-growing-
lecun.md`, Q approved via ExitPlanMode.

**Dispatched via gauntlet protocol** (`protocols:gauntlet` skill). Coder agent
implemented the plan faithfully in `crates/oversampled-glottal-source/src/lib.rs`
(694→943 lines), full TDD (wrote a new RMS-consistency-across-sample-rates test,
watched it fail on unmodified crate matching the investigation's predicted ~0.71
ratio, then pass post-fix at ~1.5-1.7%). 21/21 vitest tests green, golden tests
unaffected (default sourceMode stays 0, untouched).

**BLOCKING FINDING from coder** (full detail: `reports/dectalk-klglott-resample-
coder.md`): the plan under-specified the fix. `pitch_sync_reset`'s natural-source
amplitude formula `self.a = (b0 * nopen as f32) * 0.333` uses the newly-rescaled
`nopen` (now ~19.2x larger) DIRECTLY, un-reindexed — unlike the B0_TABLE lookup two
lines above it, which the plan DID think to reindex. This causes ~300-500x
amplitude blowup (verified by hand calc AND observed in real test/render numbers)
and real clipping (0.34% of samples). Per the hard-constraint rule, the coder did
NOT patch this — only ran one bounded, fully-reverted diagnostic experiment
(reindexing just that one line) to test the hypothesis. **Result: fixing that one
line alone did NOT restore voicing** — a real sourceMode=3 render still shows 0%
detected periodicity via `npm run lint:audio` (vs 50% for the working sourceMode=0
baseline), and still clips. So there's at least one MORE issue beyond the one
found. Coder's own suspects, unranked: AA cascade cutoff choice (0.45× device
rate, "engineering estimate"), noise-coefficient derivation, or an interaction
between the AA cascade and the pre-existing `rlpa/rlpb/rlpc` filter now running at
192kHz instead of device rate.

## What worked

- Faithful, hard-constrained TDD coder execution — caught a real plan gap instead
  of silently patching around it or shipping something broken. Exactly the
  behavior the gauntlet protocol's "no deviation" rule is designed to produce.
- The coder's own bounded-diagnostic-then-revert methodology (test a hypothesis,
  prove/disprove it, revert, report) — same discipline I used earlier in the
  investigation phase.

## What didn't / open blocker

- My plan's "every existing tick-domain formula ... stays algebraically correct
  unchanged" claim (Design §1) was WRONG for at least one formula (the `self.a`
  initial-value calc), and possibly a whole class of formulas — I only thought to
  audit table LOOKUPS (category: absolute/indexed values needing reindexing), not
  per-step INCREMENT/DECREMENT quantities that accumulate over a now-much-longer
  per-subtick loop (my hypothesis: `self.b`, subtracted from `self.a` once per
  subtick in the `source==2` open-phase loop, was calibrated for the OLD per-tick
  granularity and needs its own `1/TICK_RESCALE`-style correction so the
  cumulative sweep of `self.a` through zero still completes at the right point
  relative to the new, correctly-longer open phase). **Not yet verified** — could
  be wrong about the exact mechanism.
- Currently blocked on: an investigator agent (dispatched, in progress at time of
  this note) doing a systematic read-only audit of EVERY tick-domain formula in
  `pitch_sync_reset` AND `process_sample` (not just the one already found),
  classifying each into "pure ratio / safe", "absolute value needing reindex", or
  "per-step increment needing rescale", verifying or refuting my `self.b`
  hypothesis with actual traced arithmetic, and sanity-checking the coder's actual
  antialiasing filter implementation (`setabc(virtual_sr, 0.0, 0.45*device_sr...)`
  — note freq=0.0, not literally "freq=bw" as my plan's prose ambiguously said;
  need to confirm this is a reasonable lowpass and not itself a contributing cause).

## PHASE 3 UPDATE: investigator confirmed root cause, round-2 coder dispatched

The investigator (read-only, verified numerically via scratch scripts against a
simulated native-10kHz ground truth — `trace.mjs`/`sweep.mjs`/`audit.mjs` in
session scratchpad, not committed) confirmed my category-(c) hypothesis was right
in kind but wrong in magnitude: `self.a -= self.b; self.vwave += self.a;` in
`process_sample`'s `source==2` (natural glottal pulse) branch is a **double
integrator** (self.b decremented from self.a each subtick, self.a accumulated into
vwave each subtick — no explicit per-step Δt in either stage). Refining the tick
rate by `TICK_RESCALE` (19.2x) without compensating BOTH stages inflates the
doubly-integrated output by `TICK_RESCALE²` (~369x), not `TICK_RESCALE` (19.2x) as
I'd guessed.

Verified quantitatively (peak |vwave| vs native-10kHz ground truth, swept f0=80-
450Hz, oq=30-70%): delivered round-1 code = 366x too big; round-1's reverted
diagnostic (rescaled `self.a` only, NOT `self.b`) = 1057x too big and WORSE —
explains why that diagnostic didn't help, it also badly mistimes the pulse's
zero-crossing (33% -> 1.7% into the open phase). Single-rescale of both = 19x too
big, still wrong. **Double-rescale** (`self.b = b0/(TICK_RESCALE²)`, then
`self.a = self.b*nopen*0.333`) = 0.93x-0.99x — correct.

Also found: secondary independent defect in the antialiasing cascade cutoff
(coder's actual `setabc(virtual_sr, 0.0, 0.45*device_sr...)` lands its -3dB point
~4.6x more aggressive than intended at 44100Hz — real, but F0 itself survives
easily so probably not the primary cause of 0% periodicity); a latent
`skew_param` rescaling gap (currently INERT — DECtalk hardcodes `skew: 0.0` in
graph.yaml, zero effect today); confirmed triangular source (`source==3`) does
NOT need a fix (single-stage integrator to a fixed target, structurally different,
self-correcting); confirmed impulsive-source (`source==1`) has the same raw-nopen
pattern but isn't exercised by DECtalk either (hardcodes `source: 2.0`).

Updated the plan file (`C:\Users\Q\.claude\plans\validated-growing-lecun.md`) with
a "CORRECTION" section (full derivation, citation, priority-ordered instructions)
and dispatched a round-2 coder to: (1) apply the double-rescale fix, rebuild,
re-verify vitest suite, re-render sourceMode=3, re-check lint:audio/measure — (2)
stop and assess before doing more — only proceed to the AA-cascade-cutoff fix if
step 1's numbers are still clearly failing — (3) fix the impulsive-source
`temp1`/`rgla` formula for consistency (cheap, not currently exercised) — (4)
explicitly skip the latent skew_param issue (not trivial, out of scope this round).
Round-2 coder is running now, same hard-constraint-no-deviation + TDD rules as
round 1, reports to `reports/dectalk-klglott-resample-coder-round2.md`.

## Next step

1. Wait for round-2 coder report. Read it for: exact before/after lint:audio/
   measure numbers, whether the double-rescale alone was sufficient or the AA
   filter also needed fixing, any new deviations/objections.
2. If round 2 reports success (periodicity ratio clears the 0.4 lint:audio floor,
   comparable to or better than the sourceMode=0 baseline's ~0.36-0.50 range, no
   significant clipping) — proceed to analyst then verifier per gauntlet, still
   nothing committed, still no default flip (sourceMode stays 0 regardless of
   outcome — that's a separate future decision after browser verification, which
   is explicitly out of scope for all coder rounds).
3. If round 2 still fails after both fixes — do NOT immediately dispatch a round
   3 coder blindly. Escalate to another investigation pass first, same discipline
   as this round: this bug has now had 2 prior failed attempts (pre-session) + a
   round-1 gap + verify round-2 doesn't become a third/fourth failure via
   guessing. Consider whether the AA filter fix itself needs the same
   investigator-verification treatment (numeric ground-truth check) rather than
   just "seemed reasonable" before trusting it.
## PHASE 4 UPDATE: round 2 landed both fixes correctly, STILL 0% periodicity — new investigation dispatched

Round 2 coder report (`reports/dectalk-klglott-resample-coder-round2.md`): applied
the double-rescale amplitude fix exactly as specified (voicePeak dropped from
~2,956,782 broken -> 9187, vs ~9577 native target, within ~4%; clipping eliminated
0.34%->0.000%). Then, per the plan's stop-and-assess clause, since lint:audio ratio
was still exactly 0 (not "close to 0.4"), proceeded to fix the AA cascade cutoff
too (derived and verified a closed-form correction, confirmed the ~4.6x mismatch
the investigator found and fixed it exactly). Also fixed the impulsive-source
`temp1` formula for consistency (not exercised by DECtalk today).

**Both fixes are independently verified correct — but neither moved the needle.**
lint:audio periodicity ratio stayed EXACTLY 0 (0/73 frames) before and after the AA
fix. measure's voiced% went 1.8%->0.0%->0.0%, HNR actually got slightly WORSE
(-0.332dB round1 -> -0.732dB step1 -> -0.717dB step2+3), intensity mean also
slightly worse (-157.8dB -> -161.4dB -> -161.4dB). Peak amplitude is healthy
(~0.977, not clipped) but mean intensity is ~-161dB — this combination (healthy
peak, near-total-silence mean) strongly suggests the actual waveform is NOT a
healthy periodic pulse train at all, just isolated rare spikes in mostly-silence,
regardless of amplitude/duty-cycle math now being individually correct on paper.

**Key realization**: every check across BOTH rounds (RMS-consistency-across-rates,
peak/clipping %, Praat's aggregate lint:audio/measure stats) is an AGGREGATE metric
— none of them directly verify the waveform is actually periodic/correctly shaped
at the sample level. This is exactly the "do not accept aggregate RMS as proof"
warning from the ORIGINAL bug brief (`prompts/dectalk-bug.md`) — that discipline
slipped once work moved into WASM-unit-test/aggregate-metric land across rounds 1-2.

Dispatched a fresh investigator to look at RAW SAMPLES directly for the first time
in this whole investigation: generate output via a direct WASM probe (bypassing
render-phrase/WAV entirely), check autocorrelation at the expected ~407-sample
(108Hz @ 44100Hz) period lag, compare individual periods side-by-side. If the raw
WASM output IS periodic/sane, the bug has moved DOWNSTREAM (render-phrase, WAV
writer, or the analysis tools) and isn't in the crate anymore. If NOT periodic even
in isolation, dig into `process()`'s decimation/catch-up loop across MULTIPLE
process() calls (not just one) — flagging specifically that round 1's coder had to
INTERPRET ambiguous plan prose for the loop bound (chose `while ... <= target`,
reasoned through it once, but this was NEVER independently re-verified by anyone
since — a real candidate for where a subtle multi-call-boundary bug could hide).

## PHASE 5 UPDATE: crate DSP proven correct; bug isolated to real AudioWorkletNode execution, reproduces in BOTH node-web-audio-api AND real Chromium

The raw-waveform investigator (read-only) proved, three independent ways, that the
crate's DSP algorithm (both rounds' fixes) is now CORRECT: (1) direct WASM call,
constant params, 1s render — autocorrelation r=0.9979 at the expected ~407-sample
(108Hz@44100Hz) lag; (2) direct WASM call replaying the REAL per-frame-changing
parameter sequence extracted from the actual failing render's own track dump
(148 frames, 128-sample cadence) — r=1.0000 exactly; (3) a from-scratch line-by-
line JS reimplementation of the whole algorithm, driven by the same real sequence
— 70 distinct periodic pulse runs, r=1.0000. **This crate is not the bug anymore.**

But tapping the REAL graph (via the actual `createKlattRuntime`/interpreter code
path, at `klglottSource`/`klglottGain`/`voiceGain`) shows: exactly ONE clean,
correctly-shaped pulse at t≈0.168s for the ~1.1s utterance, then EXACT zero (no
NaN/Inf) for the rest — despite the worklet's own debug telemetry confirming
`process()` keeps being called with healthy, continuously-varying F0 (106->122->
109->124->85->80->75Hz across later blocks). Ruled out: stale/mismatched .wasm
build (md5-verified fresh), node re-creation mid-render, DynamicsCompressorNode
alone, the resonator/cascade chain alone or combined — periodicity survives
isolated tests of all of those. The investigator's own report flagged
`node-web-audio-api` (Node's WebAudio polyfill, used for `--host node`) as the
prime remaining suspect, since ALL testing to that point had gone through it.

**I tested that hypothesis directly** (ran `scripts/render-phrase.ts --host
browser --allow-browser 1` myself via Bash — it launches a REAL headless Chromium
via Playwright, no browser-automation tooling needed, confirmed by reading
`scripts/rendering/backends/browser-runtime.ts`). Used the same temporary
`public/rules/frontends/dectalk-english/source-contour.yaml:28` override
(`source_mode: 0` -> `3`), reverted immediately after (confirmed via `git diff`
showing no trace). **Result: IDENTICAL symptom in real Chromium** — `npm run
lint:audio` still 0/73 periodic frames, ratio 0; `npm run measure` still 0.0%
voiced, mean intensity -159.2dB (vs the working baseline's ~+63dB). This RULES OUT
"node-web-audio-api-specific polyfill artifact" as the explanation — it's a real,
reproducible-in-production bug.

Since direct WASM FFI calls (even ones replaying the exact real parameter
sequence at the exact 128-sample cadence) are proven perfectly periodic, but the
REAL AudioWorkletNode invocation (in TWO different WebAudio implementations) is
broken, the remaining bug must be specific to something about how a REAL
AudioContext/AudioWorkletNode calls into the WASM across many repeated calls over
a long render — most likely in `src/worklets/oversampled-glottal-source-
processor.ts`'s `WasmBuffer`/`fillParamBuffer` marshaling layer (memory-growth/
buffer-identity handling was flagged as "probably fine" back in the VERY FIRST
investigation phase of this whole task, but that analysis predates rounds 1+2
adding many new struct fields/allocations to the crate, which could shift exactly
when/whether WASM memory growth occurs during a real render).

## Next step

1. Dispatch a targeted instrumentation investigation (not another blind coder
   round): add TEMPORARY debug logging to the worklet processor (and/or new
   temporary FFI getter exports from the crate) to capture, on every real
   `process()` call during an actual browser or node render: whether
   `voiceBuffer`/`noiseBuffer`'s underlying ArrayBuffer identity ever changes
   (memory growth event) relative to `wasm.memory.buffer`, and the internal
   `device_sample_count`/`output_sample_count`/`target` counters — correlate the
   exact call/timestamp where output permanently stops advancing with any memory-
   growth event or counter anomaly. All instrumentation must be reverted before
   finishing, same discipline as prior rounds.
2. Do NOT dispatch another "just try a fix" coder round until the exact mechanism
   is identified — this bug has now survived 2 full fix rounds (each fixing a
   real, verified issue) without resolving the actual symptom; blind patching has
   clearly run its course, need concrete instrumented evidence this time.
3. Rounds 1+2's crate changes are CONFIRMED CORRECT and must be KEPT — this is a
   SEPARATE, additional bug in the worklet/execution layer, not a reason to revert
   the crate work.
4. Uncommitted work in the working tree (as of round 1, round 2 will add to this):
   `crates/oversampled-glottal-source/src/lib.rs`, `public/worklets/oversampled-
   glottal-source.wasm`, `test/klsyn88.test.ts`. All intentional. Plan file at
   `C:\Users\Q\.claude\plans\validated-growing-lecun.md` has the full authoritative
   spec including both rounds' corrections — read it fresh rather than relying on
   memory if resuming this task in a new session.

## What I was asked to do

Debug why DECtalk's KLGLOTT88 voice source (sourceMode 3, currently non-default,
gated off in favor of an impulse fallback at sourceMode 0) produces no audible
sustained vowel in the browser — only `/h/` hiss and the final `/d/` burst are
heard — despite worklet telemetry showing valid controls reaching the source and
direct WASM unit tests passing. Two prior fix attempts already failed (scaling
`klglottSourceSwitch` by 1/32768; a compact zero-flutter/diplophonia WASM export)
and were reverted. Told explicitly not to patch until a concrete mismatch is
identified via controlled comparison, and not to touch the current tree's restored
sourceMode=0 default.

## What I observed / tried, in order

1. Read `src/worklets/oversampled-glottal-source-processor.ts` and the Rust FFI
   export in `crates/oversampled-glottal-source/src/lib.rs`. Compared the JS call's
   argument order against the Rust `extern "C"` signature param-by-param — **exact
   match**. Ruled out the ABI/signature-mismatch theory from the bug brief.
2. Checked `WasmBuffer.refresh()` in `src/worklets/wasm-utils.ts` — it re-creates
   the Float32Array view when `wasm.memory.buffer` identity changes (grows), and is
   called on both voice/noise buffers AFTER the wasm process() call and BEFORE
   `.set()`-ing into output channels. Looked structurally correct on read; not
   pursued further as the leading theory.
3. Compared `target/wasm32-unknown-unknown/release/oversampled_glottal_source.wasm`
   (loaded by the passing `test/klsyn88.test.ts`) against
   `public/worklets/oversampled-glottal-source.wasm` (loaded by the real worklet) —
   byte-identical (md5 `96ec5fa62f99797a820d230029cda8b4`, hardlinked). Ruled out
   stale/divergent worklet wasm build.
4. Noticed the passing direct WASM test only calls `oversampled_glottal_source_process`
   **once**, right after `_new()`, at `sampleRate=22050`, `blockSize=128` — never
   exercises the repeated-call pattern (many render quanta over a sustained vowel)
   that the real worklet does. Flagged this as the most likely structural gap
   between "test passes" and "browser fails."
5. Noted the browser telemetry value `voiceRms ≈ 2.802596928649634e-45` is bit-exact
   for `Int32Array([2])` reinterpreted as `Float32Array` (verified in Node). Initially
   treated this as a strong clue pointing at buffer/memory aliasing with the
   `source: i32 = 2` state-struct field. Wrote two scratch Node probe scripts
   (NOT committed to the repo — left in the session scratchpad dir under
   `.../scratchpad/klglott-worklet-probe.mjs` and `klglott-aggregate-rms.mjs`) that
   replicate the exact `WasmBuffer`/`fillParamBuffer`/`process()` call sequence the
   worklet uses, across many render quanta, using the real
   `public/worklets/oversampled-glottal-source.wasm` binary.
6. Ran the probe at `Fs=22050` (matches passing test/CLI) — voice stayed strong
   across 50 quanta, never collapsed. Ran it at `Fs=44100` and `Fs=48000` (real
   browser AudioContext defaults, which nothing in the passing test/CLI path
   exercises) — **reproduced the exact subnormal-RMS telemetry signature**
   (including hitting `2.802596928649634e-45` again) purely from the sample-rate
   change, no code edits. This **disproved** the buffer-aliasing/int-bit-pattern
   theory (it's coincidental — a resonant 2-pole filter's ring-down naturally sweeps
   through the subnormal range en route to exact 0) and **confirmed** a real,
   reproducible, sample-rate-dependent defect.
7. Ran an aggregate-RMS-over-2-seconds version of the probe to quantify severity:
   Fs=22050 → aggregate voiceRms ≈ 1927; Fs=44100 → ≈ 1364; Fs=48000 → ≈ 1308 (peak
   amplitude ~9000 unchanged at all rates). Only ~3dB aggregate loudness drop —
   flagged as probably not severe enough alone to explain "no audible vowel body at
   all," so kept looking for a compounding cause.
8. Read `public/experiments/dectalk-english/graph.yaml` and
   `public/experiments/klatt80-baseline/semantics.yaml` — found `klglottGain` feeds
   `voiceGain`/`avsGain` directly at sourceMode 3, and `voiceGain`'s realize
   expression is `dbToLinear(...) * (F0 > 0 ? min(F0,500)/228.0 : 0.0)` — i.e. voice
   is multiplied by an F0-gated factor that goes to exactly 0 if the semantics-side
   `F0` is ever `<= 0` for that frame. Flagged as a second, NOT YET CONFIRMED lead
   and dispatched a read-only `investigator` subagent (id `a5f778cefdd8133a7`) to
   check whether F0 could diverge/zero during KLGLOTT-mode voiced-vowel frames,
   without editing any repo file. **Still running as of this note.**
9. **Root-cause breakthrough**: checked the actual upstream reference source at
   `~/src/klsyn/c/parwv.c` (confirmed present locally, per project's own
   documented reference: klsyn88 = Klatt/Johnson's original C synthesizer). Found
   `pitch_synch_par_reset()` (parwv.c:590-627) uses the **exact same unscaled `263`
   /`40` tick clamp** as the Rust port, AND found that a few lines earlier
   (parwv.c:333-334) the original authors DID rescale other rate-dependent constants
   (`FLPhz = 950 * (samrate/10000)`, `BLPhz = 630 * (samrate/10000)`) but did NOT do
   the same for the nopen clamp. The clamp's own warning message ("truncated to
   6.6 ms") is hardcoded assuming `263 ticks / (4×10000 Hz) ≈ 6.6ms`, proving the
   reference implementation implicitly assumed/was only validated at ~10kHz.
   **Conclusion: this is not a Qlatt porting bug — the Rust crate faithfully
   reproduced an upstream klsyn88 defect that only manifests when driven at
   sample rates far from ~10kHz (i.e., real WebAudio 44100/48000Hz), which nothing
   in the existing test/CLI suite exercises (tests use direct single-shot calls;
   CLI renders default to/are invoked with 22050Hz).**

## What worked

- Building a multi-call Node probe that replicates the worklet's real call pattern
  (not the test's single-shot pattern) at realistic sample rates — this is what
  actually reproduced the bug outside the browser, cheaply and deterministically.
- Going to the actual upstream C reference (`~/src/klsyn/c/parwv.c`, referenced in
  AGENTS.md's "Local reference implementations") for ground truth on a suspicious
  magic constant, instead of treating it as Qlatt-specific.

## What didn't pan out

- ABI/argument-order mismatch — checked, matches exactly.
- Stale/divergent worklet WASM build — checked, byte-identical to test's WASM.
- Buffer/memory aliasing reading a raw `i32=2` as a float — the exact-bit-pattern
  match was real but turned out to be coincidental IIR ring-down behavior, not
  aliasing; disproven by reproducing the same signature via sample-rate change
  alone with no other code difference.

## Current blocker / open thread — RESOLVED

- The `voiceGain`/F0-zeroing sub-investigation (agent `a5f778cefdd8133a7`) reported
  back and was folded into `investigations/dectalk-klglott-worklet-voice.md`:
  **ruled out**. F0 is a passthrough binding (no `realize` rule), read once per
  frame from the same `frame.params.F0` that drives both `klglottSource.f0` and
  `voiceGain`'s expression — no staleness/ordering bug. Decisive: `voiceGain`'s F0
  gate isn't conditioned on `sourceMode` at all, and the same gate is already
  proven working for sourceMode 0 (impulse, browser-verified audible), so it can't
  be what silences mode 3 specifically. Minor correction folded in too: `avsGain`
  has no F0 term (only `voiceGain` does) — an earlier note of mine was wrong there.
  No further open threads; investigation is at a stopping point pending a fix
  decision from Q.
- (Aside: I scheduled a wakeup via ScheduleWakeup as a fallback for the subagent,
  which was unnecessary per tool guidance since Agent-tool background completions
  notify automatically — noting this so a future pass doesn't repeat it.)

## Next step

1. ~~Once the subagent reports, fold its findings into the investigation file~~ done.
2. Decide + present to Q the fix-direction fork (both legitimate, already written up
   in the investigation file):
   (a) rescale the `263`/`40` nopen clamp constants by `sample_rate/10000` (and fix
       up the now-mismatched `B0_TABLE[nopen-40]` indexing, since the table only has
       224 entries for raw ticks 40-263), trading strict upstream bug-for-bug
       fidelity for correct audio at modern WebAudio rates; vs.
   (b) run the internal 4x-oversample tick clock at a fixed virtual ~10kHz-based
       rate regardless of the actual WebAudio context rate, and let the existing
       `sample_rate`-aware downsample low-pass filter (`rlpa/rlpb/rlpc`) handle
       resampling to the real output rate — closer to the reference architecture's
       implicit assumptions, but a bigger structural change.
   This is a genuine design fork (fidelity-vs-integration), not a pick-for-Q
   decision — surface it, don't just implement one solo, especially given 2 prior
   failed fix attempts already logged in `prompts/dectalk-bug.md`.
3. Given the complexity and prior-failed-attempt history, consider whether this
   warrants escalating to a full gauntlet (scout/coder/analyst/verifier) for the
   actual fix implementation, per the user's stated protocol preference, rather
   than a solo patch.
4. Scratch probe scripts are in the session scratchpad dir, not the repo — fine to
   leave there or delete; not committed, no repo cleanup needed for them.
