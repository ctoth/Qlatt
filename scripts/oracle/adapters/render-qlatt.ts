#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { OracleAdapterInput, OracleArtifact } from "../types";

type ParsedArgs = OracleAdapterInput;

function parseArgv(argv: string[]): ParsedArgs {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(arg.slice(2), next);
      i += 1;
      continue;
    }
    flags.set(arg.slice(2), "true");
  }

  if (flags.has("help")) {
    throw new Error(
      "Usage: render-qlatt --phrase-id id --phrase text --out-dir dir [--frontend-id dectalk-english] [--rate 1]",
    );
  }

  if (!flags.has("phrase-id") || !flags.has("phrase") || !flags.has("out-dir")) {
    throw new Error("Missing required flags --phrase-id, --phrase, or --out-dir");
  }

  return {
    phraseId: flags.get("phrase-id") as string,
    phrase: flags.get("phrase") as string,
    outDir: path.resolve(flags.get("out-dir") as string),
    voiceId: flags.get("voice"),
    rate: flags.get("rate") ? Number(flags.get("rate")) : undefined,
    sampleRate: flags.get("sample-rate") ? Number(flags.get("sample-rate")) : undefined,
    baseF0: flags.get("base-f0") ? Number(flags.get("base-f0")) : undefined,
    frontendId: flags.get("frontend-id"),
    transitionMs: flags.get("transition-ms")
      ? Number(flags.get("transition-ms"))
      : undefined,
  };
}

function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? -1 });
    });
  });
}

function normalizeQlattRate(input: OracleAdapterInput): number {
  const requestedRate = Number.isFinite(input.rate) ? (input.rate as number) : 1;
  const frontendId = input.frontendId ?? "dectalk-english";
  if (frontendId !== "dectalk-english") {
    return requestedRate;
  }

  // The DECtalk oracle corpus uses raw [:ra N] WPM controls. The Qlatt frontend
  // API expects a normalized multiplier, and dectalk-english/frontend.yaml keeps
  // rate_reference at 1.0 specifically so WPM normalization stays in this adapter.
  // DECtalk 4.63 samples use [:ra 180] as the neutral/default corpus rate.
  return requestedRate > 10 ? requestedRate / 180 : requestedRate;
}

export async function renderQlatt(input: OracleAdapterInput): Promise<OracleArtifact> {
  fs.mkdirSync(input.outDir, { recursive: true });

  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
  );
  const wavPath = path.join(input.outDir, "qlatt.wav");
  const renderPayloadPath = path.join(input.outDir, "qlatt.json");
  const metadataPath = path.join(input.outDir, "qlatt.artifact.json");
  const stdoutPath = path.join(input.outDir, "qlatt.stdout.log");
  const stderrPath = path.join(input.outDir, "qlatt.stderr.log");
  const qlattRate = normalizeQlattRate(input);

  const args = [
    "--loader",
    "ts-node/esm/transpile-only",
    "--experimental-specifier-resolution=node",
    "scripts/render-phrase.ts",
    "--phrase",
    input.phrase,
    "--out-json",
    renderPayloadPath,
    "--out-wav",
    wavPath,
    "--write-golden",
    "1",
    "--include-track",
    "1",
    "--engine",
    "runtime",
    "--host",
    "node",
    "--frontend-id",
    input.frontendId ?? "dectalk-english",
    "--experiment-id",
    input.frontendId ?? "dectalk-english",
    "--rate",
    String(qlattRate),
    "--sample-rate",
    String(input.sampleRate ?? 22050),
    "--transition-ms",
    String(input.transitionMs ?? 30),
    // Oracle renders should compare model timing, not host transport padding.
    "--tail-time",
    "0",
  ];

  if (Number.isFinite(input.baseF0)) {
    args.push("--base-f0", String(input.baseF0));
  }

  const started = Date.now();
  const result = await runCommand(process.execPath, args, repoRoot);
  const durationMs = Date.now() - started;

  fs.writeFileSync(stdoutPath, result.stdout, "utf8");
  fs.writeFileSync(stderrPath, result.stderr, "utf8");

  const notes: string[] = [];
  if (Number.isFinite(input.rate) && qlattRate !== input.rate) {
    notes.push(
      `Mapped DECtalk rate ${input.rate} WPM to Qlatt normalized rate ${qlattRate}.`,
    );
  }
  if (!fs.existsSync(wavPath)) {
    notes.push("Qlatt WAV was not produced.");
  }
  if (!fs.existsSync(renderPayloadPath)) {
    notes.push("Qlatt render payload was not produced.");
  }

  const artifact: OracleArtifact = {
    engineId: "qlatt",
    adapterId: "render-qlatt",
    phraseId: input.phraseId,
    phrase: input.phrase,
    ...(input.voiceId ? { voiceId: input.voiceId } : {}),
    ...(Number.isFinite(input.rate) ? { rate: input.rate } : {}),
    ...(Number.isFinite(input.sampleRate) ? { sampleRate: input.sampleRate } : {}),
    wavPath,
    metadataPath,
    stdoutPath,
    stderrPath,
    durationMs,
    exitCode: result.exitCode,
    command: [process.execPath, ...args],
    notes,
    extraPaths: {
      stdout: stdoutPath,
      stderr: stderrPath,
      renderPayload: renderPayloadPath,
    },
  };

  fs.writeFileSync(metadataPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  if (artifact.exitCode !== 0) {
    throw new Error(`Qlatt render failed with exit code ${artifact.exitCode}`);
  }

  return artifact;
}

async function main(): Promise<number> {
  try {
    const args = parseArgv(process.argv.slice(2));
    const artifact = await renderQlatt(args);
    process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().then((code) => process.exit(code));
}
