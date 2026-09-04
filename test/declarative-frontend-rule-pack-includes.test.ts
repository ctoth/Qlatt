import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";

function asYamlPath(path: string): string {
  return path.replace(/\\/g, "/");
}

describe("declarative frontend rule-pack includes", () => {
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
