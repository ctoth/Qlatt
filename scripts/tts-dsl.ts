#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runExplainCli } from "./explain-phrase";

type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

function defaultIo(): CliIo {
  return {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  };
}

function replaceRuleFlag(args: readonly string[]): string[] {
  const output: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value !== "--rule") {
      output.push(value);
      continue;
    }
    const rule = args[index + 1];
    if (!rule || rule.startsWith("--")) throw new Error("--rule requires a rule name");
    output.push("--why-not", rule);
    index += 1;
  }
  return output;
}

export async function runTtsDslCli(
  argv: readonly string[],
  io: CliIo = defaultIo(),
): Promise<number> {
  try {
    const [command, ...rest] = argv;
    if (!command)
      throw new Error("Usage: tts-dsl <phases|field|why-not|replay|explain> <phrase> [flags]");
    const common = ["--format", "json", "--tooling-only"];
    switch (command) {
      case "phases":
        return runExplainCli([...rest, ...common, "--phase-views", "--verify-replay"], io);
      case "field":
        return runExplainCli([...rest, ...common], io);
      case "why-not":
        return runExplainCli([...replaceRuleFlag(rest), ...common], io);
      case "replay":
        return runExplainCli([...rest, ...common, "--verify-replay"], io);
      case "explain":
        return runExplainCli([...rest, "--format", "json"], io);
      default:
        throw new Error(`Unknown tts-dsl command '${command}'`);
    }
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
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
