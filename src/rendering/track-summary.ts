import { summarizeTrackMetrics } from "../analysis/track-metrics";
import type { RenderTrackSummary } from "./types";

export function summarizeTrack(
  track: Array<{ time: number; phoneme?: string; params?: Record<string, number> }>,
): RenderTrackSummary {
  const metrics = summarizeTrackMetrics(track);
  return {
    events: metrics.events,
    totalTime: metrics.totalTime,
    voicedEvents: metrics.voicedEvents,
    voicedTime: metrics.voicedTime,
    silenceTime: metrics.silenceTime,
    unvoicedNonsilenceTime: metrics.unvoicedNonsilenceTime,
    voicedRatio: metrics.voicedRatio,
    f0Min: metrics.f0Min,
    f0Max: metrics.f0Max,
    f0Mean: metrics.f0Mean,
    f0Span: metrics.f0Span,
  };
}
