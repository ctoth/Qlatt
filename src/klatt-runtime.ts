/**
 * Klatt Runtime - bridges Bacon graphs, semantics, and WebAudio
 *
 * This runtime is registry-driven: worklet and WASM paths are derived from
 * a registry.yaml file rather than being hardcoded.
 */

import { createConfiguredEvaluator } from './semantics/evaluator-factory';
import { applyParamValue } from './audio-param-utils';
import { expandFormantBanks } from './formant-bank';
import type { FormantBankSpec } from './formant-bank';
import type { SemanticsDocument, EvaluationContext, ParamValue } from './semantics/types';
import { createBrowserRuntimeAssetLoader } from './runtime-assets/browser-loader';
import type { RuntimeAssetLoader } from './runtime-assets/types';

// =============================================================================
// Registry Types
// =============================================================================

export interface RegistryPrimitive {
  description?: string;
  // Bacon format: use native/worklet/wasm to determine category
  native?: string;    // e.g., "GainNode" - maps to webaudio
  worklet?: string;   // e.g., "resonator-processor.js"
  wasm?: string;      // e.g., "resonator.wasm" - if present with worklet, it's wasm-worklet
  // Legacy format support
  category?: 'webaudio' | 'wasm-worklet' | 'js-worklet';
  params?: Record<string, {
    type: string;
    default?: number;
    unit?: string;
    description?: string;
  }>;
  // Legacy alias
  parameters?: Record<string, {
    type: string;
    default?: number;
    unit?: string;
    description?: string;
  }>;
  options?: Record<string, {
    type: string;
    default?: boolean | number | string;
    description?: string;
  }>;
  inputs?: number;
  outputs?: number;
}

export interface Registry {
  bacon?: string;   // Bacon format version
  version?: string; // Legacy format version
  primitives: Record<string, RegistryPrimitive>;
}

/**
 * Infer category from bacon-style fields
 */
function getPrimitiveCategory(primitive: RegistryPrimitive): 'webaudio' | 'wasm-worklet' | 'js-worklet' | null {
  // Explicit category takes precedence (legacy support)
  if (primitive.category) {
    return primitive.category;
  }
  // Bacon format: infer from fields
  if (primitive.native) {
    return 'webaudio';
  }
  if (primitive.worklet && primitive.wasm) {
    return 'wasm-worklet';
  }
  if (primitive.worklet) {
    return 'js-worklet';
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
  log: (msg: string) => void = () => {}
): Promise<Record<string, ArrayBuffer>> {
  const wasmFiles = getWasmModules(registry);

  if (wasmFiles.length === 0) {
    log('No WASM modules to load');
    return {};
  }

  log(`Loading ${wasmFiles.length} WASM modules`);

  const modules: Record<string, ArrayBuffer> = {};
  await Promise.all(
    wasmFiles.map(async (file) => {
      const key = file.replace('.wasm', '');
      modules[key] = await assetLoader.loadWasmModule(file);
      log(`  Loaded ${file} (${modules[key].byteLength} bytes)`);
    })
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
  log: (msg: string) => void = () => {}
): Promise<void> {
  const worklets = getWorkletModules(registry);

  if (worklets.length === 0) {
    log('No worklet modules to register');
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
          `Unable to register worklet module '${file}' from '${moduleUrl}': ${formatError(error)}`
        );
      }
      log(`  Registered ${file}`);
    })
  );
}

type AudioWorkletNodeConstructor = {
  new (
    context: BaseAudioContext,
    name: string,
    options?: AudioWorkletNodeOptions,
  ): AudioWorkletNode;
  prototype: AudioWorkletNode;
} & Function;

export function isAudioWorkletNode(
  node: AudioNode,
  audioWorkletNodeCtor: AudioWorkletNodeConstructor | undefined,
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
  log: (msg: string) => void = () => {}
): Promise<void> {
  const workletNodes: Array<[string, AudioWorkletNode]> = [];
  for (const [id, node] of nodes.entries()) {
    if (isAudioWorkletNode(node, audioWorkletNodeCtor)) {
      workletNodes.push([id, node]);
    }
  }

  if (workletNodes.length === 0) {
    log('No worklet nodes to await');
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
    })
  );

  const failed = failures.filter((message): message is string => message !== null);
  if (failed.length > 0) {
    for (const [, node] of workletNodes) {
      node.port.postMessage({ type: 'dispose' });
      node.port.close();
      node.disconnect();
    }
    throw new Error(`Failed to initialize ${failed.length} worklet(s): ${failed.join('; ')}`);
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
  log: (msg: string) => void = () => {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === '__qlatt_process_error__') {
        log(
          `  Process error from ${event.data?.node ?? 'unknown'}: ${event.data?.error ?? 'unknown error'}`,
        );
        return;
      }
      if (event.data?.type !== 'ready') return;
      done = true;
      node.port.removeEventListener('message', handler);
      resolve();
    };
    node.port.addEventListener('message', handler);
    node.port.start();
    node.port.postMessage({ type: 'ping' });
    setTimeout(() => {
      if (!done) {
        node.port.removeEventListener('message', handler);
        reject(new Error(`Worklet timed out waiting for ready after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });
}

// Bacon graph types (simplified - Bacon package has full types)
export interface BaconGraph {
  bacon: string;
  name?: string;
  formantBanks?: Record<string, FormantBankSpec>;
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
  return typeof ref === 'string' ? ref : ref.node;
}

/**
 * Extract port index from a port reference (undefined means default port)
 */
function getPortIndex(ref: PortRef): number | undefined {
  if (typeof ref === 'string') return undefined;
  if (typeof ref.port === 'number') return ref.port;
  return undefined;
}

// Runtime options
export interface KlattRuntimeOptions {
  audioContext: AudioContext;
  semantics: SemanticsDocument;
  graph: BaconGraph;
  registry: Registry;                         // Registry defining primitives (required)
  workletBasePath?: string;                   // Base path for worklet JS files, defaults to '/worklets/'
  assetLoader?: RuntimeAssetLoader;           // Host-specific worklet and WASM loader
  audioWorkletNodeCtor?: AudioWorkletNodeConstructor; // Host-specific AudioWorkletNode constructor
  workletProcessorOptionsByNodeId?: Record<string, Record<string, unknown>>; // Generic per-node worklet processor option overrides
  wasmModules?: Record<string, ArrayBuffer>;  // Pre-loaded WASM modules (optional)
  logger?: (msg: string) => void;             // Optional logging callback
  telemetry?: boolean;                        // Enable worklet debug metrics (default: false)
  telemetryHandler?: (data: unknown) => void; // Callback for worklet telemetry messages
}

// Binding information for interpreter use
export interface BindingSpec {
  nodeId: string;
  paramName: string;
  bindName: string;
}

// Runtime instance
export interface KlattRuntime {
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
    workletBasePath = ((typeof import.meta !== 'undefined' && (import.meta as any).env?.BASE_URL) || "/") + 'worklets/',
    assetLoader = createBrowserRuntimeAssetLoader(workletBasePath),
    audioWorkletNodeCtor = typeof AudioWorkletNode !== 'undefined' ? AudioWorkletNode : undefined,
    workletProcessorOptionsByNodeId = {},
    logger = () => {},
    telemetry = false,
    telemetryHandler,
  } = options;

  if (!registry) {
    throw new Error('Registry is required for createKlattRuntime');
  }

  // Validate graph param specs — reject { expr: "..." } at load time
  // Inline expressions are not supported; use realize rules in semantics.yaml.
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (!nodeDef.params) continue;
    for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
      if (typeof paramSpec === 'object' && paramSpec !== null && 'expr' in paramSpec) {
        throw new Error(
          `Inline expressions ({ expr: ... }) are not supported in graph param specs. ` +
          `Use a realize rule in semantics.yaml instead. ` +
          `Found on node '${nodeId}', param '${paramName}'`
        );
      }
    }
  }

  // Expand formant bank declarations into concrete nodes, connections, and rules.
  // Must happen before node/WASM detection, defaults init, and binding-map build.
  expandFormantBanks(graph, semantics);

  // Create prefixed logger
  const log = (msg: string) => logger(`[klatt-runtime] ${msg}`);

  log('Initializing Klatt runtime');
  log(`Graph has ${Object.keys(graph.nodes).length} nodes`);
  log(`Registry has ${Object.keys(registry.primitives).length} primitives`);

  // Determine which WASM modules are needed based on graph nodes and registry
  const needsWasm = Object.values(graph.nodes).some(n => {
    const primitive = registry.primitives[n.type];
    return primitive && getPrimitiveCategory(primitive) === 'wasm-worklet' && primitive.wasm;
  });

  // Load WASM if not provided and needed
  let wasmModules = options.wasmModules;
  if (!wasmModules && needsWasm) {
    wasmModules = await loadWasmModules(registry, assetLoader, log);
  }

  // Determine which worklets are needed based on graph nodes and registry
  const needsWorklets = Object.values(graph.nodes).some(n => {
    const primitive = registry.primitives[n.type];
    return primitive?.worklet !== undefined;
  });

  // Register worklets if needed
  if (needsWorklets) {
    if (!audioWorkletNodeCtor) {
      throw new Error('AudioWorkletNode constructor is required when the graph uses worklets');
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
    log('Creating audio nodes');
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
      if (!node || !nodeDef.params) continue;

      for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
        // Check if this binding references a failed realize rule
        if (typeof paramSpec === 'object' && paramSpec !== null && 'bind' in paramSpec) {
          const bindName = (paramSpec as { bind: string }).bind;
          if (lastEvaluationErrorNames.has(bindName)) {
            affectedBindings.push(bindName);
          }
        }

        const value = resolveParamValue(paramSpec, realizedValues, currentInputs);
        if (typeof value === 'number') {
          applyParamValue(node, paramName, value);
        }
      }
    }

    // Log a single summary line for bindings affected by failed realize rules
    if (affectedBindings.length > 0) {
      const unique = [...new Set(affectedBindings)];
      log(`Semantics fallthrough for: ${unique.join(', ')} (realize rule failed, using raw input values)`);
    }
  }

  // Wire up connections
  function connectNodes(): void {
    if (!graph.connections) {
      log('No connections to wire');
      return;
    }

    log('Connecting audio graph');
    for (const conn of graph.connections) {
      // Extract from/to refs
      const [fromRef, toRef]: [PortRef, PortRef] = Array.isArray(conn)
        ? conn
        : [conn.from, conn.to];

      const fromId = getNodeId(fromRef);
      const toId = getNodeId(toRef);
      const fromPort = getPortIndex(fromRef);
      const toPort = getPortIndex(toRef);

      const fromNode = nodes.get(fromId);
      const toNode = nodes.get(toId);

      // Check if target specifies an AudioParam connection
      // — Stevens & Bickley (1991): aerodynamic model outputs connect to
      //   gain/bandwidth AudioParams additively (WebAudio additive semantics)
      const toParamName = typeof toRef === 'object' && toRef !== null ? toRef.param : undefined;

      if (toParamName) {
        // AudioParam connection: audioNode.connect(audioParam)
        if (!fromNode) {
          log(`  Warning: Could not connect ${fromId} -> ${toId}.${toParamName} (missing source node)`);
        } else if (!toNode) {
          log(`  Warning: Could not connect ${fromId} -> ${toId}.${toParamName} (missing target node)`);
        } else {
          const fromIndex = fromPort ?? 0;

          // AudioWorkletNode: use .parameters.get(paramName)
          if (isAudioWorkletNode(toNode, audioWorkletNodeCtor)) {
            const audioParam = toNode.parameters.get(toParamName);
            if (audioParam) {
              fromNode.connect(audioParam, fromIndex);
              log(`  Connected ${fromId}[${fromIndex}] -> ${toId}.${toParamName} (AudioParam)`);
            } else {
              log(`  Warning: AudioParam '${toParamName}' not found on AudioWorkletNode '${toId}'`);
            }
          } else {
            // Native nodes (GainNode, etc.): access as property
            const audioParam = (toNode as unknown as Record<string, unknown>)[toParamName];
            if (audioParam instanceof AudioParam) {
              fromNode.connect(audioParam, fromIndex);
              log(`  Connected ${fromId}[${fromIndex}] -> ${toId}.${toParamName} (AudioParam)`);
            } else {
              log(`  Warning: AudioParam '${toParamName}' not found on native node '${toId}'`);
            }
          }
        }
      } else if (fromNode && toNode) {
        if (toPort !== undefined || fromPort !== undefined) {
          const fromIndex = fromPort ?? 0;
          const toIndex = toPort ?? 0;
          fromNode.connect(toNode, fromIndex, toIndex);
          log(`  Connected ${fromId}[${fromIndex}] -> ${toId}[${toIndex}]`);
        } else {
          fromNode.connect(toNode);
          log(`  Connected ${fromId} -> ${toId}`);
        }
      } else {
        log(`  Warning: Could not connect ${fromId} -> ${toId} (missing node)`);
      }
    }
  }

  // Build binding map (semantic name -> node/param targets)
  // This is exposed via getBindingMap() for interpreter to reuse
  const bindingMap = new Map<string, BindingSpec[]>();
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (!nodeDef.params) continue;
    for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
      if (typeof paramSpec === 'object' && paramSpec !== null && 'bind' in paramSpec) {
        const bindName = (paramSpec as { bind: string }).bind;
        const existing = bindingMap.get(bindName) ?? [];
        existing.push({ nodeId, paramName, bindName });
        bindingMap.set(bindName, existing);
      }
    }
  }

  // Initialize
  log('Evaluating semantics');
  evaluate();
  createNodes();
  log(`Created nodes: ${Array.from(nodes.keys()).join(', ')}`);
  log(`Built ${bindingMap.size} unique bindings`);
  connectNodes();
  log(`Total connections: ${graph.connections?.length ?? 0}`);

  // Wait for worklets to be ready before applying values
  await awaitWorkletReady(nodes, audioWorkletNodeCtor, 2000, log);

  log('Applying realized values to nodes');
  applyValues();

  // Attach telemetry port listeners if handler provided
  if (telemetryHandler) {
    let attached = 0;
    for (const [, node] of nodes) {
      if (!isAudioWorkletNode(node, audioWorkletNodeCtor)) continue;

      node.port.addEventListener('message', (event: MessageEvent) => {
        const data = event.data;
        if (data && typeof data === 'object') {
          telemetryHandler(data);
        }
      });

      // Ensure port is started
      if (typeof node.port.start === 'function') {
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

  log('Klatt runtime initialized successfully');

  return {
    getRealizedValues(): Record<string, ParamValue> {
      return { ...realizedValues };
    },

    setInputs(inputs: Record<string, ParamValue>): void {
      log(`Setting inputs: ${Object.keys(inputs).join(', ')}`);
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
        throw new Error('Graph definition missing "outputs" field — cannot connect to destination');
      }
      const outputRef = graph.outputs[0];
      const nodeId = typeof outputRef === 'string' ? outputRef : outputRef.node;
      const outputNode = nodes.get(nodeId);
      if (!outputNode) {
        throw new Error(`Output node "${nodeId}" specified in graph.outputs not found in created nodes`);
      }
      log(`Connecting ${nodeId} to destination`);
      outputNode.connect(audioContext.destination);
    },

    disconnect(): void {
      for (const node of nodes.values()) {
        if (isAudioWorkletNode(node, audioWorkletNodeCtor)) {
          node.port.postMessage({ type: 'dispose' });
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
  telemetry: boolean
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
    case 'webaudio':
      return createNativeNode(ctx, type, log);

    case 'wasm-worklet':
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

    case 'js-worklet':
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

// Helper: Create native WebAudio node
function createNativeNode(
  ctx: AudioContext,
  type: string,
  log: (msg: string) => void
): AudioNode | null {
  switch (type) {
    case 'gain':
      return ctx.createGain();
    case 'constant-source': {
      const cs = ctx.createConstantSource();
      cs.start();
      return cs;
    }
    case 'dynamics-compressor':
      return ctx.createDynamicsCompressor();
    default:
      log(`Warning: Unknown native node type '${type}'`);
      return null;
  }
}

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
  telemetry: boolean
): AudioWorkletNode | null {
  const processorName = primitive.worklet!.replace('.js', '');
  const wasmKey = primitive.wasm!.replace('.wasm', '');
  const wasmBytes = wasmModules?.[wasmKey];
  const outputCount = primitive.outputs ?? 1;

  if (!wasmBytes) {
    log(`Error: WASM module '${wasmKey}' not loaded for node '${id}'`);
    return null;  // Don't create broken node
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
      debug: telemetry,      // Enable metrics emission when telemetry requested
      reportInterval: 40,    // Match legacy synth interval
      ...nodeOptions,        // Pass node options to processor
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
  telemetry: boolean
): AudioWorkletNode {
  const processorName = primitive.worklet!.replace('.js', '');
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
      debug: telemetry,      // Enable metrics emission when telemetry requested
      reportInterval: 40,    // Match legacy synth interval
      ...nodeOptions,        // Pass node options to processor
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
      (entry) => entry.description === 'node-web-audio-api:napi-obj',
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
  inputs: Record<string, ParamValue>
): ParamValue | undefined {
  if (typeof spec === 'number' || typeof spec === 'string' || typeof spec === 'boolean') {
    return spec;
  }

  if ('bind' in spec) {
    // Look up in realized values first, then inputs
    return realized[spec.bind] ?? inputs[spec.bind];
  }

  // Note: { expr } specs are rejected at graph validation time (see createKlattRuntime)

  return undefined;
}
