import { readFileSync, writeFileSync } from "node:fs";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";
import { textToKlattTrack } from "../src/tts-frontend";

const corpus = JSON.parse(readFileSync("test/phrase-sets/linguistic.json", "utf8"));
const summaries = corpus.phrases.map((phrase: string) => {
  const track = textToKlattTrack(phrase, corpus.baseF0);
  return { phrase, ...summarizeTrackMetrics(track) };
});
const golden = { corpus: corpus.name, baseF0: corpus.baseF0, summaries };
writeFileSync(
  "test/golden/declarative-corpus-summary.json",
  JSON.stringify(golden, null, 2) + "\n",
);
console.log(`Regenerated golden: ${summaries.length} phrases`);
