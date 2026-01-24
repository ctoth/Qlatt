import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./resonator.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}resonator.wasm`;

class ResonatorProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "frequency", defaultValue: 500, minValue: 0, maxValue: 20000, automationRate: "k-rate" },
      { name: "bandwidth", defaultValue: 60, minValue: 0, maxValue: 10000, automationRate: "k-rate" },
      { name: "gain", defaultValue: 1, minValue: 0, maxValue: 4, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.inputBuffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "resonator";
    this.bypassAtZero = Boolean(options?.processorOptions?.bypassAtZero);
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
      this.state = this.wasm.resonator_new();
      this.inputBuffer = new WasmBuffer(this.wasm);
      this.outputBuffer = new WasmBuffer(this.wasm);
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

    const input = inputs[0];
    const inputChannel = input && input[0] ? input[0] : null;
    const freq = parameters.frequency[0];
    const bw = parameters.bandwidth[0];
    const gain = parameters.gain[0];

    this.inputBuffer.ensure(blockSize);
    this.outputBuffer.ensure(blockSize);
    if (inputChannel) {
      this.inputBuffer.view.set(inputChannel);
    } else {
      this.inputBuffer.view.fill(0);
    }

    if (this.bypassAtZero && freq <= 0) {
      const scale = Number.isFinite(gain) ? gain : 1;
      for (let i = 0; i < blockSize; i += 1) {
        this.outputBuffer.view[i] = (this.inputBuffer.view[i] || 0) * scale;
      }
    } else {
      this.wasm.resonator_set_params(this.state, freq, bw, sampleRate);
      this.wasm.resonator_set_gain(this.state, gain);
      this.wasm.resonator_process(
        this.state,
        this.inputBuffer.ptr,
        this.outputBuffer.ptr,
        blockSize
      );
    }

    this.outputBuffer.refresh();
    outputChannel.set(this.outputBuffer.view);
    this._reportMetrics(outputChannel, inputChannel, { freq, bw, gain });
    return true;
  }

  _reportMetrics(buffer, inputBuffer, params) {
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
    const payload = { type: "metrics", node: this.nodeId, rms, peak };
    if (inputBuffer) {
      let inSum = 0;
      let inPeak = 0;
      for (let i = 0; i < inputBuffer.length; i += 1) {
        const v = inputBuffer[i];
        inSum += v * v;
        const av = Math.abs(v);
        if (av > inPeak) inPeak = av;
      }
      payload.inRms = Math.sqrt(inSum / inputBuffer.length);
      payload.inPeak = inPeak;
    }
    if (params) {
      payload.freq = params.freq;
      payload.bw = params.bw;
      payload.gain = params.gain;
    }
    this.port.postMessage(payload);
  }
}

registerProcessor("resonator-processor", ResonatorProcessor);
