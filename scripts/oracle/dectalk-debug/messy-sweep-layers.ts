/**
 * messy-sweep-layers.ts
 * =====================
 * For every text of a sweep corpus that is not sample-exact, says at which
 * layer the dectalk-english frontend first parts from DECtalk 4.63:
 *
 *   P  DECtalk's command parser rewrote the text (or ended a clause where no
 *      sentence punctuation stands) and the frontend's symbols differ
 *   L  the parser handed the text on as written and letter-to-sound's symbols
 *      differ from the frontend's
 *   S  the symbols into the phonemic stage are the same: a later stage
 *
 * Three things are recorded for each text: the text as it leaves the command
 * parser and the symbols the phonemic stage receives (both from the
 * instrumented say.exe, text-trace.ts), and the frontend's own symbols at the
 * same point: the phones its transcription selects, before any rule of the
 * phonemic stage, with their stress and the word and clause boundaries.
 *
 * What is compared is phones, primary and secondary stress, word boundaries
 * and clause ends. A phrase mark of DECtalk's counts as the word boundary it
 * stands at; its morpheme and compound marks and its "special word" mark are
 * left out of the comparison (they are printed), so a row of class S can still
 * differ in one of those, or in which phrase a word begins.
 *
 * A row of class P may hide a letter-to-sound difference behind the parser's;
 * the classes say where the first difference is, not that it is the only one.
 * The notes of the L rows are written by hand, below, from the source.
 *
 * Usage (instrumented say.exe as for trace-text.ts):
 *   DECTALK_SAY_EXE=... DECTALK_WORKDIR=... \
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/messy-sweep-layers.ts \
 *     --corpus test/oracle-corpora/dectalk-us-messy-sweep-v1.json \
 *     --sweep <sweep result json> [--out <report.md>]
 *
 * The sweep result is the json a sample comparison of the corpus wrote
 * (`results[]` with `samplesOracle`, `samplesEqual`, `packetsOracle`,
 * `packetsRender`); a text is exact when every sample is equal.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProvenanceCollector } from "../../../src/provenance";
import { textToKlattTrackDetailed } from "../../../src/tts-frontend";
import { dectalkAllophoneName } from "../allophones";
import { requiredEnvironment, runTextTrace } from "./text-trace";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const HYPHEN_NOTE =
  "LTS/ls_task.c:4208 ls_task_process_word reads a word in the chunks between its hyphens and " +
  "sends the compound mark # between them (:4330 after a chunk the dictionary has, :4374 after " +
  "one the rules read); the frontend makes each chunk a word";
const RANGE_NOTE =
  'digits, a hyphen and digits in one word: DECtalk says the word "dash" between the two ' +
  "numbers; the frontend says the numbers only. Routine not traced";
const FRACTION_NOTE =
  "LTS/ls_task.c:3688 ls_task_frac_processing speaks the fraction itself (halves and quarters " +
  "by name, the numerator joined to them with #); the frontend writes it out as words";
const MONEY_NOTE =
  'LTS/ls_task.c:3148 ls_task_currency_processing: a word such as "million" after the amount ' +
  'goes before "dollars" (test/dectalk-number-tokens.test.ts lists these as not read, citing ' +
  ":3234-3309)";
const ORDINAL_NOTE =
  "LTS/ls_task.c:3967-3972 with LTS/ls_util.c:517 ls_util_is_ordinal: the number routine " +
  "speaks the ordinal; ported in commit 5d157be2, which the sweep's base did not have";
const SPELLED_WORD_NOTE =
  'the word with "?!" or "!?" on it is spelled letter by letter and the first mark is named ' +
  '("question mark", "exclamation point"); the frontend speaks the word. Routine not traced ' +
  "(LTS/ls_task.c:2371 ls_task_spell_all_punct and the right-punctuation stripping at :2303 " +
  "are where to look)";

/** What the L rows were traced to, by text id. Written from the source, not generated. */
const NOTES: Readonly<Record<string, string>> = {
  "ms-001": HYPHEN_NOTE,
  "ms-002": HYPHEN_NOTE,
  "ms-003": HYPHEN_NOTE,
  "ms-004": HYPHEN_NOTE,
  "ms-005": HYPHEN_NOTE,
  "ms-006": HYPHEN_NOTE,
  "ms-007": HYPHEN_NOTE,
  "ms-008": RANGE_NOTE,
  "ms-009": RANGE_NOTE,
  "ms-010": RANGE_NOTE,
  "ms-011": RANGE_NOTE,
  "ms-012": RANGE_NOTE,
  "ms-034":
    "two words joined by a slash are sent as one word with the morpheme mark * between; the " +
    "frontend makes two words. Routine not traced",
  "ms-035":
    "as ms-034, and both parts are stressed where the frontend has the unstressed function " +
    "words. Routine not traced",
  "ms-037":
    'a slash standing alone is spoken as the word "slash" (a word that is all punctuation is ' +
    "spelled: LTS/ls_task.c:2371 ls_task_spell_all_punct); the frontend drops it",
  "ms-060": ORDINAL_NOTE,
  "ms-061": ORDINAL_NOTE,
  "ms-062": ORDINAL_NOTE,
  "ms-068": FRACTION_NOTE,
  "ms-069": FRACTION_NOTE,
  "ms-071": FRACTION_NOTE,
  "ms-072": FRACTION_NOTE,
  "ms-073": FRACTION_NOTE,
  "ms-093":
    '"AM" in capitals is spelled A, M where the frontend has the word "am"; DECtalk also ends ' +
    'a clause before "at" with no punctuation written there. Neither routine traced',
  "ms-109": MONEY_NOTE,
  "ms-111": MONEY_NOTE,
  "ms-129":
    'an abbreviation with a comma on it ("Jr.,"): LTS/ls_task.c:2436 ' +
    "ls_task_dictionary_after_punct looks the word up again after stripping the comma and " +
    "finds the dictionary's abbreviation; the frontend's abbreviation rule wants white space " +
    "after the period, so the letters are spelled",
  "ms-130":
    'capitals and periods with a comma on them ("M.D.,"): the letters are spelled ' +
    "(LTS/ls_task.c:2840-2890) once the comma is stripped; the frontend's rule wants white " +
    "space after the last period and leaves a sentence end after each letter",
  "ms-139": SPELLED_WORD_NOTE,
  "ms-143": SPELLED_WORD_NOTE,
  "ms-149":
    'DECtalk ends a clause before "and" in this long text with no punctuation; the frontend ' +
    "has one clause. Routine not traced",
};

interface SweepResult {
  id: string;
  samplesOracle: number;
  samplesEqual: number;
  packetsOracle: number;
  packetsRender: number;
}

interface CorpusEntry {
  id: string;
  text: string;
  group?: string;
}

function argument(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

const MARKS_LEFT_OUT = new Set(["(special)", "~", "*", "#", "-", "`3"]);
// A phrase mark stands where a word begins, in place of the word boundary or after it.
const PHRASE_MARKS = new Set(["(pp)", "(vp)", "(rel)"]);
const CLAUSE_ENDS = new Set([",", ".", "?", "!"]);

/**
 * DECtalk's symbols as compared: without the clause's first silence and the
 * marks left out, a phrase mark read as the word boundary it stands at.
 */
function comparedSymbols(clauses: readonly (readonly string[])[]): string[] {
  const out: string[] = [];
  for (const clause of clauses) {
    clause.forEach((raw, index) => {
      if (index === 0 && raw === "SIL") return;
      if (MARKS_LEFT_OUT.has(raw)) return;
      const symbol = PHRASE_MARKS.has(raw) ? "_" : raw;
      // A word boundary in front of a clause end, after one, or doubled, says nothing more.
      if (CLAUSE_ENDS.has(symbol) && out.at(-1) === "_") out.pop();
      const last = out.at(-1);
      if (symbol === "_" && (last === undefined || last === "_" || CLAUSE_ENDS.has(last))) return;
      out.push(symbol);
    });
  }
  return out;
}

/** The frontend's symbols at the same point, from its transcription records. */
function frontendSymbols(text: string): string[] {
  const provenance = createProvenanceCollector();
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
    provenance,
  });
  const out: string[] = [];
  let lastToken = "";
  for (const decision of provenance.getDecisions()) {
    if (decision.type !== "inventory_target_selected") continue;
    const match = /for '([^']+)' with stress (\S+) from (\S+)/.exec(decision.reason);
    if (!match) throw new Error(`unread transcription record: ${decision.reason}`);
    const [, phone, stress, token] = match as unknown as [string, string, string, string];
    const tokenItem = utterance.getItem(token.split(":")[0] as string);
    const mark = tokenItem?.get("punctuationSymbol");
    if (typeof mark === "string" && mark.length > 0) {
      if (out.at(-1) === "_") out.pop();
      out.push(mark === ";" || mark === ":" ? "," : mark);
      lastToken = "";
      continue;
    }
    if (lastToken !== "" && token !== lastToken) out.push("_");
    lastToken = token;
    if (stress === "1") out.push("'");
    if (stress === "2") out.push("`");
    out.push(dectalkAllophoneName(phone));
  }
  return out;
}

/** The parser's clauses that hold text, and whether one ends where no sentence punctuation stands. */
function parserText(clauses: readonly string[]): { text: string; oddClauseEnd: boolean } {
  const spoken = clauses
    .map((clause) => clause.replace(/\\x[0-9a-f]{2}/g, " ").trim())
    .filter((clause) => clause.length > 0);
  return {
    text: spoken.join(" ").replace(/\s+/g, " "),
    oddClauseEnd: spoken.slice(0, -1).some((clause) => !/[.,;:!?]["')]*$/.test(clause)),
  };
}

function cell(text: string): string {
  return text.replace(/\|/g, "\\|");
}

function main(): void {
  const corpusPath = argument("--corpus");
  const sweepPath = argument("--sweep");
  if (!corpusPath || !sweepPath) throw new Error("--corpus and --sweep are required");
  const outPath = path.resolve(
    argument("--out") ??
      path.join(repoRoot, "scripts", "oracle", "dectalk-debug", "messy-sweep-layers.md"),
  );
  const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as {
    corpusId: string;
    entries: CorpusEntry[];
  };
  const sweep = JSON.parse(fs.readFileSync(sweepPath, "utf8")) as { results: SweepResult[] };
  const inexact = new Set(
    sweep.results
      .filter(
        (result) =>
          result.samplesEqual !== result.samplesOracle ||
          result.packetsOracle !== result.packetsRender,
      )
      .map((result) => result.id),
  );
  const exe = requiredEnvironment("DECTALK_SAY_EXE");
  const workDir = requiredEnvironment("DECTALK_WORKDIR");
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "dectalk-layers-"));
  const rows: string[] = [];
  const byClass: Record<string, number> = { P: 0, L: 0, S: 0 };
  const byGroup = new Map<string, Record<string, number>>();
  try {
    for (const entry of corpus.entries) {
      if (!inexact.has(entry.id)) continue;
      const trace = runTextTrace(entry.text, exe, workDir, scratch);
      const parser = parserText(trace.parserClauses);
      const theirs = comparedSymbols(trace.symbolClauses);
      const ours = frontendSymbols(entry.text);
      const same = theirs.join(" ") === ours.join(" ");
      const rewritten = parser.text !== entry.text.replace(/\s+/g, " ").trim();
      const layer = same ? "S" : rewritten || parser.oddClauseEnd ? "P" : "L";
      byClass[layer] = (byClass[layer] ?? 0) + 1;
      const group = entry.group ?? "";
      const counts = byGroup.get(group) ?? { P: 0, L: 0, S: 0 };
      counts[layer] = (counts[layer] ?? 0) + 1;
      byGroup.set(group, counts);
      const parserCell = rewritten
        ? parser.text
        : parser.oddClauseEnd
          ? `(as written; clauses: ${trace.parserClauses
              .map((clause) => clause.replace(/\\x[0-9a-f]{2}/g, " ").trim())
              .filter((clause) => clause.length > 0)
              .join(" / ")})`
          : "(as written)";
      rows.push(
        `| ${entry.id} | ${group} | ${layer} | ${cell(entry.text)} | ${cell(parserCell)} | ${cell(
          trace.symbolClauses.map((clause) => clause.join(" ")).join(" / "),
        )} | ${cell(ours.join(" "))} | ${cell(NOTES[entry.id] ?? "")} |`,
      );
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
  const groups = [...byGroup.keys()].sort();
  const report = [
    `# Layer map of the inexact texts of ${corpus.corpusId}`,
    "",
    "Generated by scripts/oracle/dectalk-debug/messy-sweep-layers.ts; do not edit. See that",
    "file's header for how a class is decided and what the comparison leaves out.",
    "",
    `Texts in the corpus: ${corpus.entries.length.toString()}. Not sample-exact in the sweep result: ${inexact.size.toString()}.`,
    "",
    "| class | meaning | texts |",
    "|---|---|---|",
    `| P | the command parser rewrote the text or ended a clause without sentence punctuation, and the symbols differ | ${String(byClass.P)} |`,
    `| L | the parser handed the text on as written and letter-to-sound's symbols differ | ${String(byClass.L)} |`,
    `| S | same symbols into the phonemic stage: a later stage | ${String(byClass.S)} |`,
    "",
    "| group | P | L | S |",
    "|---|---|---|---|",
    ...groups.map((group) => {
      const counts = byGroup.get(group) as Record<string, number>;
      return `| ${group} | ${String(counts.P)} | ${String(counts.L)} | ${String(counts.S)} |`;
    }),
    "",
    "DECtalk's symbols are printed whole, clauses separated by ` / `; ours are printed as compared.",
    "",
    "| id | group | class | text | text leaving the parser | DECtalk's symbols | the frontend's symbols | note |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
  fs.writeFileSync(outPath, report);
  console.log(
    JSON.stringify({ out: path.relative(repoRoot, outPath), inexact: inexact.size, byClass }),
  );
}

main();
