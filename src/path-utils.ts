import fs from "node:fs";
import path from "node:path";

/**
 * Normalize a resource path for both browser and Node environments.
 *
 * - Strips leading "/public" prefix (Vite serves public/ at root)
 * - Prepends BASE_URL for subpath deployments (e.g. GitHub Pages at /Qlatt/)
 * - Converts backslashes to forward slashes
 */
export function normalizePath(rawPath: string): string {
  const base = (typeof import.meta !== 'undefined' && (import.meta as any).env?.BASE_URL) || "/";
  let normalized = rawPath.trim().replace(/\\/g, "/");
  if (normalized.startsWith("/public/")) {
    normalized = normalized.slice("/public".length);
  }
  if (normalized.startsWith("./")) {
    normalized = normalized.slice(1);
  }
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  // Prepend BASE_URL so paths resolve correctly on subpath deployments
  // (e.g. GitHub Pages at /Qlatt/). normalized starts with "/",
  // base ends with "/" (Vite guarantees this), so slice the leading "/".
  return base + normalized.slice(1);
}

/** Returns true when running in a Node.js environment. */
export function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

/**
 * Attempt to read a file from the filesystem synchronously.
 *
 * Probes several candidate paths derived from the given specPath:
 * 1. The raw specPath itself (if absolute)
 * 2. Resolved under `cwd()/public/<relativePath>`
 * 3. Resolved under `cwd()/<relativePath>`
 *
 * Returns null in non-Node environments or when no candidate exists.
 */
export function readFileFromFsSync(specPath: string): string | null {
  if (!isNodeRuntime()) return null;

  const normalized = normalizePath(specPath);
  const relativePath = normalized.replace(/^\/+/, "");
  const candidates = new Set<string>();

  if (path.isAbsolute(specPath)) {
    candidates.add(specPath);
  }
  if (relativePath.length > 0) {
    candidates.add(path.resolve(process.cwd(), "public", relativePath));
    candidates.add(path.resolve(process.cwd(), relativePath));
  }

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      return fs.readFileSync(candidate, "utf8");
    } catch {
      // Ignore individual filesystem probe failures.
    }
  }

  return null;
}
