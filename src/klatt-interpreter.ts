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

import { createConfiguredEvaluator } from './semantics/evaluator-factory';
import type { SemanticsDocument, ParamValue, EvaluationContext } from './semantics/types';
import type { KlattRuntime, BaconGraph, BindingSpec } from './klatt-runtime';
import { dbToLinear } from './builtin-functions';
import { getAudioParam } from './audio-param-utils';

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

interface ResolvedBinding {
  param: AudioParam;
  nodeId: string;
  paramName: string;
}

// Multiple nodes can bind to the same semantic name (e.g., F0 -> lfSource.f0, impulseSource.f0)
type ResolvedBindingList = ResolvedBinding[];

/**
 * Tagged union for binding categorization.
 * Makes the mutual-exclusion invariant structural and compiler-checked:
 * - 'realized': has a realize rule, uses setValueAtTime every frame
 * - 'ramp': has a realize rule with ramp: true, uses setValueAtTime at frame 0
 *           and linearRampToValueAtTime for subsequent frames
 * - 'passthrough': no realize rule, raw param value passed through with setValueAtTime
 */
type CategorizedBinding = {
  name: string;
  param: AudioParam;
  type: 'realized' | 'ramp' | 'passthrough';
};

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
  // Optional: binding map from runtime (avoids duplicate graph traversal)
  // If not provided, interpreter builds bindings locally (backward compatible)
  bindingMap?: Map<string, BindingSpec[]>;
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

// requireNumericArg and registerNumericBuiltins moved to ./semantics/register-builtins.ts

// =============================================================================
// Exported Context Builders (testable, pure functions)
// =============================================================================

/**
 * Build the static context from constants, param defaults, and sampleRate.
 * Contains only data values (numbers, strings, nested objects) — no functions.
 * Functions are registered with the CEL evaluator separately.
 */
export function buildStaticContext(
  constants: Record<string, unknown>,
  paramDefaults: Map<string, number>,
  sampleRate: number,
): Record<string, unknown> {
  const ctx: Record<string, unknown> = { ...constants };
  for (const [name, value] of paramDefaults) {
    ctx[name] = value;
  }
  ctx['sampleRate'] = sampleRate;
  return ctx;
}

/**
 * Build a per-frame evaluation context by deep-copying staticContext and overlaying frame params.
 * Uses structuredClone to protect nested objects (e.g., ndbScale) from mutation.
 */
export function buildFrameContext(
  staticContext: Record<string, unknown>,
  params: Record<string, number>,
): Record<string, unknown> {
  // Deep clone is required here — a shallow copy (Object.assign / spread) is NOT sufficient.
  //
  // cel-js mutates the evaluation context in-place during collection macro expansion
  // (e.g., .exists(), .all(), .filter()). Specifically, evaluateWithBinding() in
  // cel-js's visitor.js assigns temporary iteration variables directly onto the
  // context object. If the context contains nested objects (like ndbScale, which holds
  // dB-offset lookup tables), shallow-copied references would share those nested objects
  // with staticContext, and any macro-driven mutation would corrupt the shared state
  // across all subsequent frames.
  //
  // Performance: structuredClone on the ~30-key staticContext takes sub-microsecond
  // per call. At typical frame rates (100-200 frames/utterance), total overhead is
  // well under 1ms — negligible compared to WebAudio scheduling.
  const ctx: Record<string, unknown> = structuredClone(staticContext);
  // Overlay track params (these override defaults)
  Object.assign(ctx, params);
  return ctx;
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

  // Create CEL + topological evaluator pair with all standard builtins
  const { celEvaluator, topoEvaluator: evaluator } = createConfiguredEvaluator();

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

  // Build static context once at init time (constants + defaults + sampleRate)
  // Contains only data values — functions are registered with the CEL evaluator separately
  const staticContext = buildStaticContext(constants, paramDefaults, audioContext.sampleRate);
  log(`Built staticContext with ${Object.keys(staticContext).length} entries`);

  // Build binding map: semantics output name -> list of AudioParams
  // Multiple nodes can bind to the same semantic name (e.g., F0 -> lfSource.f0, impulseSource.f0)
  const bindings = new Map<string, ResolvedBindingList>();

  // Derive ramp params from semantics (replaces hardcoded set)
  const rampParams = new Set<string>();
  if (semantics.realize) {
    for (const [name, rule] of Object.entries(semantics.realize)) {
      if (typeof rule === 'object' && rule !== null && (rule as { ramp?: boolean }).ramp === true) {
        rampParams.add(name);
      }
    }
  }

  // Build bindings: use provided bindingMap if available (from runtime), otherwise walk graph
  // Either way, we need to resolve AudioParams from runtime nodes
  const sourceBindingMap = options.bindingMap ?? runtime.getBindingMap();

  for (const [bindName, bindingInfoList] of sourceBindingMap) {
    for (const { nodeId, paramName } of bindingInfoList) {
      const audioNode = runtime.getNode(nodeId);
      if (!audioNode) {
        log(`  Warning: No audio node for ${nodeId}`);
        continue;
      }
      const param = getAudioParam(audioNode, paramName);
      if (param) {
        const existing = bindings.get(bindName) ?? [];
        existing.push({ param, nodeId, paramName });
        bindings.set(bindName, existing);
      }
    }
  }

  // Categorize all bindings into a single tagged-union list.
  // Each binding gets exactly one discriminant: 'ramp', 'realized', or 'passthrough'.
  // This makes the mutual-exclusion invariant structural — no procedural if/continue logic.
  const realizedNames = new Set(Object.keys(semantics.realize || {}));
  const allBindings: CategorizedBinding[] = [];

  let realizedCount = 0;
  let rampCount = 0;
  let passthroughCount = 0;

  for (const [name, bindingList] of bindings) {
    let type: CategorizedBinding['type'];
    if (rampParams.has(name)) {
      type = 'ramp';
      rampCount++;
    } else if (realizedNames.has(name)) {
      type = 'realized';
      realizedCount++;
    } else {
      type = 'passthrough';
      passthroughCount++;
    }
    for (const binding of bindingList) {
      allBindings.push({ name, param: binding.param, type });
    }
  }

  log(`Built ${bindings.size} unique bindings (${allBindings.length} total targets), ${realizedCount} realized, ${rampCount} ramp, ${passthroughCount} passthrough`);

  // Track duration for getTrackDuration()
  let trackDuration = 0;

  // Store all scheduled params for cancellation
  const scheduledParams = new Set<AudioParam>();

  /**
   * Build evaluation context from frame params
   * Uses buildFrameContext (structuredClone) to protect nested objects from mutation.
   */
  function buildContext(params: Record<string, number>): Record<string, unknown> {
    // Proximity corrections (n12Cor, n23Cor, n34Cor) are computed by
    // realize rules in semantics.yaml via the proximity() CEL function.
    // No hardcoded computation needed here.
    return buildFrameContext(staticContext, params);
  }

  /**
   * Evaluate semantics and return realized values
   */
  function evaluateSemantics(params: Record<string, number>): Record<string, ParamValue> {
    const flatContext = buildContext(params);
    // Build EvaluationContext for topological evaluator
    // Functions are registered with CEL evaluator separately (lines 117-120)
    const context: EvaluationContext = {
      params: flatContext as Record<string, ParamValue>,
      constants: semantics.constants ?? {},
    };
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
        log(`Warning: cancelScheduledValues failed for param: ${e instanceof Error ? e.message : e}`);
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

    // PLSTEP detection state
    let prevAF = -70;
    let prevAH = -70;
    // Read threshold from semantics constant (single source of truth), fallback to 49
    const PLSTEP_THRESHOLD = (typeof constants['plstepThreshold'] === 'number')
      ? constants['plstepThreshold']
      : 49;  // dB rise threshold for burst detection (Klatt 80 PARCOE.FOR)
    // Read burst amplitude offset from semantics constant, fallback to 75
    const PLSTEP_BURST_OFFSET_DB = (typeof constants['plstepBurstOffsetDb'] === 'number')
      ? constants['plstepBurstOffsetDb']
      : 75;  // Burst amplitude = GO - 75 dB (Klatt 80 PARCOE.FOR)

    for (let i = 0; i < track.length; i++) {
      const frame = track[i];
      if (!frame?.params) continue;

      const t = baseTime + frame.time;
      const realized = evaluateSemantics(frame.params);

      // PLSTEP detection: track AF/AH state unconditionally, emit telemetry if handler present
      const currentAF = frame.params.AF ?? -70;
      const currentAH = frame.params.AH ?? -70;

      if (telemetryHandler) {
        const deltaAF = currentAF - prevAF;
        const deltaAH = currentAH - prevAH;

        if (deltaAF >= PLSTEP_THRESHOLD || deltaAH >= PLSTEP_THRESHOLD) {
          const trigger = deltaAF >= deltaAH ? 'AF' : 'AH';
          const delta = Math.max(deltaAF, deltaAH);
          const goDb = frame.params.GO ?? 47;
          const burstDb = goDb - PLSTEP_BURST_OFFSET_DB;  // Klatt80 PLSTEP amplitude formula
          const burstAmplitude = dbToLinear(burstDb);

          telemetryHandler({
            type: 'plstep',
            nodeId: 'plstep',
            time: t,
            amplitudeLinear: burstAmplitude,
            amplitudeDb: burstDb,
            trigger,
            delta,
            phoneme: frame.phoneme ?? '',
          });
        }
      }

      // Always update state — delta tracking must not depend on telemetry being enabled
      prevAF = currentAF;
      prevAH = currentAH;

      // Schedule all bindings via tagged-union discriminant
      for (const binding of allBindings) {
        switch (binding.type) {
          case 'realized': {
            const value = realized[binding.name];
            if (typeof value === 'number') {
              schedule.push({ time: t, param: binding.param, value, ramp: false });
            }
            break;
          }
          case 'passthrough': {
            const value = frame.params[binding.name];
            if (typeof value === 'number') {
              schedule.push({ time: t, param: binding.param, value, ramp: false });
            }
            break;
          }
          case 'ramp': {
            // Ramp params: setValueAtTime at frame 0, linearRampToValueAtTime thereafter
            // This prevents double-write that would collapse ramps to steps
            const value = realized[binding.name];
            if (typeof value === 'number') {
              schedule.push({ time: t, param: binding.param, value, ramp: i > 0 });
            }
            break;
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

    const baseTime = startTime;
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
