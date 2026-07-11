#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializePhonemeTarget } from "../src/declarative-frontend/inventory";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import { validateDslSpec } from "../src/declarative-frontend/validation";
import {
  buildPhaseSnapshots,
  diffPhaseState,
  explainField,
  whyNotRule,
} from "../src/declarative-frontend/tooling";

type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  readStdin: () => string;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_RULEPACK_PATH = path.resolve(
  SCRIPT_DIR,
  "../public/rules/frontend.yaml"
);

function defaultIo(): CliIo {
  return {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
    readStdin: () => fs.readFileSync(0, "utf8"),
  };
}

function printUsage(io: CliIo) {
  io.stderr(
    "USAGE: tts-dsl <run|validate|explain|why-not|diff> [options]\n" +
      "  --spec <file>   DSL spec path (YAML/JSON)\n" +
      "  --format <fmt>  text|json (default: json)\n"
  );
}

function parseArgv(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (arg === "-s" || arg === "--spec") {
      flags.spec = argv[++i];
      continue;
    }
    if (arg === "-o" || arg === "--output") {
      flags.output = argv[++i];
      continue;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("-") ? argv[++i] : "true";
      flags[key] = value;
      continue;
    }
    positional.push(arg);
  }
  return { positional, flags };
}

function readTextInput(inputArg: string, io: CliIo) {
  if (!inputArg) throw new Error("Missing input argument");
  if (inputArg === "-") return io.readStdin();
  if (fs.existsSync(inputArg)) return fs.readFileSync(inputArg, "utf8");
  return inputArg;
}

function readInputSequence(inputArg: string, io: CliIo) {
  const raw = readTextInput(inputArg, io);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.sequence)) return parsed.sequence;
  } catch {
    // fall through
  }
  throw new Error(
    "Input must be a JSON token array or JSON object with { sequence }. Use --input-format text in future extension."
  );
}

function loadSpec(specPath: string | null) {
  const resolved = specPath ? path.resolve(specPath) : DEFAULT_RULEPACK_PATH;
  const source = fs.readFileSync(resolved, "utf8");
  return parseDslSpec(source);
}

function render(value: unknown, format = "json") {
  if (format === "text") {
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value, null, 2);
}

function writeOutput(io: CliIo, text: string, outputPath?: string) {
  if (outputPath) {
    fs.writeFileSync(outputPath, text, "utf8");
    return;
  }
  io.stdout(`${text}\n`);
}

function computeRunPhases(spec: any, flags: Record<string, string>) {
  const all = spec.phases.map((phase: any) => phase.name);
  if (typeof flags.only === "string" && flags.only.length > 0) {
    const wanted = new Set(flags.only.split(",").map((name) => name.trim()).filter(Boolean));
    return all.filter((name: string) => wanted.has(name));
  }

  let phases = all.slice();
  if (typeof flags.skip === "string" && flags.skip.length > 0) {
    const skip = new Set(flags.skip.split(",").map((name) => name.trim()).filter(Boolean));
    phases = phases.filter((name: string) => !skip.has(name));
  }
  if (typeof flags["stop-after"] === "string" && flags["stop-after"].length > 0) {
    const stopIndex = phases.indexOf(flags["stop-after"]);
    if (stopIndex >= 0) phases = phases.slice(0, stopIndex + 1);
  }
  return phases;
}

export async function runTtsDslCli(argv: string[], io: CliIo = defaultIo()) {
  const command = argv[0];
  if (!command) {
    printUsage(io);
    return 1;
  }

  const { positional, flags } = parseArgv(argv.slice(1));
  const format = flags.format ?? "json";

  try {
    if (command === "validate") {
      const specPath = positional[0] ?? flags.spec ?? null;
      const spec = loadSpec(specPath);
      const diagnostics = validateDslSpec(spec);
      const payload = {
        valid: diagnostics.filter((d) => d.severity === "error").length === 0,
        diagnostics,
      };
      writeOutput(io, render(payload, format), flags.output);
      return 0;
    }

    if (command === "run") {
      const input = readInputSequence(positional[0], io);
      const spec = loadSpec(flags.spec ?? null);
      const phases = computeRunPhases(spec, flags);
      const result = runRuleEngine(input, compileRuleEngineSpec(spec), {
        phases,
        inventoryResolver: materializePhonemeTarget,
      });
      if (typeof flags.trace === "string" && flags.trace.length > 0) {
        fs.writeFileSync(flags.trace, JSON.stringify(result.trace, null, 2), "utf8");
      }
      writeOutput(io, render(result.sequence, format), flags.output);
      return 0;
    }

    if (command === "explain") {
      const input = readInputSequence(positional[0], io);
      const selector = flags.token;
      const field = flags.field;
      if (!selector || !field) {
        throw new Error("explain requires --token and --field");
      }
      const spec = loadSpec(flags.spec ?? null);
      const snapshots = buildPhaseSnapshots(input, spec, {
        inventoryResolver: materializePhonemeTarget,
      });
      const payload = explainField(snapshots, selector, field, flags.phase ?? "final");
      writeOutput(io, render(payload, format), flags.output);
      return 0;
    }

    if (command === "why-not") {
      const input = readInputSequence(positional[0], io);
      const rule = flags.rule;
      const selector = flags.token;
      if (!rule || !selector) {
        throw new Error("why-not requires --rule and --token");
      }
      const spec = loadSpec(flags.spec ?? null);
      const payload = whyNotRule(input, spec, selector, rule, flags.phase ?? null, {
        inventoryResolver: materializePhonemeTarget,
      });
      writeOutput(io, render(payload, format), flags.output);
      return 0;
    }

    if (command === "diff") {
      const input = readInputSequence(positional[0], io);
      const from = flags.from;
      const to = flags.to;
      if (!from || !to) {
        throw new Error("diff requires --from and --to");
      }
      const spec = loadSpec(flags.spec ?? null);
      const snapshots = buildPhaseSnapshots(input, spec, {
        inventoryResolver: materializePhonemeTarget,
      });
      const payload = diffPhaseState(snapshots, from, to, flags.stream ?? null);
      writeOutput(io, render(payload, format), flags.output);
      return 0;
    }

    printUsage(io);
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runTtsDslCli(process.argv.slice(2)).then((code) => {
    process.exit(code);
  });
}
