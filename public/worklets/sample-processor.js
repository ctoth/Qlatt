import { computeRmsPeak, initWasmModule, resolveWasmUrl, } from "./wasm-utils.js";
/** Lifecycle and channel ownership for the Rust sample ABI; no DSP lives here. */
export class WasmSampleProcessor extends AudioWorkletProcessor {
    wasm = null;
    states = [];
    disposed = false;
    seed;
    nodeId;
    debug;
    interval;
    countdown;
    constructor(options, primitive, defaultNodeId) {
        super(options);
        const settings = options?.processorOptions;
        this.nodeId = settings?.nodeId || defaultNodeId;
        this.debug = Boolean(settings?.debug);
        this.interval = settings?.reportInterval || 50;
        this.countdown = this.interval;
        // Rust always receives an explicit u32 seed. Preserve the old seeded
        // path's truncation and zero mapping; choose fresh streams when omitted.
        const requested = settings?.seed;
        this.seed =
            (Number.isFinite(requested)
                ? Math.trunc(Number(requested)) >>> 0
                : primitive === "noise-source"
                    ? Math.floor(Math.random() * 0x100000000)
                    : 1) || 1;
        this.port.onmessage = (event) => {
            if (event.data?.type === "dispose") {
                this.disposed = true;
                this.release();
                this.wasm = null;
                this.port.close();
            }
            else if (event.data?.type === "reset") {
                this.release();
            }
            else if (event.data?.type === "ping" && this.wasm) {
                this.port.postMessage({ type: "ready", node: this.nodeId });
            }
        };
        const wasmUrl = resolveWasmUrl(`./${primitive}.wasm`);
        initWasmModule(wasmUrl, {}, settings?.wasmBytes)
            .then((loaded) => {
            if (this.disposed)
                return;
            const instance = loaded instanceof WebAssembly.Instance ? loaded : loaded.instance;
            const prefix = primitive.replaceAll("-", "_");
            this.wasm = {
                processor_new: instance.exports[`${prefix}_new`],
                processor_sample: instance.exports[`${prefix}_sample`],
                processor_free: instance.exports[`${prefix}_free`],
            };
            this.port.postMessage({ type: "ready", node: this.nodeId });
        })
            .catch((error) => {
            if (!this.disposed)
                this.port.postMessage({ type: "error", node: this.nodeId, message: String(error) });
        });
    }
    release() {
        for (const state of this.states)
            this.wasm?.processor_free(state);
        this.states = [];
    }
    sample(channel, input = 0, a = 0, b = 0, c = 0) {
        if (!this.wasm)
            return 0;
        this.states[channel] ??= this.wasm.processor_new(sampleRate, this.seed);
        return this.wasm.processor_sample(this.states[channel], input, a, b, c);
    }
    process(inputs, outputs, parameters) {
        if (this.disposed)
            return false;
        const output = outputs[0];
        if (!output?.[0])
            return true;
        if (!this.wasm) {
            for (const channel of output)
                channel.fill(0);
            return true;
        }
        const metrics = this.render(inputs[0] ?? [], output, parameters);
        if (this.debug && --this.countdown <= 0) {
            this.countdown = this.interval;
            this.port.postMessage({
                type: "metrics",
                node: this.nodeId,
                ...computeRmsPeak(output[0]),
                ...metrics,
            });
        }
        return true;
    }
}
export function paramAt(values, index, fallback) {
    return values?.[index] ?? values?.[0] ?? fallback;
}
