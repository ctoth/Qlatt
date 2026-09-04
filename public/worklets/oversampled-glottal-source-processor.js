/**
 * Oversampled glottal source (klsyn88-style) AudioWorklet processor
 * Outputs:
 *   output[0] = voice waveform (post-tilt + breathiness)
 *   output[1] = modulated noise (for aspiration/frication)
 */
import { computeRmsPeak, fillParamBuffer, initWasmModule, resolveWasmUrl, UNINITIALIZED_ALLOC, WasmBuffer, } from "./wasm-utils.js";
const wasmUrl = resolveWasmUrl("./oversampled-glottal-source.wasm");
class OversampledGlottalSourceProcessor extends AudioWorkletProcessor {
    disposed = false;
    wasm;
    state;
    ready;
    debug;
    nodeId;
    reportInterval;
    _reportCountdown;
    voiceBuffer;
    noiseBuffer;
    paramBuffers;
    static get parameterDescriptors() {
        return [
            {
                name: "f0",
                defaultValue: 100,
                minValue: 0,
                maxValue: 500,
                automationRate: "a-rate",
            },
            {
                name: "av",
                defaultValue: 60,
                minValue: 0,
                maxValue: 80,
                automationRate: "k-rate",
            },
            {
                name: "aturb",
                defaultValue: 0,
                minValue: 0,
                maxValue: 80,
                automationRate: "k-rate",
            },
            {
                name: "tilt",
                defaultValue: 0,
                minValue: 0,
                maxValue: 34,
                automationRate: "k-rate",
            },
            {
                name: "openQuotient",
                defaultValue: 50,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            },
            {
                name: "skew",
                defaultValue: 0,
                minValue: 0,
                maxValue: 200,
                automationRate: "k-rate",
            },
            {
                name: "asymmetry",
                defaultValue: 50,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            },
            {
                name: "source",
                defaultValue: 2,
                minValue: 1,
                maxValue: 4,
                automationRate: "k-rate",
            },
            {
                name: "seed",
                defaultValue: 1,
                minValue: 1,
                maxValue: 2147483647,
                automationRate: "k-rate",
            },
            // Klatt & Klatt 1990 eq. 1 F0 flutter (percent). Default 0 = no-op.
            {
                name: "flutter",
                defaultValue: 0,
                minValue: 0,
                maxValue: 100,
                automationRate: "k-rate",
            },
            // Klatt & Klatt 1990 §3 diplophonia (percent). Default 0 = no-op.
            {
                name: "diplophonia",
                defaultValue: 0,
                minValue: 0,
                maxValue: 100,
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
        this.nodeId = opts?.processorOptions?.nodeId || "oversampled-glottal-source";
        this.reportInterval = opts?.processorOptions?.reportInterval || 50;
        this._reportCountdown = this.reportInterval;
        this.voiceBuffer = null;
        this.noiseBuffer = null;
        this.paramBuffers = {
            f0: new WasmBuffer(UNINITIALIZED_ALLOC),
            av: new WasmBuffer(UNINITIALIZED_ALLOC),
            aturb: new WasmBuffer(UNINITIALIZED_ALLOC),
            tilt: new WasmBuffer(UNINITIALIZED_ALLOC),
            openQuotient: new WasmBuffer(UNINITIALIZED_ALLOC),
            skew: new WasmBuffer(UNINITIALIZED_ALLOC),
            asymmetry: new WasmBuffer(UNINITIALIZED_ALLOC),
            source: new WasmBuffer(UNINITIALIZED_ALLOC),
            seed: new WasmBuffer(UNINITIALIZED_ALLOC),
            flutter: new WasmBuffer(UNINITIALIZED_ALLOC),
            diplophonia: new WasmBuffer(UNINITIALIZED_ALLOC),
        };
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
                if (this.ready && this.wasm?.oversampled_glottal_source_reset) {
                    this.wasm.oversampled_glottal_source_reset(this.state);
                }
            }
        };
        const wasmBytes = opts?.processorOptions?.wasmBytes;
        initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
            const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
            const wasm = instance.exports;
            this.wasm = wasm;
            this.state = wasm.oversampled_glottal_source_new(sampleRate);
            this.voiceBuffer = new WasmBuffer(wasm);
            this.noiseBuffer = new WasmBuffer(wasm);
            Object.values(this.paramBuffers).forEach((buf) => {
                buf.exports = wasm;
            });
            this.ready = true;
            this.port.postMessage({ type: "ready", node: this.nodeId });
        });
    }
    process(_inputs, outputs, parameters) {
        if (this.disposed)
            return false;
        const voiceOut = outputs[0];
        const noiseOut = outputs[1];
        if (!voiceOut || !voiceOut[0] || !noiseOut || !noiseOut[0]) {
            return true;
        }
        const voiceChannel = voiceOut[0];
        const noiseChannel = noiseOut[0];
        const blockSize = voiceChannel.length;
        if (!this.ready || !this.wasm || !this.voiceBuffer || !this.noiseBuffer) {
            voiceChannel.fill(0);
            noiseChannel.fill(0);
            return true;
        }
        const f0Values = parameters.f0 ?? new Float32Array([100]);
        const avValues = parameters.av ?? new Float32Array([60]);
        const aturbValues = parameters.aturb ?? new Float32Array([0]);
        const tiltValues = parameters.tilt ?? new Float32Array([0]);
        const oqValues = parameters.openQuotient ?? new Float32Array([50]);
        const skewValues = parameters.skew ?? new Float32Array([0]);
        const asymValues = parameters.asymmetry ?? new Float32Array([50]);
        const sourceValues = parameters.source ?? new Float32Array([2]);
        const seedValues = parameters.seed ?? new Float32Array([1]);
        const flutterValues = parameters.flutter ?? new Float32Array([0]);
        const diplophoniaValues = parameters.diplophonia ?? new Float32Array([0]);
        const f0Len = fillParamBuffer(this.paramBuffers.f0, f0Values, blockSize);
        const avLen = fillParamBuffer(this.paramBuffers.av, avValues, blockSize);
        const aturbLen = fillParamBuffer(this.paramBuffers.aturb, aturbValues, blockSize);
        const tiltLen = fillParamBuffer(this.paramBuffers.tilt, tiltValues, blockSize);
        const oqLen = fillParamBuffer(this.paramBuffers.openQuotient, oqValues, blockSize);
        const skewLen = fillParamBuffer(this.paramBuffers.skew, skewValues, blockSize);
        const asymLen = fillParamBuffer(this.paramBuffers.asymmetry, asymValues, blockSize);
        const sourceLen = fillParamBuffer(this.paramBuffers.source, sourceValues, blockSize);
        const seedLen = fillParamBuffer(this.paramBuffers.seed, seedValues, blockSize);
        const flutterLen = fillParamBuffer(this.paramBuffers.flutter, flutterValues, blockSize);
        const diplophoniaLen = fillParamBuffer(this.paramBuffers.diplophonia, diplophoniaValues, blockSize);
        this.voiceBuffer.ensure(blockSize);
        this.noiseBuffer.ensure(blockSize);
        if (!this.voiceBuffer.view || !this.noiseBuffer.view) {
            voiceChannel.fill(0);
            noiseChannel.fill(0);
            return true;
        }
        this.wasm.oversampled_glottal_source_process(this.state, this.paramBuffers.f0.ptr, f0Len, this.paramBuffers.av.ptr, avLen, this.paramBuffers.aturb.ptr, aturbLen, this.paramBuffers.tilt.ptr, tiltLen, this.paramBuffers.openQuotient.ptr, oqLen, this.paramBuffers.skew.ptr, skewLen, this.paramBuffers.asymmetry.ptr, asymLen, this.paramBuffers.source.ptr, sourceLen, this.paramBuffers.seed.ptr, seedLen, this.paramBuffers.flutter.ptr, flutterLen, this.paramBuffers.diplophonia.ptr, diplophoniaLen, this.voiceBuffer.ptr, this.noiseBuffer.ptr, blockSize);
        this.voiceBuffer.refresh();
        this.noiseBuffer.refresh();
        if (!this.voiceBuffer.view || !this.noiseBuffer.view) {
            voiceChannel.fill(0);
            noiseChannel.fill(0);
            return true;
        }
        voiceChannel.set(this.voiceBuffer.view);
        noiseChannel.set(this.noiseBuffer.view);
        this._reportMetrics(voiceChannel, noiseChannel, {
            f0: f0Values[0] ?? 0,
            av: avValues[0] ?? 0,
            source: sourceValues[0] ?? 0,
            tilt: tiltValues[0] ?? 0,
        });
        return true;
    }
    _reportMetrics(voice, noise, params) {
        if (!this.debug)
            return;
        this._reportCountdown -= 1;
        if (this._reportCountdown > 0)
            return;
        this._reportCountdown = this.reportInterval;
        const voiceMetrics = computeRmsPeak(voice);
        const noiseMetrics = computeRmsPeak(noise);
        const payload = {
            type: "metrics",
            node: this.nodeId,
            voiceRms: voiceMetrics.rms,
            voicePeak: voiceMetrics.peak,
            noiseRms: noiseMetrics.rms,
            noisePeak: noiseMetrics.peak,
            f0: params.f0,
            av: params.av,
            source: params.source,
            tilt: params.tilt,
        };
        this.port.postMessage(payload);
    }
}
registerProcessor("oversampled-glottal-source-processor", OversampledGlottalSourceProcessor);
