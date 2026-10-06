/**
 * G2P pipeline orchestration.
 *
 * Wires together dictionary lookup, morphological decomposition, and
 * Elovitz LTS rules + the frontend's cited lexical stress policy into a single
 * pronounce() function.
 *
 * Layer priority:
 *   1. Dictionary lookup (highest accuracy)
 *   2. Configured clitic handling (dict base + shared suffix allomorph)
 *   3. Morphological decomposition (affix stripping + dict root)
 *   4. Elovitz LTS rules (fallback); both generated paths share lexical stress
 *
 * Citation: Allen, Hunnicutt & Klatt (1987), From Text to Speech: The MITalk System.
 * Citation: Elovitz, Johnson, McHugh & Shore (1976). NRL Report 7948.
 * Citation: Hunnicutt (1976), Phonological Rules for a Text-to-Speech System.
 * Citation: Hayes (1982), Extrametricality and English Stress, pp. 237–274.
 */

import { loadYamlDocumentSync } from "../yaml-loader";
import { applyLtsRules } from "./lts-engine";
import { decomposeClitic, decomposeWord, getStressHintForWord } from "./morphology";
import { stressPronunciation } from "./stress";
import {
  formClassNamesOf,
  isLtsTableDocument,
  type LtsTableDocument,
  pronounceWithLtsTable,
} from "./table-lts-pronounce";
import { stripSuffixes } from "./table-suffix";
import type { DictLookup, PronunciationResult } from "./types";

// A letter-to-sound file is either a rule list (lts-engine.ts) or a compiled
// table with its own stress assignment (table-lts-pronounce.ts). The file's
// `format` says which; null records a rule list.
const ltsTables = new Map<string, LtsTableDocument | null>();

function ltsTableAt(path: string): LtsTableDocument | null {
  const cached = ltsTables.get(path);
  if (cached !== undefined) return cached;
  // A table is a JSON document; a rule list is YAML and its engine loads it.
  const document = path.endsWith(".json") ? loadYamlDocumentSync<unknown>(path) : null;
  const table = isLtsTableDocument(document) ? document : null;
  ltsTables.set(path, table);
  return table;
}

/**
 * Pronounce a single word using the multi-layer G2P pipeline.
 *
 * @param word - A single English word (no surrounding spaces/punctuation).
 * @param dictLookup - Injected dictionary lookup function.
 * @returns PronunciationResult with phonemes, source layer, and metadata.
 */
export function pronounce(
  word: string,
  dictLookup: DictLookup,
  options: { ltsPath: string; morphologyPath: string; stressPolicyPath: string },
): PronunciationResult {
  if (!word || word.trim().length === 0) {
    return { phonemes: [], source: "lts-rules", word: word || "" };
  }

  const lowerWord = word.toLowerCase();

  const table = options.ltsPath ? ltsTableAt(options.ltsPath) : null;
  // A table that records form classes gives every word a list, empty for a
  // word it does not know. A fixed class wins over the dictionary's
  // (DECtalk 4.63 LTS/ls_task.c:1062-1078), and a class set by a suffix rule
  // stays (LTS/ls_dict.c:749-750).
  const classed = (mask: number): { formClasses?: string[] } =>
    table?.formClassNames
      ? {
          formClasses: formClassNamesOf(table.specialWordFormClasses?.[lowerWord] ?? mask, table),
        }
      : {};

  // 1. Try direct dictionary lookup
  const dictResult = dictLookup(lowerWord);
  if (dictResult) {
    return {
      phonemes: dictResult,
      source: "dictionary",
      word: lowerWord,
      ...classed(table?.wordFormClasses?.[lowerWord] ?? 0),
    };
  }

  // A frontend whose letter-to-sound file is a compiled table follows that
  // table's own order: suffix stripping against the dictionary, then the
  // rules. The stress comes from the dictionary root or from the table's
  // passes; neither the shared morphology nor the stress policy runs.
  if (table) {
    const { suffixIndex, suffixTable } = table;
    const stripped =
      suffixIndex && suffixTable
        ? stripSuffixes(lowerWord, dictLookup, { ...table, suffixIndex, suffixTable })
        : { phonemes: null, formClass: 0 };
    if (stripped.phonemes) {
      return {
        phonemes: stripped.phonemes,
        source: "morphology",
        word: lowerWord,
        ...classed(stripped.formClass),
      };
    }
    return {
      phonemes: pronounceWithLtsTable(lowerWord, table),
      source: "lts-rules",
      word: lowerWord,
      ...classed(stripped.formClass),
    };
  }

  // 2. Apply configured clitics using their shared suffix allomorph rules
  const cliticResult = decomposeClitic(lowerWord, dictLookup, options.morphologyPath);
  if (cliticResult) {
    return cliticResult;
  }

  // 3. Try morphological decomposition (affix stripping + dict root)
  let generated = decomposeWord(lowerWord, dictLookup, options.morphologyPath);
  if (!generated) {
    if (!options.ltsPath) {
      throw new Error(
        `E_LTS_PATH_MISSING: word '${word}' not in dictionary and no ltsPath configured`,
      );
    }
    generated = {
      phonemes: applyLtsRules(lowerWord, options.ltsPath),
      source: "lts-rules",
      word: lowerWord,
    };
  }
  // Both generated sources reach the same lexical stage before inventory materialization.
  const stressHint = getStressHintForWord(lowerWord, options.morphologyPath);
  const lexicalStress = stressPronunciation(generated.phonemes, {
    policyPath: options.stressPolicyPath,
    wordId: lowerWord,
    hint: stressHint,
    morphology: generated.morphology,
  });
  return { ...generated, phonemes: lexicalStress.phonemes, lexicalStress };
}
