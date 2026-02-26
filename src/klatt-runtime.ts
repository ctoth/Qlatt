/**
 * Klatt Runtime - bridges Bacon graphs, semantics, and WebAudio
 *
 * This runtime is registry-driven: worklet and WASM paths are derived from
 * a registry.yaml file rather than being hardcoded.
 */

import { createCelEvaluator, CelEvaluator } from './semantics/cel-evaluator';
import { registerNumericBuiltins } from './semantics/register-builtins';

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
  basePath: string,
  log: (msg: string) => void = () => {}
): Promise<Record<string, ArrayBuffer>> {
  const wasmFiles = getWasmModules(registry);

  if (wasmFiles.length === 0) {
    log('No WASM modules to load');
    return {};
  }

  log(`Loading ${wasmFiles.length} WASM modules from ${basePath}`);

  const modules: Record<string, ArrayBuffer> = {};
  await Promise.all(
    wasmFiles.map(async (file) => {
      const key = file.replace('.wasm', '');
      log(`  Fetching ${file}...`);
      const response = await fetch(basePath + file);
      modules[key] = await response.arrayBuffer();
      log(`  Loaded ${file} (${modules[key].byteLength} bytes)`);
    })
  );

  return modules;
}

function normalizeBasePath(basePath: string): string {
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
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
  basePath: string,
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
      const moduleUrl = `${normalizeBasePath(basePath)}${file}`;
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

export function isAudioWorkletNode(node: AudioNode): node is AudioWorkletNode {
  return typeof AudioWorkletNode !== 'undefined' && node instanceof AudioWorkletNode;
}

/**
 * Wait for all worklet nodes to be ready
 */
async function awaitWorkletReady(
  nodes: Map<string, AudioNode>,
  timeoutMs = 2000,
  log: (msg: string) => void = () => {}
): Promise<void> {
  const workletNodes: Array<[string, AudioWorkletNode]> = [];
  for (const [id, node] of nodes.entries()) {
    if (isAudioWorkletNode(node)) {
      workletNodes.push([id, node]);
    }
  }

  if (workletNodes.length === 0) {
    log('No worklet nodes to await');
    return;
  }

  log(`Waiting for ${workletNodes.length} worklets to be ready`);

  await Promise.all(
    workletNodes.map(async ([id, node]) => {
      try {
        await waitForNodeReady(node, timeoutMs, log);
        log(`  ${id} ready`);
      } catch (err) {
        log(`  Warning: ${id} - ${err instanceof Error ? err.message : String(err)}`);
        // Continue: worklet may still work, just unconfirmed ready
      }
    })
  );
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

import { createTopologicalEvaluator } from './semantics/topological-evaluator';
import type { SemanticsDocument, EvaluationContext, ParamValue } from './semantics/types';

// requireNumericArg and registerNumericBuiltins moved to ./semantics/register-builtins.ts

// Bacon graph types (simplified - Bacon package has full types)
export interface BaconGraph {
  bacon: string;
  name?: string;
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
  wasmModules?: Record<string, ArrayBuffer>;  // Pre-loaded WASM modules (optional)
  logger?: (msg: string) => void;             // Optional logging callback
  telemetry?: boolean;                        // Enable worklet debug metrics (default: false)
  telemetryHandler?: (data: unknown) => void; // Callback for worklet telemetry messages
}

// Binding information for interpreter use
export interface BindingInfo {
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
  getBindingMap(): Map<string, BindingInfo[]>;
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
    workletBasePath = '/worklets/',
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
    wasmModules = await loadWasmModules(registry, workletBasePath, log);
  }

  // Determine which worklets are needed based on graph nodes and registry
  const needsWorklets = Object.values(graph.nodes).some(n => {
    const primitive = registry.primitives[n.type];
    return primitive?.worklet !== undefined;
  });

  // Register worklets if needed
  if (needsWorklets) {
    await registerWorklets(audioContext, registry, workletBasePath, log);
  }

  // Create evaluators
  const celEvaluator = createCelEvaluator();
  const topoEvaluator = createTopologicalEvaluator(celEvaluator);

  // Register standard functions with CEL evaluator (using imported functions)
  registerNumericBuiltins(celEvaluator);

  // Current input values
  let currentInputs: Record<string, ParamValue> = {};

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
        if (typeof err === 'object' && err !== null && 'name' in err) {
          lastEvaluationErrorNames.add((err as { name: string }).name);
        }
        log(`Semantics evaluation error: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
      }
    }
  }

  // Create audio nodes from graph
  function createNodes(): void {
    log('Creating audio nodes');
    for (const [id, nodeDef] of Object.entries(graph.nodes)) {
      const node = createAudioNode(audioContext, nodeDef.type, id, nodeDef, registry, wasmModules, log, telemetry);
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
        if (value !== undefined) {
          applyParamToNode(node, paramName, value);
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
          if (toNode instanceof AudioWorkletNode) {
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
  const bindingMap = new Map<string, BindingInfo[]>();
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
  await awaitWorkletReady(nodes, 2000, log);

  log('Applying realized values to nodes');
  applyValues();

  // Attach telemetry port listeners if handler provided
  if (telemetryHandler) {
    let attached = 0;
    for (const [, node] of nodes) {
      if (!isAudioWorkletNode(node)) continue;
      const workletNode = node;

      workletNode.port.addEventListener('message', (event: MessageEvent) => {
        const data = event.data;
        if (data && typeof data === 'object') {
          telemetryHandler(data);
        }
      });

      // Ensure port is started
      if (typeof workletNode.port.start === 'function') {
        try {
          workletNode.port.start();
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
        node.disconnect();
      }
    },

    getBindingMap(): Map<string, BindingInfo[]> {
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
      return createNativeNode(ctx, type, id, log);

    case 'wasm-worklet':
      return createWasmWorkletNode(ctx, type, id, primitive, nodeOptions, wasmModules, log, telemetry);

    case 'js-worklet':
      return createJsWorkletNode(ctx, type, id, primitive, nodeOptions, log, telemetry);

    default:
      log(`Warning: Unknown category '${category}' for type '${type}'`);
      return null;
  }
}

// Helper: Create native WebAudio node
function createNativeNode(
  ctx: AudioContext,
  type: string,
  id: string,
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
    default:
      log(`Warning: Unknown native node type '${type}'`);
      return null;
  }
}

// Helper: Create WASM-backed worklet node
function createWasmWorkletNode(
  ctx: AudioContext,
  type: string,
  id: string,
  primitive: RegistryPrimitive,
  nodeOptions: Record<string, unknown>,
  wasmModules: Record<string, ArrayBuffer> | undefined,
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

  return new AudioWorkletNode(ctx, processorName, {
    numberOfInputs: primitive.inputs ?? 1,
    numberOfOutputs: outputCount,
    outputChannelCount: Array.from({ length: outputCount }, () => 1),
    processorOptions: {
      wasmBytes,
      nodeId: id,
      debug: telemetry,      // Enable metrics emission when telemetry requested
      reportInterval: 40,    // Match legacy synth interval
      ...nodeOptions,        // Pass node options to processor
    },
  });
}

// Helper: Create JavaScript worklet node
function createJsWorkletNode(
  ctx: AudioContext,
  type: string,
  id: string,
  primitive: RegistryPrimitive,
  nodeOptions: Record<string, unknown>,
  log: (msg: string) => void,
  telemetry: boolean
): AudioWorkletNode {
  const processorName = primitive.worklet!.replace('.js', '');
  const outputCount = primitive.outputs ?? 1;

  return new AudioWorkletNode(ctx, processorName, {
    numberOfInputs: primitive.inputs ?? 1,
    numberOfOutputs: outputCount,
    outputChannelCount: Array.from({ length: outputCount }, () => 1),
    processorOptions: {
      nodeId: id,
      debug: telemetry,      // Enable metrics emission when telemetry requested
      reportInterval: 40,    // Match legacy synth interval
      ...nodeOptions,        // Pass node options to processor
    },
  });
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

  if ('expr' in spec) {
    // Expression evaluation would go through CEL
    // For MVP, skip inline expressions
    console.warn('Inline expressions not yet supported');
    return undefined;
  }

  return undefined;
}

// Helper: Apply param to node
function applyParamToNode(node: AudioNode, paramName: string, value: ParamValue): void {
  if (typeof value !== 'number') return;

  // Handle GainNode (duck typing for Node.js test compatibility)
  const anyNode = node as unknown as Record<string, unknown>;
  if (paramName === 'gain' && anyNode.gain) {
    const gainParam = anyNode.gain as { value?: number; setValueAtTime?: (v: number, t: number) => void };
    if (typeof gainParam.setValueAtTime === 'function') {
      gainParam.setValueAtTime(value, node.context.currentTime);
    } else if (typeof gainParam.value === 'number') {
      gainParam.value = value;
    }
    return;
  }

  // Handle ConstantSourceNode offset
  if (paramName === 'offset' && anyNode.offset) {
    const offsetParam = anyNode.offset as { value?: number; setValueAtTime?: (v: number, t: number) => void };
    if (typeof offsetParam.setValueAtTime === 'function') {
      offsetParam.setValueAtTime(value, node.context.currentTime);
    } else if (typeof offsetParam.value === 'number') {
      offsetParam.value = value;
    }
    return;
  }

  // Handle AudioWorkletNode (duck typing for Node.js test compatibility)
  if (anyNode.parameters && typeof (anyNode.parameters as Record<string, unknown>).get === 'function') {
    const param = (anyNode.parameters as { get: (name: string) => AudioParam | { value: number } | undefined }).get(paramName);
    if (param) {
      if ('setValueAtTime' in param && typeof param.setValueAtTime === 'function') {
        param.setValueAtTime(value, node.context.currentTime);
      } else if ('value' in param) {
        param.value = value;
      }
    }
  }
}
