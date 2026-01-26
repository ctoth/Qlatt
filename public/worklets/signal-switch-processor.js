import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./signal-switch.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}signal-switch.wasm`;

/**
 * Signal Switch AudioWorklet Processor
 *
 * Implements Klatt 80 SW (cascade/parallel switch):
 * - selector < 0.5: outputs input0 (cascade branch, SW=0)
 * - selector >= 0.5: outputs input1 (parallel branch, SW=1)
 *
 * Switching is instantaneous (no crossfade) per Klatt 80 specification.
 */
class SignalSwitchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "selector",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate",
      },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.input0Buffer = null;
    this.input1Buffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "signal-switch";
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
      this.state = this.wasm.signal_switch_new();
      this.input0Buffer = new WasmBuffer(this.wasm);
      this.input1Buffer = new WasmBuffer(this.wasm);
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

    // Get input channels (input0 = cascade, input1 = parallel)
    const input0 = inputs[0];
    const input1 = inputs[1];
    const input0Channel = input0 && input0[0] ? input0[0] : null;
    const input1Channel = input1 && input1[0] ? input1[0] : null;
    const selector = parameters.selector[0];

    // Ensure buffers are allocated
    this.input0Buffer.ensure(blockSize);
    this.input1Buffer.ensure(blockSize);
    this.outputBuffer.ensure(blockSize);

    // Fill input buffers
    if (input0Channel) {
      this.input0Buffer.view.set(input0Channel);
    } else {
      this.input0Buffer.view.fill(0);
    }

    if (input1Channel) {
      this.input1Buffer.view.set(input1Channel);
    } else {
      this.input1Buffer.view.fill(0);
    }

    // Process with k-rate selector (selector is constant for entire block)
    this.wasm.signal_switch_process_krate(
      this.state,
      this.input0Buffer.ptr,
      this.input1Buffer.ptr,
      selector,
      this.outputBuffer.ptr,
      blockSize
    );

    this.outputBuffer.refresh();
    outputChannel.set(this.outputBuffer.view);
    this._reportMetrics(outputChannel, input0Channel, input1Channel, selector);
    return true;
  }

  _reportMetrics(buffer, input0Buffer, input1Buffer, selector) {
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
    const payload = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      selector,
      selectedBranch: selector < 0.5 ? "cascade" : "parallel",
    };

    // Report input0 metrics
    if (input0Buffer) {
      let in0Sum = 0;
      let in0Peak = 0;
      for (let i = 0; i < input0Buffer.length; i += 1) {
        const v = input0Buffer[i];
        in0Sum += v * v;
        const av = Math.abs(v);
        if (av > in0Peak) in0Peak = av;
      }
      payload.in0Rms = Math.sqrt(in0Sum / input0Buffer.length);
      payload.in0Peak = in0Peak;
    }

    // Report input1 metrics
    if (input1Buffer) {
      let in1Sum = 0;
      let in1Peak = 0;
      for (let i = 0; i < input1Buffer.length; i += 1) {
        const v = input1Buffer[i];
        in1Sum += v * v;
        const av = Math.abs(v);
        if (av > in1Peak) in1Peak = av;
      }
      payload.in1Rms = Math.sqrt(in1Sum / input1Buffer.length);
      payload.in1Peak = in1Peak;
    }

    this.port.postMessage(payload);
  }
}

registerProcessor("signal-switch-processor", SignalSwitchProcessor);
