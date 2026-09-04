import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RenderRequest } from "../src/rendering/types.ts";
import { writeWav } from "../src/rendering/write-wav.ts";
import { selectRenderBackend } from "./rendering/select-backend.ts";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const value = process.argv[i + 1];
  args.set(key.slice(2), value);
}

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const phrase = args.get("phrase") ?? "hello world";
const baseF0 = args.has("base-f0") ? Number(args.get("base-f0")) : undefined;
const frontendId = args.get("frontend-id") ?? "qlatt-english";
const experimentId = args.get("experiment-id") ?? "klatt80-baseline";
const engine = args.get("engine") ?? "runtime";
const rate = Number(args.get("rate") ?? 1);
const transitionMs = Number(args.get("transition-ms") ?? 30);
const sampleRate = Number(args.get("sample-rate") ?? 22050);
const outJson = args.get("out-json")
  ? path.resolve(args.get("out-json") as string)
  : path.join(repoRoot, "test", "golden", "phrase-hello-world.json");
const outWav = args.get("out-wav")
  ? path.resolve(args.get("out-wav") as string)
  : path.join(repoRoot, "test", "golden", "phrase-hello-world.wav");
const goldenPath = args.get("golden")
  ? path.resolve(args.get("golden") as string)
  : path.join(repoRoot, "test", "golden", "phrase-hello-world.json");
const writeGolden = args.get("write-golden") === "1";
const includeTrack = (args.get("include-track") ?? "0") === "1";
const leadTime = Number(args.get("lead-time") ?? 0.05);
const tailTime = Number(args.get("tail-time") ?? 0.2);
const noiseSeed = Number(args.get("noise-seed") ?? 20260214);
const persistJson = writeGolden || args.has("out-json");
const persistWav = writeGolden || args.has("out-wav");
const compareGolden = !writeGolden && (args.get("compare-golden") ?? "1") !== "0";
const allowBrowserRender =
  (args.get("allow-browser") ?? "0") === "1" || process.env.QLATT_ALLOW_BROWSER_RENDER === "1";
const renderHost = (args.get("host") ?? "auto") as "auto" | "node" | "browser";

function rmsError(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = actual[i] - expected[i];
    sum += delta * delta;
  }
  return expected.length ? Math.sqrt(sum / expected.length) : 0;
}

function maxDelta(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  let max = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = Math.abs(actual[i] - expected[i]);
    if (delta > max) max = delta;
  }
  return max;
}

function buildRequest(): RenderRequest {
  if (!["auto", "node", "browser"].includes(renderHost)) {
    throw new Error(`Invalid --host value '${renderHost}'. Use auto, node, or browser.`);
  }

  return {
    repoRoot,
    phrase,
    baseF0,
    frontendId,
    experimentId,
    engine,
    rate,
    transitionMs,
    sampleRate,
    leadTime,
    tailTime,
    includeTrack,
    noiseSeed,
    persistWav,
    allowBrowserRender,
    renderHost,
  };
}

const request = buildRequest();
const backend = selectRenderBackend(request);
const payload = await backend.render(request);

function jsonSafeReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? Number(value) : value;
}

payload.engine = engine;
payload.frontendId = frontendId;
payload.experimentId = experimentId;

if (persistJson) {
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(payload, jsonSafeReplacer, 2));
}

if (persistWav) {
  writeWav(outWav, payload.samples, payload.sampleRate);
}

if (!persistWav || !compareGolden) {
  process.exitCode = 0;
} else if (!writeGolden) {
  if (!fs.existsSync(goldenPath)) {
    console.error(`Golden missing at ${goldenPath}. Re-run with --write-golden 1.`);
    process.exit(1);
  }
  const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8")) as {
    samples: number[];
  };
  const len = Math.min(payload.samples.length, golden.samples.length);
  const actual = payload.samples.slice(0, len);
  const expected = golden.samples.slice(0, len);
  const deltas = {
    lengthMismatch: payload.samples.length - golden.samples.length,
    maxDelta: maxDelta(actual, expected),
    rmsError: rmsError(actual, expected),
  };
  console.log(JSON.stringify({ backend: backend.id, compare: deltas }, null, 2));
  // Allow tiny floating-point non-determinism in offline rendering.
  const maxAllowed = 1e-6;
  const rmsAllowed = 1e-7;
  if (deltas.lengthMismatch !== 0 || deltas.maxDelta > maxAllowed || deltas.rmsError > rmsAllowed) {
    process.exitCode = 1;
  }
}
