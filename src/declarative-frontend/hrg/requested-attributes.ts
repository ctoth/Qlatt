import { isPlainObject } from "../../yaml-loader";
import {
  type CheckedPureExpression,
  checkPureExpression,
  ItemViewType,
} from "../cel-expressions";
import {
  assertCompiledRulepack,
  type CompiledRulepack,
  rulepackRuleDocumentSpans,
} from "../rule-pack";
import type { DiagnosticDocumentSpans } from "../validation";
import type { Item } from "./item";
import { PARAMETER_SCOPE_FEATURE } from "./parameter-scope";
import { evalPath, isNavOp } from "./path";
import {
  GraphRuleEvaluationOwner,
  mergeParameterRecords,
  projectPolicyValues,
  PURE_GRAPH_MATH,
} from "./rule-engine";
import type { Utterance } from "./utterance";

export interface CheckedAttribute extends CheckedPureExpression {
  readonly path: readonly string[];
  readonly sources: readonly DiagnosticDocumentSpans[];
}

export interface CheckedAttributes {
  readonly artifact: CompiledRulepack;
  readonly rule: string;
  readonly relation: string;
  readonly definitions: Readonly<Record<string, CheckedAttribute>>;
}

const checkedPrograms = new WeakSet<CheckedAttributes>();

/** Select an existing compiler-validated define block; no second authored syntax. */
export function checkRequestedAttributes(
  artifact: CompiledRulepack,
  rule: string,
): CheckedAttributes {
  assertCompiledRulepack(artifact);
  const source = artifact.rules[rule];
  if (!source || !isPlainObject(source.select) || typeof source.select.relation !== "string") {
    throw new Error(`E_ATTRIBUTE_RULE: '${rule}' requires a selected relation`);
  }
  const definitions = isPlainObject(source.define) ? source.define : {};
  const variables = [
    "current",
    "prev",
    "next",
    "params",
    "sets",
    "maps",
    ...Object.keys(definitions),
  ];
  const spans = rulepackRuleDocumentSpans(artifact);
  const compiled = Object.fromEntries(
    Object.entries(definitions).map(([name, expression]) => {
      if (typeof expression !== "string")
        throw new Error(`E_ATTRIBUTE_EXPRESSION: '${name}' must be CEL`);
      const path = Object.freeze(["rules", rule, "define", name]);
      const sources = spans.filter((entry) => {
        const candidate = entry.compiledPath ?? entry.value.path;
        return (
          candidate.length === path.length && candidate.every((part, index) => part === path[index])
        );
      });
      return [
        name,
        Object.freeze({
          ...checkPureExpression(expression, variables),
          path,
          sources: Object.freeze(sources),
        }),
      ];
    }),
  );
  const program = Object.freeze({
    artifact,
    rule,
    relation: source.select.relation,
    definitions: Object.freeze(compiled),
  });
  checkedPrograms.add(program);
  return program;
}

/** An immutable identity, never a mutable Item or a live expression view. */
export class AttributeItemIdentity {
  constructor(
    readonly id: string,
    readonly itemType: string,
  ) {
    Object.freeze(this);
  }
}

export interface AttributeRead {
  readonly kind: "feature" | "topology" | "association" | "temporal" | "parameters" | "kernel";
  readonly subject: string;
  readonly value: unknown;
  readonly decisionIds: readonly string[];
}

export interface AttributeEvidence {
  readonly item: AttributeItemIdentity;
  readonly definition: CheckedAttribute;
  readonly generation: string;
  readonly value: unknown;
  readonly reads: readonly AttributeRead[];
  readonly parents: readonly AttributeEvidence[];
}

export interface AttributeResult {
  readonly value: unknown;
  readonly evidence?: AttributeEvidence;
}

/** Copy JSON-shaped values, preserving absence and rejecting executable inputs. */
function immutable(value: unknown): unknown {
  if (value instanceof AttributeItemIdentity) return value;
  if (Array.isArray(value)) return Object.freeze(value.map(immutable));
  if (value instanceof Map) return immutable(Object.fromEntries(value));
  if (isPlainObject(value))
    return Object.freeze(
      Object.fromEntries(Object.entries(value).map(([key, child]) => [key, immutable(child)])),
    );
  if (typeof value === "bigint") {
    const number = Number(value);
    if (!Number.isSafeInteger(number))
      throw new Error("E_ATTRIBUTE_INTEGER: result exceeds safe integer range");
    return number;
  }
  if (value === null || ["undefined", "string", "number", "boolean"].includes(typeof value))
    return value;
  throw new Error("E_ATTRIBUTE_VALUE: unsupported mutable or executable value");
}

/**
 * One supplied graph/artifact/environment request. CEL still owns evaluation;
 * this owner supplies read-only views and caches actual execution evidence.
 * Engineering scope: whole-generation invalidation, no selective reuse.
 */
export class RequestedAttributes {
  private readonly owner = new GraphRuleEvaluationOwner();
  private generation = -1n;
  private readonly caches = {
    values: new Map<string, AttributeResult>(),
    evidence: new Map<string, AttributeResult>(),
  };
  private readonly active = new Set<string>();
  private readonly parameters: Readonly<Record<string, unknown>>;
  private readonly scopes: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  private evaluations = 0;

  constructor(
    private readonly utterance: Utterance,
    readonly program: CheckedAttributes,
    options: {
      parameters?: Record<string, unknown>;
      parameterScopes?: Record<string, Record<string, unknown>>;
    } = {},
  ) {
    if (!checkedPrograms.has(program))
      throw new Error("E_ATTRIBUTE_CHECKED: expected compiler-checked definitions");
    const base = projectPolicyValues(program.artifact.parameters);
    const supplied = projectPolicyValues(options.parameters ?? {});
    if (!isPlainObject(base) || !isPlainObject(supplied))
      throw new Error("E_HRG_PARAMETERS: parameters must be objects");
    this.parameters = immutable(mergeParameterRecords(base, supplied)) as Readonly<
      Record<string, unknown>
    >;
    this.scopes = Object.freeze(
      Object.fromEntries(
        Object.entries(options.parameterScopes ?? {}).map(([name, overlay]) => {
          const projected = projectPolicyValues(overlay);
          if (!isPlainObject(projected))
            throw new Error("E_HRG_PARAMETERS: parameter scope must be an object");
          return [name, immutable(mergeParameterRecords(this.parameters, projected))];
        }),
      ),
    ) as typeof this.scopes;
  }

  get evaluationCount(): number {
    return this.evaluations;
  }

  evaluate(item: Item, name: string, mode: "values" | "evidence" = "evidence"): AttributeResult {
    const generation = this.utterance.committedGeneration();
    if (this.utterance.getItem(item.id) !== item)
      throw new Error("E_ATTRIBUTE_ITEM: requested Item is not committed in this graph");
    if (this.generation !== generation) {
      this.caches.values.clear();
      this.caches.evidence.clear();
      this.generation = generation;
    }
    const definition = this.program.definitions[name];
    if (!definition) throw new Error(`E_ATTRIBUTE_UNKNOWN: '${name}'`);
    const key = JSON.stringify([item.id, name]);
    const cached = this.caches[mode].get(key);
    if (cached) return cached;
    const activeKey = `${mode}:${key}`;
    if (this.active.has(activeKey)) throw new Error(`E_ATTRIBUTE_CYCLE: '${name}'`);
    this.active.add(activeKey);
    try {
      const reads: AttributeRead[] = [];
      const parents = new Set<AttributeEvidence>();
      const views = new Map<Item, Record<string, unknown>>();
      const itemsByView = new WeakMap<object, Item>();
      const identity = (source: Item) => new AttributeItemIdentity(source.id, source.type);
      const capture = (value: unknown): unknown => {
        const source = value && typeof value === "object" ? itemsByView.get(value) : undefined;
        if (source) return identity(source);
        if (Array.isArray(value)) return Object.freeze(value.map(capture));
        if (value instanceof Map) return capture(Object.fromEntries(value));
        if (isPlainObject(value))
          return Object.freeze(
            Object.fromEntries(
              Object.entries(value).map(([field, child]) => [field, capture(child)]),
            ),
          );
        return immutable(value);
      };
      const record = (
        kind: AttributeRead["kind"],
        subject: string,
        value: unknown,
        ids: readonly string[] = [],
      ) => {
        if (mode === "evidence")
          reads.push(
            Object.freeze({
              kind,
              subject,
              value: capture(value),
              decisionIds: Object.freeze([...ids]),
            }),
          );
      };
      const read = (source: Item, field: string) => {
        const write = source.latestWrite(field);
        record(
          "feature",
          `${source.id}.${field}`,
          { present: source.has(field), value: source.get(field) },
          write ? [write.decisionId] : [],
        );
        return source.get(field);
      };
      const anchor = (source: Item) => {
        const value = this.utterance.temporalAnchor(source);
        record("temporal", source.id, value ?? null, value ? [value.decisionId] : []);
        return value;
      };
      const view = (source: Item | undefined): Record<string, unknown> | null => {
        if (!source) return null;
        let result = views.get(source);
        if (result) return result;
        result = new Proxy(
          {},
          {
            get: (_target, field) => {
              if (field === "constructor") return ItemViewType;
              if (field === "id") return source.id;
              if (field === "itemType") return source.type;
              if (field === "sync_left" || field === "sync_right") {
                const temporal = anchor(source);
                return temporal
                  ? field === "sync_left"
                    ? temporal.leftMarkId
                    : temporal.rightMarkId
                  : null;
              }
              return typeof field === "string" ? read(source, field) : undefined;
            },
            has: (_target, field) => {
              if (
                field === "id" ||
                field === "itemType" ||
                field === "sync_left" ||
                field === "sync_right"
              )
                return true;
              if (typeof field !== "string") return false;
              read(source, field);
              return source.has(field);
            },
            ownKeys: () => ["id", "itemType", ...source.featureKeys()],
            getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
          },
        );
        views.set(source, result);
        itemsByView.set(result, source);
        return result;
      };
      const restore = (value: unknown): unknown => {
        if (value instanceof AttributeItemIdentity) return view(this.utterance.getItem(value.id));
        if (Array.isArray(value)) return value.map(restore);
        if (isPlainObject(value))
          return Object.fromEntries(
            Object.entries(value).map(([field, child]) => [field, restore(child)]),
          );
        return value;
      };
      const resolve = (value: unknown) =>
        value && typeof value === "object" ? itemsByView.get(value) : undefined;
      const relation = this.utterance.getRelation(this.program.relation);
      const members = () => {
        const all = relation?.listItems() ?? [];
        record(
          "topology",
          this.program.relation,
          all.map(identity),
          relation?.writes().map((write) => write.decisionId),
        );
        return all.filter((member) => read(member, "active") !== false);
      };
      const offset = (value: unknown, amount: unknown) => {
        const source = resolve(value);
        const items = members();
        const index = source ? items.indexOf(source) : -1;
        const distance =
          typeof amount === "number" || typeof amount === "bigint" ? Math.trunc(Number(amount)) : 1;
        return view(index < 0 ? undefined : items[index + distance]);
      };
      const point = (value: unknown, ratio: unknown) => {
        const source = resolve(value);
        const temporal = source ? anchor(source) : undefined;
        return temporal && Number.isFinite(Number(ratio))
          ? {
              leftMarkId: temporal.leftMarkId,
              rightMarkId: temporal.rightMarkId,
              ratio: Number(ratio),
            }
          : null;
      };
      const functions: Record<string, (...args: unknown[]) => unknown> = {
        ...PURE_GRAPH_MATH,
        ahead: (source, amount = 1) => offset(source, amount),
        behind: (source, amount = 1) => offset(source, -Number(amount)),
        midpoint: (source) => point(source, 0.5),
        at_ratio: point,
        at_sync: (mark) =>
          typeof mark === "string" ? { leftMarkId: mark, rightMarkId: mark, ratio: 0 } : null,
        at_offset: (mark, amount) =>
          typeof mark === "string" && Number.isFinite(Number(amount))
            ? { leftMarkId: mark, rightMarkId: mark, ratio: 0, offsetMs: Number(amount) }
            : null,
        assoc: (value, nameValue) => {
          const source = resolve(value);
          if (!source || typeof nameValue !== "string") return [];
          const edges = this.utterance.latestAssociationWrites(source, nameValue);
          record(
            "association",
            `${source.id}:${nameValue}`,
            edges,
            edges.map((edge) => edge.decisionId),
          );
          return edges
            .filter((edge) => edge.active)
            .flatMap((edge) => {
              const target = this.utterance.getItem(edge.toItemId);
              return target && read(target, "active") !== false ? [view(target)] : [];
            });
        },
        path: (value, pathValue) => {
          const source = resolve(value);
          if (!source || typeof pathValue !== "string") return null;
          const start = source.node(this.program.relation) ?? source.nodes.values().next().value;
          record(
            "topology",
            `${source.id}:start`,
            start ? { relation: start.relation.name, item: source.id } : null,
            start ? [start.write.decisionId] : [],
          );
          if (!start) return null;
          const result = evalPath(start, pathValue, {
            readFeature: read,
            onAttempt: (from, op, to) =>
              record(
                "topology",
                `${from.relation.name}:${from.item.id}:${op}`,
                to ? { relation: to.relation.name, item: to.item.id } : null,
                to ? [to.write.decisionId] : [],
              ),
          });
          const parts = pathValue
            .split(".")
            .map((part) => part.trim())
            .filter(Boolean);
          return parts.length && !isNavOp(parts[parts.length - 1])
            ? result.node
              ? result.value
              : null
            : view(result.node?.item);
        },
      };
      for (const [helper, run] of Object.entries(functions)) {
        functions[helper] = (...args) => {
          const result = run(...args);
          record("kernel", helper, { arguments: args, result });
          return result;
        };
      }
      const values = new Proxy<Record<string, unknown>>(
        {},
        {
          get: (_target, variable) => {
            if (variable === "current") return view(item);
            if (variable === "prev") return offset(view(item), -1);
            if (variable === "next") return offset(view(item), 1);
            if (variable === "maps") return this.program.artifact.maps;
            if (variable === "sets") return this.program.artifact.string_sets;
            if (variable === "params") {
              const scope = Object.keys(this.scopes).length
                ? read(item, PARAMETER_SCOPE_FEATURE)
                : undefined;
              const params = scope === undefined ? this.parameters : this.scopes[String(scope)];
              if (!params)
                throw new Error(`E_HRG_PARAMETER_SCOPE: unknown scope '${String(scope)}'`);
              record("parameters", item.id, { scope, params });
              return params;
            }
            if (typeof variable !== "string" || !Object.hasOwn(this.program.definitions, variable))
              return undefined;
            const child = this.evaluate(item, variable, mode);
            if (child.evidence) parents.add(child.evidence);
            return restore(child.value);
          },
          has: (_target, variable) =>
            typeof variable === "string" &&
            (["current", "prev", "next", "params", "maps", "sets"].includes(variable) ||
              Object.hasOwn(this.program.definitions, variable)),
        },
      );
      this.evaluations++;
      const value = capture(this.owner.evaluate(definition.expression, values, functions));
      const result = Object.freeze({
        value,
        ...(mode === "evidence"
          ? {
              evidence: Object.freeze({
                item: identity(item),
                definition,
                generation: generation.toString(),
                value,
                reads: Object.freeze(reads),
                parents: Object.freeze([...parents]),
              }),
            }
          : {}),
      });
      this.caches[mode].set(key, result);
      return result;
    } finally {
      this.active.delete(activeKey);
    }
  }
}
