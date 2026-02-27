import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { textToKlattTrack } from "../src/tts-frontend";

type Corpus = {
  name: string;
  baseF0: number;
  phrases: string[];
};

type PhraseSummary = {
  phrase: string;
  events: number;
  totalTime: number;
  voicedEvents: number;
  voicedTime: number;
  silenceTime: number;
  unvoicedNonsilenceTime: number;
  voicedRatio: number;
  f0Min: number;
  f0Max: number;
  f0Mean: number;
  f0Span: number;
  f1MeanVoiced: number;
  f2MeanVoiced: number;
  b1MeanVoiced: number;
  avMeanVoiced: number;
  ahMeanVoiced: number;
};

type GoldenSummary = {
  corpus: string;
  baseF0: number;
  summaries: PhraseSummary[];
};

function loadCorpus(): Corpus {
  return JSON.parse(readFileSync("test/phrase-sets/linguistic.json", "utf8")) as Corpus;
}

function loadGolden(): GoldenSummary {
  return JSON.parse(
    readFileSync("test/golden/declarative-corpus-summary.json", "utf8")
  ) as GoldenSummary;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function summarizePhrase(phrase: string, baseF0: number): PhraseSummary {
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
}

describe("tts frontend declarative golden summary", () => {
  it("matches locked corpus summary metrics", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const corpus = loadCorpus();
      const golden = loadGolden();

      expect(golden.corpus).toBe(corpus.name);
      expect(golden.baseF0).toBe(corpus.baseF0);
      expect(golden.summaries.length).toBe(corpus.phrases.length);

      const actual = corpus.phrases.map((phrase) => summarizePhrase(phrase, corpus.baseF0));
      for (let i = 0; i < actual.length; i += 1) {
        const a = actual[i];
        const g = golden.summaries[i];
        expect(a.phrase).toBe(g.phrase);
        expect(a.events).toBe(g.events);
        expect(a.voicedEvents).toBe(g.voicedEvents);
        expect(a.totalTime).toBeCloseTo(g.totalTime, 6);
        expect(a.voicedTime).toBeCloseTo(g.voicedTime, 6);
        expect(a.silenceTime).toBeCloseTo(g.silenceTime, 6);
        expect(a.unvoicedNonsilenceTime).toBeCloseTo(g.unvoicedNonsilenceTime, 6);
        expect(a.voicedRatio).toBeCloseTo(g.voicedRatio, 6);
        expect(a.f0Min).toBeCloseTo(g.f0Min, 6);
        expect(a.f0Max).toBeCloseTo(g.f0Max, 6);
        expect(a.f0Mean).toBeCloseTo(g.f0Mean, 6);
        expect(a.f0Span).toBeCloseTo(g.f0Span, 6);
        expect(a.f1MeanVoiced).toBeCloseTo(g.f1MeanVoiced, 6);
        expect(a.f2MeanVoiced).toBeCloseTo(g.f2MeanVoiced, 6);
        expect(a.b1MeanVoiced).toBeCloseTo(g.b1MeanVoiced, 6);
        expect(a.avMeanVoiced).toBeCloseTo(g.avMeanVoiced, 6);
        expect(a.ahMeanVoiced).toBeCloseTo(g.ahMeanVoiced, 6);
      }
    } finally {
      warnSpy.mockRestore();
    }
  });
});
