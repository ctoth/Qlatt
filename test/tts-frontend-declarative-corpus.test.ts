import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { textToKlattTrack } from "../src/tts-frontend";

type PhraseCorpus = {
  name: string;
  baseF0: number;
  phrases: string[];
};

function loadCorpus(): PhraseCorpus {
  const raw = readFileSync("test/phrase-sets/linguistic.json", "utf8");
  return JSON.parse(raw) as PhraseCorpus;
}

describe("tts frontend declarative corpus integration", () => {
  it("produces stable finite tracks for linguistic phrase corpus", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const corpus = loadCorpus();
      expect(corpus.phrases.length).toBeGreaterThan(0);

      for (const phrase of corpus.phrases) {
        const track = textToKlattTrack(phrase, corpus.baseF0);
        expect(track.length).toBeGreaterThan(1);

        let prevTime = -1;
        for (const frame of track) {
          expect(Number.isFinite(frame.time)).toBe(true);
          expect(frame.time).toBeGreaterThanOrEqual(prevTime);
          prevTime = frame.time;

          const f0 = frame.params?.F0;
          if (f0 != null) {
            expect(Number.isFinite(f0)).toBe(true);
            expect(f0).toBeGreaterThanOrEqual(0);
          }
        }
      }
    } finally {
      warnSpy.mockRestore();
    }
  }, 75_000);
});
