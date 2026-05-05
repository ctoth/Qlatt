import { describe, expect, it } from "vitest";
import { parseDiagConfig } from "../../src/harness-diagnostics/schema";

const MINIMAL_CONFIG = `
taps:
  post-output:
    node: outputGain
    fftSize: 2048
poll:
  interval_ms: 20
  guard_ms: 50
checks:
  output_no_clip:
    tap: post-output
    measure: peak
    assert: { max: 1.0 }
    severity: warn
    message: "Output clipping"
display:
  sections:
    - { id: checks, source: check_results }
`;

describe("parseDiagConfig", () => {
  it("parses minimal valid config", () => {
    const config = parseDiagConfig(MINIMAL_CONFIG);
    expect(config.taps["post-output"]).toEqual({ node: "outputGain", fftSize: 2048 });
    expect(config.poll).toEqual({ interval_ms: 20, guard_ms: 50 });
    expect(config.checks["output_no_clip"]).toMatchObject({
      tap: "post-output",
      measure: "peak",
      assert: { max: 1.0 },
      severity: "warn",
      message: "Output clipping",
    });
    expect(config.display.sections).toHaveLength(1);
    expect(config.display.sections[0]).toEqual({ id: "checks", source: "check_results" });
  });

  it("accepts tap node as string[]", () => {
    const yaml = `
taps:
  out:
    node: [outputLp, masterGain, outputGain]
poll:
  interval_ms: 20
checks:
  c1:
    tap: out
    measure: rms
    assert: { min: 0.01 }
    severity: info
    message: test
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.taps["out"].node).toEqual(["outputLp", "masterGain", "outputGain"]);
  });

  it("defaults guard_ms to 50", () => {
    const yaml = `
taps:
  t1:
    node: x
poll:
  interval_ms: 30
checks:
  c1:
    tap: t1
    measure: rms
    assert: { min: 0 }
    severity: info
    message: test
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.poll.guard_ms).toBe(50);
  });

  it("throws on missing taps", () => {
    expect(() => parseDiagConfig(`
poll:
  interval_ms: 20
checks: {}
display:
  sections: []
`)).toThrow("taps");
  });

  it("throws on missing poll", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
checks: {}
display:
  sections: []
`)).toThrow("poll");
  });

  it("throws on missing check severity", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  bad:
    measure: rms
    assert: { min: 0 }
    message: test
display:
  sections: []
`)).toThrow("severity");
  });

  it("throws on missing check message", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  bad:
    measure: rms
    assert: { min: 0 }
    severity: warn
display:
  sections: []
`)).toThrow("message");
  });

  it("throws on missing check assert", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  bad:
    measure: rms
    severity: warn
    message: test
display:
  sections: []
`)).toThrow("assert");
  });

  it("throws on unknown measure", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  bad:
    measure: unknown_measure
    assert: { min: 0 }
    severity: warn
    message: test
display:
  sections: []
`)).toThrow("unknown measure");
  });

  it("throws on unknown check type", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  bad:
    type: magic_type
    assert: { min: 0 }
    severity: warn
    message: test
display:
  sections: []
`)).toThrow("unknown type");
  });

  it("parses check with when clause", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  c1:
    tap: t
    when: { SW: 1, phoneme: "IY*", voiced: true }
    measure: rms
    assert: { min: 0.01 }
    severity: warn
    message: test
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["c1"].when).toEqual({ SW: 1, phoneme: "IY*", voiced: true });
  });

  it("parses param_range check", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  f0_range:
    type: param_range
    param: F0
    assert: { range_min: 80 }
    severity: info
    message: "F0 range narrow"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["f0_range"].type).toBe("param_range");
    expect(config.checks["f0_range"].param).toBe("F0");
    expect(config.checks["f0_range"].assert.range_min).toBe(80);
  });

  it("parses across_plays check", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  leak:
    tap: t
    type: across_plays
    plays: 3
    measure: peak
    assert: { cv_max: 0.05 }
    severity: error
    message: "State leak"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["leak"].type).toBe("across_plays");
    expect(config.checks["leak"].plays).toBe(3);
    expect(config.checks["leak"].assert.cv_max).toBe(0.05);
  });

  it("parses collect/cooldown on check", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  c:
    tap: t
    measure: peak
    assert: { max: 1.0 }
    severity: warn
    message: clip
    collect: true
    max_collected: 6
    cooldown_ms: 200
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["c"].collect).toBe(true);
    expect(config.checks["c"].max_collected).toBe(6);
    expect(config.checks["c"].cooldown_ms).toBe(200);
  });

  it("parses ignore_guard on check", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  c:
    tap: t
    measure: rms
    assert: { min: 0.01 }
    severity: warn
    message: audible
    ignore_guard: true
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["c"].ignore_guard).toBe(true);
  });

  it("parses multi-tap check", () => {
    const yaml = `
taps:
  a: { node: x }
  b: { node: y }
poll:
  interval_ms: 20
checks:
  ratio:
    taps: [a, b]
    when: { SW: 1 }
    measure: rms_ratio_db
    assert: { max: 20 }
    severity: warn
    message: "imbalance"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["ratio"].taps).toEqual(["a", "b"]);
  });

  it("parses display sections with range", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks: {}
display:
  sections:
    - { id: head, source: track_events, range: [0, 8] }
    - { id: tail, source: track_events, range: [-6, null] }
`;
    const config = parseDiagConfig(yaml);
    expect(config.display.sections[0].range).toEqual([0, 8]);
    expect(config.display.sections[1].range).toEqual([-6, null]);
  });

  it("throws on tap without node", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { fftSize: 2048 }
poll:
  interval_ms: 20
checks: {}
display:
  sections: []
`)).toThrow("node");
  });

  it("parses event_check type", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  plstep_var:
    type: event_check
    event: plstep
    field: amplitudeLinear
    assert: { distinct_min: 3 }
    severity: info
    message: "bursts identical"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["plstep_var"].type).toBe("event_check");
    expect(config.checks["plstep_var"].event).toBe("plstep");
    expect(config.checks["plstep_var"].field).toBe("amplitudeLinear");
  });

  it("parses track_analysis check with compute", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  parallel_af:
    type: track_analysis
    select: { SW: 1, AF: { min: 1 } }
    compute: AF
    assert: { min: 40 }
    severity: warn
    message: "Weak AF"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["parallel_af"].type).toBe("track_analysis");
    expect(config.checks["parallel_af"].select).toEqual({ SW: 1, AF: { min: 1 } });
    expect(config.checks["parallel_af"].compute).toBe("AF");
  });

  it("parses track_analysis check with assert_any_of", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  formants:
    type: track_analysis
    select: { SW: 1 }
    assert_any_of: [A2, A3, A4]
    assert: { min: 1 }
    severity: warn
    message: "No formant amps"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["formants"].assert_any_of).toEqual(["A2", "A3", "A4"]);
  });

  it("throws on track_analysis without select", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  bad:
    type: track_analysis
    compute: AF
    assert: { min: 40 }
    severity: warn
    message: test
display:
  sections: []
`)).toThrow("select");
  });

  it("throws on track_analysis without compute or assert_any_of", () => {
    expect(() => parseDiagConfig(`
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  bad:
    type: track_analysis
    select: { SW: 1 }
    assert: { min: 40 }
    severity: warn
    message: test
display:
  sections: []
`)).toThrow("compute");
  });

  it("parses fft_peak_freq with measure_params", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  f2_peak:
    tap: t
    when: { phoneme: "IY*" }
    measure: fft_peak_freq
    measure_params: { band: [2000, 2800] }
    assert: { min: 2200 }
    severity: warn
    message: "F2 low"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["f2_peak"].measure_params).toEqual({ band: [2000, 2800] });
  });

  it("parses band_share with measure_params", () => {
    const yaml = `
taps:
  t: { node: x }
poll:
  interval_ms: 20
checks:
  hiss:
    tap: t
    measure: band_share
    measure_params: { band: [6000, 10000] }
    assert: { max: 0.08 }
    severity: warn
    message: "hiss"
display:
  sections: []
`;
    const config = parseDiagConfig(yaml);
    expect(config.checks["hiss"].measure).toBe("band_share");
    expect(config.checks["hiss"].measure_params).toEqual({ band: [6000, 10000] });
  });
});
