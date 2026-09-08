import { describe, expect, it } from "vitest";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  QLATT_ENGLISH_RULEPACK,
} from "../src/declarative-frontend/rule-pack";

const spec = compileRuleEngineSpec({
  ...QLATT_ENGLISH_RULEPACK,
  phases: QLATT_ENGLISH_RULEPACK.phases.map((phase) =>
    phase.name === "duration" ? { name: "duration", rules: ["speech_rate_scaling"] } : phase,
  ),
});

function scale(type: string, duration: number, rate: number, floor = 0) {
  const utterance = new Utterance({
    itemTypes: {
      segment: {
        features: {
          type: { kind: "string" },
          phoneme: { kind: "string" },
          duration: { kind: "number" },
          durationFloor: { kind: "number" },
        },
      },
    },
    relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
  });
  const meta = { reason: "controlled tempo fixture", citations: ["Crystal & House 1982 Table VI"] };
  const item = utterance.createItem("segment", "sample");
  for (const [key, value] of Object.entries({
    type,
    phoneme: "sample",
    duration,
    durationFloor: floor,
  }))
    item.set(key, value, meta);
  utterance.segments.append(item, meta);
  runGraphRuleEngine(utterance, spec, {
    phases: ["duration"],
    parameters: { policy: { duration: { rate_scale: rate } } },
  });
  return { duration: Number(item.get("duration")), utterance };
}

describe("Crystal & House 1982 Table VI tempo ratios", () => {
  // The vowel ratio defines the numerical rate anchor; the remaining classes
  // have their own measured response to the same FAST/SLOW group contrast.
  const fastRate = 111.6 / 93.4;
  it.each([
    ["vowel", 111.6, 93.4],
    ["nasal", 81.0, 66.4],
    ["liquid", 81.0, 66.4],
    ["glide", 81.0, 66.4],
    ["stop_closure", 73.3, 62.0],
    ["flap", 73.3, 62.0],
    ["stop_release", 73.3, 62.0],
    ["stop_aspiration", 73.3, 62.0],
    ["fricative", 75.6, 64.4],
    ["affricate", 118.7, 102.2],
  ] as const)("maps the %s slow mean to its fast mean", (type, slow, fast) => {
    expect(scale(type, slow, fastRate).duration).toBe(Math.round(fast));
    expect(scale(type, slow, 1).duration).toBe(slow);
  });

  it("scales total duration and retains the hard floor", () => {
    expect(scale("vowel", 100, fastRate, 42).duration).toBe(84);
    expect(scale("vowel", 45, 2, 42).duration).toBe(42);
  });

  it("emits the table citation on the runtime duration write", () => {
    const { utterance } = scale("nasal", 81, fastRate);
    expect(
      utterance.provenance.getDecisions().filter((d) => d.reason.includes("speech_rate_scaling")),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          citations: expect.arrayContaining([
            expect.stringContaining("Crystal & House 1982 Table VI"),
          ]),
        }),
      ]),
    );
  });
});
