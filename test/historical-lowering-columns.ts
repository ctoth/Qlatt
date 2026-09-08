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
    if (typeof column !== "string" || !currentColumns.includes(column)) {
      throw new Error("Historical column is absent from the current lowering contract");
    }
    return column;
  });
}
