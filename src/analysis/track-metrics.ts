type FrameLike = {
  time?: unknown;
  phoneme?: unknown;
  params?: Record<string, unknown> | null;
};

export type TrackMetrics = {
  events: number;
  totalTime: number;
  voicedEvents: number;
  voicedTime: number;
  silenceTime: number;
  unvoicedNonsilenceTime: number;
  voicedRatio: number;
  f0Min: number;
  f0Max: number;
  f0Mean: number;
  f0Span: number;
  f1MeanVoiced: number;
  f2MeanVoiced: number;
  b1MeanVoiced: number;
  avMeanVoiced: number;
  ahMeanVoiced: number;
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function isVoicedFrame(frame: FrameLike): boolean {
  const av = Number(frame?.params?.AV ?? 0);
  const avs = Number(frame?.params?.AVS ?? 0);
  return av > 0 || avs > 0;
}

function collectPositiveParam(frames: FrameLike[], key: string): number[] {
  return frames
    .map((frame) => Number(frame.params?.[key] ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function collectFiniteParam(frames: FrameLike[], key: string): number[] {
  return frames
    .map((frame) => Number(frame.params?.[key] ?? 0))
    .filter((value) => Number.isFinite(value));
}

export function summarizeTrackMetrics(track: FrameLike[]): TrackMetrics {
  const safeTrack = Array.isArray(track) ? track : [];
  const voiced = safeTrack.filter(isVoicedFrame);
  const voicedF0 = collectPositiveParam(safeTrack, "F0");
  const voicedF1 = collectPositiveParam(voiced, "F1");
  const voicedF2 = collectPositiveParam(voiced, "F2");
  const voicedB1 = collectPositiveParam(voiced, "B1");
  const voicedAV = collectFiniteParam(voiced, "AV");
  const voicedAH = collectFiniteParam(voiced, "AH");

  let voicedTime = 0;
  let silenceTime = 0;
  let unvoicedNonsilenceTime = 0;
  for (let i = 0; i < safeTrack.length - 1; i += 1) {
    const cur = safeTrack[i];
    const next = safeTrack[i + 1];
    const curTime = Number(cur?.time ?? 0);
    const nextTime = Number(next?.time ?? 0);
    const delta = nextTime - curTime;
    if (!Number.isFinite(delta) || delta <= 0) continue;

    if (isVoicedFrame(cur)) {
      voicedTime += delta;
      continue;
    }
    if (cur?.phoneme === "SIL") {
      silenceTime += delta;
      continue;
    }
    unvoicedNonsilenceTime += delta;
  }

  const totalTime = Number(safeTrack[safeTrack.length - 1]?.time ?? 0);
  const f0Min = voicedF0.length ? Math.min(...voicedF0) : 0;
  const f0Max = voicedF0.length ? Math.max(...voicedF0) : 0;

  return {
    events: safeTrack.length,
    totalTime,
    voicedEvents: voiced.length,
    voicedTime,
    silenceTime,
    unvoicedNonsilenceTime,
    voicedRatio: totalTime > 0 ? voicedTime / totalTime : 0,
    f0Min,
    f0Max,
    f0Mean: mean(voicedF0),
    f0Span: f0Max - f0Min,
    f1MeanVoiced: mean(voicedF1),
    f2MeanVoiced: mean(voicedF2),
    b1MeanVoiced: mean(voicedB1),
    avMeanVoiced: mean(voicedAV),
    ahMeanVoiced: mean(voicedAH),
  };
}
