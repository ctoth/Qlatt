#!/usr/bin/env node

/**
 * probe-first-speak-click.ts
 * ==========================
 * Does the first click on the page's Speak button start a run?
 *
 * Opens the page at --url in a browser with a window (not headless), selects
 * a frontend, waits --settle-ms, and clicks Speak with a real mouse event at
 * the button's centre. Reports, for that click and for a second one if the
 * first started nothing: whether the page received the click (a listener put
 * on the button before it), whether the document had user activation, the
 * AudioContext's state, and whether `window.__qlatt.lastRun` appeared.
 *
 * The page is visible. A hidden page cannot be measured this way: the driver
 * keeps a page "visible" with another tab in front of it and with its window
 * minimized (both tried, Chrome 154).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/probe-first-speak-click.ts --url http://127.0.0.1:4317/
 *       [--frontend dectalk-english] [--settle-ms 2500] [--wait-ms 15000]
 *
 * Prints one JSON object. Exit code 0 whatever the result: it measures.
 */

import { chromium, type Page } from "playwright-core";
import { resolveChromePath } from "./rendering/browser-session.ts";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = argv.indexOf(`--${name}`);
  return at < 0 ? undefined : argv[at + 1];
};
const url = flag("url");
if (!url) throw new Error("--url <page url> is required");
const frontendId = flag("frontend") ?? "dectalk-english";
const settleMs = Number(flag("settle-ms") ?? 2500);
const waitMs = Number(flag("wait-ms") ?? 15000);

const chromePath = resolveChromePath();
if (!chromePath) throw new Error("No Chrome or Edge found; set CHROME_PATH");

type PageState = {
  visibility: string;
  clicks: Array<{ trusted: boolean }>;
  activationHasBeenActive: boolean | null;
  audioContext: string | null;
  status: string | null;
  baseF0Box: string | null;
  run: { baseF0: number | null; frames: number } | null;
};

function readState(page: Page): Promise<PageState> {
  return page.evaluate(() => {
    const w = window as unknown as {
      __clicks?: Array<{ trusted: boolean }>;
      __qlatt?: {
        ctx?: { state: string };
        lastRun?: { baseF0?: number; track?: unknown[] } | null;
      };
    };
    const run = w.__qlatt?.lastRun;
    return {
      visibility: document.visibilityState,
      clicks: w.__clicks ?? [],
      activationHasBeenActive: navigator.userActivation?.hasBeenActive ?? null,
      audioContext: w.__qlatt?.ctx?.state ?? null,
      status: document.getElementById("status")?.textContent ?? null,
      baseF0Box: (document.getElementById("baseF0") as HTMLInputElement | null)?.value ?? null,
      run: run ? { baseF0: run.baseF0 ?? null, frames: run.track?.length ?? 0 } : null,
    };
  });
}

/** Click Speak at its centre; wait until a run appears or `waitMs` passes. */
async function clickSpeak(page: Page, point: { x: number; y: number }) {
  const before = await readState(page);
  const started = Date.now();
  await page.mouse.click(point.x, point.y);
  let after = await readState(page);
  while (!after.run && Date.now() - started < waitMs) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    after = await readState(page);
  }
  return { before, after, waitedMs: Date.now() - started, startedRun: after.run !== null };
}

const browser = await chromium.launch({ headless: false, executablePath: chromePath });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleErrors.push(`${message.type()}: ${message.text().slice(0, 300)}`);
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message.slice(0, 300)}`));

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (id) => document.querySelector(`#frontendSelect option[value='${id}']`) != null,
    frontendId,
  );
  await page.selectOption("#frontendSelect", frontendId);
  await page.evaluate(() => {
    const w = window as unknown as { __clicks: Array<{ trusted: boolean }> };
    w.__clicks = [];
    document
      .getElementById("speakBtn")
      ?.addEventListener("click", (event) => w.__clicks.push({ trusted: event.isTrusted }));
  });
  const box = await page.locator("#speakBtn").boundingBox();
  if (!box) throw new Error("the Speak button has no box");
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await new Promise((resolve) => setTimeout(resolve, settleMs));

  const first = await clickSpeak(page, point);
  const second = first.startedRun ? null : await clickSpeak(page, point);
  console.log(JSON.stringify({ url, frontendId, settleMs, first, second, consoleErrors }, null, 2));
} finally {
  await browser.close();
}
