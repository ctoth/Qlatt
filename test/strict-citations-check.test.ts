import { describe, expect, it } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runStrictCitationsCheck } from "../scripts/check-strict-citations";

function runCli(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runStrictCitationsCheck(args, {
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  });
  return {
    code,
    stdout: stdout.join(""),
    stderr: stderr.join(""),
  };
}

describe("strict citations corpus check", () => {
  it("passes on a limited sample of the linguistic phrase set", () => {
    const result = runCli(["--corpus", "test/phrase-sets/linguistic.json", "--limit", "3"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("strict-citations passed");
  });

  it("returns code 1 for invalid args", () => {
    const result = runCli(["--limit", "0"]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Invalid --limit");
  });

  it("returns code 1 when corpus has no phrases", () => {
    const tmpDir = path.resolve("tmp");
    const tmpPath = path.join(tmpDir, "empty-phrase-corpus.json");
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(tmpPath, JSON.stringify({ name: "empty", phrases: [] }), "utf8");
    try {
      const result = runCli(["--corpus", tmpPath]);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("No phrases found");
    } finally {
      rmSync(tmpPath, { force: true });
    }
  });
});
