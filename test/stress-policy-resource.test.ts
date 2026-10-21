import { expect, it, vi } from "vitest";
import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { decomposeWord } from "../src/g2p/morphology";
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
it.each(["qlatt-english", "qlatt-beauty", "dectalk-english"])(
  "resolves the inherited stress resource for %s",
  (frontend) => {
    const resources = loadFrontendResources(loadBundledRulepackSpec(frontend));
    expect(resources.stress.path).toBe("/rules/frontends/qlatt-english/stress-policy.yaml");
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

it("keeps declared morphology phonotactics separate and rejects incompatible stress data", () => {
  const spec = loadBundledRulepackSpec("qlatt-english");
  const base = loadFrontendResources(spec);
  const read = yaml.loadYamlDocumentSync;
  const morphology = read<Record<string, unknown>>(base.morphology.path);
  const policy = read<Record<string, unknown>>(base.stress.path);
  const separate = structuredClone(base.morphology.phonotactics);
  separate.voicing_classes.voiceless_finals = [];
  const spy = vi.spyOn(yaml, "loadYamlDocumentSync").mockImplementation((path) => {
    if (path === "/fixture/morphology.yaml")
      return { ...morphology, phonotactics_path: "/fixture/morphology-phonotactics.yaml" };
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
    expect(selected.morphology.phonotactics).toBe(separate);
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
  const stress = structuredClone(resources.stress);
  stress.policy.longVowels = ["NOT_A_VOWEL"];
  expect(() => transcribeText("blorf", { compiledSpec: spec, dictionaryMap: {}, stress })).toThrow(
    /E_STRESS_PHONOTACTICS/,
  );
});
