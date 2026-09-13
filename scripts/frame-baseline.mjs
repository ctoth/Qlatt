import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { chromium } from "playwright-core";
import { createServer } from "vite";

const [mode, output, comparison] = process.argv.slice(2);
if (!["node", "browser"].includes(mode) || !output) {
  throw new Error("Usage: node scripts/frame-baseline.mjs node|browser OUTPUT [BASELINE]");
}
const digest = (value) => createHash("sha256").update(value).digest("hex");
const readReport = (file) =>
  JSON.parse(
    file.endsWith(".gz")
      ? gunzipSync(fs.readFileSync(file)).toString()
      : fs.readFileSync(file, "utf8"),
  );
function firstDifference(before, after, location = "track") {
  if (Object.is(before, after)) return null;
  if (
    before === null ||
    after === null ||
    typeof before !== "object" ||
    typeof after !== "object"
  ) {
    return `${location}: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`;
  }
  const a = Object.keys(before);
  const b = Object.keys(after);
  if (JSON.stringify(a) !== JSON.stringify(b))
    return `${location}: keys/order ${JSON.stringify(a)} -> ${JSON.stringify(b)}`;
  for (const key of a) {
    const difference = firstDifference(before[key], after[key], `${location}.${key}`);
    if (difference) return difference;
  }
  return null;
}
const corpusPath = "test/phrase-sets/linguistic.json";
const phrases = JSON.parse(fs.readFileSync(corpusPath, "utf8")).phrases;
const files = execFileSync(
  "git",
  ["ls-files", "public/rules", "public/worklets", "package-lock.json", corpusPath],
  { encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/);
const manifest = Object.fromEntries(files.map((file) => [file, digest(fs.readFileSync(file))]));
const sourceFiles = execFileSync(
  "git",
  [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "src",
    "scripts/frame-baseline.mjs",
    "scripts/frame-baseline-run.ts",
  ],
  { encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/);
const sourceManifest = Object.fromEntries(
  sourceFiles.map((file) => [file, digest(fs.readFileSync(file))]),
);
const server = await createServer({
  server: { host: "127.0.0.1", port: 8134, strictPort: true, open: false },
  plugins: [
    {
      name: "benchmark-asset-404",
      configureServer(server) {
        // An inherited include probes the child directory before the parent.
        // Serve missing assets as 404, not Vite's SPA HTML fallback.
        server.middlewares.use((request, response, next) => {
          const pathname = new URL(request.url, "http://localhost").pathname;
          if (pathname.startsWith("/rules/") && !fs.existsSync(path.join("public", pathname))) {
            response.statusCode = 404;
            response.end();
          } else next();
        });
      },
    },
  ],
});
let browser;
try {
  let results;
  let browserVersion = null;
  let heap;
  if (mode === "browser") {
    await server.listen();
    const executablePath =
      process.env.CHROME_PATH ??
      [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      ].find(fs.existsSync);
    if (!executablePath) throw new Error("Set CHROME_PATH to an installed browser");
    browser = await chromium.launch({ executablePath, headless: true });
    browserVersion = browser.version();
    const page = await browser.newPage();
    page.on("console", (message) => {
      if (message.type() === "info") console.log(message.text());
    });
    await page.goto("http://127.0.0.1:8134/");
    results = await page.evaluate(async (phrases) => {
      const { preloadF0Filters } = await import("/src/f0-filters-loader.ts");
      await preloadF0Filters("/worklets/f0-filters.wasm");
      const { measureFrames } = await import("/scripts/frame-baseline-run.ts");
      return measureFrames(phrases);
    }, phrases);
    heap = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? "unavailable");
  } else {
    const { measureFrames } = await server.ssrLoadModule("/scripts/frame-baseline-run.ts");
    results = await measureFrames(phrases);
    heap = process.memoryUsage();
  }
  const report = {
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    mode,
    browserVersion,
    nodeVersion: process.version,
    buildMode: "vite-development",
    machine: {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      cpu: os.cpus()[0]?.model,
    },
    configuration: {
      baseF0: 110,
      transitionMs: 30,
      speaker: "default",
      affect: "default",
      warmupPasses: 1,
      measuredPasses: 5,
    },
    manifest,
    sourceManifest,
    heap,
    unavailableMetrics: [
      "retained heap after forced GC",
      "journal bytes (entry counts reported)",
      "per-expression CEL time (timing disabled)",
    ],
    results: results.map((result) => ({ ...result, hash: digest(JSON.stringify(result.tracks)) })),
  };
  if (comparison) {
    const baseline = readReport(comparison);
    if (
      baseline.mode !== mode ||
      baseline.browserVersion !== browserVersion ||
      JSON.stringify(baseline.configuration) !== JSON.stringify(report.configuration) ||
      JSON.stringify(baseline.machine) !== JSON.stringify(report.machine) ||
      baseline.manifest[corpusPath] !== report.manifest[corpusPath]
    ) {
      throw new Error("Baseline machine/browser/corpus/configuration mismatch");
    }
    for (const result of report.results) {
      const before = baseline.results.find(
        (entry) =>
          entry.frontendId === result.frontendId && entry.captureTooling === result.captureTooling,
      );
      if (!before) throw new Error("Baseline configuration missing");
      if (digest(JSON.stringify(before.tracks)) !== before.hash) {
        throw new Error(`Corrupt baseline hash: ${result.frontendId}`);
      }
      if (before.hash !== result.hash) {
        for (let i = 0; i < result.tracks.length; i++) {
          if (JSON.stringify(before.tracks[i]) !== JSON.stringify(result.tracks[i])) {
            throw new Error(
              `Output differs: ${result.frontendId}, tooling=${result.captureTooling}, phrase ${i}: ${phrases[i]}\n${firstDifference(before.tracks[i], result.tracks[i])}`,
            );
          }
        }
      }
      result.baselineRatio = result.medianMs / before.medianMs;
    }
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const serialized = JSON.stringify(report);
  fs.writeFileSync(output, output.endsWith(".gz") ? gzipSync(serialized) : serialized);
  console.log(
    JSON.stringify(
      report.results.map(({ frontendId, captureTooling, medianMs, hash, baselineRatio }) => ({
        frontendId,
        captureTooling,
        medianMs,
        hash,
        baselineRatio,
      })),
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
}
