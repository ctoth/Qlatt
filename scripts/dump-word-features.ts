#!/usr/bin/env node

/**
 * dump-word-features.ts
 * =====================
 * Prints chosen features of every Word of an utterance, one row per Word.
 * The companion of dump-segment-features.ts for what a frontend keeps on its
 * Word items (form classes, phrase starts).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/dump-word-features.ts --frontend dectalk-english \
 *     --features text,form_classes,phrase_start "Go to the store."
 *
 * When the frontend throws, the error is printed and the exit code is 1.
 */

import { textToKlattTrackDetailed } from "../src/tts-frontend.ts";

const args = process.argv.slice(2);
const option = (name: string, fallback: string): string => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const frontendId = option("--frontend", "dectalk-english");
const features = option("--features", "text,form_classes,phrase_start,phrase_start_state").split(
  ",",
);
const optionValues = new Set(
  ["--frontend", "--features"].flatMap((name) => {
    const index = args.indexOf(name);
    return index >= 0 ? [index, index + 1] : [];
  }),
);
const texts = args.filter((_arg, index) => !optionValues.has(index));

let failed = false;
for (const text of texts) {
  console.log(JSON.stringify(text));
  try {
    const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
    for (const item of utterance.relation("Word").listItems()) {
      const cells = features.map((feature) => `${feature}=${JSON.stringify(item.get(feature))}`);
      console.log(`  ${item.id}  ${cells.join(" ")}`);
    }
  } catch (error) {
    failed = true;
    console.log(`  threw ${String(error instanceof Error ? error.message : error)}`);
  }
}
if (failed) process.exitCode = 1;
