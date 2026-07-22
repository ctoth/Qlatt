import { Environment } from "@marcbachmann/cel-js";

type CompiledCelExpression = (context?: Record<string, unknown>) => unknown;

export type ExpressionValidationOptions = {
  relationNames?: Iterable<string>;
};

const expressionCache = new Map<string, CompiledCelExpression>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isCallable(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

// --- CEL evaluation counter (for profiling) ---
let _celEvalCount = 0;
let _celCacheHitCount = 0;
let _celCacheMissCount = 0;
let _celEvalTimeMs = 0;
let _celTimingEnabled = false;

/** Total number of CEL evaluations since last reset. */
export function getCelEvalCount(): number { return _celEvalCount; }
/** Number of expression-cache hits since last reset. */
export function getCelCacheHitCount(): number { return _celCacheHitCount; }
/** Number of expression-cache misses since last reset. */
export function getCelCacheMissCount(): number { return _celCacheMissCount; }
/** Accumulated CEL evaluation wall-clock time in ms (only when timing enabled). */
export function getCelEvalTimeMs(): number { return _celEvalTimeMs; }
/** Enable/disable per-evaluation timing (adds performance.now() overhead). */
export function setCelTimingEnabled(enabled: boolean): void { _celTimingEnabled = enabled; }
/** Reset all CEL profiling counters to zero. */
export function resetCelCounters(): void { _celEvalCount = 0; _celCacheHitCount = 0; _celCacheMissCount = 0; _celEvalTimeMs = 0; }

type CelFunctionCatalogEntry = {
  name: string;
  arities: readonly number[];
  // "builtin" — provided natively by cel-js (has, size); not registered here.
  // "context" — dispatched at eval time to the per-call functions registry.
  // "pure"    — a fixed, context-free implementation registered on every env.
  binding: "builtin" | "context" | "pure";
};

/**
 * Safe optional-bool accessor for CEL rule expressions.
 *
 * `isTrue(obj, field)` returns `true` iff `obj` is a non-null object whose
 * `field` property is strictly the boolean `true`. An absent field yields
 * `false`; a present-but-not-`true` value (false, 0, "", null, a non-bool)
 * yields `false`. This replaces the `has(obj.field) ? obj.field == true : false`
 * guard idiom repeated across the rule phase files.
 *
 * The field is passed BY NAME (two-arg), not dereferenced by the caller,
 * because a bare `obj.missingField` access throws "No such key" in cel-js —
 * the very reason the old idiom needed the `has()` guard. Passing the name
 * keeps the accessor throw-safe for absent fields.
 */
function isTrueValue(obj: unknown, field: unknown): boolean {
  if (obj == null || typeof obj !== "object") return false;
  const key = typeof field === "string" ? field : String(field);
  return (obj as Record<string, unknown>)[key] === true;
}

export const CEL_FUNCTION_CATALOG = [
  { name: "has", arities: [1], binding: "builtin" },
  { name: "isTrue", arities: [2], binding: "pure" },
  { name: "size", arities: [1], binding: "builtin" },
  { name: "double", arities: [1], binding: "builtin" },
  { name: "string", arities: [1], binding: "builtin" },
  { name: "midpoint", arities: [1], binding: "context" },
  { name: "at_ratio", arities: [2], binding: "context" },
  { name: "at_sync", arities: [1], binding: "context" },
  { name: "at_offset", arities: [2], binding: "context" },
  { name: "prev_point", arities: [1], binding: "context" },
  { name: "ahead", arities: [1, 2], binding: "context" },
  { name: "behind", arities: [1, 2], binding: "context" },
  { name: "total", arities: [1], binding: "context" },
  { name: "target", arities: [1], binding: "context" },
  { name: "assoc", arities: [2], binding: "context" },
  { name: "max", arities: [1, 2, 3, 4], binding: "context" },
  { name: "min", arities: [1, 2, 3, 4], binding: "context" },
  { name: "exp", arities: [1], binding: "context" },
  { name: "sqrt", arities: [1], binding: "context" },
  { name: "abs", arities: [1], binding: "context" },
  { name: "log", arities: [1], binding: "context" },
  { name: "pow", arities: [2], binding: "context" },
  { name: "contains", arities: [2], binding: "context" },
  { name: "merge", arities: [2], binding: "context" },
  { name: "look_back_where", arities: [3], binding: "context" },
  { name: "look_back_pred", arities: [3], binding: "context" },
  { name: "look_ahead_pred", arities: [3], binding: "context" },
  { name: "find_within_word", arities: [2, 3], binding: "context" },
  { name: "path", arities: [2], binding: "context" },
  { name: "span_ms", arities: [2], binding: "context" },
  { name: "trajectory_control_windows", arities: [2], binding: "context" },
  { name: "count_word_vowels", arities: [0], binding: "context" },
  { name: "cluster_position_in_word", arities: [0], binding: "context" },
  { name: "word_count", arities: [0], binding: "context" },
  { name: "phone_count", arities: [0], binding: "context" },
  { name: "clause_phone_count", arities: [0], binding: "context" },
  { name: "syllable_index", arities: [0], binding: "context" },
  { name: "syllable_role", arities: [0], binding: "context" },
  { name: "syllable_position_in_word", arities: [0], binding: "context" },
] as const satisfies readonly CelFunctionCatalogEntry[];

const DEFAULT_ALLOWED_FUNCTIONS = new Set(CEL_FUNCTION_CATALOG.map(({ name }) => name));

const FUNCTION_CALL_PATTERN = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const RELATION_HELPER_PATTERN = /\b(total|prev_point)\s*\(\s*(['"])([^'"]+)\2\s*\)/g;
const CURSOR_DEPTH_PATTERN = /\b(prev|next)(\d+)\b/g;

/**
 * Create a CEL Environment with:
 * - Mixed int/double arithmetic operators (CEL spec is strict about types)
 * - All known custom function signatures bound to one evaluation registry
 */
function createCelEnvironment(
  functions: Readonly<Record<string, unknown>> | null = null,
): Environment {
  const env = new Environment({
    unlistedVariablesAreDyn: true,
    homogeneousAggregateLiterals: false,
    enableOptionalTypes: true,
  });

  // Register mixed-type arithmetic operators.
  // @marcbachmann/cel-js follows the CEL spec strictly: int + double is not
  // allowed by default. Our context variables are JS numbers (CEL double) but
  // expressions contain integer literals (CEL int = BigInt). These overloads
  // bridge the gap, coercing results to JS number (double).
  env.registerOperator("double + int", (a: number, b: bigint) => a + Number(b));
  env.registerOperator("int + double", (a: bigint, b: number) => Number(a) + b);
  env.registerOperator("double * int", (a: number, b: bigint) => a * Number(b));
  env.registerOperator("int * double", (a: bigint, b: number) => Number(a) * b);
  env.registerOperator("double - int", (a: number, b: bigint) => a - Number(b));
  env.registerOperator("int - double", (a: bigint, b: number) => Number(a) - b);
  env.registerOperator("double / int", (a: number, b: bigint) => a / Number(b));
  env.registerOperator("int / double", (a: bigint, b: number) => Number(a) / b);
  env.registerOperator("double % int", (a: number, b: bigint) => a % Number(b));
  env.registerOperator("int % double", (a: bigint, b: number) => Number(a) % b);
  env.registerOperator("double == int", (a: number, b: bigint) => a === Number(b));

  // Register all known custom function signatures against this Environment's
  // immutable evaluation owner. Bound environments are cached by the explicit
  // function-registry object; no module-global dispatch participates.
  //
  // "double" and "string" are CEL built-in type casts and must NOT be
  // re-registered. Our codebase's double(x) => Number(x) and string(x) =>
  // String(x) are functionally identical to the CEL builtins.
  // Context-free ("pure") catalog functions: fixed implementation on every env.
  env.registerFunction("isTrue(dyn, dyn): dyn", (obj: unknown, field: unknown) =>
    isTrueValue(obj, field)
  );

  for (const { name, arities, binding } of CEL_FUNCTION_CATALOG) {
    if (binding !== "context") continue;
    for (const arity of arities) {
      const args = Array.from({ length: arity }, () => "dyn").join(", ");
      const signature = `${name}(${args}): dyn`;
      env.registerFunction(signature, (...args: unknown[]) => {
        const fn = functions?.[name];
        if (!isCallable(fn)) throw new Error(`CEL function '${name}' not available in current context`);
        return fn(...args);
      });
    }
  }

  return env;
}

const celEnv = createCelEnvironment();
const boundExpressionCaches = new WeakMap<object, Map<string, CompiledCelExpression>>();

function compileBoundExpression(
  expression: string,
  functions: Readonly<Record<string, unknown>>,
): CompiledCelExpression {
  let cache = boundExpressionCaches.get(functions);
  if (!cache) {
    cache = new Map<string, CompiledCelExpression>();
    boundExpressionCaches.set(functions, cache);
  }
  const cached = cache.get(expression);
  if (cached) return cached;
  const compiled = createCelEnvironment(functions).parse(expression);
  cache.set(expression, compiled);
  return compiled;
}

/**
 * Coerce @marcbachmann/cel-js results: BigInt (CEL int) → JS number.
 * The rest of the codebase expects plain JS numbers everywhere.
 */
function coerceResult(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  return value;
}

function compileExpression(expression: string): CompiledCelExpression {
  if (typeof expression !== "string") {
    throw new Error("expression must be a string");
  }

  let compiled = expressionCache.get(expression);
  if (compiled) { _celCacheHitCount++; return compiled; }

  try {
    compiled = celEnv.parse(expression);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(msg || "Invalid CEL expression");
  }

  _celCacheMissCount++;
  expressionCache.set(expression, compiled);
  return compiled;
}

function validateFunctionSurface(
  expression: string,
  allowedFunctions: Set<string>
): string | null {
  for (const match of expression.matchAll(FUNCTION_CALL_PATTERN)) {
    const fn = match[1];
    if (!fn || allowedFunctions.has(fn)) continue;
    return `Unknown function '${fn}'`;
  }
  return null;
}

function validateRelationHelpers(expression: string, relationNames: Set<string>): string | null {
  for (const match of expression.matchAll(RELATION_HELPER_PATTERN)) {
    const relationName = match[3];
    if (!relationName) continue;
    if (!relationNames.has(relationName)) {
      return `Unknown relation '${relationName}' in ${match[1]}()`;
    }
  }
  return null;
}

function validateCursorDepth(expression: string): string | null {
  for (const match of expression.matchAll(CURSOR_DEPTH_PATTERN)) {
    const steps = Number(match[2]);
    if (!Number.isFinite(steps) || steps <= 2) continue;
    const cursorName = `${match[1]}${steps}`;
    return `Unsupported cursor '${cursorName}'; use ahead(current, ${steps}) or behind(current, ${steps})`;
  }
  return null;
}

export function validateExpressionSyntax(
  expression: string,
  options: ExpressionValidationOptions = {}
): string | null {
  try {
    compileExpression(expression);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }

  const functionError = validateFunctionSurface(expression, DEFAULT_ALLOWED_FUNCTIONS);
  if (functionError) return functionError;

  const cursorDepthError = validateCursorDepth(expression);
  if (cursorDepthError) return cursorDepthError;

  if (options.relationNames) {
    const relationNames = new Set([...options.relationNames]);
    const relationError = validateRelationHelpers(expression, relationNames);
    if (relationError) return relationError;
  }

  return null;
}

export function evaluateExpression(
  expression: string,
  context: unknown,
  functions: Record<string, unknown> | null = null
): unknown {
  _celEvalCount++;
  const syntaxCompiled = compileExpression(expression);
  const compiled = functions && typeof functions === "object"
    ? compileBoundExpression(expression, functions)
    : syntaxCompiled;

  if (_celTimingEnabled) {
    const t0 = performance.now();
    const result = coerceResult(compiled(isRecord(context) ? context : {}));
    _celEvalTimeMs += performance.now() - t0;
    return result;
  }
  return coerceResult(compiled(isRecord(context) ? context : {}));
}
