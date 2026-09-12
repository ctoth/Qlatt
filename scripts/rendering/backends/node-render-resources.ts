import path from "node:path";
import { loadExperimentConfig } from "../../../src/experiments/load-experiment-config.ts";
import type { RenderRequest } from "../../../src/rendering/types.ts";
import { createNodeRuntimeAssetLoader } from "../../../src/runtime-assets/node-loader.ts";

type ResourceRequest = Pick<
  RenderRequest,
  "repoRoot" | "experimentId" | "frontendId" | "sampleRate"
>;

// Configuration is plain YAML/JSON data. Freeze the complete object graph before
// sharing it; request-specific runtime state must never be stored in this data.
function freezeConfiguration(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeConfiguration(child);
}

export async function loadNodeRenderResources(request: ResourceRequest) {
  const config = await loadExperimentConfig(request.experimentId, request.frontendId);
  freezeConfiguration(config);
  const assetLoader = await createNodeRuntimeAssetLoader(
    path.join(request.repoRoot, "public", "worklets"),
  );
  return { config, assetLoader };
}

export function createNodeRenderResources() {
  const entries = new Map<string, ReturnType<typeof loadNodeRenderResources>>();
  let disposal: Promise<void> | undefined;
  return {
    async get(request: ResourceRequest) {
      if (disposal) throw new Error("Node render resources are disposed");
      const key = JSON.stringify([
        path.resolve(request.repoRoot),
        request.experimentId,
        request.frontendId,
        request.sampleRate,
      ]);
      let entry = entries.get(key);
      if (!entry) {
        entry = loadNodeRenderResources(request).catch((error) => {
          entries.delete(key);
          throw error;
        });
        entries.set(key, entry);
      }
      return entry;
    },
    dispose(): Promise<void> {
      disposal ??= (async () => {
        const loaded = await Promise.allSettled(entries.values());
        entries.clear();
        const results = await Promise.allSettled(
          loaded.map(async (entry) =>
            entry.status === "fulfilled" ? entry.value.assetLoader.dispose?.() : undefined,
          ),
        );
        const failure = results.find((result) => result.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      })();
      return disposal;
    },
  };
}
