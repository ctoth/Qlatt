/**
 * Pitch-synchronous F1 resonator AudioWorklet processor
 * Wraps the pitch-sync-mod WASM primitive
 * F1/B1 modulation synchronized to glottal cycle
 */
import { initWasmModule, WasmBuffer, computeRmsPeak, resolveWasmUrl } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./pitch-sync-mod.wasm");
class PitchSyncModProcessor extends AudioWorkletProcessor {
    disposed = false;
    wasm;
    state;
    inputBuffer;
    outputBuffer;
    f0Buffer;
    f1Buffer;
    b1Buffer;
    dF1Buffer;
    dB1Buffer;
    ready;
    debug;
    nodeId;
    reportInterval;
    _reportCountdown;
    static get parameterDescriptors() {
        return [
            { name: "f0", defaultValue: 100, minValue: 20, maxValue: 500, automationRate: "a-rate" },
            {
                name: "openQuotient",
                defaultValue: 50,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            },
            { name: "f1", defaultValue: 500, minValue: 100, maxValue: 1500, automationRate: "a-rate" },
            { name: "b1", defaultValue: 80, minValue: 30, maxValue: 500, automationRate: "a-rate" },
            { name: "dF1", defaultValue: 0, minValue: 0, maxValue: 500, automationRate: "a-rate" },
            { name: "dB1", defaultValue: 0, minValue: 0, maxValue: 500, automationRate: "a-rate" },
            { name: "skew", defaultValue: 0, minValue: 0, maxValue: 200, automationRate: "k-rate" },
            { name: "source", defaultValue: 2, minValue: 1, maxValue: 4, automationRate: "k-rate" },
        ];
    }
    constructor(options) {
        super(options);
        const opts = options;
        this.wasm = null;
        this.state = 0;
        this.inputBuffer = null;
        this.outputBuffer = null;
        this.f0Buffer = null;
        this.f1Buffer = null;
        this.b1Buffer = null;
        this.dF1Buffer = null;
        this.dB1Buffer = null;
        this.ready = false;
        this.debug = Boolean(opts?.processorOptions?.debug);
        this.nodeId = opts?.processorOptions?.nodeId || "pitch-sync-mod";
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
                if (this.ready && this.wasm?.pitch_sync_resonator_reset) {
                    this.wasm.pitch_sync_resonator_reset(this.state);
                }
            }
        };
        const wasmBytes = opts?.processorOptions?.wasmBytes;
        initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
            const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.pitch_sync_resonator_new(sampleRate);
            this.inputBuffer = new WasmBuffer(this.wasm);
            this.outputBuffer = new WasmBuffer(this.wasm);
            this.f0Buffer = new WasmBuffer(this.wasm);
            this.f1Buffer = new WasmBuffer(this.wasm);
            this.b1Buffer = new WasmBuffer(this.wasm);
            this.dF1Buffer = new WasmBuffer(this.wasm);
            this.dB1Buffer = new WasmBuffer(this.wasm);
            this.ready = true;
            this.port.postMessage({ type: "ready", node: this.nodeId });
        });
    }
    process(inputs, outputs, parameters) {
        if (this.disposed)
            return false;
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !input[0] || !output || !output[0]) {
            return true;
        }
        const inputChannel = input[0];
        const outputChannel = output[0];
        const blockSize = outputChannel.length;
        if (!this.ready ||
            !this.wasm ||
            !this.inputBuffer ||
            !this.outputBuffer ||
            !this.f0Buffer ||
            !this.f1Buffer ||
            !this.b1Buffer ||
            !this.dF1Buffer ||
            !this.dB1Buffer) {
            outputChannel.fill(0);
            return true;
        }
        const f0 = parameters.f0 ?? new Float32Array([100]);
        const oq = parameters.openQuotient ?? new Float32Array([50]);
        const f1 = parameters.f1 ?? new Float32Array([500]);
        const b1 = parameters.b1 ?? new Float32Array([80]);
        const dF1 = parameters.dF1 ?? new Float32Array([0]);
        const dB1 = parameters.dB1 ?? new Float32Array([0]);
        const skew = parameters.skew ?? new Float32Array([0]);
        const source = parameters.source ?? new Float32Array([2]);
        const firstF0 = f0[0] ?? 100;
        const firstOq = oq[0] ?? 50;
        const firstF1 = f1[0] ?? 500;
        const firstB1 = b1[0] ?? 80;
        const firstDF1 = dF1[0] ?? 0;
        const firstDB1 = dB1[0] ?? 0;
        const firstSkew = skew[0] ?? 0;
        const firstSource = source[0] ?? 2;
        // WebAudio supplies k-rate arrays with length 1 and a-rate arrays with
        // length 1 or blockSize. Preserve the old scalar fallback exactly for
        // nonstandard test hosts instead of handing malformed shapes to WASM.
        const hasNonstandardRates = oq.length > 1 ||
            skew.length > 1 ||
            source.length > 1 ||
            [f0, f1, b1, dF1, dB1].some((values) => values.length !== 1 && values.length < blockSize);
        if (hasNonstandardRates) {
            for (let i = 0; i < blockSize; i += 1) {
                outputChannel[i] = this.wasm.pitch_sync_resonator_process(this.state, inputChannel[i] || 0, f0.length > 1 ? (f0[i] ?? firstF0) : firstF0, oq.length > 1 ? (oq[i] ?? firstOq) : firstOq, f1.length > 1 ? (f1[i] ?? firstF1) : firstF1, b1.length > 1 ? (b1[i] ?? firstB1) : firstB1, dF1.length > 1 ? (dF1[i] ?? firstDF1) : firstDF1, dB1.length > 1 ? (dB1[i] ?? firstDB1) : firstDB1, skew.length > 1 ? (skew[i] ?? firstSkew) : firstSkew, source.length > 1 ? (source[i] ?? firstSource) : firstSource);
            }
            this._reportMetrics(outputChannel, { f0: firstF0, f1: firstF1, b1: firstB1 });
            return true;
        }
        this.inputBuffer.ensure(blockSize);
        this.outputBuffer.ensure(blockSize);
        this.f0Buffer.ensure(f0.length);
        this.f1Buffer.ensure(f1.length);
        this.b1Buffer.ensure(b1.length);
        this.dF1Buffer.ensure(dF1.length);
        this.dB1Buffer.ensure(dB1.length);
        const inputView = this.inputBuffer.view;
        if (!inputView ||
            !this.outputBuffer.view ||
            !this.f0Buffer.view ||
            !this.f1Buffer.view ||
            !this.b1Buffer.view ||
            !this.dF1Buffer.view ||
            !this.dB1Buffer.view) {
            outputChannel.fill(0);
            return true;
        }
        inputView.set(inputChannel);
        this.f0Buffer.view.set(f0);
        this.f1Buffer.view.set(f1);
        this.b1Buffer.view.set(b1);
        this.dF1Buffer.view.set(dF1);
        this.dB1Buffer.view.set(dB1);
        this.wasm.pitch_sync_resonator_process_block(this.state, this.inputBuffer.ptr, this.outputBuffer.ptr, blockSize, this.f0Buffer.ptr, f0.length, firstOq, this.f1Buffer.ptr, f1.length, this.b1Buffer.ptr, b1.length, this.dF1Buffer.ptr, dF1.length, this.dB1Buffer.ptr, dB1.length, firstSkew, firstSource);
        this.outputBuffer.refresh();
        if (!this.outputBuffer.view) {
            outputChannel.fill(0);
            return true;
        }
        outputChannel.set(this.outputBuffer.view);
        this._reportMetrics(outputChannel, { f0: firstF0, f1: firstF1, b1: firstB1 });
        return true;
    }
    _reportMetrics(buffer, params) {
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
            f0: params.f0,
            f1: params.f1,
            b1: params.b1,
        };
        this.port.postMessage(payload);
    }
}
registerProcessor("pitch-sync-mod-processor", PitchSyncModProcessor);
