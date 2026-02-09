/**
 * Aerodynamic model AudioWorklet processor
 *
 * Citations:
 * - Stevens & Bickley (1991) "Constraints among parameters simplify control
 *   of Klatt formant synthesizer" Journal of Phonetics 19, 161-174
 * - Stevens (1998) "Acoustic Phonetics" MIT Press
 *
 * Outputs:
 *   output[0] = voicing amplitude (0-1 linear)
 *   output[1] = aspiration noise amplitude (0-1 linear)
 *   output[2] = B1 bandwidth (Hz)
 */
import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./aerodynamic-model.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}aerodynamic-model.wasm`;

class AerodynamicModelProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "ag", defaultValue: 0.05, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "ac", defaultValue: 0, minValue: 0, maxValue: 10, automationRate: "k-rate" },
      { name: "ps", defaultValue: 8, minValue: 0, maxValue: 30, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "aerodynamic-model";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.voicingBuffer = null;
    this.aspirationBuffer = null;
    this.b1Buffer = null;
    this.paramBuffers = {
      ag: new WasmBuffer(null),
      ac: new WasmBuffer(null),
      ps: new WasmBuffer(null),
    };

    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.aerodynamic_model_reset) {
          this.wasm.aerodynamic_model_reset(this.state);
        }
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.aerodynamic_model_new(sampleRate);
      this.voicingBuffer = new WasmBuffer(this.wasm);
      this.aspirationBuffer = new WasmBuffer(this.wasm);
      this.b1Buffer = new WasmBuffer(this.wasm);
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
    const voicingOut = outputs[0];
    const aspirationOut = outputs[1];
    const b1Out = outputs[2];

    if (!voicingOut || !voicingOut[0] || !aspirationOut || !aspirationOut[0] || !b1Out || !b1Out[0]) {
      return true;
    }

    const voicingChannel = voicingOut[0];
    const aspirationChannel = aspirationOut[0];
    const b1Channel = b1Out[0];
    const blockSize = voicingChannel.length;

    if (!this.ready) {
      voicingChannel.fill(0);
      aspirationChannel.fill(0);
      b1Channel.fill(0);
      return true;
    }

    const agLen = this._fillParamBuffer(this.paramBuffers.ag, parameters.ag, blockSize);
    const acLen = this._fillParamBuffer(this.paramBuffers.ac, parameters.ac, blockSize);
    const psLen = this._fillParamBuffer(this.paramBuffers.ps, parameters.ps, blockSize);

    this.voicingBuffer.ensure(blockSize);
    this.aspirationBuffer.ensure(blockSize);
    this.b1Buffer.ensure(blockSize);

    this.wasm.aerodynamic_model_process(
      this.state,
      this.paramBuffers.ag.ptr,
      agLen,
      this.paramBuffers.ac.ptr,
      acLen,
      this.paramBuffers.ps.ptr,
      psLen,
      this.voicingBuffer.ptr,
      this.aspirationBuffer.ptr,
      this.b1Buffer.ptr,
      blockSize
    );

    this.voicingBuffer.refresh();
    this.aspirationBuffer.refresh();
    this.b1Buffer.refresh();
    voicingChannel.set(this.voicingBuffer.view);
    aspirationChannel.set(this.aspirationBuffer.view);
    b1Channel.set(this.b1Buffer.view);

    return true;
  }
}

registerProcessor("aerodynamic-model-processor", AerodynamicModelProcessor);
