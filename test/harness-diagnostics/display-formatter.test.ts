import { describe, expect, it } from "vitest";
import {
  formatDisplay,
  formatSection,
  DisplayState,
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
    results.set("volume_ok", makeCheckResult({ name: "volume_ok", status: "pass", message: "Volume in range" }));
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    expect(lines.join("\n")).toContain("[OK]");
  });

  // 2. check_results section: warn shows [!!]
  it("check_results section: warn shows [!!] with value", () => {
    const results = new Map<string, CheckResult>();
    results.set("drift", makeCheckResult({ name: "drift", status: "warn", message: "Drift detected", value: 0.005 }));
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    const text = lines.join("\n");
    expect(text).toContain("[!!]");
    expect(text).toContain("0.005");
  });

  // 3. check_results section: fail shows [FAIL]
  it("check_results section: fail shows [FAIL]", () => {
    const results = new Map<string, CheckResult>();
    results.set("silence", makeCheckResult({ name: "silence", status: "fail", message: "No output" }));
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    expect(lines.join("\n")).toContain("[FAIL]");
  });

  // 4. check_results section: skip shows [SKIP]
  it("check_results section: skip shows [SKIP]", () => {
    const results = new Map<string, CheckResult>();
    results.set("optional", makeCheckResult({ name: "optional", status: "skip", message: "Skipped" }));
    const state = makeState({ checkResults: results });
    const lines = formatSection(checkSection, state);
    expect(lines.join("\n")).toContain("[SKIP]");
  });

  // 5. check_results section: pending shows [...]
  it("check_results section: pending shows [...]", () => {
    const results = new Map<string, CheckResult>();
    results.set("waiting", makeCheckResult({ name: "waiting", status: "pending", message: "Waiting" }));
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
    const eventLines = lines.filter(l => track.some(e => e.phoneme && l.includes(e.phoneme!)));
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
    const eventLines = lines.filter(l => track.some(e => e.phoneme && l.includes(e.phoneme!)));
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
});
