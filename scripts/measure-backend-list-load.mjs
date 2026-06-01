import fs from "node:fs";
import { chromium } from "playwright-core";
import { createServer as createViteServer } from "vite";

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

const chromePath = resolveChromePath();
if (!chromePath) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  process.exit(1);
}

const server = await createViteServer({
  root: process.cwd(),
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});

await server.listen();
const address = server.httpServer?.address();
if (!address || typeof address === "string") {
  await server.close();
  throw new Error("Failed to start Vite server.");
}

const url = `http://127.0.0.1:${address.port}/`;
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: [
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
  const requests = [];
  page.on("request", (request) => {
    requests.push({
      url: request.url(),
      startMs: Date.now(),
      endMs: null,
      status: null,
    });
  });
  page.on("response", (response) => {
    const entry = requests.find(
      (candidate) => candidate.url === response.url() && candidate.endMs === null,
    );
    if (!entry) return;
    entry.endMs = Date.now();
    entry.status = response.status();
  });

  const started = Date.now();
  await page.goto(url, { waitUntil: "commit", timeout: 60000 });
  const committed = Date.now();
  await page.waitForSelector("#experimentSelect option[value='klatt80-baseline']", {
    timeout: 60000,
  });
  const dropdownReady = Date.now();
  const timings = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null,
      loadEventMs: nav ? nav.loadEventEnd : null,
      resourceNames: performance.getEntriesByType("resource").map((entry) => ({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
        transferSize: "transferSize" in entry ? entry.transferSize : null,
      })),
    };
  });
  const selectedText = await page.locator("#experimentSelect").evaluate((select) =>
    Array.from(select.options).map((option) => ({
      value: option.value,
      text: option.textContent,
    })),
  );

  const relativeRequests = requests.map((entry) => ({
    url: entry.url.replace(url, "/"),
    startMs: entry.startMs - started,
    endMs: entry.endMs === null ? null : entry.endMs - started,
    durationMs: entry.endMs === null ? null : entry.endMs - entry.startMs,
    status: entry.status,
  }));

  console.log(JSON.stringify({
    url,
    commitMs: committed - started,
    dropdownReadyMs: dropdownReady - started,
    domContentLoadedMs: timings.domContentLoadedMs,
    loadEventMs: timings.loadEventMs,
    options: selectedText,
    requests: relativeRequests,
    resources: timings.resourceNames
      .filter((entry) =>
        entry.name.includes("manifest.json") ||
        entry.name.includes("frontend.yaml") ||
        entry.name.includes("phases/") ||
        entry.name.includes("test-harness") ||
        entry.name.includes("runtime.js"),
      )
      .map((entry) => ({
        name: entry.name.replace(url, "/"),
        startTime: entry.startTime,
        duration: entry.duration,
        transferSize: entry.transferSize,
      })),
  }, null, 2));
} finally {
  await browser.close();
  await server.close();
}
