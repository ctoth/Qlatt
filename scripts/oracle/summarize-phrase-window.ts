#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseDectalkTraceFile } from "./dectalk-trace";

const FRAME_PERIOD_SEC = 0.0064;

type Args = {
  runRoot: string;
  phraseId: string;
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
    throw new Error("Usage: summarize-phrase-window --run-root dir --phrase-id id [--start-sec n] [--end-sec n]");
  }

  return {
    runRoot: path.resolve(runRoot),
    phraseId,
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
    .map((frame, frameIndex) => ({ frame, frameIndex, timeSec: frameIndex * FRAME_PERIOD_SEC }))
    .filter(({ timeSec }) => timeSec >= args.startSec && timeSec <= args.endSec);
  const qlattWindow = (qlatt.track ?? [])
    .map((event, eventIndex) => ({ event, eventIndex, timeSec: finiteNumber(event.time) }))
    .filter(({ timeSec }) => timeSec != null && timeSec >= args.startSec && timeSec <= args.endSec);

  console.log(`# ${args.phraseId}`);
  console.log(`runRoot=${args.runRoot}`);
  console.log(`window=${args.startSec.toFixed(4)}..${args.endSec.toFixed(4)} sec`);
  const f2 = compare.params?.F2;
  if (f2) {
    console.log(
      `F2 compared=${f2.compared} meanAbs=${f2.meanAbs} maxAbs=${f2.maxAbs} maxFrame=${f2.maxFrame} oracleAtMax=${f2.oracleAtMax} qlattAtMax=${f2.qlattAtMax}`,
    );
  }

  console.log("\nOracle phone groups:");
  for (const group of compare.oraclePhoneGroups ?? []) {
    const startSec = group.firstFrame * FRAME_PERIOD_SEC;
    const endSec = (group.lastFrame + 1) * FRAME_PERIOD_SEC;
    if (endSec < args.startSec || startSec > args.endSec) continue;
    const groupFrames = oracle.slice(group.firstFrame, group.lastFrame + 1);
    const f2Values = groupFrames.map((frame) => finiteNumber(frame.out.F2)).filter((value): value is number => value != null);
    console.log(
      `  phoneIndex=${group.phoneIndex} frames=${group.firstFrame}-${group.lastFrame} time=${startSec.toFixed(4)}..${endSec.toFixed(4)} ph=${group.ph} ph2=${group.ph2} du=${group.du} F2 ${summarizeValues(f2Values)}`,
    );
  }

  console.log("\nQlatt track runs:");
  for (const run of compare.qlattTrackRuns ?? []) {
    if (run.endSec < args.startSec || run.startSec > args.endSec) continue;
    const events = qlattWindow.filter(({ timeSec }) => timeSec != null && timeSec >= run.startSec && timeSec <= run.endSec);
    const f2Values = events
      .map(({ event }) => finiteNumber(event.params?.F2))
      .filter((value): value is number => value != null);
    console.log(
      `  phoneme=${run.phoneme} events=${run.firstEvent}-${run.lastEvent} time=${run.startSec.toFixed(4)}..${run.endSec.toFixed(4)} duration=${run.durationSec.toFixed(4)} F2 ${summarizeValues(f2Values)}`,
    );
  }

  console.log("\nFrame window:");
  for (const { frame, frameIndex, timeSec } of oracleWindow) {
    const qlattEvent = qlattWindow.reduce<{ eventIndex: number; f2: number | null } | null>((best, candidate) => {
      if (candidate.timeSec == null || candidate.timeSec > timeSec) return best;
      return {
        eventIndex: candidate.eventIndex,
        f2: finiteNumber(candidate.event.params?.F2),
      };
    }, null);
    const oracleF2 = finiteNumber(frame.out.F2);
    const qlattF2 = qlattEvent?.f2 ?? null;
    const delta = oracleF2 != null && qlattF2 != null ? qlattF2 - oracleF2 : null;
    console.log(
      `  frame=${frameIndex} t=${timeSec.toFixed(4)} ph=${finiteNumber(frame.out.PH) ?? "?"} ph2=${finiteNumber(frame.out.PH2) ?? "?"} oracleF2=${oracleF2 ?? "?"} qlattEvent=${qlattEvent?.eventIndex ?? "?"} qlattF2=${qlattF2 ?? "?"} delta=${delta == null ? "?" : delta.toFixed(3)}`,
    );
  }
}

main();
