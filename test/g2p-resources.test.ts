import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import {
  compileRuleEngineSpec,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";
import { normalizeGraphText } from "../src/declarative-frontend/source-recognition";
import { ltsDocumentAt } from "../src/g2p/lts-document";
import type { LtsRulesData } from "../src/g2p/lts-engine";
import { transcribeText } from "../src/transcribe-text";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true });
});

it("decodes and reuses the selected generated JSON LTS document", () => {
  const resources = loadFrontendResources(loadBundledRulepackSpec("dectalk-english"));
  const { path, document } = resources.lts;
  expect(document).toEqual(JSON.parse(readFileSync(`public${path}`, "utf8")));
  expect(ltsDocumentAt(path)).toBe(document);
});

it("retains YAML rule-list decoding and cache identity", () => {
  const resources = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
  const { path, document } = resources.lts;
  expect(document).toEqual(loadYamlDocumentSync(path));
  expect(ltsDocumentAt(path)).toBe(document);
});

it("honors an explicit pronunciation document at the same source path", () => {
  const spec = loadBundledRulepackSpec("qlatt-english");
  const resources = loadFrontendResources(spec);
  const options = { compiledSpec: spec, dictionaryMap: {} };
  expect(transcribeText("blorf", options).length).toBeGreaterThan(0);
  const document = structuredClone(resources.lts.document) as LtsRulesData;
  document.rules_by_letter = {};
  expect(
    transcribeText("blorf", { ...options, lts: { path: resources.lts.path, document } }),
  ).toEqual([]);
});

it.each(["{", "null"])("reports invalid JSON LTS document %s through its owner", (source) => {
  const directory = mkdtempSync(join(tmpdir(), "qlatt-lts-json-"));
  temporaryDirectories.push(directory);
  const path = join(directory, "resource.json");
  writeFileSync(path, source);
  expect(() =>
    loadFrontendResources({ ...loadBundledRulepackSpec("qlatt-english"), lts_path: path }),
  ).toThrow(/E_FRONTEND_CONFIG.*lts_path/);
  if (source === "null") {
    expect(() => ltsDocumentAt(path)).toThrow(/E_YAML_SCHEMA/);
  }
});

it.each(["lts_path", "morphology_path", "stress_policy_path", "normalization.phases"])(
  "rejects a frontend missing %s at resource load",
  (asset) => {
    const spec: Record<string, unknown> = structuredClone(loadBundledRulepackSpec("qlatt-english"));
    const [section, field] = asset.split(".");
    if (field) delete (spec[section] as Record<string, unknown>)[field];
    else delete spec[section];
    expect(() => loadFrontendResources(spec)).toThrow(new RegExp(`E_FRONTEND_CONFIG.*${asset}`));
  },
);

it.each(["lts_path", "morphology_path", "stress_policy_path"])(
  "names an unavailable %s at resource load",
  (asset) => {
    const spec: Record<string, unknown> = structuredClone(loadBundledRulepackSpec("qlatt-english"));
    const [section, field] = asset.split(".");
    if (field) (spec[section] as Record<string, unknown>)[field] = "/missing-g2p-asset.yaml";
    else spec[section] = "/missing-g2p-asset.yaml";
    expect(() => loadFrontendResources(spec)).toThrow(new RegExp(`E_FRONTEND_CONFIG.*${asset}`));
  },
);

it.each(["morphology_path", "stress_policy_path"])(
  "requires %s to select phonotactics",
  (asset) => {
    const spec = structuredClone(loadBundledRulepackSpec("qlatt-english"));
    const directory = mkdtempSync(join(tmpdir(), "qlatt-g2p-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "resource.yaml");
    writeFileSync(path, "version: v1\n");
    const dependency = asset === "morphology_path" ? "morphology" : "stress_policy";
    expect(() => loadFrontendResources({ ...spec, [asset]: path })).toThrow(
      new RegExp(`E_FRONTEND_CONFIG.*${dependency}.phonotactics_path`),
    );
  },
);

it("uses the selected rulepack vocabulary without leaking into later calls", () => {
  const original = loadBundledRulepackSpec("qlatt-english");
  const changed = structuredClone(original);
  const maps = changed.maps as Record<string, Record<string, string>>;
  maps.tn_number_words["1"] = "uno";
  maps.tn_ordinal_words["1"] = "primero";
  const spec = compileRuleEngineSpec(changed);
  expect(normalizeGraphText("1 1st 1000", spec)).toBe("uno primero uno thousand");
  expect(normalizeGraphText("1 1st", original)).toBe("one first");
});

it("keeps the shared G2P layer independent of a frontend package", () => {
  for (const file of readdirSync("src/g2p", { recursive: true })) {
    if (String(file).endsWith(".ts")) {
      expect(readFileSync(`src/g2p/${file}`, "utf8"), String(file)).not.toContain("qlatt-english");
    }
  }
});
