import { evaluate, parse } from "cel-js";

type CompiledCelExpression = unknown;

export type ExpressionValidationOptions = {
  allowedFunctions?: Iterable<string>;
  streamNames?: Iterable<string>;
};

const expressionCache = new Map<string, CompiledCelExpression>();

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
]);

const FUNCTION_CALL_PATTERN = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const STREAM_HELPER_PATTERN = /\b(total|prev_point)\s*\(\s*(['"])([^'"]+)\2\s*\)/g;
const CURSOR_DEPTH_PATTERN = /\b(prev|next)(\d+)\b/g;

function compileExpression(expression: string): CompiledCelExpression {
  if (typeof expression !== "string") {
    throw new Error("expression must be a string");
  }

  let compiled = expressionCache.get(expression);
  if (compiled) return compiled;

  const parsed = parse(expression) as
    | { isSuccess: true; cst: unknown }
    | { isSuccess: false; errors?: string[] };
  if (!parsed || parsed.isSuccess !== true) {
    const errors = parsed && Array.isArray(parsed.errors) ? parsed.errors : [];
    throw new Error(errors.length > 0 ? errors.join("; ") : "Invalid CEL expression");
  }

  compiled = parsed.cst;
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
  const compiled = compileExpression(expression);
  const registry: Record<string, (...args: unknown[]) => unknown> = {};
  if (functions && typeof functions === "object") {
    for (const [name, fn] of Object.entries(functions)) {
      if (typeof fn === "function") {
        registry[name] = fn as (...args: unknown[]) => unknown;
      }
    }
  }
  return evaluate(compiled as any, (context ?? {}) as Record<string, unknown>, registry);
}
