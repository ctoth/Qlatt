import { describe, expect, it, vi } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { createKlattRuntime, type KlattRuntimeOptions } from "../src/klatt-runtime";

function fixture() {
  const diagnostics = createDiagnostics();
  const node = {
    gain: { value: 1 },
    numberOfInputs: 1,
    numberOfOutputs: 1,
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const options: KlattRuntimeOptions = {
    diagnostics,
    audioContext: {
      createGain: () => node,
      destination: {},
      audioWorklet: { addModule: vi.fn() },
    } as unknown as AudioContext,
    graph: { bacon: "0.1", nodes: { out: { type: "gain" } }, outputs: ["out"] },
    registry: { primitives: { gain: { native: "GainNode" } } },
    semantics: { name: "test", params: {} },
  };
  return { options, diagnostics, node };
}

describe("runtime structural diagnostics", () => {
  it("reports unsupported native bindings before construction", async () => {
    const { options, diagnostics, node } = fixture();
    options.registry.primitives.gain.native = "UnknownNode";
    await expect(createKlattRuntime(options)).rejects.toThrow(/Unsupported native binding/);
    expect(node.connect).not.toHaveBeenCalled();
    expect(diagnostics.getEntries()[0]).toMatchObject({
      code: "runtime.invalid_primitive",
      level: "error",
      data: {
        nodeId: "out",
        primitive: "gain",
        native: "UnknownNode",
        consequence: "operation rejected",
      },
    });
  });
  it("keeps the worklet count and mono-channel defaults", async () => {
    const { options, diagnostics } = fixture();
    const constructed = vi.fn();
    class Worklet {
      parameters = new Map();
      connect = vi.fn();
      disconnect = vi.fn();
      handler?: (event: { data: { type: string } }) => void;
      port = {
        addEventListener: (_: string, handler: Worklet["handler"]) => {
          this.handler = handler;
        },
        removeEventListener: vi.fn(),
        start: vi.fn(),
        close: vi.fn(),
        postMessage: (message: { type: string }) => {
          if (message.type === "ping") this.handler?.({ data: { type: "ready" } });
        },
      };
      constructor(...args: unknown[]) {
        constructed(...args);
      }
    }
    options.registry.primitives.source = { worklet: "source.js" };
    options.graph.nodes.source = { type: "source" };
    options.audioWorkletNodeCtor =
      Worklet as unknown as KlattRuntimeOptions["audioWorkletNodeCtor"];
    const runtime = await createKlattRuntime(options);
    expect(constructed).toHaveBeenCalledWith(
      options.audioContext,
      "source",
      expect.objectContaining({
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      }),
    );
    expect(diagnostics.getEntries()).toEqual([]);
    runtime.disconnect();
  });

  it("preserves allowed count/port defaults and applies a valid binding", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.connections = [["out", "out"]];
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    options.semantics.params = { volume: { type: "float", default: 0.5 } };
    const runtime = await createKlattRuntime(options);
    runtime.connectToDestination();
    expect(node.gain.value).toBe(0.5);
    expect(node.connect).toHaveBeenCalledTimes(2);
    expect(diagnostics.getEntries()).toEqual([]);
  });

  it("reports omitted unknown nodes and each dropped edge with endpoints", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.nodes.lost = { type: "unknown" };
    options.graph.connections = [
      ["lost", "out"],
      { from: "out", to: { node: "absent", param: "gain" } },
    ];
    const runtime = await createKlattRuntime(options);
    expect(runtime.getAllNodeIds()).toEqual(["out"]);
    expect(node.connect).not.toHaveBeenCalled();
    expect(diagnostics.getEntries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "runtime.node_omitted",
          level: "warn",
          data: expect.objectContaining({
            nodeId: "lost",
            primitive: "unknown",
            consequence: "node omitted",
          }),
        }),
        expect.objectContaining({
          code: "runtime.connection_dropped",
          data: expect.objectContaining({
            from: "lost",
            to: "out",
            consequence: "connection dropped",
          }),
        }),
        expect.objectContaining({
          code: "runtime.connection_dropped",
          data: expect.objectContaining({ to: { node: "absent", param: "gain" } }),
        }),
      ]),
    );
  });

  it("reports missing WASM without constructing the omitted worklet", async () => {
    const { options, diagnostics } = fixture();
    const ctor = vi.fn();
    options.audioWorkletNodeCtor = ctor as unknown as KlattRuntimeOptions["audioWorkletNodeCtor"];
    options.wasmModules = {};
    options.registry.primitives.source = { worklet: "source.js", wasm: "source.wasm" };
    options.graph.nodes.source = { type: "source" };
    const runtime = await createKlattRuntime(options);
    expect(runtime.getNode("source")).toBeUndefined();
    expect(ctor).not.toHaveBeenCalled();
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "runtime.node_omitted",
        data: expect.objectContaining({
          nodeId: "source",
          primitive: "source",
          wasm: "source.wasm",
          reason: "WASM module not loaded",
        }),
      }),
    );
  });

  it("reports absent destination AudioParams for edges and bindings", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.connections = [{ from: "out", to: { node: "out", param: "missing" } }];
    options.graph.nodes.out.params = { missing: { bind: "volume" } };
    options.semantics.params = { volume: { type: "float", default: 0.5 } };
    await createKlattRuntime(options);
    expect(node.connect).not.toHaveBeenCalled();
    expect(diagnostics.getEntries().map((e) => e.code)).toEqual([
      "runtime.connection_dropped",
      "runtime.binding_target_missing",
    ]);
  });

  it("retains the observed value for unresolved bindings and bounds repeated updates", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    const runtime = await createKlattRuntime(options);
    for (let i = 0; i < 300; i++) runtime.setInputs({ volume: "invalid" });
    expect(node.gain.value).toBe(1);
    expect(diagnostics.getEntries()).toHaveLength(1);
    expect(diagnostics.getEntries()[0]).toMatchObject({
      code: "runtime.binding_unresolved",
      level: "warn",
      data: {
        nodeId: "out",
        primitive: "gain",
        paramName: "gain",
        bindName: "volume",
        appliedValue: 1,
        consequence: "AudioParam unchanged",
      },
    });
    runtime.setInputs({ volume: 0.25 });
    expect(node.gain.value).toBe(0.25);
  });

  it.each([-1, 0.5, NaN, "missing", 1])("rejects invalid supplied port %s", async (port) => {
    const { options, diagnostics, node } = fixture();
    options.graph.connections = [{ from: { node: "out", port }, to: "out" }];
    await expect(createKlattRuntime(options)).rejects.toThrow(/port/i);
    expect(node.connect).not.toHaveBeenCalled();
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "runtime.invalid_port", level: "error" }),
    );
  });

  it.each([-1, 0.5, NaN])("rejects invalid supplied count %s", async (inputs) => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain.inputs = inputs;
    await expect(createKlattRuntime(options)).rejects.toThrow(/inputs/i);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "runtime.invalid_count", level: "error" }),
    );
  });

  it("reports missing graph outputs when destination connection is requested", async () => {
    const { options, diagnostics } = fixture();
    delete options.graph.outputs;
    const runtime = await createKlattRuntime(options);
    expect(() => runtime.connectToDestination()).toThrow(/outputs/);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "runtime.invalid_output", level: "error" }),
    );
  });

  it("resolves named ports and honors the graph output port", async () => {
    const { options, diagnostics, node } = fixture();
    options.registry.primitives.gain.outputs = 2;
    options.registry.primitives.gain.ports = { second: { direction: "out", index: 1 } };
    options.graph.outputs = [{ node: "out", port: "second" }];
    options.graph.connections = [{ from: { node: "out", port: "second" }, to: "out" }];
    const runtime = await createKlattRuntime(options);
    runtime.connectToDestination();
    expect(node.connect).toHaveBeenCalledWith(node, 1, 0);
    expect(node.connect).toHaveBeenCalledWith(options.audioContext.destination, 1);
    expect(diagnostics.getEntries()).toEqual([]);
  });

  it.each([{ direction: "out" as const }, { direction: "in" as const, index: 0 }])(
    "rejects incomplete or wrong-direction named ports",
    async (declaration) => {
      const { options, diagnostics } = fixture();
      options.registry.primitives.gain.ports = { named: declaration };
      options.graph.outputs = [{ node: "out", port: "named" }];
      await expect(createKlattRuntime(options)).rejects.toThrow(/port/);
      expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_port");
    },
  );

  it("rejects a missing required worklet declaration", async () => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain = { category: "wasm-worklet", wasm: "missing.wasm" };
    await expect(createKlattRuntime(options)).rejects.toThrow(/declaration/);
    expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_primitive");
  });

  it("reports WASM loader rejection with affected nodes", async () => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain = { worklet: "source.js", wasm: "source.wasm" };
    options.assetLoader = {
      resolveWorkletModule: (file) => file,
      loadWasmModule: vi.fn().mockRejectedValue(new Error("unavailable")),
    };
    await expect(createKlattRuntime(options)).rejects.toThrow(/unavailable/);
    expect(diagnostics.getEntries()[0]).toMatchObject({
      code: "runtime.wasm_load_failed",
      data: {
        nodes: [{ nodeId: "out", primitive: "gain", wasm: "source.wasm" }],
        consequence: "operation rejected",
      },
    });
  });

  it("reports host connection rejection and disconnects constructed nodes", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.connections = [["out", "out"]];
    node.connect.mockImplementation(() => {
      throw new Error("host port mismatch");
    });
    await expect(createKlattRuntime(options)).rejects.toThrow(/host port mismatch/);
    expect(node.disconnect).toHaveBeenCalledOnce();
    expect(diagnostics.getEntries()[0]).toMatchObject({
      code: "runtime.connection_failed",
      level: "error",
    });
  });

  it("reports missing worklet AudioParams without inventing a default", async () => {
    const { options, diagnostics } = fixture();
    options.audioContext.createGain = (() => ({
      parameters: new Map(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as AudioContext["createGain"];
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    options.graph.connections = [{ from: "out", to: { node: "out", param: "gain" } }];
    const runtime = await createKlattRuntime(options);
    expect(runtime.getDiagnostics()).toBe(diagnostics);
    expect(diagnostics.getEntries().map((e) => e.code)).toEqual([
      "runtime.connection_dropped",
      "runtime.binding_target_missing",
    ]);
    expect(diagnostics.getEntries()[1].data).not.toHaveProperty("appliedValue");
  });

  it("connects an existing destination AudioParam", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.connections = [{ from: "out", to: { node: "out", param: "gain" } }];
    await createKlattRuntime(options);
    expect(node.connect).toHaveBeenCalledWith(node.gain, 0);
    expect(diagnostics.getEntries()).toEqual([]);
  });

  it("rejects worklets with no inputs and no outputs", async () => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain = { worklet: "source.js", inputs: 0, outputs: 0 };
    await expect(createKlattRuntime(options)).rejects.toThrow(/inputs or outputs/);
    expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_count");
  });

  it("rejects invalid destination ports and ambiguous AudioParam ports", async () => {
    for (const to of [
      { node: "out", port: 1 },
      { node: "out", param: "gain", port: 0 },
    ]) {
      const { options, diagnostics } = fixture();
      options.graph.connections = [{ from: "out", to }];
      await expect(createKlattRuntime(options)).rejects.toThrow(/port/i);
      expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_port");
    }
  });

  it("rejects an omitted output node when connecting to destination", async () => {
    const { options, diagnostics } = fixture();
    options.graph.outputs = ["absent"];
    const runtime = await createKlattRuntime(options);
    expect(() => runtime.connectToDestination()).toThrow(/not found/);
    expect(diagnostics.getEntries()[0]).toMatchObject({
      code: "runtime.invalid_output",
      data: { nodeId: "absent" },
    });
  });

  it("retains nonfinite requested values and distinct affected binding contexts", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    options.graph.nodes.other = { type: "gain", params: { gain: { bind: "volume" } } };
    options.semantics.params = { volume: { type: "float", default: Infinity } };
    const runtime = await createKlattRuntime(options);
    runtime.setInputs({ volume: Infinity });
    expect(node.gain.value).toBe(1);
    expect(diagnostics.getEntries()).toHaveLength(2);
    expect(diagnostics.getEntries().map((e) => e.data)).toEqual([
      expect.objectContaining({ nodeId: "out", requestedValue: Infinity, appliedValue: 1 }),
      expect.objectContaining({ nodeId: "other", requestedValue: Infinity, appliedValue: 1 }),
    ]);
  });
});
