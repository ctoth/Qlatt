import { describe, expect, it, vi } from "vitest";
import * as celExpressions from "../src/declarative-frontend/cel-expressions";
import {
  compileRuleEngineSpec,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";
import { normalizeGraphText } from "../src/declarative-frontend/source-recognition";
import { transcribeText } from "../src/transcribe-text";

const original = loadBundledRulepackSpec("qlatt-english");

describe("graph normalization declarations (supersede legacy #14/#15 dispatcher validation)", () => {
  it("recognizes alternate currency precision and clock conventions from selected data", () => {
    const spec = structuredClone(original);
    const maps = spec.maps as Record<string, Record<string, string>>;
    maps.tn_currencies = { "£": "pound", "€": "euro" };
    maps.tn_currency_units = {
      "pound.one": "pound",
      "pound.many": "pounds",
      "pound.minor_one": "penny",
      "pound.minor_many": "pence",
      "euro.one": "euro",
      "euro.many": "euros",
      "euro.minor_one": "cent",
      "euro.minor_many": "cents",
    };
    maps.tn_currency_policy = {
      ...maps.tn_currency_policy,
      precision: "3",
      padding: "000",
      joiner: "plus",
    };
    maps.tn_time_policy = { ...maps.tn_time_policy, clock: "24" };
    const recognition = spec.text_recognition as { rules: Record<string, unknown>[] };
    const currency = recognition.rules.find((rule) => rule.id === "tn_currency_source")!;
    currency.pattern = String(currency.pattern).replace("{1,2}", "{1,3}");
    expect(normalizeGraphText("£2.005 €1 23:05", compileRuleEngineSpec(spec))).toBe(
      "two pounds plus five pence one euro twenty three oh five",
    );
  });
  it("does not repeat static CEL validation when reusing an immutable loaded rulepack", () => {
    normalizeGraphText("one", original);
    const validate = vi.spyOn(celExpressions, "validateExpressionSyntax");
    try {
      expect(normalizeGraphText("two", original)).toBe("two");
      expect(validate).not.toHaveBeenCalled();
    } finally {
      validate.mockRestore();
    }
  });
  it("changes scale words, ordinal suffixes and joiners without host edits", () => {
    const spec = structuredClone(original);
    const maps = spec.maps as Record<string, Record<string, string>>;
    maps.tn_number_words = {
      ...maps.tn_number_words,
      "1": "uno",
      thousand: "kilo",
      hundred: "hecto",
      hundred_joiner: "and",
      ordinal_suffix: "ith",
    };
    expect(normalizeGraphText("1001st 123", compileRuleEngineSpec(spec))).toBe(
      "uno kilo unoith uno hecto and twenty three",
    );
  });
  it("uses the same punctuation inventory as transcription", () => {
    const spec = compileRuleEngineSpec({
      ...original,
      transcription: { ...original.transcription, punctuation_tokens: ["~"] },
    });
    const normalized = normalizeGraphText("hello~world!", spec);
    expect(normalized).toBe("hello ~ world");
    const tokens = transcribeText(normalized, { compiledSpec: spec });
    expect(tokens.filter((token) => token.isPunctuation).map((token) => token.symbol)).toEqual([
      "~",
    ]);
  });
  it("handles mixed classes through the production rulepack", () => {
    expect(normalizeGraphText("Dr. Smith ordered 3 items on 12/25/2024 for $42.50", original)).toBe(
      "doctor smith ordered three items on december twenty fifth two thousand twenty four for forty two dollars and fifty cents",
    );
  });
  it.each([
    { id: "bad", pattern: 3 },
    { id: "bad", table: "missing", prefix: "", suffix: "" },
    { id: "bad", pattern: "a*" },
    { id: "bad", pattern: "a", when: "missing_variable" },
  ])("rejects invalid recognition at load: %j", (invalid) => {
    const spec = structuredClone(original);
    const recognition = spec.text_recognition as { rules: Record<string, unknown>[] };
    recognition.rules = [{ ...recognition.rules[0], table: undefined, ...invalid }];
    if (recognition.rules[0].table === undefined) delete recognition.rules[0].table;
    expect(() => compileRuleEngineSpec(spec)).toThrow(/E_RECOGNITION_CONFIG/);
  });
  it.each([
    { output: "[]", allowed_types: ["segment"], tag: "normalization_number" },
    { output: "[]", allowed_types: ["terminal"], tag: "unknown" },
    { output: "current.undeclared", allowed_types: ["terminal"], tag: "normalization_number" },
    { output: "[]", allowed_types: ["terminal"] },
  ])("rejects invalid expansion: %j", (expand_text) => {
    const spec = structuredClone(original);
    spec.rules.tn_terminal_words = { ...spec.rules.tn_terminal_words, expand_text };
    expect(() => compileRuleEngineSpec(spec)).toThrow(
      /E_TEXT_EXPANSION_CONFIG|E_TAG_UNKNOWN|E_RULE_FEATURE_UNKNOWN/,
    );
  });
  it("requires declared phases and actual literal tables", () => {
    expect(() =>
      compileRuleEngineSpec({ ...original, normalization: { phases: ["absent"] } }),
    ).toThrow(/unknown phase/);
    const maps = {
      ...(original.maps as Record<string, unknown>),
      tn_abbreviations: { "a+b.": "literal", "x[0]": "bracket" },
    };
    const spec = compileRuleEngineSpec({ ...original, maps });
    expect(normalizeGraphText("A+B. aab. x[0]", spec)).toBe("literal aab . bracket");
  });
});
