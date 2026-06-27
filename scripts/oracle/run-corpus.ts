#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AudioComparisonReport,
  OracleCorpusDocument,
  OracleCorpusEntry,
} from "./types";
import { compareAudioFiles } from "./compare-audio";
import { renderDectalk } from "./adapters/render-dectalk";
import { renderQlatt } from "./adapters/render-qlatt";

type ParsedArgs = {
  corpusPath: string;
  outRoot: string;
  continueOnError: boolean;
  limit?: number;
};

function parseArgv(argv: string[]): ParsedArgs {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(arg.slice(2), next);
      i += 1;
      continue;
    }
    flags.set(arg.slice(2), "true");
  }

  if (flags.has("help")) {
    throw new Error(
      "Usage: run-corpus [--corpus path] [--out-root dir] [--limit n] [--continue-on-error 1]",
    );
  }

  const limitText = flags.get("limit");
  const limit =
    limitText == null || limitText === ""
      ? undefined
      : Number.parseInt(limitText, 10);
  if (limitText != null && (!Number.isFinite(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer");
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return {
    corpusPath: path.resolve(
      flags.get("corpus") ??
        path.join(
          scriptDir,
          "..",
          "..",
          "test",
          "oracle-corpora",
          "dectalk-us-v1.json",
        ),
    ),
    outRoot: path.resolve(
      flags.get("out-root") ??
        path.join(scriptDir, "..", "..", "test", "oracle-output"),
    ),
    continueOnError:
      flags.get("continue-on-error") === "1" ||
      flags.get("continue-on-error") === "true",
    ...(limit != null ? { limit } : {}),
  };
}

function loadCorpus(filePath: string): OracleCorpusDocument {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as OracleCorpusDocument;
  if (raw.schemaVersion !== "v1") {
    throw new Error(
      `Unsupported corpus schema '${String(
        (raw as { schemaVersion?: string }).schemaVersion,
      )}'`,
    );
  }
  if (!Array.isArray(raw.entries) || raw.entries.length === 0) {
    throw new Error("Corpus must contain at least one entry");
  }
  return raw;
}

function mergeDefaults(
  defaults: OracleCorpusDocument["defaults"],
  entry: OracleCorpusEntry,
): OracleCorpusEntry {
  return {
    ...(defaults ?? {}),
    ...entry,
  };
}

function summarizeReports(reports: AudioComparisonReport[]): Record<string, unknown> {
  const stoiValues = reports
    .map((report) => report.metrics.intelligibility.stoi)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const estoiValues = reports
    .map((report) => report.metrics.intelligibility.estoi)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const avg = (values: number[]): number =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
  const tokenSimilarities = reports
    .map((report) => report.metrics.symbolic?.tokenSimilarity)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const internalDurationDeltas = reports
    .map((report) => report.metrics.internal?.durationDeltaSec)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const internalF0MinDeltas = reports
    .map((report) => report.metrics.internal?.f0MinDeltaHz)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const internalF0MaxDeltas = reports
    .map((report) => report.metrics.internal?.f0MaxDeltaHz)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const internalAvDeltas = reports
    .map((report) => report.metrics.internal?.avDelta)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const internalApToAhDeltas = reports
    .map((report) => report.metrics.internal?.apToAhDelta)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );

  let worstByStoi: AudioComparisonReport | null = null;
  for (const report of reports) {
    const value = report.metrics.intelligibility.stoi;
    if (value == null) continue;
    if (
      !worstByStoi ||
      value <
        (worstByStoi.metrics.intelligibility.stoi ??
          Number.POSITIVE_INFINITY)
    ) {
      worstByStoi = report;
    }
  }

  const failures = reports.filter(
    (report) => report.verdict.status === "fail",
  ).length;
  const warnings = reports.filter(
    (report) => report.verdict.status === "warn",
  ).length;

  return {
    phraseCount: reports.length,
    failures,
    warnings,
    avgStoi: avg(stoiValues),
    avgEstoi: avg(estoiValues),
    avgTokenSimilarity: avg(tokenSimilarities),
    avgTraceDurationDeltaSec: avg(internalDurationDeltas),
    avgTraceF0MinDeltaHz: avg(internalF0MinDeltas),
    avgTraceF0MaxDeltaHz: avg(internalF0MaxDeltas),
    avgTraceAvDelta: avg(internalAvDeltas),
    avgTraceApToAhDelta: avg(internalApToAhDeltas),
    worstByStoi: worstByStoi
      ? {
          phraseId: worstByStoi.phraseId,
          phrase: worstByStoi.phrase,
          stoi: worstByStoi.metrics.intelligibility.stoi,
        }
      : null,
  };
}

async function main(): Promise<number> {
  try {
    const args = parseArgv(process.argv.slice(2));
    const corpus = loadCorpus(args.corpusPath);
    const runRoot = path.join(args.outRoot, corpus.corpusId);
    fs.mkdirSync(runRoot, { recursive: true });
    const selectedEntries =
      args.limit != null ? corpus.entries.slice(0, args.limit) : corpus.entries;

    const reports: AudioComparisonReport[] = [];
    for (const baseEntry of selectedEntries) {
      const entry = mergeDefaults(corpus.defaults, baseEntry);
      const entryDir = path.join(runRoot, entry.id);
      fs.mkdirSync(entryDir, { recursive: true });

      try {
        const oracleArtifact = await renderDectalk({
          phraseId: entry.id,
          phrase: entry.text,
          outDir: path.join(entryDir, "oracle"),
          voiceId: entry.voiceId,
          rate: entry.rate,
          sampleRate: entry.sampleRate,
        });

        const qlattArtifact = await renderQlatt({
          phraseId: entry.id,
          phrase: entry.text,
          outDir: path.join(entryDir, "qlatt"),
          voiceId: entry.voiceId,
          rate: entry.rate,
          sampleRate: entry.sampleRate,
          baseF0: entry.baseF0,
          frontendId: entry.frontendId ?? "dectalk-english",
          transitionMs: entry.transitionMs,
        });

        const report = compareAudioFiles({
          phraseId: entry.id,
          phrase: entry.text,
          oracleWav: oracleArtifact.wavPath,
          qlattWav: qlattArtifact.wavPath,
          oracleMeta: oracleArtifact.metadataPath,
          qlattMeta: qlattArtifact.metadataPath,
          qlattPayload: qlattArtifact.extraPaths?.renderPayload,
          outPath: path.join(entryDir, "compare.json"),
          comparisonSampleRate: 10000,
          trimThresholdRatio: 0.02,
          trimWindowMs: 10,
          targetRms: 0.08,
          maxLagMs: 120,
        });

        fs.writeFileSync(
          path.join(entryDir, "compare.json"),
          `${JSON.stringify(report, null, 2)}\n`,
          "utf8",
        );
        reports.push(report);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        fs.writeFileSync(path.join(entryDir, "error.txt"), `${message}\n`, "utf8");
        if (!args.continueOnError) {
          throw error;
        }
      }
    }

    const summary = {
      schemaVersion: "v1",
      corpusId: corpus.corpusId,
      corpusPath: args.corpusPath,
      ...(args.limit != null ? { limit: args.limit } : {}),
      generatedAt: new Date().toISOString(),
      summary: summarizeReports(reports),
      reports: reports.map((report) => ({
        phraseId: report.phraseId,
        verdict: report.verdict.status,
        stoi: report.metrics.intelligibility.stoi,
        estoi: report.metrics.intelligibility.estoi,
        correlation: report.metrics.acoustic.correlation,
        tokenSimilarity: report.metrics.symbolic?.tokenSimilarity,
        traceDurationDeltaSec: report.metrics.internal?.durationDeltaSec,
        traceF0MinDeltaHz: report.metrics.internal?.f0MinDeltaHz,
        traceF0MaxDeltaHz: report.metrics.internal?.f0MaxDeltaHz,
        traceAvDelta: report.metrics.internal?.avDelta,
        traceApToAhDelta: report.metrics.internal?.apToAhDelta,
      })),
    };

    const summaryPath = path.join(runRoot, "summary.json");
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return (summary.summary as { failures: number }).failures > 0 ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().then((code) => process.exit(code));
}
