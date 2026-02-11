import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { endOrder, startOrder } from "./utils/order-marks";

describe("declarative frontend finalize dirty guard", () => {
  it("throws E_FINALIZE_DIRTY when structural rewrites run after finalize", () => {
    const s0 = startOrder();
    const s1 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        suppress_after_finalize: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          suppress: true,
        },
      },
      phases: [
        { name: "finalize", rules: [], compute_times: true },
        { name: "late_rewrite", after: ["finalize"], rules: ["suppress_after_finalize"] },
      ],
    };

    const input = [
      { id: "p1", stream: "phone", duration: 100, sync_left: s0, sync_right: s1, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrowError(/E_FINALIZE_DIRTY/);
  });

  it("allows scalar-only apply rules after finalize", () => {
    const s0 = startOrder();
    const s1 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        late_scalar: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          apply: [{ field: "duration", op: "add", value: "5", tag: "late" }],
        },
      },
      phases: [
        { name: "finalize", rules: [], compute_times: true },
        { name: "late_scalar_phase", after: ["finalize"], rules: ["late_scalar"] },
      ],
    };

    const input = [
      { id: "p1", stream: "phone", duration: 100, sync_left: s0, sync_right: s1, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(105);
  });
});
