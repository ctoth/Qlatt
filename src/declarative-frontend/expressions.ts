import jsonata from "jsonata";

type JsonataExpression = ReturnType<typeof jsonata>;

const expressionCache = new Map<string, JsonataExpression>();

export function compileExpression(expression: string): JsonataExpression {
  if (typeof expression !== "string") {
    throw new Error("expression must be a string");
  }

  let compiled = expressionCache.get(expression);
  if (compiled) return compiled;
  compiled = jsonata(expression);
  expressionCache.set(expression, compiled);
  return compiled;
}

export function validateExpressionSyntax(expression: string): string | null {
  try {
    compileExpression(expression);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function evaluateExpression(
  expression: string,
  context: unknown,
  functions: Record<string, unknown> | null = null
): unknown {
  const compiled = compileExpression(expression);
  if (functions && typeof functions === "object") {
    for (const [name, fn] of Object.entries(functions)) {
      if (typeof fn === "function") {
        compiled.registerFunction(
          name,
          fn as unknown as (this: unknown, ...args: unknown[]) => unknown
        );
      }
    }
  }
  const value = compiled.evaluate(context);

  // Keep slice runtime synchronous and deterministic for now.
  if (
    value != null &&
    (typeof value === "object" || typeof value === "function") &&
    "then" in value &&
    typeof (value as PromiseLike<unknown>).then === "function"
  ) {
    throw new Error("Async JSONata evaluation is not supported in declarative slice runtime");
  }

  return value;
}
