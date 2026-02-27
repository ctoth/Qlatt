import { describe, expect, it } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import { createProvenanceCollector } from "../src/provenance";
import {
  collectTraceTokenIds,
  emitRuleTraceDecisions,
  recordInventoryDecision,
  INVENTORY_CITATION,
  RULE_CITATIONS,
} from "../src/tts-frontend-provenance";

describe("provenance middleware", () => {
  // -----------------------------------------------------------------------
  // Core invariant: provenance does not affect frame output
  // -----------------------------------------------------------------------

  it("produces identical frames with and without provenance", () => {
    const withoutProvenance = textToKlattTrack("hello", 110, 30);
    const provenance = createProvenanceCollector();
    const withProvenance = textToKlattTrack("hello", 110, 30, { provenance });

    expect(withProvenance.length).toBe(withoutProvenance.length);
    for (let i = 0; i < withoutProvenance.length; i++) {
      expect(withProvenance[i]).toEqual(withoutProvenance[i]);
    }
  });

  it("provenance collector records decisions for transcription and rules", () => {
    const provenance = createProvenanceCollector();
    textToKlattTrack("hello world", 110, 30, { provenance });
    const decisions = provenance.getDecisions();

    expect(decisions.length).toBeGreaterThan(0);

    // Should have transcription decisions (dictionary or fallback)
    const transcribeDecisions = decisions.filter((d) => d.stage === "transcribe");
    expect(transcribeDecisions.length).toBeGreaterThan(0);

    // Should have inventory target decisions
    const inventoryDecisions = decisions.filter(
      (d) => d.type === "inventory_target_selected"
    );
    expect(inventoryDecisions.length).toBeGreaterThan(0);
    for (const d of inventoryDecisions) {
      expect(d.citations).toContain(INVENTORY_CITATION);
    }

    // Should have rule decisions
    const ruleDecisions = decisions.filter((d) => d.stage === "rules");
    expect(ruleDecisions.length).toBeGreaterThan(0);
  });

  it("returns empty frames array for empty input (with or without provenance)", () => {
    const provenance = createProvenanceCollector();
    const withProvenance = textToKlattTrack("", 110, 30, { provenance });
    const withoutProvenance = textToKlattTrack("", 110, 30);

    expect(withProvenance).toEqual(withoutProvenance);
  });

  // -----------------------------------------------------------------------
  // collectTraceTokenIds
  // -----------------------------------------------------------------------

  describe("collectTraceTokenIds", () => {
    it("returns token field when present", () => {
      const ids = collectTraceTokenIds({ token: "ph_3" });
      expect(ids).toEqual(["ph_3"]);
    });

    it("returns capture values when no token field", () => {
      const ids = collectTraceTokenIds({
        captures: { left: "ph_1", right: "ph_2" },
      });
      expect(ids).toEqual(["ph_1", "ph_2"]);
    });

    it("deduplicates across token and captures", () => {
      const ids = collectTraceTokenIds({
        token: "ph_1",
        captures: { a: "ph_1", b: "ph_2" },
      });
      expect(ids).toEqual(["ph_1", "ph_2"]);
    });

    it("returns empty array for events with no token info", () => {
      expect(collectTraceTokenIds({})).toEqual([]);
      expect(collectTraceTokenIds({ token: "" })).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // emitRuleTraceDecisions
  // -----------------------------------------------------------------------

  describe("emitRuleTraceDecisions", () => {
    it("emits decisions for match and rewrite events", () => {
      const provenance = createProvenanceCollector();
      const tokenDecisionIds = new Map<string, string>();

      const trace = [
        { type: "match", rule: "stop_expansion", phase: "structural", token: "ph_0" },
        { type: "rewrite", rule: "vowel_shortening", phase: "duration", token: "ph_1" },
        { type: "skip", rule: "irrelevant", phase: "structural" }, // should be ignored
      ];

      emitRuleTraceDecisions(trace, provenance, tokenDecisionIds);

      const decisions = provenance.getDecisions();
      expect(decisions.length).toBe(2);
      expect(decisions[0].type).toBe("rule_matched");
      expect(decisions[0].stage).toBe("rules");
      expect(decisions[0].subject).toBe("token:ph_0");
      expect(decisions[1].type).toBe("rule_rewrite_applied");
      expect(decisions[1].subject).toBe("token:ph_1");
    });

    it("links parent decisions via tokenDecisionIds", () => {
      const provenance = createProvenanceCollector();
      const tokenDecisionIds = new Map<string, string>();
      tokenDecisionIds.set("ph_0", "d000001");

      const trace = [
        { type: "match", rule: "test_rule", phase: "structural", token: "ph_0" },
      ];

      emitRuleTraceDecisions(trace, provenance, tokenDecisionIds);

      const decisions = provenance.getDecisions();
      expect(decisions[0].parents).toEqual(["d000001"]);
    });

    it("uses rule name as subject when no token info", () => {
      const provenance = createProvenanceCollector();
      const tokenDecisionIds = new Map<string, string>();

      const trace = [
        { type: "match", rule: "orphan_rule", phase: "structural" },
      ];

      emitRuleTraceDecisions(trace, provenance, tokenDecisionIds);

      const decisions = provenance.getDecisions();
      expect(decisions[0].subject).toBe("rule:orphan_rule");
    });

    it("uses captures as subject when no direct token field", () => {
      const provenance = createProvenanceCollector();
      const tokenDecisionIds = new Map<string, string>();

      const trace = [
        { type: "match", rule: "cap_rule", phase: "structural", captures: { a: "ph_1", b: "ph_2" } },
      ];

      emitRuleTraceDecisions(trace, provenance, tokenDecisionIds);

      const decisions = provenance.getDecisions();
      expect(decisions[0].subject).toBe("captures:ph_1,ph_2");
    });
  });

  // -----------------------------------------------------------------------
  // recordInventoryDecision
  // -----------------------------------------------------------------------

  describe("recordInventoryDecision", () => {
    it("returns undefined when provenance is null", () => {
      const result = recordInventoryDecision(null, 0, "AH", "AH", undefined);
      expect(result).toBeUndefined();
    });

    it("records a decision and returns its ID when provenance is active", () => {
      const provenance = createProvenanceCollector();
      const id = recordInventoryDecision(provenance, 3, "AH", "AH", undefined);

      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");

      const decisions = provenance.getDecisions();
      expect(decisions.length).toBe(1);
      expect(decisions[0].type).toBe("inventory_target_selected");
      expect(decisions[0].subject).toBe("token:3:AH");
      expect(decisions[0].citations).toContain(INVENTORY_CITATION);
    });

    it("links parent pronunciation decision when provided", () => {
      const provenance = createProvenanceCollector();
      recordInventoryDecision(provenance, 0, "HH", "HH", "d000001");

      const decisions = provenance.getDecisions();
      expect(decisions[0].parents).toEqual(["d000001"]);
    });

    it("omits parents when pronDecisionId is empty or undefined", () => {
      const provenance = createProvenanceCollector();
      recordInventoryDecision(provenance, 0, "HH", "HH", "");

      const decisions = provenance.getDecisions();
      expect(decisions[0].parents).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Exported constants
  // -----------------------------------------------------------------------

  describe("constants", () => {
    it("INVENTORY_CITATION is a non-empty string", () => {
      expect(typeof INVENTORY_CITATION).toBe("string");
      expect(INVENTORY_CITATION.length).toBeGreaterThan(0);
    });

    it("RULE_CITATIONS is a Map with string keys and string[] values", () => {
      expect(RULE_CITATIONS).toBeInstanceOf(Map);
      for (const [key, value] of RULE_CITATIONS) {
        expect(typeof key).toBe("string");
        expect(Array.isArray(value)).toBe(true);
      }
    });
  });
});
