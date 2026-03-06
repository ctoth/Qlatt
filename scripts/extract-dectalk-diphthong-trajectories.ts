import fs from "node:fs";
import path from "node:path";

type FormantParam = "F1" | "F2" | "F3" | "B1" | "B2" | "B3" | "AV";
type TrajectoryPoint = {
  value: number;
  time: number | null;
};

type DiphthongEntry = {
  code: number;
  inventoryKeys: string[];
  male: Partial<Record<FormantParam, TrajectoryPoint[]>>;
  female: Partial<Record<FormantParam, TrajectoryPoint[]>>;
};

const US_PHONEME_NAMES = [
  "SIL",
  "IY", "IH", "EY", "EH", "AE",
  "AA", "AY", "AW", "AH", "AO",
  "OW", "OY", "UH", "UW", "RR",
  "YU", "AX", "IX", "IR", "ER",
  "AR", "OR", "UR", "W", "Y",
  "R", "LL", "HX", "RX", "LX",
  "M", "N", "NX", "EL", "DZ",
  "EN", "F", "V", "TH", "DH",
  "S", "Z", "SH", "ZH", "P",
  "B", "T", "D", "K", "G",
  "DX", "TX", "Q", "CH", "JH",
  "DF", "TZ", "CZ",
] as const;

const FORMANT_PARAMS: readonly FormantParam[] = [
  "F1",
  "F2",
  "F3",
  "B1",
  "B2",
  "B3",
  "AV",
] as const;

function parseShortArray(source: string, arrayName: string): number[] {
  const pattern = new RegExp(
    `const\\s+short\\s+${arrayName}\\s*\\[\\]\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*;`,
  );
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Array not found: ${arrayName}`);
  }
  return Array.from(match[1].matchAll(/-?\d+/g), (value) => Number(value[0]));
}

function parseTrajectory(dipArray: number[], startIndex: number): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  let index = startIndex;

  while (index < dipArray.length) {
    const value = dipArray[index];
    if (value === -1) break;

    const timeToken = dipArray[index + 1];
    if (timeToken === undefined) {
      points.push({ value, time: null });
      break;
    }
    if (timeToken === -1) {
      points.push({ value, time: null });
      break;
    }

    points.push({ value, time: timeToken });
    index += 2;
  }

  return points;
}

function inventoryKeysFor(name: string): string[] {
  if (["EY", "AY", "AW", "OW", "OY"].includes(name)) {
    return [`${name}1`, `${name}0`];
  }
  return [name];
}

function extractDiphthongTrajectories(srcDir: string): Record<string, DiphthongEntry> {
  const romPath = path.join(srcDir, "PH", "p_us_rom.h");
  const source = fs.readFileSync(romPath, "latin1");
  const maltar = parseShortArray(source, "us_maltar");
  const femtar = parseShortArray(source, "us_femtar");
  const maldip = parseShortArray(source, "us_maldip");
  const femdip = parseShortArray(source, "us_femdip");
  const phoneCount = US_PHONEME_NAMES.length;

  const result: Record<string, DiphthongEntry> = {};

  for (let code = 0; code < phoneCount; code += 1) {
    const name = US_PHONEME_NAMES[code];
    const male: Partial<Record<FormantParam, TrajectoryPoint[]>> = {};
    const female: Partial<Record<FormantParam, TrajectoryPoint[]>> = {};

    for (let block = 0; block < FORMANT_PARAMS.length; block += 1) {
      const param = FORMANT_PARAMS[block];
      const offset = block * phoneCount + code;
      const maleValue = maltar[offset];
      const femaleValue = femtar[offset];

      if (maleValue < -1) {
        male[param] = parseTrajectory(maldip, -maleValue);
      }
      if (femaleValue < -1) {
        female[param] = parseTrajectory(femdip, -femaleValue);
      }
    }

    if (Object.keys(male).length === 0 && Object.keys(female).length === 0) {
      continue;
    }

    result[name] = {
      code,
      inventoryKeys: inventoryKeysFor(name),
      male,
      female,
    };
  }

  return result;
}

function main(): void {
  const srcDir = process.argv[2];
  if (!srcDir) {
    console.error(
      "Usage: node --loader ts-node/esm --experimental-specifier-resolution=node scripts/extract-dectalk-diphthong-trajectories.ts <dapi/src dir> [phoneme...]",
    );
    process.exit(1);
  }

  const extracted = extractDiphthongTrajectories(srcDir);
  const requested = process.argv.slice(3);

  if (requested.length > 0) {
    const filtered: Record<string, DiphthongEntry> = {};
    for (const phoneme of requested) {
      if (!(phoneme in extracted)) {
        console.error(`Unknown or non-diphthong phoneme: ${phoneme}`);
        process.exitCode = 2;
        continue;
      }
      filtered[phoneme] = extracted[phoneme];
    }
    process.stdout.write(`${JSON.stringify(filtered, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(extracted, null, 2)}\n`);
}

main();
