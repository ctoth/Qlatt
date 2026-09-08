import { isPlainObject } from "../src/yaml-loader";

/** Preserve the recorded scope of historical captures as live schemas grow. */
export function historicalLoweringColumns(
  baseline: unknown,
  currentColumns: readonly string[],
): string[] {
  if (
    !isPlainObject(baseline) ||
    baseline.historicalOnly !== true ||
    !isPlainObject(baseline.reconstructedLowering)
  ) {
    throw new Error("Expected an explicitly historical lowering capture");
  }
  const captured = baseline.reconstructedLowering.paramKeys;
  if (!Array.isArray(captured) || captured.length === 0)
    throw new Error("Historical columns missing");
  return captured.map((column: unknown) => {
    // Issue 52 retires these production controls. Still project and assert every
    // captured cell under its original name: historical evidence is immutable.
    const retiredNasalColumn = column === "nasalCoupling" || column === "nasalPoleBaseHz";
    if (typeof column !== "string" || (!currentColumns.includes(column) && !retiredNasalColumn)) {
      throw new Error("Historical column is absent from the current lowering contract");
    }
    return column;
  });
}
