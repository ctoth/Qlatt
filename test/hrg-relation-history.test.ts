import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance, whyRelationMembership } from "../src/declarative-frontend/hrg";

const SCHEMA = {
  itemTypes: {
    word: { features: { text: { kind: "string" } } },
    segment: { features: { phoneme: { kind: "string" } } },
    point: { features: { value: { kind: "number" } } },
  },
  relations: {
    Word: { kind: "list", itemTypes: ["word"] },
    Segment: { kind: "list", itemTypes: ["segment"] },
    SylStructure: { kind: "tree", itemTypes: ["word", "segment"] },
  },
} as const satisfies HrgSchema;

const INPUT = {
  reason: "construct linguistic relation",
  citations: ["Taylor, Black & Caley 2001"],
  stage: "transcribe" as const,
};

describe("HRG relation-write history", () => {
  it("stamps ordered membership and makes it directly why-queryable", () => {
    const utterance = new Utterance(SCHEMA);
    const first = utterance.createItem("segment", "s1");
    const second = utterance.createItem("segment", "s2");

    const firstWrite = utterance.segments.append(first, INPUT).write;
    const secondWrite = utterance.segments.append(second, INPUT).write;

    expect(firstWrite.operation).toBe("append");
    expect(firstWrite.version).toBe(0);
    expect(secondWrite.version).toBe(1);
    expect(secondWrite.previousItemId).toBe(first.id);
    expect(secondWrite.parents).toContain(firstWrite.decisionId);
    const history = utterance.segments.writes();
    expect(history).toEqual([firstWrite, secondWrite]);
    expect(Object.isFrozen(history)).toBe(true);
    expect(Object.isFrozen(secondWrite)).toBe(true);

    const chain = whyRelationMembership(utterance, second, "Segment");
    expect(chain[0].id).toBe(secondWrite.decisionId);
    expect(chain.map((decision) => decision.id)).toContain(firstWrite.decisionId);
  });

  it("stamps parent and prior-sibling topology for tree daughters", () => {
    const utterance = new Utterance(SCHEMA);
    const word = utterance.createItem("word", "w1");
    const first = utterance.createItem("segment", "s1");
    const second = utterance.createItem("segment", "s2");

    const root = utterance.sylStructure.addRoot(word, INPUT);
    const firstDaughter = utterance.sylStructure.addDaughter(root, first, INPUT);
    const secondDaughter = utterance.sylStructure.addDaughter(root, second, INPUT);

    expect(firstDaughter.write.parentItemId).toBe(word.id);
    expect(firstDaughter.write.parents).toContain(root.write.decisionId);
    expect(secondDaughter.write.previousItemId).toBe(first.id);
    expect(secondDaughter.write.parents).toEqual(
      expect.arrayContaining([root.write.decisionId, firstDaughter.write.decisionId]),
    );
  });

  it("records nothing when relation validation rejects the mutation", () => {
    const utterance = new Utterance(SCHEMA);
    const point = utterance.createItem("point");
    expect(() => utterance.segments.append(point, INPUT)).toThrowError(/E_HRG_RELATION_ITEM_TYPE/);
    expect(utterance.segments.writes()).toEqual([]);
    expect(utterance.provenance.getDecisions()).toEqual([]);
  });
});
