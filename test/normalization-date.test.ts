import { describe, expect, it } from "vitest";
import { readingFixture } from "./normalization-component-helpers";

describe("year and date composition", () => {
  it.each([
    ["1900", "nineteen hundred"],
    ["1905", "nineteen zero five"],
    ["1984", "nineteen eighty four"],
    ["2000", "two thousand"],
    ["2005", "twenty zero five"],
  ])("reads an explicitly requested year %s", (value, expected) =>
    expect(readingFixture(["date"])("year", { value }).text).toBe(expected),
  );
  it("keeps date years cardinal and selects output order through data", () => {
    expect(readingFixture(["date"])("date", { month: "1", day: "2", year: "1905" }).text).toBe(
      "january second one thousand nine hundred five",
    );
    const read = readingFixture(["date"], {
      tn_date_policy: {
        first: "day",
        second: "month",
        third: "year",
        day_kind: "cardinal",
        year_kind: "year",
      },
    });
    expect(read("date", { month: "1", day: "2", year: "1905" }).text).toBe(
      "two january nineteen zero five",
    );
  });
});
