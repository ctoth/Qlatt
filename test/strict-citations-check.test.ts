import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runStrictCitationsCheck } from "../scripts/check-strict-citations";
import { listBundledFrontendIds } from "../src/declarative-frontend/rule-pack";
import * as frontend from "../src/tts-frontend";

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
  afterEach(() => vi.restoreAllMocks());

  it("passes on a limited sample of the linguistic phrase set", () => {
    const result = runCli(["--corpus", "test/phrase-sets/linguistic.json", "--limit", "3"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("strict-citations passed");
    for (const id of listBundledFrontendIds()) {
      expect(result.stdout).toContain(`${id}: checked 3 phrases`);
    }
  });

  it("defaults to the full corpus for every bundled frontend", () => {
    const phrases = JSON.parse(readFileSync("test/phrase-sets/linguistic.json", "utf8")).phrases;
    const synthesize = vi.spyOn(frontend, "textToKlattTrack").mockReturnValue([]);
    const result = runCli([]);
    expect(result.code).toBe(0);
    const ids = listBundledFrontendIds();
    expect(synthesize).toHaveBeenCalledTimes(phrases.length * ids.length);
    for (const id of ids) {
      expect(
        synthesize.mock.calls.filter((call) => call[3]?.frontendId === id).map((call) => call[0]),
      ).toEqual(phrases);
    }
  });

  it.each(["qlatt-beauty", "dectalk-english"])("selects only %s", (id) => {
    const synthesize = vi.spyOn(frontend, "textToKlattTrack");
    const result = runCli(["--frontend", id, "--limit", "1"]);
    expect(result.code).toBe(0);
    expect(synthesize).toHaveBeenCalledTimes(1);
    expect(synthesize.mock.calls[0][3]?.frontendId).toBe(id);
    expect(result.stdout).toContain(`${id}: checked 1 phrases`);
    expect(result.stdout).toContain("frontends=1");
  });

  it("reports an uncited normalization decision even when the final frames are unchanged", () => {
    const original = frontend.textToKlattTrack;
    vi.spyOn(frontend, "textToKlattTrack").mockImplementation((...args) => {
      const frames = original(...args);
      args[3]?.provenance?.add({
        stage: "transcribe",
        type: "fixture_normalization",
        subject: "fixture:hidden-source",
        reason: "Uncited normalization fixture, with no final frame change",
        citations: [],
      });
      return frames;
    });
    const result = runCli(["--frontend", "qlatt-beauty", "--limit", "1"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("qlatt-beauty |");
    expect(result.stderr).toContain("[transcribe] fixture_normalization fixture:hidden-source");
  });

  it("rejects an unknown frontend without synthesizing", () => {
    const synthesize = vi.spyOn(frontend, "textToKlattTrack");
    const result = runCli(["--frontend", "not-a-frontend"]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Invalid --frontend");
    expect(synthesize).not.toHaveBeenCalled();
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
