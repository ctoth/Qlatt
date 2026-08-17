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
import { generatePfeRules } from './semantics/pfe-codegen';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Source schema
// ---------------------------------------------------------------------------

const nonEmptyString = z.string().min(1);
const finiteNumber = z.number().finite();

const numericRangeSchema = z.tuple([finiteNumber, finiteNumber]).superRefine(
  ([minimum, maximum], context) => {
    if (minimum > maximum) {
      context.addIssue({
        code: 'custom',
        message: 'range minimum must not exceed maximum',
      });
    }
  },
);

const portRefSchema = z.union([
  nonEmptyString,
  z.strictObject({
    node: nonEmptyString,
    port: z.union([z.number().int().nonnegative(), nonEmptyString]).optional(),
    param: nonEmptyString.optional(),
  }),
]);

const connectionSchema = z.union([
  z.tuple([nonEmptyString, nonEmptyString]),
  z.strictObject({
    from: portRefSchema,
    to: portRefSchema,
  }),
]);

const formantSchema = z.strictObject({
  index: z.number().int().positive(),
  freqRange: numericRangeSchema,
  freqDefault: finiteNumber,
  bwRange: numericRangeSchema,
  bwDefault: finiteNumber,
  /** Lin 1995 / Klatt 1980 parallel-amplitude scale offset. */
  ndbScale: finiteNumber.optional(),
  /** Lin 1995 partial-fraction sign alternation. */
  sign: z.union([z.literal(1), z.literal(-1)]).optional(),
  parallelSource: nonEmptyString.optional(),
  bypassAtZero: z.boolean().optional(),
}).superRefine((formant, context) => {
  const [freqMinimum, freqMaximum] = formant.freqRange;
  if (formant.freqDefault < freqMinimum || formant.freqDefault > freqMaximum) {
    context.addIssue({
      code: 'custom',
      path: ['freqDefault'],
      message: 'frequency default must be inside freqRange',
    });
  }

  const [bwMinimum, bwMaximum] = formant.bwRange;
  if (formant.bwDefault < bwMinimum || formant.bwDefault > bwMaximum) {
    context.addIssue({
      code: 'custom',
      path: ['bwDefault'],
      message: 'bandwidth default must be inside bwRange',
    });
  }

  if (formant.parallelSource !== undefined) {
    if (formant.ndbScale === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['ndbScale'],
        message: 'parallel formants require ndbScale',
      });
    }
    if (formant.sign === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['sign'],
        message: 'parallel formants require sign',
      });
    }
    return;
  }

  const parallelOnlyFields: ReadonlyArray<'ndbScale' | 'sign' | 'bypassAtZero'> = [
    'ndbScale',
    'sign',
    'bypassAtZero',
  ];
  for (const field of parallelOnlyFields) {
    if (formant[field] !== undefined) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} requires parallelSource`,
      });
    }
  }
});

const formantBankSchema = z.strictObject({
  cascade: z.strictObject({ input: nonEmptyString, output: nonEmptyString }),
  parallel: z.strictObject({ output: nonEmptyString }),
  formants: z.array(formantSchema).min(1),
  /**
   * Extra connections that reference bank-generated nodes. This is retained
   * until the compiler exposes semantic attachment points for such modulation.
   */
  connections: z.array(connectionSchema).optional(),
}).superRefine((bank, context) => {
  const seen = new Set<number>();
  bank.formants.forEach((formant, index) => {
    if (seen.has(formant.index)) {
      context.addIssue({
        code: 'custom',
        path: ['formants', index, 'index'],
        message: `duplicate formant index ${formant.index}`,
      });
    }
    seen.add(formant.index);
  });
});

export const formantBanksSchema = z.record(nonEmptyString, formantBankSchema).superRefine(
  (banks, context) => {
    const count = Object.keys(banks).length;
    if (count !== 1) {
      context.addIssue({
        code: 'custom',
        message: `exactly one formant bank is supported; received ${count}`,
      });
    }
  },
);

export type FormantSpec = z.infer<typeof formantSchema>;
export type FormantBankSpec = z.infer<typeof formantBankSchema>;
export type FormantBanks = z.infer<typeof formantBanksSchema>;

export interface FormantBankValidationIssue {
  path: string;
  message: string;
}

export class FormantBankValidationError extends Error {
  readonly code = 'E_FORMANT_BANK_SCHEMA';
  readonly issues: readonly FormantBankValidationIssue[];

  constructor(issues: FormantBankValidationIssue[]) {
    const detail = issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ');
    super(`E_FORMANT_BANK_SCHEMA ${detail}`);
    this.name = 'FormantBankValidationError';
    this.issues = issues;
  }
}

/** Validate Qlatt-owned formant-bank extension data at the YAML boundary. */
export function parseFormantBanks(value: unknown): FormantBanks {
  const result = formantBanksSchema.safeParse(value);
  if (result.success) return result.data;

  throw new FormantBankValidationError(
    result.error.issues.map((issue) => ({
      path: ['meta', 'formantBanks', ...issue.path].join('.'),
      message: issue.message,
    })),
  );
}

function failContract(code: string, path: string, message: string): never {
  throw new Error(`${code} ${path}: ${message}`);
}

function hasOwn(record: object | undefined, key: string): boolean {
  return record !== undefined && Object.prototype.hasOwnProperty.call(record, key);
}

function connectionNodeIds(connection: BaconConnection): [string, string] {
  if (Array.isArray(connection)) return connection;
  const from = typeof connection.from === 'string' ? connection.from : connection.from.node;
  const to = typeof connection.to === 'string' ? connection.to : connection.to.node;
  return [from, to];
}

function validateExpansionContract(
  graph: BaconGraph,
  semantics: SemanticsDocument,
  banks: FormantBanks,
): void {
  const declaredNodes = new Set(Object.keys(graph.nodes));
  const generatedNodes = new Set<string>();

  for (const [bankName, bank] of Object.entries(banks)) {
    const requiredNodes = [bank.cascade.input, bank.cascade.output, bank.parallel.output];
    for (const formant of bank.formants) {
      requiredNodes.push(formant.parallelSource ?? '');
      const generatedForFormant = [`cascadeF${formant.index}`];
      if (formant.parallelSource !== undefined) {
        generatedForFormant.push(`parallelF${formant.index}`, `parallelF${formant.index}Gain`);
      }

      for (const nodeId of generatedForFormant) {
        if (declaredNodes.has(nodeId) || generatedNodes.has(nodeId)) {
          failContract(
            'E_FORMANT_BANK_COLLISION',
            `meta.formantBanks.${bankName}.formants`,
            `generated node '${nodeId}' already exists`,
          );
        }
        generatedNodes.add(nodeId);
      }

      for (const paramName of [`F${formant.index}`, `B${formant.index}`]) {
        if (hasOwn(semantics.params, paramName)) {
          failContract(
            'E_FORMANT_BANK_COLLISION',
            `meta.formantBanks.${bankName}.formants`,
            `generated parameter '${paramName}' already exists`,
          );
        }
      }

      if (formant.parallelSource !== undefined) {
        const amplitudeParam = `A${formant.index}`;
        const realizationName = `a${formant.index}Linear`;
        if (hasOwn(semantics.params, amplitudeParam)) {
          failContract(
            'E_FORMANT_BANK_COLLISION',
            `meta.formantBanks.${bankName}.formants`,
            `generated parameter '${amplitudeParam}' already exists`,
          );
        }
        if (hasOwn(semantics.realize, realizationName)) {
          failContract(
            'E_FORMANT_BANK_COLLISION',
            `meta.formantBanks.${bankName}.formants`,
            `generated realization '${realizationName}' already exists`,
          );
        }
      }
    }

    for (const [index, nodeId] of requiredNodes.entries()) {
      if (nodeId.length > 0 && !declaredNodes.has(nodeId)) {
        failContract(
          'E_FORMANT_BANK_REFERENCE',
          `meta.formantBanks.${bankName}`,
          `referenced node '${nodeId}' does not exist (reference ${index + 1})`,
        );
      }
    }

    const availableNodes = new Set([...declaredNodes, ...generatedNodes]);
    for (const connection of bank.connections ?? []) {
      for (const nodeId of connectionNodeIds(connection)) {
        if (!availableNodes.has(nodeId)) {
          failContract(
            'E_FORMANT_BANK_REFERENCE',
            `meta.formantBanks.${bankName}.connections`,
            `referenced node '${nodeId}' does not exist`,
          );
        }
      }
    }
  }
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
  // formantBanks is Qlatt macro data, carried in the graph's `meta` extension
  // point (Bacon IR graphs allow only their own keys at top level)
  const source = graph.meta?.formantBanks;
  if (source === undefined) return;
  const banks = parseFormantBanks(source);
  validateExpansionContract(graph, semantics, banks);

  for (const [, bank] of Object.entries(banks)) {
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
    // 3b. Append the bank's declared extra connections (references to
    // generated nodes, e.g. aeroModel -> cascadeF1.bandwidth)
    // ------------------------------------------------------------------
    if (bank.connections) {
      graph.connections.push(...bank.connections);
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
    // 5. Compile Lin (1995) PFE amplitudes into ordinary semantics rules.
    // ------------------------------------------------------------------
    // Expansion runs before interpreter construction, so generated bindings
    // participate in the same realization and scheduling contract as authored
    // rules. Validation above rejects authored/generated name collisions.
    if (!semantics.realize) semantics.realize = {};
    const pfeRules = generatePfeRules(sortedFormants);
    Object.assign(semantics.realize, pfeRules);
  }

  // Clean up: remove the formantBanks key from the graph meta
  if (graph.meta) delete graph.meta.formantBanks;
}
