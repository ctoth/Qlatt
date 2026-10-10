import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump as dumpYaml, load as loadYaml } from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  type CompiledRulepack,
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
  preloadRulepackSpecFromPath,
  rulepackMapOrigins,
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

type Dict = Record<string, unknown>;

const FRONTENDS_DIR = "public/rules/frontends";

function readYamlFile(path: string): Dict {
  return loadYaml(readFileSync(path, "utf8")) as Dict;
}

/**
 * Write a frontend that extends qlatt-english with the base's include list and
 * its own pipeline.yaml, and return the frontend's path. The fixture pipeline
 * carries the base's phases and string_sets (neither is inherited) plus the
 * given sections.
 */
function writeExtendingFrontend(dir: string, sections: Dict): string {
  const englishRoot = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/frontend.yaml`);
  const englishPipeline = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/pipeline.yaml`);
  const frontendPath = join(dir, "frontend.yaml");
  writeFileSync(frontendPath, dumpYaml({ extends: "qlatt-english", include: englishRoot.include }));
  writeFileSync(
    join(dir, "pipeline.yaml"),
    dumpYaml({
      version: "v1",
      string_sets: englishPipeline.string_sets,
      phases: englishPipeline.phases,
      ...sections,
    }),
  );
  return frontendPath.replace(/\\/g, "/");
}

/**
 * A child file that shadows a base include (same relative path as an entry of
 * the base's `include:` list) inherits that file's predicates, maps, tags and
 * relations key-wise; string_sets, phases and rules stay the child's alone.
 */
describe("declarative frontend extends: keyed sections of a shadowing file", () => {
  const sectionsOf = (frontendId: string) =>
    loadBundledRulepackSpec(frontendId) as unknown as Record<string, Dict>;
  const english = sectionsOf("qlatt-english");
  const sections = {
    predicates: {
      // Overrides a base predicate; adds one the base does not have.
      is_sonorant: "current.type in ['nasal', 'liquid']",
      is_fixture_nasal: "current.type == 'nasal'",
    },
    maps: {
      // Overrides a base map whole: the base's other five entries are gone.
      phoneme_release_map: { P_CL: "P_REL" },
      fixture_map: { P_CL: "p" },
    },
    tags: {
      stress: "fixture description of the stress tag",
      fixture_tag: "a tag only the fixture declares",
    },
    relations: {
      Syllable: { type: "parallel", features: { index: [], fixtureFeature: [] } },
    },
  };

  function expectKeywiseInheritance(child: Dict): void {
    for (const [section, declared] of Object.entries(sections)) {
      const compiled = child[section] as Dict;
      const base = english[section];
      for (const key of Object.keys(base)) {
        // Inherits every base entry the child leaves untouched.
        if (!(key in declared)) expect(compiled[key], `${section}.${key}`).toEqual(base[key]);
      }
      for (const key of Object.keys(declared)) expect(compiled, section).toHaveProperty(key);
    }
    const predicates = child.predicates as Dict;
    expect(predicates.is_sonorant).toBe(sections.predicates.is_sonorant);
    expect(predicates.is_sonorant).not.toBe(english.predicates.is_sonorant);
    expect(english.predicates.is_fixture_nasal).toBeUndefined();
    // An overridden entry replaces the base's whole; it is not merged into it.
    expect((child.maps as Dict).phoneme_release_map).toEqual({ P_CL: "P_REL" });
    expect(Object.keys(english.maps.phoneme_release_map as Dict).length).toBeGreaterThan(1);
    const syllable = (child.relations as Record<string, { features: Dict }>).Syllable;
    expect(Object.keys(syllable.features)).toEqual(["index", "fixtureFeature"]);
  }

  it("adds, overrides and inherits entries by key (synchronous loader)", () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-extends-sections-"));
    try {
      const child = loadRulepackSpecFromPath(writeExtendingFrontend(dir, sections));
      expectKeywiseInheritance(child as unknown as Dict);
      // Origins follow the file an entry was read from.
      const origins = rulepackMapOrigins(child);
      expect(origins.phoneme_aspiration_map.P_CL).toBe(
        "/rules/frontends/qlatt-english/pipeline.yaml",
      );
      expect(origins.phoneme_release_map.P_CL).toBe(`${dir.replace(/\\/g, "/")}/pipeline.yaml`);
      expect(origins.phoneme_release_map.T_CL).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("adds, overrides and inherits entries by key (asynchronous loader)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-extends-sections-"));
    try {
      const child = await preloadRulepackSpecFromPath(writeExtendingFrontend(dir, sections));
      expectKeywiseInheritance(child as unknown as Dict);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not inherit string_sets: the shadowing file's sets are the whole list", () => {
    const beauty = sectionsOf("qlatt-beauty");
    expect(english.string_sets).toHaveProperty("function_words");
    expect(beauty.string_sets).not.toHaveProperty("function_words");
  });

  it("qlatt-beauty declares only its deltas and compiles the base's entries", () => {
    const beauty = sectionsOf("qlatt-beauty");
    const declared = readYamlFile(`${FRONTENDS_DIR}/qlatt-beauty/pipeline.yaml`);
    const base = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/pipeline.yaml`);
    expect(declared.predicates).toBeUndefined();
    expect(declared.maps).toBeUndefined();
    expect(Object.keys(declared.tags as Dict)).toEqual([
      "voice_quality_effort",
      "voice_quality_phrase",
      "voice_quality_stress",
    ]);
    expect(Object.keys(declared.relations as Dict)).toEqual(["Segment"]);

    for (const section of ["predicates", "maps", "tags", "relations"]) {
      for (const key of Object.keys(base[section] as Dict)) {
        if (section === "relations" && key === "Segment") continue;
        expect(beauty[section][key], `${section}.${key}`).toEqual(english[section][key]);
      }
    }
    expect(beauty.tags).toHaveProperty("voice_quality_stress");
    expect(english.tags).not.toHaveProperty("voice_quality_stress");
    const segment = (spec: Record<string, Dict>) =>
      (spec.relations.Segment as { features: Dict }).features;
    expect(segment(beauty)).toHaveProperty("hi");
    expect(segment(english)).not.toHaveProperty("hi");
    expect(segment(english)).toHaveProperty("Ac");
    expect(segment(beauty)).not.toHaveProperty("Ac");
  });

  it("leaves a frontend without `extends` (dectalk-english) with only its own entries", () => {
    const dectalk = sectionsOf("dectalk-english");
    expect(readYamlFile(`${FRONTENDS_DIR}/dectalk-english/frontend.yaml`).extends).toBeUndefined();
    const base = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/pipeline.yaml`);
    // dectalk-english declares none of the base pipeline's maps or string sets.
    for (const section of ["maps", "string_sets"]) {
      for (const key of Object.keys(base[section] as Dict)) {
        expect(dectalk[section] ?? {}, section).not.toHaveProperty(key);
      }
    }
    // Entries it never declares stay absent, and a name it shares with the
    // base keeps its own definition.
    expect(dectalk.predicates).not.toHaveProperty("is_hertz_nucleus_vowel");
    expect(dectalk.tags).not.toHaveProperty("coronal_fronting");
    const own = readYamlFile(`${FRONTENDS_DIR}/dectalk-english/pipeline.yaml`);
    for (const section of ["predicates", "tags", "relations"]) {
      for (const key of Object.keys(own[section] as Dict)) {
        expect(Object.keys(dectalk[section]), section).toContain(key);
      }
    }
  });
});
