#!/usr/bin/env node
/** Run with node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/lint-rules.ts [--strict]. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getRulepackValidationDiagnostics,
  listBundledFrontendIds,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";

type CliIo = { stdout: (text: string) => void; stderr: (text: string) => void };

export function runRuleLint(
  argv: string[],
  io: CliIo = {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  },
): number {
  const unknown = argv.find((arg) => arg !== "--strict");
  if (unknown) {
    io.stderr(`Unknown argument '${unknown}'; usage: lint-rules.ts [--strict]\n`);
    return 1;
  }
  let warnings = 0;
  let failed = false;
  const ids = listBundledFrontendIds();
  for (const id of ids) {
    try {
      // The loader validates after includes/inheritance with inventory, tag,
      // and lowering requirements. Reuse its diagnostics rather than revalidate.
      const spec = loadBundledRulepackSpec(id);
      for (const diagnostic of getRulepackValidationDiagnostics(spec)) {
        io.stdout(`${id}: ${diagnostic.code} at ${diagnostic.path}: ${diagnostic.message}\n`);
        if (diagnostic.severity === "warning") warnings += 1;
      }
    } catch (error) {
      failed = true;
      io.stderr(`${id}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }
  io.stdout(`checked ${ids.length} frontends | warnings=${warnings}\n`);
  return failed ? 1 : argv.includes("--strict") && warnings > 0 ? 2 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runRuleLint(process.argv.slice(2));
}
