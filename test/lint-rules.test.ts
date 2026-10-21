import { afterEach, describe, expect, it, vi } from "vitest";
import { runRuleLint } from "../scripts/lint-rules";
import * as rulepack from "../src/declarative-frontend/rule-pack";

function run(args: string[] = []) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runRuleLint(args, {
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  });
  return { code, stdout: stdout.join(""), stderr: stderr.join("") };
}

afterEach(() => vi.restoreAllMocks());

describe("rulepack lint", () => {
  it("prints stored warnings for every bundled frontend and makes strict mode fail", () => {
    const ordinary = run();
    expect(ordinary.code).toBe(0);
    expect(ordinary.stderr).toBe("");
    for (const id of rulepack.listBundledFrontendIds()) {
      const diagnostics = rulepack.getRulepackValidationDiagnostics(
        rulepack.loadBundledRulepackSpec(id),
      );
      expect(diagnostics.some((diagnostic) => diagnostic.severity === "warning")).toBe(true);
      for (const diagnostic of diagnostics) {
        expect(ordinary.stdout).toContain(
          `${id}: ${diagnostic.code} at ${diagnostic.path}: ${diagnostic.message}`,
        );
      }
    }
    expect(run(["--strict"]).code).toBe(2);
  });

  it("returns success for a clean validated rulepack in strict mode", () => {
    const spec = rulepack.compileRuleEngineSpec({ version: "v1", rules: {}, phases: [] });
    vi.spyOn(rulepack, "listBundledFrontendIds").mockReturnValue(["clean"]);
    vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue(spec);
    expect(run(["--strict"]).code).toBe(0);
  });

  it("reports a loader error and still inspects the remaining frontend", () => {
    const load = rulepack.loadBundledRulepackSpec;
    vi.spyOn(rulepack, "listBundledFrontendIds").mockReturnValue(["missing", "qlatt-beauty"]);
    vi.spyOn(rulepack, "loadBundledRulepackSpec").mockImplementation((id) => load(id));
    const result = run(["--strict"]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("missing:");
    expect(result.stdout).toContain("qlatt-beauty: W_");
  });

  it("rejects an unknown argument before loading frontends", () => {
    const load = vi.spyOn(rulepack, "loadBundledRulepackSpec");
    expect(run(["--strcit"]).code).toBe(1);
    expect(load).not.toHaveBeenCalled();
  });
});
