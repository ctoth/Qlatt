/**
 * Aerodynamic model AudioWorklet processor
 *
 * Citations:
 * - Stevens & Bickley (1991) "Constraints among parameters simplify control
 *   of Klatt formant synthesizer" Journal of Phonetics 19, 161-174
 * - Stevens (1998) "Acoustic Phonetics" MIT Press
 *
 * Outputs:
 *   output[0] = voicing amplitude (AV, 0-1 linear)
 *   output[1] = aspiration noise amplitude (AH, 0-1 linear)
 *   output[2] = frication noise amplitude (AF, 0-1 linear)
 *   output[3] = B1 bandwidth (Hz)
 *   output[4] = FNP frequency (Hz)
 *   output[5] = FNZ frequency (Hz)
 *   output[6] = open quotient ratio (0-1)
 *   output[7] = spectral tilt proxy (dB/oct)
 */
import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./aerodynamic-model.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}aerodynamic-model.wasm`;

class AerodynamicModelProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "ag", defaultValue: 0.05, minValue: 0, maxValue: 0.4, automationRate: "k-rate" },
      { name: "ac", defaultValue: 0.4, minValue: 0, maxValue: 0.4, automationRate: "k-rate" },
      { name: "an", defaultValue: 0.0, minValue: 0, maxValue: 1.0, automationRate: "k-rate" },
      { name: "st", defaultValue: 0.0, minValue: -10, maxValue: 0, automationRate: "k-rate" },
      { name: "pm", defaultValue: 0.0, minValue: -0.5, maxValue: 0.2, automationRate: "k-rate" },
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
    this.fricationBuffer = null;
    this.b1Buffer = null;
    this.fnpBuffer = null;
    this.fnzBuffer = null;
    this.oqBuffer = null;
    this.tlBuffer = null;
    this.paramBuffers = {
      ag: new WasmBuffer(null),
      ac: new WasmBuffer(null),
      an: new WasmBuffer(null),
      st: new WasmBuffer(null),
      pm: new WasmBuffer(null),
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
      this.fricationBuffer = new WasmBuffer(this.wasm);
      this.b1Buffer = new WasmBuffer(this.wasm);
      this.fnpBuffer = new WasmBuffer(this.wasm);
      this.fnzBuffer = new WasmBuffer(this.wasm);
      this.oqBuffer = new WasmBuffer(this.wasm);
      this.tlBuffer = new WasmBuffer(this.wasm);
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
    const fricationOut = outputs[2];
    const b1Out = outputs[3];
    const fnpOut = outputs[4];
    const fnzOut = outputs[5];
    const oqOut = outputs[6];
    const tlOut = outputs[7];

    if (
      !voicingOut || !voicingOut[0] ||
      !aspirationOut || !aspirationOut[0] ||
      !fricationOut || !fricationOut[0] ||
      !b1Out || !b1Out[0] ||
      !fnpOut || !fnpOut[0] ||
      !fnzOut || !fnzOut[0] ||
      !oqOut || !oqOut[0] ||
      !tlOut || !tlOut[0]
    ) {
      return true;
    }

    const voicingChannel = voicingOut[0];
    const aspirationChannel = aspirationOut[0];
    const fricationChannel = fricationOut[0];
    const b1Channel = b1Out[0];
    const fnpChannel = fnpOut[0];
    const fnzChannel = fnzOut[0];
    const oqChannel = oqOut[0];
    const tlChannel = tlOut[0];
    const blockSize = voicingChannel.length;

    if (!this.ready) {
      voicingChannel.fill(0);
      aspirationChannel.fill(0);
      fricationChannel.fill(0);
      b1Channel.fill(0);
      fnpChannel.fill(0);
      fnzChannel.fill(0);
      oqChannel.fill(0);
      tlChannel.fill(0);
      return true;
    }

    const agLen = this._fillParamBuffer(this.paramBuffers.ag, parameters.ag, blockSize);
    const acLen = this._fillParamBuffer(this.paramBuffers.ac, parameters.ac, blockSize);
    const anLen = this._fillParamBuffer(this.paramBuffers.an, parameters.an, blockSize);
    const stLen = this._fillParamBuffer(this.paramBuffers.st, parameters.st, blockSize);
    const pmLen = this._fillParamBuffer(this.paramBuffers.pm, parameters.pm, blockSize);
    const psLen = this._fillParamBuffer(this.paramBuffers.ps, parameters.ps, blockSize);

    this.voicingBuffer.ensure(blockSize);
    this.aspirationBuffer.ensure(blockSize);
    this.fricationBuffer.ensure(blockSize);
    this.b1Buffer.ensure(blockSize);
    this.fnpBuffer.ensure(blockSize);
    this.fnzBuffer.ensure(blockSize);
    this.oqBuffer.ensure(blockSize);
    this.tlBuffer.ensure(blockSize);

    this.wasm.aerodynamic_model_process(
      this.state,
      this.paramBuffers.ag.ptr,
      agLen,
      this.paramBuffers.ac.ptr,
      acLen,
      this.paramBuffers.an.ptr,
      anLen,
      this.paramBuffers.st.ptr,
      stLen,
      this.paramBuffers.pm.ptr,
      pmLen,
      this.paramBuffers.ps.ptr,
      psLen,
      this.voicingBuffer.ptr,
      this.aspirationBuffer.ptr,
      this.fricationBuffer.ptr,
      this.b1Buffer.ptr,
      this.fnpBuffer.ptr,
      this.fnzBuffer.ptr,
      this.oqBuffer.ptr,
      this.tlBuffer.ptr,
      blockSize
    );

    this.voicingBuffer.refresh();
    this.aspirationBuffer.refresh();
    this.fricationBuffer.refresh();
    this.b1Buffer.refresh();
    this.fnpBuffer.refresh();
    this.fnzBuffer.refresh();
    this.oqBuffer.refresh();
    this.tlBuffer.refresh();
    voicingChannel.set(this.voicingBuffer.view);
    aspirationChannel.set(this.aspirationBuffer.view);
    fricationChannel.set(this.fricationBuffer.view);
    b1Channel.set(this.b1Buffer.view);
    fnpChannel.set(this.fnpBuffer.view);
    fnzChannel.set(this.fnzBuffer.view);
    oqChannel.set(this.oqBuffer.view);
    tlChannel.set(this.tlBuffer.view);

    return true;
  }
}

registerProcessor("aerodynamic-model-processor", AerodynamicModelProcessor);
