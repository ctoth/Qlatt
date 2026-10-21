import { describe, expect, it } from "vitest";
import { loadExperimentConfig } from "../../src/experiments/load-experiment-config";
import { expandFormantBanks } from "../../src/formant-bank";
import type { TrackReference } from "../../src/track-analysis";
import {
  analyzeStopReleases,
  analyzeTrackGains,
  findVoicingIssues,
  summarizeBranchSwitch,
  summarizeSourceControl,
} from "../../src/track-analysis";
import { loadYamlDocumentSync } from "../../src/yaml-loader";

describe("track conformance authority", () => {
  it("counts configured switch values without inferring parallel activity", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const policy = semantics.analysis!.branch_switch!;
    const track = [
      { time: 0, params: { route: 2, SW: 0, AF: 60 } },
      { time: 1, params: { route: 0, SW: 1 } },
      { time: 3, params: { route: 7 } },
      { time: 4, params: { route: NaN } },
      { time: 5, params: { route: Infinity } },
      { time: 6 },
    ];
    expect(summarizeBranchSwitch(track, { ...policy, param: "route", value: 2 })).toEqual({
      selectedEvents: 1,
      otherEvents: 2,
      selectedSeconds: 1,
      selectedShare: 25,
    });
    const control = summarizeBranchSwitch(track, policy);
    expect(control.selectedEvents).toBe(1);
    expect(control.otherEvents).toBe(1);
    expect(control.selectedSeconds).toBe(2);
    expect(control.selectedShare).toBeCloseTo(200 / 3);
    expect(control).not.toHaveProperty("parallelEvents");
    expect(summarizeBranchSwitch([], policy)).toEqual({
      selectedEvents: 0,
      otherEvents: 0,
      selectedSeconds: 0,
      selectedShare: 0,
    });
    for (const id of ["qlatt-beauty", "dectalk-english"]) {
      const selected = (await loadExperimentConfig(id)).semantics.analysis!.branch_switch!;
      expect(selected).toEqual(policy);
    }
    for (const id of ["klsyn88", "dectalk-vtm"]) {
      expect((await loadExperimentConfig(id)).semantics.analysis?.branch_switch).toBeUndefined();
    }
  });

  it("counts a selected source control with held values and duration weighting", () => {
    const track = [
      { time: 0, params: { lfMode: 4 } },
      { time: 1, params: { selected: 3 } },
      { time: 3, params: { selected: NaN } },
      { time: 4, params: { selected: Infinity } },
      { time: 5, params: { selected: 4 } },
      { time: 5 },
    ];
    expect(summarizeSourceControl(track, "selected", 2)).toEqual({
      counts: { 2: 1, 3: 3, 4: 2 },
      seconds: { 2: 1, 3: 4 },
    });
    expect(summarizeSourceControl(track, "lfMode", 0)).toEqual({
      counts: { 4: 6 },
      seconds: { 4: 5 },
    });
    expect(summarizeSourceControl(track, "selected", NaN)).toEqual({
      counts: { 3: 3, 4: 2 },
      seconds: { 3: 4 },
    });
    expect(summarizeSourceControl([], "selected", 2)).toEqual({ counts: {}, seconds: {} });
  });

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
      findVoicingIssues(
        invalidVoicing,
        {},
        {
          ...policy,
          maxVoicingIssues: { ...policy.maxVoicingIssues, value: 2 },
        },
      ),
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
