import jsonata from "jsonata";

const expressionCache = new Map();

export function compileExpression(expression) {
  if (typeof expression !== "string") {
    throw new Error("expression must be a string");
  }

  let compiled = expressionCache.get(expression);
  if (compiled) return compiled;
  compiled = jsonata(expression);
  expressionCache.set(expression, compiled);
  return compiled;
}

export function validateExpressionSyntax(expression) {
  try {
    compileExpression(expression);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function evaluateExpression(expression, context, functions = null) {
  const compiled = compileExpression(expression);
  if (functions && typeof functions === "object") {
    for (const [name, fn] of Object.entries(functions)) {
      if (typeof fn === "function") {
        compiled.registerFunction(name, fn);
      }
    }
  }
  const value = compiled.evaluate(context);

  // Keep slice runtime synchronous and deterministic for now.
  if (value && typeof value.then === "function") {
    throw new Error("Async JSONata evaluation is not supported in declarative slice runtime");
  }

  return value;
}
