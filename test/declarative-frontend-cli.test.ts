import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runTtsDslCli } from "../scripts/tts-dsl";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

async function runCli(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runTtsDslCli(args, {
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
    readStdin: () => "",
  });
  return {
    code,
    stdout: stdout.join(""),
    stderr: stderr.join(""),
  };
}

describe("declarative frontend CLI contracts", () => {
  it("supports validate/run/explain/why-not/diff with stable JSON schemas", async () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const dir = mkdtempSync(join(tmpdir(), "qlatt-cli-"));
    const specPath = join(dir, "spec.json");
    const inputPath = join(dir, "input.json");
    const tracePath = join(dir, "trace.json");

    const spec = {
      relations: {
        phone: {
          type: "base",
          scalars: {
            duration: { min: 10, max: 500 },
          },
        },
      },
      rules: {
        stretch: {
          select: { relation: "phone", where: "current.id == 'p1'" },
          apply: [{ field: "duration", op: "mul", value: "2" }],
        },
        never: {
          select: { relation: "phone", where: "current.id == 'missing'" },
          apply: [{ field: "duration", op: "set", value: "1" }],
        },
      },
      phases: [{ name: "duration", rules: ["stretch", "never"] }],
    };

    const input = [
      { id: "p1", relation: "phone", duration: 100, sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", relation: "phone", duration: 80, sync_left: s1, sync_right: s2, status: 1 },
    ];

    writeFileSync(specPath, JSON.stringify(spec, null, 2), "utf8");
    writeFileSync(inputPath, JSON.stringify(input, null, 2), "utf8");

    const validateResult = await runCli(["validate", "--spec", specPath, "--format", "json"]);
    expect(validateResult.code).toBe(0);
    const validateOut = JSON.parse(validateResult.stdout);
    expect(validateOut.valid).toBe(true);
    expect(Array.isArray(validateOut.diagnostics)).toBe(true);

    const runResult = await runCli([
        "run",
        inputPath,
        "--spec",
        specPath,
        "--format",
        "json",
        "--trace",
        tracePath,
      ]);
    expect(runResult.code).toBe(0);
    const runOut = JSON.parse(runResult.stdout);
    expect(Array.isArray(runOut)).toBe(true);
    expect(runOut.find((token: any) => token.id === "p1")?.duration).toBe(200);

    const trace = JSON.parse(readFileSync(tracePath, "utf8"));
    const eventTypes = new Set(trace.map((event: any) => event.type));
    expect(eventTypes.has("phase_start")).toBe(true);
    expect(eventTypes.has("rule_start")).toBe(true);
    expect(eventTypes.has("match")).toBe(true);
    expect(eventTypes.has("rewrite")).toBe(true);

    const explainResult = await runCli([
        "explain",
        inputPath,
        "--spec",
        specPath,
        "--token",
        "p1",
        "--field",
        "duration",
        "--format",
        "json",
      ]);
    expect(explainResult.code).toBe(0);
    const explainOut = JSON.parse(explainResult.stdout);
    expect(explainOut.token).toBe("p1");
    expect(explainOut.field).toBe("duration");
    expect(explainOut.value).toBe(200);
    expect(Array.isArray(explainOut.changes)).toBe(true);
    expect(explainOut.changes.length).toBeGreaterThan(0);

    const whyNotResult = await runCli([
        "why-not",
        inputPath,
        "--spec",
        specPath,
        "--rule",
        "never",
        "--token",
        "p1",
        "--format",
        "json",
      ]);
    expect(whyNotResult.code).toBe(0);
    const whyNotOut = JSON.parse(whyNotResult.stdout);
    expect(whyNotOut.rule).toBe("never");
    expect(whyNotOut.fired).toBe(false);
    expect(typeof whyNotOut.reason).toBe("string");

    const diffResult = await runCli([
        "diff",
        inputPath,
        "--spec",
        specPath,
        "--from",
        "init",
        "--to",
        "duration",
        "--format",
        "json",
      ]);
    expect(diffResult.code).toBe(0);
    const diffOut = JSON.parse(diffResult.stdout);
    expect(diffOut.from).toBe("init");
    expect(diffOut.to).toBe("duration");
    expect(Array.isArray(diffOut.modified)).toBe(true);
    expect(diffOut.modified.some((entry: any) => entry.key === "p1")).toBe(true);
  });
});
