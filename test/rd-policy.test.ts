import { load as loadYaml } from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  loadBundledRulepackSpec,
  loadFrontendResources,
} from "../src/declarative-frontend/rule-pack";
import { createDiagnostics } from "../src/diagnostics";
import { applyAffectToTrack } from "../src/input/apply-affect";
import { neutralVoiceQualityDelta } from "../src/input/direction-track";
import { projectRd, readRdPolicy } from "../src/input/rd-policy";

const english = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
if (!english.vqChannels) throw new Error("expected declared VQ resource");
const channels = english.vqChannels.channels;
const NEUTRAL_VQ = neutralVoiceQualityDelta(channels);

const policy = readRdPolicy({
  effective_rd: loadYaml("min: 0.5\nmax: 1.5\ncitations: [Fant_1997]\n"),
});
const context = { frontendId: "fixture", rdPolicy: policy, vqChannels: channels };

describe("declared effective Rd policy", () => {
  it("inherits declared VQ resources and permits an undeclared role", () => {
    const beauty = loadFrontendResources(loadBundledRulepackSpec("qlatt-beauty"));
    expect(english.vqChannels?.path).toBe("/rules/frontends/qlatt-english/policy/vq-channels.yaml");
    expect(beauty.vqChannels?.rdPolicy).toBe(english.vqChannels?.rdPolicy);
    const dectalk = loadFrontendResources(loadBundledRulepackSpec("dectalk-english"));
    expect(dectalk.vqChannels).toBeUndefined();
  });

  it("requires the role only when a nonzero Rd delta consumes it", () => {
    const track = [{ time: 0, params: { Rd: 0.7 } }];
    const absent = { frontendId: "without-vq", vqChannels: channels };
    expect(applyAffectToTrack(track, NEUTRAL_VQ, absent).track).toEqual(track);
    expect(() => applyAffectToTrack(track, { ...NEUTRAL_VQ, rdDelta: 1 }, absent)).toThrow(
      "E_FRONTEND_CONFIG: frontend 'without-vq' requires vq_channels",
    );
  });

  it("resolves Rd from the speaker profile and records the resolution", () => {
    const diagnostics = createDiagnostics();
    expect(projectRd({}, 0.1, policy, { speakerParams: { Rd: 1 }, diagnostics })).toEqual({
      Rd: 1,
      RdPhraseOffset: expect.closeTo(0.1),
    });
    expect(diagnostics.getEntries().map((entry) => entry.code)).toContain("RD_SPEAKER_RESOLVED");
  });

  it("records the declared clamp bounds in diagnostics", () => {
    const diagnostics = createDiagnostics();
    projectRd({ Rd: 0.7 }, 10, policy, { diagnostics });
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
    expect(() => projectRd(params, 1, policy, { diagnostics })).toThrow("E_RD_MISSING");
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
    const { track } = applyAffectToTrack(
      [{ time: 0, params: { Rd: 0.7, RdPhraseOffset: 0.1 } }],
      { ...NEUTRAL_VQ, rdDelta },
      context,
    );
    expect(track[0].params.Rd + track[0].params.RdPhraseOffset).toBeCloseTo(bound);
  });

  it("fails with a diagnostic when no Rd was resolved", () => {
    expect(() =>
      applyAffectToTrack([{ time: 0, params: {} }], { ...NEUTRAL_VQ, rdDelta: 1 }, context),
    ).toThrow("E_RD_MISSING");
  });
});
