import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readingFixture } from "./normalization-component-helpers";

const rows: { frontend: string; input: string; expected: string }[] = JSON.parse(
  readFileSync("test/fixtures/normalization-baseline.json", "utf8"),
);

describe("original normalization corpus", () => {
  for (const frontend of ["qlatt-english", "dectalk-english", "qlatt-beauty"]) {
    const read = readingFixture(
      ["lexical", "currency", "time", "date", "decimal-fraction", "recognition"],
      {
        tn_recognition_policy: {
          years: frontend === "dectalk-english" ? "yes" : "no",
          fractions: frontend === "dectalk-english" ? "yes" : "no",
          hundreds: frontend === "dectalk-english" ? "hundredand" : "hundred",
          fraction_exception: "100",
        },
      },
    );
    it.each(rows.filter((row) => row.frontend === frontend))(`${frontend}: $input`, (row) => {
      expect(read("", {}, row.input).text).toBe(row.expected);
    });
  }
});
