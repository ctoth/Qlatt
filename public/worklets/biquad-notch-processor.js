// Biquad notch (band-reject) filter worklet processor.
// Numerically stable replacement for Klatt FIR antiresonator at high sample rates.
// Reference: Bristow-Johnson, "Audio EQ Cookbook" (2005)
import { initWasmModule, WasmBuffer, computeRmsPeak, resolveWasmUrl } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./biquad-notch.wasm");
class BiquadNotchProcessor extends AudioWorkletProcessor {
    wasm;
    state;
    inputBuffer;
    outputBuffer;
    ready;
    debug;
    nodeId;
    bypassAtZero;
    reportInterval;
    _reportCountdown;
    static get parameterDescriptors() {
        return [
            { name: "frequency", defaultValue: 500, minValue: 0, maxValue: 20000, automationRate: "k-rate" },
            { name: "bandwidth", defaultValue: 60, minValue: 0, maxValue: 10000, automationRate: "k-rate" },
            { name: "gain", defaultValue: 1, minValue: 0, maxValue: 4, automationRate: "k-rate" },
        ];
    }
    constructor(options) {
        super(options);
        const opts = options;
        this.wasm = null;
        this.state = 0;
        this.inputBuffer = null;
        this.outputBuffer = null;
        this.ready = false;
        this.debug = Boolean(opts?.processorOptions?.debug);
        this.nodeId = opts?.processorOptions?.nodeId || "biquad-notch";
        this.bypassAtZero = Boolean(opts?.processorOptions?.bypassAtZero);
        this.reportInterval = opts?.processorOptions?.reportInterval || 50;
        this._reportCountdown = this.reportInterval;
        this.port.onmessage = (event) => {
            if (event?.data?.type === "ping" && this.ready) {
                this.port.postMessage({ type: "ready", node: this.nodeId });
            }
        };
        const wasmBytes = opts?.processorOptions?.wasmBytes;
        initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
            const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.biquad_notch_new();
            this.inputBuffer = new WasmBuffer(this.wasm);
            this.outputBuffer = new WasmBuffer(this.wasm);
            this.ready = true;
            this.port.postMessage({ type: "ready", node: this.nodeId });
        });
    }
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || !output[0]) {
            return true;
        }
        const outputChannel = output[0];
        const blockSize = outputChannel.length;
        if (!this.ready || !this.wasm || !this.inputBuffer || !this.outputBuffer) {
            outputChannel.fill(0);
            return true;
        }
        const input = inputs[0];
        const inputChannel = input && input[0] ? input[0] : null;
        const freq = parameters.frequency?.[0] ?? 500;
        const bw = parameters.bandwidth?.[0] ?? 60;
        const gain = parameters.gain?.[0] ?? 1;
        const bypass = this.bypassAtZero && (!Number.isFinite(freq) || !Number.isFinite(bw) || freq <= 0 || bw <= 0);
        if (bypass) {
            if (inputChannel) {
                outputChannel.set(inputChannel);
            }
            else {
                outputChannel.fill(0);
            }
            this._reportMetrics(outputChannel, inputChannel, { freq, bw, gain });
            return true;
        }
        this.inputBuffer.ensure(blockSize);
        this.outputBuffer.ensure(blockSize);
        const inputView = this.inputBuffer.view;
        const outputView = this.outputBuffer.view;
        if (!inputView || !outputView) {
            outputChannel.fill(0);
            return true;
        }
        if (inputChannel) {
            inputView.set(inputChannel);
        }
        else {
            inputView.fill(0);
        }
        this.wasm.biquad_notch_set_params(this.state, freq, bw, sampleRate);
        this.wasm.biquad_notch_set_gain(this.state, gain);
        this.wasm.biquad_notch_process(this.state, this.inputBuffer.ptr, this.outputBuffer.ptr, blockSize);
        this.outputBuffer.refresh();
        if (!this.outputBuffer.view) {
            outputChannel.fill(0);
            return true;
        }
        outputChannel.set(this.outputBuffer.view);
        this._reportMetrics(outputChannel, inputChannel, { freq, bw, gain });
        return true;
    }
    _reportMetrics(buffer, inputBuffer, params) {
        if (!this.debug)
            return;
        this._reportCountdown -= 1;
        if (this._reportCountdown > 0)
            return;
        this._reportCountdown = this.reportInterval;
        const { rms, peak } = computeRmsPeak(buffer);
        const payload = { type: "metrics", node: this.nodeId, rms, peak };
        if (inputBuffer) {
            const inMetrics = computeRmsPeak(inputBuffer);
            payload.inRms = inMetrics.rms;
            payload.inPeak = inMetrics.peak;
        }
        if (params) {
            payload.freq = params.freq;
            payload.bw = params.bw;
            payload.gain = params.gain;
        }
        this.port.postMessage(payload);
    }
}
registerProcessor("biquad-notch-processor", BiquadNotchProcessor);
