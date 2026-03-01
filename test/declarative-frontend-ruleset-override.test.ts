import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import {
  DEFAULT_FRONTEND_ID,
  DEFAULT_RULEPACK_PATH,
  resolveBundledRulepackPath,
} from "../src/declarative-frontend/rule-pack";

describe("declarative frontend ruleset override", () => {
  it("runs against a caller-provided specSource instead of the default rulepack", () => {
    const customSpec = {
      version: "test-override",
      streams: {
        phone: {
          type: "base",
          scalars: {
            duration: { unit: "ms" },
          },
        },
      },
      phases: [
        {
          name: "duration",
          rules: ["double_duration"],
          resolve_scalars: ["duration"],
        },
      ],
      rules: {
        double_duration: {
          kind: "scalar",
          select: {
            stream: "phone",
            where: "true",
          },
          apply: [
            {
              field: "duration",
              op: "mul",
              value: "2",
              tag: "double",
            },
          ],
        },
      },
    };

    const input = [
      {
        id: "ph_0",
        stream: "phone",
        phoneme: "AA",
        duration: 50,
        params: {},
      },
    ];

    const out = runDeclarativeFrontend(input, {
      specSource: customSpec,
      phases: ["duration"],
    }) as Array<Record<string, unknown>>;

    expect(out[0].duration).toBe(100);
  });

  it("accepts a bundled frontendId override", () => {
    expect(resolveBundledRulepackPath(DEFAULT_FRONTEND_ID)).toBe(DEFAULT_RULEPACK_PATH);

    const input = [
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        inherentDuration: 100,
        params: { AV: 60, AVS: 0 },
      },
    ];

    const outDefault = runDeclarativeFrontend(input, {
      phases: ["duration"],
    }) as Array<Record<string, unknown>>;
    const outByFrontendId = runDeclarativeFrontend(input, {
      phases: ["duration"],
      frontendId: DEFAULT_FRONTEND_ID,
    }) as Array<Record<string, unknown>>;
    const outByPath = runDeclarativeFrontend(input, {
      phases: ["duration"],
      specPath: DEFAULT_RULEPACK_PATH,
    }) as Array<Record<string, unknown>>;

    expect(outByFrontendId).toEqual(outDefault);
    expect(outByPath).toEqual(outDefault);
  });
});
