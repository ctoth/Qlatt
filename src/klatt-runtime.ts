/**
 * Klatt Runtime - bridges Bacon graphs, semantics, and WebAudio
 */

import { createCelEvaluator, CelEvaluator } from './semantics/cel-evaluator.js';
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
  wasmModules?: Record<string, ArrayBuffer>;
}

// Runtime instance
export interface KlattRuntime {
  // Get current realized values
  getRealizedValues(): Record<string, ParamValue>;

  // Update input parameters and re-evaluate semantics
  setInputs(inputs: Record<string, ParamValue>): void;

  // Get an audio node by ID
  getNode(id: string): AudioNode | undefined;

  // Connect to destination
  connectToDestination(): void;

  // Disconnect all
  disconnect(): void;
}

/**
 * Create a Klatt runtime instance
 */
export function createKlattRuntime(options: KlattRuntimeOptions): KlattRuntime {
  const { audioContext, semantics, graph } = options;

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
    for (const [id, nodeDef] of Object.entries(graph.nodes)) {
      const node = createAudioNode(audioContext, nodeDef.type, id, options.wasmModules);
      if (node) {
        nodes.set(id, node);
      }
    }
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
    if (!graph.connections) return;

    for (const conn of graph.connections) {
      const [fromId, toId] = Array.isArray(conn)
        ? conn
        : [conn.from, conn.to];

      const fromNode = nodes.get(fromId);
      const toNode = nodes.get(toId);

      if (fromNode && toNode) {
        fromNode.connect(toNode);
      }
    }
  }

  // Initialize
  evaluate();
  createNodes();
  applyValues();
  connectNodes();

  return {
    getRealizedValues(): Record<string, ParamValue> {
      return { ...realizedValues };
    },

    setInputs(inputs: Record<string, ParamValue>): void {
      Object.assign(currentInputs, inputs);
      evaluate();
      applyValues();
    },

    getNode(id: string): AudioNode | undefined {
      return nodes.get(id);
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

// Helper: Create audio node by type
function createAudioNode(
  ctx: AudioContext,
  type: string,
  id: string,
  wasmModules?: Record<string, ArrayBuffer>
): AudioNode | null {
  switch (type) {
    case 'gain':
      return ctx.createGain();
    case 'constant-source': {
      const cs = ctx.createConstantSource();
      cs.start();
      return cs;
    }
    // Worklet nodes would need async initialization
    // For MVP, return null for unknown types
    default:
      console.warn(`Unknown node type: ${type}, skipping`);
      return null;
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
  const anyNode = node as Record<string, unknown>;
  if (paramName === 'gain' && anyNode.gain && typeof (anyNode.gain as Record<string, unknown>).value === 'number') {
    (anyNode.gain as { value: number }).value = value;
    return;
  }

  // Handle AudioWorkletNode (duck typing for Node.js test compatibility)
  if (anyNode.parameters && typeof (anyNode.parameters as Record<string, unknown>).get === 'function') {
    const param = (anyNode.parameters as { get: (name: string) => { value: number } | undefined }).get(paramName);
    if (param) {
      param.value = value;
    }
  }
}
