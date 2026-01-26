/**
 * Klatt Runtime - bridges Bacon graphs, semantics, and WebAudio
 *
 * This runtime is registry-driven: worklet and WASM paths are derived from
 * a registry.yaml file rather than being hardcoded.
 */

import { createCelEvaluator, CelEvaluator } from './semantics/cel-evaluator.js';

// =============================================================================
// Registry Types
// =============================================================================

export interface RegistryPrimitive {
  description?: string;
  category: 'webaudio' | 'wasm-worklet' | 'js-worklet';
  worklet?: string;  // e.g., "resonator-processor.js"
  wasm?: string;     // e.g., "resonator.wasm"
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
  version: string;
  primitives: Record<string, RegistryPrimitive>;
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
      log(`  Registering ${file}...`);
      await ctx.audioWorklet.addModule(basePath + file);
      log(`  Registered ${file}`);
    })
  );
}

/**
 * Wait for all worklet nodes to be ready
 */
async function awaitWorkletReady(
  nodes: Map<string, AudioNode>,
  timeoutMs = 2000,
  log: (msg: string) => void = () => {}
): Promise<void> {
  const workletNodes = Array.from(nodes.entries()).filter(
    ([, node]): node is [string, AudioWorkletNode] => 'port' in node
  );

  if (workletNodes.length === 0) {
    log('No worklet nodes to await');
    return;
  }

  log(`Waiting for ${workletNodes.length} worklets to be ready`);

  await Promise.all(
    workletNodes.map(async ([id, node]) => {
      await waitForNodeReady(node, timeoutMs, log);
      log(`  ${id} ready`);
    })
  );
}

/**
 * Wait for a single worklet node to signal ready
 */
function waitForNodeReady(
  node: AudioWorkletNode,
  timeoutMs: number,
  log: (msg: string) => void = () => {}
): Promise<void> {
  return new Promise((resolve) => {
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
        log(`  Warning: worklet timed out waiting for ready`);
        resolve();
      }
    }, timeoutMs);
  });
}

import { createJmespathResolver, JmespathResolver } from './semantics/jmespath-resolver.js';
import { createTopologicalEvaluator, TopologicalEvaluator } from './semantics/topological-evaluator.js';
import type { SemanticsDocument, EvaluationContext, ParamValue } from './semantics/types.js';

// Bacon graph types (simplified - Bacon package has full types)
export interface BaconGraph {
  bacon: string;
  name?: string;
  nodes: Record<string, BaconNode>;
  connections?: BaconConnection[];
}

export interface BaconNode {
  type: string;
  params?: Record<string, ParamValueSpec>;
}

export type ParamValueSpec = number | string | boolean | { bind: string } | { expr: string };

export type BaconConnection = [string, string] | { from: string; to: string };

// Runtime options
export interface KlattRuntimeOptions {
  audioContext: AudioContext;
  semantics: SemanticsDocument;
  graph: BaconGraph;
  registry?: Registry;                        // Registry defining primitives (optional for backward compat)
  workletBasePath?: string;                   // Base path for worklet JS files, defaults to '/worklets/'
  wasmModules?: Record<string, ArrayBuffer>;  // Pre-loaded WASM modules (optional)
  logger?: (msg: string) => void;             // Optional logging callback
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
}

/**
 * Default registry for backward compatibility (when no registry is provided)
 */
const DEFAULT_REGISTRY: Registry = {
  version: '1.0',
  primitives: {
    'gain': { category: 'webaudio', inputs: 1, outputs: 1 },
    'constant-source': { category: 'webaudio', inputs: 0, outputs: 1 },
    'resonator': {
      category: 'wasm-worklet',
      worklet: 'resonator-processor.js',
      wasm: 'resonator.wasm',
      inputs: 1,
      outputs: 1,
    },
    'antiresonator': {
      category: 'wasm-worklet',
      worklet: 'antiresonator-processor.js',
      wasm: 'antiresonator.wasm',
      inputs: 1,
      outputs: 1,
    },
    'lf-source': {
      category: 'wasm-worklet',
      worklet: 'lf-source-processor.js',
      wasm: 'lf-source.wasm',
      inputs: 0,
      outputs: 1,
    },
    'impulse-train': {
      category: 'js-worklet',
      worklet: 'impulse-train-processor.js',
      inputs: 0,
      outputs: 1,
    },
    'noise-source': {
      category: 'js-worklet',
      worklet: 'noise-source-processor.js',
      inputs: 1,
      outputs: 1,
    },
    'differentiator': {
      category: 'js-worklet',
      worklet: 'differentiator-processor.js',
      inputs: 1,
      outputs: 1,
    },
    'glottal-mod': {
      category: 'js-worklet',
      worklet: 'glottal-mod-processor.js',
      inputs: 1,
      outputs: 1,
    },
  },
};

/**
 * Create a Klatt runtime instance (async to support worklet loading)
 */
export async function createKlattRuntime(options: KlattRuntimeOptions): Promise<KlattRuntime> {
  const {
    audioContext,
    semantics,
    graph,
    registry = DEFAULT_REGISTRY,
    workletBasePath = '/worklets/',
    logger = () => {},
  } = options;

  // Create prefixed logger
  const log = (msg: string) => logger(`[klatt-runtime] ${msg}`);

  log('Initializing Klatt runtime');
  log(`Graph has ${Object.keys(graph.nodes).length} nodes`);
  log(`Registry has ${Object.keys(registry.primitives).length} primitives`);

  // Determine which WASM modules are needed based on graph nodes and registry
  const needsWasm = Object.values(graph.nodes).some(n => {
    const primitive = registry.primitives[n.type];
    return primitive?.category === 'wasm-worklet' && primitive.wasm;
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
  const jmespathResolver = createJmespathResolver();
  const topoEvaluator = createTopologicalEvaluator();

  // Register standard functions
  registerStandardFunctions(celEvaluator);

  // Current input values
  let currentInputs: Record<string, ParamValue> = {};

  // Current realized values (result of semantics evaluation)
  let realizedValues: Record<string, ParamValue> = {};

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

  // Standard functions available in expressions
  const standardFunctions: Record<string, (...args: number[]) => number> = {
    // dbToLinear: Klatt's 2^(db/6) formula
    dbToLinear: (db: number) => {
      if (!Number.isFinite(db) || db <= -72) return 0;
      return Math.pow(2, Math.min(96, db) / 6);
    },
    min: (a: number, b: number) => Math.min(a, b),
    max: (a: number, b: number) => Math.max(a, b),
    pow: (base: number, exp: number) => Math.pow(base, exp),
  };

  // Evaluate semantics
  function evaluate(): void {
    // Merge standard functions into inputs so they're available in expressions
    const inputsWithFunctions = { ...currentInputs, ...standardFunctions };
    const result = topoEvaluator.evaluate(semantics, inputsWithFunctions);
    realizedValues = result.values;

    if (result.errors.length > 0) {
      console.warn('Semantics evaluation errors:', result.errors);
    }
  }

  // Create audio nodes from graph
  function createNodes(): void {
    log('Creating audio nodes');
    for (const [id, nodeDef] of Object.entries(graph.nodes)) {
      const node = createAudioNode(audioContext, nodeDef.type, id, registry, wasmModules, log);
      if (node) {
        nodes.set(id, node);
      }
    }
    log(`Created ${nodes.size} nodes`);
  }

  // Apply realized values to nodes
  function applyValues(): void {
    for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
      const node = nodes.get(nodeId);
      if (!node || !nodeDef.params) continue;

      for (const [paramName, paramSpec] of Object.entries(nodeDef.params)) {
        const value = resolveParamValue(paramSpec, realizedValues, currentInputs);
        if (value !== undefined) {
          applyParamToNode(node, paramName, value);
        }
      }
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
      const [fromId, toId] = Array.isArray(conn)
        ? conn
        : [conn.from, conn.to];

      const fromNode = nodes.get(fromId);
      const toNode = nodes.get(toId);

      if (fromNode && toNode) {
        fromNode.connect(toNode);
        log(`  Connected ${fromId} -> ${toId}`);
      } else {
        log(`  Warning: Could not connect ${fromId} -> ${toId} (missing node)`);
      }
    }
  }

  // Initialize
  log('Evaluating semantics');
  evaluate();
  createNodes();
  connectNodes();

  // Wait for worklets to be ready before applying values
  await awaitWorkletReady(nodes, 2000, log);

  log('Applying realized values to nodes');
  applyValues();

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
      // Find output node(s) and connect
      // For now, assume 'output' or 'masterGain' exists
      const output = nodes.get('output') ?? nodes.get('masterGain');
      if (output) {
        output.connect(audioContext.destination);
      }
    },

    disconnect(): void {
      for (const node of nodes.values()) {
        node.disconnect();
      }
    },
  };
}

// Helper: Register standard Klatt functions
function registerStandardFunctions(cel: CelEvaluator): void {
  // dbToLinear: Klatt's 2^(db/6) formula
  cel.registerFunction('dbToLinear', (db: number) => {
    if (!Number.isFinite(db) || db <= -72) return 0;
    return Math.pow(2, Math.min(96, db) / 6);
  });

  // min/max
  cel.registerFunction('min', (a: number, b: number) => Math.min(a, b));
  cel.registerFunction('max', (a: number, b: number) => Math.max(a, b));

  // pow
  cel.registerFunction('pow', (base: number, exp: number) => Math.pow(base, exp));
}

// Helper: Create audio node by type (registry-driven)
function createAudioNode(
  ctx: AudioContext,
  type: string,
  id: string,
  registry: Registry,
  wasmModules: Record<string, ArrayBuffer> | undefined,
  log: (msg: string) => void
): AudioNode | null {
  const primitive = registry.primitives[type];

  if (!primitive) {
    log(`Warning: Unknown node type '${type}' - not in registry`);
    return null;
  }

  log(`  Creating node '${id}' of type '${type}' (${primitive.category})`);

  switch (primitive.category) {
    case 'webaudio':
      return createNativeNode(ctx, type, id, log);

    case 'wasm-worklet':
      return createWasmWorkletNode(ctx, type, id, primitive, wasmModules, log);

    case 'js-worklet':
      return createJsWorkletNode(ctx, type, id, primitive, log);

    default:
      log(`Warning: Unknown category '${primitive.category}' for type '${type}'`);
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
  wasmModules: Record<string, ArrayBuffer> | undefined,
  log: (msg: string) => void
): AudioWorkletNode | null {
  const processorName = primitive.worklet!.replace('.js', '');
  const wasmKey = primitive.wasm!.replace('.wasm', '');
  const wasmBytes = wasmModules?.[wasmKey];

  if (!wasmBytes) {
    log(`Error: WASM module '${wasmKey}' not loaded for node '${id}'`);
    return null;  // Don't create broken node
  }

  return new AudioWorkletNode(ctx, processorName, {
    numberOfInputs: primitive.inputs ?? 1,
    numberOfOutputs: primitive.outputs ?? 1,
    outputChannelCount: [1],
    processorOptions: {
      wasmBytes,
      nodeId: id,
    },
  });
}

// Helper: Create JavaScript worklet node
function createJsWorkletNode(
  ctx: AudioContext,
  type: string,
  id: string,
  primitive: RegistryPrimitive,
  log: (msg: string) => void
): AudioWorkletNode {
  const processorName = primitive.worklet!.replace('.js', '');

  return new AudioWorkletNode(ctx, processorName, {
    numberOfInputs: primitive.inputs ?? 1,
    numberOfOutputs: primitive.outputs ?? 1,
    outputChannelCount: [1],
    processorOptions: {
      nodeId: id,
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
