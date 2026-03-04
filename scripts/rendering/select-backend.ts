import type { RenderBackend, RenderRequest } from "../../src/rendering/types.ts";
import { browserRuntimeBackend } from "./backends/browser-runtime.ts";
import { nodeRuntimeBackend } from "./backends/node-runtime.ts";
import { trackOnlyBackend } from "./backends/track-only.ts";

const BACKENDS: RenderBackend[] = [
  trackOnlyBackend,
  nodeRuntimeBackend,
  browserRuntimeBackend,
];

export function selectRenderBackend(request: RenderRequest): RenderBackend {
  if (request.renderHost === "browser" && !request.allowBrowserRender) {
    throw new Error(
      "Browser-backed rendering is disabled by default. Pass --allow-browser 1 to opt in.",
    );
  }

  const backend = BACKENDS.find((candidate) => candidate.supports(request));
  if (backend) return backend;

  if (request.persistWav && request.engine !== "runtime") {
    throw new Error(
      "Only the runtime engine supports default Node offline WAV rendering. " +
        "Use --engine runtime, or explicitly choose --host browser with --allow-browser 1.",
    );
  }

  if (request.persistWav && request.renderHost === "browser") {
    throw new Error(
      "Browser fallback was requested but no browser-capable backend accepted the request.",
    );
  }

  throw new Error(
    `No render backend is available for engine='${request.engine}', host='${request.renderHost}', persistWav=${request.persistWav}.`,
  );
}
