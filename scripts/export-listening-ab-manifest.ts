#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

type ParsedArgs = {
  corpusPath: string;
  outPath: string;
  aRoot: string;
  bRoot: string;
  aLabel: string;
  bLabel: string;
};

type CorpusFile = {
  name?: string;
  phrases?: unknown;
};

type ManifestItem = {
  id: string;
  phrase: string;
  a: {
    label: string;
    audioPath: string;
  };
  b: {
    label: string;
    audioPath: string;
  };
};

type ManifestFile = {
  corpus: string;
  generatedAt: string;
  items: ManifestItem[];
};

function defaultIo(): CliIo {
  return {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  };
}

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

  const corpusPath = path.resolve(flags.get("corpus") ?? "test/phrase-sets/linguistic.json");
  const outPath = path.resolve(flags.get("out") ?? "test/golden/listening-ab-manifest.json");
  const aRoot = flags.get("a-root") ?? "artifacts/audio/a";
  const bRoot = flags.get("b-root") ?? "artifacts/audio/b";
  const aLabel = flags.get("a-label") ?? "baseline";
  const bLabel = flags.get("b-label") ?? "candidate";

  if (aLabel.trim().length === 0 || bLabel.trim().length === 0) {
    throw new Error("Labels must be non-empty");
  }

  return { corpusPath, outPath, aRoot, bRoot, aLabel, bLabel };
}

function toPhrases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function slugifyPhrase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function makeItem(index: number, phrase: string, args: ParsedArgs): ManifestItem {
  const ordinal = String(index + 1).padStart(4, "0");
  const slug = slugifyPhrase(phrase) || "phrase";
  const id = `${ordinal}-${slug}`;
  return {
    id,
    phrase,
    a: {
      label: args.aLabel,
      audioPath: `${args.aRoot}/${id}.wav`,
    },
    b: {
      label: args.bLabel,
      audioPath: `${args.bRoot}/${id}.wav`,
    },
  };
}

export function runExportListeningManifest(argv: string[], io: CliIo = defaultIo()): number {
  try {
    const args = parseArgs(argv);
    const corpusRaw = readFileSync(args.corpusPath, "utf8");
    const corpus = JSON.parse(corpusRaw) as CorpusFile;
    const phrases = toPhrases(corpus.phrases);
    if (phrases.length === 0) {
      throw new Error(`No phrases found in ${args.corpusPath}`);
    }

    const items = phrases.map((phrase, index) => makeItem(index, phrase, args));
    const payload: ManifestFile = {
      corpus: corpus.name ?? "unknown-corpus",
      generatedAt: new Date().toISOString(),
      items,
    };

    mkdirSync(path.dirname(args.outPath), { recursive: true });
    writeFileSync(args.outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    io.stdout(`wrote ${args.outPath} with ${items.length} items\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const code = runExportListeningManifest(process.argv.slice(2));
  process.exit(code);
}
