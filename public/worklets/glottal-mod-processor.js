class GlottalModProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "f0", defaultValue: 110, minValue: 0, maxValue: 500, automationRate: "a-rate" },
    ];
  }

  constructor(options) {
    super(options);
    this.phase = 0;
    this.lastF0 = 0;
    this.debug = Boolean(options?.processorOptions?.debug);
    this.nodeId = options?.processorOptions?.nodeId || "glottal-mod";
    this.reportInterval = options?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };
    this.port.postMessage({ type: "ready", node: this.nodeId });
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) {
      return true;
    }
    const out = output[0];
    const f0Values = parameters.f0;
    const hasF0 = f0Values && f0Values.length > 0;
    const blockSize = out.length;

    let f0Sum = 0;
    if (hasF0) {
      for (let i = 0; i < f0Values.length; i += 1) {
        f0Sum += f0Values[i];
      }
      this.lastF0 = f0Sum / f0Values.length;
    }

    for (let i = 0; i < blockSize; i += 1) {
      const f0 = hasF0 ? (f0Values.length > 1 ? f0Values[i] : f0Values[0]) : 0;
      if (!f0 || f0 <= 0) {
        out[i] = 0.5;
        continue;
      }
      const period = sampleRate / f0;
      if (period > 1) {
        if (this.phase >= period) {
          this.phase %= period;
        }
        out[i] = this.phase < period * 0.5 ? 1.0 : 0.5;
        this.phase += 1;
      } else {
        out[i] = 1.0;
      }
    }

    this._reportMetrics(out);
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
    this.port.postMessage({
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      f0: this.lastF0,
    });
  }
}

registerProcessor("glottal-mod-processor", GlottalModProcessor);
