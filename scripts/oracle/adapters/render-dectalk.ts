#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDectalkTraceFile } from "../dectalk-trace";
import { parseDectalkUsPhonemeLog } from "../symbolic";
import type { OracleAdapterInput, OracleArtifact } from "../types";

type ParsedArgs = OracleAdapterInput & {
  exePath?: string;
  workDir?: string;
};

const VOICE_PREFIX: Record<string, string> = {
  paul: "[:np]",
  betty: "[:nb]",
  harry: "[:nh]",
  frank: "[:nf]",
  dennis: "[:nd]",
  kit: "[:nk]",
  ursula: "[:nu]",
  rita: "[:nr]",
  wendy: "[:nw]",
};

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
      "Usage: render-dectalk --phrase-id id --phrase text --out-dir dir [--voice paul] [--rate 180] [--exe path] [--workdir dir]",
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
    exePath: flags.get("exe") ? path.resolve(flags.get("exe") as string) : undefined,
    workDir: flags.get("workdir") ? path.resolve(flags.get("workdir") as string) : undefined,
  };
}

function buildSpokenText(phrase: string, voiceId?: string, rate?: number): string {
  const parts: string[] = [];
  const voicePrefix = voiceId ? VOICE_PREFIX[voiceId.toLowerCase()] : null;
  if (voicePrefix) parts.push(voicePrefix);
  if (Number.isFinite(rate)) parts.push(`[:ra ${Math.round(rate as number)}]`);
  parts.push(phrase);
  return parts.join(" ");
}

function runCommand(
  exePath: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(exePath, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
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

export async function renderDectalk(
  input: OracleAdapterInput & { exePath?: string; workDir?: string },
): Promise<OracleArtifact> {
  const exePath = input.exePath ?? process.env.DECTALK_SAY_EXE;
  if (!exePath) {
    throw new Error("DECTALK_SAY_EXE is not set and no --exe path was provided");
  }
  const workDir =
    input.workDir ?? process.env.DECTALK_WORKDIR ?? path.dirname(path.resolve(exePath));

  fs.mkdirSync(input.outDir, { recursive: true });
  const wavPath = path.join(input.outDir, "oracle.wav");
  const tracePath = path.join(input.outDir, "oracle.trace.jsonl");
  const phonemeLogPath = path.join(input.outDir, "oracle.phonemes.txt");
  const metadataPath = path.join(input.outDir, "oracle.json");
  const stdoutPath = path.join(input.outDir, "oracle.stdout.log");
  const stderrPath = path.join(input.outDir, "oracle.stderr.log");
  const phonemeStdoutPath = path.join(input.outDir, "oracle.phoneme.stdout.log");
  const phonemeStderrPath = path.join(input.outDir, "oracle.phoneme.stderr.log");

  const spokenText = buildSpokenText(input.phrase, input.voiceId, input.rate);
  const phonemeText = input.phrase;
  const command = [exePath, "-w", wavPath, "-lt", tracePath, spokenText];
  const started = Date.now();
  const result = await runCommand(exePath, ["-w", wavPath, "-lt", tracePath, spokenText], workDir);
  const durationMs = Date.now() - started;

  fs.writeFileSync(stdoutPath, result.stdout, "utf8");
  fs.writeFileSync(stderrPath, result.stderr, "utf8");

  const notes: string[] = [];
  if (input.sampleRate != null) {
    notes.push(
      "DECtalk CLI sample rate is adapter-controlled externally; requested sampleRate recorded only.",
    );
  }
  if (!fs.existsSync(wavPath)) {
    notes.push("Oracle WAV was not produced.");
  }

  let symbolic: Record<string, unknown> | undefined;
  let trace: Record<string, unknown> | undefined;
  let phonemeCommand: string[] | undefined;
  try {
    phonemeCommand = [exePath, "-lp", phonemeLogPath, phonemeText];
    const phonemeResult = await runCommand(exePath, ["-lp", phonemeLogPath, phonemeText], workDir);
    fs.writeFileSync(phonemeStdoutPath, phonemeResult.stdout, "utf8");
    fs.writeFileSync(phonemeStderrPath, phonemeResult.stderr, "utf8");
    if (phonemeResult.exitCode !== 0) {
      notes.push(`Oracle phoneme log failed with exit code ${phonemeResult.exitCode}.`);
    } else if (!fs.existsSync(phonemeLogPath)) {
      notes.push("Oracle phoneme log was not produced.");
    } else {
      const rawPhonemeLog = fs.readFileSync(phonemeLogPath, "utf8");
      const parsed = parseDectalkUsPhonemeLog(rawPhonemeLog);
      symbolic = {
        phonemeLogPath,
        rawPhonemeLog: parsed.rawPhonemeLog,
        phonemeTokens: parsed.phonemeTokens,
        comparisonTokens: parsed.comparisonTokens,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notes.push(`Oracle phoneme log failed: ${message}`);
  }

  if (fs.existsSync(tracePath)) {
    try {
      const parsedTrace = parseDectalkTraceFile(tracePath);
      trace = {
        tracePath,
        ...parsedTrace.summary,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notes.push(`Oracle trace parse failed: ${message}`);
    }
  } else {
    notes.push("Oracle internal trace was not produced.");
  }

  const artifact: OracleArtifact = {
    engineId: "dectalk-463",
    adapterId: "render-dectalk",
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
    command,
    notes,
    ...(symbolic ? { symbolic } : {}),
    ...(trace ? { trace } : {}),
    extraPaths: {
      stdout: stdoutPath,
      stderr: stderrPath,
      cwd: workDir,
      ...(fs.existsSync(tracePath) ? { trace: tracePath } : {}),
      ...(fs.existsSync(phonemeLogPath) ? { phonemeLog: phonemeLogPath } : {}),
      ...(fs.existsSync(phonemeStdoutPath) ? { phonemeStdout: phonemeStdoutPath } : {}),
      ...(fs.existsSync(phonemeStderrPath) ? { phonemeStderr: phonemeStderrPath } : {}),
    },
  };

  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify({ ...artifact, spokenText, ...(phonemeCommand ? { phonemeCommand } : {}) }, null, 2)}\n`,
    "utf8",
  );

  if (artifact.exitCode !== 0) {
    throw new Error(`DECtalk render failed with exit code ${artifact.exitCode}`);
  }

  return artifact;
}

async function main(): Promise<number> {
  try {
    const args = parseArgv(process.argv.slice(2));
    const artifact = await renderDectalk(args);
    process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().then((code) => process.exit(code));
}
