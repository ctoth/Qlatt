import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump as dumpYaml, load as loadYaml } from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  loadFrontendResources,
  loadFrontendVoiceDocument,
} from "../src/declarative-frontend/inventory";
import {
  type CompiledRulepack,
  getRulepackValidationDiagnostics,
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
  preloadRulepackSpecFromPath,
  rulepackMapOrigins,
  rulepackParameterOrigins,
  rulepackRuleDocumentSpans,
  rulepackRuleOrigins,
} from "../src/declarative-frontend/rule-pack";
import { getVoiceRegistry, resolveVoice } from "../src/dectalk-voice";
import { parseYamlString, yamlDocumentSpans } from "../src/yaml-loader";

interface PolicyLeaf {
  value: number;
}

interface F0Policy {
  base_hz: PolicyLeaf;
  range_hz: PolicyLeaf;
  female_base_hz?: PolicyLeaf;
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

  it("inherits base resource roles the child omits", () => {
    expect(beauty.resources.lts).toBe(english.resources.lts);
    expect(beauty.resources.morphology).toBe(english.resources.morphology);
    expect(beauty.resources.speaker_profile).toBe(english.resources.speaker_profile);
    expect(beauty.resources.source_contour).toBe(english.resources.source_contour);
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
    expect(beauty.parameters.policy.f0.question_rise_fraction.value).toBe(0.9);
    expect(
      (english.parameters.policy.f0 as Partial<F0Policy>).question_rise_fraction,
    ).toBeUndefined();
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
    const { speakerProfile } = loadFrontendResources(beauty);
    if (!speakerProfile) throw new Error("qlatt-beauty has no speaker profile");
    expect(
      resolveVoice(
        voices,
        voices.default,
        speakerProfile.spec,
        loadFrontendVoiceDocument(voices, voices.default),
      ).override,
    ).toEqual({
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

  it("overrides resources.inventory with the child's own inventory", () => {
    expect(beauty.resources.inventory).toBe("/rules/frontends/qlatt-beauty/inventory.yaml");
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
function writeExtendingFrontend(dir: string, sections: Dict, rootOverrides: Dict = {}): string {
  const englishRoot = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/frontend.yaml`);
  const englishPipeline = readYamlFile(`${FRONTENDS_DIR}/qlatt-english/pipeline.yaml`);
  const frontendPath = join(dir, "frontend.yaml");
  writeFileSync(
    frontendPath,
    dumpYaml({ extends: "qlatt-english", include: englishRoot.include, ...rootOverrides }),
  );
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

describe("resource declarations across inheritance", () => {
  for (const asynchronous of [false, true]) {
    it(`normalizes child aliases before inheritance (${asynchronous ? "async" : "sync"})`, async () => {
      const dir = mkdtempSync(join(tmpdir(), "qlatt-resource-alias-"));
      try {
        const path = writeExtendingFrontend(
          dir,
          {},
          {
            inventory_path: "/rules/frontends/qlatt-beauty/inventory.yaml",
            source_contour_path: null,
            resources: { lexicon: null },
          },
        );
        const compiled = asynchronous
          ? await preloadRulepackSpecFromPath(path)
          : loadRulepackSpecFromPath(path);
        const base = loadBundledRulepackSpec("qlatt-english");
        expect(compiled.resources.inventory).toBe("/rules/frontends/qlatt-beauty/inventory.yaml");
        expect(compiled.resources.source_contour).toBeNull();
        expect(compiled.resources.lexicon).toBeNull();
        expect(compiled.resources.lts).toBe(base.resources.lts);
        expect(Object.hasOwn(compiled, "inventory_path")).toBe(false);
        const resources = loadFrontendResources(compiled);
        expect(resources.sourceContour).toBeUndefined();
        expect(resources.lexicon).toBeUndefined();
        expect(resources.lts.document).toBe(loadFrontendResources(base).lts.document);
        expect(
          getRulepackValidationDiagnostics(compiled)
            .filter((entry) => entry.code === "W_FRONTEND_RESOURCE_ALIAS")
            .map((entry) => entry.path),
        ).toEqual(["inventory_path", "source_contour_path"]);
        expect(base.resources.source_contour).toBe(
          "/rules/frontends/qlatt-english/policy/source-contour.yaml",
        );
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  it.each(["qlatt-english", "qlatt-beauty", "dectalk-english"])(
    "ships %s without aliases",
    (frontend) => {
      expect(
        getRulepackValidationDiagnostics(loadBundledRulepackSpec(frontend)).filter(
          (entry) => entry.code === "W_FRONTEND_RESOURCE_ALIAS",
        ),
      ).toEqual([]);
    },
  );
});

describe("direct rule errors through composition", () => {
  for (const asynchronous of [false, true]) {
    for (const included of [false, true]) {
      const mode = `${asynchronous ? "async" : "sync"}, ${included ? "include" : "root"}`;
      it(`locates authored errors before throwing (${mode})`, async () => {
        const dir = mkdtempSync(join(tmpdir(), "qlatt-rule-locations-"));
        try {
          const rules = {
            fixture_frame_rule: {
              kind: "frame",
              program: "fixture_frame",
              unit: "u.missing",
              when: "r.missing",
              set: [{ register: "missing", value: "r.missing", tag: "duration_floor" }],
              citations: ["Fixture source"],
            },
            fixture_points: {
              kind: "point",
              select: { relation: "Segment", where: "true" },
              insert_point: {
                relation: "F0Point",
                value: "current.phonem",
                when: "current.phonem",
                at: "midpoint(current)",
                tag: "duration_floor",
              },
              insert_points: [
                {
                  relation: "Missing",
                  value: "current.phonem",
                  when: "current.phonem",
                  at: "midpoint(current)",
                  tag: "duration_floor",
                },
              ],
              citations: ["Fixture source"],
            },
            unknown_path_relation: {
              kind: "scalar",
              select: {
                relation: "Segment",
                where: { all: ["path(current, 'R:Missing') != null"] },
              },
              constraint: {
                all: [
                  { expr: "fixture_outer(current)" },
                  { any: [{ not: "curent.duration" }, { not: { expr: "current.phonem" } }] },
                  { predicate: "missing_fixture_predicate" },
                ],
              },
              aply: [],
              apply: [
                {
                  field: "duration",
                  op: "set",
                  value: "curent.duration",
                  valu: "current.duration",
                  tag: "duration_floor",
                },
                {
                  field: "duration",
                  op: "set",
                  dispatch: [
                    { when: { all: ["current.phonem == 'AA'"] }, value: "current.duration" },
                  ],
                  tag: "duration_floor",
                },
                {
                  field: "duration",
                  op: "set",
                  value: { fields: { duration: { value: "current.phonem" } } },
                  tag: "duration_floor",
                },
                {
                  foreach: [{ op: "set" }, { op: "add" }],
                  template: {
                    for_each_field: ["duration"],
                    field: "{field}",
                    op: "{op}",
                    value: "fixture_outer(current)",
                    tag: "duration_floor",
                  },
                },
              ],
              citations: ["Klatt 1976"],
            },
          };
          const functions = {
            fixture_inner: { params: ["item"], body: "item.phonem == 'AA'" },
            fixture_outer: { params: ["item"], body: "fixture_inner(item)" },
            fixture_bad: { params: ["item"], body: "curent.duration" },
          };
          const predicates = {
            fixture_invalid: { all: ["curent.duration", { expr: "fixture_bad(current)" }] },
          };
          const patterns = {
            fixture_pattern: {
              relation: "Segment",
              sequence: [
                {
                  capture: "x",
                  where: { all: ["current.phonem", "curent.duration"] },
                  optional: true,
                },
              ],
              constraint: { expr: "fixture_outer(current)" },
            },
          };
          const fixtureRelations = {
            Fixture: {
              type: "parallel",
              scalars: {
                duration: {
                  floor_field: "missingFloor",
                  floor_fallback: { value: "current.missingFloor", citations: ["Fixture source"] },
                },
              },
            },
          };
          const fixtureSections = {
            rules,
            functions,
            predicates,
            patterns,
            relations: fixtureRelations,
            maps: { fixture_map: { bad: 3 } },
            string_sets: { fixture_set: [3] },
            tags: { fixture_tag: "" },
            frame_programs: {
              fixture_frame: {
                relation: "Segment",
                write: "duration",
                tag: "duration_floor",
                citations: ["Fixture source"],
                unit: { all: ["current.phonem"] },
                frame_ms: "current.phonem",
                lead_in_frames: "current.phonem",
                tail_frames: "current.phonem",
                features: { bad: { value: "fixture_outer(current)", edge: true } },
                group: { start: "u.missing", totals: { bad: "u.missing" } },
                registers: { x: 0 },
                outputs: { F0: "r.missing", unknown: "r.missing" },
              },
            },
          };
          const frontend = writeExtendingFrontend(
            dir,
            included ? fixtureSections : {},
            included ? {} : fixtureSections,
          );
          const resource = included ? `${dir.replace(/\\/g, "/")}/pipeline.yaml` : frontend;
          const authored = parseYamlString(readFileSync(resource, "utf8"), resource);
          const entries = yamlDocumentSpans(authored);
          const key = entries.find(
            (entry) => entry.value.path.join(".") === "rules.unknown_path_relation.aply",
          )?.key;
          const value = entries.find(
            (entry) =>
              entry.value.path.join(".") === "rules.unknown_path_relation.select.where.all.0",
          )?.value;
          const semanticValue = entries.find(
            (entry) =>
              entry.value.path.join(".") === "rules.unknown_path_relation.constraint.all.0.expr",
          )?.value;
          expect(key).toBeDefined();
          expect(value).toBeDefined();
          expect(semanticValue).toBeDefined();
          let failure: unknown;
          try {
            if (asynchronous) await preloadRulepackSpecFromPath(frontend);
            else loadRulepackSpecFromPath(frontend);
          } catch (error) {
            failure = error;
          }
          expect(failure).toBeInstanceOf(Error);
          const lines = String(failure).split("\n");
          expect(
            lines.find((line) =>
              line.includes("E_RULE_FIELD_UNKNOWN at rules.unknown_path_relation.aply:"),
            ),
          ).toContain(`[${resource}:${key?.line}:${key?.column}]`);
          expect(
            lines.find((line) =>
              line.includes("E_CEL_INVALID at rules.unknown_path_relation.select.where.all[0]:"),
            ),
          ).toContain(`[${resource}:${value?.line}:${value?.column}]`);
          expect(
            lines.find((line) =>
              line.includes(
                "E_RULE_FEATURE_UNKNOWN at rules.unknown_path_relation.constraint.all[0].expr:",
              ),
            ),
          ).toContain(`[${resource}:${semanticValue?.line}:${semanticValue?.column}]`);
          for (const name of ["fixture_outer", "fixture_inner", "fixture_bad"]) {
            const body = entries.find(
              (entry) => entry.value.path.join(".") === `functions.${name}.body`,
            )?.value;
            expect(body).toBeDefined();
            expect(String(failure)).toContain(
              `macro body [${resource}:${body?.line}:${body?.column}]`,
            );
          }
          // CEL syntax errors include a multiline source highlight before the location suffix.
          const diagnosticBlocks = String(failure).split(/\n(?=[EW]_[A-Z_]+ at )/);
          const expectLocation = (code: string, path: string, position: "key" | "value") => {
            const source = entries.find(
              (entry) => entry.value.path.join(".") === path.replace(/\[(\d+)\]/g, ".$1"),
            )?.[position];
            expect(source).toBeDefined();
            const block = diagnosticBlocks.find((entry) => entry.includes(`${code} at ${path}:`));
            expect(block).toContain(`[${resource}:${source?.line}:${source?.column}]`);
            return block;
          };
          expectLocation("E_MAP_INVALID", "maps.fixture_map.bad", "key");
          expectLocation("E_STRING_SET_INVALID", "string_sets.fixture_set[0]", "value");
          expectLocation("E_TAG_MEANING_INVALID", "tags.fixture_tag", "key");
          for (const path of ["unit", "when", "set[0].value"]) {
            expectLocation("E_FRAME_NAME_UNKNOWN", `rules.fixture_frame_rule.${path}`, "value");
          }
          expectLocation("E_FRAME_NAME_UNKNOWN", "rules.fixture_frame_rule.set[0].register", "key");
          for (const insert of ["insert_point", "insert_points[0]"]) {
            for (const field of ["value", "when"]) {
              expectLocation(
                "E_RULE_FEATURE_UNKNOWN",
                `rules.fixture_points.${insert}.${field}`,
                "value",
              );
            }
          }
          expectLocation(
            "E_POINT_RELATION_UNKNOWN",
            "rules.fixture_points.insert_points[0].relation",
            "key",
          );
          for (const path of [
            "unit.all[0]",
            "frame_ms",
            "lead_in_frames",
            "tail_frames",
            "features.bad.value",
          ]) {
            expectLocation(
              "E_RULE_FEATURE_UNKNOWN",
              `frame_programs.fixture_frame.${path}`,
              "value",
            );
          }
          for (const path of ["group.start", "group.totals.bad", "outputs.F0", "outputs.unknown"]) {
            expectLocation("E_FRAME_NAME_UNKNOWN", `frame_programs.fixture_frame.${path}`, "value");
          }
          expectLocation(
            "E_FRAME_OUTPUT_COLUMN",
            "frame_programs.fixture_frame.outputs.unknown",
            "key",
          );
          expect(
            expectLocation(
              "E_RULE_FEATURE_UNKNOWN",
              "frame_programs.fixture_frame.features.bad.value",
              "value",
            ),
          ).toContain("macro body [");
          for (const [code, path, position] of [
            ["E_SCALAR_FLOOR_FIELD_UNKNOWN", "floor_field", "key"],
            ["E_RULE_FEATURE_UNKNOWN", "floor_fallback.value", "value"],
          ] as const) {
            const fullPath = `relations.Fixture.scalars.duration.${path}`;
            const source = entries.find((entry) => entry.value.path.join(".") === fullPath)?.[
              position
            ];
            expect(source).toBeDefined();
            expect(
              diagnosticBlocks.find((block) => block.includes(`${code} at ${fullPath}:`)),
            ).toContain(`[${resource}:${source?.line}:${source?.column}]`);
          }
          for (const [code, path, authoredPath, position] of [
            [
              "E_RULE_FEATURE_UNKNOWN",
              "sequence[0].where.all[0]",
              "sequence.0.where.all.0",
              "value",
            ],
            ["E_CEL_INVALID", "sequence[0].where.all[1]", "sequence.0.where.all.1", "value"],
            ["E_RULE_FEATURE_UNKNOWN", "constraint.expr", "constraint.expr", "value"],
            ["E_PATTERN_OPTION_UNSUPPORTED", "sequence[0].optional", "sequence.0.optional", "key"],
          ] as const) {
            const source = entries.find(
              (entry) => entry.value.path.join(".") === `patterns.fixture_pattern.${authoredPath}`,
            )?.[position];
            expect(source).toBeDefined();
            const block = diagnosticBlocks.find((entry) =>
              entry.includes(`${code} at patterns.fixture_pattern.${path}:`),
            );
            expect(block).toContain(`[${resource}:${source?.line}:${source?.column}]`);
            if (path === "constraint.expr") expect(block).toContain("macro body [");
          }
          for (const [path, authoredPath] of [
            ["all[0]", "all.0"],
            ["all[1].expr", "all.1.expr"],
          ]) {
            const source = entries.find(
              (entry) =>
                entry.value.path.join(".") === `predicates.fixture_invalid.${authoredPath}`,
            )?.value;
            expect(source).toBeDefined();
            expect(
              diagnosticBlocks.find((block) =>
                block.includes(`E_CEL_INVALID at predicates.fixture_invalid.${path}:`),
              ),
            ).toContain(`[${resource}:${source?.line}:${source?.column}]`);
          }
          for (const [code, path, authoredPath, position] of [
            [
              "E_CEL_INVALID",
              "constraint.all[1].any[0].not",
              "constraint.all.1.any.0.not",
              "value",
            ],
            [
              "E_RULE_FEATURE_UNKNOWN",
              "constraint.all[1].any[1].not.expr",
              "constraint.all.1.any.1.not.expr",
              "value",
            ],
            [
              "E_PREDICATE_UNKNOWN",
              "constraint.all[2].predicate",
              "constraint.all.2.predicate",
              "key",
            ],
            ["E_CEL_INVALID", "apply[0].value", "apply.0.value", "value"],
            ["E_RULE_APPLY_FIELD_UNKNOWN", "apply[0].valu", "apply.0.valu", "key"],
            ["E_RULE_FEATURE_UNKNOWN", "apply[3].value", "apply.3.template.value", "value"],
            ["E_RULE_FEATURE_UNKNOWN", "apply[4].value", "apply.3.template.value", "value"],
            [
              "E_RULE_FEATURE_UNKNOWN",
              "apply[2].value.fields.duration.value",
              "apply.2.value.fields.duration.value",
              "value",
            ],
            [
              "E_RULE_FEATURE_UNKNOWN",
              "apply[1].dispatch[0].when.all[0]",
              "apply.1.dispatch.0.when.all.0",
              "value",
            ],
          ] as const) {
            const source = entries.find(
              (entry) =>
                entry.value.path.join(".") === `rules.unknown_path_relation.${authoredPath}`,
            )?.[position];
            expect(source).toBeDefined();
            expect(
              diagnosticBlocks.find((block) =>
                block.includes(`${code} at rules.unknown_path_relation.${path}:`),
              ),
            ).toContain(`[${resource}:${source?.line}:${source?.column}]`);
          }
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      });
    }
  }
});

describe("macro source ancestry", () => {
  it("keeps the bundled call site primary and selects an overriding function body", () => {
    const sourcePath = "rules.vocal_effort.select.where";
    const base = rulepackRuleDocumentSpans(loadBundledRulepackSpec()).find(
      (entry) => entry.value.path.join(".") === sourcePath,
    );
    expect(base?.value.resource).toBe("/rules/frontends/qlatt-english/phases/prosody.yaml");
    expect(base?.parents?.[0].documentSpan.path).toEqual([
      "functions",
      "has_voiced_formants",
      "body",
    ]);
    expect(base?.parents?.[0].documentSpan.resource).toBe(
      "/rules/frontends/qlatt-english/frontend.yaml",
    );
    const dir = mkdtempSync(join(tmpdir(), "qlatt-macro-origins-"));
    try {
      const resource = writeExtendingFrontend(
        dir,
        {},
        {
          functions: {
            has_voiced_formants: { body: "fixture_helper(item)" },
            fixture_helper: { params: ["item"], body: "has(item.F1)" },
          },
        },
      );
      const child = rulepackRuleDocumentSpans(loadRulepackSpecFromPath(resource)).find(
        (entry) => entry.value.path.join(".") === sourcePath,
      );
      const authored = parseYamlString(readFileSync(resource, "utf8"), resource, {
        resource,
        role: "rulepack",
      });
      const body = yamlDocumentSpans(authored).find(
        (entry) => entry.value.path.join(".") === "functions.has_voiced_formants.body",
      );
      expect(child?.value).toEqual(base?.value);
      expect(child?.parents?.[0].documentSpan).toEqual(body?.value);
      const helper = yamlDocumentSpans(authored).find(
        (entry) => entry.value.path.join(".") === "functions.fixture_helper.body",
      );
      expect(child?.parents?.[0].parents[0].documentSpan).toEqual(helper?.value);
      expect(Object.isFrozen(child?.parents)).toBe(true);
      expect(JSON.parse(JSON.stringify(child))).toEqual(child);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("authored parameter origins through composition", () => {
  const baseResource = "/rules/frontends/qlatt-english/frontend.yaml";
  const pathOf = (name: string) => `parameters.policy.f0.${name}`;
  const origin = (spec: CompiledRulepack, path: string) =>
    rulepackParameterOrigins(spec).find((entry) => entry.value.path.join(".") === path);

  it("keeps actual Beauty additions and inherited base siblings at their document locations", () => {
    const beauty = loadBundledRulepackSpec("qlatt-beauty");
    const resource = "/rules/frontends/qlatt-beauty/frontend.yaml";
    const authored = parseYamlString(readFileSync(`public${resource}`, "utf8"), resource, {
      resource,
      role: "rulepack",
    });
    const expected = yamlDocumentSpans(authored).find(
      (entry) => entry.value.path.join(".") === pathOf("question_rise_fraction.value"),
    );
    expect(expected).toBeDefined();
    expect(origin(beauty, pathOf("question_rise_fraction.value"))).toEqual(expected);
    expect(origin(beauty, pathOf("downstep_k.value"))?.value.resource).toBe(baseResource);
    expect(Object.isFrozen(rulepackParameterOrigins(beauty))).toBe(true);
    expect(Object.isFrozen(expected?.value.path)).toBe(true);
  });

  it.each(["sync", "async"])(
    "keeps winning values through extends and includes (%s)",
    async (mode) => {
      const dir = mkdtempSync(join(tmpdir(), "qlatt-parameter-origins-"));
      try {
        const filename = writeExtendingFrontend(
          dir,
          {},
          {
            parameters: {
              policy: {
                rate: { default: { value: 1.1 } },
                f0: {
                  downstep_k: { value: 0.7, citations: ["Engineering fixture: child override"] },
                  boundary_l_pct_fraction: 0.1,
                },
                accent_assignment: { metrical_stress_overrides_word_class: { value: false } },
              },
            },
          },
        );
        const child =
          mode === "sync"
            ? loadRulepackSpecFromPath(filename)
            : await preloadRulepackSpecFromPath(filename);
        const authored = parseYamlString(readFileSync(filename, "utf8"), filename, {
          resource: filename,
          role: "rulepack",
        });
        const expected = yamlDocumentSpans(authored).find(
          (entry) => entry.value.path.join(".") === pathOf("downstep_k.value"),
        );
        expect(expected).toBeDefined();
        expect(origin(child, pathOf("downstep_k.value"))).toEqual(expected);
        const warnings = getRulepackValidationDiagnostics(child);
        const ratePath = "parameters.policy.rate.default";
        const rateWarning = warnings.find((entry) => entry.path === ratePath);
        expect(rateWarning?.documentSpan).toEqual(origin(child, ratePath)?.key);
        expect(rateWarning?.documentSpan?.resource).toBe(filename);
        expect(
          warnings.find((entry) => entry.path === "parameters.policy.rate.undershoot_coefficient")
            ?.documentSpan?.resource,
        ).toBe(baseResource);
        expect(origin(child, pathOf("downstep_floor_fraction.value"))?.value.resource).toBe(
          baseResource,
        );
        expect(origin(child, pathOf("downstep_k.citations.0"))?.value.resource).toBe(filename);
        expect(origin(child, pathOf("downstep_k.citations.1"))).toBeUndefined();
        expect(origin(child, pathOf("boundary_l_pct_fraction"))?.value.resource).toBe(filename);
        expect(origin(child, pathOf("boundary_l_pct_fraction.value"))).toBeUndefined();
        expect(origin(child, pathOf("boundary_l_pct_fraction.citations"))).toBeUndefined();
        expect(
          rulepackParameterOrigins(child).some(
            (entry) => entry.value.path[2] === "accent_assignment",
          ),
        ).toBe(false);
        const policy = (child.parameters as { policy: Dict }).policy;
        expect(policy.accent_assignment).toHaveProperty(
          "metrical_stress_overrides_word_class.value",
          true,
        );
        expect((policy.f0 as Dict).downstep_k).toEqual({
          value: 0.7,
          citations: ["Engineering fixture: child override"],
        });
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  );

  it("does not assign root locations to generated voice values", () => {
    const dectalk = loadBundledRulepackSpec("dectalk-english");
    expect(dectalk.parameters).toHaveProperty("policy.voice");
    expect(
      getRulepackValidationDiagnostics(dectalk)
        .filter((entry) => entry.path.startsWith("parameters.policy.voice."))
        .every((entry) => entry.documentSpan === undefined),
    ).toBe(true);
    expect(rulepackParameterOrigins(dectalk).some((entry) => entry.value.path[2] === "voice")).toBe(
      false,
    );
  });
});

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

  function expectKeywiseInheritance(child: Dict, spec: CompiledRulepack, dir: string): void {
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
    const spans = rulepackRuleDocumentSpans(spec);
    const resource = `${dir.replace(/\\/g, "/")}/pipeline.yaml`;
    const authored = yamlDocumentSpans(parseYamlString(readFileSync(resource, "utf8"), resource));
    for (const path of [
      "predicates.is_sonorant",
      "predicates.is_fixture_nasal",
      "relations.Syllable.features.fixtureFeature",
      "maps.phoneme_release_map.P_CL",
      "tags.fixture_tag",
    ]) {
      const matches = spans.filter((entry) => entry.value.path.join(".") === path);
      expect(matches).toHaveLength(1);
      const source = authored.find((entry) => entry.value.path.join(".") === path);
      expect(matches[0].value.line).toBe(source?.value.line);
      expect(matches[0].value.column).toBe(source?.value.column);
      expect(matches[0].value.resource).toBe(resource);
    }
    const inherited = spans.find(
      (entry) => entry.value.path.join(".") === "predicates.is_pausable_consonant",
    );
    expect(inherited?.value.resource).toBe("/rules/frontends/qlatt-english/pipeline.yaml");
    expect(inherited?.value.line).toBe(12);
    const baseRelation = spans.find(
      (entry) =>
        entry.value.path.join(".") === "relations.Segment.scalars.duration.floor_fallback.value",
    );
    expect(baseRelation?.value.resource).toBe("/rules/frontends/qlatt-english/pipeline.yaml");
    expect(baseRelation?.key?.line).toBe(450);
    for (const path of ["maps.phoneme_aspiration_map.P_CL", "tags.duration_floor"]) {
      expect(spans.find((entry) => entry.value.path.join(".") === path)?.value.resource).toBe(
        "/rules/frontends/qlatt-english/pipeline.yaml",
      );
    }
    expect(
      spans.some((entry) => entry.value.path.join(".") === "maps.phoneme_release_map.T_CL"),
    ).toBe(false);
  }

  it("adds, overrides and inherits entries by key (synchronous loader)", () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-extends-sections-"));
    try {
      const child = loadRulepackSpecFromPath(writeExtendingFrontend(dir, sections));
      expectKeywiseInheritance(child as unknown as Dict, child, dir);
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
      expectKeywiseInheritance(child as unknown as Dict, child, dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // A child-directory include that is there but cannot be read is an error;
  // only one that is absent is read from the base directory.
  it.each([
    ["synchronous", loadRulepackSpecFromPath],
    ["asynchronous", preloadRulepackSpecFromPath],
  ] as const)(
    "does not fall back to the base for an include that exists but cannot be read (%s loader)",
    async (_name, load) => {
      const dir = mkdtempSync(join(tmpdir(), "qlatt-extends-unreadable-"));
      try {
        const frontendPath = writeExtendingFrontend(dir, sections);
        // A directory where the file should be: it exists and reading it fails.
        mkdirSync(join(dir, "phases", "duration.yaml"), { recursive: true });
        const error = await Promise.resolve()
          .then(() => load(frontendPath))
          .then(
            () => null,
            (thrown: Error) => thrown,
          );
        expect(error?.message).toMatch(/^E_YAML_READ: '.*\/phases\/duration\.yaml' exists at /);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  );

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
    const spans = rulepackRuleDocumentSpans(child);
    // Undefined by the child and named by one of its phases: inherited, and
    // attributed to the base file the body was read from.
    for (const name of ["tobi_accent", "f0_continuation_rise", "accent_index_in_phrase"]) {
      expect(rules[name], name).toEqual(english.rules[name]);
      expect(origins[name], name).toBe(ENGLISH_PROSODY);
      expect(
        spans.find((entry) => entry.value.path.join(".") === `rules.${name}.select.where`)?.value
          .resource,
      ).toBe(ENGLISH_PROSODY);
    }
    // The child's own definition replaces the base's whole.
    expect((rules.tobi_baseline_init as Dict).citations).toEqual(ownBaseline.citations);
    expect(rules.tobi_baseline_init).not.toEqual(english.rules.tobi_baseline_init);
    expect(origins.tobi_baseline_init).toBe(`${dir.replace(/\\/g, "/")}/phases/prosody.yaml`);
    expect(
      spans.find((entry) => entry.value.path.join(".") === "rules.tobi_baseline_init.select.where")
        ?.value.resource,
    ).toBe(origins.tobi_baseline_init);
    // A base rule the child phases nowhere is not inherited.
    expect(english.rules).toHaveProperty("vocal_effort");
    expect(rules).not.toHaveProperty("vocal_effort");
    expect(origins).not.toHaveProperty("vocal_effort");
    expect(spans.some((entry) => entry.value.path[1] === "vocal_effort")).toBe(false);
    expect(
      spans.some(
        (entry) => entry.value.path[2] === "apply" && typeof entry.value.path[3] === "number",
      ),
    ).toBe(true);
    for (const name of [
      "place_f2_locus",
      "place_rel_copy",
      "burst_spectral_template",
      "weak_stop_release_parallel_attenuation",
    ]) {
      expect(rules).toHaveProperty(name);
      expect(
        spans.some(
          (entry) => entry.value.path[1] === name && typeof entry.value.path[3] === "number",
        ),
      ).toBe(true);
      expect(
        spans.some((entry) => entry.value.path.join(".") === `rules.${name}.select.where`),
      ).toBe(true);
    }
    const burst = spans.find(
      (entry) =>
        entry.compiledPath?.join(".") === "rules.burst_spectral_template.apply.8.dispatch.0.when",
    );
    expect(burst?.value.path.join(".")).toBe(
      "rules.burst_spectral_template.apply.0.dispatch.0.when",
    );
    expect(burst?.value.line).toBe(342);
    expect(burst?.parents?.[0].documentSpan.path).toEqual(["functions", "bilabial", "body"]);
    const trailing = spans.find(
      (entry) =>
        entry.compiledPath?.join(".") === "rules.place_f2_locus.apply.0.dispatch.8.default",
    );
    expect(trailing?.value.path.join(".")).toBe("rules.place_f2_locus.apply.0.dispatch.1.default");
    expect(trailing?.key?.line).toBe(36);
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
