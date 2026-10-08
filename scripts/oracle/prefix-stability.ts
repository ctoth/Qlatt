#!/usr/bin/env node

/**
 * prefix-stability.ts
 * ===================
 * A measurement: does the dectalk-english frontend give the first clauses of
 * a text the same packets whether or not the rest of the text follows?
 *
 * DECtalk speaks clause by clause (PH/ph_task.c takes a clause's phonemes
 * when its boundary symbol arrives), so what it says for a clause cannot
 * depend on later text beyond what its parser has read ahead. If the frontend
 * has the same property, a host could speak the first clause from a run over
 * the first clause alone while the rest is prepared.
 *
 * For each text of a list with more than one clause, and each cut after a
 * clause's punctuation, the frontend runs on the text up to the cut and on
 * the whole text. The two tracks are sampled at every frame (71 samples at
 * 11025 Hz) and compared in the values the dectalk-vtm node reads (the F0
 * word, the packet words, `run`, the speaker definition), from the first
 * frame to the frame at which the prefix's run ends. Other track columns
 * (EePhraseDb and RdPhraseOffset, which the node does not read) are left out:
 * they do differ.
 *
 * The cuts are a pattern on the text (white space after . ! ? and, with
 * `--cut clause`, after , ; :), not the frontend's own clause ends. A period
 * that does not end a clause (Dr., U.S., 5 lb.) is cut all the same, and
 * those prefixes differ; the table lists them.
 *
 * Measured 2026-10-08 on origin/master 4d330033, `--cut clause`: 304 of 326
 * prefixes equal; every one of the 22 that differ is a cut after a period
 * that does not end a clause. By list (equal of prefixes): paragraph-sweep
 * 163/163, messy-sweep 44/61, betty-sweep 50/50, clause 27/27, rates 9/9,
 * long-clause-sweep 4/4, empty-clause 3/3, repeated-words 2/2, parser-text
 * 2/4, clause-breaks 0/3.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/prefix-stability.ts [--cut clause|sentence] [--limit <n>] [<list.json> ...]
 *
 * Without lists it uses LISTS below (about ten minutes).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FRAME_PERIOD_SEC,
  FRAME_SHARED,
  PACKET_TRACK_KEYS,
  RUN_PARAM,
  SPEAKER_EPOCH_PARAM,
  SPEAKER_SHARED,
} from "../../src/dectalk-vtm-track.ts";
import type { KlattFrame } from "../../src/klatt-interpreter.ts";
import { textToKlattTrack } from "../../src/tts-frontend.ts";
import { readVoiceCorpus } from "./dectalk-voice-compare.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The lists of the measurement above. */
const LISTS = [
  "dectalk-us-paragraph-sweep-v1",
  "dectalk-us-messy-sweep-v1",
  "dectalk-us-betty-sweep-v1",
  "dectalk-us-clause-v1",
  "dectalk-us-rates-v1",
  "dectalk-us-long-clause-sweep-v1",
  "dectalk-us-empty-clause-v1",
  "dectalk-us-repeated-words-v1",
  "dectalk-us-parser-text-v1",
  "dectalk-us-clause-breaks-v1",
].map((id) => path.join("test", "oracle-corpora", `${id}.json`));

const argv = process.argv.slice(2);
const flagNames = new Set(["cut", "limit"]);
const flags = new Map<string, string>();
const positional: string[] = [];
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index] as string;
  if (arg.startsWith("--") && flagNames.has(arg.slice(2))) {
    flags.set(arg.slice(2), argv[index + 1] ?? "");
    index += 1;
  } else {
    positional.push(arg);
  }
}
const cut = flags.get("cut") ?? "clause";
if (cut !== "clause" && cut !== "sentence") throw new Error("--cut is clause or sentence");
const limit = Number(flags.get("limit") ?? Number.POSITIVE_INFINITY);
const lists = positional.length > 0 ? positional : LISTS;
const cutPattern = cut === "clause" ? /(?<=[.!?,;:])\s+/u : /(?<=[.!?])\s+/u;

/** The track columns the dectalk-vtm node reads (src/dectalk-vtm-track.ts). */
const READ = new Set<string>([
  "F0",
  RUN_PARAM,
  SPEAKER_EPOCH_PARAM,
  ...Object.values(PACKET_TRACK_KEYS),
  ...SPEAKER_SHARED,
  ...FRAME_SHARED,
]);

/**
 * What the node reads at each frame, one string a frame, and the frame at
 * which the run ends (`run` 0 after the first frame), or -1.
 */
function packets(track: KlattFrame[]): { rows: string[]; runEnd: number } {
  const state: Record<string, unknown> = {};
  const rows: string[] = [];
  let next = 0;
  let runEnd = -1;
  const count = Math.round((track[track.length - 1]?.time ?? 0) / FRAME_PERIOD_SEC) + 1;
  for (let frame = 0; frame < count; frame += 1) {
    const time = frame * FRAME_PERIOD_SEC + 1e-9;
    while (next < track.length && (track[next] as KlattFrame).time <= time) {
      Object.assign(state, (track[next] as KlattFrame).params);
      next += 1;
    }
    if (state[RUN_PARAM] === 0 && runEnd < 0 && frame > 0) runEnd = frame;
    rows.push(
      Object.keys(state)
        .filter((key) => READ.has(key) || key.startsWith("SPD_"))
        .sort()
        .map((key) => {
          // The packet word for F0 is round(F0 * 10) (the experiment's semantics).
          const value = key === "F0" ? Math.round(Number(state[key]) * 10) : state[key];
          return `${key}=${String(value)}`;
        })
        .join(" "),
    );
  }
  return { rows, runEnd };
}

let allPrefixes = 0;
let allEqual = 0;
for (const list of lists) {
  const corpus = readVoiceCorpus(path.resolve(repoRoot, list));
  const started = Date.now();
  let prefixes = 0;
  let equal = 0;
  const differing: string[] = [];
  for (const entry of corpus.entries.slice(0, limit)) {
    const pieces = entry.text.split(cutPattern);
    if (pieces.length < 2) continue;
    const options = {
      frontendId: "dectalk-english",
      rate: (entry.rate ?? corpus.defaults?.rate ?? 180) / 180,
      speaker: entry.voiceId ?? corpus.defaults?.voiceId ?? "paul",
    };
    const whole = packets(textToKlattTrack(entry.text, undefined, 30, options));
    for (let kept = 1; kept < pieces.length; kept += 1) {
      const prefixText = pieces.slice(0, kept).join(" ");
      const prefix = packets(textToKlattTrack(prefixText, undefined, 30, options));
      const end = prefix.runEnd < 0 ? prefix.rows.length : prefix.runEnd;
      let first = -1;
      for (let frame = 0; frame < end && first < 0; frame += 1) {
        if (prefix.rows[frame] !== whole.rows[frame]) first = frame;
      }
      prefixes += 1;
      if (first < 0) equal += 1;
      else {
        differing.push(
          `  ${entry.id}, ${kept.toString()} of ${pieces.length.toString()} pieces: frame ${first.toString()} of ${end.toString()} differs: ...${prefixText.slice(-36)} | ${(pieces[kept] as string).slice(0, 24)}`,
        );
      }
    }
  }
  allPrefixes += prefixes;
  allEqual += equal;
  console.log(
    `${path.basename(list)}: ${equal.toString()} of ${prefixes.toString()} prefixes equal to the whole text's packets up to the prefix's end; ${((Date.now() - started) / 1000).toFixed(0)} s`,
  );
  for (const line of differing) console.log(line);
}
console.log(
  `\ncuts at ${cut} punctuation: ${allEqual.toString()} of ${allPrefixes.toString()} prefixes equal`,
);
