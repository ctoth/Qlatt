import type { CompiledRulepack } from "../rule-pack";
import { evaluateExpression } from "../cel-expressions";
import { isPlainObject } from "../../yaml-loader";
import type { Item } from "./item";
import type { HrgTransaction } from "./transaction";
import type { FeatureValue, TransactionJournalEntry } from "./types";
import type { Utterance } from "./utterance";

export interface GraphRuleEngineOptions {
  phases?: readonly string[];
  parameters?: Readonly<Record<string, unknown>>;
}

export interface GraphRuleEngineResult {
  transactions: readonly TransactionJournalEntry[];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function activeItems(items: readonly Item[]): Item[] {
  return items.filter((item) => item.get("active") !== false);
}

function numericAggregate(args: unknown[], mode: "min" | "max"): number {
  const values = (args.length === 1 && Array.isArray(args[0]) ? args[0] : args)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return mode === "min" ? Math.min(...values) : Math.max(...values);
}

type EvaluationContext = {
  values: Record<string, unknown>;
  functions: Record<string, (...args: unknown[]) => unknown>;
};

function buildEvaluationContext(
  transaction: HrgTransaction,
  items: readonly Item[],
  index: number,
  params: Readonly<Record<string, unknown>>,
  extra: Readonly<Record<string, unknown>> = {},
): EvaluationContext {
  const views = new Map<Item, Readonly<Record<string, unknown>>>();
  const itemByView = new WeakMap<object, Item>();
  const view = (item: Item | undefined): Readonly<Record<string, unknown>> | null => {
    if (!item) return null;
    let result = views.get(item);
    if (!result) {
      result = transaction.view(item);
      views.set(item, result);
      itemByView.set(result, item);
    }
    return result;
  };
  const resolveItem = (value: unknown): Item | undefined =>
    value != null && typeof value === "object" ? itemByView.get(value) : undefined;
  const offset = (value: unknown, amount: unknown): Readonly<Record<string, unknown>> | null => {
    const source = resolveItem(value);
    const sourceIndex = source ? items.indexOf(source) : -1;
    const distance = typeof amount === "number" ? Math.trunc(amount) : 1;
    return sourceIndex >= 0 ? view(items[sourceIndex + distance]) : null;
  };
  const merge = (left: unknown, right: unknown): Record<string, unknown> => ({
    ...(isPlainObject(left) ? left : {}),
    ...(isPlainObject(right) ? right : {}),
  });
  return {
    values: {
      current: view(items[index]),
      prev: view(items[index - 1]),
      next: view(items[index + 1]),
      params,
      ...extra,
    },
    functions: {
      ahead: (source, amount = 1) => offset(source, amount),
      behind: (source, amount = 1) => offset(source, -Number(amount)),
      total: () => items.length,
      max: (...args) => numericAggregate(args, "max"),
      min: (...args) => numericAggregate(args, "min"),
      exp: (value) => Math.exp(Number(value)),
      sqrt: (value) => Math.sqrt(Number(value)),
      abs: (value) => Math.abs(Number(value)),
      log: (value) => Math.log(Number(value)),
      pow: (value, exponent) => Math.pow(Number(value), Number(exponent)),
      contains: (container, candidate) =>
        typeof container === "string"
          ? container.includes(String(candidate))
          : Array.isArray(container) && container.includes(candidate),
      merge,
    },
  };
}

function evaluate(
  expression: unknown,
  context: EvaluationContext,
): unknown {
  if (typeof expression !== "string") return expression;
  return evaluateExpression(expression, context.values, context.functions);
}

function conditionMatches(
  condition: unknown,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): boolean {
  if (condition == null || condition === "") return true;
  if (typeof condition === "string") return Boolean(evaluate(condition, context));
  if (!isPlainObject(condition)) return Boolean(condition);
  if (typeof condition.predicate === "string") {
    return conditionMatches(predicates[condition.predicate], context, predicates);
  }
  if (typeof condition.expr === "string") return Boolean(evaluate(condition.expr, context));
  if (Array.isArray(condition.all)) {
    return condition.all.every((entry) => conditionMatches(entry, context, predicates));
  }
  if (Array.isArray(condition.any)) {
    return condition.any.some((entry) => conditionMatches(entry, context, predicates));
  }
  if (condition.not != null) return !conditionMatches(condition.not, context, predicates);
  return false;
}

function evaluateDispatch(
  value: unknown,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): unknown {
  if (!isPlainObject(value) || !Array.isArray(value.dispatch)) return evaluate(value, context);
  for (const branch of value.dispatch) {
    if (!isPlainObject(branch)) continue;
    if (branch.when != null && conditionMatches(branch.when, context, predicates)) {
      return evaluate(branch.value, context);
    }
    if (Object.prototype.hasOwnProperty.call(branch, "default")) {
      return evaluate(branch.default, context);
    }
  }
  return null;
}

function updateNestedValue(
  transaction: HrgTransaction,
  item: Item,
  field: string,
  value: unknown,
): void {
  const [root, ...path] = field.split(".");
  if (path.length === 0) {
    transaction.set(item, root, value);
    return;
  }
  const existing = transaction.read(item, root);
  const update = (
    source: FeatureValue | undefined,
    index: number,
  ): unknown => {
    const key = path[index];
    const record = isPlainObject(source) ? source : {};
    return Object.freeze({
      ...record,
      [key]: index === path.length - 1 ? value : update(record[key], index + 1),
    });
  };
  transaction.set(item, root, update(existing, 0));
}

function applyEffects(
  transaction: HrgTransaction,
  item: Item,
  effects: unknown,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): void {
  if (!Array.isArray(effects)) return;
  for (const effect of effects) {
    if (!isPlainObject(effect) || typeof effect.field !== "string") continue;
    const incoming = evaluateDispatch(effect.value, context, predicates);
    const current = transaction.read(item, effect.field);
    let resolved: unknown = incoming;
    switch (effect.op) {
      case "add":
        resolved = Number(current ?? 0) + Number(incoming);
        break;
      case "mul":
        resolved = Number(current ?? 0) * Number(incoming);
        break;
      case "max":
        resolved = Math.max(Number(current), Number(incoming));
        break;
      case "min":
        resolved = Math.min(Number(current), Number(incoming));
        break;
      case "unset":
        resolved = null;
        break;
      default:
        break;
    }
    updateNestedValue(transaction, item, effect.field, resolved);
  }
}

function ruleTag(rule: Readonly<Record<string, unknown>>, ruleName: string): string {
  if (typeof rule.tag === "string" && rule.tag) return rule.tag;
  if (Array.isArray(rule.apply)) {
    const tagged = rule.apply.find((effect) => isPlainObject(effect) && typeof effect.tag === "string");
    if (isPlainObject(tagged) && typeof tagged.tag === "string") return tagged.tag;
  }
  return ruleName;
}

export function runGraphRuleEngine(
  utterance: Utterance,
  spec: CompiledRulepack,
  options: GraphRuleEngineOptions = {},
): GraphRuleEngineResult {
  const startJournalLength = utterance.journal().length;
  const selectedPhases = options.phases ? new Set(options.phases) : null;
  const params = Object.freeze({ ...spec.parameters, ...(options.parameters ?? {}) });
  const predicates = spec.predicates;

  for (const phase of spec.phases) {
    if (selectedPhases && !selectedPhases.has(phase.name)) continue;
    for (const ruleName of phase.rules) {
      const rule = spec.rules[ruleName];
      if (!isPlainObject(rule) || !isPlainObject(rule.select)) continue;
      const relationName = rule.select.relation;
      if (typeof relationName !== "string") continue;
      const items = activeItems(utterance.relation(relationName).listItems());
      for (let index = 0; index < items.length; index += 1) {
        const transaction = utterance.beginTransaction({
          ruleId: ruleName,
          phase: phase.name,
          tag: ruleTag(rule, ruleName),
          reason: `${ruleName} matched`,
          citations: stringArray(rule.citations),
        });
        let context = buildEvaluationContext(transaction, items, index, params);
        if (!conditionMatches(rule.select.where, context, predicates)) continue;
        const definitions: Record<string, unknown> = {};
        if (isPlainObject(rule.define)) {
          for (const [name, expression] of Object.entries(rule.define)) {
            definitions[name] = evaluate(expression, context);
            context = buildEvaluationContext(transaction, items, index, params, definitions);
          }
        }
        if (!conditionMatches(rule.constraint, context, predicates)) continue;
        applyEffects(transaction, items[index], rule.apply, context, predicates);
        transaction.commit();
      }
    }
  }
  return {
    transactions: utterance.journal().slice(startJournalLength),
  };
}
