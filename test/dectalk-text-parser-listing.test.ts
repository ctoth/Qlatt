/**
 * The text parser table's compiled rules can be read: the listing
 * (src/text-parser/disassemble.ts, printed by
 * scripts/disassemble-text-parser.ts) accounts for every byte of every rule's
 * body exactly once, with a name for each element. An element code the
 * interpreter does not know cannot hide in the table.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listRule, unlistedBytes } from "../src/text-parser/disassemble";
import type { TextParserTable } from "../src/text-parser/interpreter";

const table = JSON.parse(
  readFileSync("public/rules/frontends/dectalk-english/text-parser-table.json", "utf8"),
) as TextParserTable;
const rules = table.rules.filter((rule) => rule.kind === "rule");

describe("text parser table listing", () => {
  it("has the rules to list, each with its line and text in the rule source", () => {
    expect(rules.length).toBe(210);
    expect(rules.filter((rule) => rule.line === undefined || !rule.text)).toEqual([]);
    // The text on the line is the rule of that number.
    expect(
      rules.filter((rule) => !new RegExp(`R${rule.number}(?![0-9])`).test(rule.text ?? "")),
    ).toEqual([]);
  });

  it("accounts for every byte of every body exactly once", () => {
    const wrong = rules.flatMap((rule) => {
      const bytes = unlistedBytes(rule, listRule(table, rule));
      return bytes.length > 0 ? [{ rule: rule.number, bytes }] : [];
    });
    expect(wrong).toEqual([]);
  });

  it("names every element", () => {
    const unnamed = rules.flatMap((rule) =>
      listRule(table, rule)
        .filter((element) => /undefined|0x1C/.test(element.text))
        .map((element) => ({ rule: rule.number, offset: element.offset, text: element.text })),
    );
    expect(unnamed).toEqual([]);
  });

  it("reads a rule as its source text says", () => {
    // 0xFFFFFFFF-0x00000032:R60;H53;M63;DM,W~<*>b/a/Ex<1>/' '//' '/W~<+>
    const rule = rules.find((candidate) => candidate.number === 60);
    expect(rule?.text).toContain("R60;H53;M63;DM,W~<*>b/a/Ex<1>/' '//' '/W~<+>");
    const lines = listRule(table, rule as (typeof rules)[number]).map(
      (element) => `${"  ".repeat(element.depth)}${element.text}`,
    );
    expect(lines).toEqual([
      "WHITESPACE <0-any> (not; no look-ahead to it; look ahead to 26)",
      "INSERT (before)",
      "  INSERT (after)",
      "    CLAUSE <1> (no look-ahead from it)",
      "    with:",
      "      EXACT ' '",
      "  with:",
      "    EXACT ' '",
      "WHITESPACE <1-any> (not; no look-ahead from it)",
      "END_OF_RULE",
    ]);
  });
});
