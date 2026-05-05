import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  args.set(key.slice(2), process.argv[i + 1]);
}

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function mapEntries(value) {
  if (!value) return [];
  return Array.from(value.entries()).map(([key, entry]) => [key, entry]);
}

function topTelemetryMax(entries, limit = 12) {
  return entries
    .map(([node, data]) => ({
      node,
      rms: Number(data?.rms ?? 0),
      peak: Number(data?.peak ?? 0),
      rmsTime: data?.rmsTime ?? null,
      peakTime: data?.peakTime ?? null,
      rmsPhoneme: data?.rmsPhoneme ?? "",
      peakPhoneme: data?.peakPhoneme ?? "",
      freqMin: data?.freqMin ?? null,
      freqMax: data?.freqMax ?? null,
      bwMin: data?.bwMin ?? null,
      bwMax: data?.bwMax ?? null,
    }))
    .sort((a, b) => b.peak - a.peak)
    .slice(0, limit);
}

const chromePath = resolveChromePath();
if (!chromePath) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  process.exit(1);
}

const url = args.get("url") ?? "http://localhost:8000/";
const phrase = args.get("phrase") ?? "hello world";
const experimentId = args.get("experiment-id") ?? "klatt80-baseline";
const frontendId = args.get("frontend-id") ?? "qlatt-english";
const baseF0 = Number(args.get("base-f0") ?? 110);
const rate = Number(args.get("rate") ?? 1);
const waitMs = Number(args.get("wait-ms") ?? 2500);
const engineDiagnostics = (args.get("engine-diagnostics") ?? "1") === "1";
const outJson = args.get("out-json") ? path.resolve(args.get("out-json")) : null;

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: [
    "--autoplay-policy=no-user-gesture-required",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-features=Translate,OptimizationHints,MediaRouter",
    "--disable-sync",
    "--mute-audio",
    "--no-default-browser-check",
    "--no-first-run",
  ],
});

try {
  const page = await browser.newPage();
  const consoleLogs = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error instanceof Error ? error.stack || error.message : String(error));
  });
  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? "",
    });
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.__qlatt != null, { timeout: 60000 });
  await page.waitForFunction(
    () => document.querySelector("#experimentSelect option[value='klatt80-baseline']") != null,
    { timeout: 60000 },
  );

  await page.selectOption("#experimentSelect", experimentId);
  await page.selectOption("#frontendSelect", frontendId);
  await page.fill("#phrase", phrase);
  await page.fill("#baseF0", String(baseF0));
  await page.evaluate((nextRate) => {
    const input = document.getElementById("rate");
    input.value = String(nextRate);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, rate);

  if (engineDiagnostics) {
    await page.check("#diagEngineToggle");
  }

  await page.click("#startBtn");
  await page.click("#speakBtn");
  await page.waitForTimeout(waitMs);

  const snapshot = await page.evaluate(() => {
    const state = window.__qlatt;
    return {
      statusText: document.getElementById("status")?.textContent ?? "",
      selectedExperiment: document.getElementById("experimentSelect")?.value ?? "",
      selectedFrontend: document.getElementById("frontendSelect")?.value ?? "",
      diagnostics: document.getElementById("diagnostics")?.value ?? "",
      currentExperimentId: state.currentExperimentId,
      sessionId: state.sessionId,
      lastRun: state.lastRun
        ? {
            phrase: state.lastRun.phrase,
            baseF0: state.lastRun.baseF0,
            events: state.lastRun.track?.length ?? 0,
            trackEnd: state.lastRun.track?.at(-1)?.time ?? 0,
          }
        : null,
      telemetry: Array.from(state.telemetry.entries()),
      telemetryMax: Array.from(state.telemetryMax.entries()),
      diagResults: state.diagEngine
        ? Array.from(state.diagEngine.getCheckResults().entries()).map(([name, result]) => ({
            name,
            status: result.status,
            severity: result.severity,
            message: result.message,
            value: result.value ?? null,
            valueLabel: result.valueLabel ?? null,
            assertionFailed: result.assertionFailed === true,
            collected: result.collected ?? [],
          }))
        : [],
      plstepEvents: [...state.plstepEvents],
      plstepTotalCount: state.plstepTotalCount,
      playHistory: [...state.playHistory],
    };
  });

  const result = {
    url,
    phrase,
    experimentId,
    frontendId,
    baseF0,
    rate,
    waitMs,
    consoleLogs,
    pageErrors,
    failedRequests,
    snapshot,
    summary: {
      topTelemetryMax: topTelemetryMax(snapshot.telemetryMax),
      failingChecks: snapshot.diagResults.filter((entry) =>
        entry.status === "warn" || entry.status === "fail" || entry.assertionFailed,
      ),
    },
  };

  if (outJson) {
    fs.mkdirSync(path.dirname(outJson), { recursive: true });
    fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
  }

  console.log(JSON.stringify({
    statusText: snapshot.statusText,
    selectedExperiment: snapshot.selectedExperiment,
    currentExperimentId: snapshot.currentExperimentId,
    diagnosticsChars: snapshot.diagnostics.length,
    telemetryNodes: mapEntries(new Map(snapshot.telemetryMax)).length,
    topTelemetryMax: result.summary.topTelemetryMax.slice(0, 5),
    failingChecks: result.summary.failingChecks,
    plstepTotalCount: snapshot.plstepTotalCount,
    consoleErrors: consoleLogs.filter((entry) => entry.type === "error").length,
    pageErrors: pageErrors.length,
    failedRequests: failedRequests.length,
    outJson,
  }, null, 2));
} finally {
  await browser.close();
}
