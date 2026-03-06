// test/harness/telemetry.js — Telemetry handling, meters, spike tracking

import { state } from "./state.js";
import { updateDiagnostics, getRunContext, findEventAtTime, findEventIndexAtTime } from "./diagnostics.js";

export function handleTelemetry(data) {
  // Handle PLSTEP burst events specially
  if (data?.type === 'plstep') {
    // P1: Calculate proper scheduled relative time using runStartTime
    // data.time is the absolute scheduled time from the interpreter
    // Proper relative time = scheduled time - session start time
    const scheduledRelTime = Number.isFinite(data.time) && state.runStartTime > 0
      ? data.time - state.runStartTime
      : null;
    const { relTime, event, inWindow, trackEnd } = getRunContext();
    // P1: Session isolation - only accept events with valid timing
    // Allow events during window OR if we're just starting (cold start)
    if (inWindow || !state.lastRun) {
      state.plstepTotalCount += 1;
      state.plstepEvents.push({
        time: data.time, // Keep absolute time for debugging
        relTime, // Current ctx.currentTime relative to start
        scheduledRelTime, // P1: Proper scheduled time relative to start
        amplitudeLinear: data.amplitudeLinear,
        amplitudeDb: data.amplitudeDb,
        trigger: data.trigger,
        delta: data.delta,
        phoneme: event?.phoneme ?? '',
        sessionId: state.lastRun?.sessionId ?? state.sessionId, // P1: Track session
      });
      // Keep only last 50 PLSTEP events
      if (state.plstepEvents.length > 50) state.plstepEvents.shift();
      updateDiagnostics();
    }
    return;
  }
  // Handle explosion reports from antiresonator instrumentation
  if (data?.type === 'explosion') {
    console.error(`[EXPLOSION REPORT] node=${data.node} outRms=${data.outRms?.toFixed(1)} inRms=${data.inRms?.toFixed(4)} freq=${data.freq} bw=${data.bw} gain=${data.gain} bypassAtZero=${data.bypassAtZero} sampleRate=${data.sampleRate}`);
    return;
  }
  if (!data?.node) return;
  const { relTime, event, inWindow } = getRunContext();
  state.telemetry.set(data.node, {
    rms: data.rms,
    peak: data.peak,
    f0: data.f0,
    rd: data.rd,
    lfMode: data.lfMode,
    freq: data.freq,
    bw: data.bw,
    gain: data.gain,
    inRms: data.inRms,
    inPeak: data.inPeak,
    cutoff: data.cutoff,
    gainAvg: data.gainAvg,
    gainPeak: data.gainPeak,
    time: relTime,
    phoneme: event?.phoneme ?? "",
  });
  const prev = state.telemetryMax.get(data.node) || { rms: 0, peak: 0 };
  const nextMax = { ...prev };
  if (
    inWindow &&
    Number.isFinite(data.rms) &&
    data.rms > (prev.rms ?? 0)
  ) {
    nextMax.rms = data.rms;
    nextMax.rmsTime = relTime;
    nextMax.rmsPhoneme = event?.phoneme ?? "";
  }
  if (
    inWindow &&
    Number.isFinite(data.peak) &&
    data.peak > (prev.peak ?? 0)
  ) {
    nextMax.peak = data.peak;
    nextMax.peakTime = relTime;
    nextMax.peakPhoneme = event?.phoneme ?? "";
  }
  if (inWindow && Number.isFinite(data.freq)) {
    if (!Number.isFinite(nextMax.freqMin) || data.freq < nextMax.freqMin) {
      nextMax.freqMin = data.freq;
    }
    if (!Number.isFinite(nextMax.freqMax) || data.freq > nextMax.freqMax) {
      nextMax.freqMax = data.freq;
    }
  }
  if (inWindow && Number.isFinite(data.bw)) {
    if (!Number.isFinite(nextMax.bwMin) || data.bw < nextMax.bwMin) {
      nextMax.bwMin = data.bw;
    }
    if (!Number.isFinite(nextMax.bwMax) || data.bw > nextMax.bwMax) {
      nextMax.bwMax = data.bw;
    }
  }
  state.telemetryMax.set(data.node, nextMax);
  if (!state.lastRun) return;
  if (state.telemetryTimer) return;
  state.telemetryTimer = setTimeout(() => {
    state.telemetryTimer = null;
    updateDiagnostics();
  }, 250);
}

// Attach telemetry port listeners to new runtime worklet nodes
export function attachTelemetryNewRuntime(runtime) {
  const nodeIds = runtime.getAllNodeIds();
  let attached = 0;
  for (const nodeId of nodeIds) {
    const node = runtime.getNode(nodeId);
    // Check if it's an AudioWorkletNode with a port
    if (!node || !('port' in node) || !node.port) continue;

    node.port.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      // Add node identifier for diagnostics display
      if (data.type === 'metrics' && !data.node) {
        data.node = nodeId;
      }
      handleTelemetry(data);
    });

    // Ensure port is started
    if (typeof node.port.start === "function") {
      try {
        node.port.start();
      } catch {
        // Port may already be started
      }
    }
    attached++;
  }
  console.log(`[QLATT] Attached telemetry to ${attached} new runtime nodes`);
}

// Attach meters to new runtime output nodes
export function attachMetersNewRuntime(runtime) {
  if (!runtime) return;
  if (
    state.meterBindingMode === "new" &&
    state.meterBindingOwner === runtime &&
    state.meters.size > 0
  ) {
    return;
  }

  state.meters.clear();
  state.meterBindingMode = "new";
  state.meterBindingOwner = runtime;

  // Map from legacy meter names to new graph node IDs
  const outputTargets = [
    { name: "cascade-out", nodeIds: ["cascadeOutGain"] },
    { name: "parallel-out", nodeIds: ["parallelSum"] },
    { name: "pre-output-lp", nodeIds: ["outputSum"] },
    { name: "post-output-lp", nodeIds: ["outputLp", "masterGain", "outputGain"] },
  ];

  for (const target of outputTargets) {
    const nodeId = target.nodeIds.find((candidate) => runtime.getNode(candidate));
    const node = nodeId ? runtime.getNode(nodeId) : null;
    if (!node) {
      console.warn(`[QLATT] Meter nodes ${target.nodeIds.join(", ")} not found`);
      continue;
    }

    const analyser = state.ctx.createAnalyser();
    analyser.fftSize = 2048;
    try {
      node.connect(analyser);
      state.meters.set(target.name, analyser);
      console.log(`[QLATT] Attached meter to ${nodeId} as ${target.name}`);
    } catch (e) {
      console.warn(`[QLATT] Failed to attach meter to ${nodeId}:`, e);
    }
  }

  // Start meter loop if not already running
  startMeterLoop();
}

export function startMeterLoop() {
  if (state.meterTimer) return;
  state.meterTimer = setInterval(() => {
    const { relTime, event, inWindow } = getRunContext();
    for (const [name, analyser] of state.meters.entries()) {
      const data = readMeter(analyser);
      state.meterValues.set(name, {
        ...data,
        time: relTime,
        phoneme: event?.phoneme ?? "",
      });
      const prev = state.meterMax.get(name) || { rms: 0, peak: 0 };
      const nextMax = { ...prev };
      if (
        inWindow &&
        Number.isFinite(data.rms) &&
        data.rms > (prev.rms ?? 0)
      ) {
        nextMax.rms = data.rms;
        nextMax.rmsTime = relTime;
        nextMax.rmsPhoneme = event?.phoneme ?? "";
      }
      if (
        inWindow &&
        Number.isFinite(data.peak) &&
        data.peak > (prev.peak ?? 0)
      ) {
        nextMax.peak = data.peak;
        nextMax.peakTime = relTime;
        nextMax.peakPhoneme = event?.phoneme ?? "";
      }
      state.meterMax.set(name, nextMax);
      recordSpike(name, data);
      recordSwWindowMax(name, data, relTime, event);
    }
    updateDiagnostics();
  }, 20);
}

export function recordSwWindowMax(name, data, relTime, event) {
  if (!state.lastRun || !state.runStartTime || !data || !Number.isFinite(data.rms)) return;
  const sw = event?.params?.SW;
  if (sw !== 0 && sw !== 1) return;
  if (!Number.isFinite(relTime)) return;
  const trackEnd = state.lastRun.track?.length
    ? state.lastRun.track[state.lastRun.track.length - 1].time
    : 0;
  if (relTime < -0.1 || relTime > trackEnd + 0.5) return;
  const eventIndex = findEventIndexAtTime(state.lastRun.track, Math.max(0, relTime));
  if (eventIndex < 0) return;
  const current = state.lastRun.track[eventIndex];
  const nextEvent = state.lastRun.track[eventIndex + 1];
  const guard = 0.05; // Avoid analyzer window bleed across SW boundaries.
  const eventStart = current?.time ?? 0;
  const eventEnd = nextEvent?.time ?? (eventStart + 0.5);
  if (relTime < eventStart + guard || relTime > eventEnd - guard) return;

  const key = `${name}:SW=${sw}`;
  const prev = state.swWindowMax.get(key) || { rms: 0, peak: 0 };
  const nextMax = { ...prev };
  if (data.rms > (prev.rms ?? 0)) {
    nextMax.rms = data.rms;
    nextMax.rmsTime = relTime;
    nextMax.rmsPhoneme = event?.phoneme ?? "";
  }
  if (data.peak > (prev.peak ?? 0)) {
    nextMax.peak = data.peak;
    nextMax.peakTime = relTime;
    nextMax.peakPhoneme = event?.phoneme ?? "";
  }
  state.swWindowMax.set(key, nextMax);
}

export function recordSpike(name, data) {
  if (!state.lastRun || !state.runStartTime || !data || !Number.isFinite(data.peak)) return;
  if (data.peak <= state.spikeThreshold) return;
  const now = state.ctx.currentTime;
  const lastAt = state.lastSpikeAt.get(name) ?? -Infinity;
  if (now - lastAt < state.spikeCooldown) return;
  const relTime = now - state.runStartTime;
  const trackEnd = state.lastRun.track?.length
    ? state.lastRun.track[state.lastRun.track.length - 1].time
    : 0;
  if (relTime < -0.1 || relTime > trackEnd + 0.5) return;
  state.lastSpikeAt.set(name, now);
  const event = findEventAtTime(state.lastRun.track, relTime);
  state.spikeEvents.push({
    time: Math.max(0, relTime),
    node: name,
    peak: data.peak,
    phoneme: event?.phoneme ?? "",
  });
  if (state.spikeEvents.length > 6) state.spikeEvents.shift();
}

export function readMeter(analyser) {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const v = buffer[i];
    sum += v * v;
    const av = Math.abs(v);
    if (av > peak) peak = av;
  }
  const rms = Math.sqrt(sum / buffer.length);
  return { rms, peak };
}
