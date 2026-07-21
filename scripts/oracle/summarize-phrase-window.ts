#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  dectalkFrameStartSec,
  parseDectalkTraceFile,
  type DectalkTraceFrame,
} from "./dectalk-trace";

type Args = {
  runRoot: string;
  phraseId: string;
  param: string;
  startSec: number;
  endSec: number;
};

type CompareJson = {
  params?: Record<string, {
    compared: number;
    meanAbs: number;
    maxAbs: number;
    maxFrame: number | null;
    oracleAtMax: number | null;
    qlattAtMax: number | null;
  }>;
  oraclePhoneGroups?: Array<{
    phoneIndex: number;
    firstFrame: number;
    lastFrame: number;
    frameCount: number;
    durationSec: number;
    ph: number;
    ph2: number;
    du: number;
  }>;
  qlattTrackRuns?: Array<{
    phoneme: string;
    firstEvent: number;
    lastEvent: number;
    startSec: number;
    endSec: number;
    durationSec: number;
  }>;
};

type QlattPayload = {
  track?: Array<{
    time?: number;
    phoneme?: string;
    word?: string;
    params?: Record<string, unknown>;
  }>;
};

// Match compare-trace.ts event selection so binary representation at an exact
// packet boundary cannot make the diagnostic summarize a different event.
const EVENT_TIME_EPSILON_SEC = 1e-9;

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

  const runRoot = flags.get("run-root");
  const phraseId = flags.get("phrase-id");
  if (!runRoot || !phraseId) {
    throw new Error("Usage: summarize-phrase-window --run-root dir --phrase-id id [--param name] [--start-sec n] [--end-sec n]");
  }

  return {
    runRoot: path.resolve(runRoot),
    phraseId,
    param: flags.get("param") ?? "F2",
    startSec: numberFlag(flags, "start-sec", 0),
    endSec: numberFlag(flags, "end-sec", Number.POSITIVE_INFINITY),
  };
}

function numberFlag(flags: Map<string, string>, name: string, fallback: number): number {
  const raw = flags.get(name);
  if (raw == null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Invalid --${name}: ${raw}`);
  return value;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function oracleParameterValue(frame: DectalkTraceFrame, param: string): number | null {
  return param === "F0"
    ? frame.f0prime / 10
    : finiteNumber(frame.out[param as keyof DectalkTraceFrame["out"]]);
}

function summarizeValues(values: number[]): string {
  if (values.length === 0) return "none";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return `count=${values.length} min=${min.toFixed(3)} mean=${mean.toFixed(3)} max=${max.toFixed(3)}`;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const phraseRoot = path.join(args.runRoot, args.phraseId);
  const comparePath = path.join(args.runRoot, `${args.phraseId}-trace-compare.json`);
  const parentComparePath = path.join(path.dirname(args.runRoot), `${args.phraseId}-trace-compare.json`);
  const nestedComparePath = path.join(phraseRoot, "compare.json");
  const oracleTracePath = path.join(phraseRoot, "oracle", "oracle.trace.jsonl");
  const qlattPayloadPath = path.join(phraseRoot, "qlatt", "qlatt.json");

  const compare = readJson<CompareJson>(
    fs.existsSync(comparePath)
      ? comparePath
      : fs.existsSync(parentComparePath)
        ? parentComparePath
        : nestedComparePath,
  );
  const qlatt = readJson<QlattPayload>(qlattPayloadPath);
  const oracle = parseDectalkTraceFile(oracleTracePath).frames;

  const oracleWindow = oracle
    .map((frame, frameIndex) => ({ frame, frameIndex, timeSec: dectalkFrameStartSec(frame.frame) }))
    .filter(({ timeSec }) => timeSec >= args.startSec && timeSec <= args.endSec);
  const qlattWindow = (qlatt.track ?? [])
    .map((event, eventIndex) => ({ event, eventIndex, timeSec: finiteNumber(event.time) }))
    .filter(({ timeSec }) => timeSec != null && timeSec >= args.startSec && timeSec <= args.endSec);

  console.log(`# ${args.phraseId}`);
  console.log(`runRoot=${args.runRoot}`);
  console.log(`window=${args.startSec.toFixed(4)}..${args.endSec.toFixed(4)} sec`);
  const paramSummary = compare.params?.[args.param];
  if (paramSummary) {
    console.log(
      `${args.param} compared=${paramSummary.compared} meanAbs=${paramSummary.meanAbs} maxAbs=${paramSummary.maxAbs} maxFrame=${paramSummary.maxFrame} oracleAtMax=${paramSummary.oracleAtMax} qlattAtMax=${paramSummary.qlattAtMax}`,
    );
  }

  console.log("\nOracle phone groups:");
  for (const group of compare.oraclePhoneGroups ?? []) {
    const startSec = dectalkFrameStartSec(group.firstFrame);
    const endSec = dectalkFrameStartSec(group.lastFrame + 1);
    if (endSec < args.startSec || startSec > args.endSec) continue;
    const groupFrames = oracle.slice(group.firstFrame, group.lastFrame + 1);
    const paramValues = groupFrames
      .map((frame) => oracleParameterValue(frame, args.param))
      .filter((value): value is number => value != null);
    console.log(
      `  phoneIndex=${group.phoneIndex} frames=${group.firstFrame}-${group.lastFrame} time=${startSec.toFixed(4)}..${endSec.toFixed(4)} ph=${group.ph} ph2=${group.ph2} du=${group.du} ${args.param} ${summarizeValues(paramValues)}`,
    );
  }

  console.log("\nQlatt track runs:");
  for (const run of compare.qlattTrackRuns ?? []) {
    if (run.endSec < args.startSec || run.startSec > args.endSec) continue;
    const events = qlattWindow.filter(({ timeSec }) => timeSec != null && timeSec >= run.startSec && timeSec <= run.endSec);
    const paramValues = events
      .map(({ event }) => finiteNumber(event.params?.[args.param]))
      .filter((value): value is number => value != null);
    console.log(
      `  phoneme=${run.phoneme} events=${run.firstEvent}-${run.lastEvent} time=${run.startSec.toFixed(4)}..${run.endSec.toFixed(4)} duration=${run.durationSec.toFixed(4)} ${args.param} ${summarizeValues(paramValues)}`,
    );
  }

  console.log("\nFrame window:");
  for (const { frame, frameIndex, timeSec } of oracleWindow) {
    const qlattEvent = qlattWindow.reduce<{ eventIndex: number; value: number | null } | null>((best, candidate) => {
      if (
        candidate.timeSec == null
        || candidate.timeSec > timeSec + EVENT_TIME_EPSILON_SEC
      ) return best;
      return {
        eventIndex: candidate.eventIndex,
        value: finiteNumber(candidate.event.params?.[args.param]),
      };
    }, null);
    const oracleValue = oracleParameterValue(frame, args.param);
    const qlattValue = qlattEvent?.value ?? null;
    const delta = oracleValue != null && qlattValue != null ? qlattValue - oracleValue : null;
    console.log(
      `  frame=${frameIndex} t=${timeSec.toFixed(4)} ph=${finiteNumber(frame.out.PH) ?? "?"} ph2=${finiteNumber(frame.out.PH2) ?? "?"} oracle${args.param}=${oracleValue ?? "?"} qlattEvent=${qlattEvent?.eventIndex ?? "?"} qlatt${args.param}=${qlattValue ?? "?"} delta=${delta == null ? "?" : delta.toFixed(3)}`,
    );
  }
}

main();
