#!/usr/bin/env node

/**
 * serve-dist-delayed.ts
 * =====================
 * Serve the production build (`dist/`, from `npm run build`) with a fixed
 * delay before every response, to see on one machine what a page does when
 * every request is a network round trip. `vite preview` answers in about a
 * millisecond, which hides the cost of requests made one after another.
 *
 * The delay is applied per request and requests are served concurrently, so
 * requests made in parallel wait once and requests made in series wait once
 * each, as on a real connection. It models latency only, not bandwidth.
 *
 * Usage:
 *   node --experimental-strip-types scripts/serve-dist-delayed.ts [--port 8139] [--delay-ms 80]
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(repoRoot, "dist");
const argv = process.argv.slice(2);
const flag = (name: string, fallback: number): number => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? Number(argv[index + 1]) : fallback;
};
const port = flag("port", 8139);
const delayMs = flag("delay-ms", 80);

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".wasm": "application/wasm",
  ".wav": "audio/wav",
};

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error(`${dist} has no index.html: run npm run build first`);
  process.exit(2);
}

http
  .createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const file = path.join(dist, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    setTimeout(() => {
      // Stay inside dist/.
      if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
        // No caching: every request pays the delay, as on a first visit.
        "Cache-Control": "no-store",
      });
      fs.createReadStream(file).pipe(response);
    }, delayMs);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`dist/ at http://localhost:${port}/ with ${delayMs} ms before every response`);
  });
