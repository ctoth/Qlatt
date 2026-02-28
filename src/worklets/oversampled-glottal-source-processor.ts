/**
 * Oversampled glottal source (klsyn88-style) AudioWorklet processor
 * Outputs:
 *   output[0] = voice waveform (post-tilt + breathiness)
 *   output[1] = modulated noise (for aspiration/frication)
 */
import { initWasmModule, WasmBuffer, computeRmsPeak, resolveWasmUrl, BaseProcessorOptions, UNINITIALIZED_ALLOC, fillParamBuffer } from "./wasm-utils.js";

interface OversampledGlottalSourceWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  oversampled_glottal_source_new(sampleRate: number): number;
  oversampled_glottal_source_process(
    state: number,
    f0Ptr: number,
    f0Len: number,
    avPtr: number,
    avLen: number,
    aturbPtr: number,
    aturbLen: number,
    tiltPtr: number,
    tiltLen: number,
    openQuotientPtr: number,
    openQuotientLen: number,
    skewPtr: number,
    skewLen: number,
    asymmetryPtr: number,
    asymmetryLen: number,
    sourcePtr: number,
    sourceLen: number,
    seedPtr: number,
    seedLen: number,
    voicePtr: number,
    noisePtr: number,
    blockSize: number
  ): void;
  oversampled_glottal_source_reset?: (state: number) => void;
}

type OversampledParamName =
  | "f0"
  | "av"
  | "aturb"
  | "tilt"
  | "openQuotient"
  | "skew"
  | "asymmetry"
  | "source"
  | "seed";
type OversampledParamBuffers = Record<OversampledParamName, WasmBuffer>;

type OversampledGlottalSourceProcessorOptions = BaseProcessorOptions;

interface OversampledMetricsMessage {
  type: "metrics";
  node: string;
  voiceRms: number;
  voicePeak: number;
  noiseRms: number;
  noisePeak: number;
}

const wasmUrl = resolveWasmUrl("./oversampled-glottal-source.wasm");

class OversampledGlottalSourceProcessor extends AudioWorkletProcessor {
  wasm: OversampledGlottalSourceWasmExports | null;
  state: number;
  ready: boolean;
  debug: boolean;
  nodeId: string;
  reportInterval: number;
  _reportCountdown: number;
  voiceBuffer: WasmBuffer | null;
  noiseBuffer: WasmBuffer | null;
  paramBuffers: OversampledParamBuffers;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "f0", defaultValue: 100, minValue: 0, maxValue: 500, automationRate: "a-rate" as const },
      { name: "av", defaultValue: 60, minValue: 0, maxValue: 80, automationRate: "k-rate" as const },
      { name: "aturb", defaultValue: 0, minValue: 0, maxValue: 80, automationRate: "k-rate" as const },
      { name: "tilt", defaultValue: 0, minValue: 0, maxValue: 34, automationRate: "k-rate" as const },
      {
        name: "openQuotient",
        defaultValue: 50,
        minValue: 0,
        maxValue: 100,
        automationRate: "k-rate" as const,
      },
      { name: "skew", defaultValue: 0, minValue: 0, maxValue: 200, automationRate: "k-rate" as const },
      { name: "asymmetry", defaultValue: 50, minValue: 0, maxValue: 100, automationRate: "k-rate" as const },
      { name: "source", defaultValue: 2, minValue: 1, maxValue: 4, automationRate: "k-rate" as const },
      { name: "seed", defaultValue: 1, minValue: 1, maxValue: 2147483647, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as OversampledGlottalSourceProcessorOptions | undefined;
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
    };

    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping" && this.ready) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.oversampled_glottal_source_reset) {
          this.wasm.oversampled_glottal_source_reset(this.state);
        }
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      const wasm = instance.exports as unknown as OversampledGlottalSourceWasmExports;
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

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
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

    const f0Len = fillParamBuffer(this.paramBuffers.f0, f0Values, blockSize);
    const avLen = fillParamBuffer(this.paramBuffers.av, avValues, blockSize);
    const aturbLen = fillParamBuffer(this.paramBuffers.aturb, aturbValues, blockSize);
    const tiltLen = fillParamBuffer(this.paramBuffers.tilt, tiltValues, blockSize);
    const oqLen = fillParamBuffer(this.paramBuffers.openQuotient, oqValues, blockSize);
    const skewLen = fillParamBuffer(this.paramBuffers.skew, skewValues, blockSize);
    const asymLen = fillParamBuffer(this.paramBuffers.asymmetry, asymValues, blockSize);
    const sourceLen = fillParamBuffer(this.paramBuffers.source, sourceValues, blockSize);
    const seedLen = fillParamBuffer(this.paramBuffers.seed, seedValues, blockSize);

    this.voiceBuffer.ensure(blockSize);
    this.noiseBuffer.ensure(blockSize);
    if (!this.voiceBuffer.view || !this.noiseBuffer.view) {
      voiceChannel.fill(0);
      noiseChannel.fill(0);
      return true;
    }

    this.wasm.oversampled_glottal_source_process(
      this.state,
      this.paramBuffers.f0.ptr,
      f0Len,
      this.paramBuffers.av.ptr,
      avLen,
      this.paramBuffers.aturb.ptr,
      aturbLen,
      this.paramBuffers.tilt.ptr,
      tiltLen,
      this.paramBuffers.openQuotient.ptr,
      oqLen,
      this.paramBuffers.skew.ptr,
      skewLen,
      this.paramBuffers.asymmetry.ptr,
      asymLen,
      this.paramBuffers.source.ptr,
      sourceLen,
      this.paramBuffers.seed.ptr,
      seedLen,
      this.voiceBuffer.ptr,
      this.noiseBuffer.ptr,
      blockSize
    );

    this.voiceBuffer.refresh();
    this.noiseBuffer.refresh();
    if (!this.voiceBuffer.view || !this.noiseBuffer.view) {
      voiceChannel.fill(0);
      noiseChannel.fill(0);
      return true;
    }
    voiceChannel.set(this.voiceBuffer.view);
    noiseChannel.set(this.noiseBuffer.view);

    this._reportMetrics(voiceChannel, noiseChannel);
    return true;
  }

  _reportMetrics(voice: Float32Array, noise: Float32Array): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    const voiceMetrics = computeRmsPeak(voice);
    const noiseMetrics = computeRmsPeak(noise);

    const payload: OversampledMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      voiceRms: voiceMetrics.rms,
      voicePeak: voiceMetrics.peak,
      noiseRms: noiseMetrics.rms,
      noisePeak: noiseMetrics.peak,
    };
    this.port.postMessage(payload);
  }
}

registerProcessor("oversampled-glottal-source-processor", OversampledGlottalSourceProcessor);
