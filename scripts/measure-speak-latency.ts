/** Measure complete stdio responses and optional backend stage timings.
 * node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/measure-speak-latency.ts [--rounds=10] [--processes=3]
 * Run from the checkout being measured, including when comparing an older server.
 */
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const phrases = ["OK.", "Hello world.", "The quick brown fox jumps over the lazy dog."];
type Measurement = { phrase: string; ms: number; audioSeconds: number };
type StageMeasurement = { phrase: string; timings: Record<string, number> };

export function summarizeDurations(samples: readonly number[]) {
  if (!samples.length || samples.some((value) => !Number.isFinite(value))) {
    throw new Error("Expected finite duration observations");
  }
  const sorted = [...samples].sort((a, b) => a - b);
  // Descriptive quantiles use linear interpolation between adjacent observations.
  const quantile = (fraction: number) => {
    const position = (sorted.length - 1) * fraction;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  };
  return {
    count: sorted.length,
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    meanMs: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    p50Ms: quantile(0.5),
    p95Ms: quantile(0.95),
  };
}

async function measureServer(rounds: number) {
  const started = performance.now();
  const child = spawn(
    process.execPath,
    [
      "--loader",
      "ts-node/esm/transpile-only",
      "--experimental-specifier-resolution=node",
      "scripts/speak-server.ts",
    ],
    {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, QLATT_RENDER_TIMINGS: "1" },
    },
  );
  let stderr = "";
  child.stderr.on("data", (data) => {
    stderr += String(data);
  });
  const exited = once(child, "exit");
  const lines = readline.createInterface({ input: child.stdout });
  const iterator = lines[Symbol.asyncIterator]();
  // Engineering watchdog, deliberately separate from measured latency targets.
  const timeout = setTimeout(() => child.kill(), 120_000 + rounds * 10_000);
  let id = 0;
  async function request(message: object) {
    const start = performance.now();
    child.stdin.write(`${JSON.stringify({ id: ++id, ...message })}\n`);
    let audioSeconds = 0;
    for (;;) {
      const line = await iterator.next();
      if (line.done) throw new Error(`Speech server exited: ${stderr}`);
      const event = JSON.parse(line.value);
      if (event.event === "error") throw new Error(event.message);
      if (event.event === "audio") audioSeconds = event.samples / event.sampleRate;
      if (event.event === "done" || event.event === "hello") {
        return { ms: performance.now() - start, audioSeconds };
      }
    }
  }
  let startupMs: number;
  let cold: Measurement;
  const warm: Measurement[] = [];
  let exitStatus: { code: number | null; signal: NodeJS.Signals | null };
  try {
    await request({ op: "hello" });
    startupMs = performance.now() - started;
    cold = { phrase: phrases[0], ...(await request({ op: "speak", text: phrases[0] })) };
    for (let round = 0; round < rounds; round++) {
      for (const phrase of phrases) {
        warm.push({ phrase, ...(await request({ op: "speak", text: phrase })) });
      }
    }
  } finally {
    child.stdin.end(`${JSON.stringify({ op: "quit" })}\n`);
    const [code, signal] = await exited;
    exitStatus = { code, signal };
    clearTimeout(timeout);
    lines.close();
  }
  if (exitStatus.code !== 0)
    throw new Error(`Speech server exited (${exitStatus.signal ?? exitStatus.code}): ${stderr}`);
  // Parse after process exit so stdout/stderr delivery ordering cannot misassign stages.
  const stages: StageMeasurement[] = stderr
    .split(/\r?\n/)
    .filter((line) => line.startsWith("QLATT_TIMINGS "))
    .map((line) => JSON.parse(line.slice("QLATT_TIMINGS ".length)) as StageMeasurement);
  if (stages.length && stages.length !== warm.length + 1)
    throw new Error("Incomplete backend timing output");
  return {
    startupMs,
    cold,
    warm,
    coldStages: stages[0]?.timings ?? {},
    warmStages: stages.slice(1),
  };
}

export async function measureSpeakLatency(rounds = 10, processes = 3) {
  if (![rounds, processes].every((value) => Number.isInteger(value) && value > 0)) {
    throw new Error("rounds and processes must be positive integers");
  }
  const trials: Awaited<ReturnType<typeof measureServer>>[] = [];
  for (let trial = 0; trial < processes; trial++) trials.push(await measureServer(rounds));
  const warm = phrases.map((phrase) => {
    const observations = trials
      .flatMap((trial) => trial.warm)
      .filter((row) => row.phrase === phrase);
    const stages = trials
      .flatMap((trial) => trial.warmStages)
      .filter((row) => row.phrase === phrase);
    const stageNames = Object.keys(stages[0]?.timings ?? {});
    return {
      phrase,
      audioSeconds: observations[0].audioSeconds,
      elapsed: summarizeDurations(observations.map((row) => row.ms)),
      stages: Object.fromEntries(
        stageNames.map((stage) => [
          stage,
          summarizeDurations(stages.map((row) => row.timings[stage])),
        ]),
      ),
    };
  });
  const meanX = warm.reduce((sum, row) => sum + row.audioSeconds, 0) / warm.length;
  const meanY = warm.reduce((sum, row) => sum + row.elapsed.meanMs, 0) / warm.length;
  const perAudioSecondMs =
    warm.reduce((sum, row) => sum + (row.audioSeconds - meanX) * (row.elapsed.meanMs - meanY), 0) /
    warm.reduce((sum, row) => sum + (row.audioSeconds - meanX) ** 2, 0);
  return {
    rounds,
    processes,
    startup: summarizeDurations(trials.map((trial) => trial.startupMs)),
    coldOK: summarizeDurations(trials.map((trial) => trial.cold.ms)),
    warm,
    fittedEstimate: {
      fixedMs: meanY - perAudioSecondMs * meanX,
      perAudioSecondMs,
      note: "Descriptive fit across phrases, not a causal DSP/fixed-cost decomposition. runtime.* stages are included in runtimeTotal. Worklet registration includes worker startup.",
    },
    trials,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const rounds = Number(args.find((arg) => arg.startsWith("--rounds="))?.split("=")[1] ?? 10);
  const processes = Number(args.find((arg) => arg.startsWith("--processes="))?.split("=")[1] ?? 3);
  measureSpeakLatency(rounds, processes).then(
    (report) => console.log(JSON.stringify(report, null, 2)),
    (error) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
