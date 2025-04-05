// Helper Functions
function dbToLinear(db) {
  if (db <= -70) return 0.0;
  return 10.0 ** (db / 20.0);
}
function bwToQ(F, BW) {
  // Ensure F and BW are positive for Q calculation
  if (F <= 0 || BW <= 0) return 0.707; // Default Q for invalid input
  return F / BW;
}
// Reference level for scaling dB source amplitudes to worklet's 0-1 range
const SOURCE_AMP_REFERENCE_DB = 65.0; // dB level that maps approximately to linear 1.0 for worklet params
const SOURCE_AMP_SCALE_FACTOR = 1.0 / dbToLinear(SOURCE_AMP_REFERENCE_DB);

// --- Main Synth Class ---
export class KlattSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nodes = {}; // Store references to all nodes
    this.params = this._getDefaultParams(); // Store current parameter values
    this.isInitialized = false;
    this.isRunning = false;
    this._currentConnections = null; // Track current connection state ('cascade', 'parallel', null)
  }

  async initialize() {
    if (this.isInitialized) return;
    console.log("Initializing KlattSynth...");
    // Load Worklet modules
    try {
      await Promise.all([
        this.ctx.audioWorklet.addModule("voicing-source-processor.js"),
        this.ctx.audioWorklet.addModule("noise-source-processor.js"),
        this.ctx.audioWorklet.addModule("radiation-processor.js"),
      ]);
      console.log("Worklets loaded.");
    } catch (error) {
      console.error("Error loading AudioWorklet modules:", error);
      throw error; // Re-throw to indicate failure
    }

    this._createNodes();
    this._applyAllParams(this.ctx.currentTime); // Set initial node parameters
    this._connectCascadeParallel(); // Default connection
    this.isInitialized = true;
    console.log("KlattSynth Initialized");
  }

  _getDefaultParams() {
    // Default parameters based loosely on Klatt's paper Table I Typical Values
    return {
      F1: 450,
      F2: 1450,
      F3: 2450,
      F4: 3300,
      F5: 3750,
      F6: 4900,
      B1: 50,
      B2: 70,
      B3: 110,
      B4: 250,
      B5: 200,
      B6: 1000,
      AV: 0,
      AF: 0,
      AH: 0,
      AVS: 0,
      F0: 100,
      FNZ: 250,
      FNP: 250,
      BNP: 100,
      BNZ: 100,
      AN: 0,
      A1: 0,
      A2: 0,
      A3: 0,
      A4: 0,
      A5: 0,
      A6: 0,
      AB: 0,
      SW: 0,
      FGP: 0,
      BGP: 100,
      FGZ: 1500,
      BGZ: 6000,
      BGS: 200,
      NFC: 5,
      GO: 47,
      SR: this.ctx.sampleRate, // Use context's sample rate
    };
  }

  _createNodes() {
    const N = this.nodes;
    const ctx = this.ctx;

    // === Sources ===
    N.voicingSource = new AudioWorkletNode(ctx, "voicing-source-processor");
    N.noiseSource = new AudioWorkletNode(ctx, "noise-source-processor", {
      numberOfOutputs: 2,
    }); // 0:Fric, 1:Asp

    // === Source Shaping Filters ===
    N.rgpFilter = ctx.createBiquadFilter();
    N.rgpFilter.type = "lowpass";
    N.rgzFilter = ctx.createBiquadFilter();
    N.rgzFilter.type = "notch";
    N.rgsFilter = ctx.createBiquadFilter();
    N.rgsFilter.type = "lowpass";

    // === Gain Controls for Sources ===
    N.avsInGain = ctx.createGain(); // Controls AVS input level
    N.fricationGain = ctx.createGain(); // Intermediate GainNode for Frication path
    N.aspirationGain = ctx.createGain(); // Intermediate GainNode for Aspiration path

    // Summing node for laryngeal sources (Voice + Aspiration) before cascade
    N.laryngealSourceSum = ctx.createGain();

    // === Vocal Tract Filters ===
    // Cascade Path
    N.rnpCascFilter = ctx.createBiquadFilter();
    N.rnpCascFilter.type = "peaking";
    N.rnzCascFilter = ctx.createBiquadFilter();
    N.rnzCascFilter.type = "notch";
    N.r1CascFilter = ctx.createBiquadFilter();
    N.r1CascFilter.type = "peaking";
    N.r2CascFilter = ctx.createBiquadFilter();
    N.r2CascFilter.type = "peaking";
    N.r3CascFilter = ctx.createBiquadFilter();
    N.r3CascFilter.type = "peaking";
    N.r4CascFilter = ctx.createBiquadFilter();
    N.r4CascFilter.type = "peaking";
    N.r5CascFilter = ctx.createBiquadFilter();
    N.r5CascFilter.type = "peaking";
    N.r6CascFilter = ctx.createBiquadFilter();
    N.r6CascFilter.type = "peaking";
    this.cascadeFilters = [
      N.r1CascFilter,
      N.r2CascFilter,
      N.r3CascFilter,
      N.r4CascFilter,
      N.r5CascFilter,
      N.r6CascFilter,
    ];

    // Parallel Path Gains
    N.anParGain = ctx.createGain();
    N.a1ParGain = ctx.createGain();
    N.a2ParGain = ctx.createGain();
    N.a3ParGain = ctx.createGain();
    N.a4ParGain = ctx.createGain();
    N.a5ParGain = ctx.createGain();
    N.a6ParGain = ctx.createGain();
    N.abParGain = ctx.createGain();
    this.parallelGains = [
      N.a1ParGain,
      N.a2ParGain,
      N.a3ParGain,
      N.a4ParGain,
      N.a5ParGain,
      N.a6ParGain,
    ];

    // Parallel Path Filters
    N.rnpParFilter = ctx.createBiquadFilter();
    N.rnpParFilter.type = "peaking";
    N.r1ParFilter = ctx.createBiquadFilter();
    N.r1ParFilter.type = "peaking";
    N.r2ParFilter = ctx.createBiquadFilter();
    N.r2ParFilter.type = "peaking";
    N.r3ParFilter = ctx.createBiquadFilter();
    N.r3ParFilter.type = "peaking";
    N.r4ParFilter = ctx.createBiquadFilter();
    N.r4ParFilter.type = "peaking";
    N.r5ParFilter = ctx.createBiquadFilter();
    N.r5ParFilter.type = "peaking";
    N.r6ParFilter = ctx.createBiquadFilter();
    N.r6ParFilter.type = "peaking";
    this.parallelFilters = [
      N.r1ParFilter,
      N.r2ParFilter,
      N.r3ParFilter,
      N.r4ParFilter,
      N.r5ParFilter,
      N.r6ParFilter,
    ];

    // Summing nodes
    N.parallelSum = ctx.createGain();
    N.parallelInputMix = ctx.createGain(); // Mixes sources for parallel path input
    N.finalSum = ctx.createGain(); // Sums cascade and parallel outputs

    // === Final Stages ===
    N.radiation = new AudioWorkletNode(ctx, "radiation-processor");
    N.outputGain = ctx.createGain();

    console.log("Audio nodes created.");
  }

  _applyAllParams(time) {
    console.log("Applying all default/initial parameters...");
    if (!this.nodes.voicingSource) {
      console.error("Nodes not created yet in _applyAllParams");
      return;
    }
    Object.keys(this.params).forEach((pName) => {
      // Use try-catch for robustness during initial setup
      try {
        this.setParam(pName, this.params[pName], time, true);
      } catch (e) {
        console.error(`Error applying initial param ${pName}: ${e}`);
      }
    });
    console.log("Initial parameters applied.");
  }

  // --- setParam method (UPDATED Worklet Param Scaling) ---
  setParam(name, value, time, applyImmediately = false) {
    if (!this.isInitialized || !this.nodes.voicingSource) {
      this.params[name] = value; // Store value if not ready
      return;
    }
    const N = this.nodes;
    const P = this.params;
    const ctx = this.ctx;

    // Validate value type
    if (typeof value !== "number" || !isFinite(value)) {
      console.error(
        `Invalid value type/content for parameter ${name}: ${value} (type: ${typeof value}). Skipping update.`
      );
      return;
    }

    const T = time !== undefined ? time : ctx.currentTime;
    const scheduleMethod = applyImmediately
      ? "setValueAtTime"
      : "linearRampToValueAtTime";
    const rampEndTime = applyImmediately ? T : T + 0.005; // 5ms ramp default

    const oldValue = P[name];
    P[name] = value; // Update internal state

    // Helper: Schedule GainNode gain (expects dB)
    const scheduleGain = (gainNode, dbValue) => {
      if (gainNode && typeof dbValue === "number") {
        const linearValue = dbToLinear(dbValue);
        // Clamp linear gain for safety (adjust max if needed)
        const clampedLinearValue = Math.max(0, Math.min(linearValue, 100));
        gainNode.gain[scheduleMethod](clampedLinearValue, rampEndTime);
      }
    };

    // Helper: Schedule BiquadFilter params
    const scheduleFilter = (filterNode, type, freq, qVal, gainVal = 0) => {
      if (
        !filterNode ||
        typeof freq !== "number" ||
        !isFinite(freq) ||
        typeof qVal !== "number" ||
        !isFinite(qVal)
      )
        return;
      try {
        filterNode.type = type;
        let targetFreq = Math.max(1, freq); // Ensure freq > 0
        targetFreq = Math.min(targetFreq, ctx.sampleRate / 2 - 1); // Ensure below Nyquist
        filterNode.frequency[scheduleMethod](targetFreq, rampEndTime);

        let targetQ = Math.max(0.0001, qVal); // Ensure Q > 0
        filterNode.Q[scheduleMethod](targetQ, rampEndTime);

        if (filterNode.gain) filterNode.gain.setValueAtTime(gainVal, T);
      } catch (e) {
        console.error(
          `Error scheduling filter ${name}: F=${freq}, Q=${qVal}`,
          e
        );
      }
    };

    // *** UPDATED Helper: Schedule AudioWorklet param (expects dB, scales to 0-1) ***
    const scheduleWorkletParam = (workletNode, paramName, dbValue) => {
      if (
        workletNode &&
        workletNode.parameters.has(paramName) &&
        typeof dbValue === "number"
      ) {
        const linearValue = dbToLinear(dbValue);
        const scaledValue = Math.max(
          0,
          Math.min(linearValue * SOURCE_AMP_SCALE_FACTOR, 1.0)
        ); // Scale and clamp 0-1
        try {
          workletNode.parameters
            .get(paramName)
            [scheduleMethod](scaledValue, rampEndTime);
        } catch (e) {
          console.error(
            `Error scheduling worklet param ${paramName} with scaled value ${scaledValue} (from ${dbValue}dB)`,
            e
          );
        }
      }
    };

    // --- Parameter Mapping Switch ---
    try {
      switch (name) {
        case "F0":
          N.voicingSource.parameters
            .get("f0")
            [scheduleMethod](Math.max(1, value), rampEndTime);
          break; // Clamp F0 min to 1Hz
        case "AV":
          scheduleWorkletParam(N.voicingSource, "amp", value);
          break; // Use helper
        case "AF":
          scheduleWorkletParam(N.noiseSource, "fricationGain", value); // Use helper
          scheduleGain(N.fricationGain, value); // Also schedule intermediate GainNode
          break;
        case "AH":
          scheduleWorkletParam(N.noiseSource, "aspirationGain", value); // Use helper
          scheduleGain(N.aspirationGain, value); // Also schedule intermediate GainNode
          break;
        case "AVS":
          scheduleGain(N.avsInGain, value); // AVS only controls input GainNode
          break;

        case "FGP":
        case "BGP":
          scheduleFilter(N.rgpFilter, "lowpass", P.BGP / 2, bwToQ(50, P.BGP));
          break; // Use BW/2 as cutoff
        case "FGZ":
        case "BGZ":
          scheduleFilter(N.rgzFilter, "notch", P.FGZ, bwToQ(P.FGZ, P.BGZ));
          break;
        case "BGS":
          scheduleFilter(N.rgsFilter, "lowpass", P.BGS / 2, bwToQ(50, P.BGS));
          break; // Use BW/2 as cutoff

        case "FNP":
        case "BNP": {
          const f = P.FNP,
            bw = P.BNP,
            q = bwToQ(f, bw);
          scheduleFilter(N.rnpCascFilter, "peaking", f, q);
          scheduleFilter(N.rnpParFilter, "peaking", f, q);
          break;
        }
        case "FNZ":
        case "BNZ": {
          const f = P.FNZ,
            bw = P.BNZ,
            q = bwToQ(f, bw);
          if (Math.abs(P.FNZ - P.FNP) < 1.0) {
            scheduleFilter(N.rnzCascFilter, "notch", ctx.sampleRate / 2.1, 10);
          } else {
            scheduleFilter(N.rnzCascFilter, "notch", f, q);
          }
          break;
        }
        case "F1":
        case "B1": {
          const f = P.F1,
            bw = P.B1,
            q = bwToQ(f, bw);
          scheduleFilter(N.r1CascFilter, "peaking", f, q);
          scheduleFilter(N.r1ParFilter, "peaking", f, q);
          break;
        }
        case "F2":
        case "B2": {
          const f = P.F2,
            bw = P.B2,
            q = bwToQ(f, bw);
          scheduleFilter(N.r2CascFilter, "peaking", f, q);
          scheduleFilter(N.r2ParFilter, "peaking", f, q);
          break;
        }
        case "F3":
        case "B3": {
          const f = P.F3,
            bw = P.B3,
            q = bwToQ(f, bw);
          scheduleFilter(N.r3CascFilter, "peaking", f, q);
          scheduleFilter(N.r3ParFilter, "peaking", f, q);
          break;
        }
        case "F4":
        case "B4": {
          const f = P.F4,
            bw = P.B4,
            q = bwToQ(f, bw);
          scheduleFilter(N.r4CascFilter, "peaking", f, q);
          scheduleFilter(N.r4ParFilter, "peaking", f, q);
          break;
        }
        case "F5":
        case "B5": {
          const f = P.F5,
            bw = P.B5,
            q = bwToQ(f, bw);
          scheduleFilter(N.r5CascFilter, "peaking", f, q);
          scheduleFilter(N.r5ParFilter, "peaking", f, q);
          break;
        }
        case "F6":
        case "B6": {
          const f = P.F6,
            bw = P.B6,
            q = bwToQ(f, bw);
          scheduleFilter(N.r6CascFilter, "peaking", f, q);
          scheduleFilter(N.r6ParFilter, "peaking", f, q);
          break;
        }

        case "AN":
          scheduleGain(N.anParGain, value);
          break;
        case "A1":
          scheduleGain(N.a1ParGain, value);
          break;
        case "A2":
          scheduleGain(N.a2ParGain, value);
          break;
        case "A3":
          scheduleGain(N.a3ParGain, value);
          break;
        case "A4":
          scheduleGain(N.a4ParGain, value);
          break;
        case "A5":
          scheduleGain(N.a5ParGain, value);
          break;
        case "A6":
          scheduleGain(N.a6ParGain, value);
          break;
        case "AB":
          scheduleGain(N.abParGain, value);
          break;
        case "GO":
          scheduleGain(N.outputGain, value);
          break;

        case "NFC":
          if (P.SW === 0 && oldValue !== value) this._reconnectGraph();
          break;
        case "SW":
          if (oldValue !== value) this._reconnectGraph();
          break;
        // Ignore SR - cannot change dynamically
        case "SR":
          break;
        default:
          // console.warn(`Parameter ${name} not handled in setParam switch.`);
          break;
      }
    } catch (error) {
      console.error(`Error setting parameter ${name} to ${value}:`, error);
    }
  }

  _reconnectGraph() {
    console.log("Reconnecting graph...");
    this._disconnectAll();
    if (this.params.SW === 0) {
      this._connectCascadeParallel();
    } else {
      this._connectAllParallel();
    }
    if (this.isRunning) {
      try {
        this.nodes.outputGain.connect(this.ctx.destination);
        console.log("Reconnected output gain.");
      } catch (e) {
        console.error("Error reconnecting output gain:", e);
      }
    }
  }

  _disconnectAll() {
    // console.log("Disconnecting all nodes..."); // Can be noisy
    Object.values(this.nodes).forEach((node) => {
      try {
        node.disconnect();
      } catch (e) {
        /* ignore */
      }
    });
    try {
      this.nodes.outputGain.disconnect(this.ctx.destination);
    } catch (e) {
      /* ignore */
    }
  }

  _connectCascadeParallel() {
    if (this._currentConnections === "cascade") return;
    console.log("Connecting Cascade/Parallel Graph (SW=0)");
    const N = this.nodes;
    const NFC = Math.max(4, Math.min(6, Math.round(this.params.NFC))); // Ensure NFC is 4, 5, or 6

    try {
      // Voicing Source Path -> LaryngealSum
      N.voicingSource
        .connect(N.rgpFilter)
        .connect(N.rgzFilter)
        .connect(N.laryngealSourceSum);
      N.voicingSource
        .connect(N.avsInGain)
        .connect(N.rgsFilter)
        .connect(N.laryngealSourceSum); // AVS path also to sum

      // Noise Source Path
      N.noiseSource.connect(N.aspirationGain, 1).connect(N.laryngealSourceSum); // Aspiration -> LaryngealSum
      N.noiseSource.connect(N.fricationGain, 0).connect(N.parallelInputMix); // Frication -> Parallel Input

      // Cascade Path
      let lastCascadeNode = N.laryngealSourceSum;
      lastCascadeNode.connect(N.rnpCascFilter);
      lastCascadeNode = N.rnpCascFilter;
      lastCascadeNode.connect(N.rnzCascFilter);
      lastCascadeNode = N.rnzCascFilter;
      for (let i = 0; i < NFC; i++) {
        if (!this.cascadeFilters[i]) continue; // Safety check
        lastCascadeNode.connect(this.cascadeFilters[i]);
        lastCascadeNode = this.cascadeFilters[i];
      }
      lastCascadeNode.connect(N.finalSum); // Cascade output -> Final Sum

      // Parallel Path
      N.parallelInputMix
        .connect(N.rnpParFilter)
        .connect(N.anParGain)
        .connect(N.parallelSum);
      for (let i = 0; i < 6; i++) {
        // All 6 parallel resonators
        if (!this.parallelFilters[i] || !this.parallelGains[i]) continue; // Safety check
        N.parallelInputMix
          .connect(this.parallelFilters[i])
          .connect(this.parallelGains[i])
          .connect(N.parallelSum);
      }
      N.parallelInputMix.connect(N.abParGain).connect(N.parallelSum); // Bypass path
      N.parallelSum.connect(N.finalSum); // Parallel output -> Final Sum

      // Final Stage
      N.finalSum.connect(N.radiation).connect(N.outputGain);
      this._currentConnections = "cascade";
    } catch (error) {
      console.error("Error during _connectCascadeParallel:", error);
      this._currentConnections = null; // Mark as uncertain state
    }
  }

  _connectAllParallel() {
    if (this._currentConnections === "parallel") return;
    console.log("Connecting All-Parallel Graph (SW=1)");
    const N = this.nodes;

    try {
      // Sources -> Parallel Input Mixer
      N.voicingSource
        .connect(N.rgpFilter)
        .connect(N.rgzFilter)
        .connect(N.parallelInputMix);
      N.voicingSource
        .connect(N.avsInGain)
        .connect(N.rgsFilter)
        .connect(N.parallelInputMix);
      N.noiseSource.connect(N.aspirationGain, 1).connect(N.parallelInputMix);
      N.noiseSource.connect(N.fricationGain, 0).connect(N.parallelInputMix);

      // Parallel Path (All sources mixed first)
      N.parallelInputMix
        .connect(N.rnpParFilter)
        .connect(N.anParGain)
        .connect(N.parallelSum);
      N.parallelInputMix
        .connect(N.r1ParFilter)
        .connect(N.a1ParGain)
        .connect(N.parallelSum); // A1 active here
      for (let i = 1; i < 6; i++) {
        // R2-R6
        if (!this.parallelFilters[i] || !this.parallelGains[i]) continue; // Safety check
        N.parallelInputMix
          .connect(this.parallelFilters[i])
          .connect(this.parallelGains[i])
          .connect(N.parallelSum);
      }
      N.parallelInputMix.connect(N.abParGain).connect(N.parallelSum); // Bypass path

      // Final Stage
      N.parallelSum.connect(N.radiation).connect(N.outputGain);
      this._currentConnections = "parallel";
    } catch (error) {
      console.error("Error during _connectAllParallel:", error);
      this._currentConnections = null; // Mark as uncertain state
    }
  }

  start() {
    if (!this.isInitialized) {
      console.error("Not initialized.");
      return;
    }
    if (!this.isRunning) {
      try {
        this._reconnectGraph(); // Ensure connections are up-to-date
        if (this._currentConnections !== null) {
          // Only connect if graph setup succeeded
          this.nodes.outputGain.connect(this.ctx.destination);
          if (this.ctx.state === "suspended") this.ctx.resume();
          this.isRunning = true;
          console.log("KlattSynth Started");
        } else {
          console.error(
            "Cannot start synth, graph connection failed previously."
          );
        }
      } catch (error) {
        console.error("Error starting synth:", error);
      }
    }
  }

  stop() {
    if (this.isRunning) {
      try {
        this.nodes.outputGain.disconnect(this.ctx.destination);
      } catch (e) {}
      this.cancelScheduledValues();
      this.isRunning = false;
      console.log("KlattSynth Stopped");
    }
  }

  cancelScheduledValues() {
    if (!this.isInitialized || !this.ctx) return;
    const T = this.ctx.currentTime;
    // console.log("Cancelling scheduled parameter values from time", T);
    Object.values(this.nodes).forEach((node) => {
      try {
        if (node instanceof GainNode) {
          node.gain.cancelScheduledValues(T);
          node.gain.setValueAtTime(node.gain.value, T);
        } // Hold current value
        else if (node instanceof BiquadFilterNode) {
          node.frequency.cancelScheduledValues(T);
          node.frequency.setValueAtTime(node.frequency.value, T);
          node.Q.cancelScheduledValues(T);
          node.Q.setValueAtTime(node.Q.value, T);
          node.gain.cancelScheduledValues(T);
          node.gain.setValueAtTime(node.gain.value, T);
        } else if (node instanceof AudioWorkletNode && node.parameters) {
          node.parameters.forEach((param) => {
            param.cancelScheduledValues(T);
            param.setValueAtTime(param.value, T);
          });
        }
      } catch (e) {
        console.warn("Error cancelling schedule for node:", e);
      }
    });
  }

  setTrack(track) {
    if (!this.isInitialized || !track) {
      console.warn("Set track called before init or track is null.");
      return;
    }
    console.log(`Setting track with ${track.length} events.`);
    const startTime = this.ctx.currentTime;
    this.cancelScheduledValues(); // Cancel previous before setting new

    // Find the parameters intended for time 0 (or the first event time)
    const firstEventTime = track[0]?.time || 0;
    const initialState =
      track.find((e) => e.time === firstEventTime)?.params ||
      this._getDefaultParams();

    // Reset all parameters to their defaults *at the start time*
    this._applyAllParams(startTime);
    // Immediately set the initial state of the track *at the start time*
    Object.keys(initialState).forEach((pName) => {
      if (
        typeof initialState[pName] === "number" &&
        isFinite(initialState[pName])
      ) {
        this.setParam(pName, initialState[pName], startTime, true); // Use setValueAtTime
      }
    });

    // Schedule the rest of the track events using ramps
    track.forEach((event) => {
      // Skip events at or before the initial time we already set
      if (event.time <= firstEventTime) return;

      const eventTime = startTime + event.time; // Schedule relative to current time
      if (event.params) {
        Object.keys(event.params).forEach((pName) => {
          const value = event.params[pName];
          if (typeof value === "number" && isFinite(value)) {
            this.setParam(pName, value, eventTime, false); // Use linearRamp
          } else {
            // console.warn(`Track event at ${event.time.toFixed(3)}s has invalid value for ${pName}:`, value);
          }
        });
      } else {
        // console.warn(`Track event at ${event.time.toFixed(3)}s is missing 'params' object.`);
      }
    });
    console.log("Track scheduled.");
  }
}
