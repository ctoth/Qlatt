import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  rulepackRuleOrigins,
} from "../src/declarative-frontend/rule-pack";
import { getVoiceRegistry, resolveVoice } from "../src/dectalk-voice";

interface PolicyLeaf {
  value: number;
}

interface F0Policy {
  base_hz: PolicyLeaf;
  range_hz: PolicyLeaf;
  female_base_hz?: PolicyLeaf;
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

  it("adds its own f0 leaves onto the inherited base f0 block", () => {
    // Child-only leaves added onto the inherited f0 block:
    expect(beauty.parameters.policy.f0.sag_depth_fraction.value).toBe(0.35);
    expect(beauty.parameters.policy.f0.question_rise_fraction.value).toBe(0.9);
    expect((english.parameters.policy.f0 as Partial<F0Policy>).sag_depth_fraction).toBeUndefined();
    // Inherited f0 leaves the child does not touch:
    expect(beauty.parameters.policy.f0.downstep_k).toEqual(english.parameters.policy.f0.downstep_k);
    // The pitch level and span are the speaker's, not a frontend override:
    // beauty inherits the base's leaves and its default voice sets the values
    // (public/rules/frontends/qlatt-beauty/speakers/beauty.yaml).
    expect(beauty.parameters.policy.f0.base_hz).toEqual(english.parameters.policy.f0.base_hz);
    expect(beauty.parameters.policy.f0.range_hz).toEqual(english.parameters.policy.f0.range_hz);
    expect(beauty.parameters.policy.f0.female_base_hz).toBeUndefined();
    const voices = getVoiceRegistry(beauty);
    expect(voices?.default).toBe("beauty");
    expect(getVoiceRegistry(english)).toBeNull();
    if (!voices) throw new Error("qlatt-beauty has no voice registry");
    expect(resolveVoice(voices, voices.default).override).toEqual({
      base_f0_hz: 138,
      f0_range_hz: 95,
    });
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
 * relations key-wise; string_sets and phases stay the child's alone.
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

const ENGLISH_PROSODY = "/rules/frontends/qlatt-english/phases/prosody.yaml";

/**
 * A child file that shadows a base include inherits a rule of that base file
 * only when no file of the child frontend defines a rule of that name and one
 * of the child frontend's phases names it.
 */
describe("declarative frontend extends: rules of a shadowing file", () => {
  const english = loadBundledRulepackSpec("qlatt-english") as RulepackFixture;
  const baseProsody = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/phases/prosody.yaml`)
    .rules as Dict;
  const ownBaseline = {
    ...(baseProsody.tobi_baseline_init as Dict),
    citations: ["Fixture citation for the child's own baseline rule"],
  };

  /**
   * A frontend whose phases/prosody.yaml shadows the base's and defines one
   * rule, and whose pipeline phases every base rule but `vocal_effort`.
   */
  function writeProsodyShadowingFrontend(dir: string): string {
    const englishPipeline = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/pipeline.yaml`);
    const phases = (englishPipeline.phases as { rules?: string[] }[]).map((phase) => ({
      ...phase,
      ...(phase.rules ? { rules: phase.rules.filter((name) => name !== "vocal_effort") } : {}),
    }));
    const frontendPath = writeExtendingFrontend(dir, { phases });
    mkdirSync(join(dir, "phases"));
    writeFileSync(
      join(dir, "phases", "prosody.yaml"),
      dumpYaml({ version: "v1", rules: { tobi_baseline_init: ownBaseline } }),
    );
    return frontendPath;
  }

  function expectPhasedRuleInheritance(child: CompiledRulepack, dir: string): void {
    const rules = (child as RulepackFixture).rules;
    const origins = rulepackRuleOrigins(child);
    // Undefined by the child and named by one of its phases: inherited, and
    // attributed to the base file the body was read from.
    for (const name of ["tobi_accent", "f0_continuation_rise", "accent_index_in_phrase"]) {
      expect(rules[name], name).toEqual(english.rules[name]);
      expect(origins[name], name).toBe(ENGLISH_PROSODY);
    }
    // The child's own definition replaces the base's whole.
    expect((rules.tobi_baseline_init as Dict).citations).toEqual(ownBaseline.citations);
    expect(rules.tobi_baseline_init).not.toEqual(english.rules.tobi_baseline_init);
    expect(origins.tobi_baseline_init).toBe(`${dir.replace(/\\/g, "/")}/phases/prosody.yaml`);
    // A base rule the child phases nowhere is not inherited.
    expect(english.rules).toHaveProperty("vocal_effort");
    expect(rules).not.toHaveProperty("vocal_effort");
    expect(origins).not.toHaveProperty("vocal_effort");
  }

  it("inherits an undefined, phased base rule; the child's definition wins (synchronous loader)", () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-extends-rules-"));
    try {
      expectPhasedRuleInheritance(
        loadRulepackSpecFromPath(writeProsodyShadowingFrontend(dir)),
        dir,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("inherits an undefined, phased base rule; the child's definition wins (asynchronous loader)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-extends-rules-"));
    try {
      expectPhasedRuleInheritance(
        await preloadRulepackSpecFromPath(writeProsodyShadowingFrontend(dir)),
        dir,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("qlatt-beauty defines only the prosody rules that differ and compiles the base's others", () => {
    const beauty = loadBundledRulepackSpec("qlatt-beauty") as RulepackFixture;
    const origins = rulepackRuleOrigins(beauty);
    const declared = readYamlFile(`${FRONTENDS_DIR}/qlatt-beauty/phases/prosody.yaml`)
      .rules as Dict;
    expect(Object.keys(declared)).toEqual([
      "tobi_accent",
      "tobi_unaccented_declination",
      "connected_speech_source_contour",
      "stress_spectral_tilt",
    ]);
    for (const name of Object.keys(declared)) {
      expect(beauty.rules[name], name).not.toEqual(english.rules[name]);
      expect(origins[name], name).toBe("/rules/frontends/qlatt-beauty/phases/prosody.yaml");
    }
    const phased = new Set(
      (beauty.phases as unknown as { rules: string[] }[]).flatMap((phase) => phase.rules),
    );
    for (const name of Object.keys(baseProsody)) {
      if (name in declared) continue;
      if (phased.has(name)) {
        expect(beauty.rules[name], name).toEqual(english.rules[name]);
        expect(origins[name], name).toBe(ENGLISH_PROSODY);
      } else {
        expect(beauty.rules, name).not.toHaveProperty(name);
      }
    }
    // The base rules beauty does not run stay out of its compiled rulepack.
    expect(beauty.rules).not.toHaveProperty("vocal_effort");
    expect(beauty.rules).not.toHaveProperty("accent_index_in_phrase");
    expect(beauty.rules).toHaveProperty("tobi_baseline_init");
  });

  it("leaves a frontend without `extends` (dectalk-english) with only its own rules", () => {
    const dectalk = loadBundledRulepackSpec("dectalk-english") as RulepackFixture;
    for (const name of Object.keys(baseProsody))
      expect(dectalk.rules, name).not.toHaveProperty(name);
    for (const [name, origin] of Object.entries(rulepackRuleOrigins(dectalk))) {
      expect(origin, name).not.toContain("/qlatt-english/");
    }
  });
});
