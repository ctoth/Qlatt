/**
 * Synchronous loader for the f0-filters WASM kernel.
 *
 * The track assembler (`renderLayeredF0`) is a fully-synchronous pipeline used
 * by the explain CLI, the vitest suite, and the main-thread frontend. To call
 * the Rust→WASM F0 kernel from that sync context without making the whole
 * call-chain async, we instantiate the module synchronously
 * (`new WebAssembly.Module` / `new WebAssembly.Instance`) once and reuse it.
 *
 * - In Node (CLI / tests): the wasm bytes are read lazily via `fs.readFileSync`
 *   from `public/worklets/f0-filters.wasm`.
 * - In the browser: call `setF0FilterWasmBytes(bytes)` once during app init
 *   (after a one-time async fetch) before the first synthesis call.
 */
import { initWasmModuleSync } from "./worklets/wasm-utils";
import { isNodeRuntime, readBinaryFromFsSync } from "./path-utils";

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
    numFrames: number
  ): number;
}

/** render_f0 success status code (mirrors RENDER_OK in crates/f0-filters/src/lib.rs). */
export const RENDER_OK = 0;

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
 * Browser preload: fetch the f0-filters WASM once and inject its bytes so the
 * synchronous `renderLayeredF0` path can instantiate it without an await.
 *
 * Idempotent — a no-op once bytes are already loaded. Call this during app /
 * harness init (or at the start of any synthesis entry point) BEFORE the first
 * synchronous `textToKlattTrack` / `renderLayeredF0`. In Node the filesystem
 * path is used automatically and this is unnecessary.
 *
 * @param wasmUrl URL to `f0-filters.wasm` (e.g. `${BASE_URL}worklets/f0-filters.wasm`).
 */
export async function preloadF0Filters(wasmUrl: string): Promise<void> {
  if (isF0FilterLoaded()) return;
  if (typeof fetch !== "function") {
    throw new Error("preloadF0Filters requires fetch; in Node the filesystem path is used.");
  }
  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`preloadF0Filters: failed to fetch ${wasmUrl} (HTTP ${response.status})`);
  }
  const bytes = await response.arrayBuffer();
  setF0FilterWasmBytes(bytes);
}

function loadBytesFromNode(): ArrayBuffer {
  // Reuse the project's filesystem probe (cwd/public, cwd, absolute). The wasm
  // is a build artifact copied to public/worklets by build.ps1 / build.sh.
  const bytes = readBinaryFromFsSync("/public/worklets/f0-filters.wasm");
  if (!bytes) {
    throw new Error(
      "f0-filters.wasm not found under public/worklets. Run build.ps1 / build.sh."
    );
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
        "f0-filters WASM not loaded. Call setF0FilterWasmBytes(bytes) during app init."
      );
    }
    cachedInstance = initWasmModuleSync(bytes);
  }
  return cachedInstance.exports as unknown as F0FilterExports;
}
