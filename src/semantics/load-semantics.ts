/**
 * Semantics document loading.
 *
 * Every semantics.yaml reader goes through one of these functions so the
 * document it receives has had its load-time constructs expanded
 * (`realize_each`, see `./realize-each.ts`). Each function loads exactly one
 * document; an `extends` merge of a parent and a child happens afterwards, on
 * two already-expanded documents.
 */

import {
  loadYamlDocument,
  loadYamlDocumentOrNull,
  loadYamlDocumentSync,
  parseYamlString,
} from "../yaml-loader";
import { expandRealizeEach } from "./realize-each";
import type { AuthoredSemanticsDocument, SemanticsDocument } from "./types";

function normalizeSemantics(
  document: AuthoredSemanticsDocument,
  source: string,
): SemanticsDocument {
  const expanded = expandRealizeEach(document, source);
  for (const [name, rule] of Object.entries(expanded.realize ?? {})) {
    if (typeof rule !== "object" || rule === null || !("citations" in rule)) continue;
    const citations = rule.citations;
    if (
      !Array.isArray(citations) ||
      citations.length === 0 ||
      citations.some((citation) => typeof citation !== "string" || !citation.trim())
    ) {
      throw new Error(
        `E_SEMANTICS_CITATIONS ${source}: realize.${name}.citations must be a nonempty array of nonblank strings`,
      );
    }
  }
  return expanded;
}

export async function loadSemanticsDocument(specPath: string): Promise<SemanticsDocument> {
  return normalizeSemantics(await loadYamlDocument<AuthoredSemanticsDocument>(specPath), specPath);
}

/**
 * Null when the document does not exist (an inheriting experiment may have
 * none). A document that exists but cannot be read or parsed is an error, and
 * so is an expansion error in a document that did load.
 */
export async function loadSemanticsDocumentOrNull(
  specPath: string,
): Promise<SemanticsDocument | null> {
  const document = await loadYamlDocumentOrNull<AuthoredSemanticsDocument>(specPath);
  return document === null ? null : normalizeSemantics(document, specPath);
}

export function loadSemanticsDocumentSync(specPath: string): SemanticsDocument {
  return normalizeSemantics(loadYamlDocumentSync<AuthoredSemanticsDocument>(specPath), specPath);
}

export function parseSemanticsDocument(source: string, label = "semantics"): SemanticsDocument {
  return normalizeSemantics(parseYamlString<AuthoredSemanticsDocument>(source, label), label);
}
