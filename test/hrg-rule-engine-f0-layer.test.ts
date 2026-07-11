import { describe, expect, it } from "vitest";
import { replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        active: { kind: "boolean" },
      },
    },
    f0Layer: {
      features: {
        value: { kind: "number" },
        tag: { kind: "string" },
        layer: { kind: "string" },
        duration_frames: { kind: "number" },
        profile_points: { kind: "array", items: { kind: "number" } },
      },
    },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    f0_layer: { kind: "list", itemTypes: ["f0Layer"] },
  },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Taylor, Black & Caley 2001"],
};

describe("graph-native F0-layer execution", () => {
  it("records profile and gesture commands as anchored typed Items", () => {
    const utterance = new Utterance(SCHEMA);
    const fixture = utterance.beginTransaction(META);
    const vowel = fixture.createItem("segment", "vowel");
    fixture.set(vowel, "phoneme", "AA");
    fixture.set(vowel, "active", true);
    fixture.append("Segment", vowel);
    fixture.partitionAnchors([vowel], utterance.axis.start.id, utterance.axis.end.id);
    fixture.commit();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: { type: "base", features: { phoneme: [], active: [true, false] } },
        f0_layer: { type: "point", value_type: "number" },
      },
      rules: {
        baseline: {
          kind: "f0_layer",
          select: { relation: "Segment", where: "current.id == 'vowel'" },
          insert: {
            layer: "baseline",
            at: "at_sync(current.sync_left)",
            value: 0,
            profile_points: [1100, 1050, 1000],
            tag: "baseline",
          },
          citations: ["Klatt 1982"],
        },
        accent: {
          kind: "f0_layer",
          select: { relation: "Segment", where: "current.id == 'vowel'" },
          insert: {
            layer: "hat",
            at: "merge(current, {'ratio': 0.75})",
            value: 25,
            duration_frames: 4,
            tag: "accent",
          },
          citations: ["Klatt 1982"],
        },
      },
      phases: [{ name: "prosody", rules: ["baseline", "accent"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const commands = utterance.relation("f0_layer").listItems();
    expect(commands.map((item) => [item.get("layer"), item.get("value")])).toEqual([
      ["baseline", 0],
      ["hat", 25],
    ]);
    expect(commands[0].get("profile_points")).toEqual([1100, 1050, 1000]);
    expect(commands[1].get("duration_frames")).toBe(4);
    expect(utterance.temporalAnchor(commands[0])).toEqual(expect.objectContaining({ ratio: 0 }));
    expect(utterance.temporalAnchor(commands[1])).toEqual(expect.objectContaining({ ratio: 0.75 }));
    expect(replayJournal(SCHEMA, utterance.journal()).graphDigest()).toBe(utterance.graphDigest());
  });
});
