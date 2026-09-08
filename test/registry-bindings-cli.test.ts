import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];
const checker = resolve("scripts/check-registry-bindings.ts");

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(binding: Record<string, string | undefined>): string {
  const root = mkdtempSync(join(tmpdir(), "qlatt-bindings-"));
  roots.push(root);
  for (const directory of [
    "crates/filter/src",
    "src/worklets",
    "public/worklets",
    "public/experiments/test",
  ]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  writeFileSync(
    join(root, "Cargo.toml"),
    '[workspace]\nmembers = ["crates/filter"]\nresolver = "2"\n',
  );
  writeFileSync(
    join(root, "crates/filter/Cargo.toml"),
    '[package]\nname = "fixture-filter"\nversion = "0.1.0"\n[lib]\ncrate-type = ["cdylib"]\n',
  );
  writeFileSync(join(root, "crates/filter/src/lib.rs"), "");
  writeFileSync(
    join(root, "tsconfig.worklets.json"),
    JSON.stringify({
      compilerOptions: { rootDir: "src/worklets", outDir: "public/worklets" },
      include: ["src/worklets/*-processor.ts"],
    }),
  );
  writeFileSync(join(root, "src/worklets/live-processor.ts"), "export {};\n");
  writeFileSync(join(root, "src/worklets/excluded.ts"), "export {};\n");
  // Stale emitted files are deliberately present; producer availability owns validity.
  writeFileSync(join(root, "public/worklets/stale.wasm"), "stale");
  writeFileSync(join(root, "public/worklets/stale-processor.js"), "stale");
  writeFileSync(
    join(root, "public/experiments/test/registry.yaml"),
    JSON.stringify({ primitives: { filter: binding } }),
  );
  return root;
}

describe("registry binding CLI", () => {
  it("accepts workspace and TypeScript outputs before any artifacts are built", () => {
    const root = fixture({ wasm: "fixture-filter.wasm", worklet: "live-processor.js" });
    const result = spawnSync(process.execPath, ["--experimental-strip-types", checker], {
      cwd: root,
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.includes("Registry bindings match")).toBe(true);
  });

  it.each([{ wasm: "stale.wasm" }, { worklet: "stale-processor.js" }, { worklet: "excluded.js" }])(
    "fails for a file without a producer: %j",
    (binding) => {
      const root = fixture(binding);
      const result = spawnSync(process.execPath, ["--experimental-strip-types", checker], {
        cwd: root,
        encoding: "utf8",
        timeout: 20_000,
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr.includes("registry.yaml: filter:")).toBe(true);
      expect(result.stderr.includes("has no build producer")).toBe(true);
    },
  );
});
