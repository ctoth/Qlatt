export async function initWasmModule(url, imports = {}, wasmBytes = null) {
  if (wasmBytes) {
    const bytes =
      wasmBytes instanceof ArrayBuffer ? wasmBytes : wasmBytes.buffer;
    return await WebAssembly.instantiate(bytes, imports);
  }

  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this worklet; provide wasmBytes");
  }

  const response = await fetch(url);
  if (WebAssembly.instantiateStreaming) {
    try {
      return await WebAssembly.instantiateStreaming(response, imports);
    } catch (err) {
      const bytes = await response.arrayBuffer();
      return await WebAssembly.instantiate(bytes, imports);
    }
  }
  const bytes = await response.arrayBuffer();
  return await WebAssembly.instantiate(bytes, imports);
}

export class WasmBuffer {
  constructor(exports) {
    this.exports = exports;
    this.ptr = 0;
    this.len = 0;
    this.view = null;
  }

  ensure(len) {
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

  refresh() {
    if (!this.view) return;
    if (this.view.buffer !== this.exports.memory.buffer) {
      this.view = new Float32Array(this.exports.memory.buffer, this.ptr, this.len);
    }
  }

  free() {
    if (!this.ptr) return;
    this.exports.dealloc_f32(this.ptr, this.len);
    this.ptr = 0;
    this.len = 0;
    this.view = null;
  }
}
