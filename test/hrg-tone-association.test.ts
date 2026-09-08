import { describe, expect, it } from "vitest";
import { type HrgSchema, replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    unit: { features: { active: { kind: "boolean" } } },
    tone: {
      features: {
        symbol: { kind: "string" },
        role: { kind: "string" },
        starred: { kind: "boolean" },
        domain: { kind: "string" },
        index: { kind: "number" },
      },
    },
  },
  relations: {
    Unit: { kind: "list", itemTypes: ["unit"] },
    Tone: { kind: "list", itemTypes: ["tone"] },
  },
} as const satisfies HrgSchema;

function fixture(count: number) {
  const utterance = new Utterance(SCHEMA);
  const tx = utterance.beginTransaction({
    ruleId: "input",
    phase: "input",
    tag: "input",
    reason: "Ordered units",
    citations: ["Goldsmith 1976"],
  });
  const units = [];
  for (let i = 0; i < count; i++) {
    const unit = tx.createItem("unit", `s${i}`);
    tx.set(unit, "active", true);
    tx.append("Unit", unit);
    units.push(unit);
  }
  for (const unit of units) tx.associate("domain", units[0], unit);
  tx.commit();
  return utterance;
}

function spec(
  symbols: string[],
  anchors: { tone: number; unit: number }[] = [],
  mode = "left_to_right",
  units = "assoc(current, 'domain')",
) {
  return compileRuleEngineSpec({
    relations: {
      Unit: { type: "base", features: { active: [] } },
      Tone: {
        type: "parallel",
        features: { symbol: [], role: [], starred: [], domain: [], index: [] },
      },
    },
    rules: {
      association: {
        kind: "structural",
        select: { relation: "Unit", where: "current.id == 's0'" },
        associate_tones: {
          relation: "Tone",
          domain: "current.id",
          units,
          tones: JSON.stringify(
            symbols.map((symbol) => ({
              symbol: symbol.replace("*", ""),
              starred: symbol.includes("*"),
              role: "test",
            })),
          ),
          anchors: JSON.stringify(anchors),
          mode,
          association: "bearer",
          source_association: "tones",
          tag: "tone_association",
        },
        citations: ["Goldsmith 1976 Chapter 3"],
      },
    },
    phases: [{ name: "association", rules: ["association"] }],
  });
}

function links(utterance: Utterance) {
  return utterance
    .relation("Tone")
    .listItems()
    .map((tone) => [
      tone.get("symbol"),
      utterance.associatedItems(tone, "bearer").map((unit) => unit.id),
    ]);
}

describe("declared Goldsmith tone association", () => {
  it.each([
    [
      2,
      ["H", "L"],
      [
        ["H", ["s0"]],
        ["L", ["s1"]],
      ],
    ],
    [
      4,
      ["H", "L"],
      [
        ["H", ["s0"]],
        ["L", ["s1", "s2", "s3"]],
      ],
    ],
    [
      1,
      ["L", "H", "L"],
      [
        ["L", ["s0"]],
        ["H", ["s0"]],
        ["L", ["s0"]],
      ],
    ],
  ] as const)("maps %i units with %j", (count, symbols, expected) => {
    const utterance = fixture(count);
    runGraphRuleEngine(utterance, spec([...symbols]));
    expect(links(utterance)).toEqual(expected);
    expect(replayJournal(SCHEMA, utterance.journal()).graphDigest()).toBe(utterance.graphDigest());
  });

  it("anchors the star first and maps pre/post tones without crossing it", () => {
    const utterance = fixture(5);
    runGraphRuleEngine(utterance, spec(["L", "H*", "L"], [{ tone: 1, unit: 2 }], "anchored"));
    expect(links(utterance)).toEqual([
      ["L", ["s0", "s1"]],
      ["H", ["s2"]],
      ["L", ["s3", "s4"]],
    ]);
  });

  it("rejects conflicting anchors without changing any graph state", () => {
    const utterance = fixture(3);
    const before = utterance.graphDigest();
    const journal = utterance.journal().length;
    expect(() =>
      runGraphRuleEngine(
        utterance,
        spec(
          ["H*", "L*"],
          [
            { tone: 0, unit: 2 },
            { tone: 1, unit: 0 },
          ],
          "anchored",
        ),
      ),
    ).toThrow(/E_TONE_CROSSING.*s0/);
    expect(utterance.graphDigest()).toBe(before);
    expect(utterance.journal()).toHaveLength(journal);
    expect(
      utterance.diagnostics.getEntries().some((entry) => entry.code === "E_TONE_CROSSING"),
    ).toBe(true);
  });

  it("rejects a missing starred anchor and a nonempty melody without units", () => {
    for (const compiled of [spec(["H*"], [], "anchored"), spec(["H"], [], "left_to_right", "[]")]) {
      const utterance = fixture(1);
      const before = utterance.graphDigest();
      expect(() => runGraphRuleEngine(utterance, compiled)).toThrow(/E_TONE_/);
      expect(utterance.graphDigest()).toBe(before);
    }
  });

  it("accepts an empty melody only with an empty domain", () => {
    const utterance = fixture(1);
    runGraphRuleEngine(utterance, spec([], [], "left_to_right", "[]"));
    expect(links(utterance)).toEqual([]);
    expect(() => runGraphRuleEngine(fixture(1), spec([]))).toThrow(/E_TONE_EMPTY/);
  });

  it("keeps multiple starred anchors fixed while mapping their intervening gap", () => {
    const utterance = fixture(7);
    runGraphRuleEngine(
      utterance,
      spec(
        ["H*", "L", "H*"],
        [
          { tone: 0, unit: 1 },
          { tone: 2, unit: 5 },
        ],
        "anchored",
      ),
    );
    expect(links(utterance)).toEqual([
      ["H", ["s0", "s1"]],
      ["L", ["s2", "s3", "s4"]],
      ["H", ["s5", "s6"]],
    ]);
  });

  it("rejects duplicate, null and unknown bearers before mutation", () => {
    for (const expression of ["[current, current]", "[null]", "[{'id': 'unknown'}]"]) {
      const utterance = fixture(1);
      const before = utterance.graphDigest();
      expect(() =>
        runGraphRuleEngine(utterance, spec(["H"], [], "left_to_right", expression)),
      ).toThrow(/E_TONE_UNIT/);
      expect(utterance.graphDigest()).toBe(before);
    }
  });

  it("rejects an inactive bearer before mutation", () => {
    const utterance = fixture(2);
    const tx = utterance.beginTransaction({
      ruleId: "suppress",
      phase: "input",
      tag: "input",
      reason: "Suppress unit",
      citations: ["Goldsmith 1976"],
    });
    tx.set(utterance.getItem("s1")!, "active", false);
    tx.commit();
    const before = utterance.graphDigest();
    // assoc() already filters inactive units; pass one explicitly to exercise
    // the action's validation independently of navigation filtering.
    expect(() =>
      runGraphRuleEngine(utterance, spec(["H"], [], "left_to_right", "[{'id': 's1'}]")),
    ).toThrow(/E_TONE_UNIT/);
    expect(utterance.graphDigest()).toBe(before);
  });

  it.each([
    "bad",
    {},
    { association: "tones", role: "star" },
    { association: "tones", role: "star", bearer: "bearer", typo: "x" },
  ])("validates the complete point tone selector at load: %j", (tone) => {
    expect(() =>
      compileRuleEngineSpec({
        relations: { Unit: { type: "base" }, Point: { type: "point", value_type: "number" } },
        rules: {
          bad: {
            kind: "point",
            select: { relation: "Unit", where: "true" },
            insert_point: {
              relation: "Point",
              at: "midpoint(current)",
              value: "100",
              tag: "test",
              tone,
            },
            citations: ["Goldsmith 1976"],
          },
        },
        phases: [{ name: "test", rules: ["bad"] }],
      }),
    ).toThrow(/E_TONE_SCHEMA/);
  });
});
