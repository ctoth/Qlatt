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

export async function loadSemanticsDocument(specPath: string): Promise<SemanticsDocument> {
  return expandRealizeEach(await loadYamlDocument<AuthoredSemanticsDocument>(specPath), specPath);
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
  return document === null ? null : expandRealizeEach(document, specPath);
}

export function loadSemanticsDocumentSync(specPath: string): SemanticsDocument {
  return expandRealizeEach(loadYamlDocumentSync<AuthoredSemanticsDocument>(specPath), specPath);
}

export function parseSemanticsDocument(source: string, label = "semantics"): SemanticsDocument {
  return expandRealizeEach(parseYamlString<AuthoredSemanticsDocument>(source, label), label);
}
