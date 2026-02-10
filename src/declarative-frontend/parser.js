import yaml from "js-yaml";

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function parseDslSpec(source) {
  let raw = source;

  if (typeof source === "string") {
    raw = yaml.load(source);
  }

  if (!asPlainObject(raw)) {
    throw new Error("DSL spec must be an object or YAML object document");
  }

  const phases = Array.isArray(raw.phases) ? raw.phases : [];
  const rules = asPlainObject(raw.rules) ? raw.rules : {};
  const parameters = asPlainObject(raw.parameters) ? raw.parameters : {};

  return {
    version: raw.version ?? null,
    parameters,
    phases: phases.map((phase) => ({
      name: phase?.name ?? "",
      after: Array.isArray(phase?.after) ? phase.after : [],
      rules: Array.isArray(phase?.rules) ? phase.rules : [],
      resolve_scalars: Array.isArray(phase?.resolve_scalars) ? phase.resolve_scalars : [],
      compute_times: Boolean(phase?.compute_times),
      resolve_points: Array.isArray(phase?.resolve_points) ? phase.resolve_points : [],
    })),
    rules,
  };
}
