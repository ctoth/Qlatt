import { join } from "node:path";
import { expect, it } from "vitest";
import { renderNasalComparison } from "../scripts/render-nasal-comparison";

it.each(["man", "nine", "sing"])(
  "renders a finite nasal spectrum for %s and responds to port closure",
  async (phrase) => {
    const root = process.env.NASAL_OUTPUT_DIR;
    const report = await renderNasalComparison(phrase, root ? join(root, phrase) : undefined);
    for (const run of report.runs) {
      expect(run.rms).toBeGreaterThan(0);
      expect(Number.isFinite(run.peak)).toBe(true);
      expect(run.peak).toBeLessThan(1);
      expect(run.lowBandPower).toBeGreaterThan(0);
      expect(run.highBandPower).toBeGreaterThan(0);
    }
    expect(Number.isFinite(report.spectralDifference)).toBe(true);
    expect(report.spectralDifference).toBeGreaterThan(0.001);
    console.log(JSON.stringify(report));
  },
  120000,
);
