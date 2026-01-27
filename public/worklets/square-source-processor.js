/**
 * Square glottal source AudioWorklet processor
 * Wraps the square-source WASM primitive
 */
import { initWasmModule } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./square-source.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}square-source.wasm`;

class SquareSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "f0", defaultValue: 100, minValue: 20, maxValue: 500, automationRate: "a-rate" },
      { name: "openQuotient", defaultValue: 0.5, minValue: 0.01, maxValue: 0.99, automationRate: "a-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "square-source";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.square_source_reset) {
          this.wasm.square_source_reset(this.state);
        }
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.square_source_new(sampleRate);
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

    if (!this.ready) {
      outputChannel.fill(0);
      return true;
    }

    const f0 = parameters.f0;
    const oq = parameters.openQuotient;

    for (let i = 0; i < blockSize; i++) {
      const f0Val = f0.length > 1 ? f0[i] : f0[0];
      const oqVal = oq.length > 1 ? oq[i] : oq[0];

      outputChannel[i] = this.wasm.square_source_process(
        this.state,
        f0Val,
        oqVal
      );
    }

    this._reportMetrics(outputChannel, { f0: f0[0], oq: oq[0] });
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
      f0: params.f0,
      openQuotient: params.oq,
    });
  }
}

registerProcessor("square-source-processor", SquareSourceProcessor);
