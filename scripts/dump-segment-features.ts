#!/usr/bin/env node

/**
 * dump-segment-features.ts
 * ========================
 * Prints chosen features of every Segment at the end of a named phase (or of
 * the whole run), one row per Segment, inactive ones marked.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/dump-segment-features.ts --frontend qlatt-english \
 *     --features phoneme,type,voiced,word "bite."
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
const features = option("--features", "phoneme,type,word,stress,duration").split(",");
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
    for (const item of utterance.relation("Segment").listItems()) {
      const cells = features.map((feature) => `${feature}=${JSON.stringify(item.get(feature))}`);
      console.log(`  ${item.get("active") === false ? "-" : " "} ${item.id}  ${cells.join(" ")}`);
    }
  } catch (error) {
    failed = true;
    console.log(`  threw ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
  }
}
process.exit(failed ? 1 : 0);
