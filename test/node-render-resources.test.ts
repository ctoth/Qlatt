import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNodeRenderResources } from "../scripts/rendering/backends/node-render-resources";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { createNodeRuntimeAssetLoader } from "../src/runtime-assets/node-loader";

vi.mock("../src/experiments/load-experiment-config", () => ({ loadExperimentConfig: vi.fn() }));
vi.mock("../src/runtime-assets/node-loader", () => ({ createNodeRuntimeAssetLoader: vi.fn() }));

describe("server-owned render resources", () => {
  const dispose = vi.fn();
  const request = {
    repoRoot: "/repo",
    experimentId: "baseline",
    frontendId: "english",
    sampleRate: 22050,
  };
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(loadExperimentConfig).mockResolvedValue({
      graph: { bacon: "0.1", nodes: {}, connections: [] },
      semantics: { name: "test" },
      registry: { primitives: {} },
    });
    vi.mocked(createNodeRuntimeAssetLoader).mockResolvedValue({
      dispose,
      resolveWorkletModule: (name) => name,
      loadWasmModule: vi.fn(),
    });
  });

  it("shares in-flight and warm resources until shutdown", async () => {
    const resources = createNodeRenderResources();
    const [first, second] = await Promise.all([resources.get(request), resources.get(request)]);
    expect(second).toBe(first);
    expect(await resources.get(request)).toBe(first);
    expect(loadExperimentConfig).toHaveBeenCalledTimes(1);
    expect(createNodeRuntimeAssetLoader).toHaveBeenCalledTimes(1);
    expect(dispose).not.toHaveBeenCalled();
    await resources.dispose();
    await resources.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    await expect(resources.get(request)).rejects.toThrow("disposed");
  });

  it("isolates experiment, frontend, sample rate, and repository", async () => {
    const resources = createNodeRenderResources();
    await resources.get(request);
    await resources.get({ ...request, experimentId: "other" });
    await resources.get({ ...request, frontendId: "other" });
    await resources.get({ ...request, sampleRate: 44100 });
    await resources.get({ ...request, repoRoot: "/other" });
    expect(createNodeRuntimeAssetLoader).toHaveBeenCalledTimes(5);
    await resources.dispose();
    expect(dispose).toHaveBeenCalledTimes(5);
  });

  it("retries failed initialization and disposes pending successful loads", async () => {
    const resources = createNodeRenderResources();
    vi.mocked(createNodeRuntimeAssetLoader).mockRejectedValueOnce(new Error("load failed"));
    await expect(resources.get(request)).rejects.toThrow("load failed");
    const pending = resources.get(request);
    await resources.dispose();
    await pending;
    expect(createNodeRuntimeAssetLoader).toHaveBeenCalledTimes(2);
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
