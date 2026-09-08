import { expect, it } from "vitest";
import { momentsFromPower } from "../scripts/frication-spectrum";

it("measures a uniform spectrum in Hz and million Hz squared", () => {
  const moments = momentsFromPower([1, 1, 1], 1000);
  [1000, 2 / 3, 0, -1.5].forEach((expected, index) => {
    expect(moments[index]).toBeCloseTo(expected, 8);
  });
});
it("is invariant to source level", () =>
  expect(momentsFromPower([2, 3, 5], 1000)).toEqual(momentsFromPower([20, 30, 50], 1000)));
it("rejects silence instead of accepting non-finite comparison scores", () =>
  expect(() => momentsFromPower([0, 0, 0], 1000)).toThrow());
