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
import { clauseTexts, readClauses } from "./clauses";
import { newCommandSlots, optionIndex, type ReadCommand } from "./commands";
import { dictionaryLookup } from "./dictionary";
import type { TextParserTable } from "./interpreter";
import { phonemeCharacters, type ReadPhonemes } from "./phonemes";

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
  /**
   * Commands whose routine sends an item or syncs but that do not end the
   * clause they stand in (the table's flags say only what a routine may do).
   */
  commandsWithoutClauseEnd: readonly string[];
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
  const without = raw.commands_without_clause_end ?? [];
  if (!Array.isArray(without) || without.some((name) => typeof name !== "string")) {
    throw new Error(
      "E_FRONTEND_CONFIG: text_parser.commands_without_clause_end must be a list of command names",
    );
  }
  return {
    tablePath: raw.table_path,
    language: integer(raw.language, "language"),
    punctuation: pass(raw.punctuation, "punctuation"),
    main: pass(raw.main, "main"),
    ending: raw.ending,
    commandsWithoutClauseEnd: without as string[],
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
export function encodeWindows1252(text: string): string {
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
  /**
   * What commands that stand before any spoken text ask for: the voice (a
   * name of the table's voice_names) and the speaking rate in words per
   * minute for the whole text.
   */
  initial: { voice?: string; rate?: number };
}

export interface TextParserRunOptions {
  /** Told of each command that is in error or not carried out. */
  diagnostics?: { warn(message: string, data: Record<string, unknown>, code: string): void };
  /**
   * The speaking rate, in words per minute, the text starts with: the number
   * the commands' first slot holds, as after the host's own rate command
   * (say.exe is driven with "[:ra N]" in front of a text). 0 when absent.
   */
  initialRate?: number;
}

/**
 * Run a frontend's text parser over `text`. `hasWord` answers whether the
 * frontend's dictionary has a word, given in lower case.
 *
 * In-text commands are read against the table's command table
 * (src/text-parser/commands.ts). Carried out: a voice and a rate command
 * that stand before any spoken text (they set the whole text's voice and
 * rate), the clause end a command makes (CMD/cm_copt.c, the routines that
 * send an item down the text pipe or sync: letter-to-sound speaks the text
 * it holds and the phonemic stage ends the clause, LTS/ls_task.c:446-470,
 * PH/ph_task.c:657-668), and the spoken error. Every other command is
 * recognised and recorded by name as not carried out.
 */
export function runTextParser(
  config: TextParserConfig,
  text: string,
  hasWord: (lowerCaseWord: string) => boolean,
  provenance: ProvenanceCollector,
  options: TextParserRunOptions = {},
): TextParserResult {
  const slots = newCommandSlots();
  slots[0] = options.initialRate ?? 0;
  // Each bracket taken out of the text, in order: commands, or phonemic text.
  const brackets: Array<{
    body: string;
    clausesBefore: number;
    read: readonly ReadCommand[];
    phonemes?: { read: ReadPhonemes; speak: boolean };
  }> = [];
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
  const clauses = readClauses(table, encodeWindows1252(text) + config.ending, {
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
    commandSlots: slots,
    onCommand: (body, clausesBefore, read) => {
      brackets.push({ body, clausesBefore, read });
    },
    onPhonemes: (body, clausesBefore, read, speak) => {
      brackets.push({ body, clausesBefore, read: [], phonemes: { read, speak } });
    },
  });

  // The text that goes on: the clauses in order, and before each clause what
  // the commands that stood in front of it put into the text.
  const texts = clauseTexts(table, clauses);
  const clauseEnd = String.fromCharCode(table.clauses.clauseEnd);
  const commandTable = table.commandTable;
  const initial: TextParserResult["initial"] = {};
  let spoken = false;
  let out = "";
  const record = (type: string, reason: string, citations: string[]): void => {
    const decision = provenance.add({
      stage: "transcribe",
      type,
      subject: "text_parser",
      reason,
      citations,
      parents: [input.id],
    });
    decisionIds.push(decision.id);
  };
  const notCarriedOut = (written: string, name: string, why: string): void => {
    record(
      "text_parser_command_not_carried_out",
      `The command ${written} (${name}) was recognised and taken out of the text; ${why}`,
      [
        `DECtalk 4.63 CMD/C_US_CDE.H command_table[] (the command ${name}), as commandTable in ${config.tablePath}`,
      ],
    );
    options.diagnostics?.warn(
      `The in-text command ${written} (${name}) is not carried out: ${why}`,
      { command: name, written },
      "W_TEXT_COMMAND_NOT_CARRIED_OUT",
    );
  };
  // A spoken error: the clause end of cm_cmd_sync, the error's text, a
  // clause end (CMD/cm_cmd.c:864-873, the default error mode).
  const speakError = (written: string, code: number, what: string): void => {
    const errorText = commandTable?.errorTexts[code] ?? "";
    record(
      "text_parser_command_error",
      `The command ${written} is in error (${what}); as DECtalk does by default, the text ${quoted(errorText)} is spoken in its place`,
      [
        "DECtalk 4.63 CMD/cm_cmd.c:812-873 (cm_cmd_error_comm, error mode speak: a sync, the error's text, a clause end)",
        "DECtalk 4.63 INCLUDE/usa_err.tab (the texts)",
      ],
    );
    options.diagnostics?.warn(
      `The in-text command ${written} is in error (${what}); "${errorText}" is spoken`,
      { written, error: what },
      "W_TEXT_COMMAND_ERROR",
    );
    out += clauseEnd + errorText + clauseEnd;
    spoken = true;
  };
  texts.forEach((clauseText, index) => {
    for (const bracket of brackets) {
      if (bracket.clausesBefore !== index) continue;
      if (bracket.phonemes) {
        // Phonemic text in a bracket: its symbols go on as phonemic text
        // between the table's two marks, when phonemes are spoken. On an
        // error the symbols read before it stand and the error is spoken.
        const { read, speak } = bracket.phonemes;
        const shown = quoted(`[${decode(bracket.body, marks)}]`);
        if (speak && read.phonemes.length > 0) {
          out +=
            String.fromCharCode(table.clauses.phonesOn) +
            phonemeCharacters(read.phonemes) +
            String.fromCharCode(table.clauses.phonesOff);
          spoken = true;
        }
        record(
          "text_parser_phonemes",
          `The bracket ${shown} is phonemic text (the phoneme mode is on): ${read.phonemes.length.toString()} symbols` +
            (speak ? "" : ", not spoken (the phoneme mode is silent)"),
          [
            "DECtalk 4.63 CMD/cm_pars.c:1399-1420 (a bracket in the phoneme mode), CMD/cm_phon.c:438-634 (cm_phon_match)",
            "DECtalk 4.63 INCLUDE/usa_phon.tab (usa_arpa[], usa_ascky[])",
          ],
        );
        // What of a spoken bracket this frontend leaves out: a pitch (the
        // second number after a symbol) and a silence symbol.
        const leftOut = [
          ...(read.phonemes.some((phoneme) => phoneme.parameters.length > 1)
            ? ["a pitch written on a symbol is not applied (its duration is)"]
            : []),
          ...(read.phonemes.some((phoneme) => phoneme.symbol === 0)
            ? ["a silence symbol is dropped"]
            : []),
        ];
        if (speak && leftOut.length > 0) {
          record(
            "text_parser_phonemes_not_carried_out",
            `Of the phonemic text ${shown}: ${leftOut.join("; ")}`,
            [
              "DECtalk 4.63 PH/ph_task.c:835-852 (the numbers after a phoneme: user_durs, user_f0)",
              "DECtalk 4.63 PH/ph_sort.c:1657-1710 (interp_user_f0: a pitch selects phoneme targets or singing)",
            ],
          );
          options.diagnostics?.warn(
            `Of the phonemic text ${shown}: ${leftOut.join("; ")}`,
            { written: shown },
            "W_TEXT_PHONEMES_NOT_CARRIED_OUT",
          );
        }
        if (read.error && commandTable) {
          speakError(shown, commandTable.errorCodes.phoneme, "a character in it is no phoneme");
        }
        continue;
      }
      const written = quoted(`[:${decode(bracket.body, marks)}]`);
      if (!commandTable) {
        record(
          "text_parser_command_dropped",
          `The command ${written} was taken out of the text and not carried out: the table has no command table`,
          ["DECtalk 4.63 CMD/cm_pars.c:1379-1403 (a bracket and a colon start a command)"],
        );
        continue;
      }
      for (const command of bracket.read) {
        if (command.kind === "error") {
          speakError(
            written,
            commandTable.errorCodes[command.error],
            command.error === "command"
              ? "its name is no command, or begins more than one"
              : `a parameter of ${command.row?.name ?? "the command"} cannot be read`,
          );
          continue;
        }
        const { row } = command;
        // Whether the clause in front of the command ends: the routine sends
        // an item down the text pipe or syncs, and the frontend's policy
        // does not except the command.
        const endsClause =
          (row.sendsItem || row.syncs) && !config.commandsWithoutClauseEnd.includes(row.name);
        const rate = row.routine === "cm_cmd_rate";
        const voice = row.routine === "cm_cmd_name";
        if (row.routine === "cm_cmd_phoneme") {
          // The clause reader has set the mode already (clauses.ts); a word
          // that is no option is the routine's error (CMD/cm_copt.c:228-231).
          const modes = commandTable.options.phoneme_modes ?? [];
          const words = command.words.filter((word): word is string => word !== undefined);
          if (words.some((word) => optionIndex(modes, word) < 0)) {
            speakError(written, commandTable.errorCodes.string, "a word of it is no phoneme mode");
            continue;
          }
          record(
            "text_parser_command",
            `The command ${written} (phoneme) sets how a bracket is read from here on: ${words.map((word) => modes[optionIndex(modes, word)]).join(", ") || "nothing changed"}`,
            [
              "DECtalk 4.63 CMD/cm_copt.c:221-280 (cm_cmd_phoneme), CMD/cm_util.c:139 (the mode DECtalk starts in: off, spoken, arpabet)",
            ],
          );
          continue;
        }
        if (voice) {
          const names = commandTable.options.voice_names ?? [];
          const number = row.voice ?? optionIndex(names, command.words[0]);
          const name = names[number];
          if (name === undefined) {
            speakError(written, commandTable.errorCodes.string, "its word is no voice");
            continue;
          }
          if (!spoken) {
            initial.voice = name;
            record(
              "text_parser_command",
              `The command ${written} (${row.name}) stands before any spoken text: the text is spoken by the voice ${name}`,
              ["DECtalk 4.63 CMD/cm_copt.c:2377-2422 (cm_cmd_name), CMD/C_US_CDE.H voice_names[]"],
            );
            continue;
          }
          notCarriedOut(
            written,
            row.name,
            `the clause before it is ended, but the voice stays: a voice change inside a text (to ${name}) is not ported`,
          );
        } else if (rate) {
          const [low, high] = commandTable.rate.command;
          const [slowest, fastest] = commandTable.rate.spoken;
          const asked = command.numbers[0] ?? 0;
          const value = Math.min(fastest, Math.max(slowest, Math.min(high, Math.max(low, asked))));
          if (!spoken) {
            initial.rate = value;
            record(
              "text_parser_command",
              `The command ${written} (rate) stands before any spoken text: the text is spoken at ${value.toString()} words per minute` +
                (command.untyped[0]
                  ? " (no number was typed: the command's number slot still held this one)"
                  : value !== asked
                    ? ` (${asked.toString()} is outside ${low.toString()} to ${high.toString()} for the command and ${slowest.toString()} to ${fastest.toString()} for the phonemic stage)`
                    : ""),
              [
                "DECtalk 4.63 CMD/cm_copt.c:2332-2376 (cm_cmd_rate), CMD/cm_defs.h:62-69 (the command's limits), PH/ph_task.c:710-714 (the phonemic stage's)",
                "DECtalk 4.63 CMD/cm_cmd.c:766-790 (a command's numbers are not reset between commands)",
              ],
            );
            continue;
          }
          notCarriedOut(
            written,
            row.name,
            `the clause before it is ended, but the rate stays: a rate change inside a text (to ${value.toString()} words per minute) is not ported`,
          );
        } else {
          notCarriedOut(
            written,
            row.name,
            endsClause
              ? "the clause before it is ended as DECtalk ends it, and nothing else is done"
              : "DECtalk does not end the clause for it, and nothing is done",
          );
        }
        if (endsClause) out += clauseEnd;
      }
    }
    out += clauseText;
    if ([...clauseText].some((char) => char !== clauseEnd && char.trim() !== "")) spoken = true;
  });
  return { text: decode(out, marks), decisionIds, initial };
}
