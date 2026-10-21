/**
 * packet-diff.ts
 * ==============
 * Which packet words differ between the dectalk-english frontend's track and
 * the packets DECtalk 4.63 gave its vocal tract model for the same text: for
 * a corpus entry whose samples differ (scripts/oracle/compare-dectalk-voices.ts),
 * the parameter and the frame where they first part.
 *
 * DECtalk's packets are read from `<fixture-dir>/<id>.frames.txt`, as
 * scripts/oracle/export-dectalk-vtm-fixture.ts writes it (without
 * --wav-only). Both sides are laid out as tracks with the keys of
 * src/dectalk-vtm-track.ts; the frontend's value at packet n is the last one
 * its track sets at or before n frame periods.
 *
 * Printed: one line per track key that differs (packets that differ, the
 * first such packet with the phone the frontend speaks there, DECtalk's
 * value and the frontend's), then with --key <name> the two values at every
 * differing packet (at most --limit, default 40).
 *
 * A measurement tool: exit code 0.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/packet-diff.ts \
 *     --fixture-dir <dir> --corpus <corpus.json> --id <entry id> [--key F0] [--limit 40]
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
const id = flag("id");
const onlyKey = flag("key");
const limit = Number(flag("limit") ?? 40);
if (!fixtureDir || !corpusPath || !id) {
  throw new Error("--fixture-dir <dir> --corpus <corpus.json> --id <entry id> are required");
}
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as {
  defaults: { voiceId: string; rate?: number };
  entries: Array<{ id: string; text: string; voiceId?: string; rate?: number }>;
};
const entry = corpus.entries.find((candidate) => candidate.id === id);
if (!entry) throw new Error(`no entry '${id}' in ${corpusPath}`);

const oracle = vtmEventsToTrack(readVtmFixture(fixtureDir, id).events);
const packets = oracle.length - 1;
const { track } = textToKlattTrackDetailed(entry.text, undefined, 30, {
  frontendId: "dectalk-english",
  speaker: entry.voiceId ?? corpus.defaults.voiceId,
  rate: (entry.rate ?? corpus.defaults.rate ?? 180) / 180,
});

// The frontend's track held at each packet time.
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

const keys = Object.keys(oracle[0]?.params ?? {}).filter((key) => key !== RUN_PARAM);
console.log(`${id}  ${entry.text}`);
console.log(`packets: DECtalk ${packets.toString()}`);
// A key no frame of the frontend's track sets is the page's to supply (the
// speaker epoch, the language, the volume): not compared.
const set = new Set(track.flatMap((frame) => Object.keys(frame.params)));
// F0 is DECtalk's word over ten; the two sides divide in different places.
const same = (a: unknown, b: unknown): boolean =>
  typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-6 : a === b;
for (const key of keys) {
  if (!set.has(key)) {
    console.log(`${key}\tnot set by the frontend's track`);
    continue;
  }
  const differing: number[] = [];
  for (let packet = 0; packet < packets; packet += 1) {
    if (!same(oracle[packet]?.params[key], held[packet]?.[key])) differing.push(packet);
  }
  if (differing.length === 0) continue;
  const first = differing[0] as number;
  console.log(
    `${key}\t${differing.length.toString()} packets differ\tfirst ${first.toString()} (${String(held[first]?.phoneme ?? "")})\tDECtalk ${String(oracle[first]?.params[key])}\tfrontend ${String(held[first]?.[key])}`,
  );
  if (key === onlyKey) {
    for (const packet of differing.slice(0, limit)) {
      console.log(
        `  ${packet.toString()}\t${String(held[packet]?.phoneme ?? "")}\t${String(oracle[packet]?.params[key])}\t${String(held[packet]?.[key])}`,
      );
    }
  }
}
