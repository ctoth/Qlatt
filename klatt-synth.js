// Helper Functions
export function dbToLinear(db) {
  if (db <= -70) return 0.0;
  return 10.0 ** (db / 20.0);
}
export function bwToQ(F, BW) {
  // Ensure F and BW are positive for Q calculation
  if (F <= 0 || BW <= 0) return 0.707; // Default Q for invalid input
  return F / BW;
}
// *** REMOVE OLD SCALING FACTOR ***
// const SOURCE_AMP_REFERENCE_DB = 65.0;
// const SOURCE_AMP_SCALE_FACTOR = 1.0 / dbToLinear(SOURCE_AMP_REFERENCE_DB);
// *** NEW: Define Max dB for linear scaling 0-1 (Adjusted Reference) ***
const SOURCE_AMP_MAX_DB = 70.0; // dB value that maps to linear 1.0 for worklets

// --- Main Synth Class ---
export class KlattSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nodes = {}; // Store references to all nodes
    this.params = this._getDefaultParams(); // Store current parameter values
    this.isInitialized = false;
    this.isRunning = false;
    this._currentConnections = null; // Track current connection state ('cascade', 'parallel', null)
    this._debugLog("KlattSynth instance created.");
  }

  async initialize() {
    console.log("[KlattSynth] Initializing..."); // Keep top-level log
    if (this.isInitialized) return;
    console.log("Initializing KlattSynth...");
    // Load Worklet modules
    try {
      await Promise.all([
        this.ctx.audioWorklet.addModule("voicing-source-processor.js"),
        this.ctx.audioWorklet.addModule("noise-source-processor.js"),
        this.ctx.audioWorklet.addModule("radiation-processor.js"),
      ]);
      this._debugLog("Worklets loaded successfully.");
    } catch (error) {
      console.error("[KlattSynth] Error loading AudioWorklet modules:", error);
      throw error; // Re-throw to indicate failure
    }

    this._createNodes();
    this._debugLog("Audio nodes created.");
    this._applyAllParams(this.ctx.currentTime); // Set initial node parameters
    this._connectCascadeParallel(); // Default connection
    this.isInitialized = true;
    this._debugLog("KlattSynth Initialized successfully.");
    console.log("KlattSynth Initialized"); // Keep top-level log
  }
  _debugLog(...args) {
    // Simple internal logger helper
    console.log("[KlattSynth DEBUG]", ...args);
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
      SW: 0, // 0: Cascade/Parallel (Paper Default), 1: All Parallel
      FGP: 0,
      BGP: 100,
      FGZ: 1500,
      BGZ: 6000,
      BGS: 200,
      NFC: 5,
      GO: 35, // Reduced default output gain from 47
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
    N.avsInGain = ctx.createGain();
    N.avsInGain.gain.value = 0.0;
    N.fricationGain = ctx.createGain();
    N.fricationGain.gain.value = 0.0;
    N.aspirationGain = ctx.createGain();
    N.aspirationGain.gain.value = 0.0;

    // *** Initialize Summing Node Gains to 1.0 ***
    N.laryngealSourceSum = ctx.createGain();
    N.laryngealSourceSum.gain.value = 1.0;

    // === Vocal Tract Filters ===
    // Cascade Path
    N.rnpCascFilter = ctx.createBiquadFilter();
    N.rnpCascFilter.type = "bandpass"; // Was "peaking"
    N.rnzCascFilter = ctx.createBiquadFilter();
    N.rnzCascFilter.type = "notch"; // Keep notch
    N.r1CascFilter = ctx.createBiquadFilter();
    N.r1CascFilter.type = "bandpass"; // Was "peaking"
    N.r2CascFilter = ctx.createBiquadFilter();
    N.r2CascFilter.type = "bandpass"; // Was "peaking"
    N.r3CascFilter = ctx.createBiquadFilter();
    N.r3CascFilter.type = "bandpass"; // Was "peaking"
    N.r4CascFilter = ctx.createBiquadFilter();
    N.r4CascFilter.type = "bandpass"; // Was "peaking"
    N.r5CascFilter = ctx.createBiquadFilter();
    N.r5CascFilter.type = "bandpass"; // Was "peaking"
    N.r6CascFilter = ctx.createBiquadFilter();
    N.r6CascFilter.type = "bandpass"; // Was "peaking"
    this.cascadeFilters = [
      N.r1CascFilter,
      N.r2CascFilter,
      N.r3CascFilter,
      N.r4CascFilter,
      N.r5CascFilter,
      N.r6CascFilter,
    ];

    // === Parallel Path Gains === (Initialize to 0)
    N.anParGain = ctx.createGain();
    N.anParGain.gain.value = 0.0;
    N.a1ParGain = ctx.createGain();
    N.a1ParGain.gain.value = 0.0;
    N.a2ParGain = ctx.createGain();
    N.a2ParGain.gain.value = 0.0;
    N.a3ParGain = ctx.createGain();
    N.a3ParGain.gain.value = 0.0;
    N.a4ParGain = ctx.createGain();
    N.a4ParGain.gain.value = 0.0;
    N.a5ParGain = ctx.createGain();
    N.a5ParGain.gain.value = 0.0;
    N.a6ParGain = ctx.createGain();
    N.a6ParGain.gain.value = 0.0;
    N.abParGain = ctx.createGain();
    N.abParGain.gain.value = 0.0;
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
    N.rnpParFilter.type = "bandpass"; // Was "peaking"
    N.r1ParFilter = ctx.createBiquadFilter();
    N.r1ParFilter.type = "bandpass"; // Was "peaking"
    N.r2ParFilter = ctx.createBiquadFilter();
    N.r2ParFilter.type = "bandpass"; // Was "peaking"
    N.r3ParFilter = ctx.createBiquadFilter();
    N.r3ParFilter.type = "bandpass"; // Was "peaking"
    N.r4ParFilter = ctx.createBiquadFilter();
    N.r4ParFilter.type = "bandpass"; // Was "peaking"
    N.r5ParFilter = ctx.createBiquadFilter();
    N.r5ParFilter.type = "bandpass"; // Was "peaking"
    N.r6ParFilter = ctx.createBiquadFilter();
    N.r6ParFilter.type = "bandpass"; // Was "peaking"
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
    N.parallelSum.gain.value = 0.2; // FURTHER REDUCED gain for parallel path output (was 0.5)
    N.parallelInputMix = ctx.createGain();
    N.parallelInputMix.gain.value = 1.0; // Mixes sources for parallel path input
    N.finalSum = ctx.createGain();
    N.finalSum.gain.value = 1.0; // Sums cascade and parallel outputs

    // === Final Stages ===
    N.radiation = new AudioWorkletNode(ctx, "radiation-processor");
    N.outputGain = ctx.createGain();
    N.outputGain.gain.value = dbToLinear(this.params.GO); // Init with GO

    // Parallel Path Differentiator Filters (for preemphasis in all-parallel mode)
    N.r2DiffPar = ctx.createBiquadFilter();
    N.r2DiffPar.type = "highpass";
    N.r2DiffPar.frequency.value = 1;
    N.r2DiffPar.Q.value = 0.707;
    N.r3DiffPar = ctx.createBiquadFilter();
    N.r3DiffPar.type = "highpass";
    N.r3DiffPar.frequency.value = 1;
    N.r3DiffPar.Q.value = 0.707;
    N.r4DiffPar = ctx.createBiquadFilter();
    N.r4DiffPar.type = "highpass";
    N.r4DiffPar.frequency.value = 1;
    N.r4DiffPar.Q.value = 0.707;
    N.r5DiffPar = ctx.createBiquadFilter();
    N.r5DiffPar.type = "highpass";
    N.r5DiffPar.frequency.value = 1;
    N.r5DiffPar.Q.value = 0.707;
    N.r6DiffPar = ctx.createBiquadFilter();
    N.r6DiffPar.type = "highpass";
    N.r6DiffPar.frequency.value = 1;
    N.r6DiffPar.Q.value = 0.707;
    this.parallelDiffFilters = [
      null,
      N.r2DiffPar,
      N.r3DiffPar,
      N.r4DiffPar,
      N.r5DiffPar,
      N.r6DiffPar,
    ]; // Index matches R number

    // *** Ensure Summing Nodes have Gain = 1.0 ***
    N.laryngealSourceSum.gain.value = 1.0;
    // N.parallelSum.gain.value = 1.0; // REMOVE THIS LINE - Keep the 0.5 set earlier
    N.finalSum.gain.value = 1.0;
    N.parallelInputMix.gain.value = 1.0; // Input mixer should also likely be 1

    this._debugLog("Audio nodes created, summing gains set (ParallelSum=0.5)."); // Update log message
  }

  _applyAllParams(time) {
    this._debugLog(`Applying all parameters at time ${time.toFixed(3)}...`);
    if (!this.nodes.voicingSource) {
      console.error("Nodes not created yet in _applyAllParams");
      return;
    }
    Object.keys(this.params).forEach((pName) => {
      // Use try-catch for robustness during initial setup
      try {
        this.setParam(pName, this.params[pName], time, true);
      } catch (e) {
        console.error(
          `[KlattSynth] Error applying initial param ${pName}: ${e}`
        );
      }
    });
    this._debugLog("Initial parameters applied.");
  }

  // --- setParam method (UPDATED Worklet Param Scaling) ---
  setParam(name, value, time, applyImmediately = false) {
    const T = time !== undefined ? time : this.ctx.currentTime;
    this._debugLog(
      `setParam: ${name}=${
        value.toFixed ? value.toFixed(2) : value
      } at ${T.toFixed(3)} (immediate=${applyImmediately})`
    );
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
        `[KlattSynth] Invalid value type/content for parameter ${name}: ${value} (type: ${typeof value}). Skipping update.`
      );
      return;
    }

    // const T = time !== undefined ? time : ctx.currentTime; // Moved up
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
        this._debugLog(
          `  Scheduling GainNode ${
            gainNode.constructor.name
          }: ${dbValue}dB -> ${clampedLinearValue.toFixed(4)} linear`
        );
        gainNode.gain[scheduleMethod](clampedLinearValue, rampEndTime);
      } else {
        this._debugLog(
          `  Skipping GainNode schedule for ${gainNode?.constructor?.name} (invalid value: ${dbValue})`
        );
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

        // --- MODIFICATION START ---
        const MAX_Q = 25.0; // Define a maximum Q value
        let targetQ = Math.max(0.0001, qVal); // Ensure Q > 0
        targetQ = Math.min(targetQ, MAX_Q); // Clamp Q to the maximum value
        // --- MODIFICATION END ---

        filterNode.Q[scheduleMethod](targetQ, rampEndTime);

        if (filterNode.gain) filterNode.gain.setValueAtTime(gainVal, T); // Gain is usually 0 for peaking/notch
        this._debugLog(
          // --- MODIFIED LOG ---
          `  Scheduling Filter ${
            filterNode.constructor.name
          }: type=${type}, F=${targetFreq.toFixed(1)}, Q=${targetQ.toFixed(3)} (Input Q: ${qVal.toFixed(3)}, Clamped to ${MAX_Q})`
          // --- END MODIFIED LOG ---
        );
      } catch (e) {
        console.error(
          `[KlattSynth] Error scheduling filter ${name}: F=${freq}, Q=${qVal}`,
          e
        );
      }
    };

    // *** REVISED Helper: Schedule AudioWorklet param (Using dbToLinear + Scaling Factor) ***
    const scheduleWorkletParam = (workletNode, paramName, dbValue) => {
      if (
        workletNode &&
        workletNode.parameters && // Check if parameters map exists before .has()
        workletNode.parameters.has(paramName) &&
        typeof dbValue === "number" && // Check for number type first
        isFinite(dbValue) // Then check for finite
      ) {
        // Define the dB level that maps to linear 1.0
        const REFERENCE_DB = SOURCE_AMP_MAX_DB; // Use the globally defined 80.0 dB

        // Calculate the linear value corresponding to the reference dB
        const referenceLinear = dbToLinear(REFERENCE_DB);
        if (referenceLinear <= 1e-9) { // Check against small threshold
             console.error(`[KlattSynth] Invalid referenceLinear (${referenceLinear.toFixed(4)}) from REFERENCE_DB (${REFERENCE_DB}). Cannot scale worklet param ${paramName}.`);
             return; // Avoid division by zero or near-zero
        }

        // Calculate the scaling factor
        const scaleFactor = 1.0 / referenceLinear;

        // Convert the input dB value to linear and apply the scaling factor
        // dbToLinear handles <= -70dB returning 0 correctly.
        let scaledValue = dbToLinear(dbValue) * scaleFactor;

        // Clamp the result strictly between 0 and 1
        scaledValue = Math.max(0.0, Math.min(scaledValue, 1.0));

        this._debugLog(
          `  Scheduling Worklet ${paramName}: ${scaledValue.toFixed(
            4
          )} (from ${dbValue}dB, Ref=${REFERENCE_DB}dB) at ${rampEndTime.toFixed(
            3
          )}`
        );

        try {
          workletNode.parameters
            .get(paramName)
            [scheduleMethod](scaledValue, rampEndTime);
        } catch (e) {
          console.error(
            `[KlattSynth] Error scheduling worklet param ${paramName} with value ${scaledValue} (from ${dbValue}dB)`,
            e
          );
        }
      } else {
         // Add more specific logging for why it's skipped
         let reason = "unknown";
         if (!workletNode) reason = "invalid node";
         else if (!workletNode.parameters) reason = "node has no parameters map"; // Check if parameters map exists
         else if (!workletNode.parameters.has(paramName)) reason = `node missing param '${paramName}'`;
         else if (typeof dbValue !== 'number') reason = `invalid value type (${typeof dbValue})`;
         else if (!isFinite(dbValue)) reason = `non-finite value (${dbValue})`;

        this._debugLog(
          `  Skipping Worklet schedule for ${workletNode?.constructor?.name} param '${paramName}'. Reason: ${reason}. Value: ${dbValue}`
        );
      }
    };

    // --- Parameter Mapping Switch ---
    try {
      switch (name) {
        case "F0": {
          // Allow F0 to be 0 to signal silence to the worklet
          // The check for finite number happens earlier in setParam
          this._debugLog(
            `  Scheduling VoicingSource F0: ${value.toFixed(1)} Hz`
          );
          N.voicingSource.parameters
            .get("f0")
            [scheduleMethod](value, rampEndTime);
          break;
        }
        case "AV":
          this._debugLog(`  Scheduling VoicingSource Amp (AV): ${value} dB`);
          scheduleWorkletParam(N.voicingSource, "amp", value);
          break;
        case "AF":
          this._debugLog(`  Scheduling Frication Gain (AF): ${value} dB`);
          scheduleWorkletParam(N.noiseSource, "fricationGain", value);
          // scheduleGain(N.fricationGain, value); // FricationGain node is not used in cascade/parallel path
          break;
        case "AH":
          this._debugLog(`  Scheduling Aspiration Gain (AH): ${value} dB`);
          scheduleWorkletParam(N.noiseSource, "aspirationGain", value);
          // scheduleGain(N.aspirationGain, value); // AspirationGain node is not used in cascade/parallel path
          break;
        case "AVS":
          this._debugLog(
            `  Scheduling Voiced Aspiration Gain (AVS): ${value} dB`
          );
          scheduleGain(N.avsInGain, value); // This GainNode IS used
          break;

        case "FGP": // FGP is currently unused in filter scheduling
        case "BGP":
          // scheduleFilter(N.rgpFilter, "lowpass", P.BGP / 2, bwToQ(50, P.BGP)); // OLD
          const rgpCutoff = Math.max(1, P.BGP); // Ensure cutoff > 0
          scheduleFilter(N.rgpFilter, "lowpass", rgpCutoff, 0.707); // Use BGP as cutoff, Q=0.707
          this._debugLog(`  Scheduling RgpFilter: Lowpass, F=${rgpCutoff.toFixed(1)}, Q=0.707 (using BGP as cutoff)`);
          break;
        case "FGZ":
        case "BGZ":
          scheduleFilter(N.rgzFilter, "notch", P.FGZ, bwToQ(P.FGZ, P.BGZ));
          break;
        case "BGS":
          // scheduleFilter(N.rgsFilter, "lowpass", P.BGS / 2, bwToQ(50, P.BGS)); // OLD
          const rgsCutoff = Math.max(1, P.BGS); // Ensure cutoff > 0
          scheduleFilter(N.rgsFilter, "lowpass", rgsCutoff, 0.707); // Use BGS as cutoff, Q=0.707
          this._debugLog(`  Scheduling RgsFilter: Lowpass, F=${rgsCutoff.toFixed(1)}, Q=0.707 (using BGS as cutoff)`);
          break;

        case "FNP":
        case "BNP": {
          const f = P.FNP,
            bw = P.BNP,
            q = bwToQ(f, bw);
          scheduleFilter(N.rnpCascFilter, "bandpass", f, q); // Was "peaking"
          scheduleFilter(N.rnpParFilter, "bandpass", f, q); // Was "peaking"
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
          scheduleFilter(N.r1CascFilter, "bandpass", f, q); // Was "peaking"
          scheduleFilter(N.r1ParFilter, "bandpass", f, q); // Was "peaking"
          break;
        }
        case "F2":
        case "B2": {
          const f = P.F2,
            bw = P.B2,
            q = bwToQ(f, bw);
          scheduleFilter(N.r2CascFilter, "bandpass", f, q); // Was "peaking"
          scheduleFilter(N.r2ParFilter, "bandpass", f, q); // Was "peaking"
          break;
        }
        case "F3":
        case "B3": {
          const f = P.F3,
            bw = P.B3,
            q = bwToQ(f, bw);
          scheduleFilter(N.r3CascFilter, "bandpass", f, q); // Was "peaking"
          scheduleFilter(N.r3ParFilter, "bandpass", f, q); // Was "peaking"
          break;
        }
        case "F4":
        case "B4": {
          const f = P.F4,
            bw = P.B4,
            q = bwToQ(f, bw);
          scheduleFilter(N.r4CascFilter, "bandpass", f, q); // Was "peaking"
          scheduleFilter(N.r4ParFilter, "bandpass", f, q); // Was "peaking"
          break;
        }
        case "F5":
        case "B5": {
          const f = P.F5,
            bw = P.B5,
            q = bwToQ(f, bw);
          scheduleFilter(N.r5CascFilter, "bandpass", f, q); // Was "peaking"
          scheduleFilter(N.r5ParFilter, "bandpass", f, q); // Was "peaking"
          break;
        }
        case "F6":
        case "B6": {
          const f = P.F6,
            bw = P.B6,
            q = bwToQ(f, bw);
          scheduleFilter(N.r6CascFilter, "bandpass", f, q); // Was "peaking"
          scheduleFilter(N.r6ParFilter, "bandpass", f, q); // Was "peaking"
          break;
        }

        case "AN":
          this._debugLog(`  Scheduling Parallel Gain AN: ${value} dB`); // ADD LOG
          scheduleGain(N.anParGain, value);
          break;
        case "A1":
          this._debugLog(`  Scheduling Parallel Gain A1: ${value} dB`); // ADD LOG
          scheduleGain(N.a1ParGain, value);
          break;
        case "A2":
          this._debugLog(`  Scheduling Parallel Gain A2: ${value} dB`); // ADD LOG
          scheduleGain(N.a2ParGain, value);
          break;
        case "A3":
          this._debugLog(`  Scheduling Parallel Gain A3: ${value} dB`); // ADD LOG
          scheduleGain(N.a3ParGain, value);
          break;
        case "A4":
          this._debugLog(`  Scheduling Parallel Gain A4: ${value} dB`); // ADD LOG
          scheduleGain(N.a4ParGain, value);
          break;
        case "A5":
          this._debugLog(`  Scheduling Parallel Gain A5: ${value} dB`); // ADD LOG
          scheduleGain(N.a5ParGain, value);
          break;
        case "A6":
          this._debugLog(`  Scheduling Parallel Gain A6: ${value} dB`); // ADD LOG
          scheduleGain(N.a6ParGain, value);
          // console.log(`Check: N.parallelSum.gain.value = ${N.parallelSum.gain.value}`);
          break;
        case "AB":
          this._debugLog(`  Scheduling Parallel Gain AB: ${value} dB`); // ADD LOG
          scheduleGain(N.abParGain, value);
          // console.log(`Check: N.parallelSum.gain.value = ${N.parallelSum.gain.value}`);
          break;
        case "GO":
          this._debugLog(`  Scheduling Output Gain (GO): ${value} dB`);
          scheduleGain(N.outputGain, value);
          break;

        case "NFC":
          this._debugLog(`  Setting NFC: ${value} (SW=${P.SW})`);
          if (P.SW === 0 && oldValue !== value) {
            this._debugLog(`    NFC changed with SW=0, triggering reconnect.`);
            this._reconnectGraph();
          }
          break;
        case "SW":
          this._debugLog(`  Setting SW: ${value}`);
          if (oldValue !== value) {
            this._debugLog(`    SW changed, triggering reconnect.`);
            this._reconnectGraph();
          }
          break;
        // Ignore SR - cannot change dynamically
        case "SR":
          this._debugLog(`  Ignoring SR update.`);
          break;
        default:
          // console.warn(`[KlattSynth] Parameter ${name} not explicitly handled in setParam switch.`);
          break;
      }
    } catch (error) {
      console.error(
        `[KlattSynth] Error setting parameter ${name} to ${value}:`,
        error
      );
    }
  }

  _reconnectGraph() {
    this._debugLog(
      `Reconnecting graph (SW=${this.params.SW}, NFC=${this.params.NFC})...`
    );
    // console.log("Reconnecting graph..."); // Alternative log
    this._disconnectAll();
    this._currentConnections = null; // Reset connection state before reconnecting

    // *** ADDED: Verify Summing Node Gains BEFORE Connecting ***
    this._debugLog(
      `Gains before connect: LaryngealSum=${this.nodes.laryngealSourceSum?.gain.value?.toFixed(2)}, ParallelSum=${this.nodes.parallelSum?.gain.value?.toFixed(2)}, FinalSum=${this.nodes.finalSum?.gain.value?.toFixed(2)}, ParallelInputMix=${this.nodes.parallelInputMix?.gain.value?.toFixed(2)}`
    );
    // *** END ADDED ***

    if (this.params.SW === 0) {
      this._connectCascadeParallel();
    } else {
      this._connectAllParallel();
    }
    if (this.isRunning) {
      try {
        this.nodes.outputGain.connect(this.ctx.destination);
        this._debugLog("Reconnected output gain to destination.");
      } catch (e) {
        console.error("[KlattSynth] Error reconnecting output gain:", e);
      }
    }
    this._debugLog("Graph reconnection finished.");
  }

  _disconnectAll() {
    this._debugLog("Disconnecting all nodes...");
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
    this._debugLog("Finished disconnecting nodes.");
  }

  _connectCascadeParallel() {
    if (this._currentConnections === "cascade") {
      this._debugLog("Skipping connection: Already in Cascade/Parallel state.");
      return;
    }
    this._debugLog("Connecting Cascade/Parallel Graph (SW=0)...");
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

      // *** ADDED: Connect Laryngeal Source to Parallel Input Mixer as well ***
      N.laryngealSourceSum.connect(N.parallelInputMix);
      this._debugLog("    Connected laryngealSourceSum to parallelInputMix.");
      // *** END ADDED ***

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
      this._debugLog("Cascade/Parallel graph connected successfully.");
    } catch (error) {
      console.error(
        "[KlattSynth] Error during _connectCascadeParallel:",
        error
      );
      this._currentConnections = null; // Mark as uncertain state
    }
  }

  _connectAllParallel() {
    if (this._currentConnections === "parallel") {
      this._debugLog("Skipping connection: Already in All-Parallel state.");
      return;
    }
    this._debugLog("Connecting All-Parallel Graph (SW=1)...");
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
        // R2-R6 with preemphasis
        if (
          !this.parallelFilters[i] ||
          !this.parallelGains[i] ||
          !this.parallelDiffFilters[i]
        )
          continue; // Safety check
        N.parallelInputMix
          .connect(this.parallelDiffFilters[i]) // Insert differentiator
          .connect(this.parallelFilters[i])
          .connect(this.parallelGains[i])
          .connect(N.parallelSum);
      }
      N.parallelInputMix.connect(N.abParGain).connect(N.parallelSum); // Bypass path (no preemphasis)

      // Final Stage
      N.parallelSum.connect(N.radiation).connect(N.outputGain);
      this._currentConnections = "parallel";
      this._debugLog("All-Parallel graph connected successfully.");
    } catch (error) {
      console.error("[KlattSynth] Error during _connectAllParallel:", error);
      this._currentConnections = null; // Mark as uncertain state
    }
  }

  start() {
    this._debugLog("start() called.");
    if (!this.isInitialized) {
      console.error("[KlattSynth] Cannot start: Not initialized.");
      return;
    }
    if (!this.isRunning) {
      this._debugLog("Synth is not running, attempting to start...");
      try {
        this._reconnectGraph(); // Ensure connections are up-to-date
        if (this._currentConnections !== null) {
          // Only connect if graph setup succeeded

          // *** ADDED: Verify Summing Node Gains BEFORE Connecting Output ***
          this._debugLog(
            `Gains before connecting output: LaryngealSum=${this.nodes.laryngealSourceSum?.gain.value?.toFixed(2)}, ParallelSum=${this.nodes.parallelSum?.gain.value?.toFixed(2)}, FinalSum=${this.nodes.finalSum?.gain.value?.toFixed(2)}, ParallelInputMix=${this.nodes.parallelInputMix?.gain.value?.toFixed(2)}`
          );
          // *** END ADDED ***

          this._debugLog("Connecting outputGain to destination.");
          this.nodes.outputGain.connect(this.ctx.destination);
          if (this.ctx.state === "suspended") {
            this._debugLog("AudioContext is suspended, resuming...");
            this.ctx.resume(); // No need to await here
          }
          this.isRunning = true;
          this._debugLog("KlattSynth Started successfully.");
          console.log("KlattSynth Started"); // Keep top-level log
        } else {
          console.error(
            "[KlattSynth] Cannot start synth, graph connection failed previously or is in unknown state."
          );
        }
      } catch (error) {
        console.error("[KlattSynth] Error starting synth:", error);
      }
    } else {
      this._debugLog("Synth is already running.");
    }
  }

  stop() {
    this._debugLog("stop() called.");
    if (this.isRunning) {
      this._debugLog("Synth is running, attempting to stop...");
      const T = this.ctx.currentTime;
      const RAMP_DOWN_TIME = 0.01; // 10ms ramp down
      const SILENCE_DB = -70.0; // Target dB for silence

      this._debugLog(`Ramping down gains to ${SILENCE_DB}dB over ${RAMP_DOWN_TIME}s...`);

      // Schedule ramps to silence for source amplitudes and parallel gains
      // Use applyImmediately=false to use the default ramp
      this.setParam("AV", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("AF", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("AH", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("AVS", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("AN", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("A1", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("A2", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("A3", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("A4", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("A5", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("A6", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      this.setParam("AB", SILENCE_DB, T + RAMP_DOWN_TIME, false);
      // Optionally ramp down F0 as well, though worklet should handle amp=0
      // this.setParam('F0', 0, T + RAMP_DOWN_TIME, false);

      // Disconnect output immediately (ramps continue in background)
      try {
        this._debugLog("Disconnecting outputGain from destination.");
        this.nodes.outputGain.disconnect(this.ctx.destination);
      } catch (e) {
        this._debugLog("Error disconnecting outputGain:", e);
      }

      // Cancel any *other* scheduled values beyond the ramp-down time
      // Note: cancelScheduledValues currently holds the *last* value,
      // which might conflict slightly with the ramp-down.
      // A more sophisticated cancel might be needed, but let's try this first.
      // We could cancel *before* scheduling the ramp down, but that might cause a pop.
      // Let's cancel *after* scheduling the ramp down, cancelling from T + RAMP_DOWN_TIME.
      // Modify cancelScheduledValues to accept a time argument.

      // *** Let's simplify: Just disconnect and set flag for now. ***
      // *** The ramps should ensure silence even if later schedules exist ***
      // this.cancelScheduledValues(T + RAMP_DOWN_TIME); // Requires modifying cancelScheduledValues

      this.isRunning = false;
      this._debugLog("KlattSynth Stop sequence initiated (gain ramps scheduled, output disconnected).");
      console.log("KlattSynth Stopped"); // Keep top-level log
    } else {
      this._debugLog("Synth is not running, stop() has no effect.");
    }
  }

  cancelScheduledValues() {
    if (!this.isInitialized || !this.ctx) {
      this._debugLog(
        "Cannot cancel schedules: Synth not initialized or context missing."
      );
      return;
    }
    const T = this.ctx.currentTime;
    this._debugLog(
      `Cancelling scheduled parameter values from time ${T.toFixed(3)}...`
    );
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
        console.warn("[KlattSynth] Error cancelling schedule for node:", e);
      }
    });
    this._debugLog("Finished cancelling schedules.");
  }

  setTrack(track) {
    this._debugLog("setTrack() called.");
    if (!this.isInitialized || !track) {
      console.warn(
        "[KlattSynth] Set track called before init or track is null/empty."
      );
      return;
    }
    this._debugLog(`Setting track with ${track.length} events.`);
    const startTime = this.ctx.currentTime;
    this.cancelScheduledValues(); // Cancel previous before setting new

    // Find the parameters intended for time 0 (or the first event time)
    const firstEventTime = track[0]?.time || 0;
    const initialState =
      track.find((e) => e.time === firstEventTime)?.params ||
      this._getDefaultParams(); // Get defaults if first event has no params

    this._debugLog(`Resetting params to defaults at ${startTime.toFixed(3)}.`);
    // Reset all parameters to their defaults *at the start time*
    this._applyAllParams(startTime); // This already logs internally

    this._debugLog(
      `Applying initial track state immediately at ${startTime.toFixed(3)}.`
    );
    // Immediately set the initial state of the track *at the start time*
    Object.keys(initialState).forEach((pName) => {
      if (
        typeof initialState[pName] === "number" &&
        isFinite(initialState[pName])
      ) {
        // setParam logs internally
        this.setParam(pName, initialState[pName], startTime, true); // Use setValueAtTime
      } else {
        this._debugLog(
          `  Skipping initial param ${pName}: invalid value ${initialState[pName]}`
        );
      }
    });

    this._debugLog("Scheduling subsequent track events...");
    // Schedule the rest of the track events using ramps
    track.forEach((event) => {
      // Skip events at or before the initial time we already set
      if (event.time <= firstEventTime) {
        this._debugLog(
          `  Skipping event at time ${event.time.toFixed(
            3
          )} (already applied initial state).`
        );
        return;
      }

      const eventTime = startTime + event.time; // Schedule relative to current time
      this._debugLog(
        `  Processing event at time ${event.time.toFixed(
          3
        )} -> schedule time ${eventTime.toFixed(3)}`
      );
      if (event.params) {
        Object.keys(event.params).forEach((pName) => {
          const value = event.params[pName];
          if (typeof value === "number" && isFinite(value)) {
            this.setParam(pName, value, eventTime, false); // Use linearRamp
          } else {
            this._debugLog(
              `    Skipping param ${pName}: invalid value ${value}`
            );
          }
        });
      } else {
        this._debugLog(
          `    Event at ${event.time.toFixed(3)}s is missing 'params' object.`
        );
      }
    });
    this._debugLog("Track scheduling finished.");
    console.log("Track scheduled."); // Keep top-level log
  }
}
