import { parseYamlString, isPlainObject, cloneValue } from "../yaml-loader";
import { extractPrefilterFromCondition } from "./where-prefilter";

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

function normalizeCitationEntry(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => normalizeCitationEntry(entry))
      .filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
    return normalized.length > 0 ? normalized.join("; ") : null;
  }
  if (isPlainObject(value)) {
    const normalized = Object.entries(value)
      .map(([key, entry]) => {
        const rendered = normalizeCitationEntry(entry);
        return rendered ? `${key}: ${rendered}` : null;
      })
      .filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
    return normalized.length > 0 ? normalized.join("; ") : null;
  }
  return null;
}

function cloneObject(value: unknown): PlainObject {
  return isPlainObject(value) ? { ...value } : {};
}

/**
 * Chunk 7 — `for_each_field` template expansion.
 *
 * An effect block may carry a `for_each_field: [<name1>, <name2>, ...]` key.
 * At rule-load time it expands into N concrete effect blocks, one per listed
 * field name. The literal substring `{field}` (and `{field_lower}` for a
 * lowercased variant) in any string value inside the effect — including
 * `field`, `value`, nested `dispatch[*].value` / `dispatch[*].when` strings —
 * is replaced by the field name.
 *
 * Rejects malformed shape: non-array, empty array, non-string entries. The
 * expander is called from `normalizeRule` before validation runs.
 */
function substituteFieldPlaceholders(value: unknown, fieldName: string): unknown {
  if (typeof value === "string") {
    if (value.indexOf("{field") === -1) return value;
    return value
      .replaceAll("{field_lower}", fieldName.toLowerCase())
      .replaceAll("{field}", fieldName);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => substituteFieldPlaceholders(entry, fieldName));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        substituteFieldPlaceholders(entry, fieldName),
      ])
    );
  }
  return value;
}

function expandForEachField(entries: unknown[]): PlainObject[] {
  const out: PlainObject[] = [];
  for (const entry of entries) {
    if (!isPlainObject(entry) || !Object.prototype.hasOwnProperty.call(entry, "for_each_field")) {
      out.push(cloneObject(entry));
      continue;
    }
    const fields = (entry as PlainObject).for_each_field;
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error(
        `E_FOR_EACH_FIELD_INVALID: 'for_each_field' must be a non-empty array of field names, got ${JSON.stringify(fields)}`
      );
    }
    for (const f of fields) {
      if (typeof f !== "string" || f.length === 0) {
        throw new Error(
          `E_FOR_EACH_FIELD_INVALID: 'for_each_field' entries must be non-empty strings, got ${JSON.stringify(f)}`
        );
      }
    }
    // Strip the directive itself from the template before cloning.
    const { for_each_field: _, ...template } = entry as PlainObject;
    for (const fieldName of fields as string[]) {
      const cloned = cloneValue(template) as PlainObject;
      const substituted = substituteFieldPlaceholders(cloned, fieldName) as PlainObject;
      out.push(substituted);
    }
  }
  return out;
}

export const DSL_ROOT_KEYS = new Set([
  "version",
  "inventory_path",
  "lts_path",
  "morphology_path",
  "dictionary_path",
  "speaker_profile_path",
  "source_contour_path",
  "normalization",
  "speakers",
  "skip_dictionary",
  "f0_model",
  "parameters",
  "input_contract",
  "streams",
  "topology",
  "predicates",
  // Chunk 3: pipeline-level reusable string-set and string-keyed map blocks.
  "string_sets",
  "maps",
  // dt-10: pipeline-level syllabification tables (onset clusters, nuclei,
  // affixes, ARPABET->ascky map) consumed by the generic syllabify pass.
  "syllabification",
  "patterns",
  "phases",
  "rules",
  "interpolation",
  "output",
  "transcription",
  "include",
]);

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
      ? rule.citations
        .map((c: any) => normalizeCitationEntry(c))
        .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
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
    apply: Array.isArray(rule.apply) ? expandForEachField(rule.apply) : [],
    contour: isPlainObject(rule.contour) ? cloneObject(rule.contour) : null,
    splice: isPlainObject(rule.splice) ? cloneObject(rule.splice) : null,
    insert_point: isPlainObject(rule.insert_point) ? cloneObject(rule.insert_point) : null,
    insert_points: Array.isArray(rule.insert_points)
      ? rule.insert_points.map((entry) => cloneObject(entry))
      : [],
    insert_f0_layer: isPlainObject(rule.insert) && asString(rule.kind, null) === "f0_layer"
      ? cloneObject(rule.insert)
      : null,
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

export function parseDslSpec(source: unknown) {
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
  const hasStringSets = Object.prototype.hasOwnProperty.call(raw, "string_sets");
  const hasMaps = Object.prototype.hasOwnProperty.call(raw, "maps");
  const hasSyllabification = Object.prototype.hasOwnProperty.call(raw, "syllabification");
  const extraRootFields = Object.fromEntries(
    Object.entries(raw)
      .filter(([key]) => !DSL_ROOT_KEYS.has(key))
      .map(([key, value]) => [key, cloneValue(value)])
  );

  return {
    ...extraRootFields,
    version: raw.version ?? null,
    inventory_path: asString(raw.inventory_path, null),
    lts_path: asString(raw.lts_path, null),
    morphology_path: asString(raw.morphology_path, null),
    dictionary_path: asString(raw.dictionary_path, null),
    speaker_profile_path: asString(raw.speaker_profile_path, null),
    source_contour_path: asString(raw.source_contour_path, null),
    normalization: cloneObject(raw.normalization),
    speakers: cloneObject(raw.speakers),
    ...(Object.prototype.hasOwnProperty.call(raw, "skip_dictionary")
      ? { skip_dictionary: Boolean(raw.skip_dictionary) }
      : {}),
    f0_model: isPlainObject(raw.f0_model) ? raw.f0_model : null,
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
    // Chunk 3: carry pipeline-level string_sets / maps blocks through to the
    // runtime. Shape is validated downstream by validation.ts
    // (validateStringSets / validateMaps).
    string_sets: hasStringSets ? cloneValue(raw.string_sets) : {},
    maps: hasMaps ? cloneValue(raw.maps) : {},
    // dt-10: carry the syllabification table block through to the runtime.
    // Shape validated downstream by validation.ts (validateSyllabification),
    // parsed into normalized tables by engine.ts (parseSyllabificationTables).
    ...(hasSyllabification ? { syllabification: cloneValue(raw.syllabification) } : {}),
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

export type NormalizedDslSpec = ReturnType<typeof parseDslSpec>;
