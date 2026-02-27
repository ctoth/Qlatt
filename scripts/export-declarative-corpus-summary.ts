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

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

const summaries = phrases.map((phrase: string) => {
  const track = textToKlattTrack(phrase, baseF0);
  const voiced = track.filter((frame) => Number(frame.params?.AV) > 0 || Number(frame.params?.AVS) > 0);
  const voicedF0 = track
    .map((frame) => Number(frame.params?.F0 ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const voicedF1 = voiced
    .map((frame) => Number(frame.params?.F1 ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const voicedF2 = voiced
    .map((frame) => Number(frame.params?.F2 ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const voicedB1 = voiced
    .map((frame) => Number(frame.params?.B1 ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const voicedAV = voiced
    .map((frame) => Number(frame.params?.AV ?? 0))
    .filter((value) => Number.isFinite(value));
  const voicedAH = voiced
    .map((frame) => Number(frame.params?.AH ?? 0))
    .filter((value) => Number.isFinite(value));

  let voicedTime = 0;
  let silenceTime = 0;
  let unvoicedNonsilenceTime = 0;
  for (let i = 0; i < track.length - 1; i += 1) {
    const cur = track[i];
    const next = track[i + 1];
    const curTime = Number(cur?.time ?? 0);
    const nextTime = Number(next?.time ?? 0);
    const delta = nextTime - curTime;
    if (!Number.isFinite(delta) || delta <= 0) continue;

    const isVoiced = Number(cur.params?.AV ?? 0) > 0 || Number(cur.params?.AVS ?? 0) > 0;
    if (isVoiced) {
      voicedTime += delta;
      continue;
    }
    if (cur.phoneme === "SIL") {
      silenceTime += delta;
      continue;
    }
    unvoicedNonsilenceTime += delta;
  }

  const totalTime = Number(track[track.length - 1]?.time ?? 0);
  const f0Min = voicedF0.length ? Math.min(...voicedF0) : 0;
  const f0Max = voicedF0.length ? Math.max(...voicedF0) : 0;

  return {
    phrase,
    events: track.length,
    totalTime,
    voicedEvents: voiced.length,
    voicedTime,
    silenceTime,
    unvoicedNonsilenceTime,
    voicedRatio: totalTime > 0 ? voicedTime / totalTime : 0,
    f0Min,
    f0Max,
    f0Mean: mean(voicedF0),
    f0Span: f0Max - f0Min,
    f1MeanVoiced: mean(voicedF1),
    f2MeanVoiced: mean(voicedF2),
    b1MeanVoiced: mean(voicedB1),
    avMeanVoiced: mean(voicedAV),
    ahMeanVoiced: mean(voicedAH),
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
