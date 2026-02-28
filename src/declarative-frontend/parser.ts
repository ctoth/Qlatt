import { parseYamlString, isPlainObject } from "../yaml-loader";
import { extractPrefilterFromCondition } from "./where-prefilter";

/**
 * Symbol marker for specs that have already been through parseDslSpec + assertValidSpec.
 * When present on an object, runRuleEngine can skip redundant re-parsing and re-validation.
 * Performance optimization: avoids ~1.88ms/call of wasted parse+validate on pre-processed specs.
 */
export const SPEC_VALIDATED = Symbol("spec-validated");

type PlainObject = Record<string, any>;

type NormalizedPhase = {
  name: string;
  after: string[];
  rules: string[];
  resolve_scalars: string[];
  compute_times: boolean;
  resolve_points: string[];
};

function asString(value: unknown): string;
function asString(value: unknown, fallback: string | null): string | null;
function asString(value: unknown, fallback: string | null = ""): string | null {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item: unknown): item is string => typeof item === "string");
}

function cloneObject(value: unknown): PlainObject {
  return isPlainObject(value) ? { ...value } : {};
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneValue(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)])
    );
  }
  return value;
}

function normalizeConditionSpec(value: unknown): unknown {
  if (typeof value === "string") return value;
  if (!isPlainObject(value)) return cloneValue(value);

  const normalized: PlainObject = {};
  if (Object.prototype.hasOwnProperty.call(value, "expr")) {
    normalized.expr = asString(value.expr, null);
  }
  if (Object.prototype.hasOwnProperty.call(value, "predicate")) {
    normalized.predicate = asString(value.predicate, null);
  }
  if (Object.prototype.hasOwnProperty.call(value, "all")) {
    normalized.all = Array.isArray(value.all)
      ? value.all.map((entry: unknown) => normalizeConditionSpec(entry))
      : cloneValue(value.all);
  }
  if (Object.prototype.hasOwnProperty.call(value, "any")) {
    normalized.any = Array.isArray(value.any)
      ? value.any.map((entry: unknown) => normalizeConditionSpec(entry))
      : cloneValue(value.any);
  }
  if (Object.prototype.hasOwnProperty.call(value, "not")) {
    normalized.not = normalizeConditionSpec(value.not);
  }

  for (const [key, entry] of Object.entries(value)) {
    if (Object.prototype.hasOwnProperty.call(normalized, key)) continue;
    normalized[key] = cloneValue(entry);
  }

  return normalized;
}

function normalizePhase(phase: unknown): NormalizedPhase {
  const input = isPlainObject(phase) ? phase : {};
  return {
    name: asString(input.name),
    after: asStringArray(input.after),
    rules: asStringArray(input.rules),
    resolve_scalars: asStringArray(input.resolve_scalars),
    compute_times: Boolean(input.compute_times),
    resolve_points: asStringArray(input.resolve_points),
  };
}

function normalizeStream(stream: unknown): PlainObject {
  if (!isPlainObject(stream)) return {};
  return {
    ...stream,
    type: asString(stream.type),
    spans: asString(stream.spans, null),
    features: cloneObject(stream.features),
    scalars: cloneObject(stream.scalars),
    inventory: cloneObject(stream.inventory),
    value_type: asString(stream.value_type, null),
    unit: asString(stream.unit, null),
  };
}

function normalizePatternStep(step: unknown): PlainObject {
  if (!isPlainObject(step)) return {};
  const normalizedWhere = normalizeConditionSpec(step.where);
  return {
    ...step,
    capture: asString(step.capture),
    where: normalizedWhere,
    _prefilter: extractPrefilterFromCondition(normalizedWhere),
    optional: Boolean(step.optional),
    repeat: step.repeat === "*" || step.repeat === "+" ? step.repeat : null,
  };
}

function normalizePattern(pattern: unknown): PlainObject {
  if (!isPlainObject(pattern)) return {};
  return {
    ...pattern,
    stream: asString(pattern.stream),
    scope: asString(pattern.scope),
    cross_boundary: Boolean(pattern.cross_boundary),
    max_lookahead: Number.isInteger(pattern.max_lookahead) ? pattern.max_lookahead : null,
    sequence: Array.isArray(pattern.sequence)
      ? pattern.sequence.map((step: unknown) => normalizePatternStep(step))
      : [],
    constraint: normalizeConditionSpec(pattern.constraint),
  };
}

function normalizeRule(rule: unknown): PlainObject {
  if (!isPlainObject(rule)) return {};
  const define =
    isPlainObject(rule.define)
      ? Object.fromEntries(
          Object.entries(rule.define)
            .filter(([name]) => typeof name === "string" && name.length > 0)
            .map(([name, expr]) => [name, asString(expr, null)])
        )
      : {};
  return {
    ...rule,
    citations: Array.isArray(rule.citations)
      ? rule.citations.map((c: any) => String(c).trim()).filter(Boolean)
      : typeof rule.citation === "string"
        ? [rule.citation.trim()].filter(Boolean)
        : [],
    kind: asString(rule.kind, null),
    op: asString(rule.op, null),
    match: asString(rule.match, null),
    constraint: normalizeConditionSpec(rule.constraint),
    define,
    select: isPlainObject(rule.select)
      ? (() => {
          const normalizedWhere = normalizeConditionSpec(rule.select.where);
          return {
            ...rule.select,
            stream: asString(rule.select.stream),
            where: normalizedWhere,
            _prefilter: extractPrefilterFromCondition(normalizedWhere),
          };
        })()
      : null,
    apply: Array.isArray(rule.apply) ? rule.apply.map((entry) => cloneObject(entry)) : [],
    splice: isPlainObject(rule.splice) ? cloneObject(rule.splice) : null,
    insert_point: isPlainObject(rule.insert_point) ? cloneObject(rule.insert_point) : null,
    suppress: Boolean(rule.suppress),
    delete: Boolean(rule.delete),
    associate: Array.isArray(rule.associate)
      ? rule.associate.map((entry) => cloneObject(entry))
      : [],
    disassociate: Array.isArray(rule.disassociate)
      ? rule.disassociate.map((entry) => cloneObject(entry))
      : [],
  };
}

export function parseDslSpec(source: unknown): PlainObject {
  let raw = source;

  if (typeof source === "string") {
    raw = parseYamlString(source, "dsl spec");
  }

  if (!isPlainObject(raw)) {
    throw new Error("DSL spec must be an object or YAML object document");
  }

  const phases = Array.isArray(raw.phases) ? raw.phases : [];
  const streams = isPlainObject(raw.streams) ? raw.streams : {};
  const patterns = isPlainObject(raw.patterns) ? raw.patterns : {};
  const rules = isPlainObject(raw.rules) ? raw.rules : {};
  const predicates = isPlainObject(raw.predicates) ? raw.predicates : {};
  const parameters = isPlainObject(raw.parameters) ? raw.parameters : {};
  const topology = isPlainObject(raw.topology) ? raw.topology : {};
  const interpolation = isPlainObject(raw.interpolation) ? raw.interpolation : {};

  return {
    version: raw.version ?? null,
    parameters,
    input_contract: cloneObject(raw.input_contract),
    streams: Object.fromEntries(
      Object.entries(streams).map(([name, stream]) => [name, normalizeStream(stream)])
    ),
    topology: {
      hierarchy: asStringArray(topology.hierarchy),
      parallel: asStringArray(topology.parallel),
      point: asStringArray(topology.point),
    },
    predicates: Object.fromEntries(
      Object.entries(predicates).map(([name, predicateSpec]) => [
        name,
        normalizeConditionSpec(predicateSpec),
      ])
    ),
    patterns: Object.fromEntries(
      Object.entries(patterns).map(([name, pattern]) => [name, normalizePattern(pattern)])
    ),
    phases: phases.map((phase) => normalizePhase(phase)),
    rules: Object.fromEntries(
      Object.entries(rules).map(([name, rule]) => [name, normalizeRule(rule)])
    ),
    interpolation: {
      scalars: cloneObject(interpolation.scalars),
      points: cloneObject(interpolation.points),
    },
    output: cloneObject(raw.output),
    transcription: cloneObject(raw.transcription),
    include: Array.isArray(raw.include) ? raw.include.slice() : [],
  };
}
