import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type HrgSchema, Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  loadInventorySpecFromPath,
  materializePhonemeTarget,
} from "../src/declarative-frontend/inventory";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const inventory = loadInventorySpecFromPath("/rules/frontends/qlatt-english/inventory.yaml");
const citation = "Allen et al. 1987 Table 9-1";
const model = (minimum: number) => ({
  minimum_ms: minimum,
  inherent_ms: 120,
  unstressed_scale: 0.5,
  source: "fixture",
  citations: [citation],
});
const schema = {
  itemTypes: {
    segment: {
      features: {
        type: { kind: "string" },
        duration: { kind: "number" },
        inherentDuration: { kind: "number" },
        durationFloor: { kind: "number" },
        stress: { kind: "number" },
        duration_model: {
          kind: "object",
          fields: {
            minimum_ms: { kind: "number" },
            inherent_ms: { kind: "number" },
            unstressed_scale: { kind: "number" },
            source: { kind: "string" },
            citations: { kind: "array", items: { kind: "string" } },
          },
        },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

function resolve(minimum: number, stress = 1, override?: number, allocated = 120, reject = false) {
  const utterance = new Utterance(schema);
  const item = utterance.createItem("segment", "vowel");
  const stamp = { reason: "inventory fixture", citations: [citation] };
  for (const [key, value] of Object.entries({
    type: "vowel",
    duration: allocated,
    inherentDuration: 120,
    stress,
    duration_model: model(minimum),
  }))
    item.set(key, value, stamp);
  if (override !== undefined) item.set("durationFloor", override, stamp);
  utterance.relation("Segment").append(item, stamp);
  const phase = loadYamlDocumentSync<{ rules: Record<string, unknown> }>(
    "/rules/frontends/qlatt-english/phases/duration.yaml",
  );
  const shorten = {
    kind: "scalar",
    select: { relation: "Segment", where: "true" },
    apply: [
      { field: "duration", op: "mul", value: "0.5", tag: "stress" },
      ...(reject ? [{ field: "duration", op: "set", value: "'invalid'", tag: "stress" }] : []),
    ],
    citations: [citation],
  };
  const spec = compileRuleEngineSpec({
    relations: {
      Segment: {
        type: "base",
        features: {
          type: [],
          inherentDuration: [],
          stress: [],
          duration_model: [],
          durationFloor: [],
        },
        scalars: { duration: { unit: "ms", resolution: "klatt", floor_field: "durationFloor" } },
      },
    },
    rules: { floor: phase.rules.duration_floor_from_inventory, first: shorten, second: shorten },
    phases: [
      { name: "duration", rules: ["floor", "first", "second"], resolve_scalars: ["duration"] },
    ],
  });
  if (reject) expect(() => runGraphRuleEngine(utterance, spec)).toThrow();
  else runGraphRuleEngine(utterance, spec);
  return { item, utterance };
}

describe("per-phone incompressibility", () => {
  it("materializes the selected MITalk row, including secondary-stress fallback and aliases", () => {
    for (const stress of [0, 1, 2]) {
      expect(
        materializePhonemeTarget("IH", { stress, inventorySpec: inventory }).duration_model,
      ).toMatchObject({ minimum_ms: 40, inherent_ms: 135, unstressed_scale: 0.5 });
    }
    expect(materializePhonemeTarget("AX", { inventorySpec: inventory }).duration_model).toEqual(
      materializePhonemeTarget("SIL", { inventorySpec: inventory }).duration_model,
    );
    for (const target of Object.values(inventory.phoneme_targets)) {
      expect(target.duration_model).toBeDefined();
    }
  });

  it("uses different floors for two phones of the same class through stacked shortening", () => {
    const low = resolve(30).item;
    const high = resolve(90).item;
    expect(low.get("durationFloor")).toBe(30);
    expect(low.get("duration")).toBe(53);
    expect(high.get("durationFloor")).toBe(90);
    expect(high.get("duration")).toBe(98);
    expect(low.latestWrite("duration")?.parents).toContain(
      low.latestWrite("durationFloor")?.decisionId,
    );
    expect(low.latestWrite("durationFloor")?.parents).toContain(
      low.latestWrite("duration_model")?.decisionId,
    );
  });

  it("halves the floor once for unstressed segments and bounds it to component allocation", () => {
    expect(resolve(30, 0).item.get("durationFloor")).toBe(15);
    expect(resolve(30, 2).item.get("durationFloor")).toBe(30);
    expect(resolve(90, 1, undefined, 40).item.get("durationFloor")).toBe(30);
  });

  it.each([0, 12])("preserves explicit floor %s", (floor) => {
    expect(resolve(90, 0, floor).item.get("durationFloor")).toBe(floor);
  });

  it("diagnoses actual Klatt clamping with the effective floor", () => {
    const { utterance } = resolve(90, 1, 130);
    expect(utterance.diagnostics.getEntries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "W_DURATION_CLAMP",
          data: expect.objectContaining({ floor: 130 }),
        }),
      ]),
    );
  });

  it("does not report a clamp from a rejected atomic rule", () => {
    const { item, utterance } = resolve(90, 1, 130, 120, true);
    expect(item.get("duration")).toBe(120);
    expect(
      utterance.diagnostics.getEntries().filter((entry) => entry.code === "W_DURATION_CLAMP"),
    ).toEqual([]);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 121])(
    "rejects invalid declared minimum %s",
    (minimum) => {
      const custom = {
        ...inventory,
        phoneme_targets: {
          ...inventory.phoneme_targets,
          IH1: { ...inventory.phoneme_targets.IH1, duration_model: model(minimum) },
        },
      };
      expect(() => materializePhonemeTarget("IH1", { inventorySpec: custom })).toThrow(
        /E_INVENTORY_DURATION/,
      );
    },
  );

  it.each([
    { rows: {} },
    { rows: { vowel: { minimum_ms: 30, inherent_ms: 120, targets: ["missing"] } } },
    { rows: { vowel: { minimum_ms: 30, inherent_ms: 120, targets: ["SIL", "SIL"] } } },
    { rows: { vowel: { minimum_ms: 30, inherent_ms: 120, targets: ["SIL"], citations: "bad" } } },
    { unstressed_scale: 2 },
    { citations: [] },
  ])("rejects invalid or incomplete duration table %j at loading", (patch) => {
    const directory = mkdtempSync(join(tmpdir(), "qlatt-duration-model-"));
    const path = join(directory, "inventory.yaml");
    try {
      writeFileSync(
        path,
        JSON.stringify({
          ...inventory,
          base_params: { F0: 0 },
          phoneme_targets: { SIL: { dur: 30, type: "silence" } },
          duration_models: {
            unstressed_scale: 0.5,
            citations: [citation],
            rows: { vowel: { minimum_ms: 30, inherent_ms: 120, targets: ["SIL"] } },
            ...patch,
          },
        }),
      );
      expect(() => loadInventorySpecFromPath(path)).toThrow(/E_INVENTORY_DURATION/);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  it("carries floor data through closures, affricates, diphthongs and rhotics", () => {
    const { utterance } = textToKlattTrackDetailed("Buy cheap paper for her.", 110);
    const segments = utterance
      .relation("Segment")
      .listItems()
      .filter((s) => s.get("active") !== false);
    expect(segments.some((s) => s.id.includes("expand_diphthongs"))).toBe(true);
    expect(segments.some((s) => s.id.includes("expand_affricates"))).toBe(true);
    expect(segments.some((s) => s.id.includes("expand_rhotic"))).toBe(true);
    for (const segment of segments) {
      expect(segment.get("duration_model")).toBeDefined();
      expect(segment.get("durationFloor")).toBeTypeOf("number");
      const floorWrite = segment.latestWrite("durationFloor");
      if (floorWrite?.ruleId === "duration_floor_from_inventory") {
        const source = segment.get("duration_model") as ReturnType<typeof model>;
        const allocation = segment
          .writes("duration")
          .find((write) => floorWrite.parents.includes(write.decisionId));
        expect(allocation).toBeDefined();
        const allocated = Number(allocation?.value);
        const inherent = Number(segment.get("inherentDuration"));
        const stressScale = segment.get("stress") === 0 ? source.unstressed_scale : 1;
        expect(segment.get("durationFloor")).toBeCloseTo(
          ((Math.min(allocated, inherent) * source.minimum_ms) / source.inherent_ms) * stressScale,
          8,
        );
        expect(floorWrite.parents).toContain(segment.latestWrite("duration_model")?.decisionId);
      }
      if (["stop_release", "stop_aspiration"].includes(String(segment.get("type")))) {
        expect(segment.get("durationFloor")).toBe(0);
      }
    }
  });
});
