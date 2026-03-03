import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { createServer as createViteServer } from "vite";
import type {
  RenderBackend,
  RenderPayload,
  RenderRequest,
} from "../../../src/rendering/types.ts";

function resolveChromePath(): string | null {
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

async function createServer(root: string): Promise<{
  server: Awaited<ReturnType<typeof createViteServer>>;
  port: number;
}> {
  const extraAllow = [
    path.resolve(root, "..", "cel2js"),
    path.resolve(root, "..", "cel2js", "dist"),
  ];
  const server = await createViteServer({
    root,
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port: 0,
      fs: {
        allow: [root, ...extraAllow],
      },
    },
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    await server.close();
    throw new Error("Failed to start Vite server for offline render.");
  }
  return { server, port: address.port };
}

export const browserRuntimeBackend: RenderBackend = {
  id: "browser-runtime",
  supports(request: RenderRequest): boolean {
    return request.persistWav && request.renderHost === "browser";
  },
  async render(request: RenderRequest): Promise<RenderPayload> {
    if (!request.allowBrowserRender) {
      throw new Error(
        "Browser-backed rendering is disabled by default. Pass --allow-browser 1 to opt in.",
      );
    }

    const chromePath = request.browserExecutablePath ?? resolveChromePath();
    if (!chromePath) {
      throw new Error("No Chrome/Edge found. Set CHROME_PATH to continue.");
    }

    process.stderr.write("[browser:driver] starting vite server\n");
    const { server, port } = await createServer(request.repoRoot);
    process.stderr.write("[browser:driver] vite server ready\n");
    process.stderr.write("[browser:driver] launching browser\n");

    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
    try {
      browser = await chromium.launch({
        headless: true,
        timeout: 120000,
        executablePath: chromePath,
        args: [
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
        ],
      });
      process.stderr.write("[browser:driver] browser launched\n");

      process.stderr.write("[browser:driver] opening page\n");
      const page = await browser.newPage();
      process.stderr.write("[browser:driver] page opened\n");
      page.setDefaultTimeout(120000);
      page.setDefaultNavigationTimeout(120000);
      page.on("console", (msg) => {
        const text = msg.text();
        if (!text) return;
        process.stderr.write(`[browser:${msg.type()}] ${text}\n`);
      });
      page.on("pageerror", (error) => {
        const text =
          error instanceof Error ? error.stack ?? error.message : String(error);
        process.stderr.write(`[browser:pageerror] ${text}\n`);
      });
      const offlinePage =
        request.engine === "runtime"
          ? "test/render-runtime-offline.html"
          : "test/render-offline.html";
      process.stderr.write(`[browser:driver] navigating to ${offlinePage}\n`);
      await page.goto(`http://127.0.0.1:${port}/${offlinePage}`, {
        waitUntil: "load",
      });
      process.stderr.write("[browser:driver] page loaded\n");
      await page.waitForFunction(() => {
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
      }, { timeout: 120000 });
      process.stderr.write("[browser:driver] driver ready\n");

      const renderOptions = {
        phrase: request.phrase,
        baseF0: request.baseF0,
        engine: request.engine,
        frontendId: request.frontendId,
        experimentId: request.experimentId,
        rate: request.rate,
        transitionMs: request.transitionMs,
        sampleRate: request.sampleRate,
        leadTime: request.leadTime,
        tailTime: request.tailTime,
        includeTrack: request.includeTrack,
        noiseSeed: request.noiseSeed,
      };

      process.stderr.write("[browser:driver] starting render\n");
      await page.evaluate((opts) => {
        const runtimeWindow = window as unknown as Window & {
          offlineRenderDriver: {
            startRender: (o: typeof opts) => unknown;
          };
        };
        runtimeWindow.offlineRenderDriver.startRender(opts);
      }, renderOptions);
      process.stderr.write("[browser:driver] render started\n");

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
          process.stderr.write(`[browser:status] ${status.phase}\n`);
        }

        if (status?.status === "complete" && status?.hasResult === true) {
          break;
        }
        if (status?.status === "error") {
          throw new Error(status.error || "Offline render failed in browser.");
        }
        if (Date.now() > renderDeadline) {
          throw new Error(
            `Offline render timed out after 120000ms (last phase: ${status?.phase || "unknown"}).`,
          );
        }
        await delay(100);
      }

      process.stderr.write("[browser:driver] fetching result\n");
      const payload = await page.evaluate(() => {
        const runtimeWindow = window as unknown as Window & {
          offlineRenderDriver: {
            consumeResult: () => RenderPayload;
          };
        };
        return runtimeWindow.offlineRenderDriver.consumeResult();
      });
      process.stderr.write("[browser:driver] result fetched\n");
      return payload;
    } finally {
      if (browser) {
        await browser.close();
      }
      await server.close();
    }
  },
};
