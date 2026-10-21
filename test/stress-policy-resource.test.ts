import { expect, it, vi } from "vitest";
import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { pronounce } from "../src/g2p";
import { decomposeWord } from "../src/g2p/morphology";
import { createProvenanceCollector } from "../src/provenance";
import { transcribeText } from "../src/transcribe-text";
import * as yaml from "../src/yaml-loader";

it("rejects a generated-pronunciation frontend without a resolved stress policy", () => {
  expect(() =>
    loadFrontendResources({
      ...loadBundledRulepackSpec("qlatt-english"),
      stress_policy_path: undefined,
    }),
  ).toThrow(/E_FRONTEND_CONFIG.*stress_policy_path/);
});
it.each(["qlatt-english", "qlatt-beauty"])(
  "resolves the inherited stress resource for %s",
  (frontend) => {
    const resources = loadFrontendResources(loadBundledRulepackSpec(frontend));
    expect(resources.stress?.path).toBe("/rules/frontends/qlatt-english/stress-policy.yaml");
    expect(loadFrontendResources(loadBundledRulepackSpec(frontend)).stress).toBe(resources.stress);
  },
);
it("reports a missing resolved policy through the resource owner", () => {
  expect(() =>
    loadFrontendResources({
      ...loadBundledRulepackSpec("qlatt-english"),
      stress_policy_path: "/rules/frontends/qlatt-english/no-such-stress-policy.yaml",
    }),
  ).toThrow(/E_FRONTEND_CONFIG.*stress_policy_path/);
});

it("keeps DECtalk table suffix pronunciation without shared contexts", () => {
  const spec = loadBundledRulepackSpec("dectalk-english");
  const resources = loadFrontendResources(spec);
  expect(resources.morphology).toBeUndefined();
  expect(resources.stress).toBeUndefined();
  const lookup = (word: string) => (word === "cat" ? ["K", "AE1", "T"] : null);
  expect(pronounce("cats", lookup, resources)).toMatchObject({
    phonemes: ["K", "AE1", "T", "S"],
    source: "morphology",
    rootWord: "cat",
  });
  const provenance = createProvenanceCollector();
  transcribeText("cats", {
    compiledSpec: spec,
    frontendId: "dectalk-english",
    dictLookup: lookup,
    provenance,
  });
  expect(
    provenance.getDecisions().some((entry) => entry.type === "morphology_pronunciation_selected"),
  ).toBe(true);
});

it("requires shared contexts when an explicit non-table override consumes them", () => {
  const spec = loadBundledRulepackSpec("dectalk-english");
  const shared = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
  const options = {
    compiledSpec: spec,
    frontendId: "dectalk-english",
    dictionaryMap: {},
    lts: shared.lts,
  };
  expect(() => transcribeText("blorf", options)).toThrow(
    /E_FRONTEND_CONFIG.*dectalk-english.*morphology/,
  );
  expect(() => transcribeText("blorf", { ...options, morphology: shared.morphology })).toThrow(
    /E_FRONTEND_CONFIG.*dectalk-english.*stress_policy/,
  );
});

it("still acquires explicitly declared shared resources for a table frontend", () => {
  const spec = loadBundledRulepackSpec("dectalk-english");
  const shared = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
  if (!shared.morphology || !shared.stress)
    throw new Error("Qlatt fixture requires shared contexts");
  const selected = loadFrontendResources({
    ...spec,
    morphology_path: shared.morphology.path,
    stress_policy_path: shared.stress.path,
  });
  expect(selected.morphology?.data).toBe(shared.morphology.data);
  expect(selected.stress).toBe(shared.stress);
  expect(() =>
    loadFrontendResources({ ...spec, stress_policy_path: "/missing-shared-stress.yaml" }),
  ).toThrow(/E_FRONTEND_CONFIG.*stress_policy_path/);
});

it("keeps declared morphology phonotactics separate and rejects incompatible stress data", () => {
  const spec = loadBundledRulepackSpec("qlatt-english");
  const base = loadFrontendResources(spec);
  if (!base.morphology || !base.stress) throw new Error("Qlatt fixture requires shared contexts");
  const read = yaml.loadYamlDocumentSync;
  const morphology = {
    ...base.morphology.data,
    phonotactics_path: "/fixture/morphology-phonotactics.yaml",
  };
  const policy = read<Record<string, unknown>>(base.stress.path);
  const separate = structuredClone(base.morphology.phonotactics);
  separate.voicing_classes.voiceless_finals = [];
  const spy = vi.spyOn(yaml, "loadYamlDocumentSync").mockImplementation((path) => {
    if (path === "/fixture/morphology.yaml") return morphology;
    if (path === "/fixture/morphology-phonotactics.yaml") return separate;
    if (path === "/fixture/bad-stress.yaml")
      return { ...policy, phonotactics_path: spec.inventory_path };
    return read(path);
  });
  try {
    const selected = loadFrontendResources({
      ...spec,
      morphology_path: "/fixture/morphology.yaml",
    });
    if (!selected.morphology) throw new Error("Fixture requires selected morphology");
    expect(selected.morphology.phonotactics).toBe(separate);
    expect(selected.morphology.data).toBe(morphology);
    expect(loadFrontendResources(spec).morphology?.data).toBe(base.morphology.data);
    expect(selected.stress).toBe(base.stress);
    const lookup = (word: string) => (word === "walk" ? ["W", "AO1", "K"] : null);
    expect(decomposeWord("walked", lookup, base.morphology)?.phonemes.at(-1)).toBe("T");
    expect(decomposeWord("walked", lookup, selected.morphology)?.phonemes.at(-1)).toBe("D");
    expect(() =>
      loadFrontendResources({ ...spec, stress_policy_path: "/fixture/bad-stress.yaml" }),
    ).toThrow(/E_FRONTEND_CONFIG.*stress_policy_path/);
  } finally {
    spy.mockRestore();
  }
});

it("honors explicitly supplied parsed transcription contexts", () => {
  const spec = loadBundledRulepackSpec("qlatt-english");
  const resources = loadFrontendResources(spec);
  if (!resources.stress) throw new Error("Qlatt fixture requires stress context");
  const stress = structuredClone(resources.stress);
  stress.policy.longVowels = ["NOT_A_VOWEL"];
  expect(() => transcribeText("blorf", { compiledSpec: spec, dictionaryMap: {}, stress })).toThrow(
    /E_STRESS_PHONOTACTICS/,
  );
});
