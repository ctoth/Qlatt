#!/usr/bin/env node

/**
 * explain-error.ts
 * ================
 * Runs one text of a list file through a frontend and prints the error it
 * raises with its stack, or "no error". For texts too long or too awkward to
 * pass on a command line: the text is line N (1-based, comments and blank
 * lines not counted) of the list.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/explain-error.ts --list <file> --line N [--frontend dectalk-english]
 */

import fs from "node:fs";
import path from "node:path";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const list = flag("list");
const line = Number(flag("line"));
if (!list || !Number.isInteger(line) || line < 1) {
  throw new Error("--list <file> and --line N are required");
}
const texts = fs
  .readFileSync(path.resolve(list), "utf8")
  .split(/\r?\n/)
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0 && !entry.startsWith("#"));
const text = texts[line - 1];
if (text === undefined) throw new Error(`the list has ${texts.length} texts`);
console.log(
  `text (${text.length} characters): ${text.slice(0, 80)}${text.length > 80 ? "..." : ""}`,
);
try {
  const result = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: flag("frontend") ?? "dectalk-english",
  });
  console.log(`no error; ${result.track.length} frames`);
} catch (error) {
  console.log(error instanceof Error ? (error.stack ?? error.message) : String(error));
}
