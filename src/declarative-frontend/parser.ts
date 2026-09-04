import { cloneValue, isPlainObject, parseYamlString } from "../yaml-loader";

type PlainObject = Record<string, unknown>;

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
      ]),
    );
  }
  return value;
}

function expandForEachField(entries: unknown[]): PlainObject[] {
  const out: PlainObject[] = [];
  for (const entry of entries) {
    if (!isPlainObject(entry) || !Object.hasOwn(entry, "for_each_field")) {
      out.push(cloneObject(entry));
      continue;
    }
    const fields = (entry as PlainObject).for_each_field;
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error(
        `E_FOR_EACH_FIELD_INVALID: 'for_each_field' must be a non-empty array of field names, got ${JSON.stringify(fields)}`,
      );
    }
    for (const f of fields) {
      if (typeof f !== "string" || f.length === 0) {
        throw new Error(
          `E_FOR_EACH_FIELD_INVALID: 'for_each_field' entries must be non-empty strings, got ${JSON.stringify(f)}`,
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

/**
 * Phase 5.2 — `foreach` rule-template expansion.
 *
 * A `foreach` directive is an array element of the form
 *   { foreach: [ {k1: v1, k2: v2, ...}, ... ], template: { ... } }
 * It expands in-place into one substituted copy of `template` per binding map.
 * The literal substring `{k}` inside any string of the cloned template — at any
 * nesting depth (e.g. `dispatch[*].when`, `dispatch[*].value`) — is replaced by
 * that binding's value for key `k`.
 *
 * Unlike `for_each_field` (which expands one placeholder over a flat field list
 * on an effect block), `foreach` supports multiple placeholders per binding and
 * runs anywhere an array appears inside a rule — notably inside a `dispatch`
 * array, where cross-product switch tables are written longhand. The binding
 * list is explicit and ordered, so the expansion reproduces the exact longhand
 * entries in the exact order given (order can be semantically load-bearing:
 * `dispatch` is first-match-wins).
 *
 * Sibling entries (before/after the directive) are preserved in order. When a
 * rule contains no `foreach` directive the walk is a structure-preserving deep
 * clone, so compiled output is byte-identical to the pre-expansion rule.
 */
function substituteBindings(value: unknown, bindings: Record<string, string>): unknown {
  if (typeof value === "string") {
    if (value.indexOf("{") === -1) return value;
    let out = value;
    for (const [key, replacement] of Object.entries(bindings)) {
      out = out.replaceAll(`{${key}}`, replacement);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => substituteBindings(entry, bindings));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, substituteBindings(entry, bindings)]),
    );
  }
  return value;
}

function isForeachDirective(entry: unknown): boolean {
  return isPlainObject(entry) && Object.hasOwn(entry, "foreach");
}

function expandForeachArray(entries: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const entry of entries) {
    if (!isForeachDirective(entry)) {
      out.push(expandForeachValue(entry));
      continue;
    }
    const directive = entry as PlainObject;
    for (const key of Object.keys(directive)) {
      if (key !== "foreach" && key !== "template") {
        throw new Error(
          `E_FOREACH_INVALID: a 'foreach' directive may only contain 'foreach' and 'template', got extra key '${key}'`,
        );
      }
    }
    const items = directive.foreach;
    const template = directive.template;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(
        `E_FOREACH_INVALID: 'foreach' must be a non-empty array of binding maps, got ${JSON.stringify(items)}`,
      );
    }
    if (!isPlainObject(template)) {
      throw new Error(
        `E_FOREACH_INVALID: 'foreach' requires an object 'template', got ${JSON.stringify(template)}`,
      );
    }
    for (const item of items) {
      if (!isPlainObject(item)) {
        throw new Error(
          `E_FOREACH_INVALID: 'foreach' items must be binding maps, got ${JSON.stringify(item)}`,
        );
      }
      const bindings: Record<string, string> = {};
      for (const [key, binding] of Object.entries(item)) {
        if (
          typeof binding !== "string" &&
          typeof binding !== "number" &&
          typeof binding !== "boolean"
        ) {
          throw new Error(
            `E_FOREACH_INVALID: 'foreach' binding '${key}' must be a scalar (string/number/boolean), got ${JSON.stringify(binding)}`,
          );
        }
        bindings[key] = String(binding);
      }
      const cloned = cloneValue(template);
      const substituted = substituteBindings(cloned, bindings);
      // Recurse to allow nested foreach inside a template.
      out.push(expandForeachValue(substituted));
    }
  }
  return out;
}

function expandForeachValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return expandForeachArray(value);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, expandForeachValue(entry)]),
    );
  }
  return value;
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
  "relations",
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
  if (Object.hasOwn(value, "expr")) {
    normalized.expr = asString(value.expr, null);
  }
  if (Object.hasOwn(value, "predicate")) {
    normalized.predicate = asString(value.predicate, null);
  }
  if (Object.hasOwn(value, "all")) {
    normalized.all = Array.isArray(value.all)
      ? value.all.map((entry: unknown) => normalizeConditionSpec(entry))
      : cloneValue(value.all);
  }
  if (Object.hasOwn(value, "any")) {
    normalized.any = Array.isArray(value.any)
      ? value.any.map((entry: unknown) => normalizeConditionSpec(entry))
      : cloneValue(value.any);
  }
  if (Object.hasOwn(value, "not")) {
    normalized.not = normalizeConditionSpec(value.not);
  }

  for (const [key, entry] of Object.entries(value)) {
    if (Object.hasOwn(normalized, key)) continue;
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

function normalizeRelation(relation: unknown): PlainObject {
  if (!isPlainObject(relation)) return {};
  return {
    ...relation,
    type: asString(relation.type),
    spans: asString(relation.spans, null),
    features: cloneObject(relation.features),
    scalars: cloneObject(relation.scalars),
    inventory: cloneObject(relation.inventory),
    value_type: asString(relation.value_type, null),
    unit: asString(relation.unit, null),
  };
}

function normalizePatternStep(step: unknown): PlainObject {
  if (!isPlainObject(step)) return {};
  const normalizedWhere = normalizeConditionSpec(step.where);
  return {
    ...step,
    capture: asString(step.capture),
    where: normalizedWhere,
    optional: Boolean(step.optional),
    repeat: step.repeat === "*" || step.repeat === "+" ? step.repeat : null,
  };
}

function normalizePattern(pattern: unknown): PlainObject {
  if (!isPlainObject(pattern)) return {};
  return {
    ...pattern,
    relation: asString(pattern.relation),
    scope: asString(pattern.scope),
    cross_boundary: Boolean(pattern.cross_boundary),
    max_lookahead: Number.isInteger(pattern.max_lookahead) ? pattern.max_lookahead : null,
    sequence: Array.isArray(pattern.sequence)
      ? pattern.sequence.map((step: unknown) => normalizePatternStep(step))
      : [],
    constraint: normalizeConditionSpec(pattern.constraint),
  };
}

function normalizeRule(ruleInput: unknown): PlainObject {
  if (!isPlainObject(ruleInput)) return {};
  // Expand any `foreach` template directives before field normalization so the
  // engine and validation never see the directive itself. Structure-preserving
  // when no directive is present.
  const rule = expandForeachValue(ruleInput) as PlainObject;
  const define = isPlainObject(rule.define)
    ? Object.fromEntries(
        Object.entries(rule.define)
          .filter(([name]) => typeof name === "string" && name.length > 0)
          .map(([name, expr]) => [name, asString(expr, null)]),
      )
    : {};
  return {
    ...rule,
    citations: Array.isArray(rule.citations)
      ? rule.citations
          .map((c: unknown) => normalizeCitationEntry(c))
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
            relation: asString(rule.select.relation),
            where: normalizedWhere,
          };
        })()
      : null,
    apply: Array.isArray(rule.apply) ? expandForEachField(rule.apply) : [],
    contour: isPlainObject(rule.contour) ? cloneObject(rule.contour) : null,
    scan: isPlainObject(rule.scan) ? cloneObject(rule.scan) : null,
    splice: isPlainObject(rule.splice) ? cloneObject(rule.splice) : null,
    insert_point: isPlainObject(rule.insert_point) ? cloneObject(rule.insert_point) : null,
    insert_points: Array.isArray(rule.insert_points)
      ? rule.insert_points.map((entry) => cloneObject(entry))
      : [],
    insert_f0_layer:
      isPlainObject(rule.insert) && asString(rule.kind, null) === "f0_layer"
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
  if (Object.hasOwn(raw, "streams")) {
    throw new Error("E_LEGACY_STREAMS: 'streams' is no longer accepted; declare 'relations'");
  }

  const phases = Array.isArray(raw.phases) ? raw.phases : [];
  const relations = isPlainObject(raw.relations) ? raw.relations : {};
  const patterns = isPlainObject(raw.patterns) ? raw.patterns : {};
  const rules = isPlainObject(raw.rules) ? raw.rules : {};
  const predicates = isPlainObject(raw.predicates) ? raw.predicates : {};
  const parameters = isPlainObject(raw.parameters) ? raw.parameters : {};
  const topology = isPlainObject(raw.topology) ? raw.topology : {};
  const interpolation = isPlainObject(raw.interpolation) ? raw.interpolation : {};
  const hasStringSets = Object.hasOwn(raw, "string_sets");
  const hasMaps = Object.hasOwn(raw, "maps");
  const hasSyllabification = Object.hasOwn(raw, "syllabification");
  const extraRootFields = Object.fromEntries(
    Object.entries(raw)
      .filter(([key]) => !DSL_ROOT_KEYS.has(key))
      .map(([key, value]) => [key, cloneValue(value)]),
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
    ...(Object.hasOwn(raw, "skip_dictionary")
      ? { skip_dictionary: Boolean(raw.skip_dictionary) }
      : {}),
    f0_model: isPlainObject(raw.f0_model) ? raw.f0_model : null,
    parameters,
    input_contract: cloneObject(raw.input_contract),
    relations: Object.fromEntries(
      Object.entries(relations).map(([name, relation]) => [name, normalizeRelation(relation)]),
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
      ]),
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
      Object.entries(patterns).map(([name, pattern]) => [name, normalizePattern(pattern)]),
    ),
    phases: phases.map((phase) => normalizePhase(phase)),
    rules: Object.fromEntries(
      Object.entries(rules).map(([name, rule]) => [name, normalizeRule(rule)]),
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
