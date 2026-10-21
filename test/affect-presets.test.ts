import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  loadFrontendResources,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";
import { compileAffect } from "../src/input/affect";
import { parseAffectPresets, validateAffectPresetChannels } from "../src/input/affect-presets";
import { parseDirectionInput } from "../src/input/parse";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const english = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
if (!english.affectPresets || !english.vqChannels) {
  throw new Error("expected declared VQ and affect resources");
}
const affectResource = english.affectPresets;
const library = affectResource.library;
const channels = english.vqChannels.channels;

describe("declarative affect presets", () => {
  it("inherits the declared library and leaves DECtalk's role absent", () => {
    const beauty = loadFrontendResources(loadBundledRulepackSpec("qlatt-beauty"));
    expect(english.affectPresets?.path).toBe(
      "/rules/frontends/qlatt-english/policy/affect-presets.yaml",
    );
    expect(english.affectPresets?.library.presets.tender).toBeDefined();
    expect(beauty.affectPresets?.library).toBe(english.affectPresets?.library);
    const dectalk = loadFrontendResources(loadBundledRulepackSpec("dectalk-english"));
    expect(dectalk.affectPresets).toBeUndefined();
  });

  it("requires the role only when a global or local named affect consumes it", () => {
    const input = { score: { text: "hello" }, directionTrack: { version: "1" as const } };
    const options = { frontendId: "dectalk-english" };
    expect(parseDirectionInput(input, options).directions).toEqual([]);
    const affect = { preset: "tender" };
    for (const directionTrack of [
      { version: "1" as const, global: { affect } },
      {
        version: "1" as const,
        spans: [{ id: "local", anchor: { unit: "word" as const, start: 0 }, affect }],
      },
    ]) {
      expect(() => parseDirectionInput({ ...input, directionTrack }, options)).toThrow(
        "E_FRONTEND_CONFIG: frontend 'dectalk-english' requires affect_presets",
      );
    }
    expect(() =>
      textToKlattTrackDetailed("hello", undefined, undefined, {
        frontendId: "dectalk-english",
        directionTrack: { version: "1", global: { affect } },
      }),
    ).toThrow("E_FRONTEND_CONFIG: frontend 'dectalk-english' requires affect_presets");
  });

  it("uses the supplied library's names and degree curve through direction parsing", () => {
    const selected = parseAffectPresets({
      presets: [{ ...library.presets.tender, name: "selected" }],
      variants: {},
      degree: {
        points: [
          [0, 0],
          [0.5, 0.2],
          [1, 1],
        ],
        citations: ["engineering estimate"],
      },
    });
    const parsed = parseDirectionInput(
      {
        score: { text: "hello" },
        directionTrack: {
          version: "1",
          global: { affect: { preset: "selected", degree: 0.5 } },
        },
      },
      { frontendId: "selected", affectLibrary: selected, vqChannels: channels },
    );
    expect(parsed.directions[0].affect?.degree).toBe(0.2);
    expect(parsed.directions[0].affect?.label).toBe("selected");
    expect(() => compileAffect(selected, channels, "tender")).toThrow(/Unknown affect preset/);
  });

  it("preserves every preset's dimensions, channels, and citations at boundary and intermediate degrees", () => {
    const values = Object.keys(library.presets).flatMap((name) =>
      [-1, 0, 0.25, 0.7, 1, 2].map((degree) => {
        const { dimensions, vq, citations } = compileAffect(library, channels, name, degree);
        return { name, degree, dimensions, vq, citations };
      }),
    );
    expect(createHash("sha256").update(JSON.stringify(values)).digest("hex")).toMatchSnapshot();
  });

  it("loads the complete cited library from YAML", () => {
    const source = readFileSync(`public${affectResource.path}`, "utf8");
    const document = load(source) as { presets: { name: string; citations: string[] }[] };
    expect(document.presets.map((preset) => preset.name)).toEqual(Object.keys(library.presets));
    expect(document.presets.every((preset) => preset.citations.length > 0)).toBe(true);
    expect(source.includes("# engineering estimate")).toBe(true);
  });

  it("rejects preset fields outside the selected channel resource", () => {
    const invalid = parseAffectPresets({
      degree: library.degree,
      variants: {},
      presets: [
        {
          name: "typo",
          group: "emotion",
          dimensions: { valence: 0, arousal: 0, dominance: 0 },
          vq: { f0Scael: 1 },
          citations: ["engineering estimate"],
        },
      ],
    });
    expect(() => validateAffectPresetChannels(invalid, channels)).toThrow(/f0Scael/);
  });

  it("emits a cited preset application into the supplied provenance collector", () => {
    const provenance = createProvenanceCollector();
    compileAffect(library, channels, "happy", 0.7, { provenance });
    const records = provenance.getDecisions();
    expect(
      records.some(
        (record) =>
          record.type === "affect_preset_applied" &&
          record.reason.includes("happy") &&
          record.citations.length > 0,
      ),
    ).toBe(true);
  });
});

it("exposes engineering estimates as uncited provenance decisions", () => {
  const provenance = createProvenanceCollector();
  compileAffect(library, channels, "tender", 0.7, { provenance });
  expect(
    provenance
      .getDecisions()
      .some(
        (record) => record.type === "affect_engineering_estimate" && record.citations.length === 0,
      ),
  ).toBe(true);
});
