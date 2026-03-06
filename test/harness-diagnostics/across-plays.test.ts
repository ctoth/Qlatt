import { describe, expect, it } from "vitest";
import {
  AcrossPlaysAccumulator,
} from "../../src/harness-diagnostics/across-plays";

describe("AcrossPlaysAccumulator", () => {
  it("identical plays pass with CV=0", () => {
    const acc = new AcrossPlaysAccumulator();
    acc.register("leak", 3);
    acc.record("leak", 1.0);
    acc.record("leak", 1.0);
    acc.record("leak", 1.0);
    const result = acc.getResult("leak");
    expect(result).not.toBeNull();
    expect(result!.ready).toBe(true);
    expect(result!.cv).toBe(0);
    expect(result!.values).toEqual([1.0, 1.0, 1.0]);
  });

  it("varying plays produce CV > 0.05", () => {
    const acc = new AcrossPlaysAccumulator();
    acc.register("leak", 3);
    acc.record("leak", 2.1);
    acc.record("leak", 0.8);
    acc.record("leak", 0.42);
    const result = acc.getResult("leak");
    expect(result).not.toBeNull();
    expect(result!.ready).toBe(true);
    expect(result!.cv).not.toBeNull();
    expect(result!.cv!).toBeGreaterThan(0.05);
  });

  it("not enough plays returns ready=false, cv=null", () => {
    const acc = new AcrossPlaysAccumulator();
    acc.register("leak", 3);
    acc.record("leak", 1.0);
    acc.record("leak", 2.0);
    const result = acc.getResult("leak");
    expect(result).not.toBeNull();
    expect(result!.ready).toBe(false);
    expect(result!.cv).toBeNull();
  });

  it("unregistered check returns null", () => {
    const acc = new AcrossPlaysAccumulator();
    expect(acc.getResult("unknown")).toBeNull();
  });

  it("reset clears all accumulators", () => {
    const acc = new AcrossPlaysAccumulator();
    acc.register("leak", 3);
    acc.record("leak", 1.0);
    acc.record("leak", 2.0);
    acc.reset();
    const result = acc.getResult("leak");
    // After reset, registration is gone — returns null
    expect(result).toBeNull();
  });

  it("zero mean with all zeros returns CV=0", () => {
    const acc = new AcrossPlaysAccumulator();
    acc.register("leak", 3);
    acc.record("leak", 0);
    acc.record("leak", 0);
    acc.record("leak", 0);
    const result = acc.getResult("leak");
    expect(result).not.toBeNull();
    expect(result!.ready).toBe(true);
    expect(result!.cv).toBe(0);
  });

  it("single play needed returns ready=true, cv=0", () => {
    const acc = new AcrossPlaysAccumulator();
    acc.register("x", 1);
    acc.record("x", 42);
    const result = acc.getResult("x");
    expect(result).not.toBeNull();
    expect(result!.ready).toBe(true);
    expect(result!.cv).toBe(0);
  });
});
