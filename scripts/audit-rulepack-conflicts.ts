/**
 * Audit bundled rulepacks for the two facts that decide how much conflict and
 * recursion machinery the rule engine needs:
 *
 *   1. Same-field writes: fields written by more than one rule, classified as
 *      fold (all writers use commutative ops add/mul/max/min), set-then-fold
 *      (one `set` writer, folds after it in phase order: the Klatt 1976 base
 *      times factors pattern), or multi-set (two or more `set` writers, the
 *      only genuine conflict candidates).
 *   2. Cross-item reads of computed fields: an expression on one item reading
 *      a field of another item (prev, next, ahead(), path(), ...) where that
 *      field is written by some rule. Reads are split by where the writers
 *      live: only earlier phases (a clean dependency), the same phase (rule
 *      order inside the phase is load-bearing), or only later phases (the
 *      rule reads the pre-final value).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/audit-rulepack-conflicts.ts [--verbose] [--frontend <id>]
 */

import {
  listBundledFrontendIds,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";
import { isPlainObject } from "../src/yaml-loader";

type PlainObject = Record<string, unknown>;

const FOLD_OPS = new Set(["add", "mul", "max", "min"]);
const NAV_ROOTS = new Set(["prev", "next"]);
const NAV_CALL =
  /^\s*(ahead|behind|path|look_back_where|look_back_pred|look_ahead_pred|find_within_word|prev_point|assoc|target)\s*\(/;

type Write = { rule: string; field: string; op: string; phase: number; relation: string };
type Read = {
  rule: string;
  alias: string;
  field: string;
  phase: number;
  writerPhases: number[];
  expression: string;
};

function argFlag(name: string): boolean {
  return process.argv.includes(name);
}
function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : null;
}

function conditionText(where: unknown, predicates: PlainObject): string[] {
  if (typeof where === "string") return [where];
  if (!isPlainObject(where)) return [];
  const out: string[] = [];
  if (typeof where.predicate === "string") {
    const body = predicates[where.predicate];
    if (typeof body === "string") out.push(body);
  }
  for (const key of ["expr", "cel", "all", "any", "not"]) {
    const value = where[key];
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value))
      for (const entry of value) out.push(...conditionText(entry, predicates));
    else if (isPlainObject(value)) out.push(...conditionText(value, predicates));
  }
  return out;
}

function applyEntries(rule: PlainObject): PlainObject[] {
  const entries: PlainObject[] = [];
  const direct = rule.apply;
  if (Array.isArray(direct))
    for (const entry of direct) if (isPlainObject(entry)) entries.push(entry);
  const dispatch = rule.dispatch;
  if (Array.isArray(dispatch)) {
    for (const branch of dispatch) {
      if (!isPlainObject(branch)) continue;
      const nested = branch.apply;
      if (Array.isArray(nested))
        for (const entry of nested) if (isPlainObject(entry)) entries.push(entry);
    }
  }
  return entries;
}

function ruleExpressions(rule: PlainObject, predicates: PlainObject): string[] {
  const out: string[] = [];
  const select = isPlainObject(rule.select) ? rule.select : null;
  if (select) out.push(...conditionText(select.where, predicates));
  out.push(...conditionText(rule.constraint, predicates));
  const define = isPlainObject(rule.define) ? rule.define : {};
  for (const value of Object.values(define)) if (typeof value === "string") out.push(value);
  for (const entry of applyEntries(rule)) {
    if (typeof entry.value === "string") out.push(entry.value);
    out.push(...conditionText(entry.when, predicates));
  }
  const dispatch = rule.dispatch;
  if (Array.isArray(dispatch)) {
    for (const branch of dispatch) {
      if (isPlainObject(branch)) out.push(...conditionText(branch.when, predicates));
    }
  }
  return out;
}

/** Names bound by `define:` that denote another item (navigation results). */
function itemAliases(rule: PlainObject): Set<string> {
  const aliases = new Set(NAV_ROOTS);
  const define = isPlainObject(rule.define) ? rule.define : {};
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, expr] of Object.entries(define)) {
      if (aliases.has(name) || typeof expr !== "string") continue;
      const trimmed = expr.trim();
      const isNav =
        NAV_CALL.test(trimmed) ||
        aliases.has(trimmed) ||
        (/^\s*\w+\s*\?\s*(\w+)\s*:\s*(\w+)\s*$/.test(trimmed) &&
          trimmed
            .split(/[?:]/)
            .slice(1)
            .every((branch) => aliases.has(branch.trim())));
      if (isNav) {
        aliases.add(name);
        changed = true;
      }
    }
  }
  return aliases;
}

function crossItemReads(
  expression: string,
  aliases: Set<string>,
): Array<{ alias: string; field: string }> {
  const reads: Array<{ alias: string; field: string }> = [];
  const aliasPattern = new RegExp(`\\b(${[...aliases].join("|")})\\.([A-Za-z_][A-Za-z0-9_]*)`, "g");
  for (const match of expression.matchAll(aliasPattern))
    reads.push({ alias: match[1], field: match[2] });
  // path(x, '...').field and ahead(current, 2).field
  const callPattern =
    /\b(ahead|behind|path|look_back_where|look_back_pred|look_ahead_pred|find_within_word|prev_point|assoc|target)\([^()]*(?:\([^()]*\)[^()]*)*\)\.([A-Za-z_][A-Za-z0-9_]*)/g;
  for (const match of expression.matchAll(callPattern))
    reads.push({ alias: `${match[1]}()`, field: match[2] });
  return reads;
}

/** Rules a bundled frontend lists in some phase, keyed by rule name -> frontend ids. */
function phasedElsewhere(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const id of listBundledFrontendIds()) {
    const spec = loadBundledRulepackSpec(id) as unknown as PlainObject;
    const phases = Array.isArray(spec.phases) ? spec.phases : [];
    for (const phase of phases) {
      if (!isPlainObject(phase) || !Array.isArray(phase.rules)) continue;
      for (const name of phase.rules) {
        if (typeof name !== "string") continue;
        const list = index.get(name) ?? [];
        if (!list.includes(id)) list.push(id);
        index.set(name, list);
      }
    }
  }
  return index;
}

function auditFrontend(
  frontendId: string,
  verbose: boolean,
  phasedIn: Map<string, string[]>,
): void {
  const spec = loadBundledRulepackSpec(frontendId) as unknown as PlainObject;
  const rules = isPlainObject(spec.rules) ? spec.rules : {};
  const predicates = isPlainObject(spec.predicates) ? spec.predicates : {};
  const phases = Array.isArray(spec.phases) ? spec.phases : [];

  const phaseOf = new Map<string, number>();
  phases.forEach((phase, index) => {
    if (!isPlainObject(phase)) return;
    const names = Array.isArray(phase.rules) ? phase.rules : [];
    for (const name of names)
      if (typeof name === "string" && !phaseOf.has(name)) phaseOf.set(name, index);
  });
  const phaseName = (index: number): string => {
    const phase = phases[index];
    return isPlainObject(phase) && typeof phase.name === "string" ? phase.name : "unphased";
  };
  const unphased = Object.keys(rules).filter((name) => !phaseOf.has(name));

  const writes: Write[] = [];
  for (const [name, raw] of Object.entries(rules)) {
    if (!isPlainObject(raw)) continue;
    const select = isPlainObject(raw.select) ? raw.select : null;
    const relation = select && typeof select.relation === "string" ? select.relation : "?";
    for (const entry of applyEntries(raw)) {
      if (typeof entry.field !== "string") continue;
      writes.push({
        rule: name,
        field: entry.field,
        op: typeof entry.op === "string" ? entry.op : "set",
        phase: phaseOf.get(name) ?? Number.POSITIVE_INFINITY,
        relation,
      });
    }
  }

  const byField = new Map<string, Write[]>();
  for (const write of writes) {
    const list = byField.get(write.field) ?? [];
    list.push(write);
    byField.set(write.field, list);
  }

  const classes = { single: 0, fold: 0, setThenFold: 0, multiSet: 0 };
  const multiSet: Array<{ field: string; writers: Write[] }> = [];
  for (const [field, list] of byField) {
    const rulesForField = new Set(list.map((w) => w.rule));
    if (rulesForField.size === 1) {
      classes.single += 1;
      continue;
    }
    const setWrites = list.filter((w) => !FOLD_OPS.has(w.op));
    const foldWrites = list.filter((w) => FOLD_OPS.has(w.op));
    const setRules = new Set(setWrites.map((w) => w.rule));
    if (setRules.size === 0) {
      classes.fold += 1;
    } else if (setRules.size === 1) {
      const setPhase = Math.min(...setWrites.map((w) => w.phase));
      const foldsAfter = foldWrites.every((w) => w.phase >= setPhase);
      if (foldsAfter) classes.setThenFold += 1;
      else {
        classes.multiSet += 1;
        multiSet.push({ field, writers: list });
      }
    } else {
      classes.multiSet += 1;
      multiSet.push({ field, writers: list });
    }
  }

  const computedFields = new Map<string, number[]>();
  for (const write of writes) {
    const list = computedFields.get(write.field) ?? [];
    list.push(write.phase);
    computedFields.set(write.field, list);
  }

  const reads: Read[] = [];
  for (const [name, raw] of Object.entries(rules)) {
    if (!isPlainObject(raw)) continue;
    const aliases = itemAliases(raw);
    const phase = phaseOf.get(name) ?? Number.POSITIVE_INFINITY;
    for (const expression of ruleExpressions(raw, predicates)) {
      for (const read of crossItemReads(expression, aliases)) {
        const writerPhases = computedFields.get(read.field);
        if (!writerPhases) continue;
        reads.push({
          rule: name,
          alias: read.alias,
          field: read.field,
          phase,
          writerPhases,
          expression,
        });
      }
    }
  }
  const dedupe = new Map<string, Read>();
  for (const read of reads) dedupe.set(`${read.rule}|${read.alias}|${read.field}`, read);
  const uniqueReads = [...dedupe.values()];
  const samePhase = uniqueReads.filter((read) => read.writerPhases.some((p) => p === read.phase));
  const laterOnly = uniqueReads.filter(
    (read) =>
      !read.writerPhases.some((p) => p <= read.phase) &&
      read.writerPhases.some((p) => p > read.phase),
  );
  const earlierOnly = uniqueReads.filter((read) => read.writerPhases.every((p) => p < read.phase));

  console.log(`\n=== ${frontendId}`);
  console.log(
    `rules: ${Object.keys(rules).length}   phases: ${phases.length}   field writes: ${writes.length}   distinct fields: ${byField.size}`,
  );
  console.log(`fields with one writer:            ${classes.single}`);
  console.log(`fields folded (commutative only):  ${classes.fold}`);
  console.log(`fields set once then folded:       ${classes.setThenFold}`);
  console.log(`fields with multiple set writers:  ${classes.multiSet}`);
  if (unphased.length > 0) {
    console.log("rules defined here but listed in no phase:");
    for (const name of unphased) {
      const elsewhere = (phasedIn.get(name) ?? []).filter((id) => id !== frontendId);
      console.log(
        `  ${name}${elsewhere.length > 0 ? `  (phased in ${elsewhere.join(", ")})` : "  (phased nowhere: dead)"}`,
      );
    }
  }
  console.log(`cross-item reads of computed fields: ${uniqueReads.length}`);
  console.log(`  written only in earlier phases (clean dependency):     ${earlierOnly.length}`);
  console.log(`  written in the same phase (order-within-phase risk):   ${samePhase.length}`);
  console.log(`  written only in later phases (reads pre-final value):  ${laterOnly.length}`);

  if (multiSet.length > 0) {
    console.log("\nmulti-set fields:");
    for (const { field, writers } of multiSet) {
      const relations = new Set(writers.map((w) => w.relation));
      const note =
        relations.size > 1 ? "  (writers select different relations: disjoint items)" : "";
      console.log(`  ${field}${note}`);
      for (const w of writers) {
        const rule = rules[w.rule];
        const select = isPlainObject(rule) && isPlainObject(rule.select) ? rule.select : null;
        const where = select
          ? conditionText(select.where, predicates).join(" && ").replace(/\s+/g, " ")
          : "";
        const snippet = where.length > 70 ? `${where.slice(0, 67)}...` : where;
        console.log(`    ${w.op.padEnd(4)} ${w.rule} [${phaseName(w.phase)}] where ${snippet}`);
      }
    }
  }
  if (samePhase.length > 0 || verbose) {
    const shown = verbose ? uniqueReads : samePhase;
    console.log(verbose ? "\ncross-item computed reads:" : "\nsame-phase cross-item reads:");
    for (const read of shown) {
      const writers = [...new Set(read.writerPhases)].map(phaseName).join(",");
      console.log(
        `  ${read.rule} [${phaseName(read.phase)}] reads ${read.alias}.${read.field}  (written in ${writers})`,
      );
    }
  }
}

const verbose = argFlag("--verbose");
const only = argValue("--frontend");
const ids = only ? [only] : listBundledFrontendIds();
const phasedIn = phasedElsewhere();
for (const id of ids) auditFrontend(id, verbose, phasedIn);
