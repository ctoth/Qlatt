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

import { applyLtsRules } from "./lts-engine";
import { decomposeClitic, decomposeWord, getStressHintForWord } from "./morphology";
import { stressPronunciation } from "./stress";
import type { DictLookup, PronunciationResult } from "./types";

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
  options: { ltsPath?: string; morphologyPath?: string; stressPolicyPath?: string } = {
    ltsPath: "/rules/frontends/qlatt-english/lts-rules.yaml",
    morphologyPath: "/rules/frontends/qlatt-english/morphology.yaml",
    stressPolicyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
  },
): PronunciationResult {
  if (!word || word.trim().length === 0) {
    return { phonemes: [], source: "lts-rules", word: word || "" };
  }

  const lowerWord = word.toLowerCase();

  // 1. Try direct dictionary lookup
  const dictResult = dictLookup(lowerWord);
  if (dictResult) {
    return { phonemes: dictResult, source: "dictionary", word: lowerWord };
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
