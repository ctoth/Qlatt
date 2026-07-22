import type { CompiledRulepack } from "../rule-pack";
import { materializePhonemeTarget, type InventorySpec } from "../inventory";
import { trajectoryControlWindows } from "../trajectory-control-windows";
import { isNavOp, evalPath } from "./path";
import { applyScalarOp } from "./scalar-op";
import { evaluateExpression } from "../cel-expressions";
import { isPlainObject } from "../../yaml-loader";
import type { Item } from "./item";
import type { HrgNode } from "./relation";
import type { HrgTransaction } from "./transaction";
import type {
  ConditionEvidence,
  FeatureValue,
  RuleAttempt,
  TransactionJournalEntry,
} from "./types";
import type { Utterance } from "./utterance";

export interface GraphRuleEngineOptions {
  phases?: readonly string[];
  parameters?: Readonly<Record<string, unknown>>;
  inventory?: GraphInventoryResource;
  evaluationOwner?: GraphRuleEvaluationOwner;
  captureTooling?: boolean;
}

export interface GraphInventoryResource {
  spec: InventorySpec;
  decisionId: string;
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

function projectPolicyValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(projectPolicyValues);
  if (!isPlainObject(value)) return value;
  if (Object.prototype.hasOwnProperty.call(value, "value")) return projectPolicyValues(value.value);
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, projectPolicyValues(nested)]),
  );
}

function mergeParameterRecords(
  base: Readonly<Record<string, unknown>>,
  override: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    merged[key] = isPlainObject(current) && isPlainObject(value)
      ? mergeParameterRecords(current, value)
      : value;
  }
  return merged;
}

function numericAggregate(args: unknown[], mode: "min" | "max"): number {
  const values = (args.length === 1 && Array.isArray(args[0]) ? args[0] : args)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return mode === "min" ? Math.min(...values) : Math.max(...values);
}

type EvaluationContext = {
  values: Record<string, unknown>;
  functions: Record<string, (...args: unknown[]) => unknown>;
  isItemView: (value: unknown) => boolean;
  owner: GraphRuleEvaluationOwner;
};

export class GraphRuleEvaluationOwner {
  private activeFunctions: Record<string, (...args: unknown[]) => unknown> | null = null;
  private readonly boundFunctions = new Proxy<Record<string, (...args: unknown[]) => unknown>>({}, {
    get: (_target, property) => typeof property === "string" ? this.activeFunctions?.[property] : undefined,
  });

  evaluate(
    expression: string,
    values: Record<string, unknown>,
    functions: Record<string, (...args: unknown[]) => unknown>,
  ): unknown {
    const previous = this.activeFunctions;
    this.activeFunctions = functions;
    try {
      return evaluateExpression(expression, values, this.boundFunctions);
    } finally {
      this.activeFunctions = previous;
    }
  }
}

interface EvaluationContextOptions {
  utterance: Utterance;
  transaction: HrgTransaction;
  owner: GraphRuleEvaluationOwner;
  items: readonly Item[];
  index: number;
  params: Readonly<Record<string, unknown>>;
  extra?: Readonly<Record<string, unknown>>;
  bindings?: Readonly<Record<string, Item>>;
  relationName?: string;
  predicates?: Readonly<Record<string, unknown>>;
  inventory?: GraphInventoryResource;
}

function buildEvaluationContext(options: EvaluationContextOptions): EvaluationContext {
  const {
    utterance,
    transaction,
    owner,
    items,
    index,
    params,
    extra = {},
    bindings = {},
    relationName,
    predicates = {},
    inventory,
  } = options;
  const recurseBase = { utterance, transaction, owner, items, params, relationName, predicates, inventory };
  const recurse = (index: number, extra: Readonly<Record<string, unknown>>): EvaluationContext =>
    buildEvaluationContext({ ...recurseBase, index, extra });
  const views = new Map<Item, Readonly<Record<string, unknown>>>();
  const itemByView = new WeakMap<object, Item>();
  const structureRelation = utterance.getRelation("SylStructure");
  const structureAncestor = (item: Item, type: string): Item | undefined => {
    let node = structureRelation?.node(item) ?? null;
    while (node) {
      transaction.dependOn(node.write.decisionId);
      if (node.item.type.toLowerCase() === type) return node.item;
      node = node.parent;
    }
    return undefined;
  };
  const structureChildren = (item: Item): Item[] => {
    const node = structureRelation?.node(item);
    if (!node) return [];
    transaction.dependOn(node.write.decisionId);
    return node.daughters.map((daughter) => {
      transaction.dependOn(daughter.write.decisionId);
      return daughter.item;
    });
  };
  const isFinalSyllable = (item: Item): boolean => {
    if (item.type !== "syllable") return false;
    const parent = structureRelation?.node(item)?.parent?.item;
    if (!parent) return true;
    const siblings = structureChildren(parent).filter((candidate) => candidate.type === "syllable");
    return siblings[siblings.length - 1] === item;
  };
  const nextBoundary = (item: Item): Item | undefined => {
    const word = item.get("word");
    if (typeof word !== "string" || item.get("phoneme") === "SIL") return undefined;
    const start = items.indexOf(item);
    for (let candidateIndex = start + 1; candidateIndex < items.length; candidateIndex += 1) {
      const candidate = items[candidateIndex];
      const breakIndex = candidate.get("breakIndex");
      if (
        candidate.get("phoneme") === "SIL"
        || candidate.get("punctuationSymbol") != null
        || (typeof breakIndex === "number" && breakIndex >= 2)
      ) return candidate;
      const candidateWord = candidate.get("word");
      if (typeof candidateWord === "string" && candidateWord !== word) return undefined;
    }
    return undefined;
  };
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
          if (property === "syllable" && !item.has("syllable")) {
            return view(structureAncestor(item, "syllable"));
          }
          if (property === "word" && !item.has("word")) {
            return view(structureAncestor(item, "word"));
          }
          if (property === "parent" && !item.has("parent")) {
            const parent = structureRelation?.node(item)?.parent;
            if (parent) transaction.dependOn(parent.write.decisionId);
            return view(parent?.item);
          }
          if (property === "daughters" && !item.has("daughters")) {
            return structureChildren(item).map((child) => view(child));
          }
          if (property === "is_final" && item.type === "syllable") {
            return isFinalSyllable(item);
          }
          if (property === "next_boundary") return view(nextBoundary(item));
          return Reflect.get(target, property, receiver);
        },
        has: (target, property) =>
          property === "sync_left"
          || property === "sync_right"
          || (property === "syllable" && structureAncestor(item, "syllable") != null)
          || (property === "word" && structureAncestor(item, "word") != null)
          || (property === "parent" && structureRelation?.node(item)?.parent != null)
          || (property === "daughters" && structureChildren(item).length > 0)
          || (property === "is_final" && item.type === "syllable")
          || property === "next_boundary"
          || Reflect.has(target, property),
      });
      views.set(item, result);
      itemByView.set(result, item);
    }
    return result;
  };
  const resolveItem = (value: unknown): Item | undefined => {
    if (value == null || typeof value !== "object") return undefined;
    const local = itemByView.get(value);
    if (local) return local;
    if (!("id" in value)) return undefined;
    const id = Reflect.get(value, "id");
    return typeof id === "string" ? utterance.getItem(id) : undefined;
  };
  const offset = (value: unknown, amount: unknown): Readonly<Record<string, unknown>> | null => {
    const source = resolveItem(value);
    const sourceIndex = source ? items.indexOf(source) : -1;
    const distance = typeof amount === "number" ? Math.trunc(amount) : 1;
    const target = sourceIndex >= 0 ? items[sourceIndex + distance] : undefined;
    if (target && relationName) {
      const write = utterance.relation(relationName).node(target)?.write;
      if (write) transaction.dependOn(write.decisionId);
    }
    return view(target);
  };
  const merge = (left: unknown, right: unknown): Record<string, unknown> => {
    return {
      ...(isPlainObject(left) ? left : {}),
      ...(isPlainObject(right) ? right : {}),
    };
  };
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
  const pointAnchor = (sourceValue: unknown, ratioValue: unknown): Record<string, unknown> | null => {
    const source = resolveItem(sourceValue);
    const ratio = Number(ratioValue);
    if (!source || !Number.isFinite(ratio)) return null;
    const anchor = utterance.temporalAnchor(source);
    if (!anchor) return null;
    transaction.dependOn(anchor.decisionId);
    return { leftMarkId: anchor.leftMarkId, rightMarkId: anchor.rightMarkId, ratio };
  };
  const scan = (
    sourceValue: unknown,
    maxStepsValue: unknown,
    condition: unknown,
    direction: -1 | 1,
  ): Readonly<Record<string, unknown>> | null => {
    const source = resolveItem(sourceValue);
    const maxSteps = Math.trunc(Number(maxStepsValue));
    const sourceIndex = source ? items.indexOf(source) : -1;
    if (sourceIndex < 0 || !Number.isFinite(maxSteps) || maxSteps <= 0) return null;
    for (let offsetIndex = 1; offsetIndex <= maxSteps; offsetIndex += 1) {
      const candidateIndex = sourceIndex + direction * offsetIndex;
      const candidate = items[candidateIndex];
      if (!candidate) return null;
      if (relationName) {
        const write = utterance.relation(relationName).node(candidate)?.write;
        if (write) transaction.dependOn(write.decisionId);
      }
      const candidateContext = recurse(candidateIndex, {
        source: view(source),
        candidate: view(candidate),
        scan_offset: direction * offsetIndex,
      });
      if (conditionMatches(condition, candidateContext, predicates)) return view(candidate);
    }
    return null;
  };
  const relationItems = (nameValue: unknown): Item[] => {
    if (typeof nameValue !== "string") return [];
    const relation = utterance.getRelation(nameValue);
    if (!relation) throw new Error(`E_RELATION_UNKNOWN: unknown relation '${nameValue}'`);
    return activeItems(relation.listItems()).map((item) => {
      const write = relation.node(item)?.write;
      if (write) transaction.dependOn(write.decisionId);
      return item;
    });
  };
  const wordSegments = (source: Item): Item[] => {
    const word = structureAncestor(source, "word");
    if (!word) return [];
    const segments: Item[] = [];
    const visit = (item: Item): void => {
      if (item.type.toLowerCase() === "segment") {
        segments.push(item);
        return;
      }
      for (const child of structureChildren(item)) visit(child);
    };
    visit(word);
    return segments;
  };
  const findWithinWord = (
    sourceValue: unknown,
    condition: unknown,
    directionValue: unknown = "ahead",
  ): Readonly<Record<string, unknown>> | null => {
    const source = resolveItem(sourceValue);
    if (!source) return null;
    const word = structureAncestor(source, "word");
    const sourceIndex = items.indexOf(source);
    if (!word || sourceIndex < 0) return null;
    const directionName = typeof directionValue === "string" ? directionValue : "ahead";
    const directions: readonly (-1 | 1)[] = directionName === "behind"
      ? [-1]
      : directionName === "both" ? [1, -1] : [1];
    for (const direction of directions) {
      for (let candidateIndex = sourceIndex + direction; candidateIndex >= 0 && candidateIndex < items.length; candidateIndex += direction) {
        const candidate = items[candidateIndex];
        if (structureAncestor(candidate, "word") !== word) break;
        const candidateContext = recurse(candidateIndex, { source: view(source), candidate: view(candidate) });
        if (conditionMatches(condition, candidateContext, predicates)) return view(candidate);
      }
    }
    return null;
  };
  const spanMs = (leftValue: unknown, rightValue: unknown): number => {
    const left = resolveItem(leftValue);
    const right = resolveItem(rightValue);
    let leftIndex = left ? items.indexOf(left) : -1;
    let rightIndex = right ? items.indexOf(right) : -1;
    if (leftIndex < 0 || rightIndex < 0) return 0;
    if (leftIndex > rightIndex) [leftIndex, rightIndex] = [rightIndex, leftIndex];
    let durationMs = 0;
    for (let itemIndex = leftIndex; itemIndex <= rightIndex; itemIndex += 1) {
      const duration = transaction.read(items[itemIndex], "duration");
      if (typeof duration === "number" && Number.isFinite(duration)) durationMs += duration;
    }
    return durationMs;
  };
  const navigatePath = (
    sourceValue: unknown,
    pathValue: unknown,
  ): Readonly<Record<string, unknown>> | FeatureValue | undefined | null => {
    const source = resolveItem(sourceValue);
    if (!source || typeof pathValue !== "string") return null;
    let startNode = relationName ? utterance.relation(relationName).node(source) ?? null : null;
    if (!startNode) startNode = source.nodes.values().next().value ?? null;
    if (!startNode) return null;
    const segments = pathValue.split(".").map((segment) => segment.trim()).filter(Boolean);
    const endsInFeature = segments.length > 0 && !isNavOp(segments[segments.length - 1]);
    const result = evalPath(startNode, pathValue, {
      onStep: (node) => transaction.dependOn(node.write.decisionId),
      readFeature: (item, key) => transaction.read(item, key),
    });
    if (endsInFeature) return result.node ? result.value : null;
    return view(result.node?.item);
  };
  const bindingViews = Object.fromEntries(
    Object.entries(bindings).map(([name, item]) => [name, view(item)]),
  );
  const navigationItems: Readonly<Record<string, Item | undefined>> = {
    current: items[index],
    prev: items[index - 1],
    next: items[index + 1],
    ...bindings,
  };
  const values = {
      current: view(items[index]),
      prev: view(items[index - 1]),
      next: view(items[index + 1]),
      current_index: index,
      params,
      sets: params.sets,
      maps: params.maps,
      ...bindingViews,
      ...extra,
  };
  return {
    owner,
    isItemView: (value) => value !== null && typeof value === "object" && itemByView.has(value),
    values: new Proxy(values, {
      get: (target, property, receiver) => {
        if (typeof property === "string" && relationName) {
          const item = navigationItems[property];
          const write = item ? utterance.relation(relationName).node(item)?.write : undefined;
          if (write) transaction.dependOn(write.decisionId);
        }
        return Reflect.get(target, property, receiver);
      },
    }),
    functions: {
      ahead: (source, amount = 1) => offset(source, amount),
      behind: (source, amount = 1) => offset(source, -Number(amount)),
      total: (name) => relationItems(name).length,
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
      target: (phoneme) => {
        if (!inventory) throw new Error("E_HRG_INVENTORY_REQUIRED: target() requires the selected frontend inventory");
        transaction.dependOn(inventory.decisionId);
        const materialized = materializePhonemeTarget(phoneme, { inventorySpec: inventory.spec });
        return Object.freeze({ ...materialized, ...materialized.params });
      },
      assoc: association,
      midpoint: (source) => pointAnchor(source, 0.5),
      at_ratio: pointAnchor,
      at_sync: (markId) => typeof markId === "string"
        ? { leftMarkId: markId, rightMarkId: markId, ratio: 0 }
        : null,
      at_offset: (markId, offsetMs) => {
        const offset = Number(offsetMs);
        return typeof markId === "string" && Number.isFinite(offset)
          ? { leftMarkId: markId, rightMarkId: markId, ratio: 0, offsetMs: offset }
          : null;
      },
      prev_point: (name) => {
        const candidates = relationItems(name);
        const candidate = candidates[candidates.length - 1];
        const anchor = candidate ? utterance.temporalAnchor(candidate) : undefined;
        if (anchor) transaction.dependOn(anchor.decisionId);
        return view(candidate);
      },
      look_back_where: (source, maxSteps, expression) =>
        scan(source, maxSteps, expression, -1),
      look_back_pred: (source, maxSteps, predicateName) =>
        typeof predicateName === "string"
          ? scan(source, maxSteps, { predicate: predicateName }, -1)
          : null,
      look_ahead_pred: (source, maxSteps, predicateName) =>
        typeof predicateName === "string"
          ? scan(source, maxSteps, { predicate: predicateName }, 1)
          : null,
      find_within_word: findWithinWord,
      path: navigatePath,
      span_ms: spanMs,
      trajectory_control_windows: trajectoryControlWindows,
      word_count: () => relationItems("Word").length,
      phone_count: () => relationItems("Segment").filter((item) => {
        const phoneme = transaction.read(item, "phoneme");
        return phoneme !== "SIL";
      }).length,
      clause_phone_count: () => {
        let left = index;
        let right = index;
        while (left > 0 && transaction.read(items[left - 1], "phoneme") !== "SIL") left -= 1;
        while (right + 1 < items.length && transaction.read(items[right + 1], "phoneme") !== "SIL") right += 1;
        let count = 0;
        for (let itemIndex = left; itemIndex <= right; itemIndex += 1) {
          if (transaction.read(items[itemIndex], "phoneme") !== "SIL") count += 1;
        }
        return count;
      },
      count_word_vowels: () => {
        const source = items[index];
        return source ? wordSegments(source).filter((item) => transaction.read(item, "type") === "vowel").length : 0;
      },
      cluster_position_in_word: () => {
        const source = items[index];
        if (!source) return 0;
        const segments = wordSegments(source);
        const sourceIndex = segments.indexOf(source);
        if (sourceIndex < 0 || transaction.read(source, "type") === "vowel") return 0;
        let position = 0;
        for (let itemIndex = sourceIndex - 1; itemIndex >= 0; itemIndex -= 1) {
          if (transaction.read(segments[itemIndex], "type") === "vowel") break;
          position += 1;
        }
        return position;
      },
      syllable_index: () => {
        const source = items[index];
        const syllable = source ? structureAncestor(source, "syllable") : undefined;
        const word = source ? structureAncestor(source, "word") : undefined;
        if (!syllable || !word) return null;
        return structureChildren(word)
          .filter((item) => item.type.toLowerCase() === "syllable")
          .indexOf(syllable);
      },
      syllable_role: () => {
        const source = items[index];
        const syllable = source ? structureAncestor(source, "syllable") : undefined;
        if (!source || !syllable) return null;
        const segments = structureChildren(syllable)
          .filter((item) => item.type.toLowerCase() === "segment");
        const sourceIndex = segments.indexOf(source);
        const nucleusIndex = segments.findIndex((item) => transaction.read(item, "type") === "vowel");
        if (sourceIndex < 0 || nucleusIndex < 0) return null;
        return sourceIndex < nucleusIndex ? "onset" : sourceIndex === nucleusIndex ? "nucleus" : "coda";
      },
      syllable_position_in_word: () => {
        const source = items[index];
        const syllable = source ? structureAncestor(source, "syllable") : undefined;
        const word = source ? structureAncestor(source, "word") : undefined;
        if (!syllable || !word) return null;
        const syllables = structureChildren(word)
          .filter((item) => item.type.toLowerCase() === "syllable");
        const syllableIndex = syllables.indexOf(syllable);
        if (syllableIndex < 0) return null;
        if (syllables.length === 1) return "only";
        if (syllableIndex === 0) return "initial";
        if (syllableIndex === syllables.length - 1) return "final";
        return "medial";
      },
    },
  };
}

function evaluate(
  expression: unknown,
  context: EvaluationContext,
): unknown {
  if (typeof expression !== "string") return expression;
  return normalizeCelValue(
    context.owner.evaluate(expression, context.values, context.functions),
    context.isItemView,
  );
}

function normalizeCelValue(value: unknown, isItemView: (value: unknown) => boolean): unknown {
  if (isItemView(value)) return value;
  if (typeof value === "bigint") {
    const number = Number(value);
    if (!Number.isSafeInteger(number)) {
      throw new Error(`E_HRG_CEL_INTEGER_RANGE: ${value.toString()} is outside the safe integer range`);
    }
    return number;
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()].map(([key, nested]) => [String(key), normalizeCelValue(nested, isItemView)]),
    );
  }
  if (Array.isArray(value)) return value.map((entry) => normalizeCelValue(entry, isItemView));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, normalizeCelValue(nested, isItemView)]),
  );
}

function evaluateStructured(
  value: unknown,
  context: EvaluationContext,
): unknown {
  if (typeof value === "string") return evaluate(value, context);
  if (Array.isArray(value)) return value.map((entry) => evaluateStructured(entry, context));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, evaluateStructured(entry, context)]),
  );
}

function evaluateCondition(
  condition: unknown,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): ConditionEvidence {
  if (condition == null || condition === "") {
    return Object.freeze({ kind: "constant", value: condition, matched: true });
  }
  if (typeof condition === "string") {
    const value = evaluate(condition, context);
    return Object.freeze({ kind: "expression", expression: condition, value, matched: Boolean(value) });
  }
  if (!isPlainObject(condition)) {
    return Object.freeze({ kind: "constant", value: condition, matched: Boolean(condition) });
  }
  if (typeof condition.predicate === "string") {
    const evidence = evaluateCondition(predicates[condition.predicate], context, predicates);
    return Object.freeze({
      kind: "predicate",
      predicate: condition.predicate,
      matched: evidence.matched,
      evidence,
    });
  }
  if (typeof condition.expr === "string") {
    const value = evaluate(condition.expr, context);
    return Object.freeze({
      kind: "expression",
      expression: condition.expr,
      value,
      matched: Boolean(value),
    });
  }
  if (Array.isArray(condition.all)) {
    const evaluated: ConditionEvidence[] = [];
    for (const entry of condition.all) {
      const evidence = evaluateCondition(entry, context, predicates);
      evaluated.push(evidence);
      if (!evidence.matched) {
        return Object.freeze({
          kind: "all",
          matched: false,
          evaluated: Object.freeze(evaluated),
          total: condition.all.length,
        });
      }
    }
    return Object.freeze({
      kind: "all",
      matched: true,
      evaluated: Object.freeze(evaluated),
      total: condition.all.length,
    });
  }
  if (Array.isArray(condition.any)) {
    const evaluated: ConditionEvidence[] = [];
    for (const entry of condition.any) {
      const evidence = evaluateCondition(entry, context, predicates);
      evaluated.push(evidence);
      if (evidence.matched) {
        return Object.freeze({
          kind: "any",
          matched: true,
          evaluated: Object.freeze(evaluated),
          total: condition.any.length,
        });
      }
    }
    return Object.freeze({
      kind: "any",
      matched: false,
      evaluated: Object.freeze(evaluated),
      total: condition.any.length,
    });
  }
  if (condition.not != null) {
    const evidence = evaluateCondition(condition.not, context, predicates);
    return Object.freeze({ kind: "not", matched: !evidence.matched, evidence });
  }
  return Object.freeze({ kind: "constant", value: condition, matched: false });
}

function conditionMatches(
  condition: unknown,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): boolean {
  return evaluateCondition(condition, context, predicates).matched;
}

function evaluateDispatch(
  value: unknown,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): unknown {
  if (!isPlainObject(value) || !Array.isArray(value.dispatch)) {
    return evaluateStructured(value, context);
  }
  for (const branch of value.dispatch) {
    if (!isPlainObject(branch)) continue;
    if (branch.when != null && conditionMatches(branch.when, context, predicates)) {
      return evaluateStructured(branch.value, context);
    }
    if (Object.prototype.hasOwnProperty.call(branch, "default")) {
      return evaluateStructured(branch.default, context);
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
  relationSpec: unknown,
  params: Readonly<Record<string, unknown>>,
): void {
  if (!Array.isArray(effects)) return;
  for (const effect of effects) {
    if (!isPlainObject(effect) || typeof effect.field !== "string") continue;
    const targetName = typeof effect.target === "string" ? effect.target : defaultTarget;
    const item = resolveTarget(targetName);
    if (!item) throw new Error(`E_EFFECT_TARGET_UNKNOWN: unknown effect target '${targetName}'`);
    const incomingSource = Array.isArray(effect.dispatch)
      ? { dispatch: effect.dispatch }
      : effect.value;
    const incoming = evaluateDispatch(incomingSource, context, predicates);
    const root = effect.field.split(".")[0];
    const current = transaction.read(item, root);
    const scalarConfigs = isPlainObject(relationSpec) && isPlainObject(relationSpec.scalars)
      ? relationSpec.scalars
      : {};
    const scalarConfig = !effect.field.includes(".") && isPlainObject(scalarConfigs[root])
      ? scalarConfigs[root]
      : null;
    const resolution = scalarConfig && typeof scalarConfig.resolution === "string"
      ? scalarConfig.resolution.toLowerCase()
      : scalarConfig ? "standard" : null;
    const round = root === "duration" || scalarConfig?.unit === "ms";
    const roundValue = (value: number): number => round ? Math.round(value) : value;
    let floor = Number.NEGATIVE_INFINITY;
    if (resolution === "klatt" && scalarConfig) {
      if (typeof scalarConfig.floor === "number" && Number.isFinite(scalarConfig.floor)) {
        floor = scalarConfig.floor;
      } else if (typeof scalarConfig.floor_field === "string") {
        const declaredFloor = transaction.read(item, scalarConfig.floor_field);
        if (typeof declaredFloor === "number" && Number.isFinite(declaredFloor)) floor = declaredFloor;
      }
      if (!Number.isFinite(floor) && root === "duration") {
        const inherent = transaction.read(item, "inherentDuration");
        const type = transaction.read(item, "type");
        const policy = isPlainObject(params.policy) && isPlainObject(params.policy.duration)
          ? params.policy.duration
          : null;
        const ratioKey = type === "vowel"
          ? "incompressibility_ratio_vowel"
          : "incompressibility_ratio_consonant";
        const ratio = policy?.[ratioKey];
        if (
          typeof inherent !== "number"
          || !Number.isFinite(inherent)
          || typeof ratio !== "number"
          || !Number.isFinite(ratio)
        ) {
          throw new Error(`E_DURATION_POLICY_REQUIRED: params.policy.duration.${ratioKey} and inherentDuration are required for Klatt duration resolution`);
        }
        floor = inherent * ratio;
      }
      if (!Number.isFinite(floor)) {
        floor = typeof scalarConfig.min === "number" && Number.isFinite(scalarConfig.min)
          ? scalarConfig.min
          : 0;
      }
    }
    let resolved: unknown = incoming;
    switch (effect.op) {
      case "add":
        resolved = roundValue(applyScalarOp("add", Number(current ?? 0), Number(incoming)));
        break;
      case "mul":
        resolved = resolution === "klatt"
          ? roundValue(Number(incoming) * (Number(current ?? 0) - floor) + floor)
          : roundValue(applyScalarOp("mul", Number(current ?? 0), Number(incoming)));
        break;
      case "max":
        resolved = applyScalarOp("max", Number(current), Number(incoming));
        break;
      case "min":
        resolved = applyScalarOp("min", Number(current), Number(incoming));
        break;
      case "unset":
        resolved = null;
        break;
      default:
        if (typeof resolved === "number") resolved = roundValue(resolved);
        break;
    }
    if (typeof resolved === "number" && scalarConfig) {
      let numericResolved = resolution === "klatt" && resolved < floor ? floor : resolved;
      const minimum = scalarConfig.min;
      const maximum = scalarConfig.max;
      if (typeof minimum === "number" && Number.isFinite(minimum)) {
        numericResolved = Math.max(numericResolved, minimum);
      }
      if (typeof maximum === "number" && Number.isFinite(maximum)) {
        numericResolved = Math.min(numericResolved, maximum);
      }
      resolved = roundValue(numericResolved);
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
  phaseName: string;
  ruleName: string;
  transaction: HrgTransaction;
  items: readonly Item[];
  index: number;
  bindings: Readonly<Record<string, Item>>;
  nodes: Readonly<Record<string, HrgNode>>;
  defaultTarget: string;
  relationName: string;
  contour?: Readonly<Record<string, unknown>>;
  attemptItemIds: readonly string[];
}

function attachContourContexts(
  matches: Match[],
  rule: Readonly<Record<string, unknown>>,
): void {
  if (!isPlainObject(rule.contour) || rule.contour.domain !== "phrase" || matches.length === 0) return;
  const resetBreakIndex = typeof rule.contour.reset_break_index === "number"
    ? rule.contour.reset_break_index
    : 4;
  const groups: Match[][] = [];
  let group: Match[] = [];
  let previousIndex = -1;
  for (const match of matches) {
    const reset = previousIndex >= 0 && match.items
      .slice(previousIndex + 1, match.index + 1)
      .some((item) => Number(item.get("breakIndex") ?? 0) >= resetBreakIndex);
    if (reset && group.length > 0) {
      groups.push(group);
      group = [];
    }
    group.push(match);
    previousIndex = match.index;
  }
  if (group.length > 0) groups.push(group);

  for (const phrase of groups) {
    for (const match of phrase) {
      let phraseDurationMs = 0;
      let elapsedMs = 0;
      for (const member of phrase) {
        const item = member.items[member.index];
        const duration = match.transaction.read(item, "duration");
        if (typeof duration !== "number" || !Number.isFinite(duration)) {
          throw new Error(`E_CONTOUR_DURATION_REQUIRED: Item '${item.id}' has no finite duration`);
        }
        if (member === match) elapsedMs += duration / 2;
        else if (member.index < match.index) elapsedMs += duration;
        phraseDurationMs += duration;
      }
      for (const item of match.items) {
        if (item.has("breakIndex")) match.transaction.read(item, "breakIndex");
      }
      match.contour = Object.freeze({
        elapsed_sec: elapsedMs / 1000,
        phrase_duration_sec: phraseDurationMs / 1000,
        progress: phraseDurationMs > 0 ? elapsedMs / phraseDurationMs : 0,
      });
    }
  }
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
    name === "current"
      ? match.items[match.index]
      : name === "next"
        ? match.items[match.index + 1]
        : name === "prev"
          ? match.items[match.index - 1]
          : match.bindings[name];
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
    if (copySource) {
      const copyFields = Array.isArray(template.copy_fields)
        && Object.prototype.hasOwnProperty.call(template, "target")
        ? stringArray(template.copy_fields)
        : copySource.featureKeys();
      for (const field of copyFields) {
        const value = transaction.read(copySource, field);
        if (value !== undefined) transaction.set(item, field, value);
      }
    }
    const targetExpression = Object.prototype.hasOwnProperty.call(template, "target")
      ? template.target
      : null;
    const target = targetExpression !== null ? evaluate(targetExpression, context) : null;
    if (targetExpression !== null && !isPlainObject(target)) {
      throw new Error(
        `E_HRG_SPLICE_TARGET: rule '${transaction.metadata.ruleId}' target must evaluate to an object`,
      );
    }
    if (isPlainObject(target)) {
      for (const [field, value] of Object.entries(target)) {
        if (field === "params") continue;
        transaction.set(item, field, value);
      }
    }
    const templateFields = segment && isPlainObject(segment.fields)
      ? { ...segment.fields, ...(Object.prototype.hasOwnProperty.call(segment, "phoneme")
        ? { phoneme: segment.phoneme }
        : {}) }
      : template;
    for (const [field, expression] of Object.entries(templateFields)) {
      if (field === "copy_from" || field === "copy_fields" || field === "target" || field === "fields") continue;
      const value = evaluateStructured(expression, context);
      if (value !== undefined) transaction.set(item, field, value);
    }
    transaction.insertAfter(match.relationName, previous, item);
    const structure = utterance.getRelation("SylStructure");
    const structuralParent = structure?.node(source)?.parent?.item;
    if (structuralParent) transaction.addDaughter("SylStructure", structuralParent, item);
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

function applyPointActions(
  utterance: Utterance,
  match: Match,
  rule: Readonly<Record<string, unknown>>,
  context: EvaluationContext,
  predicates: Readonly<Record<string, unknown>>,
): void {
  const actions = [
    ...(isPlainObject(rule.insert_point)
      ? [{ spec: rule.insert_point, relationName: rule.insert_point.relation, f0Layer: false }]
      : []),
    ...(Array.isArray(rule.insert_points)
      ? rule.insert_points
        .filter(isPlainObject)
        .map((spec) => ({ spec, relationName: spec.relation, f0Layer: false }))
      : []),
    ...(isPlainObject(rule.insert_f0_layer)
      ? [{ spec: rule.insert_f0_layer, relationName: rule.insert_f0_layer.relation, f0Layer: true }]
      : []),
  ];
  for (let index = 0; index < actions.length; index += 1) {
    const { spec, relationName, f0Layer } = actions[index];
    if (typeof relationName !== "string" || relationName.length === 0) {
      if (f0Layer) throw new Error("E_HRG_F0_CONTROL_RELATION: f0_layer insert requires a relation");
      continue;
    }
    if (spec.when != null && !conditionMatches(spec.when, context, predicates)) continue;
    const relation = utterance.relation(relationName);
    const itemTypes = relation.itemTypes();
    if (itemTypes.length !== 1) {
      throw new Error(`E_HRG_POINT_ITEM_TYPE: relation '${relationName}' must declare exactly one Item type`);
    }
    const anchorValue = evaluate(spec.at, context);
    if (
      !isPlainObject(anchorValue)
      || typeof anchorValue.leftMarkId !== "string"
      || typeof anchorValue.rightMarkId !== "string"
      || typeof anchorValue.ratio !== "number"
      || (anchorValue.offsetMs != null && typeof anchorValue.offsetMs !== "number")
    ) {
      throw new Error("E_HRG_POINT_ANCHOR: point action requires a valid temporal anchor");
    }
    const source = match.items[match.index];
    const point = match.transaction.createItem(
      itemTypes[0],
      `${source.id}:${match.transaction.metadata.ruleId}:point:${index.toString()}`,
    );
    match.transaction.set(point, "value", evaluateDispatch(spec.value, context, predicates));
    if (typeof spec.tag === "string") match.transaction.set(point, "tag", spec.tag);
    if (f0Layer) {
      if (typeof spec.layer === "string") match.transaction.set(point, "layer", spec.layer);
      if (Object.prototype.hasOwnProperty.call(spec, "duration_frames")) {
        match.transaction.set(point, "duration_frames", evaluate(spec.duration_frames, context));
      }
      if (Array.isArray(spec.profile_points)) {
        match.transaction.set(point, "profile_points", spec.profile_points);
      }
    }
    match.transaction.append(relationName, point);
    match.transaction.anchorPoint(
      point,
      anchorValue.leftMarkId,
      anchorValue.rightMarkId,
      anchorValue.ratio,
      typeof anchorValue.offsetMs === "number" ? anchorValue.offsetMs : undefined,
    );
  }
}

function executeMatch(
  utterance: Utterance,
  owner: GraphRuleEvaluationOwner,
  rule: Readonly<Record<string, unknown>>,
  relationSpec: unknown,
  match: Match,
  params: Readonly<Record<string, unknown>>,
  predicates: Readonly<Record<string, unknown>>,
  captureTooling: boolean,
  inventory?: GraphInventoryResource,
): void {
  const resolveTarget = (name: string): Item | undefined =>
    name === "current" ? match.items[match.index] : match.bindings[name];
  const contextBase = {
    utterance,
    transaction: match.transaction,
    owner,
    items: match.items,
    index: match.index,
    params,
    bindings: match.bindings,
    relationName: match.relationName,
    predicates,
    inventory,
  };
  const contourExtra = match.contour ? { contour: match.contour } : {};
  let context = buildEvaluationContext({ ...contextBase, extra: contourExtra });
  context = evaluateRuleDefinitions(rule, context, (definitions) => buildEvaluationContext({
    ...contextBase,
    extra: { ...contourExtra, ...definitions },
  }));
  const constraintEvidence = evaluateCondition(rule.constraint, context, predicates);
  if (!constraintEvidence.matched) {
    if (captureTooling) utterance._recordRuleAttempt({
      status: "constraint_failed",
      phase: match.phaseName,
      rule: match.ruleName,
      itemIds: match.attemptItemIds,
      journalLength: utterance.journal().length,
      source: "rule",
      evidence: constraintEvidence,
    });
    return;
  }
  try {
    applyEffects(
      match.transaction,
      resolveTarget,
      match.defaultTarget,
      rule.apply,
      context,
      predicates,
      relationSpec,
      params,
    );
    if (isPlainObject(rule.contour)) {
      applyEffects(
        match.transaction,
        resolveTarget,
        match.defaultTarget,
        rule.contour.apply,
        context,
        predicates,
        relationSpec,
        params,
      );
    }
    applyAssociations(match.transaction, rule.associate, true, resolveTarget);
    applyAssociations(match.transaction, rule.disassociate, false, resolveTarget);
    applySplice(utterance, match, rule.splice, context);
    applyPointActions(utterance, match, rule, context, predicates);
    if (rule.suppress === true || rule.delete === true) {
      for (const item of new Set(Object.values(match.bindings))) {
        match.transaction.set(item, "active", false);
      }
    }
    const transaction = match.transaction.commit();
    if (captureTooling) utterance._recordRuleAttempt({
      status: "fired",
      phase: match.phaseName,
      rule: match.ruleName,
      itemIds: match.attemptItemIds,
      journalLength: utterance.journal().length,
      transactionId: transaction.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const missingTarget = /unknown effect target '([^']+)'/.exec(message)?.[1];
    if (captureTooling) utterance._recordRuleAttempt(missingTarget
      ? {
          status: "missing_target",
          phase: match.phaseName,
          rule: match.ruleName,
          itemIds: match.attemptItemIds,
          journalLength: utterance.journal().length,
          target: missingTarget,
        }
      : {
          status: "transaction_rejected",
          phase: match.phaseName,
          rule: match.ruleName,
          itemIds: match.attemptItemIds,
          journalLength: utterance.journal().length,
          message,
        });
    throw error;
  }
}

function evaluateRuleDefinitions(
  rule: Readonly<Record<string, unknown>>,
  initialContext: EvaluationContext,
  rebuild: (definitions: Readonly<Record<string, unknown>>) => EvaluationContext,
): EvaluationContext {
  if (!isPlainObject(rule.define)) return initialContext;
  const definitions: Record<string, unknown> = {};
  let context = initialContext;
  for (const [name, expression] of Object.entries(rule.define)) {
    definitions[name] = evaluate(expression, context);
    context = rebuild(definitions);
  }
  return context;
}

function selectMatches(
  utterance: Utterance,
  owner: GraphRuleEvaluationOwner,
  phaseName: string,
  ruleName: string,
  rule: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>,
  predicates: Readonly<Record<string, unknown>>,
  captureTooling: boolean,
  inventory?: GraphInventoryResource,
): Match[] {
  if (!isPlainObject(rule.select) || typeof rule.select.relation !== "string") return [];
  const items = activeItems(utterance.relation(rule.select.relation).listItems());
  const relation = utterance.relation(rule.select.relation);
  const matches: Match[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const transaction = beginRuleTransaction(utterance, phaseName, ruleName, rule);
    const context = buildEvaluationContext({
      utterance,
      transaction,
      owner,
      items,
      index,
      params,
      relationName: rule.select.relation,
      predicates,
      inventory,
    });
    const evidence = evaluateCondition(rule.select.where, context, predicates);
    if (!evidence.matched) {
      if (captureTooling) utterance._recordRuleAttempt({
        status: "select_where_failed",
        phase: phaseName,
        rule: ruleName,
        itemIds: Object.freeze([items[index].id]),
        journalLength: utterance.journal().length,
        evidence,
      });
      continue;
    }
    const node = relation.node(items[index]);
    if (!node) throw new Error("E_HRG_MATCH_NODE: selected Item has no relation node");
    matches.push({
      phaseName,
      ruleName,
      transaction,
      items,
      index,
      bindings: Object.freeze({ current: items[index] }),
      nodes: Object.freeze({ current: node }),
      defaultTarget: "current",
      relationName: rule.select.relation,
      attemptItemIds: Object.freeze([items[index].id]),
    });
  }
  return matches;
}

function patternMatches(
  utterance: Utterance,
  owner: GraphRuleEvaluationOwner,
  phaseName: string,
  ruleName: string,
  rule: Readonly<Record<string, unknown>>,
  patterns: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>,
  predicates: Readonly<Record<string, unknown>>,
  captureTooling: boolean,
  inventory?: GraphInventoryResource,
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
    const attemptItemIds = Object.freeze(
      items.slice(start, start + pattern.sequence.length).map((item) => item.id),
    );
    const transaction = beginRuleTransaction(utterance, phaseName, ruleName, rule);
    const bindings: Record<string, Item> = {};
    const nodes: Record<string, HrgNode> = {};
    const contextBase = {
      utterance,
      transaction,
      owner,
      items,
      params,
      bindings,
      relationName: pattern.relation,
      predicates,
      inventory,
    };
    let matched = true;
    for (let offset = 0; offset < pattern.sequence.length; offset += 1) {
      const step = pattern.sequence[offset];
      const index = start + offset;
      const item = items[index];
      if (!item || !isPlainObject(step) || typeof step.capture !== "string") {
        const evidence: ConditionEvidence = Object.freeze({
          kind: "constant",
          value: item ? step : null,
          matched: false,
        });
        if (captureTooling) utterance._recordRuleAttempt({
          status: "pattern_step_failed",
          phase: phaseName,
          rule: ruleName,
          itemIds: attemptItemIds,
          journalLength: utterance.journal().length,
          pattern: rule.match,
          stepIndex: offset,
          capture: isPlainObject(step) && typeof step.capture === "string" ? step.capture : null,
          evidence,
        });
        matched = false;
        break;
      }
      const context = buildEvaluationContext({ ...contextBase, index });
      const evidence = evaluateCondition(step.where, context, predicates);
      if (!evidence.matched) {
        if (captureTooling) utterance._recordRuleAttempt({
          status: "pattern_step_failed",
          phase: phaseName,
          rule: ruleName,
          itemIds: attemptItemIds,
          journalLength: utterance.journal().length,
          pattern: rule.match,
          stepIndex: offset,
          capture: step.capture,
          evidence,
        });
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
    const context = buildEvaluationContext({ ...contextBase, index });
    const constraintEvidence = evaluateCondition(pattern.constraint, context, predicates);
    if (!constraintEvidence.matched) {
      if (captureTooling) utterance._recordRuleAttempt({
        status: "constraint_failed",
        phase: phaseName,
        rule: ruleName,
        itemIds: attemptItemIds,
        journalLength: utterance.journal().length,
        source: "pattern",
        evidence: constraintEvidence,
      });
      continue;
    }
    matches.push({
      phaseName,
      ruleName,
      transaction,
      items,
      index,
      bindings: Object.freeze({ ...bindings }),
      nodes: Object.freeze({ ...nodes }),
      defaultTarget,
      relationName: pattern.relation,
      attemptItemIds,
    });
  }
  return matches;
}

function isStructuralRule(rule: Readonly<Record<string, unknown>>): boolean {
  return isPlainObject(rule.splice)
    || isPlainObject(rule.insert_point)
    || (Array.isArray(rule.insert_points) && rule.insert_points.length > 0)
    || isPlainObject(rule.insert_f0_layer)
    || rule.suppress === true
    || rule.delete === true
    || (Array.isArray(rule.associate) && rule.associate.length > 0)
    || (Array.isArray(rule.disassociate) && rule.disassociate.length > 0);
}

function finalizePhase(
  utterance: Utterance,
  spec: CompiledRulepack,
  phase: CompiledRulepack["phases"][number],
  captureTooling: boolean,
): void {
  if (phase.compute_times) {
    const baseRelations = Object.entries(spec.relations)
      .filter((entry) => isPlainObject(entry[1]) && entry[1].type === "base")
      .map(([name]) => name);
    if (baseRelations.length !== 1) {
      throw new Error("E_TIME_BASE_RELATION: compute_times requires exactly one base relation");
    }
    const items = activeItems(utterance.relation(baseRelations[0]).listItems());
    const transaction = utterance.beginTransaction({
      ruleId: `${phase.name}:compute_times`,
      phase: phase.name,
      tag: "timing",
      reason: `resolve temporal marks after ${phase.name}`,
      citations: ["Taylor, Black & Caley 2001"],
    });
    const markTimes = new Map<string, number>();
    let elapsedMs = 0;
    let previousRight: string | null = null;
    for (const item of items) {
      const anchor = utterance.intervalAnchor(item);
      if (!anchor) throw new Error(`E_TIME_ANCHOR_REQUIRED: Item '${item.id}' has no interval anchor`);
      transaction.dependOn(anchor.decisionId);
      if (previousRight && utterance.axis.compare(previousRight, anchor.leftMarkId) !== 0) {
        throw new Error("E_BASE_OVERLAP: active base intervals are not contiguous");
      }
      const duration = transaction.read(item, "duration");
      if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
        throw new Error(`E_TIME_DURATION_REQUIRED: Item '${item.id}' has no finite non-negative duration`);
      }
      const existingLeft = markTimes.get(anchor.leftMarkId);
      if (existingLeft != null && existingLeft !== elapsedMs) throw new Error("E_BASE_OVERLAP");
      markTimes.set(anchor.leftMarkId, elapsedMs);
      elapsedMs += duration;
      const existingRight = markTimes.get(anchor.rightMarkId);
      if (existingRight != null && existingRight !== elapsedMs) throw new Error("E_BASE_OVERLAP");
      markTimes.set(anchor.rightMarkId, elapsedMs);
      previousRight = anchor.rightMarkId;
    }
    for (const [markId, timeMs] of markTimes) transaction.resolveMarkTime(markId, timeMs);
    transaction.commit();
  }

  for (const relationName of phase.resolve_points) {
    for (const item of activeItems(utterance.relation(relationName).listItems())) {
      if (utterance.resolveAnchorTime(item) == null) {
        throw new Error(`E_TIME_NO_BASE_SUPPORT: point Item '${item.id}' cannot be resolved`);
      }
    }
  }
  if (captureTooling) utterance.checkpoint(phase.name, "after");
}

export function runGraphRuleEngine(
  utterance: Utterance,
  spec: CompiledRulepack,
  options: GraphRuleEngineOptions = {},
): GraphRuleEngineResult {
  const startJournalLength = utterance.journal().length;
  const selectedPhases = options.phases ? new Set(options.phases) : null;
  const specParameters = projectPolicyValues(spec.parameters);
  const optionParameters = projectPolicyValues(options.parameters ?? {});
  if (!isPlainObject(specParameters) || !isPlainObject(optionParameters)) {
    throw new Error("E_HRG_PARAMETERS: compiled and runtime parameters must be objects");
  }
  const params = Object.freeze({
    ...mergeParameterRecords(specParameters, optionParameters),
    sets: spec.string_sets,
    maps: spec.maps,
  });
  const predicates = spec.predicates;
  const evaluationOwner = options.evaluationOwner ?? new GraphRuleEvaluationOwner();
  const captureTooling = options.captureTooling ?? true;
  let timingFinalized = false;

  for (const phase of spec.phases) {
    if (selectedPhases && !selectedPhases.has(phase.name)) continue;
    if (captureTooling) utterance.checkpoint(phase.name, "before");
    for (const ruleName of phase.rules) {
      const rule = spec.rules[ruleName];
      if (!isPlainObject(rule)) continue;
      const matches = isPlainObject(rule.select)
        ? selectMatches(
            utterance,
            evaluationOwner,
            phase.name,
            ruleName,
            rule,
            params,
            predicates,
            captureTooling,
            options.inventory,
          )
        : patternMatches(
          utterance,
          evaluationOwner,
          phase.name,
          ruleName,
          rule,
          spec.patterns,
          params,
          predicates,
          captureTooling,
          options.inventory,
        );
      attachContourContexts(matches, rule);
      if (timingFinalized && matches.length > 0 && isStructuralRule(rule)) {
        throw new Error(
          `E_FINALIZE_DIRTY: structural rule '${ruleName}' executed after finalize stage`,
        );
      }
      for (const match of matches) {
        executeMatch(
          utterance,
          evaluationOwner,
          rule,
          spec.relations[match.relationName],
          match,
          params,
          predicates,
          captureTooling,
          options.inventory,
        );
      }
    }
    finalizePhase(utterance, spec, phase, captureTooling);
    if (phase.compute_times) timingFinalized = true;
  }
  return {
    transactions: utterance.journal().slice(startJournalLength),
  };
}
