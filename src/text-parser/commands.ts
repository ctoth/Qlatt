/**
 * DECtalk's in-text commands: what stands between "[:" and "]" read as the
 * command stage reads it (DECtalk 4.63 CMD/cm_cmd.c), against the command
 * table of the frontend's text parser table (`commandTable`, generated from
 * CMD/C_US_CDE.H by scripts/build-dectalk-text-parser.ts).
 *
 * Ported:
 *   - the name (cm_cmd_match_comm, :141-322): each character leaves only the
 *     rows that have it at that place, so a name may be cut short where no
 *     other command begins the same way ("ra" is "rate"); at white space
 *     exactly one row must be left;
 *   - the parameters (cm_cmd_build_param, :398-765): by the row's format,
 *     `d` a decimal number with an optional minus, `h` a hexadecimal one, `a`
 *     a word (or text between quotes or angle brackets); a comma goes on to
 *     the next parameter, a colon runs the command and starts another one in
 *     the same bracket, and `*` repeats (a list of pairs, "dv ap 200 pr 50",
 *     runs at each white space);
 *   - that a parameter nobody typed keeps the number its slot held
 *     (cm_cmd_reset_comm, :766-790, resets the flags and not the numbers):
 *     "[:rate]" repeats the last number any command read into slot 0;
 *   - the three errors of the stage: the name ("command"), a character that
 *     fits no parameter ("parameter"), and, by the caller, a word that is no
 *     option of the command ("string value", optionIndex below).
 *
 * Not ported: binary and octal parameters (no command of the table has
 * them), the phoneme syntax inside a bracket (cm_phon.c), and what DECtalk
 * does with text that follows a finished command inside the same bracket
 * other than a colon: it is passed over here.
 */

import type { PhonemeAlphabets } from "./phonemes";

/** One row of the command table. */
export interface CommandRow {
  name: string;
  /** One character per parameter: d, a, h; "*" repeats. */
  format: string;
  parameters: number;
  routine: string;
  /** The option list its words are looked up in (commandTable.options). */
  options?: string;
  /** The voice a voice command with no parameter selects. */
  voice?: number;
  /** False when the routine's source was not read: the two flags say nothing. */
  routineRead: boolean;
  /** The routine sends an item down the text pipe in at least one branch. */
  sendsItem: boolean;
  /** The routine calls the clause-ending sync in at least one branch. */
  syncs: boolean;
}

export interface CommandTable {
  commands: CommandRow[];
  options: Record<string, string[]>;
  /** Spoken texts by error code. */
  errorTexts: string[];
  errorCodes: {
    string: number;
    value: number;
    command: number;
    parameter: number;
    phoneme: number;
  };
  /** The alphabets of phonemic text in brackets (phonemes.ts). */
  phonemes: PhonemeAlphabets;
  rate: { command: [number, number]; spoken: [number, number] };
  /** The limits of the period pause command's number, in ms. */
  periodPause: [number, number];
  /** The flag of each mode the mode command names, by the mode's word. */
  modeFlags?: Record<string, number>;
}

/** How many parameter slots the command stage has (INCLUDE/dectalk.h:90 NPARAM). */
const SLOTS = 10;

/** The numbers the parameter slots hold; they outlive a command. */
export type CommandSlots = number[];

export function newCommandSlots(): CommandSlots {
  return new Array<number>(SLOTS).fill(0);
}

/** One command of a bracket, as read. */
export type ReadCommand =
  | {
      kind: "command";
      row: CommandRow;
      /** The numbers of the slots when the command ran. */
      numbers: number[];
      /** The words typed for the `a` parameters, by parameter place. */
      words: (string | undefined)[];
      /** For each parameter place, whether nothing was typed there. */
      untyped: boolean[];
    }
  | {
      kind: "error";
      /** "command" or "parameter". */
      error: "command" | "parameter";
      /** The row, once the name was matched. */
      row?: CommandRow;
    };

const isSpace = (char: string): boolean =>
  char === " " || char === "\t" || char === "\r" || char === "\n";

/**
 * The index of `word` in `options`: the option that is the word, else the
 * only option that begins with it (CMD/cm_util.c:742-816). -1 otherwise.
 */
export function optionIndex(options: readonly string[], word: string | undefined): number {
  if (word === undefined) return -1;
  const lower = word.toLowerCase();
  const exact = options.indexOf(lower);
  if (exact >= 0) return exact;
  const begun = options.flatMap((option, index) => (option.startsWith(lower) ? [index] : []));
  return begun.length === 1 ? (begun[0] as number) : -1;
}

/**
 * The commands of one bracket. `body` is the text between "[:" and "]";
 * `slots` is updated with the numbers read. An error ends the bracket: what
 * follows it is passed over (STATE_TOSS).
 */
export function readCommands(
  table: CommandTable,
  body: string,
  slots: CommandSlots,
): ReadCommand[] {
  const read: ReadCommand[] = [];
  let at = 0;
  while (at <= body.length) {
    // The name.
    let alive = table.commands;
    let typed = 0;
    let row: CommandRow | undefined;
    let failed = false;
    for (; at < body.length; at += 1) {
      const char = body[at] as string;
      if (isSpace(char)) {
        if (alive.length === 1) {
          row = alive[0];
          at += 1;
          break;
        }
        if (typed !== 0) {
          failed = true;
          break;
        }
        continue;
      }
      const place = typed;
      const left = alive.filter((candidate) => candidate.name[place] === char.toLowerCase());
      if (left.length === 0) {
        // The character is no part of any name left: it starts the
        // parameters if the name was settled already.
        if (alive.length === 1) row = alive[0];
        else failed = true;
        break;
      }
      alive = left;
      typed += 1;
    }
    if (!row && !failed) {
      // The bracket ended inside the name.
      if (alive.length === 1) row = alive[0];
      else failed = true;
    }
    if (failed || !row) {
      read.push({ kind: "error", error: "command" });
      return read;
    }

    // The parameters.
    const words: (string | undefined)[] = [];
    const untyped: boolean[] = new Array<boolean>(SLOTS).fill(true);
    const matched = row;
    const run = (): void => {
      read.push({
        kind: "command",
        row: matched,
        numbers: [...slots],
        words: [...words],
        untyped: [...untyped],
      });
    };
    let format = 0;
    let slot = 0;
    let another = false;
    let done = false;
    while (!done) {
      let kind = matched.format[format];
      if (kind === undefined) {
        // No parameter is left to read: the command runs, and only a colon
        // goes on.
        run();
        while (at < body.length && body[at] !== ":") at += 1;
        another = at < body.length;
        at += 1;
        break;
      }
      if (kind === "*") {
        if (at >= body.length) {
          run();
          break;
        }
        const char = body[at] as string;
        if (char === ":") {
          run();
          another = true;
          at += 1;
          break;
        }
        // The list starts again with its first parameter.
        format = 0;
        kind = matched.format[0] as string;
      }
      // What stands before the parameter.
      let ended = false;
      for (; at < body.length; at += 1) {
        const char = body[at] as string;
        if (char === ",") {
          slot += 1;
          format += 1;
          kind = matched.format[format] ?? "";
          if (kind === "" || kind === "*") break;
          continue;
        }
        if (isSpace(char)) continue;
        if (char === ":" || char === ".") {
          run();
          another = char === ":";
          at += 1;
          ended = true;
        }
        break;
      }
      if (ended) break;
      if (at >= body.length) {
        run();
        break;
      }
      if (kind === "" || kind === "*") continue;
      // The parameter itself.
      let value = 0;
      let negative = false;
      let word = "";
      let count = 0;
      let quote = "";
      if (kind === "a" && (body[at] === "<" || body[at] === '"')) {
        quote = body[at] === "<" ? ">" : '"';
        at += 1;
      }
      for (; at < body.length; at += 1) {
        const char = body[at] as string;
        if (kind === "a") {
          if (quote !== "") {
            if (char === quote) {
              at += 1;
              break;
            }
            word += char;
            count += 1;
            continue;
          }
          if (isSpace(char) || char === ",") break;
          word += char;
          count += 1;
        } else if (kind === "d") {
          if (count === 0 && char === "-") negative = true;
          else if (char >= "0" && char <= "9") value = value * 10 + (char.charCodeAt(0) - 48);
          else break;
          count += 1;
        } else {
          const digit = Number.parseInt(char, 16);
          if (Number.isNaN(digit)) break;
          value = value * 16 + digit;
          count += 1;
        }
      }
      if (count > 0 || quote !== "") {
        if (kind === "a") words[slot] = word;
        else slots[slot] = negative ? -value : value;
        untyped[slot] = false;
        slot += 1;
        format += 1;
      }
      // What ends the parameter.
      if (at >= body.length) {
        run();
        break;
      }
      const end = body[at] as string;
      if (isSpace(end)) {
        at += 1;
        const next = matched.format[format];
        if (next === undefined) {
          run();
          while (at < body.length && body[at] !== ":") at += 1;
          another = at < body.length;
          at += 1;
          done = true;
        } else if (next === "*") {
          // A list of pairs runs at each white space and starts again.
          run();
          words.length = 0;
          untyped.fill(true);
          slot = 0;
          format = 0;
          while (at < body.length && isSpace(body[at] as string)) at += 1;
          if (at >= body.length) done = true;
        }
      } else if (end === ",") {
        const next = matched.format[format];
        if (next === undefined || next === "*") {
          read.push({ kind: "error", error: "parameter", row: matched });
          return read;
        }
        at += 1;
      } else if (end === ":" && count > 0) {
        run();
        another = true;
        at += 1;
        done = true;
      } else {
        read.push({ kind: "error", error: "parameter", row: matched });
        return read;
      }
    }
    if (!another) break;
  }
  return read;
}
