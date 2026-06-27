#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseDectalkTraceFile } from "./dectalk-trace";

const FRAME_PERIOD_SEC = 0.0064;

type Args = {
  oracleTrace: string;
  qlattPayload: string;
  outPath?: string;
};

type TrackEvent = {
  time?: number;
  phoneme?: string;
  params?: Record<string, unknown>;
};

type FrontendPhone = {
  phoneme?: string;
  durationMs?: number;
  minimumDurationMs?: number;
};

type ParamSummary = {
  compared: number;
  meanAbs: number;
  maxAbs: number;
  maxFrame: number | null;
  oracleAtMax: number | null;
  qlattAtMax: number | null;
};

type OraclePhoneGroup = {
  phoneIndex: number;
  firstFrame: number;
  lastFrame: number;
  frameCount: number;
  durationSec: number;
  ph: number;
  ph2: number;
  du: number;
};

type TrackRun = {
  phoneme: string;
  firstEvent: number;
  lastEvent: number;
  startSec: number;
  endSec: number;
  durationSec: number;
};

const PARAM_MAP: Array<{
  oracle: string;
  qlatt: string;
  qlattScale?: number;
}> = [
  { oracle: "T0", qlatt: "F0", qlattScale: 10 },
  { oracle: "F1", qlatt: "F1" },
  { oracle: "F2", qlatt: "F2" },
  { oracle: "F3", qlatt: "F3" },
  { oracle: "B1", qlatt: "B1" },
  { oracle: "B2", qlatt: "B2" },
  { oracle: "B3", qlatt: "B3" },
  { oracle: "AV", qlatt: "AV" },
  { oracle: "AP", qlatt: "AH" },
  { oracle: "A2", qlatt: "A2" },
  { oracle: "A3", qlatt: "A3" },
  { oracle: "A4", qlatt: "A4" },
  { oracle: "A5", qlatt: "A5" },
  { oracle: "A6", qlatt: "A6" },
  { oracle: "AB", qlatt: "AB" },
  { oracle: "TLT", qlatt: "TL" },
];

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

  if (flags.has("help")) {
    throw new Error(
      "Usage: compare-trace --oracle-trace file --qlatt-payload file [--out file]",
    );
  }
  const oracleTrace = flags.get("oracle-trace");
  const qlattPayload = flags.get("qlatt-payload");
  if (!oracleTrace || !qlattPayload) {
    throw new Error("Missing required --oracle-trace or --qlatt-payload");
  }
  return {
    oracleTrace: path.resolve(oracleTrace),
    qlattPayload: path.resolve(qlattPayload),
    outPath: flags.get("out") ? path.resolve(flags.get("out") as string) : undefined,
  };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function loadPayload(filePath: string): {
  track: TrackEvent[];
  frontendPhones: FrontendPhone[];
} {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const track = parsed.track;
  if (!Array.isArray(track)) {
    throw new Error(`Qlatt payload has no track array: ${filePath}`);
  }
  const frontendPhones = Array.isArray(parsed.frontendPhones)
    ? parsed.frontendPhones.filter(
        (phone): phone is FrontendPhone => phone != null && typeof phone === "object",
      )
    : [];
  return {
    track: track.filter((event): event is TrackEvent => event != null && typeof event === "object"),
    frontendPhones,
  };
}

function eventAt(track: TrackEvent[], timeSec: number): TrackEvent | null {
  let selected: TrackEvent | null = null;
  for (const event of track) {
    const eventTime = finiteNumber(event.time);
    if (eventTime == null) continue;
    if (eventTime <= timeSec + 1e-9) {
      selected = event;
      continue;
    }
    break;
  }
  return selected;
}

function qlattValue(event: TrackEvent | null, key: string, scale = 1): number | null {
  if (!event?.params || typeof event.params !== "object") return null;
  const value = finiteNumber(event.params[key]);
  return value == null ? null : value * scale;
}

function summarizeParam(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
  track: TrackEvent[],
  oracleKey: string,
  qlattKey: string,
  qlattScale = 1,
): ParamSummary {
  let compared = 0;
  let sumAbs = 0;
  let maxAbs = 0;
  let maxFrame: number | null = null;
  let oracleAtMax: number | null = null;
  let qlattAtMax: number | null = null;

  for (let frameIndex = 0; frameIndex < oracleFrames.length; frameIndex += 1) {
    const oracleFrame = oracleFrames[frameIndex]!;
    const oracleValue = finiteNumber(
      oracleFrame.out[oracleKey as keyof typeof oracleFrame.out],
    );
    const event = eventAt(track, frameIndex * FRAME_PERIOD_SEC);
    const qlatt = qlattValue(event, qlattKey, qlattScale);
    if (oracleValue == null || qlatt == null) continue;

    const abs = Math.abs(qlatt - oracleValue);
    compared += 1;
    sumAbs += abs;
    if (abs > maxAbs) {
      maxAbs = abs;
      maxFrame = frameIndex;
      oracleAtMax = oracleValue;
      qlattAtMax = qlatt;
    }
  }

  return {
    compared,
    meanAbs: compared > 0 ? sumAbs / compared : 0,
    maxAbs,
    maxFrame,
    oracleAtMax,
    qlattAtMax,
  };
}

function groupOraclePhones(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
): OraclePhoneGroup[] {
  const groups: OraclePhoneGroup[] = [];
  for (const frame of oracleFrames) {
    const last = groups[groups.length - 1];
    if (last && last.phoneIndex === frame.phoneIndex) {
      last.lastFrame = frame.frame;
      last.frameCount += 1;
      last.durationSec = last.frameCount * FRAME_PERIOD_SEC;
      continue;
    }
    groups.push({
      phoneIndex: frame.phoneIndex,
      firstFrame: frame.frame,
      lastFrame: frame.frame,
      frameCount: 1,
      durationSec: FRAME_PERIOD_SEC,
      ph: frame.out.PH,
      ph2: frame.out.PH2,
      du: frame.out.DU,
    });
  }
  return groups;
}

function groupTrackRuns(track: TrackEvent[]): TrackRun[] {
  const runs: TrackRun[] = [];
  for (let index = 0; index < track.length; index += 1) {
    const event = track[index]!;
    const phoneme = event.phoneme ?? "";
    if (!phoneme) continue;
    const eventTime = finiteNumber(event.time);
    if (eventTime == null) continue;
    const last = runs[runs.length - 1];
    if (last && last.phoneme === phoneme) {
      last.lastEvent = index;
      continue;
    }
    runs.push({
      phoneme,
      firstEvent: index,
      lastEvent: index,
      startSec: eventTime,
      endSec: eventTime,
      durationSec: 0,
    });
  }

  for (let index = 0; index < runs.length; index += 1) {
    const run = runs[index]!;
    const next = runs[index + 1];
    const fallbackEnd = finiteNumber(track[track.length - 1]?.time) ?? run.startSec;
    run.endSec = next?.startSec ?? fallbackEnd;
    run.durationSec = Math.max(0, run.endSec - run.startSec);
  }
  return runs;
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const oracle = parseDectalkTraceFile(args.oracleTrace);
  const payload = loadPayload(args.qlattPayload);
  const track = payload.track;
  const lastTrackTime = finiteNumber(track[track.length - 1]?.time) ?? 0;

  const params = Object.fromEntries(
    PARAM_MAP.map((entry) => [
      entry.oracle,
      summarizeParam(
        oracle.frames,
        track,
        entry.oracle,
        entry.qlatt,
        entry.qlattScale ?? 1,
      ),
    ]),
  ) as Record<string, ParamSummary>;

  const ranked = Object.entries(params)
    .sort((left, right) => right[1].meanAbs - left[1].meanAbs)
    .map(([param, summary]) => ({ param, ...summary }));

  const report = {
    schemaVersion: "v1",
    oracleTrace: args.oracleTrace,
    qlattPayload: args.qlattPayload,
    oracleFrameCount: oracle.frames.length,
    qlattLastTimeSec: lastTrackTime,
    oracleDurationSec: oracle.summary.durationSec,
    qlattDurationSec: lastTrackTime,
    durationDeltaSec: lastTrackTime - Number(oracle.summary.durationSec ?? 0),
    oraclePhoneGroups: groupOraclePhones(oracle.frames),
    qlattTrackRuns: groupTrackRuns(track),
    qlattFrontendPhones: payload.frontendPhones.map((phone) => ({
      phoneme: phone.phoneme ?? "",
      durationMs: finiteNumber(phone.durationMs),
      minimumDurationMs: finiteNumber(phone.minimumDurationMs),
    })),
    params,
    ranked,
  };

  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (args.outPath) {
    fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
    fs.writeFileSync(args.outPath, text, "utf8");
  } else {
    process.stdout.write(text);
  }
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
