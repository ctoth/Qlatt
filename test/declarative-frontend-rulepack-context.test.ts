import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend/adapter";

describe("declarative frontend rulepack context migration", () => {
  it("applies K-context F2 to K_CL and copies to K_REL", () => {
    const sequence = [
      {
        phoneme: "K_CL",
        type: "stop_closure",
        params: { F2: 1500 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "K_REL",
        type: "stop_release",
        params: { F2: 1500 },
        duration: 25,
        inherentDuration: 25,
      },
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        params: { F2: 1950, AV: 58 },
        duration: 80,
        inherentDuration: 80,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].params.F2).toBe(1900);
    expect(out[1].params.F2).toBe(1900);
  });

  it("defaults K-context F2 to 1500 when no following vowel exists", () => {
    const sequence = [
      {
        phoneme: "K_CL",
        type: "stop_closure",
        params: { F2: 1700 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: { F2: 1500 },
        punctuationSymbol: ".",
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].params.F2).toBe(1500);
  });

  it("applies punctuation pause durations declaratively", () => {
    const sequence = [
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        punctuationSymbol: ",",
        duration: 90,
        inherentDuration: 90,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        punctuationSymbol: "?",
        duration: 90,
        inherentDuration: 90,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].duration).toBe(150);
    expect(out[1].duration).toBe(300);
  });

  it("assigns SW declaratively and respects explicit inventory SW overrides", () => {
    const sequence = [
      {
        phoneme: "S",
        type: "fricative",
        params: { SW: 0 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "AA",
        type: "vowel",
        params: { SW: 1 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "HH",
        type: "fricative",
        inventorySW: 0,
        params: { SW: 1 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "T_REL",
        type: "stop_release",
        params: { SW: 0 },
        duration: 25,
        inherentDuration: 25,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].params.SW).toBe(1);
    expect(out[1].params.SW).toBe(0);
    expect(out[2].params.SW).toBe(0);
    expect(out[3].params.SW).toBe(1);
  });

  it("locks stop release/aspiration durations to inherent targets declaratively", () => {
    const sequence = [
      {
        phoneme: "K_REL",
        type: "stop_release",
        params: {},
        duration: 40,
        inherentDuration: 25,
      },
      {
        phoneme: "K_ASP",
        type: "stop_aspiration",
        params: {},
        duration: 70,
        inherentDuration: 48,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].duration).toBe(25);
    expect(out[1].duration).toBe(48);
  });
});
