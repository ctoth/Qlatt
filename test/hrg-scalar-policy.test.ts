import { describe, expect, it } from "vitest";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  QLATT_ENGLISH_RULEPACK,
} from "../src/declarative-frontend/rule-pack";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const fallback = loadYamlDocumentSync<{
  relations: {
    Segment: { scalars: { duration: { floor_fallback: { value: string; citations: string[] } } } };
  };
}>("/rules/frontends/qlatt-english/pipeline.yaml").relations.Segment.scalars.duration
  .floor_fallback;
const source = { reason: "controlled scalar fixture", citations: ["Klatt 1976 Eq.1"] };

function fixture(type = "vowel", floor?: number) {
  const utterance = new Utterance({
    itemTypes: {
      segment: {
        features: {
          type: { kind: "string" },
          inherentDuration: { kind: "number" },
          duration: { kind: "number" },
          durationFloor: { kind: "number" },
          energy: { kind: "number" },
          energyFloor: { kind: "number" },
        },
      },
    },
    relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
  });
  const item = utterance.createItem("segment", "sample");
  for (const [key, value] of Object.entries({
    type,
    inherentDuration: 100,
    duration: 100,
    energy: 100,
    energyFloor: 20,
  })) {
    item.set(key, value, source);
  }
  if (floor !== undefined) item.set("durationFloor", floor, source);
  utterance.segments.append(item, source);
  return { utterance, item };
}

function spec(
  options: {
    fallback?: boolean;
    reject?: boolean;
    field?: string;
    floorField?: string;
    fallbackSpec?: unknown;
  } = {},
) {
  const field = options.field ?? "duration";
  return compileRuleEngineSpec({
    parameters: { ...QLATT_ENGLISH_RULEPACK.parameters, scale: 0.5 },
    relations: {
      Segment: {
        type: "base",
        features: {
          type: ["vowel", "stop"],
          inherentDuration: [],
          durationFloor: [],
          energyFloor: [],
        },
        scalars: {
          [field]: {
            unit: "ms",
            resolution: "klatt",
            floor_field: options.floorField ?? "durationFloor",
            ...(options.fallback === false
              ? {}
              : { floor_fallback: options.fallbackSpec ?? fallback }),
          },
        },
      },
    },
    rules: {
      scale: {
        kind: "scalar",
        select: { relation: "Segment", where: "true" },
        apply: [
          { field, op: "mul", value: "params.scale", tag: "fixture" },
          ...(options.reject ? [{ field, op: "set", value: "'invalid'", tag: "fixture" }] : []),
        ],
        citations: source.citations,
      },
    },
    phases: [{ name: "duration", rules: ["scale"] }],
  });
}

describe("declared scalar floors", () => {
  it.each([
    ["vowel", 30, 65],
    ["stop", 40, 70],
  ])("uses cited CEL policy for %s", (type, floor, duration) => {
    const { utterance, item } = fixture(type);
    runGraphRuleEngine(utterance, spec(), {
      parameters: {
        policy: {
          duration: {
            incompressibility_ratio_vowel: 0.3,
            incompressibility_ratio_consonant: 0.4,
          },
        },
      },
    });
    expect(item.get("durationFloor")).toBeUndefined();
    expect(item.get("duration")).toBe(duration);
    expect(utterance.diagnostics.getEntries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "W_DURATION_FLOOR_FALLBACK",
          data: expect.objectContaining({
            requested: 0.5,
            applied: duration,
            floor,
            field: "duration",
          }),
        }),
      ]),
    );
    const write = item.latestWrite("duration");
    expect(write?.citations).toContain("Klatt 1976 Eq.1 (incompressible portion)");
    expect(write?.parents).toContain(item.latestWrite("inherentDuration")?.decisionId);
    expect(utterance.journal()[0].metadata.citations).toContain(
      "Klatt 1976 Eq.1 (incompressible portion)",
    );
  });

  it.each([0, 20, 80])(
    "preserves per-phone floor %s without consulting missing policy",
    (floor) => {
      const { utterance, item } = fixture("vowel", floor);
      runGraphRuleEngine(utterance, spec(), { parameters: { policy: null } });
      expect(item.get("durationFloor")).toBe(floor);
      expect(item.get("duration")).toBe((100 - floor) * 0.5 + floor);
      expect(utterance.diagnostics.getEntries()).toEqual([]);
      expect(item.latestWrite("duration")?.parents).toContain(
        item.latestWrite("durationFloor")?.decisionId,
      );
      expect(item.latestWrite("duration")?.citations).not.toContain(
        "Klatt 1976 Eq.1 (incompressible portion)",
      );
    },
  );

  it("rejects missing policy rather than silently inventing a floor", () => {
    const { utterance, item } = fixture();
    expect(() => runGraphRuleEngine(utterance, spec(), { parameters: { policy: null } })).toThrow();
    expect(item.get("durationFloor")).toBeUndefined();
    expect(item.get("duration")).toBe(100);
    expect(
      utterance.diagnostics
        .getEntries()
        .some((entry) => entry.code === "W_DURATION_FLOOR_FALLBACK"),
    ).toBe(false);
  });

  it("requires a declared floor to be established before resolution", () => {
    const { utterance } = fixture();
    expect(() => runGraphRuleEngine(utterance, spec({ fallback: false }))).toThrow(
      "E_SCALAR_FLOOR_REQUIRED",
    );
  });

  it("uses another scalar and its declared floor field", () => {
    const { utterance, item } = fixture();
    runGraphRuleEngine(
      utterance,
      spec({ fallback: false, field: "energy", floorField: "energyFloor" }),
    );
    expect(item.get("energy")).toBe(60);
    expect(item.get("duration")).toBe(100);
  });

  it("does not emit fallback observations for rejected atomic writes", () => {
    const { utterance, item } = fixture();
    expect(() => runGraphRuleEngine(utterance, spec({ reject: true }))).toThrow();
    expect(item.get("durationFloor")).toBeUndefined();
    expect(
      utterance.diagnostics
        .getEntries()
        .some((entry) => entry.code === "W_DURATION_FLOOR_FALLBACK"),
    ).toBe(false);
  });

  it("rejects an undeclared floor field", () => {
    expect(() => spec({ floorField: "typoFloor" })).toThrow(/typoFloor/);
  });

  it.each([
    { ...fallback, value: "current.typo" },
    { ...fallback, value: "params.policy.duration.typo" },
    { ...fallback, value: "current.R:Missing.parent.duration" },
    { ...fallback, value: "unknownFunction(current.duration)" },
    { ...fallback, citations: [] },
  ])("validates the scalar fallback %j", (fallbackSpec) => {
    expect(() => spec({ fallbackSpec })).toThrow(/E_/);
  });

  it("applies a configured fallback to an unrelated scalar", () => {
    const { utterance, item } = fixture();
    runGraphRuleEngine(
      utterance,
      spec({
        field: "energy",
        fallbackSpec: {
          value: "current.energyFloor",
          citations: ["Engineering estimate: energy floor fixture"],
        },
      }),
    );
    expect(item.get("energy")).toBe(60);
    expect(utterance.diagnostics.getEntries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "W_SCALAR_FLOOR_FALLBACK",
          data: expect.objectContaining({ floor: 20, requested: 0.5, applied: 60 }),
        }),
      ]),
    );
  });

  it("evaluates fallback features on the effect target in a pattern", () => {
    const { utterance, item } = fixture("stop");
    const vowel = utterance.createItem("segment", "vowel");
    for (const [key, value] of Object.entries({
      type: "vowel",
      inherentDuration: 200,
      duration: 200,
    })) {
      vowel.set(key, value, source);
    }
    utterance.segments.append(vowel, source);
    const base = spec();
    const targeted = compileRuleEngineSpec({
      ...base,
      patterns: {
        cv: {
          relation: "Segment",
          sequence: [
            { capture: "c", where: "current.type == 'stop'" },
            { capture: "v", where: "current.type == 'vowel'" },
          ],
        },
      },
      rules: {
        scale: {
          match: "cv",
          apply: [
            { target: "v", field: "duration", op: "mul", value: "params.scale", tag: "fixture" },
          ],
          citations: source.citations,
        },
      },
    });
    runGraphRuleEngine(utterance, targeted);
    expect(item.get("duration")).toBe(100);
    expect(vowel.get("duration")).toBe(142);
  });
});
