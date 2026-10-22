import { isNodeRuntime, normalizePath } from "./path-utils";
import { keepSyncResource } from "./sync-resource-cache";
import { isPlainObject, loadYamlSource, loadYamlSourceSync } from "./yaml-loader";

export type PackageEndpoint = { package: string; id: string };
type ResourceReference = string | { package: string; path: string };
type Selection = { id: string; version: string; baseUrl: string; manifest: string };
type Frontend = {
  id: string;
  entryPoint: ResourceReference;
  defaultBackend: PackageEndpoint;
  name?: string;
  description?: string;
};
type Backend = {
  id: string;
  graph?: ResourceReference;
  registry?: ResourceReference;
  semantics?: ResourceReference;
  extends?: PackageEndpoint;
  name?: string;
  description?: string;
};
type PackageManifest = {
  id: string;
  version: string;
  dependsOn: { id: string; version: string }[];
  frontends: Frontend[];
  backends: Backend[];
  supportedPairs: { frontend: PackageEndpoint; backend: PackageEndpoint }[];
};
type SelectedPackage = PackageManifest & { baseUrl: string; manifestUrl: string };
export type DiscoveredFrontend = Frontend & { endpoint: PackageEndpoint; source: string };
export type DiscoveredBackend = Backend & {
  endpoint: PackageEndpoint;
  documents: { graph?: string; registry?: string; semantics?: string };
};
export type PackageDiscovery = {
  packages: SelectedPackage[];
  frontends: DiscoveredFrontend[];
  backends: DiscoveredBackend[];
};

const INDEX_PATH = "/packages/manifest.json";
const bundledBase = () =>
  isNodeRuntime()
    ? new URL("../public/", import.meta.url)
    : new URL(normalizePath("/"), import.meta.url);

// Preserve the existing authored source labels for unchanged bundled documents.
// Other installation URLs remain URLs; portable source identities are #78/#251.
function sourcePath(url: URL): string {
  const base = bundledBase().href;
  return url.href.startsWith(base)
    ? `/${decodeURIComponent(url.href.slice(base.length))}`
    : url.href;
}

function invalid(context: string, detail: string): never {
  throw new Error(`E_PACKAGE_MANIFEST: ${context}: ${detail}`);
}
function json(source: string, context: string): unknown {
  try {
    return JSON.parse(source);
  } catch (cause) {
    throw new Error(`E_PACKAGE_MANIFEST: ${context}: invalid JSON`, { cause });
  }
}
function object(value: unknown, context: string): Record<string, unknown> {
  if (!isPlainObject(value)) invalid(context, "requires an object");
  return value;
}
function text(value: unknown, context: string): string {
  if (typeof value !== "string" || !value.trim()) invalid(context, "requires a nonempty string");
  return value;
}
function entries(value: unknown, context: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) invalid(context, "requires an array");
  return value;
}
function endpoint(value: unknown, context: string): PackageEndpoint {
  const item = object(value, context);
  return { package: text(item.package, context), id: text(item.id, context) };
}
function reference(value: unknown, context: string): ResourceReference {
  const relative = (path: unknown) => {
    const result = text(path, context);
    if (/^(?:[a-z][a-z\d+.-]*:|[/\\])/i.test(result)) invalid(context, "requires a relative URL");
    return result;
  };
  if (typeof value === "string") return relative(value);
  const item = object(value, context);
  return { package: text(item.package, context), path: relative(item.path) };
}
function metadata(item: Record<string, unknown>, context: string) {
  return {
    ...(item.name === undefined ? {} : { name: text(item.name, context) }),
    ...(item.description === undefined ? {} : { description: text(item.description, context) }),
  };
}
function selections(source: string): Selection[] {
  const index = object(json(source, INDEX_PATH), INDEX_PATH);
  if (!Array.isArray(index.packages)) invalid(INDEX_PATH, "requires packages");
  const seen = new Set<string>();
  return index.packages.map((value) => {
    const item = object(value, INDEX_PATH);
    const id = text(item.id, INDEX_PATH);
    if (seen.has(id)) invalid(INDEX_PATH, `duplicate selected package '${id}'`);
    seen.add(id);
    const baseUrl = new URL(text(item.baseUrl, id), bundledBase()).href;
    if (!baseUrl.endsWith("/")) invalid(id, "baseUrl requires a directory URL");
    return { id, version: text(item.version, id), baseUrl, manifest: text(item.manifest, id) };
  });
}
function parsePackage(source: string, selected: Selection): SelectedPackage {
  const item = object(json(source, selected.manifest), selected.manifest);
  if (item.id !== selected.id || item.version !== selected.version) {
    invalid(
      selected.manifest,
      `does not match selected '${selected.id}' version '${selected.version}'`,
    );
  }
  const unique = (
    values: unknown[],
    role: string,
  ): (Record<string, unknown> & { id: string })[] => {
    const seen = new Set<string>();
    return values.map((value) => {
      const entry = object(value, `${selected.id}.${role}`);
      const id = text(entry.id, `${selected.id}.${role}`);
      if (seen.has(id)) invalid(selected.id, `duplicate ${role} '${id}'`);
      seen.add(id);
      return { ...entry, id };
    });
  };
  return {
    id: selected.id,
    version: selected.version,
    baseUrl: selected.baseUrl,
    manifestUrl: new URL(selected.manifest, selected.baseUrl).href,
    dependsOn: entries(item.dependsOn, selected.id).map((value) => {
      const dep = object(value, selected.id);
      return { id: text(dep.id, selected.id), version: text(dep.version, selected.id) };
    }),
    frontends: unique(entries(item.frontends, selected.id), "frontend").map((entry) => ({
      id: entry.id,
      ...metadata(entry, selected.id),
      entryPoint: reference(entry.entryPoint, `${selected.id}.${entry.id}.entryPoint`),
      defaultBackend: endpoint(entry.defaultBackend, `${selected.id}.${entry.id}.defaultBackend`),
    })),
    backends: unique(entries(item.backends, selected.id), "backend").map((entry) => ({
      id: entry.id,
      ...metadata(entry, selected.id),
      ...(entry.extends === undefined ? {} : { extends: endpoint(entry.extends, selected.id) }),
      ...(entry.graph === undefined ? {} : { graph: reference(entry.graph, selected.id) }),
      ...(entry.registry === undefined ? {} : { registry: reference(entry.registry, selected.id) }),
      ...(entry.semantics === undefined
        ? {}
        : { semantics: reference(entry.semantics, selected.id) }),
    })),
    supportedPairs: entries(item.supportedPairs, selected.id).map((value) => {
      const pair = object(value, selected.id);
      return {
        frontend: endpoint(pair.frontend, selected.id),
        backend: endpoint(pair.backend, selected.id),
      };
    }),
  };
}

const sameEndpoint = (a: PackageEndpoint, b: PackageEndpoint) =>
  a.package === b.package && a.id === b.id;

function compose(packages: SelectedPackage[]): PackageDiscovery {
  const byId = new Map(packages.map((pkg) => [pkg.id, pkg]));
  function owner(from: SelectedPackage, id: string): SelectedPackage {
    if (id !== from.id && !from.dependsOn.some((dep) => dep.id === id)) {
      invalid(from.id, `package '${id}' is not a declared dependency`);
    }
    const target = byId.get(id);
    if (!target) invalid(from.id, `missing selected dependency '${id}'`);
    return target;
  }
  for (const pkg of packages) {
    for (const dep of pkg.dependsOn) {
      const target = owner(pkg, dep.id);
      if (target.version !== dep.version)
        invalid(
          pkg.id,
          `dependency '${dep.id}' requires '${dep.version}', selected '${target.version}'`,
        );
    }
  }
  function resource(pkg: SelectedPackage, ref: ResourceReference): string {
    const target = typeof ref === "string" ? pkg : owner(pkg, ref.package);
    const path = typeof ref === "string" ? ref : ref.path;
    const url = new URL(path, typeof ref === "string" ? pkg.manifestUrl : target.baseUrl);
    if (!url.href.startsWith(target.baseUrl))
      invalid(pkg.id, `resource '${path}' escapes its package base`);
    return sourcePath(url);
  }
  const frontends = packages.flatMap((pkg) =>
    pkg.frontends.map((entry) => ({
      ...entry,
      endpoint: { package: pkg.id, id: entry.id },
      source: resource(pkg, entry.entryPoint),
    })),
  );
  const backends = packages.flatMap((pkg) =>
    pkg.backends.map((entry) => ({
      ...entry,
      endpoint: { package: pkg.id, id: entry.id },
      documents: {
        ...(entry.graph === undefined ? {} : { graph: resource(pkg, entry.graph) }),
        ...(entry.registry === undefined ? {} : { registry: resource(pkg, entry.registry) }),
        ...(entry.semantics === undefined ? {} : { semantics: resource(pkg, entry.semantics) }),
      },
    })),
  );
  const discovery = { packages, frontends, backends };
  function checkEndpoint(
    pkg: SelectedPackage,
    point: PackageEndpoint,
    role: "frontends" | "backends",
  ) {
    const target = owner(pkg, point.package);
    if (!target[role].some((entry) => entry.id === point.id))
      invalid(pkg.id, `unknown ${role} endpoint '${point.package}/${point.id}'`);
  }
  for (const pkg of packages) {
    for (const entry of pkg.backends) {
      if (entry.extends) checkEndpoint(pkg, entry.extends, "backends");
    }
    for (const pair of pkg.supportedPairs) {
      if (pair.backend.package !== pkg.id)
        invalid(pkg.id, "supported pair must name an owned backend");
      checkEndpoint(pkg, pair.frontend, "frontends");
      checkEndpoint(pkg, pair.backend, "backends");
    }
    for (const entry of pkg.frontends) {
      checkEndpoint(pkg, entry.defaultBackend, "backends");
      assertSupportedPair(discovery, { package: pkg.id, id: entry.id }, entry.defaultBackend);
    }
  }
  return discovery;
}

/** Existing string IDs are bundled aliases, never an instruction to choose an arbitrary owner. */
export function findPackageEntry<T extends { endpoint: PackageEndpoint }>(
  entries: readonly T[],
  selected: string | PackageEndpoint,
  role: string,
): T {
  const matches = entries.filter((entry) =>
    typeof selected === "string"
      ? entry.endpoint.id === selected
      : sameEndpoint(entry.endpoint, selected),
  );
  if (matches.length !== 1)
    throw new Error(
      `E_PACKAGE_ENDPOINT: ${role} '${typeof selected === "string" ? selected : `${selected.package}/${selected.id}`}' is ${matches.length ? "ambiguous" : "unknown"}`,
    );
  return matches[0];
}

export function assertSupportedPair(
  discovery: PackageDiscovery,
  frontend: PackageEndpoint,
  backend: PackageEndpoint,
): void {
  const owner = discovery.packages.find((pkg) => pkg.id === backend.package);
  if (
    !owner?.supportedPairs.some(
      (pair) => sameEndpoint(pair.frontend, frontend) && sameEndpoint(pair.backend, backend),
    )
  ) {
    throw new Error(
      `E_SYNTH_PAIRING: frontend '${frontend.package}/${frontend.id}' and backend '${backend.package}/${backend.id}' are not a declared supported pair`,
    );
  }
}

export function loadBundledPackages(): PackageDiscovery {
  const selected = selections(loadYamlSourceSync(INDEX_PATH));
  return compose(
    selected.map((entry) =>
      parsePackage(loadYamlSourceSync(sourcePath(new URL(entry.manifest, entry.baseUrl))), entry),
    ),
  );
}

export async function preloadBundledPackages(): Promise<PackageDiscovery> {
  const index = await loadYamlSource(INDEX_PATH);
  const selected = selections(index);
  keepSyncResource(INDEX_PATH, index);
  const packages = await Promise.all(
    selected.map(async (entry) => {
      const path = sourcePath(new URL(entry.manifest, entry.baseUrl));
      const source = await loadYamlSource(path);
      const parsed = parsePackage(source, entry);
      keepSyncResource(path, source);
      return parsed;
    }),
  );
  return compose(packages);
}
