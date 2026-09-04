#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

type Args = {
  summaryPath: string;
  param: string | null;
  bucket: BucketName;
  maxPhaseDelta: number | null;
  minCompared: number;
  limit: number;
};

type BucketName = "sameSegment" | "phaseAlignedSameSegment" | "differentSegment" | "unknownSegment";

type BucketSummary = {
  compared?: number;
  meanAbs?: number;
  maxAbs?: number;
  maxFrame?: number | null;
  oracleAtMax?: number | null;
  qlattAtMax?: number | null;
  maxOraclePhone?: string | null;
  maxOracleOutputPhone?: string | null;
  maxQlattPhone?: string | null;
  maxSegmentMatch?: boolean | null;
  maxOracleSegmentPhase?: number | null;
  maxQlattSegmentPhase?: number | null;
  maxSegmentPhaseDelta?: number | null;
};

type ParamSummary = BucketSummary & {
  sameSegment?: BucketSummary;
  phaseAlignedSameSegment?: BucketSummary;
  differentSegment?: BucketSummary;
  unknownSegment?: BucketSummary;
};

type PhraseSummary = {
  phraseId?: string;
  params?: Record<string, ParamSummary>;
};

type TraceSummary = {
  phrases?: PhraseSummary[];
};

type Candidate = {
  phraseId: string;
  param: string;
  compared: number;
  meanAbs: number;
  maxAbs: number;
  maxFrame: number | null;
  oracleAtMax: number | null;
  qlattAtMax: number | null;
  oraclePhone: string | null;
  oracleOutputPhone: string | null;
  qlattPhone: string | null;
  oraclePhase: number | null;
  qlattPhase: number | null;
  phaseDelta: number | null;
};

function parseArgs(argv: string[]): Args {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const next = argv[index + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(arg.slice(2), next);
      index += 1;
    } else {
      flags.set(arg.slice(2), "true");
    }
  }

  const summaryPath = flags.get("summary");
  if (!summaryPath) {
    throw new Error(
      "Usage: rank-trace-targets --summary trace-summary.json [--param F2] [--bucket sameSegment|phaseAlignedSameSegment] [--max-phase-delta 0.15] [--min-compared 10] [--limit 20]",
    );
  }

  const bucket = bucketFlag(flags.get("bucket") ?? "sameSegment");
  return {
    summaryPath: path.resolve(summaryPath),
    param: flags.get("param") ?? null,
    bucket,
    maxPhaseDelta: flags.has("max-phase-delta") ? numberFlag(flags, "max-phase-delta") : null,
    minCompared: flags.has("min-compared") ? integerFlag(flags, "min-compared") : 1,
    limit: flags.has("limit") ? integerFlag(flags, "limit") : 20,
  };
}

function bucketFlag(raw: string): BucketName {
  if (
    raw === "sameSegment" ||
    raw === "phaseAlignedSameSegment" ||
    raw === "differentSegment" ||
    raw === "unknownSegment"
  ) {
    return raw;
  }
  throw new Error(`Invalid --bucket: ${raw}`);
}

function numberFlag(flags: Map<string, string>, name: string): number {
  const raw = flags.get(name);
  const value = raw == null ? NaN : Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Invalid --${name}: ${raw}`);
  return value;
}

function integerFlag(flags: Map<string, string>, name: string): number {
  const value = numberFlag(flags, name);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid --${name}: ${flags.get(name)}`);
  }
  return value;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readSummary(summaryPath: string): TraceSummary {
  return JSON.parse(fs.readFileSync(summaryPath, "utf8")) as TraceSummary;
}

function bucketFor(param: ParamSummary, bucket: BucketName): BucketSummary | null {
  if (bucket === "sameSegment") return param.sameSegment ?? null;
  if (bucket === "phaseAlignedSameSegment") return param.phaseAlignedSameSegment ?? null;
  if (bucket === "differentSegment") return param.differentSegment ?? null;
  return param.unknownSegment ?? null;
}

function collectCandidates(summary: TraceSummary, args: Args): Candidate[] {
  const candidates: Candidate[] = [];
  for (const phrase of summary.phrases ?? []) {
    const phraseId = phrase.phraseId;
    if (!phraseId || !phrase.params) continue;
    for (const [param, paramSummary] of Object.entries(phrase.params)) {
      if (args.param != null && param !== args.param) continue;
      const bucket = bucketFor(paramSummary, args.bucket);
      if (!bucket) continue;
      const compared = finiteNumber(bucket.compared) ?? 0;
      const meanAbs = finiteNumber(bucket.meanAbs);
      const maxAbs = finiteNumber(bucket.maxAbs);
      if (meanAbs == null || maxAbs == null || compared < args.minCompared) continue;

      const phaseDelta = finiteNumber(bucket.maxSegmentPhaseDelta);
      if (
        args.maxPhaseDelta != null &&
        (phaseDelta == null || Math.abs(phaseDelta) > args.maxPhaseDelta)
      ) {
        continue;
      }

      candidates.push({
        phraseId,
        param,
        compared,
        meanAbs,
        maxAbs,
        maxFrame: finiteNumber(bucket.maxFrame),
        oracleAtMax: finiteNumber(bucket.oracleAtMax),
        qlattAtMax: finiteNumber(bucket.qlattAtMax),
        oraclePhone: stringOrNull(bucket.maxOraclePhone),
        oracleOutputPhone: stringOrNull(bucket.maxOracleOutputPhone),
        qlattPhone: stringOrNull(bucket.maxQlattPhone),
        oraclePhase: finiteNumber(bucket.maxOracleSegmentPhase),
        qlattPhase: finiteNumber(bucket.maxQlattSegmentPhase),
        phaseDelta,
      });
    }
  }

  return candidates.sort((left, right) => {
    const meanDelta = right.meanAbs - left.meanAbs;
    if (meanDelta !== 0) return meanDelta;
    return right.maxAbs - left.maxAbs;
  });
}

function formatNumber(value: number | null, digits = 3): string {
  return value == null ? "?" : value.toFixed(digits);
}

function printCandidates(args: Args, candidates: Candidate[]): void {
  console.log(`# Trace target ranking`);
  console.log(`summary=${args.summaryPath}`);
  console.log(`bucket=${args.bucket}`);
  console.log(`param=${args.param ?? "*"}`);
  console.log(`maxPhaseDelta=${args.maxPhaseDelta ?? "*"}`);
  console.log(`minCompared=${args.minCompared}`);
  console.log("");
  console.log(
    [
      "rank",
      "phrase",
      "param",
      "compared",
      "meanAbs",
      "maxAbs",
      "frame",
      "oracle",
      "qlatt",
      "phones",
      "phases",
      "delta",
    ].join("\t"),
  );

  for (const [index, candidate] of candidates.slice(0, args.limit).entries()) {
    console.log(
      [
        String(index + 1),
        candidate.phraseId,
        candidate.param,
        String(candidate.compared),
        formatNumber(candidate.meanAbs),
        formatNumber(candidate.maxAbs),
        candidate.maxFrame == null ? "?" : String(candidate.maxFrame),
        formatNumber(candidate.oracleAtMax),
        formatNumber(candidate.qlattAtMax),
        `${candidate.oraclePhone ?? "?"}/${candidate.oracleOutputPhone ?? "?"}/${candidate.qlattPhone ?? "?"}`,
        `${formatNumber(candidate.oraclePhase, 4)}/${formatNumber(candidate.qlattPhase, 4)}`,
        formatNumber(candidate.phaseDelta, 4),
      ].join("\t"),
    );
  }
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const summary = readSummary(args.summaryPath);
  const candidates = collectCandidates(summary, args);
  printCandidates(args, candidates);
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
