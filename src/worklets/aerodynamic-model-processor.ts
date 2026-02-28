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
import { initWasmModule, WasmBuffer, resolveWasmUrl, BaseProcessorOptions, UNINITIALIZED_ALLOC, fillParamBuffer } from "./wasm-utils.js";

interface AerodynamicModelWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  aerodynamic_model_new(sampleRate: number): number;
  aerodynamic_model_process(
    state: number,
    enablePtr: number,
    enableLen: number,
    agPtr: number,
    agLen: number,
    acPtr: number,
    acLen: number,
    anPtr: number,
    anLen: number,
    stPtr: number,
    stLen: number,
    pmPtr: number,
    pmLen: number,
    psPtr: number,
    psLen: number,
    voicingPtr: number,
    aspirationPtr: number,
    fricationPtr: number,
    b1Ptr: number,
    fnpPtr: number,
    fnzPtr: number,
    oqPtr: number,
    tlPtr: number,
    blockSize: number
  ): void;
  aerodynamic_model_reset?: (state: number) => void;
}

type AerodynamicParamName = "enable" | "ag" | "ac" | "an" | "st" | "pm" | "ps";
type AerodynamicParamBuffers = Record<AerodynamicParamName, WasmBuffer>;

type AerodynamicModelProcessorOptions = Pick<BaseProcessorOptions, "processorOptions">;

const wasmUrl = resolveWasmUrl("./aerodynamic-model.wasm");

class AerodynamicModelProcessor extends AudioWorkletProcessor {
  wasm: AerodynamicModelWasmExports | null;
  state: number;
  ready: boolean;
  nodeId: string;
  voicingBuffer: WasmBuffer | null;
  aspirationBuffer: WasmBuffer | null;
  fricationBuffer: WasmBuffer | null;
  b1Buffer: WasmBuffer | null;
  fnpBuffer: WasmBuffer | null;
  fnzBuffer: WasmBuffer | null;
  oqBuffer: WasmBuffer | null;
  tlBuffer: WasmBuffer | null;
  paramBuffers: AerodynamicParamBuffers;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "enable", defaultValue: 0.0, minValue: 0, maxValue: 1, automationRate: "k-rate" as const },
      { name: "ag", defaultValue: 0.05, minValue: 0, maxValue: 0.4, automationRate: "k-rate" as const },
      { name: "ac", defaultValue: 0.4, minValue: 0, maxValue: 0.4, automationRate: "k-rate" as const },
      { name: "an", defaultValue: 0.0, minValue: 0, maxValue: 1.0, automationRate: "k-rate" as const },
      { name: "st", defaultValue: 0.0, minValue: -10, maxValue: 0, automationRate: "k-rate" as const },
      { name: "pm", defaultValue: 0.0, minValue: -0.5, maxValue: 0.2, automationRate: "k-rate" as const },
      { name: "ps", defaultValue: 8, minValue: 0, maxValue: 30, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as AerodynamicModelProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.nodeId = opts?.processorOptions?.nodeId || "aerodynamic-model";

    this.voicingBuffer = null;
    this.aspirationBuffer = null;
    this.fricationBuffer = null;
    this.b1Buffer = null;
    this.fnpBuffer = null;
    this.fnzBuffer = null;
    this.oqBuffer = null;
    this.tlBuffer = null;
    this.paramBuffers = {
      enable: new WasmBuffer(UNINITIALIZED_ALLOC),
      ag: new WasmBuffer(UNINITIALIZED_ALLOC),
      ac: new WasmBuffer(UNINITIALIZED_ALLOC),
      an: new WasmBuffer(UNINITIALIZED_ALLOC),
      st: new WasmBuffer(UNINITIALIZED_ALLOC),
      pm: new WasmBuffer(UNINITIALIZED_ALLOC),
      ps: new WasmBuffer(UNINITIALIZED_ALLOC),
    };

    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping" && this.ready) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.aerodynamic_model_reset) {
          this.wasm.aerodynamic_model_reset(this.state);
        }
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      const wasm = instance.exports as unknown as AerodynamicModelWasmExports;
      this.wasm = wasm;
      this.state = wasm.aerodynamic_model_new(sampleRate);
      this.voicingBuffer = new WasmBuffer(wasm);
      this.aspirationBuffer = new WasmBuffer(wasm);
      this.fricationBuffer = new WasmBuffer(wasm);
      this.b1Buffer = new WasmBuffer(wasm);
      this.fnpBuffer = new WasmBuffer(wasm);
      this.fnzBuffer = new WasmBuffer(wasm);
      this.oqBuffer = new WasmBuffer(wasm);
      this.tlBuffer = new WasmBuffer(wasm);
      Object.values(this.paramBuffers).forEach((buf) => {
        buf.exports = wasm;
      });
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
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

    if (
      !this.ready ||
      !this.wasm ||
      !this.voicingBuffer ||
      !this.aspirationBuffer ||
      !this.fricationBuffer ||
      !this.b1Buffer ||
      !this.fnpBuffer ||
      !this.fnzBuffer ||
      !this.oqBuffer ||
      !this.tlBuffer
    ) {
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

    const enableValues = parameters.enable ?? new Float32Array([0]);
    const agValues = parameters.ag ?? new Float32Array([0.05]);
    const acValues = parameters.ac ?? new Float32Array([0.4]);
    const anValues = parameters.an ?? new Float32Array([0]);
    const stValues = parameters.st ?? new Float32Array([0]);
    const pmValues = parameters.pm ?? new Float32Array([0]);
    const psValues = parameters.ps ?? new Float32Array([8]);

    const enableLen = fillParamBuffer(this.paramBuffers.enable, enableValues, blockSize);
    const agLen = fillParamBuffer(this.paramBuffers.ag, agValues, blockSize);
    const acLen = fillParamBuffer(this.paramBuffers.ac, acValues, blockSize);
    const anLen = fillParamBuffer(this.paramBuffers.an, anValues, blockSize);
    const stLen = fillParamBuffer(this.paramBuffers.st, stValues, blockSize);
    const pmLen = fillParamBuffer(this.paramBuffers.pm, pmValues, blockSize);
    const psLen = fillParamBuffer(this.paramBuffers.ps, psValues, blockSize);

    this.voicingBuffer.ensure(blockSize);
    this.aspirationBuffer.ensure(blockSize);
    this.fricationBuffer.ensure(blockSize);
    this.b1Buffer.ensure(blockSize);
    this.fnpBuffer.ensure(blockSize);
    this.fnzBuffer.ensure(blockSize);
    this.oqBuffer.ensure(blockSize);
    this.tlBuffer.ensure(blockSize);

    if (
      !this.voicingBuffer.view ||
      !this.aspirationBuffer.view ||
      !this.fricationBuffer.view ||
      !this.b1Buffer.view ||
      !this.fnpBuffer.view ||
      !this.fnzBuffer.view ||
      !this.oqBuffer.view ||
      !this.tlBuffer.view
    ) {
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

    this.wasm.aerodynamic_model_process(
      this.state,
      this.paramBuffers.enable.ptr,
      enableLen,
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
    const voicingView = this.voicingBuffer.view;
    const aspirationView = this.aspirationBuffer.view;
    const fricationView = this.fricationBuffer.view;
    const b1View = this.b1Buffer.view;
    const fnpView = this.fnpBuffer.view;
    const fnzView = this.fnzBuffer.view;
    const oqView = this.oqBuffer.view;
    const tlView = this.tlBuffer.view;
    if (!voicingView || !aspirationView || !fricationView || !b1View || !fnpView || !fnzView || !oqView || !tlView) {
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
    voicingChannel.set(voicingView);
    aspirationChannel.set(aspirationView);
    fricationChannel.set(fricationView);
    b1Channel.set(b1View);
    fnpChannel.set(fnpView);
    fnzChannel.set(fnzView);
    oqChannel.set(oqView);
    tlChannel.set(tlView);

    return true;
  }
}

registerProcessor("aerodynamic-model-processor", AerodynamicModelProcessor);
