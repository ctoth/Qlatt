import { describe, expect, it } from "vitest";
import { runTtsDslCli } from "../scripts/tts-dsl";

async function runCli(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runTtsDslCli(args, {
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  });
  return { code, stdout: stdout.join(""), stderr: stderr.join("") };
}

describe("graph-native tts-dsl CLI", () => {
  it("returns one-run phase checkpoints with verified replay", async () => {
    const result = await runCli(["phases", "--phrase", "hello world"]);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.checkpoints.length).toBeGreaterThan(0);
    expect(payload.checkpoints.some(
      (checkpoint: { phase: string; boundary: string }) =>
        checkpoint.phase === "duration" && checkpoint.boundary === "before",
    )).toBe(true);
    expect(payload.replay.matches).toBe(true);
    expect(payload.replay.replayDigest).toBe(payload.replay.originalDigest);
  });

  it("explains a field from its versioned graph writes", async () => {
    const result = await runCli([
      "field",
      "--phrase",
      "hello world",
      "--item",
      "segment_0",
      "--field",
      "duration",
    ]);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.field.itemId).toBe("segment_0");
    expect(payload.field.key).toBe("duration");
    expect(payload.field.history.length).toBeGreaterThan(0);
    expect(payload.field.history.every(
      (write: { decisionId?: string; citations?: string[] }) =>
        typeof write.decisionId === "string" && (write.citations?.length ?? 0) > 0,
    )).toBe(true);
  });

  it("names the exact failed select condition for why-not", async () => {
    const result = await runCli([
      "why-not",
      "--phrase",
      "hello world",
      "--rule",
      "the_prevocalic_reduction",
      "--item",
      "segment_0",
    ]);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.whyNot.status).toBe("not_fired");
    expect(payload.whyNot.attempts).toHaveLength(1);
    expect(payload.whyNot.attempts[0].status).toBe("select_where_failed");
    expect(payload.whyNot.attempts[0].evidence.kind).toBe("expression");
    expect(payload.whyNot.attempts[0].evidence.expression).toContain("current.phoneme == 'AH'");
    expect(payload.whyNot.attempts[0].evidence.value).toBe(false);
  });
});
