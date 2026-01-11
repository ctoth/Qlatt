class NoiseSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "gain", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
      { name: "cutoff", defaultValue: 1000, minValue: 50, maxValue: 8000, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.y1 = 0;
    this.alpha = 0.0;
    this._lastCutoff = -1;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "noise";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
  }

  _updateFilter(cutoff) {
    const clamped = Math.max(1, Math.min(cutoff, sampleRate * 0.45));
    this.alpha = Math.exp(-2 * Math.PI * clamped / sampleRate);
    this._lastCutoff = clamped;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) {
      return true;
    }
    const outputChannel = output[0];
    const blockSize = outputChannel.length;
    const gainValues = parameters.gain;
    const cutoff = parameters.cutoff[0];

    if (cutoff !== this._lastCutoff) {
      this._updateFilter(cutoff);
    }

    for (let i = 0; i < blockSize; i += 1) {
      const gain = gainValues.length > 1 ? gainValues[i] : gainValues[0];
      const white = Math.random() * 2 - 1;
      const y = (1 - this.alpha) * white + this.alpha * this.y1;
      this.y1 = y;
      outputChannel[i] = y * gain;
    }

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
    this.port.postMessage({ type: "metrics", node: this.nodeId, rms, peak });
  }
}

registerProcessor("noise-source-processor", NoiseSourceProcessor);
