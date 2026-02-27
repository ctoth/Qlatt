import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { textToKlattTrack } from "../src/tts-frontend";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";

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

function summarizePhrase(phrase: string, baseF0: number): PhraseSummary {
  const track = textToKlattTrack(phrase, baseF0);
  return {
    phrase,
    ...summarizeTrackMetrics(track),
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
