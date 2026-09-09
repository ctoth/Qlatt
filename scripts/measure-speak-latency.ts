/** Measure the stdio protocol, including PCM serialization and transport.
 * Run with node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/measure-speak-latency.ts
 */
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

type LatencyReport = {
  startupMs: number;
  firstRequestMs: number;
  secondRequestMs: number;
  rounds: number;
  means: Array<{ phrase: string; audioSeconds: number; ms: number }>;
  fixedMs: number;
  perAudioSecondMs: number;
};

export async function measureSpeakLatency(rounds = 3) {
  if (!Number.isInteger(rounds) || rounds < 1) throw new Error("rounds must be a positive integer");
  const started = performance.now();
  const child = spawn(
    process.execPath,
    [
      "--loader",
      "ts-node/esm/transpile-only",
      "--experimental-specifier-resolution=node",
      "scripts/speak-server.ts",
    ],
    { stdio: ["pipe", "pipe", "pipe"] },
  );
  let stderr = "";
  child.stderr.on("data", (data) => {
    stderr += String(data);
  });
  const exited = once(child, "exit");
  const lines = readline.createInterface({ input: child.stdout });
  const iterator = lines[Symbol.asyncIterator]();
  // Engineering timeout for a stuck measurement process, not a latency target.
  const timeout = setTimeout(() => child.kill(), 120_000);
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
  let report: LatencyReport;
  let exitStatus: { code: number | null; signal: NodeJS.Signals | null };
  try {
    await request({ op: "hello" });
    const startupMs = performance.now() - started;
    const phrases = ["OK.", "Hello world.", "The quick brown fox jumps over the lazy dog."];
    const first = await request({ op: "speak", text: phrases[0] });
    const measurements: Array<{ phrase: string; ms: number; audioSeconds: number }> = [];
    for (let round = 0; round < rounds; round++) {
      for (const phrase of phrases) {
        measurements.push({ phrase, ...(await request({ op: "speak", text: phrase })) });
      }
    }
    const means = phrases.map((phrase) => {
      const rows = measurements.filter((row) => row.phrase === phrase);
      return {
        phrase,
        audioSeconds: rows[0].audioSeconds,
        ms: rows.reduce((sum, row) => sum + row.ms, 0) / rows.length,
      };
    });
    // Least-squares descriptive fit: elapsed ms = fixed ms + ms/audio-second * duration.
    // Frontend and graph work are included; this is not a causal DSP-only measurement.
    const meanX = means.reduce((sum, row) => sum + row.audioSeconds, 0) / means.length;
    const meanY = means.reduce((sum, row) => sum + row.ms, 0) / means.length;
    const perAudioSecondMs =
      means.reduce((sum, row) => sum + (row.audioSeconds - meanX) * (row.ms - meanY), 0) /
      means.reduce((sum, row) => sum + (row.audioSeconds - meanX) ** 2, 0);
    report = {
      startupMs,
      firstRequestMs: first.ms,
      secondRequestMs: measurements[0].ms,
      rounds,
      means,
      fixedMs: meanY - perAudioSecondMs * meanX,
      perAudioSecondMs,
    };
  } finally {
    child.stdin.end(`${JSON.stringify({ op: "quit" })}\n`);
    const [code, signal] = await exited;
    exitStatus = { code, signal };
    clearTimeout(timeout);
    lines.close();
  }
  if (exitStatus.code !== 0) {
    throw new Error(`Speech server exited (${exitStatus.signal ?? exitStatus.code}): ${stderr}`);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  measureSpeakLatency().then(
    (report) => console.log(JSON.stringify(report, null, 2)),
    (error) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
