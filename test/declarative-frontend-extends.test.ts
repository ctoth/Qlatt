import { describe, expect, it } from "vitest";
import {
  type CompiledRulepack,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";

interface PolicyLeaf {
  value: number;
}

interface F0Policy {
  range_hz: PolicyLeaf;
  female_base_hz: PolicyLeaf;
  sag_depth_fraction: PolicyLeaf;
  question_rise_fraction: PolicyLeaf;
  downstep_k: unknown;
}

type RulepackFixture = CompiledRulepack & {
  parameters: {
    policy: Record<string, unknown> & { f0: F0Policy };
  };
  rules: Record<string, unknown>;
  output: {
    lowering: {
      id: string;
      columns: string[];
      timeline: unknown;
    };
  };
};

/**
 * Phase 5.1: cross-frontend `extends`.
 *
 * qlatt-beauty is declared as `extends: qlatt-english` plus a small delta. This
 * suite proves the two properties the mechanism must guarantee:
 *   1. BASE RESOLUTION — beauty inherits base data it does not declare
 *      (the shared parameters/policy subtrees, the transcription table, the
 *      inherited *_path scalars) and, via include base-dir fallback, the shared
 *      phase RULE bodies that beauty keeps no local copy of.
 *   2. OVERRIDE PRECEDENCE — where beauty declares its own value, the child wins
 *      over the base (f0 pitch-range delta, output columns/id, inventory_path).
 */
describe("declarative frontend extends (qlatt-beauty ← qlatt-english)", () => {
  const beauty = loadBundledRulepackSpec("qlatt-beauty") as RulepackFixture;
  const english = loadBundledRulepackSpec("qlatt-english") as RulepackFixture;

  // ---- BASE RESOLUTION ----

  it("inherits base parameters subtrees the child does not override", () => {
    // rate/duration/formant/nasal/source_contour/speaker policy are not declared
    // in beauty's frontend.yaml, so they must come verbatim from qlatt-english.
    for (const key of ["rate", "duration", "formant", "nasal", "source_contour", "speaker"]) {
      expect(beauty.parameters.policy[key]).toEqual(english.parameters.policy[key]);
    }
  });

  it("inherits the base transcription table verbatim", () => {
    expect(beauty.transcription).toEqual(english.transcription);
  });

  it("inherits base *_path scalars the child omits", () => {
    // beauty omits lts_path / morphology_path / speaker_profile_path /
    // source_contour_path, so they resolve to the base's values.
    expect(beauty.lts_path).toBe(english.lts_path);
    expect(beauty.morphology_path).toBe(english.morphology_path);
    expect(beauty.speaker_profile_path).toBe(english.speaker_profile_path);
    expect(beauty.source_contour_path).toBe(english.source_contour_path);
  });

  it("resolves shared phase rule bodies via include base-dir fallback", () => {
    // beauty keeps NO local phases/orthography|duration|formant.yaml; those
    // includes fall back to qlatt-english's directory. Their rules must appear
    // in beauty's compiled spec, byte-identical to the base's.
    for (const ruleId of [
      "spelling_mode_letter_names", // phases/orthography.yaml
      "stress_duration", // phases/duration.yaml
      "place_f2_locus", // phases/formant.yaml
    ]) {
      expect(beauty.rules[ruleId]).toBeDefined();
      expect(beauty.rules[ruleId]).toEqual(english.rules[ruleId]);
    }
  });

  it("does not leak the base `extends` marker into the compiled spec", () => {
    expect("extends" in beauty).toBe(false);
  });

  // ---- OVERRIDE PRECEDENCE (child wins) ----

  it("overrides the f0 pitch-range delta while merging onto the base f0 block", () => {
    // Overridden leaves:
    expect(beauty.parameters.policy.f0.range_hz.value).toBe(95);
    expect(english.parameters.policy.f0.range_hz.value).toBe(80);
    // Child-only leaves added onto the inherited f0 block:
    expect(beauty.parameters.policy.f0.female_base_hz.value).toBe(138);
    expect(beauty.parameters.policy.f0.sag_depth_fraction.value).toBe(0.35);
    expect(beauty.parameters.policy.f0.question_rise_fraction.value).toBe(0.9);
    expect(english.parameters.policy.f0.female_base_hz).toBeUndefined();
    // Inherited f0 leaf the child does not touch:
    expect(beauty.parameters.policy.f0.downstep_k).toEqual(english.parameters.policy.f0.downstep_k);
  });

  it("overrides the output lowering id and columns", () => {
    expect(beauty.output.lowering.id).toBe("qlatt-beauty-track-lowering");
    expect(english.output.lowering.id).toBe("qlatt-english-track-lowering");
    expect(beauty.output.lowering.columns).toContain("GO");
    expect(beauty.output.lowering.columns).toContain("DI");
    expect(english.output.lowering.columns).not.toContain("GO");
    // Non-overridden lowering fields are inherited from the base.
    expect(beauty.output.lowering.timeline).toEqual(english.output.lowering.timeline);
  });

  it("overrides inventory_path with the child's own inventory", () => {
    expect(beauty.inventory_path).toBe("/rules/frontends/qlatt-beauty/inventory.yaml");
  });

  it("keeps beauty's own pipeline (voice-quality) and prosody phase rules", () => {
    // stress_rd_adduction lives in beauty's phases/voice-quality.yaml (pulled in
    // by beauty's own pipeline.yaml); english has no such rule.
    expect(beauty.rules.stress_rd_adduction).toBeDefined();
    expect(english.rules.stress_rd_adduction).toBeUndefined();
  });
});
