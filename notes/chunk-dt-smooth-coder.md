# dt-smooth — universal midpoint smoothing fallback (gap-2 #1)

2026-05-31. "keep going". gap-2 #1: midpoint blend fires only sonorant<->sonorant + ~25 obstruent
loci; obstruent-adjacent/no-locus boundaries + B1-B3 at obstruent boundaries get NO transition.
DECtalk smooths every param at every boundary (p_us_st1.c forw/back rules, default 50% midpoint).

## KEY RISK RESOLVED
- blend keys = [F1,F2,F3,B1,B2,B3] ONLY (frontend.yaml:596). Amplitudes AF/AH/PLSTEP (bursts) are
  NOT smoothed -> universal fallback CANNOT mush stop bursts. Only formant/bw trajectories smooth.
  Over-smooth-stops fear was largely unfounded.
- midpointBoundaryResolver is edge-agnostic (symmetric midpoint toward neighbor); forward/backward
  differ only in WHICH neighbor (prev/next) + WHERE the steady time sits. resolveBoundaryParams
  already plumbs "forward" (built for "a later chunk" = this one).

## IMPLEMENTED (data-gated, qlatt-safe)
- track-assembler.ts: added blend.smooth_all_boundaries?:boolean to TrackLoweringSpec type; read it
  (smoothAllBoundaries); after the existing forward/backward logic, FALLBACK: if backwardParams null
  & next -> midpoint backward toward next; if forwardParams null & i>0 -> midpoint forward from prev
  (candidate clamped vs backwardSteadyTime). Gated by flag + phTransitionSec>0.
- frontend.yaml (dectalk): smooth_all_boundaries: true. qlatt-english omits -> byte-identical.

## TO VALIDATE
- qlatt byte-identical (render-phrase exit 0) — flag-off path must be unchanged.
- dectalk: transitions now appear at obstruent boundaries (frame inspection: more event points /
  smoothed F2 into fricatives); burst amplitudes (AF) unchanged; output bounded/no-NaN.
- A/B WAVs flag on vs off for Q's ear.
- adversary (engine TS touched) for declarativity.
- RISK if regresses: one-line revert (smooth_all_boundaries: false). Crude uniform 30ms (not
  per-param durtran) — faithful version = future chunk if Q likes direction.

## VALIDATION RESULTS
- qlatt byte-identical (render-phrase exit 0). Flag-off path unchanged. ✓
- dt-smooth peak-NEUTRAL: "the quick brown fox" flag on vs off = SAME peak 1.8288 (smoothing doesn't
  add gain; brightness 0.41->0.39 = transitions smoothed, the intended effect). ✓
- dt-smooth does NOT cause clipping.

## SEPARATE FINDING: PRE-EXISTING dectalk CLIPPING (not dt-smooth, not solely KLGLOTT88)
- Sonorant-heavy phrases clip on BOTH sources: "I owe you a yoyo" impulse peak 1.69 / KLGLOTT88 2.25;
  "we were away a year ago" impulse 1.38 / KLGLOTT88 2.01; "fox" impulse 0.76 / KLGLOTT88 1.83.
- So clipping is PRE-EXISTING (impulse clips too); KLGLOTT88 ~1.3x worse. Tangled with masterGain=228
  (explain telemetry) + outputCompressor not limiting (post-render peak >1). = dectalk master-level
  calibration issue. Loudness target is perceptual -> needs Q ear. FLAG to Q, separate chunk.

