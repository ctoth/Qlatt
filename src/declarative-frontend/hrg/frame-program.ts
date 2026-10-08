/**
 * Frame programs: rules of kind `frame`.
 *
 * Some controllers compute a parameter frame by frame from state that carries
 * over from one frame to the next: a target that is approached by a fraction
 * of the remaining distance, a counter that steps while a condition holds, a
 * flag set in one phone and cleared in the next. A Segment target with a
 * transition cannot say that. A frame program can: it is a set of named
 * registers and an ordered list of rules, each a guarded assignment, run once
 * for every control frame of the utterance.
 *
 * Declared in the rulepack (validated by validation.ts, run by the rule engine
 * in the phase that lists the rules, rendered by lowering):
 *
 *   frame_programs:
 *     <program>:
 *       relation: Segment        # the Items the frames run over, in order
 *       unit: <condition>        # Items that start a unit; any other Item
 *                                # extends the unit before it
 *       frame_ms: <expression>   # length of a frame (may read params)
 *       lead_in_frames: <expr>   # frames of a silent unit before the first Item
 *       features:                # read once per unit, with `current` the
 *         <name>:                # unit's first Item
 *           value: <expression>
 *           edge: <literal>      # value in the lead-in and beyond either end
 *       group:                   # optional: units in groups (clauses, say)
 *         start: <frame expression>    # units that start a group
 *         totals:
 *           <name>: <frame expression> # summed over the group's units
 *       registers:
 *         <name>: <number | boolean>   # value before the first frame
 *       outputs:
 *         <column>: <frame expression> # sampled after the rules, every frame
 *       write: <feature>         # Segment feature that receives the columns
 *       tag: <tag>
 *
 *   rules:
 *     <rule>:
 *       kind: frame
 *       program: <program>
 *       unit: <frame expression>   # once per unit; may read u, p, n, params
 *       when: <frame expression>   # every frame of a unit that passed `unit`
 *       set:
 *         - register: <name>
 *           value: <frame expression>
 *           tag: <tag>
 *       citations: [...]
 *
 * Frame expressions are CEL over:
 *   u, p, n   features of this unit, the one before and the one after
 *   r         the registers
 *   f         counters, see FRAME_COUNTERS
 *   g         the unit's group: FRAME_GROUP_COUNTERS and the declared totals
 *   params    rulepack parameters
 * Rules run in the order the phase lists them, each frame; the assignments of
 * a rule run in order and later ones see earlier ones.
 *
 * This file is the machine itself and knows nothing about Items: the rule
 * engine builds the units (rule-engine.ts, runFramePrograms) and writes the
 * result back through transactions.
 */

import { evaluateExpression } from "../cel-expressions";
import type { FeatureSchema } from "./types";

/** The members of `f` in a frame expression. */
export const FRAME_COUNTERS = [
  /** Frame within the unit, from 0. */
  "index",
  /** Frames in the unit. */
  "count",
  /** Unit number, from 0; the lead-in, when there is one, is unit 0. */
  "unit",
  /** Units in the run. */
  "units",
  /** Frame within the run, from 0. */
  "frame",
  /** Frames in the run. */
  "frames",
  /** Frames in the unit before; 0 when there is none. */
  "prev_count",
  /** Frames in the unit after; 0 when there is none. */
  "next_count",
] as const;

/** The members of `g` every group has, beside its declared totals. */
export const FRAME_GROUP_COUNTERS = [
  /** Frame within the group, from 0. */
  "frame",
  /** Frames in the group. */
  "frames",
  /** Unit within the group, from 0. */
  "unit",
  /** Units in the group. */
  "units",
] as const;

export type FrameRegisterValue = number | boolean;

export interface FrameAssignment {
  register: string;
  value: string;
  tag: string;
}

export interface FrameRule {
  name: string;
  unit: string | null;
  when: string | null;
  set: readonly FrameAssignment[];
  citations: readonly string[];
}

export interface FrameUnit {
  features: Readonly<Record<string, unknown>>;
  frames: number;
}

/** One rule's activity within one unit: the frames in which it assigned. */
export interface FrameRuleFiring {
  rule: string;
  first: number;
  last: number;
  count: number;
}

export interface FrameUnitResult {
  /** Output column -> one value a frame of the unit. */
  columns: Record<string, number[]>;
  fired: FrameRuleFiring[];
}

export interface FrameProgramRun {
  registers: Readonly<Record<string, FrameRegisterValue>>;
  outputs: Readonly<Record<string, string>>;
  rules: readonly FrameRule[];
  units: readonly FrameUnit[];
  /** Feature values of the unit before the first and after the last. */
  edgeFeatures: Readonly<Record<string, unknown>>;
  params: unknown;
  /**
   * Units in groups (clauses, say). The first unit starts a group and so does
   * every unit `start` accepts. `totals` are sums over a group's units of an
   * expression read once per unit, known before the group's first frame.
   */
  group?: {
    start: string | null;
    totals: Readonly<Record<string, string>>;
  };
}

function numbers(args: unknown[]): number[] {
  const values = (args.length === 1 && Array.isArray(args[0]) ? args[0] : args).map(Number);
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("expects finite numbers");
  }
  return values;
}

/**
 * The functions a frame expression may call beside the context-free ones every
 * CEL environment has (floor, ceil, round, mod, get, ...). The rule engine's
 * other functions read Items and are not available here.
 */
export const FRAME_FUNCTIONS: Readonly<Record<string, (...args: unknown[]) => unknown>> =
  Object.freeze({
    max: (...args: unknown[]) => Math.max(...numbers(args)),
    min: (...args: unknown[]) => Math.min(...numbers(args)),
    abs: (value: unknown) => Math.abs(Number(value)),
    pow: (value: unknown, exponent: unknown) => Number(value) ** Number(exponent),
  });

function evaluateFrame(expression: string, context: unknown, where: string): unknown {
  try {
    return evaluateExpression(
      expression,
      context,
      FRAME_FUNCTIONS as Record<string, (...args: unknown[]) => unknown>,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`E_FRAME_EXPRESSION: ${where}: '${expression}': ${message}`);
  }
}

function truthy(value: unknown, where: string, expression: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(
      `E_FRAME_CONDITION: ${where}: '${expression}' is ${String(value)}, not true or false`,
    );
  }
  return value;
}

/**
 * Run a program over its units. Registers start at their declared values and
 * are never reset by the machine; a rule that wants a reset writes one.
 */
export function runFrameProgram(run: FrameProgramRun): FrameUnitResult[] {
  const registers: Record<string, FrameRegisterValue> = { ...run.registers };
  const totalFrames = run.units.reduce((sum, unit) => sum + unit.frames, 0);
  const counters: Record<(typeof FRAME_COUNTERS)[number], number> = {
    index: 0,
    count: 0,
    unit: 0,
    units: run.units.length,
    frame: 0,
    frames: totalFrames,
    prev_count: 0,
    next_count: 0,
  };
  const context: Record<string, unknown> = {
    u: run.edgeFeatures,
    p: run.edgeFeatures,
    n: run.edgeFeatures,
    r: registers,
    f: counters,
    params: run.params,
  };
  const outputs = Object.entries(run.outputs);
  const results: FrameUnitResult[] = [];
  const enterUnit = (unitIndex: number): FrameUnit => {
    const unit = run.units[unitIndex] as FrameUnit;
    const previous = run.units[unitIndex - 1];
    const next = run.units[unitIndex + 1];
    context.u = unit.features;
    context.p = previous?.features ?? run.edgeFeatures;
    context.n = next?.features ?? run.edgeFeatures;
    counters.unit = unitIndex;
    counters.count = unit.frames;
    counters.prev_count = previous?.frames ?? 0;
    counters.next_count = next?.frames ?? 0;
    counters.index = 0;
    return unit;
  };

  // Groups, before any frame runs: where each starts, and its totals.
  const totalSpecs = Object.entries(run.group?.totals ?? {});
  const groups: Record<string, number>[] = [];
  const groupOfUnit: Record<string, number>[] = [];
  for (let unitIndex = 0; unitIndex < run.units.length; unitIndex += 1) {
    const unit = enterUnit(unitIndex);
    const start = run.group?.start;
    if (
      unitIndex === 0 ||
      (start != null && truthy(evaluateFrame(start, context, "group start"), "group start", start))
    ) {
      groups.push({
        frame: 0,
        frames: 0,
        unit: 0,
        units: 0,
        ...Object.fromEntries(totalSpecs.map(([name]) => [name, 0])),
      });
    }
    const group = groups[groups.length - 1] as Record<string, number>;
    group.frames = (group.frames as number) + unit.frames;
    group.units = (group.units as number) + 1;
    for (const [name, expression] of totalSpecs) {
      const where = `group total '${name}'`;
      const value = evaluateFrame(expression, context, where);
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(
          `E_FRAME_TOTAL_TYPE: ${where}: '${expression}' is ${String(value)}, not a number`,
        );
      }
      group[name] = (group[name] as number) + value;
    }
    groupOfUnit.push(group);
  }

  for (let unitIndex = 0; unitIndex < run.units.length; unitIndex += 1) {
    const unit = enterUnit(unitIndex);
    const group = groupOfUnit[unitIndex] as Record<string, number>;
    if (group !== groupOfUnit[unitIndex - 1]) group.unit = 0;
    context.g = group;

    const active: FrameRule[] = [];
    for (const rule of run.rules) {
      if (
        rule.unit === null ||
        truthy(
          evaluateFrame(rule.unit, context, `rule '${rule.name}' unit`),
          `rule '${rule.name}' unit`,
          rule.unit,
        )
      ) {
        active.push(rule);
      }
    }
    const firings = new Map<string, FrameRuleFiring>();
    const columns: Record<string, number[]> = {};
    for (const [column] of outputs) columns[column] = new Array<number>(unit.frames);

    for (let index = 0; index < unit.frames; index += 1) {
      counters.index = index;
      for (const rule of active) {
        if (
          rule.when !== null &&
          !truthy(
            evaluateFrame(rule.when, context, `rule '${rule.name}' when`),
            `rule '${rule.name}' when`,
            rule.when,
          )
        ) {
          continue;
        }
        for (const assignment of rule.set) {
          const where = `rule '${rule.name}' register '${assignment.register}'`;
          const value = evaluateFrame(assignment.value, context, where);
          const declared = run.registers[assignment.register];
          if (
            typeof value !== typeof declared ||
            (typeof value === "number" && !Number.isFinite(value))
          ) {
            throw new Error(
              `E_FRAME_REGISTER_TYPE: ${where}: '${assignment.value}' is ${String(value)}, not a ${typeof declared}`,
            );
          }
          registers[assignment.register] = value as FrameRegisterValue;
        }
        const firing = firings.get(rule.name);
        if (firing) {
          firing.last = index;
          firing.count += 1;
        } else {
          firings.set(rule.name, { rule: rule.name, first: index, last: index, count: 1 });
        }
      }
      for (const [column, expression] of outputs) {
        const where = `output '${column}'`;
        const value = evaluateFrame(expression, context, where);
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(
            `E_FRAME_OUTPUT_TYPE: ${where}: '${expression}' is ${String(value)}, not a number`,
          );
        }
        (columns[column] as number[])[index] = value;
      }
      counters.frame += 1;
      group.frame = (group.frame as number) + 1;
    }
    group.unit = (group.unit as number) + 1;
    results.push({ columns, fired: [...firings.values()] });
  }
  return results;
}

/**
 * What lowering reads from the Segment feature a program writes: the frames
 * this Item overlaps. `origin_ms` is where the first of them starts, counted
 * from the Item's start: negative when the Item begins inside a frame, or
 * when lead-in frames come before it.
 */
export interface FrameValues {
  period_ms: number;
  origin_ms: number;
  columns: Readonly<Record<string, readonly number[]>>;
  /** On the run's last Item: column values for the instant the run ends. */
  after?: Readonly<Record<string, number>>;
}

/** Schema of the feature a program writes: FrameValues and the rules behind them. */
export const FRAME_VALUES_SCHEMA: FeatureSchema = {
  kind: "object",
  fields: {
    period_ms: { kind: "number" },
    origin_ms: { kind: "number" },
    columns: {
      kind: "object",
      fields: {},
      additional: { kind: "array", items: { kind: "number" } },
    },
    fired: {
      kind: "array",
      items: {
        kind: "object",
        fields: {
          rule: { kind: "string" },
          first: { kind: "number" },
          last: { kind: "number" },
          count: { kind: "number" },
          lead_in: { kind: "boolean" },
          tail: { kind: "boolean" },
        },
        optional: ["tail"],
      },
    },
    after: { kind: "object", fields: {}, additional: { kind: "number" } },
  },
  optional: ["after"],
};

/** The features the frame programs of a rulepack write. */
export function frameValueFeatures(framePrograms: unknown): string[] {
  if (typeof framePrograms !== "object" || framePrograms === null) return [];
  return [
    ...new Set(
      Object.values(framePrograms as Record<string, unknown>).flatMap((program) =>
        typeof program === "object" &&
        program !== null &&
        typeof (program as Record<string, unknown>).write === "string"
          ? [(program as Record<string, unknown>).write as string]
          : [],
      ),
    ),
  ];
}

export function isFrameValues(value: unknown): value is FrameValues {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.period_ms === "number" &&
    candidate.period_ms > 0 &&
    typeof candidate.origin_ms === "number" &&
    typeof candidate.columns === "object" &&
    candidate.columns !== null
  );
}

/** Index into a FrameValues column for a time relative to the Item's start. */
export function frameValueIndex(values: FrameValues, offsetMs: number, length: number): number {
  // The tolerance keeps an offset that is a frame boundary up to rounding in
  // the frame it starts.
  const index = Math.floor((offsetMs - values.origin_ms) / values.period_ms + 1e-6);
  return Math.min(Math.max(index, 0), length - 1);
}
