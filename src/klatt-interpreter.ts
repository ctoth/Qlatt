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

// =============================================================================
// Standard Functions for Semantics Evaluation
// =============================================================================

const standardFunctions: Record<string, (...args: number[]) => number> = {
  dbToLinear: (db: number): number => {
    if (!Number.isFinite(db) || db <= -72) return 0;
    return Math.pow(2, Math.min(96, db) / 6);
  },
  min: (a: number, b: number): number => Math.min(a, b),
  max: (a: number, b: number): number => Math.max(a, b),
  pow: (base: number, exp: number): number => Math.pow(base, exp),
};

// =============================================================================
// Proximity Correction (A2COR/A3COR)
// =============================================================================

const ndbCor = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function proximity(delta: number): number {
  if (!Number.isFinite(delta) || delta < 50 || delta >= 550) return 0;
  const index = Math.floor(delta / 50) - 1;
  return ndbCor[Math.max(0, Math.min(index, ndbCor.length - 1))] ?? 0;
}

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

  // Build binding map: semantics output name -> AudioParam
  const bindings = new Map<string, Binding>();
  const rampParams = new Set(['aspGain', 'fricGain', 'fricGainScaled']);

  // Walk graph nodes to build bindings
  log('Building binding map');
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (!nodeDef.params) continue;

    const audioNode = runtime.getNode(nodeId);
    if (!audioNode) {
      log(`  Warning: No audio node for ${nodeId}`);
      continue;
    }

    for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
      if (typeof paramSpec === 'object' && paramSpec !== null && 'bind' in paramSpec) {
        const bindName = (paramSpec as { bind: string }).bind;
        const param = getAudioParam(audioNode, paramName);
        if (param) {
          bindings.set(bindName, {
            param,
            nodeId,
            paramName,
            ramp: rampParams.has(bindName),
          });
          log(`  Bound ${bindName} -> ${nodeId}.${paramName}`);
        }
      }
    }
  }
  log(`Built ${bindings.size} bindings`);

  // Track state for PLSTEP detection
  let lastAF = 0;
  let lastAH = 0;
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
   */
  function buildContext(params: Record<string, number>): Record<string, unknown> {
    // Start with constants
    const ctx: Record<string, unknown> = { ...constants };

    // Add standard functions
    Object.assign(ctx, standardFunctions);

    // Add frame params
    for (const [key, value] of Object.entries(params)) {
      ctx[key] = value;
    }

    // Add proximity function
    ctx['proximity'] = proximity;

    // Compute proximity corrections inline (since semantic expressions reference them)
    const f1 = params.F1 ?? 500;
    const f2 = params.F2 ?? 1500;
    const f3 = params.F3 ?? 2500;
    const f4 = params.F4 ?? 3500;
    ctx['n12Cor'] = proximity(f2 - f1);
    ctx['n23Cor'] = proximity(f3 - f2 - 50);
    ctx['n34Cor'] = proximity(f4 - f3 - 150);

    // Default values for optional params
    ctx['G0'] = params.GO ?? params.G0 ?? 47;
    ctx['parallelScale'] = params.parallelScale ?? 1.0;
    ctx['sampleRate'] = audioContext.sampleRate;

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

    // Apply to all bindings
    for (const [name, binding] of bindings) {
      const value = realized[name];
      if (typeof value === 'number') {
        scheduleParam(binding.param, value, atTime, ramp && binding.ramp);
      }
    }

    // Also apply raw formant params directly (F1-F6, B1-B6)
    // These are passed through without semantics transformation
    const directParams = [
      'F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
      'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
      'FNZ', 'BNZ', 'FNP', 'BNP',
      'FGP', 'BGP', 'FGZ', 'BGZ', 'BGS',
      'Rd', 'lfMode', 'openPhaseRatio',
    ];

    for (const paramName of directParams) {
      const value = params[paramName];
      if (typeof value === 'number') {
        const binding = bindings.get(paramName);
        if (binding) {
          scheduleParam(binding.param, value, atTime, false);
        }
      }
    }
  }

  /**
   * Schedule ramps for aspiration/frication to next frame
   */
  function scheduleRamps(nextParams: Record<string, number>, nextTime: number): void {
    const realized = evaluateSemantics(nextParams);

    // Ramp aspiration
    const aspGain = realized['aspGain'];
    if (typeof aspGain === 'number') {
      const binding = bindings.get('aspGain');
      if (binding) {
        binding.param.linearRampToValueAtTime(aspGain, nextTime);
        scheduledParams.add(binding.param);
      }
    }

    // Ramp frication
    const fricGain = realized['fricGain'] ?? realized['fricGainScaled'];
    if (typeof fricGain === 'number') {
      const binding = bindings.get('fricGain') ?? bindings.get('fricGainScaled');
      if (binding) {
        binding.param.linearRampToValueAtTime(fricGain, nextTime);
        scheduledParams.add(binding.param);
      }
    }
  }

  /**
   * Schedule PLSTEP burst transient for plosive release
   */
  function scheduleBurstTransient(
    atTime: number,
    params: Record<string, number>,
    triggerParam: string,
    triggerDelta: number
  ): void {
    // Calculate burst amplitude per PARCOE.FOR
    const goDb = params.GO ?? params.G0 ?? 47;
    const burstDb = goDb - 75;  // Matches Klatt 80 with ndbScale compensation
    const burstAmplitude = standardFunctions.dbToLinear(burstDb);

    // Find plstepGain node
    const plstepGain = bindings.get('plstepGain');
    if (!plstepGain) {
      log('  Warning: No plstepGain binding for burst transient');
      return;
    }

    // Emit telemetry
    if (telemetryHandler) {
      telemetryHandler({
        type: 'plstep',
        nodeId: 'plstep',
        time: atTime,
        amplitudeLinear: burstAmplitude,
        amplitudeDb: burstDb,
        trigger: triggerParam,
        delta: triggerDelta,
      });
    }

    // COEWAV.FOR: STEP = 0.995 * STEP at 10kHz = 92ms decay
    const burstDuration = 0.092;

    // Cancel any previous burst at this time
    plstepGain.param.cancelScheduledValues(atTime);

    // Set initial negative burst (rarefaction)
    plstepGain.param.setValueAtTime(-burstAmplitude, atTime);

    // Exponential decay (can't reach exactly 0, use small value)
    const decayEnd = atTime + burstDuration;
    plstepGain.param.exponentialRampToValueAtTime(-0.0001, decayEnd);
    plstepGain.param.setValueAtTime(0, decayEnd + 0.001);

    scheduledParams.add(plstepGain.param);
  }

  /**
   * Detect PLSTEP burst condition
   */
  function detectBurst(
    event: KlattFrame,
    currentAF: number,
    currentAH: number
  ): { isBurst: boolean; triggerParam: string; triggerDelta: number } {
    const isStopRelease = typeof event.phoneme === 'string' &&
      (event.phoneme.endsWith('_REL') || event.phoneme.endsWith('_ASP'));

    const afDelta = currentAF - lastAF;
    const ahDelta = currentAH - lastAH;

    // Klatt 80 threshold: 49 dB jump
    const isBurst = isStopRelease && (
      (lastAF <= 5 && afDelta >= 49) ||
      (lastAH <= 5 && ahDelta >= 49)
    );

    const triggerParam = (lastAF <= 5 && afDelta >= 49) ? 'AF' : 'AH';
    const triggerDelta = triggerParam === 'AF' ? afDelta : ahDelta;

    return { isBurst, triggerParam, triggerDelta };
  }

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

    // Reset PLSTEP tracking
    lastAF = 0;
    lastAH = 0;

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

      // PLSTEP detection (skip first frame for delta calculation)
      if (i === 0) {
        lastAF = event.params.AF ?? 0;
        lastAH = event.params.AH ?? 0;
        continue;
      }

      const currentAF = event.params.AF ?? 0;
      const currentAH = event.params.AH ?? 0;

      const { isBurst, triggerParam, triggerDelta } = detectBurst(event, currentAF, currentAH);
      if (isBurst) {
        scheduleBurstTransient(t, event.params, triggerParam, triggerDelta);
      }

      lastAF = currentAF;
      lastAH = currentAH;
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
