import { afterEach, describe, expect, it, vi } from "vitest";

describe("harness runtime replacement", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("destroys diagnostics before releasing an experiment runtime", async () => {
    vi.stubGlobal("AudioContext", class MockAudioContext {});
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      getElementById: vi.fn((id: string) =>
        id === "experimentSelect" ? { value: "replacement" } : null,
      ),
    });

    const { state } = await import("./harness/state.js");
    const { onExperimentChange } = await import("./harness/experiment.js");
    const destroy = vi.fn();
    const disconnect = vi.fn();

    state.currentExperimentId = "current";
    state.diagEngine = { destroy };
    state.newRuntime = { disconnect };

    onExperimentChange();

    expect(destroy).toHaveBeenCalledOnce();
    expect(state.diagEngine).toBeNull();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(state.newRuntime).toBeNull();
  });

  it("rejects an incompatible frontend even when the experiment config is cached", async () => {
    vi.stubGlobal("AudioContext", class MockAudioContext {});
    vi.stubGlobal("window", {});
    const frontend = { value: "qlatt-english" };
    vi.stubGlobal("document", {
      getElementById: vi.fn((id: string) =>
        id === "experimentSelect"
          ? { value: "klatt80-baseline" }
          : id === "frontendSelect"
            ? frontend
            : id === "status"
              ? { textContent: "" }
              : null,
      ),
    });
    const { state } = await import("./harness/state.js");
    const { loadNewRuntimeConfig } = await import("./harness/experiment.js");
    await loadNewRuntimeConfig();
    const graph = state.newRuntimeGraph;
    frontend.value = "dectalk-english";
    await expect(loadNewRuntimeConfig()).rejects.toThrow(/E_FRONTEND_VOCABULARY.*breathiness/);
    frontend.value = "qlatt-english";
    await expect(loadNewRuntimeConfig()).resolves.toBeUndefined();
    expect(state.newRuntimeGraph).toBe(graph);
  });
});
