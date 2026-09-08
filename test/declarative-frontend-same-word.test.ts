import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../src/declarative-frontend/cel-expressions";
import { loadRulepackSpecFromPath } from "../src/declarative-frontend/rule-pack";

const root = "public/rules/frontends/dectalk-english";
const citation =
  "Qlatt #133 engineering convention: same word requires both word fields to be present and equal";
const states = [null, {}, { word: null }, { word: "" }, { word: "one" }, { word: "two" }];

describe("bundled DECtalk same-word callers", () => {
  const spec = loadRulepackSpecFromPath("/rules/frontends/dectalk-english/frontend.yaml");
  const callers: { rule: string; name: string; expression: string; arg: string }[] = [];
  for (const phase of ["duration", "postlexical", "structural"]) {
    const doc = load(readFileSync(`${root}/phases/${phase}.yaml`, "utf8")) as {
      rules: Record<string, { define?: Record<string, string> }>;
    };
    for (const [rule, body] of Object.entries(doc.rules)) {
      for (const [name, expression] of Object.entries(body.define ?? {})) {
        const match = expression.match(/dectalk_same_word\((\w+), current\)/);
        if (match) callers.push({ rule, name, expression, arg: match[1] });
      }
    }
  }

  it("deduplicates all nine equivalent conditions and retains macro citations", () => {
    expect(callers).toHaveLength(9);
    for (const { rule } of callers) expect(spec.rules[rule].citations).toContain(citation);
  });

  it("preserves the original caller expressions over every word-presence pairing", () => {
    expect(callers.length).toBeGreaterThan(0);
    for (const { rule, name, expression, arg } of callers) {
      const legacyEquality =
        name === "same_word"
          ? `has(${arg}.word) && has(current.word) && ${arg}.word == current.word`
          : `(has(${arg}.word) && has(current.word) ? ${arg}.word == current.word : false)`;
      const legacy = expression.replace(`dectalk_same_word(${arg}, current)`, legacyEquality);
      const definitions = spec.rules[rule].define as Record<string, string>;
      const compiled = definitions[name];
      expect(typeof compiled).toBe("string");
      for (const left of states) {
        for (const current of states) {
          const context = { [arg]: left === null ? null : { ...left, phoneme: "S" }, current };
          const expected =
            left !== null &&
            current !== null &&
            "word" in left &&
            "word" in current &&
            left.word === current.word;
          expect(evaluateExpression(legacy, context)).toBe(expected);
          expect(evaluateExpression(String(compiled), context)).toBe(expected);
        }
      }
    }
  });

  it("propagates the macro and its citations through an inherited DECtalk rulepack", () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-same-word-"));
    try {
      const path = join(dir, "frontend.yaml");
      writeFileSync(path, "extends: dectalk-english\n");
      const inherited = loadRulepackSpecFromPath(path.replace(/\\/g, "/"));
      expect(inherited.functions).toHaveProperty("dectalk_same_word");
      for (const { rule } of callers) {
        expect(inherited.rules[rule]).toEqual(spec.rules[rule]);
        expect(inherited.rules[rule].citations).toContain(citation);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps Qlatt named predicates intact through beauty inheritance", () => {
    for (const frontend of ["qlatt-english", "qlatt-beauty"]) {
      const inherited = loadRulepackSpecFromPath(`/rules/frontends/${frontend}/frontend.yaml`);
      expect(inherited.predicates?.prev_same_word).toBe(
        "has(prev.word) && has(current.word) && prev.word == current.word",
      );
      expect(inherited.functions).not.toHaveProperty("dectalk_same_word");
    }
  });
});
