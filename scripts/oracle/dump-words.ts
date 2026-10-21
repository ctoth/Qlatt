#!/usr/bin/env node
// Lists the dectalk-english frontend's Word Items for a text, with the
// features named: what the lexicon and the word-level rules say of each
// written word (its classes, its place in its stretch, a clause break).
//
//   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
//     scripts/oracle/dump-words.ts --text "Red and green." [--fields a,b,c]
//
// A measurement tool: exit code 0.
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const text = flag("text");
if (!text) throw new Error("Usage: dump-words --text <text> [--fields a,b]");
const fields = (
  flag("fields") ??
  "clause_word_index,clause_word_count,clause_end_supplied,break_marker,clause_break_before,conjunction_sequence,text_form_classes"
)
  .split(",")
  .filter((field) => field.length > 0);
const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
  frontendId: "dectalk-english",
});
process.stdout.write(`text\t${fields.join("\t")}\n`);
for (const word of utterance.relation("Word").listItems()) {
  process.stdout.write(
    `${String(word.get("text"))}\t${fields.map((field) => JSON.stringify(word.get(field) ?? null)).join("\t")}\n`,
  );
}
