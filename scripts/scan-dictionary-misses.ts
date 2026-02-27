#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  preloadCmuDictionaryFromPath,
  DEFAULT_CMU_DICTIONARY_PATH,
} from "../src/cmu-dictionary-loader";

type ParsedArgs = {
  full: boolean;
  limit: number;
  progressEvery: number;
  logPath: string | null;
};

type Logger = {
  info: (text: string) => void;
  warn: (text: string) => void;
  close: () => void;
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

  const progressEveryRaw = flags.get("progress-every");
  const progressEvery = progressEveryRaw == null ? 5000 : Number(progressEveryRaw);
  if (!Number.isFinite(progressEvery) || progressEvery <= 0) {
    throw new Error(`Invalid --progress-every '${String(progressEveryRaw)}'`);
  }

  const logPath = flags.get("log") ? path.resolve(flags.get("log") as string) : null;

  return {
    full,
    limit: Math.floor(limit),
    progressEvery: Math.floor(progressEvery),
    logPath,
  };
}

function createLogger(logPath: string | null): Logger {
  if (!logPath) {
    return {
      info: (text: string) => process.stdout.write(`${text}\n`),
      warn: (text: string) => process.stderr.write(`${text}\n`),
      close: () => {},
    };
  }

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const stream = fs.createWriteStream(logPath, { encoding: "utf8" });
  const write = (line: string): void => {
    stream.write(`${line}\n`);
  };

  return {
    info: (text: string) => {
      process.stdout.write(`${text}\n`);
      write(text);
    },
    warn: (text: string) => {
      process.stderr.write(`${text}\n`);
      write(text);
    },
    close: () => {
      stream.end();
    },
  };
}

export async function runDictionaryMissScan(argv: string[]): Promise<number> {
  try {
    const args = parseArgs(argv);
    const logger = createLogger(args.logPath);
    const missWordCounts = new Map<string, number>();
    let missCount = 0;
    let errorCount = 0;

    const originalWarn = console.warn;
    console.warn = (...warnArgs: unknown[]) => {
      const text = warnArgs.map((arg) => String(arg)).join(" ");
      logger.warn(text);
      const missMatch = text.match(/Word "([^"]+)" not found in dictionary/);
      if (missMatch) {
        missCount += 1;
        const missWord = missMatch[1];
        missWordCounts.set(missWord, (missWordCounts.get(missWord) ?? 0) + 1);
      }
    };

    try {
      const dictionary = await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);
      const allWords = Object.keys(dictionary).sort();
      const words = args.full ? allWords : allWords.slice(0, args.limit);

      logger.info(
        `[dict-miss] mode=${args.full ? "FULL" : "SUBSET"} words=${words.length} ` +
          `(progress-every=${args.progressEvery})`
      );

      let processed = 0;
      for (const word of words) {
        try {
          textToKlattTrack(word);
        } catch (error) {
          errorCount += 1;
          logger.warn(
            `[dict-miss] error word="${word}" reason="${error instanceof Error ? error.message : String(error)}"`
          );
        }
        processed += 1;
        if (processed % args.progressEvery === 0) {
          logger.info(`processed ${processed}/${words.length}`);
        }
      }

      const topMisses = [...missWordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      logger.info(`[dict-miss] done words=${words.length} errors=${errorCount} dict_miss_count=${missCount}`);
      if (topMisses.length === 0) {
        logger.info("[dict-miss] miss_words=<none>");
      } else {
        logger.info("[dict-miss] top_miss_words:");
        for (const [missWord, count] of topMisses) {
          logger.info(`  ${missWord}: ${count}`);
        }
      }
      if (args.logPath) {
        logger.info(`[dict-miss] log=${args.logPath}`);
      }
    } finally {
      console.warn = originalWarn;
      logger.close();
    }

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
  runDictionaryMissScan(process.argv.slice(2)).then((code) => {
    process.exit(code);
  });
}
