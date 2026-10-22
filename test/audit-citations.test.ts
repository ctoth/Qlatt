import { describe, expect, it } from "vitest";
import { auditDocument } from "../scripts/audit-citations";
import { parseYamlString } from "../src/yaml-loader";

describe("authored citation audit", () => {
  it("separates templates, raw constants and malformed metadata without expansion", () => {
    const file = "public/experiments/example/semantics.yaml";
    const document = parseYamlString(
      `
params:
  F0: { default: 100 }
constants:
  number: 1
  mapping: { citations: [literal CEL data] }
realize:
  string: F0
  cited: { expr: F0, citations: [engineering estimate] }
  empty: { expr: F0, citations: [] }
  blank: { expr: F0, citations: [' '] }
  wrong: { expr: F0, citations: source }
realize_each:
  - index: i
    over: [1, 2, 3]
    rules:
      'F{i}': { expr: F0, citations: [source] }
`,
      file,
    );
    const entries = auditDocument(file, document);
    expect(entries.map((entry) => [entry.path, entry.status])).toEqual([
      [["realize", "string"], "no-slot"],
      [["realize", "cited"], "present"],
      [["realize", "empty"], "invalid"],
      [["realize", "blank"], "invalid"],
      [["realize", "wrong"], "invalid"],
      [["params", "F0"], "no-slot"],
      [["constants", "number"], "no-slot"],
      [["constants", "mapping"], "no-slot"],
      [["realize_each", 0, "rules", "F{i}"], "present"],
    ]);
    expect(entries.every((entry) => entry.file === file)).toBe(true);
  });

  it.each([
    ["public/rules/example.yaml", "rules", { citations: ["source"] }, "present"],
    ["public/rules/example.yaml", "rules", { kind: "scalar" }, "absent"],
    ["public/experiments/x/registry.yaml", "primitives", { native: "GainNode" }, "no-slot"],
    ["public/experiments/x/graph.yaml", "nodes", { type: "gain" }, "no-slot"],
  ] as const)("counts authored %s entries", (file, category, value, status) => {
    expect(auditDocument(file, { [category]: { example: value } })).toEqual([
      { file, path: [category, "example"], category, status },
    ]);
  });
});
