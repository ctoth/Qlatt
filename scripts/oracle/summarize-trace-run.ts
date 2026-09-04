#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  type DectalkTraceFrame,
  dectalkFrameStartSec,
  parseDectalkTraceFile,
} from "./dectalk-trace";

type Args = {
  runRoot: string;
  outPath?: string;
  maxPhaseDelta: number | null;
};

type TrackEvent = {
  time?: number;
  phoneme?: string;
  params?: Record<string, unknown>;
};

type TrackSelection = {
  event: TrackEvent;
  index: number;
};

type SegmentPhase = {
  startSec: number | null;
  endSec: number | null;
  phase: number | null;
};

type ParamBucketSummary = {
  compared: number;
  meanAbs: number;
  maxAbs: number;
  maxFrame: number | null;
  oracleAtMax: number | null;
  qlattAtMax: number | null;
  maxOraclePhone: string | null;
  maxOracleOutputPhone: string | null;
  maxQlattPhone: string | null;
  maxSegmentMatch: boolean | null;
  maxOracleSegmentStartSec: number | null;
  maxOracleSegmentEndSec: number | null;
  maxOracleSegmentPhase: number | null;
  maxQlattSegmentStartSec: number | null;
  maxQlattSegmentEndSec: number | null;
  maxQlattSegmentPhase: number | null;
  maxSegmentPhaseDelta: number | null;
};

type ParamSummary = {
  compared: number;
  meanAbs: number;
  maxAbs: number;
  maxFrame: number | null;
  oracleAtMax: number | null;
  qlattAtMax: number | null;
  maxOraclePhone: string | null;
  maxOracleOutputPhone: string | null;
  maxQlattPhone: string | null;
  maxSegmentMatch: boolean | null;
  maxOracleSegmentStartSec: number | null;
  maxOracleSegmentEndSec: number | null;
  maxOracleSegmentPhase: number | null;
  maxQlattSegmentStartSec: number | null;
  maxQlattSegmentEndSec: number | null;
  maxQlattSegmentPhase: number | null;
  maxSegmentPhaseDelta: number | null;
  sameSegment: ParamBucketSummary;
  phaseAlignedSameSegment: ParamBucketSummary;
  differentSegment: ParamBucketSummary;
  unknownSegment: ParamBucketSummary;
};

type PhraseSummary = {
  phraseId: string;
  oracleFrameCount: number;
  qlattDurationSec: number;
  oracleDurationSec: number;
  durationDeltaSec: number;
  alignment: {
    frames: number;
    sameSegment: number;
    differentSegment: number;
    unknown: number;
  };
  params: Record<string, ParamSummary>;
  ranked: Array<{ param: string } & ParamSummary>;
};

const US_PHONE = 1 << 8;
const USP_W = US_PHONE + 24;
const USP_R = US_PHONE + 26;
const USP_LL = US_PHONE + 27;
const USP_HX = US_PHONE + 28;
const USP_CZ = US_PHONE + 58;

const PHONE_BY_CODE: Record<number, string> = {
  0: "SIL",
  1: "IY",
  2: "IH",
  3: "EY",
  4: "EH",
  5: "AE",
  6: "AA",
  7: "AY",
  8: "AW",
  9: "AH",
  10: "AO",
  11: "OW",
  12: "OY",
  13: "UH",
  14: "UW",
  15: "ER",
  16: "YU",
  17: "AH",
  18: "IH",
  19: "IR",
  20: "ER",
  21: "AR",
  22: "OR",
  23: "UR",
  24: "W",
  25: "Y",
  26: "R",
  27: "L",
  28: "HH",
  29: "R",
  30: "L",
  31: "M",
  32: "N",
  33: "NG",
  34: "EL",
  35: "DH",
  36: "EN",
  37: "F",
  38: "V",
  39: "TH",
  40: "DH",
  41: "S",
  42: "Z",
  43: "SH",
  44: "ZH",
  45: "P",
  46: "B",
  47: "T",
  48: "D",
  49: "K",
  50: "G",
  51: "DX",
  52: "T",
  53: "Q",
  54: "CH",
  55: "JH",
  56: "DF",
  57: "TZ",
  58: "CZ",
};

const ORACLE_TOKEN_TO_QLATT: Record<string, string> = {
  _: "SIL",
  iy: "IY",
  ih: "IH",
  ey: "EY",
  eh: "EH",
  ae: "AE",
  aa: "AA",
  ay: "AY",
  aw: "AW",
  ah: "AH",
  ao: "AO",
  ow: "OW",
  oy: "OY",
  uh: "UH",
  uw: "UW",
  rr: "ER",
  er: "ER",
  ax: "AH",
  ix: "IH",
  ir: "IR",
  ar: "AR",
  or: "OR",
  ur: "UR",
  w: "W",
  yx: "Y",
  r: "R",
  ll: "L",
  hx: "HH",
  rx: "R",
  lx: "L",
  m: "M",
  n: "N",
  nx: "NG",
  el: "EL",
  dz: "DH",
  en: "EN",
  f: "F",
  v: "V",
  th: "TH",
  dh: "DH",
  s: "S",
  z: "Z",
  sh: "SH",
  zh: "ZH",
  p: "P",
  b: "B",
  t: "T",
  d: "D",
  k: "K",
  g: "G",
  dx: "DX",
  tx: "T",
  q: "Q",
  ch: "CH",
  jh: "JH",
  df: "DF",
  tz: "TZ",
  cz: "CZ",
  ".": "SIL",
  "?": "SIL",
  "!": "SIL",
  ",": "SIL",
};

const PARAM_MAP: Array<{
  label: string;
  oracle?: keyof DectalkTraceFrame["out"];
  oracleValue?: (frame: DectalkTraceFrame) => number | null;
  qlatt: string;
  qlattScale?: number;
}> = [
  {
    label: "F0",
    oracleValue: (frame) => (finiteNumber(frame.f0prime) == null ? null : frame.f0prime / 10),
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
    throw new Error("Usage: summarize-trace-run --run-root dir [--out file] [--max-phase-delta n]");
  }
  const runRoot = flags.get("run-root");
  if (!runRoot) {
    throw new Error("Missing required --run-root");
  }
  const maxPhaseDeltaRaw = flags.get("max-phase-delta");
  const maxPhaseDelta = maxPhaseDeltaRaw == null ? null : Number(maxPhaseDeltaRaw);
  if (maxPhaseDelta != null && (!Number.isFinite(maxPhaseDelta) || maxPhaseDelta < 0)) {
    throw new Error(`Invalid --max-phase-delta: ${maxPhaseDeltaRaw}`);
  }
  return {
    runRoot: path.resolve(runRoot),
    outPath: flags.get("out") ? path.resolve(flags.get("out") as string) : undefined,
    maxPhaseDelta,
  };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function phoneCodeToQlatt(value: unknown): string | null {
  const numeric = finiteNumber(value);
  if (numeric == null) return null;
  const code = numeric >= US_PHONE ? numeric - US_PHONE : numeric;
  return PHONE_BY_CODE[code] ?? null;
}

function oracleTokenToQlatt(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return null;
  return ORACLE_TOKEN_TO_QLATT[trimmed] ?? null;
}

function normalizeQlattPhone(phoneme: unknown): string | null {
  if (typeof phoneme !== "string") return null;
  const trimmed = phoneme
    .trim()
    .toUpperCase()
    .replace(/[0-2]$/u, "");
  if (!trimmed) return null;
  if (trimmed.endsWith("_REL") || trimmed.endsWith("_ASP")) {
    return trimmed.slice(0, trimmed.lastIndexOf("_"));
  }
  if (trimmed === "LL" || trimmed === "LX") return "L";
  if (trimmed === "RR") return "ER";
  if (trimmed === "AX") return "AH";
  if (trimmed === "IX") return "IH";
  if (trimmed === "HH") return "HH";
  return trimmed;
}

function loadOracleComparisonTokens(phraseDir: string): string[] {
  const artifactPath = path.join(phraseDir, "oracle", "oracle.json");
  if (!fs.existsSync(artifactPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as Record<string, unknown>;
  const symbolic = parsed.symbolic;
  if (!symbolic || typeof symbolic !== "object") return [];
  const comparisonTokens = (symbolic as { comparisonTokens?: unknown }).comparisonTokens;
  if (!Array.isArray(comparisonTokens)) return [];
  return comparisonTokens
    .map((token) => (typeof token === "string" ? token : ""))
    .filter((token) => token.length > 0);
}

function oracleSourcePhoneForFrame(
  frame: DectalkTraceFrame,
  comparisonTokens: string[],
): string | null {
  const tokenIndex = frame.phoneIndex - 1;
  const tokenPhone =
    tokenIndex >= 0 && tokenIndex < comparisonTokens.length
      ? oracleTokenToQlatt(comparisonTokens[tokenIndex])
      : null;
  if (tokenPhone != null) return tokenPhone;
  if (frame.phoneIndex <= 0) return "SIL";
  if (frame.phoneIndex > comparisonTokens.length + 1) return "SIL";
  return phoneCodeToQlatt(frame.out.PH);
}

function emptyBucket(): ParamBucketSummary {
  return {
    compared: 0,
    meanAbs: 0,
    maxAbs: 0,
    maxFrame: null,
    oracleAtMax: null,
    qlattAtMax: null,
    maxOraclePhone: null,
    maxOracleOutputPhone: null,
    maxQlattPhone: null,
    maxSegmentMatch: null,
    maxOracleSegmentStartSec: null,
    maxOracleSegmentEndSec: null,
    maxOracleSegmentPhase: null,
    maxQlattSegmentStartSec: null,
    maxQlattSegmentEndSec: null,
    maxQlattSegmentPhase: null,
    maxSegmentPhaseDelta: null,
  };
}

function accumulateBucket(
  bucket: ParamBucketSummary,
  sumAbs: number,
  frameIndex: number,
  oracleValue: number,
  qlattValueForFrame: number,
  abs: number,
  oraclePhone: string | null,
  oracleOutputPhone: string | null,
  qlattPhone: string | null,
  segmentMatch: boolean,
  oraclePhase: SegmentPhase,
  qlattPhase: SegmentPhase,
): number {
  bucket.compared += 1;
  const nextSum = sumAbs + abs;
  bucket.meanAbs = nextSum / bucket.compared;
  if (abs > bucket.maxAbs) {
    bucket.maxAbs = abs;
    bucket.maxFrame = frameIndex;
    bucket.oracleAtMax = oracleValue;
    bucket.qlattAtMax = qlattValueForFrame;
    bucket.maxOraclePhone = oraclePhone;
    bucket.maxOracleOutputPhone = oracleOutputPhone;
    bucket.maxQlattPhone = qlattPhone;
    bucket.maxSegmentMatch = segmentMatch;
    bucket.maxOracleSegmentStartSec = oraclePhase.startSec;
    bucket.maxOracleSegmentEndSec = oraclePhase.endSec;
    bucket.maxOracleSegmentPhase = oraclePhase.phase;
    bucket.maxQlattSegmentStartSec = qlattPhase.startSec;
    bucket.maxQlattSegmentEndSec = qlattPhase.endSec;
    bucket.maxQlattSegmentPhase = qlattPhase.phase;
    bucket.maxSegmentPhaseDelta =
      oraclePhase.phase != null && qlattPhase.phase != null
        ? qlattPhase.phase - oraclePhase.phase
        : null;
  }
  return nextSum;
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

function eventSelectionAt(track: TrackEvent[], timeSec: number): TrackSelection | null {
  let selected: TrackSelection | null = null;
  for (let index = 0; index < track.length; index += 1) {
    const event = track[index]!;
    const eventTime = finiteNumber(event.time);
    if (eventTime == null) continue;
    if (eventTime <= timeSec + 1e-9) {
      selected = { event, index };
      continue;
    }
    break;
  }
  return selected;
}

function eventAt(track: TrackEvent[], timeSec: number): TrackEvent | null {
  return eventSelectionAt(track, timeSec)?.event ?? null;
}

function qlattValue(event: TrackEvent | null, key: string, scale = 1): number | null {
  if (!event?.params || typeof event.params !== "object") return null;
  const value = finiteNumber(event.params[key]);
  return value == null ? null : value * scale;
}

function clampUnit(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function oracleSegmentPhaseAt(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
  frameIndex: number,
): SegmentPhase {
  const frame = oracleFrames[frameIndex];
  if (!frame) return { startSec: null, endSec: null, phase: null };
  let firstFrame = frameIndex;
  while (firstFrame > 0 && oracleFrames[firstFrame - 1]?.phoneIndex === frame.phoneIndex) {
    firstFrame -= 1;
  }
  let lastFrame = frameIndex;
  while (
    lastFrame + 1 < oracleFrames.length &&
    oracleFrames[lastFrame + 1]?.phoneIndex === frame.phoneIndex
  ) {
    lastFrame += 1;
  }
  const startSec = dectalkFrameStartSec(oracleFrames[firstFrame]!.frame);
  const endSec = dectalkFrameStartSec(oracleFrames[lastFrame]!.frame + 1);
  const spanSec = endSec - startSec;
  const frameSec = dectalkFrameStartSec(frame.frame);
  return {
    startSec,
    endSec,
    phase: spanSec > 0 ? clampUnit((frameSec - startSec) / spanSec) : null,
  };
}

function qlattSegmentPhaseAt(
  track: TrackEvent[],
  selection: TrackSelection | null,
  timeSec: number,
): SegmentPhase {
  if (selection == null) return { startSec: null, endSec: null, phase: null };
  const selectedPhone = normalizeQlattPhone(selection.event.phoneme);
  if (selectedPhone == null) return { startSec: null, endSec: null, phase: null };

  let firstIndex = selection.index;
  while (firstIndex > 0 && normalizeQlattPhone(track[firstIndex - 1]?.phoneme) === selectedPhone) {
    firstIndex -= 1;
  }

  let lastIndex = selection.index;
  while (
    lastIndex + 1 < track.length &&
    normalizeQlattPhone(track[lastIndex + 1]?.phoneme) === selectedPhone
  ) {
    lastIndex += 1;
  }

  const startSec = finiteNumber(track[firstIndex]?.time);
  const nextTime = finiteNumber(track[lastIndex + 1]?.time);
  const fallbackEndSec = finiteNumber(track[track.length - 1]?.time);
  const endSec = nextTime ?? fallbackEndSec;
  if (startSec == null || endSec == null) {
    return { startSec, endSec, phase: null };
  }
  const spanSec = endSec - startSec;
  return {
    startSec,
    endSec,
    phase: spanSec > 0 ? clampUnit((timeSec - startSec) / spanSec) : null,
  };
}

function summarizeParam(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
  track: TrackEvent[],
  oracleComparisonTokens: string[],
  oracleKey: keyof DectalkTraceFrame["out"] | undefined,
  oracleValueForFrame: ((frame: DectalkTraceFrame) => number | null) | undefined,
  qlattKey: string,
  qlattScale = 1,
  maxPhaseDelta: number | null = null,
): ParamSummary {
  let compared = 0;
  let sumAbs = 0;
  let maxAbs = 0;
  let maxFrame: number | null = null;
  let oracleAtMax: number | null = null;
  let qlattAtMax: number | null = null;
  let maxOraclePhone: string | null = null;
  let maxOracleOutputPhone: string | null = null;
  let maxQlattPhone: string | null = null;
  let maxSegmentMatch: boolean | null = null;
  let maxOracleSegmentStartSec: number | null = null;
  let maxOracleSegmentEndSec: number | null = null;
  let maxOracleSegmentPhase: number | null = null;
  let maxQlattSegmentStartSec: number | null = null;
  let maxQlattSegmentEndSec: number | null = null;
  let maxQlattSegmentPhase: number | null = null;
  let maxSegmentPhaseDelta: number | null = null;
  let sameSegmentSumAbs = 0;
  let phaseAlignedSameSegmentSumAbs = 0;
  let differentSegmentSumAbs = 0;
  let unknownSegmentSumAbs = 0;
  const sameSegment = emptyBucket();
  const phaseAlignedSameSegment = emptyBucket();
  const differentSegment = emptyBucket();
  const unknownSegment = emptyBucket();

  for (let frameIndex = 0; frameIndex < oracleFrames.length; frameIndex += 1) {
    const oracleFrame = oracleFrames[frameIndex]!;
    const oracleValue =
      oracleValueForFrame?.(oracleFrame) ??
      (oracleKey == null ? null : finiteNumber(oracleFrame.out[oracleKey]));
    const frameTimeSec = dectalkFrameStartSec(oracleFrame.frame);
    const selection = eventSelectionAt(track, frameTimeSec);
    const event = selection?.event ?? null;
    const qlatt = qlattValue(event, qlattKey, qlattScale);
    if (oracleValue == null || qlatt == null) continue;
    if (qlattKey === "F0") {
      const oracleAv = finiteNumber(oracleFrame.out.AV);
      const qlattAv = qlattValue(event, "AV");
      // DECtalk maintains f0prime through unvoiced frames while Qlatt exposes
      // F0=0 there. Compare audible pitch only when both engines are voiced;
      // AV and voiced-ratio metrics retain the voicing disagreement itself.
      if (oracleAv == null || qlattAv == null || oracleAv <= 0 || qlattAv <= 0) continue;
    }

    const abs = Math.abs(qlatt - oracleValue);
    const oraclePhone = oracleSourcePhoneForFrame(oracleFrame, oracleComparisonTokens);
    const oracleOutputPhone = phoneCodeToQlatt(oracleFrame.out.PH);
    const qlattPhone = normalizeQlattPhone(event?.phoneme);
    const knownSegmentPhones = oraclePhone != null && qlattPhone != null;
    const segmentMatch = knownSegmentPhones && oraclePhone === qlattPhone;
    const oraclePhase = oracleSegmentPhaseAt(oracleFrames, frameIndex);
    const qlattPhase = qlattSegmentPhaseAt(track, selection, frameTimeSec);
    compared += 1;
    sumAbs += abs;
    if (!knownSegmentPhones) {
      unknownSegmentSumAbs = accumulateBucket(
        unknownSegment,
        unknownSegmentSumAbs,
        frameIndex,
        oracleValue,
        qlatt,
        abs,
        oraclePhone,
        oracleOutputPhone,
        qlattPhone,
        segmentMatch,
        oraclePhase,
        qlattPhase,
      );
    } else if (segmentMatch) {
      sameSegmentSumAbs = accumulateBucket(
        sameSegment,
        sameSegmentSumAbs,
        frameIndex,
        oracleValue,
        qlatt,
        abs,
        oraclePhone,
        oracleOutputPhone,
        qlattPhone,
        segmentMatch,
        oraclePhase,
        qlattPhase,
      );
      const phaseDelta =
        oraclePhase.phase != null && qlattPhase.phase != null
          ? Math.abs(qlattPhase.phase - oraclePhase.phase)
          : null;
      if (maxPhaseDelta != null && phaseDelta != null && phaseDelta <= maxPhaseDelta) {
        phaseAlignedSameSegmentSumAbs = accumulateBucket(
          phaseAlignedSameSegment,
          phaseAlignedSameSegmentSumAbs,
          frameIndex,
          oracleValue,
          qlatt,
          abs,
          oraclePhone,
          oracleOutputPhone,
          qlattPhone,
          segmentMatch,
          oraclePhase,
          qlattPhase,
        );
      }
    } else {
      differentSegmentSumAbs = accumulateBucket(
        differentSegment,
        differentSegmentSumAbs,
        frameIndex,
        oracleValue,
        qlatt,
        abs,
        oraclePhone,
        oracleOutputPhone,
        qlattPhone,
        segmentMatch,
        oraclePhase,
        qlattPhase,
      );
    }
    if (abs > maxAbs) {
      maxAbs = abs;
      maxFrame = frameIndex;
      oracleAtMax = oracleValue;
      qlattAtMax = qlatt;
      maxOraclePhone = oraclePhone;
      maxOracleOutputPhone = oracleOutputPhone;
      maxQlattPhone = qlattPhone;
      maxSegmentMatch = segmentMatch;
      maxOracleSegmentStartSec = oraclePhase.startSec;
      maxOracleSegmentEndSec = oraclePhase.endSec;
      maxOracleSegmentPhase = oraclePhase.phase;
      maxQlattSegmentStartSec = qlattPhase.startSec;
      maxQlattSegmentEndSec = qlattPhase.endSec;
      maxQlattSegmentPhase = qlattPhase.phase;
      maxSegmentPhaseDelta =
        oraclePhase.phase != null && qlattPhase.phase != null
          ? qlattPhase.phase - oraclePhase.phase
          : null;
    }
  }

  return {
    compared,
    meanAbs: compared > 0 ? sumAbs / compared : 0,
    maxAbs,
    maxFrame,
    oracleAtMax,
    qlattAtMax,
    maxOraclePhone,
    maxOracleOutputPhone,
    maxQlattPhone,
    maxSegmentMatch,
    maxOracleSegmentStartSec,
    maxOracleSegmentEndSec,
    maxOracleSegmentPhase,
    maxQlattSegmentStartSec,
    maxQlattSegmentEndSec,
    maxQlattSegmentPhase,
    maxSegmentPhaseDelta,
    sameSegment,
    phaseAlignedSameSegment,
    differentSegment,
    unknownSegment,
  };
}

function summarizeAlignment(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
  track: TrackEvent[],
  oracleComparisonTokens: string[],
): PhraseSummary["alignment"] {
  let sameSegment = 0;
  let differentSegment = 0;
  let unknown = 0;
  for (let frameIndex = 0; frameIndex < oracleFrames.length; frameIndex += 1) {
    const oraclePhone = oracleSourcePhoneForFrame(
      oracleFrames[frameIndex]!,
      oracleComparisonTokens,
    );
    const event = eventAt(track, dectalkFrameStartSec(oracleFrames[frameIndex]!.frame));
    const qlattPhone = normalizeQlattPhone(event?.phoneme);
    if (oraclePhone == null || qlattPhone == null) {
      unknown += 1;
    } else if (oraclePhone === qlattPhone) {
      sameSegment += 1;
    } else {
      differentSegment += 1;
    }
  }
  return {
    frames: oracleFrames.length,
    sameSegment,
    differentSegment,
    unknown,
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

function summarizePhrase(phraseDir: string, maxPhaseDelta: number | null): PhraseSummary {
  const oracleTrace = path.join(phraseDir, "oracle", "oracle.trace.jsonl");
  const qlattPayload = path.join(phraseDir, "qlatt", "qlatt.json");
  const oracle = parseDectalkTraceFile(oracleTrace);
  const track = loadTrack(qlattPayload);
  const oracleComparisonTokens = loadOracleComparisonTokens(phraseDir);
  const lastTrackTime = finiteNumber(track[track.length - 1]?.time) ?? 0;

  const params = Object.fromEntries(
    PARAM_MAP.map((entry) => [
      entry.label,
      summarizeParam(
        oracle.frames,
        track,
        oracleComparisonTokens,
        entry.oracle,
        entry.oracleValue,
        entry.qlatt,
        entry.qlattScale ?? 1,
        maxPhaseDelta,
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
    alignment: summarizeAlignment(oracle.frames, track, oracleComparisonTokens),
    params,
    ranked,
  };
}

function summarizeCorpus(phrases: PhraseSummary[]): Record<string, unknown> {
  const byParam = PARAM_MAP.map(({ label }) => {
    let compared = 0;
    let weightedAbs = 0;
    let sameCompared = 0;
    let sameWeightedAbs = 0;
    let differentCompared = 0;
    let differentWeightedAbs = 0;
    let unknownCompared = 0;
    let unknownWeightedAbs = 0;
    let maxAbs = 0;
    let maxPhraseId: string | null = null;
    let maxFrame: number | null = null;
    let oracleAtMax: number | null = null;
    let qlattAtMax: number | null = null;
    let maxOraclePhone: string | null = null;
    let maxOracleOutputPhone: string | null = null;
    let maxQlattPhone: string | null = null;
    let maxSegmentMatch: boolean | null = null;
    let maxOracleSegmentStartSec: number | null = null;
    let maxOracleSegmentEndSec: number | null = null;
    let maxOracleSegmentPhase: number | null = null;
    let maxQlattSegmentStartSec: number | null = null;
    let maxQlattSegmentEndSec: number | null = null;
    let maxQlattSegmentPhase: number | null = null;
    let maxSegmentPhaseDelta: number | null = null;

    for (const phrase of phrases) {
      const summary = phrase.params[label];
      if (!summary) continue;
      compared += summary.compared;
      weightedAbs += summary.meanAbs * summary.compared;
      sameCompared += summary.sameSegment.compared;
      sameWeightedAbs += summary.sameSegment.meanAbs * summary.sameSegment.compared;
      differentCompared += summary.differentSegment.compared;
      differentWeightedAbs += summary.differentSegment.meanAbs * summary.differentSegment.compared;
      unknownCompared += summary.unknownSegment.compared;
      unknownWeightedAbs += summary.unknownSegment.meanAbs * summary.unknownSegment.compared;
      if (summary.maxAbs > maxAbs) {
        maxAbs = summary.maxAbs;
        maxPhraseId = phrase.phraseId;
        maxFrame = summary.maxFrame;
        oracleAtMax = summary.oracleAtMax;
        qlattAtMax = summary.qlattAtMax;
        maxOraclePhone = summary.maxOraclePhone;
        maxOracleOutputPhone = summary.maxOracleOutputPhone;
        maxQlattPhone = summary.maxQlattPhone;
        maxSegmentMatch = summary.maxSegmentMatch;
        maxOracleSegmentStartSec = summary.maxOracleSegmentStartSec;
        maxOracleSegmentEndSec = summary.maxOracleSegmentEndSec;
        maxOracleSegmentPhase = summary.maxOracleSegmentPhase;
        maxQlattSegmentStartSec = summary.maxQlattSegmentStartSec;
        maxQlattSegmentEndSec = summary.maxQlattSegmentEndSec;
        maxQlattSegmentPhase = summary.maxQlattSegmentPhase;
        maxSegmentPhaseDelta = summary.maxSegmentPhaseDelta;
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
      maxOraclePhone,
      maxOracleOutputPhone,
      maxQlattPhone,
      maxSegmentMatch,
      maxOracleSegmentStartSec,
      maxOracleSegmentEndSec,
      maxOracleSegmentPhase,
      maxQlattSegmentStartSec,
      maxQlattSegmentEndSec,
      maxQlattSegmentPhase,
      maxSegmentPhaseDelta,
      sameSegmentCompared: sameCompared,
      sameSegmentMeanAbs: sameCompared > 0 ? sameWeightedAbs / sameCompared : 0,
      differentSegmentCompared: differentCompared,
      differentSegmentMeanAbs: differentCompared > 0 ? differentWeightedAbs / differentCompared : 0,
      unknownSegmentCompared: unknownCompared,
      unknownSegmentMeanAbs: unknownCompared > 0 ? unknownWeightedAbs / unknownCompared : 0,
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
    alignment: phrases.reduce(
      (total, phrase) => ({
        frames: total.frames + phrase.alignment.frames,
        sameSegment: total.sameSegment + phrase.alignment.sameSegment,
        differentSegment: total.differentSegment + phrase.alignment.differentSegment,
        unknown: total.unknown + phrase.alignment.unknown,
      }),
      { frames: 0, sameSegment: 0, differentSegment: 0, unknown: 0 },
    ),
    byParam,
    worstPhraseParam,
  };
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const phrases = phraseDirs(args.runRoot).map((phraseDir) =>
    summarizePhrase(phraseDir, args.maxPhaseDelta),
  );
  const report = {
    schemaVersion: "v1",
    runRoot: args.runRoot,
    phaseAlignmentMaxDelta: args.maxPhaseDelta,
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
