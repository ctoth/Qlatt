class ImpulseTrainProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "f0", defaultValue: 0, minValue: 0, maxValue: 2000, automationRate: "a-rate" },
      { name: "gain", defaultValue: 1, minValue: 0, maxValue: 1, automationRate: "a-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.phase = 0;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "impulse";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };
    this.port.postMessage({ type: "ready", node: this.nodeId });
  }

  process(_inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const outputChannel = output[0];
    const blockSize = outputChannel.length;
    const f0Values = parameters.f0;
    const gainValues = parameters.gain;
    const sr = sampleRate || 48000;

    let gainSum = 0;
    let gainPeak = 0;
    for (let i = 0; i < blockSize; i += 1) {
      const f0 = f0Values.length > 1 ? f0Values[i] : f0Values[0];
      const gain = gainValues.length > 1 ? gainValues[i] : gainValues[0];
      gainSum += gain;
      if (gain > gainPeak) gainPeak = gain;

      if (!Number.isFinite(f0) || f0 <= 0) {
        outputChannel[i] = 0;
        continue;
      }

      const phaseInc = f0 / sr;
      this.phase += phaseInc;
      if (this.phase >= 1) {
        this.phase -= Math.floor(this.phase);
        outputChannel[i] = gain;
      } else {
        outputChannel[i] = 0;
      }
    }

    this._reportMetrics(outputChannel, {
      gainAvg: gainSum / blockSize,
      gainPeak,
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
    const payload = { type: "metrics", node: this.nodeId, rms, peak };
    if (params) {
      payload.gainAvg = params.gainAvg;
      payload.gainPeak = params.gainPeak;
    }
    this.port.postMessage(payload);
  }
}

registerProcessor("impulse-train-processor", ImpulseTrainProcessor);
