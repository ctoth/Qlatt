/**
 * Shared AudioParam access utilities
 *
 * Provides a unified 3-step duck-typing pattern for resolving AudioParams
 * from WebAudio nodes, regardless of node type:
 *   1. GainNode — check for 'gain' property
 *   2. ConstantSourceNode — check for 'offset' property
 *   3. AudioWorkletNode — check for parameters.get()
 *
 * Previously duplicated between klatt-interpreter.ts (getAudioParam) and
 * klatt-runtime.ts (applyParamToNode). Extracted to eliminate divergence
 * in type casts and behavior.
 */

/**
 * Resolve an AudioParam from a node by parameter name.
 *
 * Uses duck typing for Node.js test compatibility (no real WebAudio globals).
 * Returns null if the param is not found on the node.
 */
export function getAudioParam(node: AudioNode, paramName: string): AudioParam | null {
  const anyNode = node as unknown as Record<string, unknown>;

  // Handle GainNode
  if (paramName === 'gain' && anyNode.gain) {
    return anyNode.gain as AudioParam;
  }

  // Handle ConstantSourceNode
  if (paramName === 'offset' && anyNode.offset) {
    return anyNode.offset as AudioParam;
  }

  // Handle AudioWorkletNode parameters
  if (anyNode.parameters && typeof (anyNode.parameters as Record<string, unknown>).get === 'function') {
    const param = (anyNode.parameters as { get: (name: string) => AudioParam | undefined }).get(paramName);
    if (param) return param;
  }

  return null;
}

/**
 * Apply a numeric value to an AudioParam on a node.
 *
 * Resolves the param via getAudioParam, then:
 * - Prefers setValueAtTime(value, time) when available
 * - Falls back to direct .value assignment
 *
 * Returns true if the param was found and the value was applied, false otherwise.
 *
 * @param node - The AudioNode to apply the value to
 * @param paramName - The parameter name (e.g., 'gain', 'offset', 'frequency')
 * @param value - The numeric value to set
 * @param time - The AudioContext time at which to set the value.
 *               Falls back to node.context.currentTime if not provided.
 */
export function applyParamValue(
  node: AudioNode,
  paramName: string,
  value: number,
  time?: number,
): boolean {
  const param = getAudioParam(node, paramName);
  if (!param) return false;

  const paramRecord = param as unknown as Record<string, unknown>;

  if (typeof paramRecord.setValueAtTime === 'function') {
    // Resolve time lazily: only access node.context.currentTime when actually needed
    const nodeRecord = node as unknown as Record<string, unknown>;
    const ctx = nodeRecord.context as { currentTime: number } | undefined;
    const resolvedTime = time ?? ctx?.currentTime ?? 0;
    (paramRecord.setValueAtTime as (v: number, t: number) => void)(value, resolvedTime);
  } else if ('value' in paramRecord) {
    (param as unknown as { value: number }).value = value;
  }

  return true;
}
