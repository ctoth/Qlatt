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
    telemetryHandler,
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

  // Derive direct params from graph bindings (replaces hardcoded list)
  // These params are passed through without semantics transformation
  const directParams = new Set<string>();
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    for (const paramSpec of Object.values(nodeDef.params ?? {})) {
      if (typeof paramSpec === 'object' && paramSpec !== null && 'bind' in paramSpec) {
        directParams.add((paramSpec as { bind: string }).bind);
      }
    }
  }

  // Count total bindings
  let totalBindings = 0;
  for (const list of bindings.values()) {
    totalBindings += list.length;
  }
  log(`Built ${bindings.size} unique bindings (${totalBindings} total targets), ${directParams.size} direct params`);

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
   * Fully data-driven: defaults from semantics, then track params overlay
   */
  function buildContext(params: Record<string, number>): Record<string, unknown> {
    // Start with constants
    const ctx: Record<string, unknown> = { ...constants };

    // Add standard functions
    Object.assign(ctx, standardFunctions);

    // Apply all defaults from semantics
    for (const [name, value] of paramDefaults) {
      ctx[name] = value;
    }

    // Overlay track params (these override defaults)
    for (const [key, value] of Object.entries(params)) {
      ctx[key] = value;
    }

    // Add proximity function (imported from klatt-functions)
    ctx['proximity'] = proximityFn;

    // Add computed values
    ctx['sampleRate'] = audioContext.sampleRate;

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

  /**
   * Apply a single value to an AudioParam
   */
  function scheduleParam(
    param: AudioParam,
    value: number,
    atTime: number,
    ramp: boolean
  ): void {
    if (!Number.isFinite(value)) return;

    scheduledParams.add(param);

    if (ramp) {
      param.linearRampToValueAtTime(value, atTime);
    } else {
      param.setValueAtTime(value, atTime);
    }
  }

  /**
   * Apply a frame's realized values to all bound params
   */
  function applyFrame(params: Record<string, number>, atTime: number, ramp: boolean): void {
    // Evaluate semantics
    const realized = evaluateSemantics(params);

    // Apply to all bindings (each semantic name may have multiple targets)
    for (const [name, bindingList] of bindings) {
      const value = realized[name];
      if (typeof value === 'number') {
        for (const binding of bindingList) {
          scheduleParam(binding.param, value, atTime, ramp && binding.ramp);
        }
      }
    }

    // Also apply direct params (derived from graph bindings)
    // These are passed through without semantics transformation
    for (const paramName of directParams) {
      const value = params[paramName];
      if (typeof value === 'number') {
        const bindingList = bindings.get(paramName);
        if (bindingList) {
          for (const binding of bindingList) {
            scheduleParam(binding.param, value, atTime, false);
          }
        }
      }
    }

  }

  /**
   * Schedule ramps for aspiration/frication to next frame
   * Iterates over all params marked with ramp: true in semantics.yaml
   */
  function scheduleRamps(nextParams: Record<string, number>, nextTime: number): void {
    const realized = evaluateSemantics(nextParams);

    // Iterate ALL ramp params instead of hardcoding names
    for (const paramName of rampParams) {
      const value = realized[paramName];
      if (typeof value === 'number') {
        const bindingList = bindings.get(paramName);
        if (bindingList) {
          for (const binding of bindingList) {
            binding.param.linearRampToValueAtTime(value, nextTime);
            scheduledParams.add(binding.param);
          }
        }
      }
    }
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
   * Schedule entire track for playback
   */
  function scheduleTrack(track: KlattFrame[], startTime: number): void {
    if (!track || track.length === 0) {
      log('Empty track, nothing to schedule');
      return;
    }

    // Cancel any previous scheduling
    cancelScheduled();

    const baseTime = startTime;
    log(`Scheduling ${track.length} frames starting at ${baseTime.toFixed(3)}s`);

    // Warmup: Apply first frame IMMEDIATELY to prime resonators
    if (track[0]?.params) {
      log('Warmup: applying first frame at currentTime');
      applyFrame(track[0].params, audioContext.currentTime, false);
    }

    // Schedule all frames
    for (let i = 0; i < track.length; i++) {
      const event = track[i];
      if (!event?.params) continue;

      const t = baseTime + event.time;
      applyFrame(event.params, t, false);

      // Lookahead for ramps
      const next = track[i + 1];
      if (next?.params) {
        const nextTime = baseTime + next.time;
        scheduleRamps(next.params, nextTime);
      }
    }

    // Record track duration
    const lastFrame = track[track.length - 1];
    trackDuration = lastFrame ? lastFrame.time : 0;

    log(`Track scheduled: ${trackDuration.toFixed(3)}s duration`);
  }

  return {
    scheduleTrack,
    cancelScheduled,
    getTrackDuration(): number {
      return trackDuration;
    },
  };
}
