import { describe, it, expect } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import { normalizeText } from "../src/g2p/text-normalize";
import { transcribeText } from "../src/transcribe-text";

describe("contraction probe", () => {
  it("traces full passage handling", () => {
    const passages = [
      `"Sure. It's elegant as..." I paused, realizing what was scrawled on her forehead had finally changed. I sighed.`,
      `The "Miss Me?" had been replaced with a new statement. "Fuck the Cheese Dicks."`,
      `"It's cheese sticks, Samantha. Sticks. Not cheese dicks."`,
    ];

    for (const passage of passages) {
      console.log(`\n========================================`);
      console.log(`INPUT: ${passage}`);

      // Step 1: normalize
      const normalized = normalizeText(passage);
      console.log(`NORMALIZED: "${normalized}"`);

      // Step 2: transcribe (word-by-word)
      const words = normalized.split(/\s+/).filter(Boolean);
      console.log(`WORDS (${words.length}): ${words.join(' | ')}`);

      // Step 3: full pipeline
      const track = textToKlattTrack(passage, 110, 30);
      const phonemes = track.map(e => e.phoneme).filter(Boolean);
      console.log(`PHONEMES (${phonemes.length}): ${phonemes.join(' ')}`);
      console.log(`DURATION: ${track[track.length-1]?.time?.toFixed(3)}s`);
    }
    expect(true).toBe(true);
  });

  it("handles curly/smart apostrophes same as ASCII", () => {
    const pairs = [
      ["it's",  "it\u2019s"],   // RIGHT SINGLE QUOTATION MARK
      ["don't", "don\u2019t"],
      ["can't", "can\u2019t"],
      ["she's", "she\u2019s"],
      ["we're", "we\u2019re"],
    ];

    for (const [ascii, curly] of pairs) {
      const nAscii = normalizeText(ascii);
      const nCurly = normalizeText(curly);
      console.log(`ASCII "${ascii}" → "${nAscii}"  |  CURLY "${curly}" → "${nCurly}"`);
      expect(nCurly).toBe(nAscii);

      const tAscii = textToKlattTrack(ascii, 110, 30);
      const tCurly = textToKlattTrack(curly, 110, 30);
      const pAscii = tAscii.map(e => e.phoneme).filter(Boolean).join(" ");
      const pCurly = tCurly.map(e => e.phoneme).filter(Boolean).join(" ");
      expect(pCurly).toBe(pAscii);
    }
  });

  it("handles curly double quotes and ellipsis", () => {
    // Typographic: \u201C = ", \u201D = ", \u2026 = …
    const input = "\u201CSure. It\u2019s elegant as\u2026\u201D";
    const normalized = normalizeText(input);
    console.log(`INPUT: ${input}`);
    console.log(`NORMALIZED: "${normalized}"`);
    // Apostrophe preserved, curly quotes stripped, ellipsis expanded
    expect(normalized).toContain("it's");
    expect(normalized).not.toContain("\u2019");
    expect(normalized).not.toContain("\u201C");
    expect(normalized).not.toContain("\u2026");
  });

  it("traces individual tricky words", () => {
    const words = [
      "it's", "I", "don't", "can't", "she's", "we're",
      "paused", "realizing", "scrawled", "forehead",
      "sighed", "replaced", "statement", "Samantha",
      "elegant", "cheese", "sticks", "dicks",
    ];

    for (const word of words) {
      const normalized = normalizeText(word);
      const track = textToKlattTrack(word, 110, 30);
      const phonemes = track.map(e => e.phoneme).filter(Boolean);
      const uniq = [...new Set(phonemes)].filter(p => p !== 'SIL' && p !== 'GS');
      console.log(`${word.padEnd(15)} → normalized="${normalized}" → ${uniq.join(' ')}`);
    }
    expect(true).toBe(true);
  });
});
