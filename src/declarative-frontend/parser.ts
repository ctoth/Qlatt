import yaml from "js-yaml";

type PlainObject = Record<string, any>;

type NormalizedPhase = {
  name: string;
  after: string[];
  rules: string[];
  resolve_scalars: string[];
  compute_times: boolean;
  resolve_points: string[];
};

function asPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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
  return asPlainObject(value) ? { ...value } : {};
}

function normalizePhase(phase: unknown): NormalizedPhase {
  const input = asPlainObject(phase) ? phase : {};
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
  if (!asPlainObject(stream)) return {};
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
  if (!asPlainObject(step)) return {};
  return {
    ...step,
    capture: asString(step.capture),
    where: asString(step.where),
    optional: Boolean(step.optional),
    repeat: step.repeat === "*" || step.repeat === "+" ? step.repeat : null,
  };
}

function normalizePattern(pattern: unknown): PlainObject {
  if (!asPlainObject(pattern)) return {};
  return {
    ...pattern,
    stream: asString(pattern.stream),
    scope: asString(pattern.scope),
    cross_boundary: Boolean(pattern.cross_boundary),
    max_lookahead: Number.isInteger(pattern.max_lookahead) ? pattern.max_lookahead : null,
    sequence: Array.isArray(pattern.sequence)
      ? pattern.sequence.map((step: unknown) => normalizePatternStep(step))
      : [],
    constraint: asString(pattern.constraint, null),
  };
}

function normalizeRule(rule: unknown): PlainObject {
  if (!asPlainObject(rule)) return {};
  const define =
    asPlainObject(rule.define)
      ? Object.fromEntries(
          Object.entries(rule.define)
            .filter(([name]) => typeof name === "string" && name.length > 0)
            .map(([name, expr]) => [name, asString(expr, null)])
        )
      : {};
  return {
    ...rule,
    citation: asString(rule.citation, null),
    kind: asString(rule.kind, null),
    op: asString(rule.op, null),
    match: asString(rule.match, null),
    constraint: asString(rule.constraint, null),
    define,
    select: asPlainObject(rule.select)
      ? {
          ...rule.select,
          stream: asString(rule.select.stream),
          where: asString(rule.select.where),
        }
      : null,
    apply: Array.isArray(rule.apply) ? rule.apply.map((entry) => cloneObject(entry)) : [],
    splice: asPlainObject(rule.splice) ? cloneObject(rule.splice) : null,
    insert_point: asPlainObject(rule.insert_point) ? cloneObject(rule.insert_point) : null,
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
    raw = yaml.load(source);
  }

  if (!asPlainObject(raw)) {
    throw new Error("DSL spec must be an object or YAML object document");
  }

  const phases = Array.isArray(raw.phases) ? raw.phases : [];
  const streams = asPlainObject(raw.streams) ? raw.streams : {};
  const patterns = asPlainObject(raw.patterns) ? raw.patterns : {};
  const rules = asPlainObject(raw.rules) ? raw.rules : {};
  const parameters = asPlainObject(raw.parameters) ? raw.parameters : {};
  const topology = asPlainObject(raw.topology) ? raw.topology : {};
  const interpolation = asPlainObject(raw.interpolation) ? raw.interpolation : {};

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
    include: Array.isArray(raw.include) ? raw.include.slice() : [],
  };
}
