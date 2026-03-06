import { describe, expect, it } from "vitest";
import {
  evaluateCheck,
  matchesWhen,
  createCheckState,
  updateParamRange,
} from "../../src/harness-diagnostics/check-evaluator";
import type {
  CheckDef,
  TrackEvent,
  WhenClause,
} from "../../src/harness-diagnostics/types";
import type { TimingSnapshot } from "../../src/harness-diagnostics/timing-context";

function makeSnapshot(overrides: Partial<TimingSnapshot> = {}): TimingSnapshot {
  return {
    relTime: 0.5,
    event: {
      time: 0.3,
      phoneme: "AH",
      params: { SW: 0, AV: 60, AVS: 0, F0: 120 },
    },
    eventIndex: 1,
    inWindow: true,
    inGuard: false,
    trackEnd: 1.0,
    ...overrides,
  };
}

describe("matchesWhen", () => {
  // 1. when undefined → true
  it("undefined when → always matches", () => {
    const snap = makeSnapshot();
    expect(matchesWhen(undefined, snap)).toBe(true);
  });

  // 2. when: { SW: 1 } with event SW=1 → true
  it("SW=1 matches event with SW=1", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: { SW: 1 } },
    });
    expect(matchesWhen({ SW: 1 }, snap)).toBe(true);
  });

  // 3. when: { SW: 1 } with event SW=0 → false
  it("SW=1 does not match event with SW=0", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: { SW: 0 } },
    });
    expect(matchesWhen({ SW: 1 }, snap)).toBe(false);
  });

  // 4. when: { phoneme: "IY*" } matches event phoneme "IY1" → true
  it("phoneme glob IY* matches IY1", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "IY1", params: {} },
    });
    expect(matchesWhen({ phoneme: "IY*" }, snap)).toBe(true);
  });

  // 5. when: { phoneme: "IY*" } does not match "AH" → false
  it("phoneme glob IY* does not match AH", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: {} },
    });
    expect(matchesWhen({ phoneme: "IY*" }, snap)).toBe(false);
  });

  // 6. when: { phoneme: "AH" } exact match "AH" → true
  it("phoneme exact match AH", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: {} },
    });
    expect(matchesWhen({ phoneme: "AH" }, snap)).toBe(true);
  });

  // 7. when: { voiced: true } with AV=60 → true
  it("voiced=true matches when AV > 0", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: { AV: 60, AVS: 0 } },
    });
    expect(matchesWhen({ voiced: true }, snap)).toBe(true);
  });

  // 8. when: { voiced: true } with AV=0, AVS=0 → false
  it("voiced=true does not match when AV=0 and AVS=0", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: { AV: 0, AVS: 0 } },
    });
    expect(matchesWhen({ voiced: true }, snap)).toBe(false);
  });

  // 9. when: { voiced: true } with AV=0, AVS=50 → true
  it("voiced=true matches when AVS > 0", () => {
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: { AV: 0, AVS: 50 } },
    });
    expect(matchesWhen({ voiced: true }, snap)).toBe(true);
  });

  // 10. Null event → false (except when undefined)
  it("null event → false for any when clause", () => {
    const snap = makeSnapshot({ event: null });
    expect(matchesWhen({ SW: 0 }, snap)).toBe(false);
    expect(matchesWhen({ phoneme: "AH" }, snap)).toBe(false);
    expect(matchesWhen({ voiced: true }, snap)).toBe(false);
  });
});

describe("evaluateCheck", () => {
  const baseDef: CheckDef = {
    tap: "output",
    measure: "rms",
    assert: { min: 0.01 },
    severity: "warn",
    message: "RMS too low",
  };

  // 11. rms=0.005 with assert.min=0.01, severity=warn → status='warn', value=0.005
  it("rms below min → warn status", () => {
    const snap = makeSnapshot();
    const measurements = new Map([["output", 0.005]]);
    const state = createCheckState();
    const result = evaluateCheck("rms_check", baseDef, measurements, snap, state, 0);
    expect(result.status).toBe("warn");
    expect(result.value).toBeCloseTo(0.005);
  });

  // 12. peak=0.8 with assert.max=1.0 → status='pass'
  it("peak within max → pass", () => {
    const def: CheckDef = {
      tap: "output",
      measure: "peak",
      assert: { max: 1.0 },
      severity: "error",
      message: "Peak too high",
    };
    const snap = makeSnapshot();
    const measurements = new Map([["output", 0.8]]);
    const state = createCheckState();
    const result = evaluateCheck("peak_check", def, measurements, snap, state, 0);
    expect(result.status).toBe("pass");
  });

  // 13. inGuard=true → status='skip'
  it("inGuard → skip", () => {
    const snap = makeSnapshot({ inGuard: true });
    const measurements = new Map([["output", 0.005]]);
    const state = createCheckState();
    const result = evaluateCheck("rms_check", baseDef, measurements, snap, state, 0);
    expect(result.status).toBe("skip");
  });

  // 14. inWindow=false → status='skip'
  it("not inWindow → skip", () => {
    const snap = makeSnapshot({ inWindow: false });
    const measurements = new Map([["output", 0.005]]);
    const state = createCheckState();
    const result = evaluateCheck("rms_check", baseDef, measurements, snap, state, 0);
    expect(result.status).toBe("skip");
  });

  // 15. when doesn't match → status='skip'
  it("when clause mismatch → skip", () => {
    const def: CheckDef = {
      ...baseDef,
      when: { SW: 1 },
    };
    const snap = makeSnapshot({
      event: { time: 0.3, phoneme: "AH", params: { SW: 0 } },
    });
    const measurements = new Map([["output", 0.005]]);
    const state = createCheckState();
    const result = evaluateCheck("rms_check", def, measurements, snap, state, 0);
    expect(result.status).toBe("skip");
  });

  // 16. collect: true with cooldown, two rapid failures → only first collected
  it("collect with cooldown — rapid failures collect only first", () => {
    const def: CheckDef = {
      ...baseDef,
      collect: true,
      cooldown_ms: 100,
      max_collected: 10,
    };
    const snap = makeSnapshot();
    const measurements = new Map([["output", 0.005]]);
    const state = createCheckState();

    // First evaluation at t=0
    evaluateCheck("rms_check", def, measurements, snap, state, 0);
    expect(state.collected.length).toBe(1);

    // Second at t=50ms — within cooldown
    evaluateCheck("rms_check", def, measurements, snap, state, 50);
    expect(state.collected.length).toBe(1);
  });

  // 17. collect: true, cooldown elapsed → second event collected too
  it("collect with cooldown elapsed — second event collected", () => {
    const def: CheckDef = {
      ...baseDef,
      collect: true,
      cooldown_ms: 100,
      max_collected: 10,
    };
    const snap = makeSnapshot();
    const measurements = new Map([["output", 0.005]]);
    const state = createCheckState();

    // First at t=0
    evaluateCheck("rms_check", def, measurements, snap, state, 0);
    expect(state.collected.length).toBe(1);

    // Second at t=200ms — past cooldown
    evaluateCheck("rms_check", def, measurements, snap, state, 200);
    expect(state.collected.length).toBe(2);
  });

  // 18/19. param_range checks
  it("param_range: range >= range_min → pass", () => {
    const def: CheckDef = {
      type: "param_range",
      param: "F0",
      assert: { range_min: 80 },
      severity: "error",
      message: "F0 range too narrow",
    };
    const snap = makeSnapshot();
    const state = createCheckState();
    state.paramRange = { min: 100, max: 200 }; // range = 100 >= 80
    const result = evaluateCheck("f0_range", def, new Map(), snap, state, 0);
    expect(result.status).toBe("pass");
  });

  it("param_range: range < range_min → fail", () => {
    const def: CheckDef = {
      type: "param_range",
      param: "F0",
      assert: { range_min: 80 },
      severity: "error",
      message: "F0 range too narrow",
    };
    const snap = makeSnapshot();
    const state = createCheckState();
    state.paramRange = { min: 100, max: 120 }; // range = 20 < 80
    const result = evaluateCheck("f0_range", def, new Map(), snap, state, 0);
    expect(result.status).toBe("fail");
  });

  // 20. rms_ratio_db with two taps
  it("rms_ratio_db: ratio exceeds max → fail", () => {
    const def: CheckDef = {
      taps: ["a", "b"],
      measure: "rms_ratio_db",
      assert: { max: 20 },
      severity: "error",
      message: "Ratio too high",
    };
    const snap = makeSnapshot();
    const measurements = new Map([
      ["a", 0.1],
      ["b", 0.001],
    ]);
    const state = createCheckState();
    const result = evaluateCheck("ratio_check", def, measurements, snap, state, 0);
    // 20 * log10(0.1 / 0.001) = 20 * log10(100) = 40 dB > 20
    expect(result.status).toBe("fail");
    expect(result.value).toBeCloseTo(40);
  });
});

describe("updateParamRange", () => {
  it("tracks min and max across events", () => {
    const state = createCheckState();
    const track: TrackEvent[] = [
      { time: 0, params: { F0: 100 } },
      { time: 0.1, params: { F0: 150 } },
      { time: 0.2, params: { F0: 80 } },
      { time: 0.3, params: { F0: 200 } },
    ];
    updateParamRange(state, "F0", track);
    expect(state.paramRange).not.toBeNull();
    expect(state.paramRange!.min).toBe(80);
    expect(state.paramRange!.max).toBe(200);
  });

  it("handles empty track", () => {
    const state = createCheckState();
    updateParamRange(state, "F0", []);
    expect(state.paramRange).toBeNull();
  });

  it("handles missing param gracefully", () => {
    const state = createCheckState();
    const track: TrackEvent[] = [
      { time: 0, params: { AV: 60 } },
    ];
    updateParamRange(state, "F0", track);
    // No F0 in params — paramRange stays null
    expect(state.paramRange).toBeNull();
  });
});
