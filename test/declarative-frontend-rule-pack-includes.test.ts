import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump, load } from "js-yaml";
import { describe, expect, it, vi } from "vitest";
import {
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
  preloadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";
import * as yamlLoader from "../src/yaml-loader";

function asYamlPath(path: string): string {
  return path.replace(/\\/g, "/");
}

describe("declarative frontend rule-pack includes", () => {
  it.each(["missing", "malformed"])(
    "rejects %s syllabification in sync and async executable loads",
    async (kind) => {
      const sync = yamlLoader.loadYamlSourceSync;
      const asyncLoad = yamlLoader.loadYamlSource;
      const rewrite = (path: string, source: string) => {
        if (!path.includes("/qlatt-english/fixture-205-")) return source;
        const document = load(source) as Record<string, unknown>;
        if (kind === "missing") delete document.syllabification;
        else document.syllabification = { nuclei: "", onset_clusters: [], affixes: [], ascky: {} };
        return dump(document);
      };
      const realPath = (path: string) => path.replace(/fixture-205-[^/]+\.yaml$/, "frontend.yaml");
      const syncSpy = vi.spyOn(yamlLoader, "loadYamlSourceSync").mockImplementation(
        (path) => rewrite(path, sync(realPath(path))),
      );
      const asyncSpy = vi.spyOn(yamlLoader, "loadYamlSource").mockImplementation(
        async (path) => rewrite(path, await asyncLoad(realPath(path))),
      );
      try {
        expect(() =>
        loadRulepackSpecFromPath(`/rules/frontends/qlatt-english/fixture-205-${kind}-sync.yaml`),
      ).toThrow(/E_SYLLABIFICATION_INVALID/);
        await expect(
        preloadRulepackSpecFromPath(`/rules/frontends/qlatt-english/fixture-205-${kind}-async.yaml`),
      ).rejects.toThrow(/E_SYLLABIFICATION_INVALID/);
      } finally {
        syncSpy.mockRestore();
        asyncSpy.mockRestore();
      }
    },
  );

  it("caches a deeply immutable compiled bundled rulepack", () => {
    const first = loadBundledRulepackSpec("qlatt-english");

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.rules)).toBe(true);
    expect(Object.isFrozen(first.phases)).toBe(true);
    expect(Object.isFrozen(first.rules.stress_duration)).toBe(true);
    expect(Reflect.set(first.rules, "cache_poison", {})).toBe(false);

    const second = loadBundledRulepackSpec("qlatt-english");
    expect(second).toBe(first);
    expect(second.rules.cache_poison).toBeUndefined();
  });

  it("throws when a child include declares a non-empty unmerged root key", () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-rule-pack-include-"));
    try {
      const parentPath = join(dir, "frontend.yaml");
      const childPath = join(dir, "child.yaml");

      writeFileSync(parentPath, ["version: v1", "include:", "  - child.yaml", ""].join("\n"));
      writeFileSync(childPath, ["version: v1", "output:", "  format: foo", ""].join("\n"));

      expect(() => loadRulepackSpecFromPath(asYamlPath(parentPath))).toThrowError(
        /E_UNMERGED_CHILD_ROOT_KEY.*output.*does not merge/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
