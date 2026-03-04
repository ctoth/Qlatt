import fs from "node:fs";

// DECtalk 4.63 emits one trace row per synthesizer frame in ph_claus.c, which
// documents the clause loop as "For each 6.4 msec frame of current clause".
// Citation: C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_claus.c
const DECTALK_TRACE_FRAME_PERIOD_SEC = 0.0064;

export type DectalkTraceFrame = {
  frame: number;
  timeFrames: number;
  tcum: number;
  phoneIndex: number;
  f0prime: number;
  out: {
    PH: number;
    DU: number;
    PH2: number;
    T0: number;
    F1: number;
    F2: number;
    F3: number;
    B1: number;
    B2: number;
    B3: number;
    AV: number;
    AP: number;
    A2: number;
    A3: number;
    A4: number;
    A5: number;
    A6: number;
    AB: number;
    TLT: number;
  };
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toNumber(value: unknown, fallback = 0): number {
  return isFiniteNumber(value) ? value : fallback;
}

function parseFrame(line: string): DectalkTraceFrame | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  const parsed = JSON.parse(trimmed) as Record<string, unknown>;
  const out = (parsed.out ?? {}) as Record<string, unknown>;
  return {
    frame: toNumber(parsed.frame),
    timeFrames: toNumber(parsed.timeFrames),
    tcum: toNumber(parsed.tcum),
    phoneIndex: toNumber(parsed.phoneIndex),
    f0prime: toNumber(parsed.f0prime),
    out: {
      PH: toNumber(out.PH),
      DU: toNumber(out.DU),
      PH2: toNumber(out.PH2),
      T0: toNumber(out.T0),
      F1: toNumber(out.F1),
      F2: toNumber(out.F2),
      F3: toNumber(out.F3),
      B1: toNumber(out.B1),
      B2: toNumber(out.B2),
      B3: toNumber(out.B3),
      AV: toNumber(out.AV),
      AP: toNumber(out.AP),
      A2: toNumber(out.A2),
      A3: toNumber(out.A3),
      A4: toNumber(out.A4),
      A5: toNumber(out.A5),
      A6: toNumber(out.A6),
      AB: toNumber(out.AB),
      TLT: toNumber(out.TLT),
    },
  };
}

export function summarizeDectalkTrace(frames: DectalkTraceFrame[]): Record<string, unknown> {
  const voicedFrames = frames.filter((frame) => frame.out.AV > 0);
  const voicedF0 = voicedFrames
    .map((frame) => frame.f0prime / 10)
    .filter((value) => value > 0 && Number.isFinite(value));

  const f0MinHz =
    voicedF0.length > 0 ? Math.min(...voicedF0) : null;
  const f0MaxHz =
    voicedF0.length > 0 ? Math.max(...voicedF0) : null;
  const f0MeanHz =
    voicedF0.length > 0
      ? voicedF0.reduce((sum, value) => sum + value, 0) / voicedF0.length
      : null;

  const durationFrames =
    frames.length > 0 ? frames[frames.length - 1]!.timeFrames + 1 : 0;
  const durationSec = durationFrames * DECTALK_TRACE_FRAME_PERIOD_SEC;

  return {
    frameCount: frames.length,
    durationFrames,
    durationSec,
    voicedFrameCount: voicedFrames.length,
    voicedRatio: frames.length > 0 ? voicedFrames.length / frames.length : 0,
    f0MinHz,
    f0MaxHz,
    f0MeanHz,
    meanAv:
      frames.length > 0
        ? frames.reduce((sum, frame) => sum + frame.out.AV, 0) / frames.length
        : null,
    meanAp:
      frames.length > 0
        ? frames.reduce((sum, frame) => sum + frame.out.AP, 0) / frames.length
        : null,
  };
}

export function parseDectalkTraceJsonl(raw: string): {
  frames: DectalkTraceFrame[];
  summary: Record<string, unknown>;
} {
  const frames = raw
    .split(/\r?\n/u)
    .map((line) => parseFrame(line))
    .filter((frame): frame is DectalkTraceFrame => frame != null);
  return {
    frames,
    summary: summarizeDectalkTrace(frames),
  };
}

export function parseDectalkTraceFile(filePath: string): {
  frames: DectalkTraceFrame[];
  summary: Record<string, unknown>;
} {
  return parseDectalkTraceJsonl(fs.readFileSync(filePath, "utf8"));
}
