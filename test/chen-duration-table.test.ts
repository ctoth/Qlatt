import { describe, expect, it } from "vitest";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  QLATT_ENGLISH_RULEPACK,
} from "../src/declarative-frontend/rule-pack";
import { qlattInventoryResource } from "./utils/qlatt-english-inventory";

function vowelBeforeStop(voiced: boolean, duration = 100, floor?: number) {
  const utterance = new Utterance({
    itemTypes: {
      segment: {
        features: {
          phoneme: { kind: "string" },
          type: { kind: "string" },
          duration: { kind: "number" },
          inherentDuration: { kind: "number" },
          durationFloor: { kind: "number" },
          voiced: { kind: "boolean" },
          voiceless: { kind: "boolean" },
        },
      },
    },
    relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
  });
  const source = { reason: "controlled duration fixture", citations: ["Chen 1970 Table V"] };
  const vowel = utterance.createItem("segment", "vowel");
  vowel.set("phoneme", "AE1", source);
  vowel.set("type", "vowel", source);
  vowel.set("duration", duration, source);
  vowel.set("inherentDuration", 100, source);
  if (floor !== undefined) vowel.set("durationFloor", floor, source);
  utterance.segments.append(vowel, source);
  const stop = utterance.createItem("segment", "stop");
  stop.set("phoneme", voiced ? "B_CL" : "P_CL", source);
  stop.set("type", "stop_closure", source);
  stop.set("voiced", voiced, source);
  stop.set("voiceless", !voiced, source);
  utterance.segments.append(stop, source);
  runGraphRuleEngine(
    utterance,
    compileRuleEngineSpec({
      ...QLATT_ENGLISH_RULEPACK,
      phases: QLATT_ENGLISH_RULEPACK.phases.map((phase) =>
        phase.name === "duration" ? { name: "duration", rules: ["vowel_shortening"] } : phase,
      ),
    }),
    { phases: ["duration"], inventory: qlattInventoryResource(utterance) },
  );
  return { duration: Number(vowel.get("duration")), utterance };
}

describe("Chen 1970 Table V vowel duration calibration", () => {
  it("uses the English measured voiceless/voiced ratio with the existing voiced reference", () => {
    const voiced = vowelBeforeStop(true);
    const voiceless = vowelBeforeStop(false);
    expect(voiced.duration).toBe(112);
    // The engine rounds durations to milliseconds after applying the rule.
    expect(Math.abs(voiceless.duration - voiced.duration * (146 / 238))).toBeLessThanOrEqual(1);
  });

  it("carries the specific table citation into the contextual duration decision", () => {
    const { utterance } = vowelBeforeStop(false);
    expect(
      utterance.provenance
        .getDecisions()
        .filter((decision) => decision.reason.includes("vowel_shortening")),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          citations: expect.arrayContaining([expect.stringContaining("Chen 1970 Table V")]),
        }),
      ]),
    );
  });

  it("honors explicit floors and does not divide by zero at the floor", () => {
    expect(vowelBeforeStop(false, 100, 0).duration).toBe(74);
    expect(vowelBeforeStop(false, 50).duration).toBe(42);
    expect(vowelBeforeStop(false, 42).duration).toBe(42);
    expect(vowelBeforeStop(false, 100, 100).duration).toBe(100);
  });
});
