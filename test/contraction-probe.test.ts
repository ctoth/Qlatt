import { describe, it, expect } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import { normalizeText } from "../src/g2p/text-normalize";

describe("contraction probe", () => {
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
  }, 30_000);

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
});
