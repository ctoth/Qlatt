/**
 * Klatt Runtime - bridges Bacon graphs, semantics, and WebAudio
 *
 * This runtime is registry-driven: worklet and WASM paths are derived from
 * a registry.yaml file rather than being hardcoded.
 */

import { applyParamValue, getAudioParam } from "./audio-param-utils";
import { createDiagnostics, type Diagnostics } from "./diagnostics";
import { expandFormantBanks } from "./formant-bank";
import { createBrowserRuntimeAssetLoader } from "./runtime-assets/browser-loader";
import type { RuntimeAssetLoader } from "./runtime-assets/types";
import { createConfiguredEvaluator } from "./semantics/evaluator-factory";
import type { EvaluationContext, ParamValue, SemanticsDocument } from "./semantics/types";

// =============================================================================
// Registry Types
// =============================================================================

export interface RegistryPrimitive {
  description?: string;
  // Bacon format: use native/worklet/wasm to determine category
  native?: string; // e.g., "GainNode" - maps to webaudio
  worklet?: string; // e.g., "resonator-processor.js"
  wasm?: string; // e.g., "resonator.wasm" - if present with worklet, it's wasm-worklet
  // Legacy format support
  category?: "webaudio" | "wasm-worklet" | "js-worklet";
  params?: Record<
    string,
    {
      type: string;
      default?: number;
      unit?: string;
      description?: string;
    }
  >;
  // Legacy alias
  parameters?: Record<
    string,
    {
      type: string;
      default?: number;
      unit?: string;
      description?: string;
    }
  >;
  options?: Record<
    string,
    {
      type: string;
      default?: boolean | number | string;
      description?: string;
    }
  >;
  inputs?: number;
  outputs?: number;
  ports?: Record<string, { direction?: "in" | "out"; index?: number }>;
}

export interface Registry {
  bacon?: string; // Bacon format version
  version?: string; // Legacy format version
  primitives: Record<string, RegistryPrimitive>;
}

/**
 * Infer category from bacon-style fields
 */
function getPrimitiveCategory(
  primitive: RegistryPrimitive,
): "webaudio" | "wasm-worklet" | "js-worklet" | null {
  // Explicit category takes precedence (legacy support)
  if (primitive.category) {
    return primitive.category;
  }
  // Bacon format: infer from fields
  if (primitive.native) {
    return "webaudio";
  }
  if (primitive.worklet && primitive.wasm) {
    return "wasm-worklet";
  }
  if (primitive.worklet) {
    return "js-worklet";
  }
  return null;
}

// =============================================================================
// Registry-driven Helper Functions
// =============================================================================

/**
 * Extract unique worklet module paths from registry
 */
function getWorkletModules(registry: Registry): string[] {
  const worklets = new Set<string>();
  for (const primitive of Object.values(registry.primitives)) {
    if (primitive.worklet) {
      worklets.add(primitive.worklet);
    }
  }
  return Array.from(worklets);
}

/**
 * Extract unique WASM module paths from registry
 */
function getWasmModules(registry: Registry): string[] {
  const wasmFiles = new Set<string>();
  for (const primitive of Object.values(registry.primitives)) {
    if (primitive.wasm) {
      wasmFiles.add(primitive.wasm);
    }
  }
  return Array.from(wasmFiles);
}

/**
 * Load all WASM modules specified in registry
 */
export async function loadWasmModules(
  registry: Registry,
  assetLoader: RuntimeAssetLoader,
  log: (msg: string) => void = () => {},
): Promise<Record<string, ArrayBuffer>> {
  const wasmFiles = getWasmModules(registry);

  if (wasmFiles.length === 0) {
    log("No WASM modules to load");
    return {};
  }

  log(`Loading ${wasmFiles.length} WASM modules`);

  const modules: Record<string, ArrayBuffer> = {};
  await Promise.all(
    wasmFiles.map(async (file) => {
      const key = file.replace(".wasm", "");
      modules[key] = await assetLoader.loadWasmModule(file);
      log(`  Loaded ${file} (${modules[key].byteLength} bytes)`);
    }),
  );

  return modules;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

/**
 * Register all worklet processors specified in registry with the AudioContext
 */
export async function registerWorklets(
  ctx: AudioContext,
  registry: Registry,
  assetLoader: RuntimeAssetLoader,
  log: (msg: string) => void = () => {},
): Promise<void> {
  const worklets = getWorkletModules(registry);

  if (worklets.length === 0) {
    log("No worklet modules to register");
    return;
  }

  log(`Registering ${worklets.length} worklet modules`);

  await Promise.all(
    worklets.map(async (file) => {
      const moduleUrl = assetLoader.resolveWorkletModule(file);
      log(`  Registering ${file} from ${moduleUrl}...`);
      try {
        await ctx.audioWorklet.addModule(moduleUrl);
      } catch (error) {
        throw new Error(
          `Unable to register worklet module '${file}' from '${moduleUrl}': ${formatError(error)}`,
        );
      }
      log(`  Registered ${file}`);
    }),
  );
}

export type AudioWorkletNodeConstructor = {
  new (
    context: BaseAudioContext,
    name: string,
    options?: AudioWorkletNodeOptions,
  ): AudioWorkletNode;
  prototype: AudioWorkletNode;
};

type InstanceConstructor = abstract new (...args: never[]) => object;

export function isAudioWorkletNode(
  node: object,
  audioWorkletNodeCtor: InstanceConstructor | undefined,
): node is AudioWorkletNode {
  return audioWorkletNodeCtor !== undefined && node instanceof audioWorkletNodeCtor;
}

/**
 * Wait for all worklet nodes to be ready
 */
async function awaitWorkletReady(
  nodes: Map<string, AudioNode>,
  audioWorkletNodeCtor: AudioWorkletNodeConstructor | undefined,
  timeoutMs = 2000,
  log: (msg: string) => void = () => {},
): Promise<void> {
  const workletNodes: Array<[string, AudioWorkletNode]> = [];
  for (const [id, node] of nodes.entries()) {
    if (isAudioWorkletNode(node, audioWorkletNodeCtor)) {
      workletNodes.push([id, node]);
    }
  }

  if (workletNodes.length === 0) {
    log("No worklet nodes to await");
    return;
  }

  log(`Waiting for ${workletNodes.length} worklets to be ready`);

  const failures = await Promise.all(
    workletNodes.map(async ([id, node]) => {
      try {
        await waitForNodeReady(node, timeoutMs, log);
        log(`  ${id} ready`);
        return null;
      } catch (err) {
        const message = `${id} - ${err instanceof Error ? err.message : String(err)}`;
        log(`  Error: ${message}`);
        return message;
      }
    }),
  );

  const failed = failures.filter((message): message is string => message !== null);
  if (failed.length > 0) {
    for (const [, node] of workletNodes) {
      node.port.postMessage({ type: "dispose" });
      node.port.close();
      node.disconnect();
    }
    throw new Error(`Failed to initialize ${failed.length} worklet(s): ${failed.join("; ")}`);
  }
}

/**
 * Wait for a single worklet node to signal ready.
 * Rejects on timeout so callers can detect worklet initialization failure.
 * Cleans up the message handler on both success and timeout paths.
 */
export function waitForNodeReady(
  node: AudioWorkletNode,
  timeoutMs: number,
  log: (msg: string) => void = () => {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "__qlatt_process_error__") {
        log(
          `  Process error from ${event.data?.node ?? "unknown"}: ${event.data?.error ?? "unknown error"}`,
        );
        return;
      }
      if (event.data?.type !== "ready") return;
      done = true;
      node.port.removeEventListener("message", handler);
      resolve();
    };
    node.port.addEventListener("message", handler);
    node.port.start();
    node.port.postMessage({ type: "ping" });
    setTimeout(() => {
      if (!done) {
        node.port.removeEventListener("message", handler);
        reject(new Error(`Worklet timed out waiting for ready after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });
}

// Bacon graph types (simplified - Bacon package has full types)
export interface BaconGraph {
  bacon: string;
  name?: string;
  // Qlatt extension data (e.g. formantBanks) lives here, per Bacon IR
  meta?: Record<string, unknown>;
  nodes: Record<string, BaconNode>;
  connections?: BaconConnection[];
  outputs?: PortRef[];
}

export interface BaconNode {
  type: string;
  params?: Record<string, ParamValueSpec>;
  options?: Record<string, unknown>;
}

export type ParamValueSpec = number | string | boolean | { bind: string } | { expr: string };

// Port reference can be a string (node ID) or object with node/port
// Optional 'param' field enables audioNode.connect(audioParam) connections
// — used by Stevens (1991) aerodynamic model to drive gain/bandwidth AudioParams
export type PortRef = string | { node: string; port?: number | string; param?: string };

export type BaconConnection = [string, string] | { from: PortRef; to: PortRef };

/**
 * Extract node ID from a port reference
 */
function getNodeId(ref: PortRef): string {
  return typeof ref === "string" ? ref : ref.node;
}

// Runtime options
export interface KlattRuntimeOptions {
  audioContext: AudioContext;
  semantics: SemanticsDocument;
  graph: BaconGraph;
  registry: Registry; // Registry defining primitives (required)
  workletBasePath?: string; // Base path for worklet JS files, defaults to '/worklets/'
  assetLoader?: RuntimeAssetLoader; // Host-specific worklet and WASM loader
  audioWorkletNodeCtor?: AudioWorkletNodeConstructor; // Host-specific AudioWorkletNode constructor
  workletProcessorOptionsByNodeId?: Record<string, Record<string, unknown>>; // Generic per-node worklet processor option overrides
  wasmModules?: Record<string, ArrayBuffer>; // Pre-loaded WASM modules (optional)
  logger?: (msg: string) => void; // Optional logging callback
  telemetry?: boolean; // Enable worklet debug metrics (default: false)
  telemetryHandler?: (data: unknown) => void; // Callback for worklet telemetry messages
  diagnostics?: Diagnostics;
}

// Binding information for interpreter use
export interface BindingSpec {
  nodeId: string;
  paramName: string;
  bindName: string;
}

// Runtime instance
export interface KlattRuntime {
  getDiagnostics(): Diagnostics;
  // Get current realized values
  getRealizedValues(): Record<string, ParamValue>;

  // Update input parameters and re-evaluate semantics
  setInputs(inputs: Record<string, ParamValue>): void;

  // Get an audio node by ID
  getNode(id: string): AudioNode | undefined;

  // Get all node IDs
  getAllNodeIds(): string[];

  // Get the AudioContext
  getAudioContext(): AudioContext;

  // Connect to destination
  connectToDestination(): void;

  // Disconnect all
  disconnect(): void;

  // Get binding map (semantic name -> list of node/param targets)
  // Allows interpreter to reuse binding discovery
  getBindingMap(): Map<string, BindingSpec[]>;
}

/**
 * Create a Klatt runtime instance (async to support worklet loading)
 */
export async function createKlattRuntime(options: KlattRuntimeOptions): Promise<KlattRuntime> {
  const {
    audioContext,
    semantics,
    graph,
    registry,
    workletBasePath = `${
      (typeof import.meta !== "undefined" && import.meta.env.BASE_URL) || "/"
    }worklets/`,
    assetLoader = createBrowserRuntimeAssetLoader(workletBasePath),
    audioWorkletNodeCtor = typeof AudioWorkletNode !== "undefined" ? AudioWorkletNode : undefined,
    workletProcessorOptionsByNodeId = {},
    logger = () => {},
    telemetry = false,
    telemetryHandler,
    diagnostics = createDiagnostics(),
  } = options;

  function fail(code: string, message: string, data: Record<string, unknown>): never {
    diagnostics.error(message, { ...data, consequence: "operation rejected" }, code);
    throw new Error(message);
  }

  // A binding may fail on every frame. Report its first failure once per runtime,
  // retaining the affected target and observed value without filling the buffer.
  const reportedBindings = new Set<string>();
  function warnBinding(
    code: string,
    nodeId: string,
    paramName: string,
    data: Record<string, unknown>,
  ): void {
    const key = JSON.stringify([code, nodeId, paramName]);
    if (reportedBindings.has(key)) return;
    reportedBindings.add(key);
    diagnostics.warn(
      `Parameter ${nodeId}.${paramName}: ${String(data.consequence)}`,
      { ...data, affectedCount: 1 },
      code,
    );
  }

  if (!registry) {
    throw new Error("Registry is required for createKlattRuntime");
  }

  // Validate graph param specs — reject { expr: "..." } at load time
  // Inline expressions are not supported; use realize rules in semantics.yaml.
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (!nodeDef.params) continue;
    for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
      if (typeof paramSpec === "object" && paramSpec !== null && "expr" in paramSpec) {
        throw new Error(
          `Inline expressions ({ expr: ... }) are not supported in graph param specs. ` +
            `Use a realize rule in semantics.yaml instead. ` +
            `Found on node '${nodeId}', param '${paramName}'`,
        );
      }
    }
  }

  // Expand formant bank declarations into concrete nodes, connections, and rules.
  // Must happen before node/WASM detection, defaults init, and binding-map build.
  expandFormantBanks(graph, semantics);

  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    const primitive = registry.primitives[nodeDef.type];
    if (!primitive) continue;
    for (const field of ["inputs", "outputs"] as const) {
      const count = primitive[field];
      if (count !== undefined && (!Number.isInteger(count) || count < 0)) {
        fail("runtime.invalid_count", `Invalid ${field} count for '${nodeId}'`, {
          nodeId,
          primitive: nodeDef.type,
          field,
          requestedValue: count,
        });
      }
    }
    const category = getPrimitiveCategory(primitive);
    if (
      (category === "js-worklet" || category === "wasm-worklet") &&
      primitive.inputs === 0 &&
      primitive.outputs === 0
    ) {
      fail("runtime.invalid_count", `Worklet '${nodeId}' must have inputs or outputs`, {
        nodeId,
        primitive: nodeDef.type,
        inputs: 0,
        outputs: 0,
      });
    }
    if (
      (category === "js-worklet" || category === "wasm-worklet") &&
      (!primitive.worklet || (category === "wasm-worklet" && !primitive.wasm))
    ) {
      fail(
        "runtime.invalid_primitive",
        `Missing required worklet/WASM declaration for '${nodeId}'`,
        {
          nodeId,
          primitive: nodeDef.type,
          category,
        },
      );
    }
  }

  // Bacon registry counts default to one; named ports require an explicit
  // direction and index. See ../bacon/schemas/registry.schema.json.
  function portIndex(ref: PortRef, direction: "in" | "out"): number {
    const nodeId = getNodeId(ref);
    const nodeDef = graph.nodes[nodeId];
    const primitive = nodeDef && registry.primitives[nodeDef.type];
    const requested = typeof ref === "string" ? undefined : ref.port;
    const named = typeof requested === "string" ? primitive?.ports?.[requested] : undefined;
    const index =
      typeof requested === "string" ? named?.index : requested === undefined ? 0 : requested;
    const count = primitive?.[direction === "in" ? "inputs" : "outputs"] ?? 1;
    if (
      index === undefined ||
      !Number.isInteger(index) ||
      index < 0 ||
      (primitive && index >= count) ||
      (typeof requested === "string" && named?.direction !== direction)
    ) {
      fail("runtime.invalid_port", `Invalid ${direction} port on '${nodeId}'`, {
        nodeId,
        primitive: nodeDef?.type,
        direction,
        requestedValue: requested,
        count,
      });
    }
    return index;
  }
  for (const connection of graph.connections ?? []) {
    const [from, to] = Array.isArray(connection) ? connection : [connection.from, connection.to];
    portIndex(from, "out");
    if (typeof to === "string" || to.param === undefined) portIndex(to, "in");
    else if (to.port !== undefined) {
      fail("runtime.invalid_port", "AudioParam destination cannot also declare a port", {
        from,
        to,
      });
    }
  }
  for (const output of graph.outputs ?? []) portIndex(output, "out");

  // Create prefixed logger
  const log = (msg: string) => logger(`[klatt-runtime] ${msg}`);

  log("Initializing Klatt runtime");
  log(`Graph has ${Object.keys(graph.nodes).length} nodes`);
  log(`Registry has ${Object.keys(registry.primitives).length} primitives`);

  // Reject unsupported native bindings before loading assets or creating nodes.
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    const primitive = registry.primitives[nodeDef.type];
    if (primitive && getPrimitiveCategory(primitive) === "webaudio") {
      try {
        getNativeNodeConstructor(primitive.native, nodeDef.type, log);
      } catch (error) {
        fail("runtime.invalid_primitive", formatError(error), {
          nodeId,
          primitive: nodeDef.type,
          native: primitive.native,
        });
      }
    }
  }

  // Determine which WASM modules are needed based on graph nodes and registry
  const needsWasm = Object.values(graph.nodes).some((n) => {
    const primitive = registry.primitives[n.type];
    return primitive && getPrimitiveCategory(primitive) === "wasm-worklet" && primitive.wasm;
  });

  // Load WASM if not provided and needed
  let wasmModules = options.wasmModules;
  if (!wasmModules && needsWasm) {
    try {
      wasmModules = await loadWasmModules(registry, assetLoader, log);
    } catch (error) {
      fail("runtime.wasm_load_failed", `WASM loading failed: ${formatError(error)}`, {
        nodes: Object.entries(graph.nodes)
          .filter(([, node]) => registry.primitives[node.type]?.wasm)
          .map(([nodeId, node]) => ({
            nodeId,
            primitive: node.type,
            wasm: registry.primitives[node.type].wasm,
          })),
      });
    }
  }

  // Determine which worklets are needed based on graph nodes and registry
  const needsWorklets = Object.values(graph.nodes).some((n) => {
    const primitive = registry.primitives[n.type];
    return primitive?.worklet !== undefined;
  });

  // Register worklets if needed
  if (needsWorklets) {
    if (!audioWorkletNodeCtor) {
      throw new Error("AudioWorkletNode constructor is required when the graph uses worklets");
    }
    await registerWorklets(audioContext, registry, assetLoader, log);
  }

  // Create CEL + topological evaluator pair with all standard builtins
  const { topoEvaluator } = createConfiguredEvaluator();

  // Current input values
  const currentInputs: Record<string, ParamValue> = {};

  // Current realized values (result of semantics evaluation)
  let realizedValues: Record<string, ParamValue> = {};

  // Names of realize rules that errored in the last evaluation
  let lastEvaluationErrorNames: Set<string> = new Set();

  // Audio nodes created from graph
  const nodes = new Map<string, AudioNode>();

  // Initialize from semantics defaults
  if (semantics.params) {
    for (const [name, def] of Object.entries(semantics.params)) {
      if (def.default !== undefined) {
        currentInputs[name] = def.default;
      }
    }
  }

  // Build evaluation context
  function buildContext(): EvaluationContext {
    return {
      diagnostics,
      params: { ...currentInputs },
      constants: semantics.constants ?? {},
    };
  }

  // Evaluate semantics
  function evaluate(): void {
    // Build context - functions are registered with CEL evaluator separately
    const context = buildContext();
    const result = topoEvaluator.evaluate(semantics, context);
    realizedValues = result.values;

    // Track which realize rules errored
    lastEvaluationErrorNames = new Set<string>();

    if (result.errors.length > 0) {
      // Route errors through the runtime's log callback so callers can see them
      for (const err of result.errors) {
        lastEvaluationErrorNames.add(err.name);
        log(`Semantics evaluation error: ${err.name}: ${err.error}`);
      }
    }
  }

  // Create audio nodes from graph
  function createNodes(): void {
    log("Creating audio nodes");
    const orderedNodes = Object.entries(graph.nodes).sort(([, left], [, right]) => {
      const leftPrimitive = registry.primitives[left.type];
      const rightPrimitive = registry.primitives[right.type];
      const leftPriority = leftPrimitive?.worklet ? 0 : 1;
      const rightPriority = rightPrimitive?.worklet ? 0 : 1;
      return leftPriority - rightPriority;
    });
    for (const [id, nodeDef] of orderedNodes) {
      const node = createAudioNode(
        audioContext,
        nodeDef.type,
        id,
        nodeDef,
        registry,
        wasmModules,
        audioWorkletNodeCtor,
        workletProcessorOptionsByNodeId[id],
        log,
        telemetry,
      );
      if (node) {
        nodes.set(id, node);
      } else {
        const primitive = registry.primitives[nodeDef.type];
        diagnostics.warn(
          `Node '${id}' omitted`,
          {
            nodeId: id,
            primitive: nodeDef.type,
            wasm: primitive?.wasm,
            reason:
              primitive?.wasm && !wasmModules?.[primitive.wasm.replace(".wasm", "")]
                ? "WASM module not loaded"
                : "unsupported primitive",
            consequence: "node omitted",
          },
          "runtime.node_omitted",
        );
      }
    }
    log(`Created ${nodes.size} nodes`);
  }

  // Apply realized values to nodes
  function applyValues(): void {
    // Detect bound params whose realize rules errored — these are using
    // the param-seeded fallback value instead of the intended derived value
    const affectedBindings: string[] = [];

    for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
      const node = nodes.get(nodeId);
      if (!nodeDef.params) continue;

      for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
        // Check if this binding references a failed realize rule
        if (typeof paramSpec === "object" && paramSpec !== null && "bind" in paramSpec) {
          const bindName = (paramSpec as { bind: string }).bind;
          if (lastEvaluationErrorNames.has(bindName)) {
            affectedBindings.push(bindName);
          }
        }

        const value = resolveParamValue(paramSpec, realizedValues, currentInputs);
        const param = node ? getAudioParam(node, paramName) : null;
        const context = {
          nodeId,
          primitive: nodeDef.type,
          paramName,
          bindName:
            typeof paramSpec === "object" && "bind" in paramSpec ? paramSpec.bind : undefined,
          requestedValue: value,
        };
        if (!param) {
          warnBinding("runtime.binding_target_missing", nodeId, paramName, {
            ...context,
            consequence: "parameter write omitted",
            reason: node ? "AudioParam missing" : "node missing",
          });
        } else if (typeof value === "number" && Number.isFinite(value) && node) {
          applyParamValue(node, paramName, value);
        } else {
          warnBinding("runtime.binding_unresolved", nodeId, paramName, {
            ...context,
            appliedValue: Number.isFinite(param.value) ? param.value : undefined,
            consequence: "AudioParam unchanged",
          });
        }
      }
    }

    // Log a single summary line for bindings affected by failed realize rules
    if (affectedBindings.length > 0) {
      const unique = [...new Set(affectedBindings)];
      log(
        `Semantics fallthrough for: ${unique.join(", ")} (realize rule failed, using raw input values)`,
      );
    }
  }

  // Wire up connections
  function connectNodes(): void {
    if (!graph.connections) {
      log("No connections to wire");
      return;
    }

    log("Connecting audio graph");
    for (const conn of graph.connections) {
      // Extract from/to refs
      const [fromRef, toRef]: [PortRef, PortRef] = Array.isArray(conn)
        ? conn
        : [conn.from, conn.to];

      const fromId = getNodeId(fromRef);
      const toId = getNodeId(toRef);
      const fromPort = portIndex(fromRef, "out");
      const toPort =
        typeof toRef === "object" && toRef.param !== undefined ? 0 : portIndex(toRef, "in");

      const fromNode = nodes.get(fromId);
      const toNode = nodes.get(toId);

      // Check if target specifies an AudioParam connection
      // — Stevens & Bickley (1991): aerodynamic model outputs connect to
      //   gain/bandwidth AudioParams additively (WebAudio additive semantics)
      const toParamName = typeof toRef === "object" && toRef !== null ? toRef.param : undefined;

      const targetParam =
        toNode && toParamName !== undefined ? getAudioParam(toNode, toParamName) : null;
      if (!fromNode || !toNode || (toParamName !== undefined && !targetParam)) {
        diagnostics.warn(
          `Connection ${fromId} -> ${toId} dropped`,
          {
            from: fromRef,
            to: toRef,
            fromPrimitive: graph.nodes[fromId]?.type,
            toPrimitive: graph.nodes[toId]?.type,
            fromPort,
            toPort: toParamName === undefined ? toPort : undefined,
            reason: !fromNode || !toNode ? "node missing" : "destination AudioParam missing",
            consequence: "connection dropped",
          },
          "runtime.connection_dropped",
        );
        continue;
      }

      try {
        if (toParamName !== undefined && targetParam) {
          fromNode.connect(targetParam, fromPort);
          log(`  Connected ${fromId}[${fromPort}] -> ${toId}.${toParamName} (AudioParam)`);
        } else {
          fromNode.connect(toNode, fromPort, toPort);
          log(`  Connected ${fromId}[${fromPort}] -> ${toId}[${toPort}]`);
        }
      } catch (error) {
        fail(
          "runtime.connection_failed",
          `Connection ${fromId} -> ${toId} failed: ${formatError(error)}`,
          {
            from: fromRef,
            to: toRef,
            fromPrimitive: graph.nodes[fromId]?.type,
            toPrimitive: graph.nodes[toId]?.type,
            fromPort,
            toPort,
          },
        );
      }
    }
  }

  // Build binding map (semantic name -> node/param targets)
  // This is exposed via getBindingMap() for interpreter to reuse
  const bindingMap = new Map<string, BindingSpec[]>();
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (!nodeDef.params) continue;
    for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
      if (typeof paramSpec === "object" && paramSpec !== null && "bind" in paramSpec) {
        const bindName = (paramSpec as { bind: string }).bind;
        const existing = bindingMap.get(bindName) ?? [];
        existing.push({ nodeId, paramName, bindName });
        bindingMap.set(bindName, existing);
      }
    }
  }

  // Initialize
  log("Evaluating semantics");
  evaluate();
  createNodes();
  log(`Created nodes: ${Array.from(nodes.keys()).join(", ")}`);
  log(`Built ${bindingMap.size} unique bindings`);
  try {
    connectNodes();
  } catch (error) {
    for (const node of nodes.values()) {
      if (isAudioWorkletNode(node, audioWorkletNodeCtor)) {
        node.port.postMessage({ type: "dispose" });
        node.port.close();
      }
      node.disconnect();
    }
    throw error;
  }
  log(`Total connections: ${graph.connections?.length ?? 0}`);

  // Wait for worklets to be ready before applying values
  await awaitWorkletReady(nodes, audioWorkletNodeCtor, 2000, log);

  log("Applying realized values to nodes");
  applyValues();

  // Domain observations must reach diagnostics even when telemetry is disabled.
  for (const [, node] of nodes) {
    if (!isAudioWorkletNode(node, audioWorkletNodeCtor)) continue;
    node.port.addEventListener("message", (event: MessageEvent) => {
      if (event.data?.type === "source-domain-projection") {
        diagnostics.warn(event.data.message, { node: event.data.node }, "source-domain-projection");
      }
    });
    node.port.start();
  }

  // Attach telemetry port listeners if handler provided.
  if (telemetryHandler) {
    let attached = 0;
    for (const [, node] of nodes) {
      if (!isAudioWorkletNode(node, audioWorkletNodeCtor)) continue;

      node.port.addEventListener("message", (event: MessageEvent) => {
        const data = event.data;
        if (data && typeof data === "object") {
          telemetryHandler(data);
        }
      });

      // Ensure port is started
      if (typeof node.port.start === "function") {
        try {
          node.port.start();
        } catch {
          // Port may already be started
        }
      }
      attached++;
    }
    log(`Attached telemetry listeners to ${attached} worklet nodes`);
  }

  log("Klatt runtime initialized successfully");

  return {
    getDiagnostics(): Diagnostics {
      return diagnostics;
    },
    getRealizedValues(): Record<string, ParamValue> {
      return { ...realizedValues };
    },

    setInputs(inputs: Record<string, ParamValue>): void {
      log(`Setting inputs: ${Object.keys(inputs).join(", ")}`);
      Object.assign(currentInputs, inputs);
      evaluate();
      applyValues();
    },

    getNode(id: string): AudioNode | undefined {
      return nodes.get(id);
    },

    getAllNodeIds(): string[] {
      return Array.from(nodes.keys());
    },

    getAudioContext(): AudioContext {
      return audioContext;
    },

    connectToDestination(): void {
      // Graph spec is authoritative — no fallback guessing
      if (!graph.outputs || graph.outputs.length === 0) {
        fail(
          "runtime.invalid_output",
          'Graph definition missing "outputs" field — cannot connect to destination',
          { outputs: graph.outputs },
        );
      }
      const outputRef = graph.outputs[0];
      const nodeId = typeof outputRef === "string" ? outputRef : outputRef.node;
      const outputNode = nodes.get(nodeId);
      if (!outputNode) {
        fail(
          "runtime.invalid_output",
          `Output node "${nodeId}" specified in graph.outputs not found in created nodes`,
          { nodeId, primitive: graph.nodes[nodeId]?.type, output: outputRef },
        );
      }
      log(`Connecting ${nodeId} to destination`);
      outputNode.connect(audioContext.destination, portIndex(outputRef, "out"));
    },

    disconnect(): void {
      for (const node of nodes.values()) {
        if (isAudioWorkletNode(node, audioWorkletNodeCtor)) {
          node.port.postMessage({ type: "dispose" });
          node.port.close();
        }
        node.disconnect();
      }
    },

    getBindingMap(): Map<string, BindingSpec[]> {
      return bindingMap;
    },
  };
}

// Helper: Create audio node by type (registry-driven)
function createAudioNode(
  ctx: AudioContext,
  type: string,
  id: string,
  nodeDef: BaconNode,
  registry: Registry,
  wasmModules: Record<string, ArrayBuffer> | undefined,
  audioWorkletNodeCtor: AudioWorkletNodeConstructor | undefined,
  processorOptionOverrides: Record<string, unknown> | undefined,
  log: (msg: string) => void,
  telemetry: boolean,
): AudioNode | null {
  const primitive = registry.primitives[type];

  if (!primitive) {
    log(`Warning: Unknown node type '${type}' - not in registry`);
    return null;
  }

  const category = getPrimitiveCategory(primitive);
  log(`  Creating node '${id}' of type '${type}' (${category})`);

  // Merge node options with processor options
  const nodeOptions = nodeDef.options ?? {};

  switch (category) {
    case "webaudio":
      return getNativeNodeConstructor(primitive.native, type, log)(ctx);

    case "wasm-worklet":
      return createWasmWorkletNode(
        ctx,
        id,
        primitive,
        nodeOptions,
        wasmModules,
        audioWorkletNodeCtor,
        processorOptionOverrides,
        log,
        telemetry,
      );

    case "js-worklet":
      return createJsWorkletNode(
        ctx,
        id,
        primitive,
        nodeOptions,
        audioWorkletNodeCtor,
        processorOptionOverrides,
        log,
        telemetry,
      );

    default:
      log(`Warning: Unknown category '${category}' for type '${type}'`);
      return null;
  }
}

// Supported native bindings conform to docs/host-contract.md section 3.
const NATIVE_NODE_CONSTRUCTORS = new Map<string, (ctx: AudioContext) => AudioNode>([
  ["GainNode", (ctx) => ctx.createGain()],
  [
    "ConstantSourceNode",
    (ctx) => {
      const source = ctx.createConstantSource();
      source.start();
      return source;
    },
  ],
]);

function getNativeNodeConstructor(
  native: string | undefined,
  type: string,
  log: (msg: string) => void,
): (ctx: AudioContext) => AudioNode {
  const construct = native === undefined ? undefined : NATIVE_NODE_CONSTRUCTORS.get(native);
  if (!construct) {
    const message = `Unsupported native binding '${native}' for primitive '${type}'`;
    log(`Error: ${message}`);
    throw new Error(message);
  }
  return construct;
}

// Engineering estimate: emit telemetry every 40 render quanta to limit reporting overhead.
const WORKLET_REPORT_INTERVAL = 40;

// Helper: Create WASM-backed worklet node
function createWasmWorkletNode(
  ctx: AudioContext,
  id: string,
  primitive: RegistryPrimitive,
  nodeOptions: Record<string, unknown>,
  wasmModules: Record<string, ArrayBuffer> | undefined,
  audioWorkletNodeCtor: AudioWorkletNodeConstructor | undefined,
  processorOptionOverrides: Record<string, unknown> | undefined,
  log: (msg: string) => void,
  telemetry: boolean,
): AudioWorkletNode | null {
  const processorName = primitive.worklet!.replace(".js", "");
  const wasmKey = primitive.wasm!.replace(".wasm", "");
  const wasmBytes = wasmModules?.[wasmKey];
  const outputCount = primitive.outputs ?? 1;

  if (!wasmBytes) {
    log(`Error: WASM module '${wasmKey}' not loaded for node '${id}'`);
    return null; // Don't create broken node
  }

  if (!audioWorkletNodeCtor) {
    throw new Error(`AudioWorkletNode constructor unavailable for worklet node '${id}'`);
  }

  const node = new audioWorkletNodeCtor(ctx, processorName, {
    numberOfInputs: primitive.inputs ?? 1,
    numberOfOutputs: outputCount,
    outputChannelCount: Array.from({ length: outputCount }, () => 1),
    processorOptions: {
      wasmBytes,
      nodeId: id,
      debug: telemetry, // Enable metrics emission when telemetry requested
      reportInterval: WORKLET_REPORT_INTERVAL,
      ...nodeOptions, // Pass node options to processor
      ...processorOptionOverrides,
    },
  });
  logAudioWorkletIdentity(node, id, log);
  return node;
}

// Helper: Create JavaScript worklet node
function createJsWorkletNode(
  ctx: AudioContext,
  id: string,
  primitive: RegistryPrimitive,
  nodeOptions: Record<string, unknown>,
  audioWorkletNodeCtor: AudioWorkletNodeConstructor | undefined,
  processorOptionOverrides: Record<string, unknown> | undefined,
  log: (msg: string) => void,
  telemetry: boolean,
): AudioWorkletNode {
  const processorName = primitive.worklet!.replace(".js", "");
  const outputCount = primitive.outputs ?? 1;

  if (!audioWorkletNodeCtor) {
    throw new Error(`AudioWorkletNode constructor unavailable for worklet node '${id}'`);
  }

  const node = new audioWorkletNodeCtor(ctx, processorName, {
    numberOfInputs: primitive.inputs ?? 1,
    numberOfOutputs: outputCount,
    outputChannelCount: Array.from({ length: outputCount }, () => 1),
    processorOptions: {
      nodeId: id,
      debug: telemetry, // Enable metrics emission when telemetry requested
      reportInterval: WORKLET_REPORT_INTERVAL,
      ...nodeOptions, // Pass node options to processor
      ...processorOptionOverrides,
    },
  });
  logAudioWorkletIdentity(node, id, log);
  return node;
}

function logAudioWorkletIdentity(
  node: AudioWorkletNode,
  nodeId: string,
  log: (msg: string) => void,
): void {
  try {
    const internalSymbol = Object.getOwnPropertySymbols(node).find(
      (entry) => entry.description === "node-web-audio-api:napi-obj",
    );
    if (!internalSymbol) return;
    const raw = (node as unknown as Record<symbol, unknown>)[internalSymbol] as
      | { id?: unknown }
      | undefined;
    if (raw && raw.id !== undefined) {
      log(`    Worklet '${nodeId}' native id=${String(raw.id)}`);
    }
  } catch {
    // Ignore introspection failures outside Node.
  }
}

// Helper: Resolve param value from spec
function resolveParamValue(
  spec: ParamValueSpec,
  realized: Record<string, ParamValue>,
  inputs: Record<string, ParamValue>,
): ParamValue | undefined {
  if (typeof spec === "number" || typeof spec === "string" || typeof spec === "boolean") {
    return spec;
  }

  if ("bind" in spec) {
    // Look up in realized values first, then inputs
    return realized[spec.bind] ?? inputs[spec.bind];
  }

  // Note: { expr } specs are rejected at graph validation time (see createKlattRuntime)

  return undefined;
}
