import { describe, expect, it } from "vitest";
import { runExplainCli } from "../scripts/explain-phrase";

async function runCli(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runExplainCli(args, {
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  });
  return {
    code,
    stdout: stdout.join(""),
    stderr: stderr.join(""),
  };
}

describe("explain phrase cli", () => {
  it("supports stage + range filtering in json output", async () => {
    const result = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--stage",
      "transcribe",
      "--range",
      "seq:1-4",
    ]);

    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.rangeApplied).toBe("seq:1-4");
    expect(payload.summary.decisionCount).toBe(4);
    expect(payload.decisions.every((decision: any) => decision.stage === "transcribe")).toBe(true);
  });

  it("supports subject exact and prefix filters", async () => {
    const exact = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--subject",
      "word:hello",
    ]);
    expect(exact.code).toBe(0);
    const exactPayload = JSON.parse(exact.stdout);
    expect(exactPayload.decisions.length).toBe(1);
    expect(exactPayload.decisions[0].subject).toBe("word:hello");

    const prefix = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--subject",
      "token:0*",
    ]);
    expect(prefix.code).toBe(0);
    const prefixPayload = JSON.parse(prefix.stdout);
    expect(prefixPayload.decisions.length).toBeGreaterThan(0);
    expect(prefixPayload.decisions.every((decision: any) => decision.subject.startsWith("token:0"))).toBe(true);
  });

  it("supports why ancestry chain output", async () => {
    const result = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--why",
      "d000003",
    ]);

    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.whyDecisionId).toBe("d000003");
    expect(payload.decisions.map((decision: any) => decision.id)).toEqual(["d000001", "d000003"]);
  });

  it("links rule decisions to transcribe ancestry in why output", async () => {
    const explain = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
    ]);
    expect(explain.code).toBe(0);
    const explainPayload = JSON.parse(explain.stdout);
    const rewrite = explainPayload.decisions.find(
      (decision: any) =>
        decision.type === "rule_rewrite_applied" && typeof decision.subject === "string" &&
        decision.subject.startsWith("token:")
    );
    expect(rewrite).toBeTruthy();

    const why = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--why",
      rewrite.id,
    ]);
    expect(why.code).toBe(0);
    const whyPayload = JSON.parse(why.stdout);
    expect(whyPayload.decisions.length).toBeGreaterThan(1);
    expect(whyPayload.decisions.some((decision: any) => decision.stage === "transcribe")).toBe(true);
  });

  it("uses diagnostic symbol pronunciation for explicit segment lists", async () => {
    const result = await runCli([
      "--phrase",
      "S, f, sh, th, z, v, zh, dh.",
      "--format",
      "json",
      "--stage",
      "transcribe",
    ]);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    const symbolDecisions = payload.decisions.filter(
      (decision: any) => decision.type === "symbol_pronunciation_selected"
    );
    expect(symbolDecisions.length).toBe(8);
    expect(payload.decisions.some((decision: any) => decision.type === "fallback_pronunciation_selected")).toBe(false);
  });

  it("passes strict-citations for current transcribe/rules provenance", async () => {
    const result = await runCli([
      "--phrase",
      "hello world",
      "--strict-citations",
      "--format",
      "json",
      "--range",
      "seq:1-10",
    ]);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.summary.uncitedCount).toBe(0);
  });

  it("returns code 1 for invalid range syntax", async () => {
    const result = await runCli([
      "--phrase",
      "hello world",
      "--range",
      "seq:",
    ]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Range body is empty");
  });
});
