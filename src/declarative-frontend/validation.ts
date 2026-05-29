import { validateExpressionSyntax } from "./cel-expressions";
import { cloneValue, isPlainObject } from "../yaml-loader";

type DiagnosticSeverity = "error" | "warning";
type ValidationDiagnostic = {
  code: string;
  message: string;
  path: string;
  severity: DiagnosticSeverity;
};
type PlainObject = Record<string, any>;
const ALLOWED_CUSTOM_RULE_OPS = new Set(["noop"]);

function makeDiagnostic(
  code: string,
  message: string,
  path: string,
  severity: DiagnosticSeverity = "error"
): ValidationDiagnostic {
  return { code, message, path, severity };
}

const ALLOWED_STREAM_TYPES = new Set(["base", "span", "parallel", "point"]);
const POLICY_REF_PATTERN = /\bparams\.policy((?:\.[A-Za-z_][A-Za-z0-9_]*)+)/g;
const NUMERIC_LITERAL_PATTERN = /(^|[^A-Za-z0-9_])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=$|[^A-Za-z0-9_])/g;
const CRITICAL_IDENTIFIER_PATTERN = /\b(duration|vot|f0)\b/i;
const ALLOWED_INLINE_POLICY_LITERALS = new Set(["0", "1", "-1", "0.0", "1.0", "-1.0"]);

type PolicyValidationState = {
  policyTree: PlainObject | null;
  leafPaths: Set<string>;
  uncitedLeafPaths: Set<string>;
  usedLeafPaths: Set<string>;
};

function projectPolicyValueTree(node: unknown): unknown {
  if (!isPlainObject(node)) return cloneValue(node);
  if (Object.prototype.hasOwnProperty.call(node, "value")) {
    return cloneValue(node.value);
  }
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, projectPolicyValueTree(value)])
  );
}

function analyzePolicyState(parameters: unknown): PolicyValidationState {
  const state: PolicyValidationState = {
    policyTree: null,
    leafPaths: new Set<string>(),
    uncitedLeafPaths: new Set<string>(),
    usedLeafPaths: new Set<string>(),
  };

  if (!isPlainObject(parameters) || !isPlainObject(parameters.policy)) {
    return state;
  }

  state.policyTree = projectPolicyValueTree(parameters.policy) as PlainObject;

  const visit = (node: unknown, path: string): void => {
    if (!path) return;
    if (!isPlainObject(node)) {
      state.leafPaths.add(path);
      state.uncitedLeafPaths.add(path);
      return;
    }

    const hasValue = Object.prototype.hasOwnProperty.call(node, "value");
    const hasCitations = Object.prototype.hasOwnProperty.call(node, "citations");
    if (hasValue || hasCitations) {
      state.leafPaths.add(path);
      const citations = node.citations;
      const hasValidCitation =
        Array.isArray(citations) &&
        citations.some((entry) => typeof entry === "string" && entry.trim().length > 0);
      if (!hasValidCitation) {
        state.uncitedLeafPaths.add(path);
      }
      return;
    }

    const entries = Object.entries(node);
    if (entries.length === 0) {
      state.leafPaths.add(path);
      state.uncitedLeafPaths.add(path);
      return;
    }

    for (const [key, value] of entries) {
      if (typeof key !== "string" || key.length === 0) continue;
      visit(value, `${path}.${key}`);
    }
  };

  for (const [key, value] of Object.entries(parameters.policy)) {
    if (typeof key !== "string" || key.length === 0) continue;
    visit(value, key);
  }

  return state;
}

function collectPolicyReferencePaths(expression: string): string[] {
  const matches = expression.matchAll(POLICY_REF_PATTERN);
  const references = new Set<string>();
  for (const match of matches) {
    const path = (match[1] ?? "").replace(/^\./, "");
    if (!path) continue;
    references.add(path);
  }
  return [...references];
}

function policyPathExists(policyTree: PlainObject | null, path: string): boolean {
  if (!policyTree || typeof path !== "string" || path.length === 0) return false;
  let cursor: unknown = policyTree;
  const segments = path.split(".");
  for (const segment of segments) {
    if (!isPlainObject(cursor) || !Object.prototype.hasOwnProperty.call(cursor, segment)) {
      return false;
    }
    cursor = cursor[segment];
  }
  return true;
}

function markPolicyPathUsed(policyState: PolicyValidationState, path: string): void {
  if (policyState.leafPaths.has(path)) {
    policyState.usedLeafPaths.add(path);
    return;
  }
  const prefix = `${path}.`;
  for (const leafPath of policyState.leafPaths) {
    if (leafPath.startsWith(prefix)) {
      policyState.usedLeafPaths.add(leafPath);
    }
  }
}

function containsCriticalIdentifier(expression: string): boolean {
  return CRITICAL_IDENTIFIER_PATTERN.test(expression);
}

function isAllowedInlinePolicyLiteral(token: string): boolean {
  if (ALLOWED_INLINE_POLICY_LITERALS.has(token)) return true;
  const parsed = Number(token);
  return Number.isFinite(parsed) && (parsed === 0 || parsed === 1 || parsed === -1);
}

function findDisallowedInlineLiterals(expression: string): string[] {
  const literals = new Set<string>();
  for (const match of expression.matchAll(NUMERIC_LITERAL_PATTERN)) {
    const token = match[2];
    if (!token || isAllowedInlinePolicyLiteral(token)) continue;
    literals.add(token);
  }
  return [...literals];
}

function validatePolicyReferencesAndLiterals(
  expression: string,
  path: string,
  contextLabel: string,
  diagnostics: ValidationDiagnostic[],
  policyState: PolicyValidationState | undefined,
  criticalContext = false
): void {
  if (!policyState) return;

  for (const referencePath of collectPolicyReferencePaths(expression)) {
    if (!policyPathExists(policyState.policyTree, referencePath)) {
      diagnostics.push(
        makeDiagnostic(
          "E_POLICY_PARAM_UNKNOWN",
          `${contextLabel} references unknown policy path 'params.policy.${referencePath}'`,
          path
        )
      );
      continue;
    }
    markPolicyPathUsed(policyState, referencePath);
  }

  if (!policyState.policyTree) return;
  if (!criticalContext && !containsCriticalIdentifier(expression)) return;
  const badLiterals = findDisallowedInlineLiterals(expression);
  if (badLiterals.length === 0) return;
  diagnostics.push(
    makeDiagnostic(
      "E_POLICY_LITERAL_CRITICAL",
      `${contextLabel} uses inline critical numeric literal(s): ${badLiterals.join(", ")}; use params.policy.*`,
      path
    )
  );
}

function isCriticalScalarField(field: unknown): boolean {
  if (typeof field !== "string" || field.length === 0) return false;
  const normalized = field.toLowerCase().replace(/^params\./, "");
  return normalized === "duration" || normalized === "vot" || normalized === "f0";
}

function validateStreams(spec: PlainObject, diagnostics: ValidationDiagnostic[]): Map<string, any> {
  const streamNames = Object.keys(spec.streams || {});
  const streamByName = new Map();

  for (const name of streamNames) {
    streamByName.set(name, spec.streams[name]);
  }

  for (const [name, stream] of streamByName.entries()) {
    const path = `streams.${name}`;
    if (!isPlainObject(stream)) {
      diagnostics.push(
        makeDiagnostic("E_STREAM_SCHEMA", `Stream '${name}' must be an object`, path)
      );
      continue;
    }

    if (!ALLOWED_STREAM_TYPES.has(stream.type as string)) {
      diagnostics.push(
        makeDiagnostic(
          "E_STREAM_TYPE_INVALID",
          `Stream '${name}' has invalid type '${stream.type}'`,
          `${path}.type`
        )
      );
    }

    if (stream.type === "span" && stream.spans && !streamByName.has(stream.spans)) {
      diagnostics.push(
        makeDiagnostic(
          "E_STREAM_SPANS_UNKNOWN",
          `Span stream '${name}' references unknown child stream '${stream.spans}'`,
          `${path}.spans`
        )
      );
    }
  }

  return streamByName;
}

function validateTopology(
  spec: PlainObject,
  streamByName: Map<string, any>,
  diagnostics: ValidationDiagnostic[]
): void {
  const sections = ["hierarchy", "parallel", "point"];
  for (const section of sections) {
    const values = Array.isArray(spec.topology?.[section]) ? spec.topology[section] : [];
    const seen = new Set();
    for (let i = 0; i < values.length; i += 1) {
      const stream = values[i];
      if (!streamByName.has(stream)) {
        diagnostics.push(
          makeDiagnostic(
            "E_TOPOLOGY_STREAM_UNKNOWN",
            `Topology '${section}' references unknown stream '${stream}'`,
            `topology.${section}[${i}]`
          )
        );
      }
      if (seen.has(stream)) {
        diagnostics.push(
          makeDiagnostic(
            "E_TOPOLOGY_STREAM_DUP",
            `Topology '${section}' repeats stream '${stream}'`,
            `topology.${section}[${i}]`
          )
        );
      }
      seen.add(stream);
    }
  }
}

function validatePatterns(
  spec: PlainObject,
  streamByName: Map<string, any>,
  predicates: PlainObject,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[]
): void {
  const streamNames = new Set(streamByName.keys());
  const patterns = isPlainObject(spec.patterns) ? spec.patterns : {};
  for (const [name, pattern] of Object.entries(patterns)) {
    if (!isPlainObject(pattern)) {
      diagnostics.push(
        makeDiagnostic(
          "E_PATTERN_SCHEMA",
          `Pattern '${name}' must be an object`,
          `patterns.${name}`
        )
      );
      continue;
    }

    if (!pattern.stream || !streamByName.has(pattern.stream as string)) {
      diagnostics.push(
        makeDiagnostic(
          "E_PATTERN_STREAM_UNKNOWN",
          `Pattern '${name}' references unknown stream '${pattern.stream}'`,
          `patterns.${name}.stream`
        )
      );
    }

    if (!Array.isArray(pattern.sequence) || pattern.sequence.length === 0) {
      diagnostics.push(
        makeDiagnostic(
          "E_PATTERN_SEQUENCE_EMPTY",
          `Pattern '${name}' must define a non-empty sequence`,
          `patterns.${name}.sequence`
        )
      );
      continue;
    }

    const captures = new Set();
    for (let i = 0; i < pattern.sequence.length; i += 1) {
      const step = pattern.sequence[i];
      if (!isPlainObject(step) || !step.capture) {
        diagnostics.push(
          makeDiagnostic(
            "E_PATTERN_STEP_INVALID",
            `Pattern '${name}' step ${i} is missing capture`,
            `patterns.${name}.sequence[${i}]`
          )
        );
        continue;
      }
      if (captures.has(step.capture)) {
        diagnostics.push(
          makeDiagnostic(
            "E_PATTERN_CAPTURE_DUP",
            `Pattern '${name}' uses duplicate capture '${step.capture}'`,
            `patterns.${name}.sequence[${i}].capture`
          )
        );
      }
      captures.add(step.capture);

      validateConditionSpec(
        step.where,
        streamByName,
        pattern.stream,
        streamNames,
        predicates,
        diagnostics,
        `patterns.${name}.sequence[${i}].where`,
        `Pattern '${name}' step ${i} where`,
        { expandPredicateBodies: true, policyState }
      );
    }

    if (pattern.constraint != null) {
      validateConditionSpec(
        pattern.constraint,
        streamByName,
        pattern.stream,
        streamNames,
        predicates,
        diagnostics,
        `patterns.${name}.constraint`,
        `Pattern '${name}' constraint`,
        { expandPredicateBodies: true, policyState }
      );
    }
  }
}

function collectScalarFields(spec: PlainObject): Set<string> {
  const fields = new Set<string>();
  const streams = isPlainObject(spec.streams) ? spec.streams : {};
  for (const stream of Object.values(streams)) {
    if (!isPlainObject(stream)) continue;
    const scalars = isPlainObject(stream.scalars) ? stream.scalars : {};
    for (const field of Object.keys(scalars)) {
      fields.add(field);
    }
  }
  return fields;
}

function streamHasDeclaredTypeField(streamByName: Map<string, any>, streamName: unknown): boolean {
  if (typeof streamName !== "string" || streamName.length === 0) return false;
  const stream = streamByName.get(streamName);
  if (!isPlainObject(stream)) return false;
  const features = isPlainObject(stream.features) ? stream.features : null;
  if (!features) return false;
  return Object.prototype.hasOwnProperty.call(features, "type");
}

function validateDeclaredTypeFieldUsage(
  expression: string,
  streamByName: Map<string, any>,
  streamName: unknown,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
  if (!/\.type\b/.test(expression)) return;
  if (streamHasDeclaredTypeField(streamByName, streamName)) return;
  diagnostics.push(
    makeDiagnostic(
      "E_TOKEN_FIELD_UNDECLARED",
      `${contextLabel} uses '.type' but stream '${String(
        streamName ?? ""
      )}' does not declare features.type`,
      path
    )
  );
}

type ConditionValidationOptions = {
  expandPredicateBodies?: boolean;
  expansionStack?: Set<string>;
  predicateGraph?: Map<string, Set<string>>;
  graphOwner?: string | null;
  policyState?: PolicyValidationState;
  criticalContext?: boolean;
};

function notePredicateEdge(
  graph: Map<string, Set<string>> | undefined,
  owner: string | null | undefined,
  dependency: string
): void {
  if (!graph || !owner) return;
  if (!graph.has(owner)) {
    graph.set(owner, new Set());
  }
  graph.get(owner)!.add(dependency);
}

function validateConditionSpec(
  condition: unknown,
  streamByName: Map<string, any>,
  streamName: unknown,
  streamNames: Set<string>,
  predicates: PlainObject,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
  options: ConditionValidationOptions = {}
): void {
  if (condition == null) return;

  const validateExpressionWithContext = (expression: string, expressionPath: string): void => {
    if (expression.length === 0) return;
    const syntaxError = validateExpressionSyntax(expression, { streamNames });
    if (syntaxError) {
      diagnostics.push(
        makeDiagnostic(
          "E_CEL_INVALID",
          `${contextLabel} has invalid CEL expression: ${syntaxError}`,
          expressionPath
        )
      );
      return;
    }
    if (typeof streamName === "string" && streamName.length > 0) {
      validateDeclaredTypeFieldUsage(
        expression,
        streamByName,
        streamName,
        diagnostics,
        expressionPath,
        contextLabel
      );
    }
    validatePolicyReferencesAndLiterals(
      expression,
      expressionPath,
      contextLabel,
      diagnostics,
      options.policyState,
      options.criticalContext
    );
  };

  if (typeof condition === "string") {
    validateExpressionWithContext(condition, path);
    return;
  }

  if (!isPlainObject(condition)) {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} must be a string expression or condition object`,
        path
      )
    );
    return;
  }

  const keys = Object.keys(condition);
  if (keys.length !== 1) {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} condition object must declare exactly one of expr/predicate/all/any/not`,
        path
      )
    );
    return;
  }

  const key = keys[0];
  const value = condition[key];

  if (key === "expr") {
    if (typeof value !== "string") {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_EXPRESSION_INVALID",
          `${contextLabel} expr must be a string expression`,
          `${path}.expr`
        )
      );
      return;
    }
    validateExpressionWithContext(value, `${path}.expr`);
    return;
  }

  if (key === "predicate") {
    if (typeof value !== "string" || value.length === 0) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_EXPRESSION_INVALID",
          `${contextLabel} predicate must be a non-empty string`,
          `${path}.predicate`
        )
      );
      return;
    }
    notePredicateEdge(options.predicateGraph, options.graphOwner, value);
    if (!Object.prototype.hasOwnProperty.call(predicates, value)) {
      diagnostics.push(
        makeDiagnostic(
          "E_PREDICATE_UNKNOWN",
          `${contextLabel} references unknown predicate '${value}'`,
          `${path}.predicate`
        )
      );
      return;
    }

    if (options.expandPredicateBodies) {
      const stack = options.expansionStack ?? new Set<string>();
      if (stack.has(value)) return;
      const nextStack = new Set(stack);
      nextStack.add(value);
      validateConditionSpec(
        predicates[value],
        streamByName,
        streamName,
        streamNames,
        predicates,
        diagnostics,
        `predicates.${value}`,
        `Predicate '${value}'`,
        {
          expandPredicateBodies: true,
          expansionStack: nextStack,
          policyState: options.policyState,
          criticalContext: options.criticalContext,
        }
      );
    }
    return;
  }

  if (key === "all" || key === "any") {
    if (!Array.isArray(value)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_EXPRESSION_INVALID",
          `${contextLabel} ${key} must be an array`,
          `${path}.${key}`
        )
      );
      return;
    }
    for (let i = 0; i < value.length; i += 1) {
      validateConditionSpec(
        value[i],
        streamByName,
        streamName,
        streamNames,
        predicates,
        diagnostics,
        `${path}.${key}[${i}]`,
        `${contextLabel} ${key}[${i}]`,
        options
      );
    }
    return;
  }

  if (key === "not") {
    validateConditionSpec(
      value,
      streamByName,
      streamName,
      streamNames,
      predicates,
      diagnostics,
      `${path}.not`,
      `${contextLabel} not`,
      options
    );
    return;
  }

  diagnostics.push(
    makeDiagnostic(
      "E_RULE_EXPRESSION_INVALID",
      `${contextLabel} condition object has unknown key '${key}'`,
      path
    )
  );
}

function detectPredicateCycles(
  graph: Map<string, Set<string>>,
  diagnostics: ValidationDiagnostic[]
): void {
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const emitted = new Set<string>();

  const dfs = (name: string) => {
    state.set(name, 1);
    stack.push(name);
    for (const dep of graph.get(name) ?? []) {
      if (!graph.has(dep)) continue;
      const depState = state.get(dep) ?? 0;
      if (depState === 0) {
        dfs(dep);
        continue;
      }
      if (depState === 1) {
        const start = stack.lastIndexOf(dep);
        const cycle = start >= 0 ? [...stack.slice(start), dep] : [dep, name, dep];
        const key = cycle.join("->");
        if (!emitted.has(key)) {
          diagnostics.push(
            makeDiagnostic(
              "E_PREDICATE_CYCLE",
              `Predicate cycle detected: ${cycle.join(" -> ")}`,
              `predicates.${dep}`
            )
          );
          emitted.add(key);
        }
      }
    }
    stack.pop();
    state.set(name, 2);
  };

  for (const name of graph.keys()) {
    if ((state.get(name) ?? 0) === 0) {
      dfs(name);
    }
  }
}

function validatePredicates(
  spec: PlainObject,
  streamByName: Map<string, any>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[]
): PlainObject {
  const predicates = isPlainObject(spec.predicates) ? spec.predicates : {};
  const streamNames = new Set(streamByName.keys());
  const graph = new Map<string, Set<string>>();

  for (const name of Object.keys(predicates)) {
    graph.set(name, new Set());
  }

  for (const [name, predicateSpec] of Object.entries(predicates)) {
    validateConditionSpec(
      predicateSpec,
      streamByName,
      null,
      streamNames,
      predicates,
      diagnostics,
      `predicates.${name}`,
      `Predicate '${name}'`,
      {
        predicateGraph: graph,
        graphOwner: name,
        policyState,
      }
    );
  }

  detectPredicateCycles(graph, diagnostics);
  return predicates;
}

function validateDispatchValueExpression(
  expr: unknown,
  streamByName: Map<string, any>,
  streamName: unknown,
  streamNames: Set<string>,
  policyState: PolicyValidationState,
  criticalContext: boolean,
  valueMode: "numeric" | "set",
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
  if (valueMode === "set") {
    validateSetValueExpression(
      expr,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      path,
      contextLabel
    );
    return;
  }
  if (typeof expr === "number") {
    if (policyState.policyTree && criticalContext && !isAllowedInlinePolicyLiteral(String(expr))) {
      diagnostics.push(
        makeDiagnostic(
          "E_POLICY_LITERAL_CRITICAL",
          `${contextLabel} uses inline critical numeric literal '${String(expr)}'; use params.policy.*`,
          path
        )
      );
    }
    return;
  }
  if (typeof expr !== "string") {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} must be a string/number expression`,
        path
      )
    );
    return;
  }
  if (expr.length === 0) return;
  const syntaxError = validateExpressionSyntax(expr, { streamNames });
  if (syntaxError) {
    diagnostics.push(
      makeDiagnostic("E_CEL_INVALID", `${contextLabel} has invalid CEL expression: ${syntaxError}`, path)
    );
    return;
  }
  validateDeclaredTypeFieldUsage(expr, streamByName, streamName, diagnostics, path, contextLabel);
  validatePolicyReferencesAndLiterals(
    expr,
    path,
    contextLabel,
    diagnostics,
    policyState,
    criticalContext
  );
}

function validateDispatchSpec(
  dispatchValue: unknown,
  streamByName: Map<string, any>,
  streamName: unknown,
  streamNames: Set<string>,
  policyState: PolicyValidationState,
  criticalContext: boolean,
  valueMode: "numeric" | "set",
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
  if (!Array.isArray(dispatchValue)) {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} must be an array of dispatch rows`,
        path
      )
    );
    return;
  }

  let hasDefault = false;
  for (let i = 0; i < dispatchValue.length; i += 1) {
    const row = dispatchValue[i];
    const rowPath = `${path}[${i}]`;
    if (!isPlainObject(row)) {
      diagnostics.push(
        makeDiagnostic("E_RULE_EXPRESSION_INVALID", `${contextLabel} row ${i} must be an object`, rowPath)
      );
      continue;
    }

    const rowHasWhen = Object.prototype.hasOwnProperty.call(row, "when");
    const rowHasDefault = Object.prototype.hasOwnProperty.call(row, "default");
    if (rowHasWhen) {
      if (isPlainObject(row.when)) {
        const wk = Object.keys(row.when as Record<string, unknown>);
        const predicateValue = (row.when as Record<string, unknown>).predicate;
        if (
          wk.length !== 1 ||
          wk[0] !== "predicate" ||
          typeof predicateValue !== "string" ||
          predicateValue.length === 0
        ) {
          diagnostics.push(
            makeDiagnostic(
              "E_RULE_EXPRESSION_INVALID",
              `${contextLabel} row ${i} when object must be { predicate: <non-empty name> } with no extra keys`,
              `${rowPath}.when`
            )
          );
        }
      } else if (typeof row.when !== "string") {
        diagnostics.push(makeDiagnostic("E_RULE_EXPRESSION_INVALID", `${contextLabel} row ${i} when must be a string expression or condition object`, `${rowPath}.when`));
      } else {
        const syntaxError = validateExpressionSyntax(row.when, { streamNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${contextLabel} row ${i} has invalid CEL when expression: ${syntaxError}`,
              `${rowPath}.when`
            )
          );
        } else {
          validatePolicyReferencesAndLiterals(
            row.when,
            `${rowPath}.when`,
            `${contextLabel} row ${i} when`,
            diagnostics,
            policyState,
            criticalContext
          );
        }
      }

      if (!Object.prototype.hasOwnProperty.call(row, "value")) {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${contextLabel} row ${i} must include value`,
            `${rowPath}.value`
          )
        );
      } else {
      validateDispatchValueExpression(
        row.value,
        streamByName,
        streamName,
        streamNames,
        policyState,
        criticalContext,
        valueMode,
        diagnostics,
        `${rowPath}.value`,
        `${contextLabel} row ${i} value`
      );
      }
    }

    if (rowHasDefault) {
      hasDefault = true;
      validateDispatchValueExpression(
        row.default,
        streamByName,
        streamName,
        streamNames,
        policyState,
        criticalContext,
        valueMode,
        diagnostics,
        `${rowPath}.default`,
        `${contextLabel} row ${i} default`
      );
    }
  }

  if (!hasDefault) {
    diagnostics.push(
      makeDiagnostic(
        "E_DISPATCH_NO_DEFAULT",
        `${contextLabel} is missing required default dispatch row`,
        path
      )
    );
  }
}

function validateSetValueExpression(
  value: unknown,
  streamByName: Map<string, any>,
  streamName: unknown,
  streamNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
  if (
    value == null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "string") {
    if (value.length === 0) return;
    const syntaxError = validateExpressionSyntax(value, { streamNames });
    if (syntaxError) {
      diagnostics.push(
        makeDiagnostic("E_CEL_INVALID", `${contextLabel} has invalid CEL expression: ${syntaxError}`, path)
      );
      return;
    }
    validateDeclaredTypeFieldUsage(value, streamByName, streamName, diagnostics, path, contextLabel);
    validatePolicyReferencesAndLiterals(value, path, contextLabel, diagnostics, policyState);
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      validateSetValueExpression(
        value[i],
        streamByName,
        streamName,
        streamNames,
        policyState,
        diagnostics,
        `${path}[${i}]`,
        contextLabel
      );
    }
    return;
  }

  if (isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, "dispatch")) {
    validateDispatchSpec(
      value.dispatch,
      streamByName,
      streamName,
      streamNames,
      policyState,
      false,
      "set",
      diagnostics,
      `${path}.dispatch`,
      contextLabel
    );
    return;
  }

  if (!isPlainObject(value)) {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} must be a CEL expression, literal, array, object, or dispatch block`,
        path
      )
    );
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    validateSetValueExpression(
      nested,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${path}.${key}`,
      contextLabel
    );
  }
}

function validateTemplateDispatchExpressions(
  value: unknown,
  streamByName: Map<string, any>,
  streamName: unknown,
  streamNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      validateTemplateDispatchExpressions(
        value[i],
        streamByName,
        streamName,
        streamNames,
        policyState,
        diagnostics,
        `${path}[${i}]`,
        contextLabel
      );
    }
    return;
  }

  if (!isPlainObject(value)) return;
  if (Object.prototype.hasOwnProperty.call(value, "dispatch")) {
    validateDispatchSpec(
      value.dispatch,
      streamByName,
      streamName,
      streamNames,
      policyState,
      false,
      "numeric",
      diagnostics,
      `${path}.dispatch`,
      contextLabel
    );
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    validateTemplateDispatchExpressions(
      nested,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${path}.${key}`,
      contextLabel
    );
  }
}

function validateTemplateNumericExpression(
  value: unknown,
  streamByName: Map<string, any>,
  streamName: unknown,
  streamNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
  if (value == null || typeof value === "number") return;
  if (isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, "dispatch")) {
    validateDispatchSpec(
      value.dispatch,
      streamByName,
      streamName,
      streamNames,
      policyState,
      false,
      "numeric",
      diagnostics,
      `${path}.dispatch`,
      contextLabel
    );
    return;
  }
  if (typeof value !== "string") {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} must be a number, string expression, or dispatch block`,
        path
      )
    );
    return;
  }

  const syntaxError = validateExpressionSyntax(value, { streamNames });
  if (syntaxError) {
    diagnostics.push(
      makeDiagnostic(
        "E_CEL_INVALID",
        `${contextLabel} has invalid CEL expression: ${syntaxError}`,
        path
      )
    );
    return;
  }

  validateDeclaredTypeFieldUsage(value, streamByName, streamName, diagnostics, path, contextLabel);
  validatePolicyReferencesAndLiterals(value, path, contextLabel, diagnostics, policyState);
}

function validateControlWindowTemplate(
  value: unknown,
  streamByName: Map<string, any>,
  streamName: unknown,
  streamNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
  if (value == null) return;
  if (isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, "dispatch")) {
    validateDispatchSpec(
      value.dispatch,
      streamByName,
      streamName,
      streamNames,
      policyState,
      false,
      "set",
      diagnostics,
      `${path}.dispatch`,
      contextLabel
    );
    return;
  }
  if (typeof value === "string") {
    const syntaxError = validateExpressionSyntax(value, { streamNames });
    if (syntaxError) {
      diagnostics.push(
        makeDiagnostic(
          "E_CEL_INVALID",
          `${contextLabel} has invalid CEL expression: ${syntaxError}`,
          path
        )
      );
      return;
    }
    validatePolicyReferencesAndLiterals(value, path, contextLabel, diagnostics, policyState);
    return;
  }
  if (!Array.isArray(value)) {
    diagnostics.push(
      makeDiagnostic(
        "E_CONTROL_WINDOW_SCHEMA",
        `${contextLabel} must be an array of control window specs`,
        path
      )
    );
    return;
  }

  for (let i = 0; i < value.length; i += 1) {
    const entry = value[i];
    const entryPath = `${path}[${i}]`;
    const entryLabel = `${contextLabel}[${i}]`;
    if (!isPlainObject(entry)) {
      diagnostics.push(
        makeDiagnostic(
          "E_CONTROL_WINDOW_SCHEMA",
          `${entryLabel} must be an object`,
          entryPath
        )
      );
      continue;
    }

    if (entry.target != null) {
      if (typeof entry.target !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTROL_WINDOW_SCHEMA",
            `${entryLabel}.target must be a string expression`,
            `${entryPath}.target`
          )
        );
      } else if (!["current", "next", "prev"].includes(entry.target)) {
        const syntaxError = validateExpressionSyntax(entry.target, { streamNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${entryLabel}.target has invalid CEL expression: ${syntaxError}`,
              `${entryPath}.target`
            )
          );
        }
      }
    }

    validateTemplateNumericExpression(
      entry.start_ms,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${entryPath}.start_ms`,
      `${entryLabel}.start_ms`
    );
    validateTemplateNumericExpression(
      entry.end_ms,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${entryPath}.end_ms`,
      `${entryLabel}.end_ms`
    );
    validateTemplateNumericExpression(
      entry.start_ratio,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${entryPath}.start_ratio`,
      `${entryLabel}.start_ratio`
    );
    validateTemplateNumericExpression(
      entry.end_ratio,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${entryPath}.end_ratio`,
      `${entryLabel}.end_ratio`
    );
    validateTemplateNumericExpression(
      entry.prefix_ms,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${entryPath}.prefix_ms`,
      `${entryLabel}.prefix_ms`
    );
    validateTemplateNumericExpression(
      entry.suffix_ms,
      streamByName,
      streamName,
      streamNames,
      policyState,
      diagnostics,
      `${entryPath}.suffix_ms`,
      `${entryLabel}.suffix_ms`
    );

    const fieldsSpec = entry.fields;
    if (typeof fieldsSpec === "string") {
      const syntaxError = validateExpressionSyntax(fieldsSpec, { streamNames });
      if (syntaxError) {
        diagnostics.push(
          makeDiagnostic(
            "E_CEL_INVALID",
            `${entryLabel}.fields has invalid CEL expression: ${syntaxError}`,
            `${entryPath}.fields`
          )
        );
      } else {
        validateDeclaredTypeFieldUsage(
          fieldsSpec,
          streamByName,
          streamName,
          diagnostics,
          `${entryPath}.fields`,
          `${entryLabel}.fields`
        );
        validatePolicyReferencesAndLiterals(
          fieldsSpec,
          `${entryPath}.fields`,
          `${entryLabel}.fields`,
          diagnostics,
          policyState
        );
      }
    } else if (!isPlainObject(fieldsSpec)) {
      diagnostics.push(
        makeDiagnostic(
          "E_CONTROL_WINDOW_SCHEMA",
          `${entryLabel}.fields must be an object`,
          `${entryPath}.fields`
        )
      );
    } else {
      validateTemplateDispatchExpressions(
        fieldsSpec,
        streamByName,
        streamName,
        streamNames,
        policyState,
        diagnostics,
        `${entryPath}.fields`,
        `${entryLabel}.fields`
      );
      for (const [fieldName, fieldSpec] of Object.entries(fieldsSpec)) {
        if (!isPlainObject(fieldSpec)) {
          validateTemplateNumericExpression(
            fieldSpec,
            streamByName,
            streamName,
            streamNames,
            policyState,
            diagnostics,
            `${entryPath}.fields.${fieldName}`,
            `${entryLabel}.fields.${fieldName}`
          );
          continue;
        }

        const opSpec = fieldSpec.op;
        if (typeof opSpec !== "string") {
          diagnostics.push(
            makeDiagnostic(
              "E_CONTROL_WINDOW_SCHEMA",
              `${entryLabel}.fields.${fieldName}.op must be a string expression`,
              `${entryPath}.fields.${fieldName}.op`
            )
          );
        } else if (!["set", "add", "mul", "max", "min", "unset"].includes(opSpec)) {
          const syntaxError = validateExpressionSyntax(opSpec, { streamNames });
          if (syntaxError) {
            diagnostics.push(
              makeDiagnostic(
                "E_CEL_INVALID",
                `${entryLabel}.fields.${fieldName}.op has invalid CEL expression: ${syntaxError}`,
                `${entryPath}.fields.${fieldName}.op`
              )
            );
          }
        }

        if (Object.prototype.hasOwnProperty.call(fieldSpec, "value")) {
          validateTemplateNumericExpression(
            fieldSpec.value,
            streamByName,
            streamName,
            streamNames,
            policyState,
            diagnostics,
            `${entryPath}.fields.${fieldName}.value`,
            `${entryLabel}.fields.${fieldName}.value`
          );
        } else if (opSpec !== "unset") {
          diagnostics.push(
            makeDiagnostic(
              "E_CONTROL_WINDOW_SCHEMA",
              `${entryLabel}.fields.${fieldName}.value is required unless op is unset`,
              `${entryPath}.fields.${fieldName}.value`
            )
          );
        }
      }
    }

    if (entry.params != null) {
      diagnostics.push(
        makeDiagnostic(
          "E_CONTROL_WINDOW_SCHEMA",
          `${entryLabel}.params is no longer supported; use .fields`,
          `${entryPath}.params`
        )
      );
    }

    if (entry.tag != null) {
      if (typeof entry.tag !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${entryLabel}.tag must be a string expression`,
            `${entryPath}.tag`
          )
        );
      } else {
        const syntaxError = validateExpressionSyntax(entry.tag, { streamNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${entryLabel}.tag has invalid CEL expression: ${syntaxError}`,
              `${entryPath}.tag`
            )
          );
        }
      }
    }
  }
}

function validateRules(
  spec: PlainObject,
  streamByName: Map<string, any>,
  predicates: PlainObject,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[]
): void {
  const streamNames = new Set(streamByName.keys());
  const patterns = isPlainObject(spec.patterns) ? spec.patterns : {};
  const rules = isPlainObject(spec.rules) ? spec.rules : {};

  for (const [name, rule] of Object.entries(rules)) {
    if (!isPlainObject(rule)) {
      diagnostics.push(
        makeDiagnostic("E_RULE_SCHEMA", `Rule '${name}' must be an object`, `rules.${name}`)
      );
      continue;
    }
    const r = rule as PlainObject;

    const hasSelect = isPlainObject(r.select);
    const hasMatch = typeof r.match === "string" && r.match.length > 0;
    const hasCustomOp = typeof r.op === "string" && r.op.length > 0;
    const matchPattern = hasMatch ? patterns[r.match] : null;
    const ruleStreamName = hasSelect
      ? r.select.stream
      : isPlainObject(matchPattern)
        ? matchPattern.stream
        : null;
    if ((hasSelect && hasMatch) || (!hasSelect && !hasMatch && !hasCustomOp)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_SHAPE",
          `Rule '${name}' must define exactly one of select or match`,
          `rules.${name}`
        )
      );
    }
    if (hasCustomOp && !ALLOWED_CUSTOM_RULE_OPS.has(String(r.op))) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_OP_UNKNOWN",
          `Rule '${name}' uses unsupported custom op '${String(r.op)}'`,
          `rules.${name}.op`
        )
      );
    }

    if (hasSelect) {
      const stream = r.select.stream;
      if (!streamByName.has(stream)) {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_STREAM_UNKNOWN",
            `Rule '${name}' references unknown select stream '${stream}'`,
            `rules.${name}.select.stream`
          )
        );
      }
      validateConditionSpec(
        r.select.where,
        streamByName,
        r.select.stream,
        streamNames,
        predicates,
        diagnostics,
        `rules.${name}.select.where`,
        `Rule '${name}' select.where`,
        { expandPredicateBodies: true, policyState }
      );
    }

    if (hasMatch && !Object.prototype.hasOwnProperty.call(patterns, r.match)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_PATTERN_UNKNOWN",
          `Rule '${name}' references unknown pattern '${r.match}'`,
          `rules.${name}.match`
        )
      );
    }

    validateConditionSpec(
      r.constraint,
      streamByName,
      ruleStreamName,
      streamNames,
      predicates,
      diagnostics,
      `rules.${name}.constraint`,
      `Rule '${name}' constraint`,
      { expandPredicateBodies: true, policyState }
    );

    if (r.define && typeof r.define === "object" && !Array.isArray(r.define)) {
      for (const [defineKey, defineExpr] of Object.entries(r.define)) {
        if (typeof defineExpr !== "string") {
          diagnostics.push(
            makeDiagnostic(
              "E_RULE_EXPRESSION_INVALID",
              `Rule '${name}' define.${defineKey} must be a string expression`,
              `rules.${name}.define.${defineKey}`
            )
          );
          continue;
        }
        const syntaxError = validateExpressionSyntax(defineExpr, { streamNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `Rule '${name}' has invalid CEL define.${defineKey} expression: ${syntaxError}`,
              `rules.${name}.define.${defineKey}`
            )
          );
        } else {
          validateDeclaredTypeFieldUsage(
            defineExpr,
            streamByName,
            ruleStreamName,
            diagnostics,
            `rules.${name}.define.${defineKey}`,
            `Rule '${name}' define.${defineKey}`
          );
          validatePolicyReferencesAndLiterals(
            defineExpr,
            `rules.${name}.define.${defineKey}`,
            `Rule '${name}' define.${defineKey}`,
            diagnostics,
            policyState
          );
        }
      }
    }

    if (Array.isArray(r.apply)) {
      for (let i = 0; i < r.apply.length; i += 1) {
        const effect = r.apply[i];
        // Chunk 7: `for_each_field` is expanded at parse-time (see
        // parser.ts:expandForEachField). If it survived to validation, the
        // parser was bypassed — defense-in-depth diagnostic.
        if (effect && Object.prototype.hasOwnProperty.call(effect, "for_each_field")) {
          diagnostics.push(
            makeDiagnostic(
              "E_FOR_EACH_FIELD_UNEXPANDED",
              `Rule '${name}' apply[${i}] still has 'for_each_field'; expected parse-time expansion`,
              `rules.${name}.apply[${i}].for_each_field`
            )
          );
        }
        const hasValue = effect && Object.prototype.hasOwnProperty.call(effect, "value");
        const hasDispatch = effect && Object.prototype.hasOwnProperty.call(effect, "dispatch");
        if (hasValue && hasDispatch) {
          diagnostics.push(
            makeDiagnostic(
              "E_DISPATCH_AND_VALUE",
              `Rule '${name}' apply[${i}] cannot specify both value and dispatch`,
              `rules.${name}.apply[${i}]`
            )
          );
        }
        if (hasDispatch) {
          const criticalContext = isCriticalScalarField(effect?.field);
          validateDispatchSpec(
            effect?.dispatch,
            streamByName,
            ruleStreamName,
            streamNames,
            policyState,
            criticalContext,
            effect?.op === "set" ? "set" : "numeric",
            diagnostics,
            `rules.${name}.apply[${i}].dispatch`,
            `Rule '${name}' apply[${i}] dispatch`
          );
        } else if (hasValue) {
          const criticalContext = isCriticalScalarField(effect?.field);
          const valueMode = effect?.op === "set" ? "set" : "numeric";
          if (
            valueMode === "numeric" &&
            effect?.value != null &&
            typeof effect.value !== "string" &&
            typeof effect.value !== "number"
          ) {
            diagnostics.push(
              makeDiagnostic(
                "E_RULE_EXPRESSION_INVALID",
                `Rule '${name}' apply[${i}] has non-string/non-number value expression`,
                `rules.${name}.apply[${i}].value`
              )
            );
          }
          if (valueMode === "numeric" && typeof effect?.value === "number" && policyState.policyTree && criticalContext) {
            if (!isAllowedInlinePolicyLiteral(String(effect.value))) {
              diagnostics.push(
                makeDiagnostic(
                  "E_POLICY_LITERAL_CRITICAL",
                  `Rule '${name}' apply[${i}] value uses inline critical numeric literal '${String(
                    effect.value
                  )}'; use params.policy.*`,
                  `rules.${name}.apply[${i}].value`
                )
              );
            }
          }
          if (valueMode === "set") {
            validateSetValueExpression(
              effect?.value,
              streamByName,
              ruleStreamName,
              streamNames,
              policyState,
              diagnostics,
              `rules.${name}.apply[${i}].value`,
              `Rule '${name}' apply[${i}] value`
            );
          } else if (typeof effect?.value === "string" && effect.value.length > 0) {
            const syntaxError = validateExpressionSyntax(effect.value, { streamNames });
            if (syntaxError) {
              diagnostics.push(
                makeDiagnostic(
                  "E_CEL_INVALID",
                  `Rule '${name}' apply[${i}] has invalid CEL value expression: ${syntaxError}`,
                  `rules.${name}.apply[${i}].value`
                )
              );
            } else {
              validateDeclaredTypeFieldUsage(
                effect.value,
                streamByName,
                ruleStreamName,
                diagnostics,
                `rules.${name}.apply[${i}].value`,
                `Rule '${name}' apply[${i}] value`
              );
              validatePolicyReferencesAndLiterals(
                effect.value,
                `rules.${name}.apply[${i}].value`,
                `Rule '${name}' apply[${i}] value`,
                diagnostics,
                policyState,
                criticalContext
              );
            }
          }
        }
      }
    }

    if (isPlainObject(r.contour)) {
      if (!hasSelect) {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTOUR_SELECT_REQUIRED",
            `Rule '${name}' contour requires a select rule shape`,
            `rules.${name}.contour`
          )
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(r.contour, "domain") &&
        r.contour.domain !== "phrase"
      ) {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTOUR_DOMAIN_INVALID",
            `Rule '${name}' contour.domain must be 'phrase'`,
            `rules.${name}.contour.domain`
          )
        );
      }

      if (Object.prototype.hasOwnProperty.call(r.contour, "reset_break_index")) {
        const breakIndex = Number(r.contour.reset_break_index);
        if (!Number.isFinite(breakIndex) || breakIndex < 1) {
          diagnostics.push(
            makeDiagnostic(
              "E_CONTOUR_RESET_BREAK_INVALID",
              `Rule '${name}' contour.reset_break_index must be a finite number >= 1`,
              `rules.${name}.contour.reset_break_index`
            )
          );
        }
      }

      if (!Array.isArray(r.contour.apply) || r.contour.apply.length === 0) {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTOUR_APPLY_REQUIRED",
            `Rule '${name}' contour.apply must be a non-empty array`,
            `rules.${name}.contour.apply`
          )
        );
      } else {
        for (let i = 0; i < r.contour.apply.length; i += 1) {
          const effect = r.contour.apply[i];
          const hasValue = effect && Object.prototype.hasOwnProperty.call(effect, "value");
          const hasDispatch = effect && Object.prototype.hasOwnProperty.call(effect, "dispatch");
          if (hasValue && hasDispatch) {
            diagnostics.push(
              makeDiagnostic(
                "E_DISPATCH_AND_VALUE",
                `Rule '${name}' contour.apply[${i}] cannot specify both value and dispatch`,
                `rules.${name}.contour.apply[${i}]`
              )
            );
          }
          if (hasDispatch) {
            const criticalContext = isCriticalScalarField(effect?.field);
            validateDispatchSpec(
              effect?.dispatch,
              streamByName,
              ruleStreamName,
              streamNames,
              policyState,
              criticalContext,
              effect?.op === "set" ? "set" : "numeric",
              diagnostics,
              `rules.${name}.contour.apply[${i}].dispatch`,
              `Rule '${name}' contour.apply[${i}] dispatch`
            );
          } else if (hasValue) {
            const criticalContext = isCriticalScalarField(effect?.field);
            const valueMode = effect?.op === "set" ? "set" : "numeric";
            if (
              valueMode === "numeric" &&
              effect?.value != null &&
              typeof effect.value !== "string" &&
              typeof effect.value !== "number"
            ) {
              diagnostics.push(
                makeDiagnostic(
                  "E_RULE_EXPRESSION_INVALID",
                  `Rule '${name}' contour.apply[${i}] has non-string/non-number value expression`,
                  `rules.${name}.contour.apply[${i}].value`
                )
              );
            }
            if (valueMode === "numeric" && typeof effect?.value === "number" && policyState.policyTree && criticalContext) {
              if (!isAllowedInlinePolicyLiteral(String(effect.value))) {
                diagnostics.push(
                  makeDiagnostic(
                    "E_POLICY_LITERAL_CRITICAL",
                    `Rule '${name}' contour.apply[${i}] value uses inline critical numeric literal '${String(
                      effect.value
                    )}'; use params.policy.*`,
                    `rules.${name}.contour.apply[${i}].value`
                  )
                );
              }
            }
            if (valueMode === "set") {
              validateSetValueExpression(
                effect?.value,
                streamByName,
                ruleStreamName,
                streamNames,
                policyState,
                diagnostics,
                `rules.${name}.contour.apply[${i}].value`,
                `Rule '${name}' contour.apply[${i}] value`
              );
            } else if (typeof effect?.value === "string" && effect.value.length > 0) {
              const syntaxError = validateExpressionSyntax(effect.value, { streamNames });
              if (syntaxError) {
                diagnostics.push(
                  makeDiagnostic(
                    "E_CEL_INVALID",
                    `Rule '${name}' contour.apply[${i}] has invalid CEL value expression: ${syntaxError}`,
                    `rules.${name}.contour.apply[${i}].value`
                  )
                );
              } else {
                validateDeclaredTypeFieldUsage(
                  effect.value,
                  streamByName,
                  ruleStreamName,
                  diagnostics,
                  `rules.${name}.contour.apply[${i}].value`,
                  `Rule '${name}' contour.apply[${i}] value`
                );
                validatePolicyReferencesAndLiterals(
                  effect.value,
                  `rules.${name}.contour.apply[${i}].value`,
                  `Rule '${name}' contour.apply[${i}] value`,
                  diagnostics,
                  policyState,
                  criticalContext
                );
              }
            }
          }
        }
      }
    }

    if (isPlainObject(r.splice) && Array.isArray(r.splice.insert)) {
      for (let i = 0; i < r.splice.insert.length; i += 1) {
        validateTemplateDispatchExpressions(
          r.splice.insert[i],
          streamByName,
          ruleStreamName,
          streamNames,
          policyState,
          diagnostics,
          `rules.${name}.splice.insert[${i}]`,
          `Rule '${name}' splice.insert[${i}]`
        );
        const insertSpec = r.splice.insert[i];
        if (isPlainObject(insertSpec) && Object.prototype.hasOwnProperty.call(insertSpec, "control_windows")) {
          validateControlWindowTemplate(
            insertSpec.control_windows,
            streamByName,
            ruleStreamName,
            streamNames,
            policyState,
            diagnostics,
            `rules.${name}.splice.insert[${i}].control_windows`,
            `Rule '${name}' splice.insert[${i}].control_windows`
          );
        }
      }
    }

    const pointInsertSpecs: Array<{ spec: PlainObject; path: string; label: string }> = [];
    if (isPlainObject(r.insert_point)) {
      pointInsertSpecs.push({
        spec: r.insert_point,
        path: `rules.${name}.insert_point`,
        label: `Rule '${name}' insert_point`,
      });
    }
    if (Array.isArray(r.insert_points)) {
      for (let i = 0; i < r.insert_points.length; i += 1) {
        if (isPlainObject(r.insert_points[i])) {
          pointInsertSpecs.push({
            spec: r.insert_points[i],
            path: `rules.${name}.insert_points[${i}]`,
            label: `Rule '${name}' insert_points[${i}]`,
          });
        } else {
          diagnostics.push(
            makeDiagnostic(
              "E_RULE_EXPRESSION_INVALID",
              `Rule '${name}' insert_points[${i}] must be an object`,
              `rules.${name}.insert_points[${i}]`
            )
          );
        }
      }
    }

    for (const { spec: pointSpec, path: pointPath, label: pointLabel } of pointInsertSpecs) {
      const valueExpr = pointSpec.value;
      if (valueExpr != null && typeof valueExpr !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${pointLabel} has non-string value expression`,
            `${pointPath}.value`
          )
        );
      }
      if (typeof valueExpr === "string" && valueExpr.includes("next_point(")) {
        diagnostics.push(
          makeDiagnostic(
            "E_POINT_FWD_REF",
            `${pointLabel} uses next_point forward reference in point value`,
            `${pointPath}.value`
          )
        );
      }
      if (typeof valueExpr === "string" && valueExpr.length > 0) {
        const syntaxError = validateExpressionSyntax(valueExpr, { streamNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${pointLabel} has invalid CEL value expression: ${syntaxError}`,
              `${pointPath}.value`
            )
          );
        } else {
          validateDeclaredTypeFieldUsage(
            valueExpr,
            streamByName,
            ruleStreamName,
            diagnostics,
            `${pointPath}.value`,
            `${pointLabel}.value`
          );
          validatePolicyReferencesAndLiterals(
            valueExpr,
            `${pointPath}.value`,
            `${pointLabel}.value`,
            diagnostics,
            policyState,
            typeof pointSpec.stream === "string" &&
              pointSpec.stream.toLowerCase() === "f0"
          );
        }
      }

      // Optional per-point `when:` guard — a CEL boolean expression.
      const whenExpr = pointSpec.when;
      if (whenExpr != null && typeof whenExpr !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${pointLabel} has non-string when expression`,
            `${pointPath}.when`
          )
        );
      }
      if (typeof whenExpr === "string" && whenExpr.length > 0) {
        const whenSyntaxError = validateExpressionSyntax(whenExpr, { streamNames });
        if (whenSyntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${pointLabel} has invalid CEL when expression: ${whenSyntaxError}`,
              `${pointPath}.when`
            )
          );
        }
      }
    }
  }
}

// Chunk 3: validate pipeline-level `string_sets:` block.
// Shape: Record<non-empty string, string[]> where every element is a string.
function validateStringSets(
  spec: PlainObject,
  diagnostics: ValidationDiagnostic[]
): void {
  if (!Object.prototype.hasOwnProperty.call(spec, "string_sets")) return;
  const block = spec.string_sets;
  if (!isPlainObject(block)) {
    diagnostics.push(
      makeDiagnostic(
        "E_STRING_SET_INVALID",
        "string_sets must be an object mapping name to an array of strings",
        "string_sets"
      )
    );
    return;
  }
  for (const [name, value] of Object.entries(block)) {
    if (typeof name !== "string" || name.length === 0) {
      diagnostics.push(
        makeDiagnostic(
          "E_STRING_SET_INVALID",
          `string_sets name must be a non-empty string (got '${String(name)}')`,
          `string_sets.${String(name)}`
        )
      );
      continue;
    }
    if (!Array.isArray(value)) {
      diagnostics.push(
        makeDiagnostic(
          "E_STRING_SET_INVALID",
          `string_sets['${name}'] must be an array of strings`,
          `string_sets.${name}`
        )
      );
      continue;
    }
    for (let i = 0; i < value.length; i += 1) {
      if (typeof value[i] !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_STRING_SET_INVALID",
            `string_sets['${name}'][${i}] must be a string (got ${typeof value[i]})`,
            `string_sets.${name}[${i}]`
          )
        );
      }
    }
  }
}

function hasCitationArray(value: unknown): boolean {
  return Array.isArray(value) &&
    value.some((entry) => typeof entry === "string" && entry.trim().length > 0);
}

function validateCitedNumber(
  value: unknown,
  diagnostics: ValidationDiagnostic[],
  path: string,
  label: string
): void {
  if (!isPlainObject(value)) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_NUMBER", `${label} must be a { value, citations } object`, path)
    );
    return;
  }
  if (typeof value.value !== "number" || !Number.isFinite(value.value)) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_NUMBER", `${label}.value must be a finite number`, `${path}.value`)
    );
  }
  if (!hasCitationArray(value.citations)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_CITATION",
        `${label}.citations must contain at least one citation`,
        `${path}.citations`
      )
    );
  }
}

function validateStringArray(
  value: unknown,
  diagnostics: ValidationDiagnostic[],
  path: string,
  label: string
): void {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_ARRAY", `${label} must be a non-empty string array`, path)
    );
  }
}

function validateEventPointPolicy(value: unknown, diagnostics: ValidationDiagnostic[]): void {
  if (!isPlainObject(value)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_REQUIRED",
        "output.lowering.timeline.event_points must be an object",
        "output.lowering.timeline.event_points"
      )
    );
    return;
  }
  for (const field of ["include_segment_start", "include_control_boundaries", "include_f0_anchors", "include_transition_steady_time"]) {
    if (typeof value[field] !== "boolean") {
      diagnostics.push(
        makeDiagnostic(
          "E_LOWERING_SPEC_BOOLEAN",
          `output.lowering.timeline.event_points.${field} must be boolean`,
          `output.lowering.timeline.event_points.${field}`
        )
      );
    }
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validate the optional obstruent<->sonorant locus tables. Both `loci` and
 * `vowel_category` are optional. When present:
 *   loci[obstruent][sontyx "1"|"2"|"3"][formant] -> {locus_hz, prcnt, durtran_ms}
 *   vowel_category[sonorant] -> {forward?: 1|2|3, backward?: 1|2|3}
 * The engine treats a missing/partial entry as "no locus" (legacy fallback), so
 * this only flags structurally malformed data, not coverage gaps.
 */
function validateLocusTables(
  loci: unknown,
  vowelCategory: unknown,
  diagnostics: ValidationDiagnostic[]
): void {
  if (loci !== undefined) {
    const base = "output.lowering.transitions.loci";
    if (!isPlainObject(loci)) {
      diagnostics.push(makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${base} must be an object`, base));
    } else {
      for (const [obstruent, block] of Object.entries(loci)) {
        const obPath = `${base}.${obstruent}`;
        if (!isPlainObject(block)) {
          diagnostics.push(makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${obPath} must be an object`, obPath));
          continue;
        }
        for (const [sontyx, formants] of Object.entries(block)) {
          const sxPath = `${obPath}.${sontyx}`;
          if (sontyx !== "1" && sontyx !== "2" && sontyx !== "3") {
            diagnostics.push(makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${sxPath} key must be "1", "2", or "3"`, sxPath));
          }
          if (!isPlainObject(formants)) {
            diagnostics.push(makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${sxPath} must be an object`, sxPath));
            continue;
          }
          for (const [formant, entry] of Object.entries(formants)) {
            const fPath = `${sxPath}.${formant}`;
            if (!isPlainObject(entry)) {
              diagnostics.push(makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${fPath} must be an object`, fPath));
              continue;
            }
            for (const field of ["locus_hz", "prcnt", "durtran_ms"]) {
              if (!isFiniteNumber((entry as Record<string, unknown>)[field])) {
                diagnostics.push(
                  makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${fPath}.${field} must be a finite number`, `${fPath}.${field}`)
                );
              }
            }
          }
        }
      }
    }
  }

  if (vowelCategory !== undefined) {
    const base = "output.lowering.transitions.vowel_category";
    if (!isPlainObject(vowelCategory)) {
      diagnostics.push(makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${base} must be an object`, base));
    } else {
      for (const [sonorant, edges] of Object.entries(vowelCategory)) {
        const sPath = `${base}.${sonorant}`;
        if (!isPlainObject(edges)) {
          diagnostics.push(makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${sPath} must be an object`, sPath));
          continue;
        }
        for (const edge of ["forward", "backward"]) {
          const value = (edges as Record<string, unknown>)[edge];
          if (value === undefined) continue;
          if (value !== 1 && value !== 2 && value !== 3) {
            diagnostics.push(
              makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${sPath}.${edge} must be 1, 2, or 3`, `${sPath}.${edge}`)
            );
          }
        }
      }
    }
  }
}

export type ValidateDslSpecOptions = {
  requireLoweringSpec?: boolean;
};

function validateLoweringSpec(
  spec: PlainObject,
  diagnostics: ValidationDiagnostic[],
  options: ValidateDslSpecOptions,
): void {
  if (!isPlainObject(spec.output)) {
    if (options.requireLoweringSpec !== true) {
      return;
    }
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "Spec must declare output.lowering", "output")
    );
    return;
  }
  const lowering = spec.output.lowering;
  if (!isPlainObject(lowering)) {
    if (options.requireLoweringSpec !== true) {
      return;
    }
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "Spec must declare output.lowering", "output.lowering")
    );
    return;
  }
  if (typeof lowering.id !== "string" || lowering.id.length === 0) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.id is required", "output.lowering.id")
    );
  }

  const timeline = lowering.timeline;
  if (!isPlainObject(timeline)) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.timeline must be an object", "output.lowering.timeline")
    );
  } else {
    validateCitedNumber(timeline.initial_silence_ms, diagnostics, "output.lowering.timeline.initial_silence_ms", "output.lowering.timeline.initial_silence_ms");
    validateCitedNumber(timeline.final_silence_ms, diagnostics, "output.lowering.timeline.final_silence_ms", "output.lowering.timeline.final_silence_ms");
    if (!isPlainObject(timeline.duration_floors)) {
      diagnostics.push(
        makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.timeline.duration_floors must be an object", "output.lowering.timeline.duration_floors")
      );
    } else {
      validateCitedNumber(timeline.duration_floors.stop_release_ms, diagnostics, "output.lowering.timeline.duration_floors.stop_release_ms", "output.lowering.timeline.duration_floors.stop_release_ms");
      validateCitedNumber(timeline.duration_floors.default_ms, diagnostics, "output.lowering.timeline.duration_floors.default_ms", "output.lowering.timeline.duration_floors.default_ms");
    }
    validateEventPointPolicy(timeline.event_points, diagnostics);
  }

  const transitions = lowering.transitions;
  if (!isPlainObject(transitions)) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.transitions must be an object", "output.lowering.transitions")
    );
  } else {
    validateCitedNumber(transitions.default_transition_ms, diagnostics, "output.lowering.transitions.default_transition_ms", "output.lowering.transitions.default_transition_ms");
    if (!isPlainObject(transitions.blend)) {
      diagnostics.push(
        makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.transitions.blend must be an object", "output.lowering.transitions.blend")
      );
    } else {
      validateCitedNumber(transitions.blend.factor, diagnostics, "output.lowering.transitions.blend.factor", "output.lowering.transitions.blend.factor");
      validateStringArray(transitions.blend.keys, diagnostics, "output.lowering.transitions.blend.keys", "output.lowering.transitions.blend.keys");
      validateStringArray(transitions.blend.smooth_types, diagnostics, "output.lowering.transitions.blend.smooth_types", "output.lowering.transitions.blend.smooth_types");
    }
    // Optional obstruent<->sonorant locus tables (DECtalk-style). Both blocks
    // are optional; a frontend that omits them keeps midpoint-only smoothing.
    validateLocusTables(transitions.loci, transitions.vowel_category, diagnostics);
  }

  const f0 = lowering.f0;
  if (!isPlainObject(f0)) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.f0 must be an object", "output.lowering.f0")
    );
  } else {
    const rendererType = isPlainObject(f0.renderer) ? f0.renderer.type : undefined;
    if (rendererType !== "point_interpolation" && rendererType !== "layered_additive") {
      diagnostics.push(
        makeDiagnostic(
          "E_LOWERING_SPEC_RENDERER",
          "output.lowering.f0.renderer.type must be point_interpolation or layered_additive",
          "output.lowering.f0.renderer.type"
        )
      );
    }
    if (rendererType === "layered_additive" && (typeof f0.layered_model_ref !== "string" || f0.layered_model_ref.length === 0)) {
      diagnostics.push(
        makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.f0.layered_model_ref is required for layered_additive", "output.lowering.f0.layered_model_ref")
      );
    }
    if (!isPlainObject(f0.output_clamp)) {
      diagnostics.push(
        makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.f0.output_clamp must be an object", "output.lowering.f0.output_clamp")
      );
    } else {
      validateCitedNumber(f0.output_clamp.min_hz, diagnostics, "output.lowering.f0.output_clamp.min_hz", "output.lowering.f0.output_clamp.min_hz");
      validateCitedNumber(f0.output_clamp.max_hz, diagnostics, "output.lowering.f0.output_clamp.max_hz", "output.lowering.f0.output_clamp.max_hz");
    }
  }

  const overlays = lowering.overlays;
  if (!isPlainObject(overlays)) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "output.lowering.overlays must be an object", "output.lowering.overlays")
    );
  } else {
    validateStringArray(overlays.operation_order, diagnostics, "output.lowering.overlays.operation_order", "output.lowering.overlays.operation_order");
  }
}

// dt-10: validate the pipeline-level `syllabification:` block (DATA tables for
// the generic syllabify pass).  Shape:
//   nuclei: string (ascky chars that are syllable nuclei)
//   onset_clusters: string[] (legal onset clusters in ascky chars)
//   affixes: string[] (affix strings in ascky chars)
//   ascky: Record<string, single-char string> (ARPABET symbol -> ascky char)
// Absent block is fine (frontend opts out of syllabification).
function validateSyllabification(
  spec: PlainObject,
  diagnostics: ValidationDiagnostic[]
): void {
  if (!Object.prototype.hasOwnProperty.call(spec, "syllabification")) return;
  const block = spec.syllabification;
  if (!isPlainObject(block)) {
    diagnostics.push(
      makeDiagnostic(
        "E_SYLLABIFICATION_INVALID",
        "syllabification must be an object with nuclei/onset_clusters/affixes/ascky",
        "syllabification"
      )
    );
    return;
  }
  const b = block as PlainObject;
  if (typeof b.nuclei !== "string" || b.nuclei.length === 0) {
    diagnostics.push(
      makeDiagnostic(
        "E_SYLLABIFICATION_INVALID",
        "syllabification.nuclei must be a non-empty string of ascky chars",
        "syllabification.nuclei"
      )
    );
  }
  for (const key of ["onset_clusters", "affixes"] as const) {
    const arr = b[key];
    if (!Array.isArray(arr)) {
      diagnostics.push(
        makeDiagnostic(
          "E_SYLLABIFICATION_INVALID",
          `syllabification.${key} must be an array of strings`,
          `syllabification.${key}`
        )
      );
      continue;
    }
    for (let i = 0; i < arr.length; i += 1) {
      if (typeof arr[i] !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_SYLLABIFICATION_INVALID",
            `syllabification.${key}[${i}] must be a string (got ${typeof arr[i]})`,
            `syllabification.${key}[${i}]`
          )
        );
      }
    }
  }
  if (!isPlainObject(b.ascky)) {
    diagnostics.push(
      makeDiagnostic(
        "E_SYLLABIFICATION_INVALID",
        "syllabification.ascky must be an object mapping ARPABET symbol to a single ascky char",
        "syllabification.ascky"
      )
    );
  } else {
    for (const [k, v] of Object.entries(b.ascky as PlainObject)) {
      if (typeof v !== "string" || v.length !== 1) {
        diagnostics.push(
          makeDiagnostic(
            "E_SYLLABIFICATION_INVALID",
            `syllabification.ascky['${k}'] must be a single character (got '${String(v)}')`,
            `syllabification.ascky.${k}`
          )
        );
      }
    }
  }
}

// Chunk 3: validate pipeline-level `maps:` block.
// Shape: Record<non-empty string, Record<string, string>> — a string→string
// lookup table for each named map. Numeric or nested-object values are
// rejected here; if a future caller needs them we can broaden the schema.
function validateMaps(
  spec: PlainObject,
  diagnostics: ValidationDiagnostic[]
): void {
  if (!Object.prototype.hasOwnProperty.call(spec, "maps")) return;
  const block = spec.maps;
  if (!isPlainObject(block)) {
    diagnostics.push(
      makeDiagnostic(
        "E_MAP_INVALID",
        "maps must be an object mapping name to a string→string lookup table",
        "maps"
      )
    );
    return;
  }
  for (const [name, value] of Object.entries(block)) {
    if (typeof name !== "string" || name.length === 0) {
      diagnostics.push(
        makeDiagnostic(
          "E_MAP_INVALID",
          `maps name must be a non-empty string (got '${String(name)}')`,
          `maps.${String(name)}`
        )
      );
      continue;
    }
    if (!isPlainObject(value)) {
      diagnostics.push(
        makeDiagnostic(
          "E_MAP_INVALID",
          `maps['${name}'] must be an object with string keys and string values`,
          `maps.${name}`
        )
      );
      continue;
    }
    for (const [k, v] of Object.entries(value)) {
      if (typeof k !== "string" || k.length === 0) {
        diagnostics.push(
          makeDiagnostic(
            "E_MAP_INVALID",
            `maps['${name}'] keys must be non-empty strings (got '${String(k)}')`,
            `maps.${name}.${String(k)}`
          )
        );
        continue;
      }
      if (typeof v !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_MAP_INVALID",
            `maps['${name}']['${k}'] must be a string (got ${typeof v})`,
            `maps.${name}.${k}`
          )
        );
      }
    }
  }
}

export function validateDslSpec(
  spec: PlainObject,
  options: ValidateDslSpecOptions = {},
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const phaseByName = new Map();
  const phaseNames = [];
  const policyState = analyzePolicyState(spec.parameters);
  const streamByName = validateStreams(spec, diagnostics);
  validateTopology(spec, streamByName, diagnostics);
  const predicates = validatePredicates(spec, streamByName, policyState, diagnostics);
  validateStringSets(spec, diagnostics);
  validateLoweringSpec(spec, diagnostics, options);
  validateMaps(spec, diagnostics);
  validateSyllabification(spec, diagnostics);
  validatePatterns(spec, streamByName, predicates, policyState, diagnostics);
  validateRules(spec, streamByName, predicates, policyState, diagnostics);
  const scalarFields = collectScalarFields(spec);

  for (let i = 0; i < spec.phases.length; i += 1) {
    const phase = spec.phases[i];
    if (!phase.name) {
      diagnostics.push(
        makeDiagnostic("E_PHASE_NAME_MISSING", "Phase is missing name", `phases[${i}].name`)
      );
      continue;
    }
    if (phaseByName.has(phase.name)) {
      diagnostics.push(
        makeDiagnostic("E_PHASE_NAME_DUP", `Duplicate phase '${phase.name}'`, `phases[${i}].name`)
      );
      continue;
    }
    phaseByName.set(phase.name, phase);
    phaseNames.push(phase.name);
  }

  for (let i = 0; i < spec.phases.length; i += 1) {
    const phase = spec.phases[i];
    for (const dep of phase.after) {
      if (!phaseByName.has(dep)) {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_ORDER_VIOLATION",
            `Phase '${phase.name}' depends on unknown phase '${dep}'`,
            `phases[${i}].after`
          )
        );
      }
    }

    for (const ruleName of phase.rules) {
      if (!Object.prototype.hasOwnProperty.call(spec.rules, ruleName)) {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_UNKNOWN",
            `Phase '${phase.name}' references unknown rule '${ruleName}'`,
            `phases[${i}].rules`
          )
        );
      }
    }

    for (const pointStream of phase.resolve_points) {
      const stream = streamByName.get(pointStream);
      if (!stream || stream.type !== "point") {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_RESOLVE_POINT_STREAM_INVALID",
            `Phase '${phase.name}' resolves unknown/non-point stream '${pointStream}'`,
            `phases[${i}].resolve_points`
          )
        );
      }
    }

    for (const scalarField of phase.resolve_scalars) {
      if (scalarFields.size > 0 && !scalarFields.has(scalarField)) {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_RESOLVE_SCALAR_UNKNOWN",
            `Phase '${phase.name}' resolves unknown scalar '${scalarField}'`,
            `phases[${i}].resolve_scalars`
          )
        );
      }
    }
  }

  const phaseIndex = new Map(phaseNames.map((name, index) => [name, index]));
  for (const phase of spec.phases) {
    for (const dep of phase.after) {
      if (!phaseIndex.has(dep) || !phaseIndex.has(phase.name)) continue;
      if (phaseIndex.get(dep)! >= phaseIndex.get(phase.name)!) {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_ORDER_VIOLATION",
            `Phase '${phase.name}' must come after '${dep}'`,
            `phases.${phase.name}.after`
          )
        );
      }
    }
  }

  for (const leafPath of policyState.uncitedLeafPaths) {
    diagnostics.push(
      makeDiagnostic(
        "W_POLICY_PARAM_UNCITED",
        `Policy parameter 'params.policy.${leafPath}' is missing citation metadata`,
        `parameters.policy.${leafPath}`,
        "warning"
      )
    );
  }

  for (const leafPath of policyState.leafPaths) {
    if (policyState.usedLeafPaths.has(leafPath)) continue;
    diagnostics.push(
      makeDiagnostic(
        "W_POLICY_PARAM_UNUSED",
        `Policy parameter 'params.policy.${leafPath}' is declared but unused`,
        `parameters.policy.${leafPath}`,
        "warning"
      )
    );
  }

  return diagnostics;
}

export function assertValidSpec(
  spec: PlainObject,
  options: ValidateDslSpecOptions = {},
): ValidationDiagnostic[] {
  const diagnostics = validateDslSpec(spec, options);
  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    const detail = errors.map((d) => `${d.code} at ${d.path}: ${d.message}`).join("\n");
    throw new Error(`Invalid declarative frontend spec:\n${detail}`);
  }
  return diagnostics;
}
