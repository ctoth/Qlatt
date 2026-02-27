import { compareOrder } from "./order";
import { validateExpressionSyntax } from "./cel-expressions";

type DiagnosticSeverity = "error" | "warning";
type ValidationDiagnostic = {
  code: string;
  message: string;
  path: string;
  severity: DiagnosticSeverity;
};
type PlainObject = Record<string, any>;

function makeDiagnostic(
  code: string,
  message: string,
  path: string,
  severity: DiagnosticSeverity = "error"
): ValidationDiagnostic {
  return { code, message, path, severity };
}

const ALLOWED_STREAM_TYPES = new Set(["base", "span", "parallel", "point"]);
const ALLOWED_RULE_OPS = new Set();
const POLICY_REF_PATTERN = /\bparams\.policy((?:\.[A-Za-z_][A-Za-z0-9_]*)+)/g;
const NUMERIC_LITERAL_PATTERN = /(^|[^A-Za-z0-9_])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=$|[^A-Za-z0-9_])/g;
const CRITICAL_IDENTIFIER_PATTERN = /\b(duration|vot|f0)\b/i;
const ALLOWED_INLINE_POLICY_LITERALS = new Set(["0", "1", "-1", "0.0", "1.0", "-1.0"]);

function asPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

type PolicyValidationState = {
  policyTree: PlainObject | null;
  leafPaths: Set<string>;
  uncitedLeafPaths: Set<string>;
  usedLeafPaths: Set<string>;
};

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneValue(entry));
  }
  if (asPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  }
  return value;
}

function projectPolicyValueTree(node: unknown): unknown {
  if (!asPlainObject(node)) return cloneValue(node);
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

  if (!asPlainObject(parameters) || !asPlainObject(parameters.policy)) {
    return state;
  }

  state.policyTree = projectPolicyValueTree(parameters.policy) as PlainObject;

  const visit = (node: unknown, path: string): void => {
    if (!path) return;
    if (!asPlainObject(node)) {
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
    if (!asPlainObject(cursor) || !Object.prototype.hasOwnProperty.call(cursor, segment)) {
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
    if (!asPlainObject(stream)) {
      diagnostics.push(
        makeDiagnostic("E_STREAM_SCHEMA", `Stream '${name}' must be an object`, path)
      );
      continue;
    }

    if (!ALLOWED_STREAM_TYPES.has(stream.type)) {
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
  const patterns = asPlainObject(spec.patterns) ? spec.patterns : {};
  for (const [name, pattern] of Object.entries(patterns)) {
    if (!asPlainObject(pattern)) {
      diagnostics.push(
        makeDiagnostic(
          "E_PATTERN_SCHEMA",
          `Pattern '${name}' must be an object`,
          `patterns.${name}`
        )
      );
      continue;
    }

    if (!pattern.stream || !streamByName.has(pattern.stream)) {
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
      if (!asPlainObject(step) || !step.capture) {
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
  const streams = asPlainObject(spec.streams) ? spec.streams : {};
  for (const stream of Object.values(streams)) {
    if (!asPlainObject(stream)) continue;
    const scalars = asPlainObject(stream.scalars) ? stream.scalars : {};
    for (const field of Object.keys(scalars)) {
      fields.add(field);
    }
  }
  return fields;
}

function streamHasDeclaredTypeField(streamByName: Map<string, any>, streamName: unknown): boolean {
  if (typeof streamName !== "string" || streamName.length === 0) return false;
  const stream = streamByName.get(streamName);
  if (!asPlainObject(stream)) return false;
  const features = asPlainObject(stream.features) ? stream.features : null;
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

  if (!asPlainObject(condition)) {
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
  const predicates = asPlainObject(spec.predicates) ? spec.predicates : {};
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
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string
): void {
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
    if (!asPlainObject(row)) {
      diagnostics.push(
        makeDiagnostic("E_RULE_EXPRESSION_INVALID", `${contextLabel} row ${i} must be an object`, rowPath)
      );
      continue;
    }

    const rowHasWhen = Object.prototype.hasOwnProperty.call(row, "when");
    const rowHasDefault = Object.prototype.hasOwnProperty.call(row, "default");
    if (rowHasWhen) {
      if (typeof row.when !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${contextLabel} row ${i} when must be a string expression`,
            `${rowPath}.when`
          )
        );
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

  if (!asPlainObject(value)) return;
  if (Object.prototype.hasOwnProperty.call(value, "dispatch")) {
    validateDispatchSpec(
      value.dispatch,
      streamByName,
      streamName,
      streamNames,
      policyState,
      false,
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

function validateRules(
  spec: PlainObject,
  streamByName: Map<string, any>,
  predicates: PlainObject,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[]
): void {
  const streamNames = new Set(streamByName.keys());
  const patterns = asPlainObject(spec.patterns) ? spec.patterns : {};
  const rules = asPlainObject(spec.rules) ? spec.rules : {};

  for (const [name, rule] of Object.entries(rules)) {
    if (!asPlainObject(rule)) {
      diagnostics.push(
        makeDiagnostic("E_RULE_SCHEMA", `Rule '${name}' must be an object`, `rules.${name}`)
      );
      continue;
    }

    const hasSelect = asPlainObject(rule.select);
    const hasMatch = typeof rule.match === "string" && rule.match.length > 0;
    const hasOp = typeof rule.op === "string" && rule.op.length > 0;
    const matchPattern = hasMatch ? patterns[rule.match] : null;
    const ruleStreamName = hasSelect
      ? rule.select.stream
      : asPlainObject(matchPattern)
        ? matchPattern.stream
        : null;
    if ((hasSelect && hasMatch) || (!hasSelect && !hasMatch && !rule.op)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_SHAPE",
          `Rule '${name}' must define exactly one of select or match`,
          `rules.${name}`
        )
      );
    }

    if (hasOp && !ALLOWED_RULE_OPS.has(rule.op)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_OP_UNKNOWN",
          `Rule '${name}' uses unsupported op '${rule.op}'`,
          `rules.${name}.op`
        )
      );
    }

    if (hasSelect) {
      const stream = rule.select.stream;
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
        rule.select.where,
        streamByName,
        rule.select.stream,
        streamNames,
        predicates,
        diagnostics,
        `rules.${name}.select.where`,
        `Rule '${name}' select.where`,
        { expandPredicateBodies: true, policyState }
      );
    }

    if (hasMatch && !Object.prototype.hasOwnProperty.call(patterns, rule.match)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_PATTERN_UNKNOWN",
          `Rule '${name}' references unknown pattern '${rule.match}'`,
          `rules.${name}.match`
        )
      );
    }

    validateConditionSpec(
      rule.constraint,
      streamByName,
      ruleStreamName,
      streamNames,
      predicates,
      diagnostics,
      `rules.${name}.constraint`,
      `Rule '${name}' constraint`,
      { expandPredicateBodies: true, policyState }
    );

    if (rule.define && typeof rule.define === "object" && !Array.isArray(rule.define)) {
      for (const [defineKey, defineExpr] of Object.entries(rule.define)) {
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

    if (Array.isArray(rule.apply)) {
      for (let i = 0; i < rule.apply.length; i += 1) {
        const effect = rule.apply[i];
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
            diagnostics,
            `rules.${name}.apply[${i}].dispatch`,
            `Rule '${name}' apply[${i}] dispatch`
          );
        } else if (hasValue) {
          const criticalContext = isCriticalScalarField(effect?.field);
          if (
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
          if (typeof effect?.value === "number" && policyState.policyTree && criticalContext) {
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
          if (typeof effect?.value === "string" && effect.value.length > 0) {
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

    if (asPlainObject(rule.splice) && Array.isArray(rule.splice.insert)) {
      for (let i = 0; i < rule.splice.insert.length; i += 1) {
        validateTemplateDispatchExpressions(
          rule.splice.insert[i],
          streamByName,
          ruleStreamName,
          streamNames,
          policyState,
          diagnostics,
          `rules.${name}.splice.insert[${i}]`,
          `Rule '${name}' splice.insert[${i}]`
        );
      }
    }

    if (asPlainObject(rule.insert_point)) {
      const valueExpr = rule.insert_point.value;
      if (valueExpr != null && typeof valueExpr !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `Rule '${name}' has non-string insert_point.value expression`,
            `rules.${name}.insert_point.value`
          )
        );
      }
      if (typeof valueExpr === "string" && valueExpr.includes("next_point(")) {
        diagnostics.push(
          makeDiagnostic(
            "E_POINT_FWD_REF",
            `Rule '${name}' uses next_point forward reference in point value`,
            `rules.${name}.insert_point.value`
          )
        );
      }
      if (typeof valueExpr === "string" && valueExpr.length > 0) {
        const syntaxError = validateExpressionSyntax(valueExpr, { streamNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `Rule '${name}' has invalid CEL insert_point.value expression: ${syntaxError}`,
              `rules.${name}.insert_point.value`
            )
          );
        } else {
          validateDeclaredTypeFieldUsage(
            valueExpr,
            streamByName,
            ruleStreamName,
            diagnostics,
            `rules.${name}.insert_point.value`,
            `Rule '${name}' insert_point.value`
          );
          validatePolicyReferencesAndLiterals(
            valueExpr,
            `rules.${name}.insert_point.value`,
            `Rule '${name}' insert_point.value`,
            diagnostics,
            policyState,
            typeof rule.insert_point.stream === "string" &&
              rule.insert_point.stream.toLowerCase() === "f0"
          );
        }
      }
    }
  }
}

export function validateDslSpec(spec: PlainObject): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const phaseByName = new Map();
  const phaseNames = [];
  const policyState = analyzePolicyState(spec.parameters);
  const streamByName = validateStreams(spec, diagnostics);
  validateTopology(spec, streamByName, diagnostics);
  const predicates = validatePredicates(spec, streamByName, policyState, diagnostics);
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

export function assertValidSpec(spec: PlainObject): ValidationDiagnostic[] {
  const diagnostics = validateDslSpec(spec);
  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    const detail = errors.map((d) => `${d.code} at ${d.path}: ${d.message}`).join("\n");
    throw new Error(`Invalid declarative frontend spec:\n${detail}`);
  }
  return diagnostics;
}

export function validateSyncAxis(syncMarks: unknown): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const seen = new Set();
  const marks = Array.isArray(syncMarks) ? syncMarks : [];

  for (let i = 0; i < marks.length; i += 1) {
    const mark = marks[i];
    if (!mark?.id) {
      diagnostics.push(makeDiagnostic("E_MARK_ID_MISSING", "Sync mark missing id", `sync[${i}]`));
      continue;
    }
    if (seen.has(mark.id)) {
      diagnostics.push(makeDiagnostic("E_MARK_ID_DUP", `Duplicate sync id '${mark.id}'`, `sync[${i}]`));
    }
    seen.add(mark.id);
  }

  for (let i = 1; i < marks.length; i += 1) {
    const prev = marks[i - 1];
    const curr = marks[i];
    if (!prev?.order || !curr?.order) continue;
    if (compareOrder(prev.order, curr.order) >= 0) {
      diagnostics.push(
        makeDiagnostic(
          "E_AXIS_ORDER_NOT_TOTAL",
          `Sync axis is not strictly increasing at ${prev.id} -> ${curr.id}`,
          `sync[${i}]`
        )
      );
    }
  }

  return diagnostics;
}
