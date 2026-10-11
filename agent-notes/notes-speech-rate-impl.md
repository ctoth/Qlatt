# Speech Rate Control Implementation

## Goal
Add comprehensive speech rate control to Qlatt TTS: duration scaling, F0 range compression, formant undershoot, transition scaling, and UI.

## Plan: 6 commits
1. Add `rate` to API + YAML defaults
2. Duration scaling via rate
3. F0 range compression at fast rates
4. Formant undershoot at fast rates
5. Transition duration scaling
6. Test harness UI — Rate control

## Status
- [x] Commit 1: 5192b41 — rate param + YAML defaults
- [x] Commit 2: 55f7ba8 — duration scaling (speech_rate_scaling, pause_rate_scaling rules)
- [x] Commit 3: 8e4f80d — F0 range compression (1/sqrt(rate) factor)
- [x] Commit 4: 00e0554 — formant undershoot (vowel_rate_undershoot rule)
- [x] Commit 5: faab224 — transition duration scaling (transitionMs/rate)
- [x] Commit 6: 4529f9a — UI rate slider

All golden tests pass after every commit. Zero regression confirmed.
