/**
 * Render a phrase end to end, text -> dectalk-english frontend track ->
 * `dectalk-vtm` experiment -> audio, and compare it with DECtalk's own WAV.
 *
 * DECtalk's side is a fixture as `scripts/oracle/export-dectalk-vtm-fixture.ts`
 * writes it: its packets, its speaker definition and its samples. The
 * frontend's track is read at each packet's start time (packet n is at
 * n * 71 / 11025 s), which is how the node reads it.
 *
 * Renders, all at 11025 Hz where the node does not resample:
 *
 *   oracle    DECtalk's packets as recorded. A control: must equal the WAV.
 *   mixed     DECtalk's packets with the words the frontend's frame program
 *             writes (--frame-words, default AG,PS,CNK,F4,PH) taken from the
 *             frontend. Shows what those words alone cost.
 *   emitted   every packet word the frontend's track has a value for, taken
 *             from the frontend; the rest from DECtalk.
 *   frontend  the frontend's track alone: a packet word it does not emit is
 *             0, the value of an unset word.
 *
 * The speaker definition is DECtalk's in every render: the frontend emits no
 * speaker words. For each render: samples equal to DECtalk's, and the
 * signal-to-error ratio 10 log10(sum ref^2 / sum (ref - out)^2) in dB.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/render-dectalk-frontend.ts --id paul-cat --text "cat." \
 *     [--fixture-dir crates/dectalk-vtm/tests/fixtures] [--frame-words AG,PS,CNK,F4,PH] \
 *     [--out-dir <dir>] [--json <file>]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DECTALK_SAMPLE_RATE,
  F0_TRACK_KEY,
  FRAME_PERIOD_SEC,
  PACKET_TRACK_KEYS,
  PACKET_WORDS,
  RUN_PARAM,
  vtmEventsToTrack,
} from "../src/dectalk-vtm-track.ts";
import type { KlattFrame } from "../src/klatt-interpreter.ts";
import { textToKlattTrackDetailed } from "../src/tts-frontend.ts";
import { readVtmFixture } from "./oracle/dectalk-vtm-fixture.ts";
import { renderDectalkVtmTrack } from "./rendering/dectalk-vtm-render.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const id = flag("id") ?? "paul-cat";
const text = flag("text") ?? "cat.";
const fixtureDir = path.resolve(
  flag("fixture-dir") ?? path.join(repoRoot, "crates", "dectalk-vtm", "tests", "fixtures"),
);
const frameWords = (flag("frame-words") ?? "AG,PS,CNK,F4,PH").split(",");
const outDir = flag("out-dir") ? path.resolve(flag("out-dir") as string) : undefined;
const jsonFile = flag("json") ? path.resolve(flag("json") as string) : undefined;

/** The track keys of the packet words, F0 for OUT_T0. */
const WORD_KEYS = PACKET_WORDS.map(([name]) => PACKET_TRACK_KEYS[name] ?? F0_TRACK_KEY);

const fixture = readVtmFixture(fixtureDir, id);
const oracleTrack = vtmEventsToTrack(fixture.events);
const packets = oracleTrack.length - 1;
const { track: frontendTrack } = textToKlattTrackDetailed(text, undefined, 30, {
  frontendId: "dectalk-english",
});

/** The frontend's frame in force at packet `index`'s start. */
function frontendAt(index: number): KlattFrame | undefined {
  const time = index * FRAME_PERIOD_SEC + 1e-9;
  let found: KlattFrame | undefined;
  for (const frame of frontendTrack) {
    if (frame.time > time) break;
    found = frame;
  }
  return found;
}

const frontendPackets = (
  (frontendTrack[frontendTrack.length - 1]?.time ?? 0) / FRAME_PERIOD_SEC
).toFixed(2);

type Choice = (key: string, oracle: number, frontend: number | undefined) => number;
function buildTrack(choose: Choice): KlattFrame[] {
  return oracleTrack.map((frame, index) => {
    if (frame.params[RUN_PARAM] !== 1) return frame;
    const here = frontendAt(index);
    const params = { ...frame.params };
    for (const key of WORD_KEYS) {
      const value = here?.params[key];
      params[key] = choose(key, frame.params[key] as number, value);
    }
    return { ...frame, params };
  });
}

const integer = (value: number, key: string): number =>
  key === F0_TRACK_KEY ? value : Math.round(value);
const renders: Array<[name: string, track: KlattFrame[]]> = [
  ["oracle", oracleTrack],
  [
    "mixed",
    buildTrack((key, oracle, frontend) =>
      frameWords.includes(key) && frontend !== undefined ? integer(frontend, key) : oracle,
    ),
  ],
  [
    "emitted",
    buildTrack((key, oracle, frontend) =>
      frontend !== undefined ? integer(frontend, key) : oracle,
    ),
  ],
  [
    "frontend",
    buildTrack((key, _oracle, frontend) => (frontend !== undefined ? integer(frontend, key) : 0)),
  ],
];

const emitted = WORD_KEYS.filter((key) => frontendAt(1)?.params[key] !== undefined);
const missing = WORD_KEYS.filter((key) => !emitted.includes(key));

function writeWav(file: string, samples: Int16Array): void {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(DECTALK_SAMPLE_RATE, 24);
  buffer.writeUInt32LE(DECTALK_SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) buffer.writeInt16LE(samples[i] as number, 44 + i * 2);
  fs.writeFileSync(file, buffer);
}

console.log(
  `${id}: "${text}"; DECtalk ${packets} packets, ${fixture.samples.length} samples; ` +
    `frontend track ends at packet ${frontendPackets}`,
);
console.log(`packet words the frontend emits: ${emitted.join(" ")}`);
console.log(`packet words it does not: ${missing.join(" ") || "none"}`);
console.log(`words taken from the frontend in 'mixed': ${frameWords.join(" ")}`);

const results: Array<Record<string, unknown>> = [];
for (const [name, track] of renders) {
  const render = await renderDectalkVtmTrack({
    repoRoot,
    track,
    sampleRate: DECTALK_SAMPLE_RATE,
  });
  const count = fixture.samples.length;
  const out = new Int16Array(count);
  let equal = 0;
  let reference = 0;
  let error = 0;
  let energy = 0;
  let clipped = 0;
  for (let i = 0; i < count; i += 1) {
    const value = Math.round((render.samples[render.delaySamples + i] ?? 0) * 32768);
    if (value < -32768 || value > 32767) clipped += 1;
    out[i] = Math.max(-32768, Math.min(32767, value));
    const ref = fixture.samples[i] as number;
    if (out[i] === ref) equal += 1;
    reference += ref * ref;
    error += (ref - (out[i] as number)) ** 2;
    energy += (out[i] as number) ** 2;
  }
  const serDb = error === 0 ? Number.POSITIVE_INFINITY : 10 * Math.log10(reference / error);
  const levelDb = energy === 0 ? Number.NEGATIVE_INFINITY : 10 * Math.log10(energy / reference);
  const problems = render.diagnostics.filter((entry) => entry.level !== "info");
  console.log(
    `${name.padEnd(9)} equal ${String(equal).padStart(6)}/${count}  ` +
      `signal-to-error ${Number.isFinite(serDb) ? serDb.toFixed(2).padStart(7) : "    inf"} dB  ` +
      `level re DECtalk ${Number.isFinite(levelDb) ? levelDb.toFixed(2).padStart(7) : "   -inf"} dB  ` +
      `clipped ${clipped}  warnings/errors ${problems.length}`,
  );
  for (const entry of problems.slice(0, 3)) console.log(`    ${entry.level}: ${entry.message}`);
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    writeWav(path.join(outDir, `${id}.${name}.wav`), out);
  }
  results.push({ name, equal, samples: count, serDb, levelDb, clipped, problems: problems.length });
}
if (outDir) writeWav(path.join(outDir, `${id}.dectalk.wav`), fixture.samples);
if (jsonFile) {
  fs.writeFileSync(
    jsonFile,
    `${JSON.stringify({ id, text, packets, frontendPackets, emitted, missing, frameWords, results }, null, 2)}\n`,
  );
}
