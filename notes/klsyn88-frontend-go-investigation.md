# klsyn88 frontend GO investigation

Read-only investigation. No code edited, nothing committed.

## TL;DR verdict

Raising the **shared** `qlatt-english` base_param `GO` is **NOT a safe, isolated change** and, as measured through `compare-klsyn88.ts`, **does not even close the gap** (the bridge co-moves the oracle). Two independent problems:

1. **Blast radius:** `qlatt-english`'s `GO=47` is shared by *both* the `klsyn88` experiment *and* the default `klatt80-baseline` experiment. `klatt80-baseline` is deliberately calibrated to `GO=47` (its `ndbScale` offsets are `-47` "to compensate for G0 default of 47"). Globally raising `GO` shifts `klatt80-baseline` output by the same dB and breaks that calibration + the `hello-world` golden that `test:golden` actually runs.
2. **The bridge trap (confirmed):** `compare-klsyn88.ts` calls `framesToDoc(..., mapGO=true)` by default, so it feeds the **same GO** into the reference oracle. Whatever GO the frontend uses, the oracle matches it, and the reported gap stays a constant **~+2 dB** — that residual is the intrinsic **LF vs KLGLOTT88 source-model** difference, not a gain error. Raising GO never closes it in the default comparison.

The real ~13 dB shortfall only appears when the oracle is held at its **published native default `g0=60`** (`--no-map-go`). To match *that* reference, qlatt needs `GO≈60` — which is exactly the `klsyn88` backend's own default that the frontend is currently overriding.

**Recommendation:** do not raise the shared base_param. Instead **stop `qlatt-english` from overriding GO for the klsyn88 experiment** (drop `GO` from `qlatt-english` base_params, or make it experiment-scoped) so each experiment uses its own semantics default: `klatt80-baseline → 47` (unchanged), `klsyn88 → 60` (correct). See "Recommended fix" below.

---

## 1. WHERE is GO=47 set?

`C:\Users\Q\code\Qlatt\public\rules\frontends\qlatt-english\inventory.yaml:81`

```
80    NFC: 5
81    GO: 47
```

It lives in the frontend's `base_params:` block (lines 21–81), so it is injected into **every** track frame for **any** experiment driven by `qlatt-english`. Confirmed in the rendered track: all 19 frames of "she sees a dog" carry `GO=47`.

`dectalk-english` has its **own** separate `GO: 47` at `public\rules\frontends\dectalk-english\inventory.yaml:62` (independent file).

## 2. BLAST RADIUS — what GO feeds

GO is a **pure linear output scalar**: `gain0Linear` (semantics) is bound to a `gain` node in the graph (`public\experiments\klsyn88\graph.yaml:334`), so output level scales monotonically with GO. The two backends consume the same frontend GO very differently:

- **klsyn88** (`public\experiments\klsyn88\semantics.yaml:163-168, 596-609`): own default `GO=60` ("manual Table I g0 default 60"), `gain0Db = (GO-3) <= 0 ? 57 : (GO-3)`. Frontend `GO=47` ⇒ `gain0Db=44`, i.e. **13 dB below** the published `g0=60 ⇒ 57 dB` reference. The frontend value overrides the now-correct backend default.
- **klatt80-baseline** (`public\experiments\klatt80-baseline\semantics.yaml:24-37, 393-396`): own default `GO=47`; `ndbScale` source offsets are `-47` "to compensate for G0 default of 47 so that G0 functions as overall gain control while preserving Klatt 80 levels." GO=47 is the **calibration anchor** here. `voiceGain = dbToLinear(GO + AV + ndbScale.AV)` — GO is additive in the exponent, so any change directly rescales klatt80 output and de-calibrates the `-47` compensation.

**`render-phrase.ts` defaults: frontend `qlatt-english`, experiment `klatt80-baseline`.** So the everyday render path and `test:golden` exercise klatt80-baseline with this shared GO.

**Is qlatt-english separate from the active "convergence/DECtalk" tuning? YES — confirmed separate.**
- The convergence harness `scripts\oracle\run-corpus.ts:350-360` renders with `frontendId: entry.frontendId ?? "dectalk-english"`.
- The only corpus, `test\oracle-corpora\dectalk-us-v1.json`, sets `"frontendId": "dectalk-english"` (the lone frontendId in the corpus).
- The `fix(convergence): iteration NNN` commits in git log are DECtalk-oracle work on `dectalk-english`, which has its own inventory/GO.
- Changing `qlatt-english` GO does **not** touch `dectalk-english` and does **not** affect the convergence harness.

## 3. GOLDENS / METRICS that would shift

- **`test:golden` (the real gate):** `scripts\run-golden.ts` runs `render-phrase.ts` with defaults ⇒ `qlatt-english` + `klatt80-baseline`, phrase "hello world", sample-exact compare vs `test\golden\phrase-hello-world.json`. Raising the shared GO changes klatt80-baseline output level ⇒ **`test:golden` FAILS**, requires `--write-golden 1` re-baseline.
- **`track-gains.test.ts`** (`test\analysis\track-gains.test.ts`): uses `GO: 47` as **hardcoded literals in its own test inputs**, not read from the inventory ⇒ **NOT affected** by an inventory change. (vitest is not the project's audio gate anyway.)
- **`ling-*-track.json` and `linguistic-master/*/track.json`** bake `GO=47` into every frame (e.g. 12 occurrences in `ling-1-track.json`, 23 in `say-oh-ee-and-oo-again/track.json`). They are derived qlatt-english fixtures. `run-golden.ts` does **not** run them, so they would go stale but would not fail the gate; they'd still need regeneration to stay accurate.
- **Convergence harness / oracle-corpus metrics:** keyed to `dectalk-english`, **unaffected**.

## 4. RIGHT VALUE — empirical measurement ("she sees a dog", 22050 Hz render, oracle @16000)

Rendered `qlatt-english`+`klsyn88` once at the current `GO=47`; measured raw-sample peak/RMS dBFS. Oracle run two ways. GO sweep computed analytically because GO is a pure final-output scalar (`gain0Linear` on a gain node), verified against `dbToLinearKlsyn` table.

```
MEASURED (dBFS):
  qlatt klsyn88 GO=47   peak -18.51   rms -29.79
  oracle g0=47 (mapGO)  peak -16.49   rms -28.42   <- compare-klsyn88.ts DEFAULT
  oracle g0=60 (native) peak  -3.41   rms -15.33   <- published reference (--no-map-go)

QLATT level at GO=X vs oracle's NATIVE g0=60 reference:
GO  gain0Db  ΔdB     qPeak   qRms   | gap (peak / rms)
47    44      0.00  -18.51 -29.79 |  +15.10 / +14.46
48    45     +1.04  -17.46 -28.75 |  +14.05 / +13.42
49    46     +1.95  -16.56 -27.85 |  +13.15 / +12.52
50    47     +2.93  -15.58 -26.87 |  +12.17 / +11.54
51    48     +3.98  -14.52 -25.81 |  +11.12 / +10.48
55    52     +7.97  -10.54 -21.83 |   +7.13 /  +6.50
57    54    +10.01   -8.49 -19.78 |   +5.08 /  +4.45
60    57    +13.09   -5.42 -16.71 |   +2.01 /  +1.38
```

Interpretation:
- The user's "~2 dB quieter" is the **mapGO=true** comparison (oracle at g0=47): gap **+2.01 / +1.38 dB**. That residual is **intrinsic** (Qlatt LF source vs klsyn KLGLOTT88; OQ deliberately not mapped — see `klatt-frames-to-doc.ts:60-73`). It is **independent of the gain knob** and cannot be closed by GO.
- Against the oracle's **published native level (g0=60)**, qlatt at GO=47 is **~15 dB low**. The proposed 47/49/50/51 sweep closes only 0–4 dB of that — far too small.
- The GO that minimizes the gap to the published reference is **GO≈60** (the klsyn88 backend's own default), landing at +2.01/+1.38 dB — i.e. the irreducible source-model residual, *the same number* the mapGO comparison shows. That is the floor; no GO does better.

**The gap is therefore part gain (≈13 dB, closeable by using GO=60) and part intrinsic (≈2 dB source-model, not closeable by GO).**

**Confirmation of the bridge trap:** at qlatt GO=60 vs oracle-native-g0=60 the gap (+2.01/+1.38) is identical to qlatt GO=47 vs oracle-mapGO-g0=47 (+2.01/+1.38). Whenever frontend GO and oracle g0 are equal, only the ~2 dB source-model residual remains. So `compare-klsyn88.ts` in its **default mode will report ~2 dB no matter what GO you pick** — you must use `--no-map-go` (oracle held at native g0=60) to see GO actually close the level gap.

---

## Recommended fix (and why "raise qlatt-english GO" is the wrong lever)

Raising the shared `qlatt-english` base_param GO to 60:
- de-calibrates `klatt80-baseline` (+13 dB, violates its `ndbScale -47` design),
- breaks the `hello-world` golden (needs re-baseline),
- and, via the mapGO bridge, **does not change** what `compare-klsyn88.ts` reports.

**Preferred: make GO experiment-scoped instead of a shared frontend constant.** Remove `GO` from `qlatt-english` base_params (or override it only for the klsyn88 path). Then each experiment falls back to its own semantics default: `klatt80-baseline → 47` (byte-identical, golden safe), `klsyn88 → 60` (correct published level). This is surgically isolated and touches neither klatt80 calibration nor dectalk convergence.
- **Verify before relying on it:** confirm that when the track omits `GO`, the interpreter uses each experiment's `default:` (47 / 60). The semantics `default:` fields exist for exactly this, but it should be checked with a render (klatt80 `hello-world` byte-identical to golden; klsyn88 frame GO=60).

**If a single frontend GO must stay shared** and the goal is "klsyn88 matches the oracle's published level," the value is **GO=60**, but that path requires full re-baselining (below) and is not isolated — not recommended.

### What re-baselining would require (only if the shared value is changed)
1. `npm run test:golden` will fail on `phrase-hello-world`; regenerate with `render-phrase.ts ... --write-golden 1` and review the level delta.
2. Regenerate the qlatt-english-derived fixtures that bake GO (`test/golden/ling-*-track.json`, `test/golden/linguistic-master/*/track.json`).
3. Re-confirm klatt80-baseline loudness is still intended after the GO/`ndbScale` interaction shifts (the `-47` compensation assumes GO=47).
4. Validate the klsyn88 level fix with `compare-klsyn88` **using `--no-map-go`** (default mapGO mode will keep reporting ~2 dB).
5. No action needed for the DECtalk convergence harness — it uses `dectalk-english`.

## Files referenced
- `public\rules\frontends\qlatt-english\inventory.yaml:81` (GO=47, shared base_param)
- `public\rules\frontends\dectalk-english\inventory.yaml:62` (separate GO=47)
- `public\experiments\klsyn88\semantics.yaml:163-168, 596-609` (GO default 60; gain0Db/gain0Linear)
- `public\experiments\klsyn88\graph.yaml:334` (gain0Linear bound to gain node — GO is a pure output scalar)
- `public\experiments\klatt80-baseline\semantics.yaml:24-37, 393-396` (GO default 47; ndbScale -47 G0 compensation)
- `scripts\render-phrase.ts:23-24` (defaults: frontend qlatt-english, experiment klatt80-baseline)
- `scripts\oracle\compare-klsyn88.ts` (default mapGO=true → co-moves oracle)
- `scripts\oracle\klatt-frames-to-doc.ts:52-73, 162-187, 212-213, 253, 264-265` (g0<-GO mapping; mapGO knob)
- `scripts\oracle\run-corpus.ts:341-360` + `test\oracle-corpora\dectalk-us-v1.json:8` (convergence harness = dectalk-english only)
- `scripts\run-golden.ts` (test:golden = render-phrase hello-world via klatt80-baseline)
- `test\analysis\track-gains.test.ts` (GO=47 hardcoded literals; unaffected by inventory change)
