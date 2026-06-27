#!/usr/bin/env node
/**
 * Verification harness for the DECtalk dictionary wiring (chunk DT2b).
 *
 * For each sample word, runs the dectalk-english frontend and reports:
 *  - which G2P layer produced the pronunciation (dictionary vs morphology vs
 *    fallback LTS) from the provenance trace
 *  - the resolved phoneme sequence (from inventory_target_selected decisions)
 *  - whether a non-empty KlattFrame track was produced with F0 present
 *
 * Cross-checks dictionary-sourced words against public/dectalk-dictionary.json.
 * Read-only. Does NOT modify any baselines.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrack } from "../src/tts-frontend";
import { createProvenanceCollector } from "../src/provenance";
import { loadCmuDictionaryFromPathSync } from "../src/cmu-dictionary-loader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictPath = path.resolve(__dirname, "../public/dectalk-dictionary.json");
const rawDict = JSON.parse(fs.readFileSync(dictPath, "utf8")) as Record<string, string>;

const FRONTEND = "dectalk-english";

const argWords = process.argv.slice(2);
const sampleWords =
  argWords.length > 0
    ? argWords
    : ["hello", "world", "nuclear", "judicial", "computer", "question", "you"];

console.log(`dict entries (raw json): ${Object.keys(rawDict).length}`);
console.log(
  `loader sanity (cached map size): ${Object.keys(loadCmuDictionaryFromPathSync("/dectalk-dictionary.json")).length}`,
);

for (const word of sampleWords) {
  const provenance = createProvenanceCollector();
  const track = textToKlattTrack(word, undefined, 30, {
    frontendId: FRONTEND,
    provenance,
  });
  const decisions = provenance.getDecisions();

  const pron = decisions.find(
    (d) => d.stage === "transcribe" && /pronunciation_selected/.test(d.type),
  );
  const invSel = decisions.filter(
    (d) => d.stage === "transcribe" && d.type === "inventory_target_selected",
  );
  const phonemes = invSel
    .map((d) => d.subject.replace(/^token:\d+:/, ""))
    .join(" ");

  const f0Frames = track.filter(
    (f) => typeof f.params?.F0 === "number" && (f.params.F0 as number) > 0,
  );
  const dictEntry = rawDict[word.toLowerCase()];

  console.log(`\n=== ${word} ===`);
  console.log(`  source layer : ${pron ? pron.type : "(none)"}`);
  console.log(`  reason       : ${pron ? pron.reason : "(none)"}`);
  console.log(`  phonemes     : ${phonemes || "(none)"}`);
  console.log(`  dict entry   : ${dictEntry ?? "(NOT IN DICT)"}`);
  console.log(`  track frames : ${track.length} (with F0>0: ${f0Frames.length})`);
  if (track.length === 0) console.log("  !! EMPTY TRACK");
}
