import { describe, expect, it, vi } from "vitest";
import { TapManager } from "../../src/harness-diagnostics/tap-manager";
import { PollLoop } from "../../src/harness-diagnostics/poll-loop";
import { createDiagnosticsEngine } from "../../src/harness-diagnostics/index";
import { parseDiagConfig } from "../../src/harness-diagnostics/schema";
import { AcrossPlaysAccumulator } from "../../src/harness-diagnostics/across-plays";
import type { RunInfo, TrackEvent } from "../../src/harness-diagnostics/types";
import fs from "node:fs";
import path from "node:path";

function mockAudioContext() {
  return {
    currentTime: 0.5,
    sampleRate: 48000,
    createAnalyser() {
      const buf = new Float32Array(2048);
      // Put some signal in it
      for (let i = 0; i < buf.length; i++) buf[i] = 0.1 * Math.sin(i);
      return {
        fftSize: 2048,
        frequencyBinCount: 1024,
        getFloatTimeDomainData(out: Float32Array) {
          out.set(buf.subarray(0, out.length));
        },
        getFloatFrequencyData(out: Float32Array) {
          out.fill(-100);
        },
        connect() {},
        disconnect() {},
      };
    },
  } as unknown as AudioContext;
}

function mockRuntime(nodeNames: string[]) {
  const nodes = new Map<string, any>();
  for (const name of nodeNames) {
    nodes.set(name, { connect() {}, disconnect() {} });
  }
  return {
    getNode(id: string) { return nodes.get(id) ?? null; },
  };
}

describe("TapManager", () => {
  it("connects to named nodes", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime(["outputGain"]);
    const tm = new TapManager({
      audioContext: ctx,
      runtime,
      taps: {
        "post-output": { node: "outputGain", fftSize: 2048 },
      },
    });
    tm.connect();
    const analyser = tm.get("post-output");
    expect(analyser).not.toBeNull();
    expect(analyser!.fftSize).toBe(2048);
  });

  it("tries node list in order", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime(["found"]);
    const tm = new TapManager({
      audioContext: ctx,
      runtime,
      taps: {
        "out": { node: ["missing", "found"] },
      },
    });
    tm.connect();
    expect(tm.get("out")).not.toBeNull();
  });

  it("returns null for missing node", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime([]);
    const tm = new TapManager({
      audioContext: ctx,
      runtime,
      taps: {
        "out": { node: "nonexistent" },
      },
    });
    tm.connect();
    expect(tm.get("out")).toBeNull();
  });

  it("destroy disconnects", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime(["outputGain"]);
    const tm = new TapManager({
      audioContext: ctx,
      runtime,
      taps: {
        "post-output": { node: "outputGain" },
      },
    });
    tm.connect();
    expect(tm.get("post-output")).not.toBeNull();
    tm.destroy();
    expect(tm.get("post-output")).toBeNull();
  });
});

describe("PollLoop", () => {
  it("tick produces results", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime(["outputGain"]);
    const config = parseDiagConfig(`
taps:
  post-output:
    node: outputGain
    fftSize: 2048
poll:
  interval_ms: 20
  guard_ms: 50
checks:
  output_rms:
    tap: post-output
    measure: rms
    assert: { min: 0.001 }
    severity: warn
    message: "No signal"
display:
  sections:
    - { id: checks, source: check_results }
`);

    const tapManager = new TapManager({
      audioContext: ctx,
      runtime,
      taps: config.taps,
    });
    tapManager.connect();

    const acrossPlays = new AcrossPlaysAccumulator();
    let receivedResults: Map<string, any> | null = null;
    let receivedOutput = "";

    const track: TrackEvent[] = [
      { time: 0, phoneme: "HH", params: { F0: 110, AV: 60, SW: 0 } },
      { time: 0.5, phoneme: "AH1", params: { F0: 120, AV: 60, SW: 0 } },
    ];

    const pollLoop = new PollLoop({
      config,
      tapManager,
      acrossPlays,
      getRunInfo: () => ({
        phrase: "test",
        baseF0: 110,
        track,
        sessionId: 1,
        startTime: 0,
      }),
      getRunStartTime: () => 0,
      getAudioTime: () => 0.5,
      getSampleRate: () => 48000,
      getDisplayState: () => ({
        run: { phrase: "test", baseF0: 110, track, sessionId: 1, startTime: 0 },
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
      }),
      onResults: (results, output) => {
        receivedResults = results;
        receivedOutput = output;
      },
    });

    pollLoop.tick();
    expect(receivedResults).not.toBeNull();
    expect(receivedResults!.size).toBeGreaterThan(0);
  });

  it("start/stop manages interval", () => {
    vi.useFakeTimers();
    try {
      const ctx = mockAudioContext();
      const runtime = mockRuntime(["outputGain"]);
      const config = parseDiagConfig(`
taps:
  post-output:
    node: outputGain
poll:
  interval_ms: 20
checks:
  c1:
    tap: post-output
    measure: rms
    assert: { min: 0 }
    severity: info
    message: test
display:
  sections: []
`);

      const tapManager = new TapManager({
        audioContext: ctx,
        runtime,
        taps: config.taps,
      });
      tapManager.connect();

      const acrossPlays = new AcrossPlaysAccumulator();
      let callCount = 0;

      const pollLoop = new PollLoop({
        config,
        tapManager,
        acrossPlays,
        getRunInfo: () => null,
        getRunStartTime: () => 0,
        getAudioTime: () => 0.5,
        getSampleRate: () => 48000,
        getDisplayState: () => ({
          run: null,
          checkResults: new Map(),
          telemetry: new Map(),
          telemetryMax: new Map(),
          meterValues: new Map(),
          meterMax: new Map(),
          plstepEvents: [],
          plstepTotalCount: 0,
          playHistory: [],
          sessionId: 0,
          sliderParams: {},
          sampleRate: 48000,
        }),
        onResults: () => { callCount++; },
      });

      pollLoop.start();
      vi.advanceTimersByTime(100);
      expect(callCount).toBeGreaterThan(0);

      const countBeforeStop = callCount;
      pollLoop.stop();
      vi.advanceTimersByTime(100);
      expect(callCount).toBe(countBeforeStop);
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves last active results after playback window ends", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime(["outputGain"]);
    const config = parseDiagConfig(`
taps:
  post-output:
    node: outputGain
    fftSize: 2048
poll:
  interval_ms: 20
  guard_ms: 50
checks:
  output_rms:
    tap: post-output
    measure: rms
    assert: { min: 0.001 }
    severity: warn
    message: "No signal"
display:
  sections:
    - { id: checks, source: check_results }
`);

    const tapManager = new TapManager({
      audioContext: ctx,
      runtime,
      taps: config.taps,
    });
    tapManager.connect();

    const acrossPlays = new AcrossPlaysAccumulator();
    let receivedResults: Map<string, any> = new Map();

    const track: TrackEvent[] = [
      { time: 0, phoneme: "HH", params: { F0: 110, AV: 60, SW: 0 } },
      { time: 0.5, phoneme: "AH1", params: { F0: 120, AV: 60, SW: 0 } },
    ];

    let currentTime = 0.25; // mid-playback

    const pollLoop = new PollLoop({
      config,
      tapManager,
      acrossPlays,
      getRunInfo: () => ({
        phrase: "test",
        baseF0: 110,
        track,
        sessionId: 1,
        startTime: 0,
      }),
      getRunStartTime: () => 0,
      getAudioTime: () => currentTime,
      getSampleRate: () => 48000,
      getDisplayState: () => ({
        run: { phrase: "test", baseF0: 110, track, sessionId: 1, startTime: 0 },
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
      }),
      onResults: (results) => {
        receivedResults = results;
      },
    });

    // Tick during playback — should get a non-skip result
    pollLoop.tick();
    const duringPlayback = receivedResults.get("output_rms");
    expect(duringPlayback).toBeDefined();
    expect(duringPlayback!.status).not.toBe("skip");

    // Advance time past end of track + 0.5s guard
    currentTime = 5.0;
    pollLoop.tick();

    // Should still show the last active result, NOT skip
    const afterPlayback = receivedResults.get("output_rms");
    expect(afterPlayback).toBeDefined();
    expect(afterPlayback!.status).not.toBe("skip");
    // Should preserve the value from during-playback
    expect(afterPlayback!.status).toBe(duringPlayback!.status);
  });

  it("setParamRange feeds param_range checks", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime([]);
    const config = parseDiagConfig(`
poll:
  interval_ms: 20
  guard_ms: 50
taps: {}
checks:
  f0_range:
    type: param_range
    param: F0
    assert: { range_min: 80 }
    severity: error
    message: "F0 range too narrow"
display:
  sections:
    - { id: checks, source: check_results }
`);
    const tapManager = new TapManager({
      audioContext: ctx,
      runtime,
      taps: config.taps,
    });
    const acrossPlays = new AcrossPlaysAccumulator();
    let receivedResults: Map<string, any> = new Map();
    const track: TrackEvent[] = [
      { time: 0, phoneme: "AH", params: { F0: 110, AV: 60 } },
      { time: 0.5, phoneme: "AH", params: { F0: 178, AV: 60 } },
    ];

    const pollLoop = new PollLoop({
      config,
      tapManager,
      acrossPlays,
      getRunInfo: () => ({
        phrase: "test",
        baseF0: 110,
        track,
        sessionId: 1,
        startTime: 0,
      }),
      getRunStartTime: () => 0,
      getAudioTime: () => 0.25,
      getSampleRate: () => 48000,
      getDisplayState: () => ({
        run: { phrase: "test", baseF0: 110, track, sessionId: 1, startTime: 0 },
        checkResults: new Map(),
        telemetry: new Map(),
        telemetryMax: new Map(),
        meterValues: new Map(),
        meterMax: new Map(),
        plstepEvents: [],
        plstepTotalCount: 0,
        playHistory: [],
        sessionId: 0,
        sliderParams: {},
      }),
      onResults: (results) => {
        receivedResults = results;
      },
    });

    pollLoop.setParamRange("f0_range", { min: 110, max: 200 });
    pollLoop.tick();

    const result = receivedResults.get("f0_range");
    expect(result).toBeDefined();
    expect(result.status).toBe("pass");
    expect(result.value).toBe(90);
  });
});

describe("createDiagnosticsEngine", () => {
  it("lifecycle: create, start, subscribe, onPlayStart, stop, destroy", () => {
    const ctx = mockAudioContext();
    const runtime = mockRuntime(["outputGain"]);
    const config = parseDiagConfig(`
taps:
  post-output:
    node: outputGain
poll:
  interval_ms: 50
checks:
  c1:
    tap: post-output
    measure: rms
    assert: { min: 0 }
    severity: info
    message: test
display:
  sections:
    - { id: checks, source: check_results }
`);

    const engine = createDiagnosticsEngine(config, ctx, runtime);

    let subscriberCalled = false;
    const unsub = engine.subscribe((output) => {
      subscriberCalled = true;
    });

    engine.start();

    engine.onPlayStart({
      phrase: "hello",
      baseF0: 110,
      track: [
        { time: 0, phoneme: "HH", params: { F0: 110, AV: 60, SW: 0 } },
      ],
      sessionId: 1,
      startTime: 0,
    });

    // Manual tick to trigger subscriber
    engine.stop();
    engine.onPlayEnd();
    unsub();
    engine.destroy();

    // Engine should not throw after destroy
    const results = engine.getCheckResults();
    expect(results).toBeDefined();
  });

  it("uses the current run session id in display state", () => {
    vi.useFakeTimers();
    let engine: ReturnType<typeof createDiagnosticsEngine> | null = null;
    try {
      const ctx = mockAudioContext();
      const runtime = mockRuntime([]);
      const config = parseDiagConfig(`
poll:
  interval_ms: 20
  guard_ms: 50
taps: {}
checks:
  f0_range:
    type: param_range
    param: F0
    assert: { range_min: 10 }
    severity: info
    message: "F0 dynamic range narrow"
display:
  sections:
    - { id: session, source: session_info }
`);
      let output = "";
      engine = createDiagnosticsEngine(config, ctx, runtime, {
        telemetry: new Map(),
        telemetryMax: new Map(),
        plstepEvents: [],
        plstepTotalCount: 0,
        playHistory: [],
        sessionId: 0,
        sliderParams: {},
        sampleRate: 48000,
      });
      engine.subscribe((nextOutput) => {
        output = nextOutput;
      });
      engine.onPlayStart({
        phrase: "hello world",
        baseF0: 110,
        track: [
          { time: 0, phoneme: "AH", params: { F0: 110, AV: 60 } },
          { time: 0.5, phoneme: "AH", params: { F0: 130, AV: 60 } },
        ],
        sessionId: 7,
        startTime: 0,
      });
      engine.start();
      vi.advanceTimersByTime(25);
      engine.stop();
      expect(output).toContain("Session #7");
    } finally {
      vi.useRealTimers();
      engine?.destroy();
    }
  });
});

describe("default.yaml", () => {
  it("parses without error and has expected taps", () => {
    const yamlPath = path.resolve(__dirname, "../../public/diagnostics/default.yaml");
    const source = fs.readFileSync(yamlPath, "utf-8");
    const config = parseDiagConfig(source);

    // Should have at least one tap
    expect(Object.keys(config.taps).length).toBeGreaterThan(0);
    // Should have post-output tap
    expect(config.taps["post-output"]).toBeDefined();
    // Should have checks
    expect(Object.keys(config.checks).length).toBeGreaterThan(0);
    // Should have display sections
    expect(config.display.sections.length).toBeGreaterThan(0);
  });
});
