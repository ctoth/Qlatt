import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { expandFormantBanks } from "../src/formant-bank";
import { createKlattScheduleCompiler } from "../src/klatt-interpreter";
import type { BindingSpec } from "../src/klatt-runtime";
import { createProvenanceCollector } from "../src/provenance";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";
import type { SemanticsDocument } from "../src/semantics/types";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { parseYamlString } from "../src/yaml-loader";

const root = resolve(__dirname, "../public/experiments/klatt80-baseline");
const semantics = parseYamlString<SemanticsDocument>(
  readFileSync(resolve(root, "semantics.yaml"), "utf8"),
);
const graph = parseYamlString<Parameters<typeof expandFormantBanks>[0]>(
  readFileSync(resolve(root, "graph.yaml"), "utf8"),
);
expandFormantBanks(graph, semantics);
const { topoEvaluator } = createConfiguredEvaluator();

function evaluate(params: Record<string, number>) {
  const result = topoEvaluator.evaluate(semantics, {
    params: { F0: 110, AV: 60, AVS: 50, A1: 50, A2: 50, A3: 50, OQ: 60, TL: 10, ...params },
    constants: semantics.constants ?? {},
  });
  expect(result.errors).toEqual([]);
  return result.values;
}

describe("vocal effort", () => {
  it("schedules the realized source and formant controls through graph bindings", () => {
    const bindingMap = new Map<string, BindingSpec[]>();
    for (const [nodeId, node] of Object.entries(graph.nodes ?? {})) {
      for (const [paramName, spec] of Object.entries(node.params ?? {})) {
        if (typeof spec !== "object" || spec === null || !("bind" in spec)) continue;
        const bindName = String(spec.bind);
        bindingMap.set(bindName, [
          ...(bindingMap.get(bindName) ?? []),
          { nodeId, paramName, bindName },
        ]);
      }
    }
    const { compileSchedule } = createKlattScheduleCompiler({
      sampleRate: 48000,
      semantics,
      bindingMap,
    });
    const schedule = compileSchedule([
      { time: 0, params: { F0: 110, AV: 60, F1: 500, OQ: 60, TL: 10, effort: 4 } },
    ]);
    for (const [nodeId, paramName, value] of [
      ["lfSource", "f0", 130.4],
      ["lfSource", "oq", 60 - 12 / 6.5],
      ["lfSource", "tl", 9.2],
      ["cascadeF1", "frequency", 514],
    ] as const) {
      const entry = schedule.find(
        (event) => event.target.nodeId === nodeId && event.target.paramName === paramName,
      );
      expect(entry?.value).toBeCloseTo(value);
    }
  });
  it("preserves the modal inputs when effort is omitted or zero", () => {
    const modal = evaluate({});
    expect(evaluate({ effort: 0 })).toEqual(modal);
    expect(modal).toMatchObject({ F0: 110, F1: 500, AV: 60, A1: 50, OQ: 60, TL: 10 });
  });

  it("covaries pitch, F1, source level and spectral balance with effort", () => {
    const modal = evaluate({ effort: 0 });
    const loud = evaluate({ effort: 4 });
    expect(loud.F0).toBeCloseTo(130.4);
    expect(loud.F1).toBeCloseTo(514);
    expect(loud.F2).toBe(modal.F2);
    expect(loud.F3).toBe(modal.F3);
    expect(loud.AV).toBe(64);
    // Parallel amplitudes are relative to the source: total slope includes AVS.
    for (const [name, slope] of [
      ["A1", 1.1],
      ["A2", 1.24],
      ["A3", 1.3],
    ] as const) {
      expect(Number(loud[name]) + Number(loud.AVS) - 100).toBeCloseTo(slope * 4);
    }
    expect(Number(loud.OQ)).toBeLessThan(Number(modal.OQ));
    expect(Number(loud.TL)).toBeLessThan(Number(modal.TL));
    expect(Number(loud.voiceGain)).toBeGreaterThan(Number(modal.voiceGain));
    const soft = evaluate({ effort: -4.5 });
    expect(soft.OQ).toBeCloseTo(73);
    expect(soft.AV).toBeCloseTo(55.5);
    expect(Number(soft.TL)).toBeGreaterThan(Number(modal.TL));
  });

  it("preserves off sentinels and unvoiced frames", () => {
    const off = { F0: 0, AV: 0, AVS: -70, A1: 0, A2: 0, A3: 0, OQ: 0, TL: 0 };
    for (const effort of [-4.5, 6.5]) {
      expect(evaluate({ ...off, effort })).toMatchObject(off);
      expect(evaluate({ effort, A1: 0, A2: 0, A3: 0 })).toMatchObject({ A1: 0, A2: 0, A3: 0 });
    }
  });

  it("bounds extreme effort and derives OQ and TL without changing neutral sentinels", () => {
    const diagnostics = createDiagnostics();
    topoEvaluator.evaluate(semantics, {
      params: { effort: 100 },
      constants: semantics.constants ?? {},
      diagnostics,
    });
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "W_SEMANTICS_PARAM_RANGE",
        data: { name: "effort", value: 100, range: [-4.5, 6.5] },
      }),
    );
    expect(evaluate({ effort: 100 })).toMatchObject({ effortDb: 6.5 });
    expect(evaluate({ effort: -100 })).toMatchObject({ effortDb: -4.5 });
    expect(evaluate({ effort: 0, OQ: 0, TL: 0 })).toMatchObject({ OQ: 0, TL: 0 });
    const active = evaluate({ effort: 2, OQ: 0, TL: 0 });
    expect(Number(active.OQ)).toBeGreaterThan(0);
    expect(Number(active.TL)).toBeGreaterThan(0);
  });

  it("lowers cited accent and phrase effort into a varying realized AV track", () => {
    const provenance = createProvenanceCollector();
    const { track } = textToKlattTrackDetailed(
      "The quick brown fox jumps over the lazy dog.",
      110,
      30,
      { provenance },
    );
    const decisions = provenance
      .getDecisions()
      .filter((decision) => decision.reason.includes("vocal_effort"));
    expect(decisions.length).toBeGreaterThan(0);
    for (const decision of decisions) {
      expect(decision.citations).toContain("Lienard & Di Benedetto 1999");
    }
    const voiced = track.filter((frame) => frame.phoneme !== "SIL" && frame.params.AV > 0);
    expect(voiced.length).toBeGreaterThan(0);
    expect(new Set(voiced.map((frame) => frame.params.effort)).size).toBeGreaterThan(2);
    expect(voiced.some((frame) => frame.params.effort > 0)).toBe(true);
    expect(voiced.some((frame) => frame.params.effort < 0)).toBe(true);
    for (const frame of voiced) {
      expect(frame.provenance?.effort).toBeTruthy();
      const realized = evaluate(frame.params);
      expect(Number(realized.AV) - frame.params.AV).toBeCloseTo(frame.params.effort);
    }
  });
});
