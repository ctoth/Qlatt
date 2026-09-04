/**
 * Dynamics compressor AudioWorklet processor
 * Wraps the dynamics-compressor WASM primitive
 *
 * Feedforward output-stage compressor (Giannoulis, Massberg & Reiss 2012).
 * Replaces the native DynamicsCompressorNode binding: no lookahead pre-delay,
 * no automatic makeup gain. See crates/dynamics-compressor/src/lib.rs.
 */
import { computeRmsPeak, initWasmModule, resolveWasmUrl, } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./dynamics-compressor.wasm");
class DynamicsCompressorProcessor extends AudioWorkletProcessor {
    disposed = false;
    wasm;
    state;
    ready;
    debug;
    nodeId;
    reportInterval;
    _reportCountdown;
    inputPtr;
    outputPtr;
    bufferLen;
    lastParams;
    static get parameterDescriptors() {
        return [
            {
                name: "threshold",
                defaultValue: -24,
                minValue: -100,
                maxValue: 0,
                automationRate: "k-rate",
            },
            {
                name: "knee",
                defaultValue: 12,
                minValue: 0,
                maxValue: 40,
                automationRate: "k-rate",
            },
            {
                name: "ratio",
                defaultValue: 12,
                minValue: 1,
                maxValue: 20,
                automationRate: "k-rate",
            },
            {
                name: "attack",
                defaultValue: 0.003,
                minValue: 0,
                maxValue: 1,
                automationRate: "k-rate",
            },
            {
                name: "release",
                defaultValue: 0.1,
                minValue: 0,
                maxValue: 1,
                automationRate: "k-rate",
            },
            {
                name: "makeup",
                defaultValue: 0,
                minValue: 0,
                maxValue: 24,
                automationRate: "k-rate",
            },
        ];
    }
    constructor(options) {
        super(options);
        const opts = options;
        this.wasm = null;
        this.state = 0;
        this.ready = false;
        this.debug = Boolean(opts?.processorOptions?.debug);
        this.nodeId = opts?.processorOptions?.nodeId || "dynamics-compressor";
        this.reportInterval = opts?.processorOptions?.reportInterval || 50;
        this._reportCountdown = this.reportInterval;
        this.inputPtr = 0;
        this.outputPtr = 0;
        this.bufferLen = 0;
        this.lastParams = null;
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
                if (this.ready && this.wasm) {
                    this.wasm.dynamics_compressor_reset(this.state);
                }
            }
        };
        const wasmBytes = opts?.processorOptions?.wasmBytes;
        initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
            const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
            this.wasm = instance.exports;
            this.state = this.wasm.dynamics_compressor_new(sampleRate);
            this.ready = true;
            this.port.postMessage({ type: "ready", node: this.nodeId });
        });
    }
    ensureBuffers(len) {
        if (!this.wasm || this.bufferLen === len)
            return;
        if (this.bufferLen > 0) {
            this.wasm.dealloc_f32(this.inputPtr, this.bufferLen);
            this.wasm.dealloc_f32(this.outputPtr, this.bufferLen);
        }
        this.inputPtr = this.wasm.alloc_f32(len);
        this.outputPtr = this.wasm.alloc_f32(len);
        this.bufferLen = len;
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
        if (!this.ready || !this.wasm) {
            outputChannel.fill(0);
            return true;
        }
        // k-rate params, forwarded once per block and only when changed
        const threshold = parameters.threshold?.[0] ?? -24;
        const knee = parameters.knee?.[0] ?? 12;
        const ratio = parameters.ratio?.[0] ?? 12;
        const attack = parameters.attack?.[0] ?? 0.003;
        const release = parameters.release?.[0] ?? 0.1;
        const makeup = parameters.makeup?.[0] ?? 0;
        const lp = this.lastParams;
        if (!lp ||
            lp[0] !== threshold ||
            lp[1] !== knee ||
            lp[2] !== ratio ||
            lp[3] !== attack ||
            lp[4] !== release ||
            lp[5] !== makeup) {
            this.wasm.dynamics_compressor_set_params(this.state, threshold, knee, ratio, attack, release, makeup);
            this.lastParams = [threshold, knee, ratio, attack, release, makeup];
        }
        this.ensureBuffers(blockSize);
        new Float32Array(this.wasm.memory.buffer, this.inputPtr, blockSize).set(inputChannel);
        this.wasm.dynamics_compressor_process(this.state, this.inputPtr, blockSize, this.outputPtr, blockSize);
        outputChannel.set(new Float32Array(this.wasm.memory.buffer, this.outputPtr, blockSize));
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
            reductionDb: this.wasm ? this.wasm.dynamics_compressor_get_reduction_db(this.state) : 0,
        };
        this.port.postMessage(payload);
    }
}
registerProcessor("dynamics-compressor-processor", DynamicsCompressorProcessor);
