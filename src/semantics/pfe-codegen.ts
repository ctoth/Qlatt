/**
 * PFE Codegen — generates CEL realize rules for parallel formant amplitude computation.
 *
 * Reads formantBanks spec from semantics.yaml and produces one CEL realize rule
 * per parallel-source formant. Each rule computes:
 *
 *   a{i}Linear = sign * dbToLinear(A{i} + sum_of_corrections + ndbScale) * parallelScale
 *
 * where sum_of_corrections is the sum of resonatorMagnitudeDb(F{i}, F{j}, B{j}, sampleRate)
 * for each formant j != i in the bank.
 *
 * This replaces the imperative PFE loop that was in topological-evaluator.ts.
 *
 * Citation: Lin 1995 (Partial Fraction Expansion for parallel formant amplitudes)
 * Citation: Klatt 1980 (original synthesizer specification)
 */

import type { FormantBankEvalSpec, RealizationRule } from './types';

/**
 * Generate CEL realize rules for PFE-based parallel formant amplitude computation.
 *
 * For each formant with parallelSource in each bank, builds a CEL expression
 * that produces exactly the same computation as the former imperative loop:
 *
 * - evalFreq = F{idx} (from context; defaults handled by param defaults)
 * - ampDb = A{idx} (from context; defaults to 0 via param default)
 * - correctionDb = sum of resonatorMagnitudeDb(F{i}, F{j}, B{j}, sampleRate) for j != i
 * - result = sign * dbToLinear(ampDb + correctionDb + ndbScale) * parallelScale
 */
export function generatePfeRules(
  formantBanks: Record<string, FormantBankEvalSpec>,
): Record<string, RealizationRule> {
  const rules: Record<string, RealizationRule> = {};

  for (const [, bank] of Object.entries(formantBanks)) {
    const formants = bank.formants;

    for (let i = 0; i < formants.length; i++) {
      const f = formants[i];
      if (!f.parallelSource) continue;

      const idx = f.index;
      const ndbScaleVal = f.ndbScale ?? 0;
      const sign = f.sign ?? 1;

      // Build the correction sum: resonatorMagnitudeDb(F{i}, F{j}, B{j}, sampleRate) for each j != i
      const correctionTerms: string[] = [];
      for (let j = 0; j < formants.length; j++) {
        if (j === i) continue;
        const jIdx = formants[j].index;
        correctionTerms.push(`resonatorMagnitudeDb(F${idx}, F${jIdx}, B${jIdx}, sampleRate)`);
      }

      // Build the full expression:
      // sign * dbToLinear(A{idx} + (correction1 + correction2 + ...) + ndbScale) * parallelScale
      const correctionExpr = correctionTerms.length > 0
        ? correctionTerms.join(' + ')
        : '0';

      // Use literal numbers for sign and ndbScale (they come from the spec, not runtime)
      const innerExpr = `A${idx} + (${correctionExpr}) + (${ndbScaleVal})`;
      let expr: string;
      if (sign === 1) {
        expr = `dbToLinear(${innerExpr}) * parallelScale`;
      } else if (sign === -1) {
        expr = `-(dbToLinear(${innerExpr}) * parallelScale)`;
      } else {
        expr = `(${sign}) * dbToLinear(${innerExpr}) * parallelScale`;
      }

      // Collect deps: A{i}, F{i}, all other F{j}/B{j}, sampleRate, parallelScale
      const deps: string[] = [`A${idx}`, `F${idx}`];
      for (let j = 0; j < formants.length; j++) {
        if (j === i) continue;
        const jIdx = formants[j].index;
        if (!deps.includes(`F${jIdx}`)) deps.push(`F${jIdx}`);
        deps.push(`B${jIdx}`);
      }
      deps.push('sampleRate', 'parallelScale');

      rules[`a${idx}Linear`] = { expr, deps };
    }
  }

  return rules;
}
