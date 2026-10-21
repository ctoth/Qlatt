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

// This block used to pin dectalk_question_glide_reset: a held glide for the
// question rise and a cancelling command at the '?' silence, cited to
// ph_inton1.c Rules 7-8. That file holds phinton_classic, which nothing
// calls. The live routine (Ph_inton2.c:1238-1263) issues the question
// gestures as two IMPULSE commands, which end by themselves, and F0 is
// rendered afresh for every clause, so there is nothing to cancel. The rule
// is gone; this pins what replaced it.
describe("question gestures (DECtalk 4.63 Ph_inton2.c:1238-1263 Rule 4)", () => {
  it("issues the dip and the rise as two impulses on the stress layer, and no glide", () => {
    const dip = policyNumber("dectalk-english", ["f0", "question_gesture_dip_hz"]);
    const rise = policyNumber("dectalk-english", ["f0", "question_gesture_rise_hz"]);
    const { utterance } = textToKlattTrackDetailed("Are you home? Yes.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const commands = utterance.relation("Tilt").listItems();
    expect(commands.filter((item) => item.get("layer") === "question_glide")).toEqual([]);
    const gestures = commands.filter((item) =>
      ["f0_question_dip", "f0_question_rise"].includes(String(item.get("tag"))),
    );
    // "Are you home?" has three words: the full rise, length 20.
    expect(
      gestures.map((item) => [
        item.get("tag"),
        item.get("layer"),
        item.get("value"),
        item.get("duration_frames"),
      ]),
    ).toEqual([
      ["f0_question_dip", "stress", dip, 15],
      ["f0_question_rise", "stress", rise, 20],
    ]);
    for (const item of gestures) expect(item.latestWrite("value")?.ruleId).toBeDefined();
  });
});
