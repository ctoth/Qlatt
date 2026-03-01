/**
 * Edge Detector AudioWorklet Processor
 *
 * Implements Klatt 80's PLSTEP trigger detection mechanism.
 * Detects when a parameter increases by >= threshold (default 49 dB),
 * outputting a single-sample trigger pulse (1.0) when triggered.
 *
 * From Klatt 1980:
 * > "A step function, PLSTEP, is included in order to simulate plosive bursts...
 * > The generator is triggered on by a sudden increase in AF or AH of 49 dB or more."
 */
import { initWasmModule, WasmBuffer, resolveWasmUrl } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./edge-detector.wasm");
class EdgeDetectorProcessor extends AudioWorkletProcessor {
    wasm;
    state;
    inputBuffer;
    outputBuffer;
    ready;
    debug;
    nodeId;
    reportInterval;
    _reportCountdown;
    static get parameterDescriptors() {
        return [
            {
                name: "threshold",
                defaultValue: 49.0,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            },
            {
                name: "input",
                defaultValue: 0,
                minValue: -200,
                maxValue: 200,
                automationRate: "a-rate",
            },
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
        this.nodeId = opts?.processorOptions?.nodeId || "edge-detector";
        this.reportInterval = opts?.processorOptions?.reportInterval || 50;
        this._reportCountdown = this.reportInterval;
        this.port.onmessage = (event) => {
            if (event?.data?.type === "ping" && this.ready) {
                this.port.postMessage({ type: "ready", node: this.nodeId });
            }
            else if (event?.data?.type === "reset") {
                if (this.ready && this.wasm) {
                    this.wasm.edge_detector_reset(this.state);
                }
            }
        };
        const wasmBytes = opts?.processorOptions?.wasmBytes;
        initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
            const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.edge_detector_new();
            this.inputBuffer = new WasmBuffer(this.wasm);
            this.outputBuffer = new WasmBuffer(this.wasm);
            this.ready = true;
            this.port.postMessage({ type: "ready", node: this.nodeId });
        });
    }
    process(_inputs, outputs, parameters) {
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
        const threshold = parameters.threshold?.[0] ?? 49;
        const inputParam = parameters.input ?? new Float32Array([0]);
        this.inputBuffer.ensure(blockSize);
        this.outputBuffer.ensure(blockSize);
        const inputView = this.inputBuffer.view;
        const outputView = this.outputBuffer.view;
        if (!inputView || !outputView) {
            outputChannel.fill(0);
            return true;
        }
        // Fill input buffer from the 'input' AudioParam
        // If a-rate, we get per-sample values; if k-rate, we get a single value
        if (inputParam.length === 1) {
            // k-rate: fill with constant
            inputView.fill(inputParam[0] ?? 0);
        }
        else {
            // a-rate: copy per-sample values
            inputView.set(inputParam);
        }
        this.wasm.edge_detector_process(this.state, this.inputBuffer.ptr, this.outputBuffer.ptr, blockSize, threshold);
        this.outputBuffer.refresh();
        if (!this.outputBuffer.view) {
            outputChannel.fill(0);
            return true;
        }
        outputChannel.set(this.outputBuffer.view);
        this._reportMetrics(outputChannel, { threshold });
        return true;
    }
    _reportMetrics(buffer, params) {
        if (!this.debug)
            return;
        this._reportCountdown -= 1;
        if (this._reportCountdown > 0)
            return;
        this._reportCountdown = this.reportInterval;
        // Count triggers in this block
        let triggerCount = 0;
        for (let i = 0; i < buffer.length; i += 1) {
            if (buffer[i] > 0.5)
                triggerCount += 1;
        }
        const payload = {
            type: "metrics",
            node: this.nodeId,
            triggerCount,
            threshold: params.threshold,
        };
        this.port.postMessage(payload);
    }
}
registerProcessor("edge-detector-processor", EdgeDetectorProcessor);
