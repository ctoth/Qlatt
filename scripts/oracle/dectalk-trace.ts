import fs from "node:fs";

// DECtalk's frontend loop is nominally 6.4 ms (ph_claus.c), but the VTM
// controller emits one concrete 71-sample packet at 11,025 Hz for each traced
// delaypars packet (VTM/vtmiont.c:491-515, 1351-1378). Keep the control and
// audio domains distinct: L1/L3 diagnostics use the emitted packet boundary.
export const DECTALK_NATIVE_SAMPLE_RATE_HZ = 11_025;
export const DECTALK_SAMPLES_PER_FRAME = 71;
export const DECTALK_NOMINAL_CONTROL_FRAME_PERIOD_SEC = 0.0064;

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

export type DectalkTraceSummary = {
  frameCount: number;
  durationFrames: number;
  durationSamples: number;
  durationSec: number;
  nominalControlDurationSec: number;
  voicedFrameCount: number;
  voicedRatio: number;
  f0MinHz: number | null;
  f0MaxHz: number | null;
  f0MeanHz: number | null;
  meanAv: number | null;
  meanAp: number | null;
};

export function dectalkFrameStartSample(frame: number): number {
  return frame * DECTALK_SAMPLES_PER_FRAME;
}

export function dectalkFrameStartSec(frame: number): number {
  return dectalkFrameStartSample(frame) / DECTALK_NATIVE_SAMPLE_RATE_HZ;
}

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

export function summarizeDectalkTrace(frames: DectalkTraceFrame[]): DectalkTraceSummary {
  const voicedFrames = frames.filter((frame) => frame.out.AV > 0);
  const voicedF0 = voicedFrames
    .map((frame) => frame.f0prime / 10)
    .filter((value) => value > 0 && Number.isFinite(value));

  const f0MinHz = voicedF0.length > 0 ? Math.min(...voicedF0) : null;
  const f0MaxHz = voicedF0.length > 0 ? Math.max(...voicedF0) : null;
  const f0MeanHz =
    voicedF0.length > 0 ? voicedF0.reduce((sum, value) => sum + value, 0) / voicedF0.length : null;

  const durationFrames = frames.length;
  const durationSamples = durationFrames * DECTALK_SAMPLES_PER_FRAME;
  const durationSec = durationSamples / DECTALK_NATIVE_SAMPLE_RATE_HZ;

  return {
    frameCount: frames.length,
    durationFrames,
    durationSamples,
    durationSec,
    nominalControlDurationSec: durationFrames * DECTALK_NOMINAL_CONTROL_FRAME_PERIOD_SEC,
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
  summary: DectalkTraceSummary;
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
  summary: DectalkTraceSummary;
} {
  return parseDectalkTraceJsonl(fs.readFileSync(filePath, "utf8"));
}
