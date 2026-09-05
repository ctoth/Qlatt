import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import { createProvenanceCollector } from "../src/provenance";

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
    create.set(segment, "phoneme", "AA", "phoneme_target");
    create.set(segment, "metadata", metadata, "metadata_source");
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
    expect(replayed.getItem("s1")?.latestWrite("phoneme")?.tag).toBe("phoneme_target");
    expect(replayed.getItem("s1")?.latestWrite("metadata")?.tag).toBe("metadata_source");
    expect(replayed.journal()).toEqual(utterance.journal());

    const structuralReplay = replayJournal(
      SCHEMA,
      utterance.journal().slice(0, structural.journalLength),
    );
    expect(structuralReplay.graphDigest()).toBe(structural.digest);
    expect(finalized.journalLength).toBe(2);
    expect(utterance.checkpoints()).toEqual([structural, finalized]);
  });

  it("replays active and suppressed association edge versions exactly", () => {
    const utterance = new Utterance(SCHEMA);
    const create = utterance.beginTransaction(META);
    const from = create.createItem("segment", "from");
    const to = create.createItem("segment", "to");
    create.set(from, "phoneme", "T");
    create.set(to, "phoneme", "AA");
    create.append("Segment", from);
    create.append("Segment", to);
    create.commit();

    const link = utterance.beginTransaction({ ...META, ruleId: "link" });
    link.associate("cv", from, to);
    link.commit();
    const unlink = utterance.beginTransaction({ ...META, ruleId: "unlink" });
    unlink.disassociate("cv", from, to);
    unlink.commit();

    const replayed = replayJournal(SCHEMA, utterance.journal());
    const replayedFrom = replayed.getItem("from");
    const replayedTo = replayed.getItem("to");
    if (!replayedFrom || !replayedTo) throw new Error("missing replayed association items");
    expect(replayed.graphDigest()).toBe(utterance.graphDigest());
    expect(
      replayed.associationWrites(replayedFrom, "cv", replayedTo).map((write) => write.active),
    ).toEqual([true, false]);
  });

  it("preserves original decision ids when non-graph decisions precede transactions", () => {
    const provenance = createProvenanceCollector();
    provenance.add({
      stage: "frontend",
      type: "resource_selected",
      subject: "resource:fixture",
      reason: "select fixture resource",
      citations: ["Taylor, Black & Caley 2001"],
    });
    const utterance = new Utterance(SCHEMA, provenance);
    const create = utterance.beginTransaction(META);
    const segment = create.createItem("segment", "s1");
    create.set(segment, "phoneme", "AA");
    create.append("Segment", segment);
    create.commit();

    const replayed = replayJournal(SCHEMA, utterance.journal(), provenance.getDecisions());
    expect(replayed.graphDigest()).toBe(utterance.graphDigest());
    expect(replayed.getItem("s1")?.latestWrite("phoneme")?.decisionId).toBe(
      utterance.getItem("s1")?.latestWrite("phoneme")?.decisionId,
    );
    expect(replayed.provenance.getDecisions().map((decision) => decision.id)).toEqual([
      "d000002",
      "d000003",
      "d000004",
    ]);
  });
});
