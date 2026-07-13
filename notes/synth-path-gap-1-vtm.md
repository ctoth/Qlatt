# Synth-path gap 1: DECtalk 4.63 VTM vs Qlatt Klatt synth (2026-05-29)

Scout report. Observations only, no fixes. Every claim cites file:line.

REFERENCE: DECtalk 4.63 C, `C:\Users\Q\src\dectalk\463\dapi\src\VTM\`.
- `vtm.c` is a stub: `#include "vtm3.c"` (vtm.c:31). **vtm3.c IS the shipping synth engine.**
  vtm1.c = "historic vtm", vtm2.c = "new model"; vtm.c:15 chooses one — the include picks vtm3.c.
- Sample-rate/frame constants: `vtm.h`, `vismprat.h`. Filter macros + coeff calc: `vtmfunc.h`.
  dB table: `fvtmtabl.h`. Float/int vocoder wrappers: `decvoc_f.c` / `decvoc_i.c`.

PORT: Qlatt `dectalk-english` experiment.
- Graph: `public/experiments/dectalk-english/graph.yaml`.
- Source worklet actually used: `src/worklets/impulse-train-processor.ts`
  (graph.yaml:116 `type: impulse-train`). NOTE: this is the JS worklet, NOT Rust
  `crates/impulsive-source` (that crate is unused by the dectalk graph).
- Tilt: Rust `crates/tilt-filter` (graph.yaml:210 `type: tilt-filter`).
- Resonators: Rust `crates/resonator`; nasal zero: `crates/biquad-notch`; parallel diff:
  `src/worklets/differentiator-processor.ts`; radiation: `src/worklets/chalker-radiation-processor.ts`;
  aspiration/frication: `src/worklets/noise-source-processor.ts` + `glottal-mod-processor.ts`.

CAVEAT (build macros): vtm3.c is heavily #ifdef'd (NEW_TILT, NEW_NOISE, NEW_VTM, COMPRESSION,
LOWCOMPUTE, HLSYN, GERMAN…). The 4.6 edit log (vtm3.c:88,126) says 4.6 uses NEW_TILT + NEW_NOISE
+ NEW_VTM. The exact -D set was not confirmed from the Makefile; where a branch matters I note both.

================================================================================
## Q1. CASCADE / PARALLEL TOPOLOGY
================================================================================
REFERENCE (vtm3.c main per-sample loop):
- CASCADE signal path: voice -> RNZ nasal zero (two_zero_filter, vtm3.c:1480)
  -> RNP nasal pole (two_pole_filter, vtm3.c:1488) -> F3 (1518) -> F5 (1529) -> F4 (1544)
  -> F2 (1559) -> F1 (1568) -> out=r1cd1 (1571).
  => **5 cascade oral formants (F1-F5) + nasal pole + nasal zero**, nasal pair at the FRONT.
  F4 and F5 are conditionally bypassed if their bw coef is 0 (vtm3.c:1527-1549).
- PARALLEL bank: R6P(1604) R5P(1617) R4P(1632) R3P(1645) R2P(1653) + AB bypass(1657).
  => **5 parallel formants (F2-F6) + bypass path, NO parallel F1.**
  Outputs summed with ALTERNATING SIGN ("out = rNpd1 - out") to limit overflow
  (vtm3.c:1584-1585,1606,1624,1639,1647,1655,1659).
  R5P removed when sr<=9600 (vtm3.c:1615); German build adds a parallel nasal pole rnpp
  (vtm3.c:1596-1598, non-default).
- Parallel is excited by `noise+impulse` (frication + BRST burst) only (vtm3.c:1604 etc).
  No voiced excitation of the parallel bank in the default path.

PORT (graph.yaml):
- Cascade declared NZ(biquad-notch) -> NP(resonator) -> F1..F6 (graph.yaml:532-534;
  formantBanks main.cascade input=np). Nasal pole+zero at FRONT => MATCHES VTM.
  Qlatt uses biquad-notch for the nasal zero "Replaces Klatt FIR antiresonator which is
  numerically unstable at 48 kHz" (graph.yaml:347-348): different filter form, same spectral zero.
- 8 formant slots defined (index 1-8, graph.yaml:24-96). Cascade uses F1-F6; F7/F8 are
  parallel-only fricative slots (graph.yaml:74-96).
- Parallel: per-formant channels with alternating sign field (+1/-1: graph.yaml:34,40,46,52,58,64,86,95)
  + parallelBypassGain (graph.yaml:380-383). Alternating-sign sum MATCHES VTM intent.
- Qlatt parallel ALSO has voiced parallel sources (parallelSourceGain/parallelDiffGain,
  graph.yaml:399-407) and a parallel nasal (graph.yaml:366-378) — richer than VTM default.

VERDICT Q1: **PARTLY MATCH.**
- MATCH: nasal pole+zero front-of-cascade; alternating-sign parallel summation.
- GAP: cascade formant count — VTM has 5 (F1-F5), Qlatt cascade chains F1-F6 (extra F6 pole).
- GAP: parallel formant count/excitation — VTM F2-F6 noise-excited only; Qlatt F1-F8 slots with
  added voiced parallel path. Qlatt is structurally a superset, not a 1:1 match.

================================================================================
## Q2. GLOTTAL SOURCE MODEL  (largest discrepancy)
================================================================================
REFERENCE (vtm3.c):
- Source = **KLGLOTT88 parabolic pulse, differentiated** — NOT an impulse train, NOT LF.
  Open phase (nper > T0-nopen): `a -= b; voice0 += a>>4;` (vtm3.c:982-983), comment
  "voicing has fixed waveshape, at**2 - bt**3" (976) / "Differentiated glottal flow" (983).
  Closed phase: voice0 = 0 (vtm3.c:1027). a,b recomputed per period from nopen (1204-1220).
- Pulse computed at **4x oversampling** (inner loop nsr4=0..3, vtm3.c:950-956) then decimated by
  a 2-pole LP "from a 40 KHz rate to 10 KHz" (vtm3.c:1366-1378).
- nopen (open-quotient in samples) clamped 40..263 and <= 3/4 T0 (vtm3.c:1166-1189).
- **Spectral tilt built into the source**:
  - NEW_TILT: one-pole two_pole_filter(voice,rtd*,rtca..), coeffs from TILTDB via ntiltf[] table,
    reset at glottal open (vtm3.c:989-1023, 1428-1435).
  - non-NEW_TILT: voice=(1-decay)*voice + decay*vlast, decay from TILTDB (vtm3.c:1422-1426,
    decay set 1111-1130). TILT redefined as "spread glottis" since 19-Feb-85 (vtm3.c:24-25).
- **Aspiration + breathiness mixed INTO the source sample-by-sample** before the tract:
  voice += aturb1*noiseb (breathiness) ; voice += APlin*noise (aspiration) (vtm3.c:1453-1457).
  Breathiness noise is first-difference preemphasized: noiseb = noise - noblast (vtm3.c:901).
- **Noise gated by glottal phase**: noise halved in 2nd half of period when voicing on
  (if nper<nmod: noise>>=1, vtm3.c:897-898/937-938; nmod=nopen, 1140-1141).
- **Jitter** built into the source: T0 += frac4mul(t0jitr,T0), sign alternates each period
  (vtm3.c:1071-1075).
- **Diplophonia / double-pulsing** (Diplo): delays + attenuates every other pulse (vtm3.c:1079-1098).
- **BRST** burst impulse injected to parallel path at frame start (vtm3.c:864-868,1604,1661-1664).

PORT:
- impulse-train-processor.ts source = **doublet impulse (+1 at pos1, -1 at pos2) into a
  2nd-order resonator** (lines 106-117); resonator bw = sr/openPhaseLength (line 128), a=1
  "match KlattSyn adjustImpulseGain(1)" (line 141). This is the klsyn88 *impulsive_source*
  approximation, NOT the at^2-bt^3 differentiated parabolic pulse.
- No 4x oversampling, no decimation LP (runs at base sr; positionInPeriod ++ once/sample, 109-112).
- Tilt = SEPARATE post-filter node (crates/tilt-filter), one-pole LP, TLTdb->decay table from
  klsyn88 parwv.c 706-711 (tilt-filter/src/lib.rs:8-46). Applied after impulseGain (graph.yaml:481).
  Paul TL=0 => decay 0 => unity passthrough (graph.yaml:206-213).
- Aspiration/frication = SEPARATE noise-source nodes summed at mixer/parallelMixer
  (graph.yaml:518-522). NOT mixed into the source per-sample with first-diff preemphasis.
- Glottal-phase noise shaping: glottal-mod-processor.ts multiplies noise by a sinusoidal
  open-phase envelope (0.5 base, peak 1.0 in open phase; line 104-111). This is a DIFFERENT
  shape than VTM's "halve in 2nd half" hard gate (vtm3.c:937-938).
- Jitter/flutter/diplophonia: impulse-train-processor parameterDescriptors are ONLY
  f0,gain,openPhaseRatio (lines 31-37). No jitter, no flutter, no diplophonia. (jitter/flutter
  params exist on the lfSource node graph.yaml:113-114 but dectalk runs sourceMode=0 = impulse,
  so the LF branch is gated off.)

VERDICT Q2: **MAJOR GAP.** Fundamentally different excitation (differentiated parabolic flow,
4x-oversampled, with in-source tilt/jitter/diplophonia/noise-mix vs doublet-into-resonator with
external tilt and external noise). Source-domain features in VTM ABSENT from the dectalk impulse
source: jitter, diplophonia, in-source breathiness+aspiration mixing (first-diff preemphasized),
glottal-phase hard noise gate, 4x oversampling. The "only tilt is missing" claim is false here —
tilt is the ONE source feature that IS ported; the rest of the source model differs.

================================================================================
## Q3. SAMPLE RATE & OVERSAMPLING
================================================================================
REFERENCE:
- Default **11025 Hz** (vtm.h:39 uiSampleRate=11025; vismprat.h:42 PC_SAMPLE_RATE 11025),
  reached from a 10 kHz tuning base via SAMPLE_RATE_INCREASE (vtm.h:40) which scales
  formants/BW/T0 (vtm3.c:663-675). Supports 8K/10K/11K (vtm3.c:62).
- **Frame = 71 samples** (vtm.h:43) => ~6.44 ms/frame at 11025. Main loop ns=0..70 (vtm3.c:861).
  (Header comment at vtm3.c:589 says "64 samples" but the constant is 71.)
- Glottal source 4x-oversampled (~44.1 kHz effective) then 2-pole-decimated (vtm3.c:950-956,1366-1378).

PORT:
- WebAudio AudioContext rate, typically **48000 Hz** (impulse-train-processor.ts:75
  `sampleRate || 48000`; all worklets read the global `sampleRate`).
- No source oversampling/decimation. The baseline reconstruction-filter node is explicitly
  REMOVED from the dectalk graph (graph.yaml:9-11 "direct output summing without the baseline
  reconstruction filter").

VERDICT Q3: **GAP.** SR differs (11025 vs 48000) — formant CFs still correct (coeffs computed for
actual sr in both), but the source spectral character + aliasing differ. VTM's 4x source
oversample + decimation has no port equivalent. No anti-alias/reconstruction stage in dectalk graph.

================================================================================
## Q4. RADIATION / LIP CHARACTERISTIC
================================================================================
REFERENCE:
- VTM applies **NO separate radiation differentiator on the cascade output**. The glottal source
  `voice0` is ALREADY differentiated glottal flow (vtm3.c:983), i.e. the +6 dB/oct radiation is
  baked into the KLGLOTT88 source. Cascade out = r1cd1 (vtm3.c:1571) -> iwave[ns] directly
  (vtm3.c:1748/1754), no first-difference at the lips.
- Parallel branch is excited by noise (already broadband), also no explicit lip differentiator.

PORT:
- impulse-train source is NOT pre-differentiated (doublet-into-resonator). Radiation is applied
  as EXPLICIT filters downstream:
  - chalker-radiation-processor.ts: 2-term radiation H(z)=c1(1-z^-1)+c2(1-2z^-1+z^-2)
    (Chalker & Mackerras 1985), on the rgz path (graph.yaml:497-498, 510-511).
  - differentiator-processor.ts: first-difference *scale (sr/10000) on the parallel branch
    (graph.yaml:541-542; diff/src lines 28,58).
- So Qlatt models radiation as a distinct stage; VTM folds it into the source.

VERDICT Q4: **GAP (structural, possibly spectrally equivalent).** Both end up with a ~+6 dB/oct
lip characteristic, but VTM bakes it into the differentiated source while Qlatt applies explicit
radiation filters (Chalker 2-term on the cascade-feeding rgz path, first-diff on parallel). The
chalker 2-term correction (c2, ~-1/24) is an addition with NO VTM counterpart. Whether the net
source*radiation spectrum matches is UNKNOWN without an audio/spectral measurement.

================================================================================
## Q5. PARALLEL-BRANCH AMPLITUDE CONTROLS / PER-FORMANT GAIN
================================================================================
REFERENCE:
- Parallel formant gains A2,A3,A4,A5,A6 + AB bypass + AP aspiration, each dB->linear via
  amptable[] (vtm3.c:732-738). Applied as the input coefficient of each parallel resonator
  (r2pg..r6pa passed into d2pole_pf / used as filter `a` coef, vtm3.c:842-850,1604-1657).
- Parallel formant **bandwidths are hardcoded constants** (b2p=210 vtm3.c:842, b3p=280 vtm3.c:849;
  higher ones fixed in tables) — NOT driven per-frame like cascade BW.
- CASCADE has NO per-formant amplitude control (pure cascade: amplitude set only by source AV and
  the formant chain); only R1 gain is scaled up (vtm3.c:1260 `R1ca <<= 1`, and the 4/30/85 "boost
  gain in cascade F1" edit vtm3.c:32).
- dB convention: dBtoLinearTable (fvtmtabl.h:522-540) is 20*log10 (index 67=1.0, 20 indices per
  factor 10). AV path uses amptable[AVinDB+4] (decvoc_i.c:198) / 8.0*dBtoLinear[AV+4] (decvoc_f.c:165).

PORT:
- Parallel per-formant gains via parallelSource bindings + fricGainScaled / parallelVoiceGain
  (graph.yaml:32,41,49,57,65,73,84,93,399-412); AB via parallelBypassGain (graph.yaml:380-383).
- Parallel BW is per-formant from formantBanks bwDefault/bwRange (graph.yaml:28,37,45… ) and can be
  driven by FNP/Bxx params — Qlatt allows dynamic parallel BW where VTM hardcodes b2p/b3p.
- Cascade: no per-formant gain (matches), but Qlatt formants carry ndbScale offsets (graph.yaml:30,
  39,47…) used in semantics — an amplitude-shaping layer VTM cascade lacks.
- dB conversion: builtin-functions.ts dbToLinear = 2^(db/6) (==10^(db/20), 20*log10) (lines 112-114)
  AND dbToLinearKlsyn = indexed amptable*0.001 (lines 120-124). Convention MATCHES VTM's 20*log10.

VERDICT Q5: **PARTLY MATCH.** dB convention matches. Parallel amplitude controls present in both.
GAP: VTM parallel bandwidths are fixed constants (b2p=210,b3p=280); Qlatt parallel BW is dynamic.
GAP: the R1ca<<1 cascade-F1 boost and AV+4 offset are specific VTM gain calibrations not obviously
mirrored in the port (UNKNOWN whether semantics reproduces them).

================================================================================
## Q6. FRAME UPDATE RATE & INTERPOLATION
================================================================================
REFERENCE:
- VTM reads variable params ONCE per frame: "READ VARIABLE PARAMETERS FOR ONE FRAME … move some
  parameters into active use immediately (voice-excited ones are updated pitch synchronously to
  avoid waveform glitches)" (vtm3.c:589-594). variabpars[] read at frame top (vtm3.c:683-768).
- **No intra-frame linear interpolation inside VTM.** Filter coefficients are recomputed
  PITCH-SYNCHRONOUSLY at glottal close (when nper==T0, vtm3.c:1048) and held for the period
  (vtm3.c:1224-1250). Between those updates the coeffs are constant. Frame-to-frame parameter
  SMOOTHING is done UPSTREAM in the parameter generator (ph_* stage), not in the synth.
  (The only in-loop ramps are the silence rampdown vtm3.c:1673-1682 and COMPRESSION AGC.)

PORT:
- Qlatt schedules each param per frame into WebAudio AudioParams and **linearly interpolates
  between frames** via linearRampToValueAtTime: klatt-interpreter.ts:52 "Klatt 1980 — all
  parameters linearly interpolated between update frames"; ramp vs step chosen per binding
  (klatt-interpreter.ts:225-284, 412-436). Binary switches use setValueAtTime; most continuous
  params ramp.

VERDICT Q6: **GAP (location of smoothing differs).** VTM steps params at frame boundaries and
updates filter coeffs pitch-synchronously, with smoothing upstream. Qlatt does linear inter-frame
interpolation inside the audio graph and updates coeffs at WebAudio block boundaries (128 samples),
NOT pitch-synchronously. Different interpolation domain (sample-linear ramp vs pitch-sync step).
The audible consequence (glitch behavior at fast transitions) is UNKNOWN without measurement.

================================================================================
## Q7. DSP FEATURES IN VTM, ABSENT / DIFFERENT IN QLATT
================================================================================
Confirmed VTM features with NO port equivalent (file:line above unless noted):
1. 4x glottal-source oversampling + 2-pole decimation (vtm3.c:950-956,1366-1378). ABSENT.
2. Jitter — alternating-sign T0 perturbation (vtm3.c:1071-1075). ABSENT from impulse source.
3. Diplophonia / double-pulsing (Diplo, vtm3.c:1079-1098). ABSENT.
4. In-source breathiness (first-diff preemphasized noise) + aspiration mixed per-sample into
   voice (vtm3.c:901,1453-1457). Port mixes noise downstream, no first-diff preemphasis. DIFFERENT.
5. Glottal-phase HARD noise gate (noise>>=1 in 2nd half period, vtm3.c:937-938). Port uses a
   smooth sinusoidal open-phase envelope (glottal-mod-processor.ts:104-111). DIFFERENT.
6. Pitch-synchronous coefficient update at glottal close (vtm3.c:1048,1224-1250). Port updates at
   WebAudio block boundaries. DIFFERENT.
7. COMPRESSION AGC: per-sample lookup-table gain limiter raising avg level ~3 dB
   (vtm3.c:1700-1742, CompGainTable). Port uses a WebAudio DynamicsCompressorNode with fixed
   threshold/ratio (graph.yaml:457-464) — different algorithm. DIFFERENT.
8. Silence/limit-cycle rampdown when AV off (vtm3.c:1673-1682). Port has a cas_count/limit-cycle
   choke? NO — UNKNOWN; not seen in graph. Likely ABSENT.
9. F4/F5 conditional bypass + R5P drop at low sr (vtm3.c:1527-1549,1615). Port keeps all formants.
10. BRST parallel burst with two strengths (impulse>>6 / impulse>>2, vtm3.c:1661-1664). Port has
    PLSTEP edge-detector burst (graph.yaml:151-187, different mechanism). DIFFERENT.
11. Overload/tuning detection (getmax/checkmax, vtm3.c:1776-1838) — diagnostic only, not audio path.

Features that DO match: 2-pole resonator difference equation (vtmfunc.h:77-89 two_pole_filter ==
crates/resonator/src/lib.rs:42-49, identical y=a*x+b*y1+c*y2 with a=1-b-c); two_zero_filter form;
front-of-cascade nasal pole+zero; alternating-sign parallel sum; 20*log10 dB convention; a
spectral-tilt one-pole on the voiced source.

================================================================================
## GAP SUMMARY (ranked by likely audible impact — engineering judgement, UNMEASURED)
================================================================================
1. [HIGH] Glottal source model entirely different: KLGLOTT88 differentiated parabolic pulse
   (4x-oversampled, in-source tilt) vs doublet-into-resonator. This is the timbre core. (Q2,Q3)
2. [HIGH] In-source aspiration/breathiness mixing with first-diff preemphasis + hard glottal-phase
   noise gate vs separate downstream noise nodes with sinusoidal envelope. Affects voiced
   fricatives, breathy voices, /h/. (Q2, Q7#4-5)
3. [MED] Radiation modeled as explicit downstream filters (Chalker 2-term + first-diff) vs baked
   into the differentiated source. Net spectrum may or may not match — UNMEASURED. (Q4)
4. [MED] No jitter / no diplophonia in the port source — loss of natural/rough voice qualities and
   the characteristic DECtalk creak. (Q7#2-3)
5. [MED] Sample rate 11025 vs 48000 + no 4x source oversampling; different aliasing/brightness. (Q3)
6. [MED] Cascade F1-F6 vs VTM F1-F5; extra cascade pole changes high-formant balance. (Q1)
7. [LOW-MED] Inter-frame linear interpolation (sample-domain) vs pitch-sync stepped coeff update;
   transition micro-behavior differs. (Q6)
8. [LOW] AGC: WebAudio DynamicsCompressor vs VTM lookup-table per-sample limiter. (Q7#7)
9. [LOW] Parallel BW dynamic in port vs fixed constants in VTM; ndbScale shaping layer in port. (Q5)

================================================================================
## VERDICT ON "95% complete, only spectral tilt missing"
================================================================================
**FALSE (as stated).** Spectral tilt is in fact the ONE source feature that IS ported
(crates/tilt-filter, a one-pole LP equivalent to VTM's). The actual deltas at the DSP level are:
- The entire glottal SOURCE is a different model (parabolic-differentiated, 4x-oversampled, with
  jitter/diplophonia/in-source-noise-mix) vs a doublet-into-resonator impulse source.
- Radiation is applied at a different place (explicit downstream vs baked into source), with an
  extra Chalker 2-term correction that has no VTM analog.
- Sample rate, source oversampling, noise-gating shape, parameter-interpolation domain, AGC
  algorithm, cascade formant count, jitter, and diplophonia all differ.

The filter PRIMITIVES match well (resonator/antiresonator difference equations, dB convention,
cascade/parallel skeleton, nasal placement). So the synth is "Klatt-correct in its filter bank"
but NOT a faithful reproduction of DECtalk's VTM source+radiation+oversampling chain. A fairer
characterization than "95% / only tilt": the tract filterbank is largely faithful; the SOURCE and
the source/radiation/oversampling chain are substantially divergent, and several voice-quality DSP
features (jitter, diplophonia, in-source noise mixing, 4x oversampling) are entirely absent.

UNKNOWNS (need runtime/spectral measurement, not source reading):
- Whether net source*radiation spectrum is perceptually equivalent despite structural differences.
- Whether the dectalk semantics reproduces VTM's R1ca<<1 F1 boost and AV+4 offset.
- Exact -D macro set of the shipping 4.63 build (affects NEW_TILT vs legacy tilt branch).
