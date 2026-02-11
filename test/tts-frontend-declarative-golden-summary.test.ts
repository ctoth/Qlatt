import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { textToKlattTrack } from "../src/tts-frontend.js";

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
  f0Min: number;
  f0Max: number;
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
        expect(a.f0Min).toBeCloseTo(g.f0Min, 6);
        expect(a.f0Max).toBeCloseTo(g.f0Max, 6);
      }
    } finally {
      warnSpy.mockRestore();
    }
  });
});
