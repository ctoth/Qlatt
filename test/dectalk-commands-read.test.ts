/**
 * The reading of an in-text command (src/text-parser/commands.ts, a port of
 * DECtalk 4.63 CMD/cm_cmd.c) against the generated command table of the
 * dectalk-english text parser table. The outcomes named "measured" are what
 * the instrumented say.exe did with the same command
 * (scripts/oracle/dectalk-debug/command-probe.ts): it spoke the error text,
 * or changed the voice or the rate.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type CommandTable,
  newCommandSlots,
  optionIndex,
  readCommands,
} from "../src/text-parser/commands";

const table = (
  JSON.parse(
    readFileSync("public/rules/frontends/dectalk-english/text-parser-table.json", "utf8"),
  ) as { commandTable: CommandTable }
).commandTable;

const read = (body: string, slots = newCommandSlots()) =>
  readCommands(table, body, slots).map((command) =>
    command.kind === "error"
      ? `error ${command.error}`
      : `${command.row.name}${command.words.some((word) => word !== undefined) ? ` ${command.words.filter((word) => word !== undefined).join(",")}` : ""} [${command.numbers.slice(0, 2).join(",")}]`,
  );

describe("the command table", () => {
  it("has the commands of the Windows build", () => {
    const names = table.commands.map((command) => command.name);
    expect(names).toContain("rate");
    expect(names).toContain("define_voice");
    expect(names).toContain("dv");
    // Rows of other builds (CMD/C_US_CDE.H, #ifdef MSDOS): not this one's.
    expect(names).not.toContain("flush");
    expect(names).not.toContain("language");
    // One "name" row: the one that takes a word (the other is EPSON_ARM7's).
    expect(table.commands.filter((command) => command.name === "name")).toHaveLength(1);
    expect(table.commands).toHaveLength(43);
  });

  it("has the texts DECtalk speaks for an error", () => {
    expect(table.errorTexts[table.errorCodes.command]).toBe("Command error in command");
    expect(table.errorTexts[table.errorCodes.parameter]).toBe("Command error in parameter");
    expect(table.errorTexts[table.errorCodes.string]).toBe("Command error in string value");
  });

  it("has the limits of the speaking rate", () => {
    expect(table.rate).toEqual({ command: [50, 600], spoken: [50, 550] });
  });
});

describe("reading a command", () => {
  it("takes a name cut short where no other command begins the same way", () => {
    expect(read("rate 300")).toEqual(["rate [300,0]"]);
    expect(read("ra 120")).toEqual(["rate [120,0]"]);
    expect(read("nb")).toEqual(["nb [0,0]"]);
    expect(read("name betty")).toEqual(["name betty [0,0]"]);
    expect(read("dv ap 200")).toEqual(["dv ap [0,200]"]);
    expect(read("index mark 1")).toEqual(["index mark [0,1]"]);
  });

  // Measured: "command error in command" is spoken.
  it("refuses a name no command has, and one that several begin with", () => {
    expect(read("foo 1")).toEqual(["error command"]);
    expect(read("nq")).toEqual(["error command"]);
    expect(read("zz")).toEqual(["error command"]);
    expect(read("n")).toEqual(["error command"]);
    expect(read("p 5")).toEqual(["error command"]);
  });

  // Measured: "command error in parameter" is spoken.
  it("refuses a character that fits no parameter", () => {
    expect(read("rate abc")).toEqual(["error parameter"]);
  });

  // Measured: after "[:ra 180]" the command "[:rate]" leaves the rate as it
  // is; with nothing before it the rate is the slowest (slot 0 holds 0).
  it("leaves a slot its old number when nothing is typed", () => {
    const slots = newCommandSlots();
    expect(read("ra 180", slots)).toEqual(["rate [180,0]"]);
    expect(read("rate", slots)).toEqual(["rate [180,0]"]);
    expect(read("rate")).toEqual(["rate [0,0]"]);
  });

  it("runs a list of pairs once for each pair", () => {
    expect(read("dv ap 200 pr 50")).toEqual(["dv ap [0,200]", "dv pr [0,50]"]);
  });

  it("goes on to another command after a colon", () => {
    expect(read("nb :rate 250")).toEqual(["nb [0,0]", "rate [250,0]"]);
  });
});

describe("a command's option word", () => {
  const voices = table.options.voice_names as string[];
  it("is the option itself or the only one it begins", () => {
    expect(optionIndex(voices, "betty")).toBe(1);
    expect(optionIndex(voices, "Harry")).toBe(2);
    expect(optionIndex(voices, "be")).toBe(1);
  });

  // Measured: "[:name 1]" speaks "command error in string value".
  it("is none for a word that is no option, or that begins several", () => {
    expect(optionIndex(voices, "1")).toBe(-1);
    expect(optionIndex(voices, "")).toBe(-1);
    expect(optionIndex(voices, undefined)).toBe(-1);
  });
});
