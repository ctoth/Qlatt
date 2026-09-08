import { describe, expect, it } from "vitest";
import { createProvenanceCollector } from "../src/provenance";

describe("ProvenanceCollector.truncate", () => {
  it("drops trailing decisions and rewinds the id sequence", () => {
    const provenance = createProvenanceCollector();
    const input = { stage: "rules" as const, type: "feature_write", reason: "fixture" };
    const first = provenance.add({ ...input, subject: "item:a.x" });
    provenance.add({ ...input, subject: "item:b.x" });
    provenance.add({ ...input, subject: "item:c.x" });

    provenance.truncate(1);

    expect(provenance.getDecisions()).toEqual([first]);
    const next = provenance.add({ ...input, subject: "item:d.x" });
    expect(next).toMatchObject({ id: "d000002", seq: 2 });
    expect(provenance.getDecisions().map((decision) => decision.id)).toEqual([
      "d000001",
      "d000002",
    ]);
  });

  it("rejects truncation beyond the recorded length", () => {
    const provenance = createProvenanceCollector();
    provenance.add({ stage: "rules", type: "t", subject: "s", reason: "r" });
    expect(() => provenance.truncate(2)).toThrowError(/E_PROVENANCE_TRUNCATE/);
    expect(() => provenance.truncate(-1)).toThrowError(/E_PROVENANCE_TRUNCATE/);
    expect(provenance.getDecisions()).toHaveLength(1);
  });
});
