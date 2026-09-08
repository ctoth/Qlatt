import { Environment } from "@marcbachmann/cel-js";
import { builtinCeil, builtinFloor, builtinMod, builtinRound } from "../builtin-functions";

type CompiledCelExpression = (context?: Record<string, unknown>) => unknown;

export type ExpressionValidationOptions = {
  relationNames?: Iterable<string>;
  variables?: Iterable<string>;
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
export function getCelEvalCount(): number {
  return _celEvalCount;
}
/** Number of expression-cache hits since last reset. */
export function getCelCacheHitCount(): number {
  return _celCacheHitCount;
}
/** Number of expression-cache misses since last reset. */
export function getCelCacheMissCount(): number {
  return _celCacheMissCount;
}
/** Accumulated CEL evaluation wall-clock time in ms (only when timing enabled). */
export function getCelEvalTimeMs(): number {
  return _celEvalTimeMs;
}
/** Enable/disable per-evaluation timing (adds performance.now() overhead). */
export function setCelTimingEnabled(enabled: boolean): void {
  _celTimingEnabled = enabled;
}
/** Reset all CEL profiling counters to zero. */
export function resetCelCounters(): void {
  _celEvalCount = 0;
  _celCacheHitCount = 0;
  _celCacheMissCount = 0;
  _celEvalTimeMs = 0;
}

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

/**
 * Case-folding accessor for CEL rule expressions.
 *
 * `lower(x)` returns the lower-cased string form of `x`. A string is folded
 * directly (`toLowerCase()`); any other value is coerced with `String(...)`
 * first, so `lower(current.word)` folds the stored orthography exactly the way
 * the accent policy's `word.toLowerCase()` membership check does. This makes
 * `lower(current.word) in sets.function_words` a byte-identical replacement for
 * the imperative `classifyWordProsody` lower-cased set lookup.
 */
function lowerValue(value: unknown): string {
  return (typeof value === "string" ? value : String(value)).toLowerCase();
}

/**
 * Safe optional-field accessor for CEL rule expressions (#47).
 *
 * `get(obj, field, default)` returns `obj[field]` when `obj` is a non-null
 * object holding a non-null value under `field`, and `default` otherwise. Like
 * `isTrue`, the field is passed BY NAME so an absent field never reaches the
 * cel-js member-access path that throws "No such key"; this makes the
 * `has(obj.field) ? obj.field : default` guard idiom optional. A present
 * falsy value (`0`, `false`, `""`) is returned as stored, never replaced.
 */
function getValue(obj: unknown, field: unknown, fallback: unknown): unknown {
  if (obj == null || typeof obj !== "object") return fallback;
  const key = typeof field === "string" ? field : String(field);
  if (!Object.hasOwn(obj, key)) return fallback;
  const value = (obj as Record<string, unknown>)[key];
  return value === undefined || value === null ? fallback : value;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

/** Numeric argument coercion: CEL int literals arrive as BigInt. */
function numberValue(value: unknown): number {
  const numeric = typeof value === "bigint" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isFinite(numeric)) {
    throw new Error("Expected finite numeric argument");
  }
  return numeric;
}

/** `split(s, sep)`: the list of substrings of `s` between occurrences of `sep`. */
function splitValue(value: unknown, separator: unknown): string[] {
  return stringValue(value).split(stringValue(separator));
}

/** `substring(s, start[, end])`: UTF-16 code-unit slice, end exclusive. */
function substringValue(value: unknown, start: unknown, end?: unknown): string {
  const text = stringValue(value);
  return end === undefined
    ? text.substring(numberValue(start))
    : text.substring(numberValue(start), numberValue(end));
}

/**
 * `concat(a, b, ...)`: when every argument is a list, their concatenation;
 * otherwise the concatenation of each argument's string form.
 */
function concatValue(...values: unknown[]): unknown[] | string {
  if (values.every((value) => Array.isArray(value))) return values.flat(1);
  return values.map(stringValue).join("");
}

const regexCache = new Map<string, RegExp>();

/** `matches(s, re)`: whether `s` contains a match of the regular expression `re`. */
function matchesValue(value: unknown, pattern: unknown): boolean {
  const source = stringValue(pattern);
  let regex = regexCache.get(source);
  if (!regex) {
    regex = new RegExp(source);
    regexCache.set(source, regex);
  }
  return regex.test(stringValue(value));
}

/**
 * Context-free ("pure") catalog functions: one fixed implementation is
 * registered on every environment, for each declared arity. Numeric bindings
 * come from `src/builtin-functions.ts`, the single source of truth shared with
 * the semantics evaluator; normative definitions are in
 * docs/host-contract.md section 4.
 */
const PURE_FUNCTIONS: Readonly<Record<string, (...args: unknown[]) => unknown>> = {
  isTrue: (obj, field) => isTrueValue(obj, field),
  lower: (value) => lowerValue(value),
  get: (obj, field, fallback) => getValue(obj, field, fallback),
  floor: (value) => builtinFloor(numberValue(value)),
  ceil: (value) => builtinCeil(numberValue(value)),
  round: (value) => builtinRound(numberValue(value)),
  mod: (a, b) => builtinMod(numberValue(a), numberValue(b)),
  split: (value, separator) => splitValue(value, separator),
  substring: (value, start, end) => substringValue(value, start, end),
  concat: (...values) => concatValue(...values),
  matches: (value, pattern) => matchesValue(value, pattern),
};

export const CEL_FUNCTION_CATALOG = [
  { name: "has", arities: [1], binding: "builtin" },
  { name: "isTrue", arities: [2], binding: "pure" },
  { name: "lower", arities: [1], binding: "pure" },
  { name: "get", arities: [3], binding: "pure" },
  { name: "floor", arities: [1], binding: "pure" },
  { name: "ceil", arities: [1], binding: "pure" },
  { name: "round", arities: [1], binding: "pure" },
  { name: "mod", arities: [2], binding: "pure" },
  { name: "split", arities: [2], binding: "pure" },
  { name: "substring", arities: [2, 3], binding: "pure" },
  { name: "concat", arities: [2, 3, 4], binding: "pure" },
  { name: "matches", arities: [2], binding: "pure" },
  // CEL standard receiver-style functions and comprehension macros that
  // cel-js evaluates natively (`list.map(x, expr)`, `s.startsWith(p)`, ...).
  // Listed so the function-surface validator accepts them; arities exclude
  // the receiver.
  { name: "map", arities: [2, 3], binding: "builtin" },
  { name: "filter", arities: [2], binding: "builtin" },
  { name: "all", arities: [2], binding: "builtin" },
  { name: "exists", arities: [2], binding: "builtin" },
  { name: "exists_one", arities: [2], binding: "builtin" },
  { name: "join", arities: [0, 1], binding: "builtin" },
  { name: "startsWith", arities: [1], binding: "builtin" },
  { name: "endsWith", arities: [1], binding: "builtin" },
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
  { name: "word_run_has_primary_stress", arities: [0], binding: "context" },
  { name: "word_has_metrical_stress", arities: [0], binding: "context" },
  { name: "is_first_primary_stress_in_word_run", arities: [0], binding: "context" },
  { name: "is_last_in_word_run", arities: [0], binding: "context" },
  { name: "phrase_terminal_punctuation", arities: [0], binding: "context" },
  { name: "word_count", arities: [0], binding: "context" },
  { name: "phone_count", arities: [0], binding: "context" },
  { name: "clause_phone_count", arities: [0], binding: "context" },
  { name: "syllable_index", arities: [0], binding: "context" },
  { name: "syllable_role", arities: [0], binding: "context" },
  { name: "syllable_position_in_word", arities: [0], binding: "context" },
] as const satisfies readonly CelFunctionCatalogEntry[];

const DEFAULT_ALLOWED_FUNCTIONS = new Set<string>(CEL_FUNCTION_CATALOG.map(({ name }) => name));

/** Whether `name` is a function on the rule-engine CEL surface. */
export function isCatalogFunctionName(name: string): boolean {
  return DEFAULT_ALLOWED_FUNCTIONS.has(name);
}

const FUNCTION_CALL_PATTERN = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const RELATION_HELPER_PATTERN = /\b(total|prev_point)\s*\(\s*(['"])([^'"]+)\2\s*\)/g;
const PATH_HELPER_PATTERN = /\bpath\s*\(\s*[^,]+,\s*(['"])([^'"]+)\1\s*\)/g;
const PATH_RELATION_SEGMENT_PATTERN = /(?:^|\.)R:([A-Za-z_][A-Za-z0-9_]*)/g;
const CURSOR_DEPTH_PATTERN = /\b(prev|next)(\d+)\b/g;

/**
 * Create a CEL Environment with:
 * - Mixed int/double arithmetic operators (CEL spec is strict about types)
 * - All known custom function signatures bound to one evaluation registry
 */
function createCelEnvironment(
  functions: Readonly<Record<string, unknown>> | null = null,
  unlistedVariablesAreDyn = true,
): Environment {
  const env = new Environment({
    unlistedVariablesAreDyn,
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
  // The CEL spec defines `%` only on ints; item features are doubles, so the
  // truncating remainder is extended to doubles (#47). Use `mod()` for the
  // floored modulo that clock arithmetic needs.
  env.registerOperator("double % double", (a: number, b: number) => a % b);
  env.registerOperator("double == int", (a: number, b: bigint) => a === Number(b));

  // Register all known custom function signatures against this Environment's
  // immutable evaluation owner. Bound environments are cached by the explicit
  // function-registry object; no module-global dispatch participates.
  //
  // "builtin" catalog entries (has, size, the type casts, the comprehension
  // macros, the receiver-style string functions) are provided by cel-js and
  // must NOT be re-registered; they are listed only for the validator.
  for (const { name, arities, binding } of CEL_FUNCTION_CATALOG) {
    if (binding === "builtin") continue;
    for (const arity of arities) {
      const args = Array.from({ length: arity }, () => "dyn").join(", ");
      const signature = `${name}(${args}): dyn`;
      if (binding === "pure") {
        const pure = PURE_FUNCTIONS[name];
        if (!pure) throw new Error(`CEL catalog function '${name}' has no pure implementation`);
        env.registerFunction(signature, pure);
        continue;
      }
      env.registerFunction(signature, (...args: unknown[]) => {
        const fn = functions?.[name];
        if (!isCallable(fn))
          throw new Error(`CEL function '${name}' not available in current context`);
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
 * The rest of the codebase expects plain JS numbers everywhere. Lists are
 * coerced element-wise (a comprehension over int literals yields BigInts),
 * but a list without any BigInt is returned as-is so item views and other
 * identity-bearing values keep their identity. Maps are left untouched for
 * the same reason.
 */
function coerceResult(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) {
    let coerced: unknown[] | null = null;
    for (let index = 0; index < value.length; index++) {
      const element = value[index];
      const converted = coerceResult(element);
      if (converted === element) continue;
      coerced ??= [...value];
      coerced[index] = converted;
    }
    return coerced ?? value;
  }
  return value;
}

function compileExpression(expression: string): CompiledCelExpression {
  if (typeof expression !== "string") {
    throw new Error("expression must be a string");
  }

  let compiled = expressionCache.get(expression);
  if (compiled) {
    _celCacheHitCount++;
    return compiled;
  }

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

function validateFunctionSurface(expression: string, allowedFunctions: Set<string>): string | null {
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
  for (const match of expression.matchAll(PATH_HELPER_PATTERN)) {
    const path = match[2] ?? "";
    for (const segment of path.matchAll(PATH_RELATION_SEGMENT_PATTERN)) {
      const relationName = segment[1];
      if (relationName && !relationNames.has(relationName)) {
        return `Unknown relation '${relationName}' in path()`;
      }
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
  options: ExpressionValidationOptions = {},
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

  if (options.variables) {
    try {
      const env = createCelEnvironment(null, false);
      for (const variable of options.variables) {
        env.registerVariable(variable, "dyn");
      }
      const checked = env.check(expression);
      if (!checked.valid) {
        const message =
          checked.error instanceof Error
            ? checked.error.message
            : String(checked.error ?? "CEL type check failed");
        if (message.includes("Unknown variable")) throw new Error(message);
      }
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  return null;
}

export function evaluateExpression(
  expression: string,
  context: unknown,
  functions: Record<string, unknown> | null = null,
): unknown {
  _celEvalCount++;
  const syntaxCompiled = compileExpression(expression);
  const compiled =
    functions && typeof functions === "object"
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
