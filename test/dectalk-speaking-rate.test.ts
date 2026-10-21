/**
 * The API's rate multiplier, for a frontend whose rules take the speaking rate
 * in words per minute (dectalk-english, `policy.rate.words_per_minute`): what
 * it becomes, what is said when it is rounded or limited, and that durations
 * stay whole frames. That the result is DECtalk's audio is
 * test/dectalk-rates-exact.test.ts.
 */

import { describe, expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const PHRASE = "The quick brown fox.";
const FRAME_MS = 6.4;

function speak(rate: number | undefined, frontendId = "dectalk-english") {
  const diagnostics = createDiagnostics({ maxEntries: 1000 });
  const provenance = createProvenanceCollector();
  const result = textToKlattTrackDetailed(PHRASE, undefined, 30, {
    frontendId,
    ...(rate === undefined ? {} : { rate }),
    diagnostics,
    provenance,
  });
  const rateCodes = diagnostics
    .getEntries()
    .filter((entry) => entry.code?.includes("RATE"))
    .map((entry) => entry.code);
  const decision = provenance
    .getDecisions()
    .find((record) => record.type === "speaking_rate_selected");
  return { ...result, diagnostics, rateCodes, decision };
}

/**
 * Frames per DECtalk allophone. A stop is one allophone and several Segments
 * here (`T`, `T_REL`, `T_ASP`), which are summed, as
 * scripts/oracle/compare-durations.ts does.
 */
function allophoneFrames(result: ReturnType<typeof speak>): number[] {
  const allophones: { name: string; frames: number }[] = [];
  for (const item of result.utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    const frames = Number(item.get("duration")) / FRAME_MS;
    const previous = allophones[allophones.length - 1];
    if (previous && phoneme.startsWith(`${previous.name}_`)) previous.frames += frames;
    else allophones.push({ name: phoneme, frames });
  }
  return allophones.map((allophone) => allophone.frames);
}

describe("dectalk-english speaking rate", () => {
  it("rate 1, given or not, is 180 words per minute and says nothing", () => {
    for (const rate of [1, undefined]) {
      const result = speak(rate);
      expect(result.rateCodes).toEqual([]);
      expect(result.decision?.reason).toContain("policy.timing.speaking_rate_wpm = 180");
      expect(result.decision?.citations.join(" ")).toContain("phinit.c:119");
    }
    expect(speak(undefined).track).toEqual(speak(1).track);
  });

  it("a rate that is a whole number of words per minute is used as it is", () => {
    for (const wpm of [100, 120, 126, 161, 240, 300]) {
      const result = speak(wpm / 180);
      expect(result.rateCodes, String(wpm)).toEqual([]);
      expect(result.decision?.reason, String(wpm)).toContain(
        `policy.timing.speaking_rate_wpm = ${wpm}`,
      );
    }
  });

  it("another rate is rounded, and the diagnostic names both rates", () => {
    const result = speak(0.701);
    expect(result.rateCodes).toEqual(["I_RATE_ROUNDED"]);
    const entry = result.diagnostics.getEntries().find((e) => e.code === "I_RATE_ROUNDED");
    expect(entry?.message).toContain("126.18");
    expect(entry?.message).toContain("using 126");
    const data = entry?.data as { requestedWordsPerMinute: number; usedWordsPerMinute: number };
    expect(data.usedWordsPerMinute).toBe(126);
    expect(data.requestedWordsPerMinute).toBeCloseTo(126.18, 6);
    expect(result.track).toEqual(speak(126 / 180).track);
  });

  it("a rate above DECtalk's limit is DECtalk's limit, and the diagnostic names both", () => {
    const result = speak(4);
    expect(result.rateCodes).toContain("W_RATE_CLAMPED");
    const entry = result.diagnostics.getEntries().find((e) => e.code === "W_RATE_CLAMPED");
    expect(entry?.level).toBe("warn");
    expect(entry?.message).toContain("720");
    expect(entry?.message).toContain("using 550");
    expect(result.decision?.reason).toContain("policy.timing.speaking_rate_wpm = 550");
    expect(result.decision?.reason).toContain("limits 50 to 550");
    expect(result.track).toEqual(speak(550 / 180).track);
  });

  it("a rate below DECtalk's limit is DECtalk's limit", () => {
    const result = speak(0.1);
    expect(result.rateCodes).toContain("W_RATE_CLAMPED");
    expect(result.decision?.reason).toContain("policy.timing.speaking_rate_wpm = 50");
  });

  it("outside the rates whose rules are all ported, it warns", () => {
    // 50 to 349: every rate-dependent rule this frontend can reach is ported.
    for (const wpm of [50, 99, 100, 300, 349]) {
      expect(speak(wpm / 180).rateCodes, String(wpm)).toEqual([]);
    }
    // 350 and above: the glottal area's forced speed (ph_draw.c:4069-4072) is not.
    expect(speak(350 / 180).rateCodes).toEqual(["W_RATE_RULES_NOT_PORTED"]);
    expect(speak(550 / 180).rateCodes).toEqual(["W_RATE_RULES_NOT_PORTED"]);
  });

  it("every allophone lasts a whole number of frames at any rate", () => {
    for (const wpm of [75, 120, 161, 180, 251, 300, 550]) {
      for (const frames of allophoneFrames(speak(wpm / 180))) {
        expect(Math.abs(frames - Math.round(frames)), `${wpm}: ${frames}`).toBeLessThan(1e-9);
      }
    }
  });

  it("slower is longer and faster is shorter, pauses included", () => {
    const total = (wpm: number) =>
      allophoneFrames(speak(wpm / 180)).reduce((sum, frames) => sum + frames, 0);
    expect(total(120)).toBeGreaterThan(total(180));
    expect(total(180)).toBeGreaterThan(total(300));
  });

  it("a frontend without the mapping has no such decision and keeps its multiplier", () => {
    const result = speak(2, "qlatt-english");
    expect(result.decision).toBeUndefined();
    expect(result.rateCodes).toEqual([]);
    expect(result.track).not.toEqual(speak(1, "qlatt-english").track);
  });
});
