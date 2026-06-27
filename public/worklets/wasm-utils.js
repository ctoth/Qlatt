export function computeRmsPeak(buffer) {
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i += 1) {
        const v = buffer[i];
        sum += v * v;
        const av = Math.abs(v);
        if (av > peak)
            peak = av;
    }
    return { rms: Math.sqrt(sum / buffer.length), peak };
}
export function resolveWasmUrl(filename) {
    return typeof URL === "function"
        ? new URL(filename, import.meta.url).toString()
        : `${import.meta.url.replace(/[^/]*$/, "")}${filename}`;
}
export const UNINITIALIZED_ALLOC = {
    memory: new WebAssembly.Memory({ initial: 1 }),
    alloc_f32: () => {
        throw new Error("WASM not initialized");
    },
    dealloc_f32: () => { },
};
export function fillParamBuffer(buffer, values, blockSize) {
    const len = values.length > 1 ? blockSize : 1;
    buffer.ensure(len);
    if (!buffer.view) {
        return len;
    }
    if (values.length > 1 && values.length === blockSize) {
        buffer.view.set(values);
    }
    else {
        buffer.view[0] = values.length > 0 ? values[0] : 0;
    }
    return len;
}
export async function initWasmModule(url, imports = {}, wasmBytes = null) {
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
        }
        catch {
            const bytes = await response.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);
        }
    }
    const bytes = await response.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
}
/**
 * Synchronously instantiate a WASM module from raw bytes.
 *
 * Unlike {@link initWasmModule} (which is async and used by AudioWorklet
 * processors via `instantiateStreaming`), this uses the synchronous
 * `WebAssembly.Module` / `WebAssembly.Instance` constructors. It exists for the
 * control-rate F0 kernel, which runs inside the fully-synchronous track
 * assembler (CLI, tests, and the main-thread frontend) where introducing an
 * `await` would force the entire assembly call-chain async.
 *
 * The synchronous compile path has a 4KB size limit only in browser main-thread
 * contexts; the F0 kernel is well under that. In Node there is no such limit.
 */
export function initWasmModuleSync(bytes, imports = {}) {
    // WebAssembly.Module accepts any BufferSource. Pass an ArrayBufferView
    // through unchanged so its byteOffset/byteLength are honored — a caller that
    // injects a Uint8Array.subarray() must compile only that window, not the
    // entire backing buffer.
    // WebAssembly.Module accepts any BufferSource at runtime, including views
    // backed by SharedArrayBuffer. The DOM `BufferSource` type is narrower —
    // it excludes ArrayBufferView<SharedArrayBuffer> — so the ArrayBuffer |
    // ArrayBufferView union isn't directly assignable under TS 5.9's lib. The
    // F0-kernel bytes are always ArrayBuffer-backed; assert the runtime-valid
    // type rather than copy. (Replaces a no-op `? bytes : bytes` ternary.)
    const source = bytes;
    const module = new WebAssembly.Module(source);
    return new WebAssembly.Instance(module, imports);
}
export class WasmBuffer {
    exports;
    ptr;
    len;
    view;
    constructor(exports) {
        this.exports = exports;
        this.ptr = 0;
        this.len = 0;
        this.view = null;
    }
    ensure(len) {
        if (len <= 0)
            return;
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
        if (!this.view)
            return;
        if (this.view.buffer !== this.exports.memory.buffer) {
            this.view = new Float32Array(this.exports.memory.buffer, this.ptr, this.len);
        }
    }
}
