import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AFFECT_PRESETS, compileAffect } from "../src/input/affect";
import { createProvenanceCollector } from "../src/provenance";

afterEach(() => {
  vi.doUnmock("../src/yaml-loader");
  vi.resetModules();
});

describe("declarative affect presets", () => {
  it("preserves every preset's dimensions, channels, and citations at boundary and intermediate degrees", () => {
    const values = [...AFFECT_PRESETS.keys()].flatMap((name) =>
      [-1, 0, 0.25, 0.7, 1, 2].map((degree) => {
        const { dimensions, vq, citations } = compileAffect(name, degree);
        return { name, degree, dimensions, vq, citations };
      }),
    );
    expect(createHash("sha256").update(JSON.stringify(values)).digest("hex")).toMatchSnapshot();
  });

  it("loads the complete cited library from YAML", () => {
    const source = readFileSync("public/rules/affect/presets.yaml", "utf8");
    const document = load(source) as { presets: { name: string; citations: string[] }[] };
    expect(document.presets.map((preset) => preset.name)).toEqual([...AFFECT_PRESETS.keys()]);
    expect(document.presets.every((preset) => preset.citations.length > 0)).toBe(true);
    expect(source.includes("# engineering estimate")).toBe(true);
  });

  it("rejects unknown voice-quality fields at load time", async () => {
    vi.doMock("../src/yaml-loader", async (importOriginal) => {
      const original = await importOriginal<typeof import("../src/yaml-loader")>();
      return {
        ...original,
        loadYamlDocumentSync(path: string) {
          if (path !== "/rules/affect/presets.yaml") return original.loadYamlDocumentSync(path);
          return {
            degree: {
              points: [
                [0, 0],
                [1, 1],
              ],
              citations: ["engineering estimate"],
            },
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
          };
        },
      };
    });
    await expect(import("../src/input/affect")).rejects.toThrow(/f0Scael/);
  });

  it("emits a cited preset application into the supplied provenance collector", () => {
    const provenance = createProvenanceCollector();
    // The new collector option is the behavior under test.
    compileAffect("happy", 0.7, { provenance } as Parameters<typeof compileAffect>[2]);
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
  compileAffect("tender", 0.7, { provenance });
  expect(
    provenance
      .getDecisions()
      .some(
        (record) => record.type === "affect_engineering_estimate" && record.citations.length === 0,
      ),
  ).toBe(true);
});
