import { load as loadYaml } from "js-yaml";
import { describe, expect, it, vi } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { applyAffectToTrack } from "../src/input/apply-affect";
import { NEUTRAL_VQ } from "../src/input/direction-track";
import { projectRd, readRdPolicy } from "../src/input/rd-policy";

vi.mock("../src/yaml-loader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/yaml-loader")>();
  return {
    ...actual,
    loadYamlDocumentSync: <T = unknown>(path: string): T => {
      const document = actual.loadYamlDocumentSync<T>(path);
      if (path !== "/rules/policy/vq-channels.yaml") return document;
      // Change the declared YAML bounds, preserving the other channel policy.
      return {
        ...document,
        effective_rd: loadYaml("min: 0.5\nmax: 1.5\ncitations: [Fant_1997]\n"),
      };
    },
  };
});

describe("declared effective Rd policy", () => {
  it("resolves Rd from the speaker profile and records the resolution", () => {
    const diagnostics = createDiagnostics();
    expect(projectRd({}, 0.1, { speakerParams: { Rd: 1 }, diagnostics })).toEqual({
      Rd: 1,
      RdPhraseOffset: expect.closeTo(0.1),
    });
    expect(diagnostics.getEntries().map((entry) => entry.code)).toContain("RD_SPEAKER_RESOLVED");
  });

  it("records the declared clamp bounds in diagnostics", () => {
    const diagnostics = createDiagnostics();
    projectRd({ Rd: 0.7 }, 10, { diagnostics });
    expect(diagnostics.getEntries()).toEqual([
      expect.objectContaining({
        level: "warn",
        data: expect.objectContaining({ min: 0.5, max: 1.5, clamped: 1.5 }),
      }),
    ]);
  });

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY])("diagnoses unresolved Rd %s", (Rd) => {
    const diagnostics = createDiagnostics();
    const params: Record<string, number> = Rd === undefined ? {} : { Rd };
    expect(() => projectRd(params, 1, { diagnostics })).toThrow("E_RD_MISSING");
    expect(diagnostics.getEntries().map((entry) => entry.code)).toContain("E_RD_MISSING");
  });

  it.each([
    {},
    { effective_rd: { min: 2, max: 1, citations: ["Fant_1997"] } },
    { effective_rd: { min: 0, max: Infinity, citations: ["Fant_1997"] } },
    { effective_rd: { min: 0, max: 1, citations: [] } },
  ])("rejects invalid or uncited policy %j", (document) => {
    expect(() => readRdPolicy(document)).toThrow("E_RD_POLICY");
  });

  it.each([
    [10, 1.5],
    [-10, 0.5],
  ])("clamps delta %s to the YAML bound %s", (rdDelta, bound) => {
    const { track } = applyAffectToTrack([{ time: 0, params: { Rd: 0.7, RdPhraseOffset: 0.1 } }], {
      ...NEUTRAL_VQ,
      rdDelta,
    });
    expect(track[0].params.Rd + track[0].params.RdPhraseOffset).toBeCloseTo(bound);
  });

  it("fails with a diagnostic when no Rd was resolved", () => {
    expect(() =>
      applyAffectToTrack([{ time: 0, params: {} }], { ...NEUTRAL_VQ, rdDelta: 1 }),
    ).toThrow("E_RD_MISSING");
  });
});
