import { readFileSync, writeFileSync } from "node:fs";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { textToKlattTrack } from "../src/tts-frontend";

const metricsPolicy = (await loadExperimentConfig("klatt80-baseline")).semantics.analysis!.metrics!;

type Corpus = { name: string; baseF0: number; phrases: string[] };

const corpus = JSON.parse(readFileSync("test/phrase-sets/linguistic.json", "utf8")) as Corpus;

const summaries = corpus.phrases.map((phrase) => ({
  phrase,
  ...summarizeTrackMetrics(textToKlattTrack(phrase, corpus.baseF0), metricsPolicy),
}));

const golden = {
  corpus: corpus.name,
  baseF0: corpus.baseF0,
  summaries,
};

writeFileSync(
  "test/golden/declarative-corpus-summary.json",
  JSON.stringify(golden, null, 2) + "\n",
);

console.log(
  `Regenerated test/golden/declarative-corpus-summary.json with ${summaries.length} summaries`,
);
