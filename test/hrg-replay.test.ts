import { describe, expect, it } from "vitest";
import { replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        dur_ms: { kind: "number" },
        metadata: {
          kind: "object",
          fields: { source: { kind: "string" } },
        },
      },
    },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
  },
} as const satisfies HrgSchema;

const META = {
  ruleId: "inventory_segment",
  phase: "structural",
  tag: "inventory",
  reason: "materialize inventory segment",
  citations: ["Taylor, Black & Caley 2001"],
};

describe("HRG checkpoints and deterministic replay", () => {
  it("reconstructs an identical graph digest from committed journal data", () => {
    const utterance = new Utterance(SCHEMA);
    const metadata = { source: "inventory" };
    const create = utterance.beginTransaction(META);
    const segment = create.createItem("segment", "s1");
    create.set(segment, "phoneme", "AA");
    create.set(segment, "metadata", metadata);
    create.append("Segment", segment);
    create.commit();
    const structural = utterance.checkpoint("structural");

    const duration = utterance.beginTransaction({
      ...META,
      ruleId: "duration_rule",
      phase: "duration",
      tag: "duration",
      reason: "assign duration",
      citations: ["Klatt 1976"],
    });
    expect(duration.read(segment, "phoneme")).toBe("AA");
    duration.set(segment, "dur_ms", 120);
    duration.commit();
    const finalized = utterance.checkpoint("duration");

    metadata.source = "mutated after commit";
    const replayed = replayJournal(SCHEMA, utterance.journal());
    expect(replayed.graphDigest()).toBe(utterance.graphDigest());
    expect(replayed.getItem("s1")?.get("metadata")).toEqual({ source: "inventory" });
    expect(replayed.journal()).toEqual(utterance.journal());

    const structuralReplay = replayJournal(
      SCHEMA,
      utterance.journal().slice(0, structural.journalLength),
    );
    expect(structuralReplay.graphDigest()).toBe(structural.digest);
    expect(finalized.journalLength).toBe(2);
    expect(utterance.checkpoints()).toEqual([structural, finalized]);
  });
});
