import { computeRmsPeak, initWasmModule, resolveWasmUrl, WasmBuffer, } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./lf-source.wasm");
class LfSourceProcessor extends AudioWorkletProcessor {
    disposed = false;
    wasm;
    state;
    outputBuffer;
    f0Buffer;
    rdBuffer;
    oqBuffer;
    tlBuffer;
    ready;
    lastF0;
    lastRd;
    lastMode;
    debug;
    nodeId;
    reportInterval;
    _reportCountdown;
    static get parameterDescriptors() {
        return [
            {
                name: "f0",
                defaultValue: 110,
                minValue: 0,
                maxValue: 500,
                automationRate: "a-rate",
            },
            {
                name: "rd",
                defaultValue: 1.0,
                minValue: 0.3,
                maxValue: 2.7,
                automationRate: "a-rate",
            },
            {
                name: "lfMode",
                defaultValue: 0,
                minValue: 0,
                maxValue: 2,
                automationRate: "k-rate",
            },
            { name: "oq", defaultValue: 0, minValue: 0, maxValue: 99, automationRate: "a-rate" }, // Klatt 1990: OQ percentage. 0 = derive from Rd
            { name: "tl", defaultValue: 0, minValue: 0, maxValue: 41, automationRate: "a-rate" }, // Klatt 1990: dB at 3 kHz. 0 = derive from Rd
            {
                name: "flutter",
                defaultValue: 0,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            }, // Klatt & Klatt 1990 Eq. 1 scale
            {
                name: "jitter",
                defaultValue: 0,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            }, // Normalized 0-100, maps to Fraj 2011 b=[0, 4.5]
            {
                name: "di",
                defaultValue: 0,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            }, // Gobl & Ni Chasaide 2003: diplophonia index
        ];
    }
    constructor(options) {
        super(options);
        const opts = options;
        this.wasm = null;
        this.state = 0;
        this.outputBuffer = null;
        this.f0Buffer = null;
        this.rdBuffer = null;
        this.oqBuffer = null;
        this.tlBuffer = null;
        this.ready = false;
        this.lastF0 = 0;
        this.lastRd = 0;
        this.lastMode = 0;
        this.debug = Boolean(opts?.processorOptions?.debug);
        this.nodeId = opts?.processorOptions?.nodeId || "lf-source";
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
        };
        const wasmBytes = opts?.processorOptions?.wasmBytes;
        initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
            const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.lf_source_new(sampleRate);
            this.outputBuffer = new WasmBuffer(this.wasm);
            this.f0Buffer = new WasmBuffer(this.wasm);
            this.rdBuffer = new WasmBuffer(this.wasm);
            this.oqBuffer = new WasmBuffer(this.wasm);
            this.tlBuffer = new WasmBuffer(this.wasm);
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
        if (!this.ready ||
            !this.wasm ||
            !this.outputBuffer ||
            !this.f0Buffer ||
            !this.rdBuffer ||
            !this.oqBuffer ||
            !this.tlBuffer) {
            outputChannel.fill(0);
            return true;
        }
        const f0Values = parameters.f0;
        const rdValues = parameters.rd;
        const modeValues = parameters.lfMode;
        const oqValues = parameters.oq;
        const tlValues = parameters.tl;
        const flutterValues = parameters.flutter;
        const jitterValues = parameters.jitter;
        const diValues = parameters.di;
        const f0Len = f0Values.length;
        const rdLen = rdValues.length;
        const oqLen = oqValues ? oqValues.length : 0;
        const tlLen = tlValues ? tlValues.length : 0;
        if (f0Len > 0) {
            let f0Sum = 0;
            for (let i = 0; i < f0Len; i += 1) {
                f0Sum += f0Values[i];
            }
            this.lastF0 = f0Sum / f0Len;
        }
        if (rdLen > 0) {
            let rdSum = 0;
            for (let i = 0; i < rdLen; i += 1) {
                rdSum += rdValues[i];
            }
            this.lastRd = rdSum / rdLen;
        }
        if (modeValues && modeValues.length) {
            const mode = Math.round(modeValues[0]);
            if (mode !== this.lastMode && this.wasm?.lf_source_set_mode) {
                this.wasm.lf_source_set_mode(this.state, mode);
            }
            this.lastMode = mode;
        }
        // k-rate params: read first value
        const flutter = flutterValues && flutterValues.length > 0 ? flutterValues[0] : 0;
        const jitter = jitterValues && jitterValues.length > 0 ? jitterValues[0] : 0;
        const di = diValues && diValues.length > 0 ? diValues[0] : 0;
        this.outputBuffer.ensure(blockSize);
        this.f0Buffer.ensure(f0Len);
        this.rdBuffer.ensure(rdLen);
        if (oqLen > 0)
            this.oqBuffer.ensure(oqLen);
        if (tlLen > 0)
            this.tlBuffer.ensure(tlLen);
        if (!this.outputBuffer.view || !this.f0Buffer.view || !this.rdBuffer.view) {
            outputChannel.fill(0);
            return true;
        }
        this.f0Buffer.view.set(f0Values);
        this.rdBuffer.view.set(rdValues);
        if (oqLen > 0 && this.oqBuffer.view)
            this.oqBuffer.view.set(oqValues);
        if (tlLen > 0 && this.tlBuffer.view)
            this.tlBuffer.view.set(tlValues);
        this.wasm.lf_source_process(this.state, this.f0Buffer.ptr, f0Len, this.rdBuffer.ptr, rdLen, oqLen > 0 ? this.oqBuffer.ptr : 0, oqLen, tlLen > 0 ? this.tlBuffer.ptr : 0, tlLen, flutter, jitter, di, this.outputBuffer.ptr, blockSize);
        this.outputBuffer.refresh();
        if (!this.outputBuffer.view) {
            outputChannel.fill(0);
            return true;
        }
        outputChannel.set(this.outputBuffer.view);
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
            rd: this.lastRd,
            lfMode: this.lastMode,
        };
        this.port.postMessage(payload);
    }
}
registerProcessor("lf-source-processor", LfSourceProcessor);
