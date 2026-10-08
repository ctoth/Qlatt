/**
 * word-at-sample.ts
 * =================
 * Which words the dectalk-english frontend is speaking around a sample of
 * its 11025 Hz output: for a first differing sample that a sample comparison
 * reports (scripts/oracle/compare-dectalk-voices.ts), the place in the text.
 *
 * Prints the Segments whose time span lies within --window seconds of the
 * sample (default 0.4), each with its start time, phone and word.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/word-at-sample.ts \
 *     --corpus <corpus.json> --id <entry id> --sample <n> [--window <s>]
 */

import fs from "node:fs";
import { textToKlattTrackDetailed } from "../../../src/tts-frontend";
import { PAGE_START_DELAY_SEC } from "../dectalk-voice-compare";

const flag = (name: string): string | undefined => {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? undefined : process.argv[at + 1];
};
const corpusPath = flag("corpus");
const id = flag("id");
const sample = Number(flag("sample"));
const window = Number(flag("window") ?? 0.4);
if (!corpusPath || !id || !Number.isFinite(sample)) {
  throw new Error("--corpus <corpus.json> --id <entry id> --sample <n> are required");
}
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as {
  defaults: { voiceId: string };
  entries: Array<{ id: string; text: string; voiceId?: string }>;
};
const entry = corpus.entries.find((candidate) => candidate.id === id);
if (!entry) throw new Error(`no entry '${id}' in ${corpusPath}`);

const { track } = textToKlattTrackDetailed(entry.text, undefined, 30, {
  frontendId: "dectalk-english",
  rate: 1,
  speaker: entry.voiceId ?? corpus.defaults.voiceId,
});
// The comparison starts the track where the page does.
const at = sample / 11025 - PAGE_START_DELAY_SEC;
console.log(`sample ${sample.toString()} is ${at.toFixed(3)} s into the track`);
let last = "";
for (const frame of track) {
  if (Math.abs(frame.time - at) > window) continue;
  const record = frame as unknown as { phoneme?: string; word?: string; params?: object };
  const line = `${frame.time.toFixed(3)}  ${String(record.phoneme ?? "")}  ${String(record.word ?? "")}`;
  if (line.slice(7) !== last) console.log(line);
  last = line.slice(7);
}
