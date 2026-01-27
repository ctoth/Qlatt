/**
 * Tilt filter AudioWorklet processor
 * Wraps the tilt-filter WASM primitive
 * One-pole lowpass for spectral tilt control
 */
import { initWasmModule } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./tilt-filter.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}tilt-filter.wasm`;

class TiltFilterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "tilt", defaultValue: 0, minValue: 0, maxValue: 34, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.lastTilt = -1;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "tilt-filter";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.tilt_filter_reset) {
          this.wasm.tilt_filter_reset(this.state);
        }
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.tilt_filter_new();
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = outputChannel.length;

    if (!this.ready) {
      outputChannel.fill(0);
      return true;
    }

    // Update tilt parameter (k-rate, once per block)
    const tilt = Math.round(parameters.tilt[0]);
    if (tilt !== this.lastTilt) {
      this.wasm.tilt_filter_set_tilt(this.state, tilt);
      this.lastTilt = tilt;
    }

    // Process samples
    for (let i = 0; i < blockSize; i++) {
      outputChannel[i] = this.wasm.tilt_filter_process(
        this.state,
        inputChannel[i] || 0
      );
    }

    this._reportMetrics(outputChannel, { tilt });
    return true;
  }

  _reportMetrics(buffer, params) {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const v = buffer[i];
      sum += v * v;
      const av = Math.abs(v);
      if (av > peak) peak = av;
    }
    const rms = Math.sqrt(sum / buffer.length);

    this.port.postMessage({
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      tilt: params.tilt,
    });
  }
}

registerProcessor("tilt-filter-processor", TiltFilterProcessor);
