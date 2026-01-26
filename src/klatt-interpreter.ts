/**
 * Klatt Track Interpreter
 *
 * Consumes Klatt parameter tracks and schedules them to WebAudio nodes.
 * Bridges the TTS frontend's track output with the new YAML-driven runtime.
 *
 * Key responsibilities:
 * 1. Pre-schedule all parameter changes at once (declarative scheduling)
 * 2. Evaluate semantics for each frame (dB->linear, ndbScale, proximity corrections)
 * 3. Apply realized values to bound AudioParams at correct times
 * 4. Handle ramps for aspiration/frication (Klatt 80 linear interpolation)
 * 5. PLSTEP burst transients for plosive releases
 */

import { createTopologicalEvaluator } from './semantics/topological-evaluator.js';
import type { SemanticsDocument, ParamValue } from './semantics/types.js';
import type { KlattRuntime, BaconGraph } from './klatt-runtime.js';
import { dbToLinear, proximity as proximityFn, min, max, pow } from './klatt-functions.js';

// =============================================================================
// Types
// =============================================================================

export interface KlattFrame {
  time: number;                          // Seconds from utterance start
  phoneme?: string;                      // Optional label (e.g., "AH1", "P_REL")
  word?: string;                         // Optional source word
  params: Record<string, number>;        // Klatt parameters
}

export interface KlattTrack {
  frames: KlattFrame[];
}

interface Binding {
  param: AudioParam;
  nodeId: string;
  paramName: string;
  ramp: boolean;  // true for aspiration/frication
}

// Multiple nodes can bind to the same semantic name (e.g., F0 -> lfSource.f0, impulseSource.f0)
type BindingList = Binding[];

// Schedule entry for pre-compiled parameter automation
type ScheduleEntry = {
  time: number;
  param: AudioParam;
  value: number;
  ramp: boolean;  // true = linearRampToValueAtTime, false = setValueAtTime
};

export interface KlattInterpreterOptions {
  audioContext: AudioContext;
  runtime: KlattRuntime;
  graph: BaconGraph;
  semantics: SemanticsDocument;
  logger?: (msg: string) => void;
  telemetryHandler?: (event: TelemetryEvent) => void;
}

export interface TelemetryEvent {
  type: string;
  nodeId?: string;
  time?: number;
  [key: string]: unknown;
}

export interface KlattInterpreter {
  /**
   * Schedule an entire track for playback.
   * @param track Array of frames with time and params
   * @param startTime AudioContext time when playback begins
   */
  scheduleTrack(track: KlattFrame[], startTime: number): void;

  /**
   * Cancel all scheduled parameter changes.
   */
  cancelScheduled(): void;

  /**
   * Get the duration of the last scheduled track.
   */
  getTrackDuration(): number;
}

// Standard functions imported from klatt-functions.js
const standardFunctions: Record<string, (...args: number[]) => number> = {
  dbToLinear,
  min,
  max,
  pow,
};

// =============================================================================
// Interpreter Factory
// =============================================================================

export function createKlattInterpreter(options: KlattInterpreterOptions): KlattInterpreter {
  const {
    audioContext,
    runtime,
    graph,
    semantics,
    logger = () => {},
  } = options;

  const log = (msg: string) => logger(`[klatt-interpreter] ${msg}`);

  // Create topological evaluator for semantics
  const evaluator = createTopologicalEvaluator();

  // Extract constants from semantics
  const constants: Record<string, unknown> = {};
  if (semantics.constants) {
    for (const [key, value] of Object.entries(semantics.constants)) {
      constants[key] = value;
    }
  }

  // Build param defaults map from semantics.params at init time
  const paramDefaults = new Map<string, number>();
  if (semantics.params) {
    for (const [name, def] of Object.entries(semantics.params)) {
      if (typeof def === 'object' && def !== null && 'default' in def) {
        paramDefaults.set(name, def.default as number);
      }
    }
  }
  log(`Loaded ${paramDefaults.size} param defaults from semantics`);

  // Build static context once at init time (constants + functions + defaults)
  // This avoids rebuilding these every frame
  const staticContext: Record<string, unknown> = { ...constants };
  Object.assign(staticContext, standardFunctions);
  for (const [name, value] of paramDefaults) {
    staticContext[name] = value;
  }
  staticContext['proximity'] = proximityFn;
  staticContext['sampleRate'] = audioContext.sampleRate;
  log(`Built staticContext with ${Object.keys(staticContext).length} entries`);

  // Build binding map: semantics output name -> list of AudioParams
  // Multiple nodes can bind to the same semantic name (e.g., F0 -> lfSource.f0, impulseSource.f0)
  const bindings = new Map<string, BindingList>();

  // Derive ramp params from semantics (replaces hardcoded set)
  const rampParams = new Set<string>();
  if (semantics.realize) {
    for (const [name, rule] of Object.entries(semantics.realize)) {
      if (typeof rule === 'object' && rule !== null && (rule as { ramp?: boolean }).ramp === true) {
        rampParams.add(name);
      }
    }
  }

  // Walk graph nodes to build bindings
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (!nodeDef.params) continue;

    const audioNode = runtime.getNode(nodeId);
    if (!audioNode) {
      log(`  Warning: No audio node for ${nodeId} (type: ${nodeDef.type})`);
      continue;
    }

    for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
      if (typeof paramSpec === 'object' && paramSpec !== null && 'bind' in paramSpec) {
        const bindName = (paramSpec as { bind: string }).bind;
        const param = getAudioParam(audioNode, paramName);
        if (param) {
          // Append to binding list (don't overwrite!)
          const existing = bindings.get(bindName) ?? [];
          existing.push({
            param,
            nodeId,
            paramName,
            ramp: rampParams.has(bindName),
          });
          bindings.set(bindName, existing);
        }
      }
    }
  }

  // Partition bindings into realized (has realize rule) vs passthrough (no rule)
  // This ensures each binding is written exactly once with the correct value
  const realizedNames = new Set(Object.keys(semantics.realize || {}));
  const realizedBindings = new Set<string>();
  const passthroughBindings = new Set<string>();
  for (const name of bindings.keys()) {
    if (realizedNames.has(name)) {
      realizedBindings.add(name);
    } else {
      passthroughBindings.add(name);
    }
  }

  // Flatten binding lists at init time to avoid repeated Map lookups and null checks
  type FlatBinding = { name: string; param: AudioParam; ramp: boolean };

  // Flatten realized bindings
  const realizedBindingsList: FlatBinding[] = [];
  for (const name of realizedBindings) {
    const bindingList = bindings.get(name);
    if (bindingList) {
      for (const binding of bindingList) {
        realizedBindingsList.push({ name, param: binding.param, ramp: binding.ramp });
      }
    }
  }

  // Flatten passthrough bindings
  const passthroughBindingsList: FlatBinding[] = [];
  for (const name of passthroughBindings) {
    const bindingList = bindings.get(name);
    if (bindingList) {
      for (const binding of bindingList) {
        passthroughBindingsList.push({ name, param: binding.param, ramp: binding.ramp });
      }
    }
  }

  // Flatten ramp bindings
  const rampBindingsList: FlatBinding[] = [];
  for (const name of rampParams) {
    const bindingList = bindings.get(name);
    if (bindingList) {
      for (const binding of bindingList) {
        rampBindingsList.push({ name, param: binding.param, ramp: binding.ramp });
      }
    }
  }

  // Count total bindings
  let totalBindings = 0;
  for (const list of bindings.values()) {
    totalBindings += list.length;
  }
  log(`Built ${bindings.size} unique bindings (${totalBindings} total targets), ${realizedBindings.size} realized, ${passthroughBindings.size} passthrough`);

  // Track duration for getTrackDuration()
  let trackDuration = 0;

  // Store all scheduled params for cancellation
  const scheduledParams = new Set<AudioParam>();

  /**
   * Get AudioParam from node by name
   */
  function getAudioParam(node: AudioNode, paramName: string): AudioParam | null {
    const anyNode = node as unknown as Record<string, unknown>;

    // Handle GainNode
    if (paramName === 'gain' && anyNode.gain) {
      return anyNode.gain as AudioParam;
    }

    // Handle ConstantSourceNode
    if (paramName === 'offset' && anyNode.offset) {
      return anyNode.offset as AudioParam;
    }

    // Handle AudioWorkletNode parameters
    if (anyNode.parameters && typeof (anyNode.parameters as Map<string, AudioParam>).get === 'function') {
      const param = (anyNode.parameters as Map<string, AudioParam>).get(paramName);
      if (param) return param;
    }

    return null;
  }

  /**
   * Build evaluation context from frame params
   * Uses prototype chain from staticContext to avoid copying constants/functions/defaults every frame
   */
  function buildContext(params: Record<string, number>): Record<string, unknown> {
    // Use prototype chain from staticContext (no copy of static parts)
    const ctx = Object.create(staticContext) as Record<string, unknown>;

    // Overlay track params (these override defaults via own properties)
    Object.assign(ctx, params);

    // Compute proximity corrections (using defaults-then-overlay values)
    const f1 = ctx['F1'] as number;
    const f2 = ctx['F2'] as number;
    const f3 = ctx['F3'] as number;
    const f4 = ctx['F4'] as number;
    ctx['n12Cor'] = proximityFn(f2 - f1);
    ctx['n23Cor'] = proximityFn(f3 - f2 - 50);
    ctx['n34Cor'] = proximityFn(f4 - f3 - 150);

    return ctx;
  }

  /**
   * Evaluate semantics and return realized values
   */
  function evaluateSemantics(params: Record<string, number>): Record<string, ParamValue> {
    const context = buildContext(params);
    const result = evaluator.evaluate(semantics, context);

    if (result.errors.length > 0) {
      for (const err of result.errors) {
        log(`  Semantics error in ${err.name}: ${err.error}`);
      }
    }

    return result.values;
  }

  // NOTE: PLSTEP burst detection/scheduling removed - now handled automatically
  // by edge-detector + decay-envelope chain in the audio graph.

  /**
   * Cancel all scheduled parameter automation
   */
  function cancelScheduled(): void {
    const now = audioContext.currentTime;
    for (const param of scheduledParams) {
      try {
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
      } catch (e) {
        // Ignore errors on already-cancelled params
      }
    }
    scheduledParams.clear();
  }

  /**
   * Compile entire track into a flat schedule of parameter changes.
   * All semantics evaluation happens here - no logic in executeSchedule.
   */
  function compileSchedule(track: KlattFrame[], baseTime: number): ScheduleEntry[] {
    const schedule: ScheduleEntry[] = [];

    for (let i = 0; i < track.length; i++) {
      const frame = track[i];
      if (!frame?.params) continue;

      const t = baseTime + frame.time;
      const realized = evaluateSemantics(frame.params);

      // Add step entries for realized bindings
      for (const { name, param } of realizedBindingsList) {
        const value = realized[name];
        if (typeof value === 'number') {
          schedule.push({ time: t, param, value, ramp: false });
        }
      }

      // Add step entries for passthrough bindings
      for (const { name, param } of passthroughBindingsList) {
        const value = frame.params[name];
        if (typeof value === 'number') {
          schedule.push({ time: t, param, value, ramp: false });
        }
      }

      // Add ramp entries (for frames after the first)
      if (i > 0) {
        for (const { name, param } of rampBindingsList) {
          const value = realized[name];
          if (typeof value === 'number') {
            schedule.push({ time: t, param, value, ramp: true });
          }
        }
      }
    }

    return schedule;
  }

  /**
   * Execute a pre-compiled schedule.
   * Pure AudioParam writes, no evaluation logic.
   */
  function executeSchedule(schedule: ScheduleEntry[]): void {
    for (const { time, param, value, ramp } of schedule) {
      if (ramp) {
        param.linearRampToValueAtTime(value, time);
      } else {
        param.setValueAtTime(value, time);
      }
      scheduledParams.add(param);
    }
  }

  /**
   * Schedule entire track for playback
   */
  function scheduleTrack(track: KlattFrame[], startTime: number): void {
    if (!track || track.length === 0) {
      log('Empty track, nothing to schedule');
      return;
    }

    // Cancel any previous scheduling
    cancelScheduled();

    const baseTime = startTime ?? audioContext.currentTime;
    trackDuration = track[track.length - 1]?.time ?? 0;

    log(`Scheduling ${track.length} frames starting at ${baseTime.toFixed(3)}s`);

    // Compile entire schedule (all semantics evaluation happens here)
    const schedule = compileSchedule(track, baseTime);

    // Execute schedule (pure AudioParam writes, no logic)
    executeSchedule(schedule);

    log(`Track scheduled: ${trackDuration.toFixed(3)}s duration, ${schedule.length} entries`);
  }

  return {
    scheduleTrack,
    cancelScheduled,
    getTrackDuration(): number {
      return trackDuration;
    },
  };
}
