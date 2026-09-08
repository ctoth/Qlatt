// Steinecke & Herzel (1995), Eqs.1-10, 38. Input: Ps in cm H2O.
// Output: glottal volume flow in cm³/ms; tract filtering remains downstream.
import { initWasmModule, resolveWasmUrl, WasmBuffer, } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./two-mass-source.wasm");
class TwoMassSourceProcessor extends AudioWorkletProcessor {
    wasm = null;
    state = 0;
    pressure = null;
    output = null;
    disposed = false;
    invalid = false;
    nodeId;
    static get parameterDescriptors() {
        return [
            { name: "asymmetry", defaultValue: 1, minValue: 0.4, maxValue: 1, automationRate: "k-rate" },
            { name: "enable", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
        ];
    }
    constructor(options) {
        super(options);
        const settings = options?.processorOptions;
        this.nodeId = settings?.nodeId ?? "two-mass-source";
        this.port.onmessage = (event) => {
            if (event.data?.type === "dispose") {
                this.disposed = true;
                this.release();
                this.port.close();
            }
            else if (event.data?.type === "ping" && this.wasm) {
                this.port.postMessage({ type: "ready", node: this.nodeId });
            }
        };
        initWasmModule(wasmUrl, {}, settings?.wasmBytes)
            .then((loaded) => {
            if (this.disposed)
                return;
            const instance = loaded instanceof WebAssembly.Instance ? loaded : loaded.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.two_mass_source_new();
            this.pressure = new WasmBuffer(this.wasm);
            this.output = new WasmBuffer(this.wasm);
            this.port.postMessage({ type: "ready", node: this.nodeId });
        })
            .catch((error) => {
            if (!this.disposed)
                this.port.postMessage({ type: "error", node: this.nodeId, message: String(error) });
        });
    }
    release() {
        if (!this.wasm)
            return;
        for (const buffer of [this.pressure, this.output]) {
            if (buffer?.ptr)
                this.wasm.dealloc_f32(buffer.ptr, buffer.len);
        }
        if (this.state)
            this.wasm.two_mass_source_free(this.state);
        this.state = 0;
        this.wasm = null;
        this.pressure = null;
        this.output = null;
    }
    process(inputs, outputs, params) {
        if (this.disposed)
            return false;
        const channel = outputs[0]?.[0];
        if (!channel)
            return true;
        channel.fill(0);
        if (!this.wasm || !this.pressure || !this.output)
            return true;
        this.pressure.ensure(channel.length);
        this.output.ensure(channel.length);
        this.pressure.refresh();
        this.output.refresh();
        // Missing/disconnected pressure means no energy supply. Clear every block
        // so a previously connected input cannot leave stale pressure in WASM.
        this.pressure.view?.fill(0);
        const pressure = inputs[0]?.[0];
        if (pressure)
            this.pressure.view?.set(pressure.subarray(0, channel.length));
        const invalid = this.wasm.two_mass_source_process(this.state, this.pressure.ptr, this.output.ptr, channel.length, params.asymmetry?.[0] ?? 1, sampleRate, params.enable?.[0] ?? 0) !== 0;
        if (invalid && !this.invalid)
            this.port.postMessage({
                type: "error",
                node: this.nodeId,
                message: "Invalid two-mass pressure, tension or sample rate; affected samples silenced and state reset",
            });
        this.invalid = invalid;
        this.output.refresh();
        if (this.output.view)
            channel.set(this.output.view.subarray(0, channel.length));
        return true;
    }
}
registerProcessor("two-mass-source-processor", TwoMassSourceProcessor);
