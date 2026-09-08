import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Utterance } from "../src/declarative-frontend/hrg";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import {
  NORMALIZATION_SCHEMA,
  normalizeSourceItems,
  recognizeText,
} from "../src/declarative-frontend/source-recognition";
import { parseYamlString } from "../src/yaml-loader";

function read(value: string, kind = "cardinal", hundreds = "hundred") {
  const component = parseYamlString(
    readFileSync("public/rules/normalization/numbers.yaml", "utf8"),
    "number component",
  ) as Record<string, unknown>;
  const spec = compileRuleEngineSpec({
    ...component,
    normalization: {
      phases: [
        "normalization_number_requests",
        "normalization_number_groups",
        "normalization_terminal_words",
      ],
    },
    transcription: { punctuation_tokens: ["."] },
    text_recognition: {
      rules: [
        {
          id: "number",
          pattern: "(?<value>.+)",
          flags: "u",
          class: kind,
          captures: { value: "value" },
          when: "true",
          speak: "current.text",
          vocabulary_keys: "[]",
          citations: ["Issue #144 test"],
        },
      ],
      unmatched: { speak: "current.text", vocabulary_keys: "[]", citations: ["Issue #144 test"] },
    },
  });
  const graph = new Utterance(NORMALIZATION_SCHEMA);
  recognizeText(value, graph, spec);
  const item = graph.relation("Normalization").listItems()[0];
  const tx = graph.beginTransaction({
    ruleId: "reading_request",
    phase: "test",
    tag: "test",
    reason: "Nested reading request",
    citations: ["Issue #144 test"],
  });
  tx.set(item, "outputType", "request");
  tx.set(item, "payload", { value, hundreds, suffix: "" });
  tx.commit();
  return normalizeSourceItems(graph, spec)
    .map((entry) => entry.word)
    .join(" ");
}

describe("composable cardinal and ordinal requests", () => {
  it.each([
    ["0", "zero"],
    ["13", "thirteen"],
    ["20", "twenty"],
    ["42", "forty two"],
    ["100", "one hundred"],
    ["123", "one hundred twenty three"],
    ["1000", "one thousand"],
    ["1001", "one thousand one"],
    ["1000000", "one million"],
    [
      "999999999",
      "nine hundred ninety nine million nine hundred ninety nine thousand nine hundred ninety nine",
    ],
  ])("reads cardinal %s", (value, expected) => expect(read(value)).toBe(expected));
  it.each([
    ["1", "first"],
    ["20", "twentieth"],
    ["21", "twenty first"],
    ["100", "one hundredth"],
    ["121", "one hundred twenty first"],
    ["1000", "one thousandth"],
    ["1001", "one thousand oneth"],
  ])("preserves ordinal %s including legacy scale edges", (value, expected) =>
    expect(read(value, "ordinal")).toBe(expected),
  );
  it("keeps DECtalk compound selection explicit", () =>
    expect(read("123", "cardinal", "hundredand")).toBe("one hundredand twenty three"));
  it.each(["-1", "1000000000", "NaN"])("declines unsupported %s", (value) =>
    expect(read(value)).toBe(value),
  );
});
