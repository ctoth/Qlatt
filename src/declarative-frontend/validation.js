import { compareOrder } from "./order.js";

function makeDiagnostic(code, message, path, severity = "error") {
  return { code, message, path, severity };
}

export function validateDslSpec(spec) {
  const diagnostics = [];
  const phaseByName = new Map();
  const phaseNames = [];

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
  }

  const phaseIndex = new Map(phaseNames.map((name, index) => [name, index]));
  for (const phase of spec.phases) {
    for (const dep of phase.after) {
      if (!phaseIndex.has(dep) || !phaseIndex.has(phase.name)) continue;
      if (phaseIndex.get(dep) >= phaseIndex.get(phase.name)) {
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

export function assertValidSpec(spec) {
  const diagnostics = validateDslSpec(spec);
  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    const detail = errors.map((d) => `${d.code} at ${d.path}: ${d.message}`).join("\n");
    throw new Error(`Invalid declarative frontend spec:\n${detail}`);
  }
  return diagnostics;
}

export function validateSyncAxis(syncMarks) {
  const diagnostics = [];
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
