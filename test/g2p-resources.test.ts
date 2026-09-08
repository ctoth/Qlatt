import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import {
  normalizeText,
  numberToWords,
  ordinalToWords,
  readFraction,
  readYear,
} from "../src/g2p/text-normalize";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true });
});

it.each([
  "lts_path",
  "morphology_path",
  "stress_policy_path",
  "normalization.tables_path",
  "normalization.pipeline_path",
])("rejects a frontend missing %s at resource load", (asset) => {
  const spec: Record<string, unknown> = structuredClone(loadBundledRulepackSpec("qlatt-english"));
  const [section, field] = asset.split(".");
  if (field) delete (spec[section] as Record<string, unknown>)[field];
  else delete spec[section];
  expect(() => loadFrontendResources(spec)).toThrow(new RegExp(`E_FRONTEND_CONFIG.*${asset}`));
});

it.each([
  "lts_path",
  "morphology_path",
  "stress_policy_path",
  "normalization.tables_path",
  "normalization.pipeline_path",
])("names an unavailable %s at resource load", (asset) => {
  const spec: Record<string, unknown> = structuredClone(loadBundledRulepackSpec("qlatt-english"));
  const [section, field] = asset.split(".");
  if (field) (spec[section] as Record<string, unknown>)[field] = "/missing-g2p-asset.yaml";
  else spec[section] = "/missing-g2p-asset.yaml";
  expect(() => loadFrontendResources(spec)).toThrow(new RegExp(`E_FRONTEND_CONFIG.*${asset}`));
});

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

it("uses the caller's tables in public number readers without leaking into later calls", () => {
  const resources = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
  const originalPath = resources.normalization.tablesPath;
  const tables = loadYamlDocumentSync<{ ones: string[]; ordinal_ones: Record<string, string> }>(
    originalPath,
  );
  tables.ones[1] = "uno";
  tables.ordinal_ones[1] = "primero";
  const directory = mkdtempSync(join(tmpdir(), "qlatt-g2p-"));
  temporaryDirectories.push(directory);
  const customPath = join(directory, "tables.yaml");
  writeFileSync(customPath, JSON.stringify(tables));
  expect(numberToWords(1, customPath)).toBe("uno");
  expect(ordinalToWords("1st", customPath)).toBe("primero");
  expect(readYear("1000", customPath)).toBe("uno thousand");
  expect(readFraction("1", "4", false, customPath)).toBe("uno fourth");
  expect(normalizeText("1", { ...resources.normalization, tablesPath: customPath })).toBe("uno");
  expect(numberToWords(1, originalPath)).toBe("one");
  expect(normalizeText("1", resources.normalization)).toBe("one");
});

it("keeps the shared G2P layer independent of a frontend package", () => {
  for (const file of readdirSync("src/g2p", { recursive: true })) {
    if (String(file).endsWith(".ts")) {
      expect(readFileSync(`src/g2p/${file}`, "utf8"), String(file)).not.toContain("qlatt-english");
    }
  }
});
