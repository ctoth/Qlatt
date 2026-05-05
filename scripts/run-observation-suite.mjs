import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const args = new Map();
const repeated = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const name = key.slice(2);
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith("--")) {
    args.set(name, "1");
    continue;
  }
  if (!repeated.has(name)) repeated.set(name, []);
  repeated.get(name).push(value);
  args.set(name, value);
  i += 1;
}

function splitList(value, fallback) {
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function repeatedOrList(name, fallback) {
  const values = repeated.get(name);
  if (values?.length) return values;
  return splitList(args.get(name), fallback);
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "phrase";
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const rendered = [command, ...commandArgs].join(" ");
    throw new Error([
      `Command failed (${result.status}): ${rendered}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join("\n"));
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function compactAnalysis(report) {
  const active = report.active ?? {};
  const activeSpectrum = active.spectral ?? {};
  return {
    rms: active.rms ?? null,
    peak: active.peak ?? null,
    crestDb: active.crestDb ?? null,
    clippedShare: active.clippedShare ?? null,
    dc: active.dc ?? null,
    zcr: active.zcr ?? null,
    spectralCentroidHz: activeSpectrum.spectralCentroidHz ?? null,
    rolloff95Hz: activeSpectrum.rolloff95Hz ?? null,
    spectralFlatness: activeSpectrum.spectralFlatness ?? null,
    highShareAbove3000: activeSpectrum.highShareAbove3000 ?? null,
    hissShareAbove6000: activeSpectrum.hissShareAbove6000 ?? null,
    highToSpeechRatioDb: activeSpectrum.highToSpeechRatioDb ?? null,
    hissToSpeechRatioDb: activeSpectrum.hissToSpeechRatioDb ?? null,
    bandShare: activeSpectrum.bandShare ?? {},
    releaseSummary: report.segments?.releaseSummary ?? null,
    releaseFrames: report.segments?.releaseFrames ?? [],
  };
}

function compactProbe(report) {
  const snapshot = report.snapshot ?? {};
  const checks = snapshot.diagResults ?? [];
  return {
    consoleErrors: report.consoleErrors?.length ?? 0,
    pageErrors: report.pageErrors?.length ?? 0,
    failedRequests: report.failedRequests?.length ?? 0,
    telemetryNodes: snapshot.telemetryMax?.length ?? snapshot.telemetry?.length ?? 0,
    topTelemetryMax: report.summary?.topTelemetryMax ?? [],
    failingChecks: report.summary?.failingChecks ?? checks.filter((check) => check.assertionFailed),
    checks: checks.map((check) => ({
      name: check.name,
      status: check.status,
      severity: check.severity,
      value: check.value ?? null,
      valueLabel: check.valueLabel ?? null,
      assertionFailed: check.assertionFailed === true,
    })),
  };
}

const experiments = splitList(args.get("experiments"), ["klsyn88", "klatt80-baseline"]);
const phrases = repeatedOrList("phrase", ["hello world"]);
const frontendId = args.get("frontend-id") ?? "qlatt-english";
const baseF0 = args.get("base-f0") ?? "110";
const waitMs = args.get("wait-ms") ?? "3500";
const url = args.get("url") ?? "";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.resolve(args.get("out-dir") ?? path.join("test", "tmp", "observation-suite", timestamp));

fs.mkdirSync(outDir, { recursive: true });

const summary = {
  generatedAt: new Date().toISOString(),
  frontendId,
  baseF0: Number(baseF0),
  url: url || null,
  outDir,
  results: [],
};

for (const experimentId of experiments) {
  for (const phrase of phrases) {
    const prefix = `${slug(experimentId)}__${slug(phrase)}`;
    const renderJson = path.join(outDir, `${prefix}.render.json`);
    const renderWav = path.join(outDir, `${prefix}.render.wav`);
    const analysisJson = path.join(outDir, `${prefix}.analysis.json`);
    const probeJson = path.join(outDir, `${prefix}.probe.json`);

    console.log(`[render] ${experimentId} :: ${phrase}`);
    run(process.execPath, [
      "--loader",
      "ts-node/esm/transpile-only",
      "--experimental-specifier-resolution=node",
      "scripts/render-phrase.ts",
      "--experiment-id",
      experimentId,
      "--frontend-id",
      frontendId,
      "--phrase",
      phrase,
      "--base-f0",
      baseF0,
      "--include-track",
      "1",
      "--out-json",
      renderJson,
      "--out-wav",
      renderWav,
      "--compare-golden",
      "0",
    ]);

    console.log(`[analyze] ${experimentId} :: ${phrase}`);
    run(process.execPath, [
      "scripts/analyze-render.mjs",
      "--input",
      renderJson,
      "--out-json",
      analysisJson,
    ]);

    const result = {
      experimentId,
      phrase,
      files: {
        renderJson,
        renderWav,
        analysisJson,
      },
      analysis: compactAnalysis(readJson(analysisJson)),
      probe: null,
    };

    if (url) {
      console.log(`[probe] ${experimentId} :: ${phrase}`);
      run(process.execPath, [
        "scripts/probe-harness.mjs",
        "--url",
        url,
        "--experiment-id",
        experimentId,
        "--frontend-id",
        frontendId,
        "--phrase",
        phrase,
        "--base-f0",
        baseF0,
        "--wait-ms",
        waitMs,
        "--out-json",
        probeJson,
      ]);
      result.files.probeJson = probeJson;
      result.probe = compactProbe(readJson(probeJson));
    }

    summary.results.push(result);
  }
}

const summaryJson = path.join(outDir, "summary.json");
fs.writeFileSync(summaryJson, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({
  outDir,
  summaryJson,
  resultCount: summary.results.length,
}, null, 2));
