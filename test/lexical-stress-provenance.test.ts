import { expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { transcribeText } from "../src/transcribe-text";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

it("explains inherited secondary stress through a neutral derivation", () => {
  const provenance = createProvenanceCollector();
  const tokens = transcribeText("celebrationness", {
    provenance,
    dictionaryMap: {},
    dictLookup: (word) =>
      word === "celebration" ? ["S", "EH2", "L", "AH0", "B", "R", "EY1", "SH", "AH0", "N"] : null,
    ltsPath: "/rules/frontends/qlatt-english/lts-rules.yaml",
    morphologyPath: "/rules/frontends/qlatt-english/morphology.yaml",
    stressPolicyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
  });
  expect(tokens.some((token) => token.phoneme === "EH" && token.stress === 2)).toBe(true);
  const inherited = provenance
    .getDecisions()
    .find((decision) => decision.reason.startsWith("inherited_feet:"));
  expect(inherited?.reason.includes('"head":0')).toBe(true);
  expect(inherited?.citations.length).toBeGreaterThan(0);
  expect(inherited?.parents?.length).toBeGreaterThan(0);
});

it("links inherited, reassigned, exception and fallback stress to each distinct word's pronunciation", () => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const tokens = transcribeText("kindness kindation kindness", {
    provenance,
    diagnostics,
    dictLookup: (word) => (word === "kind" ? ["K", "AY1", "N", "D"] : null),
    dictionaryMap: {},
    ltsPath: "/rules/frontends/qlatt-english/lts-rules.yaml",
    morphologyPath: "/rules/frontends/qlatt-english/morphology.yaml",
    stressPolicyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
  });
  const decisions = provenance.getDecisions();
  const stress = decisions.filter((decision) => decision.type.startsWith("stress_"));
  expect(stress.some((decision) => decision.type === "stress_inherited")).toBe(true);
  expect(stress.some((decision) => decision.type === "stress_exception")).toBe(true);
  expect(stress.some((decision) => decision.type === "stress_projection")).toBe(true);
  const quantities = stress.filter((decision) =>
    decision.reason.startsWith("quantity_assumption:"),
  );
  expect(new Set(quantities.map((decision) => decision.subject)).size).toBe(3);
  for (const decision of stress) {
    expect(decision.citations.length).toBeGreaterThan(0);
    expect(decision.parents?.length).toBeGreaterThan(0);
    for (const parent of decision.parents ?? []) {
      expect(
        decisions.some((candidate) => candidate.id === parent && candidate.seq < decision.seq),
      ).toBe(true);
    }
  }
  expect(
    tokens
      .filter((token) => token.word === "kindation" && token.stress === 1)
      .map((token) => token.phoneme),
  ).toEqual(["EY"]);
  expect(diagnostics.getEntries().some((entry) => entry.code === "STRESS_INPUT_ASSUMPTION")).toBe(
    true,
  );
});

it("records the acoustic fallback without erasing lexical secondary prominence", () => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const { utterance } = textToKlattTrackDetailed("celebration", undefined, 30, {
    provenance,
    diagnostics,
  });
  const fallback = provenance
    .getDecisions()
    .filter((decision) => decision.type === "stress_inventory_projection");
  expect(fallback.length).toBeGreaterThan(0);
  for (const decision of fallback) {
    expect(decision.citations.length).toBeGreaterThan(0);
    const segment = utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.id === decision.subject);
    expect(segment?.get("stress")).toBe(2);
    expect(decision.parents?.length).toBeGreaterThan(0);
  }
  expect(diagnostics.getEntries().some((entry) => entry.code === "STRESS_INVENTORY_FALLBACK")).toBe(
    true,
  );
});
