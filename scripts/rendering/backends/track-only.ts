import { textToKlattTrackDetailed } from "../../../src/tts-frontend.ts";
import { createDiagnostics } from "../../../src/diagnostics.ts";
import { summarizeTrack } from "../../../src/rendering/track-summary.ts";
import type {
  RenderBackend,
  RenderPayload,
  RenderRequest,
} from "../../../src/rendering/types.ts";

export const trackOnlyBackend: RenderBackend = {
  id: "track-only",
  supports(request: RenderRequest): boolean {
    return !request.persistWav;
  },
  async render(request: RenderRequest): Promise<RenderPayload> {
    const diagnostics = createDiagnostics({ maxEntries: 1000 });
    const frontend = textToKlattTrackDetailed(
      request.phrase,
      request.baseF0,
      request.transitionMs,
      {
        frontendId: request.frontendId,
        rate: request.rate,
        diagnostics,
      },
    );
    const track = frontend.track;
    const totalTime =
      (track.length ? track[track.length - 1].time : 0) +
      request.leadTime +
      request.tailTime;

    const payload: RenderPayload = {
      phrase: request.phrase,
      baseF0: request.baseF0,
      engine: request.engine,
      frontendId: request.frontendId,
      experimentId: request.experimentId,
      rate: request.rate,
      transitionMs: request.transitionMs,
      sampleRate: request.sampleRate,
      leadTime: request.leadTime,
      tailTime: request.tailTime,
      length: Math.max(1, Math.ceil(totalTime * request.sampleRate)),
      metrics: { rms: 0, peak: 0 },
      trackSummary: summarizeTrack(track),
      frontendPhones: frontend.frontendPhones,
      diagnostics: diagnostics.getEntries(),
      ...(frontend.f0LayerCommands ? { f0LayerCommands: frontend.f0LayerCommands } : {}),
      samples: [],
    };
    if (request.includeTrack) {
      payload.track = track;
    }
    return payload;
  },
};
