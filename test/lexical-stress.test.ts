import { expect, it } from "vitest";
import { assignStress } from "../src/g2p/stress";

// Hayes (1982), pp. 244–246: parental retains a heavy stressed penult.
it("uses rhyme weight rather than syllable count in parental", () => {
  const phones = ["P", "AH", "R", "EH", "N", "T", "AH", "L"];
  expect(assignStress(phones)).toEqual(["P", "AH0", "R", "EH1", "N", "T", "AH0", "L"]);
});
