#!/usr/bin/env node

/**
 * compare-dectalk-rom-tables.ts
 * =============================
 * Read DECtalk 4.63's per-phoneme ROM tables straight from its source and
 * line them up against the dectalk-english inventory, so inventory values can
 * be checked against (or regenerated from) the source instead of being
 * estimated from oracle traces.
 *
 * Source files (never modified):
 *   <dectalk>/dapi/src/INCLUDE/l_all_ph.h   `#define US_<NAME> <index>`
 *   <dectalk>/dapi/src/PH/p_us_rom.h        `const short us_<table>[] = {...}`
 *
 * Tables read: us_inhdr (inherent duration, ms), us_mindur (minimum duration,
 * ms), us_burdr (burst duration, ms), us_f0segtars (segmental F0 target).
 * p_us_tim.c converts the two durations to frames as ((ms*10)+50)>>6.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-dectalk-rom-tables.ts \
 *     [--dectalk C:/Users/Q/src/dectalk/463] [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const dectalkRoot = path.resolve(
  flag("dectalk") ?? process.env.DECTALK_SOURCE_ROOT ?? "C:/Users/Q/src/dectalk/463",
);
const asJson = argv.includes("--json");

function readTable(source: string, name: string): number[] {
  const pattern = new RegExp(`const\\s+short\\s+${name}\\s*\\[\\]\\s*=\\s*\\{([^}]*)\\}`);
  const match = pattern.exec(source);
  if (!match) throw new Error(`E_ROM_TABLE_MISSING: ${name}`);
  // Drop comments, and the `#ifdef PHEDIT2 ... #else ... #endif` lines that
  // wrap the initializer.
  const body = match[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*#.*$/gm, "");
  return body
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map((cell) => {
      const value = Number(cell);
      if (!Number.isFinite(value)) throw new Error(`E_ROM_TABLE_CELL: ${name} '${cell}'`);
      return value;
    });
}

const phonemeHeader = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "INCLUDE", "l_all_ph.h"),
  "utf8",
);
const namesByIndex = new Map<number, string>();
for (const match of phonemeHeader.matchAll(
  /^#define\s+US_([A-Z0-9_$]+)\s+(\d+)\s*(?:\/\*.*)?$/gm,
)) {
  const index = Number(match[2]);
  if (!namesByIndex.has(index)) namesByIndex.set(index, match[1]);
}

const rom = fs.readFileSync(path.join(dectalkRoot, "dapi", "src", "PH", "p_us_rom.h"), "utf8");
const inhdr = readTable(rom, "us_inhdr");
const mindur = readTable(rom, "us_mindur");
const burdr = readTable(rom, "us_burdr");
const f0segtars = readTable(rom, "us_f0segtars");
// us_maltar is laid out as consecutive blocks of one value per phoneme
// (scripts/extract-dectalk-diphthong-trajectories.ts): block b, phoneme p is
// maltar[b * phonemeCount + p]. A value below -1 points into us_maldip.
const maltar = readTable(rom, "us_maltar");
const MALTAR_BLOCKS = ["F1", "F2", "F3", "B1", "B2", "B3"];

const inventoryDoc = yaml.load(
  fs.readFileSync(
    path.join(repoRoot, "public", "rules", "frontends", "dectalk-english", "inventory.yaml"),
    "utf8",
  ),
) as Record<string, unknown>;
// The inventory's target table is the top-level map that holds phoneme entries.
const targets = (Object.values(inventoryDoc).find(
  (value) => value != null && typeof value === "object" && "EY1" in (value as object),
) ?? {}) as Record<string, Record<string, unknown>>;
// DECtalk names that the port spells differently (postlexical.yaml symbol mapping).
const PORT_NAMES: Readonly<Record<string, string>> = { HX: "HH", NX: "NG", LL: "L" };

const toFrames = (ms: number): number => (ms * 10 + 50) >> 6;
const numberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const rows = inhdr.map((inherentMs, index) => {
  const name = namesByIndex.get(index) ?? `#${index}`;
  // The port names stressed vowels with a stress digit; compare the primary.
  const portName = PORT_NAMES[name] ?? name;
  const oursKey = targets[portName] ? portName : targets[`${portName}1`] ? `${portName}1` : null;
  const ours = oursKey == null ? undefined : targets[oursKey];
  return {
    index,
    dectalk: name,
    inherentMs,
    minimumMs: mindur[index],
    inherentFrames: toFrames(inherentMs),
    minimumFrames: toFrames(mindur[index]),
    burstMs: burdr[index],
    f0Target: f0segtars[index],
    oursKey,
    oursInherentMs: ours ? numberOrNull(ours.inherentDuration ?? ours.dur ?? ours.duration) : null,
    oursMinimumMs: ours ? numberOrNull(ours.minimumDuration) : null,
  };
});

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log("idx\tDECtalk\tinh\tmin\tinhF\tminF\tburst\tf0seg\tours\toursInh\toursMin\tmatch");
  let matched = 0;
  let compared = 0;
  for (const row of rows) {
    const same =
      row.oursKey == null
        ? "-"
        : row.oursInherentMs === row.inherentMs && row.oursMinimumMs === row.minimumMs
          ? "yes"
          : "NO";
    if (row.oursKey != null) {
      compared += 1;
      if (same === "yes") matched += 1;
    }
    console.log(
      [
        row.index,
        row.dectalk,
        row.inherentMs,
        row.minimumMs,
        row.inherentFrames,
        row.minimumFrames,
        row.burstMs,
        row.f0Target,
        row.oursKey ?? "-",
        row.oursInherentMs ?? "-",
        row.oursMinimumMs ?? "-",
        same,
      ].join("\t"),
    );
  }
  console.log(JSON.stringify({ phonemes: rows.length, inInventory: compared, matched }));

  // Male formant targets beside the inventory's.
  console.log(`\nidx\tDECtalk\t${MALTAR_BLOCKS.join("\t")}\tours\t${MALTAR_BLOCKS.join("\t")}`);
  for (const row of rows) {
    const rom = MALTAR_BLOCKS.map((_, block) => maltar[block * rows.length + row.index]);
    const ours = row.oursKey == null ? undefined : targets[row.oursKey];
    const mine = MALTAR_BLOCKS.map((key) => (ours ? (numberOrNull(ours[key]) ?? "-") : "-"));
    console.log([row.index, row.dectalk, ...rom, row.oursKey ?? "-", ...mine].join("\t"));
  }

  // Whatever follows the six formant blocks, unlabelled: one column per block.
  const blockCount = maltar.length / rows.length;
  console.log(
    `\nus_maltar: ${maltar.length} values = ${blockCount} blocks of ${rows.length}; blocks 6+:`,
  );
  if (Number.isInteger(blockCount)) {
    for (const row of rows) {
      const rest: number[] = [];
      for (let block = MALTAR_BLOCKS.length; block < blockCount; block += 1) {
        rest.push(maltar[block * rows.length + row.index]);
      }
      console.log([row.index, row.dectalk, ...rest].join("\t"));
    }
  }
}
