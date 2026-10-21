import { summarizeTrackMetrics } from "../analysis/track-metrics";
import type { Diagnostics } from "../diagnostics";
import type { TrackMetricsPolicy } from "../semantics/types";
import type { RenderTrackSummary } from "./types";

export function summarizeTrack(
  track: Array<{ time: number; phoneme?: string; params?: Record<string, number> }>,
  policy: TrackMetricsPolicy | undefined,
  diagnostics: Diagnostics,
  experimentId: string,
): RenderTrackSummary | undefined {
  if (!policy) {
    diagnostics.info(
      "Track summary unavailable: no experiment metrics policy",
      { experimentId },
      "I_TRACK_METRICS_UNAVAILABLE",
    );
    return undefined;
  }
  const metrics = summarizeTrackMetrics(track, policy);
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
