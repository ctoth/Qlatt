# QLATT Status

## Checkpoint (post CMUDICT + audible output)
- CMUDICT is bundled into `src/cmu-dictionary.js` via `scripts/build-cmudict.js`.
- LF source + cascade path produces audible speech; roughness remains on non-vowel-heavy phrases.
- Current routing: cascade-only output (SW=0 in track); parallel branch exists but not auto-enabled.
- Output scaling: Klatt dB mapping via `2^(dB/6)` with global outputScale in `src/klatt-synth.js`.
- Diagnostics: test harness shows telemetry (per-node RMS/peak with per-run max).

## Known Issues
- Fricatives/affricates/stop releases sound weak or smeared without the parallel branch.
- Prosody is basic (linear fall + simple stress bump).

## Next Planned Changes
- Auto-enable SW for fricatives/affricates/stop releases with a cascade blend. (done)
- Add coarticulation smoothing between adjacent phoneme targets. (done)
- Improve F0/prosody rules for more natural phrasing. (done)

## Recent Changes
- SW routing: `src/tts-frontend.js` sets `SW=1` for fricatives/affricates/stop releases.
- Blend control: `src/klatt-synth.js` uses `parallelMix` (default 0.6) when `SW=1`.
- Coarticulation: `src/tts-frontend.js` now inserts a steady-time event and blends formants toward the next segment near boundaries.
- Prosody: `src/tts-frontend-rules.js` now resets declination per punctuation phrase, adds an initial boost, and uses phrase-local fall for F0.
- Diagnostics: `test/test-harness.html` adds per-path meters (cascade/parallel/output) with max RMS/peak and SW time share.
- Fix: `src/klatt-synth.js` no longer overwrites `parallelMix` when automating SW, so parallel output is audible when SW=1.
- Fix: `src/klatt-synth.js` scales parallel branch gains (`parallelGainScale`, default 0.003) and ramps SW mix to reduce clicks.
- Diagnostics: spike capture added (peak > 1.0) with time/node/phoneme tags in the harness.
