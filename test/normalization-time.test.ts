import { describe, expect, it } from "vitest";
import { readingFixture } from "./normalization-component-helpers";

describe("time reading composition", () => {
  it.each([
    ["0", "00", "", "twelve o'clock a m"],
    ["12", "00", "", "twelve o'clock p m"],
    ["23", "05", "", "eleven oh five p m"],
    ["13", "30", "am", "one thirty a m"],
    ["1", "5", "p.m.", "one oh five p m"],
  ])("reads %s:%s %s", (hour, minute, period, expected) =>
    expect(readingFixture(["time"])("time", { hour, minute, period }).text).toBe(expected),
  );
  it("selects 24-hour output and synthetic words through data", () => {
    const read = readingFixture(["time"], {
      tn_time_policy: {
        clock: "24",
        half_day: "12",
        day: "24",
        minute_limit: "60",
        padding_threshold: "10",
      },
      tn_time_words: { round: "exact", padding: "nil", am: "morning", pm: "evening" },
    });
    expect(read("time", { hour: "23", minute: "05" }).text).toBe("twenty three nil five");
    expect(read("time", { hour: "0", minute: "0" }).text).toBe("zero exact");
  });
});
