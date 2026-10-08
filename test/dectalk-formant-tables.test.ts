/**
 * The ROM tables under parameters.policy.formant_drawing of the
 * dectalk-english frontend are written by
 * scripts/oracle/export-dectalk-formant-tables.ts from DECtalk 4.63's
 * PH/p_us_rom.h. This runs that script's --check, which compares the
 * frontend's tables with the header cell by cell. It needs the DECtalk source
 * tree, which is not in this repository: without it the test is skipped.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");
const dectalkRoot = path.resolve(process.env.DECTALK_SOURCE_ROOT ?? "C:/Users/Q/src/dectalk/463");
const rom = path.join(dectalkRoot, "dapi", "src", "PH", "p_us_rom.h");
const haveTree = fs.existsSync(rom);

describe("dectalk-english formant tables", () => {
  it.skipIf(!haveTree)(
    `equal p_us_rom.h (skipped when ${rom} is absent; set DECTALK_SOURCE_ROOT)`,
    () => {
      const output = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/export-dectalk-formant-tables.ts",
          "--check",
          "--dectalk",
          dectalkRoot,
        ],
        { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      expect(output.trim()).toBe("formant_drawing tables match p_us_rom.h");
    },
    60_000,
  );
});
