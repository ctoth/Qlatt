import { writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  evaluateLexicalStress,
  evaluationWords,
  renderLexicalStressEvaluation,
} from "../scripts/evaluate-lexical-stress";

it("evaluates every frozen word with dictionary bypass and keeps all outcomes", () => {
  const rows = evaluateLexicalStress();
  expect(rows.map((row) => row.word)).toEqual(Object.values(evaluationWords).flat());
  expect(
    rows.every(
      (row) =>
        row.gold.length > 0 && row.reference.pattern.includes("1") && row.oov.pattern.includes("1"),
    ),
  ).toBe(true);
  if (process.env.QLATT_STRESS_REPORT === "1") {
    writeFileSync("docs/lexical-stress-evaluation.md", renderLexicalStressEvaluation(rows));
  }
});
