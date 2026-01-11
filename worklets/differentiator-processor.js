class DifferentiatorProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.prev = [];
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "diff";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output) {
      return true;
    }

    for (let ch = 0; ch < output.length; ch += 1) {
      const inCh = input[ch];
      const outCh = output[ch];
      if (!inCh || !outCh) continue;

      let prev = this.prev[ch] || 0;
      for (let i = 0; i < outCh.length; i += 1) {
        const x = inCh[i];
        outCh[i] = x - prev;
        prev = x;
      }
      this.prev[ch] = prev;
    }
    this._reportMetrics(output[0]);
    return true;
  }

  _reportMetrics(buffer) {
    if (!this.debug || !buffer) return;
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

registerProcessor("differentiator-processor", DifferentiatorProcessor);
