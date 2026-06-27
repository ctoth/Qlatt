#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stoi } from "../../src/metrics/stoi";
import type {
  AudioComparisonReport,
  AudioNormalizationConfig,
  OracleArtifact,
} from "./types";
import { buildSymbolicComparison } from "./symbolic";
import {
  alignByLag,
  correlation,
  durationSeconds,
  estimateLag,
  maxAbsError,
  normalizeRms,
  readWav,
  resampleLinear,
  rmsError,
  trimSilence,
} from "./wav";

type CompareAudioArgs = {
  phraseId: string;
  phrase: string;
  oracleWav: string;
  qlattWav: string;
  oracleMeta: string;
  qlattMeta: string;
  qlattPayload?: string;
  outPath?: string;
  comparisonSampleRate: number;
  trimThresholdRatio: number;
  trimWindowMs: number;
  targetRms: number;
  maxLagMs: number;
};

const STOI_MINIMUM_SAMPLES = 30 * 128 + 256;

function parseArgv(argv: string[]): CompareAudioArgs {
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
      "Usage: compare-audio --phrase-id id --phrase text --oracle-wav file --qlatt-wav file " +
        "--oracle-meta file --qlatt-meta file [--qlatt-payload file] [--out file]",
    );
  }

  const required = ["phrase-id", "phrase", "oracle-wav", "qlatt-wav", "oracle-meta", "qlatt-meta"];
  for (const key of required) {
    if (!flags.has(key)) {
      throw new Error(`Missing required flag --${key}`);
    }
  }

  return {
    phraseId: flags.get("phrase-id") as string,
    phrase: flags.get("phrase") as string,
    oracleWav: path.resolve(flags.get("oracle-wav") as string),
    qlattWav: path.resolve(flags.get("qlatt-wav") as string),
    oracleMeta: path.resolve(flags.get("oracle-meta") as string),
    qlattMeta: path.resolve(flags.get("qlatt-meta") as string),
    qlattPayload: flags.get("qlatt-payload")
      ? path.resolve(flags.get("qlatt-payload") as string)
      : undefined,
    outPath: flags.get("out") ? path.resolve(flags.get("out") as string) : undefined,
    comparisonSampleRate: Number(flags.get("comparison-sample-rate") ?? 10000),
    trimThresholdRatio: Number(flags.get("trim-threshold") ?? 0.02),
    trimWindowMs: Number(flags.get("trim-window-ms") ?? 10),
    targetRms: Number(flags.get("target-rms") ?? 0.08),
    maxLagMs: Number(flags.get("max-lag-ms") ?? 120),
  };
}

function loadArtifact(filePath: string): OracleArtifact {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as OracleArtifact;
}

function readMetricNumber(
  source: Record<string, unknown> | null | undefined,
  key: string,
): number | null {
  if (!source) return null;
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function summarizeQlattTrackInternal(
  track: unknown,
): Record<string, number> | null {
  if (!Array.isArray(track) || track.length === 0) {
    return null;
  }

  let weightedAv = 0;
  let weightedAh = 0;
  let totalDuration = 0;

  for (let index = 0; index < track.length - 1; index += 1) {
    const current = track[index] as Record<string, unknown>;
    const next = track[index + 1] as Record<string, unknown>;
    const currentTime =
      typeof current.time === "number" && Number.isFinite(current.time)
        ? current.time
        : null;
    const nextTime =
      typeof next.time === "number" && Number.isFinite(next.time) ? next.time : null;
    if (currentTime == null || nextTime == null || nextTime <= currentTime) {
      continue;
    }

    const duration = nextTime - currentTime;
    const params =
      current.params && typeof current.params === "object"
        ? (current.params as Record<string, unknown>)
        : null;
    const av =
      params && typeof params.AV === "number" && Number.isFinite(params.AV)
        ? params.AV
        : 0;
    const ah =
      params && typeof params.AH === "number" && Number.isFinite(params.AH)
        ? params.AH
        : 0;

    weightedAv += av * duration;
    weightedAh += ah * duration;
    totalDuration += duration;
  }

  if (totalDuration <= 0) {
    return null;
  }

  return {
    meanAv: weightedAv / totalDuration,
    meanAh: weightedAh / totalDuration,
  };
}

function buildVerdict(report: AudioComparisonReport): AudioComparisonReport["verdict"] {
  const reasons: string[] = [];
  const stoiValue = report.metrics.intelligibility.stoi;
  const estoiValue = report.metrics.intelligibility.estoi;
  const durationRatio =
    report.metrics.temporal.oracleDurationSec > 0
      ? report.metrics.temporal.qlattDurationSec / report.metrics.temporal.oracleDurationSec
      : 1;
  const tokenSimilarity =
    report.metrics.symbolic &&
    typeof report.metrics.symbolic.tokenSimilarity === "number" &&
    Number.isFinite(report.metrics.symbolic.tokenSimilarity)
      ? report.metrics.symbolic.tokenSimilarity
      : null;

  if (stoiValue != null && stoiValue < 0.35) {
    reasons.push(`Low STOI (${stoiValue.toFixed(3)})`);
  }
  if (estoiValue != null && estoiValue < 0.2) {
    reasons.push(`Low ESTOI (${estoiValue.toFixed(3)})`);
  }
  if (report.metrics.acoustic.correlation < 0.1) {
    reasons.push(`Low waveform correlation (${report.metrics.acoustic.correlation.toFixed(3)})`);
  }
  if (durationRatio < 0.75 || durationRatio > 1.25) {
    reasons.push(`Duration ratio out of range (${durationRatio.toFixed(3)})`);
  }
  if (tokenSimilarity != null && tokenSimilarity < 0.6) {
    reasons.push(`Low symbolic token similarity (${tokenSimilarity.toFixed(3)})`);
  }

  if (reasons.length === 0) {
    return { status: "pass", reasons: [] };
  }
  if (
    reasons.some(
      (reason) =>
        reason.startsWith("Low STOI") ||
        reason.startsWith("Duration ratio") ||
        reason.startsWith("Low symbolic token similarity"),
    )
  ) {
    return { status: "fail", reasons };
  }
  return { status: "warn", reasons };
}

export function compareAudioFiles(args: CompareAudioArgs): AudioComparisonReport {
  const oracleWav = readWav(args.oracleWav);
  const qlattWav = readWav(args.qlattWav);

  const cfg: AudioNormalizationConfig = {
    comparisonSampleRate: args.comparisonSampleRate,
    trimThresholdRatio: args.trimThresholdRatio,
    trimWindowMs: args.trimWindowMs,
    targetRms: args.targetRms,
    maxLagMs: args.maxLagMs,
  };

  const trimWindowSamples = Math.max(
    1,
    Math.round((cfg.trimWindowMs / 1000) * cfg.comparisonSampleRate),
  );
  const oracleResampled = resampleLinear(
    oracleWav.samples,
    oracleWav.sampleRate,
    cfg.comparisonSampleRate,
  );
  const qlattResampled = resampleLinear(
    qlattWav.samples,
    qlattWav.sampleRate,
    cfg.comparisonSampleRate,
  );
  const oracleTrimmed = trimSilence(
    oracleResampled,
    cfg.trimThresholdRatio,
    trimWindowSamples,
  );
  const qlattTrimmed = trimSilence(
    qlattResampled,
    cfg.trimThresholdRatio,
    trimWindowSamples,
  );
  const oracleNorm = normalizeRms(oracleTrimmed, cfg.targetRms).samples;
  const qlattNorm = normalizeRms(qlattTrimmed, cfg.targetRms).samples;

  const maxLagSamples = Math.max(
    0,
    Math.round((cfg.maxLagMs / 1000) * cfg.comparisonSampleRate),
  );
  const lagSamples = estimateLag(oracleNorm, qlattNorm, maxLagSamples);
  const aligned = alignByLag(oracleNorm, qlattNorm, lagSamples);
  const overlapLength = Math.min(
    aligned.reference.length,
    aligned.candidate.length,
  );
  const oracleAligned = aligned.reference.slice(0, overlapLength);
  const qlattAligned = aligned.candidate.slice(0, overlapLength);

  let stoiValue: number | null = null;
  let estoiValue: number | null = null;
  const stoiSkippedReason =
    overlapLength > 0 && overlapLength < STOI_MINIMUM_SAMPLES
      ? `aligned window ${overlapLength} samples is shorter than STOI minimum ${STOI_MINIMUM_SAMPLES}`
      : null;
  if (overlapLength >= STOI_MINIMUM_SAMPLES) {
    stoiValue = stoi(oracleAligned, qlattAligned, cfg.comparisonSampleRate).score;
    estoiValue = stoi(oracleAligned, qlattAligned, cfg.comparisonSampleRate, {
      extended: true,
    }).score;
  }

  const oracleArtifact = loadArtifact(args.oracleMeta);
  const qlattArtifact = loadArtifact(args.qlattMeta);
  const qlattPayload =
    args.qlattPayload && fs.existsSync(args.qlattPayload)
      ? (JSON.parse(fs.readFileSync(args.qlattPayload, "utf8")) as Record<
          string,
          unknown
        >)
      : null;
  const symbolic = buildSymbolicComparison(oracleArtifact.symbolic, qlattPayload);
  const oracleTrace =
    oracleArtifact.trace && typeof oracleArtifact.trace === "object"
      ? (oracleArtifact.trace as Record<string, unknown>)
      : null;
  const qlattTrackSummary =
    qlattPayload?.trackSummary && typeof qlattPayload.trackSummary === "object"
      ? (qlattPayload.trackSummary as Record<string, unknown>)
      : null;
  const qlattTrackInternal = summarizeQlattTrackInternal(
    qlattPayload && typeof qlattPayload === "object"
      ? (qlattPayload as Record<string, unknown>).track
      : null,
  );

  const oracleTraceDurationSec = readMetricNumber(oracleTrace, "durationSec");
  const oracleTraceF0MinHz = readMetricNumber(oracleTrace, "f0MinHz");
  const oracleTraceF0MaxHz = readMetricNumber(oracleTrace, "f0MaxHz");
  const oracleTraceF0MeanHz = readMetricNumber(oracleTrace, "f0MeanHz");
  const qlattTrackDurationSec = readMetricNumber(qlattTrackSummary, "totalTime");
  const qlattTrackF0MinHz = readMetricNumber(qlattTrackSummary, "f0Min");
  const qlattTrackF0MaxHz = readMetricNumber(qlattTrackSummary, "f0Max");
  const qlattTrackF0MeanHz = readMetricNumber(qlattTrackSummary, "f0Mean");
  const qlattTrackVoicedRatioFromSummary = readMetricNumber(qlattTrackSummary, "voicedRatio");
  const qlattTrackVoicedEvents = readMetricNumber(qlattTrackSummary, "voicedEvents");
  const qlattTrackEvents = readMetricNumber(qlattTrackSummary, "events");
  const qlattTrackVoicedRatio =
    qlattTrackVoicedRatioFromSummary != null
      ? qlattTrackVoicedRatioFromSummary
      : qlattTrackEvents != null && qlattTrackEvents > 0 && qlattTrackVoicedEvents != null
      ? qlattTrackVoicedEvents / qlattTrackEvents
      : null;
  const oracleTraceVoicedRatio = readMetricNumber(oracleTrace, "voicedRatio");
  const oracleTraceMeanAv = readMetricNumber(oracleTrace, "meanAv");
  const oracleTraceMeanAp = readMetricNumber(oracleTrace, "meanAp");
  const qlattTrackMeanAv = qlattTrackInternal?.meanAv ?? null;
  const qlattTrackMeanAh = qlattTrackInternal?.meanAh ?? null;

  const internalMetrics: Record<string, unknown> = {
    ...(oracleTraceDurationSec != null ? { oracleTraceDurationSec } : {}),
    ...(qlattTrackDurationSec != null ? { qlattTrackDurationSec } : {}),
    ...(oracleTraceDurationSec != null && qlattTrackDurationSec != null
      ? { durationDeltaSec: qlattTrackDurationSec - oracleTraceDurationSec }
      : {}),
    ...(oracleTraceF0MinHz != null ? { oracleTraceF0MinHz } : {}),
    ...(oracleTraceF0MaxHz != null ? { oracleTraceF0MaxHz } : {}),
    ...(oracleTraceF0MeanHz != null ? { oracleTraceF0MeanHz } : {}),
    ...(qlattTrackF0MinHz != null ? { qlattTrackF0MinHz } : {}),
    ...(qlattTrackF0MaxHz != null ? { qlattTrackF0MaxHz } : {}),
    ...(qlattTrackF0MeanHz != null ? { qlattTrackF0MeanHz } : {}),
    ...(oracleTraceF0MinHz != null && qlattTrackF0MinHz != null
      ? { f0MinDeltaHz: qlattTrackF0MinHz - oracleTraceF0MinHz }
      : {}),
    ...(oracleTraceF0MaxHz != null && qlattTrackF0MaxHz != null
      ? { f0MaxDeltaHz: qlattTrackF0MaxHz - oracleTraceF0MaxHz }
      : {}),
    ...(oracleTraceF0MeanHz != null && qlattTrackF0MeanHz != null
      ? { f0MeanDeltaHz: qlattTrackF0MeanHz - oracleTraceF0MeanHz }
      : {}),
    ...(oracleTraceVoicedRatio != null ? { oracleTraceVoicedRatio } : {}),
    ...(qlattTrackVoicedRatio != null ? { qlattTrackVoicedRatio } : {}),
    ...(oracleTraceVoicedRatio != null && qlattTrackVoicedRatio != null
      ? { voicedRatioDelta: qlattTrackVoicedRatio - oracleTraceVoicedRatio }
      : {}),
    ...(oracleTraceMeanAv != null ? { oracleTraceMeanAv } : {}),
    ...(oracleTraceMeanAp != null ? { oracleTraceMeanAp } : {}),
    ...(qlattTrackMeanAv != null ? { qlattTrackMeanAv } : {}),
    ...(qlattTrackMeanAh != null ? { qlattTrackMeanAh } : {}),
    ...(oracleTraceMeanAv != null && qlattTrackMeanAv != null
      ? { avDelta: qlattTrackMeanAv - oracleTraceMeanAv }
      : {}),
    ...(oracleTraceMeanAp != null && qlattTrackMeanAh != null
      ? { apToAhDelta: qlattTrackMeanAh - oracleTraceMeanAp }
      : {}),
  };

  const report: AudioComparisonReport = {
    schemaVersion: "v1",
    phraseId: args.phraseId,
    phrase: args.phrase,
    normalization: cfg,
    alignment: {
      lagSamples,
      lagMs: (lagSamples / cfg.comparisonSampleRate) * 1000,
    },
    oracle: {
      engineId: oracleArtifact.engineId,
      adapterId: oracleArtifact.adapterId,
      wavPath: args.oracleWav,
      metadataPath: args.oracleMeta,
      ...(oracleTrace ? { trace: oracleTrace } : {}),
      ...(symbolic.oracle ? { symbolic: symbolic.oracle } : {}),
    },
    qlatt: {
      engineId: qlattArtifact.engineId,
      adapterId: qlattArtifact.adapterId,
      wavPath: args.qlattWav,
      metadataPath: args.qlattMeta,
      ...(qlattTrackSummary ? { trackSummary: qlattTrackSummary } : {}),
      ...(args.qlattPayload ? { renderPayloadPath: args.qlattPayload } : {}),
      ...(symbolic.qlatt ? { symbolic: symbolic.qlatt } : {}),
    },
    metrics: {
      intelligibility: {
        stoi: stoiValue,
        estoi: estoiValue,
        ...(stoiSkippedReason ? { stoiSkippedReason } : {}),
      },
      acoustic: {
        rmsError: rmsError(oracleAligned, qlattAligned),
        maxAbsError: maxAbsError(oracleAligned, qlattAligned),
        correlation: correlation(oracleAligned, qlattAligned),
      },
      temporal: {
        oracleDurationSec: durationSeconds(oracleWav),
        qlattDurationSec: durationSeconds(qlattWav),
        alignedDurationSec: overlapLength / cfg.comparisonSampleRate,
        lagMs: (lagSamples / cfg.comparisonSampleRate) * 1000,
      },
      ...(qlattTrackSummary ? { track: qlattTrackSummary } : {}),
      ...(Object.keys(internalMetrics).length > 0 ? { internal: internalMetrics } : {}),
      symbolic: symbolic.comparison,
    },
    symbolic: {
      oracle: symbolic.oracle,
      qlatt: symbolic.qlatt,
    },
    verdict: { status: "warn", reasons: [] },
  };

  report.verdict = buildVerdict(report);
  return report;
}

async function main(): Promise<number> {
  try {
    const args = parseArgv(process.argv.slice(2));
    const report = compareAudioFiles(args);
    const text = JSON.stringify(report, null, 2);
    if (args.outPath) {
      fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
      fs.writeFileSync(args.outPath, `${text}\n`, "utf8");
    } else {
      process.stdout.write(`${text}\n`);
    }
    return report.verdict.status === "fail" ? 1 : 0;
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
