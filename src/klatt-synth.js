export class KlattSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nodes = {};
    this.params = this._defaultParams();
    this.isInitialized = false;
    // PLSTEP burst state tracking (Klatt 80 plosive release transient)
    this._lastAF = 0;
    this._lastAH = 0;
  }

  async initialize() {
    if (this.isInitialized) return;
    const baseUrl =
      (import.meta?.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/";
    const workletBase = `${baseUrl}worklets/`;
    await this._loadWasmBytes(workletBase);
    await Promise.all([
      this.ctx.audioWorklet.addModule(workletBase + "resonator-processor.js"),
      this.ctx.audioWorklet.addModule(workletBase + "antiresonator-processor.js"),
      this.ctx.audioWorklet.addModule(workletBase + "impulse-train-processor.js"),
      this.ctx.audioWorklet.addModule(workletBase + "lf-source-processor.js"),
      this.ctx.audioWorklet.addModule(workletBase + "noise-source-processor.js"),
      this.ctx.audioWorklet.addModule(workletBase + "glottal-mod-processor.js"),
      this.ctx.audioWorklet.addModule(workletBase + "differentiator-processor.js"),
    ]);

    this._createNodes();
    this._connectGraph();
    await this._awaitWorkletReady();
    this._applyAllParams(this.ctx.currentTime);
    this.isInitialized = true;
  }

  _defaultParams() {
    return {
      f0: 0,
      rd: 1.0,
      lfMode: 0,
      sourceMode: 0, // 0 = impulse (classic Klatt), 1 = LF source
      openPhaseRatio: 0.7,
      voiceGain: 0.0,
      noiseGain: 0.0,
      noiseCutoff: 1000,
      fricationCutoff: 3000,
      masterGain: 1.0,
      outputGain: 1.0, // Global output gain (can boost if needed)
      rgpFrequency: 0,
      rgpBandwidth: 100,
      rgsFrequency: 0,
      rgsBandwidth: 200,
      FGP: 0,
      BGP: 100,
      BGS: 200,
      FGZ: 1500,
      BGZ: 6000,
      FNZ: 0,
      BNZ: 0,
      FNP: 0,
      BNP: 0,
      parallelMix: 1.0,
      parallelGainScale: 1.0,
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
      AVS: -70,
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
    N.impulseSource = new AudioWorkletNode(ctx, "impulse-train-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        debug: telemetry,
        nodeId: "impulse",
        reportInterval,
      },
    });
    N.noiseSource = new AudioWorkletNode(ctx, "noise-source-processor", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        debug: telemetry,
        nodeId: "noise",
        reportInterval,
      },
    });
    N.fricationSource = new AudioWorkletNode(ctx, "noise-source-processor", {
      numberOfInputs: 1,
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
        bypassAtZero: true,
        reportInterval,
      },
    });
    N.rgz = new AudioWorkletNode(ctx, "antiresonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.antiresonator,
        debug: telemetry,
        nodeId: "rgz",
        bypassAtZero: true,
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
    // Aspiration modulation: COEWAV.FOR lines 113-115, 155-156
    // 50% square wave modulation synchronized to glottal cycle
    // Klatt 1980 p.977-978: "The degree of amplitude modulation is fixed at 50%"
    N.glottalMod = new AudioWorkletNode(ctx, "glottal-mod-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        debug: telemetry,
        nodeId: "glottal-mod",
        reportInterval,
      },
    });
    N.rgpAvs = new AudioWorkletNode(ctx, "resonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.resonator,
        debug: telemetry,
        nodeId: "rgp-avs",
        bypassAtZero: true,
        reportInterval,
      },
    });
    N.rgzAvs = new AudioWorkletNode(ctx, "antiresonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.antiresonator,
        debug: telemetry,
        nodeId: "rgz-avs",
        bypassAtZero: true,
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
    N.radiationDiff = new AudioWorkletNode(ctx, "differentiator-processor", {
      processorOptions: {
        debug: telemetry,
        nodeId: "radiation-diff",
        reportInterval,
      },
    });
    N.radiationDiffAvs = new AudioWorkletNode(ctx, "differentiator-processor", {
      processorOptions: {
        debug: telemetry,
        nodeId: "radiation-diff-avs",
        reportInterval,
      },
    });
    N.nz = new AudioWorkletNode(ctx, "antiresonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.antiresonator,
        debug: telemetry,
        nodeId: "nz",
        bypassAtZero: true,
        reportInterval,
      },
    });
    N.np = new AudioWorkletNode(ctx, "resonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.resonator,
        debug: telemetry,
        nodeId: "np",
        bypassAtZero: true,
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
        bypassAtZero: true,
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

    N.sourceSum = ctx.createGain();
    N.lfSourceGain = ctx.createGain();
    N.impulseGain = ctx.createGain();
    N.sourceBypassGain = ctx.createGain();
    N.sourceDirectGain = ctx.createGain();
    N.sourceDiffGain = ctx.createGain();
    N.avsBypassGain = ctx.createGain();
    N.avsDirectGain = ctx.createGain();
    N.avsDiffGain = ctx.createGain();
    N.voiceGain = ctx.createGain();
    N.avsGain = ctx.createGain();
    N.noiseGain = ctx.createGain();
    N.mixer = ctx.createGain();
    N.parallelMixer = ctx.createGain();
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
    N.outputLp = new AudioWorkletNode(ctx, "resonator-processor", {
      processorOptions: {
        wasmBytes: wasm?.resonator,
        debug: telemetry,
        nodeId: "output-lp",
        reportInterval,
      },
    });
    N.masterGain = ctx.createGain();
    N.outputGain = ctx.createGain();

    // PLSTEP burst transient: ConstantSource + Gain for DC step injection
    // This implements Klatt 80's plosive release burst mechanism
    N.plstepSource = ctx.createConstantSource();
    N.plstepSource.offset.value = 1.0; // Constant DC at 1.0
    N.plstepGain = ctx.createGain();
    N.plstepGain.gain.value = 0; // Initially silent
    N.plstepSource.start(); // Must start ConstantSourceNode

    this._attachTelemetry(N.lfSource);
    this._attachTelemetry(N.impulseSource);
    this._attachTelemetry(N.noiseSource);
    this._attachTelemetry(N.fricationSource);
    this._attachTelemetry(N.rgp);
    this._attachTelemetry(N.rgz);
    this._attachTelemetry(N.rgs);
    this._attachTelemetry(N.rgpAvs);
    this._attachTelemetry(N.rgzAvs);
    this._attachTelemetry(N.glottalMod);
    this._attachTelemetry(N.nz);
    this._attachTelemetry(N.diff);
    this._attachTelemetry(N.radiationDiff);
    this._attachTelemetry(N.radiationDiffAvs);
    this._attachTelemetry(N.np);
    this._attachTelemetry(N.outputLp);
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
    N.lfSource.connect(N.lfSourceGain).connect(N.sourceSum);
    N.impulseSource.connect(N.impulseGain).connect(N.sourceSum);
    N.sourceSum.connect(N.rgp);
    N.sourceSum.connect(N.rgs).connect(N.rgpAvs);

    N.voiceGain.connect(N.mixer);
    N.sourceSum.connect(N.sourceBypassGain).connect(N.voiceGain);
    N.rgp.connect(N.sourceDirectGain).connect(N.voiceGain);
    N.rgp.connect(N.rgz).connect(N.radiationDiff).connect(N.sourceDiffGain).connect(N.voiceGain);

    N.avsGain.connect(N.parallelMixer);
    N.sourceSum.connect(N.avsBypassGain).connect(N.avsGain);
    N.rgpAvs.connect(N.avsDirectGain).connect(N.avsGain);
    N.rgpAvs.connect(N.rgzAvs).connect(N.radiationDiffAvs).connect(N.avsDiffGain).connect(N.avsGain);
    N.glottalMod.connect(N.noiseSource);
    N.glottalMod.connect(N.fricationSource);
    N.noiseSource.connect(N.noiseGain);
    N.noiseGain.connect(N.mixer);
    N.noiseGain.connect(N.parallelMixer);
    // Klatt 1980: UGLOT is the radiated glottal flow (after first difference).
    // When sourceMode = impulse (classic), we apply RGZ + radiationDiff.
    // When sourceMode = LF, we bypass radiationDiff because LF source is pre-differentiated.
    // Klatt-syn cascade order: nasal antiformant -> nasal formant -> F1..F6 -> output
    let current = N.mixer;
    current.connect(N.nz);
    current = N.nz;
    current.connect(N.np);
    current = N.np;
    for (let i = 0; i < N.cascade.length; i++) {
      current.connect(N.cascade[i]);
      current = N.cascade[i];
    }
    current.connect(N.cascadeOutGain).connect(N.outputSum);

    // Parallel branch uses radiated glottal source (UGLOT) for F1,
    // and first-diff of UGLOT (UGLOT1) for F2-F4.
    N.parallelMixer.connect(N.parallelSourceGain);
    N.parallelMixer.connect(N.diff);
    N.diff.connect(N.parallelDiffGain).connect(N.parallelDiffSum);
    N.fricationSource.connect(N.parallelFricGain).connect(N.parallelDiffSum);

    // Parallel routing (Klatt 80):
    // - F1 uses UGLOT (voicing + aspiration)
    // - Nasal uses UGLOT1 (first-differenced UGLOT)
    // - F2-F4 use UGLOT1 + UFRIC
    // - F5-F6 and bypass use UFRIC only
    N.parallelSourceGain.connect(N.parallelFormants[0]);
    N.parallelFormants[0].connect(N.parallelFormantGains[0]).connect(N.parallelSum);

    N.parallelSourceGain.connect(N.parallelNasal);
    N.parallelNasal.connect(N.parallelNasalGain).connect(N.parallelSum);

    for (let i = 1; i <= 3; i += 1) {
      N.parallelDiffSum.connect(N.parallelFormants[i]);
      N.parallelFormants[i].connect(N.parallelFormantGains[i]).connect(N.parallelSum);
    }

    for (let i = 4; i < N.parallelFormants.length; i += 1) {
      N.parallelFricGain.connect(N.parallelFormants[i]);
      N.parallelFormants[i].connect(N.parallelFormantGains[i]).connect(N.parallelSum);
    }

    N.parallelFricGain.connect(N.parallelBypassGain).connect(N.parallelSum);
    N.parallelSum.connect(N.parallelOutGain).connect(N.outputSum);

    // PLSTEP: Connect burst transient source to output
    // The gain-controlled DC step is added directly to outputSum
    N.plstepSource.connect(N.plstepGain).connect(N.outputSum);

    N.outputSum.connect(N.outputLp).connect(N.masterGain).connect(N.outputGain).connect(this.ctx.destination);
  }

  _applyAllParams(atTime) {
    const p = this.params;
    const gpFreq = Number.isFinite(p.FGP) ? p.FGP : p.rgpFrequency;
    const gpBw = Number.isFinite(p.BGP) ? p.BGP : p.rgpBandwidth;
    const gsFreq = Number.isFinite(p.rgsFrequency) ? p.rgsFrequency : 0;
    const gsBw = Number.isFinite(p.BGS) ? p.BGS : p.rgsBandwidth;
    const gzFreq = Number.isFinite(p.FGZ) ? p.FGZ : 0;
    const gzBw = Number.isFinite(p.BGZ) ? p.BGZ : 0;
    const outputLpBw = this.ctx.sampleRate / 2;
    this._setAudioParam(this.nodes.lfSource.parameters.get("f0"), p.f0, atTime);
    this._setAudioParam(this.nodes.impulseSource.parameters.get("f0"), p.f0, atTime);
    this._setAudioParam(this.nodes.impulseSource.parameters.get("gain"), 1.0, atTime);
    this._setAudioParam(this.nodes.impulseSource.parameters.get("openPhaseRatio"), p.openPhaseRatio, atTime);
    this._setAudioParam(this.nodes.lfSource.parameters.get("rd"), p.rd, atTime);
    this._setAudioParam(this.nodes.lfSource.parameters.get("lfMode"), p.lfMode, atTime);
    this._setAudioParam(this.nodes.glottalMod.parameters.get("f0"), p.f0, atTime);
    this._setAudioParam(this.nodes.rgp.parameters.get("frequency"), gpFreq, atTime);
    this._setAudioParam(this.nodes.rgp.parameters.get("bandwidth"), gpBw, atTime);
    this._setAudioParam(this.nodes.rgz.parameters.get("frequency"), gzFreq, atTime);
    this._setAudioParam(this.nodes.rgz.parameters.get("bandwidth"), gzBw, atTime);
    this._setAudioParam(this.nodes.outputLp.parameters.get("frequency"), 0, atTime);
    this._setAudioParam(this.nodes.outputLp.parameters.get("bandwidth"), outputLpBw, atTime);
    this._setAudioParam(this.nodes.rgs.parameters.get("frequency"), gsFreq, atTime);
    this._setAudioParam(this.nodes.rgs.parameters.get("bandwidth"), gsBw, atTime);
    this._setAudioParam(this.nodes.rgpAvs.parameters.get("frequency"), gpFreq, atTime);
    this._setAudioParam(this.nodes.rgpAvs.parameters.get("bandwidth"), gpBw, atTime);
    this._setAudioParam(this.nodes.rgzAvs.parameters.get("frequency"), gzFreq, atTime);
    this._setAudioParam(this.nodes.rgzAvs.parameters.get("bandwidth"), gzBw, atTime);
    this._setAudioParam(this.nodes.nz.parameters.get("frequency"), p.FNZ, atTime);
    this._setAudioParam(this.nodes.nz.parameters.get("bandwidth"), p.BNZ, atTime);
    this._setAudioParam(this.nodes.np.parameters.get("frequency"), p.FNP, atTime);
    this._setAudioParam(this.nodes.np.parameters.get("bandwidth"), p.BNP, atTime);
    this._setAudioParam(this.nodes.parallelNasal.parameters.get("frequency"), p.FNP, atTime);
    this._setAudioParam(this.nodes.parallelNasal.parameters.get("bandwidth"), p.BNP, atTime);

    this._applySourceMode(p.sourceMode, atTime);
    this.nodes.voiceGain.gain.setValueAtTime(p.voiceGain, atTime);
    const avsGain = this._dbToLinear((p.AVS ?? -70) + (-44)) * 10;
    this.nodes.avsGain.gain.setValueAtTime(avsGain, atTime);
    this.nodes.noiseGain.gain.setValueAtTime(p.noiseGain, atTime);
    this.nodes.masterGain.gain.setValueAtTime(p.masterGain, atTime);
    this.nodes.outputGain.gain.setValueAtTime(p.outputGain, atTime);
    const parallelScale = Number.isFinite(p.parallelGainScale)
      ? p.parallelGainScale
      : 1.0;
    this.nodes.parallelSourceGain.gain.setValueAtTime(p.parallelVoiceGain, atTime);
    this.nodes.parallelDiffGain.gain.setValueAtTime(p.parallelVoiceGain, atTime);
    this.nodes.parallelFricGain.gain.setValueAtTime(p.parallelFricationGain, atTime);
    const bypassGain = Number.isFinite(p.AB)
      // Apply ndbScale.AB (-84) for safe Klatt parameter conversion
      ? -this._dbToLinear(p.AB + (-84)) * parallelScale
      : p.parallelBypassGain;
    this.nodes.parallelBypassGain.gain.setValueAtTime(bypassGain, atTime);
    const nasalDb = Number.isFinite(p.parallelNasalGain) ? p.parallelNasalGain : p.AN;
    this.nodes.parallelNasalGain.gain.setValueAtTime(
      // Apply ndbScale.AN (-58) for safe Klatt parameter conversion
      this._dbToLinear(nasalDb + (-58)) * parallelScale,
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
      this._setParallelFormantGain(i, parallelGains[i], atTime, formants[i].f);
    }

    this._setParallelMix(p.parallelMix, atTime);
  }

  _applySourceMode(mode, atTime) {
    const modeValue = Number(mode);
    const useLf = modeValue === 1;
    const useBypass = modeValue === 2;
    const lfGain = useLf ? 1 : 0;
    const impulseGain = useLf ? 0 : 1;
    const bypassGain = useBypass ? 1 : 0;
    const directGain = useBypass ? 0 : (useLf ? 1 : 0);
    const diffGain = useBypass ? 0 : (useLf ? 0 : 1);
    this.nodes.lfSourceGain.gain.setValueAtTime(lfGain, atTime);
    this.nodes.impulseGain.gain.setValueAtTime(impulseGain, atTime);
    this.nodes.sourceBypassGain.gain.setValueAtTime(bypassGain, atTime);
    this.nodes.sourceDirectGain.gain.setValueAtTime(directGain, atTime);
    this.nodes.sourceDiffGain.gain.setValueAtTime(diffGain, atTime);
    this.nodes.avsBypassGain.gain.setValueAtTime(bypassGain, atTime);
    this.nodes.avsDirectGain.gain.setValueAtTime(directGain, atTime);
    this.nodes.avsDiffGain.gain.setValueAtTime(diffGain, atTime);
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

  _setParallelFormantGain(index, dbValue, atTime, freq) {
    // Klatt 80 applies parallel formant gains directly to first-differenced signal
    // without compensation. The low-frequency attenuation is intentional -
    // it prevents F2-F6 energy from polluting the F1 region.
    const scale = Number.isFinite(this.params.parallelGainScale)
      ? this.params.parallelGainScale
      : 1.0;
    const linear = this._dbToLinear(dbValue) * scale;
    const sign = index >= 1 ? (index % 2 === 1 ? -1 : 1) : 1;
    this.nodes.parallelFormantGains[index].gain.setValueAtTime(
      sign * linear,
      atTime
    );
  }

  _scheduleAudioParam(param, value, atTime, ramp) {
    if (!param || !Number.isFinite(value)) return;
    const automationRate = param.automationRate;
    const allowRamp = !automationRate || automationRate === "a-rate";
    if (ramp && allowRamp) {
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
      this.nodes.impulseSource.parameters.get("f0"),
      this.nodes.impulseSource.parameters.get("gain"),
      this.nodes.impulseSource.parameters.get("openPhaseRatio"),
      this.nodes.glottalMod.parameters.get("f0"),
      this.nodes.rgp.parameters.get("frequency"),
      this.nodes.rgp.parameters.get("bandwidth"),
      this.nodes.rgz.parameters.get("frequency"),
      this.nodes.rgz.parameters.get("bandwidth"),
      this.nodes.rgs.parameters.get("frequency"),
      this.nodes.rgs.parameters.get("bandwidth"),
      this.nodes.rgpAvs.parameters.get("frequency"),
      this.nodes.rgpAvs.parameters.get("bandwidth"),
      this.nodes.rgzAvs.parameters.get("frequency"),
      this.nodes.rgzAvs.parameters.get("bandwidth"),
      this.nodes.outputLp.parameters.get("frequency"),
      this.nodes.outputLp.parameters.get("bandwidth"),
      this.nodes.nz.parameters.get("frequency"),
      this.nodes.nz.parameters.get("bandwidth"),
      this.nodes.np.parameters.get("frequency"),
      this.nodes.np.parameters.get("bandwidth"),
      this.nodes.parallelNasal.parameters.get("frequency"),
      this.nodes.parallelNasal.parameters.get("bandwidth"),
      this.nodes.lfSourceGain.gain,
      this.nodes.impulseGain.gain,
      this.nodes.sourceBypassGain.gain,
      this.nodes.sourceDirectGain.gain,
      this.nodes.sourceDiffGain.gain,
      this.nodes.avsBypassGain.gain,
      this.nodes.avsDirectGain.gain,
      this.nodes.avsDiffGain.gain,
      this.nodes.voiceGain.gain,
      this.nodes.avsGain.gain,
      this.nodes.noiseGain.gain,
      this.nodes.masterGain.gain,
      this.nodes.parallelSourceGain.gain,
      this.nodes.parallelDiffGain.gain,
      this.nodes.parallelFricGain.gain,
      this.nodes.parallelBypassGain.gain,
      this.nodes.parallelNasalGain.gain,
      this.nodes.parallelOutGain.gain,
      this.nodes.cascadeOutGain.gain,
      this.nodes.plstepGain.gain, // PLSTEP burst transient
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

  _applyKlattParams(params, atTime, ramp = false) {
    const voiceDb = params.AV ?? -70;
    const voiceParDb = params.AVS ?? -70;
    const aspDb = params.AH ?? -70;
    const fricDb = params.AF ?? -70;
    const goDb = params.GO ?? 47;

    // Source amplitude scale factors (PARCOE.FOR lines 51-53: NDBSCA)
    // AV, AH, AF, AVS are offset by -47 to compensate for G0 default of 47
    // This keeps default output level while making G0 functional as overall gain control
    const ndbScale = {
      A1: -58,
      A2: -65,
      A3: -73,
      A4: -78,
      A5: -79,
      A6: -80,
      AN: -58,
      AB: -84,
      AV: -119,   // -72 - 47: compensates for G0 addition
      // AH: Klatt 80 uses -102 (aspiration 30 dB quieter than voicing).
      // Our input AH values are ~15 dB lower than Klatt 80 (max ~40 vs ~55),
      // so we use -87 to maintain the same output amplitude relationship.
      // After G0 compensation: -87 - 47 = -134
      AH: -134,   // -87 - 47: compensates for G0 addition
      AF: -119,   // -72 - 47: compensates for G0 addition
      AVS: -91,   // -44 - 47: compensates for G0 addition
    };
    const f1 = params.F1;
    const f2 = params.F2;
    const f3 = params.F3;
    const f4 = params.F4;
    // Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
    // like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
    // See reports/16bit-issue6-a2cor.md for detailed analysis.
    const ndbCor = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const proximity = (delta) => {
      if (!Number.isFinite(delta) || delta < 50 || delta >= 550) return 0;
      const index = Math.floor(delta / 50) - 1;
      return ndbCor[Math.max(0, Math.min(index, ndbCor.length - 1))] ?? 0;
    };
    const n12Cor = proximity(f2 - f1);
    const n23Cor = proximity(f3 - f2 - 50);
    const n34Cor = proximity(f4 - f3 - 150);

    // PARCOE.FOR lines 117-135: G0 is added to each source amplitude before GETAMP conversion
    // Formula: NDBAV = NNG0 + NNAV + NDBSCA(9), then IMPULS = GETAMP(NDBAV)
    const voiceGain = this._dbToLinear(goDb + voiceDb + ndbScale.AV);
    const parallelScale = Number.isFinite(this.params.parallelGainScale)
      ? this.params.parallelGainScale
      : 1.0;
    // Klatt 80 uses 10*GETAMP(NDBAVS) to compensate for filter cascade attenuation.
    // We preserve that scaling here to match the original behavior.
    // PARCOE.FOR line 134-135: NDBAVS = NNG0 + NNAVS + NDBSCA(12), SINAMP = 10*GETAMP(NDBAVS)
    const voiceParGain = this._dbToLinear(goDb + voiceParDb + ndbScale.AVS) * 10;
    // PARCOE.FOR line 121-122: NDBAH = NNG0 + NNAH + NDBSCA(10), AHH = GETAMP(NDBAH)
    const aspGain = this._dbToLinear(goDb + aspDb + ndbScale.AH);
    const fricDbAdjusted = params.SW === 1 ? Math.max(fricDb, aspDb) : fricDb;
    // PARCOE.FOR line 126-127: NDBAF = NNG0 + NNAF + NDBSCA(11), AFF = GETAMP(NDBAF)
    const fricGain =
      this._dbToLinear(goDb + fricDbAdjusted + ndbScale.AF) * parallelScale;
    // Master gain: simple user-controllable scaling (WebAudio addition, not in Klatt 80)
    // G0 is now correctly incorporated in individual source amplitudes above
    const masterGain = Number.isFinite(this.params.masterGain)
      ? this.params.masterGain
      : 1.0;

    const mix = this.params.parallelMix;
    const allParallel = params.SW === 1;
    const gpFreq = params.FGP;
    const gpBw = params.BGP;
    const gsBw = params.BGS;
    const gzFreq = params.FGZ;
    const gzBw = params.BGZ;
    // Voice quality params: fall back to synth.params (slider values) if not in track
    const sourceMode = params.sourceMode ?? params.SRC ?? this.params.sourceMode;
    const rd = params.Rd ?? this.params.rd;
    const lfMode = params.lfMode ?? this.params.lfMode;
    const openPhaseRatio = params.openPhaseRatio ?? this.params.openPhaseRatio;

    this._scheduleAudioParam(this.nodes.lfSource.parameters.get("f0"), params.F0, atTime, ramp);
    this._scheduleAudioParam(this.nodes.impulseSource.parameters.get("f0"), params.F0, atTime, ramp);
    this._scheduleAudioParam(this.nodes.impulseSource.parameters.get("gain"), 1.0, atTime, ramp);
    this._scheduleAudioParam(
      this.nodes.impulseSource.parameters.get("openPhaseRatio"),
      openPhaseRatio,
      atTime,
      ramp
    );
    this._scheduleAudioParam(this.nodes.glottalMod.parameters.get("f0"), params.F0, atTime, ramp);
    this._scheduleAudioParam(this.nodes.lfSource.parameters.get("rd"), rd, atTime, ramp);
    this._scheduleAudioParam(this.nodes.lfSource.parameters.get("lfMode"), lfMode, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgp.parameters.get("frequency"), gpFreq, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgp.parameters.get("bandwidth"), gpBw, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgz.parameters.get("frequency"), gzFreq, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgz.parameters.get("bandwidth"), gzBw, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgpAvs.parameters.get("frequency"), gpFreq, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgpAvs.parameters.get("bandwidth"), gpBw, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgzAvs.parameters.get("frequency"), gzFreq, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgzAvs.parameters.get("bandwidth"), gzBw, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgs.parameters.get("frequency"), 0, atTime, ramp);
    this._scheduleAudioParam(this.nodes.rgs.parameters.get("bandwidth"), gsBw, atTime, ramp);

    this._applySourceMode(sourceMode, atTime);
    this._scheduleAudioParam(this.nodes.voiceGain.gain, voiceGain, atTime, ramp);
    this._scheduleAudioParam(this.nodes.avsGain.gain, voiceParGain, atTime, ramp);
    // Klatt 80 mutual exclusion: when cascade branch is active (SW=0),
    // ZERO out voicing input to parallel branch. From COEWAV.FOR line 425:
    //   "ZERO OUT VOICING INPUT TO PARALLEL BRANCH IF CASCADE BRANCH HAS BEEN USED"
    //   UGLOT=0, UGLOTL=0, IF(NXSW.NE.1) UGLOT1=0
    // Only frication goes through parallel in cascade mode.
    // When SW=1 (parallel mode), voice goes through parallel at full gain.
    // CRITICAL: Use setValueAtTime, NOT ramp! linearRampToValueAtTime ramps
    // TO the value BY atTime, meaning the transition happens BEFORE the event.
    // SW transitions must be instantaneous at the event boundary.
    // This applies to ALL gains that feed the parallel branch, not just voice.
    const parallelSrcGain = allParallel ? 1.0 : 0;
    if (!ramp) {
      this.nodes.parallelSourceGain.gain.setValueAtTime(parallelSrcGain, atTime);
      this.nodes.parallelDiffGain.gain.setValueAtTime(parallelSrcGain, atTime);
    }
    this._scheduleAudioParam(this.nodes.noiseGain.gain, aspGain, atTime, ramp);
    // parallelFricGain: frication goes to parallel in all modes, but must also
    // use setValueAtTime to prevent early ramping before event boundary
    if (ramp) {
      this._scheduleAudioParam(this.nodes.parallelFricGain.gain, fricGain, atTime, true);
    } else {
      this.nodes.parallelFricGain.gain.setValueAtTime(fricGain, atTime);
    }
    this._scheduleAudioParam(this.nodes.masterGain.gain, masterGain, atTime, ramp);

    if (!ramp) {
      this._setParallelMix(mix, atTime, false, ramp, allParallel);
    }

    // Emit telemetry for source gains (debugging signal levels)
    if (this.telemetryHandler) {
      this.telemetryHandler({
        type: "source-gains",
        node: "source-routing",
        atTime,
        voiceGain,
        aspGain,
        fricGain,
        masterGain,
        parallelSrcGain,
        sourceMode,
        voiceDb: params.AV ?? -70,
        aspDb: params.AH ?? -70,
        fricDb: params.AF ?? -70,
      });
    }

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
      this._dbToLinear((params.A2 ?? -70) + n12Cor + n12Cor + n23Cor + ndbScale.A2),
      this._dbToLinear((params.A3 ?? -70) + n23Cor + n23Cor + n34Cor + ndbScale.A3),
      this._dbToLinear((params.A4 ?? -70) + n34Cor + n34Cor + ndbScale.A4),
      this._dbToLinear((params.A5 ?? -70) + ndbScale.A5),
      this._dbToLinear((params.A6 ?? -70) + ndbScale.A6),
    ];
    // Klatt 80 applies A2PAR/A3PAR/A4PAR directly to first-differenced signal
    // without compensation. The differentiator's spectral shaping is intentional -
    // it prevents F2-F6 energy from polluting the F1 region.
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
        -this._dbToLinear(params.AB + ndbScale.AB) * parallelScale,
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

    // Reset PLSTEP tracking at start of utterance
    this._lastAF = 0;
    this._lastAH = 0;

    // Warmup fix: Apply first event's formants IMMEDIATELY (not at baseTime) to prime resonators.
    // Without this, first play after init has stale/default formant values that bleed
    // into the start of playback.
    if (track[0]?.params) {
      this._applyKlattParams(track[0].params, this.ctx.currentTime, false);
    }

    const ndbScale = { AH: -87, AF: -72 };
    for (let i = 0; i < track.length; i += 1) {
      const event = track[i];
      if (!event?.params) continue;
      const t = baseTime + event.time;
      this._applyKlattParams(event.params, t, false);

      const next = track[i + 1];
      if (next?.params) {
        const nextTime = baseTime + next.time;
        const parallelScale = Number.isFinite(this.params.parallelGainScale)
          ? this.params.parallelGainScale
          : 1.0;
        const nextAspDb = next.params.AH ?? -70;
        const nextFricDb = next.params.AF ?? -70;
        const nextFricDbAdjusted = next.params.SW === 1
          ? Math.max(nextFricDb, nextAspDb)
          : nextFricDb;
        const nextAspGain = this._dbToLinear(nextAspDb + ndbScale.AH);
        const nextFricGain = this._dbToLinear(nextFricDbAdjusted + ndbScale.AF) * parallelScale;

        // Only ramp aspiration/frication (Klatt80 linear interpolation within frame)
        this._scheduleAudioParam(this.nodes.noiseGain.gain, nextAspGain, nextTime, true);
        this._scheduleAudioParam(this.nodes.parallelFricGain.gain, nextFricGain, nextTime, true);
      }

      if (i === 0) {
        this._lastAF = event.params.AF ?? 0;
        this._lastAH = event.params.AH ?? 0;
        continue;
      }

      // PLSTEP: Detect plosive release burst
      // Klatt 80 uses: IF (NNAF - NAFLAS >= 49) PLSTEP = GETAMP(G0 + NDBSCA(AF) + 44)
      // Our AF values are scaled differently (typical burst AF is 15-20, not 50-55).
      // Detect burst when: previous AF was near-zero AND current AF is significant,
      // OR when AH (aspiration) jumps significantly (for aspirated releases).
      const isStopRelease = typeof event.phoneme === "string" &&
        (event.phoneme.endsWith("_REL") || event.phoneme.endsWith("_ASP"));
      const currentAF = event.params.AF ?? 0;
      const currentAH = event.params.AH ?? 0;
      const afDelta = currentAF - this._lastAF;
      const ahDelta = currentAH - (this._lastAH ?? 0);
      // MITalk PLSTEP rule: trigger burst on 50 dB AF increase (we use 49 as threshold)
      // This matches Klatt 80: IF (NNAF - NAFLAS >= 49) PLSTEP = ...
      const isBurst = (this._lastAF <= 5 && afDelta >= 49) ||
                      ((this._lastAH ?? 0) <= 5 && ahDelta >= 49);
      if (isStopRelease && isBurst) {
        // Determine which parameter triggered the burst
        const triggerParam = (this._lastAF <= 5 && afDelta >= 49) ? 'AF' : 'AH';
        const triggerDelta = triggerParam === 'AF' ? afDelta : ahDelta;
        this._scheduleBurstTransient(t, event.params, triggerParam, triggerDelta);
      }
      this._lastAF = currentAF;
      this._lastAH = currentAH;

    }
  }

  /**
   * Schedule a burst transient for plosive releases (PLSTEP mechanism from Klatt 80).
   * Injects a DC step directly into the output that decays rapidly, creating the
   * characteristic acoustic burst at stop consonant release.
   *
   * From Klatt 80 FORTRAN:
   *   PLSTEP = GETAMP(G0 + NDBSCA(AF) + 44)  -- amplitude calculation
   *   STEP = -PLSTEP                          -- negative step (rarefaction)
   *   ULIPS = (ULIPSV + ULIPSF + STEP) * 170  -- added to output
   *   STEP = 0.995 * STEP                     -- exponential decay
   *
   * @param {number} atTime - When to trigger the burst
   * @param {Object} params - Current frame parameters (for G0/gain context)
   * @param {string} [triggerParam] - Which parameter triggered the burst ('AF' or 'AH')
   * @param {number} [triggerDelta] - The delta value that triggered the burst
   */
  _scheduleBurstTransient(atTime, params, triggerParam = 'AF', triggerDelta = 0) {
    // Calculate PLSTEP amplitude per PARCOE.FOR line 131:
    // PLSTEP = GETAMP(NNG0 + NDBSCA(11) + 44)
    // where NDBSCA(11) = -72 (AF scale factor)
    // Formula: GETAMP(G0 - 72 + 44) = GETAMP(G0 - 28)
    const goDb = params.GO ?? 47;
    const burstDb = goDb - 28;
    const burstAmplitude = this._dbToLinear(burstDb);

    // Emit telemetry for PLSTEP burst
    if (this.telemetryHandler) {
      this.telemetryHandler({
        type: 'plstep',
        nodeId: 'plstep',
        time: atTime,
        amplitudeLinear: burstAmplitude,
        amplitudeDb: burstDb,
        trigger: triggerParam,
        delta: triggerDelta,
      });
    }

    // COEWAV.FOR line 252: STEP=.995*STEP
    // At 10kHz: 0.995^919 = 0.01 → 919 samples = 92ms decay to 1%
    const burstDuration = 0.092;

    // Schedule the PLSTEP as a negative DC step that decays to zero
    // Negative creates rarefaction (matches original Klatt 80)
    const plstepGain = this.nodes.plstepGain.gain;

    // Cancel any previous burst scheduling at this time
    plstepGain.cancelScheduledValues(atTime);

    // Set initial negative burst amplitude
    plstepGain.setValueAtTime(-burstAmplitude, atTime);

    // Exponential decay back to zero
    // Note: exponentialRampToValueAtTime can't reach exactly 0,
    // so we use a very small value and then set to 0
    const decayEnd = atTime + burstDuration;
    plstepGain.exponentialRampToValueAtTime(-0.0001, decayEnd);
    plstepGain.setValueAtTime(0, decayEnd + 0.001);
  }

  _setParallelMix(value, atTime, updateParam = true, ramp = false, allParallel = false) {
    const mix = Math.max(0, Math.min(1, Number(value)));
    if (updateParam) {
      this.params.parallelMix = mix;
    }
    // Klatt 80 sums cascade and parallel outputs (ULIPSV + ULIPSF).
    // SW=1 disables cascade entirely; SW=0 keeps both branches active.
    // See COEWAV.FOR lines 430-450 and ULIPS sum.
    const parallelGain = 1;
    const cascadeGain = allParallel ? 0 : 1;
    // CRITICAL: Always use setValueAtTime for cascade/parallel output gains.
    // These are controlled by SW (source switch) which must transition
    // instantaneously at the event boundary. Using linearRampToValueAtTime
    // causes the transition to happen BEFORE the event (ramps TO value BY time),
    // which breaks mutual exclusion timing.
    this.nodes.parallelOutGain.gain.setValueAtTime(parallelGain, atTime);
    this.nodes.cascadeOutGain.gain.setValueAtTime(cascadeGain, atTime);
    // Emit telemetry for gain scheduling (debugging branch routing)
    if (this.telemetryHandler) {
      this.telemetryHandler({
        type: "gain-schedule",
        node: "branch-routing",
        atTime,
        allParallel,
        parallelOutGain: parallelGain,
        cascadeOutGain: cascadeGain,
        mix,
      });
    }
  }

  setTelemetryHandler(handler) {
    this.telemetryHandler = handler;
  }

  _attachTelemetry(node) {
    if (!this.telemetryHandler || !node?.port) return;
    node.port.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || data.type !== "metrics") return;
      this.telemetryHandler(data);
    });
    if (typeof node.port.start === "function") {
      node.port.start();
    }
  }

  async _awaitWorkletReady(timeoutMs = 2000) {
    if (this._readyPromise) return this._readyPromise;
    const nodes = Object.values(this.nodes).filter((node) => node?.port);
    this._readyPromise = Promise.all(
      nodes.map((node) => this._waitForNodeReady(node, timeoutMs))
    );
    return this._readyPromise;
  }

  _waitForNodeReady(node, timeoutMs) {
    return new Promise((resolve) => {
      let done = false;
      const handler = (event) => {
        const data = event?.data;
        if (!data || data.type !== "ready") return;
        done = true;
        node.port.removeEventListener("message", handler);
        resolve();
      };
      node.port.addEventListener("message", handler);
      if (typeof node.port.start === "function") {
        node.port.start();
      }
      node.port.postMessage({ type: "ping" });
      if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        setTimeout(() => {
          if (done) return;
          node.port.removeEventListener("message", handler);
          console.warn(`[KlattSynth] worklet ready timeout: ${node?.port?.name ?? "node"}`);
          resolve();
        }, timeoutMs);
      }
    });
  }

  async _loadWasmBytes(workletBase) {
    if (this.wasmBytes) return;
    const load = async (file) => {
      const response = await fetch(workletBase + file);
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
        this._setAudioParam(this.nodes.impulseSource.parameters.get("f0"), value, atTime);
        this._setAudioParam(this.nodes.glottalMod.parameters.get("f0"), value, atTime);
        break;
      case "openPhaseRatio":
        this._setAudioParam(this.nodes.impulseSource.parameters.get("openPhaseRatio"), value, atTime);
        break;
      case "rd":
        this._setAudioParam(this.nodes.lfSource.parameters.get("rd"), value, atTime);
        break;
      case "lfMode":
        this._setAudioParam(this.nodes.lfSource.parameters.get("lfMode"), value, atTime);
        break;
      case "voiceGain":
        this.nodes.voiceGain.gain.setValueAtTime(value, atTime);
        break;
      case "AVS":
        this.nodes.avsGain.gain.setValueAtTime(this._dbToLinear(value + (-44)) * 10, atTime);
        break;
      case "noiseGain":
        this.nodes.noiseGain.gain.setValueAtTime(value, atTime);
        break;
      case "masterGain":
        this.nodes.masterGain.gain.setValueAtTime(value, atTime);
        break;
      case "rgpFrequency":
        this._setAudioParam(this.nodes.rgp.parameters.get("frequency"), value, atTime);
        this._setAudioParam(this.nodes.rgpAvs.parameters.get("frequency"), value, atTime);
        break;
      case "rgpBandwidth":
        this._setAudioParam(this.nodes.rgp.parameters.get("bandwidth"), value, atTime);
        this._setAudioParam(this.nodes.rgpAvs.parameters.get("bandwidth"), value, atTime);
        break;
      case "FGP":
        this._setAudioParam(this.nodes.rgp.parameters.get("frequency"), value, atTime);
        this._setAudioParam(this.nodes.rgpAvs.parameters.get("frequency"), value, atTime);
        break;
      case "BGP":
        this._setAudioParam(this.nodes.rgp.parameters.get("bandwidth"), value, atTime);
        this._setAudioParam(this.nodes.rgpAvs.parameters.get("bandwidth"), value, atTime);
        break;
      case "FGZ":
        this._setAudioParam(this.nodes.rgz.parameters.get("frequency"), value, atTime);
        this._setAudioParam(this.nodes.rgzAvs.parameters.get("frequency"), value, atTime);
        break;
      case "BGZ":
        this._setAudioParam(this.nodes.rgz.parameters.get("bandwidth"), value, atTime);
        this._setAudioParam(this.nodes.rgzAvs.parameters.get("bandwidth"), value, atTime);
        break;
      case "rgsFrequency":
        this._setAudioParam(this.nodes.rgs.parameters.get("frequency"), value, atTime);
        break;
      case "rgsBandwidth":
        this._setAudioParam(this.nodes.rgs.parameters.get("bandwidth"), value, atTime);
        break;
      case "BGS":
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
      case "sourceMode":
      case "SRC":
        this.params.sourceMode = value;
        this._applySourceMode(value, atTime);
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
        // Apply ndbScale.AN (-58) to convert Klatt parameter to safe linear
        this.nodes.parallelNasalGain.gain.setValueAtTime(this._dbToLinear(value + (-58)), atTime);
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
        // Apply ndbScale.AB (-84) to convert Klatt parameter to safe linear
        this.nodes.parallelBypassGain.gain.setValueAtTime(-this._dbToLinear(value + (-84)), atTime);
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
