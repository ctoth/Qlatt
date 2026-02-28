/**
 * CEL where-clause pre-filtering via static analysis.
 *
 * At spec-load time, this module parses CEL where-clauses into ASTs
 * (using the cel2js parser) and extracts fast-reject discriminants
 * on `current.*` properties. At runtime, these discriminants allow
 * the engine to skip full CEL evaluation for tokens that cannot
 * possibly match the where-clause.
 *
 * This reduces wasted CEL evaluations by ~42% (from ~655 to ~380 per word).
 */

// ---------------------------------------------------------------------------
// cel2js parser – AST types inlined to avoid hard import-path coupling.
// The actual parser is loaded eagerly at module init (top-level await)
// so that it's available synchronously in extractPrefilter().
// If the parser can't be loaded (e.g. browser bundle), prefiltering
// degrades gracefully to "no prefilter" (full CEL eval).
// ---------------------------------------------------------------------------

interface CelIdent { readonly kind: "Ident"; readonly name: string }
interface CelSelect { readonly kind: "Select"; readonly operand: CelExprLike; readonly field: string; readonly testOnly: boolean }
interface CelStringLiteral { readonly kind: "StringLiteral"; readonly value: string }
interface CelCreateList { readonly kind: "CreateList"; readonly elements: readonly CelExprLike[] }
interface CelCall { readonly kind: "Call"; readonly fn: string; readonly target?: CelExprLike; readonly args: readonly CelExprLike[] }
type CelExprLike = CelIdent | CelSelect | CelStringLiteral | CelCreateList | CelCall | { readonly kind: string; [k: string]: unknown };

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PrefilterCondition {
  /** Property name on the token (e.g. 'phoneme', 'type'). */
  property: string;
  /** Operator: eq = equality, in = membership, has = existence. */
  op: "eq" | "in" | "has";
  /** Matching values. For eq: single element; for in: multiple; for has: empty. */
  values: string[];
}

export interface Prefilter {
  /**
   * ALL conditions must match (AND semantics from `&&` in the expression).
   * A token passes if every condition passes:
   *   eq:  token[property] === values[0]
   *   in:  values.includes(token[property])
   *   has: token[property] !== undefined
   */
  conditions: PrefilterCondition[];
}

// ---------------------------------------------------------------------------
// Parser loading — eager via top-level await
// ---------------------------------------------------------------------------

type ParseFn = (input: string) => CelExprLike;

let _parseFn: ParseFn | null = null;

try {
  // Dynamic import of the cel2js parser (ESM module).
  // cel2js is a sibling repo (../cel2js relative to the project root).
  // The parser is standalone (Peggy-generated) with zero runtime dependencies.
  //
  // Resolve relative to this source file's location so the path is portable
  // across machines. From src/declarative-frontend/ the sibling repo's parser
  // is at ../../../cel2js/dist/parser/index.js.
  const parserUrl = new URL("../../../cel2js/dist/parser/index.js", import.meta.url).href;
  const mod = await import(parserUrl);
  if (typeof mod?.parse === "function") {
    _parseFn = mod.parse as ParseFn;
  }
} catch {
  // Parser unavailable — prefiltering will be disabled (graceful degradation).
  _parseFn = null;
}

// ---------------------------------------------------------------------------
// AST walker — extracts discriminants from current.* property checks
// ---------------------------------------------------------------------------

function walk(node: CelExprLike, results: PrefilterCondition[]): void {
  // Pattern 1: current.phoneme == 'K_CL' (or reversed)
  // AST: Call { fn: "_==_", args: [Select(Ident("current"), field), StringLiteral] }
  if (node.kind === "Call") {
    const call = node as CelCall;

    if (call.fn === "_==_" && call.args.length === 2) {
      const [left, right] = call.args;

      // left = Select(Ident("current"), field), right = StringLiteral
      if (
        left.kind === "Select" &&
        !(left as CelSelect).testOnly &&
        (left as CelSelect).operand.kind === "Ident" &&
        ((left as CelSelect).operand as CelIdent).name === "current" &&
        right.kind === "StringLiteral"
      ) {
        results.push({
          property: (left as CelSelect).field,
          op: "eq",
          values: [(right as CelStringLiteral).value],
        });
        return;
      }

      // Reversed: 'K_CL' == current.phoneme
      if (
        right.kind === "Select" &&
        !(right as CelSelect).testOnly &&
        (right as CelSelect).operand.kind === "Ident" &&
        ((right as CelSelect).operand as CelIdent).name === "current" &&
        left.kind === "StringLiteral"
      ) {
        results.push({
          property: (right as CelSelect).field,
          op: "eq",
          values: [(left as CelStringLiteral).value],
        });
        return;
      }
    }

    // Pattern 1b: current.phoneme != 'SIL' → not useful for fast-reject
    // (we'd need a "not-eq" op, which complicates things for little benefit)
    // Skip != for now.

    // Pattern 2: current.type in ['vowel', 'nasal']
    // AST: Call { fn: "@in", args: [Select(Ident("current"), field), CreateList[StringLiteral...]] }
    if (call.fn === "@in" && call.args.length === 2) {
      const [left, right] = call.args;
      if (
        left.kind === "Select" &&
        !(left as CelSelect).testOnly &&
        (left as CelSelect).operand.kind === "Ident" &&
        ((left as CelSelect).operand as CelIdent).name === "current" &&
        right.kind === "CreateList"
      ) {
        const list = right as CelCreateList;
        if (list.elements.every((el) => el.kind === "StringLiteral")) {
          results.push({
            property: (left as CelSelect).field,
            op: "in",
            values: list.elements.map((el) => (el as CelStringLiteral).value),
          });
          return;
        }
      }
    }

    // Pattern 4: Recurse into && branches (both arms are independently useful)
    if (call.fn === "_&&_") {
      for (const arg of call.args) {
        walk(arg, results);
      }
      return;
    }

    // For || branches: we cannot use either side for fast-reject because
    // either branch could match independently. Skip.
    // For other operators (_!=_, _<_, etc.): not useful for fast-reject. Skip.
    return;
  }

  // Pattern 3: has(current.inventorySW)
  // AST: Select { testOnly: true, operand: Ident("current"), field: string }
  if (node.kind === "Select") {
    const sel = node as CelSelect;
    if (sel.testOnly && sel.operand.kind === "Ident" && (sel.operand as CelIdent).name === "current") {
      results.push({
        property: sel.field,
        op: "has",
        values: [],
      });
      return;
    }
  }

  // All other node types: no discriminant extractable
}

function extractDiscriminantsFromAst(ast: CelExprLike): PrefilterCondition[] {
  const results: PrefilterCondition[] = [];
  walk(ast, results);
  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract a prefilter from a CEL where-clause string.
 *
 * Returns a Prefilter if at least one `current.*` discriminant can be
 * extracted, or null if no fast-reject is possible (e.g. the expression
 * doesn't reference current.* in a filterable way, or the parser is
 * unavailable).
 */
export function extractPrefilter(whereClause: string): Prefilter | null {
  if (!whereClause || whereClause === "true") return null;
  if (!_parseFn) return null;

  try {
    const ast = _parseFn(whereClause);
    const conditions = extractDiscriminantsFromAst(ast);
    if (conditions.length === 0) return null;
    return { conditions };
  } catch {
    // Parse failure — fall back to no prefilter (full CEL eval).
    return null;
  }
}

/**
 * Extract a prefilter from a normalized condition spec (the where-clause
 * as it appears after `parseDslSpec` normalization).
 *
 * Handles:
 *   - string expressions (CEL)
 *   - { expr: string } objects
 *   - { all: [...] } arrays (AND semantics — merge conditions from all branches)
 *   - { predicate: string } — cannot extract (we'd need to resolve the predicate)
 *   - { any: [...] } — cannot extract (OR semantics, either branch could match)
 *   - { not: ... } — cannot extract (negation inverts the discriminant)
 */
export function extractPrefilterFromCondition(condition: unknown): Prefilter | null {
  if (condition == null || condition === true || condition === "true") return null;

  // Simple string expression
  if (typeof condition === "string") {
    return extractPrefilter(condition);
  }

  // Object form
  if (typeof condition === "object" && !Array.isArray(condition)) {
    const obj = condition as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length !== 1) return null;

    const key = keys[0];
    const value = obj[key];

    if (key === "expr" && typeof value === "string") {
      return extractPrefilter(value);
    }

    if (key === "all" && Array.isArray(value)) {
      // AND semantics: merge conditions from all branches
      const allConditions: PrefilterCondition[] = [];
      for (const branch of value) {
        const pf = extractPrefilterFromCondition(branch);
        if (pf) {
          allConditions.push(...pf.conditions);
        }
      }
      if (allConditions.length === 0) return null;
      return { conditions: allConditions };
    }

    // predicate, any, not: cannot extract fast-reject discriminants
    return null;
  }

  return null;
}

/**
 * Check whether a token passes the prefilter.
 *
 * This is the hot-path function called per-token in the engine loop.
 * It performs simple property lookups — no CEL, no Proxy, no navigation.
 */
export function passesPrefilter(token: Record<string, unknown>, prefilter: Prefilter): boolean {
  for (const cond of prefilter.conditions) {
    const val = token[cond.property];
    switch (cond.op) {
      case "eq":
        if (val !== cond.values[0]) return false;
        break;
      case "in":
        if (!cond.values.includes(val as string)) return false;
        break;
      case "has":
        if (val === undefined) return false;
        break;
    }
  }
  return true;
}
