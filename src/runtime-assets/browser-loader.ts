import type { RuntimeAssetLoader } from "./types";

function normalizeBasePath(basePath: string): string {
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

export function createBrowserRuntimeAssetLoader(
  basePath: string = ((typeof import.meta !== "undefined" && import.meta.env.BASE_URL) || "/") +
    "worklets/",
): RuntimeAssetLoader {
  const normalizedBase = normalizeBasePath(basePath.replace(/\\/g, "/"));
  return {
    resolveWorkletModule(moduleName: string): string {
      return `${normalizedBase}${moduleName}`;
    },
    async loadWasmModule(wasmName: string): Promise<ArrayBuffer> {
      const url = `${normalizedBase}${wasmName}`;
      const bustUrl = url + (url.includes("?") ? "&" : "?") + "v=" + Date.now();
      const response = await fetch(bustUrl);
      if (!response.ok) {
        throw new Error(`Failed to load WASM module '${wasmName}' (${response.status})`);
      }
      return await response.arrayBuffer();
    },
  };
}
