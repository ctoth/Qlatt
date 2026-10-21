import fs from "node:fs";
import path from "node:path";
import url from "node:url";

/**
 * Normalize a resource path for both browser and Node environments.
 *
 * - Preserves explicit HTTP(S) and file URLs after trimming whitespace
 * - Strips leading "/public" prefix (Vite serves public/ at root)
 * - Prepends BASE_URL for subpath deployments (e.g. GitHub Pages at /Qlatt/)
 * - Converts backslashes to forward slashes
 */
export function normalizePath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (/^(https?:\/\/|file:)/i.test(trimmed)) return trimmed;
  const base = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
  let normalized = trimmed.replace(/\\/g, "/");
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
 * Explicit file URLs use only their native path; HTTP(S) URLs have no file path.
 *
 * Probes:
 * 1. The raw specPath itself (if absolute)
 * 2. Source package `public/<relativePath>`
 * 3. Source package `<relativePath>`
 * Relative logical resource names use the package anchor; custom native files
 * must be absolute. The current working directory is not an asset root.
 */
export function resolveFileFromFsSync(specPath: string): string | null {
  if (!isNodeRuntime()) return null;
  if (/^https?:\/\//i.test(specPath.trim())) return null;
  if (/^file:/i.test(specPath.trim())) {
    const filePath = url.fileURLToPath(specPath.trim());
    try {
      fs.statSync(filePath);
      return filePath;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "ENOTDIR") return null;
      throw error;
    }
  }

  const packageRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
  const normalized = normalizePath(specPath);
  const relativePath = normalized.replace(/^\/+/, "");
  const candidates = new Set<string>();

  if (path.isAbsolute(specPath)) {
    candidates.add(specPath);
  }
  if (relativePath.length > 0) {
    candidates.add(path.resolve(packageRoot, "public", relativePath));
    candidates.add(path.resolve(packageRoot, relativePath));
  }

  for (const candidate of candidates) {
    try {
      fs.statSync(candidate);
      return candidate;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
    }
  }

  return null;
}

/**
 * Attempt to read a file from the filesystem synchronously.
 *
 * Probes several candidate paths derived from the given specPath:
 * 1. The raw specPath itself (if absolute)
 * 2. Resolved under the source package's `public/<relativePath>`
 * 3. Resolved under the source package's `<relativePath>`
 *
 * Returns null in non-Node environments or when no candidate exists.
 * Read failures after resolution propagate to the caller.
 */
export function readFileFromFsSync(specPath: string): string | null {
  const resolved = resolveFileFromFsSync(specPath);
  if (!resolved) return null;
  return fs.readFileSync(resolved, "utf8");
}

/**
 * Attempt to read a binary file from the filesystem synchronously.
 *
 * Uses the same path probing strategy as `readFileFromFsSync`, but returns the
 * raw bytes as an ArrayBuffer for WASM and other binary assets. Read failures
 * after resolution propagate to the caller.
 */
export function readBinaryFromFsSync(specPath: string): ArrayBuffer | null {
  const resolved = resolveFileFromFsSync(specPath);
  if (!resolved) return null;
  const bytes = fs.readFileSync(resolved);
  const offset = bytes.byteOffset;
  return bytes.buffer.slice(offset, offset + bytes.byteLength);
}
