import { Environment } from "@marcbachmann/cel-js";

type CompiledCelExpression = (context?: Record<string, any>) => any;

export type ExpressionValidationOptions = {
  allowedFunctions?: Iterable<string>;
  streamNames?: Iterable<string>;
};

const expressionCache = new Map<string, CompiledCelExpression>();

// --- CEL evaluation counter (for profiling) ---
let _celEvalCount = 0;
let _celCacheHitCount = 0;
let _celCacheMissCount = 0;

/** Total number of CEL evaluations since last reset. */
export function getCelEvalCount(): number { return _celEvalCount; }
/** Number of expression-cache hits since last reset. */
export function getCelCacheHitCount(): number { return _celCacheHitCount; }
/** Number of expression-cache misses since last reset. */
export function getCelCacheMissCount(): number { return _celCacheMissCount; }
/** Reset all CEL profiling counters to zero. */
export function resetCelCounters(): void { _celEvalCount = 0; _celCacheHitCount = 0; _celCacheMissCount = 0; }

const DEFAULT_ALLOWED_FUNCTIONS = new Set([
  "has",
  "size",
  "midpoint",
  "at_ratio",
  "at_sync",
  "prev_point",
  "ahead",
  "behind",
  "total",
  "target",
  "assoc",
  "double",
  "string",
  "max",
  "min",
  "contains",
  "merge",
  "look_back_where",
  "look_back_pred",
  "look_ahead_pred",
]);

const FUNCTION_CALL_PATTERN = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const STREAM_HELPER_PATTERN = /\b(total|prev_point)\s*\(\s*(['"])([^'"]+)\2\s*\)/g;
const CURSOR_DEPTH_PATTERN = /\b(prev|next)(\d+)\b/g;

/**
 * Mutable binding for current evaluation's custom functions.
 * Safe because CEL evaluation is synchronous — no concurrent calls.
 */
let _currentFunctions: Record<string, (...args: any[]) => unknown> = {};

/**
 * Create the shared CEL Environment with:
 * - Mixed int/double arithmetic operators (CEL spec is strict about types)
 * - All known custom function signatures dispatching through _currentFunctions
 */
function createCelEnvironment(): Environment {
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

  // Register all known custom function signatures.
  // These dispatch through _currentFunctions so that the actual implementation
  // can change per evaluateExpression() call (navigation functions are built
  // dynamically with closures over the token sequence).
  //
  // "double" and "string" are CEL built-in type casts and must NOT be
  // re-registered. Our codebase's double(x) => Number(x) and string(x) =>
  // String(x) are functionally identical to the CEL builtins.
  // Register all known custom function names with overloads for arities
  // 1, 2, and 3. This covers all call patterns used in YAML rule expressions.
  // "double" and "string" are CEL builtins and must NOT be re-registered.
  const knownFunctionNames = [
    "midpoint", "at_ratio", "at_sync", "prev_point",
    "ahead", "behind", "total", "target", "assoc",
    "max", "min", "contains", "merge",
    "look_back_where", "look_back_pred", "look_ahead_pred",
  ];

  const knownFunctions: Array<[string, string[]]> = knownFunctionNames.map((name) => [
    name,
    [
      `${name}(dyn): dyn`,
      `${name}(dyn, dyn): dyn`,
      `${name}(dyn, dyn, dyn): dyn`,
    ],
  ]);

  for (const [name, signatures] of knownFunctions) {
    for (const sig of signatures) {
      env.registerFunction(sig, (...args: any[]) => {
        const fn = _currentFunctions[name];
        if (!fn) throw new Error(`CEL function '${name}' not available in current context`);
        return fn(...args);
      });
    }
  }

  return env;
}

const celEnv = createCelEnvironment();

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

function validateStreamHelpers(expression: string, streamNames: Set<string>): string | null {
  for (const match of expression.matchAll(STREAM_HELPER_PATTERN)) {
    const streamName = match[3];
    if (!streamName) continue;
    if (!streamNames.has(streamName)) {
      return `Unknown stream '${streamName}' in ${match[1]}()`;
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

  const allowedFunctions = new Set(
    options.allowedFunctions ? [...options.allowedFunctions] : [...DEFAULT_ALLOWED_FUNCTIONS]
  );
  const functionError = validateFunctionSurface(expression, allowedFunctions);
  if (functionError) return functionError;

  const cursorDepthError = validateCursorDepth(expression);
  if (cursorDepthError) return cursorDepthError;

  if (options.streamNames) {
    const streamNames = new Set([...options.streamNames]);
    const streamError = validateStreamHelpers(expression, streamNames);
    if (streamError) return streamError;
  }

  return null;
}

export function evaluateExpression(
  expression: string,
  context: unknown,
  functions: Record<string, unknown> | null = null
): unknown {
  _celEvalCount++;
  const compiled = compileExpression(expression);

  // Set up the mutable function binding for this evaluation
  const registry: Record<string, (...args: unknown[]) => unknown> = {};
  if (functions && typeof functions === "object") {
    for (const [name, fn] of Object.entries(functions)) {
      if (typeof fn === "function") {
        registry[name] = fn as (...args: unknown[]) => unknown;
      }
    }
  }
  _currentFunctions = registry;

  try {
    return coerceResult(compiled((context ?? {}) as Record<string, any>));
  } finally {
    _currentFunctions = {};
  }
}
