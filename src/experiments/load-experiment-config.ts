import { loadYamlDocument, loadYamlDocumentOrNull } from "../yaml-loader";
import { normalizePath, readFileFromFsSync } from "../path-utils";
import type { BaconGraph, Registry } from "../klatt-runtime";
import type { SemanticsDocument } from "../semantics/types";

type ExperimentManifestEntry = {
  id: string;
  extends?: string;
};

type ExperimentManifest = {
  experiments?: ExperimentManifestEntry[];
};

export interface ExperimentConfig {
  graph: BaconGraph;
  semantics: SemanticsDocument;
  registry: Registry;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...(target || {}) };
  for (const key of Object.keys(source || {})) {
    const value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) || {},
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

function mergeRegistry(parent: Registry, child: Registry | null): Registry {
  if (!child) return parent;
  return {
    ...parent,
    primitives: { ...(parent.primitives || {}), ...(child.primitives || {}) },
  };
}

function mergeSemantics(
  parent: SemanticsDocument,
  child: SemanticsDocument | null,
): SemanticsDocument {
  if (!child) return parent;
  return {
    params: { ...(parent.params || {}), ...(child.params || {}) },
    constants: deepMerge(
      (parent.constants as Record<string, unknown>) || {},
      (child.constants as Record<string, unknown>) || {},
    ),
    realize: { ...(parent.realize || {}), ...(child.realize || {}) },
  };
}

async function loadJsonDocument<T>(specPath: string): Promise<T> {
  const fromFs = readFileFromFsSync(specPath);
  if (typeof fromFs === "string") {
    return JSON.parse(fromFs) as T;
  }

  if (typeof fetch === "function") {
    const url = normalizePath(specPath);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load '${specPath}' (${response.status})`);
    }
    return (await response.json()) as T;
  }

  throw new Error(`Unable to load JSON resource '${specPath}'`);
}

export async function loadExperimentConfig(
  experimentId: string,
): Promise<ExperimentConfig> {
  const manifest = await loadJsonDocument<ExperimentManifest>(
    "/experiments/manifest.json",
  );
  const entry = manifest?.experiments?.find(
    (candidate) => candidate.id === experimentId,
  );
  const basePath = `/experiments/${experimentId}`;

  const [childGraph, childSemantics, childRegistry] = await Promise.all([
    loadYamlDocumentOrNull<BaconGraph>(`${basePath}/graph.yaml`),
    loadYamlDocumentOrNull<SemanticsDocument>(`${basePath}/semantics.yaml`),
    loadYamlDocumentOrNull<Registry>(`${basePath}/registry.yaml`),
  ]);

  if (!entry?.extends) {
    if (!childGraph || !childSemantics || !childRegistry) {
      throw new Error(`Incomplete experiment config for '${experimentId}'`);
    }
    return { graph: childGraph, semantics: childSemantics, registry: childRegistry };
  }

  const parentBase = `/experiments/${entry.extends}`;
  const [parentGraph, parentSemantics, parentRegistry] = await Promise.all([
    loadYamlDocument<BaconGraph>(`${parentBase}/graph.yaml`),
    loadYamlDocument<SemanticsDocument>(`${parentBase}/semantics.yaml`),
    loadYamlDocument<Registry>(`${parentBase}/registry.yaml`),
  ]);

  return {
    graph: childGraph || parentGraph,
    semantics: mergeSemantics(parentSemantics, childSemantics),
    registry: mergeRegistry(parentRegistry, childRegistry),
  };
}
