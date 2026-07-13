# L1 cadence divergence: DECtalk vs Qlatt dectalk-english

Analysis only. No code written. Source-verified against C:\Users\Q\src\dectalk\463 and C:\Users\Q\code\Qlatt.

## DECtalk's actual duration model (verified)

Durations are **integer control frames** from `p_us_tim.c:212` onward. Milliseconds do not
survive past line 213.

```
durinh = ((inh_timing(ph) * 10) + 50) >> 6      p_us_tim.c:212   round(ms / 6.4)
durmin = ((min_timing(ph) * 10) + 50) >> 6      p_us_tim.c:213
prcnt  = 128                                    p_us_tim.c:219   1.0 in 1/128 fixed point
deldur = 0                                      p_us_tim.c:217   integer FRAMES
  ... rules: prcnt = mlsh1(prcnt, N85PRCNT)     (x*y)>>14, floor   ph_defs.h:794
  ... rules: deldur += NF20MS   (== 3 FRAMES)                      ph_defs.h:437
durxx  = ((prcnt * (durinh - durmin)) >> 7) + durmin   p_us_tim.c:897-901
durxx  = mlsh1(durxx, sprat2) + 1                      p_us_tim.c:916  (rate only)
durxx += deldur                                        p_us_tim.c:927
allodurs[nphon] = durxx                                p_us_tim.c:943  INTEGER FRAMES
```

Key: `deldur` is a **separate accumulator**, applied once at :927, AFTER the multiplicative
formula. It is never multiplied by `prcnt`. Rule 2 *assigns* it (`deldur = NF40MS`, :284/289/293/301),
it does not accumulate.

## DECtalk's emission

- `phclause` while(TRUE) `ph_claus.c:367` — one iteration = one frame; `tcum` vs `durfon` :383.
- `phsettar` `ph_setar.c:315` at each phone boundary — blends **tarnex** (successor) into tarcur:
  `ph_setar.c:384` (`getbegtar(nphone+1)`), `:605`, `:615` → 90% self / 5% prev / 5% next.
  So frame 0 of a phone is ALREADY successor-conditioned.
- `phdraw` `ph_draw.c` — draws every param every frame: forward transition :367-374,
  backward transition into successor :376-383, V-V F2 coartic :385-396, diphthong :359-365.
- `send_pars` `ph_claus.c:746` → `spcwrite` `:825`. ONE packet/iteration, `VOICE_PARS=45` shorts.
  - 1-frame skew: packet k = formants(frame k) + AV/TLT/T0(frame k+1). `ph_claus.c:754-757, 770-792, 832-883`.
  - First call emits NOTHING (`initpardelay`, `ph_claus.c:759-767`) ⇒ packets = Σallodurs − 1.
  - `initpardelay` is per-HANDLE, not per-clause ⇒ first packet of clause k+1 carries clause k's tail.
- Packet carries metadata: `OUT_PH`=allophone, `OUT_DU`=allodurs in FRAMES, `OUT_PH2`=next allophone
  (`ph_claus.c:453-460`, `ph_defs.h:559-604`). **The existing trace already exposes allodurs.**
- VTM `speech_waveform_generator` `vtm1.c:255`, loop `vtm1.c:619` — exactly 71 samples/packet,
  `uiNumberOfSamplesPerFrame = 71` `vtm1.c:1891`, 11025 Hz `vtmio.c:261-262`.
  Params HELD constant across the 71 samples (zero-order hold); biquads re-derived pitch-synchronously
  from unchanged targets `vtm1.c:781, 973-975`. No sub-frame ramp.

## The two-constant trap

- Frame COUNTING uses nominal **6.4 ms** (`mstofr` = `*10 >> 6`, `ph_task.c:1380`; and `>>6` at p_us_tim.c:212).
- Frame RENDERING uses **71/11025 = 2840/441 = 6.43990929… ms** (`vtm1.c:1891`).
- The `MSTOFR` macro (`ph_defs.h:413`) implies a third value (7.1 ms) and is **never called** — dead. Do not port.
These are different numbers on purpose-by-accident. Unifying them breaks exactness.

## Qlatt today (verified)

- `duration` is a float ms scalar, `Math.round`ed to integer ms after EVERY rule effect:
  `rule-engine.ts:754-755`, `:793` (add), `:797` (klatt mul: `round(f*(cur-floor)+floor)`).
  ⇒ add and mul mutate the SAME field in phase order, so `add` rules get multiplied by later `mul`s.
  DECtalk never does this.
- Global time = `elapsedMs += duration` float accumulator, `rule-engine.ts:1493, 1509` → axis marks.
- Lowering emits SPARSE event frames, `time` in seconds: `lowering.ts:1676-1680`
  (`time: outputTimeMs / 1000`). Event points = segment start / control window / transition / F0 anchor
  (`lowering.ts:1695-1734`). No frame grid anywhere in src/. `11025`/`71` appear only in scripts/oracle/.
- `initial_silence_ms: 19.2` (frontend.yaml:601) = 3 × nominal 6.4. DECtalk instead computes
  clause-initial pause as a RULE: 4 or 5 frames depending on the FOLLOWING phone's features
  (`p_us_tim.c:229-236`). Two defects: wrong count, and not successor-conditioned.

## The 60.7396825 ms

`compare-trace.ts:448` `durationDeltaSec = qlattLast - oracleDuration`.
Oracle = 217 packets × 71/11025 s = 1397.4603175 ms. Qlatt = 19.2 + 1439 (integer ms sum) = 1458.2 ms.
Difference = 60.7396825 ms exactly. Confirms: incommensurable grids, not a harness artifact.

## Blocker / prerequisite

Per-phone comparison is meaningless unless Qlatt's segment sequence == DECtalk's `allophons[]`
sequence (ph_sort.c inserts GEN_SIL, USP_Q glottal stops, etc). `compare-trace.ts`
`oraclePhoneGroups` vs `qlattTrackRuns` is the alignment gate and must be green FIRST.
