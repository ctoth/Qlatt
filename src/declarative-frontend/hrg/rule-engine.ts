import type { CompiledRulepack } from "../rule-pack";
import { evaluateExpression } from "../cel-expressions";
import { isPlainObject } from "../../yaml-loader";
import type { Item } from "./item";
import type { HrgNode } from "./relation";
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
  utterance: Utterance,
  transaction: HrgTransaction,
  items: readonly Item[],
  index: number,
  params: Readonly<Record<string, unknown>>,
  extra: Readonly<Record<string, unknown>> = {},
  bindings: Readonly<Record<string, Item>> = {},
): EvaluationContext {
  const views = new Map<Item, Readonly<Record<string, unknown>>>();
  const itemByView = new WeakMap<object, Item>();
  const view = (item: Item | undefined): Readonly<Record<string, unknown>> | null => {
    if (!item) return null;
    let result = views.get(item);
    if (!result) {
      const featureView = transaction.view(item);
      result = new Proxy(featureView, {
        get: (target, property, receiver) => {
          if (property === "sync_left" || property === "sync_right") {
            const anchor = utterance.temporalAnchor(item);
            if (!anchor) return null;
            transaction.dependOn(anchor.decisionId);
            return property === "sync_left" ? anchor.leftMarkId : anchor.rightMarkId;
          }
          return Reflect.get(target, property, receiver);
        },
        has: (target, property) =>
          property === "sync_left" || property === "sync_right" || Reflect.has(target, property),
      });
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
  const association = (sourceValue: unknown, nameValue: unknown): Readonly<Record<string, unknown>>[] => {
    const source = resolveItem(sourceValue);
    if (!source || typeof nameValue !== "string") return [];
    const targets: Readonly<Record<string, unknown>>[] = [];
    for (const write of utterance.latestAssociationWrites(source, nameValue)) {
      transaction.dependOn(write.decisionId);
      if (!write.active) continue;
      const target = utterance.getItem(write.toItemId);
      if (!target) continue;
      if (target.has("active") && transaction.read(target, "active") === false) continue;
      const targetView = view(target);
      if (targetView) targets.push(targetView);
    }
    return targets;
  };
  const bindingViews = Object.fromEntries(
    Object.entries(bindings).map(([name, item]) => [name, view(item)]),
  );
  return {
    values: {
      current: view(items[index]),
      prev: view(items[index - 1]),
      next: view(items[index + 1]),
      params,
      ...bindingViews,
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
      assoc: association,
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
  resolveTarget: (name: string) => Item | undefined,
  defaultTarget: string,
  effects: unknown,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): void {
  if (!Array.isArray(effects)) return;
  for (const effect of effects) {
    if (!isPlainObject(effect) || typeof effect.field !== "string") continue;
    const targetName = typeof effect.target === "string" ? effect.target : defaultTarget;
    const item = resolveTarget(targetName);
    if (!item) throw new Error(`E_EFFECT_TARGET_UNKNOWN: unknown effect target '${targetName}'`);
    const incoming = evaluateDispatch(effect.value, context, predicates);
    const root = effect.field.split(".")[0];
    const current = transaction.read(item, root);
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

interface Match {
  transaction: HrgTransaction;
  items: readonly Item[];
  index: number;
  bindings: Readonly<Record<string, Item>>;
  nodes: Readonly<Record<string, HrgNode>>;
  defaultTarget: string;
  relationName: string;
}

function beginRuleTransaction(
  utterance: Utterance,
  phaseName: string,
  ruleName: string,
  rule: Readonly<Record<string, unknown>>,
): HrgTransaction {
  return utterance.beginTransaction({
    ruleId: ruleName,
    phase: phaseName,
    tag: ruleTag(rule, ruleName),
    reason: `${ruleName} matched`,
    citations: stringArray(rule.citations),
  });
}

function applyAssociations(
  transaction: HrgTransaction,
  specs: unknown,
  active: boolean,
  resolveTarget: (name: string) => Item | undefined,
): void {
  if (!Array.isArray(specs)) return;
  for (const spec of specs) {
    if (!isPlainObject(spec) || typeof spec.assoc_name !== "string" || !spec.assoc_name) continue;
    const fromName = typeof spec.from === "string" ? spec.from : "current";
    const toName = typeof spec.to === "string" ? spec.to : "current";
    const from = resolveTarget(fromName);
    const to = resolveTarget(toName);
    if (!from || !to) continue;
    if (active) transaction.associate(spec.assoc_name, from, to);
    else transaction.disassociate(spec.assoc_name, from, to);
  }
}

function applySplice(
  utterance: Utterance,
  match: Match,
  splice: unknown,
  context: EvaluationContext,
): void {
  if (!isPlainObject(splice) || !Array.isArray(splice.insert) || splice.insert.length === 0) return;
  const transaction = match.transaction;
  const resolveTarget = (name: string): Item | undefined =>
    name === "current" ? match.items[match.index] : match.bindings[name];
  if (splice.type !== "replace_range" && splice.type !== "insert_at_boundary") {
    throw new Error(`E_SPLICE_TYPE_UNSUPPORTED: unsupported splice type '${String(splice.type)}'`);
  }
  const source = resolveTarget(
    typeof splice.target === "string" ? splice.target : match.defaultTarget,
  );
  if (!source) throw new Error("E_HRG_SPLICE_SOURCE: splice has no source Item");
  const sourceAnchor = utterance.intervalAnchor(source);
  const explicitSuppressed = stringArray(splice.suppress)
    .map(resolveTarget)
    .filter((item): item is Item => item != null);
  let leftMarkId = sourceAnchor?.leftMarkId;
  let rightMarkId = sourceAnchor?.rightMarkId;
  const rangeSuppressed: Item[] = [];
  if (splice.type === "replace_range") {
    const left = evaluate(splice.range_left, context);
    const right = evaluate(splice.range_right, context);
    if (typeof left === "string") leftMarkId = left;
    if (typeof right === "string") rightMarkId = right;
    if (!leftMarkId || !rightMarkId) {
      throw new Error("E_SPLICE_RANGE_REQUIRED: replace_range requires an anchored range");
    }
    for (const item of match.items) {
      const anchor = utterance.intervalAnchor(item);
      if (!anchor) continue;
      transaction.dependOn(anchor.decisionId);
      if (
        utterance.axis.compare(leftMarkId, anchor.leftMarkId) <= 0
        && utterance.axis.compare(anchor.rightMarkId, rightMarkId) <= 0
      ) {
        rangeSuppressed.push(item);
      }
    }
  }
  const suppressed = [...new Set([...rangeSuppressed, ...explicitSuppressed])];
  for (const item of new Set(suppressed)) transaction.set(item, "active", false);

  const orderedSuppressed = [...new Set(suppressed)].sort(
    (left, right) => match.items.indexOf(left) - match.items.indexOf(right),
  );
  let previous = orderedSuppressed[orderedSuppressed.length - 1] ?? source;
  const inserted: Item[] = [];
  for (let index = 0; index < splice.insert.length; index += 1) {
    const rawTemplate = splice.insert[index];
    if (!isPlainObject(rawTemplate)) continue;
    const segment = isPlainObject(rawTemplate.segment) ? rawTemplate.segment : null;
    const template = segment ?? rawTemplate;
    const item = transaction.createItem(
      source.type,
      `${source.id}:${transaction.metadata.ruleId}:${index.toString()}`,
    );
    const copySourceName = typeof template.copy_from === "string" ? template.copy_from : null;
    const copySource = copySourceName ? resolveTarget(copySourceName) : undefined;
    if (copySource && Array.isArray(template.copy_fields)) {
      for (const field of stringArray(template.copy_fields)) {
        const value = transaction.read(copySource, field);
        if (value !== undefined) transaction.set(item, field, value);
      }
    }
    const target = segment && Object.prototype.hasOwnProperty.call(segment, "target")
      ? evaluate(segment.target, context)
      : null;
    if (isPlainObject(target)) {
      for (const field of ["phoneme", "type", "duration", "inherentDuration", "params", "inventorySW"]) {
        if (Object.prototype.hasOwnProperty.call(target, field)) transaction.set(item, field, target[field]);
      }
    }
    const templateFields = segment && isPlainObject(segment.fields)
      ? { ...segment.fields, ...(Object.prototype.hasOwnProperty.call(segment, "phoneme")
        ? { phoneme: segment.phoneme }
        : {}) }
      : template;
    for (const [field, expression] of Object.entries(templateFields)) {
      if (field === "copy_from" || field === "copy_fields" || field === "target" || field === "fields") continue;
      const value = evaluate(expression, context);
      if (value !== undefined) transaction.set(item, field, value);
    }
    transaction.insertAfter(match.relationName, previous, item);
    inserted.push(item);
    previous = item;
  }
  if (splice.type === "insert_at_boundary") {
    const boundary = evaluate(splice.boundary, context);
    if (typeof boundary !== "string") {
      throw new Error("E_SPLICE_BOUNDARY_REQUIRED: insert_at_boundary requires a boundary mark");
    }
    const side = splice.side === "before" ? "before" : "after";
    const neighbor = match.items.find((item) => {
      const anchor = utterance.intervalAnchor(item);
      return side === "after" ? anchor?.leftMarkId === boundary : anchor?.rightMarkId === boundary;
    });
    const neighborAnchor = neighbor ? utterance.intervalAnchor(neighbor) : undefined;
    leftMarkId = side === "after" ? boundary : neighborAnchor?.leftMarkId;
    rightMarkId = side === "after" ? neighborAnchor?.rightMarkId : boundary;
    if (!leftMarkId || !rightMarkId) {
      throw new Error("E_SPLICE_BOUNDARY_ADJACENT_REQUIRED");
    }
  }
  if (inserted.length > 0 && leftMarkId && rightMarkId) {
    transaction.partitionAnchors(inserted, leftMarkId, rightMarkId);
  }
}

function executeMatch(
  utterance: Utterance,
  rule: Readonly<Record<string, unknown>>,
  match: Match,
  params: Readonly<Record<string, unknown>>,
  predicates: Readonly<Record<string, unknown>>,
): void {
  const resolveTarget = (name: string): Item | undefined =>
    name === "current" ? match.items[match.index] : match.bindings[name];
  let context = buildEvaluationContext(
    utterance,
    match.transaction,
    match.items,
    match.index,
    params,
    {},
    match.bindings,
  );
  const definitions: Record<string, unknown> = {};
  if (isPlainObject(rule.define)) {
    for (const [name, expression] of Object.entries(rule.define)) {
      definitions[name] = evaluate(expression, context);
      context = buildEvaluationContext(
        utterance,
        match.transaction,
        match.items,
        match.index,
        params,
        definitions,
        match.bindings,
      );
    }
  }
  if (!conditionMatches(rule.constraint, context, predicates)) return;
  applyEffects(
    match.transaction,
    resolveTarget,
    match.defaultTarget,
    rule.apply,
    context,
    predicates,
  );
  applyAssociations(match.transaction, rule.associate, true, resolveTarget);
  applyAssociations(match.transaction, rule.disassociate, false, resolveTarget);
  applySplice(utterance, match, rule.splice, context);
  if (rule.suppress === true || rule.delete === true) {
    for (const item of new Set(Object.values(match.bindings))) {
      match.transaction.set(item, "active", false);
    }
  }
  match.transaction.commit();
}

function selectMatches(
  utterance: Utterance,
  phaseName: string,
  ruleName: string,
  rule: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>,
  predicates: Readonly<Record<string, unknown>>,
): Match[] {
  if (!isPlainObject(rule.select) || typeof rule.select.relation !== "string") return [];
  const items = activeItems(utterance.relation(rule.select.relation).listItems());
  const relation = utterance.relation(rule.select.relation);
  const matches: Match[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const transaction = beginRuleTransaction(utterance, phaseName, ruleName, rule);
    const context = buildEvaluationContext(utterance, transaction, items, index, params);
    if (!conditionMatches(rule.select.where, context, predicates)) continue;
    const node = relation.node(items[index]);
    if (!node) throw new Error("E_HRG_MATCH_NODE: selected Item has no relation node");
    matches.push({
      transaction,
      items,
      index,
      bindings: Object.freeze({ current: items[index] }),
      nodes: Object.freeze({ current: node }),
      defaultTarget: "current",
      relationName: rule.select.relation,
    });
  }
  return matches;
}

function patternMatches(
  utterance: Utterance,
  phaseName: string,
  ruleName: string,
  rule: Readonly<Record<string, unknown>>,
  patterns: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>,
  predicates: Readonly<Record<string, unknown>>,
): Match[] {
  if (typeof rule.match !== "string") return [];
  const pattern = patterns[rule.match];
  if (!isPlainObject(pattern) || typeof pattern.relation !== "string" || !Array.isArray(pattern.sequence)) {
    return [];
  }
  const items = activeItems(utterance.relation(pattern.relation).listItems());
  const relation = utterance.relation(pattern.relation);
  const matches: Match[] = [];
  for (let start = 0; start < items.length; start += 1) {
    const transaction = beginRuleTransaction(utterance, phaseName, ruleName, rule);
    const bindings: Record<string, Item> = {};
    const nodes: Record<string, HrgNode> = {};
    let matched = true;
    for (let offset = 0; offset < pattern.sequence.length; offset += 1) {
      const step = pattern.sequence[offset];
      const index = start + offset;
      const item = items[index];
      if (!item || !isPlainObject(step) || typeof step.capture !== "string") {
        matched = false;
        break;
      }
      const context = buildEvaluationContext(
        utterance,
        transaction,
        items,
        index,
        params,
        {},
        bindings,
      );
      if (!conditionMatches(step.where, context, predicates)) {
        matched = false;
        break;
      }
      bindings[step.capture] = item;
      const node = relation.node(item);
      if (!node) throw new Error("E_HRG_MATCH_NODE: pattern Item has no relation node");
      nodes[step.capture] = node;
    }
    const captureNames = Object.keys(bindings);
    if (!matched || captureNames.length === 0) continue;
    const defaultTarget = captureNames[0];
    const index = items.indexOf(bindings[defaultTarget]);
    const context = buildEvaluationContext(
      utterance,
      transaction,
      items,
      index,
      params,
      {},
      bindings,
    );
    if (!conditionMatches(pattern.constraint, context, predicates)) continue;
    matches.push({
      transaction,
      items,
      index,
      bindings: Object.freeze({ ...bindings }),
      nodes: Object.freeze({ ...nodes }),
      defaultTarget,
      relationName: pattern.relation,
    });
  }
  return matches;
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
      if (!isPlainObject(rule)) continue;
      const matches = isPlainObject(rule.select)
        ? selectMatches(utterance, phase.name, ruleName, rule, params, predicates)
        : patternMatches(utterance, phase.name, ruleName, rule, spec.patterns, params, predicates);
      for (const match of matches) executeMatch(utterance, rule, match, params, predicates);
    }
  }
  return {
    transactions: utterance.journal().slice(startJournalLength),
  };
}
