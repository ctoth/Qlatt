import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { describe, it, expect } from 'vitest';

import { createCelEvaluator } from '../../src/semantics/cel-evaluator.js';
import { createTopologicalEvaluator } from '../../src/semantics/topological-evaluator.js';
import type {
  ParamValue,
  SemanticsDocument,
  RealizationRule,
  EvaluationContext,
} from '../../src/semantics/types.js';
import type { BaconGraph, ParamValueSpec } from '../../src/klatt-runtime.js';
import {
  dbToLinear,
  proximity,
  min,
  max,
  pow,
} from '../../src/builtin-functions.js';

type ApproxSpec = number | { value: number; tol?: number };

interface SchedulePointAssert {
  bind: string;
  time: number;
  tol?: number;
}

interface ScheduleAssertSpec {
  rampAt?: SchedulePointAssert[];
  stepAt?: SchedulePointAssert[];
}

interface AssertionSpec {
  approx?: Record<string, ApproxSpec>;
  expr?: string[];
}

interface FrameSpec {
  time: number;
  params: Record<string, number>;
}

interface TrackFrameSpec extends FrameSpec {
  phoneme?: string;
}

interface SnapshotSpec {
  time?: number;
  index?: number;
  assert: AssertionSpec;
}

interface RangeAssertSpec {
  min?: number;
  max?: number;
}

interface FingerprintSpec {
  keys: string[];
  assertRange: Record<string, RangeAssertSpec>;
}

interface YamlGraphTestSpec {
  name: string;
  sampleRate?: number;
  inputs?: Record<string, number>;
  frames?: FrameSpec[];
  track?: TrackFrameSpec[];
  snapshot?: SnapshotSpec;
  assertAllExpr?: string[];
  fingerprint?: FingerprintSpec;
  assert?: AssertionSpec;
  assertSchedule?: ScheduleAssertSpec;
}

interface YamlGraphSuite {
  suite?: string;
  semantics: string;
  graph: string;
  registry?: string;
  sampleRate?: number;
  defaultTol?: number;
  tests: YamlGraphTestSpec[];
}

function readYamlFile<T>(filePath: string): T {
  const absPath = path.resolve(process.cwd(), filePath);
  const text = fs.readFileSync(absPath, 'utf8');
  return yaml.load(text) as T;
}

function resolveNumber(value: ParamValue | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getParamDefaults(semantics: SemanticsDocument): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const [name, def] of Object.entries(semantics.params ?? {})) {
    if (typeof def.default === 'number' && Number.isFinite(def.default)) {
      defaults[name] = def.default;
    }
  }
  return defaults;
}

function getRampParams(semantics: SemanticsDocument): Set<string> {
  const ramps = new Set<string>();
  for (const [name, rule] of Object.entries(semantics.realize ?? {})) {
    if (typeof rule === 'object' && rule !== null && (rule as RealizationRule).expr) {
      if ((rule as { ramp?: boolean }).ramp === true) {
        ramps.add(name);
      }
    }
  }
  return ramps;
}

function buildBindingTargets(graph: BaconGraph): Map<string, MockAudioParam[]> {
  const targets = new Map<string, MockAudioParam[]>();

  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (!nodeDef.params) continue;

    for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
      const bindName = getBindName(paramSpec);
      if (!bindName) continue;

      const paramId = `${nodeId}.${paramName}`;
      const list = targets.get(bindName) ?? [];
      list.push(new MockAudioParam(paramId));
      targets.set(bindName, list);
    }
  }

  return targets;
}

function getBindName(spec: ParamValueSpec | undefined): string | null {
  if (!spec || typeof spec !== 'object') return null;
  if ('bind' in spec && typeof spec.bind === 'string') {
    return spec.bind;
  }
  return null;
}

class MockAudioParam {
  readonly id: string;
  readonly events: Array<{ type: 'set' | 'ramp'; time: number; value: number }> = [];
  value = 0;

  constructor(id: string) {
    this.id = id;
  }

  setValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ type: 'set', time, value });
  }

  linearRampToValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ type: 'ramp', time, value });
  }
}

interface ScheduleEntry {
  bind: string;
  time: number;
  value: number;
  ramp: boolean;
}

interface EvaluatedFrame {
  time: number;
  phoneme?: string;
  inputs: Record<string, number>;
  realized: Record<string, ParamValue>;
}

function createSemanticsHarness(
  semantics: SemanticsDocument,
  suiteSampleRate: number | undefined
): {
  evaluate(inputs: Record<string, number> | undefined, testSampleRate?: number): Record<string, ParamValue>;
  evalExpr(expr: string, values: Record<string, ParamValue>): ParamValue;
  rampParams: Set<string>;
} {
  const celEvaluator = createCelEvaluator();
  celEvaluator.registerFunction('dbToLinear', dbToLinear);
  celEvaluator.registerFunction('min', min);
  celEvaluator.registerFunction('max', max);
  celEvaluator.registerFunction('pow', pow);
  celEvaluator.registerFunction('proximity', proximity);

  const topoEvaluator = createTopologicalEvaluator(celEvaluator);
  const defaults = getParamDefaults(semantics);
  const constants = semantics.constants ?? {};
  const rampParams = getRampParams(semantics);

  function resolveSampleRate(inputs: Record<string, number>, testSampleRate?: number): number {
    const fromInputs = resolveNumber(inputs.sampleRate, NaN);
    if (Number.isFinite(fromInputs)) return fromInputs;
    if (Number.isFinite(testSampleRate)) return testSampleRate as number;
    if (Number.isFinite(suiteSampleRate)) return suiteSampleRate as number;
    if (Number.isFinite(defaults.sampleRate)) return defaults.sampleRate;
    return 48000;
  }

  function buildContext(inputs: Record<string, number>, sampleRate: number): Record<string, number> {
    const ctx: Record<string, number> = {
      ...defaults,
      ...inputs,
      sampleRate,
    };

    const f1 = resolveNumber(ctx.F1, 0);
    const f2 = resolveNumber(ctx.F2, 0);
    const f3 = resolveNumber(ctx.F3, 0);
    const f4 = resolveNumber(ctx.F4, 0);

    ctx.n12Cor = proximity(f2 - f1);
    ctx.n23Cor = proximity(f3 - f2 - 50);
    ctx.n34Cor = proximity(f4 - f3 - 150);

    return ctx;
  }

  function evaluate(
    inputs: Record<string, number> | undefined,
    testSampleRate?: number
  ): Record<string, ParamValue> {
    const safeInputs = inputs ?? {};
    const sampleRate = resolveSampleRate(safeInputs, testSampleRate);
    const params = buildContext(safeInputs, sampleRate);
    const context: EvaluationContext = { params, constants };
    const result = topoEvaluator.evaluate(semantics, context);

    if (result.errors.length > 0) {
      const message = result.errors.map((e) => `${e.name}: ${e.error}`).join(', ');
      throw new Error(`Semantics evaluation errors: ${message}`);
    }

    return result.values;
  }

  function evalExpr(expr: string, values: Record<string, ParamValue>): ParamValue {
    return celEvaluator.evaluate(expr, { params: values, constants });
  }

  return { evaluate, evalExpr, rampParams };
}

function evaluateTrack(
  track: TrackFrameSpec[],
  evaluate: (inputs: Record<string, number> | undefined, testSampleRate?: number) => Record<string, ParamValue>,
  testSampleRate?: number
): EvaluatedFrame[] {
  return track.map((frame) => ({
    time: frame.time,
    phoneme: frame.phoneme,
    inputs: frame.params,
    realized: evaluate(frame.params, testSampleRate),
  }));
}

function pickSnapshotFrame(frames: EvaluatedFrame[], snapshot: SnapshotSpec): EvaluatedFrame {
  if (frames.length === 0) {
    throw new Error('Snapshot requested but track is empty');
  }

  if (Number.isInteger(snapshot.index)) {
    const idx = snapshot.index as number;
    if (idx < 0 || idx >= frames.length) {
      throw new Error(`Snapshot index ${idx} out of range (0..${frames.length - 1})`);
    }
    return frames[idx];
  }

  if (typeof snapshot.time === 'number' && Number.isFinite(snapshot.time)) {
    let chosen = frames[0];
    for (const frame of frames) {
      if (frame.time <= snapshot.time) {
        chosen = frame;
      } else {
        break;
      }
    }
    return chosen;
  }

  return frames[frames.length - 1];
}

function assertAllExpr(
  evalExpr: (expr: string, values: Record<string, ParamValue>) => ParamValue,
  frames: EvaluatedFrame[],
  exprs: string[]
): void {
  for (const frame of frames) {
    for (const expr of exprs) {
      const result = evalExpr(expr, frame.realized);
      if (typeof result === 'boolean') {
        expect(result).toBe(true);
      } else if (typeof result === 'number') {
        expect(result).not.toBe(0);
      } else {
        expect(result).toBeTruthy();
      }
    }
  }
}

function computeRanges(frames: EvaluatedFrame[], keys: string[]): Record<string, { min: number; max: number }> {
  const ranges: Record<string, { min: number; max: number }> = {};

  for (const key of keys) {
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (const frame of frames) {
      const value = frame.realized[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      throw new Error(`No numeric realized values found for fingerprint key '${key}'`);
    }

    ranges[key] = { min: minValue, max: maxValue };
  }

  return ranges;
}

function assertRanges(
  ranges: Record<string, { min: number; max: number }>,
  assertRange: Record<string, RangeAssertSpec>,
  defaultTol: number
): void {
  for (const [key, spec] of Object.entries(assertRange)) {
    const range = ranges[key];
    expect(range).toBeDefined();

    if (typeof spec.min === 'number') {
      expect(range.min + defaultTol).toBeGreaterThanOrEqual(spec.min);
    }
    if (typeof spec.max === 'number') {
      expect(range.max - defaultTol).toBeLessThanOrEqual(spec.max);
    }
  }
}

function compileSchedule(
  frames: FrameSpec[],
  evaluate: (inputs: Record<string, number> | undefined, testSampleRate?: number) => Record<string, ParamValue>,
  bindingTargets: Map<string, MockAudioParam[]>,
  rampParams: Set<string>,
  testSampleRate?: number
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const realizedNames = new Set<string>(rampParams);
  for (const name of Object.keys(bindingTargets)) {
    // If a binding has a realize rule, it will be in semantics.realize.
    // We infer this by checking ramp params and frame evaluation output later.
    // This set is used only to split passthrough vs realized; ramp params
    // are always treated as realized.
    realizedNames.add(name);
  }

  // We need the actual set of realized names to separate passthrough params.
  // Evaluate once to discover which realized keys exist.
  const probe = frames[0]?.params ?? {};
  const probeValues = evaluate(probe, testSampleRate);
  const realizedKeys = new Set(Object.keys(probeValues));

  const rampBindings = new Set<string>();
  for (const name of rampParams) {
    if (bindingTargets.has(name)) {
      rampBindings.add(name);
    }
  }

  const realizedBindings = new Set<string>();
  const passthroughBindings = new Set<string>();
  for (const name of bindingTargets.keys()) {
    if (rampBindings.has(name)) continue;
    if (realizedKeys.has(name)) realizedBindings.add(name);
    else passthroughBindings.add(name);
  }

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    const t = frame.time;
    const realized = evaluate(frame.params, testSampleRate);

    for (const bind of realizedBindings) {
      const value = realized[bind];
      if (typeof value === 'number' && Number.isFinite(value)) {
        entries.push({ bind, time: t, value, ramp: false });
      }
    }

    for (const bind of passthroughBindings) {
      const value = frame.params[bind];
      if (typeof value === 'number' && Number.isFinite(value)) {
        entries.push({ bind, time: t, value, ramp: false });
      }
    }

    for (const bind of rampBindings) {
      const value = realized[bind];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      entries.push({ bind, time: t, value, ramp: i > 0 });
    }
  }

  return entries;
}

function executeSchedule(
  entries: ScheduleEntry[],
  bindingTargets: Map<string, MockAudioParam[]>
): void {
  for (const entry of entries) {
    const targets = bindingTargets.get(entry.bind) ?? [];
    for (const param of targets) {
      if (entry.ramp) param.linearRampToValueAtTime(entry.value, entry.time);
      else param.setValueAtTime(entry.value, entry.time);
    }
  }
}

function assertApprox(
  values: Record<string, ParamValue>,
  approx: Record<string, ApproxSpec>,
  defaultTol: number
): void {
  for (const [name, spec] of Object.entries(approx)) {
    const actual = values[name];
    expect(typeof actual).toBe('number');
    const expected = typeof spec === 'number' ? spec : spec.value;
    const tol = typeof spec === 'number' ? defaultTol : (spec.tol ?? defaultTol);
    expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(tol);
  }
}

function assertExpr(
  evalExpr: (expr: string, values: Record<string, ParamValue>) => ParamValue,
  values: Record<string, ParamValue>,
  exprs: string[]
): void {
  for (const expr of exprs) {
    const result = evalExpr(expr, values);
    if (typeof result === 'boolean') {
      expect(result).toBe(true);
    } else if (typeof result === 'number') {
      expect(result).not.toBe(0);
    } else {
      expect(result).toBeTruthy();
    }
  }
}

function hasSchedulePoint(
  entries: ScheduleEntry[],
  bind: string,
  ramp: boolean,
  time: number,
  tol: number
): boolean {
  return entries.some(
    (e) => e.bind === bind && e.ramp === ramp && Math.abs(e.time - time) <= tol
  );
}

function assertSchedule(entries: ScheduleEntry[], spec: ScheduleAssertSpec, defaultTol: number): void {
  for (const point of spec.rampAt ?? []) {
    const tol = point.tol ?? defaultTol;
    expect(hasSchedulePoint(entries, point.bind, true, point.time, tol)).toBe(true);
  }
  for (const point of spec.stepAt ?? []) {
    const tol = point.tol ?? defaultTol;
    expect(hasSchedulePoint(entries, point.bind, false, point.time, tol)).toBe(true);
  }
}

export function defineYamlGraphSuite(yamlPath: string): void {
  const suite = readYamlFile<YamlGraphSuite>(yamlPath);
  const semantics = readYamlFile<SemanticsDocument>(suite.semantics);
  const graph = readYamlFile<BaconGraph>(suite.graph);
  const defaultTol = suite.defaultTol ?? 1e-6;

  const { evaluate, evalExpr, rampParams } = createSemanticsHarness(semantics, suite.sampleRate);

  const suiteName = suite.suite ?? path.basename(yamlPath, path.extname(yamlPath));

  describe(suiteName, () => {
    for (const testSpec of suite.tests) {
      it(testSpec.name, () => {
        const testTol = defaultTol;

        if (testSpec.frames && testSpec.frames.length > 0) {
          const bindingTargets = buildBindingTargets(graph);
          const entries = compileSchedule(
            testSpec.frames,
            evaluate,
            bindingTargets,
            rampParams,
            testSpec.sampleRate
          );
          executeSchedule(entries, bindingTargets);

          if (testSpec.assertSchedule) {
            assertSchedule(entries, testSpec.assertSchedule, testTol);
          }

          return;
        }

        if (testSpec.track && testSpec.track.length > 0) {
          const frames = evaluateTrack(testSpec.track, evaluate, testSpec.sampleRate);

          if (testSpec.assertAllExpr && testSpec.assertAllExpr.length > 0) {
            assertAllExpr(evalExpr, frames, testSpec.assertAllExpr);
          }

          if (testSpec.snapshot) {
            const snapFrame = pickSnapshotFrame(frames, testSpec.snapshot);
            const values = snapFrame.realized;
            if (testSpec.snapshot.assert.approx) {
              assertApprox(values, testSpec.snapshot.assert.approx, testTol);
            }
            if (testSpec.snapshot.assert.expr) {
              assertExpr(evalExpr, values, testSpec.snapshot.assert.expr);
            }
          }

          if (testSpec.fingerprint) {
            const ranges = computeRanges(frames, testSpec.fingerprint.keys);
            assertRanges(ranges, testSpec.fingerprint.assertRange, testTol);
          }

          return;
        }

        const values = evaluate(testSpec.inputs, testSpec.sampleRate);

        if (testSpec.assert?.approx) {
          assertApprox(values, testSpec.assert.approx, testTol);
        }
        if (testSpec.assert?.expr) {
          assertExpr(evalExpr, values, testSpec.assert.expr);
        }
      });
    }
  });
}
