import { expect, it } from "vitest";
import { historicalLoweringColumns } from "./historical-lowering-columns";

const captured = { historicalOnly: true, reconstructedLowering: { paramKeys: ["F1", "F2"] } };
it("preserves every captured column without inventing historical values for new fields", () => {
  expect(historicalLoweringColumns(captured, ["F1", "F2", "Ac"])).toEqual(["F1", "F2"]);
});
it("rejects removal of a captured column", () =>
  expect(() => historicalLoweringColumns(captured, ["F1"])).toThrow());
it("requires explicit historical ownership", () =>
  expect(() =>
    historicalLoweringColumns({ ...captured, historicalOnly: false }, ["F1", "F2"]),
  ).toThrow());
