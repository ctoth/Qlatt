import { describe, expect, it } from "vitest";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

// #219: three cited rules were declared but listed in no phase, so their
// behaviour was absent. These assertions pin the restored behaviour.

function policyNumber(frontendId: string, path: string[]): number {
  let node: unknown = loadBundledRulepackSpec(frontendId).parameters;
  for (const key of ["policy", ...path]) {
    if (typeof node !== "object" || node === null)
      throw new Error(`missing policy ${path.join(".")}`);
    node = (node as Record<string, unknown>)[key];
  }
  const value =
    typeof node === "object" && node !== null ? (node as { value?: unknown }).value : node;
  if (typeof value !== "number") throw new Error(`policy ${path.join(".")} is not a number`);
  return value;
}

describe("transition_override (Stevens & House 1956; Hertz 1991)", () => {
  it("stamps per-class transition durations that lowering consumes", () => {
    const stop = policyNumber("qlatt-english", ["formant", "transition_ms_stop"]);
    const fricative = policyNumber("qlatt-english", ["formant", "transition_ms_fricative"]);
    const fallback = policyNumber("qlatt-english", ["formant", "transition_ms_default"]);
    const { utterance } = textToKlattTrackDetailed("Stop safe.", 110, 30);
    // Structural rules replace items and mark the originals inactive; only live
    // segments reach lowering, so only they must carry a transition duration.
    const live = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false);
    const byType = new Map<string, Set<number>>();
    for (const item of live) {
      const type = String(item.get("type"));
      const value = item.get("transition_ms");
      expect(typeof value, `${item.id} (${type}) transition_ms`).toBe("number");
      const set = byType.get(type) ?? new Set<number>();
      set.add(Number(value));
      byType.set(type, set);
    }
    expect([...(byType.get("stop_closure") ?? [])]).toEqual([stop]);
    expect([...(byType.get("stop_release") ?? [])]).toEqual([stop]);
    expect([...(byType.get("fricative") ?? [])]).toEqual([fricative]);
    expect([...(byType.get("vowel") ?? [])]).toEqual([fallback]);
    const write = live
      .find((item) => item.get("type") === "fricative")
      ?.latestWrite("transition_ms");
    expect(write?.ruleId).toBe("transition_override");
    expect(write?.citations).toEqual(
      expect.arrayContaining([expect.stringContaining("Stevens & House 1956")]),
    );
  });
});

describe("stress_spectral_tilt (Sluijter & van Heuven 1996)", () => {
  it("reduces TL on stressed vowels by the cited policy amount and leaves unstressed vowels alone", () => {
    const reduction = policyNumber("qlatt-english", ["effort", "stress_tilt_reduction_db"]);
    const { utterance } = textToKlattTrackDetailed("Banana.", 110, 30);
    const vowels = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("type") === "vowel");
    const stressed = vowels.filter((item) => Number(item.get("stress")) >= 1);
    const unstressed = vowels.filter((item) => Number(item.get("stress")) === 0);
    expect(stressed.length).toBeGreaterThan(0);
    expect(unstressed.length).toBeGreaterThan(0);
    for (const item of stressed) {
      const writes = item.writes("TL");
      const index = writes.findIndex((write) => write.ruleId === "stress_spectral_tilt");
      expect(index, `${item.id} has a stress_spectral_tilt TL write`).toBeGreaterThan(0);
      const before = Number(writes[index - 1].value);
      expect(Number(writes[index].value)).toBeCloseTo(before - reduction, 9);
      expect(writes[index].tag).toBe("stress");
    }
    for (const item of unstressed) {
      expect(item.writes("TL").some((write) => write.ruleId === "stress_spectral_tilt")).toBe(
        false,
      );
    }
  });
});

describe("dectalk_question_glide_reset (DECtalk 4.63 ph_inton1.c Rules 7-8)", () => {
  it("cancels the question rise on the question_glide layer at the '?' boundary", () => {
    const rise = policyNumber("dectalk-english", ["f0", "question_gesture_rise_hz"]);
    const { utterance } = textToKlattTrackDetailed("Are you home? Yes.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const glide = utterance
      .relation("Tilt")
      .listItems()
      .filter((item) => item.get("layer") === "question_glide");
    const rises = glide.filter((item) => Number(item.get("value")) > 0);
    const resets = glide.filter((item) => item.get("tag") === "f0_boundary_reset");
    expect(rises.map((item) => item.get("value"))).toEqual([rise]);
    expect(resets.map((item) => item.get("value"))).toEqual([-rise]);
    expect(resets[0].latestWrite("value")?.ruleId ?? resets[0].get("ruleId")).toBeDefined();
    const sum = glide.reduce((total, item) => total + Number(item.get("value")), 0);
    expect(sum).toBe(0);
  });
});
