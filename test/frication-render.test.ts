import { join } from "node:path";
import { expect, it } from "vitest";
import { renderFricationComparison } from "../scripts/render-frication-comparison";

// Held-out vowel contexts and seeds; calibration used "See she fee.", seed 51.
const phrase = "Sue shoe foo. Sack shack fact. Saw shawl fall. So show foe. Say shade fade.";
it.each([20260214, 9173])(
  "improves every requested fricative over the dB source, seed %i",
  async (seed) => {
    const root = process.env.FRICATION_OUTPUT_DIR;
    const report = await renderFricationComparison(
      phrase,
      seed,
      root ? join(root, String(seed)) : undefined,
    );
    const [baseline, physical] = report.runs;
    expect(baseline.mode).toBe(0);
    expect(physical.mode).toBe(1);
    for (const candidate of physical.measurements) {
      const control = baseline.measurements.find((row) => row.phone === candidate.phone);
      expect(control?.distance, candidate.phone).toBeGreaterThan(candidate.distance);
      console.log(
        `${seed} ${candidate.phone}: baseline=${control?.distance.toFixed(6)} physical=${candidate.distance.toFixed(6)}`,
      );
    }
    for (const run of report.runs) {
      expect(Number.isFinite(run.metrics.rms)).toBe(true);
      expect(run.metrics.rms).toBeGreaterThan(0);
      expect(run.metrics.peak).toBeLessThan(1);
    }
  },
  120000,
);
