#!/usr/bin/env node
// Lists the dectalk-english frontend's final Segments for a text, with each
// Segment's duration in controller frames and where the lowered track puts
// it on the packet clock (71 samples at 11025 Hz a frame).
//
//   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
//     scripts/oracle/dump-segments.ts --text "Red, green." [--fields a,b,c]
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import { DECTALK_NATIVE_SAMPLE_RATE_HZ, DECTALK_SAMPLES_PER_FRAME } from "./dectalk-trace";

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const text = flag("text");
if (!text) throw new Error("Usage: dump-segments --text <text> [--fields a,b]");
const extra = (flag("fields") ?? "").split(",").filter((field) => field.length > 0);
const { track, utterance } = textToKlattTrackDetailed(text, undefined, 30, {
  frontendId: "dectalk-english",
});
const packetSec = DECTALK_SAMPLES_PER_FRAME / DECTALK_NATIVE_SAMPLE_RATE_HZ;
const firstPacket = new Map<string, number>();
const lastPacket = new Map<string, number>();
for (const frame of track) {
  if (!frame.segmentId) continue;
  const packet = frame.time / packetSec;
  if (!firstPacket.has(frame.segmentId)) firstPacket.set(frame.segmentId, packet);
  lastPacket.set(frame.segmentId, packet);
}
process.stdout.write(
  `id\tphoneme\ttype\tduration_ms\tframes\tpunct\tfirstPacket\tlastEventPacket\t${extra.join("\t")}\n`,
);
for (const item of utterance.relation("Segment").listItems()) {
  if (item.get("active") === false) continue;
  const duration = Number(item.get("duration"));
  process.stdout.write(
    `${item.id}\t${String(item.get("phoneme"))}\t${String(item.get("type"))}\t${duration.toFixed(2)}\t${(duration / 6.4).toFixed(2)}\t${String(item.get("punctuationSymbol") ?? "")}\t${firstPacket.get(item.id)?.toFixed(2) ?? ""}\t${lastPacket.get(item.id)?.toFixed(2) ?? ""}\t${extra.map((field) => JSON.stringify(item.get(field) ?? null)).join("\t")}\n`,
  );
}
process.stdout.write(
  `track events ${track.length}; first ${track[0]?.time} last ${(track[track.length - 1]!.time / packetSec).toFixed(2)} packets\n`,
);
