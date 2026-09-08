/**
 * Pronunciation boundary for the cited lexical stress policy.
 * Hayes (1982), Extrametricality and English Stress, pp. 237–274.
 * The metrical model uses typed prominence; ARPAbet digits are serialized here.
 */

import type {
  LexicalCategory,
  LexicalStress,
  LexicalStressResult,
  StressDomain,
  StressSyllable,
} from "./lexical-stress-types";
import { assignMetricalStress } from "./metrical-stress";
import { loadStressPolicy } from "./stress-policy";
import { loadPhonotacticsSync, syllabify } from "./syllabify";
import type { MorphologyCycle } from "./types";

// ── Types ───────────────────────────────────────────────────────────────

export interface StressHint {
  stressType?: "forcing" | "non_affecting";
  stressTarget?: "penult" | "antepenult" | "final";
}

// ── Stress Assignment ───────────────────────────────────────────────────

/**
 * Assign stress digits to vowel phonemes.
 *
 * @param phonemes - Array of ARPAbet phonemes (no stress digits).
 * @param hint - Optional suffix-derived stress placement hint.
 * @returns New array with stress digits appended to vowel phonemes.
 */
export function assignStress(phonemes: string[], hint?: StressHint): string[] {
  return stressPronunciation(phonemes, {
    policyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
    hint,
  }).phonemes;
}

export interface StressInput {
  policyPath: string | undefined;
  wordId?: string;
  category?: LexicalCategory;
  domains?: StressDomain[];
  underlying?: StressSyllable[];
  morphology?: MorphologyCycle[];
  hint?: StressHint;
  exception?: { stress: LexicalStress[]; reason: string; citations: string[] };
}

/** Hayes (1982), p. 237: underlying quantity must not be inferred from acoustic duration. */
export function stressPronunciation(
  phonemes: string[],
  input: StressInput,
): LexicalStressResult & { phonemes: string[]; syllables: StressSyllable[] } {
  const policy = loadStressPolicy(input.policyPath ?? "");
  const phonotactics = loadPhonotacticsSync(policy.phonotacticsPath);
  const vowels = new Set(phonotactics.vowels);
  if (
    [...policy.longVowels, ...policy.shortFinalVowels].some((vowel) => !vowels.has(vowel)) ||
    policy.sonorants.some((phone) => vowels.has(phone))
  )
    throw new Error("E_STRESS_PHONOTACTICS: incompatible vowel inventory");
  const bare = phonemes.map((phone) => phone.replace(/[012]$/, ""));
  const parts = syllabify(bare, policy.phonotacticsPath).filter((part) =>
    part.some((phone) => vowels.has(phone)),
  );
  let offset = 0;
  const wordId = input.wordId ?? "word";
  const syllables =
    input.underlying ??
    parts.map((part, index): StressSyllable => {
      const nucleusIndex = part.findIndex((phone) => vowels.has(phone));
      const original = phonemes[offset + nucleusIndex];
      offset += part.length;
      return {
        id: `${wordId}:syllable:${index}`,
        nucleus: part[nucleusIndex],
        long:
          policy.longVowels.includes(part[nucleusIndex]) &&
          !(index === parts.length - 1 && policy.shortFinalVowels.includes(part[nucleusIndex])),
        coda: part.slice(nucleusIndex + 1),
        inherited: original.endsWith("1")
          ? "primary"
          : original.endsWith("2")
            ? "secondary"
            : original.endsWith("0")
              ? "unstressed"
              : null,
      };
    });
  if (syllables.length !== parts.length)
    throw new Error("E_STRESS_INPUT: underlying syllables do not match pronunciation");
  if (
    syllables.some(
      (syllable, index) =>
        !vowels.has(syllable.nucleus) ||
        syllable.nucleus !== parts[index].find((phone) => vowels.has(phone)) ||
        ![null, "primary", "secondary", "unstressed"].includes(syllable.inherited),
    )
  ) {
    throw new Error("E_STRESS_INPUT: invalid underlying nucleus or prominence");
  }
  if (!syllables.length)
    return { phonemes: [...phonemes], syllables, stress: [], feet: [], decisions: [] };
  const nucleusOffsets = bare.flatMap((phone, index) => (vowels.has(phone) ? [index] : []));
  const syllableBoundary = (phoneOffset: number) =>
    nucleusOffsets.filter((index) => index < phoneOffset).length;
  const domains = input.domains ??
    input.morphology?.map(
      (cycle, index): StressDomain => ({
        id: `${wordId}:cycle:${index}`,
        start: syllableBoundary(cycle.start),
        end: syllableBoundary(cycle.end),
        category: input.category ?? "unknown",
        spelling: cycle.spelling,
        affix:
          cycle.kind === "root"
            ? "root"
            : cycle.stressType === "non_affecting"
              ? "neutral"
              : "other",
        extrametricalSuffix: false,
        suffixStart:
          cycle.affixStart === undefined ? undefined : syllableBoundary(cycle.affixStart),
        stressTarget: cycle.stressTarget,
        citations: cycle.citations,
      }),
    ) ?? [
      {
        id: wordId,
        end: syllables.length,
        category: input.category ?? "unknown",
        affix: "root" as const,
        extrametricalSuffix: false,
      },
    ];
  const result = assignMetricalStress(syllables, domains, policy);
  if (!input.underlying) {
    if (result.decisions[0]) result.decisions[0].parents = [`${wordId}:stress:quantity`];
    result.decisions.unshift({
      id: `${wordId}:stress:quantity`,
      domain: wordId,
      rule: "quantity_assumption",
      reason: `Policy ${policy.id}; phonotactics ${policy.phonotacticsPath}; engineering quantity and syllabification: ${JSON.stringify(syllables)}`,
      citations: [policy.assumptionCitation],
      tag: "stress_input_fallback",
      parents: [],
      feet: [],
      excluded: [],
    });
  }
  if (!input.morphology && input.hint?.stressType === "forcing" && input.hint.stressTarget) {
    const distance = { final: 1, penult: 2, antepenult: 3 }[input.hint.stressTarget];
    const target = Math.max(0, result.stress.length - distance);
    result.stress = result.stress.map((stress, index) =>
      index === target ? "primary" : stress === "primary" ? "unstressed" : stress,
    );
    // An explicit target replaces the conflicting foot; the exception is not an ESR derivation.
    result.feet = result.stress.flatMap((stress, index) =>
      stress === "unstressed" ? [] : [{ head: index, members: [index], domain: wordId }],
    );
    result.decisions.push({
      id: `${wordId}:stress:affix`,
      domain: wordId,
      rule: "declared_affix_exception",
      reason: `Declared morphology stress target: ${input.hint.stressTarget}`,
      citations: ["Qlatt engineering estimate: legacy morphology stress-target exception"],
      tag: "stress_exception",
      parents: result.decisions.length ? [result.decisions[result.decisions.length - 1].id] : [],
      feet: result.feet.map((foot) => ({ ...foot, members: [...foot.members] })),
      excluded: [],
    });
  }
  if (input.exception) {
    const exception = input.exception;
    if (
      !exception.reason ||
      !exception.citations.length ||
      exception.citations.some((citation) => !citation) ||
      exception.stress.length !== syllables.length ||
      exception.stress.filter((value) => value === "primary").length !== 1 ||
      exception.stress.some((value) => !["primary", "secondary", "unstressed"].includes(value))
    ) {
      throw new Error("E_STRESS_EXCEPTION: expected a cited complete pattern with one primary");
    }
    result.stress = [...exception.stress];
    result.feet = result.stress.flatMap((stress, index) =>
      stress === "unstressed" ? [] : [{ head: index, members: [index], domain: wordId }],
    );
    result.decisions.push({
      id: `${wordId}:stress:exception`,
      domain: wordId,
      rule: "lexical_exception",
      reason: exception.reason,
      citations: [...exception.citations],
      tag: "stress_exception",
      parents: result.decisions.length ? [result.decisions[result.decisions.length - 1].id] : [],
      feet: result.feet.map((foot) => ({ ...foot, members: [...foot.members] })),
      excluded: [],
    });
  }
  const digits = { primary: "1", secondary: "2", unstressed: "0" } as const;
  let vowelIndex = 0;
  const output = bare.map((phone) =>
    vowels.has(phone) ? phone + digits[result.stress[vowelIndex++]] : phone,
  );
  return { ...result, phonemes: output, syllables };
}
