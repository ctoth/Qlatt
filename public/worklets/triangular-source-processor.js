/**
 * Triangular glottal source AudioWorklet processor
 * Wraps the triangular-source WASM primitive
 *
 * Implements a simple triangular glottal pulse waveform with configurable:
 * - f0: Fundamental frequency (pitch)
 * - openQuotient: Fraction of period that glottis is open
 * - asymmetry: klsyn88-style asymmetry percent (0..100, 50=symmetric)
 */
import { initWasmModule, computeRmsPeak, resolveWasmUrl } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./triangular-source.wasm");
class TriangularSourceProcessor extends AudioWorkletProcessor {
    disposed = false;
    wasm;
    state;
    ready;
    lastF0;
    lastOQ;
    lastAsym;
    debug;
    nodeId;
    reportInterval;
    _reportCountdown;
    static get parameterDescriptors() {
        return [
            { name: "f0", defaultValue: 100, minValue: 20, maxValue: 500, automationRate: "a-rate" },
            {
                name: "openQuotient",
                defaultValue: 0.5,
                minValue: 0.01,
                maxValue: 0.99,
                automationRate: "a-rate",
            },
            { name: "asymmetry", defaultValue: 50, minValue: 0, maxValue: 100, automationRate: "a-rate" },
        ];
    }
    constructor(options) {
        super(options);
        const opts = options;
        this.wasm = null;
        this.state = 0;
        this.ready = false;
        this.lastF0 = 0;
        this.lastOQ = 0;
        this.lastAsym = 0;
        this.debug = Boolean(opts?.processorOptions?.debug);
        this.nodeId = opts?.processorOptions?.nodeId || "triangular-source";
        this.reportInterval = opts?.processorOptions?.reportInterval || 50;
        this._reportCountdown = this.reportInterval;
        this.port.onmessage = (event) => {
            if (event?.data?.type === "dispose") {
                this.disposed = true;
                this.port.close();
                return;
            }
            if (event?.data?.type === "ping" && this.ready) {
                this.port.postMessage({ type: "ready", node: this.nodeId });
            }
            else if (event?.data?.type === "reset") {
                if (this.ready && this.wasm?.triangular_source_reset) {
                    this.wasm.triangular_source_reset(this.state);
                }
            }
        };
        const wasmBytes = opts?.processorOptions?.wasmBytes;
        initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
            const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.triangular_source_new(sampleRate);
            this.ready = true;
            this.port.postMessage({ type: "ready", node: this.nodeId });
        });
    }
    process(_inputs, outputs, parameters) {
        if (this.disposed)
            return false;
        const output = outputs[0];
        if (!output || !output[0]) {
            return true;
        }
        const outputChannel = output[0];
        const blockSize = outputChannel.length;
        if (!this.ready || !this.wasm) {
            outputChannel.fill(0);
            return true;
        }
        const f0Values = parameters.f0 ?? new Float32Array([100]);
        const oqValues = parameters.openQuotient ?? new Float32Array([0.5]);
        const asymValues = parameters.asymmetry ?? new Float32Array([50]);
        const firstF0 = f0Values[0] ?? 100;
        const firstOq = oqValues[0] ?? 0.5;
        const firstAsym = asymValues[0] ?? 50;
        // Track last values for metrics
        if (f0Values.length > 0) {
            this.lastF0 = f0Values[f0Values.length - 1];
        }
        if (oqValues.length > 0) {
            this.lastOQ = oqValues[oqValues.length - 1];
        }
        if (asymValues.length > 0) {
            this.lastAsym = asymValues[asymValues.length - 1];
        }
        // Process sample by sample (triangular source uses per-sample API)
        for (let i = 0; i < blockSize; i += 1) {
            const f0Val = f0Values.length > 1 ? (f0Values[i] ?? firstF0) : firstF0;
            const oqVal = oqValues.length > 1 ? (oqValues[i] ?? firstOq) : firstOq;
            const asymVal = asymValues.length > 1 ? (asymValues[i] ?? firstAsym) : firstAsym;
            outputChannel[i] = this.wasm.triangular_source_process(this.state, f0Val, oqVal, asymVal);
        }
        this._reportMetrics(outputChannel);
        return true;
    }
    _reportMetrics(buffer) {
        if (!this.debug)
            return;
        this._reportCountdown -= 1;
        if (this._reportCountdown > 0)
            return;
        this._reportCountdown = this.reportInterval;
        const { rms, peak } = computeRmsPeak(buffer);
        const payload = {
            type: "metrics",
            node: this.nodeId,
            rms,
            peak,
            f0: this.lastF0,
            openQuotient: this.lastOQ,
            asymmetry: this.lastAsym,
        };
        this.port.postMessage(payload);
    }
}
registerProcessor("triangular-source-processor", TriangularSourceProcessor);
