#!/usr/bin/env node

/**
 * dump-token-sources.ts
 * =====================
 * Prints every Token of an utterance with the normalization Item it came
 * from: that Item's class, kind, rule and spoken text. Shows which words a
 * text rule produced (a number, a date, an abbreviation) and which were typed.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/dump-token-sources.ts --frontend dectalk-english "Room 101."
 *
 * When the frontend throws, the error is printed and the exit code is 1.
 */

import { textToKlattTrackDetailed } from "../src/tts-frontend.ts";

const args = process.argv.slice(2);
const frontendIndex = args.indexOf("--frontend");
const frontendId = frontendIndex >= 0 ? args[frontendIndex + 1] : "dectalk-english";
const texts = args.filter(
  (_arg, index) => frontendIndex < 0 || (index !== frontendIndex && index !== frontendIndex + 1),
);
const SOURCE_FEATURES = ["outputType", "kind", "class", "ruleId", "text", "spokenText"];

let failed = false;
for (const text of texts) {
  console.log(JSON.stringify(text));
  try {
    const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
    for (const token of utterance.relation("Token").listItems()) {
      const sources = utterance
        .latestAssociationWrites(token, "source_normalization")
        .filter((write) => write.active)
        .map((write) => utterance.getItem(write.toItemId))
        .map((item) =>
          item
            ? SOURCE_FEATURES.map(
                (feature) => `${feature}=${JSON.stringify(item.get(feature))}`,
              ).join(" ")
            : "missing",
        );
      console.log(
        `  ${token.id}  word=${JSON.stringify(token.get("word"))} key=${JSON.stringify(token.get("pronunciationKey"))}`,
      );
      for (const source of sources) console.log(`      <- ${source}`);
    }
  } catch (error) {
    failed = true;
    console.log(`  threw ${String(error instanceof Error ? error.message : error)}`);
  }
}
if (failed) process.exitCode = 1;
