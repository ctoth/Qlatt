/**
 * Tests for the synchronous f0-filters WASM loader and the kernel's FFI
 * shape-validation status codes.
 *
 * In Node (vitest) the loader reads the wasm from public/worklets via the
 * filesystem, so getF0FilterExports() works without a preload. We also verify
 * the browser inject path (setF0FilterWasmBytes), the isF0FilterLoaded guard,
 * and that render_f0 returns the documented RENDER_ERR_* codes on malformed
 * descriptors instead of trapping.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getF0FilterExports,
  setF0FilterWasmBytes,
  isF0FilterLoaded,
  RENDER_OK,
} from "../src/f0-filters-loader";

// Status codes mirrored from crates/f0-filters/src/lib.rs.
const RENDER_ERR_SCALARS = -1;
const RENDER_ERR_OUT = -2;
const RENDER_ERR_BUFFER = -3;
const RENDER_ERR_CMD_RANGE = -4;
const RENDER_ERR_PROFILE_RANGE = -5;

const WASM_PATH = resolve(process.cwd(), "public/worklets/f0-filters.wasm");

function wasmBytes(): ArrayBuffer {
  const buf = readFileSync(WASM_PATH);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/** Write an f64 array into wasm memory; returns its pointer. */
function writeF64(
  exports: ReturnType<typeof getF0FilterExports>,
  values: number[]
): number {
  if (values.length === 0) return 0;
  const ptr = exports.alloc_f64(values.length);
  new Float64Array(exports.memory.buffer, ptr, values.length).set(values);
  return ptr;
}

describe("f0-filters-loader", () => {
  it("loads working exports in Node via the filesystem", () => {
    const exports = getF0FilterExports();
    expect(typeof exports.render_f0).toBe("function");
    expect(typeof exports.alloc_f64).toBe("function");
    expect(typeof exports.dealloc_f64).toBe("function");
    expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
  });

  it("reports loaded state and re-instantiates after setF0FilterWasmBytes", () => {
    // After at least one getF0FilterExports() call the singleton is loaded.
    getF0FilterExports();
    expect(isF0FilterLoaded()).toBe(true);

    // Injecting fresh bytes resets the singleton; the next get re-instantiates.
    setF0FilterWasmBytes(wasmBytes());
    expect(isF0FilterLoaded()).toBe(true);
    const exports = getF0FilterExports();
    expect(typeof exports.render_f0).toBe("function");
  });

  it("render_f0 returns RENDER_OK and renders on valid minimal input", () => {
    const exports = getF0FilterExports();
    // one-pole pass-through, no scale, wide clamp, frame_period 0.005.
    const scalars = [
      0.005, 0.05, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 4096, 0.1, -1e9, 1e9, 0,
    ];
    const layers = [1, 0, 4, 0.01, 0.9, 0, 1]; // persistent, cmd_start 0, count 1
    const cmds = [0, 100, 0, 0, 0];
    const numFrames = 11;

    const scalarsPtr = writeF64(exports, scalars);
    const layersPtr = writeF64(exports, layers);
    const cmdsPtr = writeF64(exports, cmds);
    const outPtr = exports.alloc_f64(numFrames);

    const status = exports.render_f0(
      scalarsPtr,
      scalars.length,
      layersPtr,
      1,
      cmdsPtr,
      1,
      0,
      0,
      outPtr,
      numFrames
    );
    expect(status).toBe(RENDER_OK);
    const out = new Float64Array(exports.memory.buffer, outPtr, numFrames);
    expect(out[numFrames - 1]).toBe(100);

    exports.dealloc_f64(scalarsPtr, scalars.length);
    exports.dealloc_f64(layersPtr, layers.length);
    exports.dealloc_f64(cmdsPtr, cmds.length);
    exports.dealloc_f64(outPtr, numFrames);
  });

  it("render_f0 returns RENDER_ERR_SCALARS when the header is too short", () => {
    const exports = getF0FilterExports();
    const scalars = [0.005, 0.05]; // < 16
    const scalarsPtr = writeF64(exports, scalars);
    const outPtr = exports.alloc_f64(4);
    const status = exports.render_f0(scalarsPtr, scalars.length, 0, 0, 0, 0, 0, 0, outPtr, 4);
    expect(status).toBe(RENDER_ERR_SCALARS);
    exports.dealloc_f64(scalarsPtr, scalars.length);
    exports.dealloc_f64(outPtr, 4);
  });

  it("render_f0 returns RENDER_ERR_OUT when out pointer is null", () => {
    const exports = getF0FilterExports();
    const scalars = [
      0.005, 0.05, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 4096, 0.1, -1e9, 1e9, 0,
    ];
    const scalarsPtr = writeF64(exports, scalars);
    const status = exports.render_f0(scalarsPtr, scalars.length, 0, 0, 0, 0, 0, 0, 0, 4);
    expect(status).toBe(RENDER_ERR_OUT);
    exports.dealloc_f64(scalarsPtr, scalars.length);
  });

  it("render_f0 returns RENDER_ERR_BUFFER when a nonzero count has a null pointer", () => {
    const exports = getF0FilterExports();
    const scalars = [
      0.005, 0.05, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 4096, 0.1, -1e9, 1e9, 0,
    ];
    const scalarsPtr = writeF64(exports, scalars);
    const outPtr = exports.alloc_f64(4);
    // n_layers = 1 but layers pointer is 0 (null).
    const status = exports.render_f0(scalarsPtr, scalars.length, 0, 1, 0, 0, 0, 0, outPtr, 4);
    expect(status).toBe(RENDER_ERR_BUFFER);
    exports.dealloc_f64(scalarsPtr, scalars.length);
    exports.dealloc_f64(outPtr, 4);
  });

  it("render_f0 returns RENDER_ERR_CMD_RANGE when a layer overruns the commands buffer", () => {
    const exports = getF0FilterExports();
    const scalars = [
      0.005, 0.05, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 4096, 0.1, -1e9, 1e9, 0,
    ];
    const layers = [1, 0, 4, 0.01, 0.9, 0, 5]; // cmd_count 5 but only 1 command
    const cmds = [0, 100, 0, 0, 0];
    const scalarsPtr = writeF64(exports, scalars);
    const layersPtr = writeF64(exports, layers);
    const cmdsPtr = writeF64(exports, cmds);
    const outPtr = exports.alloc_f64(4);
    // Pre-fill out to confirm it is untouched on error.
    new Float64Array(exports.memory.buffer, outPtr, 4).fill(-999);
    const status = exports.render_f0(
      scalarsPtr,
      scalars.length,
      layersPtr,
      1,
      cmdsPtr,
      1,
      0,
      0,
      outPtr,
      4
    );
    expect(status).toBe(RENDER_ERR_CMD_RANGE);
    const out = new Float64Array(exports.memory.buffer, outPtr, 4);
    expect(Array.from(out)).toEqual([-999, -999, -999, -999]);
    exports.dealloc_f64(scalarsPtr, scalars.length);
    exports.dealloc_f64(layersPtr, layers.length);
    exports.dealloc_f64(cmdsPtr, cmds.length);
    exports.dealloc_f64(outPtr, 4);
  });

  it("render_f0 returns RENDER_ERR_PROFILE_RANGE when a command overruns the profile pool", () => {
    const exports = getF0FilterExports();
    const scalars = [
      0.005, 0.05, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 4096, 0.1, -1e9, 1e9, 0,
    ];
    const layers = [0, 0, 4, 0.01, 0.9, 0, 1]; // profile layer
    const cmds = [0, 0, 0, 0, 4]; // profile_start 0, profile_count 4
    const profiles = [10, 20]; // only 2 points
    const scalarsPtr = writeF64(exports, scalars);
    const layersPtr = writeF64(exports, layers);
    const cmdsPtr = writeF64(exports, cmds);
    const profilesPtr = writeF64(exports, profiles);
    const outPtr = exports.alloc_f64(4);
    const status = exports.render_f0(
      scalarsPtr,
      scalars.length,
      layersPtr,
      1,
      cmdsPtr,
      1,
      profilesPtr,
      2,
      outPtr,
      4
    );
    expect(status).toBe(RENDER_ERR_PROFILE_RANGE);
    exports.dealloc_f64(scalarsPtr, scalars.length);
    exports.dealloc_f64(layersPtr, layers.length);
    exports.dealloc_f64(cmdsPtr, cmds.length);
    exports.dealloc_f64(profilesPtr, profiles.length);
    exports.dealloc_f64(outPtr, 4);
  });
});
