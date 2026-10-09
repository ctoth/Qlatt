/**
 * packet-survey.ts
 * ================
 * For every entry of a corpus: which packet words differ between the
 * dectalk-english frontend's track and DECtalk's recorded packets, one line
 * per entry (`<word> <packets that differ>@<first packet>(<phone there>)`),
 * and how many entries have no differing word. The per-word detail of one
 * entry is packet-diff.ts.
 *
 * DECtalk's packets are `<fixture-dir>/<id>.frames.txt`, as
 * scripts/oracle/export-dectalk-vtm-fixture.ts writes them (without
 * --wav-only).
 *
 * A measurement tool: exit code 0.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/packet-survey.ts --fixture-dir <dir> --corpus <corpus.json>
 */

import fs from "node:fs";
import { FRAME_PERIOD_SEC, RUN_PARAM, vtmEventsToTrack } from "../../../src/dectalk-vtm-track";
import { textToKlattTrackDetailed } from "../../../src/tts-frontend";
import { readVtmFixture } from "../dectalk-vtm-fixture";

const flag = (name: string): string | undefined => {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? undefined : process.argv[at + 1];
};
const fixtureDir = flag("fixture-dir");
const corpusPath = flag("corpus");
if (!fixtureDir || !corpusPath) {
  throw new Error("--fixture-dir <dir> --corpus <corpus.json> are required");
}
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as {
  defaults: { voiceId: string; rate?: number };
  entries: Array<{ id: string; text: string; voiceId?: string; rate?: number }>;
};

const same = (a: unknown, b: unknown): boolean =>
  typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-6 : a === b;

let equal = 0;
for (const entry of corpus.entries) {
  let line: string;
  try {
    const oracle = vtmEventsToTrack(readVtmFixture(fixtureDir, entry.id).events);
    const packets = oracle.length - 1;
    const { track } = textToKlattTrackDetailed(entry.text, undefined, 30, {
      frontendId: "dectalk-english",
      speaker: entry.voiceId ?? corpus.defaults.voiceId,
      rate: (entry.rate ?? corpus.defaults.rate ?? 180) / 180,
    });
    const set = new Set(track.flatMap((frame) => Object.keys(frame.params)));
    const held: Record<string, number | string>[] = [];
    const current: Record<string, number | string> = {};
    let next = 0;
    for (let packet = 0; packet < packets; packet += 1) {
      const time = packet * FRAME_PERIOD_SEC + 1e-9;
      while (next < track.length && (track[next]?.time ?? Infinity) <= time) {
        const frame = track[next];
        if (frame) {
          for (const [key, value] of Object.entries(frame.params)) {
            if (typeof value === "number") current[key] = value;
          }
          if (frame.phoneme) current.phoneme = frame.phoneme;
        }
        next += 1;
      }
      held.push({ ...current });
    }
    const parts: string[] = [];
    for (const key of Object.keys(oracle[0]?.params ?? {})) {
      if (key === RUN_PARAM || !set.has(key)) continue;
      let count = 0;
      let first = -1;
      for (let packet = 0; packet < packets; packet += 1) {
        if (!same(oracle[packet]?.params[key], held[packet]?.[key])) {
          count += 1;
          if (first < 0) first = packet;
        }
      }
      if (count > 0) {
        parts.push(
          `${key} ${count.toString()}@${first.toString()}(${String(held[first]?.phoneme ?? "")})`,
        );
      }
    }
    if (parts.length === 0) equal += 1;
    line = parts.length === 0 ? "equal" : parts.join("  ");
  } catch (error) {
    line = `error: ${(error as Error).message.slice(0, 140)}`;
  }
  console.log(`${entry.id}: ${line}`);
}
console.log(
  `${equal.toString()} of ${corpus.entries.length.toString()} with every packet word equal`,
);
