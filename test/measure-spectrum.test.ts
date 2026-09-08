import { expect, it } from "vitest";
import { measureSpectrum } from "../scripts/measure-spectrum";

it("measures known low/high tone power independently of overall gain", () => {
  const rate = 44100;
  const samples = Float64Array.from(
    { length: rate },
    (_, i) =>
      Math.sin((2 * Math.PI * 1000 * i) / rate) + 0.5 * Math.sin((2 * Math.PI * 6000 * i) / rate),
  );
  const result = measureSpectrum(samples, rate);
  expect(result.highToLowDb).toBeCloseTo(10 * Math.log10(0.25), 3);
  expect(result.bands[1].fraction).toBeCloseTo(0.2, 3);
  expect(
    measureSpectrum(
      samples.map((v) => v * 0.1),
      rate,
    ).highToLowDb,
  ).toBeCloseTo(result.highToLowDb!, 6);
});

it("rejects empty and nonfinite measurements", () => {
  expect(() => measureSpectrum([], 44100)).toThrow();
  expect(() => measureSpectrum([0, Number.NaN], 44100)).toThrow();
});
