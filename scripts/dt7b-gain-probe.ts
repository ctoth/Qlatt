// dt-7b gain probe: verifies that each DECtalk voice's source/parallel GAINS
// (GV/GH/GF + G1-G4/LO) shape audio as PAUL-RELATIVE additive dB offsets onto
// the per-frame gain dB params (AV/AVS/AH/AF/A1..A5), via the generic
// data-declared `speakers.speaker_gain_offsets` mechanism in frontend.yaml.
//
// Renders a vowel-rich phrase with speaker=paul, speaker=betty, speaker=harry,
// and no speaker (default), then prints the gain-driven frame params for the
// first voiced vowel frame of each.
//
// The offset for a frame param = selectedVoice[gain] - defaultVoice[gain]
// (default voice = Paul). So Paul (and the no-speaker default) yield 0 offset
// everywhere -> byte-identical. Betty/Harry differ per their gain offsets.
//
// Mapping (frontend.yaml speakers.speaker_gain_offsets):
//   GV -> AV, AVS;  GH -> AH;  GF -> AF;
//   LO -> A1;  G4 -> A2;  G3 -> A3;  G2 -> A4;  G1 -> A5.
//
// Voice gains (speakers/*.yaml):
//   paul : GV68 GH67 GF67 G1 51 G2 60 G3 50 G4 67 LO81
//   betty: GV60 GH63 GF63 G1 66 G2 65 G3 60 G4 65 LO63
//   harry: GV60 GH63 GF63 G1 67 G2 50 G3 54 G4 62 LO57
//
// Usage:
//   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dt7b-gain-probe.ts
import { textToKlattTrack } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

const PHRASE = "ah ee oo";
const FIELDS = ["AV", "AVS", "AH", "AF", "A1", "A2", "A3", "A4", "A5"] as const;

// First voiced vowel frame (AV > 0) — the gain dB params live here.
function firstVowelFrame(frames: KlattFrame[]): KlattFrame | undefined {
  return frames.find(
    (f) =>
      typeof f.params?.AV === "number" &&
      f.params.AV > 0 &&
      typeof f.params?.F4 === "number",
  );
}

function probe(label: string, speaker?: string): Record<string, number | string | null> {
  const frames = textToKlattTrack(PHRASE, undefined, 30, {
    frontendId: "dectalk-english",
    ...(speaker ? { speaker } : {}),
  });
  const frame = firstVowelFrame(frames);
  const out: Record<string, number | string | null> = {
    label,
    speaker: speaker ?? "(default)",
    vowelFrame: frame?.phoneme ?? null,
  };
  for (const field of FIELDS) {
    const v = frame?.params?.[field];
    out[field] = typeof v === "number" ? v : null;
  }
  return out;
}

const results = [
  probe("default", undefined),
  probe("paul", "paul"),
  probe("betty", "betty"),
  probe("harry", "harry"),
];

for (const r of results) {
  console.log(JSON.stringify(r));
}

const byLabel = Object.fromEntries(results.map((r) => [r.label as string, r]));
const def = byLabel.default;
const paul = byLabel.paul;
const betty = byLabel.betty;
const harry = byLabel.harry;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`PROBE ASSERTION FAILED: ${msg}`);
    process.exitCode = 1;
  }
}

// Paul == default (no-speaker): Paul is the reference, every offset is 0.
for (const field of FIELDS) {
  assert(
    paul[field] === def[field],
    `paul ${field} must equal default (byte-identical reference), got ${paul[field]} vs ${def[field]}`,
  );
}

// Betty offsets vs paul reference (betty[gain] - paul[gain]):
//   GV 60-68=-8 -> AV, AVS;  GH 63-67=-4 -> AH;  GF 63-67=-4 -> AF;
//   LO 63-81=-18 -> A1;  G4 65-67=-2 -> A2;  G3 60-50=+10 -> A3;
//   G2 65-60=+5 -> A4;  G1 66-51=+15 -> A5.
// AV/A1..A5 base values come from the vowel frame; the offset is added on top.
const baseAV = paul.AV as number;
assert(betty.AV === baseAV - 8, `betty AV should be paulAV-8=${baseAV - 8}, got ${betty.AV}`);
assert(
  betty.AVS === (paul.AVS as number) - 8,
  `betty AVS should be paulAVS-8, got ${betty.AVS} vs ${(paul.AVS as number) - 8}`,
);
assert(betty.AH === (paul.AH as number) - 4, `betty AH should be paulAH-4, got ${betty.AH}`);
assert(betty.AF === (paul.AF as number) - 4, `betty AF should be paulAF-4, got ${betty.AF}`);
assert(betty.A1 === (paul.A1 as number) - 18, `betty A1 should be paulA1-18, got ${betty.A1}`);
assert(betty.A2 === (paul.A2 as number) - 2, `betty A2 should be paulA2-2, got ${betty.A2}`);
assert(betty.A3 === (paul.A3 as number) + 10, `betty A3 should be paulA3+10, got ${betty.A3}`);
assert(betty.A4 === (paul.A4 as number) + 5, `betty A4 should be paulA4+5, got ${betty.A4}`);
assert(betty.A5 === (paul.A5 as number) + 15, `betty A5 should be paulA5+15, got ${betty.A5}`);

// Harry offsets vs paul: GV-8 (AV,AVS); GH-4; GF-4; LO-24 (A1); G4-5 (A2);
//   G3+4 (A3); G2-10 (A4); G1+16 (A5).
assert(harry.AV === (paul.AV as number) - 8, `harry AV should be paulAV-8, got ${harry.AV}`);
assert(harry.A1 === (paul.A1 as number) - 24, `harry A1 should be paulA1-24, got ${harry.A1}`);
assert(harry.A5 === (paul.A5 as number) + 16, `harry A5 should be paulA5+16, got ${harry.A5}`);

// Betty and Harry must differ from Paul (vocal character changed by gains).
assert(betty.AV !== paul.AV, `betty AV must differ from paul (gain offset applied)`);
assert(harry.A4 !== paul.A4, `harry A4 must differ from paul (gain offset applied)`);
// Betty and Harry differ from each other on parallel gains (LO/G2 differ).
assert(betty.A1 !== harry.A1, `betty A1 (LO) must differ from harry A1`);
assert(betty.A4 !== harry.A4, `betty A4 (G2) must differ from harry A4`);

if (process.exitCode === 1) {
  console.error("dt7b-gain-probe: FAILED");
} else {
  console.log("dt7b-gain-probe: PASS");
}
