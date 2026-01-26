import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

const wasmUrl =
  typeof URL === "function"
    ? new URL("./decay-envelope.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}decay-envelope.wasm`;

/**
 * Decay Envelope AudioWorklet Processor
 *
 * Implements Klatt 80 PLSTEP burst decay mechanism.
 * When triggered, sets envelope to -amplitude and decays exponentially toward zero.
 *
 * Klatt 80 uses decay = 0.995 at 10kHz (~92ms time constant).
 * The decay coefficient is automatically adapted for the actual sample rate.
 */
class DecayEnvelopeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "trigger",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "a-rate",
      },
      {
        name: "amplitude",
        defaultValue: 1.0,
        minValue: 0,
        maxValue: 10,
        automationRate: "a-rate",
      },
      {
        name: "decay",
        defaultValue: 0,  // 0 means auto-calculate from sample rate
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
    this.triggerBuffer = null;
    this.amplitudeBuffer = null;
    this.decayBuffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.autoDecay = 0.995; // Will be calculated from sample rate
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "decay-envelope";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    // Track last trigger audio sample for cross-block edge detection
    // (WASM also tracks this internally, but JS tracking enables metrics)
    this.lastTriggerAudio = 0;

    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.wasm && this.state) {
          this.wasm.decay_envelope_reset(this.state);
        }
      }
    };

    const wasmBytes = options?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then(({ instance }) => {
      this.wasm = instance.exports;
      this.state = this.wasm.decay_envelope_new();
      this.triggerBuffer = new WasmBuffer(this.wasm);
      this.amplitudeBuffer = new WasmBuffer(this.wasm);
      this.decayBuffer = new WasmBuffer(this.wasm);
      this.outputBuffer = new WasmBuffer(this.wasm);

      // Calculate decay coefficient for actual sample rate
      // Klatt 80: 0.995 at 10kHz, adapt to actual rate
      this.autoDecay = this.wasm.decay_coefficient_for_sample_rate(sampleRate);

      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId, decay: this.autoDecay });
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

    // Trigger can come from audio input OR parameter
    // Audio input takes precedence if connected
    const inputChannel = inputs[0]?.[0];
    let trigger;
    let audioTriggerDetected = false;
    if (inputChannel && inputChannel.length > 0) {
      // Use audio input as trigger (from edge-detector)
      trigger = inputChannel;

      // Detect rising edge in JS for metrics (WASM also does this internally)
      // Check first sample against last sample of previous block
      if (inputChannel[0] > 0.5 && this.lastTriggerAudio <= 0.5) {
        audioTriggerDetected = true;
      }
      // Check remaining samples within this block
      for (let i = 1; i < inputChannel.length && !audioTriggerDetected; i++) {
        if (inputChannel[i] > 0.5 && inputChannel[i - 1] <= 0.5) {
          audioTriggerDetected = true;
        }
      }
      // Update lastTriggerAudio with the last sample of this block
      this.lastTriggerAudio = inputChannel[inputChannel.length - 1];
    } else {
      // Fall back to parameter
      trigger = parameters.trigger;
    }
    const amplitude = parameters.amplitude;
    const decayParam = parameters.decay[0];

    // Use auto-calculated decay if param is 0, otherwise use the provided value
    const decayValue = decayParam > 0 ? decayParam : this.autoDecay;

    // Ensure buffers
    this.triggerBuffer.ensure(trigger.length);
    this.amplitudeBuffer.ensure(amplitude.length);
    this.decayBuffer.ensure(1);
    this.outputBuffer.ensure(blockSize);

    // Copy trigger values
    this.triggerBuffer.view.set(trigger);

    // Copy amplitude values
    this.amplitudeBuffer.view.set(amplitude);

    // Set decay (k-rate, single value)
    this.decayBuffer.view[0] = decayValue;

    // Process
    this.wasm.decay_envelope_process(
      this.state,
      this.triggerBuffer.ptr,
      trigger.length,
      this.amplitudeBuffer.ptr,
      amplitude.length,
      this.decayBuffer.ptr,
      1,
      this.outputBuffer.ptr,
      blockSize
    );

    // Copy output
    this.outputBuffer.refresh();
    outputChannel.set(this.outputBuffer.view);

    this._reportMetrics(outputChannel, {
      decayValue,
      trigger: trigger[0],
      amplitude: amplitude[0],
      audioTriggerDetected,
    });
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
    const currentValue = this.wasm.decay_envelope_get_value(this.state);

    this.port.postMessage({
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      currentValue,
      decay: params.decayValue,
      trigger: params.trigger,
      amplitude: params.amplitude,
      audioTriggerDetected: params.audioTriggerDetected,
    });
  }
}

registerProcessor("decay-envelope-processor", DecayEnvelopeProcessor);
