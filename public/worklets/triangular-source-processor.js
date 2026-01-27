/**
 * Triangular glottal source AudioWorklet processor
 * Wraps the triangular-source WASM primitive
 *
 * Implements a simple triangular glottal pulse waveform with configurable:
 * - f0: Fundamental frequency (pitch)
 * - openQuotient: Fraction of period that glottis is open
 * - asymmetry: Balance between rise and fall phases
 */
import { initWasmModule } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./triangular-source.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}triangular-source.wasm`;

class TriangularSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "f0", defaultValue: 100, minValue: 20, maxValue: 500, automationRate: "a-rate" },
      { name: "openQuotient", defaultValue: 0.5, minValue: 0.01, maxValue: 0.99, automationRate: "a-rate" },
      { name: "asymmetry", defaultValue: 0.5, minValue: 0.01, maxValue: 0.99, automationRate: "a-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.lastF0 = 0;
    this.lastOQ = 0;
    this.lastAsym = 0;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "triangular-source";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.triangular_source_reset) {
          this.wasm.triangular_source_reset(this.state);
        }
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.triangular_source_new(sampleRate);
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

    const f0Values = parameters.f0;
    const oqValues = parameters.openQuotient;
    const asymValues = parameters.asymmetry;

    // Track last values for metrics
    if (f0Values.length > 0) {
      this.lastF0 = f0Values[f0Values.length - 1];
    }
    if (oqValues.length > 0) {
      this.lastOQ = oqValues[oqValues.length - 1];
    }
    if (asymValues.length > 0) {
      this.lastAsym = asymValues[asymValues.length - 1];
    }

    // Process sample by sample (triangular source uses per-sample API)
    for (let i = 0; i < blockSize; i++) {
      const f0Val = f0Values.length > 1 ? f0Values[i] : f0Values[0];
      const oqVal = oqValues.length > 1 ? oqValues[i] : oqValues[0];
      const asymVal = asymValues.length > 1 ? asymValues[i] : asymValues[0];

      outputChannel[i] = this.wasm.triangular_source_process(
        this.state,
        f0Val,
        oqVal,
        asymVal
      );
    }

    this._reportMetrics(outputChannel);
    return true;
  }

  _reportMetrics(buffer) {
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
      f0: this.lastF0,
      openQuotient: this.lastOQ,
      asymmetry: this.lastAsym,
    });
  }
}

registerProcessor("triangular-source-processor", TriangularSourceProcessor);
