#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  type Frame,
  loadCmuDictionary,
  selectAuditWords,
  stripStress,
} from "../test/utils/cmudict-audit";

type ParsedArgs = {
  full: boolean;
  limit: number;
  perCategory: number;
};

type WeakDentalOutlier = {
  word: string;
  phone: string;
  maxAF: number;
  maxAB: number;
};

type RhoticOutlier = {
  word: string;
  exactPhone: string;
  averageF2: number;
  averageF3: number;
  gap: number;
};

type FrontVowelOutlier = {
  word: string;
  maxF2: number;
  segmentCount: number;
};

function parseArgs(argv: string[]): ParsedArgs {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(key, next);
      i += 1;
      continue;
    }
    flags.set(key, "true");
  }

  const full = flags.get("full") === "true";
  const limitRaw = flags.get("limit");
  const limit = limitRaw == null ? 5000 : Number(limitRaw);
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error(`Invalid --limit '${String(limitRaw)}'`);
  }

  const perCategoryRaw = flags.get("per-category");
  const perCategory = perCategoryRaw == null ? 15 : Number(perCategoryRaw);
  if (!Number.isFinite(perCategory) || perCategory <= 0) {
    throw new Error(`Invalid --per-category '${String(perCategoryRaw)}'`);
  }

  return {
    full,
    limit: Math.floor(limit),
    perCategory: Math.floor(perCategory),
  };
}

function averageParam(frames: Frame[], key: string): number {
  if (frames.length === 0) return 0;
  return frames.reduce((sum, frame) => sum + Number(frame.params?.[key] ?? 0), 0) / frames.length;
}

function maxParam(frames: Frame[], key: string): number {
  if (frames.length === 0) return 0;
  return Math.max(...frames.map((frame) => Number(frame.params?.[key] ?? 0)));
}

function printSection<T>(
  title: string,
  rows: T[],
  render: (row: T, index: number) => string,
): void {
  console.log(`\n${title}`);
  if (rows.length === 0) {
    console.log("  <none>");
    return;
  }
  rows.forEach((row, index) => {
    console.log(render(row, index));
  });
}

export async function runPhonologyOutlierScan(argv: string[]): Promise<number> {
  try {
    const args = parseArgs(argv);
    const dictionary = loadCmuDictionary();
    const entries = args.full
      ? Object.entries(dictionary)
      : selectAuditWords(dictionary).slice(0, args.limit);

    const weakDentals: WeakDentalOutlier[] = [];
    const rhoticCrowding: RhoticOutlier[] = [];
    const darkFrontVowels: FrontVowelOutlier[] = [];

    console.log(
      `[phonology-outliers] mode=${args.full ? "FULL" : "SUBSET"} words=${entries.length} per-category=${args.perCategory}`,
    );

    for (const [word, arpabet] of entries) {
      const track = textToKlattTrack(word, 110) as Frame[];
      const phones = arpabet.split(" ");

      for (const phone of ["TH", "DH"]) {
        if (!phones.some((entry) => stripStress(entry) === phone)) continue;
        const frames = track.filter((frame) => frame.phoneme === phone);
        if (frames.length === 0) continue;
        weakDentals.push({
          word,
          phone,
          maxAF: maxParam(frames, "AF"),
          maxAB: maxParam(frames, "AB"),
        });
      }

      const exactRhotic = phones.filter((phone) => phone === "ER0" || phone === "ER1");
      if (exactRhotic.length === 1) {
        const erFrames = track.filter((frame) => frame.phoneme === "ER");
        if (erFrames.length > 0) {
          const averageF2 = averageParam(erFrames, "F2");
          const averageF3 = averageParam(erFrames, "F3");
          rhoticCrowding.push({
            word,
            exactPhone: exactRhotic[0],
            averageF2,
            averageF3,
            gap: averageF3 - averageF2,
          });
        }
      }

      if (phones.some((phone) => phone === "IY1" || phone === "IY0")) {
        const iyFrames = track.filter((frame) => stripStress(String(frame.phoneme ?? "")) === "IY");
        if (iyFrames.length > 0) {
          darkFrontVowels.push({
            word,
            maxF2: maxParam(iyFrames, "F2"),
            segmentCount: iyFrames.length,
          });
        }
      }
    }

    printSection(
      "Weak dental fricatives",
      weakDentals.sort((a, b) => a.maxAF - b.maxAF).slice(0, args.perCategory),
      (row, index) =>
        `  ${String(index + 1).padStart(2)}. ${row.word} [${row.phone}] AF.max=${row.maxAF.toFixed(1)} AB.max=${row.maxAB.toFixed(1)}`,
    );
    printSection(
      "Rhotic crowding (smallest F3-F2 gap)",
      rhoticCrowding.sort((a, b) => a.gap - b.gap).slice(0, args.perCategory),
      (row, index) =>
        `  ${String(index + 1).padStart(2)}. ${row.word} [${row.exactPhone}] gap=${row.gap.toFixed(1)} ` +
        `F2.avg=${row.averageF2.toFixed(1)} F3.avg=${row.averageF3.toFixed(1)}`,
    );
    printSection(
      "Dark front vowels (lowest IY max F2)",
      darkFrontVowels.sort((a, b) => a.maxF2 - b.maxF2).slice(0, args.perCategory),
      (row, index) =>
        `  ${String(index + 1).padStart(2)}. ${row.word} IY.maxF2=${row.maxF2.toFixed(1)} frames=${row.segmentCount}`,
    );

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runPhonologyOutlierScan(process.argv.slice(2)).then((code) => {
    process.exit(code);
  });
}
