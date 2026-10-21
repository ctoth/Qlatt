/**
 * Which rules of the text parser table the recorded texts exercise. The
 * clause-equality test (test/dectalk-text-parser.test.ts) says the port and
 * DECtalk agree on the texts; this says which rules those texts reach. Every
 * live rule (scripts/oracle/text-parser-port.ts liveRules) must hit at least
 * once over the fixtures, or be listed here by number with the reason it does
 * not, so that the list cannot change unnoticed. The reasons that are facts
 * about the table are checked against the table below.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { firedRules, liveRules } from "../scripts/oracle/text-parser-port";
import { listRule } from "../src/text-parser/disassemble";
import type { TextParserRule, TextParserTable } from "../src/text-parser/interpreter";

const table = JSON.parse(
  readFileSync("public/rules/frontends/dectalk-english/text-parser-table.json", "utf8"),
) as TextParserTable;

/** The Spanish telephone rules: reached only from rules of the Spanish language masks. */
const SPANISH_TELEPHONE = [520, 522, 524, 526, 532, 547, 540, 530];

/** Live rules that no recorded text makes hit, each with why. */
const NEVER_FIRES: Readonly<Record<number, string>> = {
  5199: "needs the index byte 0x83 in its input, which only an in-text index command puts there; index marks are not ported",
  230: "its case (a word the dictionary lacks with a clause mark inside it) is taken in the punctuation pass by R60, which puts spaces round the mark; measured on 'Say yes,no then.'",
  8020: "reached only as the hit target of R388, which has just put spaces round the first slash, so no letters stand directly before a slash where R8020 starts; in 'It is a/b/c here.' the later slash goes to R3887",
  ...Object.fromEntries(
    SPANISH_TELEPHONE.map((number) => [
      number,
      "a telephone rule reached only from rules of the Spanish language masks (0x48), never for US English",
    ]),
  ),
};

const live = liveRules();
const fired = firedRules();
const byNumber = (number: number): TextParserRule =>
  table.rules.find((rule) => rule.number === number) as TextParserRule;
const elementsOf = (rule: TextParserRule): string[] =>
  listRule(table, rule).map((element) => element.text);
/** Does a rule's body write or read this byte as a literal? */
const usesByte = (rule: TextParserRule, byte: string): boolean =>
  elementsOf(rule).some(
    (text) =>
      text === `HEXADECIMAL 0x${byte}` || (text.startsWith("EXACT") && text.includes(`\\x${byte}`)),
  );

describe("text parser rule coverage", () => {
  it("counts the live rules", () => {
    expect(live.length).toBe(119);
  });

  it("every live rule fires in the fixtures or is listed with its reason", () => {
    const never = live
      .filter((rule) => !fired.has(rule.number as number))
      .map((rule) => rule.number as number)
      .sort((a, b) => a - b);
    expect(never).toEqual(
      Object.keys(NEVER_FIRES)
        .map(Number)
        .sort((a, b) => a - b),
    );
    expect(live.length - never.length).toBe(108);
  });

  it("the Spanish telephone rules are named only by Spanish rules or by each other", () => {
    const callers = (target: TextParserRule): TextParserRule[] =>
      table.rules.filter(
        (rule) =>
          rule.kind === "rule" &&
          rule.index !== target.index &&
          [rule.hit, rule.miss, rule.callHit, rule.callMiss, rule.copyHit].includes(target.index),
      );
    for (const number of SPANISH_TELEPHONE) {
      const rule = byNumber(number);
      // Not reached in sequence from outside: a stop entry, or another rule
      // of the group, stands before each.
      const before = table.rules[rule.index - 1] as TextParserRule;
      expect(
        before.kind === "stop" || SPANISH_TELEPHONE.includes(before.number as number),
        `entry before R${number}`,
      ).toBe(true);
      for (const caller of callers(rule)) {
        const spanishOnly = ((caller.language as number) & 0x01) === 0;
        const ofTheGroup = SPANISH_TELEPHONE.includes(caller.number as number);
        expect(spanishOnly || ofTheGroup, `R${caller.number} names R${number}`).toBe(true);
      }
    }
  });

  it("byte 0x86 is written and read by the Spanish telephone rules alone", () => {
    const users = table.rules
      .filter((rule) => rule.kind === "rule" && usesByte(rule, "86"))
      .map((rule) => ({
        number: rule.number,
        usEnglish: ((rule.language as number) & 0x01) !== 0,
      }));
    expect(users.length).toBeGreaterThan(0);
    for (const user of users) {
      expect(
        !user.usEnglish || SPANISH_TELEPHONE.includes(user.number as number),
        `R${user.number} uses 0x86`,
      ).toBe(true);
    }
  });

  it("R5199 needs the index byte", () => {
    expect(usesByte(byNumber(5199), "83")).toBe(true);
  });
});
