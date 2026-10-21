import { type BrowserRenderOptions, openBrowserSession } from "../browser-session.ts";
import type { RenderBackend, RenderPayload, RenderRequest } from "../types.ts";

/** What a render request asks of the page's offline driver. */
export function browserRenderOptions(request: RenderRequest): BrowserRenderOptions {
  return {
    phrase: request.phrase,
    baseF0: request.baseF0,
    engine: request.engine,
    frontendId: request.frontendId,
    experimentId: request.experimentId,
    rate: request.rate,
    ...(request.speaker === undefined ? {} : { speaker: request.speaker }),
    voiceQuality: request.voiceQuality,
    directionTrack: request.directionTrack,
    ...(request.pitchScale === undefined ? {} : { pitchScale: request.pitchScale }),
    transitionMs: request.transitionMs,
    sampleRate: request.sampleRate,
    leadTime: request.leadTime,
    tailTime: request.tailTime,
    includeTrack: request.includeTrack,
    noiseSeed: request.noiseSeed,
  };
}

export const browserRuntimeBackend: RenderBackend = {
  id: "browser-runtime",
  supports(request: RenderRequest): boolean {
    return request.persistWav && request.renderHost === "browser";
  },
  async render(request: RenderRequest): Promise<RenderPayload> {
    if (!request.allowBrowserRender) {
      throw new Error(
        "Browser-backed rendering is disabled by default. Pass --allow-browser 1 to opt in.",
      );
    }
    if (request.engine !== "runtime") {
      throw new Error(
        `Unsupported render engine '${request.engine}': only runtime is supported. Use --engine runtime.`,
      );
    }
    const session = await openBrowserSession({
      repoRoot: request.repoRoot,
      engine: "runtime",
      browserExecutablePath: request.browserExecutablePath,
      log: (line) => process.stderr.write(`${line}\n`),
    });
    try {
      process.stderr.write("[browser:driver] starting render\n");
      const payload = await session.render(browserRenderOptions(request));
      process.stderr.write("[browser:driver] result fetched\n");
      return payload;
    } finally {
      await session.close();
    }
  },
};
