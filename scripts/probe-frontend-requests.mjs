// probe-frontend-requests.mjs
// ===========================
// Opens the harness page in a headless browser, selects each named frontend,
// waits for its warm-up (test/harness/warmup.js: declared resources are acquired
// asynchronously, then one short utterance is compiled), and prints
//   - the status of every request whose URL matches --match,
//   - every YAML or JSON request the server answered "no such file" (404, 410,
//     or a 200 with an HTML page, which is what a dev server sends): a frontend
//     that extends another asks for each include in its own directory first,
//     so these are expected,
//   - every other request that failed or was answered with 400 or above,
//   - the warm-up report: any resources still read with a blocking request
//     and any paired experiment configuration error.
//
// It shows whether a browser finds every document a frontend's inventory is
// made of. Exits 1 when a request failed, the paired config failed,
// or a warm-up did not finish (a "no such file" answer taken
// for the file's content shows up as that).
//
// Usage (dev server running, e.g. `npx vite --port 8137`):
//   node scripts/probe-frontend-requests.mjs --url http://localhost:8137/ \
//     --frontends qlatt-english,qlatt-beauty --match "inventory|phonology"

import fs from "node:fs";
import { chromium } from "playwright-core";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (key.startsWith("--")) args.set(key.slice(2), process.argv[i + 1]);
}
const url = args.get("url") ?? "http://localhost:8000/";
const frontends = (args.get("frontends") ?? "qlatt-english").split(",");
const match = new RegExp(args.get("match") ?? "inventory|phonology");
const timeoutMs = Number(args.get("timeout-ms") ?? 120000);

const chromePath =
  process.env.CHROME_PATH ??
  [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find((candidate) => fs.existsSync(candidate));
if (!chromePath) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  process.exit(1);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio", "--no-first-run"],
});
const page = await browser.newPage();
const matched = [];
const failed = [];
const absent = [];
const reports = new Map();
page.on("response", (response) => {
  const path = new URL(response.url()).pathname;
  const status = response.status();
  if (match.test(path)) matched.push(`${status} ${path}`);
  // A dev server answers a missing file with the page itself and status 200.
  const html = (response.headers()["content-type"] ?? "").includes("text/html");
  if (
    /\.(ya?ml|json)$/.test(path) &&
    (status === 404 || status === 410 || (html && status < 300))
  ) {
    absent.push(`${status} ${path}${html ? " (an HTML page)" : ""}`);
  } else if (status >= 400) {
    failed.push(`${status} ${path}`);
  } else if (/\.wasm$/.test(path) && html) {
    failed.push(`${status} ${path} (answered with an HTML page: no such file)`);
  }
});
page.on("requestfailed", (request) => {
  failed.push(`failed ${new URL(request.url()).pathname} (${request.failure()?.errorText})`);
});
page.on("console", async (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    console.log(`console ${message.type()}: ${message.text().slice(0, 600)}`);
  }
  if (!message.text().startsWith("[QLATT] Frontend warm-up (ms)")) return;
  const report = await message.args()[1]?.jsonValue();
  if (report?.frontendId) reports.set(report.frontendId, report);
});
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));

let ok = true;
await page.goto(url, { waitUntil: "load" });
for (const frontendId of frontends) {
  // The page's selector lists only some frontends; one it does not list is
  // added here, and is then warmed by the page's own change handler.
  const added = await page.evaluate((id) => {
    const select = document.getElementById("frontendSelect");
    if ([...select.options].some((option) => option.value === id)) return false;
    select.appendChild(new Option(id, id));
    return true;
  }, frontendId);
  if (added) console.log(`${frontendId}: not in the page's selector; option added by this probe`);
  await page.selectOption("#frontendSelect", frontendId);
  const started = Date.now();
  while (!reports.has(frontendId) && Date.now() - started < timeoutMs) {
    await page.waitForTimeout(250);
  }
  const report = reports.get(frontendId);
  if (!report) {
    ok = false;
    console.log(`${frontendId}: no warm-up report within ${timeoutMs} ms`);
    continue;
  }
  console.log(
    `${frontendId}: unprimed=${JSON.stringify(report.unprimed)} configError=${JSON.stringify(report.configError)}`,
  );
  if (report.configError) ok = false;
}
await browser.close();

console.log(`requests matching ${match}:`);
for (const line of matched) console.log(`  ${line}`);
console.log(`requests answered "no such file": ${absent.length}`);
for (const line of absent) console.log(`  ${line}`);
console.log(`failed requests: ${failed.length}`);
for (const line of failed) console.log(`  ${line}`);
process.exit(ok && failed.length === 0 ? 0 : 1);
