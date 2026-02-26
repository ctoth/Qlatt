import { parseDslSpec } from "./parser";
import { assertValidSpec } from "./validation";

type PlainObject = Record<string, unknown>;

export const DEFAULT_RULEPACK_PATH = "/rules/frontend.yaml";

function normalizeRuleShape(spec: PlainObject): PlainObject {
  for (const rule of Object.values((spec.rules ?? {}) as Record<string, unknown>)) {
    if (rule && typeof rule === "object" && (rule as Record<string, unknown>).op == null) {
      delete (rule as Record<string, unknown>).op;
    }
  }
  return spec;
}

function discoverBundledRulepacks(): Map<string, string> {
  const sources = new Map<string, string>();
  // Vite injects import.meta.glob; in non-Vite contexts this may be undefined.
  // @ts-expect-error `glob` is provided by Vite at transform time.
  if (typeof import.meta.glob !== "function") {
    return sources;
  }

  let modules: Record<string, unknown> = {};
  try {
    // @ts-expect-error `glob` is provided by Vite at transform time.
    modules = import.meta.glob("/public/rules/*.yaml", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, unknown>;
  } catch {
    // Browser runtime cannot raw-import from /public; we'll fall back to URL loading.
    return sources;
  }

  for (const [filePath, source] of Object.entries(modules)) {
    if (typeof source !== "string") continue;
    const publicPath = filePath.startsWith("/public/") ? filePath.slice("/public".length) : filePath;
    sources.set(publicPath, source);
  }

  return sources;
}

const BUNDLED_RULEPACK_SOURCES = discoverBundledRulepacks();
const BUNDLED_RULEPACK_CACHE = new Map<string, PlainObject>();

export function listBundledRulepackPaths(): string[] {
  const known = new Set<string>([
    ...BUNDLED_RULEPACK_SOURCES.keys(),
    ...BUNDLED_RULEPACK_CACHE.keys(),
    DEFAULT_RULEPACK_PATH,
  ]);
  return [...known].sort();
}

function loadRulepackSourceByUrl(specPath: string): string | null {
  if (typeof XMLHttpRequest !== "function") return null;
  const request = new XMLHttpRequest();
  request.open("GET", specPath, false);
  request.send();
  if (request.status < 200 || request.status >= 300) return null;
  return typeof request.responseText === "string" ? request.responseText : null;
}

export function loadRulepackSpecFromPath(specPath: string = DEFAULT_RULEPACK_PATH): PlainObject {
  const cached = BUNDLED_RULEPACK_CACHE.get(specPath);
  if (cached) return cached;

  const source = BUNDLED_RULEPACK_SOURCES.get(specPath) ?? loadRulepackSourceByUrl(specPath);
  if (typeof source !== "string") {
    const known = listBundledRulepackPaths();
    throw new Error(
      `E_RULESET_PATH_UNKNOWN: '${specPath}' could not be loaded` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : "")
    );
  }

  const spec = normalizeRuleShape(parseDslSpec(source));
  assertValidSpec(spec);
  BUNDLED_RULEPACK_CACHE.set(specPath, spec);
  return spec;
}

export const QLATT_V12_CEL_RULEPACK = loadRulepackSpecFromPath(DEFAULT_RULEPACK_PATH);
export const QLATT_V11_SLICE_RULEPACK = QLATT_V12_CEL_RULEPACK;
