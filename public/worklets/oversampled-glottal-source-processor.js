/**
 * Oversampled glottal source (klsyn88-style) AudioWorklet processor
 * Outputs:
 *   output[0] = voice waveform (post-tilt + breathiness)
 *   output[1] = modulated noise (for aspiration/frication)
 */
import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./oversampled-glottal-source.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}oversampled-glottal-source.wasm`;

class OversampledGlottalSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "f0", defaultValue: 100, minValue: 0, maxValue: 500, automationRate: "a-rate" },
      { name: "av", defaultValue: 60, minValue: 0, maxValue: 80, automationRate: "k-rate" },
      { name: "aturb", defaultValue: 0, minValue: 0, maxValue: 80, automationRate: "k-rate" },
      { name: "tilt", defaultValue: 0, minValue: 0, maxValue: 34, automationRate: "k-rate" },
      { name: "openQuotient", defaultValue: 50, minValue: 0, maxValue: 100, automationRate: "k-rate" },
      { name: "skew", defaultValue: 0, minValue: 0, maxValue: 200, automationRate: "k-rate" },
      { name: "asymmetry", defaultValue: 50, minValue: 0, maxValue: 100, automationRate: "k-rate" },
      { name: "source", defaultValue: 2, minValue: 1, maxValue: 4, automationRate: "k-rate" },
      { name: "seed", defaultValue: 1, minValue: 1, maxValue: 2147483647, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "oversampled-glottal-source";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.voiceBuffer = null;
    this.noiseBuffer = null;
    this.paramBuffers = {
      f0: new WasmBuffer(null),
      av: new WasmBuffer(null),
      aturb: new WasmBuffer(null),
      tilt: new WasmBuffer(null),
      openQuotient: new WasmBuffer(null),
      skew: new WasmBuffer(null),
      asymmetry: new WasmBuffer(null),
      source: new WasmBuffer(null),
      seed: new WasmBuffer(null),
    };

    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.oversampled_glottal_source_reset) {
          this.wasm.oversampled_glottal_source_reset(this.state);
        }
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.oversampled_glottal_source_new(sampleRate);
      this.voiceBuffer = new WasmBuffer(this.wasm);
      this.noiseBuffer = new WasmBuffer(this.wasm);
      Object.values(this.paramBuffers).forEach((buf) => {
        buf.exports = this.wasm;
      });
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  _fillParamBuffer(buffer, values, blockSize) {
    const len = values.length > 1 ? blockSize : 1;
    buffer.ensure(len);
    if (values.length > 1) {
      buffer.view.set(values);
    } else {
      buffer.view[0] = values.length > 0 ? values[0] : 0;
    }
    return len;
  }

  process(inputs, outputs, parameters) {
    const voiceOut = outputs[0];
    const noiseOut = outputs[1];

    if (!voiceOut || !voiceOut[0] || !noiseOut || !noiseOut[0]) {
      return true;
    }

    const voiceChannel = voiceOut[0];
    const noiseChannel = noiseOut[0];
    const blockSize = voiceChannel.length;

    if (!this.ready) {
      voiceChannel.fill(0);
      noiseChannel.fill(0);
      return true;
    }

    const f0Len = this._fillParamBuffer(this.paramBuffers.f0, parameters.f0, blockSize);
    const avLen = this._fillParamBuffer(this.paramBuffers.av, parameters.av, blockSize);
    const aturbLen = this._fillParamBuffer(this.paramBuffers.aturb, parameters.aturb, blockSize);
    const tiltLen = this._fillParamBuffer(this.paramBuffers.tilt, parameters.tilt, blockSize);
    const oqLen = this._fillParamBuffer(this.paramBuffers.openQuotient, parameters.openQuotient, blockSize);
    const skewLen = this._fillParamBuffer(this.paramBuffers.skew, parameters.skew, blockSize);
    const asymLen = this._fillParamBuffer(this.paramBuffers.asymmetry, parameters.asymmetry, blockSize);
    const sourceLen = this._fillParamBuffer(this.paramBuffers.source, parameters.source, blockSize);
    const seedLen = this._fillParamBuffer(this.paramBuffers.seed, parameters.seed, blockSize);

    this.voiceBuffer.ensure(blockSize);
    this.noiseBuffer.ensure(blockSize);

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
    voiceChannel.set(this.voiceBuffer.view);
    noiseChannel.set(this.noiseBuffer.view);

    this._reportMetrics(voiceChannel, noiseChannel);
    return true;
  }

  _reportMetrics(voice, noise) {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    let vSum = 0;
    let vPeak = 0;
    let nSum = 0;
    let nPeak = 0;
    for (let i = 0; i < voice.length; i += 1) {
      const v = voice[i];
      vSum += v * v;
      const av = Math.abs(v);
      if (av > vPeak) vPeak = av;
    }
    for (let i = 0; i < noise.length; i += 1) {
      const v = noise[i];
      nSum += v * v;
      const av = Math.abs(v);
      if (av > nPeak) nPeak = av;
    }

    this.port.postMessage({
      type: "metrics",
      node: this.nodeId,
      voiceRms: Math.sqrt(vSum / voice.length),
      voicePeak: vPeak,
      noiseRms: Math.sqrt(nSum / noise.length),
      noisePeak: nPeak,
    });
  }
}

registerProcessor("oversampled-glottal-source-processor", OversampledGlottalSourceProcessor);
