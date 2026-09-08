import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { expandFormantBanks } from "../src/formant-bank";
import { createProvenanceCollector } from "../src/provenance";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";
import type { SemanticsDocument } from "../src/semantics/types";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { parseYamlString } from "../src/yaml-loader";

const root = resolve(__dirname, "../public/experiments/klatt80-baseline");
const semantics = parseYamlString<SemanticsDocument>(
  readFileSync(`${root}/semantics.yaml`, "utf8"),
);
const graph = parseYamlString<Parameters<typeof expandFormantBanks>[0]>(
  readFileSync(`${root}/graph.yaml`, "utf8"),
);
expandFormantBanks(graph, semantics);
const { topoEvaluator } = createConfiguredEvaluator();
function evaluate(params: Record<string, number>) {
  const result = topoEvaluator.evaluate(semantics, {
    params,
    constants: semantics.constants ?? {},
  });
  expect(result.errors).toEqual([]);
  return result.values;
}

describe("measured nasal side branch", () => {
  it("reports out-of-range port area while bounding the realized coupling", () => {
    const diagnostics = createDiagnostics();
    const result = topoEvaluator.evaluate(semantics, {
      params: { nasalCouplingArea: 5 },
      constants: semantics.constants ?? {},
      diagnostics,
    });
    expect(result.values.nasalCouplingClamped).toBe(1);
    expect(diagnostics.getEntries()).toEqual([
      expect.objectContaining({
        code: "W_SEMANTICS_PARAM_RANGE",
        data: { name: "nasalCouplingArea", value: 5, range: [0, 2.5] },
      }),
    ]);
  });

  it("connects the second pair into the cascade and binds its realized controls", () => {
    expect(graph.connections).toEqual(
      expect.arrayContaining([
        ["nz", "npSecond"],
        ["npSecond", "nzSecond"],
        ["nzSecond", "nzPlace"],
      ]),
    );
    expect(graph.nodes.npSecond).toMatchObject({
      type: "resonator",
      params: { frequency: { bind: "nasalSecondPoleBound" } },
    });
    expect(graph.nodes.nzSecond).toMatchObject({
      type: "antiresonator",
      params: { frequency: { bind: "nasalSecondZeroBound" } },
    });
  });

  it.each([
    ["ten boys", 1, 200, 1120],
    ["ten cats", 3, 350, 1200],
  ])("selects consistent murmur poles after assimilation in %s", (phrase, place, f1, f2) => {
    const provenance = createProvenanceCollector();
    const { track } = textToKlattTrackDetailed(String(phrase), 110, 30, { provenance });
    const nasal = track.filter((frame) => frame.phoneme === "N");
    expect(
      nasal.some(
        ({ params }) => params.nasalPlaceIndex === place && params.F1 === f1 && params.F2 === f2,
      ),
    ).toBe(true);
    expect(
      provenance
        .getDecisions()
        .some((decision) =>
          decision.citations.some((citation) => citation.includes("Recasens 1983 Table II")),
        ),
    ).toBe(true);
  });
  it("opens two pole-zero pairs with area and bypasses both for oral speech", () => {
    const oral = evaluate({ nasalCouplingArea: 0 });
    expect(oral.nasalSecondPoleBound).toBe(0);
    expect(oral.nasalSecondZeroBound).toBe(0);
    const open = evaluate({ nasalCouplingArea: 2.5 });
    // Feng & Castelli 1996: wall-corrected Helmholtz target; Maeda 1993 volume.
    const lowTarget = Math.sqrt(((35000 / (2 * Math.PI)) ** 2 * 0.6) / (78 * 3) + 200 ** 2);
    expect(open.nasalCoreFnp).toBeCloseTo(lowTarget, 6);
    expect(open.nasalSecondPoleBound).toBe(1000);
    expect(open.nasalSecondZeroBound).toBe(1803);
    const middle = evaluate({ nasalCouplingArea: 1.25 });
    expect(Number(middle.nasalSecondZeroBound)).toBeGreaterThan(1000);
    expect(Number(middle.nasalSecondZeroBound)).toBeLessThan(1803);
  });

  it.each([
    ["man", "M", 200, 1120, 1360, 2100, 160],
    ["nine", "N", 250, 850, 1550, 2025, 180],
    ["sing", "NG", 350, 1200, 2030, 2540, 200],
  ] as const)(
    "carries Recasens Table II murmur targets through %s",
    (word, phone, f1, f2, f3, f4, b1) => {
      const { track } = textToKlattTrackDetailed(word);
      const frames = track.filter((frame) => frame.phoneme === phone);
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.some((frame) => frame.params.nasalCouplingArea === 2.5)).toBe(true);
      // At least one steady target frame must survive boundary transitions.
      expect(frames.map(({ params: p }) => [p.F1, p.F2, p.F3, p.F4, p.B1])).toContainEqual([
        f1,
        f2,
        f3,
        f4,
        b1,
      ]);
    },
  );
});
