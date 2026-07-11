import { describe, expect, it } from "vitest";
import { Utterance, whyFeature } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import {
  attachDirectionsToUtterance,
  DIRECTION_ITEM_SCHEMA,
  parseDirectionInput,
} from "../src/input/parse";

const SCHEMA = {
  itemTypes: {
    direction: DIRECTION_ITEM_SCHEMA,
  },
  relations: {
    Affect: { kind: "list", itemTypes: ["direction"] },
    Intonation: { kind: "list", itemTypes: ["direction"] },
    Break: { kind: "list", itemTypes: ["direction"] },
  },
} as const satisfies HrgSchema;

describe("Direction Track attachment to static HRG fixtures", () => {
  it("attaches typed control records and parents every write to its input decision", () => {
    const parsed = parseDirectionInput({
      score: { text: "never stop now" },
      directionTrack: {
        version: "1",
        global: { affect: { preset: "angry", degree: 0.7 } },
        spans: [
          {
            id: "emphasis",
            anchor: { unit: "word", start: 0 },
            emphasis: { level: "strong" },
          },
          {
            id: "break",
            anchor: { unit: "word", start: 1 },
            break: { strength: 3, timeMs: 120 },
          },
        ],
      },
    });
    const utterance = new Utterance(SCHEMA, parsed.provenance);

    const attached = attachDirectionsToUtterance(parsed, utterance);

    expect(attached).toHaveLength(3);
    expect(utterance.relation("Affect").listItems()).toHaveLength(1);
    expect(utterance.relation("Intonation").listItems()).toHaveLength(1);
    expect(utterance.relation("Break").listItems()).toHaveLength(1);

    for (const direction of parsed.directions) {
      const item = utterance.getItem(`direction_${direction.id}`);
      if (!item) throw new Error(`missing attached direction ${direction.id}`);
      expect(item.get("kind")).toBe(direction.kind);
      expect(item.node(direction.hrgRelation)?.write.parents).toContain(direction.decision.id);
      expect(item.latestWrite("scope")?.parents).toContain(direction.decision.id);
      expect(whyFeature(utterance, item, "scope").map((decision) => decision.id)).toContain(
        direction.decision.id,
      );
    }

    const affect = utterance.relation("Affect").listItems()[0];
    expect(affect.get("delta")).toMatchObject({ durationScale: expect.any(Number) });
    expect(Object.isFrozen(affect.get("delta"))).toBe(true);
  });
});
