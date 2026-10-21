import {
  type Registry as BaconRegistry,
  checkGraph,
  checkRegistry,
  type Graph,
  Validator,
} from "@bacon/core/pure";
import commonSchema from "@bacon/core/schemas/common.schema.json" with { type: "json" };
import graphSchema from "@bacon/core/schemas/graph.schema.json" with { type: "json" };
import registrySchema from "@bacon/core/schemas/registry.schema.json" with { type: "json" };
import type { Diagnostics } from "../diagnostics";
import { expandFormantBanks } from "../formant-bank";
import { getNativeNodeConstructor } from "../klatt-runtime";
import { createConfiguredEvaluator } from "../semantics/evaluator-factory";
import { isPlainObject, yamlDocumentSpans } from "../yaml-loader";
import type { ExperimentConfig } from "./load-experiment-config";

export type ConfigSource = {
  resource: string;
  path: readonly (string | number)[];
  line?: number;
  column?: number;
};
export type DocumentSources = Record<string, ConfigSource>;
export type ConfigSources = Record<"graph" | "registry" | "semantics", DocumentSources>;
export interface PreparedExperimentConfig extends ExperimentConfig {
  sources: ConfigSources;
  unreachable: { definition: string; source: ConfigSource }[];
}

export function sourcePath(parts: readonly (string | number)[]): string {
  return parts
    .map((part) => `/${String(part).replaceAll("~", "~0").replaceAll("/", "~1")}`)
    .join("");
}

export function documentSources(document: unknown, resource: string): DocumentSources {
  return Object.fromEntries([
    ["", { resource, path: [] }],
    ...yamlDocumentSpans(document).map(({ value }) => [sourcePath(value.path), value]),
  ]);
}

/** Remove inherited owners only where the composition actually replaces values. */
export function composeSources(
  parent: DocumentSources,
  child: DocumentSources,
  replacementPaths: readonly string[],
): DocumentSources {
  return {
    ...Object.fromEntries(
      Object.entries(parent).filter(
        ([path]) =>
          !replacementPaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)),
      ),
    ),
    ...child,
  };
}

export function constantReplacements(
  parent: unknown,
  child: unknown,
  path = "/constants",
): string[] {
  if (isPlainObject(parent) && isPlainObject(child)) {
    return Object.entries(child).flatMap(([key, value]) =>
      constantReplacements(parent[key], value, `${path}${sourcePath([key])}`),
    );
  }
  return [path];
}

/** Sole expansion/checking boundary. Returned data contains no evaluator or host objects. */
export function prepareExperimentConfig(
  source: ExperimentConfig,
  label = "programmatic experiment",
  diagnostics?: Diagnostics,
): PreparedExperimentConfig {
  const config = structuredClone(source);
  const { graph, registry, semantics } = config;
  const sources = config.sources ?? {
    graph: documentSources(source.graph, `${label}: graph`),
    registry: documentSources(source.registry, `${label}: registry`),
    semantics: documentSources(source.semantics, `${label}: semantics`),
  };
  const owner = (role: keyof ConfigSources, path: string): ConfigSource => {
    let prefix = path;
    while (!Object.hasOwn(sources[role], prefix) && prefix) {
      prefix = prefix.slice(0, prefix.lastIndexOf("/"));
    }
    return sources[role][prefix];
  };
  const reject = (
    role: keyof ConfigSources,
    path: string,
    message: string,
    code = "E_EXPERIMENT_CONFIG",
    data: Record<string, unknown> = {},
  ): never => {
    const source = owner(role, path);
    const detail = `${label}: ${source.resource}${source.line ? `:${source.line}:${source.column}` : ""} ${path}: ${message}`;
    diagnostics?.error(
      detail,
      { ...data, source, field: path, consequence: "operation rejected" },
      code,
    );
    throw new Error(`${code}: ${detail}`);
  };
  // Keep the Qlatt diagnostic ahead of generic Bacon/schema errors.
  for (const [id, node] of Object.entries(graph.nodes)) {
    const primitive = registry.primitives[node.type];
    if (primitive) {
      const field = sourcePath(["primitives", node.type]);
      for (const direction of ["inputs", "outputs"] as const) {
        const count = primitive[direction];
        if (count !== undefined && (!Number.isInteger(count) || count < 0)) {
          reject(
            "registry",
            `${field}/${direction}`,
            `Invalid ${direction} count for '${id}'`,
            "runtime.invalid_count",
            {
              nodeId: id,
              primitive: node.type,
              field: direction,
              requestedValue: count,
            },
          );
        }
      }
      if (
        (primitive.worklet || primitive.wasm) &&
        primitive.inputs === 0 &&
        primitive.outputs === 0
      ) {
        reject(
          "registry",
          field,
          `Worklet '${id}' must have inputs or outputs`,
          "runtime.invalid_count",
        );
      }
      if ((primitive.wasm || primitive.category?.includes("worklet")) && !primitive.worklet) {
        reject(
          "registry",
          field,
          `Missing required worklet/WASM declaration for '${id}'`,
          "runtime.invalid_primitive",
        );
      }
      if (primitive.native !== undefined || primitive.category === "webaudio") {
        try {
          getNativeNodeConstructor(primitive.native, node.type, () => {});
        } catch (error) {
          reject("registry", field, String(error), "runtime.invalid_primitive", {
            nodeId: id,
            primitive: node.type,
            native: primitive.native,
          });
        }
      }
    }
    for (const [name, value] of Object.entries(node.params ?? {})) {
      if (typeof value === "object" && value !== null && "expr" in value) {
        reject(
          "graph",
          sourcePath(["nodes", id, "params", name]),
          "Inline expressions ({ expr: ... }) are not supported; use a realize rule in semantics.yaml",
        );
      }
    }
  }
  const macro = graph.meta?.formantBanks;
  const beforeNodes = { ...graph.nodes };
  const beforeParams = { ...semantics.params };
  const beforeRules = { ...semantics.realize };
  const beforeConnections = graph.connections?.length ?? 0;
  try {
    expandFormantBanks(graph, semantics);
  } catch (cause) {
    const origin = owner("graph", "/meta/formantBanks");
    const message = cause instanceof Error ? cause.message : String(cause);
    const detail = `${label}: ${origin.resource} /meta/formantBanks: ${message}`;
    diagnostics?.error(detail, { source: origin }, message.match(/^E_[A-Z_]+/)?.[0]);
    throw new Error(detail, { cause });
  }
  if (macro !== undefined) {
    const origin = owner("graph", "/meta/formantBanks");
    for (const [role, field, values, before] of [
      ["graph", "nodes", graph.nodes, beforeNodes],
      ["semantics", "params", semantics.params ?? {}, beforeParams],
      ["semantics", "realize", semantics.realize ?? {}, beforeRules],
    ] as const) {
      for (const [name, value] of Object.entries(values)) {
        if (value !== (before as Record<string, unknown>)[name]) {
          const path = sourcePath([field, name]);
          sources[role] = composeSources(sources[role], { [path]: origin }, [path]);
        }
      }
    }
    for (let index = beforeConnections; index < (graph.connections?.length ?? 0); index++) {
      sources.graph[sourcePath(["connections", index])] = origin;
    }
  }
  const validator = new Validator({
    common: commonSchema,
    graph: graphSchema,
    registry: registrySchema,
  });
  for (const role of ["registry", "graph"] as const) {
    const issues = validator.validate(role, config[role]);
    if (issues.length) {
      reject(
        role,
        issues[0].path,
        issues[0].message,
        /port|connections|outputs|inputs/.test(issues[0].path)
          ? "runtime.invalid_port"
          : "E_EXPERIMENT_CONFIG",
      );
    }
  }
  for (const issue of checkRegistry(registry as BaconRegistry)) {
    if (issue.severity === "error") {
      reject(
        "registry",
        issue.path,
        issue.message,
        /ports/.test(issue.path) ? "runtime.invalid_port" : "E_EXPERIMENT_CONFIG",
      );
    }
  }
  for (const issue of checkGraph(graph as Graph, { registry: registry as BaconRegistry })) {
    if (issue.severity === "error") {
      reject(
        "graph",
        issue.path,
        issue.message,
        /connections|outputs|inputs/.test(issue.path)
          ? "runtime.invalid_port"
          : "E_EXPERIMENT_CONFIG",
      );
    }
  }
  const { celEvaluator, topoEvaluator } = createConfiguredEvaluator();
  const rules = semantics.realize ?? {};
  const params = semantics.params ?? {};
  const constants = semantics.constants ?? {};
  const dependencies = new Map<string, string[]>();
  for (const [name, rule] of Object.entries(rules)) {
    const definition = typeof rule === "string" ? { expr: rule } : rule;
    const field = sourcePath(["realize", name]);
    let references: string[][];
    try {
      references = celEvaluator.references(definition.expr);
    } catch (error) {
      return reject("semantics", `${field}/expr`, String(error), "E_SEMANTICS_EXPRESSION");
    }
    const roots = new Set(references.map(([root]) => root));
    for (const reference of references) {
      const [root, ...tail] = reference;
      if (
        !Object.hasOwn(params, root) &&
        !Object.hasOwn(constants, root) &&
        !Object.hasOwn(rules, root)
      ) {
        reject(
          "semantics",
          `${field}/expr`,
          `Unknown semantic reference '${reference.join(".")}'`,
          "E_SEMANTICS_REFERENCE",
        );
      }
      if (Object.hasOwn(constants, root)) {
        let value: unknown = constants[root];
        for (const member of tail) {
          if (value === null || typeof value !== "object" || !Object.hasOwn(value, member)) {
            reject(
              "semantics",
              `${field}/expr`,
              `Unknown constant '${reference.join(".")}'`,
              "E_SEMANTICS_REFERENCE",
            );
          }
          value = (value as Record<string, unknown>)[member];
        }
      }
    }
    // A name can refer to an input before a same-name realization replaces it.
    // Authored deps select that realization explicitly; otherwise input names
    // do not imply ordering edges (for example effortVoiced reads input F0).
    const actual = [...roots].filter(
      (root) =>
        Object.hasOwn(rules, root) &&
        !Object.hasOwn(constants, root) &&
        (!Object.hasOwn(params, root) || definition.deps?.includes(root)),
    );
    for (const dep of definition.deps ?? []) {
      if (!roots.has(dep)) {
        reject(
          "semantics",
          `${field}/deps`,
          `Declared dependency '${dep}' is not referenced`,
          "E_SEMANTICS_DEPENDENCY",
        );
      }
    }
    if (definition.deps !== undefined) {
      for (const dep of actual) {
        if (!definition.deps.includes(dep)) {
          reject(
            "semantics",
            `${field}/deps`,
            `Missing declared dependency '${dep}'`,
            "E_SEMANTICS_DEPENDENCY",
          );
        }
      }
    }
    dependencies.set(
      name,
      [...roots].filter((root) => !Object.hasOwn(constants, root)),
    );
    rules[name] = { ...definition, deps: definition.deps ?? actual };
  }
  try {
    topoEvaluator.getEvaluationOrder(semantics);
  } catch (error) {
    reject("semantics", "/realize", String(error), "E_SEMANTICS_DEPENDENCY");
  }
  const live = new Set<string>();
  const mark = (name: string): void => {
    if (live.has(name)) return;
    live.add(name);
    for (const dependency of dependencies.get(name) ?? []) mark(dependency);
  };
  for (const [id, node] of Object.entries(graph.nodes)) {
    for (const [name, value] of Object.entries(node.params ?? {})) {
      if (typeof value !== "object" || value === null || !("bind" in value)) continue;
      if (!Object.hasOwn(params, value.bind) && !Object.hasOwn(rules, value.bind)) {
        reject(
          "graph",
          sourcePath(["nodes", id, "params", name]),
          `Unresolved binding '${value.bind}'`,
          "E_SEMANTICS_BINDING",
        );
      }
      mark(value.bind);
    }
  }
  const unreachable = (["realize", "params"] as const).flatMap((field) =>
    Object.keys(semantics[field] ?? {})
      .filter((name) => !live.has(name))
      .map((name) => ({
        definition: `${field}.${name}`,
        source: owner("semantics", sourcePath([field, name])),
      })),
  );
  return { ...config, sources, unreachable };
}
