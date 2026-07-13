# Chunk dt-1b: dectalk-english DEFAULT voice = Paul (declarative)

Datestamp: 2026-05-29

## Mission
When `textToKlattTrack(text, baseF0, ms, {frontendId:"dectalk-english"})` is called with NO `speaker`
option, resolve the registry's DECLARED default voice (registry.default = "paul") via the SAME path
as explicit `speaker:"paul"`. Generic — uses registry.default (data), no hardcoded voice/frontend name.
Frontends WITHOUT a speakers registry (qlatt-english) keep current generic-profile default (unchanged).

## Observed state (HEAD working tree, branch dectalk-parity)
- `src/tts-frontend.ts` speaker-resolution block at lines 310-331 (current working tree numbers).
  - line 318: `let voiceRegistry = null;` (already declared — working-tree edit beyond dt-1 added it)
  - line 319: `if (typeof options.speaker === "string")` -> getVoiceRegistry -> resolveVoice -> override.
  - line 329-331: `else { speakerOverride = options.speaker; }`  <-- THIS is the no-speaker path
    (options.speaker undefined -> speakerOverride=undefined -> resolveSpeakerProfile uses generic
    profile base_f0 110). THIS is what I must change.
- `getVoiceRegistry(frontendSpec)` returns null when no `speakers:` block (qlatt-english) -> keep generic.
- `resolveVoice(registry, registry.default)` returns ResolvedVoice with override (incl base_f0_hz=122).
- dt1b probe `scripts/dt1b-default-vs-paul.ts` proved default vs paul = DIFFERENT (+12 Hz, base 110 vs 122).
- dt1 note quirk: dectalk default base_f0 was 110 (generic profile), Paul = 122. dt-1 deferred fixing it.

## Plan
In the `else` branch (options.speaker undefined): get voiceRegistry; if non-null, set
selectedVoice = resolveVoice(registry, registry.default) and speakerOverride = selectedVoice.override
(same code path as string case). If null (qlatt-english) -> speakerOverride = options.speaker (undefined),
unchanged. Object override case still handled (typeof !== string && options.speaker defined).

## Gate
explain + audio render + test:golden. NOT `npx vitest run` as gate (but run once to see shifts).
NO git add/commit. NO node -e.

## IMPLEMENTATION DONE
Single edit in src/tts-frontend.ts (+12 lines, the only src change). Added an
`else if (options.speaker === undefined)` branch BEFORE the existing object-override
`else`: get voiceRegistry; if non-null, selectedVoice = resolveVoice(registry, registry.default),
speakerOverride = selectedVoice.override. Generic — default name is registry data (registry.default),
no hardcoded "paul"/"dectalk". Setting BOTH selectedVoice and voiceRegistry means the downstream
speakerFrameParams / speakerGainOffsets / speakerParams merge (lines 645,655,730) and voiceSex
all apply to the default voice exactly as for explicit paul. Object-override case
(speaker defined, non-string) untouched -> still flows to final `else`.

## EVIDENCE (all DoD met)
DoD#1 default-now-Paul (real scripts):
- scripts/dt1b-default-vs-paul.ts: default vs explicit paul F0 contour now IDENTICAL
  (framesDiffering=0, maxAbsF0Delta=0; was +12 Hz / DIFFERENT before). verdict flipped.
- scripts/dt1b-default-resolution.ts (NEW kept probe): dectalk default (no speaker) ->
  resolved_base_f0_hz=122, f0_minimum=1100, f0_scale_factor=4100 == explicit paul. betty still
  distinct (208 / 1960 / 4920).
DoD#2 qlatt-english UNCHANGED:
- same probe: qlatt-english default (no registry) -> resolved_base_f0_hz=110, formant_scale=1,
  voiceSex undefined. getVoiceRegistry returns null (no speakers block) -> generic profile path,
  identical to before. The new branch only fires when a registry exists.
DoD#3 gates:
- vitest: 1119 passed / 126 files (was 1105/125 at dt-1; suite grew, ALL GREEN). NO dectalk
  snapshot/oracle broke from +12 Hz; NO baselines needed regenerating.
- explain "hello" --frontend dectalk-english --strict-citations: EXIT=0, uncited=0 (97 decisions).
- test:golden: EXIT=1 == baseline; ONLY failure is lf-source-wasm-compare (maxDelta 0.79),
  the pre-existing LF-source golden staleness documented in dt-1. resonator/antiresonator pass.
  No NEW golden failure. Audio render healthy (dt1b probe renders 168-frame track, voiced F0 77-128 Hz).
- tsc: src/tts-frontend.ts + src/dectalk-voice.ts CLEAN. 2 pre-existing errors in untouched TEST
  files (tts-frontend-rhotic-vowels.test.ts KlattFrame export; tts-frontend-snapshot.test.ts
  missing afterAll import) — not mine (git diff: only src/tts-frontend.ts changed, +12 lines).

## Contract note honored
Selected/default voice base_f0 wins over positional baseF0 arg: dt1b probe passes baseF0=110 yet
default resolves 122 (Paul). Parity-correct per spec. No hardcoding; declarative throughout.

## Hard-stops: NONE hit. No git add/commit. No node -e (all probes are real .ts scripts run via ts-node loader).

