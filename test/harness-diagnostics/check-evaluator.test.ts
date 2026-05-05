import { describe, expect, it } from "vitest";
import {
  evaluateCheck,
  matchesWhen,
  matchesTrackSelect,
  evaluateTrackAnalysis,
  createCheckState,
  updateParamRange,
} from "../../src/harness-diagnostics/check-evaluator";
import type {
  CheckDef,
  TrackEvent,
  WhenClause,
  TrackAnalysisCheckDef,
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

  it("ignore_guard evaluates inside guard window", () => {
    const snap = makeSnapshot({ inGuard: true });
    const measurements = new Map([["output", 0.02]]);
    const state = createCheckState();
    const result = evaluateCheck(
      "rms_check",
      { ...baseDef, ignore_guard: true },
      measurements,
      snap,
      state,
      0,
    );
    expect(result.status).toBe("pass");
    expect(result.value).toBeCloseTo(0.02);
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
    expect(result.value).toBe(100);
    expect(result.valueLabel).toBe("range");
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
    expect(result.value).toBe(20);
    expect(result.valueLabel).toBe("range");
  });

  it("param_range: info failure preserves assertionFailed", () => {
    const def: CheckDef = {
      type: "param_range",
      param: "F0",
      assert: { range_min: 80 },
      severity: "info",
      message: "F0 range too narrow",
    };
    const snap = makeSnapshot();
    const state = createCheckState();
    state.paramRange = { min: 100, max: 120 };
    const result = evaluateCheck("f0_range", def, new Map(), snap, state, 0);
    expect(result.status).toBe("pass");
    expect(result.assertionFailed).toBe(true);
    expect(result.valueLabel).toBe("range");
  });

  it("param_range: max_min reports max instead of range", () => {
    const def: CheckDef = {
      type: "param_range",
      param: "F2",
      assert: { max_min: 2400 },
      severity: "warn",
      message: "F2 never reaches 2400 Hz",
    };
    const snap = makeSnapshot();
    const state = createCheckState();
    state.paramRange = { min: 610, max: 2322 };
    const result = evaluateCheck("f2_ceiling", def, new Map(), snap, state, 0);
    expect(result.status).toBe("warn");
    expect(result.value).toBe(2322);
    expect(result.valueLabel).toBe("max");
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

  it("ignores F0=0 when accumulating F0 range", () => {
    const state = createCheckState();
    const track: TrackEvent[] = [
      { time: 0, params: { F0: 0 } },
      { time: 0.1, params: { F0: 110 } },
      { time: 0.2, params: { F0: 180 } },
      { time: 0.3, params: { F0: 0 } },
    ];
    updateParamRange(state, "F0", track);
    expect(state.paramRange).not.toBeNull();
    expect(state.paramRange!.min).toBe(110);
    expect(state.paramRange!.max).toBe(180);
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

describe("matchesTrackSelect", () => {
  it("SW=1 + AF range matches frame with SW=1 and AF=55", () => {
    const frame: TrackEvent = {
      time: 0.1,
      phoneme: "S",
      params: { SW: 1, AF: 55 },
    };
    expect(matchesTrackSelect(frame, { SW: 1, AF: { min: 1 } })).toBe(true);
  });

  it("AF range rejects frame with AF=0", () => {
    const frame: TrackEvent = {
      time: 0.1,
      phoneme: "S",
      params: { SW: 1, AF: 0 },
    };
    expect(matchesTrackSelect(frame, { AF: { min: 1 } })).toBe(false);
  });

  it("phoneme glob *_REL matches K_REL and T_REL", () => {
    const kRel: TrackEvent = { time: 0.1, phoneme: "K_REL", params: {} };
    const tRel: TrackEvent = { time: 0.2, phoneme: "T_REL", params: {} };
    const kCl: TrackEvent = { time: 0.3, phoneme: "K_CL", params: {} };
    expect(matchesTrackSelect(kRel, { phoneme: "*_REL" })).toBe(true);
    expect(matchesTrackSelect(tRel, { phoneme: "*_REL" })).toBe(true);
    expect(matchesTrackSelect(kCl, { phoneme: "*_REL" })).toBe(false);
  });

  it("voiced=true matches when AV > 0", () => {
    const frame: TrackEvent = { time: 0.1, params: { AV: 60, AVS: 0 } };
    expect(matchesTrackSelect(frame, { voiced: true })).toBe(true);
  });

  it("voiced=true rejects when AV=0 and AVS=0", () => {
    const frame: TrackEvent = { time: 0.1, params: { AV: 0, AVS: 0 } };
    expect(matchesTrackSelect(frame, { voiced: true })).toBe(false);
  });

  it("exact numeric match works", () => {
    const frame: TrackEvent = { time: 0.1, params: { SW: 0 } };
    expect(matchesTrackSelect(frame, { SW: 0 })).toBe(true);
    expect(matchesTrackSelect(frame, { SW: 1 })).toBe(false);
  });

  it("max range filter works", () => {
    const frame: TrackEvent = { time: 0.1, params: { AH: 53 } };
    expect(matchesTrackSelect(frame, { AH: { max: 0 } })).toBe(false);
    expect(matchesTrackSelect(frame, { AH: { max: 60 } })).toBe(true);
  });
});

describe("evaluateTrackAnalysis", () => {
  it("compute mode: detects failure when AF below min", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { SW: 1 },
      compute: "AF",
      assert: { min: 40 },
      severity: "warn",
      message: "SW=1 frame with weak AF",
    };
    const track: TrackEvent[] = [
      { time: 0.1, phoneme: "S", params: { SW: 1, AF: 55 } },
      { time: 0.2, phoneme: "S", params: { SW: 1, AF: 0 } },  // fails
      { time: 0.3, phoneme: "S", params: { SW: 1, AF: 60 } },
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.status).toBe("warn");
    expect(result.collected).toHaveLength(1);
    expect(result.collected![0].time).toBe(0.2);
    expect(result.collected![0].value).toBe(0);
  });

  it("assert_any_of: passes when at least one field meets assert", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { SW: 1 },
      assert_any_of: ["A2", "A3"],
      assert: { min: 1 },
      severity: "warn",
      message: "No formant amplitudes",
    };
    const track: TrackEvent[] = [
      { time: 0.1, phoneme: "S", params: { SW: 1, A2: 0, A3: 53 } }, // A3 passes
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.status).toBe("pass");
  });

  it("assert_any_of: passes when bypass-only fricative has AB", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { SW: 1, AF: { min: 1 } },
      assert_any_of: ["AB", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"],
      assert: { min: 1 },
      severity: "warn",
      message: "No parallel spectral amplitudes",
    };
    const track: TrackEvent[] = [
      { time: 0.1, phoneme: "F", params: { SW: 1, AF: 42, AB: 57, A2: 0, A3: 0, A4: 0, A5: 0, A6: 0 } },
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.status).toBe("pass");
  });

  it("assert_any_of: fails when no field meets assert", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { SW: 1 },
      assert_any_of: ["A2", "A3"],
      assert: { min: 1 },
      severity: "warn",
      message: "No formant amplitudes",
    };
    const track: TrackEvent[] = [
      { time: 0.1, phoneme: "S", params: { SW: 1, A2: 0, A3: 0 } },
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.status).toBe("warn");
    expect(result.collected).toHaveLength(1);
  });

  it("no matching frames → skip", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { phoneme: "*_REL" },
      compute: "AF",
      assert: { min: 30 },
      severity: "warn",
      message: "Release with weak AF",
    };
    const track: TrackEvent[] = [
      { time: 0.1, phoneme: "AH", params: { AF: 0 } },
      { time: 0.2, phoneme: "S", params: { AF: 50 } },
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.status).toBe("skip");
  });

  it("all frames pass → pass with frame count", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { voiced: true },
      compute: "AV",
      assert: { min: 40 },
      severity: "warn",
      message: "Weak voicing",
    };
    const track: TrackEvent[] = [
      { time: 0.1, params: { AV: 60 } },
      { time: 0.2, params: { AV: 55 } },
      { time: 0.3, params: { AV: 50 } },
      { time: 0.4, params: { AV: 45 } },
      { time: 0.5, params: { AV: 65 } },
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.status).toBe("pass");
    expect(result.message).toContain("5 frames");
  });

  it("collected limited to 6 entries", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { SW: 1 },
      compute: "AF",
      assert: { min: 40 },
      severity: "warn",
      message: "Weak AF",
    };
    // 10 failing frames
    const track: TrackEvent[] = Array.from({ length: 10 }, (_, i) => ({
      time: i * 0.01,
      phoneme: "S",
      params: { SW: 1, AF: 5 },
    }));
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.status).toBe("warn");
    expect(result.collected).toHaveLength(6);
  });

  it("worst value is reported", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { SW: 1 },
      compute: "AF",
      assert: { min: 40 },
      severity: "warn",
      message: "Weak AF",
    };
    const track: TrackEvent[] = [
      { time: 0.1, phoneme: "S", params: { SW: 1, AF: 30 } },
      { time: 0.2, phoneme: "S", params: { SW: 1, AF: 10 } }, // worst
      { time: 0.3, phoneme: "S", params: { SW: 1, AF: 20 } },
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    expect(result.value).toBe(10);
  });

  it("max assert works (e.g. AH must be 0)", () => {
    const def: TrackAnalysisCheckDef = {
      type: "track_analysis",
      select: { phoneme: "*_REL" },
      compute: "AH",
      assert: { max: 0 },
      severity: "info",
      message: "Release has AH",
    };
    const track: TrackEvent[] = [
      { time: 0.1, phoneme: "K_REL", params: { AH: 0 } },
      { time: 0.2, phoneme: "T_REL", params: { AH: 53 } }, // fails max:0
    ];
    const result = evaluateTrackAnalysis("test_check", def, track);
    // severity=info keeps pass status, but the assertion failure is still marked.
    expect(result.status).toBe("pass");
    expect(result.assertionFailed).toBe(true);
    expect(result.collected).toHaveLength(1);
    expect(result.collected![0].value).toBe(53);
  });
});
