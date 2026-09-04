import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runExportListeningManifest } from "../scripts/export-listening-ab-manifest";

function runCli(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runExportListeningManifest(args, {
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  });
  return {
    code,
    stdout: stdout.join(""),
    stderr: stderr.join(""),
  };
}

describe("export listening ab manifest", () => {
  it("writes paired A/B manifest entries from corpus", () => {
    const outPath = path.resolve("tmp", "listening-ab-test.json");
    try {
      const result = runCli([
        "--corpus",
        "test/phrase-sets/linguistic.json",
        "--out",
        outPath,
        "--a-root",
        "renders/baseline",
        "--b-root",
        "renders/candidate",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("wrote");

      const payload = JSON.parse(readFileSync(outPath, "utf8"));
      expect(Array.isArray(payload.items)).toBe(true);
      expect(payload.items.length).toBeGreaterThan(0);
      expect(payload.items[0].a.audioPath).toContain("renders/baseline/");
      expect(payload.items[0].b.audioPath).toContain("renders/candidate/");
    } finally {
      rmSync(outPath, { force: true });
    }
  });

  it("returns code 1 when corpus has no phrases", () => {
    const tmpDir = path.resolve("tmp");
    const tmpCorpus = path.join(tmpDir, "listening-empty.json");
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(tmpCorpus, JSON.stringify({ name: "empty", phrases: [] }), "utf8");
    try {
      const result = runCli(["--corpus", tmpCorpus]);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("No phrases found");
    } finally {
      rmSync(tmpCorpus, { force: true });
    }
  });
});
