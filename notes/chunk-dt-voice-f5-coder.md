# dt-voice-f5 — stamp per-voice F5/B5 (gap-4 #1)

2026-05-30. After dt-vtm1/1b (KLGLOTT88 source). "go go go". Fix gap-4 #1: F5/B5 never
stamped → all voices use inventory default F5=4500/B5=600; Paul gets spurious active F5;
5 voices (Harry/Kit/Rita/Wendy/Dennis) ignore their real F5.

## EDIT
- frontend.yaml speaker_frame_params: added F5, B5 (+ corrected the factually-wrong comment
  that claimed "every voice F5=6000 identical"). Generic stamp loop, no per-voice TS.
- Voice YAMLs already carry real per-voice F5/B5 (verified): harry 3850/180, kit 4700/600,
  rita 4800/700, wendy 4800/600, dennis 3800/280; paul/betty/frank/ursula 6000/6000 (ZAPF
  sentinel = disabled; cascade F5 has no bypassAtZero so 6000/6000 renders as ≈flat resonator).
- Paul NO LONGER byte-identical here BY DESIGN (4500→6000 = matches real DECtalk Paul, no F5).
  HS head-size F4/F5 scaling = separate follow-up (stamped raw).

## VERIFIED
- Per-voice stamp works (scripts/dt-voice-f5-check.ts): voiced frames paul F5=6000, kit 4700,
  harry 3850/B5 180, rita 4800/700, betty 6000. (Stray 4500 only on silent SIL/lead frames.)
- Paul render healthy: sourceMode=3 peak=0.8529 (was 0.8447) brightness=0.5561 (was 0.5566),
  bounded, no NaN, no explosion. F5 removal had small effect (correct).

## GOLDEN INVESTIGATION (in progress)
- npm run test:golden exit=1. BUT the 3 deltas shown (0.0000018 resonator, 0.00222 antiresonator,
  0.79 lf-source) are IDENTICAL to before my change. 0.79 lf-source = pre-existing orthogonal
  failure documented across all 27 dectalk-parity commits ("golden red ONLY on lf-source-wasm-
  compare"). Phrase render NOT in failure list. Need to CONFIRM exit 1 is pre-existing (not my
  change) with hard evidence, not faith — checking golden log / phrase render byte-identity.

## GOLDEN RESOLVED (hard evidence)
- run-golden runs 3 scripts; failed=true if any fails -> exit 1.
- render-phrase (qlatt-english) STANDALONE exit=0 -> qlatt byte-identical, my change clean.
- lf-source-wasm-compare STANDALONE exit=1 (0.79) -> THE failure; crate-vs-reference, independent
  of dectalk frontend.yaml = pre-existing (documented all 27 commits). NO new failure. F5 clean.

## dt-voice-f5 COMMITTED dd002645. explain dectalk kit 190 dec 0 uncited.

## F7/F8 NOT a quick win: no inventory/graph binding (cascade is F1-F6) -> dead stamp; graph surgery.
## REMAINING (need research or Q ear): BR->aturb (ph_vset.c:786 formula + ear); HS F4/F5 scaling
   (ph_vset.c:712); F7/F8 cascade nodes; gap-2 smoothing coverage (#1 lever, big/baseline-shifting).
