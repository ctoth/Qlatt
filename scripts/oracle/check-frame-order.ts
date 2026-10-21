#!/usr/bin/env node

/**
 * check-frame-order.ts
 * ====================
 * Report frames in a frontend track that belong to a segment which has already
 * been left: once a later segment's frame has been emitted, no frame of an
 * earlier segment may follow it in output time.
 *
 * The frontend emits frames sorted by output time, so a violation means two
 * frames were projected onto the output clock by different mappings (for
 * example a segment-start frame at control time and an F0 tick at
 * tick-index * output_frame_period_sec).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/check-frame-order.ts --phrase "moon." [--frontend-id dectalk-english] \
 *     [--verbose] [--grid-ms 6.439909297052154]
 *
 * --verbose prints every frame; with --grid-ms it also prints each frame's
 * distance in milliseconds from the nearest multiple of that period.
 *
 * Exit code 1 if any violation is found.
 */

import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";

function parseArgs(argv: string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      out.set(key.slice(2), next);
      i += 1;
    } else {
      out.set(key.slice(2), "true");
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const phrase = args.get("phrase");
if (!phrase) {
  throw new Error(
    "Usage: check-frame-order --phrase <text> [--frontend-id id] [--verbose] [--grid-ms n]",
  );
}
const frontendId = args.get("frontend-id") ?? "dectalk-english";
const verbose = args.has("verbose");
const gridMs = args.has("grid-ms") ? Number(args.get("grid-ms")) : undefined;
const transitionMs = Number(args.get("transition-ms") ?? 30);

const { track } = textToKlattTrackDetailed(phrase, undefined, transitionMs, { frontendId });

const ordinals = new Map<string, number>();
let latestOrdinal = -1;
let latestKey = "";
let seenSegment = false;
const violations: string[] = [];
track.forEach((frame, index) => {
  if (frame.segmentId) seenSegment = true;
  // Frames without a Segment are the synthesized silence edges: the initial
  // edge before the first Segment, the final edge after the last.
  const key = frame.segmentId ?? (seenSegment ? "edge:final" : "edge:initial");
  if (!ordinals.has(key)) ordinals.set(key, ordinals.size);
  const ordinal = ordinals.get(key) as number;
  const timeMs = frame.time * 1000;
  if (verbose) {
    const offGrid =
      gridMs == null ? "" : `\t${(timeMs - Math.round(timeMs / gridMs) * gridMs).toExponential(2)}`;
    console.log(`${timeMs.toFixed(6)}\t${frame.phoneme ?? ""}\t${key}${offGrid}`);
  }
  if (ordinal < latestOrdinal) {
    violations.push(
      `frame ${index} at ${timeMs.toFixed(4)} ms belongs to ${key} (${frame.phoneme ?? "?"}) ` +
        `but ${latestKey} had already started`,
    );
  } else if (ordinal > latestOrdinal) {
    latestOrdinal = ordinal;
    latestKey = key;
  }
});

console.log(
  JSON.stringify({ phrase, frontendId, frames: track.length, violations: violations.length }),
);
for (const violation of violations) console.log(violation);
process.exitCode = violations.length > 0 ? 1 : 0;
