import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { textToKlattTrack } from "../src/tts-frontend";

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
  const voiced = track.filter((frame) => Number(frame.params?.AV) > 0 || Number(frame.params?.AVS) > 0);
  const voicedF0 = track
    .map((frame) => Number(frame.params?.F0 ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    phrase,
    events: track.length,
    totalTime: Number(track[track.length - 1]?.time ?? 0),
    voicedEvents: voiced.length,
    f0Min: voicedF0.length ? Math.min(...voicedF0) : 0,
    f0Max: voicedF0.length ? Math.max(...voicedF0) : 0,
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
