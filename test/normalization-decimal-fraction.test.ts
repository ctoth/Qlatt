import { describe, expect, it } from "vitest";
import { readingFixture } from "./normalization-component-helpers";

describe("decimal and fraction composition", () => {
  it.each([
    ["0", "05", "zero point zero five"],
    ["1,234", "05", "one thousand two hundred thirty four point zero five"],
  ])("retains fractional zeros", (integer, fractional, expected) =>
    expect(readingFixture(["decimal-fraction"])("decimal", { integer, fractional }).text).toBe(
      expected,
    ),
  );
  it.each([
    ["1", "2", "", "one half"],
    ["2", "2", "", "two halves"],
    ["3", "4", "", "three fourths"],
    ["1", "100", "", "one one hundredth"],
    ["3", "4", "%", "three fourths percent"],
  ])("composes fraction %s/%s%s", (numerator, denominator, percent, expected) =>
    expect(
      readingFixture(["decimal-fraction"])("fraction", { numerator, denominator, percent }).text,
    ).toBe(expected),
  );
  it("changes separator and plural vocabulary through data", () => {
    const read = readingFixture(["decimal-fraction"], {
      tn_decimal_policy: { grouping: ",", separator: "dot" },
      tn_fraction_words: {
        "2.one": "demi",
        "2.many": "demis",
        plural_suffix: "z",
        percent: "per cent",
      },
    });
    expect(read("decimal", { integer: "0", fractional: "05" }).text).toBe("zero dot zero five");
    expect(read("fraction", { numerator: "2", denominator: "2" }).text).toBe("two demis");
    expect(read("fraction", { numerator: "3", denominator: "4" }).text).toBe("three fourthz");
  });
});
