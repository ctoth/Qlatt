// Tap manager — creates and manages AnalyserNodes attached to graph nodes.
// Each tap resolves a node ID (or list of candidates) from the runtime,
// creates an AnalyserNode, and connects the graph node to it.

import type { TapDef } from "./types";

export interface TapManagerOptions {
  audioContext: AudioContext;
  runtime: any; // KlattRuntime — has getNode(id: string): AudioNode | null
  taps: Record<string, TapDef>;
}

const DEFAULT_FFT_SIZE = 2048;

export class TapManager {
  private audioContext: AudioContext;
  private runtime: any;
  private tapDefs: Record<string, TapDef>;
  private analysers: Map<string, AnalyserNode>;

  constructor(options: TapManagerOptions) {
    this.audioContext = options.audioContext;
    this.runtime = options.runtime;
    this.tapDefs = options.taps;
    this.analysers = new Map();
  }

  /** Create AnalyserNodes for all configured taps. */
  connect(): void {
    for (const [tapName, tapDef] of Object.entries(this.tapDefs)) {
      const graphNode = this.resolveNode(tapDef.node);
      if (!graphNode) continue;

      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = tapDef.fftSize ?? DEFAULT_FFT_SIZE;
      graphNode.connect(analyser);
      this.analysers.set(tapName, analyser);
    }
  }

  /** Get the analyser for a tap name. Returns null if tap couldn't be connected. */
  get(tapName: string): AnalyserNode | null {
    return this.analysers.get(tapName) ?? null;
  }

  /** Disconnect and clean up all analysers. */
  destroy(): void {
    for (const analyser of this.analysers.values()) {
      try {
        analyser.disconnect();
      } catch {
        // Already disconnected
      }
    }
    this.analysers.clear();
  }

  /**
   * Resolve a node reference to an AudioNode.
   * If node is a string, try runtime.getNode(node).
   * If node is a string[], try each in order, use first found.
   */
  private resolveNode(node: string | string[]): AudioNode | null {
    if (typeof node === "string") {
      return this.runtime.getNode(node) ?? null;
    }
    for (const candidate of node) {
      const found = this.runtime.getNode(candidate);
      if (found) return found;
    }
    return null;
  }
}
