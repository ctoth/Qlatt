import { describe, expect, it } from "vitest";
import {
  type DisplayState,
  formatDisplay,
  formatSection,
} from "../../src/harness-diagnostics/display-formatter";
import type {
  CheckResult,
  DisplayConfig,
  DisplaySection,
  RunInfo,
  TrackEvent,
} from "../../src/harness-diagnostics/types";

function makeState(overrides?: Partial<DisplayState>): DisplayState {
  return {
    run: null,
    checkResults: new Map(),
    telemetry: new Map(),
    telemetryMax: new Map(),
    meterValues: new Map(),
    meterMax: new Map(),
    plstepEvents: [],
    plstepTotalCount: 0,
    playHistory: [],
    sessionId: 1,
    sliderParams: {},
    sampleRate: 48000,
    ...overrides,
  };
}

function makeCheckResult(overrides: Partial<CheckResult>): CheckResult {
  return {
    name: "test_check",
    status: "pending",
    severity: "error",
    message: "test message",
    ...overrides,
  };
}

const checkSection: DisplaySection = { id: "checks", source: "check_results" };

describe("display-formatter", () => {
  // 1. check_results section: pass shows [OK]
  it("check_results section: pass shows [OK]", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "volume_ok",
      makeCheckResult({ name: "volume_ok", status: "pass", message: "Volume in range" }),
    );
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    const text = lines.join("\n");
    expect(text).toContain("[OK]");
    expect(text).toContain("volume_ok");
    expect(text).not.toContain("Volume in range");
  });

  // 2. check_results section: warn shows [!!]
  it("check_results section: warn shows [!!] with value", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "drift",
      makeCheckResult({ name: "drift", status: "warn", message: "Drift detected", value: 0.005 }),
    );
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    const text = lines.join("\n");
    expect(text).toContain("[!!]");
    expect(text).toContain("0.005");
  });

  it("check_results section: param-range labels metric explicitly", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "f2_ceiling",
      makeCheckResult({
        name: "f2_ceiling",
        status: "warn",
        message: "F2 never reaches 2400 Hz",
        value: 2322,
        valueLabel: "max",
      }),
    );
    const state = makeState({ checkResults: results });
    const text = formatSection(checkSection, state).join("\n");
    expect(text).toContain("(max=2322)");
    expect(text).not.toContain("(value=2322)");
  });

  // 3. check_results section: fail shows [FAIL]
  it("check_results section: fail shows [FAIL]", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "silence",
      makeCheckResult({ name: "silence", status: "fail", message: "No output" }),
    );
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    expect(lines.join("\n")).toContain("[FAIL]");
  });

  it("check_results section: failed info check shows [INFO]", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "cascade_no_leak",
      makeCheckResult({
        name: "cascade_no_leak",
        status: "pass",
        severity: "info",
        assertionFailed: true,
        message: "Cascade leaking during SW=1",
      }),
    );
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    expect(lines.join("\n")).toContain("[INFO]");
  });

  it("check_results section: passing track-analysis preserves checked-count summary only", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "release_has_af",
      makeCheckResult({
        name: "release_has_af",
        status: "pass",
        message: "Stop release with weak/missing AF (7 frames checked)",
      }),
    );
    const state = makeState({ checkResults: results });
    const text = formatSection(checkSection, state).join("\n");
    expect(text).toContain("[OK] release_has_af (7 frames checked)");
    expect(text).not.toContain("weak/missing AF");
  });

  // 4. check_results section: skip shows [SKIP]
  it("check_results section: skip shows [SKIP]", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "optional",
      makeCheckResult({ name: "optional", status: "skip", message: "Skipped" }),
    );
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    expect(lines.join("\n")).toContain("[SKIP]");
  });

  // 5. check_results section: pending shows [...]
  it("check_results section: pending shows [...]", () => {
    const results = new Map<string, CheckResult>();
    results.set(
      "waiting",
      makeCheckResult({ name: "waiting", status: "pending", message: "Waiting" }),
    );
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    expect(lines.join("\n")).toContain("[...]");
  });

  // 6. session_info section includes phrase and F0
  it("session_info section includes phrase and F0", () => {
    const run: RunInfo = { phrase: "hello", baseF0: 120, track: [], sessionId: 1, startTime: 0 };
    const state = makeState({ run, sessionId: 1 });
    const section: DisplaySection = { id: "info", source: "session_info" };
    const lines = formatSection(section, state);
    const text = lines.join("\n");
    expect(text).toContain("hello");
    expect(text).toContain("120");
  });

  // 7. track_events with range [0, 2] shows first 2 events
  it("track_events with range [0, 2] shows first 2 events", () => {
    const track: TrackEvent[] = [
      { time: 0.0, phoneme: "HH" },
      { time: 0.1, phoneme: "AH" },
      { time: 0.2, phoneme: "L" },
      { time: 0.3, phoneme: "OW" },
      { time: 0.4, phoneme: "SIL" },
    ];
    const run: RunInfo = { phrase: "hello", baseF0: 120, track, sessionId: 1, startTime: 0 };
    const state = makeState({ run });
    const section: DisplaySection = { id: "events", source: "track_events", range: [0, 2] };
    const lines = formatSection(section, state);
    // Filter out header/separator lines — event lines contain phoneme names
    const eventLines = lines.filter((l) => track.some((e) => e.phoneme && l.includes(e.phoneme!)));
    expect(eventLines).toHaveLength(2);
  });

  // 8. track_events with range [-2, null] shows last 2 events
  it("track_events with range [-2, null] shows last 2 events", () => {
    const track: TrackEvent[] = [
      { time: 0.0, phoneme: "HH" },
      { time: 0.1, phoneme: "AH" },
      { time: 0.2, phoneme: "L" },
      { time: 0.3, phoneme: "OW" },
      { time: 0.4, phoneme: "SIL" },
    ];
    const run: RunInfo = { phrase: "hello", baseF0: 120, track, sessionId: 1, startTime: 0 };
    const state = makeState({ run });
    const section: DisplaySection = { id: "events", source: "track_events", range: [-2, null] };
    const lines = formatSection(section, state);
    const eventLines = lines.filter((l) => track.some((e) => e.phoneme && l.includes(e.phoneme!)));
    expect(eventLines).toHaveLength(2);
  });

  // 9. sections not in config are not in output
  it("sections not in config are not in output", () => {
    const results = new Map<string, CheckResult>();
    results.set("vol", makeCheckResult({ name: "vol", status: "pass", message: "OK" }));
    const run: RunInfo = { phrase: "test", baseF0: 100, track: [], sessionId: 1, startTime: 0 };
    const state = makeState({ run, checkResults: results });
    const config: DisplayConfig = { sections: [checkSection] };
    const output = formatDisplay(config, state);
    expect(output).toContain("[OK]");
    expect(output).not.toContain("Session");
  });

  // 10. section ordering matches config order
  it("section ordering matches config order", () => {
    const run: RunInfo = { phrase: "test", baseF0: 100, track: [], sessionId: 1, startTime: 0 };
    const results = new Map<string, CheckResult>();
    results.set("vol", makeCheckResult({ name: "vol", status: "pass", message: "OK" }));
    const state = makeState({ run, sessionId: 1, checkResults: results });
    const config: DisplayConfig = {
      sections: [
        { id: "info", source: "session_info" },
        { id: "checks", source: "check_results" },
      ],
    };
    const output = formatDisplay(config, state);
    const sessionIdx = output.indexOf("Session");
    const checkIdx = output.indexOf("[OK]");
    expect(sessionIdx).toBeLessThan(checkIdx);
  });

  // 11. unknown source produces no output
  it("unknown source produces no output", () => {
    const state = makeState();
    const section: DisplaySection = { id: "mystery", source: "nonexistent" };
    const lines = formatSection(section, state);
    expect(lines).toHaveLength(0);
  });

  // 12. formatDisplay joins sections with blank lines
  it("formatDisplay joins sections with blank lines", () => {
    const run: RunInfo = { phrase: "test", baseF0: 100, track: [], sessionId: 1, startTime: 0 };
    const results = new Map<string, CheckResult>();
    results.set("vol", makeCheckResult({ name: "vol", status: "pass", message: "OK" }));
    const state = makeState({ run, sessionId: 1, checkResults: results });
    const config: DisplayConfig = {
      sections: [
        { id: "info", source: "session_info" },
        { id: "checks", source: "check_results" },
      ],
    };
    const output = formatDisplay(config, state);
    // Sections separated by blank lines (double newline)
    expect(output).toContain("\n\n");
  });

  it("plstep_events prefers scheduled relative time", () => {
    const run: RunInfo = { phrase: "test", baseF0: 100, track: [], sessionId: 1, startTime: 50 };
    const state = makeState({
      run,
      plstepTotalCount: 1,
      plstepEvents: [
        {
          time: 88.673,
          relTime: 38.673,
          scheduledRelTime: 0.799,
          amplitudeLinear: 0.0394,
          amplitudeDb: -28,
          trigger: "AF",
          delta: 58,
          phoneme: "D_REL",
        },
      ],
    });
    const section: DisplaySection = { id: "plstep", source: "plstep_events" };
    const lines = formatSection(section, state);
    expect(lines.join("\n")).toContain("burst t=0.799s");
  });

  it("worklet_telemetry includes raw-telemetry note", () => {
    const state = makeState({
      telemetry: new Map([["outputLp", { rms: 0.25, peak: 0.5 }]]),
      telemetryMax: new Map([["outputLp", { rms: 0.5, rmsTime: 0.1 }]]),
    });
    const section: DisplaySection = { id: "telemetry", source: "worklet_telemetry" };
    const text = formatSection(section, state).join("\n");
    expect(text).toContain("raw worklet telemetry");
    expect(text).toContain("outputLp:");
  });

  it("formant_tracking summarizes track parameter ranges", () => {
    const run: RunInfo = {
      phrase: "test",
      baseF0: 100,
      sessionId: 1,
      startTime: 0,
      track: [
        {
          time: 0,
          phoneme: "AH",
          params: { F1: 500, F2: 1500, F3: 2500, B1: 100, B2: 100, B3: 100 },
        },
        {
          time: 0.1,
          phoneme: "IY",
          params: { F1: 310, F2: 2322, F3: 3000, B1: 60, B2: 90, B3: 120 },
        },
      ],
    };
    const section: DisplaySection = { id: "formants", source: "formant_tracking" };
    const text = formatSection(section, makeState({ run })).join("\n");
    expect(text).toContain("F1 range: 310.0 - 500.0 Hz");
    expect(text).toContain("F2 range: 1500.0 - 2322.0 Hz");
  });

  it("signal_flow summarizes branch and lfMode usage", () => {
    const run: RunInfo = {
      phrase: "test",
      baseF0: 100,
      sessionId: 1,
      startTime: 0,
      track: [
        { time: 0, phoneme: "AH", params: { SW: 0, lfMode: 1, AV: 60 } },
        { time: 0.1, phoneme: "S", params: { SW: 1, lfMode: 1, AF: 60, A6: 52 } },
        { time: 0.2, phoneme: "SIL", params: { SW: 0, lfMode: 1 } },
      ],
    };
    const section: DisplaySection = { id: "signal", source: "signal_flow" };
    const text = formatSection(section, makeState({ run })).join("\n");
    expect(text).toContain("SW=1: 1 frames, 0.100s");
    expect(text).toContain("LF modes:");
  });

  it("gain_derivation formats computed gain ranges", () => {
    const run: RunInfo = {
      phrase: "test",
      baseF0: 100,
      sessionId: 1,
      startTime: 0,
      track: [
        { time: 0, phoneme: "S", params: { AF: 55, GO: 47, SW: 1, F1: 300, F2: 1500, F3: 2500 } },
      ],
    };
    const section: DisplaySection = { id: "gains", source: "gain_derivation" };
    const text = formatSection(
      section,
      makeState({ run, sliderParams: { parallelGainScale: 1, masterGain: 1 } }),
    ).join("\n");
    expect(text).toContain("fricGain:");
    expect(text).toContain("parallelScale=1.000");
  });

  it("voicing_issues reports clean track when none found", () => {
    const run: RunInfo = {
      phrase: "test",
      baseF0: 100,
      sessionId: 1,
      startTime: 0,
      track: [
        { time: 0, phoneme: "AH", params: { F0: 120, AV: 60 } },
        { time: 0.1, phoneme: "S", params: { F0: 0, AV: 0, AVS: 0, AF: 60, AH: 0 } },
      ],
    };
    const section: DisplaySection = { id: "voicing", source: "voicing_issues" };
    const text = formatSection(section, makeState({ run })).join("\n");
    expect(text).toContain("No voicing inconsistencies detected");
  });
});
