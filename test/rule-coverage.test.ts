import { describe, expect, it } from "vitest";
import {
  addAttempts,
  addRecognition,
  createCoverage,
  mostCommonFailure,
  renderCoverage,
  runRuleCoverage,
} from "../scripts/rule-coverage";
import type { RuleAttempt } from "../src/declarative-frontend/hrg/types";
import { createProvenanceCollector } from "../src/provenance";

const phase = (name: string, rules: string[]) => ({
  name,
  rules,
  after: [],
  resolve_scalars: [],
  compute_times: false,
  resolve_points: [],
});
const spec = {
  rules: { rewrite: { kind: "postlexical" }, frame: { kind: "frame" }, unused: { kind: "scalar" } },
  phases: [phase("normalization", ["rewrite"]), phase("acoustics", ["frame"])],
};
const base = { phase: "normalization", rule: "rewrite", itemIds: ["source:0"], journalLength: 0 };
const failed: RuleAttempt = {
  ...base,
  status: "select_where_failed",
  evidence: { kind: "constant", value: false, matched: false },
};
const fired: RuleAttempt = { ...base, status: "fired", transactionId: "tx:1" };

describe("recorded rule coverage", () => {
  it("retains normalization and unscheduled zero rows while accumulating phrase outcomes", () => {
    const rows = createCoverage(spec);
    addAttempts(rows, [failed, fired]);
    addAttempts(rows, [failed]);
    const rewrite = rows.find((row) => row.rule === "rewrite")!;
    expect(rewrite).toMatchObject({ attempts: 3, firings: 1 });
    expect(mostCommonFailure(rewrite)).toBe("select_where_failed (2)");
    expect(rows.find((row) => row.rule === "unused")).toMatchObject({
      phase: "(unscheduled)",
      attempts: 0,
      firings: 0,
    });
    const output = renderCoverage(rows).join("\n");
    expect(output).toContain("- (unscheduled)/unused");
    expect(output).not.toContain("- normalization/rewrite");
  });

  it("counts frame firing units without inventing attempts or failures", () => {
    const rows = createCoverage(spec);
    addAttempts(rows, [{ ...fired, phase: "acoustics", rule: "frame" }]);
    const frame = rows.find((row) => row.rule === "frame")!;
    expect(frame).toMatchObject({ firings: 1, attempts: null, failures: null });
    expect(renderCoverage(rows).join("\n")).toContain("1 units | unavailable | unavailable");
    expect(() => addAttempts(rows, [{ ...failed, phase: "acoustics", rule: "frame" }])).toThrow(
      "Unexpected frame failure record",
    );
  });

  it("breaks failure-count ties consistently and refuses to discard unknown recorded rules", () => {
    const rows = createCoverage(spec);
    addAttempts(rows, [failed, { ...base, status: "missing_target", target: "next" }]);
    expect(mostCommonFailure(rows.find((row) => row.rule === "rewrite")!)).toBe(
      "missing_target (1)",
    );
    expect(() => addAttempts(rows, [{ ...fired, rule: "not-in-inventory" }])).toThrow(
      "Unknown recorded rule",
    );
  });

  it("keeps actual recognition outcomes separate from rule attempts", () => {
    const collector = createProvenanceCollector();
    for (const outcome of ["accepted", "ineligible", "overlap", "unmatched"] as const) {
      collector.add({
        stage: "transcribe",
        type: "text_recognition",
        subject: "source:0",
        reason: "recognition fixture",
        recognition: {
          outcome,
          ruleId: outcome === "unmatched" ? null : "number",
          sourceItemId: "source:0",
          sourceStart: 0,
          sourceEnd: 1,
          captures: {},
          vocabularyKeys: [],
        },
      });
    }
    const counts: Parameters<typeof addRecognition>[0] = new Map();
    addRecognition(counts, collector.getDecisions());
    expect(counts.get("number")).toEqual({ accepted: 1, ineligible: 1, overlap: 1 });
    expect(counts.get("(unmatched)")).toEqual({ unmatched: 1 });
  });

  it("rejects missing flag values instead of silently generating a different report", () => {
    expect(() => runRuleCoverage(["--frontend"])).toThrow("Usage:");
  });
});
