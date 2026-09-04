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
  const base = (typeof import.meta !== "undefined" && import.meta.env.BASE_URL) || "/";
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
 * Resolve a resource path to an actual filesystem path when running under Node.
 *
 * Probes:
 * 1. The raw specPath itself (if absolute)
 * 2. `cwd()/public/<relativePath>`
 * 3. `cwd()/<relativePath>`
 */
export function resolveFileFromFsSync(specPath: string): string | null {
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
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // Ignore individual filesystem probe failures.
    }
  }

  return null;
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
  const resolved = resolveFileFromFsSync(specPath);
  if (!resolved) return null;
  try {
    return fs.readFileSync(resolved, "utf8");
  } catch {
    return null;
  }
}

/**
 * Attempt to read a binary file from the filesystem synchronously.
 *
 * Uses the same path probing strategy as `readFileFromFsSync`, but returns the
 * raw bytes as an ArrayBuffer for WASM and other binary assets.
 */
export function readBinaryFromFsSync(specPath: string): ArrayBuffer | null {
  const resolved = resolveFileFromFsSync(specPath);
  if (!resolved) return null;
  try {
    const bytes = fs.readFileSync(resolved);
    const offset = bytes.byteOffset;
    return bytes.buffer.slice(offset, offset + bytes.byteLength);
  } catch {
    return null;
  }
}
