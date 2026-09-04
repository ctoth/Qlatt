import {
  type BaseProcessorOptions,
  computeRmsPeak,
  initWasmModule,
  resolveWasmUrl,
  WasmBuffer,
} from "./wasm-utils.js";

interface SignalSwitchWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  signal_switch_new(): number;
  signal_switch_process_krate(
    state: number,
    input0Ptr: number,
    input1Ptr: number,
    selector: number,
    outputPtr: number,
    blockSize: number,
  ): void;
}

type SignalSwitchProcessorOptions = BaseProcessorOptions;

interface SignalSwitchMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  selector: number;
  selectedBranch: "cascade" | "parallel";
  in0Rms?: number;
  in0Peak?: number;
  in1Rms?: number;
  in1Peak?: number;
}

const wasmUrl = resolveWasmUrl("./signal-switch.wasm");

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
  private disposed = false;
  wasm: SignalSwitchWasmExports | null;
  state: number;
  input0Buffer: WasmBuffer | null;
  input1Buffer: WasmBuffer | null;
  outputBuffer: WasmBuffer | null;
  ready: boolean;
  debug: boolean;
  nodeId: string;
  reportInterval: number;
  _reportCountdown: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
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

  constructor(options?: unknown) {
    super(options);
    const opts = options as SignalSwitchProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.input0Buffer = null;
    this.input1Buffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "signal-switch";
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "dispose") {
        this.disposed = true;
        this.port.close();
        return;
      }
      if (event?.data?.type === "ping" && this.ready) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as SignalSwitchWasmExports;
      this.state = this.wasm.signal_switch_new();
      this.input0Buffer = new WasmBuffer(this.wasm);
      this.input1Buffer = new WasmBuffer(this.wasm);
      this.outputBuffer = new WasmBuffer(this.wasm);
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean {
    if (this.disposed) return false;
    const output = outputs[0];
    if (!output || !output[0]) {
      return true;
    }
    const outputChannel = output[0];
    const blockSize = outputChannel.length;

    if (
      !this.ready ||
      !this.wasm ||
      !this.input0Buffer ||
      !this.input1Buffer ||
      !this.outputBuffer
    ) {
      outputChannel.fill(0);
      return true;
    }

    // Get input channels (input0 = cascade, input1 = parallel)
    const input0 = inputs[0];
    const input1 = inputs[1];
    const input0Channel = input0 && input0[0] ? input0[0] : null;
    const input1Channel = input1 && input1[0] ? input1[0] : null;
    const selector = parameters.selector?.[0] ?? 0;

    // Ensure buffers are allocated
    this.input0Buffer.ensure(blockSize);
    this.input1Buffer.ensure(blockSize);
    this.outputBuffer.ensure(blockSize);
    if (!this.input0Buffer.view || !this.input1Buffer.view || !this.outputBuffer.view) {
      outputChannel.fill(0);
      return true;
    }

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
      blockSize,
    );

    this.outputBuffer.refresh();
    if (!this.outputBuffer.view) {
      outputChannel.fill(0);
      return true;
    }
    outputChannel.set(this.outputBuffer.view);
    this._reportMetrics(outputChannel, input0Channel, input1Channel, selector);
    return true;
  }

  _reportMetrics(
    buffer: Float32Array,
    input0Buffer: Float32Array | null,
    input1Buffer: Float32Array | null,
    selector: number,
  ): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    const { rms, peak } = computeRmsPeak(buffer);
    const payload: SignalSwitchMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      selector,
      selectedBranch: selector < 0.5 ? "cascade" : "parallel",
    };

    // Report input0 metrics
    if (input0Buffer) {
      const in0Metrics = computeRmsPeak(input0Buffer);
      payload.in0Rms = in0Metrics.rms;
      payload.in0Peak = in0Metrics.peak;
    }

    // Report input1 metrics
    if (input1Buffer) {
      const in1Metrics = computeRmsPeak(input1Buffer);
      payload.in1Rms = in1Metrics.rms;
      payload.in1Peak = in1Metrics.peak;
    }

    this.port.postMessage(payload);
  }
}

registerProcessor("signal-switch-processor", SignalSwitchProcessor);
