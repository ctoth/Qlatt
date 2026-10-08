/**
 * One headless browser and one server for any number of offline renders: the
 * page test/render-runtime-offline.html (or test/render-offline.html) in a
 * real Chrome or Edge, with the worklets, the WASM kernels and the bundle a
 * browser runs. Each render is a fresh OfflineAudioContext and a fresh
 * runtime in that page; it is not the page's own AudioContext, which runs in
 * real time and keeps one runtime from utterance to utterance.
 *
 * The server is either Vite's dev server, as the single-render backend has
 * always used, or a production build served by `vite preview`: the build is
 * the app's (vite.config.ts) with the offline page as a second entry, written
 * to a temporary directory that is removed when the session closes.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type Browser, chromium } from "playwright-core";
import { build, createServer as createViteServer, preview } from "vite";
import type { RenderPayload } from "../../src/rendering/types.ts";

export type BrowserRenderServer = "dev" | "build";

export interface BrowserSessionOptions {
  repoRoot: string;
  engine: "runtime" | "legacy";
  /** Default "dev". */
  server?: BrowserRenderServer;
  /** The server's port on 127.0.0.1. Default: any free port. */
  port?: number;
  /**
   * Renders before the page is closed and opened afresh. Every render makes
   * an OfflineAudioContext with its own worklet scope, and a page that has
   * made about sixty can make no more (in Chromium 154 the 62nd worklet never
   * reported ready, and after it no processor would register). Default 40.
   */
  rendersPerPage?: number;
  browserExecutablePath?: string | null;
  log?: (line: string) => void;
}

/** What the page's `renderOfflineRuntime` takes (test/render-runtime-offline.html). */
export interface BrowserRenderOptions {
  phrase: string;
  /** Absent: the page's 110 Hz. null: none, the voice keeps its own. */
  baseF0?: number | null;
  engine?: string;
  frontendId?: string;
  experimentId?: string;
  rate?: number;
  speaker?: string;
  transitionMs?: number;
  sampleRate?: number;
  leadTime?: number;
  tailTime?: number;
  includeTrack?: boolean;
  noiseSeed?: number;
  encodeSamples?: "float32-base64";
}

export interface BrowserRenderDiagnostic {
  level: string;
  code?: string;
  message: string;
  data?: unknown;
}

export type BrowserRenderPayload = RenderPayload & {
  samplesBase64?: string;
  diagnostics?: BrowserRenderDiagnostic[];
};

export interface BrowserSession {
  /** The page the renders run in. */
  url: string;
  /** "Chrome 141.0.0.0"-style product and version of the browser. */
  browserVersion: string;
  render(options: BrowserRenderOptions): Promise<BrowserRenderPayload>;
  close(): Promise<void>;
}

const OFFLINE_PAGES = {
  runtime: "test/render-runtime-offline.html",
  legacy: "test/render-offline.html",
} as const;

export function resolveChromePath(): string | null {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type Served = { port: number; close(): Promise<void> };

function portOf(address: unknown): number | null {
  return address && typeof address === "object" && "port" in address
    ? Number((address as { port: unknown }).port)
    : null;
}

async function serveDev(root: string, port: number | undefined): Promise<Served> {
  const extraAllow = [
    path.resolve(root, "..", "cel2js"),
    path.resolve(root, "..", "cel2js", "dist"),
  ];
  const server = await createViteServer({
    root,
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port: port ?? 0,
      strictPort: port !== undefined,
      open: false,
      fs: { allow: [root, ...extraAllow] },
    },
  });
  await server.listen();
  const listening = portOf(server.httpServer?.address());
  if (listening == null) {
    await server.close();
    throw new Error("Failed to start Vite server for offline render.");
  }
  return { port: listening, close: () => server.close() };
}

async function serveBuild(
  root: string,
  port: number | undefined,
  engine: BrowserSessionOptions["engine"],
): Promise<Served> {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "qlatt-browser-render-"));
  const removeBuild = () => fs.rmSync(outDir, { recursive: true, force: true });
  try {
    // vite.config.ts supplies the app's own entry and base; the offline page
    // is added to it.
    await build({
      root,
      logLevel: "error",
      build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: { input: { offline: path.join(root, OFFLINE_PAGES[engine]) } },
      },
    });
    const server = await preview({
      root,
      logLevel: "error",
      build: { outDir },
      preview: { host: "127.0.0.1", port: port ?? 0, strictPort: port !== undefined, open: false },
    });
    const listening = portOf(server.httpServer.address());
    if (listening == null) {
      await server.close();
      throw new Error("Failed to start the preview server for the production build.");
    }
    return {
      port: listening,
      close: async () => {
        await server.close();
        removeBuild();
      },
    };
  } catch (error) {
    removeBuild();
    throw error;
  }
}

const BROWSER_ARGS: readonly string[] = [
  "--autoplay-policy=no-user-gesture-required",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-extensions",
  "--disable-features=Translate,OptimizationHints,MediaRouter",
  "--disable-sync",
  "--hide-scrollbars",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--password-store=basic",
  "--use-mock-keychain",
];

export interface ServedBrowser {
  /** "http://127.0.0.1:<port>" of the server. */
  origin: string;
  browser: Browser;
  close(): Promise<void>;
}

/**
 * The server and a headless browser with no page opened, for driving the
 * app's own page (index.html) rather than the offline render page.
 */
export async function openServedBrowser(
  options: Omit<BrowserSessionOptions, "rendersPerPage">,
): Promise<ServedBrowser> {
  const log = options.log ?? (() => {});
  const chromePath = options.browserExecutablePath ?? resolveChromePath();
  if (!chromePath) {
    throw new Error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  }
  const served =
    (options.server ?? "dev") === "dev"
      ? await serveDev(options.repoRoot, options.port)
      : await serveBuild(options.repoRoot, options.port, options.engine);
  log("[browser:driver] server ready");
  try {
    const browser = await chromium.launch({
      headless: true,
      timeout: 120000,
      executablePath: chromePath,
      args: [...BROWSER_ARGS],
    });
    log("[browser:driver] browser launched");
    return {
      origin: `http://127.0.0.1:${served.port.toString()}`,
      browser,
      close: async () => {
        await browser.close();
        await served.close();
      },
    };
  } catch (error) {
    await served.close();
    throw error;
  }
}

export async function openBrowserSession(options: BrowserSessionOptions): Promise<BrowserSession> {
  const log = options.log ?? (() => {});
  const chromePath = options.browserExecutablePath ?? resolveChromePath();
  if (!chromePath) {
    throw new Error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  }
  const mode = options.server ?? "dev";
  log(
    `[browser:driver] starting ${mode === "dev" ? "vite server" : "production build and preview server"}`,
  );
  const served =
    mode === "dev"
      ? await serveDev(options.repoRoot, options.port)
      : await serveBuild(options.repoRoot, options.port, options.engine);
  log("[browser:driver] server ready");

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  const close = async () => {
    if (browser) await browser.close();
    await served.close();
  };
  try {
    log("[browser:driver] launching browser");
    browser = await chromium.launch({
      headless: true,
      timeout: 120000,
      executablePath: chromePath,
      args: [...BROWSER_ARGS],
    });
    log("[browser:driver] browser launched");
    const launched = browser;
    const url = `http://127.0.0.1:${served.port.toString()}/${OFFLINE_PAGES[options.engine]}`;
    const openPage = async () => {
      const opened = await launched.newPage();
      opened.setDefaultTimeout(120000);
      opened.setDefaultNavigationTimeout(120000);
      opened.on("console", (msg) => {
        const text = msg.text();
        if (text) log(`[browser:${msg.type()}] ${text}`);
      });
      opened.on("pageerror", (error) => {
        log(
          `[browser:pageerror] ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
        );
      });
      opened.on("response", (response) => {
        if (response.status() >= 400) {
          log(`[browser:http] ${response.status().toString()} ${response.url()}`);
        }
      });
      log(`[browser:driver] navigating to ${url}`);
      await opened.goto(url, { waitUntil: "load" });
      await opened.waitForFunction(
        () => {
          const runtimeWindow = window as unknown as Window & {
            offlineRenderDriver?: {
              startRender?: unknown;
              getStatus?: unknown;
              consumeResult?: unknown;
            };
          };
          return (
            runtimeWindow.offlineRenderDriver != null &&
            typeof runtimeWindow.offlineRenderDriver.startRender === "function" &&
            typeof runtimeWindow.offlineRenderDriver.getStatus === "function" &&
            typeof runtimeWindow.offlineRenderDriver.consumeResult === "function"
          );
        },
        { timeout: 120000 },
      );
      log("[browser:driver] driver ready");
      return opened;
    };
    let page = await openPage();
    let rendersOnPage = 0;
    const rendersPerPage = options.rendersPerPage ?? 40;

    const render = async (renderOptions: BrowserRenderOptions): Promise<BrowserRenderPayload> => {
      if (rendersOnPage >= rendersPerPage) {
        await page.close();
        page = await openPage();
        rendersOnPage = 0;
      }
      rendersOnPage += 1;
      await page.evaluate((opts) => {
        const runtimeWindow = window as unknown as Window & {
          offlineRenderDriver: { startRender: (o: typeof opts) => unknown };
        };
        runtimeWindow.offlineRenderDriver.startRender(opts);
      }, renderOptions);

      const renderDeadline = Date.now() + 120000;
      let lastPhase = "";
      while (true) {
        const status = await page.evaluate(() => {
          const runtimeWindow = window as unknown as Window & {
            offlineRenderDriver: {
              getStatus: () => {
                status: string;
                phase: string;
                error: string | null;
                hasResult: boolean;
              };
            };
          };
          return runtimeWindow.offlineRenderDriver.getStatus();
        });
        if (typeof status?.phase === "string" && status.phase !== lastPhase) {
          lastPhase = status.phase;
          log(`[browser:status] ${status.phase}`);
        }
        if (status?.status === "complete" && status?.hasResult === true) break;
        if (status?.status === "error") {
          throw new Error(status.error || "Offline render failed in browser.");
        }
        if (Date.now() > renderDeadline) {
          throw new Error(
            `Offline render timed out after 120000ms (last phase: ${status?.phase || "unknown"}).`,
          );
        }
        await delay(20);
      }
      return page.evaluate(() => {
        const runtimeWindow = window as unknown as Window & {
          offlineRenderDriver: { consumeResult: () => BrowserRenderPayload };
        };
        return runtimeWindow.offlineRenderDriver.consumeResult();
      });
    };

    return { url, browserVersion: browser.version(), render, close };
  } catch (error) {
    await close();
    throw error;
  }
}

/** The samples of a payload rendered with `encodeSamples: "float32-base64"`. */
export function payloadSamples(payload: BrowserRenderPayload): Float32Array {
  if (typeof payload.samplesBase64 === "string") {
    // A copy, so the floats start on a four-byte boundary of their own buffer.
    const bytes = Uint8Array.from(Buffer.from(payload.samplesBase64, "base64"));
    return new Float32Array(bytes.buffer, 0, bytes.byteLength / 4);
  }
  return Float32Array.from(payload.samples);
}
