import type { BaconGraph, Registry } from "../klatt-runtime";
import { normalizePath, readFileFromFsSync } from "../path-utils";
import { loadSemanticsDocumentOrNull } from "../semantics/load-semantics";
import type { SemanticsConstants, SemanticsDocument } from "../semantics/types";
import { isPlainObject, loadYamlDocumentOrNull } from "../yaml-loader";
import { assertFrontendVocabulary } from "./frontend-vocabulary";

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

function mergeConstants(parent: SemanticsConstants, child: SemanticsConstants): SemanticsConstants {
  const result: SemanticsConstants = { ...parent };
  for (const [key, value] of Object.entries(child)) {
    const inherited = result[key];
    result[key] =
      isPlainObject(inherited) && isPlainObject(value)
        ? mergeConstants(inherited as SemanticsConstants, value as SemanticsConstants)
        : value;
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

// Both documents arrive with `realize_each` already expanded (each is loaded
// through src/semantics/load-semantics.ts), so a child's concrete realize rule
// overrides a parent's generated rule by key here.
function mergeSemantics(
  parent: SemanticsDocument,
  child: SemanticsDocument | null,
): SemanticsDocument {
  if (!child) return parent;
  const merged = {
    ...parent,
    ...child,
  } as SemanticsDocument;

  merged.params = { ...(parent.params || {}), ...(child.params || {}) };
  merged.constants = mergeConstants(parent.constants ?? {}, child.constants ?? {});
  merged.realize = { ...(parent.realize || {}), ...(child.realize || {}) };

  return merged;
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
  frontendId?: string,
): Promise<ExperimentConfig> {
  const config = await loadConfig(experimentId);
  if (frontendId !== undefined) await assertFrontendVocabulary(frontendId, config);
  return config;
}

async function loadConfig(experimentId: string): Promise<ExperimentConfig> {
  const manifestPath = "/experiments/manifest.json";
  const manifest = await loadJsonDocument<ExperimentManifest>(manifestPath);
  if (!Array.isArray(manifest?.experiments)) {
    throw new Error(`E_EXPERIMENT_MANIFEST: '${manifestPath}' requires experiments`);
  }
  const entries = new Map<string, ExperimentManifestEntry>();
  for (const entry of manifest.experiments) {
    if (!isPlainObject(entry) || typeof entry.id !== "string" || !entry.id.trim()) {
      throw new Error(`E_EXPERIMENT_MANIFEST: '${manifestPath}' requires nonempty experiment IDs`);
    }
    if (entries.has(entry.id)) {
      throw new Error(
        `E_EXPERIMENT_MANIFEST: '${manifestPath}' duplicate experiment '${entry.id}'`,
      );
    }
    if (
      entry.extends !== undefined &&
      (typeof entry.extends !== "string" || !entry.extends.trim())
    ) {
      throw new Error(`E_EXPERIMENT_MANIFEST: '${manifestPath}' invalid parent for '${entry.id}'`);
    }
    entries.set(entry.id, entry);
  }

  async function resolve(id: string, ancestors: readonly string[]): Promise<ExperimentConfig> {
    const chain = [...ancestors, id];
    const context = `'${manifestPath}': ${chain.join(" -> ")}`;
    if (ancestors.includes(id)) throw new Error(`E_EXPERIMENT_CYCLE: ${context}`);
    const entry = entries.get(id);
    if (!entry) throw new Error(`E_EXPERIMENT_UNKNOWN: ${context}`);
    const parent = entry.extends === undefined ? null : await resolve(entry.extends, chain);
    const basePath = `/experiments/${id}`;

    const [childGraph, childSemantics, childRegistry] = await Promise.all([
      loadYamlDocumentOrNull<BaconGraph>(`${basePath}/graph.yaml`),
      loadSemanticsDocumentOrNull(`${basePath}/semantics.yaml`),
      loadYamlDocumentOrNull<Registry>(`${basePath}/registry.yaml`),
    ]);

    if (!parent) {
      if (!childGraph || !childSemantics || !childRegistry) {
        throw new Error(`Incomplete experiment config for '${id}' (${context})`);
      }
      return { graph: childGraph, semantics: childSemantics, registry: childRegistry };
    }

    return {
      graph: childGraph ?? parent.graph,
      semantics: mergeSemantics(parent.semantics, childSemantics),
      registry: mergeRegistry(parent.registry, childRegistry),
    };
  }

  return resolve(experimentId, []);
}
