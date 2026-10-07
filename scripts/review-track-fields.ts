#!/usr/bin/env node

/**
 * review-track-fields.ts
 * ======================
 * Hash a frontend's track with some frame params left out, to check that a
 * change which adds or replaces columns leaves every other field of every
 * frame alone. Run it in two checkouts and compare the lines.
 *
 * For each phrase it prints: the number of frames, a hash of the frames
 * (time, phoneme, segment, word and every param except the dropped ones),
 * and a hash of the same with the times left out and the frames deduplicated
 * in order, which stays equal when a change only adds event points.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/review-track-fields.ts [--root <checkout>] [--frontend dectalk-english] \
 *     [--drop PS,CNK,AG,F4] "phrase" ...
 *
 * --root is the checkout whose src/tts-frontend.ts is loaded (default: this
 * one); run with that checkout as the working directory.
 */

import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const flags = new Set(["root", "frontend", "drop"]);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const phrases: string[] = [];
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index] as string;
  if (arg.startsWith("--") && flags.has(arg.slice(2))) {
    index += 1;
    continue;
  }
  phrases.push(arg);
}
const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(flag("root") ?? here);
const frontendId = flag("frontend") ?? "dectalk-english";
const dropped = new Set((flag("drop") ?? "").split(",").filter(Boolean));

const { textToKlattTrackDetailed } = (await import(
  pathToFileURL(path.join(root, "src", "tts-frontend.ts")).href
)) as typeof import("../src/tts-frontend");

const sha = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

console.log(`root ${root}; frontend ${frontendId}; dropped: ${[...dropped].join(" ") || "none"}`);
for (const phrase of phrases) {
  const { track } = textToKlattTrackDetailed(phrase, 110, 30, { frontendId });
  const frames = track.map(({ provenance: _provenance, params, ...frame }) => ({
    ...frame,
    params: Object.fromEntries(
      Object.entries(params)
        .filter(([key]) => !dropped.has(key))
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
  }));
  const timeless: string[] = [];
  for (const { time: _time, ...frame } of frames) {
    const text = JSON.stringify(frame);
    if (timeless[timeless.length - 1] !== text) timeless.push(text);
  }
  console.log(
    `${String(frames.length).padStart(5)} frames  with times ${sha(frames)}  without ${sha(timeless)}  ${phrase}`,
  );
}
