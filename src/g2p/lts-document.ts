/**
 * A frontend's letter-to-sound file, parsed once.
 *
 * The file is asked for three times: when the frontend's resources are checked
 * (declarative-frontend/inventory.ts), by the table pronouncer (index.ts) and
 * by the rule-list engine (lts-engine.ts). A compiled table is a few hundred
 * kilobytes, so the three share one parsed document.
 */

import { loadYamlDocumentSync } from "../yaml-loader";

const documents = new Map<string, unknown>();

/** The parsed letter-to-sound file at `path`: a rule list (YAML) or a compiled table (JSON). */
export function ltsDocumentAt(path: string): unknown {
  if (!documents.has(path)) documents.set(path, loadYamlDocumentSync<unknown>(path));
  return documents.get(path);
}
