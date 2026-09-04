import { cloneValue, isPlainObject } from "../yaml-loader";
import { validateExpressionSyntax } from "./cel-expressions";
import * as S from "./struct-schema";

type DiagnosticSeverity = "error" | "warning";
type ValidationDiagnostic = {
  code: string;
  message: string;
  path: string;
  severity: DiagnosticSeverity;
};
type PlainObject = Record<string, unknown>;
type PhaseSpec = {
  name: string;
  after: string[];
  rules: string[];
  resolve_points: string[];
  resolve_scalars: string[];
};
const ALLOWED_CUSTOM_RULE_OPS = new Set(["noop"]);

function makeDiagnostic(
  code: string,
  message: string,
  path: string,
  severity: DiagnosticSeverity = "error",
): ValidationDiagnostic {
  return { code, message, path, severity };
}

const ALLOWED_RELATION_TYPES = new Set(["base", "span", "parallel", "point"]);
const POLICY_REF_PATTERN = /\bparams\.policy((?:\.[A-Za-z_][A-Za-z0-9_]*)+)/g;
const NUMERIC_LITERAL_PATTERN =
  /(^|[^A-Za-z0-9_])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=$|[^A-Za-z0-9_])/g;
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
  if (Object.hasOwn(node, "value")) {
    return cloneValue(node.value);
  }
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, projectPolicyValueTree(value)]),
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

    const hasValue = Object.hasOwn(node, "value");
    const hasCitations = Object.hasOwn(node, "citations");
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
    if (!isPlainObject(cursor) || !Object.hasOwn(cursor, segment)) {
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
  criticalContext = false,
): void {
  if (!policyState) return;

  for (const referencePath of collectPolicyReferencePaths(expression)) {
    if (!policyPathExists(policyState.policyTree, referencePath)) {
      diagnostics.push(
        makeDiagnostic(
          "E_POLICY_PARAM_UNKNOWN",
          `${contextLabel} references unknown policy path 'params.policy.${referencePath}'`,
          path,
        ),
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
      path,
    ),
  );
}

function isCriticalScalarField(field: unknown): boolean {
  if (typeof field !== "string" || field.length === 0) return false;
  const normalized = field.toLowerCase().replace(/^params\./, "");
  return normalized === "duration" || normalized === "vot" || normalized === "f0";
}

function validateRelations(
  spec: PlainObject,
  diagnostics: ValidationDiagnostic[],
): Map<string, unknown> {
  const relations = isPlainObject(spec.relations) ? spec.relations : {};
  const relationNames = Object.keys(relations);
  const relationByName = new Map();

  for (const name of relationNames) {
    relationByName.set(name, relations[name]);
  }

  for (const [name, relation] of relationByName.entries()) {
    const path = `relations.${name}`;
    if (!isPlainObject(relation)) {
      diagnostics.push(
        makeDiagnostic("E_RELATION_SCHEMA", `Relation '${name}' must be an object`, path),
      );
      continue;
    }

    if (!ALLOWED_RELATION_TYPES.has(relation.type as string)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RELATION_TYPE_INVALID",
          `Relation '${name}' has invalid type '${relation.type}'`,
          `${path}.type`,
        ),
      );
    }

    if (relation.type === "span" && relation.spans && !relationByName.has(relation.spans)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RELATION_SPANS_UNKNOWN",
          `Span relation '${name}' references unknown child relation '${relation.spans}'`,
          `${path}.spans`,
        ),
      );
    }
  }

  return relationByName;
}

function validateTopology(
  spec: PlainObject,
  relationByName: Map<string, unknown>,
  diagnostics: ValidationDiagnostic[],
): void {
  const topology = isPlainObject(spec.topology) ? spec.topology : {};
  const sections = ["hierarchy", "parallel", "point"];
  for (const section of sections) {
    const sectionValue = topology[section];
    const values = Array.isArray(sectionValue) ? sectionValue : [];
    const seen = new Set();
    for (let i = 0; i < values.length; i += 1) {
      const relation = values[i];
      if (!relationByName.has(relation)) {
        diagnostics.push(
          makeDiagnostic(
            "E_TOPOLOGY_RELATION_UNKNOWN",
            `Topology '${section}' references unknown relation '${relation}'`,
            `topology.${section}[${i}]`,
          ),
        );
      }
      if (seen.has(relation)) {
        diagnostics.push(
          makeDiagnostic(
            "E_TOPOLOGY_RELATION_DUP",
            `Topology '${section}' repeats relation '${relation}'`,
            `topology.${section}[${i}]`,
          ),
        );
      }
      seen.add(relation);
    }
  }
}

function validatePatterns(
  spec: PlainObject,
  relationByName: Map<string, unknown>,
  predicates: PlainObject,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
): void {
  const relationNames = new Set(relationByName.keys());
  const patterns = isPlainObject(spec.patterns) ? spec.patterns : {};
  for (const [name, pattern] of Object.entries(patterns)) {
    if (!isPlainObject(pattern)) {
      diagnostics.push(
        makeDiagnostic(
          "E_PATTERN_SCHEMA",
          `Pattern '${name}' must be an object`,
          `patterns.${name}`,
        ),
      );
      continue;
    }

    if (!pattern.relation || !relationByName.has(pattern.relation as string)) {
      diagnostics.push(
        makeDiagnostic(
          "E_PATTERN_RELATION_UNKNOWN",
          `Pattern '${name}' references unknown relation '${pattern.relation}'`,
          `patterns.${name}.relation`,
        ),
      );
    }

    if (!Array.isArray(pattern.sequence) || pattern.sequence.length === 0) {
      diagnostics.push(
        makeDiagnostic(
          "E_PATTERN_SEQUENCE_EMPTY",
          `Pattern '${name}' must define a non-empty sequence`,
          `patterns.${name}.sequence`,
        ),
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
            `patterns.${name}.sequence[${i}]`,
          ),
        );
        continue;
      }
      if (captures.has(step.capture)) {
        diagnostics.push(
          makeDiagnostic(
            "E_PATTERN_CAPTURE_DUP",
            `Pattern '${name}' uses duplicate capture '${step.capture}'`,
            `patterns.${name}.sequence[${i}].capture`,
          ),
        );
      }
      captures.add(step.capture);

      validateConditionSpec(
        step.where,
        relationByName,
        pattern.relation,
        relationNames,
        predicates,
        diagnostics,
        `patterns.${name}.sequence[${i}].where`,
        `Pattern '${name}' step ${i} where`,
        { expandPredicateBodies: true, policyState },
      );
    }

    if (pattern.constraint != null) {
      validateConditionSpec(
        pattern.constraint,
        relationByName,
        pattern.relation,
        relationNames,
        predicates,
        diagnostics,
        `patterns.${name}.constraint`,
        `Pattern '${name}' constraint`,
        { expandPredicateBodies: true, policyState },
      );
    }
  }
}

function collectScalarFields(spec: PlainObject): Set<string> {
  const fields = new Set<string>();
  const relations = isPlainObject(spec.relations) ? spec.relations : {};
  for (const relation of Object.values(relations)) {
    if (!isPlainObject(relation)) continue;
    const scalars = isPlainObject(relation.scalars) ? relation.scalars : {};
    for (const field of Object.keys(scalars)) {
      fields.add(field);
    }
  }
  return fields;
}

function relationHasDeclaredTypeField(
  relationByName: Map<string, unknown>,
  relationName: unknown,
): boolean {
  if (typeof relationName !== "string" || relationName.length === 0) return false;
  const relation = relationByName.get(relationName);
  if (!isPlainObject(relation)) return false;
  const features = isPlainObject(relation.features) ? relation.features : null;
  if (!features) return false;
  return Object.hasOwn(features, "type");
}

function validateDeclaredTypeFieldUsage(
  expression: string,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
): void {
  if (!/\.type\b/.test(expression)) return;
  if (relationHasDeclaredTypeField(relationByName, relationName)) return;
  diagnostics.push(
    makeDiagnostic(
      "E_TOKEN_FIELD_UNDECLARED",
      `${contextLabel} uses '.type' but relation '${String(
        relationName ?? "",
      )}' does not declare features.type`,
      path,
    ),
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
  dependency: string,
): void {
  if (!graph || !owner) return;
  if (!graph.has(owner)) {
    graph.set(owner, new Set());
  }
  graph.get(owner)!.add(dependency);
}

function validateConditionSpec(
  condition: unknown,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  relationNames: Set<string>,
  predicates: PlainObject,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
  options: ConditionValidationOptions = {},
): void {
  if (condition == null) return;

  const validateExpressionWithContext = (expression: string, expressionPath: string): void => {
    if (expression.length === 0) return;
    const syntaxError = validateExpressionSyntax(expression, { relationNames });
    if (syntaxError) {
      diagnostics.push(
        makeDiagnostic(
          "E_CEL_INVALID",
          `${contextLabel} has invalid CEL expression: ${syntaxError}`,
          expressionPath,
        ),
      );
      return;
    }
    if (typeof relationName === "string" && relationName.length > 0) {
      validateDeclaredTypeFieldUsage(
        expression,
        relationByName,
        relationName,
        diagnostics,
        expressionPath,
        contextLabel,
      );
    }
    validatePolicyReferencesAndLiterals(
      expression,
      expressionPath,
      contextLabel,
      diagnostics,
      options.policyState,
      options.criticalContext,
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
        path,
      ),
    );
    return;
  }

  const keys = Object.keys(condition);
  if (keys.length !== 1) {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} condition object must declare exactly one of expr/predicate/all/any/not`,
        path,
      ),
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
          `${path}.expr`,
        ),
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
          `${path}.predicate`,
        ),
      );
      return;
    }
    notePredicateEdge(options.predicateGraph, options.graphOwner, value);
    if (!Object.hasOwn(predicates, value)) {
      diagnostics.push(
        makeDiagnostic(
          "E_PREDICATE_UNKNOWN",
          `${contextLabel} references unknown predicate '${value}'`,
          `${path}.predicate`,
        ),
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
        relationByName,
        relationName,
        relationNames,
        predicates,
        diagnostics,
        `predicates.${value}`,
        `Predicate '${value}'`,
        {
          expandPredicateBodies: true,
          expansionStack: nextStack,
          policyState: options.policyState,
          criticalContext: options.criticalContext,
        },
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
          `${path}.${key}`,
        ),
      );
      return;
    }
    for (let i = 0; i < value.length; i += 1) {
      validateConditionSpec(
        value[i],
        relationByName,
        relationName,
        relationNames,
        predicates,
        diagnostics,
        `${path}.${key}[${i}]`,
        `${contextLabel} ${key}[${i}]`,
        options,
      );
    }
    return;
  }

  if (key === "not") {
    validateConditionSpec(
      value,
      relationByName,
      relationName,
      relationNames,
      predicates,
      diagnostics,
      `${path}.not`,
      `${contextLabel} not`,
      options,
    );
    return;
  }

  diagnostics.push(
    makeDiagnostic(
      "E_RULE_EXPRESSION_INVALID",
      `${contextLabel} condition object has unknown key '${key}'`,
      path,
    ),
  );
}

function detectPredicateCycles(
  graph: Map<string, Set<string>>,
  diagnostics: ValidationDiagnostic[],
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
              `predicates.${dep}`,
            ),
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
  relationByName: Map<string, unknown>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
): PlainObject {
  const predicates = isPlainObject(spec.predicates) ? spec.predicates : {};
  const relationNames = new Set(relationByName.keys());
  const graph = new Map<string, Set<string>>();

  for (const name of Object.keys(predicates)) {
    graph.set(name, new Set());
  }

  for (const [name, predicateSpec] of Object.entries(predicates)) {
    validateConditionSpec(
      predicateSpec,
      relationByName,
      null,
      relationNames,
      predicates,
      diagnostics,
      `predicates.${name}`,
      `Predicate '${name}'`,
      {
        predicateGraph: graph,
        graphOwner: name,
        policyState,
      },
    );
  }

  detectPredicateCycles(graph, diagnostics);
  return predicates;
}

/**
 * Shared threading context for the value-shape validator family. Bundles the
 * five arguments (relation maps, relation names, policy state, diagnostics sink)
 * that every recursor passed positionally.
 */
type ValueShapeCtx = {
  relationByName: Map<string, unknown>;
  relationName: unknown;
  relationNames: Set<string>;
  policyState: PolicyValidationState;
  diagnostics: ValidationDiagnostic[];
};

/**
 * One parameterized description of the recursive value shape
 * `value = number | CEL string | {dispatch} | array | nested object`. Each
 * former recursor (`validateSetValueExpression`,
 * `validateDispatchValueExpression` numeric mode, `validateTemplateNumericExpression`,
 * `validateTemplateDispatchExpressions`) is now just a spec over the single
 * `validateValueShape` recursion. An absent `invalidCode` means unhandled
 * leaves are silently ignored (the template-walk behaviour).
 */
type ValueShapeSpec = {
  acceptNull: boolean;
  acceptBoolean: boolean;
  numberCriticalCheck: boolean;
  validateLeaves: boolean;
  celSkipEmpty: boolean;
  celUsesCriticalContext: boolean;
  handleDispatch: boolean;
  dispatchMode: "numeric" | "set";
  recurseContainers: boolean;
  invalidCode?: string;
  invalidMessage?: (label: string) => string;
};

// value = set literal (recurses arrays + objects, accepts null/bool, CEL leaves).
const SET_VALUE_SHAPE: ValueShapeSpec = {
  acceptNull: true,
  acceptBoolean: true,
  numberCriticalCheck: false,
  validateLeaves: true,
  celSkipEmpty: true,
  celUsesCriticalContext: false,
  handleDispatch: true,
  dispatchMode: "set",
  recurseContainers: true,
  invalidCode: "E_RULE_EXPRESSION_INVALID",
  invalidMessage: (l) => `${l} must be a CEL expression, literal, array, object, or dispatch block`,
};

// value = a single numeric dispatch-row value (number or CEL string only).
const DISPATCH_VALUE_NUMERIC_SHAPE: ValueShapeSpec = {
  acceptNull: false,
  acceptBoolean: false,
  numberCriticalCheck: true,
  validateLeaves: true,
  celSkipEmpty: true,
  celUsesCriticalContext: true,
  handleDispatch: false,
  dispatchMode: "numeric",
  recurseContainers: false,
  invalidCode: "E_RULE_EXPRESSION_INVALID",
  invalidMessage: (l) => `${l} must be a string/number expression`,
};

// value = number | CEL string | {dispatch} (template numeric slot, no recursion).
const TEMPLATE_NUMERIC_SHAPE: ValueShapeSpec = {
  acceptNull: true,
  acceptBoolean: false,
  numberCriticalCheck: false,
  validateLeaves: true,
  celSkipEmpty: false,
  celUsesCriticalContext: false,
  handleDispatch: true,
  dispatchMode: "numeric",
  recurseContainers: false,
  invalidCode: "E_RULE_EXPRESSION_INVALID",
  invalidMessage: (l) => `${l} must be a number, string expression, or dispatch block`,
};

// structural walk: descend arrays/objects only to validate nested dispatch
// blocks; every non-dispatch leaf is ignored (no invalidCode).
const TEMPLATE_DISPATCH_WALK_SHAPE: ValueShapeSpec = {
  acceptNull: true,
  acceptBoolean: true,
  numberCriticalCheck: false,
  validateLeaves: false,
  celSkipEmpty: false,
  celUsesCriticalContext: false,
  handleDispatch: true,
  dispatchMode: "numeric",
  recurseContainers: true,
};

/**
 * Validate one CEL string leaf: syntax, declared-type field usage, and policy
 * reference/critical-literal checks. Shared by every value-shape leaf and by the
 * control-window `.fields` string form.
 */
function validateCelExpressionLeaf(
  value: string,
  ctx: ValueShapeCtx,
  path: string,
  label: string,
  skipEmpty: boolean,
  criticalContext: boolean,
): void {
  if (skipEmpty && value.length === 0) return;
  const syntaxError = validateExpressionSyntax(value, { relationNames: ctx.relationNames });
  if (syntaxError) {
    ctx.diagnostics.push(
      makeDiagnostic("E_CEL_INVALID", `${label} has invalid CEL expression: ${syntaxError}`, path),
    );
    return;
  }
  validateDeclaredTypeFieldUsage(
    value,
    ctx.relationByName,
    ctx.relationName,
    ctx.diagnostics,
    path,
    label,
  );
  validatePolicyReferencesAndLiterals(
    value,
    path,
    label,
    ctx.diagnostics,
    ctx.policyState,
    criticalContext,
  );
}

/**
 * The single recursion the value-shape validator family collapses to. `spec`
 * selects which composite forms are accepted/recursed and how leaves are
 * validated; `criticalContext` threads the inline-critical-literal flag for the
 * numeric dispatch-value case.
 */
function validateValueShape(
  value: unknown,
  ctx: ValueShapeCtx,
  spec: ValueShapeSpec,
  criticalContext: boolean,
  path: string,
  label: string,
): void {
  const emitInvalid = (): void => {
    if (!spec.invalidCode || !spec.invalidMessage) return;
    ctx.diagnostics.push(makeDiagnostic(spec.invalidCode, spec.invalidMessage(label), path));
  };

  if (value === null || value === undefined) {
    if (!spec.acceptNull) emitInvalid();
    return;
  }
  if (typeof value === "number") {
    if (
      spec.numberCriticalCheck &&
      ctx.policyState.policyTree &&
      criticalContext &&
      !isAllowedInlinePolicyLiteral(String(value))
    ) {
      ctx.diagnostics.push(
        makeDiagnostic(
          "E_POLICY_LITERAL_CRITICAL",
          `${label} uses inline critical numeric literal '${String(value)}'; use params.policy.*`,
          path,
        ),
      );
    }
    return;
  }
  if (typeof value === "boolean") {
    if (!spec.acceptBoolean) emitInvalid();
    return;
  }
  if (typeof value === "string") {
    if (spec.validateLeaves) {
      validateCelExpressionLeaf(
        value,
        ctx,
        path,
        label,
        spec.celSkipEmpty,
        spec.celUsesCriticalContext ? criticalContext : false,
      );
    }
    return;
  }
  if (spec.handleDispatch && isPlainObject(value) && Object.hasOwn(value, "dispatch")) {
    validateDispatchSpec(
      (value as PlainObject).dispatch,
      ctx.relationByName,
      ctx.relationName,
      ctx.relationNames,
      ctx.policyState,
      false,
      spec.dispatchMode,
      ctx.diagnostics,
      `${path}.dispatch`,
      label,
    );
    return;
  }
  if (Array.isArray(value)) {
    if (spec.recurseContainers) {
      for (let i = 0; i < value.length; i += 1) {
        validateValueShape(value[i], ctx, spec, criticalContext, `${path}[${i}]`, label);
      }
      return;
    }
    emitInvalid();
    return;
  }
  if (isPlainObject(value)) {
    if (spec.recurseContainers) {
      for (const [key, nested] of Object.entries(value)) {
        validateValueShape(nested, ctx, spec, criticalContext, `${path}.${key}`, label);
      }
      return;
    }
    emitInvalid();
    return;
  }
  emitInvalid();
}

function validateDispatchValueExpression(
  expr: unknown,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  relationNames: Set<string>,
  policyState: PolicyValidationState,
  criticalContext: boolean,
  valueMode: "numeric" | "set",
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
): void {
  validateValueShape(
    expr,
    { relationByName, relationName, relationNames, policyState, diagnostics },
    valueMode === "set" ? SET_VALUE_SHAPE : DISPATCH_VALUE_NUMERIC_SHAPE,
    criticalContext,
    path,
    contextLabel,
  );
}

function validateDispatchSpec(
  dispatchValue: unknown,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  relationNames: Set<string>,
  policyState: PolicyValidationState,
  criticalContext: boolean,
  valueMode: "numeric" | "set",
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
): void {
  if (!Array.isArray(dispatchValue)) {
    diagnostics.push(
      makeDiagnostic(
        "E_RULE_EXPRESSION_INVALID",
        `${contextLabel} must be an array of dispatch rows`,
        path,
      ),
    );
    return;
  }

  let hasDefault = false;
  for (let i = 0; i < dispatchValue.length; i += 1) {
    const row = dispatchValue[i];
    const rowPath = `${path}[${i}]`;
    if (!isPlainObject(row)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_EXPRESSION_INVALID",
          `${contextLabel} row ${i} must be an object`,
          rowPath,
        ),
      );
      continue;
    }

    const rowHasWhen = Object.hasOwn(row, "when");
    const rowHasDefault = Object.hasOwn(row, "default");
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
              `${rowPath}.when`,
            ),
          );
        }
      } else if (typeof row.when !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${contextLabel} row ${i} when must be a string expression or condition object`,
            `${rowPath}.when`,
          ),
        );
      } else {
        const syntaxError = validateExpressionSyntax(row.when, { relationNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${contextLabel} row ${i} has invalid CEL when expression: ${syntaxError}`,
              `${rowPath}.when`,
            ),
          );
        } else {
          validatePolicyReferencesAndLiterals(
            row.when,
            `${rowPath}.when`,
            `${contextLabel} row ${i} when`,
            diagnostics,
            policyState,
            criticalContext,
          );
        }
      }

      if (!Object.hasOwn(row, "value")) {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${contextLabel} row ${i} must include value`,
            `${rowPath}.value`,
          ),
        );
      } else {
        validateDispatchValueExpression(
          row.value,
          relationByName,
          relationName,
          relationNames,
          policyState,
          criticalContext,
          valueMode,
          diagnostics,
          `${rowPath}.value`,
          `${contextLabel} row ${i} value`,
        );
      }
    }

    if (rowHasDefault) {
      hasDefault = true;
      validateDispatchValueExpression(
        row.default,
        relationByName,
        relationName,
        relationNames,
        policyState,
        criticalContext,
        valueMode,
        diagnostics,
        `${rowPath}.default`,
        `${contextLabel} row ${i} default`,
      );
    }
  }

  if (!hasDefault) {
    diagnostics.push(
      makeDiagnostic(
        "E_DISPATCH_NO_DEFAULT",
        `${contextLabel} is missing required default dispatch row`,
        path,
      ),
    );
  }
}

function validateSetValueExpression(
  value: unknown,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  relationNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
): void {
  validateValueShape(
    value,
    { relationByName, relationName, relationNames, policyState, diagnostics },
    SET_VALUE_SHAPE,
    false,
    path,
    contextLabel,
  );
}

/**
 * Validate one effect row of a `rules[].apply` or `rules[].contour.apply`
 * block. Both sites share this exact logic; only the path/label prefix and the
 * (apply-only) `for_each_field` leftover check differ. `pathPrefix` is e.g.
 * `rules.foo.apply` and `labelPrefix` is e.g. `Rule 'foo' apply`; the caller's
 * index `i` is appended here so error codes/paths/messages stay identical.
 */
function validateApplyEffect(
  effect: unknown,
  i: number,
  pathPrefix: string,
  labelPrefix: string,
  checkForEachField: boolean,
  relationByName: Map<string, unknown>,
  ruleRelationName: unknown,
  relationNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
): void {
  const itemPath = `${pathPrefix}[${i}]`;
  const itemLabel = `${labelPrefix}[${i}]`;
  const effectSpec = isPlainObject(effect) ? effect : {};
  // Chunk 7: `for_each_field` is expanded at parse-time (see
  // parser.ts:expandForEachField). If it survived to validation, the parser
  // was bypassed — defense-in-depth diagnostic (apply block only).
  if (checkForEachField && Object.hasOwn(effectSpec, "for_each_field")) {
    diagnostics.push(
      makeDiagnostic(
        "E_FOR_EACH_FIELD_UNEXPANDED",
        `${itemLabel} still has 'for_each_field'; expected parse-time expansion`,
        `${itemPath}.for_each_field`,
      ),
    );
  }
  const hasValue = Object.hasOwn(effectSpec, "value");
  const hasDispatch = Object.hasOwn(effectSpec, "dispatch");
  if (hasValue && hasDispatch) {
    diagnostics.push(
      makeDiagnostic(
        "E_DISPATCH_AND_VALUE",
        `${itemLabel} cannot specify both value and dispatch`,
        itemPath,
      ),
    );
  }
  if (hasDispatch) {
    const criticalContext = isCriticalScalarField(effectSpec.field);
    validateDispatchSpec(
      effectSpec.dispatch,
      relationByName,
      ruleRelationName,
      relationNames,
      policyState,
      criticalContext,
      effectSpec.op === "set" ? "set" : "numeric",
      diagnostics,
      `${itemPath}.dispatch`,
      `${itemLabel} dispatch`,
    );
  } else if (hasValue) {
    const criticalContext = isCriticalScalarField(effectSpec.field);
    const valueMode = effectSpec.op === "set" ? "set" : "numeric";
    if (
      valueMode === "numeric" &&
      effectSpec.value != null &&
      typeof effectSpec.value !== "string" &&
      typeof effectSpec.value !== "number"
    ) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_EXPRESSION_INVALID",
          `${itemLabel} has non-string/non-number value expression`,
          `${itemPath}.value`,
        ),
      );
    }
    if (
      valueMode === "numeric" &&
      typeof effectSpec.value === "number" &&
      policyState.policyTree &&
      criticalContext
    ) {
      if (!isAllowedInlinePolicyLiteral(String(effectSpec.value))) {
        diagnostics.push(
          makeDiagnostic(
            "E_POLICY_LITERAL_CRITICAL",
            `${itemLabel} value uses inline critical numeric literal '${String(
              effectSpec.value,
            )}'; use params.policy.*`,
            `${itemPath}.value`,
          ),
        );
      }
    }
    if (valueMode === "set") {
      validateSetValueExpression(
        effectSpec.value,
        relationByName,
        ruleRelationName,
        relationNames,
        policyState,
        diagnostics,
        `${itemPath}.value`,
        `${itemLabel} value`,
      );
    } else if (typeof effectSpec.value === "string" && effectSpec.value.length > 0) {
      const syntaxError = validateExpressionSyntax(effectSpec.value, { relationNames });
      if (syntaxError) {
        diagnostics.push(
          makeDiagnostic(
            "E_CEL_INVALID",
            `${itemLabel} has invalid CEL value expression: ${syntaxError}`,
            `${itemPath}.value`,
          ),
        );
      } else {
        validateDeclaredTypeFieldUsage(
          effectSpec.value,
          relationByName,
          ruleRelationName,
          diagnostics,
          `${itemPath}.value`,
          `${itemLabel} value`,
        );
        validatePolicyReferencesAndLiterals(
          effectSpec.value,
          `${itemPath}.value`,
          `${itemLabel} value`,
          diagnostics,
          policyState,
          criticalContext,
        );
      }
    }
  }
}

function validateTemplateDispatchExpressions(
  value: unknown,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  relationNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
): void {
  validateValueShape(
    value,
    { relationByName, relationName, relationNames, policyState, diagnostics },
    TEMPLATE_DISPATCH_WALK_SHAPE,
    false,
    path,
    contextLabel,
  );
}

function validateTemplateNumericExpression(
  value: unknown,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  relationNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
): void {
  validateValueShape(
    value,
    { relationByName, relationName, relationNames, policyState, diagnostics },
    TEMPLATE_NUMERIC_SHAPE,
    false,
    path,
    contextLabel,
  );
}

function validateControlWindowTemplate(
  value: unknown,
  relationByName: Map<string, unknown>,
  relationName: unknown,
  relationNames: Set<string>,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
  path: string,
  contextLabel: string,
): void {
  if (value == null) return;
  if (isPlainObject(value) && Object.hasOwn(value, "dispatch")) {
    validateDispatchSpec(
      value.dispatch,
      relationByName,
      relationName,
      relationNames,
      policyState,
      false,
      "set",
      diagnostics,
      `${path}.dispatch`,
      contextLabel,
    );
    return;
  }
  if (typeof value === "string") {
    const syntaxError = validateExpressionSyntax(value, { relationNames });
    if (syntaxError) {
      diagnostics.push(
        makeDiagnostic(
          "E_CEL_INVALID",
          `${contextLabel} has invalid CEL expression: ${syntaxError}`,
          path,
        ),
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
        path,
      ),
    );
    return;
  }

  for (let i = 0; i < value.length; i += 1) {
    const entry = value[i];
    const entryPath = `${path}[${i}]`;
    const entryLabel = `${contextLabel}[${i}]`;
    if (!isPlainObject(entry)) {
      diagnostics.push(
        makeDiagnostic("E_CONTROL_WINDOW_SCHEMA", `${entryLabel} must be an object`, entryPath),
      );
      continue;
    }

    if (entry.target != null) {
      if (typeof entry.target !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTROL_WINDOW_SCHEMA",
            `${entryLabel}.target must be a string expression`,
            `${entryPath}.target`,
          ),
        );
      } else if (!["current", "next", "prev"].includes(entry.target)) {
        const syntaxError = validateExpressionSyntax(entry.target, { relationNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${entryLabel}.target has invalid CEL expression: ${syntaxError}`,
              `${entryPath}.target`,
            ),
          );
        }
      }
    }

    validateTemplateNumericExpression(
      entry.start_ms,
      relationByName,
      relationName,
      relationNames,
      policyState,
      diagnostics,
      `${entryPath}.start_ms`,
      `${entryLabel}.start_ms`,
    );
    validateTemplateNumericExpression(
      entry.end_ms,
      relationByName,
      relationName,
      relationNames,
      policyState,
      diagnostics,
      `${entryPath}.end_ms`,
      `${entryLabel}.end_ms`,
    );
    validateTemplateNumericExpression(
      entry.start_ratio,
      relationByName,
      relationName,
      relationNames,
      policyState,
      diagnostics,
      `${entryPath}.start_ratio`,
      `${entryLabel}.start_ratio`,
    );
    validateTemplateNumericExpression(
      entry.end_ratio,
      relationByName,
      relationName,
      relationNames,
      policyState,
      diagnostics,
      `${entryPath}.end_ratio`,
      `${entryLabel}.end_ratio`,
    );
    validateTemplateNumericExpression(
      entry.prefix_ms,
      relationByName,
      relationName,
      relationNames,
      policyState,
      diagnostics,
      `${entryPath}.prefix_ms`,
      `${entryLabel}.prefix_ms`,
    );
    validateTemplateNumericExpression(
      entry.suffix_ms,
      relationByName,
      relationName,
      relationNames,
      policyState,
      diagnostics,
      `${entryPath}.suffix_ms`,
      `${entryLabel}.suffix_ms`,
    );

    const fieldsSpec = entry.fields;
    if (typeof fieldsSpec === "string") {
      validateCelExpressionLeaf(
        fieldsSpec,
        { relationByName, relationName, relationNames, policyState, diagnostics },
        `${entryPath}.fields`,
        `${entryLabel}.fields`,
        false,
        false,
      );
    } else if (!isPlainObject(fieldsSpec)) {
      diagnostics.push(
        makeDiagnostic(
          "E_CONTROL_WINDOW_SCHEMA",
          `${entryLabel}.fields must be an object`,
          `${entryPath}.fields`,
        ),
      );
    } else {
      validateTemplateDispatchExpressions(
        fieldsSpec,
        relationByName,
        relationName,
        relationNames,
        policyState,
        diagnostics,
        `${entryPath}.fields`,
        `${entryLabel}.fields`,
      );
      for (const [fieldName, fieldSpec] of Object.entries(fieldsSpec)) {
        if (!isPlainObject(fieldSpec)) {
          validateTemplateNumericExpression(
            fieldSpec,
            relationByName,
            relationName,
            relationNames,
            policyState,
            diagnostics,
            `${entryPath}.fields.${fieldName}`,
            `${entryLabel}.fields.${fieldName}`,
          );
          continue;
        }

        const opSpec = fieldSpec.op;
        if (typeof opSpec !== "string") {
          diagnostics.push(
            makeDiagnostic(
              "E_CONTROL_WINDOW_SCHEMA",
              `${entryLabel}.fields.${fieldName}.op must be a string expression`,
              `${entryPath}.fields.${fieldName}.op`,
            ),
          );
        } else if (!["set", "add", "mul", "max", "min", "unset"].includes(opSpec)) {
          const syntaxError = validateExpressionSyntax(opSpec, { relationNames });
          if (syntaxError) {
            diagnostics.push(
              makeDiagnostic(
                "E_CEL_INVALID",
                `${entryLabel}.fields.${fieldName}.op has invalid CEL expression: ${syntaxError}`,
                `${entryPath}.fields.${fieldName}.op`,
              ),
            );
          }
        }

        if (Object.hasOwn(fieldSpec, "value")) {
          validateTemplateNumericExpression(
            fieldSpec.value,
            relationByName,
            relationName,
            relationNames,
            policyState,
            diagnostics,
            `${entryPath}.fields.${fieldName}.value`,
            `${entryLabel}.fields.${fieldName}.value`,
          );
        } else if (opSpec !== "unset") {
          diagnostics.push(
            makeDiagnostic(
              "E_CONTROL_WINDOW_SCHEMA",
              `${entryLabel}.fields.${fieldName}.value is required unless op is unset`,
              `${entryPath}.fields.${fieldName}.value`,
            ),
          );
        }
      }
    }

    if (entry.params != null) {
      diagnostics.push(
        makeDiagnostic(
          "E_CONTROL_WINDOW_SCHEMA",
          `${entryLabel}.params is no longer supported; use .fields`,
          `${entryPath}.params`,
        ),
      );
    }

    if (entry.tag != null) {
      if (typeof entry.tag !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${entryLabel}.tag must be a string expression`,
            `${entryPath}.tag`,
          ),
        );
      } else {
        const syntaxError = validateExpressionSyntax(entry.tag, { relationNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${entryLabel}.tag has invalid CEL expression: ${syntaxError}`,
              `${entryPath}.tag`,
            ),
          );
        }
      }
    }
  }
}

function validateRules(
  spec: PlainObject,
  relationByName: Map<string, unknown>,
  predicates: PlainObject,
  policyState: PolicyValidationState,
  diagnostics: ValidationDiagnostic[],
): void {
  const relationNames = new Set(relationByName.keys());
  const patterns = isPlainObject(spec.patterns) ? spec.patterns : {};
  const rules = isPlainObject(spec.rules) ? spec.rules : {};

  for (const [name, rule] of Object.entries(rules)) {
    if (!isPlainObject(rule)) {
      diagnostics.push(
        makeDiagnostic("E_RULE_SCHEMA", `Rule '${name}' must be an object`, `rules.${name}`),
      );
      continue;
    }
    const r = rule as PlainObject;

    const select = isPlainObject(r.select) ? r.select : null;
    const matchName = typeof r.match === "string" && r.match.length > 0 ? r.match : null;
    const hasSelect = select !== null;
    const hasMatch = matchName !== null;
    const hasCustomOp = typeof r.op === "string" && r.op.length > 0;
    const matchPattern = matchName ? patterns[matchName] : null;
    const ruleRelationName = hasSelect
      ? select.relation
      : isPlainObject(matchPattern)
        ? matchPattern.relation
        : null;
    if ((hasSelect && hasMatch) || (!hasSelect && !hasMatch && !hasCustomOp)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_SHAPE",
          `Rule '${name}' must define exactly one of select or match`,
          `rules.${name}`,
        ),
      );
    }
    if (hasCustomOp && !ALLOWED_CUSTOM_RULE_OPS.has(String(r.op))) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_OP_UNKNOWN",
          `Rule '${name}' uses unsupported custom op '${String(r.op)}'`,
          `rules.${name}.op`,
        ),
      );
    }

    if (select) {
      const relation = typeof select.relation === "string" ? select.relation : "";
      if (!relationByName.has(relation)) {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_RELATION_UNKNOWN",
            `Rule '${name}' references unknown select relation '${relation}'`,
            `rules.${name}.select.relation`,
          ),
        );
      }
      validateConditionSpec(
        select.where,
        relationByName,
        select.relation,
        relationNames,
        predicates,
        diagnostics,
        `rules.${name}.select.where`,
        `Rule '${name}' select.where`,
        { expandPredicateBodies: true, policyState },
      );
    }

    if (matchName && !Object.hasOwn(patterns, matchName)) {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_PATTERN_UNKNOWN",
          `Rule '${name}' references unknown pattern '${matchName}'`,
          `rules.${name}.match`,
        ),
      );
    }

    validateConditionSpec(
      r.constraint,
      relationByName,
      ruleRelationName,
      relationNames,
      predicates,
      diagnostics,
      `rules.${name}.constraint`,
      `Rule '${name}' constraint`,
      { expandPredicateBodies: true, policyState },
    );

    if (r.define && typeof r.define === "object" && !Array.isArray(r.define)) {
      for (const [defineKey, defineExpr] of Object.entries(r.define)) {
        if (typeof defineExpr !== "string") {
          diagnostics.push(
            makeDiagnostic(
              "E_RULE_EXPRESSION_INVALID",
              `Rule '${name}' define.${defineKey} must be a string expression`,
              `rules.${name}.define.${defineKey}`,
            ),
          );
          continue;
        }
        const syntaxError = validateExpressionSyntax(defineExpr, { relationNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `Rule '${name}' has invalid CEL define.${defineKey} expression: ${syntaxError}`,
              `rules.${name}.define.${defineKey}`,
            ),
          );
        } else {
          validateDeclaredTypeFieldUsage(
            defineExpr,
            relationByName,
            ruleRelationName,
            diagnostics,
            `rules.${name}.define.${defineKey}`,
            `Rule '${name}' define.${defineKey}`,
          );
          validatePolicyReferencesAndLiterals(
            defineExpr,
            `rules.${name}.define.${defineKey}`,
            `Rule '${name}' define.${defineKey}`,
            diagnostics,
            policyState,
          );
        }
      }
    }

    if (Array.isArray(r.apply)) {
      for (let i = 0; i < r.apply.length; i += 1) {
        validateApplyEffect(
          r.apply[i],
          i,
          `rules.${name}.apply`,
          `Rule '${name}' apply`,
          true,
          relationByName,
          ruleRelationName,
          relationNames,
          policyState,
          diagnostics,
        );
      }
    }

    if (isPlainObject(r.contour)) {
      if (!hasSelect) {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTOUR_SELECT_REQUIRED",
            `Rule '${name}' contour requires a select rule shape`,
            `rules.${name}.contour`,
          ),
        );
      }

      if (Object.hasOwn(r.contour, "domain") && r.contour.domain !== "phrase") {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTOUR_DOMAIN_INVALID",
            `Rule '${name}' contour.domain must be 'phrase'`,
            `rules.${name}.contour.domain`,
          ),
        );
      }

      if (Object.hasOwn(r.contour, "reset_break_index")) {
        const breakIndex = Number(r.contour.reset_break_index);
        if (!Number.isFinite(breakIndex) || breakIndex < 1) {
          diagnostics.push(
            makeDiagnostic(
              "E_CONTOUR_RESET_BREAK_INVALID",
              `Rule '${name}' contour.reset_break_index must be a finite number >= 1`,
              `rules.${name}.contour.reset_break_index`,
            ),
          );
        }
      }

      if (Object.hasOwn(r.contour, "reset_where")) {
        const resetWhere = r.contour.reset_where;
        const syntaxError =
          typeof resetWhere === "string"
            ? validateExpressionSyntax(resetWhere, { relationNames })
            : "reset_where must be a CEL expression string";
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `Rule '${name}' contour.reset_where has invalid CEL expression: ${syntaxError}`,
              `rules.${name}.contour.reset_where`,
            ),
          );
        }
      }

      if (!Array.isArray(r.contour.apply) || r.contour.apply.length === 0) {
        diagnostics.push(
          makeDiagnostic(
            "E_CONTOUR_APPLY_REQUIRED",
            `Rule '${name}' contour.apply must be a non-empty array`,
            `rules.${name}.contour.apply`,
          ),
        );
      } else {
        for (let i = 0; i < r.contour.apply.length; i += 1) {
          validateApplyEffect(
            r.contour.apply[i],
            i,
            `rules.${name}.contour.apply`,
            `Rule '${name}' contour.apply`,
            false,
            relationByName,
            ruleRelationName,
            relationNames,
            policyState,
            diagnostics,
          );
        }
      }
    }

    if (isPlainObject(r.scan)) {
      if (!hasSelect) {
        diagnostics.push(
          makeDiagnostic(
            "E_SCAN_SELECT_REQUIRED",
            `Rule '${name}' scan requires a select rule shape`,
            `rules.${name}.scan`,
          ),
        );
      }

      if (Object.hasOwn(r.scan, "domain") && r.scan.domain !== "phrase") {
        diagnostics.push(
          makeDiagnostic(
            "E_SCAN_DOMAIN_INVALID",
            `Rule '${name}' scan.domain must be 'phrase'`,
            `rules.${name}.scan.domain`,
          ),
        );
      }

      if (Object.hasOwn(r.scan, "reset_break_index")) {
        const breakIndex = Number(r.scan.reset_break_index);
        if (!Number.isFinite(breakIndex) || breakIndex < 1) {
          diagnostics.push(
            makeDiagnostic(
              "E_SCAN_RESET_BREAK_INVALID",
              `Rule '${name}' scan.reset_break_index must be a finite number >= 1`,
              `rules.${name}.scan.reset_break_index`,
            ),
          );
        }
      }

      if (Object.hasOwn(r.scan, "reset_where")) {
        const resetWhere = r.scan.reset_where;
        const syntaxError =
          typeof resetWhere === "string"
            ? validateExpressionSyntax(resetWhere, { relationNames })
            : "reset_where must be a CEL expression string";
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `Rule '${name}' scan.reset_where has invalid CEL expression: ${syntaxError}`,
              `rules.${name}.scan.reset_where`,
            ),
          );
        }
      }
    }

    if (isPlainObject(r.splice) && Array.isArray(r.splice.insert)) {
      for (let i = 0; i < r.splice.insert.length; i += 1) {
        validateTemplateDispatchExpressions(
          r.splice.insert[i],
          relationByName,
          ruleRelationName,
          relationNames,
          policyState,
          diagnostics,
          `rules.${name}.splice.insert[${i}]`,
          `Rule '${name}' splice.insert[${i}]`,
        );
        const insertSpec = r.splice.insert[i];
        if (isPlainObject(insertSpec) && Object.hasOwn(insertSpec, "control_windows")) {
          validateControlWindowTemplate(
            insertSpec.control_windows,
            relationByName,
            ruleRelationName,
            relationNames,
            policyState,
            diagnostics,
            `rules.${name}.splice.insert[${i}].control_windows`,
            `Rule '${name}' splice.insert[${i}].control_windows`,
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
              `rules.${name}.insert_points[${i}]`,
            ),
          );
        }
      }
    }
    if (isPlainObject(r.insert_f0_layer)) {
      const relation = r.insert_f0_layer.relation;
      if (relation !== "PhraseCommand" && relation !== "Tilt") {
        diagnostics.push(
          makeDiagnostic(
            "E_F0_CONTROL_RELATION_INVALID",
            `Rule '${name}' f0_layer insert relation must be PhraseCommand or Tilt`,
            `rules.${name}.insert.relation`,
          ),
        );
      } else if (!relationByName.has(relation)) {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_RELATION_UNKNOWN",
            `Rule '${name}' references unknown F0 control relation '${relation}'`,
            `rules.${name}.insert.relation`,
          ),
        );
      }
    }

    for (const { spec: pointSpec, path: pointPath, label: pointLabel } of pointInsertSpecs) {
      const valueExpr = pointSpec.value;
      if (valueExpr != null && typeof valueExpr !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `${pointLabel} has non-string value expression`,
            `${pointPath}.value`,
          ),
        );
      }
      if (typeof valueExpr === "string" && valueExpr.includes("next_point(")) {
        diagnostics.push(
          makeDiagnostic(
            "E_POINT_FWD_REF",
            `${pointLabel} uses next_point forward reference in point value`,
            `${pointPath}.value`,
          ),
        );
      }
      if (typeof valueExpr === "string" && valueExpr.length > 0) {
        const syntaxError = validateExpressionSyntax(valueExpr, { relationNames });
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${pointLabel} has invalid CEL value expression: ${syntaxError}`,
              `${pointPath}.value`,
            ),
          );
        } else {
          validateDeclaredTypeFieldUsage(
            valueExpr,
            relationByName,
            ruleRelationName,
            diagnostics,
            `${pointPath}.value`,
            `${pointLabel}.value`,
          );
          validatePolicyReferencesAndLiterals(
            valueExpr,
            `${pointPath}.value`,
            `${pointLabel}.value`,
            diagnostics,
            policyState,
            typeof pointSpec.relation === "string" && pointSpec.relation.toLowerCase() === "f0",
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
            `${pointPath}.when`,
          ),
        );
      }
      if (typeof whenExpr === "string" && whenExpr.length > 0) {
        const whenSyntaxError = validateExpressionSyntax(whenExpr, { relationNames });
        if (whenSyntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_CEL_INVALID",
              `${pointLabel} has invalid CEL when expression: ${whenSyntaxError}`,
              `${pointPath}.when`,
            ),
          );
        }
      }
    }
  }
}

// Chunk 3: validate pipeline-level `string_sets:` block.
// Shape: Record<non-empty string, string[]> where every element is a string.
const stringSetsSchema = S.record({
  code: "E_STRING_SET_INVALID",
  notObject: "string_sets must be an object mapping name to an array of strings",
  keyCheck: (name, keyPath, sink) => {
    if (typeof name !== "string" || name.length === 0) {
      sink.push(
        makeDiagnostic(
          "E_STRING_SET_INVALID",
          `string_sets name must be a non-empty string (got '${String(name)}')`,
          keyPath,
        ),
      );
      return false;
    }
  },
  value: (name) =>
    S.array({
      code: "E_STRING_SET_INVALID",
      notArray: `string_sets['${name}'] must be an array of strings`,
      element: (i) => (v, p, sink) => {
        if (typeof v !== "string") {
          sink.push(
            makeDiagnostic(
              "E_STRING_SET_INVALID",
              `string_sets['${name}'][${i}] must be a string (got ${typeof v})`,
              p,
            ),
          );
        }
      },
    }),
});

function validateStringSets(spec: PlainObject, diagnostics: ValidationDiagnostic[]): void {
  if (!Object.hasOwn(spec, "string_sets")) return;
  stringSetsSchema(spec.string_sets, "string_sets", diagnostics);
}

function hasCitationArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

function validateCitedNumber(
  value: unknown,
  diagnostics: ValidationDiagnostic[],
  path: string,
  label: string,
): void {
  if (!isPlainObject(value)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_NUMBER",
        `${label} must be a { value, citations } object`,
        path,
      ),
    );
    return;
  }
  if (typeof value.value !== "number" || !Number.isFinite(value.value)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_NUMBER",
        `${label}.value must be a finite number`,
        `${path}.value`,
      ),
    );
  }
  if (!hasCitationArray(value.citations)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_CITATION",
        `${label}.citations must contain at least one citation`,
        `${path}.citations`,
      ),
    );
  }
}

function validateStringArray(
  value: unknown,
  diagnostics: ValidationDiagnostic[],
  path: string,
  label: string,
): void {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== "string" || entry.length === 0)
  ) {
    diagnostics.push(
      makeDiagnostic("E_LOWERING_SPEC_ARRAY", `${label} must be a non-empty string array`, path),
    );
  }
}

const eventPointsSchema = S.object({
  code: "E_LOWERING_SPEC_REQUIRED",
  notObject: "output.lowering.timeline.event_points must be an object",
  fields: [
    "include_segment_start",
    "include_control_boundaries",
    "include_f0_anchors",
    "include_transition_steady_time",
  ].map((key) => ({
    key,
    schema: S.boolean("E_LOWERING_SPEC_BOOLEAN", (p) => `${p} must be boolean`),
  })),
});

function validateEventPointPolicy(value: unknown, diagnostics: ValidationDiagnostic[]): void {
  eventPointsSchema(value, "output.lowering.timeline.event_points", diagnostics);
}

// Shared structural-schema vocabulary for the lowering-spec data tables. Code is
// always E_LOWERING_SPEC_REQUIRED and messages are `${path} <suffix>` (subject
// equals path), so the combinators reproduce the hand-rolled diagnostics exactly.
const LS_REQ = "E_LOWERING_SPEC_REQUIRED";
const mustBeObject: S.Msg = (p) => `${p} must be an object`;
const mustBeFiniteNumber: S.Msg = (p) => `${p} must be a finite number`;
const mustBeBoolean: S.Msg = (p) => `${p} must be a boolean`;

// One locus entry: { locus_hz, prcnt, durtran_ms } — each a required finite
// number (absent field and non-finite field both report "must be a finite
// number", matching the original per-field isFiniteNumber loop).
const locusEntrySchema = S.object({
  code: LS_REQ,
  notObject: mustBeObject,
  fields: ["locus_hz", "prcnt", "durtran_ms"].map((key) => ({
    key,
    schema: S.finiteNumber(LS_REQ, mustBeFiniteNumber),
  })),
});

// table[obstruent][sontyx "1"|"2"|"3"][formant] -> locus entry. The sontyx key
// enum is a key-level check that does not stop descent (matches the original).
const locusTableSchema = S.optional(
  S.record({
    code: LS_REQ,
    notObject: mustBeObject,
    value: () =>
      S.record({
        code: LS_REQ,
        notObject: mustBeObject,
        keyCheck: (key, keyPath, sink) => {
          if (key !== "1" && key !== "2" && key !== "3") {
            sink.push(makeDiagnostic(LS_REQ, `${keyPath} key must be "1", "2", or "3"`, keyPath));
          }
        },
        value: () =>
          S.record({ code: LS_REQ, notObject: mustBeObject, value: () => locusEntrySchema }),
      }),
  }),
);

/**
 * Validate one optional locus table (`loci` or `loci_female`) at `base`. Shape:
 *   table[obstruent][sontyx "1"|"2"|"3"][formant] -> {locus_hz, prcnt, durtran_ms}
 * Both tables share this structure (male us_maleloc / female us_femloc); only the
 * locus Hz differ. The engine treats a missing/partial entry as "no locus", so
 * this flags only structurally malformed data, not coverage gaps.
 */
function validateLocusTable(
  table: unknown,
  base: string,
  diagnostics: ValidationDiagnostic[],
): void {
  locusTableSchema(table, base, diagnostics);
}

/**
 * Validate the optional obstruent<->sonorant locus tables. `loci` (male),
 * `loci_female`, and `vowel_category` are all optional. When present:
 *   loci/loci_female[obstruent][sontyx][formant] -> {locus_hz, prcnt, durtran_ms}
 *   vowel_category[sonorant] -> {forward?: 1|2|3, backward?: 1|2|3}
 * The engine treats a missing/partial entry as "no locus" (legacy fallback), so
 * this only flags structurally malformed data, not coverage gaps.
 */
// Optional setloc prcnt-adjustment DATA (ph_sttr2.c:294-307). Each is a
// Record<phoneme, {flags}>; every flag field is optional (present-undefined and
// absent both skip). Boolean flags for obstruent_place/f2_back, {1,2,3} enum for
// vowel_category edges.
const obstruentPlaceSchema = S.optional(
  S.record({
    code: LS_REQ,
    notObject: mustBeObject,
    value: () =>
      S.object({
        code: LS_REQ,
        notObject: mustBeObject,
        fields: [
          { key: "palatal_or_dental", optional: true, schema: S.boolean(LS_REQ, mustBeBoolean) },
        ],
      }),
  }),
);
const f2BackSchema = S.optional(
  S.record({
    code: LS_REQ,
    notObject: mustBeObject,
    value: () =>
      S.object({
        code: LS_REQ,
        notObject: mustBeObject,
        fields: ["forward", "backward"].map((key) => ({
          key,
          optional: true,
          schema: S.boolean(LS_REQ, mustBeBoolean),
        })),
      }),
  }),
);
const vowelCategorySchema = S.optional(
  S.record({
    code: LS_REQ,
    notObject: mustBeObject,
    value: () =>
      S.object({
        code: LS_REQ,
        notObject: mustBeObject,
        fields: ["forward", "backward"].map((key) => ({
          key,
          optional: true,
          schema: S.enumOf([1, 2, 3], LS_REQ, (p) => `${p} must be 1, 2, or 3`),
        })),
      }),
  }),
);

function validateLocusTables(
  loci: unknown,
  lociFemale: unknown,
  vowelCategory: unknown,
  prcntAdjust: {
    obstruentPlace?: unknown;
    roundedSonorantConsonant?: unknown;
    f2Back?: unknown;
  },
  diagnostics: ValidationDiagnostic[],
): void {
  validateLocusTable(loci, "output.lowering.transitions.loci", diagnostics);
  validateLocusTable(lociFemale, "output.lowering.transitions.loci_female", diagnostics);

  const { obstruentPlace, roundedSonorantConsonant, f2Back } = prcntAdjust;
  obstruentPlaceSchema(obstruentPlace, "output.lowering.transitions.obstruent_place", diagnostics);
  if (roundedSonorantConsonant !== undefined) {
    validateStringArray(
      roundedSonorantConsonant,
      diagnostics,
      "output.lowering.transitions.rounded_sonorant_consonant",
      "output.lowering.transitions.rounded_sonorant_consonant",
    );
  }
  f2BackSchema(f2Back, "output.lowering.transitions.f2_back", diagnostics);
  vowelCategorySchema(vowelCategory, "output.lowering.transitions.vowel_category", diagnostics);
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
      makeDiagnostic("E_LOWERING_SPEC_REQUIRED", "Spec must declare output.lowering", "output"),
    );
    return;
  }
  const lowering = spec.output.lowering;
  if (!isPlainObject(lowering)) {
    if (options.requireLoweringSpec !== true) {
      return;
    }
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_REQUIRED",
        "Spec must declare output.lowering",
        "output.lowering",
      ),
    );
    return;
  }
  if (typeof lowering.id !== "string" || lowering.id.length === 0) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_REQUIRED",
        "output.lowering.id is required",
        "output.lowering.id",
      ),
    );
  }
  validateStringArray(
    lowering.columns,
    diagnostics,
    "output.lowering.columns",
    "output.lowering.columns",
  );

  const timeline = lowering.timeline;
  if (!isPlainObject(timeline)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_REQUIRED",
        "output.lowering.timeline must be an object",
        "output.lowering.timeline",
      ),
    );
  } else {
    validateCitedNumber(
      timeline.initial_silence_ms,
      diagnostics,
      "output.lowering.timeline.initial_silence_ms",
      "output.lowering.timeline.initial_silence_ms",
    );
    validateCitedNumber(
      timeline.final_silence_ms,
      diagnostics,
      "output.lowering.timeline.final_silence_ms",
      "output.lowering.timeline.final_silence_ms",
    );
    if (!isPlainObject(timeline.duration_floors)) {
      diagnostics.push(
        makeDiagnostic(
          "E_LOWERING_SPEC_REQUIRED",
          "output.lowering.timeline.duration_floors must be an object",
          "output.lowering.timeline.duration_floors",
        ),
      );
    } else {
      validateCitedNumber(
        timeline.duration_floors.stop_release_ms,
        diagnostics,
        "output.lowering.timeline.duration_floors.stop_release_ms",
        "output.lowering.timeline.duration_floors.stop_release_ms",
      );
      validateCitedNumber(
        timeline.duration_floors.default_ms,
        diagnostics,
        "output.lowering.timeline.duration_floors.default_ms",
        "output.lowering.timeline.duration_floors.default_ms",
      );
    }
    validateEventPointPolicy(timeline.event_points, diagnostics);
  }

  const transitions = lowering.transitions;
  if (!isPlainObject(transitions)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_REQUIRED",
        "output.lowering.transitions must be an object",
        "output.lowering.transitions",
      ),
    );
  } else {
    validateCitedNumber(
      transitions.default_transition_ms,
      diagnostics,
      "output.lowering.transitions.default_transition_ms",
      "output.lowering.transitions.default_transition_ms",
    );
    if (!isPlainObject(transitions.blend)) {
      diagnostics.push(
        makeDiagnostic(
          "E_LOWERING_SPEC_REQUIRED",
          "output.lowering.transitions.blend must be an object",
          "output.lowering.transitions.blend",
        ),
      );
    } else {
      validateCitedNumber(
        transitions.blend.factor,
        diagnostics,
        "output.lowering.transitions.blend.factor",
        "output.lowering.transitions.blend.factor",
      );
      validateStringArray(
        transitions.blend.keys,
        diagnostics,
        "output.lowering.transitions.blend.keys",
        "output.lowering.transitions.blend.keys",
      );
      validateStringArray(
        transitions.blend.smooth_types,
        diagnostics,
        "output.lowering.transitions.blend.smooth_types",
        "output.lowering.transitions.blend.smooth_types",
      );
      if (transitions.blend.step_keys_by_phoneme !== undefined) {
        const base = "output.lowering.transitions.blend.step_keys_by_phoneme";
        if (!isPlainObject(transitions.blend.step_keys_by_phoneme)) {
          diagnostics.push(
            makeDiagnostic("E_LOWERING_SPEC_REQUIRED", `${base} must be an object`, base),
          );
        } else {
          for (const [phoneme, keys] of Object.entries(transitions.blend.step_keys_by_phoneme)) {
            validateStringArray(keys, diagnostics, `${base}.${phoneme}`, `${base}.${phoneme}`);
          }
        }
      }
    }
    // Optional obstruent<->sonorant locus tables (DECtalk-style). The male
    // (`loci`), female (`loci_female`), and `vowel_category` blocks are all
    // optional; a frontend that omits them keeps midpoint-only smoothing.
    validateLocusTables(
      transitions.loci,
      transitions.loci_female,
      transitions.vowel_category,
      {
        obstruentPlace: transitions.obstruent_place,
        roundedSonorantConsonant: transitions.rounded_sonorant_consonant,
        f2Back: transitions.f2_back,
      },
      diagnostics,
    );
    if (transitions.locus_glue_types !== undefined) {
      validateStringArray(
        transitions.locus_glue_types,
        diagnostics,
        "output.lowering.transitions.locus_glue_types",
        "output.lowering.transitions.locus_glue_types",
      );
    }
    if (transitions.sonorant_f2 !== undefined) {
      const policy = transitions.sonorant_f2;
      if (!isPlainObject(policy)) {
        diagnostics.push(
          makeDiagnostic(
            "E_LOWERING_SPEC_REQUIRED",
            "output.lowering.transitions.sonorant_f2 must be an object",
            "output.lowering.transitions.sonorant_f2",
          ),
        );
      } else {
        if (typeof policy.key !== "string" || policy.key.length === 0) {
          diagnostics.push(
            makeDiagnostic(
              "E_LOWERING_SPEC_REQUIRED",
              "output.lowering.transitions.sonorant_f2.key is required",
              "output.lowering.transitions.sonorant_f2.key",
            ),
          );
        }
        validateCitedNumber(
          policy.span_ms,
          diagnostics,
          "output.lowering.transitions.sonorant_f2.span_ms",
          "output.lowering.transitions.sonorant_f2.span_ms",
        );
        validateCitedNumber(
          policy.neighbor_weight,
          diagnostics,
          "output.lowering.transitions.sonorant_f2.neighbor_weight",
          "output.lowering.transitions.sonorant_f2.neighbor_weight",
        );
        if (
          isPlainObject(policy.span_ms) &&
          typeof policy.span_ms.value === "number" &&
          policy.span_ms.value <= 0
        ) {
          diagnostics.push(
            makeDiagnostic(
              "E_LOWERING_SPEC_NUMBER",
              "output.lowering.transitions.sonorant_f2.span_ms.value must be positive",
              "output.lowering.transitions.sonorant_f2.span_ms.value",
            ),
          );
        }
        if (
          isPlainObject(policy.neighbor_weight) &&
          typeof policy.neighbor_weight.value === "number" &&
          (policy.neighbor_weight.value < 0 || policy.neighbor_weight.value > 1)
        ) {
          diagnostics.push(
            makeDiagnostic(
              "E_LOWERING_SPEC_NUMBER",
              "output.lowering.transitions.sonorant_f2.neighbor_weight.value must be within [0,1]",
              "output.lowering.transitions.sonorant_f2.neighbor_weight.value",
            ),
          );
        }
        if (typeof policy.current_type !== "string" || policy.current_type.length === 0) {
          diagnostics.push(
            makeDiagnostic(
              "E_LOWERING_SPEC_REQUIRED",
              "output.lowering.transitions.sonorant_f2.current_type is required",
              "output.lowering.transitions.sonorant_f2.current_type",
            ),
          );
        }
        validateStringArray(
          policy.neighbor_types,
          diagnostics,
          "output.lowering.transitions.sonorant_f2.neighbor_types",
          "output.lowering.transitions.sonorant_f2.neighbor_types",
        );
        for (const direction of ["forward", "backward"] as const) {
          if (typeof policy[direction] !== "boolean") {
            diagnostics.push(
              makeDiagnostic(
                "E_LOWERING_SPEC_BOOLEAN",
                `output.lowering.transitions.sonorant_f2.${direction} must be boolean`,
                `output.lowering.transitions.sonorant_f2.${direction}`,
              ),
            );
          }
        }
      }
    }
  }

  const f0 = lowering.f0;
  if (!isPlainObject(f0)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_REQUIRED",
        "output.lowering.f0 must be an object",
        "output.lowering.f0",
      ),
    );
  } else {
    const rendererType = isPlainObject(f0.renderer) ? f0.renderer.type : undefined;
    if (rendererType !== "point_interpolation" && rendererType !== "layered_additive") {
      diagnostics.push(
        makeDiagnostic(
          "E_LOWERING_SPEC_RENDERER",
          "output.lowering.f0.renderer.type must be point_interpolation or layered_additive",
          "output.lowering.f0.renderer.type",
        ),
      );
    }
    if (
      rendererType === "layered_additive" &&
      (typeof f0.layered_model_ref !== "string" || f0.layered_model_ref.length === 0)
    ) {
      diagnostics.push(
        makeDiagnostic(
          "E_LOWERING_SPEC_REQUIRED",
          "output.lowering.f0.layered_model_ref is required for layered_additive",
          "output.lowering.f0.layered_model_ref",
        ),
      );
    }
    if (!isPlainObject(f0.output_clamp)) {
      diagnostics.push(
        makeDiagnostic(
          "E_LOWERING_SPEC_REQUIRED",
          "output.lowering.f0.output_clamp must be an object",
          "output.lowering.f0.output_clamp",
        ),
      );
    } else {
      validateCitedNumber(
        f0.output_clamp.min_hz,
        diagnostics,
        "output.lowering.f0.output_clamp.min_hz",
        "output.lowering.f0.output_clamp.min_hz",
      );
      validateCitedNumber(
        f0.output_clamp.max_hz,
        diagnostics,
        "output.lowering.f0.output_clamp.max_hz",
        "output.lowering.f0.output_clamp.max_hz",
      );
    }
  }

  const overlays = lowering.overlays;
  if (!isPlainObject(overlays)) {
    diagnostics.push(
      makeDiagnostic(
        "E_LOWERING_SPEC_REQUIRED",
        "output.lowering.overlays must be an object",
        "output.lowering.overlays",
      ),
    );
  } else {
    validateStringArray(
      overlays.operation_order,
      diagnostics,
      "output.lowering.overlays.operation_order",
      "output.lowering.overlays.operation_order",
    );
  }
}

// dt-10: validate the pipeline-level `syllabification:` block (DATA tables for
// the generic syllabify pass).  Shape:
//   nuclei: string (ascky chars that are syllable nuclei)
//   onset_clusters: string[] (legal onset clusters in ascky chars)
//   affixes: string[] (affix strings in ascky chars)
//   ascky: Record<string, single-char string> (ARPABET symbol -> ascky char)
// Absent block is fine (frontend opts out of syllabification).
const SYLL_INVALID = "E_SYLLABIFICATION_INVALID";
const syllabificationSchema = S.object({
  code: SYLL_INVALID,
  notObject: "syllabification must be an object with nuclei/onset_clusters/affixes/ascky",
  fields: [
    {
      key: "nuclei",
      schema: S.nonEmptyString(
        SYLL_INVALID,
        "syllabification.nuclei must be a non-empty string of ascky chars",
      ),
    },
    ...(["onset_clusters", "affixes"] as const).map((key) => ({
      key,
      schema: S.array({
        code: SYLL_INVALID,
        notArray: `syllabification.${key} must be an array of strings`,
        element: (i: number) => (v: unknown, p: string, sink: S.Sink) => {
          if (typeof v !== "string") {
            sink.push(
              makeDiagnostic(
                SYLL_INVALID,
                `syllabification.${key}[${i}] must be a string (got ${typeof v})`,
                p,
              ),
            );
          }
        },
      }),
    })),
    {
      key: "ascky",
      schema: S.object({
        code: SYLL_INVALID,
        notObject:
          "syllabification.ascky must be an object mapping ARPABET symbol to a single ascky char",
        fields: [],
        refine: (obj, path, sink) => {
          for (const [k, v] of Object.entries(obj)) {
            if (typeof v !== "string" || v.length !== 1) {
              sink.push(
                makeDiagnostic(
                  SYLL_INVALID,
                  `syllabification.ascky['${k}'] must be a single character (got '${String(v)}')`,
                  `${path}.${k}`,
                ),
              );
            }
          }
        },
      }),
    },
  ],
});

function validateSyllabification(spec: PlainObject, diagnostics: ValidationDiagnostic[]): void {
  if (!Object.hasOwn(spec, "syllabification")) return;
  syllabificationSchema(spec.syllabification, "syllabification", diagnostics);
}

// Chunk 3: validate pipeline-level `maps:` block.
// Shape: Record<non-empty string, Record<string, string>> — a string→string
// lookup table for each named map. Numeric or nested-object values are
// rejected here; if a future caller needs them we can broaden the schema.
const mapsSchema = S.record({
  code: "E_MAP_INVALID",
  notObject: "maps must be an object mapping name to a string→string lookup table",
  keyCheck: (name, keyPath, sink) => {
    if (typeof name !== "string" || name.length === 0) {
      sink.push(
        makeDiagnostic(
          "E_MAP_INVALID",
          `maps name must be a non-empty string (got '${String(name)}')`,
          keyPath,
        ),
      );
      return false;
    }
  },
  value: (name) =>
    S.record({
      code: "E_MAP_INVALID",
      notObject: `maps['${name}'] must be an object with string keys and string values`,
      keyCheck: (k, kPath, sink) => {
        if (typeof k !== "string" || k.length === 0) {
          sink.push(
            makeDiagnostic(
              "E_MAP_INVALID",
              `maps['${name}'] keys must be non-empty strings (got '${String(k)}')`,
              kPath,
            ),
          );
          return false;
        }
      },
      value: (k) => (v, p, sink) => {
        if (typeof v !== "string") {
          sink.push(
            makeDiagnostic(
              "E_MAP_INVALID",
              `maps['${name}']['${k}'] must be a string (got ${typeof v})`,
              p,
            ),
          );
        }
      },
    }),
});

function validateMaps(spec: PlainObject, diagnostics: ValidationDiagnostic[]): void {
  if (!Object.hasOwn(spec, "maps")) return;
  mapsSchema(spec.maps, "maps", diagnostics);
}

export function validateDslSpec(
  spec: PlainObject,
  options: ValidateDslSpecOptions = {},
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const phases = Array.isArray(spec.phases) ? (spec.phases as PhaseSpec[]) : [];
  const rules = isPlainObject(spec.rules) ? spec.rules : {};
  const phaseByName = new Map();
  const phaseNames = [];
  const policyState = analyzePolicyState(spec.parameters);
  const relationByName = validateRelations(spec, diagnostics);
  validateTopology(spec, relationByName, diagnostics);
  const predicates = validatePredicates(spec, relationByName, policyState, diagnostics);
  validateStringSets(spec, diagnostics);
  validateLoweringSpec(spec, diagnostics, options);
  validateMaps(spec, diagnostics);
  validateSyllabification(spec, diagnostics);
  validatePatterns(spec, relationByName, predicates, policyState, diagnostics);
  validateRules(spec, relationByName, predicates, policyState, diagnostics);
  const scalarFields = collectScalarFields(spec);

  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    if (!phase.name) {
      diagnostics.push(
        makeDiagnostic("E_PHASE_NAME_MISSING", "Phase is missing name", `phases[${i}].name`),
      );
      continue;
    }
    if (phaseByName.has(phase.name)) {
      diagnostics.push(
        makeDiagnostic("E_PHASE_NAME_DUP", `Duplicate phase '${phase.name}'`, `phases[${i}].name`),
      );
      continue;
    }
    phaseByName.set(phase.name, phase);
    phaseNames.push(phase.name);
  }

  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    for (const dep of phase.after) {
      if (!phaseByName.has(dep)) {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_ORDER_VIOLATION",
            `Phase '${phase.name}' depends on unknown phase '${dep}'`,
            `phases[${i}].after`,
          ),
        );
      }
    }

    for (const ruleName of phase.rules) {
      if (!Object.hasOwn(rules, ruleName)) {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_UNKNOWN",
            `Phase '${phase.name}' references unknown rule '${ruleName}'`,
            `phases[${i}].rules`,
          ),
        );
      }
    }

    for (const pointRelation of phase.resolve_points) {
      const relation = relationByName.get(pointRelation);
      if (!isPlainObject(relation) || relation.type !== "point") {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_RESOLVE_POINT_RELATION_INVALID",
            `Phase '${phase.name}' resolves unknown/non-point relation '${pointRelation}'`,
            `phases[${i}].resolve_points`,
          ),
        );
      }
    }

    for (const scalarField of phase.resolve_scalars) {
      if (scalarFields.size > 0 && !scalarFields.has(scalarField)) {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_RESOLVE_SCALAR_UNKNOWN",
            `Phase '${phase.name}' resolves unknown scalar '${scalarField}'`,
            `phases[${i}].resolve_scalars`,
          ),
        );
      }
    }
  }

  const phaseIndex = new Map(phaseNames.map((name, index) => [name, index]));
  for (const phase of phases) {
    for (const dep of phase.after) {
      if (!phaseIndex.has(dep) || !phaseIndex.has(phase.name)) continue;
      if (phaseIndex.get(dep)! >= phaseIndex.get(phase.name)!) {
        diagnostics.push(
          makeDiagnostic(
            "E_PHASE_ORDER_VIOLATION",
            `Phase '${phase.name}' must come after '${dep}'`,
            `phases.${phase.name}.after`,
          ),
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
        "warning",
      ),
    );
  }

  for (const leafPath of policyState.leafPaths) {
    if (policyState.usedLeafPaths.has(leafPath)) continue;
    diagnostics.push(
      makeDiagnostic(
        "W_POLICY_PARAM_UNUSED",
        `Policy parameter 'params.policy.${leafPath}' is declared but unused`,
        `parameters.policy.${leafPath}`,
        "warning",
      ),
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
