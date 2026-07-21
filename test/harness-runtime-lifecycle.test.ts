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
});
