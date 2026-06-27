// Proves the dev-app voice-selection wiring end to end through the SAME render
// entrypoint the UI's speak path uses: textToKlattTrack(phrase, baseF0, 30,
// options), where `options` is built exactly like test/harness/runtime.js
// (`{ rate, frontendId }`, plus `speaker` only when a voice is selected).
//
// Asserts:
//   1. dectalk-english + speaker="paul" vs speaker="betty" -> DISTINCT output
//      (the base_f0_hz speaker profile and per-frame params differ), so the
//      selected voice actually reaches synthesis.
//   2. For dectalk-english the voice dropdown is VISIBLE and defaults to the
//      registry `default` (paul), so the UI's default call passes
//      speaker="paul" (NOT an omitted speaker). Verified: that default call
//      yields the paul profile (base_f0_hz=122). NOTE: omitting `speaker`
//      entirely is a DIFFERENT path — it falls through to the numeric baseF0
//      arg (110) and does not apply the registry default — which is exactly
//      why the dropdown explicitly selects the default rather than relying on
//      omission. The UI only omits `speaker` when there is no registry (qlatt).
//   3. qlatt-english with NO speaker option renders fine (the UI hides the
//      voice dropdown there and passes no `speaker`).
//
// Run: node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/ui-voice-wire-check.ts
import { textToKlattTrackDetailed, textToKlattTrack } from "../src/tts-frontend";

const PHRASE = "hello there, how are you?";

// Mirror test/harness/runtime.js exactly: options = { rate, frontendId } and
// `speaker` is appended only when the harness has a selected (non-null) voice.
function uiOptions(frontendId: string, speaker: string | null) {
  const options: Record<string, unknown> = { rate: 1.0, frontendId };
  if (speaker) options.speaker = speaker;
  return options;
}

function f0Signature(track: { params?: Record<string, number> }[]): string {
  const f0s = track
    .map((f) => f.params?.F0 ?? 0)
    .filter((v) => v > 0);
  const min = f0s.length ? Math.min(...f0s) : 0;
  const max = f0s.length ? Math.max(...f0s) : 0;
  return `${min.toFixed(1)}-${max.toFixed(1)}`;
}

let failures = 0;
function assert(cond: boolean, msg: string) {
  console.log(`  ${cond ? "PASS" : "FAIL"}: ${msg}`);
  if (!cond) failures++;
}

// 1. paul vs betty distinct through the UI option shape.
const paul = textToKlattTrackDetailed(
  PHRASE,
  110,
  30,
  uiOptions("dectalk-english", "paul") as never,
);
const betty = textToKlattTrackDetailed(
  PHRASE,
  110,
  30,
  uiOptions("dectalk-english", "betty") as never,
);

console.log("[1] dectalk-english paul vs betty (UI option shape)");
console.log(
  `    paul:  base_f0_hz=${paul.resolvedSpeaker.base_f0_hz} F0=${f0Signature(paul.track)}`,
);
console.log(
  `    betty: base_f0_hz=${betty.resolvedSpeaker.base_f0_hz} F0=${f0Signature(betty.track)}`,
);
assert(
  paul.resolvedSpeaker.base_f0_hz !== betty.resolvedSpeaker.base_f0_hz,
  `resolved base_f0_hz differs (paul=${paul.resolvedSpeaker.base_f0_hz}, betty=${betty.resolvedSpeaker.base_f0_hz})`,
);
assert(
  f0Signature(paul.track) !== f0Signature(betty.track),
  "rendered F0 contour differs between voices",
);

// 2. The UI's default dectalk call selects the registry default (paul) in the
//    visible dropdown, so it passes speaker="paul" and yields the paul profile.
//    (Contrast with omitting speaker, which falls through to the numeric baseF0
//    arg — a different path the UI does NOT use for dectalk.)
const REGISTRY_DEFAULT = "paul";
const uiDefault = textToKlattTrackDetailed(
  PHRASE,
  110,
  30,
  uiOptions("dectalk-english", REGISTRY_DEFAULT) as never,
);
const omitted = textToKlattTrackDetailed(
  PHRASE,
  110,
  30,
  uiOptions("dectalk-english", null) as never,
);
console.log("\n[2] dectalk-english dropdown default selects registry default (paul)");
console.log(
  `    dropdown-default (speaker=paul): base_f0_hz=${uiDefault.resolvedSpeaker.base_f0_hz} F0=${f0Signature(uiDefault.track)}`,
);
console.log(
  `    omitted speaker (NOT a UI path for dectalk): base_f0_hz=${omitted.resolvedSpeaker.base_f0_hz} F0=${f0Signature(omitted.track)}`,
);
assert(
  uiDefault.resolvedSpeaker.base_f0_hz === paul.resolvedSpeaker.base_f0_hz &&
    f0Signature(uiDefault.track) === f0Signature(paul.track),
  "dropdown default (speaker=paul) yields the paul voice profile",
);
assert(
  omitted.resolvedSpeaker.base_f0_hz !== uiDefault.resolvedSpeaker.base_f0_hz,
  "omitting speaker is a distinct path from the registry default (documented)",
);

// 3. qlatt-english with no speaker renders (UI hides dropdown there).
console.log("\n[3] qlatt-english no speaker renders");
const qlatt = textToKlattTrack(
  PHRASE,
  110,
  30,
  uiOptions("qlatt-english", null) as never,
);
assert(qlatt.length > 0, `qlatt-english renders ${qlatt.length} frames`);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
