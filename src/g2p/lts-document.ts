/**
 * A frontend's letter-to-sound file, parsed once.
 *
 * The frontend resource owner passes the document to pronunciation consumers.
 * Number normalization still acquires it here; both share this parsed document.
 */

import { loadYamlDocumentSync, loadYamlSourceSync } from "../yaml-loader";

export interface LtsContext {
  path: string;
  document: unknown;
}

const documents = new Map<string, unknown>();

/** The parsed letter-to-sound file at `path`: a rule list (YAML) or a compiled table (JSON). */
export function ltsDocumentAt(path: string): unknown {
  if (!documents.has(path)) {
    const document: unknown = path.endsWith(".json")
      ? JSON.parse(loadYamlSourceSync(path))
      : loadYamlDocumentSync<unknown>(path);
    if (document === null || document === undefined) {
      throw new Error(`E_YAML_SCHEMA: '${path}' resolved to empty document`);
    }
    documents.set(path, document);
  }
  return documents.get(path);
}
