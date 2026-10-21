import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";
import { textToKlattTrack } from "../src/tts-frontend";

const corpusPath = "test/phrase-sets/linguistic.json";
const outPath = "test/golden/declarative-corpus-summary.json";

const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const phrases = Array.isArray(corpus?.phrases) ? corpus.phrases : [];
// Absent from the corpus: no base pitch is requested, and the frontend's voice
// keeps its own. The summary's baseF0 is then null.
const baseF0: number | undefined = corpus?.baseF0 === undefined ? undefined : Number(corpus.baseF0);

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
      baseF0: baseF0 ?? null,
      summaries,
    },
    null,
    2,
  ),
);

console.log(`Wrote ${outPath}`);
