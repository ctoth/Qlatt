import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./lf-source.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}lf-source.wasm`;

class LfSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "f0", defaultValue: 110, minValue: 0, maxValue: 500, automationRate: "a-rate" },
      { name: "rd", defaultValue: 1.0, minValue: 0.3, maxValue: 2.7, automationRate: "a-rate" },
      { name: "lfMode", defaultValue: 0, minValue: 0, maxValue: 2, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.outputBuffer = null;
    this.f0Buffer = null;
    this.rdBuffer = null;
    this.ready = false;
    this.lastF0 = 0;
    this.lastRd = 0;
    this.lastMode = 0;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "lf-source";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.lf_source_new(sampleRate);
      this.outputBuffer = new WasmBuffer(this.wasm);
      this.f0Buffer = new WasmBuffer(this.wasm);
      this.rdBuffer = new WasmBuffer(this.wasm);
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
    const rdValues = parameters.rd;
    const modeValues = parameters.lfMode;
    const f0Len = f0Values.length;
    const rdLen = rdValues.length;

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

    this.outputBuffer.ensure(blockSize);
    this.f0Buffer.ensure(f0Len);
    this.rdBuffer.ensure(rdLen);
    this.f0Buffer.view.set(f0Values);
    this.rdBuffer.view.set(rdValues);

    this.wasm.lf_source_process(
      this.state,
      this.f0Buffer.ptr,
      f0Len,
      this.rdBuffer.ptr,
      rdLen,
      this.outputBuffer.ptr,
      blockSize
    );

    this.outputBuffer.refresh();
    outputChannel.set(this.outputBuffer.view);
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
      rd: this.lastRd,
      lfMode: this.lastMode,
    });
  }
}

registerProcessor("lf-source-processor", LfSourceProcessor);
