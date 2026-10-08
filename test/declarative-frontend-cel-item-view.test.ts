import { describe, expect, it } from "vitest";
import { evaluateExpression, ItemViewType } from "../src/declarative-frontend/cel-expressions";

/**
 * A live view of an Item is a Proxy. cel-js types a plain object as a map and
 * reads a map's first entry with `for (key in value)` on every operator and
 * call that has it as an operand; on a view that walks every feature through
 * the proxy's traps. A view that answers `constructor` with ItemViewType is
 * typed by that alone.
 */
function countingView(
  features: Record<string, unknown>,
  typed = true,
): {
  view: Record<string, unknown>;
  enumerations: () => number;
} {
  let enumerations = 0;
  const view = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "constructor") return typed ? ItemViewType : undefined;
        return typeof property === "string" ? features[property] : undefined;
      },
      has: (_target, property) => typeof property === "string" && property in features,
      ownKeys: () => {
        enumerations += 1;
        return Object.keys(features);
      },
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    },
  );
  return { view, enumerations: () => enumerations };
}

describe("Item views in CEL", () => {
  it("reads features, compares views by identity and passes them to functions", () => {
    const first = countingView({ phoneme: "AE", duration: 120 });
    const second = countingView({ phoneme: "AE", duration: 120 });
    const context = { current: first.view, next: second.view, same: first.view };
    expect(evaluateExpression("current.phoneme == 'AE' && current.duration > 100", context)).toBe(
      true,
    );
    expect(evaluateExpression("current == same", context)).toBe(true);
    expect(evaluateExpression("current == next", context)).toBe(false);
    expect(evaluateExpression("current != next", context)).toBe(true);
    expect(evaluateExpression("get(current, 'duration', 0) + 1", context)).toBe(121);
    expect(evaluateExpression("get(current, 'missing', 5)", context)).toBe(5);
    expect(evaluateExpression("current == null ? 0 : next.duration", context)).toBe(120);
    expect(evaluateExpression("[current, next].exists(v, v.phoneme == 'AE')", context)).toBe(true);
  });

  it("does not enumerate a view to type it", () => {
    const first = countingView({ phoneme: "AE", duration: 120 });
    const second = countingView({ phoneme: "T", duration: 60 });
    const context = { current: first.view, next: second.view };
    evaluateExpression(
      "current != next && get(current, 'duration', 0) > get(next, 'duration', 0) && current.phoneme != next.phoneme",
      context,
    );
    expect(first.enumerations() + second.enumerations()).toBe(0);

    // The control: the same view taken for a map is enumerated.
    const untyped = countingView({ phoneme: "AE", duration: 120 }, false);
    evaluateExpression("get(current, 'duration', 0) > 100", { current: untyped.view });
    expect(untyped.enumerations()).toBeGreaterThan(0);
  });

  it("still fails on a feature the view does not have", () => {
    const { view } = countingView({ phoneme: "AE" });
    expect(() => evaluateExpression("current.missing == 1", { current: view })).toThrow();
  });
});
