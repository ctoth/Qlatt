import { describe, expect, it, vi, afterAll } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { buildPhaseSnapshots, explainField, whyNotRule } from "../src/declarative-frontend";

const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warnSpy.mockRestore());

describe("debug duration rules", () => {
  it("check why pre_boundary_lengthening does not modify duration", () => {
    const token = {
      phoneme: "N",
      type: "nasal",
      stress: 0,
      word: "man",
      params: { F1: 300, F2: 1500, AV: 60 },
      duration: 100,
      inherentDuration: 100,
      stream: "phone",
      status: 1,
      breakIndex: 4,
      isAccented: false,
      isNuclearAccent: false,
      isFunctionWord: false,
      isContentWord: true,
    };
    const sil = {
      phoneme: "SIL",
      type: "silence",
      word: ".",
      punctuationSymbol: ".",
      params: {},
      duration: 300,
      inherentDuration: 300,
      stream: "phone",
      status: 1,
      breakIndex: 4,
    };

    // Use whyNotRule to see why the rule doesn't match
    try {
      const why = whyNotRule([token, sil], "pre_boundary_lengthening", { phases: ["duration"] });
      console.log("whyNotRule:", JSON.stringify(why).slice(0, 500));
    } catch(e) {
      console.log("whyNotRule error:", (e as Error).message);
    }

    // Use explainField to trace duration
    try {
      const explain = explainField([token, sil], 0, "duration", { phases: ["duration"] });
      console.log("explainField:", JSON.stringify(explain).slice(0, 500));
    } catch(e) {
      console.log("explainField error:", (e as Error).message);
    }

    // Use buildPhaseSnapshots
    try {
      const snapshots = buildPhaseSnapshots([token, sil], { phases: ["duration"] });
      console.log("snapshots phases:", Object.keys(snapshots));
      for (const [phase, snap] of Object.entries(snapshots)) {
        const tokens = snap as any[];
        const nTok = tokens.find((t: any) => t.phoneme === "N");
        if (nTok) {
          console.log(`After ${phase}: N duration=${nTok.duration}, breakIndex=${nTok.breakIndex}`);
        }
      }
    } catch(e) {
      console.log("snapshots error:", (e as Error).message);
    }

    expect(true).toBe(true);
  });

  it("check if the rule select condition matches the token", () => {
    // The select is: current.phoneme != 'SIL'
    // Our token has phoneme: 'N', so this should match.
    // Let's check if the issue is in the define/dispatch logic.

    // Try running with a simpler rule to see if the engine processes tokens at all
    const token = {
      phoneme: "N",
      type: "nasal",
      stress: 0,
      word: "man",
      params: { F1: 300, F2: 1500, AV: 60 },
      duration: 100,
      inherentDuration: 100,
      stream: "phone",
      status: 1,
      id: "ph_0",
    };

    // Test with speech_rate_scaling which has a simple constraint
    const result = runDeclarativeFrontend([token], {
      phases: ["duration"],
      parameters: { policy: { duration: { rate_scale: 2.0 } } },
    });

    const nTok = (result as any[]).find((t: any) => t.phoneme === "N" && t.status !== 2);
    console.log("N after rate_scale=2 duration:", nTok?.duration);
    // If rate_scale works, duration should be 100 * 0.5 = 50
    expect(nTok?.duration).toBeLessThan(100);
  });
});
