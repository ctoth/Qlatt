#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProvenanceCollector, type DecisionRecord } from "../src/provenance";
import { textToKlattTrack } from "../src/tts-frontend";

type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

type ParsedArgs = {
  corpusPath: string;
  phraseLimit: number | null;
  baseF0Override: number | null;
};

type CorpusFile = {
  name?: string;
  baseF0?: number;
  phrases?: unknown;
};

type UncitedDecision = {
  phrase: string;
  decision: DecisionRecord;
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

  const phraseLimitRaw = flags.get("limit");
  let phraseLimit: number | null = null;
  if (phraseLimitRaw != null) {
    const parsed = Number(phraseLimitRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Invalid --limit '${phraseLimitRaw}'`);
    }
    phraseLimit = Math.floor(parsed);
  }

  const baseF0Raw = flags.get("base-f0");
  let baseF0Override: number | null = null;
  if (baseF0Raw != null) {
    const parsed = Number(baseF0Raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Invalid --base-f0 '${baseF0Raw}'`);
    }
    baseF0Override = parsed;
  }

  return { corpusPath, phraseLimit, baseF0Override };
}

function toPhrases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function summarizeUncited(items: UncitedDecision[], limit: number): string {
  if (items.length === 0) return "<none>";
  const lines: string[] = [];
  const shown = items.slice(0, limit);
  for (const item of shown) {
    lines.push(
      `${item.phrase} | #${item.decision.seq} [${item.decision.stage}] ` +
        `${item.decision.type} ${item.decision.subject}`,
    );
  }
  if (items.length > shown.length) {
    lines.push(`... and ${items.length - shown.length} more`);
  }
  return lines.join("\n");
}

/**
 * Corpus-level strict citation gate for provenance decisions.
 *
 * Citation: Allen, Hunnicutt & Klatt (1987), MITalk text analysis workflow.
 */
export function runStrictCitationsCheck(argv: string[], io: CliIo = defaultIo()): number {
  try {
    const args = parseArgs(argv);
    const corpusRaw = readFileSync(args.corpusPath, "utf8");
    const corpus = JSON.parse(corpusRaw) as CorpusFile;
    const phrases = toPhrases(corpus.phrases);
    if (phrases.length === 0) {
      throw new Error(`No phrases found in ${args.corpusPath}`);
    }

    const selectedPhrases = args.phraseLimit != null ? phrases.slice(0, args.phraseLimit) : phrases;
    const baseF0 = args.baseF0Override ?? Number(corpus.baseF0 ?? 110);
    if (!Number.isFinite(baseF0) || baseF0 <= 0) {
      throw new Error(`Invalid baseF0 '${String(corpus.baseF0)}' in corpus`);
    }

    const uncited: UncitedDecision[] = [];
    let decisionCount = 0;

    for (const phrase of selectedPhrases) {
      const provenance = createProvenanceCollector();
      textToKlattTrack(phrase, baseF0, 30, { provenance });
      const decisions = provenance.getDecisions();
      decisionCount += decisions.length;
      for (const decision of decisions) {
        if (decision.citations.length === 0) {
          uncited.push({ phrase, decision });
        }
      }
    }

    io.stdout(
      `checked ${selectedPhrases.length} phrases from ${args.corpusPath}` +
        ` | decisions=${decisionCount} uncited=${uncited.length}\n`,
    );

    if (uncited.length > 0) {
      io.stderr(
        `strict-citations failed with uncited decisions:\n${summarizeUncited(uncited, 30)}\n`,
      );
      return 2;
    }

    io.stdout("strict-citations passed\n");
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
  const code = runStrictCitationsCheck(process.argv.slice(2));
  process.exit(code);
}
