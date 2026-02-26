/**
 * Tests for PLSTEP state tracking in klatt-interpreter.ts
 *
 * Verifies:
 * 1. prevAF/prevAH are tracked unconditionally (not gated on telemetryHandler)
 * 2. PLSTEP telemetry fires correctly for >49 dB AF/AH jumps
 * 3. PLSTEP telemetry does NOT fire for small deltas (state tracked frame-to-frame)
 * 4. No errors when telemetryHandler is not provided
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createKlattInterpreter,
  type KlattFrame,
  type TelemetryEvent,
} from '../src/klatt-interpreter';
import type { SemanticsDocument } from '../src/semantics/types';
import type { KlattRuntime, BaconGraph, BindingInfo } from '../src/klatt-runtime';

// ---------------------------------------------------------------------------
// Helpers: minimal mocks for AudioContext / AudioParam / KlattRuntime
// ---------------------------------------------------------------------------

/** Create a mock AudioParam that records calls */
function mockAudioParam(): AudioParam {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    // Satisfy AudioParam interface minimally
    automationRate: 'a-rate',
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
function mockWorkletNode(paramNames: string[]): AudioNode {
  const params = new Map<string, AudioParam>();
  for (const name of paramNames) {
    params.set(name, mockAudioParam());
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
    params: {
      AF: { default: 0, min: 0, max: 80 },
      AH: { default: 0, min: 0, max: 80 },
      GO: { default: 47, min: 0, max: 80 },
    },
    constants: {
      plstepThreshold: 49,
    },
    realize: {
      // AF and AH passthrough as-is (identity expressions)
      AF: { expr: 'AF', ramp: true },
      AH: { expr: 'AH', ramp: true },
    },
  };
}

/** Minimal graph */
function minimalGraph(): BaconGraph {
  return {
    bacon: '1.0',
    nodes: {},
  };
}

/** Create a mock KlattRuntime with an empty binding map */
function mockRuntime(): KlattRuntime {
  const emptyBindingMap = new Map<string, BindingInfo[]>();
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

describe('PLSTEP state tracking', () => {
  it('fires PLSTEP telemetry for >49 dB AF jump', () => {
    const events: TelemetryEvent[] = [];
    const telemetryHandler = (event: TelemetryEvent) => events.push(event);

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      graph: minimalGraph(),
      semantics: minimalSemantics(),
      telemetryHandler,
    });

    // Frame 0: AF=-70 (same as prevAF init, delta=0, no trigger)
    // Frame 1: AF=60 (delta=60-(-70)=130, >49 threshold => triggers)
    const track: KlattFrame[] = [
      { time: 0.0, params: { AF: -70 } },
      { time: 0.005, params: { AF: 60 } },
    ];

    interpreter.scheduleTrack(track, 0);

    const plstepEvents = events.filter(e => e.type === 'plstep');
    expect(plstepEvents.length).toBe(1);
    expect(plstepEvents[0].trigger).toBe('AF');
    expect(plstepEvents[0].delta).toBe(130);
  });

  it('does NOT fire PLSTEP for small delta when state is correctly tracked', () => {
    const events: TelemetryEvent[] = [];
    const telemetryHandler = (event: TelemetryEvent) => events.push(event);

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      graph: minimalGraph(),
      semantics: minimalSemantics(),
      telemetryHandler,
    });

    // Frame 0: AF=-70 (same as prevAF init, delta=0 => no trigger)
    // Frame 1: AF=60 (delta=60-(-70)=130 => triggers)
    // Frame 2: AF=55 (delta=55-60=-5 => should NOT trigger)
    //
    // If prevAF were stuck at -70 (the bug), frame 2 would see:
    //   delta = 55-(-70) = 125 => would trigger (WRONG)
    const track: KlattFrame[] = [
      { time: 0.0, params: { AF: -70 } },
      { time: 0.005, params: { AF: 60 } },
      { time: 0.010, params: { AF: 55 } },
    ];

    interpreter.scheduleTrack(track, 0);

    const plstepEvents = events.filter(e => e.type === 'plstep');
    // Frame 0: AF=-70 vs prevAF=-70 => delta=0 => no trigger
    // Frame 1: AF=60 vs prevAF=-70 => delta=130 => triggers (1)
    // Frame 2: AF=55 vs prevAF=60 => delta=-5 => does NOT trigger
    expect(plstepEvents.length).toBe(1);
  });

  it('does not throw when telemetryHandler is not provided', () => {
    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      graph: minimalGraph(),
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

  it('tracks AH state independently from AF', () => {
    const events: TelemetryEvent[] = [];
    const telemetryHandler = (event: TelemetryEvent) => events.push(event);

    const interpreter = createKlattInterpreter({
      audioContext: mockAudioContext(),
      runtime: mockRuntime(),
      graph: minimalGraph(),
      semantics: minimalSemantics(),
      telemetryHandler,
    });

    // Frame 0: AH=-70 (same as prevAH init, delta=0 => no trigger)
    // Frame 1: AH=55 (delta=55-(-70)=125, >49 threshold => triggers)
    const track: KlattFrame[] = [
      { time: 0.0, params: { AH: -70 } },
      { time: 0.005, params: { AH: 55 } },
    ];

    interpreter.scheduleTrack(track, 0);

    const plstepEvents = events.filter(e => e.type === 'plstep');
    // Frame 0: AH=-70 vs prevAH=-70 => delta=0 => no trigger
    // Frame 1: AH=55 vs prevAH=-70 => delta=125 => triggers
    expect(plstepEvents.length).toBe(1);
    expect(plstepEvents[0].trigger).toBe('AH');
  });
});
