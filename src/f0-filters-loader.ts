/**
 * Synchronous loader for the f0-filters WASM kernel.
 *
 * The track assembler (`renderLayeredF0`) is a fully-synchronous pipeline used
 * by the explain CLI, the vitest suite, and the main-thread frontend. To call
 * the Rust→WASM F0 kernel from that sync context without making the whole
 * call-chain async, we instantiate the module synchronously
 * (`new WebAssembly.Module` / `new WebAssembly.Instance`) once and reuse it.
 *
 * - The Node audio renderer preloads bytes through its selected asset loader.
 *   Other Node callers retain the lazy `fs.readFileSync` fallback from
 *   `public/worklets/f0-filters.wasm`.
 * - In the browser: call `setF0FilterWasmBytes(bytes)` once during app init
 *   (after a one-time async fetch) before the first synthesis call.
 */

import { isNodeRuntime, readBinaryFromFsSync } from "./path-utils";
import type { RuntimeAssetLoader } from "./runtime-assets/types";
import { initWasmModuleSync } from "./worklets/wasm-utils";

export interface F0FilterExports {
  memory: WebAssembly.Memory;
  alloc_f64(len: number): number;
  dealloc_f64(ptr: number, len: number): void;
  /** Returns a status code: 0 (RENDER_OK) on success, negative on malformed input. */
  render_f0(
    scalarsPtr: number,
    scalarsLen: number,
    layersPtr: number,
    nLayers: number,
    cmdsPtr: number,
    nCmds: number,
    profilesPtr: number,
    nProfiles: number,
    outPtr: number,
    numFrames: number,
  ): number;
}

/** render_f0 success status code (mirrors RENDER_OK in crates/f0-filters/src/lib.rs). */
export const RENDER_OK = 0;

/** render_f0's error status codes by name (mirrors RENDER_ERR_* in crates/f0-filters/src/lib.rs). */
export const RENDER_ERROR_NAMES: Readonly<Record<number, string>> = {
  [-1]: "RENDER_ERR_SCALARS",
  [-2]: "RENDER_ERR_OUT",
  [-3]: "RENDER_ERR_BUFFER",
  [-4]: "RENDER_ERR_CMD_RANGE",
  [-5]: "RENDER_ERR_PROFILE_RANGE",
  [-6]: "RENDER_ERR_PHASE_RANGE",
};

/** A render_f0 status as its name and number, for an error message. */
export function describeRenderStatus(status: number): string {
  return `${RENDER_ERROR_NAMES[status] ?? "unknown status"} (${status.toString()})`;
}

let cachedInstance: WebAssembly.Instance | null = null;
let injectedBytes: ArrayBuffer | ArrayBufferView | null = null;

/**
 * Inject the f0-filters WASM bytes for environments without filesystem access
 * (the browser). Must be called before the first `renderLayeredF0` invocation.
 */
export function setF0FilterWasmBytes(bytes: ArrayBuffer | ArrayBufferView): void {
  injectedBytes = bytes;
  cachedInstance = null;
}

/** True once bytes have been injected or instantiated (browser preload guard). */
export function isF0FilterLoaded(): boolean {
  return cachedInstance !== null || injectedBytes !== null;
}

/**
 * Preload the f0-filters WASM through the selected loader and inject its bytes so the
 * synchronous `renderLayeredF0` path can instantiate it without an await.
 *
 * Idempotent — a no-op once bytes are already loaded. Call this during app /
 * harness init (or at the start of any synthesis entry point) BEFORE the first
 * synchronous `textToKlattTrack` / `renderLayeredF0`. Node callers without a
 * preload retain the automatic synchronous filesystem fallback.
 *
 * @param assetLoader Selected worklet asset loader; owns fetching and load errors.
 */
export async function preloadF0Filters(assetLoader: RuntimeAssetLoader): Promise<void> {
  if (isF0FilterLoaded()) return;
  const bytes = await assetLoader.loadWasmModule("f0-filters.wasm");
  setF0FilterWasmBytes(bytes);
}

function loadBytesFromNode(): ArrayBuffer {
  // Reuse the package-relative filesystem probe. The wasm
  // is a build artifact copied to public/worklets by build.ps1 / build.sh.
  const bytes = readBinaryFromFsSync("/public/worklets/f0-filters.wasm");
  if (!bytes) {
    throw new Error("f0-filters.wasm not found under public/worklets. Run build.ps1 / build.sh.");
  }
  return bytes;
}

/**
 * Get the singleton f0-filters WASM exports, instantiating synchronously on
 * first use.
 */
export function getF0FilterExports(): F0FilterExports {
  if (!cachedInstance) {
    let bytes: ArrayBuffer | ArrayBufferView;
    if (injectedBytes) {
      bytes = injectedBytes;
    } else if (isNodeRuntime()) {
      bytes = loadBytesFromNode();
    } else {
      throw new Error(
        "f0-filters WASM not loaded. Call setF0FilterWasmBytes(bytes) during app init.",
      );
    }
    cachedInstance = initWasmModuleSync(bytes);
  }
  return cachedInstance.exports as unknown as F0FilterExports;
}
