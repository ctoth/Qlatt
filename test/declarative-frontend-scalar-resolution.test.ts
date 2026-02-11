import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend scalar resolution", () => {
  it("resolves standard scalar effects in rule order with min/max clamp", () => {
    const spec = {
      streams: {
        phone: {
          type: "base",
          scalars: {
            energy: { resolution: "standard", min: 0, max: 10 },
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
      phases: [
        {
          name: "duration",
          rules: ["set_energy", "mul_energy", "add_energy"],
          resolve_scalars: ["energy"],
        },
      ],
    };

    const input = [{ id: "p1", stream: "phone", energy: 1, status: 1 }];
    const out = runRuleEngine(input, spec).sequence;

    expect(out[0].energy).toBe(7);
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
      rules: {
        half_duration: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "mul", value: "0.5", tag: "mul" }],
        },
        subtract_duration: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "add", value: "-100", tag: "add" }],
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
