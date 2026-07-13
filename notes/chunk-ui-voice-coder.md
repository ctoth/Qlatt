# Chunk UI Voice Coder

2026-05-29

## Mission
Add (1) VOICE/speaker dropdown to dev-app UI (data-driven from frontend's declarative speakers registry), (2) auto-pair frontend dectalk-english -> experiment dectalk-english.

## Findings so far
- branch: dectalk-parity (confirmed)
- index.html: `#frontendSelect` (line 45, qlatt-english/dectalk-english), `#experimentSelect` (line 37, populated dynamically, default klatt80-baseline), `#speakBtn` (line 32). Need to add `#speakerSelect`.
- frontend.yaml (dectalk-english) `speakers:` block lines 34-101:
  - `dir: /rules/frontends/dectalk-english/speakers`
  - `default: paul`
  - `voices: [paul, harry, frank, dennis, betty, ursula, wendy, rita, kit, chris]`
  - The voice list IS the data source. qlatt-english presumably has NO speakers block -> hide/disable dropdown.
- `speaker` option resolved via registry in src/tts-frontend.ts (TextToKlattTrackOptions).

## Wiring confirmed (runtime)
- speak path: test/harness/runtime.js:49 calls `textToKlattTrack(phrase, baseF0, 30, { rate, frontendId })`. ADD `speaker` here.
- frontendId read from `#frontendSelect` (runtime.js:47).
- textToKlattTrack `options.speaker` (string voice name) resolved via registry internally (tts-frontend.ts). Frontend without registry + string speaker -> throws E_VOICE_REGISTRY_MISSING, so only pass speaker when a voice is selected.
- experiment manifest HAS `dectalk-english` experiment (id == frontend id). klatt80-baseline default. Auto-pair = if experiment option id == frontend id, select it + fire change.
- onExperimentChange clears cached runtime config so graph reloads.
- frontend.yaml fetchable at /rules/frontends/<id>/frontend.yaml via loadYamlDocumentOrNull (browser fetch).
- qlatt-english frontend.yaml: NO speakers block -> dropdown hidden.

## Implemented so far
- index.html: added `#speakerLabel`/`#speakerSelect` (hidden by default) next to frontend select.
- test/harness/speaker.js: NEW. refreshSpeakerOptions() fetches frontend.yaml, reads speakers.{default,voices}, populates dropdown, defaults to registry default; hides+disables when no registry. getSelectedSpeaker() returns null when hidden/disabled.
- test-harness.js: import speaker module; pairExperimentToFrontend() (generic id-match auto-pair); on load + on frontendSelect change -> pair + refreshSpeakerOptions.

## DONE
- runtime.js: passes speaker:getSelectedSpeaker() into textToKlattTrack only when non-null.
- scripts/ui-voice-wire-check.ts: ALL CHECKS PASSED. paul base_f0=122 vs betty 208, distinct F0 contours. dropdown-default(paul)==paul profile. qlatt-english no-speaker renders 35 frames.
- KEY FINDING: omitting `speaker` != registry default. Omit -> falls through to numeric baseF0 arg (110); speaker="paul" -> 122. That's WHY the dropdown explicitly selects the default (paul) rather than relying on omission. UI only omits speaker for qlatt (no registry). Documented in script + comments.
- typecheck: scripts/ui-voice-wire-check.ts produces ZERO tsc errors (typecheck:scripts). The ONE error (src/worklets/wasm-utils.ts:113 SharedArrayBuffer) is PRE-EXISTING — reproduced with my script removed entirely; untouched by this work.

## VERIFICATION COMPLETE
- node --check: test-harness.js, speaker.js, runtime.js all OK (clean syntax).
- `npx vite build`: 91 modules transformed, dist/ produced (index.html + main.js bundle), built in ~1.2s -> app bundles/loads with my files included.
- `npm run build` (full) fails ONLY at prebuild build:worklets tsc on src/worklets/wasm-utils.ts:113 (SharedArrayBuffer vs ArrayBuffer lib-typing) — PRE-EXISTING, untouched by me, reproduced with my files removed. Bypassed via `npx vite build` to prove the actual bundle is clean.

## How the user selects a voice
1. Pick "DECtalk 4.63 English" in the Frontend dropdown -> Voice dropdown appears (populated paul/harry/.../chris from frontend.yaml `speakers.voices`), defaults to paul; experiment auto-switches to dectalk-english graph.
2. Pick a voice (e.g. betty) in the Voice dropdown.
3. Click Speak. runtime.speak() reads getSelectedSpeaker() and passes `speaker:"betty"` to textToKlattTrack.
4. Switching back to Qlatt English hides the Voice dropdown (no registry) and auto-pairs back to whatever experiment matches (klatt80-baseline stays, since no experiment id == "qlatt-english").

## Files changed (mine only)
- M index.html (added #speakerLabel/#speakerSelect)
- M test/test-harness.js (import speaker module; pairExperimentToFrontend; frontendSelect change handler)
- M test/harness/runtime.js (import getSelectedSpeaker; pass speaker into textToKlattTrack when non-null)
- A test/harness/speaker.js (registry-driven dropdown population)
- A scripts/ui-voice-wire-check.ts (wiring proof)
- A notes/chunk-ui-voice-coder.md
NOTE: public/worklets/wasm-utils.js (M) and tmp-tilt/ are OTHER agents' work on this shared branch — NOT touched by me. No git add/commit performed.

## still reading (done)
- test/test-harness.js (entry), test/harness/controls.js, test/harness/runtime.js: speak handler, how frontendId/experimentId read + passed to synth, onExperimentChange.
- how frontend.yaml loaded by harness (to read speakers registry generically).
- src/tts-frontend.ts speaker option threading.
