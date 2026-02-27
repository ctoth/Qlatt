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
  ndbScale: number;
  sign: 1 | -1;
  parallelSource: string;
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

  for (const [, bank] of Object.entries(banks)) {
    const sortedFormants = [...bank.formants].sort(
      (a, b) => a.index - b.index,
    );

    // ------------------------------------------------------------------
    // 1. Generate graph nodes
    // ------------------------------------------------------------------
    for (const f of sortedFormants) {
      const N = f.index;

      // Cascade resonator
      const cascadeNode: BaconNode = {
        type: 'resonator',
        params: {
          frequency: { bind: `F${N}` },
          bandwidth: { bind: `B${N}` },
        },
      };
      graph.nodes[`cascadeF${N}`] = cascadeNode;

      // Parallel resonator
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

      // Parallel gain
      const gainNode: BaconNode = {
        type: 'gain',
        params: {
          gain: { bind: `a${N}Linear` },
        },
      };
      graph.nodes[`parallelF${N}Gain`] = gainNode;
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
    // 3. Generate parallel channel connections
    // ------------------------------------------------------------------
    for (const f of sortedFormants) {
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
      semantics.params[`A${N}`] = {
        type: 'float',
        range: [0, 80],
        default: 0,
        unit: 'dB',
      };
    }

    // ------------------------------------------------------------------
    // 5. Generate semantics constants (ndbScale entries)
    // ------------------------------------------------------------------
    if (!semantics.constants) semantics.constants = {};
    if (!semantics.constants.ndbScale) {
      semantics.constants.ndbScale = {} as Record<string, number>;
    }
    const ndbScale = semantics.constants.ndbScale as Record<string, number>;
    for (const f of sortedFormants) {
      ndbScale[`A${f.index}`] = f.ndbScale;
    }

    // ------------------------------------------------------------------
    // 6. Generate proximity correction realize rules
    // ------------------------------------------------------------------
    if (!semantics.realize) semantics.realize = {};
    for (const prox of bank.proximity) {
      const [lo, hi] = prox.pair;
      const name = `n${lo}${hi}Cor`;
      const expr =
        prox.offset === 0
          ? `proximity(F${hi} - F${lo})`
          : `proximity(F${hi} - F${lo} - ${prox.offset})`;
      semantics.realize[name] = {
        expr,
        deps: [`F${lo}`, `F${hi}`],
      };
    }

    // ------------------------------------------------------------------
    // 7. Generate a{N}Linear realize rules
    // ------------------------------------------------------------------

    // Build correction terms per formant index
    const correctionTerms = new Map<number, string[]>();
    for (const prox of bank.proximity) {
      const [lo, hi] = prox.pair;
      const corrName = `n${lo}${hi}Cor`;

      // lo formant gets corrName (multiplier 1)
      if (!correctionTerms.has(lo)) correctionTerms.set(lo, []);
      correctionTerms.get(lo)!.push(corrName);

      // hi formant gets corrName * 2 (multiplier 2)
      if (!correctionTerms.has(hi)) correctionTerms.set(hi, []);
      correctionTerms.get(hi)!.push(`${corrName} * 2`);
    }

    for (const f of sortedFormants) {
      const N = f.index;
      const corrections = correctionTerms.get(N) || [];
      const prefix = f.sign === -1 ? '-' : '';

      const parts: string[] = [`A${N}`];
      if (corrections.length > 0) {
        parts.push(...corrections);
      }
      parts.push(`ndbScale.A${N}`);

      const inner = parts.join(' + ');
      const expr = `${prefix}dbToLinear(${inner}) * parallelScale`;

      // Build deps
      const deps: string[] = [`A${N}`];
      // Add all correction rule names used
      for (const corr of corrections) {
        // Strip " * 2" suffix to get the dep name
        const depName = corr.replace(/ \* 2$/, '');
        if (!deps.includes(depName)) deps.push(depName);
      }
      deps.push('parallelScale');

      semantics.realize[`a${N}Linear`] = { expr, deps };
    }
  }

  // Clean up: remove the formantBanks key from the graph
  delete (graph as any).formantBanks;
}
