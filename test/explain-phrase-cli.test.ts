import { describe, expect, it, vi } from "vitest";
import { runExplainCli } from "../scripts/explain-phrase";
import {
  getRulepackValidationDiagnostics,
  loadBundledRulepackSpec,
  rulepackRuleDocumentSpans,
} from "../src/declarative-frontend/rule-pack";
import type { DecisionRecord } from "../src/provenance";
import * as frontend from "../src/tts-frontend";
import type { YamlDocumentSpan } from "../src/yaml-loader";

interface ExplainPayload {
  rangeApplied?: string;
  whyDecisionId?: string;
  summary: {
    decisionCount: number;
    uncitedCount: number;
  };
  decisions: DecisionRecord[];
  tooling: {
    ruleSources: Record<string, YamlDocumentSpan>;
    replay: { matches: boolean } | null;
  };
}

function parseExplainPayload(json: string): ExplainPayload {
  return JSON.parse(json) as ExplainPayload;
}

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
  it.each([
    "--verbose",
    "--strict-citations",
    "--phase-views",
    "--verify-replay",
    "--tooling-only",
  ])("keeps positional phrase words after %s", async (flag) => {
    const before = await runCli([flag, "hello", "world", "--format=json"]);
    const after = await runCli(["hello", "world", flag, "--format=json"]);
    expect(before.code).toBe(0);
    expect(after.code).toBe(0);
    expect(before.stdout).toBe(after.stdout);
  });

  it("keeps a phrase after strict and accepts explicit boolean values", async () => {
    const strict = await runCli(["--strict", "hello", "--format=json"]);
    expect(strict.code).toBe(2);
    expect(strict.stderr).toContain("strict failed: rulepack validation emitted");
    const disabled = await runCli(["--strict=false", "hello", "--format=json"]);
    expect(disabled.code).toBe(0);
    const enabled = await runCli(["--strict=true", "hello", "--format=json"]);
    expect(enabled.code).toBe(2);
    expect(enabled.stderr).toBe(strict.stderr);
  });

  it("preserves equals inside values and explicit phrase precedence", async () => {
    const spy = vi.spyOn(frontend, "textToKlattTrackDetailed");
    try {
      const equals = await runCli([
        "ignored",
        "--phrase=hello=world",
        "--format=json",
        "--stage=transcribe",
      ]);
      expect(equals.code).toBe(0);
      expect(spy.mock.calls[0][0]).toBe("hello=world");
      const spaced = await runCli([
        "--phrase",
        "hello=world",
        "--format",
        "json",
        "--stage",
        "transcribe",
      ]);
      expect(spaced.code).toBe(0);
      expect(equals.stdout).toBe(spaced.stdout);
    } finally {
      spy.mockRestore();
    }
  });

  it("supports stage + range filtering in json output", async () => {
    const result = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--stage",
      "transcribe",
      "--range",
      "seq:17-17",
    ]);

    expect(result.code).toBe(0);
    const payload = parseExplainPayload(result.stdout);
    expect(payload.rangeApplied).toBe("seq:17-17");
    expect(payload.summary.decisionCount).toBe(1);
    expect(payload.decisions.every((decision) => decision.stage === "transcribe")).toBe(true);
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
    const exactPayload = parseExplainPayload(exact.stdout);
    expect(exactPayload.decisions.length).toBe(1);
    expect(exactPayload.decisions[0].subject).toBe("word:hello");

    const prefix = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--subject",
      "item:segment_0*",
    ]);
    expect(prefix.code).toBe(0);
    const prefixPayload = parseExplainPayload(prefix.stdout);
    expect(prefixPayload.decisions.length).toBeGreaterThan(0);
    expect(
      prefixPayload.decisions.every((decision) => decision.subject.startsWith("item:segment_0")),
    ).toBe(true);
  });

  it("supports why ancestry chain output", async () => {
    const explain = await runCli(["--phrase", "hello world", "--format", "json"]);
    expect(explain.code).toBe(0);
    const inventory = parseExplainPayload(explain.stdout).decisions.find(
      (decision) => decision.stage === "frontend" && decision.type === "inventory_selected",
    );
    expect(inventory).toBeTruthy();
    if (!inventory) throw new Error("expected inventory selection decision");
    expect(inventory.parents ?? []).toEqual([]);
    const result = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--why",
      inventory.id,
    ]);

    expect(result.code).toBe(0);
    const payload = parseExplainPayload(result.stdout);
    expect(payload.whyDecisionId).toBe(inventory.id);
    expect(payload.decisions).toEqual([inventory]);
    expect(payload.tooling.ruleSources).toEqual({});
  });

  it("links rule decisions to transcribe ancestry in why output", async () => {
    const explain = await runCli(["--phrase", "hello world", "--format", "json"]);
    expect(explain.code).toBe(0);
    const explainPayload = parseExplainPayload(explain.stdout);
    const rewrite = explainPayload.decisions.find(
      (decision) =>
        decision.stage === "rules" &&
        decision.type === "feature_overwrite" &&
        typeof decision.subject === "string" &&
        decision.subject.startsWith("item:segment_"),
    );
    expect(rewrite).toBeTruthy();
    if (!rewrite) throw new Error("expected feature overwrite decision");

    const why = await runCli([
      "--phrase",
      "hello world",
      "--format",
      "json",
      "--why",
      rewrite.id,
      "--verify-replay",
    ]);
    expect(why.code).toBe(0);
    const whyPayload = parseExplainPayload(why.stdout);
    expect(whyPayload.decisions.length).toBeGreaterThan(1);
    expect(whyPayload.decisions.some((decision) => decision.stage === "transcribe")).toBe(true);
    expect(whyPayload.decisions.find((decision) => decision.id === rewrite.id)).toEqual(rewrite);
    expect(whyPayload.tooling.replay?.matches).toBe(true);
    const span = whyPayload.tooling.ruleSources[rewrite.id];
    expect(span).toBeDefined();
    expect(span.path[0]).toBe("rules");
    expect(span.path).toHaveLength(2);
    const declaration = rulepackRuleDocumentSpans(loadBundledRulepackSpec()).find(
      (entry) => entry.value.path.length === 2 && entry.value.path[1] === span.path[1],
    );
    expect(span).toEqual(declaration?.key);
    expect(whyPayload.tooling.ruleSources[rewrite.id]).toEqual(
      explainPayload.tooling.ruleSources[rewrite.id],
    );
    const selectedIds = new Set(whyPayload.decisions.map((decision) => decision.id));
    expect(Object.keys(whyPayload.tooling.ruleSources).every((id) => selectedIds.has(id))).toBe(true);
    const text = await runCli(["--phrase", "hello world", "--why", rewrite.id, "--verbose"]);
    expect(text.code).toBe(0);
    expect(text.stdout.split("\n").find((line) => line.startsWith(`#${rewrite.seq} `))).toContain(
      ` | rule: ${span.resource}:${span.line}:${span.column}`,
    );
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
    const payload = parseExplainPayload(result.stdout);
    const symbolDecisions = payload.decisions.filter(
      (decision) => decision.type === "symbol_pronunciation_selected",
    );
    expect(symbolDecisions.length).toBe(8);
    expect(
      payload.decisions.some((decision) => decision.type === "fallback_pronunciation_selected"),
    ).toBe(false);
  });

  it("passes strict-citations for a cited run while retaining the selected summary", async () => {
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
    const payload = parseExplainPayload(result.stdout);
    expect(payload.summary.uncitedCount).toBe(0);
  });

  it.each([
    { label: "stage", filters: ["--stage", "transcribe"] },
    { label: "range", filters: ["--range", "seq:1-1"] },
    { label: "empty window", filters: ["--subject", "fixture:no-such-subject"] },
    { label: "ancestry", filters: ["--why", "d000003"] },
  ])("checks hidden uncited decisions with $label selection", async ({ label, filters }) => {
    const original = frontend.textToKlattTrackDetailed;
    const spy = vi.spyOn(frontend, "textToKlattTrackDetailed").mockImplementation((...args) => {
      const detailed = original(...args);
      args[3]?.provenance?.add({
        stage: "runtime",
        type: "fixture_uncited",
        subject: "fixture:hidden",
        reason: "Uncited fixture decision outside the selected output",
        citations: [],
      });
      return detailed;
    });
    try {
      const args = ["--phrase", "hello world", "--format", "json", ...filters];
      const ordinary = await runCli(args);
      const strict = await runCli([...args, "--strict-citations"]);
      expect(ordinary.code).toBe(0);
      expect(strict.code).toBe(2);
      const payload = parseExplainPayload(strict.stdout);
      expect(payload.summary.uncitedCount).toBe(0);
      expect(payload.decisions.some((decision) => decision.type === "fixture_uncited")).toBe(false);
      expect(payload.decisions).toEqual(parseExplainPayload(ordinary.stdout).decisions);
      if (label === "empty window") expect(payload.decisions).toEqual([]);
      expect(strict.stderr).toContain("1 uncited decisions in full run");
      expect(strict.stderr).toContain("runtime=1");
      expect(strict.stderr).toContain("fixture_uncited=1");
    } finally {
      spy.mockRestore();
    }
  });

  it("prints rulepack warnings and fails them under --strict", async () => {
    const normal = await runCli(["--phrase", "hello", "--format", "json"]);
    expect(normal.code).toBe(0);
    expect(normal.stderr).toContain("rulepack warning W_");
    const warning = getRulepackValidationDiagnostics(loadBundledRulepackSpec()).find(
      (entry) => entry.path === "parameters.policy.rate.default",
    );
    expect(warning?.documentSpan).toBeDefined();
    const span = warning!.documentSpan!;
    expect(normal.stderr).toContain(` [${span.resource}:${span.line}:${span.column}]\n`);

    const strict = await runCli(["--phrase", "hello", "--format", "json", "--strict"]);
    expect(strict.code).toBe(2);
    expect(strict.stderr).toContain("strict failed: rulepack validation emitted");
  });

  it("renders citations without object coercion artifacts", async () => {
    const result = await runCli([
      "--phrase",
      'Well, they have older ones of course. But the current options actual users see is "Auto" or "Instant (5.3)" or "Thinking (5.4)". Not that complicated really.',
      "--stage",
      "rules",
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).not.toContain("[object Object]");
  });

  it("returns code 1 for invalid range syntax", async () => {
    const result = await runCli(["--phrase", "hello world", "--range", "seq:"]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Range body is empty");
  });
});
