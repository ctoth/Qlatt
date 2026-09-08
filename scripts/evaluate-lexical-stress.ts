/**
 * Frozen issue #37 evaluation, separate from Hayes derivation/tuning fixtures.
 * Run via test/lexical-stress-evaluation.test.ts for the repository's Vite resource initialization.
 * Reference: bundled CMU dictionary. Baseline: e3e8b4cf src/g2p/stress.ts count/hint rule.
 */
import { loadCmuDictionaryFromPathSync } from "../src/cmu-dictionary-loader";
import { pronounce } from "../src/g2p";
import { applyLtsRules } from "../src/g2p/lts-engine";
import { getStressHintForWord } from "../src/g2p/morphology";
import { type StressHint, stressPronunciation } from "../src/g2p/stress";
import { loadPhonotacticsSync } from "../src/g2p/syllabify";

// Chosen before the first evaluation run; no accuracy-based selection or removal.
// Families describe the spelling/input challenge, not an inferred lexical category.
export const evaluationWords = {
  weight: ["banana", "tomato", "potato", "casino", "piano"],
  affix: [
    "numeric",
    "poetic",
    "historic",
    "scientist",
    "musician",
    "geography",
    "biology",
    "photography",
  ],
  neutral: ["childish", "hopeful", "fearless", "movement", "washable"],
  long: ["locomotive", "encyclopedia", "aristocratic", "university", "cafeteria"],
} as const;

const policyPath = "/rules/frontends/qlatt-english/stress-policy.yaml";
const ltsPath = "/rules/frontends/qlatt-english/lts-rules.yaml";
const vowels = new Set(loadPhonotacticsSync().vowels);
const stressPattern = (phones: string[]) =>
  phones
    .filter((phone) => /[012]$/.test(phone))
    .map((phone) => phone.at(-1))
    .join("");

/** Exact old count-based placement for flat LTS/reference phones; no old morphology path is claimed. */
function baseline(phones: string[], hint: StressHint | undefined): string[] {
  const count = phones.filter((phone) => vowels.has(phone)).length;
  const distance =
    hint?.stressType === "forcing" && hint.stressTarget
      ? { final: 1, penult: 2, antepenult: 3 }[hint.stressTarget]
      : Math.min(count, 3);
  const primary = Math.max(0, count - distance);
  let index = 0;
  return phones.map((phone) =>
    vowels.has(phone) ? `${phone}${index++ === primary ? 1 : 0}` : phone,
  );
}

export function evaluateLexicalStress() {
  const dictionary = loadCmuDictionaryFromPathSync("/cmu-dictionary.json");
  const keys = Object.keys(dictionary);
  return Object.entries(evaluationWords).flatMap(([family, words]) =>
    words.map((word) => {
      const variants = keys
        .filter(
          (key) =>
            key === word ||
            (key.startsWith(`${word}(`) && /^\(\d+\)$/.test(key.slice(word.length))),
        )
        .map((key) => dictionary[key].split(/\s+/));
      if (!variants.length) throw new Error(`Missing frozen evaluation reference: ${word}`);
      const phones = variants[0].map((phone) => phone.replace(/[012]$/, ""));
      const hint = getStressHintForWord(word);
      const reference = stressPronunciation(phones, { policyPath, wordId: word, hint });
      // No whole-word OR root dictionary access: both old and new use the same bare LTS phones.
      const generated = pronounce(word, () => null);
      if (generated.source !== "lts-rules")
        throw new Error(`Evaluation dictionary bypass failed: ${word}`);
      const lts = applyLtsRules(word, ltsPath);
      const gold = [...new Set(variants.map(stressPattern))];
      const compatibleGold = variants
        .filter(
          (variant) =>
            variant.map((phone) => phone.replace(/[012]$/, "")).join(" ") === phones.join(" "),
        )
        .map(stressPattern);
      const score = (output: string[], accepted: string[]) => {
        const pattern = stressPattern(output);
        return {
          pattern,
          primary: accepted.some(
            (candidate) =>
              candidate.length === pattern.length &&
              candidate.indexOf("1") === pattern.indexOf("1"),
          ),
          complete: accepted.includes(pattern),
        };
      };
      return {
        word,
        family,
        gold,
        referencePhones: variants[0].join(" "),
        baselineReference: score(baseline(phones, hint), compatibleGold),
        reference: score(reference.phonemes, compatibleGold),
        baselineOov: score(baseline(lts, hint), gold),
        oov: score(generated.phonemes, gold),
        generatedPhones: generated.phonemes.join(" "),
        pronunciationExact: variants.some(
          (variant) => variant.join(" ") === generated.phonemes.join(" "),
        ),
      };
    }),
  );
}

export function renderLexicalStressEvaluation(
  rows: ReturnType<typeof evaluateLexicalStress>,
): string {
  const lines = [
    "# Lexical stress evaluation",
    "",
    "Frozen issue #37 sample; CMU's bundled American pronunciations and stored variants. This is a small diagnostic sample, not a population accuracy estimate.",
    "",
    "Reproduce in PowerShell: `$env:QLATT_STRESS_REPORT='1'; npx vitest run test/lexical-stress-evaluation.test.ts`. Unset the variable afterward.",
    "",
    "Reference mode strips digits from supplied phones and accepts only variants with the same segment sequence. OOV mode disables all dictionary lookups; its stress scores compare syllable count and primary position/pattern, not segment accuracy. Exact OOV pronunciation is reported separately.",
    "",
    "The baseline reproduces the count/hint rule at e3e8b4cf for these flat-phone paths. Neither mode measures dictionary-root morphology coverage. Held-out words were fixed before this report and were not used to tune the policy after seeing these results.",
    "",
    "| Mode | Primary correct | Complete pattern correct |",
    "|---|---:|---:|",
  ];
  for (const key of ["baselineReference", "reference", "baselineOov", "oov"] as const) {
    lines.push(
      `| ${key} | ${rows.filter((row) => row[key].primary).length}/${rows.length} | ${rows.filter((row) => row[key].complete).length}/${rows.length} |`,
    );
  }
  lines.push(
    "",
    `Exact OOV pronunciations: ${rows.filter((row) => row.pronunciationExact).length}/${rows.length}.`,
    "",
    "All words and failures are retained. An asterisk means the complete pattern is not an accepted reference; primary-only successes remain in the totals above.",
    "",
    "| Word | Family | Accepted | Baseline reference | New reference | Baseline OOV | New OOV |",
    "|---|---|---|---|---|---|---|",
  );
  const cell = (value: { pattern: string; complete: boolean }) =>
    `${value.pattern}${value.complete ? "" : "*"}`;
  for (const row of rows)
    lines.push(
      `| ${row.word} | ${row.family} | ${row.gold.join(" / ")} | ${cell(row.baselineReference)} | ${cell(row.reference)} | ${cell(row.baselineOov)} | ${cell(row.oov)} |`,
    );
  lines.push("", "| Family | Reference pattern failures | OOV pattern failures |", "|---|---|---|");
  for (const family of Object.keys(evaluationWords)) {
    lines.push(
      `| ${family} | ${
        rows
          .filter((row) => row.family === family && !row.reference.complete)
          .map((row) => row.word)
          .join(", ") || "none"
      } | ${
        rows
          .filter((row) => row.family === family && !row.oov.complete)
          .map((row) => row.word)
          .join(", ") || "none"
      } |`,
    );
  }
  lines.push(
    "",
    "Full phone output makes upstream segment errors visible:",
    "",
    "| Word | Reference phones | Generated phones |",
    "|---|---|---|",
  );
  for (const row of rows)
    lines.push(`| ${row.word} | ${row.referencePhones} | ${row.generatedPhones} |`);
  return `${lines.join("\n")}\n`;
}
