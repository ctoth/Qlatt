import { describe, expect, it } from "vitest";
import { loadExperimentConfig } from "../../src/experiments/load-experiment-config";
import { expandFormantBanks } from "../../src/formant-bank";
import { analyzeStopReleases, analyzeTrackGains, KLATT80_EXPECTED } from "../../src/track-analysis";
import { loadYamlDocumentSync } from "../../src/yaml-loader";

describe("track conformance authority", () => {
  it("loads Table III targets and documented tolerances from YAML", () => {
    const reference = loadYamlDocumentSync<{
      citations: string[];
      targets: typeof KLATT80_EXPECTED;
      conformance: { durationToleranceMs: { value: number; basis: string } };
    }>("/experiments/klatt80-baseline/reference/table-iii.yaml");
    expect(reference.citations.some((citation) => citation.includes("Klatt 1980"))).toBe(true);
    expect(KLATT80_EXPECTED).toEqual(reference.targets);
    expect(reference.targets.T_REL).toMatchObject({ dur: 15, AF: 58, A3: 30 });
    const tolerance = reference.conformance.durationToleranceMs;
    expect(tolerance.basis).toContain("engineering estimate");
    const release = { time: 0, phoneme: "T_REL", params: reference.targets.T_REL };
    const track = [
      { ...release, params: { AF: 58, AH: 55, A3: 30 } },
      { time: (15 + tolerance.value) / 1000 },
    ];
    expect(analyzeStopReleases(track, [{ relTime: 0 }])[0].issues).toEqual([]);
    track[1].time += 0.001;
    expect(analyzeStopReleases(track, [{ relTime: 0 }])[0].issues[0]).toContain("dur:");
  });

  it("does not promote aspiration into frication in parallel mode", () => {
    const analysis = analyzeTrackGains([{ time: 0, params: { SW: 1, AF: 0, AH: 60 } }], {});
    expect(analysis?.ranges.fricGain?.max).toBe(0);
    expect(analysis?.ranges.aspGain?.max).toBeGreaterThan(0);
  });

  it("uses selected realize rules, dependencies, defaults, and cumulative frames", async () => {
    const { graph, semantics } = await loadExperimentConfig("klatt80-baseline");
    expandFormantBanks(graph, semantics);
    semantics.realize = {
      ...semantics.realize,
      auditSeed: { expr: "AF + sampleRate / 48000", deps: ["AF", "sampleRate"] },
      fricGainScaled: { expr: "auditSeed * 2", deps: ["auditSeed"] },
      a1Linear: { expr: "-auditSeed * 3", deps: ["auditSeed"] },
    };
    const analysis = analyzeTrackGains(
      [
        { time: 0, params: { AF: 10 } },
        { time: 0.1, params: { AH: 30 } },
      ],
      {},
      48000,
      semantics,
    );
    expect(analysis?.ranges.fricGain).toEqual({ min: 22, max: 22 });
    expect(analysis?.ranges.parallelFormantGain?.max).toBeGreaterThanOrEqual(33);
    expect(analysis?.warnings).toEqual([]);
  });
});
