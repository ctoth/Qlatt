import { compareOrder } from "./order";
import { validateExpressionSyntax } from "./expressions";

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

function asPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
  diagnostics: ValidationDiagnostic[]
): void {
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

      if (typeof step.where === "string" && step.where.length > 0) {
        const syntaxError = validateExpressionSyntax(step.where);
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_JSONATA_INVALID",
              `Pattern '${name}' step ${i} has invalid where expression: ${syntaxError}`,
              `patterns.${name}.sequence[${i}].where`
            )
          );
        }
      }
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

function validateRules(
  spec: PlainObject,
  streamByName: Map<string, any>,
  diagnostics: ValidationDiagnostic[]
): void {
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
      if (rule.select.where && typeof rule.select.where !== "string") {
        diagnostics.push(
          makeDiagnostic(
            "E_RULE_EXPRESSION_INVALID",
            `Rule '${name}' has non-string select.where expression`,
            `rules.${name}.select.where`
          )
        );
      }
      if (typeof rule.select.where === "string" && rule.select.where.length > 0) {
        const syntaxError = validateExpressionSyntax(rule.select.where);
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_JSONATA_INVALID",
              `Rule '${name}' has invalid select.where expression: ${syntaxError}`,
              `rules.${name}.select.where`
            )
          );
        }
      }
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

    if (rule.constraint && typeof rule.constraint !== "string") {
      diagnostics.push(
        makeDiagnostic(
          "E_RULE_EXPRESSION_INVALID",
          `Rule '${name}' has non-string constraint expression`,
          `rules.${name}.constraint`
        )
      );
    }
    if (typeof rule.constraint === "string" && rule.constraint.length > 0) {
      const syntaxError = validateExpressionSyntax(rule.constraint);
      if (syntaxError) {
        diagnostics.push(
          makeDiagnostic(
            "E_JSONATA_INVALID",
            `Rule '${name}' has invalid constraint expression: ${syntaxError}`,
            `rules.${name}.constraint`
          )
        );
      }
    }

    if (Array.isArray(rule.apply)) {
      for (let i = 0; i < rule.apply.length; i += 1) {
        const effect = rule.apply[i];
        if (effect?.value && typeof effect.value !== "string") {
          diagnostics.push(
            makeDiagnostic(
              "E_RULE_EXPRESSION_INVALID",
              `Rule '${name}' apply[${i}] has non-string value expression`,
              `rules.${name}.apply[${i}].value`
            )
          );
        }
        if (typeof effect?.value === "string" && effect.value.length > 0) {
          const syntaxError = validateExpressionSyntax(effect.value);
          if (syntaxError) {
            diagnostics.push(
              makeDiagnostic(
                "E_JSONATA_INVALID",
                `Rule '${name}' apply[${i}] has invalid value expression: ${syntaxError}`,
                `rules.${name}.apply[${i}].value`
              )
            );
          }
        }
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
      if (typeof valueExpr === "string" && valueExpr.includes("$next_point(")) {
        diagnostics.push(
          makeDiagnostic(
            "E_POINT_FWD_REF",
            `Rule '${name}' uses $next_point forward reference in point value`,
            `rules.${name}.insert_point.value`
          )
        );
      }
      if (typeof valueExpr === "string" && valueExpr.length > 0) {
        const syntaxError = validateExpressionSyntax(valueExpr);
        if (syntaxError) {
          diagnostics.push(
            makeDiagnostic(
              "E_JSONATA_INVALID",
              `Rule '${name}' has invalid insert_point.value expression: ${syntaxError}`,
              `rules.${name}.insert_point.value`
            )
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
  const streamByName = validateStreams(spec, diagnostics);
  validateTopology(spec, streamByName, diagnostics);
  validatePatterns(spec, streamByName, diagnostics);
  validateRules(spec, streamByName, diagnostics);
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
