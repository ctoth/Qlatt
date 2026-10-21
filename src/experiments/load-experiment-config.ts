import type { BaconGraph, Registry } from "../klatt-runtime";
import {
  assertSupportedPair,
  findPackageEntry,
  type PackageDiscovery,
  type PackageEndpoint,
  preloadBundledPackages,
} from "../package-discovery";
import { loadSemanticsDocument } from "../semantics/load-semantics";
import type { SemanticsConstants, SemanticsDocument } from "../semantics/types";
import { isPlainObject, loadYamlDocument } from "../yaml-loader";
import { assertFrontendVocabulary } from "./frontend-vocabulary";
import {
  type ConfigSources,
  composeSources,
  constantReplacements,
  documentSources,
  type PreparedExperimentConfig,
  prepareExperimentConfig,
  sourcePath,
} from "./prepare-experiment-config";

type ExperimentManifestEntry = {
  id: string;
  extends?: string;
  name?: string;
  description?: string;
};

export interface ExperimentConfig {
  graph: BaconGraph;
  semantics: SemanticsDocument;
  registry: Registry;
  sources?: ConfigSources;
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

export async function assertExperimentPair(frontendId: string, experimentId: string): Promise<void> {
  const discovery = await preloadBundledPackages();
  assertSupportedPair(
    discovery,
    findPackageEntry(discovery.frontends, frontendId, "frontend").endpoint,
    findPackageEntry(discovery.backends, experimentId, "backend").endpoint,
  );
}

export async function loadExperimentConfig(
  experimentId: string,
  frontendId?: string,
): Promise<PreparedExperimentConfig> {
  const discovery = await preloadBundledPackages();
  const backend = findPackageEntry(discovery.backends, experimentId, "backend");
  if (frontendId !== undefined) {
    assertSupportedPair(
      discovery,
      findPackageEntry(discovery.frontends, frontendId, "frontend").endpoint,
      backend.endpoint,
    );
  }
  const config = prepareExperimentConfig(
    await loadConfig(discovery, backend.endpoint),
    experimentId,
  );
  if (frontendId !== undefined) await assertFrontendVocabulary(frontendId, config);
  return config;
}

export async function loadExperimentManifest(): Promise<{
  experiments: ExperimentManifestEntry[];
}> {
  const discovery = await preloadBundledPackages();
  return {
    experiments: discovery.backends.map((entry) => {
      findPackageEntry(discovery.backends, entry.id, "backend");
      return {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        ...(entry.extends
          ? { extends: findPackageEntry(discovery.backends, entry.extends, "backend").id }
          : {}),
      };
    }),
  };
}

async function loadConfig(
  discovery: PackageDiscovery,
  selected: PackageEndpoint,
): Promise<ExperimentConfig> {
  async function resolve(
    point: PackageEndpoint,
    ancestors: readonly string[],
  ): Promise<ExperimentConfig> {
    const id = `${point.package}/${point.id}`;
    const chain = [...ancestors, id];
    const context = chain.join(" -> ");
    if (ancestors.includes(id)) throw new Error(`E_EXPERIMENT_CYCLE: ${context}`);
    const entry = findPackageEntry(discovery.backends, point, "backend");
    const parent = entry.extends === undefined ? null : await resolve(entry.extends, chain);
    const paths = entry.documents;

    const [childGraph, childSemantics, childRegistry] = await Promise.all([
      paths.graph === undefined ? null : loadYamlDocument<BaconGraph>(paths.graph),
      paths.semantics === undefined ? null : loadSemanticsDocument(paths.semantics),
      paths.registry === undefined ? null : loadYamlDocument<Registry>(paths.registry),
    ]);
    const sources: ConfigSources = {
      graph: childGraph ? documentSources(childGraph, paths.graph!) : {},
      semantics: childSemantics ? documentSources(childSemantics, paths.semantics!) : {},
      registry: childRegistry ? documentSources(childRegistry, paths.registry!) : {},
    };

    if (!parent) {
      if (!childGraph || !childSemantics || !childRegistry) {
        throw new Error(`Incomplete experiment config for '${id}' (${context})`);
      }
      return { graph: childGraph, semantics: childSemantics, registry: childRegistry, sources };
    }

    return {
      graph: childGraph ?? parent.graph,
      semantics: mergeSemantics(parent.semantics, childSemantics),
      registry: mergeRegistry(parent.registry, childRegistry),
      sources: {
        graph: childGraph ? sources.graph : parent.sources!.graph,
        registry: childRegistry
          ? composeSources(
              parent.sources!.registry,
              Object.fromEntries(
                Object.entries(sources.registry).filter(
                  ([path]) => path === "/primitives" || path.startsWith("/primitives/"),
                ),
              ),
              Object.keys(childRegistry.primitives ?? {}).map((name) =>
                sourcePath(["primitives", name]),
              ),
            )
          : parent.sources!.registry,
        semantics: childSemantics
          ? composeSources(parent.sources!.semantics, sources.semantics, [
              ...Object.keys(childSemantics)
                .filter((key) => !["params", "realize", "constants"].includes(key))
                .map((key) => sourcePath([key])),
              ...["params", "realize"].flatMap((key) =>
                Object.keys(childSemantics[key as "params" | "realize"] ?? {}).map((name) =>
                  sourcePath([key, name]),
                ),
              ),
              ...constantReplacements(
                parent.semantics.constants ?? {},
                childSemantics.constants ?? {},
              ),
            ])
          : parent.sources!.semantics,
      },
    };
  }

  return resolve(selected, []);
}
