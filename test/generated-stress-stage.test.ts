import { expect, it } from "vitest";
import { pronounce } from "./g2p-fixture";

it("routes generated morphology through lexical stress", () => {
  const result = pronounce("kindness", (word) => (word === "kind" ? ["K", "AY1", "N", "D"] : null));
  expect(result).toMatchObject({
    source: "morphology",
    lexicalStress: {
      stress: ["primary", "unstressed"],
    },
  });
});

it("retains nested suffix and prefix history rather than a final-suffix hint", () => {
  const result = pronounce("unkindnesses", (word) =>
    word === "kind" ? ["K", "AY1", "N", "D"] : null,
  );
  expect(result).toMatchObject({ source: "morphology", rootWord: "kind" });
  // The established longest-suffix-first analysis is ((un+kind)+ness)+es.
  expect(result.morphology?.map((cycle) => cycle.spelling)).toEqual(["kind", "un", "ness", "es"]);
  expect(result.lexicalStress?.stress.filter((stress) => stress === "primary")).toHaveLength(1);
});
