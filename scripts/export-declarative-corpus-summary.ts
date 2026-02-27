import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { textToKlattTrack } from "../src/tts-frontend";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";

const corpusPath = "test/phrase-sets/linguistic.json";
const outPath = "test/golden/declarative-corpus-summary.json";

const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const phrases = Array.isArray(corpus?.phrases) ? corpus.phrases : [];
const baseF0 = Number(corpus?.baseF0 ?? 110);

if (phrases.length === 0) {
  throw new Error(`No phrases found in ${corpusPath}`);
}

const summaries = phrases.map((phrase: string) => {
  const track = textToKlattTrack(phrase, baseF0);
  const metrics = summarizeTrackMetrics(track);

  return {
    phrase,
    ...metrics,
  };
});

mkdirSync("test/golden", { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      corpus: corpus?.name ?? "unknown-corpus",
      baseF0,
      summaries,
    },
    null,
    2
  )
);

console.log(`Wrote ${outPath}`);
