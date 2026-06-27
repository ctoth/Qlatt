#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseDectalkTraceFile, type DectalkTraceFrame } from "./dectalk-trace";

const FRAME_PERIOD_SEC = 0.0064;

type Args = {
  runRoot: string;
  outPath?: string;
};

type TrackEvent = {
  time?: number;
  params?: Record<string, unknown>;
};

type ParamSummary = {
  compared: number;
  meanAbs: number;
  maxAbs: number;
  maxFrame: number | null;
  oracleAtMax: number | null;
  qlattAtMax: number | null;
};

type PhraseSummary = {
  phraseId: string;
  oracleFrameCount: number;
  qlattDurationSec: number;
  oracleDurationSec: number;
  durationDeltaSec: number;
  params: Record<string, ParamSummary>;
  ranked: Array<{ param: string } & ParamSummary>;
};

const US_PHONE = 1 << 8;
const USP_W = US_PHONE + 24;
const USP_R = US_PHONE + 26;
const USP_LL = US_PHONE + 27;
const USP_HX = US_PHONE + 28;
const USP_CZ = US_PHONE + 58;

const PARAM_MAP: Array<{
  label: string;
  oracle?: keyof DectalkTraceFrame["out"];
  oracleValue?: (frame: DectalkTraceFrame) => number | null;
  qlatt: string;
  qlattScale?: number;
}> = [
  {
    label: "F0",
    oracleValue: (frame) => finiteNumber(frame.f0prime) == null ? null : frame.f0prime / 10,
    qlatt: "F0",
  },
  { label: "F1", oracle: "F1", qlatt: "F1" },
  { label: "F2", oracle: "F2", qlatt: "F2" },
  { label: "F3", oracle: "F3", qlatt: "F3" },
  { label: "B1", oracle: "B1", qlatt: "B1" },
  { label: "B2", oracle: "B2", qlatt: "B2" },
  { label: "B3", oracle: "B3", qlatt: "B3" },
  { label: "AV", oracle: "AV", qlatt: "AV" },
  { label: "AP", oracle: "AP", qlatt: "AH" },
  { label: "A2", oracleValue: dectalkA2Db, qlatt: "A2" },
  { label: "A3", oracle: "A3", qlatt: "A3" },
  { label: "A4", oracle: "A4", qlatt: "A4" },
  { label: "A5", oracle: "A5", qlatt: "A5" },
  { label: "A6", oracle: "A6", qlatt: "A6" },
  { label: "AB", oracle: "AB", qlatt: "AB" },
  { label: "TLT", oracle: "TLT", qlatt: "TL" },
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
    throw new Error("Usage: summarize-trace-run --run-root dir [--out file]");
  }
  const runRoot = flags.get("run-root");
  if (!runRoot) {
    throw new Error("Missing required --run-root");
  }
  return {
    runRoot: path.resolve(runRoot),
    outPath: flags.get("out") ? path.resolve(flags.get("out") as string) : undefined,
  };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dectalkA2Db(frame: DectalkTraceFrame): number | null {
  const raw = finiteNumber(frame.out.A2);
  if (raw == null) return null;

  const phone = finiteNumber(frame.out.PH);
  if (raw === 4000) {
    if (phone === USP_R || phone === USP_LL) return 45;
    if (phone === USP_W) return 50;
    return 0;
  }

  // DECtalk 4.63 VTM/vtmiont.c HLSYN decodes OUT_A2 sentinels into NA2F dB.
  let decoded: number | null;
  switch (raw) {
    case 1000:
      decoded = 30;
      break;
    case 1100:
      decoded = 40;
      break;
    case 1200:
    case 1300:
      decoded = 0;
      break;
    case 2000: {
      const f2 = finiteNumber(frame.out.F2);
      decoded = f2 == null ? null : f2 > 1700 ? 0 : 3;
      break;
    }
    case 3000: {
      const f3 = finiteNumber(frame.out.F3);
      if (f3 == null) {
        decoded = null;
      } else if (f3 > 2600) {
        decoded = 0;
      } else if (f3 !== 2400) {
        decoded = 10;
      } else {
        decoded = null;
      }
      break;
    }
    case 3100:
    case 3200:
    case 3300:
      decoded = 10;
      break;
    default:
      decoded = raw < 1000 ? raw : null;
      break;
  }

  if (phone === USP_HX) return 30;
  if (phone === USP_CZ) return 50;
  return decoded;
}

function loadTrack(filePath: string): TrackEvent[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const track = parsed.track;
  if (!Array.isArray(track)) {
    throw new Error(`Qlatt payload has no track array: ${filePath}`);
  }
  return track.filter((event): event is TrackEvent => event != null && typeof event === "object");
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
  oracleKey: keyof DectalkTraceFrame["out"] | undefined,
  oracleValueForFrame: ((frame: DectalkTraceFrame) => number | null) | undefined,
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
    const oracleValue =
      oracleValueForFrame?.(oracleFrame) ??
      (oracleKey == null ? null : finiteNumber(oracleFrame.out[oracleKey]));
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

function phraseDirs(runRoot: string): string[] {
  return fs
    .readdirSync(runRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(runRoot, entry.name))
    .filter((entryPath) => {
      return (
        fs.existsSync(path.join(entryPath, "oracle", "oracle.trace.jsonl")) &&
        fs.existsSync(path.join(entryPath, "qlatt", "qlatt.json"))
      );
    })
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right)));
}

function summarizePhrase(phraseDir: string): PhraseSummary {
  const oracleTrace = path.join(phraseDir, "oracle", "oracle.trace.jsonl");
  const qlattPayload = path.join(phraseDir, "qlatt", "qlatt.json");
  const oracle = parseDectalkTraceFile(oracleTrace);
  const track = loadTrack(qlattPayload);
  const lastTrackTime = finiteNumber(track[track.length - 1]?.time) ?? 0;

  const params = Object.fromEntries(
    PARAM_MAP.map((entry) => [
      entry.label,
      summarizeParam(
        oracle.frames,
        track,
        entry.oracle,
        entry.oracleValue,
        entry.qlatt,
        entry.qlattScale ?? 1,
      ),
    ]),
  ) as Record<string, ParamSummary>;

  const ranked = Object.entries(params)
    .sort((left, right) => right[1].meanAbs - left[1].meanAbs)
    .map(([param, summary]) => ({ param, ...summary }));

  return {
    phraseId: path.basename(phraseDir),
    oracleFrameCount: oracle.frames.length,
    qlattDurationSec: lastTrackTime,
    oracleDurationSec: Number(oracle.summary.durationSec ?? 0),
    durationDeltaSec: lastTrackTime - Number(oracle.summary.durationSec ?? 0),
    params,
    ranked,
  };
}

function summarizeCorpus(phrases: PhraseSummary[]): Record<string, unknown> {
  const byParam = PARAM_MAP.map(({ label }) => {
    let compared = 0;
    let weightedAbs = 0;
    let maxAbs = 0;
    let maxPhraseId: string | null = null;
    let maxFrame: number | null = null;
    let oracleAtMax: number | null = null;
    let qlattAtMax: number | null = null;

    for (const phrase of phrases) {
      const summary = phrase.params[label];
      if (!summary) continue;
      compared += summary.compared;
      weightedAbs += summary.meanAbs * summary.compared;
      if (summary.maxAbs > maxAbs) {
        maxAbs = summary.maxAbs;
        maxPhraseId = phrase.phraseId;
        maxFrame = summary.maxFrame;
        oracleAtMax = summary.oracleAtMax;
        qlattAtMax = summary.qlattAtMax;
      }
    }

    return {
      param: label,
      compared,
      meanAbs: compared > 0 ? weightedAbs / compared : 0,
      maxAbs,
      maxPhraseId,
      maxFrame,
      oracleAtMax,
      qlattAtMax,
    };
  }).sort((left, right) => right.meanAbs - left.meanAbs);

  const worstPhraseParam = phrases
    .flatMap((phrase) =>
      phrase.ranked.map((summary) => ({
        phraseId: phrase.phraseId,
        ...summary,
      })),
    )
    .sort((left, right) => right.meanAbs - left.meanAbs)
    .slice(0, 25);

  return {
    phraseCount: phrases.length,
    byParam,
    worstPhraseParam,
  };
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const phrases = phraseDirs(args.runRoot).map(summarizePhrase);
  const report = {
    schemaVersion: "v1",
    runRoot: args.runRoot,
    summary: summarizeCorpus(phrases),
    phrases,
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
