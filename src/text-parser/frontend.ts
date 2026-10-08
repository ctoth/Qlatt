/**
 * A frontend's command text parser: the step that rewrites the text it is
 * given before anything else reads it, for a frontend whose policy names a
 * rule table (`text_parser` in frontend.yaml). The rules, the passes and the
 * language are the policy's and the table's; this file only runs them and
 * records what they did.
 *
 * The parser reads bytes. The text is given to it in Windows-1252, the code
 * page DECtalk 4.63's Windows programs receive their text in (its rules name
 * the typographic quotes by those codes, CMD/par_rule2.par:300-301).
 */

import type { ProvenanceCollector } from "../provenance";
import { loadYamlDocumentSync } from "../yaml-loader";
import { clauseStream, readClauses } from "./clauses";
import { dictionaryLookup } from "./dictionary";
import type { TextParserTable } from "./interpreter";

export interface TextParserPass {
  section: number;
  mode: number;
}

export interface TextParserConfig {
  tablePath: string;
  language: number;
  punctuation: TextParserPass;
  main: TextParserPass;
  /** What the host sends after the text to have it spoken. */
  ending: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The `text_parser` block of a frontend's policy; null when it has none. */
export function parseTextParserConfig(spec: object): TextParserConfig | null {
  const raw = (spec as { text_parser?: unknown }).text_parser;
  if (raw === undefined || raw === null) return null;
  if (!isRecord(raw)) throw new Error("E_FRONTEND_CONFIG: text_parser must be a mapping");
  const integer = (value: unknown, name: string): number => {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      throw new Error(`E_FRONTEND_CONFIG: text_parser.${name} must be a whole number`);
    }
    return value;
  };
  const pass = (value: unknown, name: string): TextParserPass => {
    if (!isRecord(value)) throw new Error(`E_FRONTEND_CONFIG: text_parser.${name} is required`);
    return {
      section: integer(value.section, `${name}.section`),
      mode: integer(value.mode, `${name}.mode`),
    };
  };
  if (typeof raw.table_path !== "string" || raw.table_path.length === 0) {
    throw new Error("E_FRONTEND_CONFIG: text_parser.table_path is required");
  }
  if (typeof raw.ending !== "string") {
    throw new Error("E_FRONTEND_CONFIG: text_parser.ending is required");
  }
  return {
    tablePath: raw.table_path,
    language: integer(raw.language, "language"),
    punctuation: pass(raw.punctuation, "punctuation"),
    main: pass(raw.main, "main"),
    ending: raw.ending,
  };
}

const tables = new Map<string, TextParserTable>();

/** The rule table at `path`, parsed once. */
export function textParserTableAt(path: string): TextParserTable {
  let table = tables.get(path);
  if (!table) {
    table = loadYamlDocumentSync<TextParserTable>(path);
    tables.set(path, table);
  }
  return table;
}

/** Windows-1252's characters at 0x80 to 0x9F; the rest of the page is Latin-1. */
const WINDOWS_1252: Readonly<Record<number, string>> = {
  128: "€",
  130: "‚",
  131: "ƒ",
  132: "„",
  133: "…",
  134: "†",
  135: "‡",
  136: "ˆ",
  137: "‰",
  138: "Š",
  139: "‹",
  140: "Œ",
  142: "Ž",
  145: "‘",
  146: "’",
  147: "“",
  148: "”",
  149: "•",
  150: "–",
  151: "—",
  152: "˜",
  153: "™",
  154: "š",
  155: "›",
  156: "œ",
  158: "ž",
  159: "Ÿ",
};
const TO_BYTE = new Map(Object.entries(WINDOWS_1252).map(([byte, char]) => [char, Number(byte)]));

/** The text as the bytes the parser reads, one character of the result per byte. */
function encode(text: string): string {
  return [...text]
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      if (code < 0x80 || (code >= 0xa0 && code <= 0xff)) return char;
      const byte = TO_BYTE.get(char);
      // A character the code page does not have arrives as a space.
      // engineering choice: Windows itself would substitute a question mark.
      return String.fromCharCode(byte ?? 0x20);
    })
    .join("");
}

/** The parser's output as text; its own marks stay as they are. */
function decode(bytes: string, marks: ReadonlySet<number>): string {
  return [...bytes]
    .map((char) => {
      const byte = char.charCodeAt(0);
      return marks.has(byte) ? char : (WINDOWS_1252[byte] ?? char);
    })
    .join("");
}

const quoted = (text: string): string => JSON.stringify(text);

/** Text with the parser's marks written out, for a decision's reason. */
function readable(text: string, table: TextParserTable): string {
  const char = (code: number): string => String.fromCharCode(code);
  const { phonesOn, phonesOff, clauseEnd, indexMark } = table.clauses;
  return quoted(
    text
      .split(char(phonesOn))
      .map((part, index) => {
        if (index === 0) return part;
        const end = part.indexOf(char(phonesOff));
        return end < 0
          ? `{phonemes ${part}`
          : `{phonemes ${part.slice(0, end)}}${part.slice(end + 1)}`;
      })
      .join("")
      .split(char(clauseEnd))
      .join("{clause end}")
      .split(char(indexMark))
      .join("{index}"),
  );
}

export interface TextParserResult {
  /** The text as the rules leave it, clauses joined. */
  text: string;
  /** The decisions that led to it: the input, then each rewrite. */
  decisionIds: string[];
}

/**
 * Run a frontend's text parser over `text`. `hasWord` answers whether the
 * frontend's dictionary has a word, given in lower case.
 */
export function runTextParser(
  config: TextParserConfig,
  text: string,
  hasWord: (lowerCaseWord: string) => boolean,
  provenance: ProvenanceCollector,
): TextParserResult {
  const table = textParserTableAt(config.tablePath);
  const marks = new Set([
    table.clauses.phonesOn,
    table.clauses.phonesOff,
    table.clauses.indexMark,
    table.clauses.clauseEnd,
  ]);
  const ruleText = (table as { ruleText?: string }).ruleText ?? "the rule text";
  const input = provenance.add({
    stage: "transcribe",
    type: "text_parser_input",
    subject: "text_parser",
    reason: `Text given to the text parser of ${config.tablePath}: ${quoted(text)}`,
    citations: [config.tablePath],
  });
  const decisionIds = [input.id];
  const clauses = readClauses(table, encode(text) + config.ending, {
    language: config.language,
    punctuationSection: config.punctuation.section,
    punctuationMode: config.punctuation.mode,
    mainSection: config.main.section,
    mainMode: config.main.mode,
    dictionary: dictionaryLookup(table, hasWord),
    onHit: ({ rule, before, after }) => {
      if (before === after) return;
      const decision = provenance.add({
        stage: "transcribe",
        type: "text_parser_rewrite",
        subject: `text_parser:R${rule.number}`,
        reason: `Rule R${rule.number} (${ruleText} line ${rule.line}) rewrote ${readable(decode(before, marks), table)} as ${readable(decode(after, marks), table)}; the rule: ${rule.text ?? "not in the rule text"}`,
        citations: [`DECtalk 4.63 ${ruleText}:${rule.line}`],
        parents: [input.id],
      });
      decisionIds.push(decision.id);
    },
    onCommand: (command) => {
      const decision = provenance.add({
        stage: "transcribe",
        type: "text_parser_command_dropped",
        subject: "text_parser",
        reason: `The command ${quoted(`[:${decode(command, marks)}]`)} was taken out of the text and not carried out: in-text commands are not ported`,
        citations: ["DECtalk 4.63 CMD/cm_pars.c:1379-1403 (a bracket and a colon start a command)"],
        parents: [input.id],
      });
      decisionIds.push(decision.id);
    },
  });
  return { text: decode(clauseStream(table, clauses), marks), decisionIds };
}
