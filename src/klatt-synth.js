export class KlattSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nodes = {};
    this.params = this._defaultParams();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    const workletBase = new URL("../worklets/", import.meta.url);
    await this._loadWasmBytes(workletBase);
    await Promise.all([
      this.ctx.audioWorklet.addModule(new URL("resonator-processor.js", workletBase)),
      this.ctx.audioWorklet.addModule(new URL("antiresonator-processor.js", workletBase)),
      this.ctx.audioWorklet.addModule(new URL("lf-source-processor.js", workletBase)),
      this.ctx.audioWorklet.addModule(new URL("noise-source-processor.js", workletBase)),
      this.ctx.audioWorklet.addModule(new URL("differentiator-processor.js", workletBase)),
    ]);

    this._createNodes();
    this._connectGraph();
    this._applyAllParams(this.ctx.currentTime);
    this.isInitialized = true;
  }

  _defaultParams() {
    return {
      f0: 110,
      rd: 1.0,
      voiceGain: 1.0,
      noiseGain: 0.0,
      noiseCutoff: 1000,
      fricationCutoff: 3000,
      masterGain: 1.0,
      rgpFrequency: 0,
      rgpBandwidth: 0,
      rgsFrequency: 1000,
      rgsBandwidth: 1500,
      FNZ: 270,
      BNZ: 100,
      FNP: 270,
      BNP: 100,
      parallelMix: 0.6,
      parallelGainScale: 0.003,
      parallelVoiceGain: 0.0,
      parallelFricationGain: 0.0,
      parallelBypassGain: 0.0,
      parallelNasalGain: 0.0,
      AN: -70,
      A1: -70,
      A2: -70,
      A3: -70,
      A4: -70,
      A5: -70,
      A6: -70,
      AB: -70,
      F1: 700,
      F2: 1200,
      F3: 2600,
      F4: 3300,
      F5: 3750,
      F6: 4900,
      B1: 60,
      B2: 90,
      B3: 120,
      B4: 250,
      B5: 200,
      B6: 1000,
    };
  }

  _createNodes() {
    const ctx = this.ctx;
    const N = this.nodes;
    const wasm = this.wasmBytes;
    const telemetry = Boolean(this.telemetryHandler);
    const reportInterval = 40;

    N.lfSource = new AudioWorkletNode(ctx, "lf-source-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        wasmBytes: wasm?.lfSource,
        debug: telemetry,
        nodeId: "lf-source",
        reportInterval,
      },
    });
    N.noiseSource = new AudioWorkletNode(ctx, "noise-source-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        debug: telemetry,
        nodeId: "noise",
        reportInterval,
      },
    });
    N.fricationSource = new AudioWorkletNode(ctx, "noise-source-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        debug: telemetry,
        nodeId: "frication",
        reportInterval,
      },
    });
    N.rgp = new AudioWorkletNode(ctx, "resonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.resonator,
        debug: telemetry,
        nodeId: "rgp",
        reportInterval,
      },
    });
    N.rgs = new AudioWorkletNode(ctx, "resonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.resonator,
        debug: telemetry,
        nodeId: "rgs",
        reportInterval,
      },
    });
    N.diff = new AudioWorkletNode(ctx, "differentiator-processor", {
      processorOptions: {
        debug: telemetry,
        nodeId: "diff",
        reportInterval,
      },
    });
    N.nz = new AudioWorkletNode(ctx, "antiresonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.antiresonator,
        debug: telemetry,
        nodeId: "nz",
        reportInterval,
      },
    });
    N.np = new AudioWorkletNode(ctx, "resonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.resonator,
        debug: telemetry,
        nodeId: "np",
        reportInterval,
      },
    });
    N.cascade = Array.from({ length: 6 }, (_, index) =>
      new AudioWorkletNode(ctx, "resonator-processor", {
        processorOptions: {
          wasmBytes: wasm?.resonator,
          debug: telemetry,
          nodeId: `cascade-${index + 1}`,
          reportInterval,
        },
      })
    );
    N.parallelNasal = new AudioWorkletNode(ctx, "resonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.resonator,
        debug: telemetry,
        nodeId: "parallel-nasal",
        reportInterval,
      },
    });
    N.parallelFormants = Array.from({ length: 6 }, (_, index) =>
      new AudioWorkletNode(ctx, "resonator-processor", {
        processorOptions: {
          wasmBytes: wasm?.resonator,
          debug: telemetry,
          nodeId: `parallel-formant-${index + 1}`,
          reportInterval,
        },
      })
    );

    N.voiceGain = ctx.createGain();
    N.noiseGain = ctx.createGain();
    N.mixer = ctx.createGain();
    N.parallelSourceGain = ctx.createGain();
    N.parallelDiffGain = ctx.createGain();
    N.parallelFricGain = ctx.createGain();
    N.parallelDiffSum = ctx.createGain();
    N.parallelBypassGain = ctx.createGain();
    N.parallelNasalGain = ctx.createGain();
    N.parallelFormantGains = Array.from({ length: 6 }, () => ctx.createGain());
    N.parallelSum = ctx.createGain();
    N.parallelOutGain = ctx.createGain();
    N.cascadeOutGain = ctx.createGain();
    N.outputSum = ctx.createGain();
    N.masterGain = ctx.createGain();

    this._attachTelemetry(N.lfSource);
    this._attachTelemetry(N.noiseSource);
    this._attachTelemetry(N.fricationSource);
    this._attachTelemetry(N.rgp);
    this._attachTelemetry(N.rgs);
    this._attachTelemetry(N.nz);
    this._attachTelemetry(N.diff);
    this._attachTelemetry(N.np);
    this._attachTelemetry(N.parallelNasal);
    for (const node of N.cascade) {
      this._attachTelemetry(node);
    }
    for (const node of N.parallelFormants) {
      this._attachTelemetry(node);
    }
  }

  _connectGraph() {
    const N = this.nodes;
    N.lfSource.connect(N.rgp);
    N.rgp.connect(N.voiceGain).connect(N.mixer);
    N.noiseSource.connect(N.rgs).connect(N.noiseGain).connect(N.mixer);
    N.mixer.connect(N.nz).connect(N.np);
    let current = N.np;
    for (const resonator of N.cascade) {
      current.connect(resonator);
      current = resonator;
    }

    current.connect(N.cascadeOutGain).connect(N.outputSum);

    N.rgp.connect(N.parallelSourceGain);
    N.rgp.connect(N.diff);
    N.diff.connect(N.parallelDiffGain).connect(N.parallelDiffSum);
    N.fricationSource.connect(N.parallelFricGain).connect(N.parallelDiffSum);

    N.parallelSourceGain.connect(N.parallelNasal).connect(N.parallelNasalGain).connect(N.parallelSum);
    N.parallelSourceGain.connect(N.parallelFormants[0]);
    N.parallelFormants[0].connect(N.parallelFormantGains[0]).connect(N.parallelSum);

    for (let i = 1; i < N.parallelFormants.length; i += 1) {
      N.parallelDiffSum.connect(N.parallelFormants[i]);
      N.parallelFormants[i].connect(N.parallelFormantGains[i]).connect(N.parallelSum);
    }

    N.parallelDiffSum.connect(N.parallelBypassGain).connect(N.parallelSum);
    N.parallelSum.connect(N.parallelOutGain).connect(N.outputSum);

    N.outputSum.connect(N.masterGain).connect(this.ctx.destination);
  }

  _applyAllParams(atTime) {
    const p = this.params;
    this._setAudioParam(this.nodes.lfSource.parameters.get("f0"), p.f0, atTime);
    this._setAudioParam(this.nodes.lfSource.parameters.get("rd"), p.rd, atTime);
    this._setAudioParam(this.nodes.rgp.parameters.get("frequency"), p.rgpFrequency, atTime);
    this._setAudioParam(this.nodes.rgp.parameters.get("bandwidth"), p.rgpBandwidth, atTime);
    this._setAudioParam(this.nodes.rgs.parameters.get("frequency"), p.rgsFrequency, atTime);
    this._setAudioParam(this.nodes.rgs.parameters.get("bandwidth"), p.rgsBandwidth, atTime);
    this._setAudioParam(this.nodes.nz.parameters.get("frequency"), p.FNZ, atTime);
    this._setAudioParam(this.nodes.nz.parameters.get("bandwidth"), p.BNZ, atTime);
    this._setAudioParam(this.nodes.np.parameters.get("frequency"), p.FNP, atTime);
    this._setAudioParam(this.nodes.np.parameters.get("bandwidth"), p.BNP, atTime);
    this._setAudioParam(this.nodes.parallelNasal.parameters.get("frequency"), p.FNP, atTime);
    this._setAudioParam(this.nodes.parallelNasal.parameters.get("bandwidth"), p.BNP, atTime);

    this.nodes.voiceGain.gain.setValueAtTime(p.voiceGain, atTime);
    this.nodes.noiseGain.gain.setValueAtTime(p.noiseGain, atTime);
    this.nodes.masterGain.gain.setValueAtTime(p.masterGain, atTime);
    const parallelScale = Number.isFinite(p.parallelGainScale)
      ? p.parallelGainScale
      : 1.0;
    this.nodes.parallelSourceGain.gain.setValueAtTime(p.parallelVoiceGain, atTime);
    this.nodes.parallelDiffGain.gain.setValueAtTime(p.parallelVoiceGain, atTime);
    this.nodes.parallelFricGain.gain.setValueAtTime(p.parallelFricationGain, atTime);
    const bypassGain = Number.isFinite(p.AB)
      ? this._dbToLinear(p.AB) * parallelScale
      : p.parallelBypassGain;
    this.nodes.parallelBypassGain.gain.setValueAtTime(bypassGain, atTime);
    const nasalDb = Number.isFinite(p.parallelNasalGain) ? p.parallelNasalGain : p.AN;
    this.nodes.parallelNasalGain.gain.setValueAtTime(
      this._dbToLinear(nasalDb) * parallelScale,
      atTime
    );

    this._setAudioParam(this.nodes.noiseSource.parameters.get("gain"), 1.0, atTime);
    this._setAudioParam(this.nodes.noiseSource.parameters.get("cutoff"), p.noiseCutoff, atTime);
    this._setAudioParam(this.nodes.fricationSource.parameters.get("gain"), 1.0, atTime);
    this._setAudioParam(this.nodes.fricationSource.parameters.get("cutoff"), p.fricationCutoff, atTime);

    const formants = [
      { f: p.F1, b: p.B1 },
      { f: p.F2, b: p.B2 },
      { f: p.F3, b: p.B3 },
      { f: p.F4, b: p.B4 },
      { f: p.F5, b: p.B5 },
      { f: p.F6, b: p.B6 },
    ];
    for (let i = 0; i < this.nodes.cascade.length; i += 1) {
      const node = this.nodes.cascade[i];
      const formant = formants[i];
      this._setAudioParam(node.parameters.get("frequency"), formant.f, atTime);
      this._setAudioParam(node.parameters.get("bandwidth"), formant.b, atTime);
      this._setAudioParam(node.parameters.get("gain"), 1.0, atTime);
    }

    for (let i = 0; i < this.nodes.parallelFormants.length; i += 1) {
      const node = this.nodes.parallelFormants[i];
      const formant = formants[i];
      this._setAudioParam(node.parameters.get("frequency"), formant.f, atTime);
      this._setAudioParam(node.parameters.get("bandwidth"), formant.b, atTime);
      this._setAudioParam(node.parameters.get("gain"), 1.0, atTime);
    }

    const parallelGains = [p.A1, p.A2, p.A3, p.A4, p.A5, p.A6];
    for (let i = 0; i < this.nodes.parallelFormantGains.length; i += 1) {
      this._setParallelFormantGain(i, parallelGains[i], atTime);
    }

    this._setParallelMix(p.parallelMix, atTime);
  }

  _setAudioParam(param, value, atTime) {
    if (!param || !Number.isFinite(value)) return;
    param.setValueAtTime(value, atTime);
  }

  _dbToLinear(db) {
    if (!Number.isFinite(db) || db <= -72) return 0;
    const clamped = Math.min(96, db);
    return 2 ** (clamped / 6);
  }

  _setParallelFormantGain(index, dbValue, atTime) {
    const scale = Number.isFinite(this.params.parallelGainScale)
      ? this.params.parallelGainScale
      : 1.0;
    const linear = this._dbToLinear(dbValue) * scale;
    const sign = index >= 1 ? (index % 2 === 1 ? -1 : 1) : 1;
    this.nodes.parallelFormantGains[index].gain.setValueAtTime(sign * linear, atTime);
  }

  _scheduleAudioParam(param, value, atTime, ramp) {
    if (!param || !Number.isFinite(value)) return;
    if (ramp) {
      param.linearRampToValueAtTime(value, atTime);
    } else {
      param.setValueAtTime(value, atTime);
    }
  }

  _cancelParamAutomation(param, atTime) {
    if (!param) return;
    param.cancelScheduledValues(atTime);
    param.setValueAtTime(param.value, atTime);
  }

  _cancelScheduledValues(atTime) {
    const params = [
      this.nodes.lfSource.parameters.get("f0"),
      this.nodes.lfSource.parameters.get("rd"),
      this.nodes.rgp.parameters.get("frequency"),
      this.nodes.rgp.parameters.get("bandwidth"),
      this.nodes.rgs.parameters.get("frequency"),
      this.nodes.rgs.parameters.get("bandwidth"),
      this.nodes.nz.parameters.get("frequency"),
      this.nodes.nz.parameters.get("bandwidth"),
      this.nodes.np.parameters.get("frequency"),
      this.nodes.np.parameters.get("bandwidth"),
      this.nodes.parallelNasal.parameters.get("frequency"),
      this.nodes.parallelNasal.parameters.get("bandwidth"),
      this.nodes.voiceGain.gain,
      this.nodes.noiseGain.gain,
      this.nodes.masterGain.gain,
      this.nodes.parallelSourceGain.gain,
      this.nodes.parallelDiffGain.gain,
      this.nodes.parallelFricGain.gain,
      this.nodes.parallelBypassGain.gain,
      this.nodes.parallelNasalGain.gain,
      this.nodes.parallelOutGain.gain,
      this.nodes.cascadeOutGain.gain,
    ];

    for (const node of this.nodes.cascade) {
      params.push(node.parameters.get("frequency"));
      params.push(node.parameters.get("bandwidth"));
    }
    for (const node of this.nodes.parallelFormants) {
      params.push(node.parameters.get("frequency"));
      params.push(node.parameters.get("bandwidth"));
    }
    for (const gainNode of this.nodes.parallelFormantGains) {
      params.push(gainNode.gain);
    }

    for (const param of params) {
      this._cancelParamAutomation(param, atTime);
    }
  }

  _applyKlattParams(params, atTime, ramp) {
    const voiceDb = params.AV ?? -70;
    const voiceParDb = params.AVS ?? -70;
    const aspDb = params.AH ?? -70;
    const fricDb = params.AF ?? -70;
    const goDb = params.GO ?? 47;

    const ndbScale = {
      A1: -58,
      A2: -65,
      A3: -73,
      A4: -78,
      A5: -79,
      A6: -80,
      AN: -58,
      AB: -84,
      AV: -72,
      AH: -102,
      AF: -72,
      AVS: -44,
    };
    const f1 = params.F1 ?? this.params.F1;
    const f2 = params.F2 ?? this.params.F2;
    const f3 = params.F3 ?? this.params.F3;
    const f4 = params.F4 ?? this.params.F4;
    const delF1 = Number.isFinite(f1) && f1 > 0 ? f1 / 500 : 1;
    const delF2 = Number.isFinite(f2) && f2 > 0 ? f2 / 1500 : 1;
    let a2Cor = delF1 * delF1;
    const a2Skrt = delF2 * delF2;
    const a3Cor = a2Cor * a2Skrt;
    a2Cor = delF2 !== 0 ? a2Cor / delF2 : a2Cor;
    const ndbCor = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const proximity = (delta) => {
      if (!Number.isFinite(delta) || delta < 50 || delta >= 550) return 0;
      const index = Math.floor(delta / 50) - 1;
      return ndbCor[Math.max(0, Math.min(index, ndbCor.length - 1))] ?? 0;
    };
    const n12Cor = proximity(f2 - f1);
    const n23Cor = proximity(f3 - f2 - 50);
    const n34Cor = proximity(f4 - f3 - 150);

    const voiceGain = this._dbToLinear(voiceDb + ndbScale.AV);
    const parallelScale = Number.isFinite(this.params.parallelGainScale)
      ? this.params.parallelGainScale
      : 1.0;
    const voiceParGain =
      this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
    const aspGain = this._dbToLinear(aspDb + ndbScale.AH);
    const fricDbAdjusted = params.SW === 1 ? Math.max(fricDb, aspDb) : fricDb;
    const fricGain =
      this._dbToLinear(fricDbAdjusted + ndbScale.AF) * parallelScale;
    const baseBoost = Number.isFinite(this.params.masterGain)
      ? this.params.masterGain
      : 1.0;
    const outputScale = 1e-4;
    const masterGain = Math.min(
      5.0,
      this._dbToLinear(goDb) * baseBoost * outputScale
    );

    const mix = params.SW === 1 ? this.params.parallelMix : 0;

    this._scheduleAudioParam(this.nodes.lfSource.parameters.get("f0"), params.F0 ?? this.params.f0, atTime, ramp);
    if (Number.isFinite(params.Rd)) {
      this._scheduleAudioParam(this.nodes.lfSource.parameters.get("rd"), params.Rd, atTime, ramp);
    }

    this._scheduleAudioParam(this.nodes.voiceGain.gain, voiceGain, atTime, ramp);
    this._scheduleAudioParam(this.nodes.parallelSourceGain.gain, voiceParGain, atTime, ramp);
    this._scheduleAudioParam(this.nodes.parallelDiffGain.gain, voiceParGain, atTime, ramp);
    this._scheduleAudioParam(this.nodes.noiseGain.gain, aspGain, atTime, ramp);
    this._scheduleAudioParam(this.nodes.parallelFricGain.gain, fricGain, atTime, ramp);
    this._scheduleAudioParam(this.nodes.masterGain.gain, masterGain, atTime, ramp);

    this._setParallelMix(mix, atTime, false, ramp);

    const formants = [
      ["F1", "B1"],
      ["F2", "B2"],
      ["F3", "B3"],
      ["F4", "B4"],
      ["F5", "B5"],
      ["F6", "B6"],
    ];
    formants.forEach(([fKey, bKey], index) => {
      this._scheduleAudioParam(
        this.nodes.cascade[index].parameters.get("frequency"),
        params[fKey],
        atTime,
        ramp
      );
      this._scheduleAudioParam(
        this.nodes.cascade[index].parameters.get("bandwidth"),
        params[bKey],
        atTime,
        ramp
      );
      this._scheduleAudioParam(
        this.nodes.parallelFormants[index].parameters.get("frequency"),
        params[fKey],
        atTime,
        ramp
      );
      this._scheduleAudioParam(
        this.nodes.parallelFormants[index].parameters.get("bandwidth"),
        params[bKey],
        atTime,
        ramp
      );
    });

    const parallelLinear = [
      this._dbToLinear((params.A1 ?? -70) + n12Cor + ndbScale.A1),
      this._dbToLinear((params.A2 ?? -70) + n12Cor + n12Cor + n23Cor + ndbScale.A2) *
        a2Cor,
      this._dbToLinear((params.A3 ?? -70) + n23Cor + n23Cor + n34Cor + ndbScale.A3) *
        a3Cor,
      this._dbToLinear((params.A4 ?? -70) + n34Cor + n34Cor + ndbScale.A4) * a3Cor,
      this._dbToLinear((params.A5 ?? -70) + ndbScale.A5) * a3Cor,
      this._dbToLinear((params.A6 ?? -70) + ndbScale.A6) * a3Cor,
    ];
    for (let i = 0; i < this.nodes.parallelFormantGains.length; i += 1) {
      const sign = i >= 1 ? (i % 2 === 1 ? -1 : 1) : 1;
      const linear = parallelLinear[i] * parallelScale;
      this._scheduleAudioParam(
        this.nodes.parallelFormantGains[i].gain,
        sign * linear,
        atTime,
        ramp
      );
    }
    if (Number.isFinite(params.AB)) {
      this._scheduleAudioParam(
        this.nodes.parallelBypassGain.gain,
        this._dbToLinear(params.AB + ndbScale.AB) * parallelScale,
        atTime,
        ramp
      );
    }
    if (Number.isFinite(params.AN)) {
      this._scheduleAudioParam(
        this.nodes.parallelNasalGain.gain,
        this._dbToLinear(params.AN + ndbScale.AN) * parallelScale,
        atTime,
        ramp
      );
    }

    this._scheduleAudioParam(this.nodes.nz.parameters.get("frequency"), params.FNZ, atTime, ramp);
    this._scheduleAudioParam(this.nodes.nz.parameters.get("bandwidth"), params.BNZ, atTime, ramp);
    this._scheduleAudioParam(this.nodes.np.parameters.get("frequency"), params.FNP, atTime, ramp);
    this._scheduleAudioParam(this.nodes.np.parameters.get("bandwidth"), params.BNP, atTime, ramp);
    this._scheduleAudioParam(this.nodes.parallelNasal.parameters.get("frequency"), params.FNP, atTime, ramp);
    this._scheduleAudioParam(this.nodes.parallelNasal.parameters.get("bandwidth"), params.BNP, atTime, ramp);
  }

  scheduleTrack(track, startTime = this.ctx.currentTime + 0.05) {
    if (!track || track.length === 0) return;
    this._cancelScheduledValues(startTime);
    const baseTime = startTime;
    const first = track[0];
    if (first?.params) {
      this._applyKlattParams(first.params, baseTime, false);
    }
    for (let i = 1; i < track.length; i += 1) {
      const event = track[i];
      if (!event?.params) continue;
      const t = baseTime + event.time;
      this._applyKlattParams(event.params, t, true);
    }
  }

  _setParallelMix(value, atTime, updateParam = true, ramp = false) {
    const mix = Math.max(0, Math.min(1, Number(value)));
    if (updateParam) {
      this.params.parallelMix = mix;
    }
    if (ramp) {
      this.nodes.parallelOutGain.gain.linearRampToValueAtTime(mix, atTime);
      this.nodes.cascadeOutGain.gain.linearRampToValueAtTime(1 - mix, atTime);
    } else {
      this.nodes.parallelOutGain.gain.setValueAtTime(mix, atTime);
      this.nodes.cascadeOutGain.gain.setValueAtTime(1 - mix, atTime);
    }
  }

  setTelemetryHandler(handler) {
    this.telemetryHandler = handler;
  }

  _attachTelemetry(node) {
    if (!this.telemetryHandler || !node?.port) return;
    node.port.onmessage = (event) => {
      const data = event.data;
      if (!data || data.type !== "metrics") return;
      this.telemetryHandler(data);
    };
  }

  async _loadWasmBytes(workletBase) {
    if (this.wasmBytes) return;
    const load = async (file) => {
      const response = await fetch(new URL(file, workletBase));
      return response.arrayBuffer();
    };
    const [resonator, antiresonator, lfSource] = await Promise.all([
      load("resonator.wasm"),
      load("antiresonator.wasm"),
      load("lf-source.wasm"),
    ]);
    this.wasmBytes = { resonator, antiresonator, lfSource };
  }

  setParam(name, value, atTime = this.ctx.currentTime) {
    if (!Number.isFinite(value)) return;
    this.params[name] = value;

    switch (name) {
      case "f0":
        this._setAudioParam(this.nodes.lfSource.parameters.get("f0"), value, atTime);
        break;
      case "rd":
        this._setAudioParam(this.nodes.lfSource.parameters.get("rd"), value, atTime);
        break;
      case "voiceGain":
        this.nodes.voiceGain.gain.setValueAtTime(value, atTime);
        break;
      case "noiseGain":
        this.nodes.noiseGain.gain.setValueAtTime(value, atTime);
        break;
      case "masterGain":
        this.nodes.masterGain.gain.setValueAtTime(value, atTime);
        break;
      case "rgpFrequency":
        this._setAudioParam(this.nodes.rgp.parameters.get("frequency"), value, atTime);
        break;
      case "rgpBandwidth":
        this._setAudioParam(this.nodes.rgp.parameters.get("bandwidth"), value, atTime);
        break;
      case "rgsFrequency":
        this._setAudioParam(this.nodes.rgs.parameters.get("frequency"), value, atTime);
        break;
      case "rgsBandwidth":
        this._setAudioParam(this.nodes.rgs.parameters.get("bandwidth"), value, atTime);
        break;
      case "noiseCutoff":
        this._setAudioParam(this.nodes.noiseSource.parameters.get("cutoff"), value, atTime);
        break;
      case "fricationCutoff":
        this._setAudioParam(this.nodes.fricationSource.parameters.get("cutoff"), value, atTime);
        break;
      case "FNZ":
        this._setAudioParam(this.nodes.nz.parameters.get("frequency"), value, atTime);
        break;
      case "BNZ":
        this._setAudioParam(this.nodes.nz.parameters.get("bandwidth"), value, atTime);
        break;
      case "FNP":
        this._setAudioParam(this.nodes.np.parameters.get("frequency"), value, atTime);
        this._setAudioParam(this.nodes.parallelNasal.parameters.get("frequency"), value, atTime);
        break;
      case "BNP":
        this._setAudioParam(this.nodes.np.parameters.get("bandwidth"), value, atTime);
        this._setAudioParam(this.nodes.parallelNasal.parameters.get("bandwidth"), value, atTime);
        break;
      case "parallelMix":
        this._setParallelMix(value, atTime, true, true);
        break;
      case "parallelGainScale":
        this.params.parallelGainScale = value;
        break;
      case "parallelVoiceGain":
        this.nodes.parallelSourceGain.gain.setValueAtTime(value, atTime);
        this.nodes.parallelDiffGain.gain.setValueAtTime(value, atTime);
        break;
      case "parallelFricationGain":
        this.nodes.parallelFricGain.gain.setValueAtTime(value, atTime);
        break;
      case "parallelBypassGain":
        this.nodes.parallelBypassGain.gain.setValueAtTime(value, atTime);
        break;
      case "parallelNasalGain":
      case "AN":
        this.nodes.parallelNasalGain.gain.setValueAtTime(this._dbToLinear(value), atTime);
        break;
      case "A1":
      case "A2":
      case "A3":
      case "A4":
      case "A5":
      case "A6": {
        const index = Number(name.slice(1)) - 1;
        if (index >= 0 && index < this.nodes.parallelFormantGains.length) {
          this._setParallelFormantGain(index, value, atTime);
        }
        break;
      }
      case "AB":
        this.nodes.parallelBypassGain.gain.setValueAtTime(this._dbToLinear(value), atTime);
        break;
        break;
      default:
        {
          const formantMatch = name.match(/^[FB]([1-6])$/);
          if (formantMatch) {
            const index = Number(formantMatch[1]) - 1;
            const paramName = name.startsWith("F") ? "frequency" : "bandwidth";
            this._setAudioParam(this.nodes.cascade[index].parameters.get(paramName), value, atTime);
            this._setAudioParam(this.nodes.parallelFormants[index].parameters.get(paramName), value, atTime);
          }
        }
        break;
    }
  }
}
