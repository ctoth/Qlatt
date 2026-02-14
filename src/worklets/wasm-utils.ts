type WasmBytes = ArrayBuffer | ArrayBufferView | null;

export interface WasmAllocExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
}

export async function initWasmModule(
  url: string | URL | null,
  imports: WebAssembly.Imports = {},
  wasmBytes: WasmBytes = null
) {
  if (wasmBytes) {
    const bytes = wasmBytes instanceof ArrayBuffer ? wasmBytes : wasmBytes.buffer;
    return await WebAssembly.instantiate(bytes, imports);
  }

  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this worklet; provide wasmBytes");
  }

  if (!url) {
    throw new Error("WASM URL is required when wasmBytes is not provided");
  }
  const response = await fetch(url);
  if (WebAssembly.instantiateStreaming) {
    try {
      return await WebAssembly.instantiateStreaming(response, imports);
    } catch {
      const bytes = await response.arrayBuffer();
      return await WebAssembly.instantiate(bytes, imports);
    }
  }
  const bytes = await response.arrayBuffer();
  return await WebAssembly.instantiate(bytes, imports);
}

export class WasmBuffer {
  exports: WasmAllocExports;
  ptr: number;
  len: number;
  view: Float32Array | null;

  constructor(exports: WasmAllocExports) {
    this.exports = exports;
    this.ptr = 0;
    this.len = 0;
    this.view = null;
  }

  ensure(len: number): void {
    if (len <= 0) return;
    const needsAlloc = !this.ptr || len > this.len;
    if (needsAlloc) {
      if (this.ptr) {
        this.exports.dealloc_f32(this.ptr, this.len);
      }
      this.ptr = this.exports.alloc_f32(len);
      this.len = len;
      this.view = new Float32Array(this.exports.memory.buffer, this.ptr, len);
      return;
    }
    this.refresh();
  }

  refresh(): void {
    if (!this.view) return;
    if (this.view.buffer !== this.exports.memory.buffer) {
      this.view = new Float32Array(this.exports.memory.buffer, this.ptr, this.len);
    }
  }

  free(): void {
    if (!this.ptr) return;
    this.exports.dealloc_f32(this.ptr, this.len);
    this.ptr = 0;
    this.len = 0;
    this.view = null;
  }
}
