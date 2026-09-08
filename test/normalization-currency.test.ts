import { describe, expect, it } from "vitest";
import { readingFixture } from "./normalization-component-helpers";

describe("currency reading composition", () => {
  it.each([
    ["1", "", "one dollar"],
    ["2", "", "two dollars"],
    ["0", "", "zero dollars"],
    ["0", "00", "zero cents"],
    ["0", "01", "one cent"],
    ["1", "00", "one dollar"],
    ["1", "01", "one dollar and one cent"],
    ["2", "1", "two dollars and ten cents"],
    ["1,234", "56", "one thousand two hundred thirty four dollars and fifty six cents"],
  ])("composes %s.%s", (major, minor, expected) => {
    expect(readingFixture(["currency"])("currency", { major, minor, currency: "$" }).text).toBe(
      expected,
    );
  });
  it("selects alternate precision and units entirely from data", () => {
    const read = readingFixture(["currency"], {
      tn_currencies: { "£": "pound", "€": "euro" },
      tn_currency_units: {
        "pound.one": "pound",
        "pound.many": "pounds",
        "pound.minor_one": "penny",
        "pound.minor_many": "pence",
        "euro.one": "euro",
        "euro.many": "euros",
        "euro.minor_one": "cent",
        "euro.minor_many": "cents",
      },
      tn_currency_policy: { precision: "3", padding: "000", joiner: "plus", grouping: "," },
    });
    expect(read("currency", { major: "2", minor: "005", currency: "£" }).text).toBe(
      "two pounds plus five pence",
    );
    expect(read("currency", { major: "1", minor: "", currency: "€" }).text).toBe("one euro");
  });
});
