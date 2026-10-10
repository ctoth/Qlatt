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
import type { TextScopeSource } from "../text-scopes";
import { loadYamlDocumentSync } from "../yaml-loader";
import { clauseTexts, PUNCTUATION_PASS, readClauses } from "./clauses";
import { commandScopes } from "./command-scopes";
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
   * name of the table's voice_names), the speaking rate in words per minute,
   * and what is added to the pause at a comma and at a period, in ms, for
   * the whole text.
   */
  initial: {
    voice?: string;
    rate?: number;
    pauseAddedMs?: { comma?: number; period?: number };
    /**
     * Changes to the voice's speaker definition, in order: the entry's index
     * and the number typed. A voice command after them starts again.
     */
    definition?: { index: number; value: number }[];
    /**
     * The modes of the letter-to-sound stage that are on, of those ported
     * (PORTED_MODES): names of the table's mode_options.
     */
    modes?: string[];
  };
  /**
   * What commands inside the text change, in the order of the text: each
   * holds for the text from `offset` on.
   */
  changes: TextParserChange[];
  /**
   * Where in the text a clause end stands that a command made by sending a
   * control item (UTF-16 offsets of the clause-end characters): the words
   * before it are parsed without it, where a clause end the flush character
   * made counts as one more of them.
   */
  itemClauseEnds: number[];
  /**
   * The scopes `changes` make of the text, for the frontend that runs the
   * parser (src/text-scopes.ts; command-scopes.ts works them out).
   */
  scopes: TextScopeSource;
}

/**
 * One command inside a text that changes how the text after it is spoken:
 * one of a voice, a rate, an addition to a pause, an entry of the speaker
 * definition.
 */
export interface TextParserChange {
  /** Where in the parser's text the change begins (UTF-16 offset). */
  offset: number;
  /** The parser's decision for the command. */
  decisionId: string;
  /** A name of the table's voice_names. */
  voice?: string;
  /** Words per minute. */
  rate?: number;
  pauseAddedMs?: { comma?: number; period?: number };
  /** An entry's index in the speaker definition and the number typed. */
  definition?: { index: number; value: number };
}

/**
 * The modes of DECtalk's letter-to-sound stage that a mode command before
 * any spoken text turns on here: spell (LTS/ls_task.c:1835-1871, every word
 * goes to the spelling routine).
 */
export const PORTED_MODES: readonly string[] = ["spell"];

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
  const changes: TextParserChange[] = [];
  let spoken = false;
  let out = "";
  const record = (type: string, reason: string, citations: string[]): string => {
    const decision = provenance.add({
      stage: "transcribe",
      type,
      subject: "text_parser",
      reason,
      citations,
      parents: [input.id],
    });
    decisionIds.push(decision.id);
    return decision.id;
  };
  // A command inside the text that changes how the text after it is spoken:
  // the clause before it is ended first (when the command ends one), and the
  // change holds from the place in the output text that is then reached.
  const changeFromHere = (
    change: Omit<TextParserChange, "offset" | "decisionId">,
    endsClause: boolean,
    reason: string,
    citations: string[],
  ): void => {
    // Each of these commands sends a control item (endClauseByItem below).
    if (endsClause) endClauseByItem();
    const decisionId = record("text_parser_command", reason, citations);
    changes.push({ offset: out.length, decisionId, ...change });
  };
  // A clause end made by a command that sends a control item down the text
  // pipe, not by the flush character: the words gathered so far are parsed
  // and spoken, and no character is added to them
  // (LTS/ls_task.c:404-470, any control item but an index goes to
  // parse_label), where the flush character is itself one of them (:368-373).
  const itemClauseEnds: number[] = [];
  const endClauseByItem = (): void => {
    itemClauseEnds.push(out.length);
    out += clauseEnd;
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
        // What of a spoken bracket this frontend leaves out: the numbers
        // written on a symbol that is no phone (a stress or hat mark, where
        // DECtalk takes them as the size and delay of the pitch gesture). A
        // phone's name begins with a letter; the silence's is "_".
        const names = commandTable?.phonemes.arpabet ?? [];
        const isPhone = (symbol: number): boolean =>
          symbol === 0 || /^[a-z]/.test(names[symbol] ?? "");
        const leftOut = [
          ...(read.phonemes.some(
            (phoneme) => phoneme.parameters.length > 0 && !isPhone(phoneme.symbol),
          )
            ? ["the numbers written on a stress or hat mark are not applied"]
            : []),
        ];
        if (speak && leftOut.length > 0) {
          record(
            "text_parser_phonemes_not_carried_out",
            `Of the phonemic text ${shown}: ${leftOut.join("; ")}`,
            [
              "DECtalk 4.63 PH/ph_task.c:835-852 (the numbers after a phoneme: user_durs, user_f0)",
              "DECtalk 4.63 PH/ph_sort.c:1657-1689 (interp_user_f0: numbers on a stress or hat symbol are a stress-impulse or hat command)",
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
            // usevoice() loads the voice's own definition
            // (PH/ph_vset.c:433-448): changes made before it are gone.
            delete initial.definition;
            record(
              "text_parser_command",
              `The command ${written} (${row.name}) stands before any spoken text: the text is spoken by the voice ${name}`,
              ["DECtalk 4.63 CMD/cm_copt.c:2377-2422 (cm_cmd_name), CMD/C_US_CDE.H voice_names[]"],
            );
            continue;
          }
          changeFromHere(
            { voice: name },
            endsClause,
            `The command ${written} (${row.name}) stands inside the text: the clause before it is ended and the text from here on is spoken by the voice ${name}, from that voice's own definition`,
            [
              "DECtalk 4.63 CMD/cm_copt.c:2377-2422 (cm_cmd_name), CMD/C_US_CDE.H voice_names[]",
              "DECtalk 4.63 PH/ph_task.c:665-676 (a control item ends the symbols that are pending with PERIOD), 723-733 (NEW_SPEAKER: usevoice)",
            ],
          );
          continue;
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
          changeFromHere(
            { rate: value },
            endsClause,
            `The command ${written} (rate) stands inside the text: the clause before it is ended and the text from here on is spoken at ${value.toString()} words per minute` +
              (command.untyped[0]
                ? " (no number was typed: the command's number slot still held this one)"
                : value !== asked
                  ? ` (${asked.toString()} is outside ${low.toString()} to ${high.toString()} for the command and ${slowest.toString()} to ${fastest.toString()} for the phonemic stage)`
                  : ""),
            [
              "DECtalk 4.63 CMD/cm_copt.c:2332-2376 (cm_cmd_rate), CMD/cm_defs.h:62-69 (the command's limits)",
              "DECtalk 4.63 PH/ph_task.c:665-676 (a control item ends the symbols that are pending with PERIOD), 710-714 (RATE: sprate)",
            ],
          );
          continue;
        } else if (row.routine === "cm_cmd_define") {
          // One word and its number (a list runs once for each pair). The
          // word's place in the option list less one is the entry's index;
          // the first word, "save", takes no number
          // (CMD/cm_copt.c:2840-2887).
          const words = commandTable.options.define_options ?? [];
          if (command.words[0] === undefined && command.untyped.every((none) => none)) {
            // Nothing typed: the routine returns at once (2847-2848).
            record(
              "text_parser_command",
              `The command ${written} (${row.name}) has no word: nothing is changed`,
              ["DECtalk 4.63 CMD/cm_copt.c:2847-2848 (cm_cmd_define with no parameter)"],
            );
            if (endsClause) out += clauseEnd;
            continue;
          }
          const option = optionIndex(words, command.words[0]);
          if (option < 0) {
            speakError(
              written,
              commandTable.errorCodes.string,
              "its word is no entry of a speaker definition",
            );
            continue;
          }
          const numberTyped = command.untyped[1] === false;
          if ((option === 0) === numberTyped) {
            speakError(
              written,
              commandTable.errorCodes.value,
              option === 0 ? "save takes no number" : "the entry has no number",
            );
            continue;
          }
          if (option === 0) {
            notCarriedOut(
              written,
              row.name,
              "DECtalk keeps the definition as it now stands for the voice Val (PH/ph_task.c SAVE, saveval); that voice is not ported, and the current voice is not changed by it",
            );
          } else if (!spoken) {
            const value = command.numbers[1] ?? 0;
            initial.definition = [...(initial.definition ?? []), { index: option - 1, value }];
            record(
              "text_parser_command",
              `The command ${written} (${row.name}) stands before any spoken text: entry ${words[option] ?? ""} of the voice's speaker definition is set to ${value.toString()} for the whole text (the voice's tuning table is added and the entry's limits hold)`,
              [
                "DECtalk 4.63 CMD/cm_copt.c:2840-2887 (cm_cmd_define: the word's place less one is the entry)",
                "DECtalk 4.63 PH/ph_vset.c:175-232 (setparam), 537-818 (setspdef derives the voice from the definition)",
              ],
            );
            continue;
          } else {
            const value = command.numbers[1] ?? 0;
            changeFromHere(
              { definition: { index: option - 1, value } },
              endsClause,
              `The command ${written} (${row.name}) stands inside the text: the clause before it is ended and entry ${words[option] ?? ""} of the voice's speaker definition is set to ${value.toString()} for the text from here on (the voice's tuning table is added and the entry's limits hold)`,
              [
                "DECtalk 4.63 CMD/cm_copt.c:2840-2887 (cm_cmd_define: the word's place less one is the entry)",
                "DECtalk 4.63 PH/ph_task.c:665-676 (a control item ends the symbols that are pending with PERIOD), 748-750 (NEW_PARAM: setparam)",
                "DECtalk 4.63 PH/ph_vset.c:175-232 (setparam), 537-818 (setspdef derives the voice from the definition)",
              ],
            );
            continue;
          }
        } else if (row.routine === "cm_cmd_stress") {
          // The pitch command stores a number (pitch_delta) that the
          // phonemic stage adds to the voice's average pitch when it gets a
          // PITCH_CHANGE item (PH/ph_task.c:751-757). Nothing in this build
          // sends that item (LTS/ls_util.c:1873 only names it in a debug
          // print), so the command changes no speech; here as in DECtalk,
          // anywhere in a text.
          record(
            "text_parser_command",
            `The command ${written} (pitch) sets the number DECtalk would raise the pitch by at a pitch-change item (${command.untyped[0] ? "0, no number typed" : (command.numbers[0] ?? 0).toString()}); nothing sends such an item, so no speech is changed`,
            [
              "DECtalk 4.63 CMD/cm_copt.c:3039-3048 (cm_cmd_stress stores pitch_delta)",
              "DECtalk 4.63 PH/ph_task.c:751-757 (its one use, at a PITCH_CHANGE item); LTS/ls_util.c:1873 (the item is named in a debug print and sent nowhere)",
            ],
          );
          continue;
        } else if (row.routine === "cm_cmd_volume") {
          notCarriedOut(
            written,
            row.name,
            "the clause before it is ended as DECtalk ends it; the command sets the volume of the audio device DECtalk plays through (StereoVolumeControl), not the samples, and there is no such device here",
          );
        } else if (row.routine === "cm_cmd_mode") {
          // The first word names a mode and the second says on, off or set;
          // both are words of one option list, the modes first
          // (CMD/cm_copt.c:2148-2250). A word that is no option is the string
          // error, a word of the wrong kind the parameter error, and a mode
          // alone sends nothing and ends no clause.
          const words = commandTable.options.mode_options ?? [];
          const actions = ["on", "off", "set"];
          const typed = command.words.filter((word) => word !== undefined);
          const mode = words[optionIndex(words, typed[0])];
          const action = words[optionIndex(words, typed[1])];
          // Each word in turn: is it an option at all, then is it of the
          // kind its place takes.
          const wrong = [
            { has: typed.length > 0, word: mode, fits: (word: string) => !actions.includes(word) },
            { has: typed.length > 1, word: action, fits: (word: string) => actions.includes(word) },
          ].flatMap(({ has, word, fits }) =>
            !has
              ? []
              : word === undefined
                ? ["string" as const]
                : fits(word)
                  ? []
                  : ["parameter" as const],
          )[0];
          if (wrong !== undefined) {
            speakError(
              written,
              commandTable.errorCodes[wrong],
              wrong === "string"
                ? "its word is no mode option"
                : "a mode comes first, then on, off or set",
            );
            continue;
          }
          if (mode === undefined || action === undefined) {
            record(
              "text_parser_command",
              `The command ${written} (${row.name}) names ${mode === undefined ? "no mode" : `the mode ${mode} and neither on, off nor set`}: nothing is changed and no clause is ended`,
              [
                "DECtalk 4.63 CMD/cm_copt.c:2148-2250 (cm_cmd_mode sends the mode and syncs at its second word only)",
              ],
            );
            continue;
          }
          const ported = PORTED_MODES.includes(mode);
          if (!spoken && (ported || action === "set")) {
            // LTS/ls_util.c:1197-1205: on adds the mode's flag, off takes it
            // away, and set leaves that flag alone standing.
            const before = initial.modes ?? [];
            const kept = action === "set" ? [] : before.filter((name) => name !== mode);
            const modes = ported && action !== "off" ? [...kept, mode] : kept;
            if (modes.length > 0) initial.modes = modes;
            else delete initial.modes;
            if (ported) {
              record(
                "text_parser_command",
                `The command ${written} (${row.name}) stands before any spoken text: the mode ${mode} is ${action === "off" ? "off" : "on"} for the whole text` +
                  (action === "set"
                    ? " (set also takes away every other mode; of those only the modes ported here are taken away)"
                    : ""),
                [
                  "DECtalk 4.63 CMD/cm_copt.c:2148-2250 (cm_cmd_mode)",
                  "DECtalk 4.63 LTS/ls_util.c:1197-1205 (LTS_MODE_SET, LTS_MODE_CLEAR, LTS_MODE_ABS on the mode flags)",
                ],
              );
              continue;
            }
          }
          notCarriedOut(
            written,
            row.name,
            ported
              ? `the clause before it is ended as DECtalk ends it, but the mode stays: a change of the mode ${mode} inside a text (${action}) is not ported`
              : `the clause before it is ended as DECtalk ends it; the mode (${mode} ${action}) is a flag of DECtalk's letter-to-sound stage (LTS_MODE_SET and LTS_MODE_CLEAR, CMD/cm_copt.c:2148-2260), and of the modes only ${PORTED_MODES.join(", ")} is ported` +
                  (action === "set" && !spoken
                    ? "; the modes that are ported are taken away, as set takes away every other mode"
                    : ""),
          );
        } else if (row.routine === "cm_cmd_punct") {
          // The clause reader has taken the mode already (clauses.ts), here
          // or anywhere in the text; a word that is no option is the
          // routine's error (CMD/cm_copt.c:1254-1256).
          const modes = commandTable.options.punct_options ?? [];
          const mode = modes[optionIndex(modes, command.words[0])];
          if (mode === undefined) {
            speakError(written, commandTable.errorCodes.string, "its word is no punctuation mode");
            continue;
          }
          if (mode === PUNCTUATION_PASS) {
            notCarriedOut(
              written,
              row.name,
              "in the mode pass DECtalk's text stage hands the characters on without reading clauses or running its rules, which is not ported: the mode stays",
            );
            continue;
          }
          record(
            "text_parser_command",
            `The command ${written} (punctuation) sets the punctuation mode to ${mode} from here on: the clause reader and the punctuation rules run in it`,
            [
              "DECtalk 4.63 CMD/cm_copt.c:1249-1276 (cm_cmd_punct stores the mode)",
              "DECtalk 4.63 CMD/cm_text.c:413, 636, 846 (the clause reader's and the rules' use of it)",
            ],
          );
          continue;
        } else if (row.routine === "cm_cmd_comma" || row.routine === "cm_cmd_period") {
          // The number is sent on as typed, or as the slot holds it; the
          // period's is first held between the command's own limits.
          const period = row.routine === "cm_cmd_period";
          const which = period ? "period" : "comma";
          const asked = command.numbers[0] ?? 0;
          const [low, high] = commandTable.periodPause;
          const value = period ? Math.min(high, Math.max(low, asked)) : asked;
          if (!spoken) {
            initial.pauseAddedMs = { ...initial.pauseAddedMs, [which]: value };
            record(
              "text_parser_command",
              `The command ${written} (${row.name}) stands before any spoken text: ${value.toString()} ms is added to the pause at each ${period ? "sentence end" : "comma"} of the text` +
                (command.untyped[0]
                  ? " (no number was typed: the command's number slot held this one)"
                  : value !== asked
                    ? ` (${asked.toString()} is outside ${low.toString()} to ${high.toString()})`
                    : ""),
              [
                period
                  ? "DECtalk 4.63 CMD/cm_copt.c:2484-2506 (cm_cmd_period), CMD/cm_defs.h:71-72 (its limits)"
                  : "DECtalk 4.63 CMD/cm_copt.c:2453-2468 (cm_cmd_comma)",
                "DECtalk 4.63 PH/ph_task.c:717-722 (compause, perpause), PH/p_us_tim.c:241-252 (added to the comma's and the period's pause)",
              ],
            );
            continue;
          }
          changeFromHere(
            { pauseAddedMs: { [which]: value } },
            endsClause,
            `The command ${written} (${row.name}) stands inside the text: the clause before it is ended and ${value.toString()} ms is added to the pause at each ${period ? "sentence end" : "comma"} of the text from here on` +
              (command.untyped[0]
                ? " (no number was typed: the command's number slot held this one)"
                : value !== asked
                  ? ` (${asked.toString()} is outside ${low.toString()} to ${high.toString()})`
                  : ""),
            [
              period
                ? "DECtalk 4.63 CMD/cm_copt.c:2484-2506 (cm_cmd_period), CMD/cm_defs.h:71-72 (its limits)"
                : "DECtalk 4.63 CMD/cm_copt.c:2453-2468 (cm_cmd_comma)",
              "DECtalk 4.63 PH/ph_task.c:665-676 (a control item ends the symbols that are pending with PERIOD), 717-722 (compause, perpause)",
            ],
          );
          continue;
        } else {
          notCarriedOut(
            written,
            row.name,
            endsClause
              ? "the clause before it is ended as DECtalk ends it, and nothing else is done"
              : "DECtalk does not end the clause for it, and nothing is done",
          );
        }
        // The sync command sends the flush character itself.
        if (endsClause && row.sendsItem && row.routine !== "cm_cmd_sync") endClauseByItem();
        else if (endsClause) out += clauseEnd;
      }
    }
    out += clauseText;
    if ([...clauseText].some((char) => char !== clauseEnd && char.trim() !== "")) spoken = true;
  });
  return {
    text: decode(out, marks),
    decisionIds,
    initial,
    changes,
    itemClauseEnds,
    scopes: commandScopes(changes),
  };
}
