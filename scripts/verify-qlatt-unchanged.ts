#!/usr/bin/env node
import { createProvenanceCollector } from "../src/provenance";
/**
 * Proves qlatt-english still uses the GLOBAL CMU dictionary (no leak of the
 * dectalk per-frontend dict). CMU "hello" = HH AH0 L OW1 (schwa first vowel);
 * the dectalk dict "hello" = HH EH0 L OW1 (EH). If qlatt-english renders the
 * CMU phonemes, the global map is intact and the dictionary_path mechanism did
 * not bleed into the default frontend.
 *
 * Read-only.
 */
import { textToKlattTrack } from "../src/tts-frontend";

const words = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["hello", "nuclear"];

for (const word of words) {
  const provenance = createProvenanceCollector();
  textToKlattTrack(word, undefined, 30, { frontendId: "qlatt-english", provenance });
  const decisions = provenance.getDecisions();
  const pron = decisions.find(
    (d) => d.stage === "transcribe" && /pronunciation_selected/.test(d.type),
  );
  const invSel = decisions.filter(
    (d) => d.stage === "transcribe" && d.type === "inventory_target_selected",
  );
  const phonemes = invSel.map((d) => d.subject.replace(/^token:\d+:/, "")).join(" ");
  console.log(`\n=== qlatt-english: ${word} ===`);
  console.log(`  source layer : ${pron ? pron.type : "(none)"}`);
  console.log(`  phonemes     : ${phonemes}`);
}
