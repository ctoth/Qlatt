#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";

type ParsedArgs = {
  phrase: string;
};

function parseArgv(argv: string[]): ParsedArgs {
  const phraseFlagIndex = argv.findIndex((value) => value === "--phrase");
  const phrase =
    phraseFlagIndex >= 0 && argv[phraseFlagIndex + 1]
      ? argv[phraseFlagIndex + 1]
      : argv.join(" ").trim();
  if (!phrase) {
    throw new Error("Missing phrase. Use --phrase \"...\".");
  }
  return { phrase };
}

async function main(argv: string[]): Promise<number> {
  const args = parseArgv(argv);
  const diagnostics = createDiagnostics();
  const provenance = createProvenanceCollector();
  const { track } = textToKlattTrackDetailed(args.phrase, 110, 30, {
    provenance,
    diagnostics,
  });
  const { semantics } = await loadExperimentConfig("klatt80-baseline");
  const { topoEvaluator } = createConfiguredEvaluator();

  const frames = track.map((frame, index) => {
    const realized = topoEvaluator.evaluate(semantics, {
      params: frame.params,
      constants: semantics.constants ?? {},
    }).values;
    return {
      index,
      time: Number(frame.time.toFixed(4)),
      phoneme: frame.phoneme ?? null,
      nasalCoupling: Number((frame.params.nasalCoupling ?? 0).toFixed(4)),
      nasalCoreFnz: realized.nasalCoreFnz ?? null,
      nasalCoreFnzTarget: realized.nasalCoreFnzTarget ?? null,
      nasalPlaceFnz: realized.nasalPlaceFnz ?? null,
      nasalPlaceBnz: realized.nasalPlaceBnz ?? null,
    };
  });

  const decisions = provenance.getDecisions().filter((decision) => decision.type.startsWith("nasal_"));
  const output = {
    phrase: args.phrase,
    frames,
    diagnostics: diagnostics.getEntries().map((entry) => ({
      level: entry.level,
      code: entry.code ?? null,
      message: entry.message,
      data: entry.data ?? null,
    })),
    provenance: decisions,
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  return 0;
}

const isMain =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main(process.argv.slice(2)).then((code) => process.exit(code)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
