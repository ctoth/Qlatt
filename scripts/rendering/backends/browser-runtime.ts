import type { RenderBackend, RenderPayload, RenderRequest } from "../../../src/rendering/types.ts";
import { type BrowserRenderOptions, openBrowserSession } from "../browser-session.ts";

/** What a render request asks of the page's offline driver. */
export function browserRenderOptions(request: RenderRequest): BrowserRenderOptions {
  return {
    phrase: request.phrase,
    baseF0: request.baseF0,
    engine: request.engine,
    frontendId: request.frontendId,
    experimentId: request.experimentId,
    rate: request.rate,
    // The voice goes to the frontend as the page's voice selection gives it.
    ...(request.speaker ? { speaker: request.speaker } : {}),
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
    // The legacy page's driver takes no voice; rendering the default voice
    // under another voice's name would be a wrong answer.
    if (request.speaker && request.engine !== "runtime") {
      throw new Error(
        `The browser render backend cannot select a voice for the ${request.engine} engine (--speaker ${request.speaker}). Use --engine runtime or --host node.`,
      );
    }
    const session = await openBrowserSession({
      repoRoot: request.repoRoot,
      engine: request.engine === "runtime" ? "runtime" : "legacy",
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
