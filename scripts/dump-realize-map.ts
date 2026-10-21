#!/usr/bin/env node
/**
 * Print an experiment's final `realize` map as stable, key-sorted JSON.
 *
 * The experiment is loaded the way the app loads it (`loadExperimentConfig`:
 * manifest lookup, inheritance, macro expansion and validation). `prepared`
 * is the checked realize map the runtime evaluates. `evaluated` holds values and errors for
 * a few probe frames. Diff two runs to prove a semantics.yaml refactor leaves
 * the realize rules and their values unchanged.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/dump-realize-map.ts <experiment-id> [--out <file>] [--with-order]
 */
import { writeFileSync } from "node:fs";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";

type ParsedArgs = {
  experimentId: string;
  out?: string;
  withOrder: boolean;
};

function parseArgv(argv: string[]): ParsedArgs {
  const outIndex = argv.indexOf("--out");
  const out = outIndex >= 0 ? argv[outIndex + 1] : undefined;
  if (outIndex >= 0 && !out) throw new Error("--out requires a file path");
  const positional = argv.filter(
    (value, index) =>
      !(outIndex >= 0 && (index === outIndex || index === outIndex + 1)) &&
      value !== "--with-order",
  );
  if (positional.length !== 1) {
    throw new Error("Usage: dump-realize-map.ts <experiment-id> [--out <file>] [--with-order]");
  }
  return { experimentId: positional[0], out, withOrder: argv.includes("--with-order") };
}

/** Recursively sort object keys; arrays keep their authored order. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortKeys(record[key])]),
    );
  }
  return value;
}

/**
 * Probe frames for the `evaluated` section. They are not phonetic targets;
 * they only exercise both arms of the rules' conditionals (voiced, legacy
 * frication, aerodynamic frication with and without a front cavity) so that a
 * change in evaluation order which altered a value would show up in the diff.
 */
function probeFrames(): Record<string, Record<string, number>> {
  const formants: Record<string, number> = {};
  for (let index = 1; index <= 10; index++) {
    formants[`F${index}`] = 500 + (index - 1) * 1000;
    formants[`B${index}`] = 100;
    formants[`A${index}`] = 40;
  }
  const base = { ...formants, sampleRate: 48000, GO: 47 };
  return {
    defaults: {},
    voiced: { ...base, F0: 120, AV: 60, SW: 0 },
    legacyFrication: { ...base, AF: 55, AH: 40, SW: 1 },
    aerodynamicFrication: {
      ...base,
      AF: 55,
      SW: 1,
      Ac: 0.1,
      Ug: 300,
      fricationMode: 1,
      fricFrontCavityCm: 1.2,
    },
    aerodynamicFricationNoCavity: {
      ...base,
      AF: 55,
      SW: 1,
      Ac: 0.1,
      Ug: 300,
      fricationMode: 1,
      fricFrontCavityCm: 0,
    },
  };
}

/**
 * Rules whose expression names another realize rule that is missing from
 * their `deps`. Such a rule reads whatever value the evaluation order happens
 * to have produced, so its result depends on key order; an empty report means
 * reordering the map cannot change any realized value.
 */
function undeclaredRealizeDeps(realize: Record<string, unknown>): Record<string, string[]> {
  const report: Record<string, string[]> = {};
  for (const [name, rule] of Object.entries(realize)) {
    const expr = typeof rule === "string" ? rule : (rule as { expr: string }).expr;
    const deps = new Set(
      typeof rule === "string" ? [] : ((rule as { deps?: string[] }).deps ?? []),
    );
    // Identifiers not reached through member access (`ndbScale.AV` reads a constant field).
    const identifiers = expr.match(/(?<![.\w])[A-Za-z_]\w*/g) ?? [];
    const missing = [
      ...new Set(
        identifiers.filter(
          (identifier) =>
            identifier !== name && Object.hasOwn(realize, identifier) && !deps.has(identifier),
        ),
      ),
    ];
    if (missing.length > 0) report[name] = missing;
  }
  return report;
}

async function main(argv: string[]): Promise<number> {
  const args = parseArgv(argv);
  const { semantics } = await loadExperimentConfig(args.experimentId);
  // Report any top-level key that is not a plain realize consumer's input, so
  // a load-time construct that failed to expand shows up in the diff.
  const topLevelKeys = Object.keys(semantics).sort();

  const { topoEvaluator } = createConfiguredEvaluator();
  const evaluated: Record<string, unknown> = {};
  for (const [name, params] of Object.entries(probeFrames())) {
    const result = topoEvaluator.evaluate(semantics, {
      params,
      constants: semantics.constants ?? {},
    });
    evaluated[name] = { values: result.values, errors: result.errors };
  }

  const report = sortKeys({
    experiment: args.experimentId,
    topLevelKeys,
    prepared: semantics.realize ?? {},
    evaluated,
    // Arrays keep their order. Authored key order and the derived evaluation
    // order are reported only on request: moving a rule changes both without
    // changing the map.
    ...(args.withOrder
      ? {
          undeclaredRealizeDeps: undeclaredRealizeDeps(semantics.realize ?? {}),
          keyOrder: Object.keys(semantics.realize ?? {}),
          evaluationOrder: topoEvaluator.getEvaluationOrder(semantics),
        }
      : {}),
  });
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) {
    writeFileSync(args.out, text);
    console.log(
      `${args.experimentId}: ${Object.keys(loaded).length} loaded rules, ` +
        `${Object.keys(semantics.realize ?? {}).length} after formant banks -> ${args.out}`,
    );
  } else {
    process.stdout.write(text);
  }
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
