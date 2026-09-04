import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { readBinaryFromFsSync, resolveFileFromFsSync } from "../path-utils";
import type { RuntimeAssetLoader } from "./types";

type NodeRuntimeAssetLoader = RuntimeAssetLoader;

function readUtf8File(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function inlineWasmUtils(moduleSource: string, wasmUtilsSource: string): string {
  const importPattern = /^import\s*\{[^}]+\}\s*from\s*["']\.\/wasm-utils\.js["'];?\s*$/m;
  let transformed = moduleSource;
  if (importPattern.test(transformed)) {
    transformed = transformed.replace(importPattern, `${wasmUtilsSource}\n`);
  }
  transformed = transformed.replace(
    /const\s+wasmUrl\s*=\s*resolveWasmUrl\([^;]+\);/g,
    "const wasmUrl = null;",
  );
  transformed = transformed.replace(
    /registerProcessor\((["'][^"']+["']),\s*([A-Za-z_$][A-Za-z0-9_$]*)\);/g,
    [
      "const __qlattCtor = $2;",
      "const __qlattOrigProcess = __qlattCtor.prototype.process;",
      'if (typeof __qlattOrigProcess === "function") {',
      "  __qlattCtor.prototype.process = function (...args) {",
      "    try {",
      "      return __qlattOrigProcess.apply(this, args);",
      "    } catch (error) {",
      "      try {",
      "        this.port.postMessage({",
      '          type: "__qlatt_process_error__",',
      '          node: this.nodeId || "unknown",',
      "          error: error instanceof Error ? (error.stack || error.message) : String(error),",
      "        });",
      "      } catch {}",
      "      throw error;",
      "    }",
      "  };",
      "}",
      "registerProcessor($1, __qlattCtor);",
    ].join("\n"),
  );
  return transformed;
}

export async function createNodeRuntimeAssetLoader(
  baseDir: string,
): Promise<NodeRuntimeAssetLoader> {
  const normalizedDir = path.resolve(baseDir);
  const wasmUtilsPath = path.resolve(normalizedDir, "wasm-utils.js");
  const wasmUtilsSource = readUtf8File(wasmUtilsPath);
  const transformedModules = new Map<string, string>();

  const server = http.createServer((req, res) => {
    try {
      const pathname = req.url
        ? decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname)
        : "/";
      const moduleName = pathname.replace(/^\/+/, "");
      if (!moduleName) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }

      let source = transformedModules.get(moduleName);
      if (!source) {
        const resolved = resolveFileFromFsSync(path.resolve(normalizedDir, moduleName));
        if (!resolved) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        source = inlineWasmUtils(readUtf8File(resolved), wasmUtilsSource);
        transformedModules.set(moduleName, source);
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      res.end(source);
    } catch (error) {
      res.statusCode = 500;
      const message = error instanceof Error ? error.message : String(error);
      res.end(message);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to start local worklet asset server.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    resolveWorkletModule(moduleName: string): string {
      return `${baseUrl}/${encodeURIComponent(moduleName)}`;
    },
    async loadWasmModule(wasmName: string): Promise<ArrayBuffer> {
      const candidate = path.resolve(normalizedDir, wasmName);
      const bytes = readBinaryFromFsSync(candidate);
      if (!bytes) {
        throw new Error(`Unable to load WASM module '${wasmName}' from '${normalizedDir}'`);
      }
      return bytes;
    },
    async dispose(): Promise<void> {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
