/**
 * The nine voice files of the dectalk-english frontend that DECtalk 4.63 can
 * speak with are written by scripts/oracle/import-dectalk-voices.ts from the
 * voice definitions the US build compiles (PH/P_us_vdf1.h) and from
 * setspdef() (PH/ph_vset.c). This runs that script's --check, which compares
 * every field of every file with the source. It needs the DECtalk source
 * tree, which is not in this repository: without it the test is skipped.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");
const dectalkRoot = path.resolve(process.env.DECTALK_SOURCE_ROOT ?? "C:/Users/Q/src/dectalk/463");
const header = path.join(dectalkRoot, "dapi", "src", "PH", "P_us_vdf1.h");
const haveTree = fs.existsSync(header);

describe("dectalk-english voice files", () => {
  it.skipIf(!haveTree)(
    `equal the compiled voice definitions (skipped when ${header} is absent; set DECTALK_SOURCE_ROOT)`,
    () => {
      const output = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/import-dectalk-voices.ts",
          "--check",
          "--dectalk",
          dectalkRoot,
        ],
        { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      expect(output.trim()).toBe("voice files match P_us_vdf1.h and setspdef");
    },
    60_000,
  );
});
