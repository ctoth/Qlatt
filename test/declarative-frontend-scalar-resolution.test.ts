import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend scalar resolution", () => {
  it("resolves standard scalar effects in rule order with min/max clamp", () => {
    const spec = {
      streams: {
        phone: {
          type: "base",
          scalars: {
            energy: { min: 0, max: 10 },
          },
        },
      },
      rules: {
        set_energy: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "energy", op: "set", value: "4", tag: "set" }],
        },
        mul_energy: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "energy", op: "mul", value: "2", tag: "mul" }],
        },
        add_energy: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "energy", op: "add", value: "-1", tag: "add" }],
        },
      },
      phases: [{ name: "duration", rules: ["set_energy", "mul_energy", "add_energy"] }],
    };

    const input = [{ id: "p1", stream: "phone", energy: 1, status: 1 }];
    const result = runRuleEngine(input, spec);
    const out = result.sequence;

    expect(out[0].energy).toBe(7);
    expect(
      result.trace.some(
        (event) =>
          event.type === "scalars_resolved" &&
          event.phase === "duration" &&
          Array.isArray(event.fields) &&
          event.fields.includes("energy")
      )
    ).toBe(true);
  });

  it("resolves klatt duration with incompressible floor and clamp", () => {
    const spec = {
      streams: {
        phone: {
          type: "base",
          scalars: {
            duration: { resolution: "klatt", max: 300 },
          },
        },
      },
      parameters: {
        policy: {
          duration: {
            incompressibility_ratio_vowel: 0.42,
            incompressibility_ratio_consonant: 0.6,
            test_multiplier: 0.5,
            test_offset_ms: -100,
          },
        },
      },
      rules: {
        half_duration: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "mul", value: "params.policy.duration.test_multiplier", tag: "mul" }],
        },
        subtract_duration: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "add", value: "params.policy.duration.test_offset_ms", tag: "add" }],
        },
      },
      phases: [
        {
          name: "duration",
          rules: ["half_duration", "subtract_duration"],
          resolve_scalars: ["duration"],
        },
      ],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        type: "vowel",
        duration: 100,
        inherentDuration: 100,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(42);
  });
});
