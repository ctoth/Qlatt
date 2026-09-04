// dt-7a timbre probe: verifies that the selected DECtalk voice's higher-formant
// timbre (F4/B4) is stamped onto every frame via the generic data-declared
// speaker_frame_params mechanism (frontend.yaml `speakers.speaker_frame_params`).
//
// Renders a vowel-rich phrase with speaker=paul, speaker=betty, and no speaker
// (default), then prints F4/B4/F5/B5 for the first vowel frame of each.
//
// Expected (per inventory base_params F4=3500/B4=260/F5=4500/B5=600):
//   - default (no speaker): inventory defaults (F4=3500, B4=260).
//   - paul: byte-identical to default for F4/B4 (Paul voice F4=3500/B4=260).
//   - betty: F4=4550, B4=400 (Betty voice values, absolute, NOT *formant_scale).
//   F5/B5 are intentionally NOT in the declared list, so they stay at the
//   inventory default for ALL voices (every voice stores F5=B5=6000, which
//   would not distinguish a voice and would break the Paul no-op).
//
// Usage:
//   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dt7-timbre-probe.ts
import { textToKlattTrack } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

const PHRASE = "ah ee oo";
const FIELDS = ["F4", "B4", "F5", "B5"] as const;

// A vowel frame is the most reliable place to read the cascade formants. Pick
// the first voiced frame (AV > 0) that carries an F4 value — at this pipeline
// stage the phoneme label has no stress digit, so match on voicing instead.
function firstVowelFrame(frames: KlattFrame[]): KlattFrame | undefined {
  return frames.find(
    (f) => typeof f.params?.F4 === "number" && typeof f.params?.AV === "number" && f.params.AV > 0,
  );
}

function probe(label: string, speaker?: string): Record<string, unknown> {
  const frames = textToKlattTrack(PHRASE, undefined, 30, {
    frontendId: "dectalk-english",
    ...(speaker ? { speaker } : {}),
  });
  const frame = firstVowelFrame(frames);
  const out: Record<string, unknown> = {
    label,
    speaker: speaker ?? "(default)",
    frames: frames.length,
    vowelFrame: frame?.phoneme ?? null,
  };
  for (const field of FIELDS) {
    out[field] = frame?.params?.[field] ?? null;
  }
  return out;
}

const results = [probe("default", undefined), probe("paul", "paul"), probe("betty", "betty")];

for (const r of results) {
  console.log(JSON.stringify(r));
}

// Assertions (fail loudly so the probe doubles as a check).
const byLabel = Object.fromEntries(results.map((r) => [r.label as string, r]));
const def = byLabel.default;
const paul = byLabel.paul;
const betty = byLabel.betty;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`PROBE ASSERTION FAILED: ${msg}`);
    process.exitCode = 1;
  }
}

assert(def.F4 === 3500, `default F4 should be inventory 3500, got ${def.F4}`);
assert(def.B4 === 260, `default B4 should be inventory 260, got ${def.B4}`);
assert(paul.F4 === def.F4, `paul F4 should equal default (no-op), got ${paul.F4} vs ${def.F4}`);
assert(paul.B4 === def.B4, `paul B4 should equal default (no-op), got ${paul.B4} vs ${def.B4}`);
assert(betty.F4 === 4550, `betty F4 should be voice value 4550, got ${betty.F4}`);
assert(betty.B4 === 400, `betty B4 should be voice value 400, got ${betty.B4}`);
assert(betty.F4 !== paul.F4, `betty F4 must differ from paul F4`);
// F5/B5 are NOT in the declared stamp list, so they are never set from the
// voice. They keep the inventory default (4500/600), then are scaled by the
// EXISTING formant_scale loop (pre-existing behavior, unrelated to this chunk):
//   paul/default formant_scale=1.0 -> F5 stays 4500.
//   betty formant_scale=1.17       -> F5 becomes 4500*1.17=5265.
// So the right invariant is "paul == default" (both 1.0). Betty's F5 differs
// only via formant_scale, NOT via stamping.
assert(
  paul.F5 === def.F5,
  `paul F5 should equal default (F5 not stamped), got ${paul.F5} vs ${def.F5}`,
);
assert(
  betty.F5 === 5265,
  `betty F5 should be inventory 4500 * formant_scale 1.17 = 5265 (NOT voice 6000), got ${betty.F5}`,
);

if (process.exitCode === 1) {
  console.error("dt7-timbre-probe: FAILED");
} else {
  console.log("dt7-timbre-probe: PASS");
}
