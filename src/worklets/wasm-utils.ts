export function computeRmsPeak(buffer: Float32Array): { rms: number; peak: number } {
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const v = buffer[i];
    sum += v * v;
    const av = Math.abs(v);
    if (av > peak) peak = av;
  }
  return { rms: Math.sqrt(sum / buffer.length), peak };
}

export function resolveWasmUrl(filename: string): string {
  return typeof URL === "function"
    ? new URL(filename, import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}${filename}`;
}

export interface BaseProcessorOptions {
  processorOptions?: {
    debug?: boolean;
    nodeId?: string;
    reportInterval?: number;
    wasmBytes?: ArrayBuffer | ArrayBufferView;
  };
}

type WasmBytes = ArrayBuffer | ArrayBufferView | null;

export interface WasmAllocExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
}

export const UNINITIALIZED_ALLOC: WasmAllocExports = {
  memory: new WebAssembly.Memory({ initial: 1 }),
  alloc_f32: () => {
    throw new Error("WASM not initialized");
  },
  dealloc_f32: () => {},
};

export function fillParamBuffer(buffer: WasmBuffer, values: Float32Array, blockSize: number): number {
  const len = values.length > 1 ? blockSize : 1;
  buffer.ensure(len);
  if (!buffer.view) {
    return len;
  }
  if (values.length > 1 && values.length === blockSize) {
    buffer.view.set(values);
  } else {
    buffer.view[0] = values.length > 0 ? values[0] : 0;
  }
  return len;
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
  // Cache-bust WASM URLs so rebuilt modules load immediately in dev.
  const bustUrl = typeof url === "string"
    ? url + (url.includes("?") ? "&" : "?") + "v=" + Date.now()
    : url;
  const response = await fetch(bustUrl);
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
}
