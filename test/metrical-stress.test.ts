import { expect, it } from "vitest";
import type { StressSyllable } from "../src/g2p/lexical-stress-types";
import { assignMetricalStress } from "../src/g2p/metrical-stress";
import { loadStressPolicy } from "../src/g2p/stress-policy";

const policy = loadStressPolicy("/rules/frontends/qlatt-english/stress-policy.yaml");
const parental: StressSyllable[] = [
  { id: "parental:s0", nucleus: "AH", long: false, coda: [], inherited: null },
  { id: "parental:s1", nucleus: "EH", long: false, coda: ["N"], inherited: null },
  { id: "parental:s2", nucleus: "AH", long: false, coda: ["L"], inherited: null },
];
it("finishes an inner word's destressing before a neutral suffix preserves it", () => {
  const result = assignMetricalStress(
    [...parental, { id: "ness", nucleus: "AH", long: false, coda: ["S"], inherited: null }],
    [
      { id: "parental", end: 3, category: "noun", affix: "root", extrametricalSuffix: false },
      {
        id: "parentalness",
        end: 4,
        category: "noun",
        affix: "neutral",
        extrametricalSuffix: false,
      },
    ],
    policy,
  );
  expect(result.stress).toEqual(["unstressed", "primary", "unstressed", "unstressed"]);
});
it("derives the parental heavy penult with an inspectable ESR foot (Hayes 1982, pp. 244–246)", () => {
  const result = assignMetricalStress(
    parental,
    [{ id: "parental", end: 3, category: "noun", affix: "root", extrametricalSuffix: false }],
    policy,
  );
  expect(result.stress).toEqual(["unstressed", "primary", "unstressed"]);
  const esr = result.decisions.find((decision) => decision.rule === "english_stress_rule");
  expect(esr?.feet).toEqual([{ head: 1, members: [1], domain: "parental" }]);
});
it("preserves both lexical prominences through a neutral cycle", () => {
  const syllables: StressSyllable[] = [
    { id: "root:s0", nucleus: "EH", long: false, coda: [], inherited: "primary" },
    { id: "root:s1", nucleus: "AH", long: false, coda: [], inherited: "unstressed" },
    { id: "root:s2", nucleus: "EY", long: true, coda: [], inherited: "secondary" },
    { id: "affix:s0", nucleus: "AH", long: false, coda: [], inherited: null },
  ];
  const result = assignMetricalStress(
    syllables,
    [
      { id: "root", end: 3, category: "noun", affix: "root", extrametricalSuffix: false },
      { id: "neutral", end: 4, category: "noun", affix: "neutral", extrametricalSuffix: false },
    ],
    policy,
  );
  expect(result.stress).toEqual(["primary", "unstressed", "secondary", "unstressed"]);
});
