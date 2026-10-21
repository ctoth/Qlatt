import { describe, expect, it } from "vitest";
import { loadExperimentConfig } from "../../src/experiments/load-experiment-config";
import { expandFormantBanks } from "../../src/formant-bank";
import type { TrackReference } from "../../src/track-analysis";
import { analyzeStopReleases, analyzeTrackGains, findVoicingIssues } from "../../src/track-analysis";
import { loadYamlDocumentSync } from "../../src/yaml-loader";

describe("track conformance authority", () => {
  it("inherits display policy and applies selected warning thresholds", async () => {
    const { graph, semantics } = await loadExperimentConfig("klatt80-baseline");
    const child = await loadExperimentConfig("test-inherit");
    expect(child.semantics.analysis).toEqual(semantics.analysis);
    const policy = semantics.analysis!;
    expect(policy.maxVoicingIssues.basis).toContain("engineering estimate");
    const invalidVoicing = Array.from({ length: 8 }, (_, time) => ({
      time,
      params: { AV: 60, F0: 0 },
    }));
    expect(findVoicingIssues(invalidVoicing, {}, policy)).toHaveLength(6);
    expect(
      findVoicingIssues(invalidVoicing, {}, {
        ...policy,
        maxVoicingIssues: { ...policy.maxVoicingIssues, value: 2 },
      }),
    ).toHaveLength(2);
    expandFormantBanks(graph, semantics);
    const track = [{ time: 0, params: { SW: 1, AF: 0, AVS: 0, GO: 0, parallelScale: 0.1 } }];
    const control = analyzeTrackGains(track, {}, 48000, semantics, policy)!;
    const changed = analyzeTrackGains(track, {}, 48000, semantics, {
      ...policy,
      lowParallelScale: { ...policy.lowParallelScale, value: 0.2 },
      lowParallelGain: { ...policy.lowParallelGain, value: 0 },
    })!;
    expect(control.warnings).not.toContain("parallelScale=0.100 very low");
    expect(changed.warnings).toContain("parallelScale=0.100 very low");
    expect(control.warnings).toContain("Parallel gains < 0.001");
    expect(changed.warnings).not.toContain("Parallel gains < 0");
    expect(changed.ranges).toEqual(control.ranges);
  });

  it("loads Table III targets and documented tolerances from YAML", () => {
    const reference = loadYamlDocumentSync<TrackReference>(
      "/experiments/klatt80-baseline/reference/table-iii.yaml",
    );
    expect(reference.citations.some((citation) => citation.includes("Klatt 1980"))).toBe(true);
    expect(reference.targets.T_REL).toMatchObject({ dur: 15, AF: 58, A3: 30 });
    const tolerance = reference.conformance.durationToleranceMs;
    expect(tolerance.basis).toContain("engineering estimate");
    const release = { time: 0, phoneme: "T_REL", params: reference.targets.T_REL };
    const track = [
      { ...release, params: { AF: 58, AH: 55, A3: 30 } },
      { time: (15 + tolerance.value) / 1000 },
    ];
    expect(analyzeStopReleases(track, reference, [{ relTime: 0 }])[0].issues).toEqual([]);
    track[1].time += 0.001;
    expect(analyzeStopReleases(track, reference, [{ relTime: 0 }])[0].issues[0]).toContain("dur:");
    const alternate = structuredClone(reference);
    alternate.conformance.durationToleranceMs.value += 2;
    expect(analyzeStopReleases(track, alternate, [{ relTime: 0 }])[0].issues).toEqual([]);
  });

  it("does not promote aspiration into frication in parallel mode", async () => {
    const { graph, semantics } = await loadExperimentConfig("klatt80-baseline");
    expandFormantBanks(graph, semantics);
    const analysis = analyzeTrackGains(
      [{ time: 0, params: { SW: 1, AF: 0, AH: 60 } }],
      {},
      48000,
      semantics,
      semantics.analysis!,
    );
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
      semantics.analysis!,
    );
    expect(analysis?.ranges.fricGain).toEqual({ min: 22, max: 22 });
    expect(analysis?.ranges.parallelFormantGain?.max).toBeGreaterThanOrEqual(33);
    expect(analysis?.warnings).toEqual([]);
  });
});
