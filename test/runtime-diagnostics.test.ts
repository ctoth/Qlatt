import { describe, expect, it, vi } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import type { KlattRuntimeOptions } from "../src/klatt-runtime";
import { createProvenanceCollector } from "../src/provenance";
import { createPreparedRuntime, type RuntimeFixtureOptions } from "./runtime-fixture";

function fixture() {
  const diagnostics = createDiagnostics();
  const node = {
    gain: { value: 1 },
    numberOfInputs: 1,
    numberOfOutputs: 1,
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const options: RuntimeFixtureOptions = {
    diagnostics,
    audioContext: {
      createGain: () => node,
      destination: {},
      audioWorklet: { addModule: vi.fn() },
    } as unknown as AudioContext,
    graph: { bacon: "0.1", nodes: { out: { type: "gain" } }, outputs: ["out"] },
    registry: {
      bacon: "0.1",
      primitives: { gain: { native: "GainNode", params: { gain: { type: "float", default: 1 } } } },
    },
    semantics: { name: "test", params: {} },
  };
  return { options, diagnostics, node };
}

describe("runtime structural diagnostics", () => {
  it("reports declared range observations through the runtime collector", async () => {
    const { options, diagnostics } = fixture();
    options.semantics.params = {
      nasalCouplingArea: { default: 0, range: [0, 2.5], diagnoseRange: true },
    };
    const runtime = await createPreparedRuntime(options);
    runtime.setInputs({ nasalCouplingArea: 5 });
    expect(diagnostics.getEntries()).toEqual([
      expect.objectContaining({ code: "W_SEMANTICS_PARAM_RANGE" }),
    ]);
  });
  it("reports unsupported native bindings before construction", async () => {
    const { options, diagnostics, node } = fixture();
    options.registry.primitives.gain.native = "UnknownNode";
    await expect(createPreparedRuntime(options)).rejects.toThrow(/Unsupported native binding/);
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
      handler?: (event: { data: { type: string; message?: string; node?: string } }) => void;
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
    const runtime = await createPreparedRuntime(options);
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
    const source = runtime.getNode("source") as unknown as Worklet;
    source.handler?.({
      data: { type: "source-domain-projection", node: "source", message: "R++ domain projected" },
    });
    expect(diagnostics.getEntries()).toEqual([
      expect.objectContaining({
        level: "warn",
        code: "source-domain-projection",
        message: "R++ domain projected",
      }),
    ]);
    runtime.disconnect();
  });

  it("preserves allowed count/port defaults and applies a valid binding", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.connections = [["out", "out"]];
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    options.semantics.params = { volume: { type: "float", default: 0.5 } };
    const runtime = await createPreparedRuntime(options);
    runtime.connectToDestination();
    expect(node.gain.value).toBe(0.5);
    expect(node.connect).toHaveBeenCalledTimes(2);
    expect(diagnostics.getEntries()).toEqual([]);
  });

  it("rejects unknown nodes and edges before allocation", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.nodes.lost = { type: "unknown" };
    options.graph.connections = [["lost", "out"]];
    await expect(createPreparedRuntime(options)).rejects.toThrow(/unknown/);
    expect(node.connect).not.toHaveBeenCalled();
    expect(diagnostics.getEntries()[0].level).toBe("error");
  });

  it("reports missing WASM without constructing the omitted worklet", async () => {
    const { options, diagnostics } = fixture();
    const ctor = vi.fn();
    options.audioWorkletNodeCtor = ctor as unknown as KlattRuntimeOptions["audioWorkletNodeCtor"];
    options.wasmModules = {};
    options.registry.primitives.source = { worklet: "source.js", wasm: "source.wasm" };
    options.graph.nodes.source = { type: "source" };
    const runtime = await createPreparedRuntime(options);
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
    options.registry.primitives.gain.params!.missing = { type: "float", default: 1 };
    options.graph.nodes.out.params = { missing: { bind: "volume" } };
    options.semantics.params = { volume: { type: "float", default: 0.5 } };
    await createPreparedRuntime(options);
    expect(node.connect).not.toHaveBeenCalled();
    expect(diagnostics.getEntries().map((e) => e.code)).toEqual([
      "runtime.connection_dropped",
      "runtime.binding_target_missing",
    ]);
  });

  it("retains the observed value for unresolved bindings and bounds repeated updates", async () => {
    const { options, diagnostics, node } = fixture();
    options.semantics.params = { volume: { type: "float" } };
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    const runtime = await createPreparedRuntime(options);
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
    await expect(createPreparedRuntime(options)).rejects.toThrow(/port/i);
    expect(node.connect).not.toHaveBeenCalled();
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "runtime.invalid_port", level: "error" }),
    );
  });

  it.each([-1, 0.5, NaN])("rejects invalid supplied count %s", async (inputs) => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain.inputs = inputs;
    await expect(createPreparedRuntime(options)).rejects.toThrow(/inputs/i);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "runtime.invalid_count", level: "error" }),
    );
  });

  it("reports missing graph outputs when destination connection is requested", async () => {
    const { options, diagnostics } = fixture();
    delete options.graph.outputs;
    const runtime = await createPreparedRuntime(options);
    expect(() => runtime.connectToDestination()).toThrow(/outputs/);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "runtime.invalid_output", level: "error" }),
    );
  });

  it("resolves named ports and honors the graph output port", async () => {
    const { options, diagnostics, node } = fixture();
    options.provenance = createProvenanceCollector();
    options.graph.name = "named-ports";
    options.registry.primitives.gain.outputs = 2;
    options.registry.primitives.gain.ports = { second: { direction: "out", index: 1 } };
    options.graph.outputs = [{ node: "out", port: "second" }];
    options.graph.connections = [
      { from: { node: "out", port: "second" }, to: "out" },
      { from: { node: "out", port: 0 }, to: { node: "out", param: "gain" } },
    ];
    const runtime = await createPreparedRuntime(options);
    runtime.connectToDestination();
    expect(node.connect).toHaveBeenCalledWith(node, 1, 0);
    expect(node.connect).toHaveBeenCalledWith(node.gain, 0);
    expect(node.connect).toHaveBeenCalledWith(options.audioContext.destination, 1);
    const records = options.provenance.getDecisions();
    expect(records.map((record) => record.reason)).toEqual([
      "named-ports: connected out[1] -> out[0]; source: named port 'second' in primitive 'gain'; destination: omitted port defaults to 0",
      "named-ports: connected out[0] -> out.gain (AudioParam); source: explicit numeric port 0",
      "named-ports: connected out[1] -> audioContext.destination; source: named port 'second' in primitive 'gain'",
    ]);
    for (const record of records) {
      expect(record.stage).toBe("runtime");
      expect(record.type).toBe("connection_resolved");
      expect(record.citations).toEqual([
        "docs/host-contract.md: Runtime structural failures (graph ports and destinations)",
      ]);
      expect(record.timestampMs).toBeUndefined();
      expect(record.parents).toBeUndefined();
    }
    expect(diagnostics.getEntries()).toEqual([]);
  });

  it.each([{ direction: "out" as const }, { direction: "in" as const, index: 0 }])(
    "rejects incomplete or wrong-direction named ports",
    async (declaration) => {
      const { options, diagnostics } = fixture();
      options.registry.primitives.gain.ports = { named: declaration };
      options.graph.outputs = [{ node: "out", port: "named" }];
      await expect(createPreparedRuntime(options)).rejects.toThrow(/port/);
      expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_port");
    },
  );

  it("rejects a missing required worklet declaration", async () => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain = { category: "wasm-worklet", wasm: "missing.wasm" };
    await expect(createPreparedRuntime(options)).rejects.toThrow(/declaration/);
    expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_primitive");
  });

  it("reports WASM loader rejection with affected nodes", async () => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain = { worklet: "source.js", wasm: "source.wasm" };
    options.assetLoader = {
      resolveWorkletModule: (file) => file,
      loadWasmModule: vi.fn().mockRejectedValue(new Error("unavailable")),
    };
    await expect(createPreparedRuntime(options)).rejects.toThrow(/unavailable/);
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
    options.provenance = createProvenanceCollector();
    options.graph.connections = [["out", "out"]];
    node.connect.mockImplementation(() => {
      throw new Error("host port mismatch");
    });
    await expect(createPreparedRuntime(options)).rejects.toThrow(/host port mismatch/);
    expect(options.provenance.getDecisions()).toEqual([]);
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
    options.semantics.params = { volume: { type: "float" } };
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    options.graph.connections = [{ from: "out", to: { node: "out", param: "gain" } }];
    const runtime = await createPreparedRuntime(options);
    expect(runtime.getDiagnostics()).toBe(diagnostics);
    expect(diagnostics.getEntries().map((e) => e.code)).toEqual([
      "runtime.connection_dropped",
      "runtime.binding_target_missing",
    ]);
    expect(diagnostics.getEntries()[1].data).not.toHaveProperty("appliedValue");
  });

  it("connects an existing destination AudioParam", async () => {
    const { options, diagnostics, node } = fixture();
    options.provenance = createProvenanceCollector();
    options.graph.connections = [{ from: "out", to: { node: "out", param: "gain" } }];
    await createPreparedRuntime(options);
    expect(node.connect).toHaveBeenCalledWith(node.gain, 0);
    expect(options.provenance.getDecisions()).toHaveLength(1);
    expect(options.provenance.getDecisions()[0].reason).toBe(
      "unnamed graph: connected out[0] -> out.gain (AudioParam); source: omitted port defaults to 0",
    );
    expect(diagnostics.getEntries()).toEqual([]);
  });

  it("rejects worklets with no inputs and no outputs", async () => {
    const { options, diagnostics } = fixture();
    options.registry.primitives.gain = { worklet: "source.js", inputs: 0, outputs: 0 };
    await expect(createPreparedRuntime(options)).rejects.toThrow(/inputs or outputs/);
    expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_count");
  });

  it("rejects invalid destination ports and ambiguous AudioParam ports", async () => {
    for (const to of [
      { node: "out", port: 1 },
      { node: "out", param: "gain", port: 0 },
    ]) {
      const { options, diagnostics } = fixture();
      options.graph.connections = [{ from: "out", to }];
      await expect(createPreparedRuntime(options)).rejects.toThrow(/port/i);
      expect(diagnostics.getEntries()[0].code).toBe("runtime.invalid_port");
    }
  });

  it("rejects a missing output node during preparation", async () => {
    const { options, diagnostics } = fixture();
    options.graph.outputs = ["absent"];
    await expect(createPreparedRuntime(options)).rejects.toThrow(/absent/);
    expect(diagnostics.getEntries()[0].level).toBe("error");
  });

  it("retains nonfinite requested values and distinct affected binding contexts", async () => {
    const { options, diagnostics, node } = fixture();
    options.graph.nodes.out.params = { gain: { bind: "volume" } };
    options.graph.nodes.other = { type: "gain", params: { gain: { bind: "volume" } } };
    options.semantics.params = { volume: { type: "float", default: 0.5 } };
    const runtime = await createPreparedRuntime(options);
    runtime.setInputs({ volume: Infinity });
    expect(node.gain.value).toBe(0.5);
    expect(diagnostics.getEntries()).toHaveLength(2);
    expect(diagnostics.getEntries().map((e) => e.data)).toEqual([
      expect.objectContaining({ nodeId: "out", requestedValue: Infinity, appliedValue: 0.5 }),
      expect.objectContaining({ nodeId: "other", requestedValue: Infinity, appliedValue: 0.5 }),
    ]);
  });
});
