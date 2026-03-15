/**
 * FormantBank expansion system
 *
 * Reads a `formantBanks` declaration from graph.yaml and generates the
 * equivalent cascade/parallel resonator nodes, connections, semantic params,
 * constants, and realize rules that were previously hand-written for each
 * formant.
 *
 * Klatt (1980) "Software for a cascade/parallel formant synthesizer"
 * JASA 67(3), 971-995
 */

import type { BaconGraph, BaconNode, BaconConnection } from './klatt-runtime';
import type { SemanticsDocument } from './semantics/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormantSpec {
  index: number;
  freqRange: [number, number];
  freqDefault: number;
  bwRange: [number, number];
  bwDefault: number;
  /** ndbScale offset for parallel amplitude — omit for cascade-only formants */
  ndbScale?: number;
  /** Sign alternation for parallel amplitude — omit for cascade-only formants */
  sign?: 1 | -1;
  /** Parallel source node name — omit for cascade-only formants (no parallel resonator/gain) */
  parallelSource?: string;
  bypassAtZero?: boolean;
}

export interface ProximitySpec {
  pair: [number, number];
  offset: number;
}

export interface FormantBankSpec {
  cascade: { input: string; output: string };
  parallel: { output: string };
  proximity: ProximitySpec[];
  formants: FormantSpec[];
}

// ---------------------------------------------------------------------------
// Expansion
// ---------------------------------------------------------------------------

/**
 * Expand formantBanks declarations in a Bacon graph into concrete nodes,
 * connections, semantic params, constants, and realize rules.
 *
 * Mutates `graph` and `semantics` in place.
 */
export function expandFormantBanks(
  graph: BaconGraph,
  semantics: SemanticsDocument,
): void {
  const banks = (graph as any).formantBanks as
    | Record<string, FormantBankSpec>
    | undefined;
  if (!banks) return;

  for (const [bankName, bank] of Object.entries(banks)) {
    const sortedFormants = [...bank.formants].sort(
      (a, b) => a.index - b.index,
    );

    // ------------------------------------------------------------------
    // 1. Generate graph nodes
    // ------------------------------------------------------------------
    for (const f of sortedFormants) {
      const N = f.index;

      // Cascade resonator (always generated)
      const cascadeNode: BaconNode = {
        type: 'resonator',
        params: {
          frequency: { bind: `F${N}` },
          bandwidth: { bind: `B${N}` },
        },
      };
      graph.nodes[`cascadeF${N}`] = cascadeNode;

      // Parallel resonator + gain — only when parallelSource is specified
      if (f.parallelSource) {
        const parallelNode: BaconNode = {
          type: 'resonator',
          params: {
            frequency: { bind: `F${N}` },
            bandwidth: { bind: `B${N}` },
          },
        };
        if (f.bypassAtZero) {
          parallelNode.options = { bypassAtZero: true };
        }
        graph.nodes[`parallelF${N}`] = parallelNode;

        const gainNode: BaconNode = {
          type: 'gain',
          params: {
            gain: { bind: `a${N}Linear` },
          },
        };
        graph.nodes[`parallelF${N}Gain`] = gainNode;
      }
    }

    // ------------------------------------------------------------------
    // 2. Generate cascade chain connections
    // ------------------------------------------------------------------
    if (!graph.connections) graph.connections = [];

    // np -> cascadeF1 -> cascadeF2 -> ... -> cascadeF6 -> cascadeOutGain
    const first = sortedFormants[0];
    graph.connections.push([
      bank.cascade.input,
      `cascadeF${first.index}`,
    ] as BaconConnection);
    for (let i = 0; i < sortedFormants.length - 1; i++) {
      graph.connections.push([
        `cascadeF${sortedFormants[i].index}`,
        `cascadeF${sortedFormants[i + 1].index}`,
      ] as BaconConnection);
    }
    const last = sortedFormants[sortedFormants.length - 1];
    graph.connections.push([
      `cascadeF${last.index}`,
      bank.cascade.output,
    ] as BaconConnection);

    // ------------------------------------------------------------------
    // 3. Generate parallel channel connections (only for formants with parallelSource)
    // ------------------------------------------------------------------
    for (const f of sortedFormants) {
      if (!f.parallelSource) continue;
      const N = f.index;
      graph.connections.push([
        f.parallelSource,
        `parallelF${N}`,
      ] as BaconConnection);
      graph.connections.push([
        `parallelF${N}`,
        `parallelF${N}Gain`,
      ] as BaconConnection);
      graph.connections.push([
        `parallelF${N}Gain`,
        bank.parallel.output,
      ] as BaconConnection);
    }

    // ------------------------------------------------------------------
    // 4. Generate semantics params
    // ------------------------------------------------------------------
    if (!semantics.params) semantics.params = {};
    for (const f of sortedFormants) {
      const N = f.index;
      // Frequency and bandwidth params — always generated
      semantics.params[`F${N}`] = {
        type: 'float',
        range: f.freqRange,
        default: f.freqDefault,
        unit: 'Hz',
      };
      semantics.params[`B${N}`] = {
        type: 'float',
        range: f.bwRange,
        default: f.bwDefault,
        unit: 'Hz',
      };
      // Amplitude param — only for formants with parallel branch
      if (f.parallelSource) {
        semantics.params[`A${N}`] = {
          type: 'float',
          range: [0, 80],
          default: 0,
          unit: 'dB',
        };
      }
    }

    // ------------------------------------------------------------------
    // 5. Preserve bank spec for evaluator-native PFE amplitude computation (Lin 1995)
    // ------------------------------------------------------------------
    // Instead of generating ndbScale constants, proximity rules, and a{N}Linear
    // realize rules, we store the bank spec on semantics so the topological
    // evaluator can compute formant amplitudes natively per-frame using PFE.
    if (!semantics.formantBanks) semantics.formantBanks = {};
    semantics.formantBanks[bankName] = {
      formants: sortedFormants.map(f => ({
        index: f.index,
        freqDefault: f.freqDefault,
        bwDefault: f.bwDefault,
        ndbScale: f.ndbScale,
        sign: f.sign,
        parallelSource: f.parallelSource,
      })),
    };
  }

  // Clean up: remove the formantBanks key from the graph
  delete (graph as any).formantBanks;
}
