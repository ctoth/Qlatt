/**
 * Pitch-synchronous F1 resonator AudioWorklet processor
 * Wraps the pitch-sync-mod WASM primitive
 * F1/B1 modulation synchronized to glottal cycle
 */
import { initWasmModule } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./pitch-sync-mod.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}pitch-sync-mod.wasm`;

class PitchSyncModProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "f0", defaultValue: 100, minValue: 20, maxValue: 500, automationRate: "a-rate" },
      { name: "openQuotient", defaultValue: 50, minValue: 0, maxValue: 100, automationRate: "k-rate" },
      { name: "f1", defaultValue: 500, minValue: 100, maxValue: 1500, automationRate: "a-rate" },
      { name: "b1", defaultValue: 80, minValue: 30, maxValue: 500, automationRate: "a-rate" },
      { name: "dF1", defaultValue: 0, minValue: 0, maxValue: 500, automationRate: "a-rate" },
      { name: "dB1", defaultValue: 0, minValue: 0, maxValue: 500, automationRate: "a-rate" },
      { name: "skew", defaultValue: 0, minValue: 0, maxValue: 200, automationRate: "k-rate" },
      { name: "source", defaultValue: 2, minValue: 1, maxValue: 4, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "pitch-sync-mod";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.pitch_sync_resonator_reset) {
          this.wasm.pitch_sync_resonator_reset(this.state);
        }
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.pitch_sync_resonator_new(sampleRate);
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

    const f0 = parameters.f0;
    const oq = parameters.openQuotient;
    const f1 = parameters.f1;
    const b1 = parameters.b1;
    const dF1 = parameters.dF1;
    const dB1 = parameters.dB1;
    const skew = parameters.skew;
    const source = parameters.source;

    for (let i = 0; i < blockSize; i++) {
      const f0Val = f0.length > 1 ? f0[i] : f0[0];
      const oqVal = oq.length > 1 ? oq[i] : oq[0];
      const f1Val = f1.length > 1 ? f1[i] : f1[0];
      const b1Val = b1.length > 1 ? b1[i] : b1[0];
      const dF1Val = dF1.length > 1 ? dF1[i] : dF1[0];
      const dB1Val = dB1.length > 1 ? dB1[i] : dB1[0];
      const skewVal = skew.length > 1 ? skew[i] : skew[0];
      const sourceVal = source.length > 1 ? source[i] : source[0];

      outputChannel[i] = this.wasm.pitch_sync_resonator_process(
        this.state,
        inputChannel[i] || 0,
        f0Val,
        oqVal,
        f1Val,
        b1Val,
        dF1Val,
        dB1Val,
        skewVal,
        sourceVal
      );
    }

    this._reportMetrics(outputChannel, { f0: f0[0], f1: f1[0], b1: b1[0] });
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
      f1: params.f1,
      b1: params.b1,
    });
  }
}

registerProcessor("pitch-sync-mod-processor", PitchSyncModProcessor);
