// Stevens (1971), pp. 1183-1186; Badin & Fant (1989), Eqs. 1-3.
// The WASM source owns the aerodynamic level law; downstream gain supplies
// the reference calibration only. Input 0 is the existing glottal envelope.
import { initWasmModule, resolveWasmUrl, WasmBuffer, } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./frication-source.wasm");
class FricationSourceProcessor extends AudioWorkletProcessor {
    wasm = null;
    state = 0;
    modulation = null;
    output = null;
    disposed = false;
    nodeId;
    static get parameterDescriptors() {
        return [
            { name: "area", defaultValue: 0, minValue: 0, maxValue: 2, automationRate: "k-rate" },
            { name: "flow", defaultValue: 0, minValue: 0, maxValue: 2000, automationRate: "k-rate" },
            {
                name: "pressureExponent",
                defaultValue: 1.3,
                minValue: 0,
                maxValue: 2,
                automationRate: "k-rate",
            },
            {
                name: "areaExponent",
                defaultValue: 0.3,
                minValue: 0,
                maxValue: 1,
                automationRate: "k-rate",
            },
        ];
    }
    constructor(options) {
        super(options);
        const settings = options?.processorOptions;
        this.nodeId = settings?.nodeId ?? "frication-source";
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
        const seed = settings?.seed ?? Math.floor(Math.random() * 0x100000000);
        initWasmModule(wasmUrl, {}, settings?.wasmBytes)
            .then((loaded) => {
            if (this.disposed)
                return;
            const instance = loaded instanceof WebAssembly.Instance ? loaded : loaded.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.frication_source_new(seed);
            this.modulation = new WasmBuffer(this.wasm);
            this.output = new WasmBuffer(this.wasm);
            this.port.postMessage({ type: "ready", node: this.nodeId });
        })
            .catch((error) => {
            if (this.disposed)
                return;
            this.port.postMessage({ type: "error", node: this.nodeId, message: String(error) });
        });
    }
    release() {
        if (!this.wasm)
            return;
        for (const buffer of [this.modulation, this.output]) {
            if (buffer?.ptr)
                this.wasm.dealloc_f32(buffer.ptr, buffer.len);
        }
        if (this.state)
            this.wasm.frication_source_free(this.state);
        this.state = 0;
        this.wasm = null;
        this.modulation = null;
        this.output = null;
    }
    process(inputs, outputs, params) {
        if (this.disposed)
            return false;
        const channel = outputs[0]?.[0];
        if (!channel)
            return true;
        channel.fill(0);
        if (!this.wasm || !this.modulation || !this.output)
            return true;
        this.modulation.ensure(channel.length);
        this.output.ensure(channel.length);
        // Either allocation can grow memory and detach the other buffer's view.
        this.modulation.refresh();
        this.output.refresh();
        const envelope = inputs[0]?.[0];
        if (envelope)
            this.modulation.view?.set(envelope.subarray(0, channel.length));
        this.wasm.frication_source_set_params(this.state, params.area?.[0] ?? 0, params.flow?.[0] ?? 0, params.pressureExponent?.[0] ?? 1.3, params.areaExponent?.[0] ?? 0.3, sampleRate);
        this.wasm.frication_source_process(this.state, envelope ? this.modulation.ptr : 0, this.output.ptr, channel.length);
        this.output.refresh();
        if (this.output.view)
            channel.set(this.output.view.subarray(0, channel.length));
        return true;
    }
}
registerProcessor("frication-source-processor", FricationSourceProcessor);
