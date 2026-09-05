/**
 * Tests for PLSTEP state tracking in klatt-interpreter.ts
 *
 * Verifies:
 * 1. prevAF is tracked unconditionally (not gated on telemetryHandler)
 * 2. PLSTEP telemetry fires correctly for >49 dB AF jumps (frication onset)
 * 3. PLSTEP telemetry does NOT fire for small deltas (state tracked frame-to-frame)
 * 4. PLSTEP telemetry does NOT fire for AH jumps (aspiration is not a burst)
 * 5. No errors when telemetryHandler is not provided
 */
import { describe, expect, it, vi } from "vitest";
import { dbToLinear } from "../src/builtin-functions";
import { expandFormantBanks } from "../src/formant-bank";
import {
  createKlattInterpreter,
  type KlattFrame,
  type TelemetryEvent,
} from "../src/klatt-interpreter";
import type { BaconGraph, BindingSpec, KlattRuntime } from "../src/klatt-runtime";
import type { SemanticsDocument } from "../src/semantics/types";

// ---------------------------------------------------------------------------
// Helpers: minimal mocks for AudioContext / AudioParam / KlattRuntime
// ---------------------------------------------------------------------------

const PLSTEP_CONSTANTS = {
  plstepThreshold: 49,
  plstepBurstOffsetDb: 75,
};

/** Create a mock AudioParam that records calls */
function mockAudioParam(): AudioParam {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    // Satisfy AudioParam interface minimally
    automationRate: "a-rate",
    defaultValue: 0,
    maxValue: 3.4028235e38,
    minValue: -3.4028235e38,
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    setValueCurveAtTime: vi.fn(),
    cancelAndHoldAtTime: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as AudioParam;
}

/** Create a mock AudioWorkletNode with a parameters map */
function mockWorkletNode(
  paramNames: string[],
  overrides: ReadonlyMap<string, AudioParam> = new Map(),
): AudioNode {
  const params = new Map<string, AudioParam>();
  for (const name of paramNames) {
    params.set(name, overrides.get(name) ?? mockAudioParam());
  }
  return { parameters: params } as unknown as AudioNode;
}

/** Minimal AudioContext mock */
function mockAudioContext(): AudioContext {
  return {
    currentTime: 0,
    sampleRate: 44100,
    destination: {} as AudioDestinationNode,
  } as unknown as AudioContext;
}

/** Minimal semantics with AF realize rule (needed so AF binding is classified as realized) */
function minimalSemantics(): SemanticsDocument {
  return {
    name: "test",
    params: {
      AF: { default: 0, range: [0, 80] },
      AH: { default: 0, range: [0, 80] },
      GO: { default: 47, range: [0, 80] },
    },
    constants: {
      ...PLSTEP_CONSTANTS,
    },
    realize: {
      // AF and AH passthrough as-is (identity expressions)
      AF: { expr: "AF", ramp: true },
      AH: { expr: "AH", ramp: true },
    },
  };
}

/** Create a mock KlattRuntime with an empty binding map */
function mockRuntime(): KlattRuntime {
  const emptyBindingMap = new Map<string, BindingSpec[]>();
  return {
    getNode: vi.fn(() => undefined),
    getBindingMap: vi.fn(() => emptyBindingMap),
    getRealizedValues: vi.fn(() => ({})),
    setInputs: vi.fn(),
    getAllNodeIds: vi.fn(() => []),
    getAudioContext: vi.fn(() => mockAudioContext()),
    connectToDestination: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as KlattRuntime;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Binding categorization (tagged union)", () => {
  it("every bound name appears in exactly one binding category", () => {
    // Set up semantics with mixed bindings: some realized+ramp, some realized, some passthrough
    const semantics: SemanticsDocument = {
      name: "test",
      params: {
        AF: { default: 0, range: [0, 80] },
        AH: { default: 0, range: [0, 80] },
        F1: { default: 500, range: [200, 1000] },
        F0: { default: 120, range: [80, 500] },
      },
      constants: { ...PLSTEP_CONSTANTS },
      realize: {
        AF: { expr: "AF", ramp: true }, // ramp binding
        AH: { expr: "AH", ramp: true }, // ramp binding
        F1: { expr: "F1" }, // realized (no ramp)
        // F0 has no realize rule → passthrough
      },
    };

    // Create mock nodes with parameters
    const _afParam = mockAudioParam();
    const _ahParam = mockAudioParam();
    const _f1Param = mockAudioParam();
    const _f0Param = mockAudioParam();

    const lfNode = mockWorkletNode(["f0", "af", "ah"]);
    const resNode = mockWorkletNode(["frequency"]);

    // Set up binding map so each name maps to a node+param
    const bindingMap = new Map<string, BindingSpec[]>([
      ["AF", [{ nodeId: "lfSource", paramName: "af", bindName: "AF" }]],
      ["AH", [{ nodeId: "lfSource", paramName: "ah", bindName: "AH" }]],
      ["F1", [{ nodeId: "resonator1", paramName: "frequency", bindName: "F1" }]],
      ["F0", [{ nodeId: "lfSource", paramName: "f0", bindName: "F0" }]],
    ]);

    const nodeMap = new Map<string, AudioNode>([
      ["lfSource", lfNode],
      ["resonator1", resNode],
    ]);

    const rt = {
      ...mockRuntime(),
      getNode: vi.fn((id: string) => nodeMap.get(id)),
      getBindingMap: vi.fn(() => bindingMap),
    } as unknown as KlattRuntime;

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: rt,
      semantics,
      bindingMap,
    });

    // Schedule a minimal track to exercise all bindings
    const track: KlattFrame[] = [
      { time: 0.0, params: { AF: 10, AH: 10, F1: 500, F0: 120 } },
      { time: 0.005, params: { AF: 20, AH: 20, F1: 600, F0: 130 } },
    ];

    // Should not throw — if any binding were double-written or dropped,
    // the schedule would have incorrect entry counts
    expect(() => interpreter.scheduleTrack(track, 0)).not.toThrow();

    // Verify: each param should have been scheduled
    // AF (ramp): frame 0 → setValueAtTime, frame 1 → linearRampToValueAtTime
    const lfParams = (lfNode as unknown as { parameters: Map<string, AudioParam> }).parameters;
    const afMock = lfParams.get("af")!;
    expect(afMock.setValueAtTime).toHaveBeenCalled();
    expect(afMock.linearRampToValueAtTime).toHaveBeenCalled();

    // F1 (realized, non-ramp): both frames → setValueAtTime only
    const resParams = (resNode as unknown as { parameters: Map<string, AudioParam> }).parameters;
    const f1Mock = resParams.get("frequency")!;
    expect(f1Mock.setValueAtTime).toHaveBeenCalled();
    expect(f1Mock.linearRampToValueAtTime).not.toHaveBeenCalled();

    // F0 (passthrough): both frames → setValueAtTime only
    const f0Mock = lfParams.get("f0")!;
    expect(f0Mock.setValueAtTime).toHaveBeenCalled();
    expect(f0Mock.linearRampToValueAtTime).not.toHaveBeenCalled();
  });

  it("binding type discriminant is correct: ramp, realized, passthrough", () => {
    // This test verifies correct categorization by checking scheduling behavior:
    // - 'ramp' bindings: setValueAtTime at frame 0, linearRampToValueAtTime at frame 1+
    // - 'realized' bindings: setValueAtTime at every frame
    // - 'passthrough' bindings: setValueAtTime at every frame (raw param values)
    const semantics: SemanticsDocument = {
      name: "test",
      params: {
        AF: { default: 0, range: [0, 80] },
        voiceGain: { default: 0 },
        F0: { default: 120, range: [80, 500] },
      },
      constants: { ...PLSTEP_CONSTANTS },
      realize: {
        AF: { expr: "AF", ramp: true }, // ramp
        voiceGain: { expr: "voiceGain" }, // realized (no ramp)
        // F0 has no realize rule → passthrough
      },
    };

    const node = mockWorkletNode(["af", "voiceGain", "f0"]);
    const bindingMap = new Map<string, BindingSpec[]>([
      ["AF", [{ nodeId: "src", paramName: "af", bindName: "AF" }]],
      ["voiceGain", [{ nodeId: "src", paramName: "voiceGain", bindName: "voiceGain" }]],
      ["F0", [{ nodeId: "src", paramName: "f0", bindName: "F0" }]],
    ]);

    const rt = {
      ...mockRuntime(),
      getNode: vi.fn((id: string) => (id === "src" ? node : undefined)),
      getBindingMap: vi.fn(() => bindingMap),
    } as unknown as KlattRuntime;

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: rt,
      semantics,
      bindingMap,
    });

    const track: KlattFrame[] = [
      { time: 0.0, params: { AF: 10, voiceGain: 40, F0: 120 } },
      { time: 0.005, params: { AF: 20, voiceGain: 50, F0: 130 } },
      { time: 0.01, params: { AF: 30, voiceGain: 60, F0: 140 } },
    ];

    interpreter.scheduleTrack(track, 0);

    const params = (node as unknown as { parameters: Map<string, AudioParam> }).parameters;

    // AF is ramp: 1 setValueAtTime (frame 0) + 2 linearRamp (frames 1,2)
    const afParam = params.get("af")!;
    expect(afParam.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(afParam.linearRampToValueAtTime).toHaveBeenCalledTimes(2);

    // voiceGain is realized (non-ramp): 3 setValueAtTime, 0 linearRamp
    const vgParam = params.get("voiceGain")!;
    expect(vgParam.setValueAtTime).toHaveBeenCalledTimes(3);
    expect(vgParam.linearRampToValueAtTime).not.toHaveBeenCalled();

    // F0 is passthrough: 3 setValueAtTime, 0 linearRamp
    const f0Param = params.get("f0")!;
    expect(f0Param.setValueAtTime).toHaveBeenCalledTimes(3);
    expect(f0Param.linearRampToValueAtTime).not.toHaveBeenCalled();
  });
});

describe("compiled formant-bank realization bindings", () => {
  it("schedules a generated PFE gain from evaluated semantics", () => {
    const graph: BaconGraph = {
      bacon: "0.1",
      meta: {
        formantBanks: {
          main: {
            cascade: { input: "input", output: "cascadeOutput" },
            parallel: { output: "parallelOutput" },
            formants: [
              {
                index: 1,
                freqRange: [200, 1000],
                freqDefault: 500,
                bwRange: [40, 1000],
                bwDefault: 60,
                ndbScale: -58,
                sign: 1,
                parallelSource: "parallelSource",
              },
            ],
          },
        },
      },
      nodes: {
        input: { type: "gain" },
        cascadeOutput: { type: "gain" },
        parallelOutput: { type: "gain" },
        parallelSource: { type: "gain" },
      },
    };
    const semantics: SemanticsDocument = {
      name: "compiled-formant-bank-test",
      params: {
        parallelScale: { type: "float", range: [0, 1], default: 0.85 },
      },
      constants: { ...PLSTEP_CONSTANTS },
      realize: {},
    };

    expandFormantBanks(graph, semantics);
    expect(semantics.realize).toHaveProperty("a1Linear");

    const gainParam = mockAudioParam();
    const gainNode = mockWorkletNode(["gain"], new Map([["gain", gainParam]]));
    const bindingMap = new Map<string, BindingSpec[]>([
      [
        "a1Linear",
        [
          {
            nodeId: "parallelF1Gain",
            paramName: "gain",
            bindName: "a1Linear",
          },
        ],
      ],
    ]);
    const runtime: KlattRuntime = {
      ...mockRuntime(),
      getNode: vi.fn((nodeId: string) => (nodeId === "parallelF1Gain" ? gainNode : undefined)),
      getBindingMap: vi.fn(() => bindingMap),
    };
    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime,
      semantics,
      bindingMap,
    });

    interpreter.scheduleTrack(
      [
        {
          time: 0,
          params: {
            F1: 500,
            B1: 60,
            A1: 60,
            parallelScale: 0.85,
          },
        },
      ],
      0,
    );

    const expectedGain = dbToLinear(60 - 58) * 0.85;
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(expectedGain, 0);
  });
});

describe("PLSTEP state tracking", () => {
  it("requires PLSTEP constants from semantics", () => {
    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      semantics: {
        ...minimalSemantics(),
        constants: {
          plstepThreshold: 49,
        },
      },
    });

    expect(() => interpreter.scheduleTrack([{ time: 0.0, params: { AF: 60 } }], 0)).toThrow(
      "E_SEMANTICS_CONSTANT_REQUIRED: constants.plstepBurstOffsetDb",
    );
  });

  it("requires realized GO for PLSTEP telemetry amplitude", () => {
    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      semantics: {
        ...minimalSemantics(),
        params: {
          AF: { default: 0, range: [0, 80] },
          AH: { default: 0, range: [0, 80] },
        },
      },
      telemetryHandler: () => {},
    });

    expect(() => interpreter.scheduleTrack([{ time: 0.0, params: { AF: 60 } }], 0)).toThrow(
      "E_SEMANTICS_VALUE_REQUIRED: realized GO must be a finite number",
    );
  });

  it("fires PLSTEP telemetry for >49 dB AF jump", () => {
    const events: TelemetryEvent[] = [];
    const telemetryHandler = (event: TelemetryEvent) => events.push(event);

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      semantics: minimalSemantics(),
      telemetryHandler,
    });

    // Frame 0: AF=0 (same as prevAF init, delta=0, no trigger)
    // Frame 1: AF=60 (delta=60-0=60, >49 threshold => triggers)
    const track: KlattFrame[] = [
      { time: 0.0, params: { AF: 0 } },
      { time: 0.005, params: { AF: 60 } },
    ];

    interpreter.scheduleTrack(track, 0);

    const plstepEvents = events.filter((e) => e.type === "plstep");
    expect(plstepEvents.length).toBe(1);
    expect(plstepEvents[0].trigger).toBe("AF");
    expect(plstepEvents[0].delta).toBe(60);
  });

  it("does NOT fire PLSTEP for small delta when state is correctly tracked", () => {
    const events: TelemetryEvent[] = [];
    const telemetryHandler = (event: TelemetryEvent) => events.push(event);

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      semantics: minimalSemantics(),
      telemetryHandler,
    });

    // Frame 0: AF=0 (same as prevAF init, delta=0 => no trigger)
    // Frame 1: AF=60 (delta=60-0=60 => triggers)
    // Frame 2: AF=55 (delta=55-60=-5 => should NOT trigger)
    //
    // If prevAF were stuck at 0 (a bug), frame 2 would see:
    //   delta = 55-0 = 55 => would trigger (WRONG)
    const track: KlattFrame[] = [
      { time: 0.0, params: { AF: 0 } },
      { time: 0.005, params: { AF: 60 } },
      { time: 0.01, params: { AF: 55 } },
    ];

    interpreter.scheduleTrack(track, 0);

    const plstepEvents = events.filter((e) => e.type === "plstep");
    // Frame 0: AF=0 vs prevAF=0 => delta=0 => no trigger
    // Frame 1: AF=60 vs prevAF=0 => delta=60 => triggers (1)
    // Frame 2: AF=55 vs prevAF=60 => delta=-5 => does NOT trigger
    expect(plstepEvents.length).toBe(1);
  });

  it("does not throw when telemetryHandler is not provided", () => {
    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      semantics: minimalSemantics(),
      // No telemetryHandler
    });

    // Track with a >49 dB AF jump — should not throw
    const track: KlattFrame[] = [
      { time: 0.0, params: { AF: 0 } },
      { time: 0.005, params: { AF: 60 } },
    ];

    expect(() => interpreter.scheduleTrack(track, 0)).not.toThrow();
  });

  it("does NOT fire PLSTEP for AH-only jump (aspiration is not a burst)", () => {
    const events: TelemetryEvent[] = [];
    const telemetryHandler = (event: TelemetryEvent) => events.push(event);

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      semantics: minimalSemantics(),
      telemetryHandler,
    });

    // AH jumps from 0 to 55 (>49 threshold) but PLSTEP should NOT fire.
    // Aspiration onset is gradual glottal noise, not a burst transient.
    // Only AF (supraglottal frication) triggers PLSTEP (Klatt 1980 PARCOE.FOR).
    const track: KlattFrame[] = [
      { time: 0.0, params: { AH: 0 } },
      { time: 0.005, params: { AH: 55 } },
    ];

    interpreter.scheduleTrack(track, 0);

    const plstepEvents = events.filter((e) => e.type === "plstep");
    expect(plstepEvents.length).toBe(0);
  });
});
