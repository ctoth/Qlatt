/**
 * text-parser-port.ts
 * ===================
 * The text parser port (src/text-parser) run as DECtalk's say.exe runs the
 * original, so that its clauses can be set beside the recorded ones
 * (scripts/oracle/export-text-parser-fixture.ts). Shared by
 * scripts/oracle/compare-text-parser.ts and test/dectalk-text-parser.test.ts.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type ClauseOptions, readClauses } from "../../src/text-parser/clauses.ts";
import { dictionaryLookup } from "../../src/text-parser/dictionary.ts";
import { encodeWindows1252 } from "../../src/text-parser/frontend.ts";
import type { TextParserRule, TextParserTable } from "../../src/text-parser/interpreter.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// CMD/cm_text.c: US English is language bit 0 (:885); the default punctuation
// mode "some" is mode bit 1 (:846, cm_util.c:125); the main rules run with
// MODE_CITATION (:989, INCLUDE/esc.h).
const LANGUAGE = 0x01;
const PUNCTUATION_MODE = 0x02;
const MAIN_MODE = 0x0100;
/**
 * What say.exe sends after the text: eight spaces, and the clause end a
 * forced speak appends (samples/SAY/say.c:249, API/ttsapi.c:4559).
 */
const SAY_ENDING = `${" ".repeat(8)}\x0b`;
/**
 * The recorded fixtures: the first lists; the second list of probes; the
 * fourth, with the 150 texts of the messy sweep
 * (test/oracle-corpora/dectalk-us-messy-sweep-v1.json); the fifth and sixth;
 * the seventh, the 150 texts of the second messy sweep
 * (test/oracle-corpora/dectalk-us-messy-sweep-2-v1.json).
 */
const FIXTURES = [
  "dectalk-us-text-parser-v1.json",
  "dectalk-us-text-parser-b-v1.json",
  "dectalk-us-text-parser-d-v1.json",
  "dectalk-us-text-parser-e-v1.json",
  "dectalk-us-text-parser-f-v1.json",
  "dectalk-us-text-parser-g-v1.json",
];
/** say.exe's closing flush, as export-text-parser-fixture.ts leaves it out. */
const FLUSH = /^(?:\s|\\x0[ab])*$/;

/** A byte outside printable ASCII as the trace writes it. */
export const visible = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 && code < 0x7f && char !== "\\"
        ? char
        : `\\x${code.toString(16).padStart(2, "0")}`;
    })
    .join("");

export interface PortOptions {
  /** Ask the frontend's dictionary (public/dectalk-dictionary.json). Default: yes. */
  dictionary?: boolean;
  onHit?: ClauseOptions["onHit"];
}

/** A function from a text to the port's clauses, written as the fixture writes them. */
export function textParserPort(options: PortOptions = {}): (text: string) => string[] {
  const table = JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        "public",
        "rules",
        "frontends",
        "dectalk-english",
        "text-parser-table.json",
      ),
      "utf8",
    ),
  ) as TextParserTable;
  const words = new Set(
    Object.keys(
      JSON.parse(
        fs.readFileSync(path.join(repoRoot, "public", "dectalk-dictionary.json"), "utf8"),
      ) as Record<string, unknown>,
    ),
  );
  const dictionary =
    options.dictionary === false ? undefined : dictionaryLookup(table, (word) => words.has(word));
  // The text reaches the parser in Windows-1252, as say.exe's argument does.
  return (text) =>
    readClauses(table, encodeWindows1252(text) + SAY_ENDING, {
      language: LANGUAGE,
      punctuationSection: 1,
      punctuationMode: PUNCTUATION_MODE,
      mainSection: 2,
      mainMode: MAIN_MODE,
      dictionary,
      onHit: options.onHit,
    })
      .map((clause) => visible(clause.text))
      .filter((clause) => !FLUSH.test(clause));
}

/**
 * The third list of probes: commands that mark a place in the text. DECtalk
 * writes an index byte where such a command stood; the port does not carry
 * index marks, so this fixture is compared apart from the others
 * (test/dectalk-text-parser.test.ts).
 */
export const INDEX_COMMAND_FIXTURE = "dectalk-us-text-parser-c-v1.json";

/** The recorded clauses of each text; null where say.exe would not take the text. */
export function recordedClauses(
  files: readonly string[] = FIXTURES,
): Record<string, string[] | null> {
  const entries: Record<string, string[] | null> = {};
  for (const file of files) {
    Object.assign(
      entries,
      (
        JSON.parse(
          fs.readFileSync(path.join(repoRoot, "test", "fixtures", "dectalk-oracle", file), "utf8"),
        ) as { entries: Record<string, string[] | null> }
      ).entries,
    );
  }
  return entries;
}

function parserTable(): TextParserTable {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        "public",
        "rules",
        "frontends",
        "dectalk-english",
        "text-parser-table.json",
      ),
      "utf8",
    ),
  ) as TextParserTable;
}

/**
 * The rules the port's two passes can start: those of the punctuation section
 * and the main section whose language mask has the port's language bit and
 * whose mode mask has the pass's mode bit (par_pars1.c:1242-1278; a mode mask
 * of all ones passes any mode). A rule reached only as another rule's hit or
 * miss target is run whatever its masks say and is not counted here.
 */
export function liveRules(): TextParserRule[] {
  const table = parserTable();
  const passes = [
    { section: 1, mode: PUNCTUATION_MODE },
    { section: 2, mode: MAIN_MODE },
  ];
  return passes.flatMap(({ section, mode }) => {
    const start = table.sections[section];
    const end = table.sections[section + 1] ?? table.rules.length;
    return table.rules
      .slice(start, end)
      .filter(
        (rule) =>
          rule.kind === "rule" &&
          ((rule.language as number) & LANGUAGE) !== 0 &&
          (rule.mode === 0xffffffff || ((rule.mode as number) & mode) !== 0),
      );
  });
}

/** How many times each rule (by its number) hit over the recorded texts of all fixtures. */
export function firedRules(): Map<number, number> {
  const fired = new Map<number, number>();
  const port = textParserPort({
    onHit: (hit) => {
      const number = hit.rule.number as number;
      fired.set(number, (fired.get(number) ?? 0) + 1);
    },
  });
  for (const text of Object.keys(recordedClauses([...FIXTURES, INDEX_COMMAND_FIXTURE]))) {
    port(text);
  }
  return fired;
}
